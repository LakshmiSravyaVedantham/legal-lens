import os
import logging
from pathlib import Path

from fastapi import APIRouter

from backend.config import UPLOADS_DIR, CHROMA_DIR
from backend.services.activity_tracker import (
    get_recent_searches,
    get_activity_log,
    get_search_analytics,
)

logger = logging.getLogger(__name__)
router = APIRouter(tags=["analytics"])


def _dir_size(path: Path) -> int:
    total = 0
    if path.exists():
        for f in path.rglob("*"):
            if f.is_file():
                total += f.stat().st_size
    return total


@router.get("/analytics")
async def get_analytics():
    search_analytics = get_search_analytics()
    return {
        "search": search_analytics,
        "storage": {
            "uploads_bytes": _dir_size(UPLOADS_DIR),
            "index_bytes": _dir_size(CHROMA_DIR),
        },
    }


@router.get("/analytics/recent-searches")
async def recent_searches(limit: int = 10):
    return {"searches": get_recent_searches(limit)}


@router.get("/analytics/activity")
async def activity_log(limit: int = 20):
    return {"activity": get_activity_log(limit)}


@router.get("/system-info")
async def system_info():
    import platform
    import sys

    return {
        "python_version": sys.version,
        "platform": platform.platform(),
        "machine": platform.machine(),
        "uploads_dir": str(UPLOADS_DIR),
        "index_dir": str(CHROMA_DIR),
        "uploads_size": _dir_size(UPLOADS_DIR),
        "index_size": _dir_size(CHROMA_DIR),
    }
