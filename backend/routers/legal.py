import logging
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from backend.services.key_terms import extract_key_terms, classify_document
from backend.services.clause_library import get_clause_library, get_clause_by_id
from backend.services.search_engine import semantic_search
from backend.services.bookmarks import add_bookmark, get_bookmarks, delete_bookmark
from backend.services.activity_tracker import log_activity

logger = logging.getLogger(__name__)
router = APIRouter(tags=["legal"])


# ---- Key Terms ----
@router.get("/documents/{doc_id}/key-terms")
async def get_key_terms(doc_id: str):
    from backend.routers.documents import _load_documents, UPLOADS_DIR, ALLOWED_EXTENSIONS
    from backend.services.document_processor import extract_text
    from backend.models.schemas import ProcessingStatus

    docs = _load_documents()
    doc = docs.get(doc_id)
    if not doc:
        raise HTTPException(404, "Document not found")
    if doc.status != ProcessingStatus.READY:
        raise HTTPException(400, "Document not processed yet")

    file_path = None
    for ext in ALLOWED_EXTENSIONS:
        p = UPLOADS_DIR / f"{doc_id}{ext}"
        if p.exists():
            file_path = p
            break
    if not file_path:
        raise HTTPException(404, "Source file not found")

    pages = extract_text(file_path)
    full_text = "\n".join(p.text for p in pages)

    terms = extract_key_terms(full_text)
    doc_type = classify_document(full_text, doc.filename)

    return {
        "document_id": doc_id,
        "document_name": doc.filename,
        "document_type": doc_type,
        "parties": terms.parties[:15],
        "dates": terms.dates[:20],
        "monetary_amounts": terms.monetary_amounts[:20],
        "defined_terms": terms.defined_terms[:30],
        "governing_law": terms.governing_law[:5],
        "references": terms.references[:20],
    }


# ---- Document Classification ----
@router.get("/documents/{doc_id}/classify")
async def classify_doc(doc_id: str):
    from backend.routers.documents import _load_documents, UPLOADS_DIR, ALLOWED_EXTENSIONS
    from backend.services.document_processor import extract_text
    from backend.models.schemas import ProcessingStatus

    docs = _load_documents()
    doc = docs.get(doc_id)
    if not doc:
        raise HTTPException(404, "Document not found")
    if doc.status != ProcessingStatus.READY:
        raise HTTPException(400, "Document not processed yet")

    file_path = None
    for ext in ALLOWED_EXTENSIONS:
        p = UPLOADS_DIR / f"{doc_id}{ext}"
        if p.exists():
            file_path = p
            break
    if not file_path:
        raise HTTPException(404, "Source file not found")

    pages = extract_text(file_path)
    full_text = "\n".join(p.text for p in pages)
    doc_type = classify_document(full_text, doc.filename)
    return {"document_id": doc_id, "document_type": doc_type}


# ---- Clause Library ----
@router.get("/clauses")
async def list_clauses():
    return {"clauses": get_clause_library()}


@router.get("/clauses/{clause_id}/search")
async def search_clause(clause_id: str, top_k: int = 10):
    clause = get_clause_by_id(clause_id)
    if not clause:
        raise HTTPException(404, "Clause type not found")

    all_results = []
    seen_texts: set[str] = set()

    for query in clause["queries"]:
        results = semantic_search(query=query, top_k=top_k)
        for r in results:
            key = r.text[:100]
            if key not in seen_texts:
                seen_texts.add(key)
                all_results.append(r)

    all_results.sort(key=lambda r: r.score, reverse=True)
    all_results = all_results[:top_k]

    log_activity("clause_search", f'{clause["name"]} — {len(all_results)} results')

    return {
        "clause": clause,
        "results": all_results,
        "total_results": len(all_results),
    }


# ---- Bookmarks ----
class BookmarkRequest(BaseModel):
    query: str = ""
    document_name: str
    page: int | None = None
    text: str
    note: str = ""
    matter: str = ""


@router.post("/bookmarks")
async def create_bookmark(req: BookmarkRequest):
    entry = add_bookmark(
        query=req.query,
        document_name=req.document_name,
        page=req.page,
        text=req.text,
        note=req.note,
        matter=req.matter,
    )
    log_activity("bookmark_added", f"{req.document_name} — {req.text[:60]}")
    return entry


@router.get("/bookmarks")
async def list_bookmarks(matter: str | None = None):
    return {"bookmarks": get_bookmarks(matter)}


@router.delete("/bookmarks/{bookmark_id}")
async def remove_bookmark(bookmark_id: int):
    ok = delete_bookmark(bookmark_id)
    if not ok:
        raise HTTPException(404, "Bookmark not found")
    return {"message": "Bookmark removed"}


# ---- Matter Tags (stored on documents) ----
class MatterTagRequest(BaseModel):
    matter: str = ""
    client: str = ""
    tags: list[str] = []


@router.put("/documents/{doc_id}/matter")
async def tag_document_matter(doc_id: str, req: MatterTagRequest):
    """Tag a document with client/matter information."""
    import json
    from backend.config import PROCESSED_DIR

    tags_file = PROCESSED_DIR / "document_tags.json"
    data: dict = {}
    if tags_file.exists():
        data = json.loads(tags_file.read_text())

    data[doc_id] = {
        "matter": req.matter,
        "client": req.client,
        "tags": req.tags,
    }
    tags_file.write_text(json.dumps(data, indent=2))
    return {"message": "Tags updated", "document_id": doc_id}


@router.get("/documents/{doc_id}/matter")
async def get_document_matter(doc_id: str):
    import json
    from backend.config import PROCESSED_DIR

    tags_file = PROCESSED_DIR / "document_tags.json"
    if tags_file.exists():
        data = json.loads(tags_file.read_text())
        return data.get(doc_id, {"matter": "", "client": "", "tags": []})
    return {"matter": "", "client": "", "tags": []}
