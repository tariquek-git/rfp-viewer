import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

export async function POST(req: NextRequest) {
  try {
    const { text, validationRules, question, knowledgeBase } = await req.json();

    const rulesText = validationRules.map((r: { text: string }, i: number) => `${i + 1}. ${r.text}`).join("\n");

    const message = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      messages: [{
        role: "user",
        content: `Check the following RFP response against validation rules. Return ONLY a JSON array.

RESPONSE TEXT:
${text}

QUESTION CONTEXT:
Category: ${question.category}
Topic: ${question.topic}
Requirement: ${question.requirement}

${knowledgeBase?.companyFacts ? `COMPANY FACTS:\n${knowledgeBase.companyFacts}` : ""}

VALIDATION RULES:
${rulesText}

For each rule, return a JSON object with:
- "rule": the rule text
- "passed": true/false
- "message": brief explanation
- "severity": "error" or "warning"

Return ONLY a valid JSON array, no other text.`,
      }],
    });

    const content = message.content[0].type === "text" ? message.content[0].text : "[]";
    let results;
    try {
      results = JSON.parse(content);
    } catch {
      // Try to extract JSON from response
      const match = content.match(/\[[\s\S]*\]/);
      results = match ? JSON.parse(match[0]) : [];
    }

    return NextResponse.json({ results });
  } catch (error) {
    console.error("Validation error:", error);
    return NextResponse.json({ results: [] }, { status: 500 });
  }
}
