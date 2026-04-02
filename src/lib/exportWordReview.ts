/**
 * exportWordReview — paragraph-focused working copy with feedback boxes
 *
 * Format per question:
 *   [Ref] · Topic · Compliant: Y · Score: 8/10
 *   ─────────────────────────────────────────
 *   BSB REQUIREMENT (gray box)
 *   BRIM FINANCIAL RESPONSE (paragraph text)
 *   FEEDBACK / REVIEW NOTES (empty yellow box)
 */
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
  UnderlineType,
} from 'docx';
import { saveAs } from 'file-saver';
import type { RFPData } from '@/types';

const C = {
  navy: '1E3A5F',
  navyBg: 'EBF2FA',
  green: '047857',
  greenBg: 'ECFDF5',
  yellow: 'B45309',
  yellowBg: 'FFFBEB',
  yellowFeedbackBg: 'FFFDE7',
  red: 'B91C1C',
  redBg: 'FEF2F2',
  gray: '6B7280',
  grayBg: 'F3F4F6',
  grayLight: 'E5E7EB',
  dark: '111827',
  medium: '374151',
  white: 'FFFFFF',
};

function confidenceLabel(c: string): { text: string; color: string } {
  if (c === 'GREEN') return { text: 'GREEN', color: C.green };
  if (c === 'YELLOW') return { text: 'YELLOW', color: C.yellow };
  if (c === 'RED') return { text: 'RED', color: C.red };
  return { text: c, color: C.gray };
}

function compliantLabel(v: string): { text: string; color: string } {
  if (v === 'Y') return { text: 'Compliant', color: C.green };
  if (v === 'N') return { text: 'Non-Compliant', color: C.red };
  return { text: 'Partial', color: C.yellow };
}

function emptyParagraph(before = 0, after = 0) {
  return new Paragraph({ spacing: { before, after } });
}

function sectionHeading(text: string, num: number) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    pageBreakBefore: num > 0,
    spacing: { before: 200, after: 160 },
    border: {
      bottom: { style: BorderStyle.SINGLE, size: 8, color: C.grayLight },
    },
    children: [
      new TextRun({
        text,
        bold: true,
        size: 28,
        font: 'Calibri',
        color: C.navy,
      }),
    ],
  });
}

