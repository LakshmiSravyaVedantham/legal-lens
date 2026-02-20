import logging

from fastapi import APIRouter, Depends, HTTPException, Request

from backend.middleware.auth import get_current_user
from backend.middleware.rate_limit import AI_LIMIT, limiter
from backend.models.schemas import ChatRequest, ChatResponseWithFollowUps
from backend.services.llm.manager import get_llm_manager
from backend.services.rag_engine import ask_with_follow_ups

logger = logging.getLogger(__name__)
router = APIRouter(tags=["chat"])


@router.post("/chat", response_model=ChatResponseWithFollowUps)
@limiter.limit(AI_LIMIT)
async def chat(request: Request, data: ChatRequest, user: dict = Depends(get_current_user)):
    org_id = user["organization_id"]
    manager = get_llm_manager()

    try:
        answer, citations, follow_ups = await ask_with_follow_ups(
            query=data.query,
            top_k=data.top_k,
            llm_manager=manager,
            org_id=org_id,
        )
        return ChatResponseWithFollowUps(
            answer=answer,
            citations=citations,
            ollama_available=True,
            follow_up_suggestions=follow_ups,
        )
    except ConnectionError as e:
        raise HTTPException(503, detail=str(e))
    except TimeoutError as e:
        raise HTTPException(504, detail=str(e))
    except Exception as e:
        logger.error(f"Chat error: {e}")
        raise HTTPException(500, detail="An error occurred while generating the response.")


@router.get("/chat/status")
async def chat_status(user: dict = Depends(get_current_user)):
    org_id = user["organization_id"]
    manager = get_llm_manager()
    statuses = await manager.check_status(org_id)
    any_ok = any(s["available"] for s in statuses)

    return {
        "ollama_available": any_ok,
        "providers": statuses,
        "message": "LLM provider available" if any_ok else (
            "No LLM provider available. Configure one in Settings or start Ollama."
        ),
    }
