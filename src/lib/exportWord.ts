import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  HeadingLevel,
  ShadingType,
  PageBreak,
  Header,
  Footer,
  BorderStyle,
} from 'docx';
import { saveAs } from 'file-saver';
import type { RFPData, KnowledgeBase, ValidationRule } from '@/types';
import { detectAIWriting, aiDetectLabel } from '@/lib/aiDetect';

export interface ExportOptions {
  knowledgeBase?: KnowledgeBase;
  globalRules?: string[];
  validationRules?: ValidationRule[];
  returnBuffer?: boolean;
}

const COLORS = {
  green: '10B981',
  greenBg: 'ECFDF5',
  greenText: '047857',
  yellow: 'F59E0B',
  yellowBg: 'FFFBEB',
  yellowText: 'B45309',
  red: 'EF4444',
  redBg: 'FEF2F2',
  redText: 'B91C1C',
  blue: '2563EB',
  blueBg: 'EFF6FF',
  gray: '6B7280',
  grayBg: 'F9FAFB',
  grayLight: 'E5E7EB',
  dark: '111827',
  medium: '374151',
  light: '9CA3AF',
};

function confidenceColor(c: string) {
  if (c === 'GREEN') return { bg: COLORS.greenBg, text: COLORS.greenText, label: 'GREEN - Strong' };
  if (c === 'YELLOW')
    return { bg: COLORS.yellowBg, text: COLORS.yellowText, label: 'YELLOW - Needs Strengthening' };
  if (c === 'RED') return { bg: COLORS.redBg, text: COLORS.redText, label: 'RED - Gap/Risk' };
  return { bg: COLORS.grayBg, text: COLORS.gray, label: c };
}

function scoreColor(score: number) {
  if (score >= 7) return COLORS.greenText;
  if (score >= 5) return COLORS.yellowText;
  return COLORS.redText;
}

function makeCell(
  text: string,
  options?: {
    bold?: boolean;
    color?: string;
    bg?: string;
    width?: number;
    alignment?: (typeof AlignmentType)[keyof typeof AlignmentType];
    size?: number;
  },
) {
  return new TableCell({
    width: options?.width ? { size: options.width, type: WidthType.PERCENTAGE } : undefined,
    shading: options?.bg ? { type: ShadingType.SOLID, color: options.bg } : undefined,
    margins: { top: 80, bottom: 80, left: 120, right: 120 },
    children: [
      new Paragraph({
        alignment: options?.alignment,
        children: [
          new TextRun({
            text,
            bold: options?.bold,
            color: options?.color || COLORS.dark,
            size: options?.size ?? 18,
            font: 'Calibri',
          }),
        ],
      }),
    ],
  });
}

