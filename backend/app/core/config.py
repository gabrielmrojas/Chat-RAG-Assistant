"""
Core configuration settings for the Chat RAG application.
"""
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import field_validator
import os
from pathlib import Path


class Settings(BaseSettings):
    """Application settings with environment variable support."""
    
    # Database
    database_url: str = "postgresql://username:password@localhost:5432/chatrag_db"
    
    # OpenAI
    openai_api_key: str
    # LLM configuration
    llm_model: str = "gpt-3.5-turbo"
    llm_temperature: float = 0.7
    llm_max_tokens: int = 1000
    
    # Vector Database
    chroma_persist_directory: str = "./chroma_db"
    embedding_model: str = "text-embedding-ada-002"
    
    # Security
    secret_key: str
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    
    # File Storage
    upload_dir: str = "./uploads"
    max_file_size: int = 5242880  # 5MB (5 * 1024 * 1024)
    
    # CORS
    allowed_origins: List[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
    ]
    
    # Development
    debug: bool = True
    log_level: str = "INFO"
    
    # Error Logging
    error_logging: int = 1  # 1 = local file, 2 = Sentry
    error_log_dir: str = "./logs"
    sentry_dsn: str = ""
    
    # API
    api_v1_str: str = "/api/v1"
    project_name: str = "Chat RAG Assistant"
    port: int = 8000
    
    @field_validator("allowed_origins", mode="before")
    def assemble_cors_origins(cls, v):
        if isinstance(v, str):
            return [i.strip() for i in v.split(",")]
        return v
    
    @field_validator("upload_dir")
    def create_upload_dir(cls, v):
        """Create upload directory if it doesn't exist."""
        Path(v).mkdir(parents=True, exist_ok=True)
        return v
    
    @field_validator("chroma_persist_directory")
    def create_chroma_dir(cls, v):
        """Create Chroma directory if it doesn't exist."""
        Path(v).mkdir(parents=True, exist_ok=True)
        return v
    
    @field_validator("error_log_dir")
    def create_error_log_dir(cls, v):
        """Create error log directory if it doesn't exist."""
        Path(v).mkdir(parents=True, exist_ok=True)
        return v
    
    # Pydantic v2 settings config
    model_config = SettingsConfigDict(
        env_file=".env",
    )


# Global settings instance
settings = Settings()
