import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Text, Integer, DateTime, ForeignKey, Index, JSON
from sqlalchemy.orm import relationship
from app.database.base import Base


class Object3DGeneration(Base):
    __tablename__ = "object_3d_generations"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    prompt = Column(Text, nullable=False)
    negative_prompt = Column(Text, nullable=True)
    model_engine = Column(String(100), nullable=False, default="aimlapi-3d")
    format = Column(String(20), nullable=False, default="glb")
    status = Column(String(50), nullable=False, default="completed")  # queued, generating, completed, failed
    file_path = Column(String(500), nullable=True)
    file_url = Column(String(500), nullable=True)
    thumbnail_url = Column(String(500), nullable=True)
    file_size_bytes = Column(Integer, default=0, nullable=False)
    vertex_count = Column(Integer, default=0, nullable=False)
    face_count = Column(Integer, default=0, nullable=False)
    generation_time_ms = Column(Integer, default=0, nullable=False)
    parameters = Column(JSON, nullable=True)  # JSON-encoded extra config (style, seed, color, etc.)
    species_name = Column(String(100), nullable=True, index=True)
    species_category = Column(String(50), nullable=True, index=True)
    species_action = Column(String(50), nullable=True)
    species_environment = Column(String(50), nullable=True)
    species_rig = Column(String(100), nullable=True)
    species_metadata = Column(JSON, nullable=True)
    accuracy_score = Column(Integer, default=100, nullable=True)
    accuracy_metrics = Column(JSON, nullable=True)
    topology_health = Column(JSON, nullable=True)
    dimensions_meters = Column(JSON, nullable=True)
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    user = relationship("User", backref="object_3d_generations")

    __table_args__ = (
        Index("ix_object_3d_user_created", "user_id", "created_at"),
    )
