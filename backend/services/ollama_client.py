import logging

import httpx

from backend.core.settings import get_settings

logger = logging.getLogger(__name__)


async def check_ollama_health() -> bool:
    settings = get_settings()
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.get(f"{settings.ollama_base_url}/api/tags")
            return resp.status_code == 200
    except Exception:
        return False


async def generate(prompt: str, system: str | None = None) -> str:
    settings = get_settings()
    payload: dict = {
        "model": settings.ollama_model,
        "prompt": prompt,
        "stream": False,
    }
    if system:
        payload["system"] = system

    try:
        async with httpx.AsyncClient(timeout=settings.ollama_timeout) as client:
            resp = await client.post(
                f"{settings.ollama_base_url}/api/generate",
                json=payload,
            )
            resp.raise_for_status()
            data = resp.json()
            return data.get("response", "")
    except httpx.ConnectError:
        raise ConnectionError(
            "Cannot connect to Ollama. Please install and start Ollama "
            "(https://ollama.ai) then run: ollama pull llama3.1:8b"
        )
    except httpx.TimeoutException:
        raise TimeoutError("Ollama request timed out. The model may still be loading.")
    except Exception as e:
        logger.error(f"Ollama error: {e}")
        raise
