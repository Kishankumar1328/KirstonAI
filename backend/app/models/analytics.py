import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, ForeignKey, Integer, JSON
from sqlalchemy.orm import relationship
from app.database.base import Base

class AnalyticsDataset(Base):
    __tablename__ = "analytics_datasets"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    filename = Column(String(255), nullable=False)
    file_type = Column(String(50), nullable=False)
    file_size = Column(Integer, default=0)
    row_count = Column(Integer, default=0)
    column_count = Column(Integer, default=0)
    schema_info = Column(JSON, nullable=True) # {columns: [{name, dtype, null_count, sample_values}]}
    summary_stats = Column(JSON, nullable=True) # {numerical: {mean, min, max, std}, categorical: {top, freq}}
    raw_data_preview = Column(JSON, nullable=True) # Array of first 100 row objects
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    user = relationship("User", back_populates="analytics_datasets")
    dashboards = relationship("AnalyticsDashboard", back_populates="dataset", cascade="all, delete-orphan")

class AnalyticsDashboard(Base):
    __tablename__ = "analytics_dashboards"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    dataset_id = Column(String(36), ForeignKey("analytics_datasets.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(255), nullable=False, default="Interactive AI Analytics Dashboard")
    widgets = Column(JSON, nullable=True) # Array of chart specs: {id, type, title, xAxis, yAxis, aggregate, data}
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    dataset = relationship("AnalyticsDataset", back_populates="dashboards")
