# LegalLens — Project Overview & Strategy Guide

---

## 1. What Exactly Is LegalLens?

LegalLens is a **self-hosted, AI-powered document intelligence platform built for legal professionals**. It allows lawyers, paralegals, and legal teams to upload contracts, pleadings, memos, and other legal documents — then search, analyze, and interrogate them using natural language and AI.

Think of it as a **private, local-first alternative to commercial legal AI tools** (like Harvey AI, CoCounsel, or Luminance) that a firm can run on its own infrastructure, keeping all data in-house.

### What It Actually Does (End to End)

1. **Upload** — A user uploads a PDF, DOCX, or TXT file.
2. **Process** — The backend extracts text, splits it into ~200-word overlapping chunks, and generates 384-dimensional vector embeddings using a local sentence-transformers model.
3. **Index** — Chunks and their vectors are stored in ChromaDB (vector database). Metadata goes to MongoDB.
4. **Search** — A user types a natural-language query. The system embeds the query and finds the most semantically similar chunks using cosine similarity, returning ranked results with page numbers and confidence scores.
5. **Q&A (RAG)** — The user asks a question. The system retrieves relevant chunks, feeds them as context to an LLM (Ollama/Claude/GPT), and generates an answer with numbered citations pointing back to source documents and pages.
6. **AI Analysis** — The user can run 5 types of AI analysis on any document:
   - **Summary** — Title, key points, parties involved.
   - **Risk Analysis** — Risk score (0-100), individual risk items with severity levels.
   - **Compliance Checklist** — 15+ standard contract provisions, scored pass/fail/review.
   - **Obligations** — Extracts duties, rights, restrictions with deadlines and responsible parties.
   - **Timeline** — Chronological events, deadlines, durations.
7. **Compare** — Side-by-side comparison of two documents (differences, similarities, recommendations).
8. **Clause Finder** — Search for specific clause types (indemnification, force majeure, termination, etc.) across all documents using pre-built multi-query templates.
9. **Research & Memos** — Bookmark search results, tag by matter/client, then generate AI-written legal memos from selected bookmarks.
10. **Analytics & Audit** — Search trends, usage stats, and a full audit trail of who uploaded/deleted/analyzed what, with IP tracking.

### The Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| Frontend | React 19 + TypeScript + Tailwind CSS | Modern, type-safe, fast UI |
| Backend | Python FastAPI (async) | High-performance async API |
| Database | MongoDB (via Motor async driver) | Flexible schema, multi-tenant |
| Vector DB | ChromaDB | Lightweight, embeddable vector search |
| Embeddings | sentence-transformers (all-MiniLM-L6-v2) | Fast, 80MB local model, no API needed |
| LLM | Ollama / Anthropic Claude / OpenAI GPT / Azure OpenAI | Pluggable, fallback chain, per-org config |
| Auth | JWT (access + refresh tokens), bcrypt | Stateless, secure |
| Deployment | Docker Compose | One-command setup |

---

## 2. Is This a Good Project?

**Short answer: Yes — it is a well-architected, practical project that solves a real problem.**

### Strengths

**Solves a Real Market Need**
- Legal professionals spend 20-40% of their time on document review. AI-assisted search and analysis directly reduces this.
- Commercial alternatives (Harvey, CoCounsel) cost $500-2000+/user/month. A self-hosted tool removes that cost barrier.
- Privacy-conscious firms (which is most of them) need solutions where documents never leave their infrastructure. LegalLens is local-first by design.

**Solid Architecture**
- Multi-tenant from day one (organization-based isolation, role-based access control).
- Async throughout (FastAPI + Motor + background tasks) — can handle concurrent users.
- LLM-agnostic with fallback chains — works offline with Ollama, or with cloud APIs when configured.
- Cache-first AI analysis — avoids redundant expensive LLM calls.
- Clean separation of concerns (routers, services, models, middleware).

