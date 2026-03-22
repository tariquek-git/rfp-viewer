import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  WidthType, AlignmentType, HeadingLevel, BorderStyle, ShadingType,
  PageBreak, Header, Footer, TabStopPosition, TabStopType,
} from "docx";
import { saveAs } from "file-saver";
import type { Question, RFPData } from "@/types";
import { detectAIWriting, aiDetectLabel } from "@/lib/aiDetect";

const COLORS = {
  green: "10B981", greenBg: "ECFDF5", greenText: "047857",
  yellow: "F59E0B", yellowBg: "FFFBEB", yellowText: "B45309",
  red: "EF4444", redBg: "FEF2F2", redText: "B91C1C",
  blue: "2563EB", blueBg: "EFF6FF",
  gray: "6B7280", grayBg: "F9FAFB", grayLight: "E5E7EB",
  dark: "111827", medium: "374151", light: "9CA3AF",
};

function confidenceColor(c: string) {
  if (c === "GREEN") return { bg: COLORS.greenBg, text: COLORS.greenText, label: "GREEN - Strong" };
  if (c === "YELLOW") return { bg: COLORS.yellowBg, text: COLORS.yellowText, label: "YELLOW - Needs Strengthening" };
  if (c === "RED") return { bg: COLORS.redBg, text: COLORS.redText, label: "RED - Gap/Risk" };
  return { bg: COLORS.grayBg, text: COLORS.gray, label: c };
}

function scoreColor(score: number) {
  if (score >= 7) return COLORS.greenText;
  if (score >= 5) return COLORS.yellowText;
  return COLORS.redText;
}

function makeCell(text: string, options?: { bold?: boolean; color?: string; bg?: string; width?: number; alignment?: (typeof AlignmentType)[keyof typeof AlignmentType] }) {
  return new TableCell({
    width: options?.width ? { size: options.width, type: WidthType.PERCENTAGE } : undefined,
    shading: options?.bg ? { type: ShadingType.SOLID, color: options.bg } : undefined,
    children: [new Paragraph({
      alignment: options?.alignment,
      children: [new TextRun({ text, bold: options?.bold, color: options?.color || COLORS.dark, size: 18, font: "Calibri" })],
    })],
  });
}

