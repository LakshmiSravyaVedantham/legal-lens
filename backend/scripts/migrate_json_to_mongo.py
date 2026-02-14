"""One-time migration: JSON file data → MongoDB.

Usage: python -m backend.scripts.migrate_json_to_mongo
"""

import asyncio
import json
import logging
from pathlib import Path
from datetime import datetime, timezone

from motor.motor_asyncio import AsyncIOMotorClient

from backend.core.settings import get_settings

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


async def main():
    settings = get_settings()
    client = AsyncIOMotorClient(settings.mongo_uri)
    db = client[settings.mongo_db_name]

    processed_dir = settings.processed_dir

    # We need an org_id for migrated data — use a default migration org
    DEFAULT_ORG_ID = "migrated"
    DEFAULT_USER_ID = "migrated"

    # 1. Migrate documents.json
    docs_file = processed_dir / "documents.json"
    if docs_file.exists():
        docs = json.loads(docs_file.read_text())
        count = 0
        for doc_id, meta in docs.items():
            exists = await db.documents.find_one({"document_id": doc_id})
            if exists:
                continue
            record = {
                "document_id": doc_id,
                "organization_id": DEFAULT_ORG_ID,
                "filename": meta["filename"],
                "file_type": meta["file_type"],
                "file_size": meta["file_size"],
                "page_count": meta.get("page_count"),
                "chunk_count": meta.get("chunk_count", 0),
                "status": meta["status"],
                "error_message": meta.get("error_message"),
                "uploaded_at": datetime.fromisoformat(meta["uploaded_at"]) if meta.get("uploaded_at") else datetime.now(timezone.utc),
                "processed_at": datetime.fromisoformat(meta["processed_at"]) if meta.get("processed_at") else None,
                "uploaded_by": DEFAULT_USER_ID,
                "matter": "",
                "client": "",
                "tags": [],
            }
            await db.documents.insert_one(record)
            count += 1
        logger.info(f"Migrated {count} documents")
    else:
        logger.info("No documents.json found — skipping")

    # 2. Migrate bookmarks.json
    bookmarks_file = processed_dir / "bookmarks.json"
    if bookmarks_file.exists():
        bookmarks = json.loads(bookmarks_file.read_text())
        count = 0
        for bm in bookmarks:
            await db.bookmarks.insert_one({
                "user_id": DEFAULT_USER_ID,
                "organization_id": DEFAULT_ORG_ID,
                "query": bm.get("query", ""),
                "document_name": bm["document_name"],
                "page": bm.get("page"),
                "text": bm["text"],
                "note": bm.get("note", ""),
                "matter": bm.get("matter", ""),
                "created_at": datetime.fromisoformat(bm["created_at"]) if bm.get("created_at") else datetime.now(timezone.utc),
            })
            count += 1
        logger.info(f"Migrated {count} bookmarks")
    else:
        logger.info("No bookmarks.json found — skipping")

    # 3. Migrate activity.json
    activity_file = processed_dir / "activity.json"
    if activity_file.exists():
        data = json.loads(activity_file.read_text())
        count = 0
        for entry in data.get("activity_log", []):
            await db.activity.insert_one({
                "organization_id": DEFAULT_ORG_ID,
                "user_id": DEFAULT_USER_ID,
                "action": entry["action"],
                "detail": entry["detail"],
                "created_at": datetime.fromisoformat(entry["timestamp"]) if entry.get("timestamp") else datetime.now(timezone.utc),
            })
            count += 1

        for entry in data.get("recent_searches", []):
            await db.search_history.insert_one({
                "organization_id": DEFAULT_ORG_ID,
                "user_id": DEFAULT_USER_ID,
                "query": entry["query"],
                "result_count": entry["result_count"],
                "created_at": datetime.fromisoformat(entry["timestamp"]) if entry.get("timestamp") else datetime.now(timezone.utc),
            })
        logger.info(f"Migrated {count} activity entries + {len(data.get('recent_searches', []))} search entries")
    else:
        logger.info("No activity.json found — skipping")

    # 4. Migrate document_tags.json
    tags_file = processed_dir / "document_tags.json"
    if tags_file.exists():
        tags = json.loads(tags_file.read_text())
        count = 0
        for doc_id, tag_data in tags.items():
            await db.documents.update_one(
                {"document_id": doc_id},
                {"$set": {
                    "matter": tag_data.get("matter", ""),
                    "client": tag_data.get("client", ""),
                    "tags": tag_data.get("tags", []),
                }},
            )
            count += 1
        logger.info(f"Migrated tags for {count} documents")
    else:
        logger.info("No document_tags.json found — skipping")

    client.close()
    logger.info("Migration complete!")


if __name__ == "__main__":
    asyncio.run(main())
