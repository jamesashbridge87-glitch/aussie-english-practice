from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # App settings
    app_name: str = "SpeakAussie API"
    debug: bool = False

    # Server
    host: str = "0.0.0.0"
    port: int = 3001

    # Database
    database_url: str = "sqlite+aiosqlite:///./data/aussie-english.db"

    # JWT
    jwt_secret: str = "change-this-in-production"
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 60 * 24 * 7  # 7 days

    # CORS
    frontend_url: str = "http://localhost:5173"
    allowed_origins: list[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "https://youraussieuncle.io",
        "https://www.youraussieuncle.io",
    ]

    # Fish Audio
    fish_api_key: str = ""
    fish_voice_id: str = ""

    # Anthropic (Claude)
    anthropic_api_key: str = ""

    # Deepgram (STT)
    deepgram_api_key: str = ""

    # Daily (WebRTC)
    daily_api_key: str = ""
    daily_api_url: str = "https://api.daily.co/v1"

    # Stripe
    stripe_secret_key: str = ""
    stripe_webhook_secret: str = ""
    stripe_price_basic: str = ""
    stripe_price_standard: str = ""
    stripe_price_premium: str = ""

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
