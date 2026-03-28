import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import {
  sanitizeQuestionForAI,
  validateField,
  sanitizeRules,
  sanitizeString,
} from '@/lib/sanitize';
import { handleAnthropicError } from '@/lib/parseAIResponse';

const client = new Anthropic();

const MAX_BODY_BYTES = 64 * 1024; // 64 KB

export async function POST(req: NextRequest) {
  const contentLength = Number(req.headers.get('content-length') ?? 0);
  if (contentLength > MAX_BODY_BYTES) {
    return NextResponse.json({ error: 'Request too large' }, { status: 413 });
  }
  try {
    const body = await req.json();
    const question = sanitizeQuestionForAI(body.question || {});
    const field = validateField(body.field);
    if (!field) return NextResponse.json({ error: 'Invalid field' }, { status: 400 });
    const globalRules = sanitizeRules(body.globalRules);
    const rowRules = sanitizeString(body.rowRules, 2000);
    const feedback = Array.isArray(body.feedback) ? body.feedback.slice(0, 20) : [];
    const knowledgeBase = body.knowledgeBase || {};

    const formatInstruction =
      field === 'bullet'
        ? 'Respond in bullet-point format. Use clear, scannable bullet points that a procurement committee can quickly evaluate.'
        : 'Respond in polished paragraph format. Write fluent, professional prose suitable for a formal RFP submission.';

    const globalRulesSection = globalRules?.length
      ? `\n\nGLOBAL WRITING RULES (apply to all questions):\n${globalRules.map((r: string, i: number) => `${i + 1}. ${r}`).join('\n')}`
      : '';

    const rowRulesSection = rowRules?.trim()
      ? `\n\nROW-SPECIFIC RULES (apply to this question only):\n${rowRules}`
      : '';

    const feedbackSection = feedback?.length
      ? `\n\nHUMAN FEEDBACK (address these in your rewrite):\n${feedback.map((f: { field: string; comment: string }) => `- [${f.field}] ${f.comment}`).join('\n')}`
      : '';

    const kbSection = knowledgeBase?.companyFacts
      ? `\n\nCOMPANY KNOWLEDGE BASE (use these facts — do not fabricate metrics):
Company Facts: ${knowledgeBase.companyFacts}
Key Metrics: ${knowledgeBase.keyMetrics}
Differentiators: ${knowledgeBase.differentiators}
Competitive Positioning: ${knowledgeBase.competitivePositioning}`
      : '';

    const message = await client.messages.create({
      model: process.env.CLAUDE_MODEL || 'claude-sonnet-4-20250514',
      temperature: 0.4,
      max_tokens: 2000,
      messages: [
        {
          role: 'user',
          content: `You are helping Brim Financial write a winning RFP response for Bangor Savings Bank's credit card program.

<question_context>
<category>${question.category}</category>
<topic>${question.topic}</topic>
<bsb_requirement>${question.requirement}</bsb_requirement>
</question_context>

<current_response format="${field}">
${question[field]}
</current_response>

<scoring>
Confidence: ${question.confidence}
Score: ${question.committee_score}/10
Risk: ${question.committee_risk || 'N/A'}
Rationale: ${question.rationale || 'N/A'}
</scoring>

${formatInstruction}

RULES:
- Be specific with data points and metrics from the knowledge base only
- Directly address BSB's requirement
- Highlight Brim's competitive advantages
- Address any gaps or risks identified
- Do NOT fabricate statistics, client names, or metrics not in the knowledge base
- Do NOT use words: comprehensive, robust, seamless, leverage, utilize, cutting-edge, ecosystem
- Sound confident without being vague${kbSection}${globalRulesSection}${rowRulesSection}${feedbackSection}

Rewrite the response. Output ONLY the rewritten response text, no preamble or explanation.`,
        },
      ],
    });

    const text = message.content[0].type === 'text' ? message.content[0].text : '';

    // Output validation
    if (text.length < 50) {
      return NextResponse.json({ error: 'AI output too short — may be incomplete. Try again.' }, { status: 422 });
    }
    if (text.length > 10000) {
      return NextResponse.json({ text: text.slice(0, 10000), model: message.model, usage: message.usage, warning: 'Output truncated to 10K chars' });
    }

    return NextResponse.json({ text, model: message.model, usage: message.usage });
  } catch (error) {
    return handleAnthropicError(error, 'rewrite');
  }
}
