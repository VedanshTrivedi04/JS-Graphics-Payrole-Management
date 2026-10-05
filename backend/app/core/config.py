import os
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional

class Settings(BaseSettings):
    PROJECT_NAME: str = "Identix Biometric Attendance & Payroll System"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = "supersecret_identix_jwt_key_please_change_in_production_998877"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days

    DATABASE_URL: str = "postgresql://neondb_owner:npg_2VwgKF3qdYQk@ep-wandering-hat-b35rrgsu-pooler.c-4.ap-southeast-1.aws.neon.tech/neondb?sslmode=require"

    DEFAULT_ORGANIZATION_NAME: str = "Retail Store & Enterprise"
    DEFAULT_TIMEZONE: str = "Asia/Kolkata"
    DEFAULT_CURRENCY_SYMBOL: str = "₹"

    @property
    def SQLALCHEMY_DATABASE_URI(self) -> str:
        url = self.DATABASE_URL
        if url.startswith("postgresql://"):
            url = url.replace("postgresql://", "postgresql+psycopg2://", 1)
        return url

    model_config = SettingsConfigDict(
        env_file=os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), ".env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()
