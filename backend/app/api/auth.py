from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.repositories.user_repository import UserRepository
from app.core.security import verify_password, create_access_token
from app.schemas.auth import UserRegister, UserLogin, UserResponse, Token
from app.middleware.auth import get_current_user
from app.models.user import User

router = APIRouter(prefix="/api/v1/auth", tags=["Auth"])

@router.post("/register", response_model=UserResponse)
def register(payload: UserRegister, db: Session = Depends(get_db)):
    user_repo = UserRepository(db)
    if user_repo.get_by_email(payload.email):
        raise HTTPException(status_code=400, detail="Email is already registered.")
    user = user_repo.create(email=payload.email, password=payload.password, name=payload.name)
    return UserResponse.model_validate(user)

@router.post("/login", response_model=Token)
def login(payload: UserLogin, db: Session = Depends(get_db)):
    user_repo = UserRepository(db)
    user = user_repo.get_by_email(payload.email)
    if not user or not user.hashed_password or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password.")
    
    token = create_access_token(data={"sub": user.id, "email": user.email})
    return Token(access_token=token)

@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return UserResponse.model_validate(current_user)
