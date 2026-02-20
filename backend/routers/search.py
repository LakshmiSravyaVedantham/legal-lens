from fastapi import APIRouter, Depends, Request

from backend.middleware.auth import get_current_user
from backend.middleware.rate_limit import SEARCH_LIMIT, limiter
from backend.models.schemas import SearchRequest, SearchResult
from backend.services.activity import log_activity, log_search
from backend.services.search_engine import semantic_search

router = APIRouter(tags=["search"])


@router.post("/search", response_model=SearchResult)
@limiter.limit(SEARCH_LIMIT)
async def search_documents(request: Request, data: SearchRequest, user: dict = Depends(get_current_user)):
    results = semantic_search(query=data.query, top_k=data.top_k)
    org_id = user["organization_id"]
    await log_search(org_id, user["id"], data.query, len(results))
    await log_activity(org_id, user["id"], "search", f'"{data.query}" — {len(results)} results')
    return SearchResult(
        query=data.query,
        results=results,
        total_results=len(results),
    )
