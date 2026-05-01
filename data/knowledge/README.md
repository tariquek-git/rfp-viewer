# data/knowledge/

Curated reference data extracted from the legacy BRIM RFP engine
(`brim-rfp-system/db/brim_rfp.sqlite`). Loaded by `src/lib/knowledge.ts`
and injected into LLM prompts in `/api/rewrite`, `/api/humanize`,
`/api/critique`.

## Files

| File | Source table | Used for |
|---|---|---|
| `categories.json` | `categories` | Rule grouping |
| `rules.json` | `rules` | Banned words, format bans, writing/terminology rules |
| `clients.json` | `clients` | Proof-point lookups (with `usage_rules`, `regulatory_note`) |
| `metrics.json` | `metrics` | Platform metrics with `use_selectively` flag |
| `bsb_context.json` | `bsb_context` | BSB facts for prompt injection |
| `_manifest.json` | (generated) | Row counts surfaced via `/api/health` |

## Regenerating

After editing the engine SQLite:

```bash
python3 scripts/extract_engine_knowledge.py
npm run verify:knowledge
```

The verify step asserts business invariants (e.g., 21 banned words,
ZOLVE present as US reference). Fail loud rather than silently
shipping degraded prompts.

## Commit policy

**Commit these files.** They drive production prompts and deserve PR
review and history. A malicious or sloppy edit here can poison every
LLM call — treat changes the same way as code.

## Validation

`src/lib/knowledge.ts` parses each file with Zod at module init.
Malformed JSON or schema drift fails the Next.js build / cold start
rather than at request time.
