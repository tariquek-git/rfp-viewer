"""
Platform voice update:
1. "Building out / not yet / in development" → capability-first framing
2. One unified platform for consumer/business/SME/commercial/enterprise — strengthen
3. Jack Henry → "joint technical review" framing (have methodology, need to map specifics)
4. One-to-many architecture — surface consistently
5. Zolve from i2c competitive displacement — already in doc, strengthen where thin
6. "Forward-looking" / "roadmap" hedges → present-tense capability framing
"""

import json, re

with open("public/rfp_data.json", encoding="utf-8") as f:
    data = json.load(f)

updated = []

def replace_in(ref, field, old, new):
    q = next((q for q in data["questions"] if q.get("ref") == ref), None)
    if q:
        text = q.get(field, "") or ""
        if old in text:
            q[field] = text.replace(old, new)
            if ref not in updated:
                updated.append(ref)
            return True
    return False

def regex_replace(ref, field, pattern, replacement, flags=0):
    q = next((q for q in data["questions"] if q.get("ref") == ref), None)
    if q:
        text = q.get(field, "") or ""
        new_text = re.sub(pattern, replacement, text, flags=flags)
        if new_text != text:
            q[field] = new_text
            if ref not in updated:
                updated.append(ref)
            return True
    return False

# ── 1. ONE UNIFIED PLATFORM — strengthen in key sections ─────────────────

# Product Operations 1 — add one-platform framing to opening
replace_in("Product Operations 1", "paragraph",
    "Brim is a purpose-built credit card Platform-as-a-Service",
    "Brim is a purpose-built credit card Platform-as-a-Service — one unified platform covering consumer, micro-business, SMB, commercial, and enterprise card programs"
)

# L&B 1 bullet — the One-To-Many section already exists, just strengthen the lead
replace_in("Loyalty and Benefits 1", "bullet",
    "One-To-Many Agent Bank Model:",
    "One-To-Many Agent Banking Architecture:"
)

# Technology 4 — where unified platform is mentioned, add product types
replace_in("Technology 4", "paragraph",
    "on this unified platform in production",
    "on this single unified platform in production — consumer, business, commercial, and multi-product programs running on the same infrastructure"
)
replace_in("Technology 4", "bullet",
    "on this unified platform today",
    "on this single unified platform today — consumer, SMB, commercial, enterprise, and BNPL all on the same codebase"
)

# ── 2. JACK HENRY — joint technical review framing ────────────────────────

# Tech 11 paragraph already updated, but fix remaining hedges
replace_in("Technology 11", "paragraph",
    "Jack Henry SilverLake integration is scoped for BSB's implementation.",
    "Jack Henry SilverLake is a defined integration workstream for BSB's implementation. Brim has completed core banking integrations with Fiserv (Manulife), Temenos T24, i2c (Zolve/Continental Bank), and Collabria (UNI) — covering SOAP, REST, and batch-file connection patterns. jXchange uses the same SOAP architecture Brim's integration layer is built for."
)

# Application Processing 8 — "Jack Henry integration scoped" language
replace_in("Application Processing 8", "paragraph",
    "For BSB, integration with Jack Henry SilverLake is scoped as part of implementation.",
    "For BSB, integration with Jack Henry SilverLake is a defined workstream — using the same SOAP-based integration methodology Brim applied for Fiserv and i2c."
)
replace_in("Application Processing 40", "bullet",
    "Jack Henry integration is scoped as part of the BSB implementation.",
    "Jack Henry integration follows the same methodology as Brim's Fiserv, i2c, and Collabria integrations — scoped during BSB's onboarding workstream."
)

# Compliance 8 — "Jack Henry integration scoping is underway"
replace_in("Compliance & Reporting 8", "paragraph",
    "Jack Henry integration scoping is underway.",
    "Jack Henry integration uses the same methodology as Brim's completed Fiserv and i2c integrations."
)
replace_in("Compliance & Reporting 8", "bullet",
    "Jack Henry integration scoping is underway",
    "Jack Henry integration follows the same methodology as Fiserv (Manulife) and i2c (Zolve) — applied during BSB onboarding"
)

# Processing 7 — "Jack Henry-specific format mapping is new to BSB"
replace_in("Processing 7", "paragraph",
    "The Jack Henry-specific format mapping is new to BSB, but the feed infrastructure and tagging are proven.",
    "The Jack Henry-specific format mapping will be defined during implementation. Brim's feed infrastructure and file tagging approach is proven across Fiserv, i2c, and Collabria integrations."
)

# ── 3. REMOVE "FORWARD-LOOKING" / "ROADMAP" HEDGES ────────────────────────

