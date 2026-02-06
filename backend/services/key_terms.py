"""Extract legally-relevant terms from document text: parties, dates, amounts, defined terms, governing law."""
import re
from dataclasses import dataclass, field


@dataclass
class KeyTerms:
    parties: list[str] = field(default_factory=list)
    dates: list[str] = field(default_factory=list)
    monetary_amounts: list[str] = field(default_factory=list)
    defined_terms: list[str] = field(default_factory=list)
    governing_law: list[str] = field(default_factory=list)
    references: list[str] = field(default_factory=list)


def extract_key_terms(text: str) -> KeyTerms:
    terms = KeyTerms()

    # --- Parties ---
    # "BETWEEN X ("Party") AND Y ("Party")" patterns
    party_patterns = [
        r'(?:between|by and between)\s+([A-Z][A-Za-z\s,\.]+?)(?:\s*\()',
        r'(?:hereinafter|herein)\s+(?:referred to as|called)\s+["\u201c]([^"\u201d]+)["\u201d]',
        r'\((?:the\s+)?["\u201c]([A-Z][A-Za-z\s]+)["\u201d]\)',
        r'(?:Party|Parties|Contractor|Client|Employer|Employee|Landlord|Tenant|Licensor|Licensee|Vendor|Purchaser|Buyer|Seller|Borrower|Lender|Lessor|Lessee|Plaintiff|Defendant|Petitioner|Respondent):\s*([A-Z][A-Za-z\s,\.]+?)(?:\n|,\s*a\s)',
    ]
    for pattern in party_patterns:
        matches = re.findall(pattern, text)
        for m in matches:
            cleaned = m.strip().rstrip(',.')
            if 2 < len(cleaned) < 100 and cleaned not in terms.parties:
                terms.parties.append(cleaned)

    # --- Dates ---
    date_patterns = [
        r'\b(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4}\b',
        r'\b\d{1,2}(?:st|nd|rd|th)?\s+(?:day of\s+)?(?:January|February|March|April|May|June|July|August|September|October|November|December),?\s+\d{4}\b',
        r'\b\d{1,2}/\d{1,2}/\d{2,4}\b',
        r'\b\d{4}-\d{2}-\d{2}\b',
    ]
    seen_dates: set[str] = set()
    for pattern in date_patterns:
        for m in re.finditer(pattern, text, re.IGNORECASE):
            d = m.group().strip()
            if d not in seen_dates:
                seen_dates.add(d)
                terms.dates.append(d)

    # --- Monetary amounts ---
    money_patterns = [
        r'\$[\d,]+(?:\.\d{2})?(?:\s*(?:million|billion|thousand|USD|dollars))?',
        r'(?:USD|US\s*Dollars?)\s*[\d,]+(?:\.\d{2})?',
        r'\b\d[\d,]*(?:\.\d{2})?\s+(?:dollars|USD)\b',
    ]
    seen_amounts: set[str] = set()
    for pattern in money_patterns:
        for m in re.finditer(pattern, text, re.IGNORECASE):
            a = m.group().strip()
            if a not in seen_amounts:
                seen_amounts.add(a)
                terms.monetary_amounts.append(a)

    # --- Defined terms (capitalized terms in quotes or with specific patterns) ---
    defined_patterns = [
        r'["\u201c]([A-Z][A-Za-z\s]{2,40})["\u201d]\s+(?:means|shall mean|refers to|is defined as)',
        r'(?:the\s+)?["\u201c]([A-Z][A-Za-z\s]{2,40})["\u201d](?:\s*\))',
        r'\((?:the\s+)?["\u201c]([A-Z][A-Za-z\s]{2,30})["\u201d]\)',
    ]
    seen_defined: set[str] = set()
    for pattern in defined_patterns:
        for m in re.finditer(pattern, text):
            term = m.group(1).strip()
            if term.lower() not in seen_defined and len(term) > 2:
                seen_defined.add(term.lower())
                terms.defined_terms.append(term)

    # --- Governing law ---
    gov_patterns = [
        r'(?:governed by|construed (?:in accordance with|under)|subject to)\s+(?:the\s+)?(?:laws?\s+of\s+)?(?:the\s+)?(?:State\s+of\s+)?([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)',
        r'(?:State\s+of|Commonwealth\s+of)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)',
    ]
    seen_gov: set[str] = set()
    for pattern in gov_patterns:
        for m in re.finditer(pattern, text):
            g = m.group(1).strip()
            if g.lower() not in seen_gov and len(g) > 2:
                seen_gov.add(g.lower())
                terms.governing_law.append(g)

    # --- Legal references (case citations, statutes) ---
    ref_patterns = [
        r'\b\d+\s+U\.?S\.?C\.?\s*§?\s*\d+\b',
        r'\b\d+\s+[A-Z][a-z]+\.?\s+\d+\b',
        r'\b[A-Z][a-z]+\s+v\.?\s+[A-Z][a-z]+',
        r'§\s*\d+[\.\d]*',
    ]
    seen_refs: set[str] = set()
    for pattern in ref_patterns:
        for m in re.finditer(pattern, text):
            r = m.group().strip()
            if r not in seen_refs and len(r) > 3:
                seen_refs.add(r)
                terms.references.append(r)
    terms.references = terms.references[:20]

    return terms


