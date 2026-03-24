#!/usr/bin/env python3
"""
Seed Supabase with RFP data from rfp_data.json.
Run this once after creating your Supabase tables.

Usage:
  export SUPABASE_URL="https://your-project.supabase.co"
  export SUPABASE_KEY="your-anon-key"
  python3 scripts/seed_supabase.py
"""

import json
import os
import sys
from urllib.request import Request, urlopen
from urllib.error import HTTPError

SUPABASE_URL = os.environ.get("SUPABASE_URL", "")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY", "")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("ERROR: Set SUPABASE_URL and SUPABASE_KEY environment variables")
    print("  export SUPABASE_URL='https://your-project.supabase.co'")
    print("  export SUPABASE_KEY='your-anon-key'")
    sys.exit(1)


def supabase_request(table, data, method="POST"):
    """Make a REST API request to Supabase."""
    url = f"{SUPABASE_URL}/rest/v1/{table}"
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "resolution=merge-duplicates",
    }
    body = json.dumps(data).encode("utf-8")
    req = Request(url, data=body, headers=headers, method=method)
    try:
        resp = urlopen(req)
        return resp.status
    except HTTPError as e:
        error_body = e.read().decode("utf-8")
        print(f"  ERROR {e.code}: {error_body[:200]}")
        return e.code


def main():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    data_path = os.path.join(script_dir, "..", "public", "rfp_data.json")

    with open(data_path) as f:
        rfp = json.load(f)

    questions = rfp.get("questions", [])
    print(f"Found {len(questions)} questions to seed")

    # Seed in batches of 50
    batch_size = 50
    success = 0
    for i in range(0, len(questions), batch_size):
        batch = questions[i : i + batch_size]
        # Map field names to match SQL schema
        rows = []
        for q in batch:
            rows.append(
                {
                    "ref": q["ref"],
                    "category": q.get("category", ""),
                    "number": q.get("number", 0),
                    "topic": q.get("topic", ""),
                    "requirement": q.get("requirement", ""),
                    "a_oob": q.get("a_oob", False),
                    "b_config": q.get("b_config", False),
                    "c_custom": q.get("c_custom", False),
                    "d_dnm": q.get("d_dnm", False),
                    "compliant": q.get("compliant", "N"),
                    "bullet": q.get("bullet", ""),
                    "paragraph": q.get("paragraph", ""),
                    "confidence": q.get("confidence", "RED"),
                    "rationale": q.get("rationale", ""),
                    "notes": q.get("notes", ""),
                    "pricing": q.get("pricing", ""),
                    "capability": q.get("capability", ""),
                    "availability": q.get("availability", ""),
                    "strategic": q.get("strategic", False),
                    "reg_enable": q.get("reg_enable", False),
                    "committee_review": q.get("committee_review", ""),
                    "committee_risk": q.get("committee_risk", ""),
                    "committee_score": q.get("committee_score", 0),
                    "status": q.get("status", "draft"),
                }
            )
        status = supabase_request("questions", rows)
        if status in (200, 201):
            success += len(batch)
            print(f"  Seeded {success}/{len(questions)} questions")
        else:
            print(f"  Failed batch {i}-{i+batch_size}")

    # Seed initial version snapshot
    version_data = {
        "id": "v-initial",
        "label": "Initial seed",
        "snapshot": rfp,
        "created_by": "seed_script",
    }
    status = supabase_request("versions", [version_data])
    if status in (200, 201):
        print("Saved initial version snapshot")

    print(f"\nDone! {success}/{len(questions)} questions seeded to Supabase")


if __name__ == "__main__":
    main()
