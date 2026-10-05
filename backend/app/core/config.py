import os
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    PROJECT_NAME: str = "AI-Powered Smart Product Lifecycle Assistant"
    API_V1_STR: str = "/api"
    SECRET_KEY: str = "supersecret_jwt_key_change_in_production_environment_12345"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours

    MONGODB_URL: str = "mongodb://localhost:27017"
    DATABASE_NAME: str = "product_lifecycle_db"
    
    TESSERACT_CMD: str | None = None

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

settings = Settings()