**Production-Ready Features**
- JWT auth with refresh tokens and auto-renewal.
- Rate limiting per endpoint type (auth, AI, upload, search).
- Audit logging with IP tracking and 90-day TTL.
- Encrypted API key storage (Fernet symmetric encryption).
- Background document processing with status polling.
- Docker Compose deployment with health checks.

**Practical AI Features**
- RAG Q&A with numbered citations (not just hallucinated answers).
- Clause library with pre-built multi-query search templates — very practical for contract review.
- AI memo generation from bookmarked research — useful workflow.
- Search query expansion with legal synonyms.

### Weaknesses (and Opportunities)

| Weakness | Impact | Opportunity |
|----------|--------|-------------|
| No OCR — scanned PDFs are invisible | Many legal docs are scanned | Add Tesseract/PaddleOCR integration |
| No hybrid search (BM25 + semantic) | Exact-match queries underperform | Add keyword search alongside vector search |
| Single ChromaDB collection for all orgs | Slight isolation concern at scale | Partition by org or use per-org collections |
| No real-time collaboration | Single-user feel | Add WebSocket-based live updates |
| No document versioning | Can't track contract revisions | Add version history per document |
| No email/attachment parsing | Lawyers work heavily in email | Add .eml/.msg support |
| No test coverage for frontend | Risky for refactoring | Add component tests with Vitest |
| Demo mode hardcoded in API client | Clutters production code | Extract to separate module |

### Competitive Positioning

| Feature | LegalLens | Harvey AI | CoCounsel | Luminance |
|---------|-----------|-----------|-----------|-----------|
| Self-hosted | Yes | No | No | Hybrid |
| Data privacy | Full local | Cloud | Cloud | Hybrid |
| Cost | Free/infra only | $$$$ | $$$$ | $$$$ |
| Multi-LLM support | Yes | GPT only | GPT only | Proprietary |
| Open source | Yes | No | No | No |
| OCR | Not yet | Yes | Yes | Yes |
| Contract analytics | Yes | Yes | Yes | Yes |
| Clause search | Yes | Limited | Yes | Yes |

**Verdict**: LegalLens occupies a unique niche — **open-source, self-hosted, privacy-first legal AI**. This is a strong position because:
- Law firms have strict data handling requirements.
- Small/mid-size firms can't afford commercial tools.
- IT departments at larger firms want control over infrastructure.

---

## 3. How to Approach This Project

### Understanding the Problem Domain

Legal document work has these core pain points:

1. **Finding information** — "Which of our 500 contracts have indemnification clauses?" Currently: manual reading or basic Ctrl+F. LegalLens: semantic search across all documents.

2. **Understanding documents** — "What are the key risks in this contract?" Currently: senior lawyer reads the whole thing. LegalLens: AI analysis in seconds.

3. **Answering questions** — "What does clause 7.3 say about termination?" Currently: find the doc, find the page, read. LegalLens: ask in natural language, get cited answer.

4. **Research & memos** — "Summarize the indemnification provisions across these 5 contracts." Currently: hours of manual work. LegalLens: bookmark relevant excerpts, generate memo with AI.

### Architecture Mental Model

Think of LegalLens as three pipelines connected by two databases:

```
INGESTION PIPELINE          QUERY PIPELINE           ANALYSIS PIPELINE

Upload → Extract →          Query → Embed →          Document → LLM →
Chunk → Embed →             Vector Search →          Structured JSON →
Store                       Rank & Return            Cache & Return

    ↓ writes to                ↓ reads from             ↓ reads/writes

    [ChromaDB]                 [ChromaDB]               [MongoDB]
    (vectors + text)           (vectors + text)         (cache + metadata)

    [MongoDB]                  [MongoDB]
    (metadata + status)        (search history)
```

### Key Code Paths to Understand First

If you're onboarding to this codebase, read these files in this order:

