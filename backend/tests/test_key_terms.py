"""Unit tests for key_terms extraction and document classification — no DB needed."""

from backend.services.key_terms import extract_key_terms, classify_document, KeyTerms


# ─── extract_key_terms ───

def test_extract_dates():
    text = "This Agreement is dated January 15, 2024 and expires on 12/31/2025."
    terms = extract_key_terms(text)
    assert any("January 15, 2024" in d for d in terms.dates)
    assert any("12/31/2025" in d for d in terms.dates)


def test_extract_dates_iso():
    text = "Effective date: 2024-06-01."
    terms = extract_key_terms(text)
    assert "2024-06-01" in terms.dates


def test_extract_monetary_amounts():
    text = "The purchase price shall be $1,500,000 payable in USD."
    terms = extract_key_terms(text)
    assert any("$1,500,000" in a for a in terms.monetary_amounts)


def test_extract_monetary_usd():
    text = "Payment of USD 50,000.00 is due upon signing."
    terms = extract_key_terms(text)
    assert len(terms.monetary_amounts) >= 1


def test_extract_governing_law():
    text = "This Agreement shall be governed by the laws of the State of Delaware."
    terms = extract_key_terms(text)
    assert any("Delaware" in g for g in terms.governing_law)


def test_extract_parties():
    text = 'This Agreement is by and between Acme Corporation ("Vendor") and Beta LLC ("Client").'
    terms = extract_key_terms(text)
    # Should extract at least one party name
    assert len(terms.parties) >= 1 or len(terms.defined_terms) >= 1


def test_extract_defined_terms():
    text = '"Confidential Information" means any proprietary data disclosed by either party.'
    terms = extract_key_terms(text)
    assert any("Confidential Information" in t for t in terms.defined_terms)


def test_extract_legal_references():
    text = "Pursuant to 17 U.S.C. § 107, this use qualifies as fair use. See also Smith v. Jones."
    terms = extract_key_terms(text)
    assert len(terms.references) >= 1


def test_extract_statute_section():
    text = "As defined in § 2.3 of this Agreement."
    terms = extract_key_terms(text)
    assert any("§" in r for r in terms.references)


def test_empty_text():
    terms = extract_key_terms("")
    assert terms.parties == []
    assert terms.dates == []
    assert terms.monetary_amounts == []
    assert terms.defined_terms == []
    assert terms.governing_law == []
    assert terms.references == []


def test_no_duplicates_in_dates():
    text = "Date: January 1, 2024. Repeated date: January 1, 2024."
    terms = extract_key_terms(text)
    assert len(terms.dates) == 1


# ─── classify_document ───

def test_classify_contract():
    text = "WHEREAS the parties hereby agree to the following terms and conditions. This entire agreement shall be binding."
    result = classify_document(text, "service_agreement.pdf")
    assert result == "Contract"


def test_classify_pleading():
    text = "COMES NOW the Plaintiff and respectfully moves this Court for judgment. The defendant failed to respond."
    result = classify_document(text, "motion_to_dismiss.pdf")
    assert result == "Pleading"


def test_classify_memorandum():
    text = "MEMORANDUM OF LAW. Issue Presented: Whether the statute applies. Discussion: The legal analysis shows..."
    result = classify_document(text, "legal_memo.pdf")
    assert result == "Memorandum"


def test_classify_correspondence():
    text = "Dear Mr. Smith, I am writing to inform you about the upcoming deadline. Sincerely, Jane Doe."
    result = classify_document(text, "letter_to_client.pdf")
    assert result == "Correspondence"


def test_classify_court_order():
    text = "IT IS HEREBY ORDERED that the motion is granted. The court finds sufficient evidence. SO ORDERED."
    result = classify_document(text, "court_order.pdf")
    assert result == "Court Order"


def test_classify_corporate():
    text = "RESOLVED, that the Board of Directors hereby approves the bylaws amendment. Shareholders shall vote."
    result = classify_document(text, "board_resolution.pdf")
    assert result == "Corporate"


def test_classify_filename_hints():
    # Filename alone should classify even with minimal content
    result = classify_document("Some generic text.", "nda_agreement.pdf")
    assert result == "Contract"


def test_classify_unknown():
    result = classify_document("Random unrelated text about cooking.", "recipe.pdf")
    assert result == "Other"
