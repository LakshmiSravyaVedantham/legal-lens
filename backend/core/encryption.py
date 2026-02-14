"""Fernet encryption for storing API keys in MongoDB."""

import logging
from cryptography.fernet import Fernet, InvalidToken

from backend.core.settings import get_settings

logger = logging.getLogger(__name__)


def _get_fernet() -> Fernet | None:
    key = get_settings().encryption_key
    if not key or key == "change-me-generate-with-fernet":
        return None
    try:
        return Fernet(key.encode() if isinstance(key, str) else key)
    except Exception:
        logger.warning("Invalid ENCRYPTION_KEY — API key encryption disabled")
        return None


def encrypt(value: str) -> str:
    """Encrypt a string. Returns plaintext if no encryption key configured."""
    f = _get_fernet()
    if f is None:
        return value
    return f.encrypt(value.encode()).decode()


def decrypt(value: str) -> str:
    """Decrypt a string. Returns as-is if no encryption key or decryption fails."""
    f = _get_fernet()
    if f is None:
        return value
    try:
        return f.decrypt(value.encode()).decode()
    except InvalidToken:
        return value
