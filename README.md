# LegalLens — Smart Document Search for Legal Professionals

LegalLens is a fully local, AI-powered document search and analysis tool built for lawyers. Upload legal documents (PDF, DOCX, TXT), search across them with natural language, find standard clauses, extract key terms, and ask questions — all without any data leaving your machine.

## Features

### Document Management
- **Drag-and-drop upload** — PDF, DOCX, and TXT files (up to 50MB)
- **Background processing** — uploads return instantly, indexing happens async
- **Document viewer** — read extracted text page-by-page with a navigator sidebar

### Smart Search
- **Semantic search** — natural language queries across all documents
- **Keyword highlighting** — matching terms highlighted in gold
- **Confidence scoring** — High / Medium / Low relevance badges
- **Recent searches** — clickable chips for quick re-search
- **Export to CSV** — download results for reporting

### Clause Finder
Pre-built search library for 12 clause types lawyers look for daily:
- Indemnification, Limitation of Liability, Termination, Force Majeure
- Confidentiality/NDA, Governing Law, Intellectual Property
- Representations & Warranties, Assignment, Notices, Non-Compete, Payment Terms

### Document Intelligence
Auto-extracted from every uploaded document:
- **Document classification** — Contract, Pleading, Memorandum, Correspondence, Court Order, Corporate, Regulatory
- **Parties** — names extracted from agreement headers
- **Key dates** — effective dates, deadlines, expirations
- **Monetary amounts** — dollar figures and currencies
- **Defined terms** — capitalized terms in quotes
- **Governing law** — jurisdiction detection
- **Legal references** — statutes and case citations

### Document Q&A (RAG)
- Ask questions about your documents in natural language
- Answers include clickable **[1][2] citation badges** linking to exact sources
- Citation detail panel shows document name, page, paragraph, and relevance score
- Suggested starter questions for common legal queries
- Graceful fallback when Ollama is not running

### Research & Bookmarks
- **Save to Research** — bookmark any search result or clause finding
- **Copy Citation** — one-click copy in legal citation format (`Document Name, at p. X`)
- **Copy for Brief** — formatted excerpt with citation
- **Export Memo** — generate a plain-text research memorandum
- **Matter filtering** — organize research by client/matter number

### Client/Matter Tagging
- Tag documents with Client Name and Matter Number
- Filter research by matter

### Additional
- **Command Palette** (⌘K) — spotlight-style navigation and search
- **Analytics** — search trends, top queries bar chart, activity timeline, storage usage
- **System Info** — environment details, service status, capability matrix
- **Toast notifications** — success/error feedback on all actions
- **100% local** — no data sent to any external service

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19 + TypeScript + Vite + Tailwind CSS 4 |
| Backend | Python FastAPI |
| LLM | Ollama (Llama 3.1 8B) — fully local |
| Embeddings | sentence-transformers (`all-MiniLM-L6-v2`, 80MB) |
| Vector DB | ChromaDB (local SQLite-based) |
| Doc Processing | PyPDF2, python-docx |

## Quick Start

