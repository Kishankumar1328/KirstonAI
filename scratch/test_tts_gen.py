import sys
import os

# Add backend directory to sys.path
sys.path.append(os.path.join(os.path.dirname(__file__), "..", "backend"))

from app.services.tts_service import TTSService

def test_tts():
    print("=== TESTING NVIDIA NEMOTRON TTS SERVICE ===")
    test_text = "Welcome to Kirston AI. Converts text into natural sounding speech powered by NVIDIA Nemotron."
    
    res = TTSService.process_tts_request(text=test_text, voice="nemotron-v1", speed=1.0)
    
    assert res["content_type"] == "audio/wav", "Content type must be audio/wav"
    assert len(res["wav_bytes"]) > 1000, "WAV audio output should contain valid binary data"
    
    print(f"Text              : '{res['text']}'")
    print(f"Voice Profile     : {res['voice']}")
    print(f"Audio Size (bytes): {res['audio_size_bytes']}")
    print("\nSUCCESS! TTS Service generated valid speech WAV bytes.")

if __name__ == "__main__":
    test_tts()
