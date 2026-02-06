import logging

import httpx

from backend.config import OLLAMA_BASE_URL, OLLAMA_MODEL, OLLAMA_TIMEOUT

logger = logging.getLogger(__name__)


async def check_ollama_health() -> bool:
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.get(f"{OLLAMA_BASE_URL}/api/tags")
            return resp.status_code == 200
    except Exception:
        return False


async def generate(prompt: str, system: str | None = None) -> str:
    payload: dict = {
        "model": OLLAMA_MODEL,
        "prompt": prompt,
        "stream": False,
    }
    if system:
        payload["system"] = system

    try:
        async with httpx.AsyncClient(timeout=OLLAMA_TIMEOUT) as client:
            resp = await client.post(
                f"{OLLAMA_BASE_URL}/api/generate",
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
