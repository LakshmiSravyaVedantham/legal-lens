from fastapi import APIRouter

from backend.models.schemas import SearchRequest, SearchResult
from backend.services.search_engine import semantic_search
from backend.services.activity_tracker import log_search, log_activity

router = APIRouter(tags=["search"])


@router.post("/search", response_model=SearchResult)
async def search_documents(request: SearchRequest):
    results = semantic_search(query=request.query, top_k=request.top_k)
    log_search(request.query, len(results))
    log_activity("search", f'"{request.query}" — {len(results)} results')
    return SearchResult(
        query=request.query,
        results=results,
        total_results=len(results),
    )
