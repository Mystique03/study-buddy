"""
Typed settings loaded from .env via pydantic-settings.
All service URLs and secrets live here — never hardcoded elsewhere.
"""
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # LLM endpoints — Groq for local dev, AMD vLLM for demo
    vllm_7b_url: str = "http://localhost:8000"
    vllm_14b_url: str = "http://localhost:8001"
    llm_api_key: str = ""
    llm_7b_model: str = "qwen"
    llm_14b_model: str = "qwen"

    # Local voice services
    whisperflow_url: str = "http://localhost:9000"
    chatterbox_url: str = "http://localhost:9001"

    # Telegram alerts
    telegram_bot_token: str = ""
    telegram_chat_id: str = ""

    # CORS origin for frontend dev server
    cors_origin: str = "*"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")


settings = Settings()
