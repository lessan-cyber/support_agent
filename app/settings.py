from pydantic import Field, PostgresDsn, RedisDsn
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    DATABASE_URL: PostgresDsn = Field(..., alias="DATABASE_URL")
    DEBUG: bool = Field(..., alias="DEBUG")
    TEST_URL: PostgresDsn = Field(
        ..., alias="TEST_URL"
    )  # this is a non root user just for testing RLS policies
    REDIS_URL: RedisDsn = Field(..., alias="REDIS_URL")
    SUPABASE_URL: str = Field(..., alias="SUPABASE_URL")
    SUPABASE_ANON_KEY: str = Field(..., alias="SUPABASE_ANON_KEY")
    KNOWLEDGE_BASE_BUCKET: str = Field(..., alias="KNOWLEDGE_BASE_BUCKET")
    SUPABASE_JWT_SECRET: str = Field(..., alias="SUPABASE_JWT_SECRET")
    SUPABASE_SERVICE_KEY: str = Field(..., alias="SUPABASE_SERVICE_KEY")
    TRANSACTION_CONNECTION: str = Field(
        ..., alias="TRANSACTION_CONNECTION"
    )  # will be used only for celery tasks
    GOOGLE_API_KEY: str = Field(..., alias="GOOGLE_API_KEY")
    CHAT_SESSION_EXPIRE_HOURS: int = Field(
        default=24, alias="CHAT_SESSION_EXPIRE_HOURS"
    )
    
    # Agent Configuration
    MAX_RETRIEVED_DOCS: int = Field(default=4, alias="MAX_RETRIEVED_DOCS")
    MAX_CHAT_HISTORY: int = Field(default=10, alias="MAX_CHAT_HISTORY")
    
    # Cache Configuration
    CACHE_SIMILARITY_THRESHOLD: float = Field(default=0.9, alias="CACHE_SIMILARITY_THRESHOLD")
    CACHE_TTL_SECONDS: int = Field(default=604800, alias="CACHE_TTL_SECONDS")  # 7 days

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()
