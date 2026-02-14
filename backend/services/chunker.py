import re
from dataclasses import dataclass

from backend.core.settings import get_settings


@dataclass
class Chunk:
    text: str
    document_id: str
    document_name: str
    page: int | None
    paragraph: int
    chunk_index: int


def _split_sentences(text: str) -> list[str]:
    """Split text into sentences, preserving sentence boundaries."""
    sentences = re.split(r'(?<=[.!?])\s+', text)
    return [s.strip() for s in sentences if s.strip()]


def chunk_pages(
    pages: list,
    document_id: str,
    document_name: str,
    chunk_size: int | None = None,
    overlap: int | None = None,
) -> list[Chunk]:
    """Chunk extracted pages into overlapping word-based chunks."""
    settings = get_settings()
    if chunk_size is None:
        chunk_size = settings.chunk_size_words
    if overlap is None:
        overlap = settings.chunk_overlap_words
    chunks: list[Chunk] = []
    chunk_index = 0

    for page in pages:
        sentences = _split_sentences(page.text)
        words: list[str] = []
        for sentence in sentences:
            words.extend(sentence.split())

        if not words:
            continue

        start = 0
        while start < len(words):
            end = min(start + chunk_size, len(words))
            chunk_words = words[start:end]
            chunk_text = " ".join(chunk_words)

            if chunk_text.strip():
                chunks.append(Chunk(
                    text=chunk_text,
                    document_id=document_id,
                    document_name=document_name,
                    page=page.page_number,
                    paragraph=start // chunk_size + 1,
                    chunk_index=chunk_index,
                ))
                chunk_index += 1

            if end >= len(words):
                break
            start += chunk_size - overlap

    return chunks
