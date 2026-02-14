"""Bookmarks and saved research — MongoDB implementation."""

import logging
import re
from datetime import datetime, timezone

from bson import ObjectId

from backend.core.database import get_db

logger = logging.getLogger(__name__)


async def add_bookmark(
    user_id: str,
    org_id: str,
    query: str,
    document_name: str,
    page: int | None,
    text: str,
    note: str = "",
    matter: str = "",
) -> dict:
    db = get_db()
    doc = {
        "user_id": user_id,
        "organization_id": org_id,
        "query": query,
        "document_name": document_name,
        "page": page,
        "text": text[:500],
        "note": note,
        "matter": matter,
        "created_at": datetime.now(timezone.utc),
    }
    result = await db.bookmarks.insert_one(doc)
    doc["id"] = str(result.inserted_id)
    doc["created_at"] = doc["created_at"].isoformat()
    return doc


async def get_bookmarks(org_id: str, matter: str | None = None) -> list[dict]:
    db = get_db()
    query: dict = {"organization_id": org_id}
    if matter:
        query["matter"] = {"$regex": f"^{re.escape(matter)}$", "$options": "i"}

    cursor = db.bookmarks.find(query).sort("created_at", -1)
    results = []
    async for doc in cursor:
        results.append({
            "id": str(doc["_id"]),
            "query": doc.get("query", ""),
            "document_name": doc["document_name"],
            "page": doc.get("page"),
            "text": doc["text"],
            "note": doc.get("note", ""),
            "matter": doc.get("matter", ""),
            "created_at": doc["created_at"].isoformat(),
        })
    return results


async def delete_bookmark(bookmark_id: str, org_id: str) -> bool:
    db = get_db()
    try:
        result = await db.bookmarks.delete_one({
            "_id": ObjectId(bookmark_id),
            "organization_id": org_id,
        })
        return result.deleted_count > 0
    except Exception as exc:
        logger.error("Failed to delete bookmark %s: %s", bookmark_id, exc)
        return False
