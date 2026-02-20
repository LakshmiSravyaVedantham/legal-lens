"""Tracks recent searches and activity for analytics."""
import json
import logging
from datetime import datetime

from backend.config import PROCESSED_DIR

logger = logging.getLogger(__name__)

ACTIVITY_FILE = PROCESSED_DIR / "activity.json"
MAX_RECENT_SEARCHES = 50
MAX_ACTIVITY = 100


def _load_data() -> dict:
    if ACTIVITY_FILE.exists():
        return json.loads(ACTIVITY_FILE.read_text())
    return {"recent_searches": [], "activity_log": []}


def _save_data(data: dict):
    ACTIVITY_FILE.write_text(json.dumps(data, indent=2, default=str))


def log_search(query: str, result_count: int):
    data = _load_data()
    entry = {
        "query": query,
        "result_count": result_count,
        "timestamp": datetime.utcnow().isoformat(),
    }
    data["recent_searches"].insert(0, entry)
    data["recent_searches"] = data["recent_searches"][:MAX_RECENT_SEARCHES]
    _save_data(data)


def log_activity(action: str, detail: str):
    data = _load_data()
    entry = {
        "action": action,
        "detail": detail,
        "timestamp": datetime.utcnow().isoformat(),
    }
    data["activity_log"].insert(0, entry)
    data["activity_log"] = data["activity_log"][:MAX_ACTIVITY]
    _save_data(data)


def get_recent_searches(limit: int = 10) -> list[dict]:
    data = _load_data()
    return data["recent_searches"][:limit]


def get_activity_log(limit: int = 20) -> list[dict]:
    data = _load_data()
    return data["activity_log"][:limit]


def get_search_analytics() -> dict:
    data = _load_data()
    searches = data["recent_searches"]
    total = len(searches)
    # Top queries
    query_counts: dict[str, int] = {}
    for s in searches:
        q = s["query"].lower().strip()
        query_counts[q] = query_counts.get(q, 0) + 1
    top_queries = sorted(query_counts.items(), key=lambda x: x[1], reverse=True)[:10]
    # Avg results
    avg_results = sum(s["result_count"] for s in searches) / total if total else 0
    return {
        "total_searches": total,
        "average_results": round(avg_results, 1),
        "top_queries": [{"query": q, "count": c} for q, c in top_queries],
    }
