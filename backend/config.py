from pydantic_settings import BaseSettings
from functools import lru_cache

class Settings(BaseSettings):
    # LLM
    groq_api_key:    str = ""
    
    # DB
    database_url: str = "sqlite:///./gramai.db"

    # JWT
    secret_key:                   str = "change_this_secret_key_to_something_long_and_random"
    algorithm:                    str = "HS256"
    access_token_expire_minutes:  int = 10080  # 7 days

    # ChromaDB
    chroma_persist_dir: str = "./chroma_db"

    # External APIs
    openweather_api_key: str = ""
    google_maps_api_key: str = ""

    # App
    app_env:          str = "development"
    cors_origins:     str = "http://localhost:5173,http://localhost:3000,https://gramai-fend.vercel.app,https://gramai-fend.vercel.app/"
    max_upload_size_mb: int = 10

    # Voice
    whisper_model: str = "base"
    tts_engine:    str = "gtts"

    class Config:
        env_file = ".env"
        extra    = "ignore"

@lru_cache()
def get_settings() -> Settings:
    return Settings()