| Order | File | What You Learn |
|-------|------|---------------|
| 1 | `backend/core/settings.py` | All configuration knobs |
| 2 | `backend/main.py` | App bootstrap, middleware, router registration |
| 3 | `backend/routers/documents.py` | Upload → process → store flow |
| 4 | `backend/services/document_processor.py` | How text is extracted |
| 5 | `backend/services/chunker.py` | How text is split |
| 6 | `backend/services/embeddings.py` | How vectors are generated |
| 7 | `backend/services/vector_store.py` | How ChromaDB is used |
| 8 | `backend/services/search_engine.py` | How search works |
| 9 | `backend/services/rag_engine.py` | How Q&A works |
| 10 | `backend/services/ai_features.py` | All AI analysis prompts and parsing |
| 11 | `backend/services/llm/manager.py` | Multi-provider LLM orchestration |
| 12 | `frontend/src/lib/api.ts` | Frontend API client |
| 13 | `frontend/src/App.tsx` | Routing and auth context |

### Data Flow Cheat Sheet

**Upload a document:**
```
User → Documents.tsx → api.uploadDocument() → POST /api/documents/upload
  → documents.py: validate file → save to disk → insert MongoDB record
  → BackgroundTask: extract_text() → chunk_pages() → embed → add to ChromaDB
  → status: pending → processing → ready
```

**Search documents:**
```
User → SearchPage.tsx → api.search() → POST /api/search
  → search.py → search_engine.semantic_search()
    → embeddings.embed_query() → vector_store.search()
    → ChromaDB cosine similarity → rank by score → return Citations
```

**Ask a question (RAG):**
```
User → Chat.tsx → api.chat() → POST /api/chat
  → chat.py → rag_engine.ask_with_follow_ups()
    → semantic_search (top 5 chunks) → build context with [1][2] markers
    → LLM generate answer → parse citations → return answer + sources
```

**AI analysis:**
```
User → AIInsights.tsx → api.analyzeDocument() → POST /api/ai/documents/{id}/analyze
  → ai.py → _run_analysis()
    → check cache (MongoDB ai_analyses) → if cached, return
    → get_doc_text() → ai_features.analyze_risks(text, llm)
      → build prompt → LLM generate → parse JSON → save to cache → return
```

---

## 4. How to Proceed — Recommended Roadmap

### Phase 1: Stabilize & Harden (Current — Just Completed)

What we just did in the improvement plan:
- [x] Fixed CORS wildcard vulnerability
- [x] Fixed regex injection in bookmarks
- [x] Added startup security warnings
- [x] Added streaming upload with size checks
- [x] Added MIME type validation
- [x] Stopped leaking error details from AI endpoints
- [x] Added Docker security (non-root user, security headers, resource limits)
- [x] Added React ErrorBoundary
- [x] Fixed TypeScript error handling patterns
- [x] Added accessibility improvements
- [x] Extracted shared components

### Phase 2: Testing & Reliability (Next Priority)

**Why**: The codebase has minimal test coverage. Before adding features, build confidence.

| Task | Effort | Impact |
|------|--------|--------|
| Backend unit tests for services (chunker, search, key_terms) | 2-3 days | High — these are deterministic and testable |
| Backend integration tests (upload → process → search flow) | 2-3 days | High — validates the core pipeline |
| Frontend component tests (Dashboard, Documents, Login) | 2-3 days | Medium — catches UI regressions |
| E2E smoke test (Playwright: login → upload → search → Q&A) | 1-2 days | High — validates full flow |
| CI pipeline (GitHub Actions: lint + test + build) | 1 day | High — prevents regressions |

### Phase 3: Search Quality (High Impact)

**Why**: Search is the core feature. Making it better has outsized impact.

| Task | Effort | Impact |
|------|--------|--------|
| Hybrid search (BM25 keyword + semantic vector, combined scoring) | 2-3 days | Very High — catches exact matches that semantic misses |
| Better chunking (respect section headers, paragraph boundaries) | 1-2 days | High — improves retrieval quality |
| Re-ranking (cross-encoder model on top-k results) | 1-2 days | High — improves precision |
| Metadata filters (filter by document type, date range, matter) | 1-2 days | Medium — useful for targeted search |

### Phase 4: Document Processing (Expands Scope)

