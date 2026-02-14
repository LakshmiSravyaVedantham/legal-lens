"""AI-powered analysis features for legal documents.

All functions accept document text and return structured results.
Results are cached in the ai_analyses MongoDB collection.
"""

import json
import logging
from datetime import datetime, timezone

from backend.core.database import get_db
from backend.services.llm.manager import LLMManager

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _extract_json(text: str) -> dict | list:
    """Extract JSON from LLM response, handling markdown code fences."""
    text = text.strip()
    if text.startswith("```"):
        # Remove code fence
        lines = text.split("\n")
        lines = [l for l in lines if not l.strip().startswith("```")]
        text = "\n".join(lines).strip()
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        # Try to find JSON object/array in text
        for start_char, end_char in [("{", "}"), ("[", "]")]:
            start = text.find(start_char)
            end = text.rfind(end_char)
            if start != -1 and end != -1 and end > start:
                try:
                    return json.loads(text[start : end + 1])
                except json.JSONDecodeError:
                    continue
        raise ValueError(f"Could not extract JSON from LLM response: {text[:200]}")


async def get_cached_analysis(
    document_id: str, analysis_type: str, org_id: str
) -> dict | None:
    """Return cached analysis or None."""
    db = get_db()
    return await db.ai_analyses.find_one({
        "document_id": document_id,
        "analysis_type": analysis_type,
        "organization_id": org_id,
    })


async def save_analysis(
    document_id: str,
    analysis_type: str,
    org_id: str,
    result: dict,
) -> dict:
    """Upsert an analysis result into the cache."""
    db = get_db()
    record = {
        "document_id": document_id,
        "analysis_type": analysis_type,
        "organization_id": org_id,
        "result": result,
        "created_at": datetime.now(timezone.utc),
    }
    await db.ai_analyses.update_one(
        {
            "document_id": document_id,
            "analysis_type": analysis_type,
            "organization_id": org_id,
        },
        {"$set": record},
        upsert=True,
    )
    return record


def _truncate(text: str, max_chars: int = 12000) -> str:
    """Truncate text to fit within LLM context limits."""
    if len(text) <= max_chars:
        return text
    return text[:max_chars] + "\n\n[... document truncated for analysis ...]"


# ---------------------------------------------------------------------------
# 1. Auto-Summarize
# ---------------------------------------------------------------------------

async def generate_summary(
    text: str, llm: LLMManager, org_id: str
) -> dict:
    prompt = f"""Analyze this legal document and provide a structured summary.

DOCUMENT:
{_truncate(text)}

Return a JSON object with these fields:
- "title": a short descriptive title for the document
- "summary": a 2-3 paragraph executive summary
- "document_type": the type of document (e.g. "Employment Agreement", "NDA", "Lease")
- "key_points": an array of 5-8 key points (strings)
- "parties": an array of party names mentioned

Return ONLY valid JSON, no other text."""

    raw = await llm.generate(
        prompt=prompt,
        system="You are a legal document analyst. Return only valid JSON.",
        org_id=org_id,
    )
    return _extract_json(raw)


# ---------------------------------------------------------------------------
# 2. Risk Analysis
# ---------------------------------------------------------------------------

async def analyze_risks(
    text: str, llm: LLMManager, org_id: str
) -> dict:
    prompt = f"""Analyze this legal document for risks and problematic clauses.

DOCUMENT:
{_truncate(text)}

Return a JSON object with:
- "overall_risk": "low", "medium", or "high"
- "risk_score": integer 0-100 (0=no risk, 100=extremely risky)
- "risks": array of objects, each with:
  - "clause": the clause text or reference
  - "risk_level": "low", "medium", or "high"
  - "description": explanation of the risk
  - "recommendation": suggested action or mitigation
- "summary": a brief overall risk assessment paragraph

Return ONLY valid JSON, no other text."""

    raw = await llm.generate(
        prompt=prompt,
        system="You are a legal risk analyst. Return only valid JSON.",
        org_id=org_id,
    )
    return _extract_json(raw)


# ---------------------------------------------------------------------------
# 3. Contract Review Checklist
# ---------------------------------------------------------------------------

async def generate_checklist(
    text: str, llm: LLMManager, org_id: str
) -> dict:
    prompt = f"""Review this legal document against standard contract provisions and generate a checklist.

DOCUMENT:
{_truncate(text)}

Return a JSON object with:
- "checklist": array of objects, each with:
  - "provision": name of the standard provision (e.g. "Termination Clause", "Indemnification")
  - "status": "pass", "fail", or "review"
  - "detail": brief explanation of what was found or missing
  - "section": section reference if found, or null
- "score": percentage of items that pass (integer 0-100)
- "summary": brief overall assessment

Standard provisions to check: Parties Defined, Term/Duration, Payment Terms, Termination, Indemnification, Limitation of Liability, Confidentiality, IP Rights, Governing Law, Dispute Resolution, Force Majeure, Assignment, Notices, Entire Agreement, Amendments.

Return ONLY valid JSON, no other text."""

    raw = await llm.generate(
        prompt=prompt,
        system="You are a contract review specialist. Return only valid JSON.",
        org_id=org_id,
    )
    return _extract_json(raw)


# ---------------------------------------------------------------------------
# 4. Obligations & Deadlines
# ---------------------------------------------------------------------------

