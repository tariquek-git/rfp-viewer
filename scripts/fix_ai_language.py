#!/usr/bin/env python3
"""
Fix AI-typical language in all RFP responses.
Applies the exact improvements from the AI Detection sheet.
"""
import json
import re

DATA_FILE = "public/rfp_data.json"
changes = []

# Word replacements (context-aware)
REPLACEMENTS = [
    # Buzzwords
    (r'\bleverage\b', 'use'),
    (r'\bLeverage\b', 'Use'),
    (r'\bleverages\b', 'uses'),
    (r'\bLeverages\b', 'Uses'),
    (r'\bleveraging\b', 'using'),
    (r'\bLeveraging\b', 'Using'),
    (r'\butilize\b', 'use'),
    (r'\bUtilize\b', 'Use'),
    (r'\butilizes\b', 'uses'),
    (r'\bUtilizes\b', 'Uses'),
    (r'\butilizing\b', 'using'),
    (r'\bUtilizing\b', 'Using'),
    (r'\bfacilitate\b', 'enable'),
    (r'\bFacilitate\b', 'Enable'),
    (r'\bfacilitates\b', 'enables'),
    (r'\bFacilitates\b', 'Enables'),
    (r'\bfacilitating\b', 'enabling'),
    (r'\bFacilitating\b', 'Enabling'),
    (r'\bstreamline\b', 'simplify'),
    (r'\bStreamline\b', 'Simplify'),
    (r'\bstreamlines\b', 'simplifies'),
    (r'\bStreamlines\b', 'Simplifies'),
    (r'\bstreamlined\b', 'simplified'),
    (r'\bStreamlined\b', 'Simplified'),
    (r'\bstreamlining\b', 'simplifying'),
    (r'\bStreamlining\b', 'Simplifying'),
    (r'\bsynergy\b', 'collaboration'),
    (r'\bSynergy\b', 'Collaboration'),
    (r'\bsynergies\b', 'efficiencies'),
    (r'\bSynergies\b', 'Efficiencies'),
    (r'\bparadigm\b', 'approach'),
    (r'\bParadigm\b', 'Approach'),
    (r'\bholistic\b', 'end-to-end'),
    (r'\bHolistic\b', 'End-to-end'),
    # Superlatives
    (r'\bcutting-edge\b', 'modern'),
    (r'\bCutting-edge\b', 'Modern'),
    (r'\bbest-in-class\b', 'high-performance'),
    (r'\bBest-in-class\b', 'High-performance'),
    (r'\bindustry-leading\b', 'proven'),
    (r'\bIndustry-leading\b', 'Proven'),
    # Filler transitions
    (r'\bAdditionally,\s*', ''),
    (r'\bFurthermore,\s*', ''),
    (r'\bMoreover,\s*', ''),
    # Vague adjectives (only when standalone filler)
    (r'\bcomprehensive\b', 'full'),
    (r'\bComprehensive\b', 'Full'),
    (r'\brobust\b', 'strong'),
    (r'\bRobust\b', 'Strong'),
    (r'\bseamless\b', 'smooth'),
    (r'\bSeamless\b', 'Smooth'),
    (r'\bseamlessly\b', 'smoothly'),
    (r'\bSeamlessly\b', 'Smoothly'),
]

# Passive voice fixes
PASSIVE_FIXES = [
    (r'is designed to\b', 'does'),
    (r'Is designed to\b', 'Does'),
    (r'are designed to\b', 'do'),
    (r'Are designed to\b', 'Do'),
    (r'is configured to\b', 'can'),
    (r'Is configured to\b', 'Can'),
    (r'are configured to\b', 'can'),
    (r'is enabled for\b', 'supports'),
    (r'Is enabled for\b', 'Supports'),
    (r'is enabled to\b', 'can'),
    (r'is provided to\b', 'goes to'),
    (r'is provided by\b', 'comes from'),
    (r'Is provided by\b', 'Comes from'),
    (r'are provided by\b', 'come from'),
    (r'is supported by\b', 'runs on'),
    (r'Is supported by\b', 'Runs on'),
    (r'is integrated with\b', 'integrates with'),
    (r'Is integrated with\b', 'Integrates with'),
    (r'is managed by\b', 'runs under'),
    (r'Is managed by\b', 'Runs under'),
    (r'is maintained by\b', 'stays with'),
    (r'is processed by\b', 'runs through'),
    (r'Is processed by\b', 'Runs through'),
]

def fix_text(text, ref, field):
    if not text:
        return text
    original = text

    for pattern, replacement in REPLACEMENTS + PASSIVE_FIXES:
        text = re.sub(pattern, replacement, text)

    # Clean up double spaces from removed transitions
    text = re.sub(r'  +', ' ', text)
    # Fix sentences starting with lowercase after removed transition
    text = re.sub(r'\. ([a-z])', lambda m: '. ' + m.group(1).upper(), text)

    if text != original:
        # Find what changed
        orig_words = set(original.lower().split())
        new_words = set(text.lower().split())
        removed = orig_words - new_words
        changes.append((ref, field, list(removed)[:5]))

    return text


def main():
    print("=" * 60)
    print("FIX AI LANGUAGE IN RFP RESPONSES")
    print("=" * 60)

    with open(DATA_FILE) as f:
        root = json.load(f)

    questions = root['questions']
    print(f"Loaded {len(questions)} questions\n")

    for q in questions:
        ref = f"{q.get('category', '?')} {q.get('number', '?')}"
        for field in ['bullet', 'paragraph']:
            val = q.get(field, '')
            if val:
                q[field] = fix_text(val, ref, field)

    print(f"Questions modified: {len(set(r for r,_,_ in changes))}")
    print(f"Total field changes: {len(changes)}")
    print()
    for ref, field, words in changes:
        print(f"  [{ref}] {field}: fixed {', '.join(words)}")

    root['questions'] = questions
    with open(DATA_FILE, 'w') as f:
        json.dump(root, f, indent=2)

    print(f"\nSaved to {DATA_FILE}")
    print("=" * 60)


if __name__ == '__main__':
    main()
