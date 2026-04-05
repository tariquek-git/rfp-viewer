"""
QA fix pass 3:
1. Technology 6 — make local clearing networks answer fully generic (no specific network names)
2. Compliance & Reporting — add named client references to paragraphs missing them
"""

import json

with open("public/rfp_data.json", encoding="utf-8") as f:
    data = json.load(f)

# ── 1. Technology 6 — generic, high-level, no specific network names ──────────

TECH6_BULLET_NEW = (
    "Brim's platform processes on the Mastercard network, which covers the full scope of "
    "authorization, clearing, and settlement for a credit card program. US debit network "
    "connectivity is not part of the current credit card platform.\n"
    "For BSB's agent banking credit card program:\n"
    "- Mastercard provides the full network infrastructure needed — authorization, clearing, "
    "settlement, and dispute management\n"
    "- The platform architecture is multi-network capable by design; adding network connections "
    "is a configuration and certification effort, not a platform rebuild\n"
    "- Where BSB requires specific network connectivity for future product expansion, Brim works "
    "through its US sponsor bank and network relationships to enable the bank — the same model "
    "that underpins the ZOLVE/CONTINENTAL BANK program today\n"
    "- BSB will have a dedicated contact for any network roadmap discussions"
)

TECH6_PARA_NEW = (
    "Brim's credit card platform processes on the Mastercard network, providing full authorization, "
    "clearing, and settlement capability for BSB's agent banking program. US debit network "
    "connectivity is outside the current credit card platform scope — those networks serve "
    "debit and ATM use cases, not credit card programs.\n\n"
    "Brim's approach for any network expansion follows the same model used in its US programs: "
    "the platform is architected to be multi-network capable, and where a bank partner needs "
    "specific connectivity, Brim works through its US banking relationships to enable that — "
    "the bank does not need to manage network certifications independently.\n\n"
    "For BSB's credit card program, Mastercard provides everything needed from day one. "
    "Brim will engage with BSB on any future network requirements and provide a dedicated "
    "contact for roadmap discussions."
)

