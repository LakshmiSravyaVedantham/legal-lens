import logging
from pathlib import Path

from fastapi import APIRouter, Depends

from backend.core.settings import get_settings
from backend.services.activity import (
    get_recent_searches,
    get_activity_log,
    get_search_analytics,
)
from backend.middleware.auth import get_current_user, require_role
from backend.models.user import Role

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
async def get_analytics(user: dict = Depends(require_role(Role.LAWYER))):
    settings = get_settings()
    org_id = user["organization_id"]
    search_analytics = await get_search_analytics(org_id)
    return {
        "search": search_analytics,
        "storage": {
            "uploads_bytes": _dir_size(settings.uploads_dir),
            "index_bytes": 0,  # ChromaDB HTTP mode has no local index
        },
    }


@router.get("/analytics/recent-searches")
async def recent_searches(limit: int = 10, user: dict = Depends(get_current_user)):
    return {"searches": await get_recent_searches(user["organization_id"], limit)}


@router.get("/analytics/activity")
async def activity_log(limit: int = 20, user: dict = Depends(get_current_user)):
    return {"activity": await get_activity_log(user["organization_id"], limit)}


@router.get("/system-info")
async def system_info(user: dict = Depends(get_current_user)):
    import platform
    import sys

    settings = get_settings()
    return {
        "python_version": sys.version,
        "platform": platform.platform(),
        "machine": platform.machine(),
        "uploads_dir": str(settings.uploads_dir),
        "index_dir": "ChromaDB HTTP",
        "uploads_size": _dir_size(settings.uploads_dir),
        "index_size": 0,
    }
