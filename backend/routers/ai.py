"""AI-powered analysis router — all AI feature endpoints."""

import logging

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, Field

from backend.core.database import get_db
from backend.middleware.auth import get_current_user
from backend.middleware.rate_limit import AI_LIMIT, limiter
from backend.services import ai_features
from backend.services.activity import log_audit_event
from backend.services.document_utils import get_doc_text
from backend.services.llm.manager import get_llm_manager

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/ai", tags=["ai"])


# ---------------------------------------------------------------------------
# Request / Response models
# ---------------------------------------------------------------------------

class AnalyzeRequest(BaseModel):
    analysis_type: str = Field(..., pattern="^(summary|risks|checklist|obligations|timeline)$")
    force_refresh: bool = False


class CompareRequest(BaseModel):
    document_a_id: str
    document_b_id: str


class BriefRequest(BaseModel):
    topic: str = Field(..., min_length=1, max_length=500)
    bookmark_ids: list[str] = []
    bookmarks: list[dict] = []


class SearchExpandRequest(BaseModel):
    query: str = Field(..., min_length=1, max_length=500)


# ---------------------------------------------------------------------------
# Helper to run & cache a single analysis
# ---------------------------------------------------------------------------

async def _run_analysis(
    doc_id: str,
    org_id: str,
    analysis_type: str,
    force_refresh: bool = False,
) -> dict:
    """Run an analysis, returning cached result when available."""
    if not force_refresh:
        cached = await ai_features.get_cached_analysis(doc_id, analysis_type, org_id)
        if cached:
            return {"document_id": doc_id, "analysis_type": analysis_type, "cached": True, **cached["result"]}

    doc, text = await get_doc_text(doc_id, org_id)
    llm = get_llm_manager()

    generators = {
        "summary": ai_features.generate_summary,
        "risks": ai_features.analyze_risks,
        "checklist": ai_features.generate_checklist,
        "obligations": ai_features.extract_obligations,
        "timeline": ai_features.extract_timeline,
    }

    gen = generators.get(analysis_type)
    if not gen:
        raise HTTPException(400, f"Unknown analysis type: {analysis_type}")

    try:
        result = await gen(text, llm, org_id)
    except (ConnectionError, TimeoutError, OSError) as e:
        logger.error(f"AI analysis ({analysis_type}) failed for {doc_id}: {e}")
        raise HTTPException(502, "AI provider unavailable — please try again later")
    except Exception as e:
        logger.error(f"AI analysis ({analysis_type}) failed for {doc_id}: {e}")
        raise HTTPException(502, "An unexpected error occurred during analysis")

    await ai_features.save_analysis(doc_id, analysis_type, org_id, result)
    return {"document_id": doc_id, "analysis_type": analysis_type, "cached": False, **result}


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.post("/documents/{doc_id}/analyze")
@limiter.limit(AI_LIMIT)
async def analyze_document(request: Request, doc_id: str, req: AnalyzeRequest, user: dict = Depends(get_current_user)):
    """Run any analysis type on a document."""
    result = await _run_analysis(doc_id, user["organization_id"], req.analysis_type, req.force_refresh)
    if not result.get("cached"):
        await log_audit_event(
            user["organization_id"], user["id"], "ai_analysis_run",
            resource_type="document", resource_id=doc_id,
            metadata={"analysis_type": req.analysis_type},
        )
    return result


@router.get("/documents/{doc_id}/analyses")
async def get_all_analyses(doc_id: str, user: dict = Depends(get_current_user)):
    """Get all cached analyses for a document."""
    db = get_db()
    cursor = db.ai_analyses.find({
        "document_id": doc_id,
        "organization_id": user["organization_id"],
    })
    analyses = {}
    async for a in cursor:
        analyses[a["analysis_type"]] = {
            "result": a["result"],
            "created_at": a["created_at"].isoformat() if a.get("created_at") else None,
        }
    return {"document_id": doc_id, "analyses": analyses}


@router.get("/documents/{doc_id}/summary")
async def get_summary(doc_id: str, force: bool = False, user: dict = Depends(get_current_user)):
    return await _run_analysis(doc_id, user["organization_id"], "summary", force)


@router.get("/documents/{doc_id}/risks")
async def get_risks(doc_id: str, force: bool = False, user: dict = Depends(get_current_user)):
    return await _run_analysis(doc_id, user["organization_id"], "risks", force)


