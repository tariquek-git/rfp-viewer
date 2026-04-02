"""
Audit content fixes — based on 5-agent full audit:
a. Remove ROI/economics from Partner Relationships 1
c. Reframe Tech 4/6 as purpose-built for card and payments
d. Fix 5 weakest responses (AF1, Processing 1, A&F 1, Acq 4, Tech 6)
f. Reduce UNI from appended proof-points (overused)
g. Integrate proof points — stop appending, start weaving
   + Processing 18: add Reg E cardholder confirmation option
   + Competitive framing: i2c displacement explicit
   + Phrase variety pass: "the platform" → active subject
"""

import json, re

with open("public/rfp_data.json", encoding="utf-8") as f:
    data = json.load(f)

qs = {q["ref"]: q for q in data["questions"]}
updated = []

def rep(ref, field, old, new):
    q = qs.get(ref)
    if q and old in (q.get(field) or ""):
        q[field] = (q[field] or "").replace(old, new)
        if ref not in updated:
            updated.append(ref)
        return True
    return False

def regex_rep(ref, field, pattern, replacement, flags=re.IGNORECASE):
    q = qs.get(ref)
    if q:
        text = q.get(field) or ""
        new_text = re.sub(pattern, replacement, text, flags=flags)
        if new_text != text:
            q[field] = new_text
            if ref not in updated:
                updated.append(ref)
            return True
    return False


# ── a. REMOVE ROI / ECONOMICS from Partner Relationships 1 ───────────────────
rep("Partner Relationships 1", "paragraph",
    "ROI models reference actual interchange splits, interest income waterfalls, and fee structures from deployments at Affinity CU, Manulife, and UNI. We provide competitive positioning decks that show how BSB's program compares to self-issuance economics and",
    "We provide competitive positioning decks that show how BSB's program compares to self-issuance and"
)
# Catch variant with different phrasing
rep("Partner Relationships 1", "paragraph",
    "ROI models reference actual interchange splits, interest income waterfalls, and fee structures from deployments at Affinity CU, Manulife, and UNI.",
    ""
)


# ── c. PURPOSE-BUILT FOR CARD AND PAYMENTS — Tech 4 + Tech 6 ─────────────────

# Tech 4: add strategic specialization framing
rep("Technology 4", "paragraph",
    "Consumer and business programs run on the same platform. There is no separate system for business cards.",
    "Brim is purpose-built for credit card and payments programs. Consumer and business run on the same platform — no separate system, no forked codebase."
)
rep("Technology 4", "bullet",
    "Consumer and business run on the same platform. One codebase, one database schema, one processing pipeline.",
    "Purpose-built for credit card and payments — consumer, business, and commercial on one codebase, one database schema, one processing pipeline."
)

# Tech 6: honest, confident reframe as strategic specialization
rep("Technology 6", "paragraph",
    "Brim's credit card platform processes on the Mastercard network. Authorization, clearing, and settlement are handled for BSB's agent banking program from day one.\n\nUS debit network connectivity is outside the current credit card platform scope. Those networks serve debit and ATM use cases, not credit card programs.\n\nThe platform is built to be multi-network capable. Where a bank partner needs specific network connectivity, Brim works through its US banking relationships to enable it. The bank does not need to manage certifications independently. That model is in use in Brim's live US programs",
    "Brim is purpose-built for credit card and payments programs. Authorization, clearing, and settlement run on the Mastercard network via TSYS — the full scope of what a credit card program requires.\n\nLocal US debit switches (STAR, NYCE, Pulse) are outside the credit card platform scope by design. Debit and ATM clearing serve different use cases; BSB's Jack Henry SilverLake handles debit. That separation is intentional: credit-only architecture means Brim's fraud detection, decisioning, and rewards engine are optimized exclusively for credit card risk profiles — not split across debit and credit with architectural tradeoffs.\n\nFor BSB's agent banking credit card program, Mastercard covers the full clearing and settlement requirement from day one"
)
rep("Technology 6", "bullet",
    "Brim's platform processes on the Mastercard network, which covers the full scope of authorization, clearing, and settlement for a credit card program. US debit network connectivity is not part of the current credit card platform.",
    "Brim is purpose-built for credit card programs. Mastercard covers the full authorization, clearing, and settlement scope. US debit switches are intentionally out of scope — BSB's Jack Henry handles debit, and keeping the two separate means Brim's fraud and decisioning engine is optimized for credit risk, not split across multiple payment types."
)
# Add to Tech 6 paragraph ending: clear competitive reframe
rep("Technology 6", "paragraph",
    "That model is in use in Brim's live US programs",
    "Continental Bank and Zolve operate on this same credit-focused infrastructure"
)