function questionBlock(q: {
  ref: string;
  topic: string;
  requirement: string;
  paragraph: string;
  bullet: string;
  compliant: string;
  confidence: string;
  committee_score: number;
}) {
  const conf = confidenceLabel(q.confidence);
  const comp = compliantLabel(q.compliant);
  const score = q.committee_score ?? 0;
  const response = (q.paragraph || q.bullet || '').trim();

  const blocks: (Paragraph | Table)[] = [];

  // ── Question header line ──────────────────────────────────────────────────
  blocks.push(
    new Paragraph({
      spacing: { before: 240, after: 60 },
      children: [
        new TextRun({ text: q.ref, bold: true, size: 20, font: 'Calibri Mono', color: C.navy }),
        new TextRun({ text: '  ·  ', size: 20, font: 'Calibri', color: C.gray }),
        new TextRun({ text: q.topic, size: 20, font: 'Calibri', color: C.medium }),
        new TextRun({ text: '  ·  ', size: 20, font: 'Calibri', color: C.gray }),
        new TextRun({ text: comp.text, bold: true, size: 20, font: 'Calibri', color: comp.color }),
        new TextRun({ text: '  ·  ', size: 20, font: 'Calibri', color: C.gray }),
        new TextRun({ text: conf.text, bold: true, size: 20, font: 'Calibri', color: conf.color }),
        new TextRun({ text: '  ·  ', size: 20, font: 'Calibri', color: C.gray }),
        new TextRun({
          text: `${score}/10`,
          bold: score < 7,
          size: 20,
          font: 'Calibri',
          color: score >= 7 ? C.green : score >= 5 ? C.yellow : C.red,
        }),
      ],
    }),
  );

  // ── BSB Requirement box ───────────────────────────────────────────────────
  blocks.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: [
            new TableCell({
              shading: { type: ShadingType.SOLID, color: C.grayBg },
              margins: { top: 100, bottom: 100, left: 160, right: 160 },
              borders: {
                top: { style: BorderStyle.SINGLE, size: 4, color: C.grayLight },
                bottom: { style: BorderStyle.SINGLE, size: 4, color: C.grayLight },
                left: { style: BorderStyle.THICK, size: 12, color: C.gray },
                right: { style: BorderStyle.SINGLE, size: 4, color: C.grayLight },
              },
              children: [
                new Paragraph({
                  spacing: { before: 0, after: 60 },
                  children: [
                    new TextRun({
                      text: 'BSB REQUIREMENT',
                      bold: true,
                      size: 16,
                      font: 'Calibri',
                      color: C.gray,
                      allCaps: true,
                    }),
                  ],
                }),
                new Paragraph({
                  spacing: { before: 0, after: 0 },
                  children: [
                    new TextRun({
                      text: q.requirement || '—',
                      size: 20,
                      font: 'Calibri',
                      color: C.medium,
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),
      ],
    }),
  );

  blocks.push(emptyParagraph(80, 0));

  // ── Brim Response ─────────────────────────────────────────────────────────
  blocks.push(
    new Paragraph({
      spacing: { before: 0, after: 60 },
      children: [
        new TextRun({
          text: 'BRIM FINANCIAL RESPONSE',
          bold: true,
          size: 16,
          font: 'Calibri',
          color: C.navy,
          allCaps: true,
        }),
      ],
    }),
  );

  // Split response on newlines to preserve paragraph breaks
  const responseLines = response ? response.split('\n') : ['No response provided.'];
  for (const line of responseLines) {
    blocks.push(
      new Paragraph({
        spacing: { before: 0, after: 80 },
        children: [
          new TextRun({
            text: line || '',
            size: 22,
            font: 'Calibri',
            color: line ? C.dark : C.gray,
            italics: !line,
          }),
        ],
      }),
    );
  }

  // ── Feedback / Review Notes box ───────────────────────────────────────────
  blocks.push(emptyParagraph(60, 0));
  blocks.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: [
            new TableCell({
              shading: { type: ShadingType.SOLID, color: C.yellowFeedbackBg },
              margins: { top: 100, bottom: 200, left: 160, right: 160 },
              borders: {
                top: { style: BorderStyle.DASHED, size: 4, color: C.yellow },
                bottom: { style: BorderStyle.DASHED, size: 4, color: C.yellow },
                left: { style: BorderStyle.THICK, size: 12, color: C.yellow },
                right: { style: BorderStyle.DASHED, size: 4, color: C.yellow },
              },
              children: [
                new Paragraph({
                  spacing: { before: 0, after: 80 },
                  children: [
                    new TextRun({
                      text: 'FEEDBACK / REVIEW NOTES',
                      bold: true,
                      size: 16,
                      font: 'Calibri',
                      color: C.yellow,
                      allCaps: true,
                    }),
                  ],
                }),
                // Three blank lines for handwriting/typing
                new Paragraph({
                  spacing: { before: 0, after: 120 },
                  children: [new TextRun({ text: '', size: 20 })],
                }),
                new Paragraph({
                  spacing: { before: 0, after: 120 },
                  children: [new TextRun({ text: '', size: 20 })],
                }),
                new Paragraph({
                  spacing: { before: 0, after: 0 },
                  children: [new TextRun({ text: '', size: 20 })],
                }),
              ],
            }),
          ],
        }),
      ],
    }),
  );

  // ── Divider ───────────────────────────────────────────────────────────────
  blocks.push(
    new Paragraph({
      spacing: { before: 200, after: 0 },
      border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: C.grayLight } },
      children: [],
    }),
  );

  return blocks;
}

export interface ReviewExportOptions {
  returnBuffer?: boolean;
}

