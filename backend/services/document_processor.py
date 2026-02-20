import logging
from pathlib import Path

from docx import Document
from PyPDF2 import PdfReader

logger = logging.getLogger(__name__)


class ExtractedPage:
    def __init__(self, text: str, page_number: int | None = None):
        self.text = text
        self.page_number = page_number


def extract_pdf(file_path: Path) -> list[ExtractedPage]:
    reader = PdfReader(str(file_path))
    pages = []
    for i, page in enumerate(reader.pages):
        text = page.extract_text() or ""
        text = text.strip()
        if text:
            pages.append(ExtractedPage(text=text, page_number=i + 1))
    return pages


def extract_docx(file_path: Path) -> list[ExtractedPage]:
    doc = Document(str(file_path))
    full_text = "\n".join(p.text for p in doc.paragraphs if p.text.strip())
    if not full_text.strip():
        return []
    return [ExtractedPage(text=full_text, page_number=1)]


def extract_txt(file_path: Path) -> list[ExtractedPage]:
    text = file_path.read_text(encoding="utf-8", errors="replace").strip()
    if not text:
        return []
    return [ExtractedPage(text=text, page_number=1)]


EXTRACTORS = {
    ".pdf": extract_pdf,
    ".docx": extract_docx,
    ".txt": extract_txt,
}


def extract_text(file_path: Path) -> list[ExtractedPage]:
    suffix = file_path.suffix.lower()
    extractor = EXTRACTORS.get(suffix)
    if not extractor:
        raise ValueError(f"Unsupported file type: {suffix}")
    logger.info(f"Extracting text from {file_path.name} ({suffix})")
    return extractor(file_path)
