from typing import Dict, Any, List
from app.agents.state import AgentState
from app.ai.prompts import SYSTEM_PROMPT
from app.rag.retriever import retrieve_rag_context
from app.utils.logging import logger

def validate_input_node(state: AgentState) -> Dict[str, Any]:
    """Validates user message and thread requirements."""
    if not state.get("input_message") or not state["input_message"].strip():
        return {"status": "error", "error": "Message input cannot be empty."}
    return {"status": "validated"}

def query_orchestration_node(state: AgentState) -> Dict[str, Any]:
    """
    LangGraph Query Orchestrator node.
    Routes queries to: direct_chat | rag | code_engineer | debugging | tool | multimodal
    """
    msg = (state.get("input_message") or "").lower()
    model = (state.get("model") or "").lower()

    # 1. Multimodal / Media check
    if any(k in model for k in ["flux", "vision", "image", "tts", "speech"]) or \
       any(k in msg for k in ["image", "picture", "photo", "audio", "video", "tts", "speech", "read aloud", "draw", "generate image"]):
        route = "multimodal"
        intent = "Multimodal analysis or media synthesis"

    # 2. Debugging check
    elif any(k in msg for k in ["error", "exception", "bug", "traceback", "fix", "failed", "typeerror", "syntaxerror", "issue"]):
        route = "debugging"
        intent = "Software debugging and error resolution"

    # 3. Code Engineer check
    elif any(k in msg for k in ["build", "create", "implement", "code", "function", "class", "endpoint", "system", "refactor", "api", "component"]):
        route = "code_engineer"
        intent = "Autonomous software engineering & code implementation"

    # 4. Tool check
    elif any(k in msg for k in ["calculate", "memory", "compute", "measure", "math", "convert", "benchmark"]):
        route = "tool"
        intent = "System tool computation and measurement"

    # 5. RAG check (document grounding)
    elif state.get("use_rag", True) and (
        any(k in msg for k in ["according to", "based on", "document", "pdf", "file", "architecture", "rag", "knowledge", "reference"])
    ):
        route = "rag"
        intent = "Knowledge-grounded document retrieval (RAG)"

    # 6. Default to Direct Chat
    else:
        route = "direct_chat"
        intent = "Direct conversational AI explanation"

    logger.info(f"[Query Orchestrator] Route assigned: '{route}' (intent: {intent})")
    return {"route": route, "intent": intent}

async def rag_retriever_node(state: AgentState) -> Dict[str, Any]:
    """Asynchronously retrieves high-relevance document context for RAG or grounded queries."""
    route = state.get("route", "direct_chat")
    use_rag = state.get("use_rag", True)

    # Only perform RAG retrieval if route is RAG, code_engineer, or debugging with RAG enabled
    if route not in ["rag", "code_engineer", "debugging"] or not use_rag:
        return {"context": []}

    user_id = state["user_id"]
    sources = await retrieve_rag_context(user_id=user_id, query=state["input_message"], top_k=3)
    logger.info(f"RAG retrieved {len(sources)} relevant sources for user '{user_id}' query (route={route})")
    return {"context": sources}

def prepare_prompt_node(state: AgentState) -> Dict[str, Any]:
    """Assembles grounded system prompt, RAG context snippets, and conversation history."""
    sys_prompt = SYSTEM_PROMPT
    route = state.get("route", "direct_chat")
    intent = state.get("intent", "Direct Chat")

    sys_prompt += f"\n\n--- AGENT ROUTE ASSIGNMENT ---\nActive Agent Route: {route.upper()}\nTask Intent: {intent}\n"

    context = state.get("context", [])
    if context:
        context_str = "\n\n".join(
            f"[Source {i+1}: {doc['filename']}]\n{doc['snippet'][:450]}"
            for i, doc in enumerate(context)
        )
        sys_prompt += (
            f"\n--- RETRIEVED DOCUMENT GROUNDING CONTEXT ---\n"
            f"{context_str}\n"
            f"----------------------------------------------\n"
            f"INSTRUCTION: Answer the query accurately using facts strictly grounded in the retrieved document sources above. Cite sources where appropriate."
        )

    formatted_messages: List[Dict[str, str]] = [{"role": "system", "content": sys_prompt}]

    history = state.get("history", [])
    for msg in history[-8:]:
        formatted_messages.append({
            "role": msg["role"],
            "content": msg["content"]
        })

    formatted_messages.append({
        "role": "user",
        "content": state["input_message"]
    })

    return {
        "system_prompt": sys_prompt,
        "formatted_messages": formatted_messages
    }
