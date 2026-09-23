from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict

class ConversationBase(BaseModel):
    title: Optional[str] = "New Conversation"
    model: Optional[str] = "nvidia/llama-3.1-nemotron-70b-instruct"

class ConversationCreate(ConversationBase):
    thread_id: Optional[str] = None

class ConversationUpdate(BaseModel):
    title: Optional[str] = None
    status: Optional[str] = None

class ConversationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str
    title: str
    model: str
    status: str
    message_count: int
    created_at: datetime
    updated_at: datetime
    last_message_at: datetime

class ConversationListResponse(BaseModel):
    conversations: List[ConversationResponse]
    total: int
