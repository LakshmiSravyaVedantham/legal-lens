"""Tests for search and chat endpoints."""

import pytest
from unittest.mock import AsyncMock, patch, MagicMock


async def test_search(client):
    """Search returns results."""
    mock_results = [
        MagicMock(
            text="Indemnification clause found",
            document_name="contract.pdf",
            page=3,
            paragraph=1,
            score=0.85,
            confidence="high",
        ),
    ]
    with patch("backend.routers.search.semantic_search", return_value=mock_results):
        res = await client.post("/api/search", json={"query": "indemnification", "top_k": 5})
    assert res.status_code == 200
    data = res.json()
    assert data["query"] == "indemnification"
    assert data["total_results"] == 1


async def test_search_empty_results(client):
    """Search with no matches returns empty list."""
    with patch("backend.routers.search.semantic_search", return_value=[]):
        res = await client.post("/api/search", json={"query": "nonexistent term"})
    assert res.status_code == 200
    assert res.json()["total_results"] == 0


async def test_chat_status(client):
    """Chat status returns provider info."""
    mock_manager = MagicMock()
    mock_manager.check_status = AsyncMock(return_value=[
        {"provider": "ollama", "available": True, "model": "llama3.1:8b"},
    ])
    with patch("backend.routers.chat.get_llm_manager", return_value=mock_manager):
        res = await client.get("/api/chat/status")
    assert res.status_code == 200
    data = res.json()
    assert "ollama_available" in data


async def test_chat(client):
    """Chat returns answer + citations."""
    with patch("backend.routers.chat.ask_with_follow_ups", new_callable=AsyncMock) as mock_ask:
        mock_ask.return_value = (
            "The indemnification clause states...",
            [{"document": "contract.pdf", "page": 3, "text": "snippet"}],
            ["What are the exceptions?"],
        )
        with patch("backend.routers.chat.get_llm_manager"):
            res = await client.post("/api/chat", json={"query": "What does the indemnification clause say?"})
    assert res.status_code == 200
    data = res.json()
    assert "answer" in data
    assert "citations" in data
    assert "follow_up_suggestions" in data
