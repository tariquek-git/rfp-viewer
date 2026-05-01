#!/usr/bin/env node
/**
 * Smoke-tests the extracted knowledge JSON files against business invariants.
 * Run after extract_engine_knowledge.py and in CI.
 *
 * Catches regressions like: a renamed banned-words rule (silent zero-list),
 * a deleted ZOLVE record (loss of US proof point), or a comma-bearing banned
 * term that breaks the parser.
 *
 * Exits 0 on success, 1 on any failed assertion.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
const DATA = join(HERE, '..', 'data', 'knowledge');

const read = (name) => JSON.parse(readFileSync(join(DATA, name), 'utf8'));

const failures = [];
const assert = (cond, msg) => {
  if (!cond) failures.push(msg);
  else console.log(`  ✓ ${msg}`);
};

console.log('Verifying data/knowledge/ ...\n');

// ── Manifest ──
const manifest = read('_manifest.json');
assert(manifest.total_rows >= 160, `manifest.total_rows >= 160 (got ${manifest.total_rows})`);

// ── Rules ──
const rules = read('rules.json');
assert(rules.length === manifest.tables.rules, `rules.length matches manifest`);
const banned = rules.find((r) => r.label === 'Banned words global' && r.status === 'active');
assert(!!banned, `"Banned words global" rule exists and is active`);
if (banned) {
  const colonIdx = banned.content.indexOf(':');
  const list = colonIdx >= 0 ? banned.content.slice(colonIdx + 1) : banned.content;
  const words = list
    .replace(/\.\s*$/, '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  assert(words.length >= 20, `banned word count >= 20 (got ${words.length})`);
  assert(words.includes('comprehensive'), `banned words include "comprehensive"`);
  assert(words.includes('leverage'), `banned words include "leverage"`);
  // Comma-fragility canary: if a future term contains a comma, count drops.
  const hasCommaTerm = words.some((w) => /\b(?:on-prem|hey there)\b/i.test(w));
  assert(!hasCommaTerm, `no comma-bearing terms detected (parser would split them)`);
}

const formatBans = rules.filter(
  (r) => r.status === 'active' && r.rule_type === 'banned' && r.label !== 'Banned words global',
);
assert(
  formatBans.length >= 4,
  `at least 4 format-ban rules (em dashes etc.) — got ${formatBans.length}`,
);

// ── Clients ──
const clients = read('clients.json');
assert(clients.length === manifest.tables.clients, `clients.length matches manifest`);
const zolve = clients.find((c) => c.name === 'ZOLVE');
assert(!!zolve, `ZOLVE record present`);
assert(zolve?.us_reference === 1, `ZOLVE marked as US reference`);
const affinity = clients.find((c) => c.name === 'AFFINITY CREDIT UNION');
assert(!!affinity, `AFFINITY CREDIT UNION record present`);
assert(
  !!affinity?.regulatory_note && /US regulatory/i.test(affinity.regulatory_note),
  `AFFINITY has regulatory_note about US context`,
);

// ── Metrics ──
const metrics = read('metrics.json');
assert(metrics.length === manifest.tables.metrics, `metrics.length matches manifest`);
const activeMetrics = metrics.filter((m) => m.status === 'active');
assert(activeMetrics.length > 0, `at least one active metric exists`);

// ── BSB context ──
const bsb = read('bsb_context.json');
assert(bsb.length === manifest.tables.bsb_context, `bsb_context.length matches manifest`);

// ── Categories ──
const categories = read('categories.json');
assert(categories.length === manifest.tables.categories, `categories.length matches manifest`);

console.log();
if (failures.length === 0) {
  console.log(`All knowledge invariants hold. ${manifest.total_rows} rows checked.`);
  process.exit(0);
} else {
  console.error(`FAILED: ${failures.length} assertion(s)`);
  for (const f of failures) console.error(`  ✗ ${f}`);
  process.exit(1);
}