export async function exportToWord(data: RFPData) {
  const questions = data.questions;
  const categories = data.categories;

  // Stats
  const green = questions.filter(q => q.confidence === "GREEN").length;
  const yellow = questions.filter(q => q.confidence === "YELLOW").length;
  const red = questions.filter(q => q.confidence === "RED").length;
  const avgScore = (questions.reduce((s, q) => s + (q.committee_score || 0), 0) / questions.length).toFixed(1);
  const compliantY = questions.filter(q => q.compliant === "Y").length;

  const sections: (Paragraph | Table)[] = [];

  // === COVER PAGE ===
  sections.push(
    new Paragraph({ spacing: { before: 3000 } }),
    new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "CONFIDENTIAL", size: 16, color: COLORS.light, font: "Calibri", allCaps: true, characterSpacing: 200 })] }),
    new Paragraph({ spacing: { before: 600 }, alignment: AlignmentType.CENTER, children: [new TextRun({ text: "BSB Credit Card Program", size: 56, bold: true, color: COLORS.dark, font: "Calibri" })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Request for Proposal Response", size: 32, color: COLORS.gray, font: "Calibri" })] }),
    new Paragraph({ spacing: { before: 800 }, alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Prepared by Brim Financial", size: 24, color: COLORS.medium, font: "Calibri" })] }),
    new Paragraph({ spacing: { before: 400 }, alignment: AlignmentType.CENTER, children: [new TextRun({ text: new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }), size: 20, color: COLORS.light, font: "Calibri" })] }),
    new Paragraph({ spacing: { before: 200 }, alignment: AlignmentType.CENTER, children: [new TextRun({ text: `${questions.length} Requirements Addressed · ${categories.length} Categories`, size: 18, color: COLORS.light, font: "Calibri" })] }),
    new Paragraph({ children: [new PageBreak()] }),
  );

  // === EXECUTIVE OVERVIEW ===
  sections.push(
    new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun({ text: "Executive Overview", bold: true, size: 32, font: "Calibri" })] }),
    new Paragraph({ spacing: { before: 200 }, children: [new TextRun({ text: `Brim Financial presents our comprehensive response to Bangor Savings Bank's Credit Card Program RFP. Of ${questions.length} requirements, ${compliantY} (${Math.round((compliantY / questions.length) * 100)}%) are fully compliant with an average committee score of ${avgScore}/10.`, size: 20, font: "Calibri" })] }),
  );

  // Stats table
  sections.push(
    new Paragraph({ spacing: { before: 300 } }),
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({ children: [
          makeCell("GREEN (Strong)", { bold: true, bg: COLORS.greenBg, color: COLORS.greenText, width: 25 }),
          makeCell("YELLOW (Strengthen)", { bold: true, bg: COLORS.yellowBg, color: COLORS.yellowText, width: 25 }),
          makeCell("RED (Gap/Risk)", { bold: true, bg: COLORS.redBg, color: COLORS.redText, width: 25 }),
          makeCell("Avg Score", { bold: true, bg: COLORS.grayBg, width: 25 }),
        ]}),
        new TableRow({ children: [
          makeCell(`${green} (${Math.round((green / questions.length) * 100)}%)`, { color: COLORS.greenText, width: 25, alignment: AlignmentType.CENTER }),
          makeCell(`${yellow}`, { color: COLORS.yellowText, width: 25, alignment: AlignmentType.CENTER }),
          makeCell(`${red}`, { color: COLORS.redText, width: 25, alignment: AlignmentType.CENTER }),
          makeCell(`${avgScore}/10`, { bold: true, width: 25, alignment: AlignmentType.CENTER }),
        ]}),
      ],
    }),
  );

  // RED questions warning
  if (red > 0) {
    sections.push(
      new Paragraph({ spacing: { before: 400 }, children: [new TextRun({ text: `Critical Gaps (${red})`, bold: true, size: 24, color: COLORS.redText, font: "Calibri" })] }),
    );
    const redQs = questions.filter(q => q.confidence === "RED");
    const redRows = [
      new TableRow({ children: [
        makeCell("Ref", { bold: true, bg: COLORS.grayBg, width: 20 }),
        makeCell("Topic", { bold: true, bg: COLORS.grayBg, width: 30 }),
        makeCell("Score", { bold: true, bg: COLORS.grayBg, width: 10 }),
        makeCell("Issue", { bold: true, bg: COLORS.grayBg, width: 40 }),
      ]}),
      ...redQs.map(q => new TableRow({ children: [
        makeCell(q.ref, { width: 20 }),
        makeCell(q.topic, { width: 30 }),
        makeCell(`${q.committee_score}/10`, { color: COLORS.redText, bold: true, width: 10 }),
        makeCell(q.compliant === "N" ? "Non-compliant — " + (q.committee_risk || "").slice(0, 80) : "Partial — " + (q.committee_risk || "").slice(0, 80), { color: COLORS.redText, width: 40 }),
      ]})),
    ];
    sections.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: redRows }));
  }

  // === AI ANALYSIS (Claude CPO Review) ===
  const aiHighCount = questions.filter(q => detectAIWriting(q.bullet + " " + q.paragraph).level === "high").length;
  const aiMedCount = questions.filter(q => detectAIWriting(q.bullet + " " + q.paragraph).level === "medium").length;
  const aiLowCount = questions.filter(q => detectAIWriting(q.bullet + " " + q.paragraph).level === "low").length;

  sections.push(new Paragraph({ children: [new PageBreak()] }));
  sections.push(
    new Paragraph({ spacing: { before: 200 }, shading: { type: ShadingType.SOLID, color: "EDE9FE" }, children: [
      new TextRun({ text: "AI REVIEW NOTES — CLAUDE (CPO ANALYSIS)", bold: true, size: 22, color: "6D28D9", font: "Calibri" }),
    ]}),
    new Paragraph({ spacing: { before: 100 }, children: [
      new TextRun({ text: "The following analysis was generated by Claude AI acting as Chief Procurement Officer. These notes are for internal use only — do not include in the final submission to BSB.", size: 18, color: COLORS.gray, italics: true, font: "Calibri" }),
    ]}),
  );

  // AI Detection Summary
  sections.push(
    new Paragraph({ spacing: { before: 300 }, children: [new TextRun({ text: "AI Writing Detection", bold: true, size: 22, color: "6D28D9", font: "Calibri" })] }),
    new Paragraph({ children: [new TextRun({ text: `${aiHighCount} responses flagged as High AI risk, ${aiMedCount} Medium, ${aiLowCount} Human-like. High-risk responses contain patterns (excessive em-dashes, filler words like "comprehensive/robust/seamless", very long sentences) that AI detection tools may flag.`, size: 18, font: "Calibri" })] }),
  );

  // CPO Feedback
  sections.push(
    new Paragraph({ spacing: { before: 300 }, children: [new TextRun({ text: "Strategic Assessment", bold: true, size: 22, color: "6D28D9", font: "Calibri" })] }),
    new Paragraph({ spacing: { before: 100 }, children: [
      new TextRun({ text: "STRENGTHS: ", bold: true, size: 18, color: COLORS.greenText, font: "Calibri" }),
      new TextRun({ text: `${Math.round((green/questions.length)*100)}% GREEN confidence with ${compliantY} fully compliant responses demonstrates strong platform-market fit. The Loyalty, Processing, and Customer Experience categories score well. Specific FI reference cases (Affinity, Manulife) add credibility.`, size: 18, font: "Calibri" }),
    ]}),
    new Paragraph({ spacing: { before: 100 }, children: [
      new TextRun({ text: "WEAKNESSES: ", bold: true, size: 18, color: COLORS.redText, font: "Calibri" }),
      new TextRun({ text: `${red} critical gaps in Technology (Visa/STAR/NYCE network support), Fulfillment (in-branch printing), Processing (multi-network settlement), and Product Operations (debit card support). These are capability gaps, not response quality issues — no amount of rewriting fixes them. BSB will challenge these directly.`, size: 18, font: "Calibri" }),
    ]}),
    new Paragraph({ spacing: { before: 100 }, children: [
      new TextRun({ text: "RECOMMENDATION: ", bold: true, size: 18, color: COLORS.blue, font: "Calibri" }),
      new TextRun({ text: `1) Position the 5 non-compliant items as deliberate scope focus (credit-first strategy) rather than gaps. 2) For Visa/NYCE/STAR network questions, present a concrete partnership or roadmap timeline. 3) Run AI Humanize on the ${aiHighCount} high-risk responses before submission. 4) The debit questions (Product Ops 45-46) should explicitly state this is out of scope with a transition plan if BSB needs debit in future.`, size: 18, font: "Calibri" }),
    ]}),
  );

  // Category scorecard
  sections.push(
    new Paragraph({ spacing: { before: 400 }, children: [new TextRun({ text: "Category Performance", bold: true, size: 24, font: "Calibri" })] }),
  );
  const catRows = [
    new TableRow({ children: [
      makeCell("Category", { bold: true, bg: COLORS.grayBg, width: 35 }),
      makeCell("Qs", { bold: true, bg: COLORS.grayBg, width: 10, alignment: AlignmentType.CENTER }),
      makeCell("Avg", { bold: true, bg: COLORS.grayBg, width: 10, alignment: AlignmentType.CENTER }),
      makeCell("G", { bold: true, bg: COLORS.greenBg, color: COLORS.greenText, width: 10, alignment: AlignmentType.CENTER }),
      makeCell("Y", { bold: true, bg: COLORS.yellowBg, color: COLORS.yellowText, width: 10, alignment: AlignmentType.CENTER }),
      makeCell("R", { bold: true, bg: COLORS.redBg, color: COLORS.redText, width: 10, alignment: AlignmentType.CENTER }),
      makeCell("Compliant", { bold: true, bg: COLORS.grayBg, width: 15, alignment: AlignmentType.CENTER }),
    ]}),
    ...categories.map(cat => {
      const qs = questions.filter(q => q.category === cat);
      const avg = qs.reduce((s, q) => s + (q.committee_score || 0), 0) / (qs.length || 1);
      const g = qs.filter(q => q.confidence === "GREEN").length;
      const y = qs.filter(q => q.confidence === "YELLOW").length;
      const r = qs.filter(q => q.confidence === "RED").length;
      const cy = qs.filter(q => q.compliant === "Y").length;
      return new TableRow({ children: [
        makeCell(cat, { bold: true, width: 35 }),
        makeCell(`${qs.length}`, { width: 10, alignment: AlignmentType.CENTER }),
        makeCell(avg.toFixed(1), { color: scoreColor(avg), bold: true, width: 10, alignment: AlignmentType.CENTER }),
        makeCell(`${g}`, { color: COLORS.greenText, width: 10, alignment: AlignmentType.CENTER }),
        makeCell(`${y}`, { color: y > 0 ? COLORS.yellowText : COLORS.light, width: 10, alignment: AlignmentType.CENTER }),
        makeCell(`${r}`, { color: r > 0 ? COLORS.redText : COLORS.light, width: 10, alignment: AlignmentType.CENTER }),
        makeCell(`${cy}/${qs.length}`, { width: 15, alignment: AlignmentType.CENTER }),
      ]});
    }),
  ];
  sections.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: catRows }));

  sections.push(new Paragraph({ children: [new PageBreak()] }));

  // === TABLE OF CONTENTS ===
  sections.push(
    new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun({ text: "Table of Contents", bold: true, size: 32, font: "Calibri" })] }),
  );
  categories.forEach((cat, i) => {
    const count = questions.filter(q => q.category === cat).length;
    sections.push(new Paragraph({
      spacing: { before: 80 },
      children: [
        new TextRun({ text: `${i + 1}. ${cat}`, size: 20, font: "Calibri" }),
        new TextRun({ text: `  (${count} questions)`, size: 18, color: COLORS.light, font: "Calibri" }),
      ],
    }));
  });
  sections.push(new Paragraph({ children: [new PageBreak()] }));

  // === RESPONSES BY CATEGORY ===
  for (let catIdx = 0; catIdx < categories.length; catIdx++) {
    const cat = categories[catIdx];
    const catQs = questions.filter(q => q.category === cat);
    if (catQs.length === 0) continue;

    sections.push(
      new Paragraph({ heading: HeadingLevel.HEADING_1, spacing: { before: 400 }, children: [new TextRun({ text: `${catIdx + 1}. ${cat}`, bold: true, size: 28, font: "Calibri" })] }),
    );

    for (const q of catQs) {
      const conf = confidenceColor(q.confidence);

      // Question header
      sections.push(
        new Paragraph({ spacing: { before: 300 }, children: [
          new TextRun({ text: q.ref, bold: true, size: 20, color: COLORS.blue, font: "Calibri" }),
          new TextRun({ text: `  ·  ${q.topic}`, size: 18, color: COLORS.gray, font: "Calibri" }),
        ]}),
      );

      // Status badges row
      const badges: TextRun[] = [
        new TextRun({ text: `[${conf.label}]`, color: conf.text, size: 16, bold: true, font: "Calibri" }),
        new TextRun({ text: `  [${q.compliant === "Y" ? "Compliant" : q.compliant === "N" ? "Non-Compliant" : "Partial"}]`, color: q.compliant === "Y" ? COLORS.greenText : q.compliant === "N" ? COLORS.redText : COLORS.yellowText, size: 16, bold: true, font: "Calibri" }),
        new TextRun({ text: `  Score: ${q.committee_score}/10`, color: scoreColor(q.committee_score), size: 16, bold: true, font: "Calibri" }),
      ];
      const delivery: string[] = [];
      if (q.a_oob) delivery.push("Out-of-Box");
      if (q.b_config) delivery.push("Config");
      if (q.c_custom) delivery.push("Custom");
      if (delivery.length > 0) badges.push(new TextRun({ text: `  Delivery: ${delivery.join(", ")}`, color: COLORS.gray, size: 16, font: "Calibri" }));
      // AI Detection badge
      const aiDetect = detectAIWriting(q.bullet + " " + q.paragraph);
      const aiColor = aiDetect.level === "high" ? COLORS.redText : aiDetect.level === "medium" ? COLORS.yellowText : COLORS.greenText;
      badges.push(new TextRun({ text: `  [AI: ${aiDetectLabel(aiDetect.level)}]`, color: aiColor, size: 16, bold: true, font: "Calibri" }));
      sections.push(new Paragraph({ spacing: { before: 60 }, children: badges }));

      // Requirement
      sections.push(
        new Paragraph({ spacing: { before: 120 }, children: [new TextRun({ text: "BSB REQUIREMENT", bold: true, size: 14, color: COLORS.light, allCaps: true, font: "Calibri" })] }),
        new Paragraph({ shading: { type: ShadingType.SOLID, color: COLORS.grayBg }, spacing: { before: 40 }, children: [new TextRun({ text: q.requirement, size: 18, color: COLORS.medium, font: "Calibri" })] }),
      );

      // Response
      sections.push(
        new Paragraph({ spacing: { before: 120 }, children: [new TextRun({ text: "BRIM FINANCIAL RESPONSE", bold: true, size: 14, color: COLORS.blue, allCaps: true, font: "Calibri" })] }),
        new Paragraph({ spacing: { before: 40 }, children: [new TextRun({ text: q.paragraph || q.bullet || "No response provided.", size: 20, color: COLORS.dark, font: "Calibri" })] }),
      );

      // Score reasoning
      if (q.committee_review) {
        sections.push(
          new Paragraph({ spacing: { before: 100 }, children: [new TextRun({ text: "SCORE REASONING", bold: true, size: 14, color: COLORS.light, allCaps: true, font: "Calibri" })] }),
          new Paragraph({
            shading: { type: ShadingType.SOLID, color: q.confidence === "RED" ? COLORS.redBg : q.confidence === "YELLOW" ? COLORS.yellowBg : COLORS.greenBg },
            children: [new TextRun({ text: q.committee_review, size: 17, color: conf.text, font: "Calibri" })],
          }),
        );
      }

      // Risk assessment
      if (q.committee_risk && q.committee_risk !== "LOW") {
        sections.push(
          new Paragraph({ spacing: { before: 60 }, children: [
            new TextRun({ text: "Risk: ", bold: true, size: 17, color: COLORS.redText, font: "Calibri" }),
            new TextRun({ text: q.committee_risk, size: 17, color: COLORS.redText, font: "Calibri" }),
          ]}),
        );
      }

      // Rationale (source/reasoning)
      if (q.rationale) {
        sections.push(
          new Paragraph({ spacing: { before: 60 }, children: [
            new TextRun({ text: "Source/Rationale: ", bold: true, size: 16, color: COLORS.gray, italics: true, font: "Calibri" }),
            new TextRun({ text: q.rationale.slice(0, 300), size: 16, color: COLORS.gray, italics: true, font: "Calibri" }),
          ]}),
        );
      }

      // Pricing
      if (q.pricing) {
        sections.push(
          new Paragraph({ spacing: { before: 40 }, children: [
            new TextRun({ text: "Pricing: ", bold: true, size: 16, color: COLORS.gray, font: "Calibri" }),
            new TextRun({ text: q.pricing, size: 16, color: COLORS.gray, font: "Calibri" }),
          ]}),
        );
      }

      // AI Detection Details (Claude analysis - purple background)
      if (aiDetect.level !== "low" && aiDetect.triggers.length > 0) {
        sections.push(
          new Paragraph({
            spacing: { before: 60 },
            shading: { type: ShadingType.SOLID, color: "EDE9FE" },
            children: [
              new TextRun({ text: "CLAUDE NOTE: ", bold: true, size: 15, color: "6D28D9", font: "Calibri" }),
              new TextRun({ text: `AI detection score ${aiDetect.score} (${aiDetectLabel(aiDetect.level)}). Triggers: ${aiDetect.triggers.join(", ")}. `, size: 15, color: "6D28D9", font: "Calibri" }),
              new TextRun({ text: aiDetect.suggestion, size: 15, color: "6D28D9", italics: true, font: "Calibri" }),
            ],
          }),
        );
      }

      // Claude CPO commentary for problem questions
      if (q.confidence === "RED") {
        sections.push(
          new Paragraph({
            spacing: { before: 60 },
            shading: { type: ShadingType.SOLID, color: "EDE9FE" },
            children: [
              new TextRun({ text: "CLAUDE RECOMMENDATION: ", bold: true, size: 15, color: "6D28D9", font: "Calibri" }),
              new TextRun({ text: q.compliant === "N"
                ? "This is a capability gap, not a response quality issue. Position this as a deliberate strategic focus on credit card excellence rather than a deficiency. If BSB requires this capability, present a partnership or roadmap timeline with specific milestones."
                : "Partial compliance needs a clear explanation of what IS covered vs what requires configuration or partnership. BSB's committee will probe this — prepare a verbal response for the Q&A session.",
                size: 15, color: "6D28D9", italics: true, font: "Calibri" }),
            ],
          }),
        );
      }
    }

    // Page break after each category
    if (catIdx < categories.length - 1) {
      sections.push(new Paragraph({ children: [new PageBreak()] }));
    }
  }

  // === FOOTER ===
  sections.push(
    new Paragraph({ spacing: { before: 600 }, alignment: AlignmentType.CENTER, children: [
      new TextRun({ text: "This document is confidential and prepared solely for Bangor Savings Bank.", size: 16, color: COLORS.light, font: "Calibri", italics: true }),
    ]}),
    new Paragraph({ alignment: AlignmentType.CENTER, children: [
      new TextRun({ text: `Brim Financial · ${new Date().getFullYear()}`, size: 16, color: COLORS.light, font: "Calibri" }),
    ]}),
  );

  const doc = new Document({
    sections: [{
      properties: {
        page: { margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 } },
      },
      headers: {
        default: new Header({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: "BSB Credit Card RFP Response — Brim Financial", size: 14, color: COLORS.light, font: "Calibri" })] })] }),
      },
      footers: {
        default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Confidential", size: 14, color: COLORS.light, font: "Calibri" })] })] }),
      },
      children: sections,
    }],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, "BSB_RFP_Response_Brim_Financial.docx");
}
