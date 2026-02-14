from __future__ import annotations

import logging
from typing import Optional

import chromadb

from backend.core.settings import get_settings
from backend.services.chunker import Chunk
from backend.services.embeddings import embed_texts

logger = logging.getLogger(__name__)

_client: Optional[chromadb.ClientAPI] = None
_collection: Optional[chromadb.Collection] = None


def _get_collection() -> chromadb.Collection:
    global _client, _collection
    if _collection is None:
        settings = get_settings()

        if settings.use_chroma_http:
            _client = chromadb.HttpClient(
                host=settings.chroma_host,
                port=settings.chroma_port,
            )
            logger.info(f"ChromaDB HTTP client → {settings.chroma_host}:{settings.chroma_port}")
        else:
            # Local persistent client (dev mode)
            chroma_dir = settings.base_dir / "data" / "chroma_db"
            chroma_dir.mkdir(parents=True, exist_ok=True)
            _client = chromadb.PersistentClient(path=str(chroma_dir))
            logger.info(f"ChromaDB PersistentClient → {chroma_dir}")

        _collection = _client.get_or_create_collection(
            name=settings.chroma_collection_name,
            metadata={"hnsw:space": "cosine"},
        )
        logger.info(f"ChromaDB collection '{settings.chroma_collection_name}' ready with {_collection.count()} items")
    return _collection


def add_chunks(chunks: list[Chunk]) -> int:
    if not chunks:
        return 0

    collection = _get_collection()
    texts = [c.text for c in chunks]
    embeddings = embed_texts(texts)

    ids = [f"{c.document_id}_chunk_{c.chunk_index}" for c in chunks]
    metadatas = [
        {
            "document_id": c.document_id,
            "document_name": c.document_name,
            "page": c.page or 0,
            "paragraph": c.paragraph,
            "chunk_index": c.chunk_index,
        }
        for c in chunks
    ]

    # ChromaDB has a batch limit; process in batches of 500
    batch_size = 500
    for i in range(0, len(ids), batch_size):
        end = i + batch_size
        collection.add(
            ids=ids[i:end],
            embeddings=embeddings[i:end],
            documents=texts[i:end],
            metadatas=metadatas[i:end],
        )

    logger.info(f"Added {len(chunks)} chunks for document {chunks[0].document_id}")
    return len(chunks)


def search(query_embedding: list[float], top_k: int = 10) -> dict:
    collection = _get_collection()
    results = collection.query(
        query_embeddings=[query_embedding],
        n_results=min(top_k, collection.count() or 1),
        include=["documents", "metadatas", "distances"],
    )
    return results


def delete_by_document_id(document_id: str) -> int:
    collection = _get_collection()
    existing = collection.get(where={"document_id": document_id})
    if existing["ids"]:
        collection.delete(ids=existing["ids"])
        logger.info(f"Deleted {len(existing['ids'])} chunks for document {document_id}")
        return len(existing["ids"])
    return 0


def get_total_chunks() -> int:
    collection = _get_collection()
    return collection.count()
