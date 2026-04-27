"""
Dump the BRIM RFP engine's curated knowledge tables to JSON.

Reads from the legacy engine SQLite at brim-rfp-system/db/brim_rfp.sqlite
and writes one JSON file per table into rfp-viewer/data/knowledge/.

Idempotent: re-running overwrites the JSON files with the current DB state.
The engine SQLite is not modified.
"""

from __future__ import annotations

import json
import sqlite3
from pathlib import Path

ENGINE_DB = Path(__file__).resolve().parents[2] / "brim-rfp-system" / "db" / "brim_rfp.sqlite"
OUT_DIR = Path(__file__).resolve().parents[1] / "data" / "knowledge"

TABLES = ["categories", "rules", "clients", "metrics", "bsb_context"]


def dump_table(conn: sqlite3.Connection, table: str) -> list[dict]:
    cur = conn.execute(f"SELECT * FROM {table}")
    cols = [d[0] for d in cur.description]
    return [dict(zip(cols, row)) for row in cur.fetchall()]


def main() -> None:
    if not ENGINE_DB.exists():
        raise SystemExit(f"Engine DB not found at {ENGINE_DB}")

    OUT_DIR.mkdir(parents=True, exist_ok=True)

    conn = sqlite3.connect(ENGINE_DB)
    summary = {}
    for table in TABLES:
        rows = dump_table(conn, table)
        out_path = OUT_DIR / f"{table}.json"
        out_path.write_text(json.dumps(rows, indent=2, ensure_ascii=False) + "\n")
        summary[table] = len(rows)
        print(f"  {table:14s} -> {out_path.relative_to(OUT_DIR.parent.parent)}  ({len(rows)} rows)")
    conn.close()

    manifest = {
        "source": str(ENGINE_DB),
        "tables": summary,
        "total_rows": sum(summary.values()),
    }
    (OUT_DIR / "_manifest.json").write_text(json.dumps(manifest, indent=2) + "\n")
    print(f"\nTotal: {manifest['total_rows']} rows across {len(summary)} tables")


if __name__ == "__main__":
    main()
