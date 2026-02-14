"""Async MongoDB connection via Motor."""

import logging
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase

logger = logging.getLogger(__name__)

_client: AsyncIOMotorClient | None = None
_db: AsyncIOMotorDatabase | None = None


async def connect_db(uri: str, db_name: str) -> AsyncIOMotorDatabase:
    """Open MongoDB connection and return the database handle."""
    global _client, _db
    _client = AsyncIOMotorClient(uri)
    _db = _client[db_name]

    # Verify connectivity
    await _client.admin.command("ping")
    logger.info(f"Connected to MongoDB database '{db_name}'")

    # Ensure indexes (idempotent)
    await _ensure_indexes(_db)
    return _db


async def close_db():
    """Close MongoDB connection."""
    global _client, _db
    if _client:
        _client.close()
        _client = None
        _db = None
        logger.info("MongoDB connection closed")


def get_db() -> AsyncIOMotorDatabase:
    """Return the active database handle. Call after connect_db()."""
    if _db is None:
        raise RuntimeError("Database not connected. Call connect_db() first.")
    return _db


async def _ensure_indexes(db: AsyncIOMotorDatabase):
    """Create indexes if they don't exist."""
    # Users
    await db.users.create_index("email", unique=True)
    await db.users.create_index("organization_id")

    # Organizations
    await db.organizations.create_index("slug", unique=True)

    # Documents
    await db.documents.create_index("document_id", unique=True)
    await db.documents.create_index([("organization_id", 1), ("status", 1)])

    # Bookmarks
    await db.bookmarks.create_index([("user_id", 1), ("organization_id", 1)])

    # Activity (TTL: 90 days)
    await db.activity.create_index("created_at", expireAfterSeconds=90 * 24 * 3600)
    await db.activity.create_index("organization_id")

    # Search history (TTL: 90 days)
    await db.search_history.create_index("created_at", expireAfterSeconds=90 * 24 * 3600)
    await db.search_history.create_index("organization_id")

    # LLM configs
    await db.llm_configs.create_index("organization_id", unique=True)

    # AI analyses (cached results)
    await db.ai_analyses.create_index(
        [("document_id", 1), ("analysis_type", 1), ("organization_id", 1)],
        unique=True,
    )

    # Audit log (TTL: 365 days)
    await db.audit_log.create_index("created_at", expireAfterSeconds=365 * 24 * 3600)
    await db.audit_log.create_index([("organization_id", 1), ("action", 1)])
    await db.audit_log.create_index([("organization_id", 1), ("resource_type", 1)])

    logger.info("MongoDB indexes ensured")
