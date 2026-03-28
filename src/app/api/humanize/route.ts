import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { sanitizeString } from '@/lib/sanitize';
import { handleAnthropicError } from '@/lib/parseAIResponse';

const client = new Anthropic();

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const text = sanitizeString(body.text, 20000);
    const triggers = Array.isArray(body.triggers) ? body.triggers.slice(0, 20) : [];
    const context = sanitizeString(body.context || '', 500);

    if (!text) return NextResponse.json({ error: 'No text provided' }, { status: 400 });

    const message = await client.messages.create({
      model: process.env.CLAUDE_MODEL || 'claude-sonnet-4-20250514',
      temperature: 0.4,
      max_tokens: 2000,
      messages: [
        {
          role: 'user',
          content: `You are a writing editor. Your job is to make this RFP response sound more human and natural WITHOUT changing the facts or meaning.

CURRENT TEXT:
${text}

AI DETECTION TRIGGERS FOUND:
${triggers.join(', ')}

CONTEXT: ${context}

RULES FOR HUMANIZING:
1. Break long sentences (40+ words) into 2-3 shorter ones
2. Replace em-dashes (—) with periods or commas where natural
3. Remove filler words: "comprehensive", "robust", "seamless", "holistic", "cutting-edge", "state-of-the-art", "best-in-class", "world-class", "industry-leading"
4. Replace "utilize" with "use", "facilitate" with "help", "leverage" with "use", "optimize" with "improve"
5. Remove "furthermore", "moreover", "it is worth noting", "it should be noted"
6. Convert passive voice to active where possible ("is designed to" -> "does")
7. Keep the same facts, numbers, and claims - just make the VOICE more natural
8. Write like a confident product person talking to a bank exec, not like a PR machine
9. Vary sentence openings - don't start multiple sentences the same way
10. Use concrete language over abstract: "processes 10M transactions/month" not "handles significant transaction volumes"

Output ONLY the humanized text. No preamble, no explanation.`,
        },
      ],
    });

    const result = message.content[0].type === 'text' ? message.content[0].text : '';
    return NextResponse.json({ text: result });
  } catch (error) {
    return handleAnthropicError(error, 'humanize');
  }
}
