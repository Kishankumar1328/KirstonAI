from typing import Generic, TypeVar, Optional, Any
from pydantic import BaseModel

T = TypeVar("T")

class APIResponse(BaseModel, Generic[T]):
    data: Optional[T] = None
    request_id: Optional[str] = None

class ErrorDetail(BaseModel):
    code: str
    message: str
    request_id: Optional[str] = None
    details: Optional[Any] = None

class APIErrorResponse(BaseModel):
    error: ErrorDetail
