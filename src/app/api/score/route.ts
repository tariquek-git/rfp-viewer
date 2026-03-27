import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic();

export async function POST(req: NextRequest) {
  try {
    const { question, knowledgeBase } = await req.json();

    const kbSection = knowledgeBase?.companyFacts
      ? `\nCOMPANY CONTEXT:\nFacts: ${knowledgeBase.companyFacts}\nMetrics: ${knowledgeBase.keyMetrics}`
      : '';

    const message = await client.messages.create({
      model: process.env.CLAUDE_MODEL || 'claude-sonnet-4-20250514',
      temperature: 0.4,
      max_tokens: 1000,
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
    let result;
    try {
      result = JSON.parse(content);
    } catch {
      const match = content.match(/\{[\s\S]*\}/);
      result = match
        ? JSON.parse(match[0])
        : { committee_score: 5, committee_review: '', committee_risk: '' };
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Score error:', error);
    return NextResponse.json({ error: 'Failed to score' }, { status: 500 });
  }
}
