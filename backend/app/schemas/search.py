from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel

class SearchResultItem(BaseModel):
    conversation_id: str
    conversation_title: str
    message_id: Optional[str] = None
    snippet: str
    match_type: str  # title, message
    created_at: datetime

class SearchResponse(BaseModel):
    query: str
    results: List[SearchResultItem]
    total: int
