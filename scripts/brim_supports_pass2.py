"""
Pass 2: Convert remaining 'Brim supports' vendor-centric voice to enabler framing.

Strategy:
- "Brim supports BSB's X"  → "Brim enables BSB's X"  (BSB already owns it)
- "Brim supports both X"   → "Brim gives BSB flexibility across both X"
- "Brim supports [noun]"   → "Brim gives BSB [noun]"  (default, works for most noun-phrase complements)
"""

import json
import re

with open("public/rfp_data.json", encoding="utf-8") as f:
    data = json.load(f)

# ── Specific overrides (awkward cases where generic replacement sounds off) ──

specific = [
    # BSB-possessive: "Brim supports BSB's X" → "Brim enables BSB's X"
    ("Brim supports BSB's partner acquisition", "Brim enables BSB's partner acquisition"),
    ("Brim supports BSB's pipeline", "Brim enables BSB's pipeline"),
    ("Brim supports BSB's TPRM obligations", "Brim handles BSB's TPRM obligations"),
    # "Brim supports both [scenarios]" → "Brim gives BSB support for both…"
    ("Brim supports both scenarios BSB will encounter", "Brim gives BSB support for both scenarios it will encounter"),
    ("Brim supports both BSB-owned ICAs", "Brim gives BSB support for both BSB-owned ICAs"),
    ("Brim supports both scheduled and event-triggered lifecycle communications",
     "Brim gives BSB both scheduled and event-triggered lifecycle communications"),
    ("Brim supports both automated and manual re-aging",
     "Brim gives BSB both automated and manual re-aging"),
    # "Brim supports NCUA-specific requirements" (NCUA is a noun, reads oddly as "gives BSB NCUA")
    ("Brim supports NCUA-specific requirements",
     "Brim gives BSB NCUA-specific requirement coverage"),
    ("Brim supports federal credit union regulatory requirements",
     "Brim gives BSB federal credit union regulatory compliance"),
    ("Brim supports federal credit unions through",
     "Brim enables BSB to serve federal credit unions through"),
    # "Brim supports deconversion when" — event-triggered verb phrase
    ("Brim supports deconversion when a partner FI decides",
     "Brim enables BSB to manage deconversion when a partner FI decides"),
    # "Brim supports the same integration pattern"
    ("Brim supports the same integration pattern",
     "Brim gives BSB the same integration pattern"),
    # "Brim supports the right-of-offset workflow"
    ("Brim supports the right-of-offset workflow",
     "Brim gives BSB the right-of-offset workflow"),
    # "Brim supports product roadmap discussions"
    ("Brim supports product roadmap discussions",
     "Brim gives BSB access to product roadmap discussions"),
]

# ── Generic pass: remaining "Brim supports " → "Brim gives BSB " ──
# Applied AFTER specific overrides to avoid double-replacement.

updated_fields = 0

for q in data["questions"]:
    for field in ["paragraph", "bullet"]:
        text = q.get(field, "")
        if not text:
            continue
        original = text

        # Apply specific overrides first
        for old, new in specific:
            text = text.replace(old, new)

        # Generic: "Brim supports " (any case not caught above)
        # Excludes "Brim supports BSB's" (already handled or intentionally kept)
        text = re.sub(r'\bBrim supports (?!BSB\'s)', 'Brim gives BSB ', text)

        # "Brim supports:" → "Brim gives BSB:"  (bare colon construct)
        text = text.replace("Brim supports:", "Brim gives BSB:")

        if text != original:
            q[field] = text
            updated_fields += 1

print(f"Fields updated: {updated_fields}")

# ── Verify no "Brim supports" remain (except "Brim supports BSB's" which is acceptable) ──
remaining = []
for q in data["questions"]:
    for field in ["paragraph", "bullet"]:
        text = q.get(field, "")
        for m in re.finditer(r'Brim supports(?! BSB\'s)', text):
            remaining.append(f"{q['ref']} [{field}]: ...{text[max(0,m.start()-10):m.start()+60]}...")

print(f"\nRemaining 'Brim supports' (non-BSB): {len(remaining)}")
for r in remaining[:15]:
    print(" ", r)

# Save
with open("public/rfp_data.json", "w", encoding="utf-8") as f:
    json.dump(data, f, indent=2, ensure_ascii=False)

# Verify JSON valid
with open("public/rfp_data.json", encoding="utf-8") as f:
    verify = json.load(f)
print(f"\nJSON valid ✓  ({len(verify['questions'])} questions)")
