from sqlalchemy import Column, String, Integer, Date, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship
from uuid import uuid4

from app.database import Base


class UsageRecord(Base):
    __tablename__ = "usage_records"

    id = Column(String, primary_key=True, default=lambda: str(uuid4()))
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    date = Column(Date, nullable=False)
    minutes_used = Column(Integer, nullable=False, default=0)
    sessions_count = Column(Integer, nullable=False, default=0)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    # Relationships
    user = relationship("User", back_populates="usage_records")
