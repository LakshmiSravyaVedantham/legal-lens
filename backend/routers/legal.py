import logging

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from backend.core.database import get_db
from backend.middleware.auth import get_current_user, require_role
from backend.models.user import Role
from backend.services.activity import log_activity
from backend.services.bookmarks import add_bookmark, delete_bookmark, get_bookmarks
from backend.services.clause_library import get_clause_by_id, get_clause_library
from backend.services.document_utils import get_doc_text as _get_doc_text
from backend.services.key_terms import classify_document, extract_key_terms
from backend.services.search_engine import semantic_search

logger = logging.getLogger(__name__)
router = APIRouter(tags=["legal"])


# ---- Key Terms ----
@router.get("/documents/{doc_id}/key-terms")
async def get_key_terms(doc_id: str, user: dict = Depends(get_current_user)):
    doc, full_text = await _get_doc_text(doc_id, user["organization_id"])
    terms = extract_key_terms(full_text)
    doc_type = classify_document(full_text, doc["filename"])

    return {
        "document_id": doc_id,
        "document_name": doc["filename"],
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
async def classify_doc(doc_id: str, user: dict = Depends(get_current_user)):
    doc, full_text = await _get_doc_text(doc_id, user["organization_id"])
    doc_type = classify_document(full_text, doc["filename"])
    return {"document_id": doc_id, "document_type": doc_type}


# ---- Clause Library ----
@router.get("/clauses")
async def list_clauses(user: dict = Depends(get_current_user)):
    return {"clauses": get_clause_library()}


@router.get("/clauses/{clause_id}/search")
async def search_clause(clause_id: str, top_k: int = 10, user: dict = Depends(get_current_user)):
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

    await log_activity(user["organization_id"], user["id"], "clause_search", f'{clause["name"]} — {len(all_results)} results')

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
async def create_bookmark(req: BookmarkRequest, user: dict = Depends(require_role(Role.PARALEGAL))):
    entry = await add_bookmark(
        user_id=user["id"],
        org_id=user["organization_id"],
        query=req.query,
        document_name=req.document_name,
        page=req.page,
        text=req.text,
        note=req.note,
        matter=req.matter,
    )
    await log_activity(user["organization_id"], user["id"], "bookmark_added", f"{req.document_name} — {req.text[:60]}")
    return entry


@router.get("/bookmarks")
async def list_bookmarks(matter: str | None = None, user: dict = Depends(get_current_user)):
    return {"bookmarks": await get_bookmarks(user["organization_id"], matter)}


@router.delete("/bookmarks/{bookmark_id}")
async def remove_bookmark(bookmark_id: str, user: dict = Depends(require_role(Role.PARALEGAL))):
    ok = await delete_bookmark(bookmark_id, user["organization_id"])
    if not ok:
        raise HTTPException(404, "Bookmark not found")
    return {"message": "Bookmark removed"}


# ---- Matter Tags (stored on documents) ----
class MatterTagRequest(BaseModel):
    matter: str = ""
    client: str = ""
    tags: list[str] = []


@router.put("/documents/{doc_id}/matter")
async def tag_document_matter(doc_id: str, req: MatterTagRequest, user: dict = Depends(require_role(Role.PARALEGAL))):
    """Tag a document with client/matter information."""
    db = get_db()
    result = await db.documents.update_one(
        {"document_id": doc_id, "organization_id": user["organization_id"]},
        {"$set": {"matter": req.matter, "client": req.client, "tags": req.tags}},
    )
    if result.matched_count == 0:
        raise HTTPException(404, "Document not found")
    return {"message": "Tags updated", "document_id": doc_id}


@router.get("/documents/{doc_id}/matter")
async def get_document_matter(doc_id: str, user: dict = Depends(get_current_user)):
    db = get_db()
    doc = await db.documents.find_one({
        "document_id": doc_id,
        "organization_id": user["organization_id"],
    })
    if not doc:
        return {"matter": "", "client": "", "tags": []}
    return {
        "matter": doc.get("matter", ""),
        "client": doc.get("client", ""),
        "tags": doc.get("tags", []),
    }
