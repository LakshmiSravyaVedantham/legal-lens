import logging

from backend.models.schemas import Citation
from backend.services import vector_store
from backend.services.embeddings import embed_query

logger = logging.getLogger(__name__)


def semantic_search(query: str, top_k: int = 10) -> list[Citation]:
    query_embedding = embed_query(query)
    results = vector_store.search(query_embedding, top_k=top_k)

    citations: list[Citation] = []

    if not results["ids"] or not results["ids"][0]:
        return citations

    ids = results["ids"][0]
    documents = results["documents"][0] if results["documents"] else []
    metadatas = results["metadatas"][0] if results["metadatas"] else []
    distances = results["distances"][0] if results["distances"] else []

    for i, doc_id in enumerate(ids):
        # ChromaDB cosine distance: 0 = identical, 2 = opposite
        # Convert to similarity score: 1 - (distance / 2)
        distance = distances[i] if i < len(distances) else 1.0
        score = max(0.0, 1.0 - (distance / 2.0))

        meta = metadatas[i] if i < len(metadatas) else {}
        text = documents[i] if i < len(documents) else ""

        citations.append(Citation(
            document_id=meta.get("document_id", ""),
            document_name=meta.get("document_name", "Unknown"),
            page=meta.get("page") or None,
            paragraph=meta.get("paragraph"),
            text=text,
            score=round(score, 4),
        ))

    # Sort by score descending
    citations.sort(key=lambda c: c.score, reverse=True)
    return citations
