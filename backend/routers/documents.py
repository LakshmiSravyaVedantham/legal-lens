import logging
import uuid
from datetime import datetime, timezone
from pathlib import Path

from fastapi import (
    APIRouter,
    BackgroundTasks,
    Depends,
    File,
    HTTPException,
    Request,
    UploadFile,
)

from backend.core.database import get_db
from backend.core.settings import get_settings
from backend.middleware.auth import get_current_user, require_role
from backend.middleware.rate_limit import UPLOAD_LIMIT, limiter
from backend.models.schemas import DocumentMetadata, DocumentResponse, ProcessingStatus
from backend.models.user import Role
from backend.services import vector_store
from backend.services.activity import log_activity, log_audit_event
from backend.services.chunker import chunk_pages
from backend.services.document_processor import extract_text

logger = logging.getLogger(__name__)
router = APIRouter(tags=["documents"])


async def _process_document(doc_id: str, file_path: Path, filename: str, org_id: str):
    """Background task to process an uploaded document."""
    db = get_db()

    try:
        await db.documents.update_one(
            {"document_id": doc_id},
            {"$set": {"status": ProcessingStatus.PROCESSING}},
        )

        pages = extract_text(file_path)
        page_count = len(pages)

        chunks = chunk_pages(pages, document_id=doc_id, document_name=filename)
        count = vector_store.add_chunks(chunks)

        await db.documents.update_one(
            {"document_id": doc_id},
            {"$set": {
                "page_count": page_count,
                "chunk_count": count,
                "status": ProcessingStatus.READY,
                "processed_at": datetime.now(timezone.utc),
            }},
        )
        await log_activity(org_id, "", "document_processed", f"{filename} — {page_count} pages, {count} chunks")
        logger.info(f"Document {filename} processed: {page_count} pages, {count} chunks")

        # Auto-summarize (non-blocking — failure doesn't affect processing)
        try:
            from backend.services import ai_features
            from backend.services.llm.manager import get_llm_manager
            full_text = "\n".join(p.text for p in pages)
            llm = get_llm_manager()
            summary = await ai_features.generate_summary(full_text, llm, org_id)
            await ai_features.save_analysis(doc_id, "summary", org_id, summary)
            logger.info(f"Auto-summary generated for {filename}")
        except Exception as summary_err:
            logger.warning(f"Auto-summary failed for {filename} (non-blocking): {summary_err}")

    except Exception as e:
        logger.error(f"Error processing {filename}: {e}")
        await db.documents.update_one(
            {"document_id": doc_id},
            {"$set": {"status": ProcessingStatus.ERROR, "error_message": str(e)}},
        )


@router.post("/documents/upload")
@limiter.limit(UPLOAD_LIMIT)
async def upload_document(
    request: Request,
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    user: dict = Depends(require_role(Role.PARALEGAL)),
):
    settings = get_settings()
    if not file.filename:
        raise HTTPException(400, "No filename provided")

    ext = Path(file.filename).suffix.lower()
    if ext not in settings.allowed_extensions:
        raise HTTPException(400, f"File type {ext} not supported. Allowed: {', '.join(settings.allowed_extensions)}")

    # Stream content in chunks to enforce size limit without loading huge files
    max_bytes = settings.max_file_size_mb * 1024 * 1024
    chunks: list[bytes] = []
    total_read = 0
    while True:
        chunk = await file.read(1024 * 1024)  # 1 MB chunks
        if not chunk:
            break
        total_read += len(chunk)
        if total_read > max_bytes:
            raise HTTPException(400, f"File too large (>{settings.max_file_size_mb}MB). Max: {settings.max_file_size_mb}MB")
        chunks.append(chunk)
    content = b"".join(chunks)
    size_mb = len(content) / (1024 * 1024)

    # Validate MIME type matches extension
    import magic
    mime = magic.from_buffer(content[:2048], mime=True)
    allowed_mimes: dict[str, set[str]] = {
        ".pdf": {"application/pdf"},
        ".docx": {"application/vnd.openxmlformats-officedocument.wordprocessingml.document", "application/zip"},
        ".txt": {"text/plain"},
    }
    if ext in allowed_mimes and mime not in allowed_mimes[ext]:
        raise HTTPException(400, f"File content does not match extension {ext} (detected: {mime})")

    doc_id = str(uuid.uuid4())
    file_path = settings.uploads_dir / f"{doc_id}{ext}"

    import aiofiles
    async with aiofiles.open(file_path, "wb") as f:
        await f.write(content)

    org_id = user["organization_id"]
    db = get_db()
    doc_record = {
        "document_id": doc_id,
        "organization_id": org_id,
        "filename": file.filename,
        "file_type": ext,
        "file_size": len(content),
        "page_count": None,
        "chunk_count": 0,
        "status": ProcessingStatus.PENDING,
        "error_message": None,
        "uploaded_at": datetime.now(timezone.utc),
        "processed_at": None,
        "uploaded_by": user["id"],
        "matter": "",
        "client": "",
        "tags": [],
    }
    await db.documents.insert_one(doc_record)

    background_tasks.add_task(_process_document, doc_id, file_path, file.filename, org_id)
    await log_activity(org_id, user["id"], "document_uploaded", f"{file.filename} ({size_mb:.1f} MB)")
    await log_audit_event(
        org_id, user["id"], "document_uploaded",
        resource_type="document", resource_id=doc_id,
        detail=f"{file.filename} ({size_mb:.1f} MB)",
        ip_address=request.client.host if request.client else "",
    )

    return {"id": doc_id, "status": "pending", "message": f"Document '{file.filename}' uploaded. Processing started."}


