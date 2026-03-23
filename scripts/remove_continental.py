#!/usr/bin/env python3
"""
Remove all "Continental Currency Exchange" and "Continental Currency"
references from rfp_data.json and clean up surrounding punctuation.
"""

import json
import re
import sys

FILE = "/Users/tarique/rfp-viewer/public/rfp_data.json"
TEXT_FIELDS = [
    "bullet", "paragraph", "rationale", "committee_review",
    "notes", "strategic",
]

# Ordered from most specific to least specific
PATTERNS = [
    # "X, Continental Currency Exchange, Y" → "X, Y"
    (r",\s*Continental Currency Exchange\s*,", ","),
    # "X, Continental Currency Exchange and Y" → "X and Y"
    (r",\s*Continental Currency Exchange\s+and\b", " and"),
    # "X and Continental Currency Exchange, Y" → "X, Y"
    (r"\s+and\s+Continental Currency Exchange\s*,", ","),
    # "X and Continental Currency Exchange" (end) → "X"
    (r"\s+and\s+Continental Currency Exchange\b", ""),
    # "Continental Currency Exchange, X" (start of list) → "X"
    (r"Continental Currency Exchange,\s*", ""),
    # "Continental Currency Exchange and X" → "X"
    (r"Continental Currency Exchange\s+and\s+", ""),
    # standalone
    (r"Continental Currency Exchange", ""),

    # Same patterns for "Continental Currency" (without "Exchange")
    (r",\s*Continental Currency\s*,", ","),
    (r",\s*Continental Currency\s+and\b", " and"),
    (r"\s+and\s+Continental Currency\s*,", ","),
    (r"\s+and\s+Continental Currency\b", ""),
    (r"Continental Currency,\s*", ""),
    (r"Continental Currency\s+and\s+", ""),
    (r"Continental Currency", ""),
]

CLEANUP = [
    # double commas → single comma
    (r",\s*,", ","),
    # orphaned "and." at end of sentence → "."
    (r"\band\s*\.", "."),
    # trailing comma before period → period
    (r",\s*\.", "."),
    # double+ spaces → single space
    (r"  +", " "),
    # space before comma
    (r"\s+,", ","),
    # leading/trailing whitespace on lines
    (r"(?m)^[ \t]+", ""),
    (r"(?m)[ \t]+$", ""),
]


def clean_text(text: str) -> str:
    for pattern, replacement in PATTERNS:
        text = re.sub(pattern, replacement, text)
    for pattern, replacement in CLEANUP:
        text = re.sub(pattern, replacement, text)
    return text


def main():
    with open(FILE, "r", encoding="utf-8") as f:
        data = json.load(f)

    modified_refs = []

    for q in data["questions"]:
        changed = False
        for field in TEXT_FIELDS:
            original = q.get(field, "")
            if not original:
                continue
            cleaned = clean_text(original)
            if cleaned != original:
                q[field] = cleaned
                changed = True
                print(f"  MODIFIED  {q['ref']:40s}  field={field}")
        if changed and q["ref"] not in modified_refs:
            modified_refs.append(q["ref"])

    # Save
    with open(FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
        f.write("\n")

    print(f"\n{'='*60}")
    print(f"Modified {len(modified_refs)} question(s):")
    for ref in modified_refs:
        print(f"  - {ref}")

    # Verify zero remaining references
    with open(FILE, "r", encoding="utf-8") as f:
        content = f.read()
    remaining = len(re.findall(r"Continental Currency", content))
    print(f"\nRemaining 'Continental Currency' references: {remaining}")
    if remaining > 0:
        print("ERROR: references still remain!", file=sys.stderr)
        sys.exit(1)
    else:
        print("SUCCESS: all references removed.")


if __name__ == "__main__":
    main()
