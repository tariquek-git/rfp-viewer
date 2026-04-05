"""
QA fix script for rfp_data.json:
- Fix "7M clients" → "550,000 banking clients" for Manulife
- Replace 3 boilerplate AI-signature closing lines with varied human text
- Fix "all numerous FI programs" grammar artifact
- Soften Imperva from "confirmed live" to infrastructure-level language
- Add Experian alongside TransUnion in bureau/adjudication contexts
- Add PAYFACTO and AIR FRANCE-KLM to proof point rotations
"""

import json, re, copy

with open("public/rfp_data.json", "r", encoding="utf-8") as f:
    data = json.load(f)

# ─── Replacement pools (cycle through these for variety) ─────────────────────

# Pattern 1 — "This capability is live across Brim's partner network — Affinity Credit Union, Manulife (55,000 advisors), UNI Financial (80,000 cards migrated from Collabria), and Zolve (US market, 30-day BIN transfer from i2c)."
p1_replacements = [
    "MANULIFE BANK, AFFINITY CREDIT UNION, and ZOLVE run this in production today.",
    "Live across MANULIFE BANK, AFFINITY CREDIT UNION, and CONTINENTAL BANK.",
]

# Pattern 2 — "These features are live across Brim's programs serving cardholders for Affinity CU, Manulife (55,000 advisors), UNI Financial, and Zolve with 24/7 digital access and real-time notifications."
p2_replacements = [
    "MANULIFE BANK, AFFINITY CREDIT UNION, ZOLVE, AIR FRANCE-KLM, and PAYFACTO all run this in production today.",
    "Live at MANULIFE BANK, AFFINITY CREDIT UNION, and ZOLVE.",
    "MANULIFE BANK, AFFINITY CREDIT UNION, PAYFACTO, and AIR FRANCE-KLM rely on this in their live programs.",
    "In production across MANULIFE BANK, AFFINITY CREDIT UNION, and CONTINENTAL BANK.",
    "Live today at MANULIFE BANK and AFFINITY CREDIT UNION, with PAYFACTO and ZOLVE on the same platform.",
    "MANULIFE BANK, AFFINITY CREDIT UNION, AIR FRANCE-KLM, and PAYFACTO use this in production.",
    "Running live across MANULIFE BANK, AFFINITY CREDIT UNION, ZOLVE, and PAYFACTO.",
]

# Pattern 3 — "This is operational across all Brim partner programs — Affinity CU, Manulife, UNI Financial, Zolve, and Continental — with dedicated account management and defined SLAs. Monthly business reviews, P1 issue response within 1 hour, quarterly roadmap sessions, and 99.9% SLA on operational support requests."
p3_replacements = [
    "MANULIFE BANK, AFFINITY CREDIT UNION, and ZOLVE/CONTINENTAL BANK are all live on Brim today, each with a named relationship manager, monthly business reviews, and direct escalation to Brim's engineering team for P1 issues.",
    "Every live Brim program — MANULIFE BANK, AFFINITY CREDIT UNION, ZOLVE, PAYFACTO, and AIR FRANCE-KLM — operates under this support model: named contacts, monthly reviews, and defined SLAs.",
    "MANULIFE BANK, AFFINITY CREDIT UNION, and CONTINENTAL BANK all run under Brim's named-contact support model today — monthly business reviews, 1-hour P1 response, and direct engineering access when it counts.",
    "Live across MANULIFE BANK, AFFINITY CREDIT UNION, ZOLVE, and PAYFACTO, each with dedicated relationship management and defined SLAs.",
]