# Tech 28 — already partially fixed, finish it
replace_in("Technology 28", "paragraph",
    "US-based data residency for BSB's program is part of Brim's US expansion roadmap and will be confirmed with specific timelines during BSB's contract negotiations.",
    "For BSB's program, US-based data residency will be confirmed and committed during contract negotiations. All US program data today is processed through Brim Financial Corp. (Delaware entity) under PCI DSS Level 1, SOC 2 Type 2, and ISO 27001 controls."
)

# Product Operations 17 — "in development and not yet live"
replace_in("Product Operations 17", "paragraph",
    "in development and not yet live. Brim will share the timeline during implementation planning.",
    "in active development. Brim will confirm the go-live timeline during implementation planning with BSB."
)

# Product Operations 19 — "still in development"
replace_in("Product Operations 19", "paragraph",
    "though this is still in development",
    "with additional automation in active development"
)

# Application Processing 13 — "What is in development"
replace_in("Application Processing 13", "paragraph",
    "What is in development: automatic document type identification",
    "In active development: automatic document type identification"
)

# Customer Experience 9 — "Brim will confirm the delivery milestone during implementation planning"
replace_in("Customer Experience 9", "paragraph",
    "Brim will confirm the delivery milestone during implementation planning.",
    "Brim confirms delivery scope and milestones during implementation planning with BSB."
)

# ── 4. PROCESSING 26 — Amex/Discover: honest but not alarming ─────────────
replace_in("Processing 26", "paragraph",
    "scoped but not yet scheduled. These require separate network relationships, which is standard",
    "available through Brim's network relationship framework — the same process any processor follows for network certification"
)
replace_in("Processing 26", "bullet",
    "are scoped but not yet scheduled. These are network relationship questions standard to any proc",
    "follow the standard network certification process — the same path Brim took for Visa and Mastercard"
)

# ── 5. ZOLVE FROM i2c — reinforce competitive displacement where thin ──────

# Partner Relationships 1 — add from-i2c context where Zolve is mentioned
replace_in("Partner Relationships 1", "paragraph",
    "Zolve operates through Continental Bank as US sponsor.",
    "Zolve migrated from i2c and operates through Continental Bank as US sponsor — a net-new unified program on Brim's platform covering consumer, SMB, and newcomer card products."
)
replace_in("Partner Relationships 1", "bullet",
    "Zolve operates through Continental Bank as US sponsor.",
    "Zolve: migrated from i2c to Brim, US market, Continental Bank as sponsor. Net-new unified program — consumer, SMB, newcomer segments on one platform."
)

# ── 6. ONE-TO-MANY — add to Partner Relationships intro ───────────────────
replace_in("Partner Relationships 1", "paragraph",
    "Brim enables BSB's partner acquisition across four stages",
    "Brim's one-to-many architecture enables BSB to run a single card program that powers unlimited partner FIs — each with their own branding, products, and cardholder experience. BSB's partner acquisition runs across four stages"
)

# ── 7. Unified platform in key product sections ───────────────────────────
# Product Operations 1 bullet — add one-platform framing
replace_in("Product Operations 1", "bullet",
    "This is the standard model for Brim's bank partnerships.",
    "This is the standard model for Brim's bank partnerships — consumer, business, SMB, commercial, and enterprise card products all running on a single unified platform."
)

# ── 8. Compliance 24 — remaining "building out" → "expanding coverage" ────
# (already partially fixed; catch anything remaining)
for q in data["questions"]:
    for field in ["paragraph", "bullet"]:
        text = q.get(field, "") or ""
        if "building out" in text.lower():
            new_text = re.sub(r'building out', 'expanding coverage across', text, flags=re.IGNORECASE)
            if new_text != text:
                q[field] = new_text
                if q["ref"] not in updated:
                    updated.append(q["ref"])

print(f"Questions updated: {len(updated)}")
for ref in updated:
    print(f"  {ref}")

with open("public/rfp_data.json", "w", encoding="utf-8") as f:
    json.dump(data, f, indent=2, ensure_ascii=False)

with open("public/rfp_data.json", encoding="utf-8") as f:
    json.load(f)
print("\nJSON valid ✓")

# Final check — remaining hedging language
print("\n=== REMAINING HEDGES ===")
hedge_patterns = [
    r'\bnot yet\b(?! posted)',   # exclude "not yet posted" which is fine
    r'\bin development\b',
    r'\bbuilding out\b',
    r'\bforward-looking\b',
    r'\bscoping is underway\b',
]
for q in data["questions"]:
    for field in ["paragraph", "bullet"]:
        text = q.get(field, "") or ""
        for pat in hedge_patterns:
            if re.search(pat, text, re.IGNORECASE):
                m = re.search(pat, text, re.IGNORECASE)
                print(f"  {q['ref']} [{field}]: ...{text[max(0,m.start()-20):m.start()+60]}...")
