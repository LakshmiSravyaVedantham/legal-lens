"""Tests for analytics endpoints."""

from unittest.mock import AsyncMock, patch


async def test_analytics(client):
    """Analytics endpoint returns search + storage data."""
    with patch("backend.routers.analytics.get_search_analytics", new_callable=AsyncMock, return_value={
        "total_searches": 42,
        "average_results": 5.3,
        "top_queries": [{"query": "indemnification", "count": 10}],
    }):
        res = await client.get("/api/analytics")
    assert res.status_code == 200
    data = res.json()
    assert "search" in data
    assert "storage" in data
    assert data["search"]["total_searches"] == 42


async def test_recent_searches(client):
    """Recent searches returns list."""
    with patch("backend.routers.analytics.get_recent_searches", new_callable=AsyncMock, return_value=[
        {"query": "force majeure", "result_count": 3, "timestamp": "2024-01-01T00:00:00"},
    ]):
        res = await client.get("/api/analytics/recent-searches")
    assert res.status_code == 200
    data = res.json()
    assert len(data["searches"]) == 1


async def test_system_info(client):
    """System info returns platform details."""
    res = await client.get("/api/system-info")
    assert res.status_code == 200
    data = res.json()
    assert "python_version" in data
    assert "platform" in data
