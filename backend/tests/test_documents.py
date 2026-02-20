"""Tests for document endpoints."""

from datetime import datetime, timezone
from unittest.mock import AsyncMock, MagicMock, patch

from tests.conftest import TEST_USER, _make_async_cursor


async def test_list_documents_empty(client, mock_db):
    """Empty document list returns total=0."""
    res = await client.get("/api/documents")
    assert res.status_code == 200
    data = res.json()
    assert data["total"] == 0
    assert data["documents"] == []


async def test_list_documents_with_data(client, mock_db):
    """Document list returns items when present."""
    mock_db.documents.find = MagicMock(return_value=_make_async_cursor([
        {
            "document_id": "doc-1",
            "organization_id": TEST_USER["organization_id"],
            "filename": "contract.pdf",
            "file_type": ".pdf",
            "file_size": 1024,
            "page_count": 5,
            "chunk_count": 12,
            "status": "ready",
            "error_message": None,
            "uploaded_at": datetime.now(timezone.utc),
            "processed_at": datetime.now(timezone.utc),
        },
    ]))
    res = await client.get("/api/documents")
    assert res.status_code == 200
    data = res.json()
    assert data["total"] == 1
    assert data["documents"][0]["filename"] == "contract.pdf"


async def test_upload_unsupported_type(client):
    """Uploading unsupported file type returns 400."""
    import io
    files = {"file": ("test.exe", io.BytesIO(b"binary content"), "application/octet-stream")}
    res = await client.post("/api/documents/upload", files=files)
    assert res.status_code == 400


async def test_get_document_found(client, mock_db):
    """Get single document by ID."""
    mock_db.documents.find_one = AsyncMock(return_value={
        "document_id": "doc-1",
        "organization_id": TEST_USER["organization_id"],
        "filename": "memo.docx",
        "file_type": ".docx",
        "file_size": 2048,
        "page_count": 3,
        "chunk_count": 8,
        "status": "ready",
        "error_message": None,
        "uploaded_at": datetime.now(timezone.utc),
        "processed_at": datetime.now(timezone.utc),
    })
    res = await client.get("/api/documents/doc-1")
    assert res.status_code == 200
    assert res.json()["filename"] == "memo.docx"


async def test_get_document_not_found(client, mock_db):
    """Missing document returns 404."""
    mock_db.documents.find_one = AsyncMock(return_value=None)
    res = await client.get("/api/documents/nonexistent")
    assert res.status_code == 404


async def test_delete_document(client, mock_db):
    """Delete document returns success message."""
    mock_db.documents.find_one = AsyncMock(return_value={
        "document_id": "doc-1",
        "organization_id": TEST_USER["organization_id"],
        "filename": "old.pdf",
    })
    with patch("backend.routers.documents.vector_store"):
        res = await client.delete("/api/documents/doc-1")
    assert res.status_code == 200
    assert "deleted" in res.json()["message"].lower()


async def test_stats(client, mock_db):
    """Stats endpoint returns expected shape."""
    with patch("backend.routers.documents.vector_store") as mock_vs:
        mock_vs.get_total_chunks.return_value = 42
        mock_manager = MagicMock()
        mock_manager.check_status = AsyncMock(return_value=[{"available": True, "provider": "ollama"}])
        with patch("backend.services.llm.manager.get_llm_manager", return_value=mock_manager):
            res = await client.get("/api/stats")

    assert res.status_code == 200
    data = res.json()
    assert "total_documents" in data
    assert "total_chunks" in data
