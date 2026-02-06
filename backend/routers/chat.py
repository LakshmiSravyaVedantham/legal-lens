import logging

from fastapi import APIRouter, HTTPException

from backend.models.schemas import ChatRequest, ChatResponse
from backend.services.rag_engine import ask
from backend.services.ollama_client import check_ollama_health

logger = logging.getLogger(__name__)
router = APIRouter(tags=["chat"])


@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    ollama_ok = await check_ollama_health()
    if not ollama_ok:
        raise HTTPException(
            503,
            detail="Ollama is not running. Please install Ollama (https://ollama.ai) "
                   "and run: ollama pull llama3.1:8b"
        )

    try:
        answer, citations = await ask(query=request.query, top_k=request.top_k)
        return ChatResponse(answer=answer, citations=citations, ollama_available=True)
    except ConnectionError as e:
        raise HTTPException(503, detail=str(e))
    except TimeoutError as e:
        raise HTTPException(504, detail=str(e))
    except Exception as e:
        logger.error(f"Chat error: {e}")
        raise HTTPException(500, detail="An error occurred while generating the response.")


@router.get("/chat/status")
async def chat_status():
    ok = await check_ollama_health()
    return {
        "ollama_available": ok,
        "message": "Ollama is running" if ok else (
            "Ollama is not running. Install from https://ollama.ai "
            "then run: ollama pull llama3.1:8b"
        ),
    }
