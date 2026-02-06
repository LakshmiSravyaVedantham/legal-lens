import json
import logging
import uuid
from datetime import datetime
from pathlib import Path

from fastapi import APIRouter, BackgroundTasks, HTTPException, UploadFile, File

from backend.config import UPLOADS_DIR, PROCESSED_DIR, ALLOWED_EXTENSIONS, MAX_FILE_SIZE_MB
from backend.models.schemas import DocumentMetadata, DocumentResponse, ProcessingStatus
from backend.services.document_processor import extract_text
from backend.services.chunker import chunk_pages
from backend.services import vector_store
from backend.services.activity_tracker import log_activity

logger = logging.getLogger(__name__)
router = APIRouter(tags=["documents"])

METADATA_FILE = PROCESSED_DIR / "documents.json"


def _load_documents() -> dict[str, DocumentMetadata]:
    if METADATA_FILE.exists():
        data = json.loads(METADATA_FILE.read_text())
        return {k: DocumentMetadata(**v) for k, v in data.items()}
    return {}


def _save_documents(docs: dict[str, DocumentMetadata]):
    data = {k: v.model_dump(mode="json") for k, v in docs.items()}
    METADATA_FILE.write_text(json.dumps(data, indent=2, default=str))


def _process_document(doc_id: str, file_path: Path, filename: str):
    """Background task to process an uploaded document."""
    docs = _load_documents()
    doc = docs.get(doc_id)
    if not doc:
        return

    try:
        doc.status = ProcessingStatus.PROCESSING
        _save_documents(docs)

        pages = extract_text(file_path)
        doc.page_count = len(pages)

        chunks = chunk_pages(pages, document_id=doc_id, document_name=filename)
        count = vector_store.add_chunks(chunks)

        doc.chunk_count = count
        doc.status = ProcessingStatus.READY
        doc.processed_at = datetime.utcnow()
        log_activity("document_processed", f"{filename} — {len(pages)} pages, {count} chunks")
        logger.info(f"Document {filename} processed: {len(pages)} pages, {count} chunks")

    except Exception as e:
        logger.error(f"Error processing {filename}: {e}")
        doc.status = ProcessingStatus.ERROR
        doc.error_message = str(e)

    _save_documents(docs)


@router.post("/documents/upload")
async def upload_document(background_tasks: BackgroundTasks, file: UploadFile = File(...)):
    if not file.filename:
        raise HTTPException(400, "No filename provided")

    ext = Path(file.filename).suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(400, f"File type {ext} not supported. Allowed: {', '.join(ALLOWED_EXTENSIONS)}")

    content = await file.read()
    size_mb = len(content) / (1024 * 1024)
    if size_mb > MAX_FILE_SIZE_MB:
        raise HTTPException(400, f"File too large ({size_mb:.1f}MB). Max: {MAX_FILE_SIZE_MB}MB")

    doc_id = str(uuid.uuid4())
    file_path = UPLOADS_DIR / f"{doc_id}{ext}"
    file_path.write_bytes(content)

    doc = DocumentMetadata(
        id=doc_id,
        filename=file.filename,
        file_type=ext,
        file_size=len(content),
        status=ProcessingStatus.PENDING,
    )

    docs = _load_documents()
    docs[doc_id] = doc
    _save_documents(docs)

    background_tasks.add_task(_process_document, doc_id, file_path, file.filename)
    log_activity("document_uploaded", f"{file.filename} ({size_mb:.1f} MB)")

    return {"id": doc_id, "status": "pending", "message": f"Document '{file.filename}' uploaded. Processing started."}


@router.get("/documents", response_model=DocumentResponse)
async def list_documents():
    docs = _load_documents()
    doc_list = sorted(docs.values(), key=lambda d: d.uploaded_at, reverse=True)
    return DocumentResponse(documents=doc_list, total=len(doc_list))


@router.get("/documents/{doc_id}")
async def get_document(doc_id: str):
    docs = _load_documents()
    doc = docs.get(doc_id)
    if not doc:
        raise HTTPException(404, "Document not found")
    return doc


@router.delete("/documents/{doc_id}")
async def delete_document(doc_id: str):
    docs = _load_documents()
    doc = docs.get(doc_id)
    if not doc:
        raise HTTPException(404, "Document not found")

    # Delete from vector store
    vector_store.delete_by_document_id(doc_id)

    # Delete uploaded file
    for ext in ALLOWED_EXTENSIONS:
        path = UPLOADS_DIR / f"{doc_id}{ext}"
        if path.exists():
            path.unlink()

    del docs[doc_id]
    _save_documents(docs)

    log_activity("document_deleted", doc.filename)
    return {"message": f"Document '{doc.filename}' deleted"}


@router.get("/documents/{doc_id}/content")
async def get_document_content(doc_id: str):
    """Return extracted text content of a document, page by page."""
    docs = _load_documents()
    doc = docs.get(doc_id)
    if not doc:
        raise HTTPException(404, "Document not found")
    if doc.status != ProcessingStatus.READY:
        raise HTTPException(400, f"Document is not ready (status: {doc.status.value})")

    # Re-extract text for display
    file_path = None
    for ext in ALLOWED_EXTENSIONS:
        p = UPLOADS_DIR / f"{doc_id}{ext}"
        if p.exists():
            file_path = p
            break
    if not file_path:
        raise HTTPException(404, "Source file not found")

    pages = extract_text(file_path)
    return {
        "id": doc_id,
        "filename": doc.filename,
        "pages": [{"page_number": p.page_number, "text": p.text} for p in pages],
        "total_pages": len(pages),
    }


@router.get("/stats")
async def get_stats():
    from backend.services.ollama_client import check_ollama_health

    docs = _load_documents()
    by_status: dict[str, int] = {}
    by_type: dict[str, int] = {}
    for d in docs.values():
        by_status[d.status.value] = by_status.get(d.status.value, 0) + 1
        by_type[d.file_type] = by_type.get(d.file_type, 0) + 1

    ollama_ok = await check_ollama_health()

    return {
        "total_documents": len(docs),
        "total_chunks": vector_store.get_total_chunks(),
        "documents_by_status": by_status,
        "documents_by_type": by_type,
        "ollama_status": "connected" if ollama_ok else "disconnected",
    }
