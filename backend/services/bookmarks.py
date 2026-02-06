"""Bookmarks and saved research for legal research workflow."""
import json
import logging
from datetime import datetime
from pathlib import Path

from backend.config import PROCESSED_DIR

logger = logging.getLogger(__name__)

BOOKMARKS_FILE = PROCESSED_DIR / "bookmarks.json"


def _load() -> list[dict]:
    if BOOKMARKS_FILE.exists():
        return json.loads(BOOKMARKS_FILE.read_text())
    return []


def _save(data: list[dict]):
    BOOKMARKS_FILE.write_text(json.dumps(data, indent=2, default=str))


def add_bookmark(
    query: str,
    document_name: str,
    page: int | None,
    text: str,
    note: str = "",
    matter: str = "",
) -> dict:
    bookmarks = _load()
    entry = {
        "id": len(bookmarks) + 1,
        "query": query,
        "document_name": document_name,
        "page": page,
        "text": text[:500],
        "note": note,
        "matter": matter,
        "created_at": datetime.utcnow().isoformat(),
    }
    bookmarks.insert(0, entry)
    _save(bookmarks)
    return entry


def get_bookmarks(matter: str | None = None) -> list[dict]:
    bookmarks = _load()
    if matter:
        bookmarks = [b for b in bookmarks if b.get("matter", "").lower() == matter.lower()]
    return bookmarks


def delete_bookmark(bookmark_id: int) -> bool:
    bookmarks = _load()
    before = len(bookmarks)
    bookmarks = [b for b in bookmarks if b.get("id") != bookmark_id]
    _save(bookmarks)
    return len(bookmarks) < before
