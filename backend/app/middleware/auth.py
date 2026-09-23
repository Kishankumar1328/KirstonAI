from typing import Optional
from fastapi import Request, Depends, Header
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.core.security import decode_access_token, DEFAULT_TEST_USER_ID
from app.repositories.user_repository import UserRepository
from app.models.user import User

def get_current_user(
    request: Request,
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
) -> User:
    user_repo = UserRepository(db)
    
    if authorization and authorization.startswith("Bearer "):
        token = authorization.split(" ")[1]
        payload = decode_access_token(token)
        if payload and "sub" in payload:
            user = user_repo.get_by_id(payload["sub"])
            if user:
                return user

    # Default fallback user for unauthenticated requests in development
    return user_repo.get_or_create_default_user_inst()
