from typing import List, Optional, Tuple
from sqlalchemy.orm import Session
from app.models.message import Message

class MessageRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, message_id: str) -> Optional[Message]:
        return self.db.query(Message).filter(Message.id == message_id).first()

    def list_by_conversation(self, conversation_id: str, limit: int = 50, before: Optional[str] = None) -> List[Message]:
        query = self.db.query(Message).filter(Message.conversation_id == conversation_id)
        if before:
            ref_msg = self.get_by_id(before)
            if ref_msg:
                query = query.filter(Message.created_at < ref_msg.created_at)
        return query.order_by(Message.created_at.asc()).limit(limit).all()

    def create(
        self,
        conversation_id: str,
        role: str,
        content: str,
        model: Optional[str] = None,
        status: str = "completed",
        prompt_tokens: int = 0,
        completion_tokens: int = 0,
        total_tokens: int = 0
    ) -> Message:
        msg = Message(
            conversation_id=conversation_id,
            role=role,
            content=content,
            model=model,
            status=status,
            prompt_tokens=prompt_tokens,
            completion_tokens=completion_tokens,
            total_tokens=total_tokens
        )
        self.db.add(msg)
        self.db.commit()
        self.db.refresh(msg)
        return msg

    def update_content_and_status(self, message_id: str, content: str, status: str = "completed", tokens: int = 0) -> Optional[Message]:
        msg = self.get_by_id(message_id)
        if msg:
            msg.content = content
            msg.status = status
            msg.completion_tokens = tokens
            msg.total_tokens = (msg.prompt_tokens or 0) + tokens
            self.db.commit()
            self.db.refresh(msg)
        return msg