@router.get("/documents", response_model=DocumentResponse)
async def list_documents(user: dict = Depends(get_current_user)):
    db = get_db()
    cursor = db.documents.find(
        {"organization_id": user["organization_id"]},
    ).sort("uploaded_at", -1)

    docs = []
    async for d in cursor:
        docs.append(DocumentMetadata(
            id=d["document_id"],
            filename=d["filename"],
            file_type=d["file_type"],
            file_size=d["file_size"],
            page_count=d.get("page_count"),
            chunk_count=d.get("chunk_count", 0),
            status=d["status"],
            error_message=d.get("error_message"),
            uploaded_at=d["uploaded_at"],
            processed_at=d.get("processed_at"),
        ))
    return DocumentResponse(documents=docs, total=len(docs))


@router.get("/documents/{doc_id}")
async def get_document(doc_id: str, user: dict = Depends(get_current_user)):
    db = get_db()
    doc = await db.documents.find_one({
        "document_id": doc_id,
        "organization_id": user["organization_id"],
    })
    if not doc:
        raise HTTPException(404, "Document not found")
    return DocumentMetadata(
        id=doc["document_id"],
        filename=doc["filename"],
        file_type=doc["file_type"],
        file_size=doc["file_size"],
        page_count=doc.get("page_count"),
        chunk_count=doc.get("chunk_count", 0),
        status=doc["status"],
        error_message=doc.get("error_message"),
        uploaded_at=doc["uploaded_at"],
        processed_at=doc.get("processed_at"),
    )


@router.delete("/documents/{doc_id}")
async def delete_document(doc_id: str, user: dict = Depends(require_role(Role.LAWYER))):
    db = get_db()
    doc = await db.documents.find_one({
        "document_id": doc_id,
        "organization_id": user["organization_id"],
    })
    if not doc:
        raise HTTPException(404, "Document not found")

    # Delete from vector store
    vector_store.delete_by_document_id(doc_id)

    # Delete uploaded file
    settings = get_settings()
    for ext in settings.allowed_extensions:
        path = settings.uploads_dir / f"{doc_id}{ext}"
        if path.exists():
            path.unlink()

    await db.documents.delete_one({"document_id": doc_id})
    await log_activity(user["organization_id"], user["id"], "document_deleted", doc["filename"])
    await log_audit_event(
        user["organization_id"], user["id"], "document_deleted",
        resource_type="document", resource_id=doc_id,
        detail=doc["filename"],
    )
    return {"message": f"Document '{doc['filename']}' deleted"}


@router.get("/documents/{doc_id}/content")
async def get_document_content(doc_id: str, user: dict = Depends(get_current_user)):
    """Return extracted text content of a document, page by page."""
    db = get_db()
    doc = await db.documents.find_one({
        "document_id": doc_id,
        "organization_id": user["organization_id"],
    })
    if not doc:
        raise HTTPException(404, "Document not found")
    if doc["status"] != ProcessingStatus.READY:
        raise HTTPException(400, f"Document is not ready (status: {doc['status']})")

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
    return {
        "id": doc_id,
        "filename": doc["filename"],
        "pages": [{"page_number": p.page_number, "text": p.text} for p in pages],
        "total_pages": len(pages),
    }


@router.get("/stats")
async def get_stats(user: dict = Depends(get_current_user)):
    db = get_db()
    org_id = user["organization_id"]

    docs_cursor = db.documents.find({"organization_id": org_id})
    by_status: dict[str, int] = {}
    by_type: dict[str, int] = {}
    total = 0
    async for d in docs_cursor:
        total += 1
        s = d["status"]
        by_status[s] = by_status.get(s, 0) + 1
        by_type[d["file_type"]] = by_type.get(d["file_type"], 0) + 1

    # Check LLM status (try Ollama as default)
    from backend.services.llm.manager import get_llm_manager
    manager = get_llm_manager()
    provider_status = await manager.check_status(org_id)
    llm_ok = any(p["available"] for p in provider_status)

    return {
        "total_documents": total,
        "total_chunks": vector_store.get_total_chunks(),
        "documents_by_status": by_status,
        "documents_by_type": by_type,
        "llm_status": "connected" if llm_ok else "disconnected",
        # Keep backward compat
        "ollama_status": "connected" if llm_ok else "disconnected",
    }