async def extract_obligations(
    text: str, llm: LLMManager, org_id: str
) -> dict:
    prompt = f"""Extract all obligations, duties, and deadlines from this legal document.

DOCUMENT:
{_truncate(text)}

Return a JSON object with:
- "obligations": array of objects, each with:
  - "party": which party has the obligation
  - "obligation": description of the obligation or duty
  - "type": "obligation", "duty", "right", or "restriction"
  - "deadline": deadline date or timeframe if specified, or null
  - "section": section reference if available, or null
  - "priority": "high", "medium", or "low"
- "upcoming_deadlines": array of objects with "date", "description", "party" for time-sensitive items
- "summary": brief overview of key obligations

Return ONLY valid JSON, no other text."""

    raw = await llm.generate(
        prompt=prompt,
        system="You are a legal obligations analyst. Return only valid JSON.",
        org_id=org_id,
    )
    return _extract_json(raw)


# ---------------------------------------------------------------------------
# 5. Document Timeline
# ---------------------------------------------------------------------------

async def extract_timeline(
    text: str, llm: LLMManager, org_id: str
) -> dict:
    prompt = f"""Extract a chronological timeline of events, dates, and milestones from this legal document.

DOCUMENT:
{_truncate(text)}

Return a JSON object with:
- "events": array of objects, each with:
  - "date": the date or date description (e.g. "January 1, 2024" or "30 days after execution")
  - "event": description of what happens
  - "category": one of "execution", "deadline", "payment", "renewal", "termination", "notice", "other"
  - "party": which party is involved, or null
- "duration": overall contract/document duration if applicable
- "key_dates_summary": brief paragraph summarizing the most important dates

Return ONLY valid JSON, no other text."""

    raw = await llm.generate(
        prompt=prompt,
        system="You are a legal timeline analyst. Return only valid JSON.",
        org_id=org_id,
    )
    return _extract_json(raw)


# ---------------------------------------------------------------------------
# 6. Document Comparison
# ---------------------------------------------------------------------------

async def compare_documents(
    text_a: str,
    text_b: str,
    name_a: str,
    name_b: str,
    llm: LLMManager,
    org_id: str,
) -> dict:
    prompt = f"""Compare these two legal documents and identify key differences and similarities.

DOCUMENT A ({name_a}):
{_truncate(text_a, 6000)}

DOCUMENT B ({name_b}):
{_truncate(text_b, 6000)}

Return a JSON object with:
- "provisions": array of objects, each with:
  - "provision": name of the provision being compared
  - "document_a": what Document A says (brief), or "Not found"
  - "document_b": what Document B says (brief), or "Not found"
  - "status": "match", "different", "only_a", or "only_b"
- "key_differences": array of strings describing the most significant differences
- "similarities": array of strings describing key similarities
- "recommendation": brief recommendation about which document is more favorable or comprehensive

Return ONLY valid JSON, no other text."""

    raw = await llm.generate(
        prompt=prompt,
        system="You are a legal document comparison specialist. Return only valid JSON.",
        org_id=org_id,
    )
    return _extract_json(raw)


# ---------------------------------------------------------------------------
# 7. AI Brief / Memo Generator
# ---------------------------------------------------------------------------

async def generate_brief(
    bookmarks: list[dict],
    topic: str,
    llm: LLMManager,
    org_id: str,
) -> dict:
    excerpts = "\n\n".join(
        f"[{i+1}] {b.get('document_name', 'Unknown')}"
        + (f", Page {b['page']}" if b.get('page') else "")
        + f":\n{b.get('text', '')}"
        for i, b in enumerate(bookmarks)
    )

    prompt = f"""Generate a legal memorandum based on the following research excerpts.

TOPIC: {topic}

RESEARCH EXCERPTS:
{_truncate(excerpts, 10000)}

Write a professional legal memorandum with:
1. Title
2. Issue/Question Presented
3. Brief Answer
4. Discussion (citing the sources using [1], [2] notation)
5. Conclusion

Return a JSON object with:
- "title": memo title
- "issue": the legal question presented
- "brief_answer": concise answer
- "discussion": detailed discussion with citations
- "conclusion": concluding paragraph
- "sources_used": array of source numbers used (integers)

Return ONLY valid JSON, no other text."""

    raw = await llm.generate(
        prompt=prompt,
        system="You are a legal research memo writer. Return only valid JSON.",
        org_id=org_id,
    )
    return _extract_json(raw)


# ---------------------------------------------------------------------------
# 8. Smart Search Suggestions
# ---------------------------------------------------------------------------

async def expand_search_query(
    query: str, llm: LLMManager, org_id: str
) -> dict:
    prompt = f"""Given this legal search query, suggest expanded and alternative queries using legal terminology and synonyms.

QUERY: "{query}"

Return a JSON object with:
- "original": the original query
- "suggestions": array of 4-6 alternative or expanded search queries that would help find relevant legal content
- "legal_terms": array of relevant legal terms or concepts related to the query

Return ONLY valid JSON, no other text."""

    raw = await llm.generate(
        prompt=prompt,
        system="You are a legal search assistant. Return only valid JSON.",
        org_id=org_id,
    )
    return _extract_json(raw)


# ---------------------------------------------------------------------------
# 9. Chat Follow-up Suggestions
# ---------------------------------------------------------------------------

async def generate_follow_ups(
    question: str, answer: str, llm: LLMManager, org_id: str
) -> list[str]:
    prompt = f"""Based on this Q&A exchange about legal documents, suggest 3 natural follow-up questions the user might want to ask.

QUESTION: {question}
ANSWER: {answer[:2000]}

Return a JSON array of exactly 3 follow-up question strings. Each should be specific and relevant.

Return ONLY a JSON array, no other text."""

    raw = await llm.generate(
        prompt=prompt,
        system="You are a legal document assistant. Return only a valid JSON array of 3 strings.",
        org_id=org_id,
    )
    result = _extract_json(raw)
    if isinstance(result, list):
        return [str(q) for q in result[:3]]
    if isinstance(result, dict) and "questions" in result:
        return [str(q) for q in result["questions"][:3]]
    return []
