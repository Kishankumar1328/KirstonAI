from typing import Optional
from sqlalchemy.orm import Session
from app.models.user import User
from app.core.security import get_password_hash, DEFAULT_TEST_USER_ID

class UserRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, user_id: str) -> Optional[User]:
        return self.db.query(User).filter(User.id == user_id).first()

    def get_by_email(self, email: str) -> Optional[User]:
        return self.db.query(User).filter(User.email == email).first()

    def create(self, email: str, password: Optional[str] = None, name: Optional[str] = None) -> User:
        hashed_pwd = get_password_hash(password) if password else None
        user = User(
            email=email,
            name=name or email.split("@")[0],
            hashed_password=hashed_pwd
        )
        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)
        return user

    def get_or_create_default_user_inst(self) -> User:
        user = self.get_by_id(DEFAULT_TEST_USER_ID)
        if not user:
            user = User(
                id=DEFAULT_TEST_USER_ID,
                email="user@antigravity.ai",
                name="Antigravity User"
            )
            self.db.add(user)
            self.db.commit()
            self.db.refresh(user)
        return user

