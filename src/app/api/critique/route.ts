import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { parseAIJson, handleAnthropicError } from '@/lib/parseAIResponse';
import { CritiqueRequestSchema, parseBody } from '@/lib/schemas';
import { getBannedWords, getFormatBans } from '@/lib/knowledge';
import { audienceSection } from '@/lib/audience';
import { dealContextSection } from '@/lib/dealContextPrompt';

const client = new Anthropic();

const MAX_BODY_BYTES = 64 * 1024;

export async function POST(req: NextRequest) {
  const contentLength = Number(req.headers.get('content-length') ?? 0);
  if (contentLength > MAX_BODY_BYTES) {
    return NextResponse.json({ error: 'Request too large' }, { status: 413 });
  }
  try {
    const raw = await req.json();
    const parsed = parseBody(CritiqueRequestSchema, raw);
    if (parsed.error) return parsed.error;
    const { question, field, knowledgeBase, dealContext } = parsed.data;

    const kbSection = knowledgeBase?.companyFacts
      ? `\nCOMPANY KNOWLEDGE BASE:\nFacts: ${knowledgeBase.companyFacts}\nMetrics: ${knowledgeBase.keyMetrics}\nDifferentiators: ${knowledgeBase.differentiators}`
      : '';

    const bannedWords = getBannedWords();
    const formatBansList = getFormatBans()
      .map((b) => `- ${b.directive}`)
      .join('\n');
    const guardrailsSection = bannedWords.length
      ? `\nBRIM GUARDRAILS (flag any violations as weaknesses):
- Banned words: ${bannedWords.join(', ')}
${formatBansList}`
      : '';

    const audienceFraming = audienceSection(question.category);
    const dealFraming = dealContextSection(dealContext, question.category);

    const message = await client.messages.create({
      model: process.env.CLAUDE_MODEL || 'claude-sonnet-4-20250514',
      temperature: 0.4,
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
${dealFraming}
${audienceFraming}
${kbSection}${guardrailsSection}

Evaluate the response against the audience framing above — does it speak to that evaluator? Then analyze and return ONLY a JSON object with:
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
    const result = parseAIJson(
      content,
      { strengths: [], weaknesses: [], suggestions: [], score: 5 },
      'critique',
    );

    return NextResponse.json(result);
  } catch (error) {
    return handleAnthropicError(error, 'critique');
  }
}