# "all numerous FI programs including Affinity Credit Union"
p4_replacements = [
    "every Brim-powered program including MANULIFE BANK and AFFINITY CREDIT UNION",
    "Brim's live programs — MANULIFE BANK, AFFINITY CREDIT UNION, ZOLVE, and others",
    "MANULIFE BANK, AFFINITY CREDIT UNION, ZOLVE, and other live programs on the platform",
    "every live program including MANULIFE BANK and AFFINITY CREDIT UNION",
    "Brim's live portfolio including MANULIFE BANK, AFFINITY CREDIT UNION, and ZOLVE",
    "every production program including MANULIFE BANK and AFFINITY CREDIT UNION",
    "Brim's live programs: MANULIFE BANK, AFFINITY CREDIT UNION, ZOLVE, and PAYFACTO",
    "MANULIFE BANK, AFFINITY CREDIT UNION, and every other live Brim program",
]

counters = {"p1": 0, "p2": 0, "p3": 0, "p4": 0}

P1_PATTERN = (
    "This capability is live across Brim's partner network — Affinity Credit Union, "
    "Manulife (55,000 advisors), UNI Financial (80,000 cards migrated from Collabria), "
    "and Zolve (US market, 30-day BIN transfer from i2c)."
)

P2_PATTERN = (
    "These features are live across Brim's programs serving cardholders for Affinity CU, "
    "Manulife (55,000 advisors), UNI Financial, and Zolve with 24/7 digital access and real-time notifications."
)

P3_PATTERN = (
    "This is operational across all Brim partner programs — Affinity CU, Manulife, UNI Financial, "
    "Zolve, and Continental — with dedicated account management and defined SLAs. Monthly business reviews, "
    "P1 issue response within 1 hour, quarterly roadmap sessions, and 99.9% SLA on operational support requests."
)

P4_PATTERN = "all numerous FI programs including Affinity Credit Union"

