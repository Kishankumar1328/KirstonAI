import pytest
import json
from app.repositories.user_repository import UserRepository
from app.services.chat_service import ChatService

@pytest.mark.asyncio
async def test_chat_service_tts_stream(db):
    user_repo = UserRepository(db)
    user = user_repo.create(email="tts_test_user@antigravity.ai")
    
    service = ChatService(db)
    events = []
    
    async for sse_chunk in service.stream_chat(
        user_id=user.id,
        thread_id="test_thread_tts_unit_123",
        user_message="convert to speech: Hello world TTS",
        model="nvidia/nemotron-speech-v1"
    ):
        events.append(sse_chunk)
        
    full_output = "".join(events)
    assert "event: message_start" in full_output
    assert "event: token" in full_output
    assert "event: message_complete" in full_output
    assert "/api/v1/tts/stream?text=Hello%20world" in full_output
