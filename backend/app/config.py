from pydantic_settings import BaseSettings
from pathlib import Path

class Settings(BaseSettings):
    # Neo4j
    NEO4J_URI: str = "bolt://localhost:7687"
    NEO4J_USER: str = "neo4j"
    NEO4J_PASSWORD: str = "iknow_you_local"

    # SQLite
    SQLITE_PATH: str = "./data/iknow_you.db"

    # Ollama
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    OLLAMA_MODEL: str = "mistral:7b-instruct-q4_K_M"

    # Embeddings
    EMBEDDING_MODEL: str = "sentence-transformers/all-MiniLM-L6-v2"
    EMBEDDING_DIM: int = 384

    # Whisper — default tiny (~250MB). Upgrade to base/small only if RAM allows.
    WHISPER_MODEL: str = "tiny"

    # Encryption
    SECRET_KEY_PATH: str = "./data/secret.key"

    # App
    DEBUG: bool = False
    DATA_DIR: Path = Path("./data")

    class Config:
        env_file = ".env"

settings = Settings()
