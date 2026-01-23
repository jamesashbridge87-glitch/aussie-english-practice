from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship
from uuid import uuid4

from app.database import Base


class Subscription(Base):
    __tablename__ = "subscriptions"

    id = Column(String, primary_key=True, default=lambda: str(uuid4()))
    user_id = Column(String, ForeignKey("users.id"), nullable=False, unique=True)
    plan = Column(String, nullable=False, default="free")  # free, basic, standard, premium
    stripe_customer_id = Column(String, nullable=True)
    stripe_subscription_id = Column(String, nullable=True)
    status = Column(String, nullable=False, default="active")  # active, cancelled, past_due
    current_period_start = Column(DateTime, nullable=True)
    current_period_end = Column(DateTime, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    # Relationships
    user = relationship("User", back_populates="subscription")


class PlanLimit(Base):
    __tablename__ = "plan_limits"

    plan = Column(String, primary_key=True)
    daily_minutes = Column(Integer, nullable=False)
    monthly_price_aud = Column(Integer, nullable=False, default=0)
    description = Column(String, nullable=True)


# Default plan limits
PLAN_LIMITS = {
    "free": {"daily_minutes": 2, "monthly_price_aud": 0},
    "basic": {"daily_minutes": 5, "monthly_price_aud": 25},
    "standard": {"daily_minutes": 10, "monthly_price_aud": 49},
    "premium": {"daily_minutes": 15, "monthly_price_aud": 79},
}
