import os
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

load_dotenv()

class Settings(BaseSettings):
    PROJECT_NAME: str = "Why The Code Is Like This"
    GITHUB_TOKEN: str = os.getenv("GITHUB_TOKEN", "")
    
    
    NEO4J_URI: str = os.getenv("NEO4J_URI", "")
    NEO4J_USERNAME: str = os.getenv("NEO4J_USERNAME", "neo4j")
    NEO4J_PASSWORD: str = os.getenv("NEO4J_PASSWORD", "")
    
    
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")
    
    class Config:
        case_sensitive = True

settings = Settings()