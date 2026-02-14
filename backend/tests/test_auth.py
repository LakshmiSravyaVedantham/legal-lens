"""Tests for authentication endpoints."""

import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from datetime import datetime, timezone

from bson import ObjectId


async def test_register_success(client_no_auth, mock_db):
    """Register creates user + org and returns tokens."""
    mock_db.users.find_one = AsyncMock(return_value=None)
    mock_db.organizations.find_one = AsyncMock(return_value=None)

    res = await client_no_auth.post("/api/auth/register", json={
        "email": "new@example.com",
        "password": "securepass123",
        "full_name": "New User",
        "organization_name": "Test Org",
    })
    assert res.status_code == 200
    data = res.json()
    assert "user" in data
    assert "tokens" in data
    assert data["user"]["email"] == "new@example.com"
    assert data["tokens"]["access_token"]


async def test_register_duplicate_email(client_no_auth, mock_db):
    """Duplicate email returns 400."""
    mock_db.users.find_one = AsyncMock(return_value={"email": "dup@example.com"})

    res = await client_no_auth.post("/api/auth/register", json={
        "email": "dup@example.com",
        "password": "securepass123",
        "full_name": "Dup User",
    })
    assert res.status_code == 400
    assert "already registered" in res.json()["detail"].lower()


async def test_login_success(client_no_auth, mock_db):
    """Valid credentials return user + tokens."""
    from backend.core.security import hash_password

    org_id = str(ObjectId())
    user_id = ObjectId()
    mock_db.users.find_one = AsyncMock(return_value={
        "_id": user_id,
        "email": "login@example.com",
        "full_name": "Login User",
        "password_hash": hash_password("correct-password"),
        "role": "admin",
        "organization_id": org_id,
        "created_at": datetime.now(timezone.utc),
        "is_active": True,
    })
    mock_db.organizations.find_one = AsyncMock(return_value={
        "_id": ObjectId(org_id),
        "name": "Test Org",
    })

    res = await client_no_auth.post("/api/auth/login", json={
        "email": "login@example.com",
        "password": "correct-password",
    })
    assert res.status_code == 200
    data = res.json()
    assert data["tokens"]["access_token"]
    assert data["user"]["email"] == "login@example.com"


async def test_login_wrong_password(client_no_auth, mock_db):
    """Wrong password returns 401."""
    from backend.core.security import hash_password

    mock_db.users.find_one = AsyncMock(return_value={
        "_id": ObjectId(),
        "email": "user@example.com",
        "full_name": "User",
        "password_hash": hash_password("real-password"),
        "role": "admin",
        "organization_id": str(ObjectId()),
        "created_at": datetime.now(timezone.utc),
        "is_active": True,
    })

    res = await client_no_auth.post("/api/auth/login", json={
        "email": "user@example.com",
        "password": "wrong-password",
    })
    assert res.status_code == 401


async def test_me_authenticated(client):
    """GET /auth/me returns current user data."""
    from tests.conftest import TEST_USER
    from bson import ObjectId

    with patch("backend.routers.auth.get_db") as mock_get_db:
        db = MagicMock()
        db.organizations.find_one = AsyncMock(return_value={
            "_id": ObjectId(TEST_USER["organization_id"]),
            "name": "Test Org",
        })
        mock_get_db.return_value = db

        res = await client.get("/api/auth/me")
        assert res.status_code == 200
        data = res.json()
        assert data["email"] == TEST_USER["email"]


async def test_me_unauthenticated(client_no_auth):
    """GET /auth/me without token returns 401."""
    res = await client_no_auth.get("/api/auth/me")
    assert res.status_code in (401, 403)


async def test_refresh_invalid_token(client_no_auth):
    """Invalid refresh token returns 401."""
    res = await client_no_auth.post("/api/auth/refresh", json={
        "refresh_token": "invalid-token",
    })
    assert res.status_code == 401
