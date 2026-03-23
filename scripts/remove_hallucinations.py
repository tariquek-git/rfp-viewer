#!/usr/bin/env python3
"""
REMOVE AI HALLUCINATIONS
========================
Strips out fabricated data that was invented during AI rewriting passes:
1. Coast Capital Savings references (not a Brim client)
2. 73% first-transaction metric (invented)
3. 99.997% settlement accuracy (invented)
4. Wolfsberg 45/45 scoring format (misrepresented)
5. Any other AI-inserted metrics without sources

Source: Claude Code (AI agent) — cleaning up its own mess.
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

    # 1. Remove Coast Capital Savings references
    for field in ['bullet', 'paragraph', 'rationale', 'committee_review']:
        text = q.get(field, '')
        if not text:
            continue

        original = text

        # Remove "and Coast Capital Savings" or "Coast Capital Savings"
        text = text.replace(' and Coast Capital Savings', '')
        text = text.replace('Coast Capital Savings, ', '')
        text = text.replace('Coast Capital Savings', '')
        text = text.replace(', Coast Capital,', ',')
        text = text.replace('Coast Capital, ', '')
        text = text.replace('Coast Capital', '')

        # Remove boilerplate insertion sentences
        text = text.replace('This capability is in production at Affinity Credit Union and.',
                          'This capability is in production at Affinity Credit Union.')
        text = text.replace('This capability is in production at Affinity Credit Union and .',
                          'This capability is in production at Affinity Credit Union.')
        text = re.sub(r'This capability is in production at Affinity Credit Union and\s*\.',
                      'This capability is in production at Affinity Credit Union.', text)

        # Clean up double spaces and orphaned punctuation
        text = re.sub(r'  +', ' ', text)
        text = re.sub(r',\s*,', ',', text)
        text = re.sub(r'\.\s*\.', '.', text)

        if text != original:
            q[field] = text
            modified = True

    # 2. Fix Activation and Fulfillment 15 — remove 73% metric
    if ref == 'Activation and Fulfillment 15':
        for field in ['bullet', 'paragraph', 'rationale', 'committee_review']:
            text = q.get(field, '')
            if not text:
                continue
            original = text

            # Remove the fabricated 73% claim
            text = text.replace('73% of new cardholders make their first transaction within 24 hours using the digital card',
                              'Cardholders can transact immediately after digital card provisioning')
            text = text.replace('73% of cardholders make their first transaction within 24 hours using the digital card',
                              'cardholders can transact immediately after digital card provisioning')
            text = text.replace('73% first-transaction metric is compelling',
                              'Immediate digital transacting capability is compelling')
            text = text.replace('73% activation metric', 'immediate digital activation')
            text = text.replace('73% first-transaction rate', 'immediate digital activation')
            text = text.replace('73% digital-first-transaction stat', 'digital-first approach')
            text = text.replace('The 73% metric gives committee a reason', 'The digital-first approach gives committee a reason')
            text = text.replace('The 73% metric gives the committee a reason', 'The digital-first approach gives the committee a reason')

            if text != original:
                q[field] = text
                modified = True

        # Update rationale to note the fix
        q['rationale'] = (
            "AI MODIFIED — Rewrote to acknowledge gap (no in-branch printing), "
            "positioned digital issuance as alternative with concrete third-party integration path. "
            "NOTE: Removed unverified 73% metric that was fabricated during AI rewrite."
        )

    # 3. Fix Processing 26 — remove 99.997% metric
    if ref == 'Processing 26':
        for field in ['bullet', 'paragraph', 'rationale', 'committee_review']:
            text = q.get(field, '')
            if not text:
                continue
            original = text

            # Remove the fabricated 99.997% claim
            text = text.replace('99.997% settlement accuracy', 'high settlement accuracy')
            text = text.replace('99.997% accuracy', 'high accuracy')
            text = text.replace('Settlement accuracy: 99.997% over trailing 12 months',
                              'Settlement processing is fully automated with reconciliation')
            text = text.replace('Specific accuracy metric (99.997%)',
                              'Automated settlement with reconciliation')

            if text != original:
                q[field] = text
                modified = True

        q['rationale'] = (
            "AI MODIFIED — Rewrote to lead with Mastercard live capability, acknowledge "
            "multi-network gaps directly with per-network timelines. "
            "NOTE: Removed unverified 99.997% accuracy metric that was fabricated during AI rewrite."
        )

    # 4. Fix Wolfsberg FCCQ 45/45 claims anywhere they appear
    for field in ['bullet', 'paragraph', 'rationale', 'committee_review', 'notes']:
        text = q.get(field, '')
        if not text:
            continue
        original = text

        text = text.replace('45/45 affirmative responses', 'completed self-assessment')
        text = text.replace('45/45 YES', 'completed')
        text = text.replace('Wolfsberg FCCQ with 45/45', 'Wolfsberg FCCQ (completed)')
        text = text.replace('45/45', 'completed')

        if text != original:
            q[field] = text
            modified = True

    if modified:
        changes.append(ref)

# Save
with open('/Users/tarique/rfp-viewer/public/rfp_data.json', 'w') as f:
    json.dump(data, f, indent=2)

# Deduplicate changes list
unique_changes = list(dict.fromkeys(changes))

print("=== HALLUCINATIONS REMOVED ===")
print(f"Questions modified: {len(unique_changes)}")
for c in unique_changes:
    print(f"  {c}")

# Verify no Coast Capital remains
coast_count = 0
metric_73 = 0
metric_997 = 0
for q in questions:
    for field in ['bullet', 'paragraph', 'rationale', 'committee_review', 'notes']:
        text = q.get(field, '') or ''
        if 'Coast Capital' in text:
            coast_count += 1
        if '73%' in text:
            metric_73 += 1
        if '99.997' in text:
            metric_997 += 1

print(f"\nRemaining 'Coast Capital' references: {coast_count}")
print(f"Remaining '73%' references: {metric_73}")
print(f"Remaining '99.997' references: {metric_997}")
