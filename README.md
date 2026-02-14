<div align="center">

# LegalLens

**Open-Source AI-Powered Document Intelligence for Legal Professionals**

[![CI](https://github.com/LakshmiSravya123/legal-lens/actions/workflows/ci.yml/badge.svg)](https://github.com/LakshmiSravya123/legal-lens/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-gold.svg)](LICENSE)
[![Python 3.12+](https://img.shields.io/badge/Python-3.12+-3776ab.svg)](https://python.org)
[![React 19](https://img.shields.io/badge/React-19-61dafb.svg)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178c6.svg)](https://typescriptlang.org)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ed.svg)](docker-compose.yml)

*Upload contracts, pleadings, and legal documents. Search with natural language. Get AI-powered risk analysis, compliance checklists, and cited answers — all without data leaving your infrastructure.*

**[Quick Start](#-quick-start)** · **[Features](#-features)** · **[Deploy](#-one-click-deploy)** · **[Architecture](#-architecture)** · **[API Docs](#-api-endpoints)** · **[Contributing](#-contributing)**

---

<!-- Replace with actual screenshot or demo GIF -->
<!-- ![LegalLens Demo](docs/demo.gif) -->

> **Screenshot placeholder** — Record a demo using the [DEMO.md](DEMO.md) script and add it here.
> Recommended: Use a tool like [Kap](https://getkap.co/) or [ScreenToGif](https://www.screentogif.com/) to record a 30-60s GIF showing upload, search, and AI analysis.

</div>

---

## Why LegalLens?

| Problem | LegalLens Solution |
|---------|-------------------|
| Commercial legal AI costs $500–$1,200/user/month | **Free and open source** |
| Firms can't send privileged documents to cloud AI | **Self-hosted, 100% local option** |
| Locked into one AI provider | **Multi-LLM: Ollama, Claude, GPT, Azure** |
| Black-box AI with no citations | **Every answer cites exact document + page** |
| No control over infrastructure | **Docker Compose, one-command deploy** |

---

## One-Click Deploy

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/LakshmiSravya123/legal-lens)
[![Deploy on Railway](https://railway.com/button.svg)](https://railway.com/template?referralCode=legallens&repo=https://github.com/LakshmiSravya123/legal-lens)

Or run locally with Docker:

```bash
git clone https://github.com/LakshmiSravya123/legal-lens.git
cd legal-lens
cp .env.example .env
docker compose up --build
# Open http://localhost
```

---

## Features

### Document Management
- **Drag-and-drop upload** — PDF, DOCX, TXT (up to 50MB)
- **Background processing** — uploads return instantly, indexing happens async
- **Document viewer** — page-by-page text with sidebar navigator
- **Client/matter tagging** — organize documents by case or client

### Semantic Search
- **Natural language queries** across all documents
- **Confidence scoring** — High / Medium / Low relevance badges
- **Keyword highlighting** — matching terms highlighted in gold
- **AI query expansion** — suggests legal synonyms and related terms
- **Export to CSV** for reporting

### AI Analysis (9 Features)
Run any of these on any uploaded document:

| Feature | What It Does |
|---------|-------------|
| **Summary** | Title, key points, parties involved |
| **Risk Analysis** | Risk score (0-100), individual risks with severity |
| **Compliance Checklist** | 15+ standard provisions, scored pass/fail/review |
| **Obligations** | Duties, rights, restrictions with deadlines |
| **Timeline** | Chronological events, deadlines, durations |
| **Document Comparison** | Side-by-side diff of two documents |
| **Legal Memo** | AI-generated brief from bookmarked research |
| **Query Expansion** | Legal synonyms for better search |
| **Document Q&A** | RAG with numbered [1][2] citations |

### Clause Finder
Pre-built search templates for 12 clause types:
Indemnification, Limitation of Liability, Termination, Force Majeure, Confidentiality/NDA, Governing Law, IP, Representations & Warranties, Assignment, Notices, Non-Compete, Payment Terms

### Document Intelligence (Auto-Extracted)
- **Document classification** — Contract, Pleading, Memorandum, Court Order, etc.
- **Parties** — names from agreement headers
- **Key dates** — effective dates, deadlines, expirations
- **Monetary amounts** — dollar figures and currencies
- **Defined terms** — capitalized terms in quotes
- **Governing law** — jurisdiction detection
- **Legal references** — statutes and case citations

### Research & Memos
- **Bookmark** any search result or clause finding
- **Copy Citation** — one-click legal citation format
- **Matter filtering** — organize by client/matter
- **Export Memo** — plain-text research memorandum
- **AI Brief** — generate structured legal memos from bookmarks

### Platform
- **Multi-tenant** — organization-based isolation with role-based access
- **JWT auth** — access + refresh tokens, bcrypt passwords
- **Rate limiting** — per-endpoint limits (auth, AI, upload, search)
- **Audit logging** — who uploaded/deleted/analyzed what, with IP tracking
- **Command palette** (Cmd+K) — spotlight-style navigation
- **Analytics** — search trends, top queries, activity timeline
- **100% local option** — all processing on your machine with Ollama

---

## Architecture

```
┌──────────────────────────────────────────────────────────┐
│                        Frontend                          │
│              React 19 + TypeScript + Tailwind            │
│         Dashboard · Search · Q&A · AI Insights           │
└────────────────────────┬─────────────────────────────────┘
                         │ REST API
┌────────────────────────┴─────────────────────────────────┐
│                     FastAPI Backend                       │
│                                                          │
│  ┌─────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │ Upload  │  │ Semantic │  │ RAG Q&A  │  │    AI    │  │
│  │Pipeline │  │ Search   │  │ Engine   │  │ Analysis │  │
│  └────┬────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘  │
│       │            │             │              │        │
│  ┌────┴────────────┴─────────────┴──────────────┴────┐   │
│  │         sentence-transformers (384-dim)            │   │
│  └───────────────────────┬───────────────────────────┘   │
└──────────────────────────┼───────────────────────────────┘
                           │
          ┌────────────────┼────────────────┐
          │                │                │
   ┌──────┴──────┐  ┌─────┴─────┐  ┌──────┴──────┐
   │  ChromaDB   │  │  MongoDB  │  │  LLM Layer  │
   │  (vectors)  │  │ (metadata │  │  Ollama /    │
   │             │  │  + auth)  │  │  Claude /    │
   │             │  │           │  │  GPT / Azure │
   └─────────────┘  └───────────┘  └─────────────┘
```

### Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | React 19 + TypeScript + Vite + Tailwind CSS 4 | Type-safe, fast UI |
| Backend | Python FastAPI (async) | High-performance API |
| Database | MongoDB (Motor async driver) | Multi-tenant data |
| Vector DB | ChromaDB | Semantic search index |
| Embeddings | sentence-transformers (`all-MiniLM-L6-v2`) | 384-dim vectors, 80MB |
| LLM | Ollama / Anthropic / OpenAI / Azure | Pluggable with fallback |
| Auth | JWT + bcrypt + Fernet encryption | Secure, stateless |
| Deploy | Docker Compose | One-command setup |

---

## Quick Start

### Option 1: Docker (Recommended)

```bash
git clone https://github.com/LakshmiSravya123/legal-lens.git
cd legal-lens
cp .env.example .env       # Edit secrets before production use
docker compose up --build   # Start all services
# Open http://localhost
```

With local LLM (Ollama):
```bash
docker compose --profile ollama up --build
```

### Option 2: Local Development

**Prerequisites:** Python 3.11+, Node.js 18+, MongoDB running locally

```bash
# Clone
git clone https://github.com/LakshmiSravya123/legal-lens.git
cd legal-lens

# Backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r backend/requirements.txt
uvicorn backend.main:app --reload --port 8000

# Frontend (new terminal)
cd frontend && npm install && npm run dev

# Open http://localhost:5173
```

### Option 3: Try the Demo

Upload the sample documents from `demo/sample-documents/` to explore features without your own files.

```bash
# After starting the app, register an account, then:
# 1. Go to Documents page
# 2. Upload the .txt files from demo/sample-documents/
# 3. Wait for processing, then try Search, Clauses, and AI Analysis
```

### Enable AI Features

Search works without any LLM. For AI analysis and Q&A, configure at least one provider:

| Provider | Setup |
|----------|-------|
| **Ollama** (free, local) | Install from [ollama.ai](https://ollama.ai), run `ollama pull llama3.1:8b` |
| **Anthropic Claude** | Set `ANTHROPIC_API_KEY` in `.env` |
| **OpenAI GPT** | Set `OPENAI_API_KEY` in `.env` |
| **Azure OpenAI** | Set `AZURE_OPENAI_*` vars in `.env` |

Or configure per-organization via **Settings > LLM Providers** in the UI.

---

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/register` | Register user + organization |
| POST | `/api/auth/login` | Login, returns JWT tokens |
| POST | `/api/documents/upload` | Upload document (async processing) |
| GET | `/api/documents` | List organization documents |
| GET | `/api/documents/:id/content` | View extracted text by page |
| DELETE | `/api/documents/:id` | Delete document + vectors |
| POST | `/api/search` | Semantic search |
| POST | `/api/chat` | RAG Q&A with citations |
| GET | `/api/clauses` | List clause types |
| GET | `/api/clauses/:id/search` | Find clauses across documents |
| POST | `/api/ai/documents/:id/analyze` | Run AI analysis (summary, risks, etc.) |
| POST | `/api/ai/compare` | Compare two documents |
| POST | `/api/ai/brief` | Generate legal memo |
| POST | `/api/bookmarks` | Save research excerpt |
| GET | `/api/bookmarks` | List saved research |
| GET | `/api/stats` | Dashboard statistics |
| GET | `/api/analytics` | Search trends + storage |
| GET | `/api/health` | Health check |

Full interactive docs at `http://localhost:8000/docs` (Swagger UI).

---

## Project Structure

```
legal-lens/
├── backend/
│   ├── main.py                      # FastAPI app entry point
│   ├── core/
│   │   ├── settings.py              # Environment configuration
│   │   ├── database.py              # MongoDB connection
│   │   ├── security.py              # Password hashing, JWT
│   │   └── encryption.py            # Fernet API key encryption
│   ├── routers/                     # API endpoints
│   │   ├── auth.py, documents.py, search.py, chat.py
│   │   ├── ai.py, legal.py, analytics.py, audit.py
│   │   └── health.py, llm_config.py
│   ├── services/                    # Business logic
│   │   ├── document_processor.py    # PDF/DOCX/TXT extraction
│   │   ├── chunker.py              # Sentence-aware chunking
│   │   ├── embeddings.py           # sentence-transformers
│   │   ├── vector_store.py         # ChromaDB operations
│   │   ├── search_engine.py        # Semantic search
│   │   ├── rag_engine.py           # RAG Q&A with citations
│   │   ├── ai_features.py          # 9 AI analysis functions
│   │   ├── key_terms.py            # Legal term extraction
│   │   ├── clause_library.py       # 12 clause search templates
│   │   ├── bookmarks.py            # Research management
│   │   └── llm/                    # Multi-provider LLM layer
│   │       ├── manager.py          # Fallback chain orchestration
│   │       ├── ollama.py, anthropic.py, openai_provider.py
│   │       └── base.py             # Abstract LLM interface
│   ├── middleware/                   # Auth, rate limiting, logging
│   ├── models/                      # Pydantic schemas
│   └── tests/                       # pytest suite (30+ tests)
├── frontend/
│   ├── src/
│   │   ├── pages/                   # Dashboard, Documents, Search, Chat, AI, etc.
│   │   ├── components/              # Layout, CommandPalette, ErrorBoundary, etc.
│   │   ├── lib/                     # API client, auth helpers
│   │   └── types/                   # TypeScript interfaces
│   └── package.json
├── docker/
│   ├── Dockerfile.backend
│   ├── Dockerfile.frontend
│   ├── nginx.conf                   # Reverse proxy + security headers
│   └── mongo-init.js                # DB initialization
├── demo/
│   └── sample-documents/            # Sample legal docs for testing
├── docker-compose.yml
├── render.yaml                      # One-click Render deploy
├── railway.json                     # One-click Railway deploy
├── Makefile                         # Convenience commands
└── .github/workflows/ci.yml        # CI: lint, test, build, Docker
```

---

## Makefile Commands

```bash
make up        # Start all services
make ollama    # Start with local LLM
make down      # Stop services
make build     # Rebuild containers
make logs      # Follow all logs
make status    # Show service health
make clean     # Remove everything (incl. volumes)
make admin     # Create admin user
make setup     # Copy .env.example → .env
```

---

## Design Decisions

- **No LangChain** — direct LLM integration is simpler and more debuggable
- **Multi-tenant from day one** — organization-based isolation, role-based access
- **Cache-first AI** — analyses cached in MongoDB, avoids redundant LLM calls
- **LLM fallback chains** — tries providers in order until one succeeds
- **Background processing** — uploads return instantly, heavy work is async
- **Always cite sources** — every AI answer links to exact document + page
- **Graceful degradation** — search works without any LLM; Q&A shows clear setup instructions
- **No vendor lock-in** — works with Ollama (free, local), Claude, GPT, or Azure

---

## Comparison with Commercial Tools

| Feature | LegalLens | Harvey AI | CoCounsel | Luminance |
|---------|:---------:|:---------:|:---------:|:---------:|
| **Price** | Free | ~$1,200/user/mo | ~$250/mo bundle | Enterprise |
| Semantic Search | ✓ | ✓ | ✓ | ✓ |
| RAG Q&A with Citations | ✓ | ✓ | ✓ | — |
| Risk Analysis | ✓ | ✓ | — | ✓ |
| Clause Finder | ✓ | — | — | ✓ |
| Document Comparison | ✓ | ✓ | — | ✓ |
| Legal Memo Generation | ✓ | ✓ | ✓ | — |
| 100% Data Privacy | ✓ | — | — | Partial |
| Works Offline | ✓ | — | — | — |
| Multi-LLM Support | ✓ | — | — | — |
| Self-Hosted | ✓ | — | — | — |
| Open Source | ✓ | — | — | — |

---

## Contributing

Contributions are welcome! Here's how to get started:

1. Fork the repo and create a feature branch
2. Set up local development (see [Quick Start](#option-2-local-development))
3. Run tests before submitting:
   ```bash
   # Backend
   python -m pytest backend/tests/ -v

   # Frontend
   cd frontend && npm test && npm run build
   ```
4. Open a PR with a clear description of your changes

### Areas We'd Love Help With
- OCR for scanned PDFs (Tesseract/PaddleOCR integration)
- Hybrid search (BM25 + semantic)
- Additional clause types and jurisdiction-specific templates
- Accessibility improvements
- Documentation and tutorials

---

## License

MIT — use it freely for personal and commercial projects.

---

<div align="center">

**Built with privacy in mind. No data leaves your infrastructure.**

[Report Bug](https://github.com/LakshmiSravya123/legal-lens/issues) · [Request Feature](https://github.com/LakshmiSravya123/legal-lens/issues) · [Discussions](https://github.com/LakshmiSravya123/legal-lens/discussions)

</div>
