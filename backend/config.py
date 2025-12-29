"""
Configuration module with environment variable loading and graceful fallbacks.
"""
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

class Config:
    """Application configuration with graceful fallbacks."""
    
    # Required for AI features
    GOOGLE_API_KEY: str = os.getenv("GOOGLE_API_KEY", "")
    
    # Optional - Neo4j configuration (for future scaling)
    NEO4J_URI: str = os.getenv("NEO4J_URI", "bolt://localhost:7687")
    NEO4J_USERNAME: str = os.getenv("NEO4J_USERNAME", "neo4j")
    NEO4J_PASSWORD: str = os.getenv("NEO4J_PASSWORD", "password")
    
    # Application settings
    DEBUG: bool = os.getenv("DEBUG", "true").lower() == "true"
    CORS_ORIGINS: list = ["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173"]
    
    @classmethod
    def has_gemini_key(cls) -> bool:
        """Check if Gemini API key is configured."""
        return bool(cls.GOOGLE_API_KEY and cls.GOOGLE_API_KEY != "")
    
    @classmethod
    def validate(cls) -> dict:
        """Validate configuration and return status."""
        return {
            "gemini_configured": cls.has_gemini_key(),
            "neo4j_configured": cls.NEO4J_URI != "bolt://localhost:7687",
            "debug_mode": cls.DEBUG
        }

config = Config()
