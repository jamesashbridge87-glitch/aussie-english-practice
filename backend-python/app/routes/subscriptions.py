from datetime import date, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.user import User
from app.models.subscription import Subscription, PLAN_LIMITS
from app.models.usage import UsageRecord
from app.services.auth import get_current_user

router = APIRouter()


class PlanResponse(BaseModel):
    plan: str
    daily_minutes: int
    monthly_price_aud: int


class UsageResponse(BaseModel):
    minutes_used: int
    minutes_remaining: int
    daily_limit: int
    plan: str


class CanStartResponse(BaseModel):
    allowed: bool
    message: Optional[str] = None
    remaining: int


@router.get("/plans", response_model=list[PlanResponse])
async def get_plans():
    """Get all subscription plans."""
    return [
        PlanResponse(plan=plan, **limits)
        for plan, limits in PLAN_LIMITS.items()
    ]


@router.get("/current")
async def get_current_subscription(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get current user's subscription."""
    result = await db.execute(
        select(Subscription).where(Subscription.user_id == user.id)
    )
    subscription = result.scalar_one_or_none()

    if not subscription:
        return {"plan": "free", "status": "active"}

    return {
        "plan": subscription.plan,
        "status": subscription.status,
        "current_period_start": subscription.current_period_start,
        "current_period_end": subscription.current_period_end,
    }


@router.get("/usage", response_model=UsageResponse)
async def get_usage(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get current user's usage for today."""
    today = date.today()

    # Get subscription
    sub_result = await db.execute(
        select(Subscription).where(Subscription.user_id == user.id)
    )
    subscription = sub_result.scalar_one_or_none()
    plan = subscription.plan if subscription else "free"
    daily_limit = PLAN_LIMITS.get(plan, PLAN_LIMITS["free"])["daily_minutes"]

    # Get today's usage
    usage_result = await db.execute(
        select(UsageRecord).where(
            UsageRecord.user_id == user.id,
            UsageRecord.date == today,
        )
    )
    usage = usage_result.scalar_one_or_none()
    minutes_used = usage.minutes_used if usage else 0

    return UsageResponse(
        minutes_used=minutes_used,
        minutes_remaining=max(0, daily_limit - minutes_used),
        daily_limit=daily_limit,
        plan=plan,
    )


@router.get("/check", response_model=CanStartResponse)
async def check_can_start(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Check if user can start a new session."""
    today = date.today()

    # Get subscription
    sub_result = await db.execute(
        select(Subscription).where(Subscription.user_id == user.id)
    )
    subscription = sub_result.scalar_one_or_none()
    plan = subscription.plan if subscription else "free"
    daily_limit = PLAN_LIMITS.get(plan, PLAN_LIMITS["free"])["daily_minutes"]

    # Get today's usage
    usage_result = await db.execute(
        select(UsageRecord).where(
            UsageRecord.user_id == user.id,
            UsageRecord.date == today,
        )
    )
    usage = usage_result.scalar_one_or_none()
    minutes_used = usage.minutes_used if usage else 0
    remaining = max(0, daily_limit - minutes_used)

    if remaining <= 0:
        return CanStartResponse(
            allowed=False,
            message=f"You've used all {daily_limit} minutes for today. Upgrade for more time!",
            remaining=0,
        )

    return CanStartResponse(
        allowed=True,
        remaining=remaining,
    )


@router.get("/history")
async def get_usage_history(
    days: int = 30,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get usage history for the past N days."""
    start_date = date.today() - timedelta(days=days)

    result = await db.execute(
        select(UsageRecord)
        .where(
            UsageRecord.user_id == user.id,
            UsageRecord.date >= start_date,
        )
        .order_by(UsageRecord.date.desc())
    )
    records = result.scalars().all()

    # Calculate monthly total
    monthly_total = sum(r.minutes_used for r in records)

    return {
        "history": [
            {
                "date": r.date.isoformat(),
                "minutes_used": r.minutes_used,
                "sessions_count": r.sessions_count,
            }
            for r in records
        ],
        "monthly_total_minutes": monthly_total,
    }
