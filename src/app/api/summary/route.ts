import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { parseAIJson, handleAnthropicError } from '@/lib/parseAIResponse';
import { SummaryRequestSchema, parseBody } from '@/lib/schemas';

const client = new Anthropic();

const MAX_BODY_BYTES = 512 * 1024;

export async function POST(req: NextRequest) {
  const contentLength = Number(req.headers.get('content-length') ?? 0);
  if (contentLength > MAX_BODY_BYTES) {
    return NextResponse.json({ error: 'Request too large' }, { status: 413 });
  }
  try {
    const raw = await req.json();
    const parsed = parseBody(SummaryRequestSchema, raw);
    if (parsed.error) return parsed.error;
    const { questions, stats, knowledgeBase } = parsed.data;

    // Condense the data
    const condensed = questions.map(
      (q: {
        ref: string;
        topic: string;
        confidence: string;
        committee_score: number;
        bullet: string;
      }) => ({
        ref: q.ref,
        topic: q.topic,
        confidence: q.confidence,
        score: q.committee_score,
        response: (q.bullet || '').slice(0, 100),
      }),
    );

    const kbSection = knowledgeBase?.companyFacts
      ? `COMPANY KNOWLEDGE BASE:
Facts: ${knowledgeBase.companyFacts}
Metrics: ${knowledgeBase.keyMetrics}
Differentiators: ${knowledgeBase.differentiators}
Positioning: ${knowledgeBase.competitivePositioning}`
      : '';

    const message = await client.messages.create({
      model: process.env.CLAUDE_MODEL || 'claude-sonnet-4-20250514',
      temperature: 0.4,
      max_tokens: 3000,
      messages: [
        {
          role: 'user',
          content: `Generate an executive summary for Brim Financial's RFP response to Bangor Savings Bank's credit card program.

STATS:
- Total Questions: ${stats.total}
- Green (Strong): ${stats.green}
- Yellow (Needs Work): ${stats.yellow}
- Red (Gaps): ${stats.red}
- Compliant: ${stats.compliant_y} Y, ${stats.compliant_partial} Partial, ${stats.compliant_n} N

${kbSection}

RESPONSE SUMMARY (condensed):
${JSON.stringify(condensed.slice(0, 60), null, 1)}

Generate a JSON object with:
{
  "coverLetter": "A professional cover letter (3-4 paragraphs) from Brim Financial to BSB's procurement committee",
  "strengthsSummary": "Key strengths of Brim's proposal (bullet-point style, 5-8 points)",
  "riskAreas": "Areas of risk or weakness that BSB may challenge (bullet-point style, 3-5 points)",
  "recommendation": "Strategic recommendation for strengthening the proposal (2-3 paragraphs)"
}

Return ONLY valid JSON.`,
        },
      ],
    });

    const content = message.content[0].type === 'text' ? message.content[0].text : '{}';
    const result = parseAIJson(content, {
      coverLetter: 'Failed to generate',
      strengthsSummary: 'Failed to generate',
      riskAreas: 'Failed to generate',
      recommendation: 'Failed to generate',
    }, 'summary');

    return NextResponse.json(result);
  } catch (error) {
    return handleAnthropicError(error, 'summary');
  }
}
