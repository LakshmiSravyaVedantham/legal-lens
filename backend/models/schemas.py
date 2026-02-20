from datetime import datetime
from enum import Enum

from pydantic import BaseModel, Field


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


class ChatResponseWithFollowUps(BaseModel):
    answer: str
    citations: list[Citation]
    ollama_available: bool = True
    follow_up_suggestions: list[str] = []


class StatsResponse(BaseModel):
    total_documents: int
    total_chunks: int
    documents_by_status: dict[str, int]
    documents_by_type: dict[str, int]
    ollama_status: str


# ---------------------------------------------------------------------------
# AI Analysis Models
# ---------------------------------------------------------------------------

class RiskItem(BaseModel):
    clause: str
    risk_level: str  # low, medium, high
    description: str
    recommendation: str


class ChecklistItem(BaseModel):
    provision: str
    status: str  # pass, fail, review
    detail: str
    section: str | None = None


class ObligationItem(BaseModel):
    party: str
    obligation: str
    type: str  # obligation, duty, right, restriction
    deadline: str | None = None
    section: str | None = None
    priority: str = "medium"


class TimelineEvent(BaseModel):
    date: str
    event: str
    category: str  # execution, deadline, payment, renewal, termination, notice, other
    party: str | None = None


class ComparisonProvision(BaseModel):
    provision: str
    document_a: str
    document_b: str
    status: str  # match, different, only_a, only_b
