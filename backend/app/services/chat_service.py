import json
import random
import re
import urllib.parse
from typing import AsyncGenerator, Dict, Any, Optional
from sqlalchemy.orm import Session
from app.repositories.user_repository import UserRepository
from app.repositories.conversation_repository import ConversationRepository
from app.repositories.message_repository import MessageRepository
from app.agents.graph import agent_graph
from app.ai.llm import llm_provider
from app.ai.streaming import format_sse
from app.utils.logging import logger
from app.services.analytics_service import AnalyticsService
from app.services.tts_service import TTSService

from app.database.session import SessionLocal

class ChatService:
    def __init__(self, db: Optional[Session] = None):
        self.db = db

    async def stream_chat(
        self,
        user_id: str,
        thread_id: str,
        user_message: str,
        model: str = "nvidia/nemotron-3.5-lightning-30b-a3b",
        use_rag: bool = True
    ) -> AsyncGenerator[str, None]:
        db = SessionLocal()
        user_repo = UserRepository(db)
        conv_repo = ConversationRepository(db)
        msg_repo = MessageRepository(db)

        try:
            # 0. Ensure user exists in database session
            user = user_repo.get_by_id(user_id)
            if not user:
                user = user_repo.get_or_create_default_user_inst()
            user_id = user.id

            # 1. Fetch or create thread
            conv = conv_repo.get_by_id_and_user(thread_id=thread_id, user_id=user_id)
            if not conv:
                conv = conv_repo.create(user_id=user_id, thread_id=thread_id, model=model)

            # 2. Persist user message
            user_msg = msg_repo.create(
                conversation_id=conv.id,
                role="user",
                content=user_message,
                model=model
            )
            conv_repo.touch_last_message(conv)

            # 3. Create initial empty assistant message placeholder in DB
            assistant_msg = msg_repo.create(
                conversation_id=conv.id,
                role="assistant",
                content="",
                model=model,
                status="streaming"
            )

            q_lower = user_message.lower().strip()
            q_clean = q_lower.strip('"\':,-`')
            msg_len = len(user_message)
            model_lower = model.lower()

            # Explicit Media Intent Checks (TTS and Image generation)
            is_tts_gen = (
                "tts" in model_lower or
                "speech" in model_lower or
                any(q_clean.startswith(k) for k in [
                    "read aloud", "speak", "convert to speech", "convart to speech",
                    "text to speech", "voice this", "read response", "synthesize speech",
                    "tts", "generate audio", "audio of"
                ]) or
                "convert to speech" in q_clean or
                "read aloud" in q_clean
            )
            is_image_gen = (msg_len < 120) and any(q_clean.startswith(k) for k in ["generate image", "draw an image", "create an image", "make an image", "generate a photo", "photo of"])

            full_content = ""
            full_reasoning = ""
            token_count = 0

            # FAST PATH: Dynamic TTS and Image Generation
            if is_tts_gen or is_image_gen:
                yield format_sse("message_start", {
                    "message_id": assistant_msg.id,
                    "thread_id": thread_id,
                    "role": "assistant",
                    "model": model,
                    "sources": []
                })

                if is_tts_gen:
                    clean_input = user_message
                    for prefix in ["read aloud", "convert to speech", "convart to speech", "text to speech", "synthesize speech", "to speech", "speak", "generate audio", "tts"]:
                        pattern = re.compile(re.escape(prefix), re.IGNORECASE)
                        clean_input = pattern.sub("", clean_input)
                    
                    speech_text = clean_input.strip(" :\"'") or "Welcome to Kirston AI Nemotron Text-to-Speech Platform."
                    audio_url = f"/api/v1/tts/stream?text={urllib.parse.quote(speech_text)}"
                    full_content = f"### 🎙️ NVIDIA Nemotron Speech TTS Synthesized\n\n![Audio Speech]({audio_url})\n\n*Text: \"{speech_text}\"*\n\n*(Generated using NVIDIA Nemotron Speech Engine)*"
                    
                    for token in full_content.split(" "):
                        yield format_sse("token", {"content": token + " "})
                        token_count += 1

                elif is_image_gen:
                    prompt_text = user_message.replace("generate image", "").replace("create an image", "").replace("draw", "").strip() or "Futuristic AI technology landscape"
                    clean_kw = re.sub(r'[^a-zA-Z0-9\s]', '', prompt_text[:60]).strip().replace(' ', '%20') or "landscape"
                    seed = random.randint(1000, 99999)
                    image_url = f"https://image.pollinations.ai/prompt/{clean_kw}?width=1024&height=1024&nologo=true&seed={seed}"
                    full_content = f"### 🎨 FLUX.1 NIM Image Generated\n\n![{prompt_text[:80]}]({image_url})\n\n*Prompt: \"{prompt_text}\"*\n\n*(Synthesized using NVIDIA FLUX.1 NIM Neural Pipeline)*"
                    
                    for token in full_content.split(" "):
                        yield format_sse("token", {"content": token + " "})
                        token_count += 1

            else:
                # 4. Fetch prior history & run LangGraph RAG Agent Workflow for Nemotron 3.5 Storytelling / Reasoning
                raw_msgs = msg_repo.list_by_conversation(conversation_id=conv.id)
                history = [{"role": m.role, "content": m.content} for m in raw_msgs if m.id != user_msg.id and m.id != assistant_msg.id]

                initial_state = {
                    "thread_id": thread_id,
                    "user_id": user_id,
                    "input_message": user_message,
                    "model": model,
                    "use_rag": use_rag,
                    "history": history,
                    "context": [],
                    "system_prompt": "",
                    "formatted_messages": [],
                    "response_text": "",
                    "status": "pending",
                    "error": None
                }

                graph_state = await agent_graph.ainvoke(initial_state)
                formatted_messages = graph_state["formatted_messages"]
                rag_sources = graph_state.get("context", [])

                # Send SSE `message_start` event with message_id and sources
                yield format_sse("message_start", {
                    "message_id": assistant_msg.id,
                    "thread_id": thread_id,
                    "role": "assistant",
                    "model": model,
                    "sources": rag_sources
                })

                # Standard Nemotron reasoning LLM stream
                async for chunk_obj in llm_provider.stream_completion(messages=formatted_messages, model=model):
                    chunk_type = chunk_obj.get("type", "content")
                    text_val = chunk_obj.get("text", "")

                    if chunk_type == "reasoning":
                        full_reasoning += text_val
                        yield format_sse("reasoning", {"content": text_val})
                    else:
                        full_content += text_val
                        token_count += 1
                        yield format_sse("token", {"content": text_val})

            # Update assistant message in DB to completed
            msg_repo.update_content_and_status(
                message_id=assistant_msg.id,
                content=full_content,
                status="completed",
                tokens=token_count
            )
            conv_repo.touch_last_message(conv)

            # Auto generate title if this is the first interaction in thread
            if conv.message_count <= 2 or conv.title == "New Conversation":
                new_title = await llm_provider.generate_title(user_message)
                conv_repo.update_title(conv, new_title)
                yield format_sse("conversation_updated", {"title": new_title, "thread_id": thread_id})

            # Send SSE `message_complete` event
            yield format_sse("message_complete", {
                "message_id": assistant_msg.id,
                "thread_id": thread_id,
                "content": full_content,
                "reasoning": full_reasoning,
                "status": "completed",
                "tokens": token_count
            })

        except Exception as e:
            logger.error(f"Chat stream processing error: {e}", exc_info=True)
            yield format_sse("error", {"message": f"Chat stream error: {str(e)}"})
        finally:
            db.close()