@router.get("/documents/{doc_id}/checklist")
async def get_checklist(doc_id: str, force: bool = False, user: dict = Depends(get_current_user)):
    return await _run_analysis(doc_id, user["organization_id"], "checklist", force)


@router.get("/documents/{doc_id}/obligations")
async def get_obligations(doc_id: str, force: bool = False, user: dict = Depends(get_current_user)):
    return await _run_analysis(doc_id, user["organization_id"], "obligations", force)


@router.get("/documents/{doc_id}/timeline")
async def get_timeline(doc_id: str, force: bool = False, user: dict = Depends(get_current_user)):
    return await _run_analysis(doc_id, user["organization_id"], "timeline", force)


@router.post("/compare")
@limiter.limit(AI_LIMIT)
async def compare_documents(request: Request, req: CompareRequest, user: dict = Depends(get_current_user)):
    """Compare two documents side-by-side."""
    org_id = user["organization_id"]
    doc_a, text_a = await get_doc_text(req.document_a_id, org_id)
    doc_b, text_b = await get_doc_text(req.document_b_id, org_id)
    llm = get_llm_manager()

    try:
        result = await ai_features.compare_documents(
            text_a, text_b, doc_a["filename"], doc_b["filename"], llm, org_id
        )
    except (ConnectionError, TimeoutError, OSError) as e:
        logger.error(f"Document comparison failed: {e}")
        raise HTTPException(502, "AI provider unavailable — please try again later")
    except Exception as e:
        logger.error(f"Document comparison failed: {e}")
        raise HTTPException(502, "An unexpected error occurred during comparison")

    return {
        "document_a": {"id": req.document_a_id, "filename": doc_a["filename"]},
        "document_b": {"id": req.document_b_id, "filename": doc_b["filename"]},
        **result,
    }


@router.post("/brief")
@limiter.limit(AI_LIMIT)
async def generate_brief(request: Request, req: BriefRequest, user: dict = Depends(get_current_user)):
    """Generate a legal memo from bookmarks."""
    org_id = user["organization_id"]
    llm = get_llm_manager()

    # Use provided bookmarks or fetch by IDs
    bookmarks = req.bookmarks
    if req.bookmark_ids and not bookmarks:
        db = get_db()
        for bid in req.bookmark_ids:
            bm = await db.bookmarks.find_one({"_id": bid, "organization_id": org_id})
            if bm:
                bookmarks.append({
                    "document_name": bm.get("document_name", ""),
                    "page": bm.get("page"),
                    "text": bm.get("text", ""),
                })

    if not bookmarks:
        raise HTTPException(400, "No bookmarks provided")

    try:
        result = await ai_features.generate_brief(bookmarks, req.topic, llm, org_id)
    except (ConnectionError, TimeoutError, OSError) as e:
        logger.error(f"Brief generation failed: {e}")
        raise HTTPException(502, "AI provider unavailable — please try again later")
    except Exception as e:
        logger.error(f"Brief generation failed: {e}")
        raise HTTPException(502, "An unexpected error occurred during brief generation")

    return result


@router.post("/search/expand")
@limiter.limit(AI_LIMIT)
async def expand_search(request: Request, req: SearchExpandRequest, user: dict = Depends(get_current_user)):
    """AI-powered search query expansion with legal synonyms."""
    llm = get_llm_manager()
    try:
        result = await ai_features.expand_search_query(req.query, llm, user["organization_id"])
    except (ConnectionError, TimeoutError, OSError) as e:
        logger.error(f"Search expansion failed: {e}")
        raise HTTPException(502, "AI provider unavailable — please try again later")
    except Exception as e:
        logger.error(f"Search expansion failed: {e}")
        raise HTTPException(502, "An unexpected error occurred during search expansion")
    return result


@router.delete("/documents/{doc_id}/analyses")
async def clear_analyses(doc_id: str, user: dict = Depends(get_current_user)):
    """Clear all cached analyses for a document."""
    db = get_db()
    result = await db.ai_analyses.delete_many({
        "document_id": doc_id,
        "organization_id": user["organization_id"],
    })
    return {"message": f"Cleared {result.deleted_count} cached analyses", "document_id": doc_id}
