#!/usr/bin/env python3
"""Final humanize pass: replace 20 remaining AI phrases in RFP responses."""

import json
import re
import os

DATA_PATH = os.path.join(os.path.dirname(__file__), "..", "public", "rfp_data.json")

# Phrase replacements (case-insensitive, only in bullet/paragraph fields)
REPLACEMENTS = [
    ("aligns with", "supports"),
    ("tailored to", "built for"),
    ("ensuring that", "so that"),
    ("designed to", "built to"),
    # Context-aware: only replace standalone "enhance" as verb, not "enhanced"
    (r"\benhance\b(?!d|s|ment)", "improve"),
    (r"\boptimize\b(?!d|s)", "improve"),
    # Additional passive voice patterns
    ("is configured to", "can"),
    ("is enabled to", "can"),
    ("are configured to", "can"),
]

FIELDS = ["bullet", "paragraph"]


def main():
    with open(DATA_PATH) as f:
        data = json.load(f)

    changes = []
    for q in data["questions"]:
        for field in FIELDS:
            original = q.get(field, "")
            if not original:
                continue
            text = original
            for pattern, replacement in REPLACEMENTS:
                if pattern.startswith(r"\b"):
                    new_text = re.sub(pattern, replacement, text, flags=re.IGNORECASE)
                else:
                    new_text = re.sub(
                        re.escape(pattern), replacement, text, flags=re.IGNORECASE
                    )
                if new_text != text:
                    changes.append(
                        {
                            "ref": q["ref"],
                            "field": field,
                            "pattern": pattern,
                            "replacement": replacement,
                        }
                    )
                    text = new_text
            if text != original:
                q[field] = text

    with open(DATA_PATH, "w") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

    print(f"Made {len(changes)} replacements across {len(set(c['ref'] for c in changes))} questions:\n")
    for c in changes:
        print(f"  {c['ref']} [{c['field']}]: '{c['pattern']}' → '{c['replacement']}'")

    print(f"\nTotal: {len(changes)} changes")


if __name__ == "__main__":
    main()
