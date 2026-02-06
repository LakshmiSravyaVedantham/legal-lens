import logging

from backend.models.schemas import Citation
from backend.services.search_engine import semantic_search
from backend.services.ollama_client import generate

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


async def ask(query: str, top_k: int = 5) -> tuple[str, list[Citation]]:
    citations = semantic_search(query=query, top_k=top_k)

    if not citations:
        return "No relevant documents found. Please upload documents first.", []

    context = _build_context(citations)
    prompt = f"""Based on the following document excerpts, answer the question.

DOCUMENT EXCERPTS:
{context}

QUESTION: {query}

Provide a clear, detailed answer citing sources using [1], [2] notation. If the documents don't fully answer the question, state what information is available and what is missing."""

    answer = await generate(prompt=prompt, system=SYSTEM_PROMPT)
    return answer, citations
