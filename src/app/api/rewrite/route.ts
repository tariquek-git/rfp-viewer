import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

export async function POST(req: NextRequest) {
  try {
    const { question, field, globalRules, rowRules, feedback, knowledgeBase } = await req.json();

    const formatInstruction = field === "bullet"
      ? "Respond in bullet-point format. Use clear, scannable bullet points that a procurement committee can quickly evaluate."
      : "Respond in polished paragraph format. Write fluent, professional prose suitable for a formal RFP submission.";

    const globalRulesSection = globalRules?.length
      ? `\n\nGLOBAL WRITING RULES (apply to all questions):\n${globalRules.map((r: string, i: number) => `${i + 1}. ${r}`).join("\n")}`
      : "";

    const rowRulesSection = rowRules?.trim()
      ? `\n\nROW-SPECIFIC RULES (apply to this question only):\n${rowRules}`
      : "";

    const feedbackSection = feedback?.length
      ? `\n\nHUMAN FEEDBACK (address these in your rewrite):\n${feedback.map((f: { field: string; comment: string }) => `- [${f.field}] ${f.comment}`).join("\n")}`
      : "";

    const kbSection = knowledgeBase?.companyFacts
      ? `\n\nCOMPANY KNOWLEDGE BASE (use these facts — do not fabricate metrics):
Company Facts: ${knowledgeBase.companyFacts}
Key Metrics: ${knowledgeBase.keyMetrics}
Differentiators: ${knowledgeBase.differentiators}
Competitive Positioning: ${knowledgeBase.competitivePositioning}`
      : "";

    const message = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2000,
      messages: [{
        role: "user",
        content: `You are helping Brim Financial write a winning RFP response for Bangor Savings Bank's credit card program.

Category: ${question.category}
Topic: ${question.topic}
BSB Requirement: ${question.requirement}

Current Response (${field}):
${question[field]}

Confidence Level: ${question.confidence}
Committee Score: ${question.committee_score}/10
Committee Risk Assessment: ${question.committee_risk || "N/A"}
Rationale: ${question.rationale || "N/A"}

${formatInstruction}

Core objectives:
- Be specific with data points and metrics
- Directly address BSB's requirement
- Highlight Brim's competitive advantages
- Address any gaps or risks identified
- Sound confident and authoritative without being vague${kbSection}${globalRulesSection}${rowRulesSection}${feedbackSection}

Rewrite the response. Output ONLY the rewritten response text, no preamble or explanation.`,
      }],
    });

    const text = message.content[0].type === "text" ? message.content[0].text : "";
    return NextResponse.json({ text, model: message.model, usage: message.usage });
  } catch (error) {
    console.error("AI rewrite error:", error);
    return NextResponse.json({ error: "Failed to rewrite" }, { status: 500 });
  }
}
