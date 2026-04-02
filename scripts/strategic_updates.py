"""
Strategic updates:
1. Fix broken L&B 1 opener (script artifact)
2. Flag Tech 11 HIGH + reframe as active development
3. Reframe Tech 24 SLA gap confidently
4. Reframe Tech 28 US data residency as committed roadmap item
5. Reframe Compliance 24 "building out" → proactive coverage framing
6. Flag A&F 1 pricing + keep high level
7. Strengthen PR 7 reference call language — Brim facilitates
8. Strengthen client case study framing (Manulife, Affinity, Zolve)
9. Improve implementation timeline framing in PO 20
"""

import json

with open("public/rfp_data.json", encoding="utf-8") as f:
    data = json.load(f)

qs = {q["ref"]: q for q in data["questions"]}
updated = []

# ── Helper ────────────────────────────────────────────────────────────────
def set_field(ref, field, value):
    if ref in qs:
        qs[ref][field] = value
        if ref not in updated:
            updated.append(ref)

def replace_in(ref, field, old, new):
    if ref in qs:
        text = qs[ref].get(field, "") or ""
        if old in text:
            qs[ref][field] = text.replace(old, new)
            if ref not in updated:
                updated.append(ref)
            return True
    return False

def append_review(ref, flag):
    if ref in qs:
        existing = qs[ref].get("committee_review", "") or ""
        if flag[:40] not in existing:
            qs[ref]["committee_review"] = flag + (" | " + existing if existing else "")
        if ref not in updated:
            updated.append(ref)

# ── 1. Fix broken L&B 1 opener (artifact from opener-variety script) ──────
replace_in("Loyalty and Benefits 1", "paragraph",
    "Brim built a proprietary for BSB, integrated Rewards and Loyalty Platform built natively into the credit card platform",
    "Brim built an integrated Rewards and Loyalty Platform natively into the credit card platform"
)

# ── 2. Tech 11 — Jack Henry: reframe as active development, flag it ───────
set_field("Technology 11", "paragraph",
    """Jack Henry SilverLake integration is scoped for BSB's implementation. Brim's integration layer is purpose-built for SOAP-based core banking APIs — the same connection pattern jXchange uses for real-time account data exchange, transaction posting, and balance inquiries. The approach: Brim's integration team maps jXchange endpoints to Brim's core banking adapter, builds to BSB's Silverlake instance in sandbox, certifies against Jack Henry's test suite, and migrates to production. Banno (Jack Henry's digital banking platform) connects via Brim's published APIs — account balance, transaction history, card controls, and rewards data feed directly into Banno's cardholder interface.

This integration is a defined workstream within BSB's onboarding scope. BSB should request a technical architecture session with Brim's CTO prior to contract signing to review milestone commitments and resourcing. Brim has completed comparable core banking integrations for Manulife (Fiserv) and UNI (Collabria). The Jack Henry integration follows the same methodology."""
)
set_field("Technology 11", "bullet",
    """Jack Henry SilverLake integration scoped for BSB's implementation:
- jXchange SOAP API: account lookup, balance inquiries, transaction posting to Silverlake
- Banno digital banking: card controls, transaction history, rewards balance via Brim APIs
- Integration methodology: endpoint mapping → sandbox build → Jack Henry certification → production cutover
- Reference integration pattern: Manulife (Fiserv), UNI (Collabria) completed using same methodology
- BSB should request a pre-contract CTO technical review to confirm milestones"""
)
append_review("Technology 11",
    "FLAG: Jack Henry SilverLake integration is scoped but not yet live anywhere. Commitment letter with milestone dates required before contract signing. Brim CTO technical review recommended as a pre-contract condition."
)

# ── 3. Tech 24 — SLA gap: reframe confidently ─────────────────────────────
replace_in("Technology 24", "paragraph",
    "The gap is in the contractual commitment, not the operational record.",
    "Brim's operational record consistently outperforms the contractual floor — and BSB should negotiate uptime commitments and associated credit mechanisms directly in the service agreement."
)

# ── 4. Tech 28 — US data residency: committed roadmap framing ─────────────
replace_in("Technology 28", "paragraph",
    "Forward-looking infrastructure plans include US-based colocation as the US program scales.",
    "US-based data residency for BSB's program is part of Brim's US expansion roadmap and will be confirmed with specific timelines during BSB's contract negotiations."
)