### Prerequisites
- Python 3.11+
- Node.js 18+
- (Optional) [Ollama](https://ollama.ai) for Document Q&A

### Setup

```bash
# Clone
git clone https://github.com/YOUR_USERNAME/legal-lens.git
cd legal-lens

# Backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements.txt

# Frontend
cd frontend
npm install
cd ..
```

### Run

```bash
# Terminal 1 — Backend
source .venv/bin/activate
uvicorn backend.main:app --reload --port 8000

# Terminal 2 — Frontend
cd frontend
npm run dev
```

Open **http://localhost:5173**

### Optional: Enable Document Q&A

```bash
# Install Ollama from https://ollama.ai, then:
ollama pull llama3.1:8b
```

Search works without Ollama. Document Q&A requires it.

## Project Structure

```
legal-lens/
├── backend/
│   ├── main.py                    # FastAPI app, CORS, lifespan
│   ├── config.py                  # Centralized settings
│   ├── models/schemas.py          # Pydantic models
│   ├── routers/
│   │   ├── documents.py           # Upload, list, delete, content viewer, stats
│   │   ├── search.py              # Semantic search endpoint
│   │   ├── chat.py                # RAG Q&A via Ollama
│   │   ├── analytics.py           # Search analytics, activity log, system info
│   │   └── legal.py               # Key terms, clause library, bookmarks, matter tags
│   ├── services/
│   │   ├── document_processor.py  # PDF, DOCX, TXT extraction
│   │   ├── chunker.py             # Sentence-aware chunking (200 words, 50 overlap)
│   │   ├── embeddings.py          # sentence-transformers wrapper
│   │   ├── vector_store.py        # ChromaDB wrapper
│   │   ├── search_engine.py       # Semantic search + confidence scoring
│   │   ├── ollama_client.py       # Ollama HTTP client
│   │   ├── rag_engine.py          # Retrieve → prompt → generate → cite
│   │   ├── key_terms.py           # Legal term extraction + document classification
│   │   ├── clause_library.py      # Pre-built clause search definitions
│   │   ├── bookmarks.py           # Saved research management
│   │   └── activity_tracker.py    # Search & activity logging
│   ├── data/
│   │   ├── uploads/               # Original uploaded files
│   │   ├── processed/             # Metadata JSON files
│   │   └── chroma_db/             # Vector index (SQLite)
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── App.tsx                # Router setup
│   │   ├── types/index.ts         # TypeScript interfaces
│   │   ├── lib/api.ts             # API client
│   │   ├── components/
│   │   │   ├── Layout.tsx         # Sidebar + main content
│   │   │   ├── CommandPalette.tsx  # ⌘K spotlight search
│   │   │   └── Toast.tsx          # Notification system
│   │   └── pages/
│   │       ├── Dashboard.tsx      # Stats, quick search, activity
│   │       ├── Documents.tsx      # Upload + document table
│   │       ├── DocumentViewer.tsx # Page viewer + intelligence panel
│   │       ├── SearchPage.tsx     # Smart search + results
│   │       ├── ClauseLibrary.tsx  # Clause finder
│   │       ├── Chat.tsx           # RAG Q&A with citations
│   │       ├── ResearchPage.tsx   # Bookmarks + memo export
│   │       ├── AnalyticsPage.tsx  # Search trends + activity
│   │       └── SystemPage.tsx     # Environment + services
│   └── package.json
├── .gitignore
└── README.md
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/documents/upload` | Upload document (background processing) |
| GET | `/api/documents` | List all documents |
| GET | `/api/documents/:id/content` | View extracted text |
| GET | `/api/documents/:id/key-terms` | Extract parties, dates, amounts |
| DELETE | `/api/documents/:id` | Delete document + vectors |
| POST | `/api/search` | Semantic search |
| GET | `/api/clauses` | List clause types |
| GET | `/api/clauses/:id/search` | Find clauses across documents |
| POST | `/api/chat` | RAG Q&A via Ollama |
| GET | `/api/chat/status` | Check Ollama availability |
| POST | `/api/bookmarks` | Save research excerpt |
| GET | `/api/bookmarks` | List saved research |
| PUT | `/api/documents/:id/matter` | Tag with client/matter |
| GET | `/api/stats` | Dashboard statistics |
| GET | `/api/analytics` | Search trends + storage |

## Design Decisions

- **No LangChain** — direct integration is simpler, more debuggable
- **No "AI" in the UI** — positioned as "Smart Search" and "Document Intelligence"
- **Always show citations** — every result links to exact document, page, paragraph
- **Graceful degradation** — search works without Ollama; chat shows clear setup instructions
- **Single ChromaDB collection** — metadata filtering for scoping, simpler than multi-collection
- **Background processing** — uploads return immediately, processing is async
- **All local** — zero external API calls, suitable for privileged/confidential documents

## License

MIT
