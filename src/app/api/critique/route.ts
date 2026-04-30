import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { parseAIJson, handleAnthropicError } from '@/lib/parseAIResponse';
import { CritiqueRequestSchema, parseBody } from '@/lib/schemas';
import { getBannedWords, getFormatBans } from '@/lib/knowledge';
import { deriveAudience, audienceGuidance, type Audience } from '@/lib/audience';
import { dealContextSection } from '@/lib/dealContextPrompt';
import { logAICall } from '@/lib/aiLog';

const client = new Anthropic();

const MAX_BODY_BYTES = 64 * 1024;
const MODEL = process.env.CLAUDE_MODEL || 'claude-sonnet-4-20250514';
const ROUTE = 'critique';

function buildStaticSystemBlock(): string {
  const banned = getBannedWords();
  const formatBans = getFormatBans()
    .map((b) => `- ${b.directive}`)
    .join('\n');
  const bannedLine = banned.length ? `- Banned words: ${banned.join(', ')}` : '';

  const audienceList = (['compliance', 'it', 'business', 'general'] as Audience[])
    .map((a) => `### audience=${a}\n${audienceGuidance(a)}`)
    .join('\n\n');

  return `You are a senior procurement committee evaluator reviewing an RFP response for a bank credit card program. Your job is to critique the response and grade it 1-10 against both the audience framing and the BRIM guardrails below.

BRIM GUARDRAILS (flag any violations as weaknesses):
${bannedLine}
${formatBans}

AUDIENCE FRAMING — the user message will tell you which audience applies:

${audienceList}

Your output must be ONLY a JSON object:
{
  "strengths": ["specific strength 1", "..."],
  "weaknesses": ["specific weakness 1", "..."],
  "suggestions": ["actionable suggestion 1", "..."],
  "score": <1-10 score>
}

Be specific. Reference actual content from the response. Return ONLY valid JSON, no preamble.`;
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
    const parsed = parseBody(CritiqueRequestSchema, raw);
    if (parsed.error) return parsed.error;
    const { question, field, knowledgeBase, dealContext } = parsed.data;

    const audience = deriveAudience(question.category);

    const systemBlocks: Anthropic.TextBlockParam[] = [
      {
        type: 'text',
        text: STATIC_SYSTEM_BLOCK,
        cache_control: { type: 'ephemeral' },
      },
    ];
    const dealText = dealContextSection(dealContext, question.category);
    if (dealText.trim()) {
      systemBlocks.push({
        type: 'text',
        text: dealText,
        cache_control: { type: 'ephemeral' },
      });
    }

    const kbSection = knowledgeBase?.companyFacts
      ? `\nCOMPANY KNOWLEDGE BASE:\nFacts: ${knowledgeBase.companyFacts}\nMetrics: ${knowledgeBase.keyMetrics}\nDifferentiators: ${knowledgeBase.differentiators}`
      : '';

    const userPrompt = `Critique this response.

Category: ${question.category}
Topic: ${question.topic}
Requirement: ${question.requirement}
audience=${audience}

Response (${field}):
${question[field]}

Current Confidence: ${question.confidence}
Current Committee Score: ${question.committee_score}/10
${kbSection}

Evaluate against the audience=${audience} framing and the BRIM guardrails. Return ONLY a JSON object.`;

    const message = await client.messages.create({
      model: MODEL,
      temperature: 0.4,
      max_tokens: 1500,
      system: systemBlocks,
      messages: [{ role: 'user', content: userPrompt }],
    });

    const content = message.content[0].type === 'text' ? message.content[0].text : '{}';
    const result = parseAIJson(
      content,
      { strengths: [], weaknesses: [], suggestions: [], score: 5 },
      ROUTE,
    );

    logAICall({
      route: ROUTE,
      model: message.model,
      latencyMs: performance.now() - t0,
      usage: message.usage,
      success: true,
      meta: {
        ref: question.ref,
        field,
        audience,
        deal_context_len: dealText.length,
      },
    });

    return NextResponse.json(result);
  } catch (error) {
    logAICall({
      route: ROUTE,
      model: MODEL,
      latencyMs: performance.now() - t0,
      success: false,
      error: error instanceof Error ? error.message : String(error),
    });
    return handleAnthropicError(error, ROUTE);
  }
}
