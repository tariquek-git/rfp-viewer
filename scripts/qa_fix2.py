"""
QA fix pass 2:
- Soften Imperva language further (no specific product naming)
- Update Manulife to show both 7M total + 550K banking clients (card penetration opportunity framing)
"""

data = open("public/rfp_data.json", encoding="utf-8").read()

# ── Imperva: soften further from "WAF/bot detection" to generic security language ──

replacements = [
    # line 2853 bullet
    (
        "Web application security and bot detection are deployed at the infrastructure layer.",
        "Standard application security controls are in place at the infrastructure layer."
    ),
    # line 2854 paragraph
    (
        "Application-layer WAF and bot detection are deployed at the infrastructure level.",
        "Standard application security controls are in place at the infrastructure level."
    ),
    # line 5678 bullet
    (
        "- Web application firewall: Account takeover (ATO) protection and bot detection for the online channel",
        "- Application security controls: Account takeover (ATO) protection and bot defense for the online channel"
    ),
    # line 5679 paragraph
    (
        "Web application firewall and bot detection are deployed at the application layer for account takeover defense.",
        "Application security controls are in place for account takeover defense and bot mitigation."
    ),
    # line 5703 bullet
    (
        "web application security layer, TruValidate, World-Check One, and manual agent escalation",
        "application security controls, TruValidate, World-Check One, and manual agent escalation"
    ),
    # line 5704 paragraph
    (
        "web application security layer (for ATO and bot activity)",
        "application security controls (for ATO and bot activity)"
    ),
    # line 9504 paragraph
    (
        "Brim deploys WAF and bot detection at the application layer for credential stuffing defense.",
        "Application security controls provide defense against credential stuffing and bot-based attacks."
    ),
    # line 9579 paragraph
    (
        "fraud and risk screening (World-Check One, TransUnion TruValidate, and application-layer security)",
        "fraud and risk screening (World-Check One, TransUnion TruValidate, and application security controls)"
    ),
]

for old, new in replacements:
    data = data.replace(old, new)

# ── Manulife: show both 7M total + 550K banking to frame card penetration opportunity ──

manulife_replacements = [
    # line 454
    (
        "Manulife (from Fiserv, 55,000 advisors, 550,000 banking clients)",
        "MANULIFE BANK (from Fiserv, 55,000 advisors, 550,000 banking clients out of 7M+ total Manulife-family clients — the card program is positioned to grow into that broader relationship base)"
    ),
    # line 604
    (
        "Manulife: From Fiserv. Signed June 2025, launched October 2025. 55,000 advisors, 550,000 banking clients across consumer, SME, commercial, prepaid, and BNPL.",
        "MANULIFE BANK: From Fiserv. Signed June 2025, launched October 2025. 55,000 advisors, 550,000 banking clients — part of a 7M+ client Manulife parent ecosystem. Card penetration into the broader advisor-referred client base is a key growth lever."
    ),
]

for old, new in manulife_replacements:
    data = data.replace(old, new)

open("public/rfp_data.json", "w", encoding="utf-8").write(data)

# Verify
import json
d = json.loads(data)
print("JSON valid ✓")

checks = [
    ("WAF and bot", 0),
    ("Web application firewall", 0),
    ("Imperva for application", 0),
    ("7M+ total Manulife", 2),
    ("Standard application security controls", 4),
]
for term, expected in checks:
    count = data.count(term)
    status = "✓" if count == expected else f"⚠ expected {expected}"
    print(f"  '{term}': {count} {status}")
