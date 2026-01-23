from fastapi import APIRouter

from app.routes import auth, subscriptions, sessions, voice

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(subscriptions.router, prefix="/subscriptions", tags=["subscriptions"])
api_router.include_router(sessions.router, prefix="/sessions", tags=["sessions"])
api_router.include_router(voice.router, prefix="/voice", tags=["voice"])
