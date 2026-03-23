#!/usr/bin/env python3
"""
QA FIXES — Post-hallucination audit cleanup
============================================
1. Replace "8 FI programs" with "numerous FI programs"
2. Fix broken/orphaned sentences from previous Coast Capital / Continental removals
3. Fix committee_review "Continental" proof point templates
4. Fix placeholder business names (ABC Family Restaurant, XYZ Local Hardware)
5. Clean up any remaining orphaned punctuation

Source: Claude Code (AI agent)
"""

import json
import re

with open('/Users/tarique/rfp-viewer/public/rfp_data.json', 'r') as f:
    data = json.load(f)

questions = data['questions']
changes = []

for q in questions:
    ref = q['ref']
    modified = False

    for field in ['bullet', 'paragraph', 'rationale', 'committee_review', 'notes', 'strategic']:
        text = q.get(field, '')
        if not text:
            continue
        original = text

        # 1. Replace "8 FI programs" variants
        text = re.sub(r"Brim'?s 8 FI programs", "Brim's numerous FI programs", text)
        text = re.sub(r"8 FI programs", "numerous FI programs", text)
        text = re.sub(r"all 8 FI programs", "all FI programs", text)
        text = re.sub(r"across 8 programs", "across numerous programs", text)
        text = re.sub(r"8 financial institutions in the last 18 months", "multiple financial institutions", text)

        # 2. Fix orphaned sentences from removals
        # "tied to. The" -> "tied to the"
        text = text.replace('tied to. The authorized', 'tied to the authorized')
        # "(with. The" -> "(with the"
        text = text.replace('(with. The ability', '(with the ability')
        # "with. Notification" -> "with notification"
        text = text.replace('with. Notification', 'with notification')
        # "with. BSB's" -> "with BSB's"
        text = text.replace("with. BSB's", "with BSB's")
        # "with. SSO" -> "with SSO"
        text = text.replace("with. SSO", "with SSO")
        # "app or. This" -> "app. This"
        text = text.replace('app or. This', 'app. This')
        # "to. And the" -> "to, and the"
        text = text.replace('to. And the platform', 'to, and the platform')
        # "Complex or. High" -> "Complex or high"
        text = text.replace('Complex or. High', 'Complex or high')
        # "earn. And hybrid" -> "earn and hybrid"
        text = text.replace('earn. And hybrid', 'earn and hybrid')
        # space before period
        text = re.sub(r'\s+\.(\s)', r'.\1', text)
        # "rewards . Loyalty" -> "rewards. Loyalty"
        text = text.replace('rewards . ', 'rewards. ')

        # 3. Fix committee_review "Continental" proof point
        # Replace template suggestions mentioning Continental
        text = text.replace(', or Continental as proof points', ' as proof points')
        text = text.replace(', Continental, or' , ', or')
        text = text.replace('Continental, ', '')
        text = text.replace(', Continental', '')
        # But keep "Continental Bank" references (Zolve's US sponsor) — only remove standalone
        # The above patterns should only hit the template text

        # 4. Fix placeholder business names
        text = text.replace('ABC Family Restaurant', 'a local restaurant')
        text = text.replace('XYZ Local Hardware', 'a local retailer')

        # 5. General cleanup
        # Double spaces
        text = re.sub(r'  +', ' ', text)
        # Comma comma
        text = re.sub(r',\s*,', ',', text)
        # Period period
        text = re.sub(r'\.\s*\.', '.', text)
        # "and." at end of sentence
        text = re.sub(r'\band\s*\.', '.', text)
        # ", and," -> ", and"  or "and ,"  -> "and"
        text = re.sub(r',\s*and\s*,', ', and', text)
        # Orphaned "and" before period
        text = re.sub(r'\s+and\s*\.\s', '. ', text)
        # Leading space
        text = text.strip()

        if text != original:
            q[field] = text
            modified = True

    if modified:
        changes.append(ref)

# Save
with open('/Users/tarique/rfp-viewer/public/rfp_data.json', 'w') as f:
    json.dump(data, f, indent=2)

# Deduplicate
unique_changes = list(dict.fromkeys(changes))

print("=== QA FIXES APPLIED ===")
print(f"Questions modified: {len(unique_changes)}")
for c in unique_changes:
    print(f"  {c}")

# Verify
remaining_8fi = 0
remaining_continental_template = 0
remaining_abc = 0
remaining_orphan = 0

for q in questions:
    for field in ['bullet', 'paragraph', 'rationale', 'committee_review', 'notes', 'strategic']:
        text = q.get(field, '') or ''
        if '8 FI programs' in text:
            remaining_8fi += 1
        if 'Continental as proof' in text:
            remaining_continental_template += 1
        if 'ABC Family' in text or 'XYZ Local' in text:
            remaining_abc += 1
        if re.search(r'with\.\s+[A-Z]', text) or re.search(r'or\.\s+[A-Z]', text):
            remaining_orphan += 1

print(f"\nRemaining '8 FI programs': {remaining_8fi}")
print(f"Remaining 'Continental as proof': {remaining_continental_template}")
print(f"Remaining 'ABC/XYZ': {remaining_abc}")
print(f"Remaining orphaned sentences (with./or.): {remaining_orphan}")
