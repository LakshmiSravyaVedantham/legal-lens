"""Tests for AI analysis endpoints."""

import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from datetime import datetime, timezone

from tests.conftest import TEST_USER


async def test_analyze_cached(client, mock_db):
    """Returns cached analysis when available."""
    mock_db.ai_analyses.find_one = AsyncMock(return_value={
        "document_id": "doc-1",
        "analysis_type": "summary",
        "organization_id": TEST_USER["organization_id"],
        "result": {"summary": "This is a lease agreement.", "key_points": ["Point 1"]},
        "created_at": datetime.now(timezone.utc),
    })
    with patch("backend.services.ai_features.get_cached_analysis", new_callable=AsyncMock) as mock_cache:
        mock_cache.return_value = {
            "result": {"summary": "This is a lease agreement.", "key_points": ["Point 1"]},
            "created_at": datetime.now(timezone.utc),
        }
        res = await client.post("/api/ai/documents/doc-1/analyze", json={
            "analysis_type": "summary",
        })
    assert res.status_code == 200
    data = res.json()
    assert data["cached"] is True
    assert "summary" in data


async def test_analyze_fresh(client, mock_db):
    """Generates fresh analysis when cache is empty."""
    with (
        patch("backend.services.ai_features.get_cached_analysis", new_callable=AsyncMock, return_value=None),
        patch("backend.services.ai_features.generate_summary", new_callable=AsyncMock, return_value={
            "summary": "New summary", "key_points": [],
        }),
        patch("backend.services.ai_features.save_analysis", new_callable=AsyncMock),
        patch("backend.services.document_utils.get_doc_text", new_callable=AsyncMock, return_value=(
            {"filename": "doc.pdf"}, "Full text content"
        )),
        patch("backend.routers.ai.get_llm_manager"),
    ):
        res = await client.post("/api/ai/documents/doc-1/analyze", json={
            "analysis_type": "summary",
        })
    assert res.status_code == 200
    data = res.json()
    assert data["cached"] is False


async def test_analyze_invalid_type(client):
    """Invalid analysis type returns 422."""
    res = await client.post("/api/ai/documents/doc-1/analyze", json={
        "analysis_type": "invalid_type",
    })
    assert res.status_code == 422


async def test_get_all_analyses(client, mock_db):
    """Get all analyses for a document."""
    from tests.conftest import _make_async_cursor
    mock_db.ai_analyses.find = MagicMock(return_value=_make_async_cursor([
        {
            "analysis_type": "summary",
            "result": {"summary": "Test", "key_points": []},
            "created_at": datetime.now(timezone.utc),
        },
    ]))
    res = await client.get("/api/ai/documents/doc-1/analyses")
    assert res.status_code == 200
    data = res.json()
    assert "analyses" in data
    assert "summary" in data["analyses"]


async def test_compare_documents(client, mock_db):
    """Document comparison endpoint works."""
    with (
        patch("backend.services.document_utils.get_doc_text", new_callable=AsyncMock, side_effect=[
            ({"filename": "a.pdf"}, "Text of doc A"),
            ({"filename": "b.pdf"}, "Text of doc B"),
        ]),
        patch("backend.services.ai_features.compare_documents", new_callable=AsyncMock, return_value={
            "similarities": ["Both are contracts"],
            "differences": ["Different parties"],
            "analysis": "Comparison text",
        }),
        patch("backend.routers.ai.get_llm_manager"),
    ):
        res = await client.post("/api/ai/compare", json={
            "document_a_id": "doc-a",
            "document_b_id": "doc-b",
        })
    assert res.status_code == 200
    data = res.json()
    assert "similarities" in data
    assert "differences" in data
