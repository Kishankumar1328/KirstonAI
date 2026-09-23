from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.middleware.auth import get_current_user
from app.models.user import User
from app.repositories.message_repository import MessageRepository
from app.repositories.conversation_repository import ConversationRepository
from app.schemas.message import MessageListResponse, MessageResponse
from app.core.exceptions import ResourceNotFoundException

router = APIRouter(prefix="/api/v1/conversations", tags=["Messages"])

@router.get("/{thread_id}/messages", response_model=MessageListResponse)
def list_messages(
    thread_id: str,
    limit: int = Query(50, ge=1, le=100),
    before: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    conv_repo = ConversationRepository(db)
    conv = conv_repo.get_by_id_and_user(thread_id=thread_id, user_id=current_user.id)
    if not conv:
        raise ResourceNotFoundException(resource="Conversation", resource_id=thread_id)

    msg_repo = MessageRepository(db)
    messages = msg_repo.list_by_conversation(conversation_id=thread_id, limit=limit, before=before)
    
    formatted = [MessageResponse.model_validate(m) for m in messages]
    return MessageListResponse(messages=formatted, total=len(formatted))