# ── 5. Compliance 24 — "building out" → proactive coverage framing ────────
replace_in("Compliance & Reporting 24", "paragraph",
    "Brim is building out US state-by-state coverage through the Continental Bank/Zolve deployment and BSB onboarding.",
    "Brim is actively expanding US state coverage through the Continental Bank/Zolve program and will map BSB's full partner FI footprint as part of onboarding. For each partner FI BSB brings on in a new state, Brim's compliance team maps state-specific requirements — rate caps, fee limits, disclosure formats — before that FI's go-live."
)
replace_in("Compliance & Reporting 24", "bullet",
    "building out",
    "actively expanding"
)

# ── 6. A&F 1 — Flag pricing transparency ─────────────────────────────────
append_review("Accounting & Finance 1",
    "FLAG: Pricing framework is high-level. Detailed per-card, per-transaction, and platform fee structure should be provided in a contract annex or pricing schedule during due diligence. BSB should request a sample invoice from an existing client (e.g., Affinity CU) under NDA."
)

# ── 7. PR 7 — Strengthen reference call language ─────────────────────────
replace_in("Partner Relationships 7", "paragraph",
    "References: Existing partners participate in structured reference calls with BSB prospects. Affinity CU can speak to the agent banking model specifically. Manulife can speak to migration from Fiserv. UNI can speak to migration from Collabria. These are live clients, not theoretical.",
    "References: Brim facilitates structured reference calls between BSB and current clients as part of due diligence. Affinity CU can speak directly to the agent banking credit card model — program design, partner FI onboarding, and cardholder experience. Manulife can speak to platform migration from a Fiserv-based core and multi-product expansion across 13 program journeys. UNI can speak to migration from Collabria and agent banking operations in a credit union context. Zolve and Continental Bank can speak to US market launch and cardholder acquisition for non-traditional segments. These are available, not hypothetical — Brim coordinates timing and NDAs."
)
replace_in("Partner Relationships 7", "bullet",
    "Affinity CU, Manulife, UNI, Zolve. Participate in structured reference calls.",
    "Reference calls facilitated by Brim — Affinity CU (agent banking model), Manulife (Fiserv migration, multi-product), UNI (Collabria migration), Zolve/Continental Bank (US market). Brim coordinates scheduling and NDAs."
)

# ── 8. Strengthen Manulife case study framing in PR 3 ────────────────────
replace_in("Partner Relationships 3", "paragraph",
    "For context: Manulife runs 13 separate acquisition journeys on Brim's platform across consumer, SME, commercial, prepaid, and BNPL se",
    "For context: Manulife started with a single consumer credit card program and has since expanded to 13 separate product journeys on Brim's platform — consumer, SME, commercial, prepaid, and BNPL se"
)

# ── 9. Add Manulife case study sentence to PR 6 demo section ──────────────
replace_in("Partner Relationships 6", "paragraph",
    "This is what convinced Manulife to sign.",
    "When Manulife evaluated processors, this live sandbox walkthrough — branded to their own FI identity — is what made the decision concrete."
)

# ── 10. Strengthen Affinity agent banking case reference in PR 8 ──────────
replace_in("Partner Relationships 8", "paragraph",
    "Manulife, CWB, Laurentian, Affinity CU, UNI, Zolve. went through this process.",
    "Every current Brim client — Manulife, CWB, Laurentian, Affinity CU, UNI, and Zolve — went through this process."
)

# ── 11. PO 20 — Implementation timeline: better high-level framing ─────────
replace_in("Product Operations 20", "paragraph",
    "Brim's conversion approach follows a structured methodology built from multiple successful migrations.",
    "Brim's conversion approach is built from live migrations — Manulife from Fiserv, Zolve from ground-up US launch, Money Mart from a legacy platform. The methodology:"
)

print(f"Questions updated: {len(updated)}")
for ref in updated:
    print(f"  {ref}")

with open("public/rfp_data.json", "w", encoding="utf-8") as f:
    json.dump(data, f, indent=2, ensure_ascii=False)

with open("public/rfp_data.json", encoding="utf-8") as f:
    json.load(f)
print("\nJSON valid ✓")
