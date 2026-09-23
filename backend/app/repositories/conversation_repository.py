from datetime import datetime, timezone
from typing import List, Optional, Tuple
from sqlalchemy.orm import Session
from app.models.conversation import Conversation
from app.utils.ids import generate_uuid

class ConversationRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id_and_user(self, thread_id: str, user_id: str) -> Optional[Conversation]:
        return self.db.query(Conversation).filter(
            Conversation.id == thread_id,
            Conversation.user_id == user_id,
            Conversation.status != "deleted"
        ).first()

    def list_by_user(self, user_id: str, limit: int = 50, offset: int = 0) -> Tuple[List[Conversation], int]:
        query = self.db.query(Conversation).filter(
            Conversation.user_id == user_id,
            Conversation.status != "deleted"
        )
        total = query.count()
        conversations = query.order_by(Conversation.updated_at.desc()).offset(offset).limit(limit).all()
        return conversations, total

    def create(self, user_id: str, thread_id: Optional[str] = None, title: str = "New Conversation", model: str = "nvidia/llama-3.1-nemotron-70b-instruct") -> Conversation:
        conv_id = thread_id if thread_id else generate_uuid()
        conv = Conversation(
            id=conv_id,
            user_id=user_id,
            title=title,
            model=model,
            status="active"
        )
        self.db.add(conv)
        self.db.commit()
        self.db.refresh(conv)
        return conv

    def update_title(self, conversation: Conversation, title: str) -> Conversation:
        conversation.title = title
        conversation.updated_at = datetime.now(timezone.utc)
        self.db.commit()
        self.db.refresh(conversation)
        return conversation

    def touch_last_message(self, conversation: Conversation) -> Conversation:
        now = datetime.now(timezone.utc)
        conversation.last_message_at = now
        conversation.updated_at = now
        conversation.message_count = conversation.message_count + 1
        self.db.commit()
        self.db.refresh(conversation)
        return conversation

    def delete(self, conversation: Conversation) -> bool:
        self.db.delete(conversation)
        self.db.commit()
        return True