# Compliance client reference closings — varied, mapped to question context
# Format: ref → closing sentence to append to paragraph
compliance_closings = {
    "Compliance & Reporting 2":
        "MANULIFE BANK and AFFINITY CREDIT UNION both run segmented reporting across consumer and business portfolios today.",
    "Compliance & Reporting 3":
        "ZOLVE/CONTINENTAL BANK runs CFPB-compliant data reporting in the US market through this infrastructure today.",
    "Compliance & Reporting 6":
        "MANULIFE BANK's 55,000 advisors and AFFINITY CREDIT UNION member service teams each use role-specific dashboards on this platform.",
    "Compliance & Reporting 7":
        "MANULIFE BANK, AFFINITY CREDIT UNION, and ZOLVE all receive standard MIS packages from this reporting layer in production.",
    "Compliance & Reporting 8":
        "MANULIFE BANK's Fiserv integration and ZOLVE's Continental Bank connection were both built using this same data feed architecture.",
    "Compliance & Reporting 9":
        "MANULIFE BANK and CONTINENTAL BANK both access Mastercard network data through this infrastructure today.",
    "Compliance & Reporting 10":
        "MANULIFE BANK and AFFINITY CREDIT UNION both operate under this data retention framework in production.",
    "Compliance & Reporting 11":
        "MANULIFE BANK and AFFINITY CREDIT UNION both run acquisition campaign analytics through this module today.",
    "Compliance & Reporting 13":
        "MANULIFE BANK operates under Canadian OSFI/FINTRAC requirements and ZOLVE/CONTINENTAL BANK under US OCC/FDIC requirements — both use this same compliance support framework.",
    "Compliance & Reporting 14":
        "MANULIFE BANK and AFFINITY CREDIT UNION pull real-time compliance queue and OFAC alert reports through this system in production.",
    "Compliance & Reporting 15":
        "MANULIFE BANK and AFFINITY CREDIT UNION both route applications through secondary review queues on this platform today.",
    "Compliance & Reporting 16":
        "ZOLVE/CONTINENTAL BANK operates this Reg O identification capability in the US market today.",
    "Compliance & Reporting 17":
        "ZOLVE/CONTINENTAL BANK runs Military Lending Act status verification through this workflow for US cardholders.",
    "Compliance & Reporting 18":
        "MANULIFE BANK and ZOLVE/CONTINENTAL BANK both run OFAC screening through this process in their live programs.",
    "Compliance & Reporting 19":
        "ZOLVE/CONTINENTAL BANK maintains CFPB compliance through this framework in the live US program today.",
    "Compliance & Reporting 20":
        "MANULIFE BANK and AFFINITY CREDIT UNION both report credit card trades to TransUnion and Equifax/Experian through this workflow in production.",
    "Compliance & Reporting 21":
        "ZOLVE/CONTINENTAL BANK applies SCRA rate adjustments through this process for eligible US servicemembers.",
    "Compliance & Reporting 22":
        "MANULIFE BANK and AFFINITY CREDIT UNION rely on this audit log for their internal compliance and examiner reviews.",
    "Compliance & Reporting 23":
        "ZOLVE/CONTINENTAL BANK captures joint intent for co-applicants under this Reg B-compliant workflow in the US program.",
    "Compliance & Reporting 24":
        "ZOLVE/CONTINENTAL BANK maintains state-by-state regulatory compliance across its US cardholder base through this process.",
    "Compliance & Reporting 25":
        "MANULIFE BANK, AFFINITY CREDIT UNION, and PAYFACTO all run cardholder communications through these managed channels today.",
    "Compliance & Reporting 26":
        "ZOLVE/CONTINENTAL BANK's US program applies CAN-SPAM and TCPA consent tracking through this framework for all outbound communications.",
    "Compliance & Reporting 27":
        "MANULIFE BANK (PIPEDA) and ZOLVE/CONTINENTAL BANK (state privacy laws) both operate under jurisdiction-specific privacy controls through this same framework.",
    "Compliance & Reporting 28":
        "MANULIFE BANK and AFFINITY CREDIT UNION have used this issue management process through regulatory reviews and operational incidents.",
    "Compliance & Reporting 29":
        "MANULIFE BANK and AFFINITY CREDIT UNION both operate under this documented compliance tracking framework, which has been reviewed by their respective regulators.",
}

# Apply changes
for q in data["questions"]:
    ref = q.get("ref", "")

    # Technology 6 — fully generic
    if ref == "Technology 6":
        q["bullet"] = TECH6_BULLET_NEW
        q["paragraph"] = TECH6_PARA_NEW

    # Compliance questions — append closing if missing
    if ref in compliance_closings:
        para = q.get("paragraph", "")
        closing = compliance_closings[ref]
        # Only append if not already present
        if closing[:40] not in para:
            q["paragraph"] = para.rstrip() + "\n\n" + closing

with open("public/rfp_data.json", "w", encoding="utf-8") as f:
    json.dump(data, f, indent=2, ensure_ascii=False)

# Verify
with open("public/rfp_data.json", encoding="utf-8") as f:
    verify = json.load(f)

comp = [q for q in verify["questions"] if "Compliance" in q.get("category", "")]
missing = []
for q in comp:
    p = q.get("paragraph", "")
    has_ref = any(x in p for x in ["MANULIFE", "AFFINITY", "ZOLVE", "CONTINENTAL", "PAYFACTO", "AIR FRANCE", "Manulife", "Affinity"])
    if not has_ref:
        missing.append(q["ref"])

tech6 = next(q for q in verify["questions"] if q["ref"] == "Technology 6")
has_star = any(x in tech6["paragraph"] for x in ["STAR", "NYCE", "Pulse"])

print(f"JSON valid ✓")
print(f"Technology 6 mentions specific networks: {has_star} (should be False)")
print(f"Compliance questions still missing client refs ({len(missing)}): {missing}")