| Task | Effort | Impact |
|------|--------|--------|
| OCR for scanned PDFs (Tesseract or PaddleOCR) | 2-3 days | Very High — unlocks scanned documents |
| Table extraction (tabula-py for PDF tables) | 2-3 days | High — contracts have tables |
| Email parsing (.eml/.msg files) | 1-2 days | Medium — lawyers work in email |
| Document versioning (track revisions of same contract) | 2-3 days | Medium — useful for negotiations |

### Phase 5: Collaboration & UX (Scales to Teams)

| Task | Effort | Impact |
|------|--------|--------|
| Real-time status updates (WebSocket for processing status) | 1-2 days | Medium — replaces polling |
| Shared annotations (highlight + comment on document text) | 3-5 days | Medium — team collaboration |
| Notification system (analysis complete, new documents) | 1-2 days | Low-Medium |
| Mobile-responsive layout | 2-3 days | Medium — tablets in courtrooms |

### Phase 6: Enterprise Features (If Scaling)

| Task | Effort | Impact |
|------|--------|--------|
| SSO/SAML integration | 3-5 days | High for enterprise |
| Document-level permissions (beyond org-level) | 2-3 days | High for larger firms |
| Backup & restore tooling | 1-2 days | High for production |
| Prometheus/Grafana observability | 1-2 days | High for ops |
| Kubernetes Helm chart | 2-3 days | High for enterprise deployment |

---

## 5. Who Should Work On This & How

### Ideal Team Structure

| Role | Responsibility | Skills Needed |
|------|---------------|---------------|
| **Backend Developer** | API, services, LLM integration, search quality | Python, FastAPI, MongoDB, NLP basics |
| **Frontend Developer** | React UI, accessibility, UX improvements | React, TypeScript, Tailwind |
| **ML/AI Engineer** | Embedding models, RAG optimization, prompt engineering | NLP, vector search, LLM prompting |
| **DevOps** | Docker, CI/CD, monitoring, security | Docker, GitHub Actions, Linux |

For a solo developer or small team, prioritize: **Backend + ML** over frontend polish. The UI works fine — the value is in the search quality and AI analysis.

### How to Set Up for Development

```bash
# 1. Clone and enter the project
cd legal-lens

# 2. Start infrastructure (MongoDB + ChromaDB)
docker compose up mongodb chromadb -d

# 3. Backend (in one terminal)
python -m venv .venv && source .venv/bin/activate
pip install -r backend/requirements.txt
uvicorn backend.main:app --reload --port 8000

# 4. Frontend (in another terminal)
cd frontend && npm install && npm run dev

# 5. (Optional) Start Ollama for local LLM
ollama serve &
ollama pull llama3.1:8b

# 6. Open http://localhost:5173, register an account, upload a document
```

### Key Environment Variables

```env
# Required
JWT_SECRET_KEY=generate-a-random-64-char-string-here
ENCRYPTION_KEY=generate-a-fernet-key-here

# Infrastructure
MONGO_URI=mongodb://legallens:legallens@localhost:27017/legallens?authSource=admin
CHROMA_HOST=localhost
CHROMA_PORT=8100

# LLM (at least one)
OLLAMA_BASE_URL=http://localhost:11434
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...

# CORS (for development)
CORS_ORIGINS=["http://localhost:5173","http://localhost:80"]
```

---

## 6. Summary

| Question | Answer |
|----------|--------|
| **What is it?** | A self-hosted AI platform for legal document search, analysis, and Q&A |
| **Is it good?** | Yes — clean architecture, real-world utility, unique market position |
| **Who is it for?** | Law firms, legal departments, compliance teams who need document intelligence with data privacy |
| **What's the biggest strength?** | Privacy-first, multi-LLM, full-featured (search + Q&A + 5 AI analyses + clause finder + memo generation) |
| **What's the biggest gap?** | No OCR, no hybrid search, limited test coverage |
| **What to do next?** | Add tests (Phase 2), then improve search quality (Phase 3), then add OCR (Phase 4) |
| **How long to production?** | With the security hardening done, it's deployable now for internal use. 2-4 weeks more for production confidence (tests + monitoring). |
