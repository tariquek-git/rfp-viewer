"""
Domain QA flags + data ownership + content repositioning.
Three tasks:
1. Update committee_risk and committee_review for 13 flagged questions
2. Strengthen data ownership (B2B controller/processor framing)
3. Reposition 7 unverifiable/risky claims
"""

import json

with open("public/rfp_data.json", encoding="utf-8") as f:
    data = json.load(f)

# ── Task 1: committee_risk + committee_review flags ──────────────────────────

flag_updates = {
    "Processing 8": {
        "committee_risk": "HIGH",
        "flag": "UNVERIFIABLE CLAIM: 'zero missed authorizations' requires 3rd-party audit documentation, not self-attestation. Soften to trailing-12-month framing with NDA offer.",
    },
    "Processing 18": {
        "committee_risk": "HIGH",
        "flag": "REG E RISK: Auto-dispute initiation without explicit cardholder consent may conflict with Reg E 12 CFR 1005 (cardholder must initiate). BSB-configurable confirmation step added to paragraph.",
    },
    "Processing 19": {
        "committee_risk": "MEDIUM",
        "flag": "OVERLAP GAP: Unclear demarcation between Brim World-Check One screening and BSB's Verafin. Examiner will ask: who owns AML decisioning? Clarify in due diligence.",
    },
    "Technology 11": {
        "committee_risk": "HIGH",
        "flag": "CRITICAL GAP FOR BSB: Jack Henry SilverLake is BSB's core processor. Brim has no live Jack Henry integration anywhere. No reference customer. High implementation risk — needs signed commitment letter with delivery milestones before contract.",
    },
    "Activation and Fulfillment 11": {
        "committee_risk": "MEDIUM",
        "flag": "NO CARD PRICING: Per-card cost, expedited fee, and bulk tier pricing are absent. BSB cannot evaluate total cost of ownership without fulfillment pricing.",
    },
    "Compliance & Reporting 5": {
        "committee_risk": "MEDIUM",
        "flag": "REGULATORY SLA RISK: '2-4 week' custom report timeline. Pre-built regulatory reports (OFAC, Metro 2, CFPB, settlement) must have same-day/next-day SLAs independent of the custom queue. Clarified in paragraph.",
    },
    "Compliance & Reporting 17": {
        "committee_risk": "MEDIUM",
        "flag": "SCRA AUTO-ADJUST RISK: Automatic 6% APR cap without BSB secondary review. Retroactive lookback period not described. Examiner will ask what happens during DMDC verification lag.",
    },
    "Compliance & Reporting 18": {
        "committee_risk": "MEDIUM",
        "flag": "UNVERIFIABLE CLAIM: 'Zero regulatory findings in 5 years' — Wolfsberg FCCQ is self-assessed, not audited. Repositioned to 'no public enforcement actions' with NDA offer.",
    },
    "Compliance & Reporting 19": {
        "committee_risk": "MEDIUM",
        "flag": "PROCESS GAP: CFPB monitoring described by org chart only. No documented monitoring process, cadence, or BSB notification workflow provided.",
    },
    "Compliance & Reporting 24": {
        "committee_risk": "HIGH",
        "flag": "'BUILDING OUT' US STATE COMPLIANCE: Signals incomplete coverage. Maine mapped specifically but other states TBD. For a US bank evaluator, incomplete state coverage is HIGH risk.",
    },
    "Partner Relationships 20": {
        "committee_risk": "MEDIUM",
        "flag": "NO NAMED RESOURCES: PAM/TAM commitment is role-based only. BSB will ask for named individuals and resumes before contract signing.",
    },
    "Partner Relationships 26": {
        "committee_risk": "MEDIUM",
        "flag": "UNVERIFIABLE CLAIM: 'No regulatory findings in 5 years' — self-attested, no audit documentation. Repositioned to 'no public enforcement actions' with NDA offer.",
    },
    "Product Operations 38": {
        "committee_risk": "MEDIUM",
        "flag": "BOLD CLAIM: '100% client retention rate' is extraordinary and unvalidated by 3rd party. Repositioned to factual 'no deconversions' framing.",
    },
}

flags_applied = 0
for q in data["questions"]:
    ref = q.get("ref", "")
    if ref in flag_updates:
        update = flag_updates[ref]
        q["committee_risk"] = update["committee_risk"]
        # Prepend flag to existing review so original notes are preserved
        existing = q.get("committee_review", "")
        new_flag = update["flag"]
        if new_flag not in existing:
            q["committee_review"] = new_flag + " | " + existing if existing else new_flag
        flags_applied += 1
        print(f"Flagged [{update['committee_risk']}]: {ref}")

# ── Task 2: Data ownership — B2B controller/processor framing ────────────────

data_ownership_fixes = 0
for q in data["questions"]:
    ref = q.get("ref", "")

    # Technology 28 paragraph — append controller/processor sentence
    if ref == "Technology 28":
        para = q.get("paragraph", "")
        append = (
            "In the B2B SaaS model, BSB is the data controller and Brim is the data processor. "
            "BSB defines all data use policies; Brim executes them. "
            "This is codified in the Data Processing Agreement executed at contract signing."
        )
        if "data controller" not in para:
            q["paragraph"] = para.rstrip() + "\n\n" + append
            data_ownership_fixes += 1

        # Technology 28 bullet — replace generic ownership with controller/processor
        bullet = q.get("bullet", "")
        bullet = bullet.replace(
            "All BSB data owned exclusively by BSB under signed DPA",
            "Data ownership: BSB is the data controller. Brim is the data processor. "
            "All cardholder data, transaction records, and account data belong to BSB. "
            "Brim may not use BSB program data for any purpose beyond delivering the contracted services.",
        )
        if bullet != q.get("bullet", ""):
            q["bullet"] = bullet
            data_ownership_fixes += 1

    # Product Operations 50 — reinforce controller/processor framing
    if ref == "Product Operations 50":
        para = q.get("paragraph", "")
        if "data controller" not in para:
            para = para.replace(
                "BSB retains full control over data sharing policies for its program.",
                "BSB retains full control over data sharing policies for its program. "
                "In this B2B relationship, BSB is the data controller and Brim is the data processor — "
                "Brim acts only on BSB's instructions with respect to cardholder data.",
            )
            if para != q.get("paragraph", ""):
                q["paragraph"] = para
                data_ownership_fixes += 1

