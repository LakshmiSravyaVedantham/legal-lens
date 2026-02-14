# LegalLens Demo Script

**Target duration**: 3-5 minutes
**Format**: Screen recording with voiceover (or silent with captions)

---

## Scene 1: Quick Start (30s)

1. Show the terminal: `docker compose up --build`
2. Wait for "LegalLens backend ready" in logs
3. Open **http://localhost** in the browser
4. Show the login screen and register a new account

**Talking point**: "LegalLens runs entirely on your machine. One command to start — no cloud accounts required."

---

## Scene 2: Document Upload (30s)

1. Navigate to **Documents** page
2. Drag-and-drop 2-3 sample PDFs (contracts, NDAs, lease agreements)
3. Show the "Processing..." status updating to "Ready"
4. Click into a document to see the page-by-page viewer

**Talking point**: "Upload any PDF, DOCX, or TXT file up to 50MB. Documents are automatically chunked and indexed for semantic search."

---

## Scene 3: Smart Search (30s)

1. Go to **Search** or use the ⌘K command palette
2. Type a natural language query: *"What are the termination provisions?"*
3. Show results with confidence badges (High/Medium/Low)
4. Highlight the keyword matching in gold
5. Click a result to jump to the document viewer at that page

**Talking point**: "Search uses semantic embeddings — you don't need exact keywords. Results show the document, page, and a confidence score."

---

## Scene 4: AI Analysis (45s)

1. Open a document and navigate to the **AI Insights** tab
2. Run **Summary** — show the generated overview
3. Run **Risk Analysis** — show flagged risk items
4. Run **Checklist** — show the compliance checklist
5. Run **Obligations** — show extracted obligations with dates
6. Briefly show **Timeline** view

**Talking point**: "Nine AI-powered features analyze each document: summary, risks, checklist, obligations, timeline, comparison, brief generation, search expansion, and document Q&A."

---

## Scene 5: Document Q&A (30s)

1. Go to **Chat**
2. Ask: *"Does this agreement have a non-compete clause?"*
3. Show the answer with **[1][2] citation badges**
4. Click a citation to see the exact source passage
5. Show follow-up suggestions

**Talking point**: "RAG-powered Q&A retrieves relevant passages and generates cited answers. Every claim links back to the source document and page."

---

## Scene 6: Clause Finder & Research (30s)

1. Go to **Clause Library**
2. Click **Indemnification** — show results across documents
3. Click **Save to Research** on a result
4. Go to **Research** page — show saved bookmarks
5. Click **Export Memo** to generate a text memorandum

**Talking point**: "The clause library searches for 12 standard clause types. Save findings to your research board and export as a formatted memo."

---

## Scene 7: Analytics & Admin (20s)

1. Go to **Analytics** — show search trends bar chart, activity timeline
2. Go to **Settings > LLM Providers** — show the multi-provider config
3. Show the **Health** endpoint in a new tab: `localhost/api/health`
4. Show JSON structured logs in the Docker terminal

**Talking point**: "Built-in analytics, structured JSON logging, audit trail, and rate limiting — production-ready out of the box."

---

## Scene 8: Wrap-up (15s)

1. Show the GitHub repo README with the CI badge (green)
2. Show the "Deploy to Render" button
3. End with the privacy footer: "100% Local Processing"

**Talking point**: "LegalLens is open source with CI/CD, one-click deploy, and zero data leaving your machine. Try it today."

---

## Tips for Recording

- Use a clean browser profile (no extensions, bookmarks bar hidden)
- Set terminal font to 14pt+ for readability
- Pre-upload 2-3 sample legal documents so results are populated
- If using Ollama, ensure the model is pre-pulled: `ollama pull llama3.1:8b`
- Recommended screen resolution: 1920x1080 or 2560x1440
