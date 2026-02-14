"""Shared fixtures for backend tests."""

import asyncio
from datetime import datetime, timezone
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from httpx import ASGITransport, AsyncClient

from backend.models.user import Role


# ---------------------------------------------------------------------------
# Test user data
# ---------------------------------------------------------------------------
TEST_USER = {
    "id": "000000000000000000000001",
    "email": "test@example.com",
    "full_name": "Test User",
    "role": Role.ADMIN,
    "organization_id": "000000000000000000000099",
}


# ---------------------------------------------------------------------------
# Mock MongoDB collections
# ---------------------------------------------------------------------------

def _make_async_cursor(items: list):
    """Create an async iterable mock cursor."""
    class _Cursor:
        def __init__(self, data):
            self._data = list(data)

        def sort(self, *a, **kw):
            return self

        def limit(self, *a, **kw):
            return self

        def skip(self, *a, **kw):
            return self

        def __aiter__(self):
            return self

        async def __anext__(self):
            if not self._data:
                raise StopAsyncIteration
            return self._data.pop(0)

    return _Cursor(items)


def _build_mock_db():
    """Build a MagicMock mimicking Motor's async database."""
    db = MagicMock()

    # Default: every find returns empty cursor
    for coll_name in [
        "users", "organizations", "documents", "bookmarks",
        "activity", "search_history", "llm_configs", "ai_analyses",
        "audit_log",
    ]:
        coll = MagicMock()
        coll.find = MagicMock(return_value=_make_async_cursor([]))
        coll.find_one = AsyncMock(return_value=None)
        coll.insert_one = AsyncMock(return_value=MagicMock(inserted_id="mock-id"))
        coll.update_one = AsyncMock(return_value=MagicMock(matched_count=1, modified_count=1))
        coll.delete_one = AsyncMock(return_value=MagicMock(deleted_count=1))
        coll.delete_many = AsyncMock(return_value=MagicMock(deleted_count=0))
        coll.count_documents = AsyncMock(return_value=0)
        coll.aggregate = MagicMock(return_value=_make_async_cursor([]))
        coll.create_index = AsyncMock()
        setattr(db, coll_name, coll)

    db.command = AsyncMock(return_value={"ok": 1})
    return db


@pytest.fixture
def mock_db():
    return _build_mock_db()


# ---------------------------------------------------------------------------
# Override auth dependency
# ---------------------------------------------------------------------------

def _override_auth():
    """Return a dependency that always resolves to TEST_USER."""
    async def _fake_user():
        return dict(TEST_USER)
    return _fake_user


# ---------------------------------------------------------------------------
# Authenticated async client
# ---------------------------------------------------------------------------

@pytest.fixture
async def client(mock_db):
    """AsyncClient with mocked DB and bypassed auth."""
    from backend.middleware.auth import get_current_user
    from backend.main import app

    # Override auth
    app.dependency_overrides[get_current_user] = _override_auth()

    # Patch database layer
    with (
        patch("backend.core.database.get_db", return_value=mock_db),
        patch("backend.core.database._db", mock_db),
        patch("backend.core.database.connect_db", new_callable=AsyncMock, return_value=mock_db),
        patch("backend.core.database.close_db", new_callable=AsyncMock),
        patch("backend.services.embeddings.load_model"),
    ):
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as ac:
            yield ac

    app.dependency_overrides.clear()


# ---------------------------------------------------------------------------
# Unauthenticated client (for testing auth flow itself)
# ---------------------------------------------------------------------------

@pytest.fixture
async def client_no_auth(mock_db):
    """AsyncClient with mocked DB but real auth flow."""
    from backend.main import app

    with (
        patch("backend.core.database.get_db", return_value=mock_db),
        patch("backend.core.database._db", mock_db),
        patch("backend.core.database.connect_db", new_callable=AsyncMock, return_value=mock_db),
        patch("backend.core.database.close_db", new_callable=AsyncMock),
        patch("backend.services.embeddings.load_model"),
    ):
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as ac:
            yield ac

    app.dependency_overrides.clear()
