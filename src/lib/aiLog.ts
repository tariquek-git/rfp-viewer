/**
 * Structured logging + cost estimation for AI calls.
 *
 * Two outputs:
 *   1. console.log of a single-line JSON record per call (parseable, tail-able)
 *   2. In-memory ring buffer (last 100 calls) exposed via /api/admin/recent-calls
 *      so the user can see what's happening without piping logs.
 *
 * Cost estimates use public Anthropic pricing for Claude Sonnet 4 (May 2025):
 *   input:        $3.00 / MTok
 *   cache_write:  $3.75 / MTok  (25% premium over input)
 *   cache_read:   $0.30 / MTok  (90% discount on input)
 *   output:       $15.00 / MTok
 *
 * Pricing for other models is approximate; override CLAUDE_MODEL_PRICE_*
 * env vars for precise tracking.
 */

import type Anthropic from '@anthropic-ai/sdk';

interface PricePerMTok {
  input: number;
  cacheWrite: number;
  cacheRead: number;
  output: number;
}

// Sonnet 4 default — adjust the lookup table below for other models.
const PRICING: Record<string, PricePerMTok> = {
  'claude-sonnet-4-20250514': { input: 3, cacheWrite: 3.75, cacheRead: 0.3, output: 15 },
  'claude-haiku-4-5-20251022': {
    input: 1,
    cacheWrite: 1.25,
    cacheRead: 0.1,
    output: 5,
  },
  'claude-opus-4-5-20251022': {
    input: 15,
    cacheWrite: 18.75,
    cacheRead: 1.5,
    output: 75,
  },
};

function priceFor(model: string): PricePerMTok {
  return PRICING[model] ?? PRICING['claude-sonnet-4-20250514'];
}

export interface AICallRecord {
  timestamp: string; // ISO
  route: string; // e.g. 'rewrite' | 'critique' | 'humanize' | 'intake-rfp'
  model: string;
  latency_ms: number;
  input_tokens: number;
  cache_creation_tokens: number;
  cache_read_tokens: number;
  output_tokens: number;
  /** Estimated USD cost of this single call. */
  cost_usd: number;
  success: boolean;
  error?: string;
  /** Optional caller-provided context, e.g. question.ref. */
  meta?: Record<string, string | number | boolean | undefined>;
}

const RING_SIZE = 100;
const ring: AICallRecord[] = [];

export function recentAICalls(limit = RING_SIZE): AICallRecord[] {
  return ring.slice(-limit).reverse();
}

export function aiCostSummary(): {
  totalCallCount: number;
  totalCostUsd: number;
  byRoute: Record<string, { count: number; cost_usd: number }>;
} {
  const byRoute: Record<string, { count: number; cost_usd: number }> = {};
  let totalCostUsd = 0;
  for (const r of ring) {
    if (!byRoute[r.route]) byRoute[r.route] = { count: 0, cost_usd: 0 };
    byRoute[r.route].count += 1;
    byRoute[r.route].cost_usd += r.cost_usd;
    totalCostUsd += r.cost_usd;
  }
  return { totalCallCount: ring.length, totalCostUsd, byRoute };
}

interface LogParams {
  route: string;
  model: string;
  latencyMs: number;
  usage?: Anthropic.Usage;
  success: boolean;
  error?: string;
  meta?: AICallRecord['meta'];
}

/**
 * Compute cost from a usage block (input/output/cache token counts) using
 * the model's pricing tier.
 */
function computeCost(model: string, usage: Anthropic.Usage | undefined): number {
  if (!usage) return 0;
  const p = priceFor(model);
  const input = usage.input_tokens ?? 0;
  const cacheWrite = usage.cache_creation_input_tokens ?? 0;
  const cacheRead = usage.cache_read_input_tokens ?? 0;
  const output = usage.output_tokens ?? 0;
  return (
    (input * p.input + cacheWrite * p.cacheWrite + cacheRead * p.cacheRead + output * p.output) /
    1_000_000
  );
}

/**
 * Record an AI call. Logs a single-line JSON to stdout and pushes to the
 * in-memory ring buffer.
 */
export function logAICall({
  route,
  model,
  latencyMs,
  usage,
  success,
  error,
  meta,
}: LogParams): AICallRecord {
  const record: AICallRecord = {
    timestamp: new Date().toISOString(),
    route,
    model,
    latency_ms: Math.round(latencyMs),
    input_tokens: usage?.input_tokens ?? 0,
    cache_creation_tokens: usage?.cache_creation_input_tokens ?? 0,
    cache_read_tokens: usage?.cache_read_input_tokens ?? 0,
    output_tokens: usage?.output_tokens ?? 0,
    cost_usd: Number(computeCost(model, usage).toFixed(6)),
    success,
    error,
    meta,
  };

  ring.push(record);
  if (ring.length > RING_SIZE) ring.shift();

  // Single-line JSON so log aggregators can parse it without effort.
  console.log(`[ai] ${JSON.stringify(record)}`);

  return record;
}
