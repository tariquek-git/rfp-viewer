import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { parseAIJson, handleAnthropicError } from '@/lib/parseAIResponse';
import { ScoreRequestSchema, parseBody } from '@/lib/schemas';

const client = new Anthropic();

const MAX_BODY_BYTES = 64 * 1024;

export async function POST(req: NextRequest) {
  const contentLength = Number(req.headers.get('content-length') ?? 0);
  if (contentLength > MAX_BODY_BYTES) {
    return NextResponse.json({ error: 'Request too large' }, { status: 413 });
  }
  try {
    const raw = await req.json();
    const parsed = parseBody(ScoreRequestSchema, raw);
    if (parsed.error) return parsed.error;
    const { question, knowledgeBase } = parsed.data;

    const kbSection = knowledgeBase?.companyFacts
      ? `\nCOMPANY CONTEXT:\nFacts: ${knowledgeBase.companyFacts}\nMetrics: ${knowledgeBase.keyMetrics}`
      : '';

    const message = await client.messages.create({
      model: process.env.CLAUDE_MODEL || 'claude-sonnet-4-20250514',
      temperature: 0.4,
      max_tokens: 1500,
      messages: [
        {
          role: 'user',
          content: `You are a senior bank procurement committee member evaluating an RFP response for a credit card program. Score this response.

Category: ${question.category}
Topic: ${question.topic}
BSB Requirement: ${question.requirement}

Response (Bullet): ${question.bullet}
Response (Paragraph): ${question.paragraph}

Delivery: ${question.a_oob ? 'OOB' : ''} ${question.b_config ? 'Config' : ''} ${question.c_custom ? 'Custom' : ''}
Compliant: ${question.compliant}
${kbSection}

Evaluate from a procurement committee perspective and return ONLY a JSON object:
{
  "committee_score": <1-10>,
  "committee_review": "<2-3 sentence evaluation>",
  "committee_risk": "<1-2 sentence risk assessment>"
}

Return ONLY valid JSON.`,
        },
      ],
    });

    const content = message.content[0].type === 'text' ? message.content[0].text : '{}';
    const result = parseAIJson(content, { committee_score: 5, committee_review: '', committee_risk: '' }, 'score');

    return NextResponse.json(result);
  } catch (error) {
    return handleAnthropicError(error, 'score');
  }
}
