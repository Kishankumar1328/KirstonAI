from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict

class MessageBase(BaseModel):
    role: str
    content: str
    model: Optional[str] = None

class MessageCreate(MessageBase):
    thread_id: str

class MessageResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    id: str
    thread_id: str = Field(alias="conversation_id")
    role: str
    content: str
    model: Optional[str] = None
    status: str
    prompt_tokens: Optional[int] = 0
    completion_tokens: Optional[int] = 0
    total_tokens: Optional[int] = 0
    created_at: datetime
    updated_at: datetime

class MessageListResponse(BaseModel):
    messages: List[MessageResponse]
    total: int
