from fastapi import APIRouter, Depends, Request
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.middleware.auth import get_current_user
from app.models.user import User
from app.schemas.chat import ChatRequest
from app.services.chat_service import ChatService

router = APIRouter(prefix="/api/v1/chat", tags=["Chat"])

@router.post("")
@router.post("/stream")
async def chat_stream(
    request: Request,
    payload: ChatRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    service = ChatService(db)
    generator = service.stream_chat(
        user_id=current_user.id,
        thread_id=payload.thread_id,
        user_message=payload.message,
        model=payload.model or "nvidia/llama-3.1-nemotron-70b-instruct",
        use_rag=payload.use_rag if payload.use_rag is not None else True
    )

    return StreamingResponse(
        generator,
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )
