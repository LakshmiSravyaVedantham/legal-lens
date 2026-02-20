"""Unit tests for the chunker service — no DB needed."""

from dataclasses import dataclass
from unittest.mock import MagicMock, patch

from backend.services.chunker import Chunk, _split_sentences, chunk_pages


def test_split_sentences_basic():
    text = "First sentence. Second sentence. Third sentence."
    result = _split_sentences(text)
    assert len(result) == 3
    assert result[0] == "First sentence."
    assert result[2] == "Third sentence."


def test_split_sentences_with_question_and_exclamation():
    text = "Is this a question? Yes it is! And another sentence."
    result = _split_sentences(text)
    assert len(result) == 3


def test_split_sentences_empty():
    assert _split_sentences("") == []
    assert _split_sentences("   ") == []


def test_split_sentences_no_punctuation():
    text = "This has no period at the end"
    result = _split_sentences(text)
    assert len(result) == 1
    assert result[0] == "This has no period at the end"


@dataclass
class FakePage:
    text: str
    page_number: int


@patch("backend.services.chunker.get_settings")
def test_chunk_pages_basic(mock_settings):
    settings = MagicMock()
    settings.chunk_size_words = 10
    settings.chunk_overlap_words = 3
    mock_settings.return_value = settings

    pages = [FakePage(text="word " * 25, page_number=1)]
    chunks = chunk_pages(pages, document_id="doc-1", document_name="test.pdf")

    assert len(chunks) > 1
    assert all(isinstance(c, Chunk) for c in chunks)
    assert chunks[0].document_id == "doc-1"
    assert chunks[0].document_name == "test.pdf"
    assert chunks[0].page == 1
    assert chunks[0].chunk_index == 0


@patch("backend.services.chunker.get_settings")
def test_chunk_pages_preserves_text(mock_settings):
    settings = MagicMock()
    settings.chunk_size_words = 5
    settings.chunk_overlap_words = 2
    mock_settings.return_value = settings

    pages = [FakePage(text="The quick brown fox jumps over the lazy dog.", page_number=1)]
    chunks = chunk_pages(pages, document_id="doc-1", document_name="test.txt")

    # All original words should appear in at least one chunk
    all_chunk_text = " ".join(c.text for c in chunks)
    for word in ["quick", "brown", "fox", "jumps", "lazy", "dog"]:
        assert word in all_chunk_text


@patch("backend.services.chunker.get_settings")
def test_chunk_pages_empty(mock_settings):
    settings = MagicMock()
    settings.chunk_size_words = 10
    settings.chunk_overlap_words = 3
    mock_settings.return_value = settings

    pages = [FakePage(text="", page_number=1)]
    chunks = chunk_pages(pages, document_id="doc-1", document_name="empty.txt")
    assert chunks == []


@patch("backend.services.chunker.get_settings")
def test_chunk_pages_multiple_pages(mock_settings):
    settings = MagicMock()
    settings.chunk_size_words = 10
    settings.chunk_overlap_words = 2
    mock_settings.return_value = settings

    pages = [
        FakePage(text="Page one content here with several words.", page_number=1),
        FakePage(text="Page two has different content entirely.", page_number=2),
    ]
    chunks = chunk_pages(pages, document_id="doc-1", document_name="multi.pdf")

    page_numbers = {c.page for c in chunks}
    assert 1 in page_numbers
    assert 2 in page_numbers


@patch("backend.services.chunker.get_settings")
def test_chunk_pages_custom_size(mock_settings):
    settings = MagicMock()
    settings.chunk_size_words = 200
    settings.chunk_overlap_words = 50
    mock_settings.return_value = settings

    pages = [FakePage(text="word " * 5, page_number=1)]
    chunks = chunk_pages(pages, document_id="doc-1", document_name="short.txt",
                         chunk_size=5, overlap=0)

    # With only 5 words and chunk_size=5, should be 1 chunk
    assert len(chunks) == 1


@patch("backend.services.chunker.get_settings")
def test_chunk_indices_sequential(mock_settings):
    settings = MagicMock()
    settings.chunk_size_words = 5
    settings.chunk_overlap_words = 1
    mock_settings.return_value = settings

    pages = [
        FakePage(text="word " * 20, page_number=1),
        FakePage(text="word " * 20, page_number=2),
    ]
    chunks = chunk_pages(pages, document_id="doc-1", document_name="test.pdf")
    indices = [c.chunk_index for c in chunks]
    assert indices == list(range(len(chunks)))
