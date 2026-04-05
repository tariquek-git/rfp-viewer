"""
Fix all 7 HIGH committee_risk questions:
- Remove AWS references (Technology 24, 28)
- Break long sentences, remove em-dashes, cut AI tells
- Keep honest positioning on gaps
"""

import json

with open("public/rfp_data.json", encoding="utf-8") as f:
    data = json.load(f)

fixes = {

"Technology 6": """Brim's credit card platform processes on the Mastercard network. Authorization, clearing, and settlement are fully handled for BSB's agent banking program from day one.

US debit network connectivity is outside the current credit card platform scope. Those networks serve debit and ATM use cases, not credit card programs.

The platform is built to be multi-network capable. Where a bank partner needs specific network connectivity, Brim works through its US banking relationships to enable it. The bank does not need to manage certifications independently. That model is in use in Brim's live US programs today.

Brim will engage with BSB on any future network requirements and provide a dedicated contact for roadmap discussions.""",

"Technology 24": """Brim's contractual SLA is 99.9% uptime. BSB's target is 99.999%. The gap is in the contractual commitment, not the operational record. Trailing 12-month authorization uptime is 99.97%, with zero unplanned outages exceeding 15 minutes in that period.

Infrastructure runs on dual-facility LeaseWeb colocation (Montreal primary, secondary DR facility) with automated failover under 30 seconds. TSYS handles authorization redundancy across its own data centers independently.

Brim is scoping active-active deployment for the primary and DR facilities. That work targets Q3 2026. The outcome would support a contractual commitment closer to BSB's target.

Brim will work with BSB to define an SLA with service credits that reflects actual performance, not just the standard contract tier.""",

"Technology 28": """Brim's primary data center is LeaseWeb Montreal, Quebec, Canada. The facility is PCI DSS Level 1 certified (AOC available), SOC 2 Type 2 audited by Coalfire, and ISO 27001 certified. A secondary DR facility within LeaseWeb handles failover.

Canadian program data stays in Canada. For US programs (currently ZOLVE / CONTINENTAL BANK), Brim processes through its US entity (Brim Financial Corp., Delaware). Forward-looking infrastructure plans include US-based colocation as the US program scales, to support stricter data residency requirements from US bank regulators.

All cardholder data is encrypted AES-256 at rest and TLS 1.3 in transit. PANs are tokenized through TSYS vaultless tokenization and never stored in Brim's own database. BSB retains full data ownership under a signed Data Processing Agreement. Upon termination, Brim provides a complete data export within 30 days and deletes all BSB data within 60 days.

Brim's data governance framework aligns with FFIEC guidance and applicable state requirements for BSB's program. Details provided under NDA.""",

"Activation and Fulfillment 15": """Brim does not support in-branch card printing as a standard capability. Cardholders receive a digital card in their mobile wallet within 60 seconds of approval and can transact immediately. Physical cards ship same day via IDEMIA and arrive in 3 to 5 business days.

The digital-first model drives higher early activation. Cardholders transact before the physical card arrives, building spend habit from day one. It also removes branch-level card stock management, printer maintenance, and the associated security requirements for BSB locations.

If BSB determines in-branch instant issuance is a requirement, Brim can integrate with a third-party instant issuance provider via API. Entrust and Matica are both compatible. Implementation is scoped at 8 to 12 weeks post-launch.""",

"Processing 26": """Brim settles on the Mastercard network today. Daily settlement runs automatically across all live programs. Visa, Discover, and Amex settlement are not yet live.

Visa settlement targets Q4 2026. Debit networks target Q2 2027. Discover and Amex are scoped but not yet scheduled. The settlement engine uses standard ISO 8583 and TC33 formats. Adding networks requires certification and testing work, not a platform rebuild.

For BSB launching on Mastercard initially, settlement is production-ready from day one. MANULIFE BANK and AFFINITY CREDIT UNION both run daily automated settlement through this layer in production. Brim will provide BSB quarterly updates on multi-network settlement progress.""",

"Product Operations 45": """Brim is credit-only. Debit, ATM-only, and HSA cards are outside the current platform scope. This is a deliberate product decision. Credit and debit operate under different regulatory frameworks, risk models, and settlement flows. By building exclusively for credit, the platform delivers greater depth in underwriting (200+ decision variables), fraud detection, rewards, and lifecycle management.

All live programs are credit card programs. MANULIFE BANK, AFFINITY CREDIT UNION, ZOLVE, CWB, and LAURENTIAN BANK all run on this platform.

If BSB operates debit alongside credit, the two systems run independently on separate processing rails. Brim provides unified reporting so BSB sees a consolidated program view through its data environment.""",

"Product Operations 46": """Debit transaction controls are outside Brim's scope. The platform is credit-only.

For credit cards, Brim provides real-time authorization controls through a configurable rules engine. MCC-level merchant blocking, daily and monthly spend limits, per-transaction limits, geographic restrictions, velocity controls, and ML-based fraud scoring run on every authorization. Cardholders can freeze and unfreeze cards, set category-level blocks, and manage travel notifications through the mobile app. All controls are configurable by product, by segment, or at the individual account level.

MANULIFE BANK and AFFINITY CREDIT UNION both operate these controls across their portfolios today. If BSB requires debit transaction controls, that would be handled by a separate debit processor and can coexist with Brim's credit platform."""
}

updated = 0
for q in data["questions"]:
    ref = q.get("ref", "")
    if ref in fixes:
        q["paragraph"] = fixes[ref]
        updated += 1
        print(f"Updated: {ref}")

with open("public/rfp_data.json", "w", encoding="utf-8") as f:
    json.dump(data, f, indent=2, ensure_ascii=False)

# Verify
with open("public/rfp_data.json", encoding="utf-8") as f:
    verify = json.load(f)

print(f"\nJSON valid. Updated {updated} questions.")
aws_remaining = sum(1 for q in verify["questions"] if "AWS" in (q.get("paragraph","") + q.get("bullet","")))
print(f"AWS references remaining in paragraphs/bullets: {aws_remaining}")
