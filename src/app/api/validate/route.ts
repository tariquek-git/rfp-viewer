import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { parseAIJson, handleAnthropicError } from '@/lib/parseAIResponse';

const client = new Anthropic();

const MAX_BODY_BYTES = 64 * 1024;

export async function POST(req: NextRequest) {
  const contentLength = Number(req.headers.get('content-length') ?? 0);
  if (contentLength > MAX_BODY_BYTES) {
    return NextResponse.json({ error: 'Request too large' }, { status: 413 });
  }
  try {
    const { text, validationRules, question, knowledgeBase } = await req.json();

    const rulesText = validationRules
      .map((r: { text: string }, i: number) => `${i + 1}. ${r.text}`)
      .join('\n');

    const message = await client.messages.create({
      model: process.env.CLAUDE_MODEL || 'claude-sonnet-4-20250514',
      temperature: 0.4,
      max_tokens: 1500,
      messages: [
        {
          role: 'user',
          content: `Check the following RFP response against validation rules. Return ONLY a JSON array.

RESPONSE TEXT:
${text}

QUESTION CONTEXT:
Category: ${question.category}
Topic: ${question.topic}
Requirement: ${question.requirement}

${knowledgeBase?.companyFacts ? `COMPANY FACTS:\n${knowledgeBase.companyFacts}` : ''}

VALIDATION RULES:
${rulesText}

For each rule, return a JSON object with:
- "rule": the rule text
- "passed": true/false
- "message": brief explanation
- "severity": "error" or "warning"

Return ONLY a valid JSON array, no other text.`,
        },
      ],
    });

    const content = message.content[0].type === 'text' ? message.content[0].text : '[]';
    const results = parseAIJson(content, [], 'validate');

    return NextResponse.json({ results });
  } catch (error) {
    return handleAnthropicError(error, 'validate');
  }
}
