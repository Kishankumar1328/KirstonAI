from typing import List, Optional, Tuple
from sqlalchemy.orm import Session
from app.repositories.conversation_repository import ConversationRepository
from app.repositories.message_repository import MessageRepository
from app.schemas.conversation import ConversationResponse
from app.core.exceptions import ResourceNotFoundException

class ConversationService:
    def __init__(self, db: Session):
        self.conv_repo = ConversationRepository(db)
        self.msg_repo = MessageRepository(db)

    def create_conversation(self, user_id: str, thread_id: Optional[str] = None, title: str = "New Conversation", model: str = "nvidia/llama-3.1-nemotron-70b-instruct") -> ConversationResponse:
        conv = self.conv_repo.create(user_id=user_id, thread_id=thread_id, title=title, model=model)
        return ConversationResponse.model_validate(conv)

    def get_conversation(self, thread_id: str, user_id: str) -> ConversationResponse:
        conv = self.conv_repo.get_by_id_and_user(thread_id=thread_id, user_id=user_id)
        if not conv:
            raise ResourceNotFoundException(resource="Conversation", resource_id=thread_id)
        return ConversationResponse.model_validate(conv)

    def list_conversations(self, user_id: str, limit: int = 50, offset: int = 0) -> Tuple[List[ConversationResponse], int]:
        convs, total = self.conv_repo.list_by_user(user_id=user_id, limit=limit, offset=offset)
        return [ConversationResponse.model_validate(c) for c in convs], total

    def update_conversation(self, thread_id: str, user_id: str, title: Optional[str] = None) -> ConversationResponse:
        conv = self.conv_repo.get_by_id_and_user(thread_id=thread_id, user_id=user_id)
        if not conv:
            raise ResourceNotFoundException(resource="Conversation", resource_id=thread_id)
        if title:
            conv = self.conv_repo.update_title(conv, title)
        return ConversationResponse.model_validate(conv)

    def delete_conversation(self, thread_id: str, user_id: str) -> bool:
        conv = self.conv_repo.get_by_id_and_user(thread_id=thread_id, user_id=user_id)
        if not conv:
            raise ResourceNotFoundException(resource="Conversation", resource_id=thread_id)
        return self.conv_repo.delete(conv)
