import { z } from 'zod';

// ── Shared primitives ───────────────────────────────────────────────

const KnowledgeBaseSchema = z.object({
  companyFacts: z.string().max(5000).default(''),
  keyMetrics: z.string().max(5000).default(''),
  differentiators: z.string().max(5000).default(''),
  competitivePositioning: z.string().max(5000).default(''),
  lastUpdated: z.number().default(0),
});

const QuestionSchema = z.object({
  ref: z.string().max(50),
  category: z.string().max(200),
  number: z.number(),
  topic: z.string().max(500),
  requirement: z.string().max(2000),
  bullet: z.string().max(10000).default(''),
  paragraph: z.string().max(10000).default(''),
  confidence: z.string().max(20).default(''),
  rationale: z.string().max(2000).default(''),
  notes: z.string().max(2000).default(''),
  committee_review: z.string().max(2000).default(''),
  committee_risk: z.string().max(2000).default(''),
  committee_score: z.number().min(0).max(10).default(5),
  compliant: z.string().max(20).default(''),
  a_oob: z.boolean().default(false),
  b_config: z.boolean().default(false),
  c_custom: z.boolean().default(false),
  d_dnm: z.boolean().default(false),
  strategic: z.boolean().default(false),
  reg_enable: z.boolean().default(false),
  pricing: z.string().max(500).default(''),
  capability: z.string().max(500).default(''),
  availability: z.string().max(500).default(''),
  status: z.enum(['draft', 'reviewed', 'approved', 'flagged']).default('draft'),
});

const FeedbackItemSchema = z.object({
  field: z.string().max(50),
  comment: z.string().max(1000),
});

const ValidationRuleSchema = z.object({
  text: z.string().max(500),
  type: z.string().max(50).optional(),
});

// ── Per-route request schemas ────────────────────────────────────────

const OptionalKB = KnowledgeBaseSchema.optional();

export const RewriteRequestSchema = z.object({
  question: QuestionSchema,
  field: z.enum(['bullet', 'paragraph']),
  globalRules: z.array(z.string().max(500)).max(50).default([]),
  rowRules: z.string().max(2000).default(''),
  feedback: z.array(FeedbackItemSchema).max(20).default([]),
  knowledgeBase: OptionalKB,
});

export const CritiqueRequestSchema = z.object({
  question: QuestionSchema,
  field: z.enum(['bullet', 'paragraph']),
  knowledgeBase: OptionalKB,
});

export const ScoreRequestSchema = z.object({
  question: QuestionSchema,
  knowledgeBase: OptionalKB,
});

export const ValidateRequestSchema = z.object({
  text: z.string().max(10000),
  validationRules: z.array(ValidationRuleSchema).max(50),
  question: QuestionSchema,
  knowledgeBase: OptionalKB,
});

export const ConsistencyRequestSchema = z.object({
  questions: z.array(QuestionSchema).max(500),
  knowledgeBase: OptionalKB,
});

const StatsSchema = z.object({
  total: z.number(),
  green: z.number(),
  yellow: z.number(),
  red: z.number(),
  compliant_y: z.number(),
  compliant_n: z.number(),
  compliant_partial: z.number(),
  with_strategic: z.number().optional(),
  with_reg_enable: z.number().optional(),
});

export const SummaryRequestSchema = z.object({
  questions: z.array(QuestionSchema).max(500),
  stats: StatsSchema,
  knowledgeBase: OptionalKB,
});

export const NarrativeAuditRequestSchema = z.object({
  questions: z.array(QuestionSchema).max(500),
  winThemes: z
    .array(z.object({ title: z.string().max(200), description: z.string().max(1000) }))
    .max(20)
    .default([]),
  knowledgeBase: OptionalKB,
});

export const HumanizeRequestSchema = z.object({
  text: z.string().max(20000),
  triggers: z.array(z.string().max(100)).max(20).default([]),
  context: z.string().max(500).default(''),
});

// ── Helper ───────────────────────────────────────────────────────────

import { NextResponse } from 'next/server';
import type { ZodSchema } from 'zod';

export function parseBody<T>(
  schema: ZodSchema<T>,
  body: unknown,
): { data: T; error: null } | { data: null; error: NextResponse } {
  const result = schema.safeParse(body);
  if (!result.success) {
    const message = result.error.issues
      .map((i) => `${i.path.join('.')}: ${i.message}`)
      .join('; ');
    return {
      data: null,
      error: NextResponse.json({ error: `Invalid request: ${message}` }, { status: 400 }),
    };
  }
  return { data: result.data, error: null };
}
