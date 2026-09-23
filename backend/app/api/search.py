from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.middleware.auth import get_current_user
from app.models.user import User
from app.services.search_service import SearchService
from app.schemas.search import SearchResponse

router = APIRouter(prefix="/api/v1/search", tags=["Search"])

@router.get("", response_model=SearchResponse)
def search_chat_history(
    q: str = Query(..., min_length=1),
    limit: int = Query(30, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    service = SearchService(db)
    return service.search_history(user_id=current_user.id, query=q, limit=limit)
