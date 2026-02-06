from pydantic import BaseModel, Field
from datetime import datetime
from enum import Enum


class ProcessingStatus(str, Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    READY = "ready"
    ERROR = "error"


class DocumentMetadata(BaseModel):
    id: str
    filename: str
    file_type: str
    file_size: int
    page_count: int | None = None
    chunk_count: int = 0
    status: ProcessingStatus = ProcessingStatus.PENDING
    error_message: str | None = None
    uploaded_at: datetime = Field(default_factory=datetime.utcnow)
    processed_at: datetime | None = None


class DocumentResponse(BaseModel):
    documents: list[DocumentMetadata]
    total: int


class Citation(BaseModel):
    document_id: str
    document_name: str
    page: int | None = None
    paragraph: int | None = None
    text: str
    score: float


class SearchRequest(BaseModel):
    query: str = Field(..., min_length=1, max_length=1000)
    top_k: int = Field(default=10, ge=1, le=50)


class SearchResult(BaseModel):
    query: str
    results: list[Citation]
    total_results: int


class ChatRequest(BaseModel):
    query: str = Field(..., min_length=1, max_length=2000)
    top_k: int = Field(default=5, ge=1, le=20)


class ChatResponse(BaseModel):
    answer: str
    citations: list[Citation]
    ollama_available: bool = True


class StatsResponse(BaseModel):
    total_documents: int
    total_chunks: int
    documents_by_status: dict[str, int]
    documents_by_type: dict[str, int]
    ollama_status: str
