from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.middleware.auth import get_current_user
from app.models.user import User
from app.services.conversation_service import ConversationService
from app.schemas.conversation import (
    ConversationCreate,
    ConversationUpdate,
    ConversationResponse,
    ConversationListResponse
)

router = APIRouter(prefix="/api/v1/conversations", tags=["Conversations"])

@router.post("", response_model=ConversationResponse)
def create_conversation(
    payload: ConversationCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    service = ConversationService(db)
    return service.create_conversation(
        user_id=current_user.id,
        thread_id=payload.thread_id,
        title=payload.title or "New Conversation",
        model=payload.model or "nvidia/llama-3.1-nemotron-70b-instruct"
    )

@router.get("", response_model=ConversationListResponse)
def list_conversations(
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    service = ConversationService(db)
    items, total = service.list_conversations(user_id=current_user.id, limit=limit, offset=offset)
    return ConversationListResponse(conversations=items, total=total)

@router.get("/{thread_id}", response_model=ConversationResponse)
def get_conversation(
    thread_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    service = ConversationService(db)
    return service.get_conversation(thread_id=thread_id, user_id=current_user.id)

@router.patch("/{thread_id}", response_model=ConversationResponse)
def update_conversation(
    thread_id: str,
    payload: ConversationUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    service = ConversationService(db)
    return service.update_conversation(thread_id=thread_id, user_id=current_user.id, title=payload.title)

@router.delete("/{thread_id}")
def delete_conversation(
    thread_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    service = ConversationService(db)
    service.delete_conversation(thread_id=thread_id, user_id=current_user.id)
    return {"message": "Conversation deleted successfully."}
