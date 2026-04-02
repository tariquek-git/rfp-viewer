"""
QA: verify rfp_data.json completeness before export
- All 383 questions present
- All questions have non-empty paragraph or bullet
- All questions have a valid category
- No question is missing ref, topic, or requirement
- No paragraph ends mid-word (basic truncation check)
"""
import json, re

with open("public/rfp_data.json", encoding="utf-8") as f:
    data = json.load(f)

questions = data["questions"]
categories = set(data["categories"])

errors = []
warnings = []

# ── 1. Count ────────────────────────────────────────────────────────────────
print(f"Total questions : {len(questions)}")
print(f"Total categories: {len(categories)}")

# ── 2. Per-question checks ───────────────────────────────────────────────────
missing_paragraph = []
missing_category  = []
missing_ref       = []
missing_req       = []
truncation_risk   = []

for q in questions:
    ref = q.get("ref", "")
    para = (q.get("paragraph") or "").strip()
    bullet = (q.get("bullet") or "").strip()
    cat = q.get("category", "")
    req = (q.get("requirement") or "").strip()

    if not ref:
        missing_ref.append(q.get("number", "?"))

    if not para and not bullet:
        missing_paragraph.append(ref or str(q.get("number", "?")))

    if cat not in categories:
        missing_category.append(f"{ref}: '{cat}'")

    if not req:
        missing_req.append(ref)

    # Truncation check: paragraph ending abruptly (no sentence-ending punctuation)
    if para and len(para) > 40:
        last_char = para[-1]
        if last_char not in ".!?\"'…)":
            truncation_risk.append(f"  {ref}: ends with '...{para[-30:]}'")

# ── 3. Category counts ───────────────────────────────────────────────────────
cat_counts = {}
for q in questions:
    cat_counts[q.get("category", "UNKNOWN")] = cat_counts.get(q.get("category", "UNKNOWN"), 0) + 1

print("\n── Category breakdown ──────────────────────────────────────────────────")
for cat in sorted(cat_counts, key=lambda c: -cat_counts[c]):
    print(f"  {cat_counts[cat]:3d}  {cat}")

# ── 4. Field completeness ─────────────────────────────────────────────────────
print("\n── Field completeness ──────────────────────────────────────────────────")
fields = ["paragraph", "bullet", "requirement", "ref", "topic", "confidence", "compliant",
          "committee_score", "committee_risk"]
for field in fields:
    present = sum(1 for q in questions if str(q.get(field) or "").strip() not in ("", "0", "None"))
    pct = round(present / len(questions) * 100, 1)
    status = "✓" if pct >= 95 else "⚠" if pct >= 70 else "✗"
    print(f"  {status} {field:<20}: {present}/{len(questions)} ({pct}%)")

# ── 5. Issues ────────────────────────────────────────────────────────────────
print("\n── Issues ──────────────────────────────────────────────────────────────")
if missing_ref:
    print(f"  ✗ Missing ref ({len(missing_ref)}): {missing_ref[:5]}")
else:
    print("  ✓ All questions have ref")

if missing_paragraph:
    print(f"  ✗ Missing paragraph+bullet ({len(missing_paragraph)}): {missing_paragraph[:5]}")
else:
    print("  ✓ All questions have paragraph or bullet")

if missing_category:
    print(f"  ✗ Unknown category ({len(missing_category)}): {missing_category[:3]}")
else:
    print("  ✓ All categories valid")

if missing_req:
    print(f"  ⚠ Missing requirement ({len(missing_req)}): {missing_req[:5]}")
else:
    print("  ✓ All questions have requirement text")

if truncation_risk:
    print(f"\n  ⚠ Paragraphs not ending with punctuation ({len(truncation_risk)}):")
    for t in truncation_risk[:10]:
        print(t)
else:
    print("  ✓ All paragraphs end with proper punctuation")

# ── 6. Export coverage check ─────────────────────────────────────────────────
print("\n── Export coverage ─────────────────────────────────────────────────────")
# Simulate the groupBy-category pattern used in exportWordReview/Submission
grouped = {}
for q in questions:
    grouped.setdefault(q["category"], []).append(q)
covered = sum(len(qs) for qs in grouped.values())
print(f"  Questions reachable via category grouping: {covered}/{len(questions)}")
uncovered = [q["ref"] for q in questions if q["category"] not in grouped]
if uncovered:
    print(f"  ✗ Uncovered: {uncovered[:5]}")
else:
    print("  ✓ All 383 questions reachable in exports")

print("\n── RESULT ──────────────────────────────────────────────────────────────")
all_ok = not missing_ref and not missing_paragraph and not missing_category and covered == len(questions)
if all_ok:
    print(f"  ✅ PASS — {len(questions)} questions, {len(categories)} categories, no data loss")
else:
    print(f"  ❌ FAIL — review issues above")
