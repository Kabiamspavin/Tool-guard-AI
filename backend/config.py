import os
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()

class Settings(BaseModel):
    PROJECT_NAME: str = "ToolGuard AI - CNC Tool Wear Prediction"
    API_V1_STR: str = "/api"
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    SQLITE_URL: str = "sqlite:///./data/toolguard_py.db"
    MODEL_PATH: str = "./models/toolguard_xgb_model.pkl"
    FEATURE_CONFIG_PATH: str = "./models/feature_config.json"
    DEFAULT_LOW_THRESHOLD: float = 0.10
    DEFAULT_MEDIUM_THRESHOLD: float = 0.20
    DEFAULT_HIGH_THRESHOLD: float = 0.30

settings = Settings()
