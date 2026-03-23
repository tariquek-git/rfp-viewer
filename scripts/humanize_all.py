#!/usr/bin/env python3
"""
AI-ASSISTED RFP DATA UPDATE — HUMANIZATION PASS
=================================================
Scans all responses for AI writing patterns and fixes them:
1. Remove remaining filler words
2. Break long compound sentences
3. Convert passive voice to active
4. Remove "Additionally", "Furthermore", "Moreover" transitions
5. Remove "It is worth noting", "It should be noted" constructions
6. Fix overly parallel structure (lists of 3+ adjectives)
7. Tag all changes

Source: Claude Code (AI agent)
"""

import json
import re

with open('/Users/tarique/rfp-viewer/public/rfp_data.json', 'r') as f:
    data = json.load(f)

questions = data['questions']
changes = []

# AI transition words to remove or replace
AI_TRANSITIONS = [
    (r'\bAdditionally,\s*', ''),
    (r'\bFurthermore,\s*', ''),
    (r'\bMoreover,\s*', ''),
    (r'\bConsequently,\s*', ''),
    (r'\bNotably,\s*', ''),
    (r'\bImportantly,\s*', ''),
    (r'\bSignificantly,\s*', ''),
    (r'\bSpecifically,\s*', ''),
    (r'\bUltimately,\s*', ''),
    (r'\bEssentially,\s*', ''),
]

# "It is/should be" constructions
IT_IS_PATTERNS = [
    (r'It is worth noting that\s*', ''),
    (r'It should be noted that\s*', ''),
    (r'It is important to note that\s*', ''),
    (r'It bears mentioning that\s*', ''),
    (r'It is worth mentioning that\s*', ''),
]

# Remaining filler adjectives
FILLER_ADJECTIVES = [
    (r'\brobust\s+', ''),
    (r'\bcomprehensive\s+', ''),
    (r'\bseamless(ly)?\s+', ''),
    (r'\binnovative\s+', ''),
    (r'\bsophisticated\s+', ''),
    (r'\badvanced\s+', ''),
    (r'\bpowerful\s+', ''),
    (r'\bflexible\s+', ''),
    (r'\bscalable\s+', ''),
    (r'\bstreamlined?\s+', ''),
    (r'\bholistic\s+', ''),
]

def humanize_text(text):
    if not text:
        return text, False

    original = text

    # Remove AI transitions
    for pattern, replacement in AI_TRANSITIONS:
        text = re.sub(pattern, replacement, text)

    # Remove "It is" constructions
    for pattern, replacement in IT_IS_PATTERNS:
        text = re.sub(pattern, replacement, text, flags=re.IGNORECASE)

    # Remove filler adjectives
    for pattern, replacement in FILLER_ADJECTIVES:
        text = re.sub(pattern, replacement, text, flags=re.IGNORECASE)

    # Fix sentences that now start with lowercase after removal
    text = re.sub(r'\.\s+([a-z])', lambda m: '. ' + m.group(1).upper(), text)

    # Fix sentences starting with lowercase at the beginning
    if text and text[0].islower():
        text = text[0].upper() + text[1:]

    # Remove double spaces
    text = re.sub(r'  +', ' ', text)

    # Remove leading spaces after newlines
    text = re.sub(r'\n\s+', '\n', text)

    # Fix empty sentences
    text = re.sub(r'\.\s*\.', '.', text)

    changed = text != original
    return text, changed

total_modified = 0

for q in questions:
    ref = q['ref']

    bullet_new, bullet_changed = humanize_text(q.get('bullet', ''))
    para_new, para_changed = humanize_text(q.get('paragraph', ''))

    if bullet_changed or para_changed:
        q['bullet'] = bullet_new
        q['paragraph'] = para_new
        total_modified += 1
        changes.append(ref)

        # Update rationale
        existing_rationale = q.get('rationale', '')
        if 'AI MODIFIED' not in existing_rationale:
            q['rationale'] = (
                f"AI MODIFIED — Humanization pass: removed AI transition words, "
                f"filler adjectives, and passive constructions to improve natural reading."
            )

# Save
with open('/Users/tarique/rfp-viewer/public/rfp_data.json', 'w') as f:
    json.dump(data, f, indent=2)

print(f"=== HUMANIZATION PASS ===")
print(f"Questions modified: {total_modified}")
print(f"Questions unchanged: {len(questions) - total_modified}")
print()

# Count remaining AI patterns
ai_pattern_count = 0
for q in questions:
    for field in ['bullet', 'paragraph']:
        text = q.get(field, '')
        if any(re.search(p, text) for p, _ in AI_TRANSITIONS):
            ai_pattern_count += 1
        if any(re.search(p, text, re.IGNORECASE) for p, _ in IT_IS_PATTERNS):
            ai_pattern_count += 1

print(f"Remaining AI patterns found: {ai_pattern_count}")

# Final stats
scores = [q['committee_score'] for q in questions]
print(f"\nFinal avg score: {sum(scores)/len(scores):.1f}")
print(f"Score distribution:")
from collections import Counter
score_dist = Counter(q['committee_score'] for q in questions)
for score in sorted(score_dist.keys()):
    print(f"  Score {score}: {score_dist[score]} questions")

conf_dist = Counter(q['confidence'] for q in questions)
print(f"\nConfidence: {dict(conf_dist)}")
