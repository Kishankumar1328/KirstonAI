import concurrent.futures
import pytest
from unittest.mock import patch, MagicMock
import httpx
from app.core.config import settings

def test_valid_tts_request(client):
    """Test valid POST /api/v1/tts request returns 200 OK and audio/mpeg stream."""
    payload = {
        "text": "Hello, this is KirstonAI. This is a test of the text-to-speech system.",
        "message_id": "test-msg-001",
        "voice": "default"
    }
    response = client.post("/api/v1/tts", json=payload)
    assert response.status_code == 200
    assert response.headers["content-type"] in ["audio/mpeg", "audio/wav", "audio/mp3"]
    assert len(response.content) > 0
    assert int(response.headers.get("X-Audio-Size-Bytes", 0)) > 0

def test_empty_text_rejection(client):
    """Test empty text or whitespace text returns 400 Bad Request."""
    res1 = client.post("/api/v1/tts", json={"text": "", "message_id": "msg-1"})
    assert res1.status_code == 400
    assert "cannot be empty" in res1.text.lower() or "validation" in res1.text.lower()

    res2 = client.post("/api/v1/tts", json={"text": "   \n\t  ", "message_id": "msg-2"})
    assert res2.status_code == 400
    assert "cannot be empty" in res2.text.lower() or "validation" in res2.text.lower()

def test_excessively_long_text(client):
    """Test text exceeding MAX_LENGTH returns 400 Bad Request."""
    long_text = "a" * 4500
    res = client.post("/api/v1/tts", json={"text": long_text, "message_id": "msg-long"})
    assert res.status_code == 400
    assert "exceeds maximum" in res.text.lower() or "400" in str(res.status_code)

def test_missing_api_credentials(client, monkeypatch):
    """Test configuring OpenAI provider without OPENAI_API_KEY reports missing env var."""
    monkeypatch.setattr(settings, "TTS_PROVIDER", "openai")
    monkeypatch.setattr(settings, "OPENAI_API_KEY", "")

    payload = {
        "text": "Testing missing credentials error",
        "message_id": "msg-missing-key",
        "provider": "openai"
    }
    res = client.post("/api/v1/tts", json=payload)
    assert res.status_code == 400
    assert "OPENAI_API_KEY" in res.text

def test_tts_provider_failure_handling(client):
    """Test provider exception returns 500/502/504 error response."""
    def mock_synthesize(*args, **kwargs):
        raise RuntimeError("TTS provider request timed out after 30 seconds.")

    with patch("app.api.tts.TTSService.synthesize_speech", side_effect=mock_synthesize):
        payload = {
            "text": "Testing provider timeout failure",
            "message_id": "msg-timeout",
            "provider": "openai"
        }
        res = client.post("/api/v1/tts", json=payload)
        assert res.status_code in [500, 502, 504]
        assert "timed out" in res.text.lower()

def test_invalid_payload_format(client):
    """Test invalid JSON payload format returns 400 or 422 error status."""
    res = client.post("/api/v1/tts", json={"invalid_field": 123})
    assert res.status_code in [400, 422]

def test_concurrent_tts_requests(client):
    """Test handling multiple concurrent TTS requests."""
    def send_req(i):
        payload = {
            "text": f"Concurrent test request number {i}",
            "message_id": f"concurrent-msg-{i}",
            "voice": "default"
        }
        return client.post("/api/v1/tts", json=payload)

    with concurrent.futures.ThreadPoolExecutor(max_workers=3) as executor:
        futures = [executor.submit(send_req, i) for i in range(3)]
        results = [f.result() for f in futures]

    for res in results:
        assert res.status_code == 200
        assert len(res.content) > 0
