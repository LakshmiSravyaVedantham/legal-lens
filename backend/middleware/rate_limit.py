"""Rate limiting setup using slowapi."""

from slowapi import Limiter
from slowapi.util import get_remote_address
from starlette.requests import Request


def _key_func(request: Request) -> str:
    """Rate-limit by authenticated user ID when available, else by IP."""
    # Authorization header is set by the auth middleware
    auth = request.headers.get("authorization", "")
    if auth.startswith("Bearer "):
        token = auth.split(" ", 1)[1]
        # Use first 16 chars of token as stable key (avoids decoding overhead)
        return f"user:{token[:16]}"
    return get_remote_address(request)


limiter = Limiter(key_func=_key_func)

# Rate limit constants
AUTH_LIMIT = "5/minute"
AI_LIMIT = "10/minute"
UPLOAD_LIMIT = "20/minute"
SEARCH_LIMIT = "30/minute"