export async function exportToWord(data: RFPData, options?: ExportOptions) {
  const kb = options?.knowledgeBase;
  const globalRules = options?.globalRules || [];
  const validationRules = options?.validationRules || [];
  const questions = data.questions;
  const categories = data.categories;

  // Stats
  const green = questions.filter((q) => q.confidence === 'GREEN').length;
  const yellow = questions.filter((q) => q.confidence === 'YELLOW').length;
  const red = questions.filter((q) => q.confidence === 'RED').length;
  const avgScore = (
    questions.reduce((s, q) => s + (q.committee_score || 0), 0) / questions.length
  ).toFixed(1);
  const compliantY = questions.filter((q) => q.compliant === 'Y').length;

  const sections: (Paragraph | Table)[] = [];

  // === COVER PAGE ===
  sections.push(
    new Paragraph({ spacing: { before: 3000 } }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: 'CONFIDENTIAL',
          size: 16,
          color: COLORS.light,
          font: 'Calibri',
          allCaps: true,
          characterSpacing: 200,
        }),
      ],
    }),
    new Paragraph({
      children: [new TextRun({ text: '', size: 4 })],
      border: {
        bottom: { color: '1e3a5f', space: 1, style: BorderStyle.THICK, size: 12 },
      },
      spacing: { before: 400, after: 400 },
    }),
    new Paragraph({
      spacing: { before: 200 },
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: 'BSB Credit Card Program',
          size: 56,
          bold: true,
          color: COLORS.dark,
          font: 'Calibri',
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: 'Request for Proposal Response',
          size: 32,
          color: COLORS.gray,
          font: 'Calibri',
        }),
      ],
    }),
    new Paragraph({
      spacing: { before: 800 },
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: 'Prepared by Brim Financial',
          size: 24,
          color: COLORS.medium,
          font: 'Calibri',
        }),
      ],
    }),
    new Paragraph({
      spacing: { before: 400 },
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: new Date().toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          }),
          size: 20,
          color: COLORS.light,
          font: 'Calibri',
        }),
      ],
    }),
    new Paragraph({
      spacing: { before: 200 },
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: `${questions.length} Requirements Addressed · ${categories.length} Categories`,
          size: 18,
          color: COLORS.light,
          font: 'Calibri',
        }),
      ],
    }),
    new Paragraph({ children: [new PageBreak()] }),
  );

  // === EXECUTIVE OVERVIEW ===
  sections.push(
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      children: [
        new TextRun({ text: 'Executive Overview', bold: true, size: 32, font: 'Calibri' }),
      ],
    }),
    new Paragraph({
      spacing: { before: 200 },
      children: [
        new TextRun({
          text: `Brim Financial presents our comprehensive response to Bangor Savings Bank's Credit Card Program RFP. Of ${questions.length} requirements, ${compliantY} (${Math.round((compliantY / questions.length) * 100)}%) are fully compliant with an average committee score of ${avgScore}/10.`,
          size: 20,
          font: 'Calibri',
        }),
      ],
    }),
  );

  // Stats table
  sections.push(
    new Paragraph({ spacing: { before: 300 } }),
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: [
            makeCell('GREEN (Strong)', {
              bold: true,
              bg: COLORS.greenBg,
              color: COLORS.greenText,
              width: 25,
            }),
            makeCell('YELLOW (Strengthen)', {
              bold: true,
              bg: COLORS.yellowBg,
              color: COLORS.yellowText,
              width: 25,
            }),
            makeCell('RED (Gap/Risk)', {
              bold: true,
              bg: COLORS.redBg,
              color: COLORS.redText,
              width: 25,
            }),
            makeCell('Avg Score', { bold: true, bg: COLORS.grayBg, width: 25 }),
          ],
        }),
        new TableRow({
          children: [
            makeCell(`${green} (${Math.round((green / questions.length) * 100)}%)`, {
              color: COLORS.greenText,
              width: 25,
              alignment: AlignmentType.CENTER,
            }),
            makeCell(`${yellow}`, {
              color: COLORS.yellowText,
              width: 25,
              alignment: AlignmentType.CENTER,
            }),
            makeCell(`${red}`, {
              color: COLORS.redText,
              width: 25,
              alignment: AlignmentType.CENTER,
            }),
            makeCell(`${avgScore}/10`, { bold: true, width: 25, alignment: AlignmentType.CENTER }),
          ],
        }),
      ],
    }),
  );

  // RED questions warning
  if (red > 0) {
    sections.push(
      new Paragraph({
        spacing: { before: 400 },
        children: [
          new TextRun({
            text: `Critical Gaps (${red})`,
            bold: true,
            size: 24,
            color: COLORS.redText,
            font: 'Calibri',
          }),
        ],
      }),
    );
    const redQs = questions.filter((q) => q.confidence === 'RED');
    const redRows = [
      new TableRow({
        children: [
          makeCell('Ref', { bold: true, bg: COLORS.grayBg, width: 20 }),
          makeCell('Topic', { bold: true, bg: COLORS.grayBg, width: 30 }),
          makeCell('Score', { bold: true, bg: COLORS.grayBg, width: 10 }),
          makeCell('Issue', { bold: true, bg: COLORS.grayBg, width: 40 }),
        ],
      }),
      ...redQs.map(
        (q) =>
          new TableRow({
            children: [
              makeCell(q.ref, { width: 20 }),
              makeCell(q.topic, { width: 30 }),
              makeCell(`${q.committee_score}/10`, { color: COLORS.redText, bold: true, width: 10 }),
              makeCell(
                q.compliant === 'N'
                  ? 'Non-compliant — ' + (q.committee_risk || '').slice(0, 80)
                  : 'Partial — ' + (q.committee_risk || '').slice(0, 80),
                { color: COLORS.redText, width: 40 },
              ),
            ],
          }),
      ),
    ];
    sections.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: redRows }));
  }

  // === AI ANALYSIS (Claude CPO Review) ===
  const aiHighCount = questions.filter(
    (q) => detectAIWriting(q.bullet + ' ' + q.paragraph).level === 'high',
  ).length;
  const aiMedCount = questions.filter(
    (q) => detectAIWriting(q.bullet + ' ' + q.paragraph).level === 'medium',
  ).length;
  const aiLowCount = questions.filter(
    (q) => detectAIWriting(q.bullet + ' ' + q.paragraph).level === 'low',
  ).length;

  sections.push(new Paragraph({ children: [new PageBreak()] }));
  sections.push(
    new Paragraph({
      spacing: { before: 200 },
      shading: { type: ShadingType.SOLID, color: 'EDE9FE' },
      children: [
        new TextRun({
          text: 'AI REVIEW NOTES — CLAUDE (CPO ANALYSIS)',
          bold: true,
          size: 22,
          color: '6D28D9',
          font: 'Calibri',
        }),
      ],
    }),
    new Paragraph({
      spacing: { before: 100 },
      children: [
        new TextRun({
          text: 'The following analysis was generated by Claude AI acting as Chief Procurement Officer. These notes are for internal use only — do not include in the final submission to BSB.',
          size: 18,
          color: COLORS.gray,
          italics: true,
          font: 'Calibri',
        }),
      ],
    }),
  );

  // AI Detection Summary
  sections.push(
    new Paragraph({
      spacing: { before: 300 },
      children: [
        new TextRun({
          text: 'AI Writing Detection',
          bold: true,
          size: 22,
          color: '6D28D9',
          font: 'Calibri',
        }),
      ],
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `${aiHighCount} responses flagged as High AI risk, ${aiMedCount} Medium, ${aiLowCount} Human-like. High-risk responses contain patterns (excessive em-dashes, filler words like "comprehensive/robust/seamless", very long sentences) that AI detection tools may flag.`,
          size: 18,
          font: 'Calibri',
        }),
      ],
    }),
  );

  // CPO Feedback
  sections.push(
    new Paragraph({
      spacing: { before: 300 },
      children: [
        new TextRun({
          text: 'Strategic Assessment',
          bold: true,
          size: 22,
          color: '6D28D9',
          font: 'Calibri',
        }),
      ],
    }),
    new Paragraph({
      spacing: { before: 100 },
      children: [
        new TextRun({
          text: 'STRENGTHS: ',
          bold: true,
          size: 18,
          color: COLORS.greenText,
          font: 'Calibri',
        }),
        new TextRun({
          text: `${Math.round((green / questions.length) * 100)}% GREEN confidence with ${compliantY} fully compliant responses demonstrates strong platform-market fit. The Loyalty, Processing, and Customer Experience categories score well. Specific FI reference cases (Affinity, Manulife) add credibility.`,
          size: 18,
          font: 'Calibri',
        }),
      ],
    }),
    new Paragraph({
      spacing: { before: 100 },
      children: [
        new TextRun({
          text: 'WEAKNESSES: ',
          bold: true,
          size: 18,
          color: COLORS.redText,
          font: 'Calibri',
        }),
        new TextRun({
          text: `${red} critical gaps in Technology (Visa/STAR/NYCE network support), Fulfillment (in-branch printing), Processing (multi-network settlement), and Product Operations (debit card support). These are capability gaps, not response quality issues — no amount of rewriting fixes them. BSB will challenge these directly.`,
          size: 18,
          font: 'Calibri',
        }),
      ],
    }),
    new Paragraph({
      spacing: { before: 100 },
      children: [
        new TextRun({
          text: 'RECOMMENDATION: ',
          bold: true,
          size: 18,
          color: COLORS.blue,
          font: 'Calibri',
        }),
        new TextRun({
          text: `1) Position the 5 non-compliant items as deliberate scope focus (credit-first strategy) rather than gaps. 2) For Visa/NYCE/STAR network questions, present a concrete partnership or roadmap timeline. 3) Run AI Humanize on the ${aiHighCount} high-risk responses before submission. 4) The debit questions (Product Ops 45-46) should explicitly state this is out of scope with a transition plan if BSB needs debit in future.`,
          size: 18,
          font: 'Calibri',
        }),
      ],
    }),
  );

  // === KNOWLEDGE BASE ===
  if (kb && (kb.companyFacts || kb.keyMetrics || kb.differentiators || kb.competitivePositioning)) {
    sections.push(new Paragraph({ children: [new PageBreak()] }));
    sections.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        children: [new TextRun({ text: 'Knowledge Base', bold: true, size: 28, font: 'Calibri' })],
      }),
      new Paragraph({
        spacing: { before: 100 },
        children: [
          new TextRun({
            text: 'Company facts and metrics used to guide AI-assisted response generation.',
            size: 18,
            color: COLORS.gray,
            italics: true,
            font: 'Calibri',
          }),
        ],
      }),
    );
    const kbSections: [string, string][] = [
      ['Company Facts', kb.companyFacts],
      ['Key Metrics', kb.keyMetrics],
      ['Differentiators', kb.differentiators],
      ['Competitive Positioning', kb.competitivePositioning],
    ];
    for (const [label, content] of kbSections) {
      if (content) {
        sections.push(
          new Paragraph({
            spacing: { before: 200 },
            children: [
              new TextRun({
                text: label,
                bold: true,
                size: 20,
                color: COLORS.blue,
                font: 'Calibri',
              }),
            ],
          }),
          new Paragraph({
            shading: { type: ShadingType.SOLID, color: COLORS.blueBg },
            children: [new TextRun({ text: content, size: 18, font: 'Calibri' })],
          }),
        );
      }
    }
  }

  // === WRITING RULES ===
  if (globalRules.length > 0 || validationRules.length > 0) {
    sections.push(new Paragraph({ children: [new PageBreak()] }));
    sections.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        children: [
          new TextRun({
            text: 'Writing Rules & Validation',
            bold: true,
            size: 28,
            font: 'Calibri',
          }),
        ],
      }),
    );

    if (globalRules.length > 0) {
      sections.push(
        new Paragraph({
          spacing: { before: 200 },
          children: [
            new TextRun({
              text: `Global Writing Rules (${globalRules.length})`,
              bold: true,
              size: 20,
              color: COLORS.blue,
              font: 'Calibri',
            }),
          ],
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: 'These rules are applied to every AI rewrite to maintain consistency.',
              size: 17,
              color: COLORS.gray,
              italics: true,
              font: 'Calibri',
            }),
          ],
        }),
      );
      for (let i = 0; i < globalRules.length; i++) {
        sections.push(
          new Paragraph({
            spacing: { before: 60 },
            shading: { type: ShadingType.SOLID, color: COLORS.grayBg },
            children: [
              new TextRun({ text: `${i + 1}. `, bold: true, size: 18, font: 'Calibri' }),
              new TextRun({ text: globalRules[i], size: 18, font: 'Calibri' }),
            ],
          }),
        );
      }
    }

    if (validationRules.length > 0) {
      sections.push(
        new Paragraph({
          spacing: { before: 200 },
          children: [
            new TextRun({
              text: `Validation Rules (${validationRules.length})`,
              bold: true,
              size: 20,
              color: COLORS.yellowText,
              font: 'Calibri',
            }),
          ],
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: 'These rules are checked after AI generates a response. Failures shown as warnings in the diff view.',
              size: 17,
              color: COLORS.gray,
              italics: true,
              font: 'Calibri',
            }),
          ],
        }),
      );
      for (const rule of validationRules) {
        sections.push(
          new Paragraph({
            spacing: { before: 60 },
            shading: { type: ShadingType.SOLID, color: COLORS.yellowBg },
            children: [new TextRun({ text: rule.text, size: 18, font: 'Calibri' })],
          }),
        );
      }
    }
  }

  // Category scorecard
  sections.push(
    new Paragraph({
      spacing: { before: 400 },
      children: [
        new TextRun({ text: 'Category Performance', bold: true, size: 24, font: 'Calibri' }),
      ],
    }),
  );
  const catRows = [
    new TableRow({
      children: [
        makeCell('Category', { bold: true, bg: COLORS.grayBg, width: 35 }),
        makeCell('Qs', {
          bold: true,
          bg: COLORS.grayBg,
          width: 10,
          alignment: AlignmentType.CENTER,
        }),
        makeCell('Avg', {
          bold: true,
          bg: COLORS.grayBg,
          width: 10,
          alignment: AlignmentType.CENTER,
        }),
        makeCell('G', {
          bold: true,
          bg: COLORS.greenBg,
          color: COLORS.greenText,
          width: 10,
          alignment: AlignmentType.CENTER,
        }),
        makeCell('Y', {
          bold: true,
          bg: COLORS.yellowBg,
          color: COLORS.yellowText,
          width: 10,
          alignment: AlignmentType.CENTER,
        }),
        makeCell('R', {
          bold: true,
          bg: COLORS.redBg,
          color: COLORS.redText,
          width: 10,
          alignment: AlignmentType.CENTER,
        }),
        makeCell('Compliant', {
          bold: true,
          bg: COLORS.grayBg,
          width: 15,
          alignment: AlignmentType.CENTER,
        }),
      ],
    }),
    ...categories.map((cat) => {
      const qs = questions.filter((q) => q.category === cat);
      const avg = qs.reduce((s, q) => s + (q.committee_score || 0), 0) / (qs.length || 1);
      const g = qs.filter((q) => q.confidence === 'GREEN').length;
      const y = qs.filter((q) => q.confidence === 'YELLOW').length;
      const r = qs.filter((q) => q.confidence === 'RED').length;
      const cy = qs.filter((q) => q.compliant === 'Y').length;
      return new TableRow({
        children: [
          makeCell(cat, { bold: true, width: 35 }),
          makeCell(`${qs.length}`, { width: 10, alignment: AlignmentType.CENTER }),
          makeCell(avg.toFixed(1), {
            color: scoreColor(avg),
            bold: true,
            width: 10,
            alignment: AlignmentType.CENTER,
          }),
          makeCell(`${g}`, { color: COLORS.greenText, width: 10, alignment: AlignmentType.CENTER }),
          makeCell(`${y}`, {
            color: y > 0 ? COLORS.yellowText : COLORS.light,
            width: 10,
            alignment: AlignmentType.CENTER,
          }),
          makeCell(`${r}`, {
            color: r > 0 ? COLORS.redText : COLORS.light,
            width: 10,
            alignment: AlignmentType.CENTER,
          }),
          makeCell(`${cy}/${qs.length}`, { width: 15, alignment: AlignmentType.CENTER }),
        ],
      });
    }),
  ];
  sections.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: catRows }));

  sections.push(new Paragraph({ children: [new PageBreak()] }));

  // === TABLE OF CONTENTS ===
  sections.push(
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      children: [new TextRun({ text: 'Table of Contents', bold: true, size: 32, font: 'Calibri' })],
    }),
  );
  categories.forEach((cat, i) => {
    const count = questions.filter((q) => q.category === cat).length;
    sections.push(
      new Paragraph({
        spacing: { before: 80 },
        children: [
          new TextRun({ text: `${i + 1}. ${cat}`, size: 20, font: 'Calibri' }),
          new TextRun({
            text: `  (${count} questions)`,
            size: 18,
            color: COLORS.light,
            font: 'Calibri',
          }),
        ],
      }),
    );
  });
  sections.push(new Paragraph({ children: [new PageBreak()] }));

  // === RESPONSES BY CATEGORY ===
  for (let catIdx = 0; catIdx < categories.length; catIdx++) {
    const cat = categories[catIdx];
    const catQs = questions.filter((q) => q.category === cat);
    if (catQs.length === 0) continue;

    sections.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 400 },
        children: [
          new TextRun({ text: `${catIdx + 1}. ${cat}`, bold: true, size: 28, font: 'Calibri' }),
        ],
      }),
    );

    for (const q of catQs) {
      const conf = confidenceColor(q.confidence);
      const isRed = q.confidence === 'RED';
      const isYellow = q.confidence === 'YELLOW';

      // Thin divider between questions
      sections.push(
        new Paragraph({
          spacing: { before: 200, after: 0 },
          border: {
            bottom: {
              color: isRed ? COLORS.red : isYellow ? COLORS.yellow : COLORS.grayLight,
              space: 1,
              style: isRed ? BorderStyle.THICK : BorderStyle.SINGLE,
              size: isRed ? 6 : 2,
            },
          },
          children: [],
        }),
      );

      // Question header
      sections.push(
        new Paragraph({
          spacing: { before: 120, after: 40 },
          children: [
            new TextRun({ text: q.ref, bold: true, size: 22, color: COLORS.blue, font: 'Calibri' }),
            new TextRun({ text: `  ·  ${q.topic}`, size: 20, color: COLORS.gray, font: 'Calibri' }),
          ],
        }),
      );

      // Status table — colored cells matching Excel formatting
      const delivery: string[] = [];
      if (q.a_oob) delivery.push('OOB');
      if (q.b_config) delivery.push('Config');
      if (q.c_custom) delivery.push('Custom');
      if (q.d_dnm) delivery.push('DNM');
      const deliveryLabel = delivery.join(' / ') || '—';

      const aiDetect = detectAIWriting(q.bullet + ' ' + q.paragraph);
      const aiLevel = aiDetect.level;
      const aiRiskBg = aiLevel === 'high' ? COLORS.redBg : aiLevel === 'medium' ? COLORS.yellowBg : COLORS.greenBg;
      const aiRiskText = aiLevel === 'high' ? COLORS.redText : aiLevel === 'medium' ? COLORS.yellowText : COLORS.greenText;
      const aiRiskLabel = aiLevel === 'high' ? 'HIGH' : aiLevel === 'medium' ? 'MEDIUM' : 'LOW';

      const compliantBg = q.compliant === 'Y' ? COLORS.greenBg : q.compliant === 'N' ? COLORS.redBg : COLORS.yellowBg;
      const compliantText = q.compliant === 'Y' ? COLORS.greenText : q.compliant === 'N' ? COLORS.redText : COLORS.yellowText;
      const compliantLabel = q.compliant === 'Y' ? 'Compliant' : q.compliant === 'N' ? 'Non-Compliant' : 'Partial';

      const score = q.committee_score ?? 0;
      const scoreBg = score >= 8 ? COLORS.greenBg : score >= 6 ? COLORS.yellowBg : COLORS.redBg;
      const scoreText = score >= 8 ? COLORS.greenText : score >= 6 ? COLORS.yellowText : COLORS.redText;

      sections.push(
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            // Label row
            new TableRow({
              children: [
                makeCell('CONFIDENCE', { bold: true, bg: '1e3a5f', color: 'FFFFFF', width: 20, size: 16 }),
                makeCell('COMPLIANT', { bold: true, bg: '1e3a5f', color: 'FFFFFF', width: 18, size: 16 }),
                makeCell('SCORE', { bold: true, bg: '1e3a5f', color: 'FFFFFF', width: 12, alignment: AlignmentType.CENTER, size: 16 }),
                makeCell('DELIVERY', { bold: true, bg: '1e3a5f', color: 'FFFFFF', width: 25, size: 16 }),
                makeCell('AI RISK', { bold: true, bg: '1e3a5f', color: 'FFFFFF', width: 15, alignment: AlignmentType.CENTER, size: 16 }),
                makeCell('STATUS', { bold: true, bg: '1e3a5f', color: 'FFFFFF', width: 10, alignment: AlignmentType.CENTER, size: 16 }),
              ],
            }),
            // Values row
            new TableRow({
              children: [
                makeCell(conf.label, { bold: true, bg: conf.bg, color: conf.text, width: 20, size: 18 }),
                makeCell(compliantLabel, { bold: true, bg: compliantBg, color: compliantText, width: 18, size: 18 }),
                makeCell(`${score}/10`, { bold: true, bg: scoreBg, color: scoreText, width: 12, alignment: AlignmentType.CENTER, size: 18 }),
                makeCell(deliveryLabel, { bg: COLORS.grayBg, color: COLORS.medium, width: 25, size: 18 }),
                makeCell(aiRiskLabel, { bold: true, bg: aiRiskBg, color: aiRiskText, width: 15, alignment: AlignmentType.CENTER, size: 18 }),
                makeCell(q.status ?? 'draft', { bg: COLORS.grayBg, color: COLORS.gray, width: 10, alignment: AlignmentType.CENTER, size: 18 }),
              ],
            }),
          ],
        }),
      );

      // Requirement
      sections.push(
        new Paragraph({
          spacing: { before: 80, after: 0 },
          children: [
            new TextRun({
              text: 'BSB REQUIREMENT',
              bold: true,
              size: 14,
              color: COLORS.light,
              allCaps: true,
              font: 'Calibri',
            }),
          ],
        }),
        new Paragraph({
          shading: { type: ShadingType.SOLID, color: COLORS.grayBg },
          spacing: { before: 20, after: 0 },
          indent: { left: 160, right: 160 },
          children: [
            new TextRun({ text: q.requirement, size: 20, color: COLORS.medium, font: 'Calibri' }),
          ],
        }),
      );

      // Response
      sections.push(
        new Paragraph({
          spacing: { before: 80, after: 0 },
          children: [
            new TextRun({
              text: 'BRIM FINANCIAL RESPONSE',
              bold: true,
              size: 14,
              color: COLORS.blue,
              allCaps: true,
              font: 'Calibri',
            }),
          ],
        }),
        ...((() => {
          const cleanBullet = (text: string) =>
            text
              .split('\n')
              .filter((l) => !/^_{3,}$/.test(l.trim()))
              .filter((l) => !/^[A-Z0-9 /:()&-]{8,}$/.test(l.trim()))
              .join('\n');
          return (q.paragraph || cleanBullet(q.bullet || '') || 'No response provided.')
            .split(/\n+/)
            .filter((line) => line.trim().length > 0);
        })().map((line, i, arr) => new Paragraph({
            spacing: { before: i === 0 ? 40 : 80, after: i === arr.length - 1 ? 60 : 0 },
            shading: { type: ShadingType.SOLID, color: 'EFF6FF' },
            indent: { left: 160, right: 160 },
            children: [
              new TextRun({
                text: line.trim(),
                size: 20,
                color: COLORS.dark,
                font: 'Calibri',
              }),
            ],
          }))),
      );

      // Score reasoning
      if (q.committee_review) {
        sections.push(
          new Paragraph({
            spacing: { before: 100 },
            children: [
              new TextRun({
                text: 'SCORE REASONING',
                bold: true,
                size: 14,
                color: COLORS.light,
                allCaps: true,
                font: 'Calibri',
              }),
            ],
          }),
          new Paragraph({
            shading: {
              type: ShadingType.SOLID,
              color:
                q.confidence === 'RED'
                  ? COLORS.redBg
                  : q.confidence === 'YELLOW'
                    ? COLORS.yellowBg
                    : COLORS.greenBg,
            },
            children: [
              new TextRun({
                text: q.committee_review,
                size: 17,
                color: conf.text,
                font: 'Calibri',
              }),
            ],
          }),
        );
      }

      // Add compliance notes if present
      if (q.compliance_notes) {
        sections.push(
          new Paragraph({
            children: [
              new TextRun({ text: 'Compliance Rationale: ', bold: true, color: '374151', size: 18 }),
              new TextRun({ text: q.compliance_notes, color: '374151', size: 18 }),
            ],
            shading: { type: ShadingType.SOLID, color: 'F3F4F6' },
            spacing: { before: 80, after: 80 },
            indent: { left: 200, right: 200 },
          })
        );
      }

      // Risk assessment
      if (q.committee_risk && q.committee_risk !== 'LOW') {
        sections.push(
          new Paragraph({
            spacing: { before: 60 },
            children: [
              new TextRun({
                text: 'Risk: ',
                bold: true,
                size: 17,
                color: COLORS.redText,
                font: 'Calibri',
              }),
              new TextRun({
                text: q.committee_risk,
                size: 17,
                color: COLORS.redText,
                font: 'Calibri',
              }),
            ],
          }),
        );
      }

      // Rationale (source/reasoning)
      if (q.rationale) {
        sections.push(
          new Paragraph({
            spacing: { before: 60 },
            children: [
              new TextRun({
                text: 'Source/Rationale: ',
                bold: true,
                size: 16,
                color: COLORS.gray,
                italics: true,
                font: 'Calibri',
              }),
              new TextRun({
                text: q.rationale.slice(0, 300),
                size: 16,
                color: COLORS.gray,
                italics: true,
                font: 'Calibri',
              }),
            ],
          }),
        );
      }

      // Pricing
      if (q.pricing) {
        sections.push(
          new Paragraph({
            spacing: { before: 40 },
            children: [
              new TextRun({
                text: 'Pricing: ',
                bold: true,
                size: 16,
                color: COLORS.gray,
                font: 'Calibri',
              }),
              new TextRun({ text: q.pricing, size: 16, color: COLORS.gray, font: 'Calibri' }),
            ],
          }),
        );
      }

      // AI Detection Details (Claude analysis - purple background)
      if (aiDetect.level !== 'low' && aiDetect.triggers.length > 0) {
        sections.push(
          new Paragraph({
            spacing: { before: 60 },
            shading: { type: ShadingType.SOLID, color: 'EDE9FE' },
            children: [
              new TextRun({
                text: 'CLAUDE NOTE: ',
                bold: true,
                size: 15,
                color: '6D28D9',
                font: 'Calibri',
              }),
              new TextRun({
                text: `AI detection score ${aiDetect.score} (${aiDetectLabel(aiDetect.level)}). Triggers: ${aiDetect.triggers.join(', ')}. `,
                size: 15,
                color: '6D28D9',
                font: 'Calibri',
              }),
              new TextRun({
                text: aiDetect.suggestion,
                size: 15,
                color: '6D28D9',
                italics: true,
                font: 'Calibri',
              }),
            ],
          }),
        );
      }

      // Claude CPO commentary for problem questions
      if (q.confidence === 'RED') {
        sections.push(
          new Paragraph({
            spacing: { before: 60 },
            shading: { type: ShadingType.SOLID, color: 'EDE9FE' },
            children: [
              new TextRun({
                text: 'CLAUDE RECOMMENDATION: ',
                bold: true,
                size: 15,
                color: '6D28D9',
                font: 'Calibri',
              }),
              new TextRun({
                text:
                  q.compliant === 'N'
                    ? 'This is a capability gap, not a response quality issue. Position this as a deliberate strategic focus on credit card excellence rather than a deficiency. If BSB requires this capability, present a partnership or roadmap timeline with specific milestones.'
                    : "Partial compliance needs a clear explanation of what IS covered vs what requires configuration or partnership. BSB's committee will probe this — prepare a verbal response for the Q&A session.",
                size: 15,
                color: '6D28D9',
                italics: true,
                font: 'Calibri',
              }),
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
    new Paragraph({
      spacing: { before: 600 },
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: 'This document is confidential and prepared solely for Bangor Savings Bank.',
          size: 16,
          color: COLORS.light,
          font: 'Calibri',
          italics: true,
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: `Brim Financial · ${new Date().getFullYear()}`,
          size: 16,
          color: COLORS.light,
          font: 'Calibri',
        }),
      ],
    }),
  );

  const doc = new Document({
    styles: {
      default: {
        document: {
          run: {
            font: 'Calibri',
            size: 22, // 11pt = 22 half-points
          },
        },
      },
    },
    sections: [
      {
        properties: {
          page: { margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 } },
        },
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [
                  new TextRun({
                    text: 'BSB Credit Card RFP Response — Brim Financial',
                    size: 14,
                    color: COLORS.light,
                    font: 'Calibri',
                  }),
                ],
              }),
            ],
          }),
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: 'Confidential',
                    size: 14,
                    color: COLORS.light,
                    font: 'Calibri',
                  }),
                ],
              }),
            ],
          }),
        },
        children: sections,
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  if (options?.returnBuffer) return buffer;
  const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength) as ArrayBuffer;
  const blob = new Blob([arrayBuffer], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
  saveAs(blob, 'BSB_RFP_Response_Brim_Financial.docx');
}
