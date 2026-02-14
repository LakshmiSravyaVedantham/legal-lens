"""Activity, search history, and audit trail tracking via MongoDB."""

import logging
from datetime import datetime, timezone
from typing import Any

from backend.core.database import get_db

logger = logging.getLogger(__name__)


async def log_activity(org_id: str, user_id: str, action: str, detail: str):
    db = get_db()
    await db.activity.insert_one({
        "organization_id": org_id,
        "user_id": user_id,
        "action": action,
        "detail": detail,
        "created_at": datetime.now(timezone.utc),
    })


async def log_search(org_id: str, user_id: str, query: str, result_count: int):
    db = get_db()
    await db.search_history.insert_one({
        "organization_id": org_id,
        "user_id": user_id,
        "query": query,
        "result_count": result_count,
        "created_at": datetime.now(timezone.utc),
    })


async def get_recent_searches(org_id: str, limit: int = 10) -> list[dict]:
    db = get_db()
    cursor = db.search_history.find(
        {"organization_id": org_id},
    ).sort("created_at", -1).limit(limit)
    results = []
    async for doc in cursor:
        results.append({
            "query": doc["query"],
            "result_count": doc["result_count"],
            "timestamp": doc["created_at"].isoformat(),
        })
    return results


async def get_activity_log(org_id: str, limit: int = 20) -> list[dict]:
    db = get_db()
    cursor = db.activity.find(
        {"organization_id": org_id},
    ).sort("created_at", -1).limit(limit)
    results = []
    async for doc in cursor:
        results.append({
            "action": doc["action"],
            "detail": doc["detail"],
            "timestamp": doc["created_at"].isoformat(),
        })
    return results


async def get_search_analytics(org_id: str) -> dict:
    db = get_db()
    pipeline = [
        {"$match": {"organization_id": org_id}},
        {"$group": {
            "_id": {"$toLower": {"$trim": {"input": "$query"}}},
            "count": {"$sum": 1},
            "avg_results": {"$avg": "$result_count"},
        }},
        {"$sort": {"count": -1}},
        {"$limit": 10},
    ]
    top_queries = []
    async for doc in db.search_history.aggregate(pipeline):
        top_queries.append({"query": doc["_id"], "count": doc["count"]})

    total = await db.search_history.count_documents({"organization_id": org_id})

    # Average results per search
    avg_pipeline = [
        {"$match": {"organization_id": org_id}},
        {"$group": {"_id": None, "avg": {"$avg": "$result_count"}}},
    ]
    avg_results = 0
    async for doc in db.search_history.aggregate(avg_pipeline):
        avg_results = round(doc["avg"], 1)

    return {
        "total_searches": total,
        "average_results": avg_results,
        "top_queries": top_queries,
    }


# ---------------------------------------------------------------------------
# Audit Trail
# ---------------------------------------------------------------------------

async def log_audit_event(
    org_id: str,
    user_id: str,
    action: str,
    resource_type: str = "",
    resource_id: str = "",
    detail: str = "",
    metadata: dict[str, Any] | None = None,
    ip_address: str = "",
) -> None:
    """Write an immutable audit log entry."""
    db = get_db()
    await db.audit_log.insert_one({
        "organization_id": org_id,
        "user_id": user_id,
        "action": action,
        "resource_type": resource_type,
        "resource_id": resource_id,
        "detail": detail,
        "metadata": metadata or {},
        "ip_address": ip_address,
        "created_at": datetime.now(timezone.utc),
    })


async def get_audit_log(
    org_id: str,
    action: str | None = None,
    resource_type: str | None = None,
    user_id: str | None = None,
    skip: int = 0,
    limit: int = 50,
) -> tuple[list[dict], int]:
    """Query the audit log with optional filters. Returns (events, total)."""
    db = get_db()
    query: dict[str, Any] = {"organization_id": org_id}
    if action:
        query["action"] = action
    if resource_type:
        query["resource_type"] = resource_type
    if user_id:
        query["user_id"] = user_id

    total = await db.audit_log.count_documents(query)
    cursor = db.audit_log.find(query).sort("created_at", -1).skip(skip).limit(limit)

    events = []
    async for doc in cursor:
        events.append({
            "id": str(doc["_id"]),
            "action": doc["action"],
            "resource_type": doc.get("resource_type", ""),
            "resource_id": doc.get("resource_id", ""),
            "user_id": doc["user_id"],
            "detail": doc.get("detail", ""),
            "metadata": doc.get("metadata", {}),
            "ip_address": doc.get("ip_address", ""),
            "timestamp": doc["created_at"].isoformat(),
        })
    return events, total


async def get_audit_summary(org_id: str, days: int = 30) -> list[dict]:
    """30-day aggregate of audit events by action type."""
    db = get_db()
    cutoff = datetime.now(timezone.utc).replace(
        hour=0, minute=0, second=0, microsecond=0,
    )
    from datetime import timedelta
    cutoff = cutoff - timedelta(days=days)

    pipeline = [
        {"$match": {"organization_id": org_id, "created_at": {"$gte": cutoff}}},
        {"$group": {"_id": "$action", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
    ]
    results = []
    async for doc in db.audit_log.aggregate(pipeline):
        results.append({"action": doc["_id"], "count": doc["count"]})
    return results
