import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic();

export async function POST(req: NextRequest) {
  try {
    const { questions, winThemes, knowledgeBase } = await req.json();

    const condensed = questions.map(
      (q: { ref: string; category: string; bullet: string; paragraph: string }) => ({
        ref: q.ref,
        category: q.category,
        response: (q.paragraph || q.bullet || '').slice(0, 150),
      }),
    );

    const themesText = winThemes?.length
      ? `WIN THEMES:\n${winThemes.map((t: { title: string; description: string }) => `- ${t.title}: ${t.description}`).join('\n')}`
      : 'No win themes defined.';

    const kbText = knowledgeBase?.companyFacts
      ? `COMPANY FACTS:\n${knowledgeBase.companyFacts}\nMETRICS:\n${knowledgeBase.keyMetrics}`
      : '';

    const message = await client.messages.create({
      model: process.env.CLAUDE_MODEL || 'claude-sonnet-4-20250514',
      temperature: 0.4,
      max_tokens: 3000,
      messages: [
        {
          role: 'user',
          content: `You are a proposal quality auditor reviewing an RFP response for narrative consistency and quality. Analyze these condensed responses.

${themesText}

${kbText}

RESPONSES (condensed, first 150 chars each):
${JSON.stringify(condensed.slice(0, 80), null, 1)}

Analyze for:
1. Voice consistency - do responses sound like one author or many?
2. Win theme alignment - which themes are well-covered vs missing?
3. Generic language - find phrases like "industry-leading", "best-in-class", "robust" used without proof
4. Story breaks - where the narrative contradicts itself or loses coherence

Return ONLY a JSON object:
{
  "overallScore": <1-10>,
  "voiceConsistency": "<2-3 sentence assessment>",
  "themeAlignment": [{"theme": "theme name", "coverage": <0-100>, "gaps": ["specific gap 1"]}],
  "genericLanguage": [{"ref": "question ref", "phrase": "the generic phrase", "suggestion": "what to replace it with"}],
  "storyBreaks": [{"description": "what breaks", "refs": ["ref1", "ref2"]}],
  "recommendation": "<2-3 sentence overall recommendation>"
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
        : {
            overallScore: 5,
            voiceConsistency: 'Unable to assess',
            themeAlignment: [],
            genericLanguage: [],
            storyBreaks: [],
            recommendation: 'Unable to generate',
          };
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Narrative audit error:', error);
    return NextResponse.json({ error: 'Failed to audit' }, { status: 500 });
  }
}
