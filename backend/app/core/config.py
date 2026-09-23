import os
from typing import List, Union
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    APP_NAME: str = "KirstonAI"
    APP_ENV: str = "development"
    PORT: int = 8000
    
    # Database
    DATABASE_URL: str = ""
    
    # Supabase
    SUPABASE_URL: str = ""
    SUPABASE_ANON_KEY: str = ""
    SUPABASE_SERVICE_ROLE_KEY: str = ""
    
    # Security
    JWT_SECRET: str = "antigravity_secret_key_32bytes_minimum_length_required"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    # AI / NVIDIA Nemotron Speech & LLM Config
    NVIDIA_API_KEY: str = ""
    NVIDIA_BASE_URL: str = "https://integrate.api.nvidia.com/v1"
    LLM_MODEL: str = "nvidia/nemotron-3.5-lightning-30b-a3b"
    GEMINI_API_KEY: str = ""

    # CORS
    CORS_ORIGINS: Union[str, List[str]] = ["http://localhost:5173", "http://localhost:3000"]

    # TTS Configuration
    TTS_PROVIDER: str = "gtts"
    TTS_VOICE: str = "default"
    OPENAI_API_KEY: str = ""
    ELEVENLABS_API_KEY: str = ""
    TTS_MAX_LENGTH: int = 4000
    TTS_TIMEOUT_SECONDS: int = 30
    
    # 3D Object Generator & AI/ML API Config
    AIMLAPI_KEY: str = ""
    AIMLAPI_BASE_URL: str = "https://api.aimlapi.com"
    DEFAULT_3D_ENGINE: str = "auto"
    ASSETS_3D_DIR: str = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "assets", "3d")

    # Limits & Parameters
    CHAT_RATE_LIMIT: str = "30/minute"
    SEARCH_RATE_LIMIT: str = "60/minute"
    MAX_CONTEXT_MESSAGES: int = 30
    MAX_CONTEXT_TOKENS: int = 16000
    LOG_LEVEL: str = "INFO"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def parse_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str):
            if v.startswith("[") and v.endswith("]"):
                import json
                try:
                    return json.loads(v)
                except Exception:
                    pass
            return [origin.strip() for origin in v.split(",") if origin.strip()]
        return v

settings = Settings()