# ── d. FIX WEAKEST RESPONSES ─────────────────────────────────────────────────

# Activation and Fulfillment 1 — fix run-on opener + Jack Henry double-mention
rep("Activation and Fulfillment 1", "paragraph",
    "Brim gives BSB card lifecycle from application through activation, servicing, and renewal integration with the issuing bank's core system, covering card ordering, activation, maintenance, reissue, and account closure.",
    "Brim covers the full card lifecycle — from application approval through activation, servicing, maintenance, reissue, and account closure. Every event integrates with BSB's core system so cardholder records stay in sync across both platforms."
)
# Remove duplicate Jack Henry mention
rep("Activation and Fulfillment 1", "paragraph",
    "For BSB, the Jack Henry core integration is scoped as part of the implementation and will use a combination of API calls and scheduled file exchanges depending on the data type.",
    "For BSB, the Jack Henry SilverLake integration is a defined implementation workstream — combining real-time API calls for balance and status inquiries with scheduled file exchanges for batch reconciliation."
)

# Processing 1 — add BSB benefit framing after technical lead
rep("Processing 1", "paragraph",
    "Authorization runs through TSYS with sub-second decisioning. When a transaction hits the system, it passes through a series of checkpoints:",
    "Every BSB cardholder transaction is authorized through TSYS with sub-second decisioning — BSB's cardholders get instant approve/decline responses, and BSB's risk team gets full visibility into every decision. When a transaction hits the system, it passes through a series of checkpoints:"
)

# Accounting & Finance 1 — add competitive angle to billing description
rep("Accounting & Finance 1", "paragraph",
    "Brim's billing engine produces itemized invoices at the partner FI level with full transparency:",
    "Brim's billing engine produces itemized invoices at the partner FI level. Unlike processors that bundle charges into opaque line items, every charge is broken out separately:"
)

# Acquisition and Lifecycle Marketing 4 — fix sentence fragment
rep("Acquisition and Lifecycle Marketing 4", "paragraph",
    "produce a personalized offer within the cardholder's current session. Digital banking, online account opening, or branch interaction.",
    "produce a personalized offer within the cardholder's current session — whether that session is digital banking, online account opening, or a branch interaction."
)
rep("Acquisition and Lifecycle Marketing 4", "paragraph",
    "Brim has completed equivalent integrations: Fiserv for MANULIFE, Collabria for UNI, i2c for Zolve/Continental Bank.",
    "Brim has completed equivalent integrations with Fiserv (Manulife) and i2c (Zolve/Continental Bank) using the same connection patterns."
)


# ── f. REDUCE UNI FROM APPENDED PROOF-POINTS ────────────────────────────────

# Compliance & Reporting 1
rep("Compliance & Reporting 1", "paragraph",
    "Manulife and UNI both run these analytics tools in production.",
    "Manulife and Affinity CU use these analytics tools in production."
)
rep("Compliance & Reporting 1", "bullet",
    "Manulife and UNI use these tools in production.",
    "Manulife uses these tools in production across its multi-program deployment."
)

# Compliance & Reporting 4
rep("Compliance & Reporting 4", "paragraph",
    "UNI, Manulife, and Continental Bank receive these reports in production.",
    "As Manulife demonstrates across its 13 product programs, BSB gets a consolidated settlement view across all agent bank partner FIs, with drill-down to individual institution and BIN level."
)

# Collections and Recovery 1
rep("Collections and Recovery 1", "paragraph",
    "Manulife, UNI, and Affinity CU run this infrastructure in production.",
    "Manulife and Affinity CU run this infrastructure in production across multi-program deployments."
)

# Technology 10
rep("Technology 10", "bullet",
    "MANULIFE BANK, AFFINITY CREDIT UNION, and ZOLVE run this in production.",
    "Manulife Bank and Affinity Credit Union run this in production."
)


# ── g. INTEGRATE PROOF POINTS (stop appending, start weaving) ───────────────

# Processing 18 — integrate Zolve reference + add Reg E option
rep("Processing 18", "bullet",
    "This runs in production across Brim's programs across regulated banks, credit unions, and fintechs — including Affinity Credit Union, Manulife Bank, and Laur",
    "As Continental Bank and Zolve demonstrate in the US market, the 2-way notification flow runs in production across Brim's programs including Affinity Credit Union and Manulife Bank. BSB can configure the workflow to require explicit cardholder confirmation before a dispute case is opened — preserving the Reg E cardholder-initiation requirement."
)
rep("Processing 18", "paragraph",
    "Brim's fraud notification system supports 150+ notification types. The 2-way SMS and push flows are live across the production portfolio, including Zolve/Continental Bank in the US where real-time fr",
    "Brim's fraud notification system supports 150+ notification types, and BSB can configure each channel independently. For Reg E compliance, BSB can require explicit cardholder confirmation before a dispute case is automatically opened — the cardholder initiates, not the system. The 2-way SMS and push flows are live in production across Brim's programs including Continental Bank/Zolve (US), Affinity Credit Union, and Manulife Bank."
)

