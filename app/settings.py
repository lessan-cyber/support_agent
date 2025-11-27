from pydantic import Field, PostgresDsn
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    DATABASE_URL: PostgresDsn = Field(..., alias="DATABASE_URL")
    DEBUG: bool = Field(..., alias="DEBUG")
    TEST_URL: PostgresDsn = Field(..., alias="TEST_URL")
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()
