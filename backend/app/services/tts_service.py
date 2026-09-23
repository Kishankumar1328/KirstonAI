import io
import time
from typing import Dict, Any, Optional
import httpx
from gtts import gTTS

from app.core.config import settings
from app.utils.logging import logger

class TTSService:
    """
    End-to-End Text-to-Speech service using real TTS model synthesis.
    Supports gTTS (default), OpenAI TTS, and ElevenLabs via backend configuration.
    """

    @staticmethod
    def synthesize_speech(
        text: str,
        message_id: Optional[str] = None,
        voice: Optional[str] = None,
        provider: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Synthesizes text into audio stream using configured TTS provider.
        """
        start_time = time.time()

        # 1. Input Validation
        if text is None or not text.strip():
            logger.warning(f"[TTS] Rejected empty text for message_id={message_id}")
            raise ValueError("Text parameter cannot be empty.")

        clean_text = text.strip()
        max_len = getattr(settings, "TTS_MAX_LENGTH", 4000)
        if len(clean_text) > max_len:
            logger.warning(f"[TTS] Text length ({len(clean_text)}) exceeds maximum limit ({max_len})")
            raise ValueError(f"Text length exceeds maximum limit of {max_len} characters.")

        selected_provider = (provider or getattr(settings, "TTS_PROVIDER", "gtts")).lower().strip()
        selected_voice = voice or getattr(settings, "TTS_VOICE", "default")
        timeout_sec = getattr(settings, "TTS_TIMEOUT_SECONDS", 30)

        logger.info(
            f"[TTS] Starting synthesis for message_id={message_id}, "
            f"provider={selected_provider}, voice={selected_voice}, length={len(clean_text)}"
        )

        audio_bytes: bytes = b""
        content_type: str = "audio/mpeg"

        # 2. Provider Routing & Synthesis
        if selected_provider in ["gtts", "default", "google"]:
            try:
                # gTTS generates real spoken audio (audio/mpeg)
                lang = "en"
                if selected_voice in ["es", "fr", "de", "hi", "ja", "zh-CN"]:
                    lang = selected_voice
                
                tts = gTTS(text=clean_text, lang=lang, slow=False)
                fp = io.BytesIO()
                tts.write_to_fp(fp)
                audio_bytes = fp.getvalue()
                content_type = "audio/mpeg"
            except Exception as e:
                logger.error(f"[TTS] gTTS synthesis error: {str(e)}", exc_info=True)
                raise RuntimeError(f"gTTS provider synthesis failed: {str(e)}")

        elif selected_provider == "openai":
            api_key = getattr(settings, "OPENAI_API_KEY", "").strip()
            if not api_key:
                logger.error("[TTS] Missing OPENAI_API_KEY for OpenAI provider")
                raise ValueError("OPENAI_API_KEY environment variable is missing for OpenAI TTS provider.")

            openai_voice = selected_voice if selected_voice in ["alloy", "echo", "fable", "onyx", "nova", "shimmer"] else "alloy"
            url = "https://api.openai.com/v1/audio/speech"
            headers = {
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            }
            payload = {
                "model": "tts-1",
                "input": clean_text,
                "voice": openai_voice,
            }

            try:
                with httpx.Client(timeout=timeout_sec) as client:
                    response = client.post(url, json=payload, headers=headers)
                    if response.status_code != 200:
                        logger.error(f"[TTS] OpenAI API returned error status {response.status_code}: {response.text}")
                        raise RuntimeError(f"OpenAI TTS API returned status {response.status_code}: {response.text}")
                    audio_bytes = response.content
                    content_type = response.headers.get("content-type", "audio/mpeg")
            except httpx.TimeoutException:
                logger.error(f"[TTS] OpenAI API request timed out after {timeout_sec}s")
                raise RuntimeError(f"TTS provider request timed out after {timeout_sec} seconds.")
            except Exception as e:
                logger.error(f"[TTS] OpenAI TTS request exception: {str(e)}", exc_info=True)
                raise RuntimeError(f"OpenAI TTS provider failed: {str(e)}")

        elif selected_provider == "elevenlabs":
            api_key = getattr(settings, "ELEVENLABS_API_KEY", "").strip()
            if not api_key:
                logger.error("[TTS] Missing ELEVENLABS_API_KEY for ElevenLabs provider")
                raise ValueError("ELEVENLABS_API_KEY environment variable is missing for ElevenLabs TTS provider.")

            voice_id = selected_voice if selected_voice != "default" else "21m00Tcm4TlvDq8ikWAM"
            url = f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}"
            headers = {
                "xi-api-key": api_key,
                "Content-Type": "application/json",
            }
            payload = {
                "text": clean_text,
                "model_id": "eleven_monolingual_v1",
            }

            try:
                with httpx.Client(timeout=timeout_sec) as client:
                    response = client.post(url, json=payload, headers=headers)
                    if response.status_code != 200:
                        logger.error(f"[TTS] ElevenLabs API error {response.status_code}: {response.text}")
                        raise RuntimeError(f"ElevenLabs TTS API error: {response.text}")
                    audio_bytes = response.content
                    content_type = response.headers.get("content-type", "audio/mpeg")
            except httpx.TimeoutException:
                logger.error(f"[TTS] ElevenLabs API request timed out after {timeout_sec}s")
                raise RuntimeError(f"TTS provider request timed out after {timeout_sec} seconds.")
            except Exception as e:
                logger.error(f"[TTS] ElevenLabs TTS exception: {str(e)}", exc_info=True)
                raise RuntimeError(f"ElevenLabs TTS provider failed: {str(e)}")

        else:
            logger.error(f"[TTS] Unsupported provider configured: {selected_provider}")
            raise ValueError(
                f"Unsupported TTS provider: '{selected_provider}'. "
                f"Supported providers are 'gtts', 'openai', 'elevenlabs'."
            )

        if not audio_bytes:
            logger.error(f"[TTS] Provider {selected_provider} returned empty audio bytes")
            raise RuntimeError(f"TTS provider {selected_provider} returned empty audio response.")

        duration_ms = int((time.time() - start_time) * 1000)
        logger.info(
            f"[TTS] Successfully synthesized audio for message_id={message_id}: "
            f"{len(audio_bytes)} bytes, content_type={content_type}, duration={duration_ms}ms"
        )

        return {
            "text": clean_text,
            "message_id": message_id,
            "provider": selected_provider,
            "voice": selected_voice,
            "content_type": content_type,
            "audio_bytes": audio_bytes,
            "size_bytes": len(audio_bytes),
            "processing_ms": duration_ms
        }
