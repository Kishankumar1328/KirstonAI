from app.services.tts_service import TTSService

def test_tts_service_synthesis():
    result = TTSService.synthesize_speech(
        text="Hello world, this is NVIDIA Nemotron Speech TTS.",
        voice="nemotron-v1",
        provider="gtts"
    )
    assert result is not None
    assert result["text"] == "Hello world, this is NVIDIA Nemotron Speech TTS."
    assert result["size_bytes"] > 0
    assert result["content_type"] == "audio/mpeg"
    assert len(result["audio_bytes"]) > 44  # Audio samples present
