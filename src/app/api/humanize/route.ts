import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { sanitizeString } from '@/lib/sanitize';
import { handleAnthropicError } from '@/lib/parseAIResponse';
import { HumanizeRequestSchema, parseBody } from '@/lib/schemas';
import { getBannedWords } from '@/lib/knowledge';
import { logAICall } from '@/lib/aiLog';

const client = new Anthropic();

const MAX_BODY_BYTES = 128 * 1024;
const MODEL = process.env.CLAUDE_MODEL || 'claude-sonnet-4-20250514';
const ROUTE = 'humanize';

function buildStaticSystemBlock(): string {
  const banned = getBannedWords();
  const fillerLine =
    banned.length > 0
      ? `Remove filler words: ${banned.map((w) => `"${w}"`).join(', ')}`
      : 'Remove filler words: "comprehensive", "robust", "seamless", "holistic", "cutting-edge", "state-of-the-art", "best-in-class", "world-class", "industry-leading"';

  return `You are a writing editor. Make RFP responses sound more human and natural WITHOUT changing facts or meaning.

RULES FOR HUMANIZING:
1. Break long sentences (40+ words) into 2-3 shorter ones
2. Replace em-dashes (—) with periods or commas where natural
3. ${fillerLine}
4. Replace "utilize" with "use", "facilitate" with "help", "leverage" with "use", "optimize" with "improve"
5. Remove "furthermore", "moreover", "it is worth noting", "it should be noted"
6. Convert passive voice to active where possible ("is designed to" -> "does")
7. Keep the same facts, numbers, and claims — just make the VOICE more natural
8. Write like a confident product person talking to a bank exec, not like a PR machine
9. Vary sentence openings — don't start multiple sentences the same way
10. Use concrete language over abstract: "processes 10M transactions/month" not "handles significant transaction volumes"

Output ONLY the humanized text. No preamble, no explanation.`;
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
    const parsedBody = parseBody(HumanizeRequestSchema, raw);
    if (parsedBody.error) return parsedBody.error;
    const text = sanitizeString(parsedBody.data.text, 20000);
    const triggers = parsedBody.data.triggers;
    const context = sanitizeString(parsedBody.data.context, 500);

    if (!text) return NextResponse.json({ error: 'No text provided' }, { status: 400 });

    const userPrompt = `CURRENT TEXT:
${text}

AI DETECTION TRIGGERS FOUND:
${triggers.join(', ')}

CONTEXT: ${context}

Humanize the text per the rules. Output ONLY the rewritten text.`;

    const message = await client.messages.create({
      model: MODEL,
      temperature: 0.4,
      max_tokens: 2000,
      system: [
        {
          type: 'text',
          text: STATIC_SYSTEM_BLOCK,
          cache_control: { type: 'ephemeral' },
        },
      ],
      messages: [{ role: 'user', content: userPrompt }],
    });

    const result = message.content[0].type === 'text' ? message.content[0].text : '';

    logAICall({
      route: ROUTE,
      model: message.model,
      latencyMs: performance.now() - t0,
      usage: message.usage,
      success: true,
      meta: {
        text_len: text.length,
        triggers_count: triggers.length,
      },
    });

    return NextResponse.json({ text: result });
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