def fix_text(text):
    if not isinstance(text, str):
        return text

    # Fix factual error: 7M clients → 550,000 banking clients
    text = text.replace(
        "55,000 advisors, 7M clients",
        "55,000 advisors, 550,000 banking clients"
    )

    # Pattern 1
    if P1_PATTERN in text:
        text = text.replace(P1_PATTERN, p1_replacements[counters["p1"] % len(p1_replacements)])
        counters["p1"] += 1

    # Pattern 2
    if P2_PATTERN in text:
        text = text.replace(P2_PATTERN, p2_replacements[counters["p2"] % len(p2_replacements)])
        counters["p2"] += 1

    # Pattern 3
    if P3_PATTERN in text:
        text = text.replace(P3_PATTERN, p3_replacements[counters["p3"] % len(p3_replacements)])
        counters["p3"] += 1

    # Pattern 4 — "all numerous FI programs"
    if P4_PATTERN in text:
        text = text.replace(P4_PATTERN, p4_replacements[counters["p4"] % len(p4_replacements)])
        counters["p4"] += 1

    # Soften Imperva — remove "confirmed live" claim, replace with infrastructure-layer language
    text = text.replace(
        "Confirmed live integrations include TransUnion (credit bureau and TruValidate fraud), "
        "World-Check One (LSEG) for AML screening, and Imperva for application security. "
        "Additional risk vendors can be integrated based on BSB's requirements.",
        "Confirmed live integrations include TransUnion and Experian for credit bureau pulls, "
        "TransUnion TruValidate for fraud scoring, and World-Check One (LSEG) for AML and sanctions screening. "
        "Web application security and bot detection are deployed at the infrastructure layer. "
        "Additional risk vendors can be integrated based on BSB's requirements."
    )

    text = text.replace(
        "Confirmed live integrations include TransUnion for credit bureau pulls and TruValidate fraud scoring, "
        "World-Check One (LSEG) for AML and sanctions screening, and Imperva for application-layer security and bot detection.",
        "Confirmed live integrations include TransUnion and Experian for credit bureau pulls, "
        "TransUnion TruValidate for fraud scoring, and World-Check One (LSEG) for AML and sanctions screening. "
        "Application-layer WAF and bot detection are deployed at the infrastructure level."
    )

    text = text.replace(
        "- Imperva: Account takeover (ATO) and bot detection for online channel protection",
        "- Web application firewall: Account takeover (ATO) protection and bot detection for the online channel"
    )

    text = text.replace(
        "Imperva provides account takeover and bot detection for the online channel.",
        "Web application firewall and bot detection are deployed at the application layer for account takeover defense."
    )

    text = text.replace(
        "Triggers ingest automatically from: fraud rules engine, Mastercard alerts, Imperva, TruValidate, World-Check One, and manual agent escalation",
        "Triggers ingest automatically from: fraud rules engine, Mastercard alerts, web application security layer, TruValidate, World-Check One, and manual agent escalation"
    )

    text = text.replace(
        "Imperva (for ATO and bot activity)",
        "web application security layer (for ATO and bot activity)"
    )

    text = text.replace(
        "Brim partners with Imperva for bot detection and credential stuffing defense at the application layer.",
        "Brim deploys WAF and bot detection at the application layer for credential stuffing defense."
    )

    text = text.replace(
        "fraud and risk screening (World-Check One, TransUnion TruValidate, Imperva)",
        "fraud and risk screening (World-Check One, TransUnion TruValidate, and application-layer security)"
    )

    # Add Experian in TransUnion-only adjudication contexts
    text = text.replace(
        "TransUnion CreditVision dual scores (risk + bankruptcy) with 24-month trended data for credit adjudication\n- TransUnion TruValidate:",
        "TransUnion and Experian for bureau pulls; CreditVision dual scores (risk + bankruptcy) with 24-month trended data for credit adjudication\n- TransUnion TruValidate:"
    )

    text = text.replace(
        "Credit bureau data: TransUnion CreditVision dual scores (risk +. Bankruptcy) with 24-month trended data are pulled automatically during adjudication",
        "Credit bureau data: TransUnion CreditVision and Experian dual scores (risk + bankruptcy) with 24-month trended data are pulled automatically during adjudication"
    )

    text = text.replace(
        "Credit bureau data comes from TransUnion. Brim pulls CreditVision dual scores. A risk score and a bankruptcy score. Along with 24-month trended data during adjudication.",
        "Credit bureau data comes from TransUnion and Experian. Brim pulls dual scores — risk and bankruptcy — along with 24-month trended data during adjudication."
    )

    text = text.replace(
        "Brim has integrated with TransUnion CreditVision for credit adjudication — dual scores (risk and bankruptcy) with 24-month trended data.",
        "Brim has integrated with TransUnion and Experian for credit adjudication — dual scores (risk and bankruptcy) with 24-month trended data."
    )

    # Fix duplicate/awkward sentence in several bullets
    text = text.replace(
        "This is live at Affinity Credit Union and Manulife. Live today with AFFINITY CREDIT UNION, LAURENTIAN BANK, CWB, and MANULIFE operating different configurations on the same platform",
        "Live today with AFFINITY CREDIT UNION, LAURENTIAN BANK, CWB, and MANULIFE operating different configurations on the same platform"
    )

    text = text.replace(
        "This workflow is live at Affinity Credit Union and Manulife. Proactive delinquency triggers run daily across the production portfolio.",
        "Proactive delinquency triggers run daily across the production portfolio — live at MANULIFE BANK and AFFINITY CREDIT UNION."
    )

    text = text.replace(
        "This is live at Affinity Credit Union and Manulife. MANULIFE's financial advisors access the same functionality",
        "MANULIFE's financial advisors access the same functionality"
    )

    return text

# Walk all questions
for q in data.get("questions", []):
    for field in ["bullet", "paragraph"]:
        if field in q:
            q[field] = fix_text(q[field])

with open("public/rfp_data.json", "w", encoding="utf-8") as f:
    json.dump(data, f, indent=2, ensure_ascii=False)

print(f"Done. Replacements applied:")
print(f"  P1 (partner network boilerplate): {counters['p1']}")
print(f"  P2 (features live boilerplate): {counters['p2']}")
print(f"  P3 (operational boilerplate): {counters['p3']}")
print(f"  P4 (all numerous FI programs): {counters['p4']}")
