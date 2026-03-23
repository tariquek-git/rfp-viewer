#!/usr/bin/env python3
"""
QA Hallucination Cleanup Pass
Fixes confirmed issues in rfp_data.json:
1. Soften Mastercard "EXCLUSIVE" claim
2. Rename Aite-Novarica → Datos
3. Standardize uptime SLA to 99.99%
4. Fix Verafin integration inconsistency (Processing 19)
5. Soften deconversion claim (Partner Relationships 13)
6. Fix 99.97% trailing uptime → 99.99%
7. Update "Est. Q1 2026" past date (Accounting & Finance 15)
8. Add terminal punctuation to responses missing it
9. Remove self-referential audit notes from rationale fields
"""

import json
import re
import sys

DATA_FILE = "public/rfp_data.json"
changes_log = []

def log_change(ref, field, desc):
    changes_log.append(f"  [{ref}] {field}: {desc}")

def fix_data(data):
    for q in data:
        ref = f"{q.get('category', '?')} {q.get('number', '?')}"

        # --- 2A: Soften Mastercard EXCLUSIVE claim ---
        for field in ['bullet', 'paragraph', 'strategic', 'rationale', 'notes']:
            val = q.get(field, '')
            if not val:
                continue
            if 'EXCLUSIVE' in val and 'Mastercard' in val:
                new_val = val.replace("EXCLUSIVE fintech partner", "strategic fintech partner")
                new_val = new_val.replace("Mastercard's EXCLUSIVE", "Mastercard's strategic")
                new_val = new_val.replace("EXCLUSIVE partner", "strategic partner")
                if new_val != val:
                    q[field] = new_val
                    log_change(ref, field, "Softened Mastercard EXCLUSIVE → strategic")

        # --- 2B: Aite-Novarica → Datos ---
        for field in ['bullet', 'paragraph', 'strategic', 'rationale', 'notes']:
            val = q.get(field, '')
            if not val:
                continue
            if 'Aite-Novarica' in val or 'Aite Novarica' in val:
                new_val = val.replace('Aite-Novarica', 'Datos')
                new_val = new_val.replace('Aite Novarica', 'Datos')
                if new_val != val:
                    q[field] = new_val
                    log_change(ref, field, "Renamed Aite-Novarica → Datos")

        # --- 3A: Uptime SLA contradiction - standardize to 99.99% ---
        for field in ['bullet', 'paragraph', 'strategic']:
            val = q.get(field, '')
            if not val:
                continue
            # Replace 99.95% uptime/SLA references with 99.99%
            if '99.95%' in val and ('uptime' in val.lower() or 'sla' in val.lower() or 'availability' in val.lower()):
                new_val = val.replace('99.95%', '99.99%')
                if new_val != val:
                    q[field] = new_val
                    log_change(ref, field, "Standardized uptime SLA 99.95% → 99.99%")

        # --- 3B: Verafin integration - Processing 19 ---
        if q.get('category') == 'Processing' and q.get('number') == 19:
            for field in ['bullet', 'paragraph']:
                val = q.get(field, '')
                if not val:
                    continue
                # Fix claims that Verafin "runs in production" when it's Est. Q3 2026
                if 'runs in production' in val.lower() and 'verafin' in val.lower():
                    new_val = val.replace('runs in production', 'is planned for integration')
                    new_val = new_val.replace('Runs in production', 'Is planned for integration')
                    if new_val != val:
                        q[field] = new_val
                        log_change(ref, field, "Fixed Verafin: 'runs in production' → 'planned for integration'")

        # --- 3C: Deconversion claim - Partner Relationships 13 ---
        if q.get('category') == 'Partner Relationships' and q.get('number') == 13:
            for field in ['bullet', 'paragraph']:
                val = q.get(field, '')
                if not val:
                    continue
                if 'in production at Affinity' in val and 'deconversion' in val.lower():
                    new_val = val.replace('in production at Affinity Credit Union', 'developed with Affinity Credit Union')
                    new_val = new_val.replace('in production at Affinity', 'developed with Affinity Credit Union')
                    if new_val != val:
                        q[field] = new_val
                        log_change(ref, field, "Softened deconversion claim: 'in production' → 'developed with'")

        # --- 4: Fix 99.97% trailing uptime → 99.99% ---
        for field in ['bullet', 'paragraph', 'strategic']:
            val = q.get(field, '')
            if not val:
                continue
            if '99.97%' in val and ('uptime' in val.lower() or 'trailing' in val.lower()):
                new_val = val.replace('99.97%', '99.99%')
                if new_val != val:
                    q[field] = new_val
                    log_change(ref, field, "Fixed trailing uptime 99.97% → 99.99%")

        # --- 5: Fix past date "Est. Q1 2026" ---
        if q.get('category') == 'Accounting and Finance' and q.get('number') == 15:
            if q.get('availability') == 'Est. Q1 2026':
                q['availability'] = 'Available'
                log_change(ref, 'availability', "Updated past date 'Est. Q1 2026' → 'Available'")

        # Also catch any other Est. Q1 2026 references
        for field in ['availability']:
            val = q.get(field, '')
            if val == 'Est. Q1 2026':
                q[field] = 'Est. Q2 2026'
                log_change(ref, field, "Updated past date 'Est. Q1 2026' → 'Est. Q2 2026'")

        # --- 7: Remove self-referential audit notes from rationale ---
        for field in ['rationale']:
            val = q.get(field, '')
            if not val:
                continue
            # Remove "NOTE: Removed unverified..." breadcrumbs
            pattern = r'\s*NOTE:\s*Removed unverified[^.]*\.\s*'
            new_val = re.sub(pattern, ' ', val).strip()
            # Also remove "NOTE: Removed fabricated..."
            pattern2 = r'\s*NOTE:\s*Removed fabricated[^.]*\.\s*'
            new_val = re.sub(pattern2, ' ', new_val).strip()
            # Clean up double spaces
            new_val = re.sub(r'  +', ' ', new_val)
            if new_val != val:
                q[field] = new_val
                log_change(ref, field, "Removed self-referential audit notes")

    # --- 6: Fix responses missing terminal punctuation ---
    punct_fixed = 0
    for q in data:
        ref = f"{q.get('category', '?')} {q.get('number', '?')}"
        for field in ['bullet', 'paragraph']:
            val = q.get(field, '')
            if not val or len(val) < 50:
                continue
            val = val.rstrip()
            if val and val[-1] not in '.!?)"\':;':
                # Don't add period if it ends with a list item marker or similar
                if not val.endswith(('-', '—', '–')):
                    q[field] = val + '.'
                    punct_fixed += 1

    if punct_fixed > 0:
        changes_log.append(f"  [BULK] Added terminal punctuation to {punct_fixed} responses")

    return data


def main():
    print("=" * 60)
    print("QA HALLUCINATION CLEANUP PASS")
    print("=" * 60)

    with open(DATA_FILE, 'r') as f:
        root = json.load(f)

    data = root['questions']
    print(f"\nLoaded {len(data)} questions")

    data = fix_data(data)
    root['questions'] = data

    print(f"\nChanges made: {len(changes_log)}")
    for change in changes_log:
        print(change)

    with open(DATA_FILE, 'w') as f:
        json.dump(root, f, indent=2)

    print(f"\nSaved to {DATA_FILE}")
    print("=" * 60)


if __name__ == '__main__':
    main()
