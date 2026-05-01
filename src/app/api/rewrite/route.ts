import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import {
  sanitizeQuestionForAI,
  validateField,
  sanitizeRules,
  sanitizeString,
} from '@/lib/sanitize';
import { handleAnthropicError } from '@/lib/parseAIResponse';
import { RewriteRequestSchema, parseBody } from '@/lib/schemas';
import { getBannedWords, getFormatBans } from '@/lib/knowledge';
import { deriveAudience, audienceGuidance, type Audience } from '@/lib/audience';
import { dealContextSection } from '@/lib/dealContextPrompt';
import { logAICall } from '@/lib/aiLog';

const client = new Anthropic();

const MAX_BODY_BYTES = 64 * 1024;
const MODEL = process.env.CLAUDE_MODEL || 'claude-sonnet-4-20250514';
const ROUTE = 'rewrite';

/**
 * Static content cached across calls (5-min TTL ephemeral cache).
 * Includes BRIM identity, banned words, format bans, format options, and
 * all four audience-framing blocks. The user message says which audience
 * and format to apply.
 */
function buildStaticSystemBlock(): string {
  const banned = getBannedWords();
  const formatBans = getFormatBans()
    .map((b) => `- ${b.directive}`)
    .join('\n');
  const bannedLine = banned.length ? `- Do NOT use words: ${banned.join(', ')}` : '';

  const audienceList = (['compliance', 'it', 'business', 'general'] as Audience[])
    .map((a) => `### audience=${a}\n${audienceGuidance(a)}`)
    .join('\n\n');

  return `You are helping Brim Financial write a winning RFP response for a bank's credit card program. Follow the rules and audience framing below precisely.

FORMAT OPTIONS (the user message specifies which to use):
- BULLET: clear, scannable bullet points that a procurement committee can quickly evaluate.
- PARAGRAPH: polished, professional prose suitable for a formal RFP submission.

RULES:
- Be specific with data points and metrics from the knowledge base only
- Directly address the bank's requirement
- Highlight Brim's competitive advantages
- Address any gaps or risks identified
- Do NOT fabricate statistics, client names, or metrics not in the knowledge base
${bannedLine}
${formatBans}
- Sound confident without being vague

AUDIENCE FRAMING — apply the block matching the audience tag in the user message:

${audienceList}`;
}

const STATIC_SYSTEM_BLOCK = buildStaticSystemBlock();

export async function POST(req: NextRequest) {
  const t0 = performance.now();
  const contentLength = Number(req.headers.get('content-length') ?? 0);
  if (contentLength > MAX_BODY_BYTES) {
    return NextResponse.json({ error: 'Request too large' }, { status: 413 });
  }
  try {
    const raw = await req.json();
    const parsed = parseBody(RewriteRequestSchema, raw);
    if (parsed.error) return parsed.error;
    const {
      field: rawField,
      globalRules: rawRules,
      rowRules: rawRowRules,
      feedback,
      knowledgeBase,
      dealContext,
    } = parsed.data;
    const question = sanitizeQuestionForAI(parsed.data.question);
    const field = validateField(rawField);
    if (!field) return NextResponse.json({ error: 'Invalid field' }, { status: 400 });
    const globalRules = sanitizeRules(rawRules);
    const rowRules = sanitizeString(rawRowRules, 2000);

    const categoryStr = String(question.category ?? '');
    const audience = deriveAudience(categoryStr);

    // ── System: cached static + cached deal context (per-deal) ──
    const systemBlocks: Anthropic.TextBlockParam[] = [
      {
        type: 'text',
        text: STATIC_SYSTEM_BLOCK,
        cache_control: { type: 'ephemeral' },
      },
    ];
    const dealText = dealContextSection(dealContext, categoryStr);
    if (dealText.trim()) {
      systemBlocks.push({
        type: 'text',
        text: dealText,
        cache_control: { type: 'ephemeral' },
      });
    }

    // ── User: per-call dynamic content ──
    const kbSection = knowledgeBase?.companyFacts
      ? `\n\nCOMPANY KNOWLEDGE BASE (use these facts — do not fabricate metrics):
Company Facts: ${knowledgeBase.companyFacts}
Key Metrics: ${knowledgeBase.keyMetrics}
Differentiators: ${knowledgeBase.differentiators}
Competitive Positioning: ${knowledgeBase.competitivePositioning}`
      : '';

    const globalRulesSection = globalRules?.length
      ? `\n\nGLOBAL WRITING RULES (apply to all questions):\n${globalRules.map((r: string, i: number) => `${i + 1}. ${r}`).join('\n')}`
      : '';

    const rowRulesSection = rowRules?.trim()
      ? `\n\nROW-SPECIFIC RULES (apply to this question only):\n${rowRules}`
      : '';

    const feedbackSection = feedback?.length
      ? `\n\nHUMAN FEEDBACK (address these in your rewrite):\n${feedback.map((f: { field: string; comment: string }) => `- [${f.field}] ${f.comment}`).join('\n')}`
      : '';

    const userPrompt = `<question_context>
<category>${question.category}</category>
<topic>${question.topic}</topic>
<bsb_requirement>${question.requirement}</bsb_requirement>
</question_context>

audience=${audience}
format=${field}

<current_response format="${field}">
${question[field]}
</current_response>

<scoring>
Confidence: ${question.confidence}
Score: ${question.committee_score}/10
Risk: ${question.committee_risk || 'N/A'}
Rationale: ${question.rationale || 'N/A'}
</scoring>${kbSection}${globalRulesSection}${rowRulesSection}${feedbackSection}

Rewrite the response in the ${field === 'bullet' ? 'BULLET' : 'PARAGRAPH'} format, applying the audience=${audience} framing block from the system. Output ONLY the rewritten response text, no preamble or explanation.`;

    const timeout = AbortSignal.timeout(30_000);
    const message = await client.messages.create(
      {
        model: MODEL,
        temperature: 0.4,
        max_tokens: 2000,
        system: systemBlocks,
        messages: [{ role: 'user', content: userPrompt }],
      },
      { signal: timeout },
    );

    const text = message.content[0].type === 'text' ? message.content[0].text : '';

    logAICall({
      route: ROUTE,
      model: message.model,
      latencyMs: performance.now() - t0,
      usage: message.usage,
      success: true,
      meta: {
        ref: String(question.ref ?? ''),
        field,
        audience,
        deal_context_len: dealText.length,
      },
    });

    if (text.length < 50) {
      return NextResponse.json(
        { error: 'AI output too short — may be incomplete. Try again.' },
        { status: 422 },
      );
    }
    if (text.length > 10000) {
      return NextResponse.json({
        text: text.slice(0, 10000),
        model: message.model,
        usage: message.usage,
        warning: 'Output truncated to 10K chars',
      });
    }

    return NextResponse.json({ text, model: message.model, usage: message.usage });
  } catch (error) {
    logAICall({
      route: ROUTE,
      model: MODEL,
      latencyMs: performance.now() - t0,
      success: false,
      error: error instanceof Error ? error.message : String(error),
    });
    if (error instanceof Error && error.name === 'TimeoutError') {
      return NextResponse.json(
        { error: 'AI request timed out after 30s — try again' },
        { status: 504 },
      );
    }
    return handleAnthropicError(error, 'rewrite');
  }
}