def classify_document(text: str, filename: str) -> str:
    """Classify a legal document by type based on content and filename."""
    text_lower = text[:5000].lower()
    fn_lower = filename.lower()

    scores: dict[str, int] = {
        "Contract": 0,
        "Pleading": 0,
        "Memorandum": 0,
        "Correspondence": 0,
        "Court Order": 0,
        "Corporate": 0,
        "Regulatory": 0,
    }

    # Filename hints
    fn_hints = {
        "Contract": ["contract", "agreement", "lease", "nda", "msa", "sow", "amendment"],
        "Pleading": ["complaint", "motion", "brief", "petition", "answer", "pleading"],
        "Memorandum": ["memo", "memorandum", "opinion"],
        "Correspondence": ["letter", "email", "notice", "correspondence"],
        "Court Order": ["order", "judgment", "ruling", "decree"],
        "Corporate": ["bylaws", "articles", "charter", "resolution", "minutes"],
        "Regulatory": ["regulation", "compliance", "filing", "rule"],
    }
    for doc_type, keywords in fn_hints.items():
        for kw in keywords:
            if kw in fn_lower:
                scores[doc_type] += 3

    # Content indicators
    content_indicators = {
        "Contract": [
            "hereby agrees", "shall be binding", "term of this agreement",
            "representations and warranties", "indemnif", "governing law",
            "entire agreement", "counterparts", "force majeure", "whereas",
            "now, therefore", "witnesseth",
        ],
        "Pleading": [
            "comes now", "respectfully", "plaintiff", "defendant",
            "this court", "jurisdiction", "cause of action", "prayer for relief",
            "count i", "wherefore", "court of",
        ],
        "Memorandum": [
            "memorandum", "legal analysis", "issue presented", "conclusion",
            "discussion", "brief answer", "question presented",
        ],
        "Correspondence": [
            "dear ", "sincerely", "regards", "please find", "enclosed",
            "pursuant to our conversation", "i am writing",
        ],
        "Court Order": [
            "it is hereby ordered", "the court finds", "so ordered",
            "it is therefore", "judgment is entered",
        ],
        "Corporate": [
            "board of directors", "shareholders", "resolution",
            "bylaws", "articles of incorporation", "corporate",
        ],
        "Regulatory": [
            "pursuant to regulation", "compliance", "regulatory",
            "filing requirement", "sec ", "federal register",
        ],
    }
    for doc_type, indicators in content_indicators.items():
        for ind in indicators:
            if ind in text_lower:
                scores[doc_type] += 1

    best = max(scores, key=lambda k: scores[k])
    return best if scores[best] > 0 else "Other"
