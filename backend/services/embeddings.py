import logging

from sentence_transformers import SentenceTransformer

from backend.core.settings import get_settings

logger = logging.getLogger(__name__)

_model: SentenceTransformer | None = None


def load_model() -> SentenceTransformer:
    global _model
    if _model is None:
        model_name = get_settings().embedding_model_name
        logger.info(f"Loading embedding model: {model_name}")
        _model = SentenceTransformer(model_name)
        logger.info("Embedding model loaded")
    return _model


def embed_texts(texts: list[str]) -> list[list[float]]:
    model = load_model()
    embeddings = model.encode(texts, show_progress_bar=False, normalize_embeddings=True)
    return embeddings.tolist()


def embed_query(query: str) -> list[float]:
    return embed_texts([query])[0]
