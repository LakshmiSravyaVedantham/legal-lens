"""Tests for legal intelligence endpoints (clauses, bookmarks, key terms)."""

from unittest.mock import AsyncMock, MagicMock, patch

from tests.conftest import _make_async_cursor


async def test_clause_library(client):
    """List clauses returns all clause types."""
    with patch("backend.routers.legal.get_clause_library") as mock_lib:
        mock_lib.return_value = [
            {"id": "indemnification", "name": "Indemnification", "category": "Risk"},
            {"id": "termination", "name": "Termination", "category": "Term"},
        ]
        res = await client.get("/api/clauses")
    assert res.status_code == 200
    data = res.json()
    assert len(data["clauses"]) == 2


async def test_search_clause(client):
    """Clause search returns deduplicated results."""
    mock_clause = {
        "id": "indemnification",
        "name": "Indemnification",
        "queries": ["indemnify", "hold harmless"],
    }
    mock_result = MagicMock(text="Shall indemnify and hold harmless...", score=0.9)
    with (
        patch("backend.routers.legal.get_clause_by_id", return_value=mock_clause),
        patch("backend.routers.legal.semantic_search", return_value=[mock_result]),
    ):
        res = await client.get("/api/clauses/indemnification/search")
    assert res.status_code == 200
    assert res.json()["total_results"] >= 1


async def test_bookmarks_crud(client, mock_db):
    """Create and list bookmarks."""
    # List (empty)
    mock_db.bookmarks.find = MagicMock(return_value=_make_async_cursor([]))
    with patch("backend.routers.legal.get_bookmarks", new_callable=AsyncMock, return_value=[]):
        res = await client.get("/api/bookmarks")
    assert res.status_code == 200

    # Create
    with patch("backend.routers.legal.add_bookmark", new_callable=AsyncMock, return_value={
        "id": "000000000000000000000010",
        "document_name": "contract.pdf",
        "text": "Key clause text",
        "note": "",
        "matter": "",
        "created_at": "2024-01-01T00:00:00",
    }):
        res = await client.post("/api/bookmarks", json={
            "document_name": "contract.pdf",
            "text": "Key clause text",
        })
    assert res.status_code == 200
    assert res.json()["document_name"] == "contract.pdf"

    # Delete
    with patch("backend.routers.legal.delete_bookmark", new_callable=AsyncMock, return_value=True):
        res = await client.delete("/api/bookmarks/000000000000000000000010")
    assert res.status_code == 200


async def test_key_terms(client, mock_db):
    """Key terms extraction returns structured data."""
    mock_terms = MagicMock(
        parties=["Party A", "Party B"],
        dates=["January 1, 2024"],
        monetary_amounts=["$100,000"],
        defined_terms=["Agreement", "Term"],
        governing_law=["State of Delaware"],
        references=["Section 3.1"],
    )
    with (
        patch("backend.routers.legal._get_doc_text", new_callable=AsyncMock, return_value=(
            {"filename": "contract.pdf"}, "This Agreement is between Party A and Party B..."
        )),
        patch("backend.routers.legal.extract_key_terms", return_value=mock_terms),
        patch("backend.routers.legal.classify_document", return_value="Contract"),
    ):
        res = await client.get("/api/documents/doc-1/key-terms")
    assert res.status_code == 200
    data = res.json()
    assert "parties" in data
    assert "dates" in data
    assert data["document_type"] == "Contract"
