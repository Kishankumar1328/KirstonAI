from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field

class ChatRequest(BaseModel):
    thread_id: str
    message: str
    model: Optional[str] = "nvidia/llama-3.1-nemotron-70b-instruct"
    use_rag: Optional[bool] = True

class RAGSource(BaseModel):
    document_id: str
    filename: str
    snippet: str
    score: float

class ChatResponse(BaseModel):
    message_id: str
    thread_id: str
    content: str
    model: str
    status: str
    sources: Optional[List[RAGSource]] = []
