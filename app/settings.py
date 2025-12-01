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
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()
