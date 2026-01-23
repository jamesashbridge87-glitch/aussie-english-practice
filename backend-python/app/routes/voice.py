"""
Voice API routes for real-time conversation using Pipecat and Daily.

Flow:
1. Client calls /voice/room to create a Daily room and get a token
2. Client connects to the Daily room using their WebRTC SDK
3. Server spawns a Pipecat bot that joins the same room
4. Real-time voice conversation happens via Daily's infrastructure
"""

import asyncio
import httpx
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from pydantic import BaseModel
from loguru import logger

from app.config import settings
from app.models.user import User
from app.services.auth import get_current_user_optional
from app.pipecat.aussie_bot import run_bot

router = APIRouter()


class CreateRoomRequest(BaseModel):
    mode: str = "everyday"


class RoomResponse(BaseModel):
    room_url: str
    token: str
    mode: str


class StatusResponse(BaseModel):
    pipecat: bool
    deepgram: bool
    fish_audio: bool
    anthropic: bool
    daily: bool
    ready: bool


@router.get("/status", response_model=StatusResponse)
async def get_status():
    """Check if all voice services are configured."""
    pipecat = True  # Always available if this code is running
    deepgram = bool(settings.deepgram_api_key)
    fish_audio = bool(settings.fish_api_key and settings.fish_voice_id)
    anthropic = bool(settings.anthropic_api_key)
    daily = bool(settings.daily_api_key)

    return StatusResponse(
        pipecat=pipecat,
        deepgram=deepgram,
        fish_audio=fish_audio,
        anthropic=anthropic,
        daily=daily,
        ready=all([deepgram, fish_audio, anthropic, daily]),
    )


async def create_daily_room() -> dict:
    """Create a new Daily room for the conversation."""
    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{settings.daily_api_url}/rooms",
            headers={"Authorization": f"Bearer {settings.daily_api_key}"},
            json={
                "properties": {
                    "exp": 3600,  # Room expires in 1 hour
                    "enable_chat": False,
                    "enable_screenshare": False,
                    "start_video_off": True,
                    "start_audio_off": False,
                }
            },
        )

        if response.status_code != 200:
            logger.error(f"Failed to create Daily room: {response.text}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create voice room",
            )

        return response.json()


async def create_daily_token(room_name: str, is_owner: bool = False) -> str:
    """Create a meeting token for the Daily room."""
    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{settings.daily_api_url}/meeting-tokens",
            headers={"Authorization": f"Bearer {settings.daily_api_key}"},
            json={
                "properties": {
                    "room_name": room_name,
                    "is_owner": is_owner,
                    "exp": 3600,  # Token expires in 1 hour
                }
            },
        )

        if response.status_code != 200:
            logger.error(f"Failed to create Daily token: {response.text}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create meeting token",
            )

        data = response.json()
        return data["token"]


async def spawn_bot(room_url: str, token: str, mode: str):
    """Spawn a Pipecat bot in the background."""
    try:
        logger.info(f"Spawning bot for room {room_url} in {mode} mode")
        await run_bot(room_url, token, mode)
    except Exception as e:
        logger.error(f"Bot error: {e}")


@router.post("/room", response_model=RoomResponse)
async def create_room(
    request: CreateRoomRequest,
    background_tasks: BackgroundTasks,
    user: Optional[User] = Depends(get_current_user_optional),
):
    """
    Create a voice room and spawn the AI bot.

    Returns room URL and token for the client to connect.
    The bot will join automatically and start the conversation.
    """
    # Validate mode
    if request.mode not in ["everyday", "slang", "workplace"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid mode. Must be 'everyday', 'slang', or 'workplace'",
        )

    # Check if services are configured
    if not all([
        settings.deepgram_api_key,
        settings.fish_api_key,
        settings.fish_voice_id,
        settings.anthropic_api_key,
        settings.daily_api_key,
    ]):
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Voice services not fully configured",
        )

    # Create Daily room
    room_data = await create_daily_room()
    room_url = room_data["url"]
    room_name = room_data["name"]

    # Create tokens
    client_token = await create_daily_token(room_name, is_owner=False)
    bot_token = await create_daily_token(room_name, is_owner=True)

    # Spawn bot in background
    background_tasks.add_task(spawn_bot, room_url, bot_token, request.mode)

    return RoomResponse(
        room_url=room_url,
        token=client_token,
        mode=request.mode,
    )


@router.delete("/room/{room_name}")
async def delete_room(
    room_name: str,
    user: Optional[User] = Depends(get_current_user_optional),
):
    """Delete a Daily room (cleanup)."""
    async with httpx.AsyncClient() as client:
        response = await client.delete(
            f"{settings.daily_api_url}/rooms/{room_name}",
            headers={"Authorization": f"Bearer {settings.daily_api_key}"},
        )

        if response.status_code not in [200, 404]:
            logger.error(f"Failed to delete room: {response.text}")

    return {"success": True}
