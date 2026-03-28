import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { parseAIJson, handleAnthropicError } from '@/lib/parseAIResponse';
import { ConsistencyRequestSchema, parseBody } from '@/lib/schemas';

const client = new Anthropic();

const MAX_BODY_BYTES = 512 * 1024; // 512 KB — consistency sends many questions

export async function POST(req: NextRequest) {
  const contentLength = Number(req.headers.get('content-length') ?? 0);
  if (contentLength > MAX_BODY_BYTES) {
    return NextResponse.json({ error: 'Request too large' }, { status: 413 });
  }
  try {
    const raw = await req.json();
    const parsed = parseBody(ConsistencyRequestSchema, raw);
    if (parsed.error) return parsed.error;
    const { questions, knowledgeBase } = parsed.data;

    // Condense questions to fit within context limits
    const condensed = questions.map(
      (q: { ref: string; topic: string; category: string; bullet: string; paragraph: string }) => ({
        ref: q.ref,
        topic: q.topic,
        category: q.category,
        response: (q.bullet || q.paragraph || '').slice(0, 200),
      }),
    );

    // Chunk if needed (max ~50 per chunk)
    const chunks = [];
    for (let i = 0; i < condensed.length; i += 50) {
      chunks.push(condensed.slice(i, i + 50));
    }

    const allIssues: Array<{
      type: string;
      description: string;
      questionRefs: string[];
      severity: string;
    }> = [];

    for (const chunk of chunks) {
      const message = await client.messages.create({
        model: process.env.CLAUDE_MODEL || 'claude-sonnet-4-20250514',
        temperature: 0.4,
      max_tokens: 2000,
        messages: [
          {
            role: 'user',
            content: `Analyze these RFP responses for consistency issues. Look for contradictions, inconsistent metrics/numbers, repeated phrases used across different questions, and missing cross-references.

${knowledgeBase?.keyMetrics ? `KNOWN COMPANY METRICS:\n${knowledgeBase.keyMetrics}\n` : ''}

RESPONSES:
${JSON.stringify(chunk, null, 1)}

Return ONLY a JSON array of issues found:
[{
  "type": "contradiction" | "inconsistent_metric" | "repeated_phrase" | "missing_crossref",
  "description": "specific description of the issue",
  "questionRefs": ["ref1", "ref2"],
  "severity": "high" | "medium" | "low"
}]

If no issues found, return an empty array []. Return ONLY valid JSON.`,
          },
        ],
      });

      const content = message.content[0].type === 'text' ? message.content[0].text : '[]';
      const issues = parseAIJson<typeof allIssues>(content, [], 'consistency');
      allIssues.push(...issues);
    }

    return NextResponse.json({ issues: allIssues });
  } catch (error) {
    return handleAnthropicError(error, 'consistency');
  }
}
