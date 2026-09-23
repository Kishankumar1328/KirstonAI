import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Text, Integer, DateTime, ForeignKey, Index
from sqlalchemy.orm import relationship
from app.database.base import Base

class FileChatSession(Base):
    __tablename__ = "file_chat_sessions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(255), nullable=False, default="AI File Chat")
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    attachments = relationship("FileChatAttachment", back_populates="session", cascade="all, delete-orphan")

class FileChatAttachment(Base):
    __tablename__ = "file_chat_attachments"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    session_id = Column(String(36), ForeignKey("file_chat_sessions.id", ondelete="CASCADE"), nullable=False, index=True)
    filename = Column(String(255), nullable=False)
    file_type = Column(String(100), nullable=False) # image/png, application/pdf, text/plain, etc.
    extracted_text = Column(Text, nullable=False)
    is_image = Column(String(10), nullable=False, default="false") # "true" or "false"
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    session = relationship("FileChatSession", back_populates="attachments")
