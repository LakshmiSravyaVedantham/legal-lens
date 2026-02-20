"""Centralized environment-based configuration using pydantic-settings."""

from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # ─── Paths ───
    base_dir: Path = Path(__file__).resolve().parent.parent
    data_dir: Path = base_dir / "data"
    uploads_dir: Path = data_dir / "uploads"
    processed_dir: Path = data_dir / "processed"

    # ─── MongoDB ───
    mongo_uri: str = "mongodb://legallens:legallens@localhost:27017/legallens?authSource=admin"
    mongo_db_name: str = "legallens"

    # ─── ChromaDB ───
    chroma_host: str = ""
    chroma_port: int = 8100
    chroma_collection_name: str = "legal_documents"

    # ─── Embedding ───
    embedding_model_name: str = "all-MiniLM-L6-v2"

    # ─── Ollama ───
    ollama_base_url: str = "http://localhost:11434"
    ollama_model: str = "llama3.1:8b"
    ollama_timeout: float = 120.0

    # ─── JWT ───
    jwt_secret_key: str = "change-me-to-a-random-secret-at-least-32-chars"
    jwt_algorithm: str = "HS256"
    jwt_access_token_expire_minutes: int = 60
    jwt_refresh_token_expire_days: int = 7

    # ─── Encryption ───
    encryption_key: str = ""

    # ─── LLM API keys (optional, can also be set per-org in DB) ───
    anthropic_api_key: str = ""
    openai_api_key: str = ""
    azure_openai_api_key: str = ""
    azure_openai_endpoint: str = ""
    azure_openai_deployment: str = ""

    # ─── Chunking ───
    chunk_size_words: int = 200
    chunk_overlap_words: int = 50

    # ─── Upload ───
    allowed_extensions: set[str] = {".pdf", ".docx", ".txt"}
    max_file_size_mb: int = 50

    # ─── Search ───
    default_search_results: int = 10
    max_search_results: int = 50

    # ─── Observability ───
    log_format: str = "json"
    log_level: str = "INFO"
    app_version: str = "2.0.0"

    # ─── CORS ───
    cors_origins: list[str] = ["http://localhost:5173", "http://localhost:80"]

    # ─── Rate Limiting ───
    max_ai_analyses_per_org_per_day: int = 100

    @property
    def use_chroma_http(self) -> bool:
        """True when CHROMA_HOST is set (i.e. Docker/HTTP mode)."""
        return bool(self.chroma_host)


@lru_cache
def get_settings() -> Settings:
    import logging
    _logger = logging.getLogger(__name__)

    s = Settings()
    # Ensure local data dirs exist (no-op in Docker where volumes are mounted)
    for d in [s.uploads_dir, s.processed_dir]:
        d.mkdir(parents=True, exist_ok=True)

    if s.jwt_secret_key == "change-me-to-a-random-secret-at-least-32-chars":
        _logger.warning("JWT secret is the default placeholder — set JWT_SECRET_KEY to a strong random value")
    if not s.encryption_key:
        _logger.warning("ENCRYPTION_KEY is empty — encrypted fields will not be protected")

    return s
