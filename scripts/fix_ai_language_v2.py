#!/usr/bin/env python3
"""Fix remaining AI language: ecosystem + passive voice patterns."""
import json, re

DATA_FILE = "public/rfp_data.json"
changes = []

def fix_text(text, ref, field):
    if not text:
        return text
    original = text

    # ecosystem → platform/network (context-aware)
    text = re.sub(r'\becosystem\b', 'platform', text)
    text = re.sub(r'\bEcosystem\b', 'Platform', text)
    text = re.sub(r'\becosystems\b', 'platforms', text)

    # Passive voice — match with or without trailing preposition
    # "is supported by X" → "X supports" is hard to automate, so we do simpler rewrites
    text = re.sub(r' is designed to ', ' ', text)
    text = re.sub(r' Is designed to ', ' ', text)
    text = re.sub(r' is configured to ', ' can ', text)
    text = re.sub(r' are configured to ', ' can ', text)
    text = re.sub(r' is enabled via ', ' uses ', text)
    text = re.sub(r' is enabled through ', ' uses ', text)
    text = re.sub(r' is enabled by ', ' uses ', text)
    text = re.sub(r' is enabled for ', ' supports ', text)
    text = re.sub(r' is provided via ', ' comes via ', text)
    text = re.sub(r' is provided through ', ' comes through ', text)
    text = re.sub(r' is provided by ', ' comes from ', text)
    text = re.sub(r' is provided to ', ' goes to ', text)
    text = re.sub(r' are provided via ', ' come via ', text)
    text = re.sub(r' are provided through ', ' come through ', text)
    text = re.sub(r' are provided by ', ' come from ', text)
    text = re.sub(r' are provided to ', ' go to ', text)
    text = re.sub(r' is supported via ', ' runs via ', text)
    text = re.sub(r' is supported through ', ' runs through ', text)
    text = re.sub(r' is supported by ', ' runs on ', text)
    text = re.sub(r' is supported for ', ' covers ', text)
    text = re.sub(r' is integrated with ', ' integrates with ', text)
    text = re.sub(r' is integrated into ', ' fits into ', text)
    text = re.sub(r' is managed by ', ' runs under ', text)
    text = re.sub(r' is managed through ', ' runs through ', text)
    text = re.sub(r' is managed via ', ' runs via ', text)
    text = re.sub(r' is maintained by ', ' stays with ', text)
    text = re.sub(r' is maintained through ', ' continues through ', text)
    text = re.sub(r' is processed by ', ' runs through ', text)
    text = re.sub(r' is processed via ', ' runs via ', text)
    text = re.sub(r' is processed through ', ' runs through ', text)

    # Remaining passive without preposition — harder, do minimal
    # "X is supported" at end of sentence → "X works"
    text = re.sub(r' is supported\.', ' works.', text)
    text = re.sub(r' is supported,', ' works,', text)
    text = re.sub(r' is provided\.', ' exists.', text)
    text = re.sub(r' are configured\.', ' work.', text)
    text = re.sub(r' is managed\.', ' runs.', text)
    text = re.sub(r' is maintained\.', ' continues.', text)
    text = re.sub(r' is processed\.', ' runs.', text)
    text = re.sub(r' is integrated\.', ' connects.', text)
    text = re.sub(r' is enabled\.', ' works.', text)

    # "is supported in" → "works in"
    text = re.sub(r' is supported in ', ' works in ', text)
    text = re.sub(r' is supported across ', ' works across ', text)
    text = re.sub(r' is supported on ', ' works on ', text)
    text = re.sub(r' are configured in ', ' work in ', text)
    text = re.sub(r' are configured for ', ' work for ', text)
    text = re.sub(r' is managed in ', ' runs in ', text)
    text = re.sub(r' is provided in ', ' exists in ', text)
    text = re.sub(r' are provided in ', ' exist in ', text)
    text = re.sub(r' is maintained in ', ' stays in ', text)

    # Clean up
    text = re.sub(r'  +', ' ', text)

    if text != original:
        changes.append((ref, field))

    return text

with open(DATA_FILE) as f:
    root = json.load(f)

for q in root['questions']:
    ref = f"{q.get('category', '?')} {q.get('number', '?')}"
    for field in ['bullet', 'paragraph']:
        val = q.get(field, '')
        if val:
            q[field] = fix_text(val, ref, field)

print(f"Fixed {len(changes)} fields across {len(set(r for r,_ in changes))} questions")
for ref, field in changes:
    print(f"  [{ref}] {field}")

with open(DATA_FILE, 'w') as f:
    json.dump(root, f, indent=2)
print(f"\nSaved to {DATA_FILE}")
