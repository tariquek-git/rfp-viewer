import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic();

export async function POST(req: NextRequest) {
  try {
    const { question, field, knowledgeBase } = await req.json();

    const kbSection = knowledgeBase?.companyFacts
      ? `\nCOMPANY KNOWLEDGE BASE:\nFacts: ${knowledgeBase.companyFacts}\nMetrics: ${knowledgeBase.keyMetrics}\nDifferentiators: ${knowledgeBase.differentiators}`
      : '';

    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1500,
      messages: [
        {
          role: 'user',
          content: `You are a senior procurement committee evaluator reviewing an RFP response for a bank credit card program. Critique this response.

Category: ${question.category}
Topic: ${question.topic}
BSB Requirement: ${question.requirement}

Response (${field}):
${question[field]}

Current Confidence: ${question.confidence}
Current Committee Score: ${question.committee_score}/10
${kbSection}

Analyze this response and return ONLY a JSON object with:
{
  "strengths": ["specific strength 1", "..."],
  "weaknesses": ["specific weakness 1", "..."],
  "suggestions": ["actionable suggestion 1", "..."],
  "score": <1-10 score>
}

Be specific. Reference actual content from the response. Return ONLY valid JSON.`,
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
        : { strengths: [], weaknesses: [], suggestions: [], score: 5 };
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Critique error:', error);
    return NextResponse.json({ error: 'Failed to critique' }, { status: 500 });
  }
}
