"""
SpeakAussie Voice Bot using Pipecat

This bot provides real-time voice conversations for Australian English practice.
It uses:
- Deepgram for speech-to-text
- Claude (Anthropic) for conversation
- Fish Audio for text-to-speech with a cloned Australian voice
"""

import os
from loguru import logger

from pipecat.audio.vad.silero import SileroVADAnalyzer
from pipecat.audio.vad.vad_analyzer import VADParams
from pipecat.processors.turn_detector.smart_turn import SmartTurnAnalyzer
from pipecat.frames.frames import LLMRunFrame
from pipecat.pipeline.pipeline import Pipeline
from pipecat.pipeline.runner import PipelineRunner
from pipecat.pipeline.task import PipelineParams, PipelineTask
from pipecat.processors.aggregators.llm_context import LLMContext
from pipecat.processors.aggregators.llm_response_universal import LLMContextAggregatorPair
from pipecat.services.anthropic.llm import AnthropicLLMService
from pipecat.services.deepgram.stt import DeepgramSTTService
from pipecat.services.fish.tts import FishAudioTTSService
from pipecat.transports.base_transport import BaseTransport, TransportParams
from pipecat.transports.daily.transport import DailyParams, DailyTransport

from app.config import settings


# Mode-specific prompts
MODE_PROMPTS = {
    "everyday": """You are "Your Aussie Uncle" - a friendly Australian English teacher with a warm, encouraging personality.

Focus on:
- Casual greetings and farewells (G'day, See ya, How ya going?)
- Everyday situations like shopping, asking for directions, ordering food
- Natural Australian pronunciation and rhythm
- Common Australian expressions used in daily life

Keep the conversation friendly and casual, like chatting with a neighbour. Keep responses conversational and natural (2-4 sentences typically).""",

    "slang": """You are "Your Aussie Uncle" - a friendly Australian English teacher specializing in Aussie slang.

Focus on:
- Classic Australian slang (arvo, servo, bottle-o, maccas, etc.)
- Rhyming slang and abbreviations
- Expressions like "no worries", "she'll be right", "fair dinkum"
- Cultural context behind Australian expressions

Make it fun and engaging - throw in some slang naturally and explain what it means. Keep responses to 2-4 sentences.""",

    "workplace": """You are "Your Aussie Uncle" - a friendly Australian English teacher helping with workplace communication.

Focus on:
- Professional but friendly Australian communication style
- Email etiquette and meeting language
- How Australians balance professionalism with casualness
- Cultural norms like "tall poppy syndrome" and egalitarianism

Help them sound professional while fitting into Australian work culture. Keep responses to 2-4 sentences.""",
}

MODE_FIRST_MESSAGES = {
    "everyday": "G'day! Ready to practice some everyday Aussie English? What would you like to chat about today?",
    "slang": "G'day mate! Ready to learn some fair dinkum Aussie slang? No worries, I'll help you sound like a true blue Aussie!",
    "workplace": "Good morning! Ready to practice professional Australian English for the workplace? Let's get you sorted!",
}


async def create_bot(
    transport: BaseTransport,
    mode: str = "everyday",
) -> PipelineTask:
    """Create the Pipecat pipeline for voice conversation."""

    logger.info(f"Creating Aussie bot in {mode} mode")

    # Initialize services
    stt = DeepgramSTTService(
        api_key=settings.deepgram_api_key,
        model="nova-2",
    )

    # Smart Turn analyzer for better turn-taking detection
    # Uses semantic understanding to know when user finished their thought
    smart_turn = SmartTurnAnalyzer(
        model_path="pipecat-ai/smart-turn-v3",  # Auto-downloads from HuggingFace
        min_volume=0.5,
    )

    tts = FishAudioTTSService(
        api_key=settings.fish_api_key,
        model=settings.fish_voice_id,
    )

    llm = AnthropicLLMService(
        api_key=settings.anthropic_api_key,
        model="claude-sonnet-4-20250514",
    )

    # Set up conversation context
    system_prompt = MODE_PROMPTS.get(mode, MODE_PROMPTS["everyday"])
    first_message = MODE_FIRST_MESSAGES.get(mode, MODE_FIRST_MESSAGES["everyday"])

    messages = [
        {
            "role": "system",
            "content": system_prompt + """

Additional guidelines:
- Your responses will be spoken aloud, so avoid special characters, emojis, or bullet points
- Write numbers as words when spoken naturally
- Be encouraging and supportive
- If the student makes a mistake, acknowledge what they got right first, then help them improve
- Respond in a way that continues the conversation naturally""",
        },
    ]

    context = LLMContext(messages)
    user_aggregator, assistant_aggregator = LLMContextAggregatorPair(context)

    # Build pipeline
    # Smart Turn sits after STT to analyze transcribed text for end-of-turn
    pipeline = Pipeline(
        [
            transport.input(),
            stt,
            smart_turn,
            user_aggregator,
            llm,
            tts,
            transport.output(),
            assistant_aggregator,
        ]
    )

    task = PipelineTask(
        pipeline,
        params=PipelineParams(
            enable_metrics=True,
            enable_usage_metrics=True,
        ),
    )

    # Event handlers
    @transport.event_handler("on_client_connected")
    async def on_client_connected(transport, client):
        logger.info(f"Client connected")
        # Start with greeting
        messages.append({"role": "assistant", "content": first_message})
        await task.queue_frames([LLMRunFrame()])

    @transport.event_handler("on_client_disconnected")
    async def on_client_disconnected(transport, client):
        logger.info(f"Client disconnected")
        await task.cancel()

    return task


async def run_bot(room_url: str, token: str, mode: str = "everyday"):
    """Run the voice bot in a Daily room."""

    transport = DailyTransport(
        room_url=room_url,
        token=token,
        bot_name="Your Aussie Uncle",
        params=DailyParams(
            audio_in_enabled=True,
            audio_out_enabled=True,
            vad_analyzer=SileroVADAnalyzer(params=VADParams(stop_secs=0.3)),
        ),
    )

    task = await create_bot(transport, mode)
    runner = PipelineRunner()
    await runner.run(task)
