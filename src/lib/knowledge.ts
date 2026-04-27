/**
 * Curated knowledge base extracted from the legacy BRIM RFP engine.
 * Source: data/knowledge/*.json (regenerate via scripts/extract_engine_knowledge.py).
 *
 * JSON is statically imported so Next.js bundles it into the serverless
 * function output (dynamic fs reads are not traced by nft).
 *
 * Schemas are validated at module init via Zod — malformed JSON fails the
 * build/cold-start loud rather than silently degrading prompts at runtime.
 *
 * Used by AI route handlers to inject banned-word lists, writing rules,
 * client proof points, and platform metrics into prompts as data instead
 * of hardcoded strings.
 */

import { z } from 'zod';
import categoriesRaw from '../../data/knowledge/categories.json';
import rulesRaw from '../../data/knowledge/rules.json';
import clientsRaw from '../../data/knowledge/clients.json';
import metricsRaw from '../../data/knowledge/metrics.json';
import bsbContextRaw from '../../data/knowledge/bsb_context.json';
import manifestRaw from '../../data/knowledge/_manifest.json';

// ── Schemas ───────────────────────────────────────────────────────────

const CategorySchema = z.object({
  id: z.number(),
  code: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  sort_order: z.number(),
});

const RuleSchema = z.object({
  id: z.number(),
  category_id: z.number().nullable(),
  rule_type: z.enum([
    'writing',
    'terminology',
    'bsb',
    'formatting',
    'compliance',
    'client',
    'banned',
  ]),
  label: z.string(),
  content: z.string(),
  status: z.enum(['active', 'deprecated', 'flagged', 'pending']),
  confidence: z.enum(['confirmed', 'pending', 'flagged']),
  dependency_type: z.enum(['isolated', 'terminology', 'structural']),
  applies_to_rfp: z.number(),
  notes: z.string().nullable(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
  updated_by: z.string().optional(),
});

const ClientSchema = z.object({
  id: z.number(),
  name: z.string(),
  display_name: z.string(),
  client_type: z.enum(['bank', 'credit_union', 'fintech', 'brand']).nullable(),
  country: z.string().nullable(),
  status: z.enum(['live', 'in_progress', 'reference_only']),
  key_facts: z.string().nullable(),
  proof_points: z.string().nullable(),
  usage_rules: z.string().nullable(),
  us_reference: z.number(),
  regulatory_note: z.string().nullable(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

const MetricSchema = z.object({
  id: z.number(),
  label: z.string(),
  value: z.string(),
  category: z.enum(['platform', 'sla', 'implementation', 'banned', 'client']).nullable(),
  status: z.enum(['active', 'banned', 'needs_confirmation']),
  usage_context: z.string().nullable(),
  use_selectively: z.number(),
  notes: z.string().nullable(),
  updated_at: z.string().optional(),
});

const BSBContextSchema = z.object({
  id: z.number(),
  category: z
    .enum(['profile', 'technology', 'products', 'rules', 'risks', 'eval_factors'])
    .nullable(),
  label: z.string(),
  content: z.string(),
  priority: z.number(),
  updated_at: z.string().optional(),
});

const ManifestSchema = z.object({
  source: z.string(),
  tables: z.record(z.string(), z.number()),
  total_rows: z.number(),
});

export type Category = z.infer<typeof CategorySchema>;
export type Rule = z.infer<typeof RuleSchema>;
export type Client = z.infer<typeof ClientSchema>;
export type Metric = z.infer<typeof MetricSchema>;
export type BSBContext = z.infer<typeof BSBContextSchema>;
export type Manifest = z.infer<typeof ManifestSchema>;

// ── Eager validation at module init ──────────────────────────────────

function parseTable<T>(schema: z.ZodSchema<T>, raw: unknown, name: string): T[] {
  const result = z.array(schema).safeParse(raw);
  if (!result.success) {
    const issues = result.error.issues
      .slice(0, 3)
      .map((i) => `${i.path.join('.')}: ${i.message}`)
      .join('; ');
    throw new Error(
      `[knowledge] ${name}.json failed validation: ${issues}. Re-run scripts/extract_engine_knowledge.py.`,
    );
  }
  return result.data;
}

const categories: Category[] = parseTable(CategorySchema, categoriesRaw, 'categories');
const rules: Rule[] = parseTable(RuleSchema, rulesRaw, 'rules');
const clients: Client[] = parseTable(ClientSchema, clientsRaw, 'clients');
const metrics: Metric[] = parseTable(MetricSchema, metricsRaw, 'metrics');
const bsbContext: BSBContext[] = parseTable(BSBContextSchema, bsbContextRaw, 'bsb_context');
const manifest: Manifest = ManifestSchema.parse(manifestRaw);

// ── Public accessors ──────────────────────────────────────────────────

export const getCategories = (): Category[] => categories;
export const getRules = (): Rule[] => rules;
export const getClients = (): Client[] => clients;
export const getMetrics = (): Metric[] => metrics;
export const getBSBContext = (): BSBContext[] => bsbContext;
export const getManifest = (): Manifest => manifest;

// ── Derived queries ───────────────────────────────────────────────────

const BANNED_WORDS_RULE_LABEL = 'Banned words global';

/**
 * Returns the flat list of banned terms parsed from the
 * "Banned words global" rule. Comma-separated terms after the colon.
 *
 * NOTE: Splits on `,` so a banned term containing a literal comma
 * (e.g. "on-premise, on-prem") would be incorrectly split. Today's
 * data contains no such terms — verify_knowledge.ts asserts the count.
 */
export function getBannedWords(): string[] {
  const banned = rules.find((r) => r.label === BANNED_WORDS_RULE_LABEL && r.status === 'active');
  if (!banned) {
    // Loud failure in dev/test, silent fallback in production prevents
    // an extracted-data bug from blocking all rewrite/humanize calls.
    if (process.env.NODE_ENV !== 'production') {
      throw new Error(
        `[knowledge] Active rule with label "${BANNED_WORDS_RULE_LABEL}" not found. ` +
          `Was it renamed in the engine SQLite? Re-run extract_engine_knowledge.py.`,
      );
    }
    console.warn(`[knowledge] Banned words rule missing — prompts will lack word guardrails.`);
    return [];
  }
  const colonIdx = banned.content.indexOf(':');
  const list = colonIdx >= 0 ? banned.content.slice(colonIdx + 1) : banned.content;
  return list
    .replace(/\.\s*$/, '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * Strip internal-facing meta from rule content so the LLM sees only the
 * actionable directive. Removes leading "BANNED: " prefix and keeps only
 * the first sentence (which by convention is the actionable instruction).
 *
 * Example:
 *   in:  "BANNED: Do NOT use '3,000+ data fields'. Tarique confirmed this adds no weight."
 *   out: "Do NOT use '3,000+ data fields'."
 */
export function cleanRuleContent(content: string): string {
  const stripped = content.replace(/^BANNED:\s*/i, '').trim();
  // First sentence = up to and including a terminating . ! or ? optionally
  // followed by a closing quote, followed by whitespace or end-of-string.
  const match = stripped.match(/^.+?[.!?]['"]?(?=\s|$)/);
  return match ? match[0] : stripped;
}

/**
 * Active writing-style rules that apply to RFP answers.
 */
export function getWritingRules(): Rule[] {
  return rules.filter(
    (r) =>
      r.status === 'active' &&
      r.applies_to_rfp === 1 &&
      (r.rule_type === 'writing' || r.rule_type === 'formatting'),
  );
}

/**
 * Active terminology rules.
 */
export function getTerminologyRules(): Rule[] {
  return rules.filter((r) => r.status === 'active' && r.rule_type === 'terminology');
}

/**
 * Format-ban rules other than the global word list (em dashes,
 * exclamation marks, rhetorical questions, etc). Content is cleaned
 * for prompt use.
 */
export function getFormatBans(): { label: string; directive: string }[] {
  return rules
    .filter(
      (r) =>
        r.status === 'active' && r.rule_type === 'banned' && r.label !== BANNED_WORDS_RULE_LABEL,
    )
    .map((r) => ({ label: r.label, directive: cleanRuleContent(r.content) }));
}

/**
 * Active client proof-point records.
 * @param opts.usOnly  if true, only US-citable references
 */
export function getActiveClients(opts: { usOnly?: boolean } = {}): Client[] {
  const all = clients.filter((c) => c.status === 'live' || c.status === 'reference_only');
  return opts.usOnly ? all.filter((c) => c.us_reference === 1) : all;
}

/**
 * Active platform metrics. The `use_selectively` flag indicates the
 * metric should not be dumped alongside others in the same response.
 */
export function getActiveMetrics(): Metric[] {
  return metrics.filter((m) => m.status === 'active');
}
