"""Pre-built clause searches that lawyers commonly need."""

CLAUSE_CATEGORIES: list[dict] = [
    {
        "id": "indemnification",
        "name": "Indemnification",
        "description": "Clauses requiring one party to compensate the other for losses",
        "queries": [
            "indemnification hold harmless defend",
            "indemnify and hold harmless against any and all claims losses",
            "shall indemnify defend and hold harmless",
        ],
        "category": "Risk Allocation",
    },
    {
        "id": "limitation_of_liability",
        "name": "Limitation of Liability",
        "description": "Caps on damages and liability exclusions",
        "queries": [
            "limitation of liability shall not exceed",
            "in no event shall liability exceed aggregate",
            "consequential incidental special punitive damages",
        ],
        "category": "Risk Allocation",
    },
    {
        "id": "termination",
        "name": "Termination",
        "description": "Conditions and procedures for ending the agreement",
        "queries": [
            "termination for cause breach material default",
            "termination for convenience upon written notice",
            "right to terminate this agreement",
        ],
        "category": "Term & Termination",
    },
    {
        "id": "force_majeure",
        "name": "Force Majeure",
        "description": "Excuses for non-performance due to extraordinary events",
        "queries": [
            "force majeure act of god natural disaster pandemic",
            "excused from performance beyond reasonable control",
        ],
        "category": "Risk Allocation",
    },
    {
        "id": "confidentiality",
        "name": "Confidentiality / NDA",
        "description": "Obligations to protect confidential information",
        "queries": [
            "confidential information shall not disclose",
            "non-disclosure proprietary information trade secret",
            "confidentiality obligations survive termination",
        ],
        "category": "Information Protection",
    },
    {
        "id": "governing_law",
        "name": "Governing Law & Jurisdiction",
        "description": "Choice of law and dispute resolution forum",
        "queries": [
            "governing law construed in accordance with laws of the state",
            "exclusive jurisdiction venue courts",
            "dispute resolution arbitration mediation",
        ],
        "category": "Dispute Resolution",
    },
    {
        "id": "intellectual_property",
        "name": "Intellectual Property",
        "description": "Ownership, licensing, and assignment of IP rights",
        "queries": [
            "intellectual property rights ownership assignment",
            "license grant exclusive non-exclusive royalty",
            "work made for hire copyright patent trademark",
        ],
        "category": "IP & Ownership",
    },
    {
        "id": "representations_warranties",
        "name": "Representations & Warranties",
        "description": "Statements of fact and promises about conditions",
        "queries": [
            "represents and warrants authority to enter",
            "representations warranties covenants",
            "to the best of knowledge no material adverse",
        ],
        "category": "Assurances",
    },
    {
        "id": "assignment",
        "name": "Assignment & Delegation",
        "description": "Restrictions on transferring rights or obligations",
        "queries": [
            "shall not assign without prior written consent",
            "assignment transfer delegation binding upon successors",
        ],
        "category": "General Provisions",
    },
    {
        "id": "notices",
        "name": "Notices",
        "description": "Requirements for formal communications between parties",
        "queries": [
            "notices shall be in writing delivered to",
            "notice deemed given upon receipt certified mail",
        ],
        "category": "General Provisions",
    },
    {
        "id": "non_compete",
        "name": "Non-Compete / Non-Solicitation",
        "description": "Restrictions on competition and soliciting clients or employees",
        "queries": [
            "non-compete restrictive covenant shall not engage",
            "non-solicitation shall not solicit employees clients",
        ],
        "category": "Restrictive Covenants",
    },
    {
        "id": "payment_terms",
        "name": "Payment Terms",
        "description": "Payment schedules, invoicing, late fees",
        "queries": [
            "payment terms net days invoice due upon receipt",
            "late payment interest penalty past due",
        ],
        "category": "Financial",
    },
]


def get_clause_library() -> list[dict]:
    return CLAUSE_CATEGORIES


def get_clause_by_id(clause_id: str) -> dict | None:
    for c in CLAUSE_CATEGORIES:
        if c["id"] == clause_id:
            return c
    return None
