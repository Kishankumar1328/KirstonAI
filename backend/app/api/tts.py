import urllib.parse
from typing import Optional
from fastapi import APIRouter, HTTPException, Query, Response, status
from pydantic import BaseModel, Field, field_validator

from app.services.tts_service import TTSService
from app.utils.logging import logger

router = APIRouter(prefix="/api/v1/tts", tags=["Text-to-Speech"])

class TTSRequest(BaseModel):
    text: str = Field(..., description="text to convert into speech")
    message_id: Optional[str] = Field(None, description="unique-message-id")
    voice: Optional[str] = Field("default", description="voice ID")
    provider: Optional[str] = Field(None, description="TTS provider override")

    @field_validator("text")
    @classmethod
    def validate_text_not_empty(cls, v: str) -> str:
        if v is None or not v.strip():
            raise ValueError("Text parameter cannot be empty.")
        return v

@router.post("", status_code=status.HTTP_200_OK)
@router.post("/", status_code=status.HTTP_200_OK)
async def generate_speech(payload: TTSRequest):
    """
    Dedicated POST /api/v1/tts endpoint to convert text to natural speech audio stream.
    """
    try:
        res = TTSService.synthesize_speech(
            text=payload.text,
            message_id=payload.message_id,
            voice=payload.voice or "default",
            provider=payload.provider
        )

        return Response(
            content=res["audio_bytes"],
            media_type=res["content_type"],
            headers={
                "Content-Disposition": f'inline; filename="speech_{payload.message_id or "audio"}.mp3"',
                "Cache-Control": "public, max-age=86400",
                "X-Audio-Duration-MS": str(res.get("processing_ms", 0)),
                "X-Audio-Size-Bytes": str(res.get("size_bytes", 0))
            }
        )
    except ValueError as ve:
        logger.warning(f"[TTS API] Validation error: {str(ve)}")
        raise HTTPException(status_code=400, detail=str(ve))
    except RuntimeError as re:
        logger.error(f"[TTS API] Provider execution error: {str(re)}")
        err_msg = str(re)
        if "timed out" in err_msg.lower():
            raise HTTPException(status_code=504, detail=err_msg)
        raise HTTPException(status_code=500, detail=err_msg)
    except Exception as e:
        logger.error(f"[TTS API] Unexpected failure: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Text-to-Speech synthesis failed: {str(e)}")

# Legacy endpoint compatibility
@router.post("/synthesize")
async def synthesize_speech(payload: TTSRequest):
    return await generate_speech(payload)

@router.get("/stream")
async def stream_audio_get(
    text: str = Query(..., description="Text to synthesize"),
    message_id: Optional[str] = Query(None, description="Message ID"),
    voice: Optional[str] = Query("default", description="Voice ID")
):
    """GET endpoint to stream synthesized audio directly for HTML5 audio tags."""
    clean_text = urllib.parse.unquote(text)
    req = TTSRequest(text=clean_text, message_id=message_id, voice=voice)
    return await generate_speech(req)
