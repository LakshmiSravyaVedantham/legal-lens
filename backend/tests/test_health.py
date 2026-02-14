"""Tests for health check endpoints."""

import pytest


async def test_health_basic(client):
    res = await client.get("/api/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "ok"
    assert data["service"] == "LegalLens"
    assert "version" in data
    assert "uptime_seconds" in data


async def test_health_has_request_id(client):
    res = await client.get("/api/health")
    assert "x-request-id" in res.headers
    assert "x-response-time-ms" in res.headers
