"""Health check endpoints."""

import logging
import time

from fastapi import APIRouter

from backend.core.settings import get_settings

logger = logging.getLogger(__name__)
router = APIRouter(tags=["health"])

_start_time = time.time()


@router.get("/health")
async def health():
    settings = get_settings()
    return {
        "status": "ok",
        "service": "LegalLens",
        "version": settings.app_version,
        "uptime_seconds": round(time.time() - _start_time, 1),
    }


@router.get("/health/detailed")
async def health_detailed():
    settings = get_settings()
    checks = {}

    # MongoDB
    try:
        from backend.core.database import get_db
        db = get_db()
        await db.command("ping")
        checks["mongodb"] = {"status": "ok"}
    except Exception as e:
        checks["mongodb"] = {"status": "error", "detail": str(e)}

    # ChromaDB
    try:
        from backend.services.vector_store import get_total_chunks
        count = get_total_chunks()
        checks["chromadb"] = {"status": "ok", "chunks": count}
    except Exception as e:
        checks["chromadb"] = {"status": "error", "detail": str(e)}

    # Embeddings
    try:
        from backend.services.embeddings import embed_query
        embed_query("test")
        checks["embeddings"] = {"status": "ok"}
    except Exception as e:
        checks["embeddings"] = {"status": "error", "detail": str(e)}

    # Ollama (optional)
    try:
        from backend.services.ollama_client import check_ollama_health
        ok = await check_ollama_health()
        checks["ollama"] = {"status": "ok" if ok else "unavailable"}
    except Exception:
        checks["ollama"] = {"status": "unavailable"}

    all_ok = all(
        c["status"] == "ok"
        for name, c in checks.items()
        if name != "ollama"  # Ollama is optional
    )

    return {
        "status": "ok" if all_ok else "degraded",
        "version": settings.app_version,
        "uptime_seconds": round(time.time() - _start_time, 1),
        "checks": checks,
    }
