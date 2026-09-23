from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict

class DocumentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    filename: str
    file_type: str
    chunk_count: int
    created_at: datetime

class DocumentUploadResponse(BaseModel):
    document: DocumentResponse
    message: str
