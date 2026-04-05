"""
Replace specific client count language with high-level portfolio descriptors.
Named clients (MANULIFE, AFFINITY, ZOLVE, etc.) are kept as proof points.
Only generic count/list language is replaced.
"""

import json, re

with open("public/rfp_data.json", encoding="utf-8") as f:
    data = json.load(f)

# Ordered replacements — most specific first
replacements = [
    # "all 8 live" variants
    ("all 8 live FI programs", "programs across regulated banks, credit unions, fintechs, and global brands"),
    ("all 8 live programs", "programs across regulated banks, credit unions, fintechs, and global brands"),
    ("all 8 FI programs", "programs across regulated banks, credit unions, fintechs, and global brands"),
    ("All 8 live", "Programs across regulated banks, credit unions, fintechs, and global brands"),

    # "numerous FI programs"
    ("across numerous FI programs", "across regulated banks, credit unions, fintechs, and global brands"),
    ("numerous FI programs including MANULIFE BANK and AFFINITY CREDIT UNION",
     "programs across regulated banks, credit unions, fintechs, and global brands — including MANULIFE BANK and AFFINITY CREDIT UNION"),
    ("every Brim-powered program including MANULIFE BANK and AFFINITY CREDIT UNION",
     "programs across regulated banks, credit unions, fintechs, and global brands — including MANULIFE BANK and AFFINITY CREDIT UNION"),
    ("Brim's live programs — MANULIFE BANK, AFFINITY CREDIT UNION, ZOLVE, and others",
     "Brim's live programs across regulated banks, credit unions, fintechs, and global brands"),
    ("MANULIFE BANK, AFFINITY CREDIT UNION, ZOLVE, and other live programs on the platform",
     "regulated banks, credit unions, fintechs, and global brands on the platform — including MANULIFE BANK, AFFINITY CREDIT UNION, and ZOLVE"),
    ("every live program including MANULIFE BANK and AFFINITY CREDIT UNION",
     "programs across regulated banks, credit unions, fintechs, and global brands — including MANULIFE BANK and AFFINITY CREDIT UNION"),
    ("Brim's live portfolio including MANULIFE BANK, AFFINITY CREDIT UNION, and ZOLVE",
     "Brim's live portfolio across regulated banks, credit unions, fintechs, and global brands"),
    ("every production program including MANULIFE BANK and AFFINITY CREDIT UNION",
     "programs across regulated banks, credit unions, fintechs, and global brands — including MANULIFE BANK and AFFINITY CREDIT UNION"),
    ("Brim's live programs: MANULIFE BANK, AFFINITY CREDIT UNION, ZOLVE, and PAYFACTO",
     "Brim's live programs — regulated banks, credit unions, fintechs, and global brands"),
    ("MANULIFE BANK, AFFINITY CREDIT UNION, and every other live Brim program",
     "MANULIFE BANK, AFFINITY CREDIT UNION, and other programs across regulated banks, fintechs, and global brands"),

    # "all Brim partner programs" / "all partner programs"
    ("all Brim partner programs", "programs across regulated banks, credit unions, fintechs, and global brands"),
    ("all partner programs", "programs across regulated banks, credit unions, fintechs, and global brands"),
    ("all Brim programs", "programs across regulated banks, credit unions, fintechs, and global brands"),
    ("all live Brim programs", "Brim's live programs across regulated banks, credit unions, fintechs, and global brands"),

    # "every Brim" / "every live"
    ("every Brim-powered program", "programs across regulated banks, credit unions, fintechs, and global brands"),
    ("every Brim partner program", "programs across regulated banks, credit unions, fintechs, and global brands"),
    ("every live Brim program", "Brim's programs across regulated banks, credit unions, fintechs, and global brands"),
    ("every live program", "programs across regulated banks, credit unions, fintechs, and global brands"),
    ("every production program", "programs across regulated banks, credit unions, fintechs, and global brands"),
    ("across all live programs", "across regulated banks, credit unions, fintechs, and global brands"),

    # "Live across" / "Running live across" / "In production across" boilerplate closings
    ("Live across MANULIFE BANK, AFFINITY CREDIT UNION, and CONTINENTAL BANK.",
     "In production at MANULIFE BANK, AFFINITY CREDIT UNION, and CONTINENTAL BANK."),
    ("MANULIFE BANK, AFFINITY CREDIT UNION, and ZOLVE run this in production today.",
     "MANULIFE BANK, AFFINITY CREDIT UNION, and ZOLVE run this in production today."),  # keep
    ("Running live across MANULIFE BANK, AFFINITY CREDIT UNION, ZOLVE, and PAYFACTO",
     "In production at MANULIFE BANK, AFFINITY CREDIT UNION, ZOLVE, and PAYFACTO"),
    ("Live at MANULIFE BANK, AFFINITY CREDIT UNION, and ZOLVE.",
     "In production at MANULIFE BANK, AFFINITY CREDIT UNION, and ZOLVE."),
    ("Live today at MANULIFE BANK and AFFINITY CREDIT UNION, with PAYFACTO and ZOLVE on the same platform.",
     "MANULIFE BANK and AFFINITY CREDIT UNION run this today; PAYFACTO and ZOLVE on the same platform."),
    ("In production across MANULIFE BANK, AFFINITY CREDIT UNION, and CONTINENTAL BANK.",
     "In production at MANULIFE BANK, AFFINITY CREDIT UNION, and CONTINENTAL BANK."),
    ("Live across MANULIFE BANK, AFFINITY CREDIT UNION, and ZOLVE/CONTINENTAL BANK",
     "In production at MANULIFE BANK, AFFINITY CREDIT UNION, and ZOLVE/CONTINENTAL BANK"),

    # Remaining "all live" in Processing 26
    ("across all live programs", "across regulated banks, credit unions, fintechs, and global brands"),

    # "all live" standalone
    ("all live programs", "programs across regulated banks, credit unions, fintechs, and global brands"),
    ("All live programs", "Programs across regulated banks, credit unions, fintechs, and global brands"),

    # Product Operations 45 bullet
    ("All 8 live FI programs are credit.", "Every live program in the portfolio is credit."),
    ("All live FI programs are credit.", "Every live program in the portfolio is credit."),
]

count = 0
for q in data["questions"]:
    for field in ["bullet", "paragraph"]:
        text = q.get(field, "")
        if not text:
            continue
        original = text
        for old, new in replacements:
            text = text.replace(old, new)
        if text != original:
            q[field] = text
            count += 1

with open("public/rfp_data.json", "w", encoding="utf-8") as f:
    json.dump(data, f, indent=2, ensure_ascii=False)

# Verify
with open("public/rfp_data.json", encoding="utf-8") as f:
    verify = json.load(f)

print(f"JSON valid. Fields updated: {count}")

# Check for remaining count language
remaining = []
check_patterns = ["all 8", "8 live", "8 FI", "numerous FI", "all Brim", "every Brim", "all partner program", "all live program"]
for q in verify["questions"]:
    for p in check_patterns:
        if p.lower() in (q.get("paragraph","") + q.get("bullet","")).lower():
            remaining.append(f"{q['ref']}: '{p}'")

print(f"Remaining count language: {len(remaining)}")
for r in remaining:
    print(" ", r)
