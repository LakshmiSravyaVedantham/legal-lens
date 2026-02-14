"""Shared document utility: fetch document record + full text."""

import logging
from fastapi import HTTPException

from backend.core.settings import get_settings
from backend.core.database import get_db
from backend.models.schemas import ProcessingStatus
from backend.services.document_processor import extract_text

logger = logging.getLogger(__name__)


async def get_doc_text(doc_id: str, org_id: str) -> tuple[dict, str]:
    """Load a document record and extract its full text.

    Returns (doc_record, full_text).
    Raises HTTPException on not-found or not-ready.
    """
    db = get_db()
    doc = await db.documents.find_one({
        "document_id": doc_id,
        "organization_id": org_id,
    })
    if not doc:
        raise HTTPException(404, "Document not found")
    if doc["status"] != ProcessingStatus.READY:
        raise HTTPException(400, "Document not processed yet")

    settings = get_settings()
    file_path = None
    for ext in settings.allowed_extensions:
        p = settings.uploads_dir / f"{doc_id}{ext}"
        if p.exists():
            file_path = p
            break
    if not file_path:
        raise HTTPException(404, "Source file not found")

    pages = extract_text(file_path)
    full_text = "\n".join(p.text for p in pages)
    return doc, full_text
