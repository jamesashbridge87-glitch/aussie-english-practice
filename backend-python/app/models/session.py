from sqlalchemy import Column, String, Integer, Boolean, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship
from uuid import uuid4

from app.database import Base


class PracticeSession(Base):
    __tablename__ = "practice_sessions"

    id = Column(String, primary_key=True, default=lambda: str(uuid4()))
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    mode = Column(String, nullable=False, default="everyday")  # everyday, slang, workplace
    started_at = Column(DateTime, server_default=func.now())
    ended_at = Column(DateTime, nullable=True)
    duration_seconds = Column(Integer, nullable=True)
    messages_count = Column(Integer, nullable=False, default=0)
    feedback = Column(Boolean, nullable=True)  # True = good, False = needs work
    created_at = Column(DateTime, server_default=func.now())

    # Relationships
    user = relationship("User", back_populates="practice_sessions")