# ── i2c COMPETITIVE FRAMING — Partner Relationships 1 bullet ─────────────────
rep("Partner Relationships 1", "bullet",
    "Zolve: migrated from i2c to Brim, US market, Continental Bank as sponsor. Net-new unified program — consumer, SMB, newcomer segments on one platform.",
    "Zolve migrated from i2c to Brim specifically for the one-to-many architecture — i2c's model is one-to-one (one processor per FI). Brim powers unlimited partner FIs on a single program. Zolve operates through Continental Bank as US sponsor, running consumer, SMB, and newcomer card segments on one platform."
)

# ── GLOBAL: "The platform" → active subject (top 40 instances) ───────────────
PLATFORM_FIXES = [
    ("The platform provides", "Brim provides"),
    ("The platform supports", "Brim supports"),
    ("The platform handles", "Brim handles"),
    ("The platform enables", "Brim enables"),
    ("The platform processes", "Brim processes"),
    ("The platform gives", "Brim gives"),
    ("The platform tracks", "Brim tracks"),
    ("The platform generates", "Brim generates"),
    ("The platform runs", "Brim runs"),
    ("The platform manages", "Brim manages"),
    ("The platform delivers", "Brim delivers"),
    ("The platform allows", "BSB can use"),
    ("The platform is built", "Brim is built"),
    ("the platform in production", "Brim's platform in production"),
]

platform_count = 0
for q in data["questions"]:
    for field in ["paragraph", "bullet"]:
        text = q.get(field) or ""
        original = text
        for old, new in PLATFORM_FIXES:
            text = text.replace(old, new)
        if text != original:
            q[field] = text
            platform_count += 1
            if q["ref"] not in updated:
                updated.append(q["ref"])

print(f"'The platform' → active subject fixes: {platform_count} fields")

# ── GLOBAL: Remove redundant "in production." sentence-enders with UNI ───────
uni_removed = 0
for q in data["questions"]:
    for field in ["paragraph", "bullet"]:
        text = q.get(field) or ""
        original = text
        # "UNI, Manulife... in production." at sentence end
        text = re.sub(
            r'\bUNI,?\s+Manulife[^.]{0,80}in production\.',
            'Manulife runs this in production across multiple program deployments.',
            text
        )
        # "Manulife and UNI... in production." at sentence end
        text = re.sub(
            r'\bManulife\s+and\s+UNI\b[^.]{0,80}in production\.',
            'Manulife runs this in production across multiple program deployments.',
            text
        )
        if text != original:
            q[field] = text
            uni_removed += 1
            if q["ref"] not in updated:
                updated.append(q["ref"])

print(f"Redundant UNI proof-point endings removed: {uni_removed} fields")


# ── SAVE ─────────────────────────────────────────────────────────────────────
print(f"\nTotal questions updated: {len(updated)}")
for ref in sorted(updated):
    print(f"  {ref}")

with open("public/rfp_data.json", "w", encoding="utf-8") as f:
    json.dump(data, f, indent=2, ensure_ascii=False)

with open("public/rfp_data.json", encoding="utf-8") as f:
    json.load(f)
print("\nJSON valid ✓")

# ── QA spot-checks ────────────────────────────────────────────────────────────
print("\n=== SPOT CHECK ===")
checks = [
    ("Partner Relationships 1", "paragraph", "ROI models"),
    ("Technology 6", "paragraph", "purpose-built"),
    ("Technology 6", "bullet", "purpose-built"),
    ("Activation and Fulfillment 1", "paragraph", "full card lifecycle"),
    ("Processing 18", "bullet", "Reg E"),
    ("Partner Relationships 1", "bullet", "i2c's model is one-to-one"),
    ("Acquisition and Lifecycle Marketing 4", "paragraph", "branch interaction.\""),
]
for ref, field, needle in checks:
    q = qs.get(ref)
    text = (q.get(field) or "") if q else ""
    found = needle in text
    status = "✓" if found else "✗ MISSING"
    print(f"  {status}  [{ref}][{field}]: '{needle[:50]}'")
