# LegalLens — Ready-to-Post Social Media Drafts

---

## LinkedIn Post

**Title suggestion**: Share as a regular post (not article). Include 1-2 screenshots of the app.

---

I built an open-source alternative to Harvey AI.

It's called LegalLens — a self-hosted, AI-powered document intelligence platform for legal professionals.

Here's what it does:
- Upload contracts, pleadings, memos (PDF, DOCX, TXT)
- Search across all documents with natural language
- Get AI-powered risk analysis with a 0-100 risk score
- Run compliance checklists (15+ standard provisions)
- Extract obligations, timelines, and key terms automatically
- Ask questions and get cited answers (RAG with [1][2] source links)
- Find specific clauses (indemnification, force majeure, etc.) across all docs
- Generate legal memos from bookmarked research

The key difference: everything runs on YOUR infrastructure.

No documents sent to the cloud. No per-seat fees. No vendor lock-in.

It works with Ollama (free, runs locally), Claude, GPT, or Azure — your choice, configurable per-organization.

Built with:
- FastAPI + React + TypeScript
- MongoDB + ChromaDB (vector search)
- sentence-transformers for embeddings
- Docker Compose (one-command deploy)

Harvey AI charges ~$1,200/user/month.
CoCounsel bundles at ~$250/month.
LegalLens is free and MIT-licensed.

Why I built it:
- 79% of attorneys now use AI, but most can't afford commercial tools
- Law firms have strict data handling requirements — cloud-only doesn't work for many
- I believe legal AI should be accessible to solo practitioners and small firms, not just BigLaw

Try it: github.com/LakshmiSravya123/legal-lens

One-click deploy on Render or Railway. Or `docker compose up` on your machine.

I'd love feedback from legal professionals and developers. What features would make this more useful for your practice?

#LegalTech #AI #OpenSource #LegalAI #SelfHosted #RAG #DocumentIntelligence

---

## Hacker News Post

**Title** (choose one):

Option A: `Show HN: LegalLens – Open-source, self-hosted legal document AI (alternative to Harvey AI)`

Option B: `Show HN: LegalLens – AI-powered legal document search with RAG, risk analysis, and clause finder`

Option C: `Show HN: I built a self-hosted alternative to Harvey AI for legal document analysis`

**Body text** (paste in the submission URL field: your GitHub repo URL, then add this as the first comment):

---

Hi HN, I built LegalLens — an open-source legal document intelligence platform that runs entirely on your own infrastructure.

**What it does:**
- Upload legal documents (PDF, DOCX, TXT) and search them with natural language using semantic embeddings (sentence-transformers, 384-dim vectors, ChromaDB)
- RAG-powered Q&A: ask questions, get answers with numbered citations linking to exact pages
- AI analysis: risk scoring, compliance checklists, obligation extraction, timeline extraction, document comparison
- Clause finder: pre-built search templates for 12 clause types (indemnification, force majeure, termination, etc.)
- Research management: bookmark findings, organize by matter, generate legal memos

**Why self-hosted matters for legal:**
Law firms handle privileged documents — attorney-client communications, trade secrets, M&A materials. Many firms (especially outside the US) can't use cloud AI tools due to data residency requirements, ethical obligations, or client agreements. LegalLens runs locally with Ollama or on your private cloud.

**Tech stack:**
- Backend: FastAPI (Python, async)
- Frontend: React 19 + TypeScript + Tailwind
- Vector DB: ChromaDB (cosine similarity search)
- Embeddings: all-MiniLM-L6-v2 (80MB, runs locally)
- LLM: pluggable — Ollama (free/local), Anthropic Claude, OpenAI, Azure. Per-org config with fallback chains.
- Auth: JWT + bcrypt + Fernet-encrypted API keys
- Deploy: Docker Compose with MongoDB, ChromaDB, nginx

**Architecture decisions:**
- No LangChain — direct LLM integration for simplicity and debuggability
- Cache-first AI analyses — results stored in MongoDB, avoids redundant expensive LLM calls
- Sentence-aware chunking with 50-word overlap for better retrieval
- Multi-tenant from day one (org-based isolation, RBAC with 4 roles)
- Background document processing — uploads return instantly

**What's missing (help wanted):**
- OCR for scanned PDFs
- Hybrid search (BM25 + semantic)
- Cross-encoder re-ranking

GitHub: https://github.com/LakshmiSravya123/legal-lens

Would love feedback on the architecture and search quality approaches.

---

## Twitter/X Thread

**Thread (5 tweets):**

---

**Tweet 1:**
I built an open-source alternative to Harvey AI ($11B valuation, $1,200/user/mo).

It's called LegalLens — self-hosted, privacy-first legal document AI.

Free. MIT licensed. Runs on your infrastructure.

Here's what it does (thread):

**Tweet 2:**
Upload contracts, NDAs, leases → search them with natural language.

Not keyword search. Semantic search with confidence scores.

Plus: AI risk analysis (0-100 score), compliance checklists, obligation extraction, timeline extraction.

All with citations back to exact pages.

**Tweet 3:**
The killer feature: RAG Q&A with citations.

Ask "Does this contract have a non-compete clause?" and get an answer with [1][2] links to the exact source passages.

Works with Ollama (free, local), Claude, GPT, or Azure — your choice.

**Tweet 4:**
Why self-hosted matters for legal:

- Attorney-client privilege
- GDPR/data residency
- Client requirements (no cloud)
- Cost ($0 vs $1,200/user/mo)

79% of lawyers use AI now. Most can't afford Harvey or CoCounsel. LegalLens fills that gap.

**Tweet 5:**
Tech: FastAPI + React + TypeScript + ChromaDB + MongoDB

One command to deploy:
`docker compose up`

Try it: github.com/LakshmiSravya123/legal-lens

Feedback welcome — especially from lawyers and legal ops folks.

#LegalTech #OpenSource #AI

---

## Reddit Post (r/legaltech, r/selfhosted, r/opensource)

**Title**: I built an open-source, self-hosted alternative to Harvey AI for legal document analysis

**Body:**

Hey everyone,

I've been building LegalLens — an open-source legal document intelligence platform that runs entirely on your own infrastructure. Think Harvey AI or CoCounsel, but free, self-hosted, and privacy-first.

**What it does:**
- Upload PDFs, DOCX, TXT files and search them with natural language (semantic search, not keyword)
- AI-powered analysis: risk scoring, compliance checklists, obligation extraction, timeline extraction
- RAG Q&A: ask questions about your documents, get cited answers
- Clause finder with 12 pre-built search templates
- Research management with memo generation
- Multi-tenant with role-based access

**Tech stack:** FastAPI, React, TypeScript, MongoDB, ChromaDB, sentence-transformers. Works with Ollama (free local LLM), Claude, GPT, or Azure.

**Why I built it:**
- Harvey AI costs ~$1,200/user/month
- Many firms can't use cloud AI due to privilege/confidentiality concerns
- Small firms and solo practitioners are priced out of commercial tools

It's MIT licensed and deploys with `docker compose up`.

GitHub: https://github.com/LakshmiSravya123/legal-lens

Would love feedback from anyone in legal tech or anyone who's built RAG systems. Particularly interested in thoughts on search quality (currently pure semantic — considering adding BM25 hybrid search).