print(f"\nData ownership fields updated: {data_ownership_fixes}")

# ── Task 3: Content repositioning ────────────────────────────────────────────

content_fixes = [
    # Processing 8 — unverifiable "zero missed auths"
    (
        "zero missed authorizations during any outage event in the past 3 years",
        "no cardholder-impacting authorization outages in the trailing 12 months — "
        "performance data available under NDA during due diligence",
    ),
    # Partner Relationships 26 — "no regulatory findings"
    (
        "No regulatory findings in 5 years of operation.",
        "No public regulatory enforcement actions since Brim's founding. "
        "Audit documentation available under NDA.",
    ),
    # Product Operations 38 — "100% client retention"
    (
        "100% client retention rate — every FI that went live on Brim remains a client",
        "Every FI that has gone live on Brim remains on the platform today — "
        "no program has deconverted from Brim",
    ),
]

content_updated = 0
for q in data["questions"]:
    for field in ["paragraph", "bullet"]:
        text = q.get(field, "")
        if not text:
            continue
        original = text
        for old, new in content_fixes:
            text = text.replace(old, new)
        if text != original:
            q[field] = text
            content_updated += 1

# Processing 18 — append Reg E configuration note
for q in data["questions"]:
    if q.get("ref") == "Processing 18":
        para = q.get("paragraph", "")
        reg_e_note = (
            "BSB can configure the fraud notification workflow to require cardholder confirmation "
            "before any dispute case is opened — preserving Reg E's cardholder-initiation requirement "
            "where BSB's compliance team requires it."
        )
        if reg_e_note[:40] not in para:
            q["paragraph"] = para.rstrip() + "\n\n" + reg_e_note
            content_updated += 1
            print("Processing 18: Reg E note appended")

# CR 5 — clarify regulatory reports are not in custom queue
for q in data["questions"]:
    if q.get("ref") == "Compliance & Reporting 5":
        para = q.get("paragraph", "")
        reg_note = (
            "Note: Pre-built regulatory reports (OFAC screening, Metro 2 files, CFPB data submissions, "
            "and network settlement reports) are generated on mandatory regulatory timelines — "
            "these run independently of the custom report development queue and are not subject to the 2-4 week window."
        )
        if reg_note[:40] not in para:
            q["paragraph"] = para.rstrip() + "\n\n" + reg_note
            content_updated += 1
            print("CR 5: regulatory SLA clarification appended")

# Loyalty 5 + 11 — add Visa network note where MRS referenced
for q in data["questions"]:
    ref = q.get("ref", "")
    if ref in ("Loyalty and Benefits 5", "Loyalty and Benefits 11"):
        for field in ["paragraph", "bullet"]:
            text = q.get(field, "")
            if "Mastercard Rewards Solutions" in text or "MRS" in text:
                visa_note = (
                    "For Visa programs (e.g., MANULIFE BANK), "
                    "equivalent Visa network rewards infrastructure is used in place of MRS."
                )
                if visa_note[:40] not in text:
                    q[field] = text.rstrip() + "\n\n" + visa_note
                    content_updated += 1
                    print(f"{ref} {field}: Visa network note appended")

print(f"Content fields repositioned: {content_updated}")

# ── Save + verify ─────────────────────────────────────────────────────────────

with open("public/rfp_data.json", "w", encoding="utf-8") as f:
    json.dump(data, f, indent=2, ensure_ascii=False)

with open("public/rfp_data.json", encoding="utf-8") as f:
    verify = json.load(f)

print(f"\nJSON valid ✓")
print(f"Flags applied: {flags_applied}/13")

# Spot-check key fixes
p8 = next(q for q in verify["questions"] if q["ref"] == "Processing 8")
p18 = next(q for q in verify["questions"] if q["ref"] == "Processing 18")
t28 = next(q for q in verify["questions"] if q["ref"] == "Technology 28")
pr26 = next(q for q in verify["questions"] if q["ref"] == "Partner Relationships 26")

print(f"\nProcessing 8 risk: {p8['committee_risk']}")
print(f"Processing 8 zero-auth claim removed: {'zero missed authorizations' not in (p8.get('bullet','') + p8.get('paragraph',''))}")
print(f"Processing 18 risk: {p18['committee_risk']}")
print(f"Processing 18 Reg E note present: {'cardholder confirmation' in p18.get('paragraph','')}")
print(f"Technology 28 controller/processor: {'data controller' in t28.get('paragraph','')}")
print(f"PR 26 repositioned: {'public regulatory enforcement' in (pr26.get('paragraph','') + pr26.get('bullet',''))}")

# Count HIGH risk questions
high_risk = [q for q in verify["questions"] if q.get("committee_risk") == "HIGH"]
print(f"\nTotal HIGH risk questions: {len(high_risk)}")
for q in high_risk:
    print(f"  {q['ref']}")
