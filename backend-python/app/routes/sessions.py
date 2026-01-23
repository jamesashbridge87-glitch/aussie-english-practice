from datetime import date, datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.user import User
from app.models.session import PracticeSession
from app.models.usage import UsageRecord
from app.models.subscription import Subscription, PLAN_LIMITS
from app.services.auth import get_current_user, get_current_user_optional

router = APIRouter()


class StartSessionRequest(BaseModel):
    mode: str = "everyday"


class EndSessionRequest(BaseModel):
    feedback: Optional[bool] = None
    messages_count: int = 0


class SessionResponse(BaseModel):
    id: str
    mode: str
    started_at: datetime
    ended_at: Optional[datetime] = None
    duration_seconds: Optional[int] = None
    messages_count: int

    class Config:
        from_attributes = True


@router.post("/start", response_model=SessionResponse)
async def start_session(
    request: StartSessionRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Start a new practice session."""
    # Validate mode
    if request.mode not in ["everyday", "slang", "workplace"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid mode. Must be 'everyday', 'slang', or 'workplace'",
        )

    # Check usage limits
    today = date.today()

    sub_result = await db.execute(
        select(Subscription).where(Subscription.user_id == user.id)
    )
    subscription = sub_result.scalar_one_or_none()
    plan = subscription.plan if subscription else "free"
    daily_limit = PLAN_LIMITS.get(plan, PLAN_LIMITS["free"])["daily_minutes"]

    usage_result = await db.execute(
        select(UsageRecord).where(
            UsageRecord.user_id == user.id,
            UsageRecord.date == today,
        )
    )
    usage = usage_result.scalar_one_or_none()
    minutes_used = usage.minutes_used if usage else 0

    if minutes_used >= daily_limit:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Daily limit reached. Please upgrade your plan.",
        )

    # Create session
    session = PracticeSession(
        user_id=user.id,
        mode=request.mode,
    )
    db.add(session)
    await db.commit()
    await db.refresh(session)

    return SessionResponse(
        id=session.id,
        mode=session.mode,
        started_at=session.started_at,
        messages_count=session.messages_count,
    )


@router.post("/{session_id}/end", response_model=SessionResponse)
async def end_session(
    session_id: str,
    request: EndSessionRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """End a practice session."""
    result = await db.execute(
        select(PracticeSession).where(
            PracticeSession.id == session_id,
            PracticeSession.user_id == user.id,
        )
    )
    session = result.scalar_one_or_none()

    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found",
        )

    # Update session
    session.ended_at = datetime.utcnow()
    session.duration_seconds = int(
        (session.ended_at - session.started_at).total_seconds()
    )
    session.feedback = request.feedback
    session.messages_count = request.messages_count

    # Update usage
    today = date.today()
    duration_minutes = max(1, session.duration_seconds // 60)

    usage_result = await db.execute(
        select(UsageRecord).where(
            UsageRecord.user_id == user.id,
            UsageRecord.date == today,
        )
    )
    usage = usage_result.scalar_one_or_none()

    if usage:
        usage.minutes_used += duration_minutes
        usage.sessions_count += 1
    else:
        usage = UsageRecord(
            user_id=user.id,
            date=today,
            minutes_used=duration_minutes,
            sessions_count=1,
        )
        db.add(usage)

    await db.commit()
    await db.refresh(session)

    return SessionResponse(
        id=session.id,
        mode=session.mode,
        started_at=session.started_at,
        ended_at=session.ended_at,
        duration_seconds=session.duration_seconds,
        messages_count=session.messages_count,
    )


@router.get("/active")
async def get_active_session(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get the user's currently active session."""
    result = await db.execute(
        select(PracticeSession)
        .where(
            PracticeSession.user_id == user.id,
            PracticeSession.ended_at.is_(None),
        )
        .order_by(PracticeSession.started_at.desc())
        .limit(1)
    )
    session = result.scalar_one_or_none()

    if not session:
        return {"session": None}

    return {
        "session": SessionResponse(
            id=session.id,
            mode=session.mode,
            started_at=session.started_at,
            messages_count=session.messages_count,
        )
    }


@router.get("/history")
async def get_session_history(
    limit: int = 10,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get session history."""
    result = await db.execute(
        select(PracticeSession)
        .where(PracticeSession.user_id == user.id)
        .order_by(PracticeSession.started_at.desc())
        .limit(limit)
    )
    sessions = result.scalars().all()

    return {
        "sessions": [
            {
                "id": s.id,
                "mode": s.mode,
                "started_at": s.started_at.isoformat(),
                "ended_at": s.ended_at.isoformat() if s.ended_at else None,
                "duration_seconds": s.duration_seconds,
                "messages_count": s.messages_count,
                "feedback": s.feedback,
            }
            for s in sessions
        ]
    }