export async function exportWordReview(data: RFPData, options?: ReviewExportOptions) {
  const questions = data.questions;
  const categories = data.categories;

  // Group by category
  const grouped: Record<string, typeof questions> = {};
  for (const q of questions) {
    if (!grouped[q.category]) grouped[q.category] = [];
    grouped[q.category].push(q);
  }

  const sections: (Paragraph | Table)[] = [];

  // ── Cover page ─────────────────────────────────────────────────────────────
  sections.push(
    new Paragraph({
      spacing: { before: 1200, after: 200 },
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: 'BSB Credit Card Program RFP',
          bold: true,
          size: 52,
          font: 'Calibri',
          color: C.navy,
        }),
      ],
    }),
    new Paragraph({
      spacing: { before: 0, after: 200 },
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: 'Working Copy — Paragraph Responses with Review Notes',
          size: 28,
          font: 'Calibri',
          color: C.gray,
        }),
      ],
    }),
    new Paragraph({
      spacing: { before: 600, after: 100 },
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: 'Prepared by Brim Financial',
          bold: true,
          size: 24,
          font: 'Calibri',
          color: C.medium,
        }),
      ],
    }),
    new Paragraph({
      spacing: { before: 0, after: 100 },
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: new Date().toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          }),
          size: 22,
          font: 'Calibri',
          color: C.gray,
        }),
      ],
    }),
    new Paragraph({
      spacing: { before: 0, after: 100 },
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: `${questions.length} Requirements · ${categories.length} Categories`,
          size: 20,
          font: 'Calibri',
          color: C.gray,
        }),
      ],
    }),
    new Paragraph({
      spacing: { before: 600, after: 0 },
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: 'For Internal Review Only — Confidential',
          size: 18,
          font: 'Calibri',
          color: C.red,
          italics: true,
        }),
      ],
    }),
  );

  // Page break before content
  sections.push(
    new Paragraph({
      children: [new PageBreak()],
    }),
  );

  // ── Table of Contents ──────────────────────────────────────────────────────
  sections.push(
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 200, after: 160 },
      children: [
        new TextRun({ text: 'Table of Contents', bold: true, size: 28, font: 'Calibri', color: C.navy }),
      ],
    }),
  );

  for (let i = 0; i < categories.length; i++) {
    const cat = categories[i];
    const count = grouped[cat]?.length ?? 0;
    sections.push(
      new Paragraph({
        spacing: { before: 60, after: 60 },
        children: [
          new TextRun({ text: `${i + 1}.  `, bold: true, size: 20, font: 'Calibri', color: C.navy }),
          new TextRun({ text: cat, size: 20, font: 'Calibri', color: C.dark }),
          new TextRun({ text: `  (${count} questions)`, size: 18, font: 'Calibri', color: C.gray }),
        ],
      }),
    );
  }

  sections.push(new Paragraph({ children: [new PageBreak()] }));

  // ── Per-category content ───────────────────────────────────────────────────
  for (let catIdx = 0; catIdx < categories.length; catIdx++) {
    const cat = categories[catIdx];
    const catQs = grouped[cat] || [];
    if (!catQs.length) continue;

    const avgScore = catQs.reduce((s, q) => s + (q.committee_score || 0), 0) / catQs.length;
    const green = catQs.filter((q) => q.confidence === 'GREEN').length;
    const yellow = catQs.filter((q) => q.confidence === 'YELLOW').length;
    const red = catQs.filter((q) => q.confidence === 'RED').length;

    sections.push(sectionHeading(`${catIdx + 1}. ${cat}`, catIdx));

    sections.push(
      new Paragraph({
        spacing: { before: 0, after: 200 },
        children: [
          new TextRun({ text: `${catQs.length} questions  ·  `, size: 18, font: 'Calibri', color: C.gray }),
          new TextRun({ text: `Avg score: ${avgScore.toFixed(1)}/10  ·  `, size: 18, font: 'Calibri', color: C.gray }),
          new TextRun({ text: `${green} GREEN  `, size: 18, font: 'Calibri', color: C.green }),
          ...(yellow > 0 ? [new TextRun({ text: `${yellow} YELLOW  `, size: 18, font: 'Calibri', color: C.yellow })] : []),
          ...(red > 0 ? [new TextRun({ text: `${red} RED`, size: 18, font: 'Calibri', color: C.red })] : []),
        ],
      }),
    );

    for (const q of catQs) {
      const blocks = questionBlock(q);
      sections.push(...blocks);
    }
  }

  const doc = new Document({
    styles: {
      default: {
        document: {
          run: { font: 'Calibri', size: 22 },
          paragraph: { spacing: { line: 276 } },
        },
      },
    },
    sections: [
      {
        properties: {
          page: {
            margin: { top: 1080, bottom: 1080, left: 1080, right: 1080 },
          },
        },
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [
                  new TextRun({
                    text: 'BSB RFP — Working Copy · Brim Financial',
                    size: 16,
                    color: C.gray,
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
                    text: 'Confidential — For Internal Review Only · Brim Financial',
                    size: 16,
                    color: C.gray,
                    font: 'Calibri',
                  }),
                ],
              }),
            ],
          }),
        },
        children: sections as Paragraph[],
      },
    ],
  });

  if (options?.returnBuffer) {
    return Packer.toBuffer(doc);
  }

  const blob = await Packer.toBlob(doc);
  saveAs(blob, 'BSB_RFP_Working_Copy_Brim_Financial.docx');
}
