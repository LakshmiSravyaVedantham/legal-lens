import logging

from backend.models.schemas import Citation
from backend.services.search_engine import semantic_search
from backend.services.llm.manager import LLMManager

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """You are a legal document assistant. Answer questions based ONLY on the provided document excerpts.
If the documents don't contain enough information to answer, say so clearly.
Always reference which document and page your information comes from using [1], [2] notation matching the source numbers provided."""


def _build_context(citations: list[Citation]) -> str:
    parts = []
    for i, c in enumerate(citations, 1):
        source = f"[{i}] {c.document_name}"
        if c.page:
            source += f", Page {c.page}"
        parts.append(f"{source}:\n{c.text}\n")
    return "\n".join(parts)


async def ask(
    query: str,
    top_k: int = 5,
    llm_manager: LLMManager | None = None,
    org_id: str = "",
) -> tuple[str, list[Citation]]:
    citations = semantic_search(query=query, top_k=top_k)

    if not citations:
        return "No relevant documents found. Please upload documents first.", []

    context = _build_context(citations)
    prompt = f"""Based on the following document excerpts, answer the question.

DOCUMENT EXCERPTS:
{context}

QUESTION: {query}

Provide a clear, detailed answer citing sources using [1], [2] notation. If the documents don't fully answer the question, state what information is available and what is missing."""

    if llm_manager:
        answer = await llm_manager.generate(prompt=prompt, system=SYSTEM_PROMPT, org_id=org_id)
    else:
        # Fallback to direct Ollama (backward compat)
        from backend.services.ollama_client import generate
        answer = await generate(prompt=prompt, system=SYSTEM_PROMPT)

    return answer, citations


async def ask_with_follow_ups(
    query: str,
    top_k: int = 5,
    llm_manager: LLMManager | None = None,
    org_id: str = "",
) -> tuple[str, list[Citation], list[str]]:
    """Like ask(), but also returns follow-up question suggestions."""
    answer, citations = await ask(query, top_k, llm_manager, org_id)

    follow_ups: list[str] = []
    if llm_manager and answer and not answer.startswith("No relevant documents"):
        try:
            from backend.services.ai_features import generate_follow_ups
            follow_ups = await generate_follow_ups(query, answer, llm_manager, org_id)
        except Exception as e:
            logger.warning(f"Follow-up generation failed (non-blocking): {e}")

    return answer, citations, follow_ups
