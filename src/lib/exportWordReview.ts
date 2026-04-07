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
  PageNumber,
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
  committee_review: string;
  committee_risk: string;
  strategic: boolean;
  reg_enable: boolean;
  a_oob: boolean;
  b_config: boolean;
  c_custom: boolean;
  d_dnm: boolean;
  status: string;
  rationale: string;
  compliance_notes?: string;
  notes: string;
  pricing: string;
}) {
  const conf = confidenceLabel(q.confidence);
  const comp = compliantLabel(q.compliant);
  const score = q.committee_score ?? 0;
  const response = (q.paragraph || q.bullet || '').trim();

  // Delivery method flags
  const delivery: string[] = [];
  if (q.a_oob) delivery.push('OOB');
  if (q.b_config) delivery.push('Config');
  if (q.c_custom) delivery.push('Custom');
  if (q.d_dnm) delivery.push('DNM');

  const blocks: (Paragraph | Table)[] = [];

  // ── Question header line ──────────────────────────────────────────────────
  blocks.push(
    new Paragraph({
      spacing: { before: 240, after: 60 },
      children: [
        new TextRun({ text: q.ref, bold: true, size: 20, font: 'Courier New', color: C.navy }),
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

  // ── Metadata tags line ────────────────────────────────────────────────────
  const metaParts: { text: string; color: string; bold?: boolean }[] = [];
  if (delivery.length) {
    metaParts.push({ text: 'Delivery: ', color: C.gray });
    metaParts.push({ text: delivery.join(' / '), color: C.navy, bold: true });
    metaParts.push({ text: '   ', color: C.gray });
  }
  if (q.strategic) {
    metaParts.push({ text: '★ Strategic', color: C.green, bold: true });
    metaParts.push({ text: '   ', color: C.gray });
  }
  if (q.reg_enable) {
    metaParts.push({ text: '⚑ Reg-Enabled', color: C.yellow, bold: true });
    metaParts.push({ text: '   ', color: C.gray });
  }
  if (q.status) {
    metaParts.push({ text: 'Status: ', color: C.gray });
    metaParts.push({ text: q.status.toUpperCase(), color: C.medium, bold: true });
  }
  if (metaParts.length) {
    blocks.push(
      new Paragraph({
        spacing: { before: 0, after: 80 },
        children: metaParts.map(
          (p) =>
            new TextRun({ text: p.text, size: 18, font: 'Calibri', color: p.color, bold: p.bold }),
        ),
      }),
    );
  }

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

  // ── Committee Assessment ──────────────────────────────────────────────────
  if (
    q.committee_review ||
    q.committee_risk ||
    q.rationale ||
    q.compliance_notes ||
    q.notes ||
    q.pricing
  ) {
    blocks.push(emptyParagraph(60, 0));
    const committeeRows: TableRow[] = [];

    if (q.committee_review) {
      committeeRows.push(
        new TableRow({
          children: [
            new TableCell({
              width: { size: 22, type: WidthType.PERCENTAGE },
              shading: { type: ShadingType.SOLID, color: C.navyBg },
              margins: { top: 60, bottom: 60, left: 120, right: 120 },
              borders: {
                top: { style: BorderStyle.NONE },
                bottom: { style: BorderStyle.NONE },
                left: { style: BorderStyle.NONE },
                right: { style: BorderStyle.NONE },
              },
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: 'Committee Review',
                      bold: true,
                      size: 17,
                      font: 'Calibri',
                      color: C.navy,
                    }),
                  ],
                }),
              ],
            }),
            new TableCell({
              width: { size: 78, type: WidthType.PERCENTAGE },
              margins: { top: 60, bottom: 60, left: 120, right: 120 },
              borders: {
                top: { style: BorderStyle.NONE },
                bottom: { style: BorderStyle.NONE },
                left: { style: BorderStyle.NONE },
                right: { style: BorderStyle.NONE },
              },
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: q.committee_review,
                      size: 18,
                      font: 'Calibri',
                      color: C.medium,
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),
      );
    }

    if (q.committee_risk) {
      committeeRows.push(
        new TableRow({
          children: [
            new TableCell({
              width: { size: 22, type: WidthType.PERCENTAGE },
              shading: { type: ShadingType.SOLID, color: C.navyBg },
              margins: { top: 60, bottom: 60, left: 120, right: 120 },
              borders: {
                top: { style: BorderStyle.NONE },
                bottom: { style: BorderStyle.NONE },
                left: { style: BorderStyle.NONE },
                right: { style: BorderStyle.NONE },
              },
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: 'Risk Assessment',
                      bold: true,
                      size: 17,
                      font: 'Calibri',
                      color: C.red,
                    }),
                  ],
                }),
              ],
            }),
            new TableCell({
              width: { size: 78, type: WidthType.PERCENTAGE },
              margins: { top: 60, bottom: 60, left: 120, right: 120 },
              borders: {
                top: { style: BorderStyle.NONE },
                bottom: { style: BorderStyle.NONE },
                left: { style: BorderStyle.NONE },
                right: { style: BorderStyle.NONE },
              },
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: q.committee_risk,
                      size: 18,
                      font: 'Calibri',
                      color: C.medium,
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),
      );
    }

    if (q.rationale) {
      committeeRows.push(
        new TableRow({
          children: [
            new TableCell({
              width: { size: 22, type: WidthType.PERCENTAGE },
              shading: { type: ShadingType.SOLID, color: C.navyBg },
              margins: { top: 60, bottom: 60, left: 120, right: 120 },
              borders: {
                top: { style: BorderStyle.NONE },
                bottom: { style: BorderStyle.NONE },
                left: { style: BorderStyle.NONE },
                right: { style: BorderStyle.NONE },
              },
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: 'Rationale',
                      bold: true,
                      size: 17,
                      font: 'Calibri',
                      color: C.navy,
                    }),
                  ],
                }),
              ],
            }),
            new TableCell({
              width: { size: 78, type: WidthType.PERCENTAGE },
              margins: { top: 60, bottom: 60, left: 120, right: 120 },
              borders: {
                top: { style: BorderStyle.NONE },
                bottom: { style: BorderStyle.NONE },
                left: { style: BorderStyle.NONE },
                right: { style: BorderStyle.NONE },
              },
              children: [
                new Paragraph({
                  children: [
                    new TextRun({ text: q.rationale, size: 18, font: 'Calibri', color: C.medium }),
                  ],
                }),
              ],
            }),
          ],
        }),
      );
    }

    if (q.compliance_notes) {
      committeeRows.push(
        new TableRow({
          children: [
            new TableCell({
              width: { size: 22, type: WidthType.PERCENTAGE },
              shading: { type: ShadingType.SOLID, color: C.navyBg },
              margins: { top: 60, bottom: 60, left: 120, right: 120 },
              borders: {
                top: { style: BorderStyle.NONE },
                bottom: { style: BorderStyle.NONE },
                left: { style: BorderStyle.NONE },
                right: { style: BorderStyle.NONE },
              },
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: 'Compliance Notes',
                      bold: true,
                      size: 17,
                      font: 'Calibri',
                      color: C.yellow,
                    }),
                  ],
                }),
              ],
            }),
            new TableCell({
              width: { size: 78, type: WidthType.PERCENTAGE },
              margins: { top: 60, bottom: 60, left: 120, right: 120 },
              borders: {
                top: { style: BorderStyle.NONE },
                bottom: { style: BorderStyle.NONE },
                left: { style: BorderStyle.NONE },
                right: { style: BorderStyle.NONE },
              },
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: q.compliance_notes,
                      size: 18,
                      font: 'Calibri',
                      color: C.medium,
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),
      );
    }

    if (q.notes) {
      committeeRows.push(
        new TableRow({
          children: [
            new TableCell({
              width: { size: 22, type: WidthType.PERCENTAGE },
              shading: { type: ShadingType.SOLID, color: C.navyBg },
              margins: { top: 60, bottom: 60, left: 120, right: 120 },
              borders: {
                top: { style: BorderStyle.NONE },
                bottom: { style: BorderStyle.NONE },
                left: { style: BorderStyle.NONE },
                right: { style: BorderStyle.NONE },
              },
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: 'Internal Notes',
                      bold: true,
                      size: 17,
                      font: 'Calibri',
                      color: C.navy,
                    }),
                  ],
                }),
              ],
            }),
            new TableCell({
              width: { size: 78, type: WidthType.PERCENTAGE },
              margins: { top: 60, bottom: 60, left: 120, right: 120 },
              borders: {
                top: { style: BorderStyle.NONE },
                bottom: { style: BorderStyle.NONE },
                left: { style: BorderStyle.NONE },
                right: { style: BorderStyle.NONE },
              },
              children: [
                new Paragraph({
                  children: [
                    new TextRun({ text: q.notes, size: 18, font: 'Calibri', color: C.medium }),
                  ],
                }),
              ],
            }),
          ],
        }),
      );
    }

    if (q.pricing) {
      committeeRows.push(
        new TableRow({
          children: [
            new TableCell({
              width: { size: 22, type: WidthType.PERCENTAGE },
              shading: { type: ShadingType.SOLID, color: C.navyBg },
              margins: { top: 60, bottom: 60, left: 120, right: 120 },
              borders: {
                top: { style: BorderStyle.NONE },
                bottom: { style: BorderStyle.NONE },
                left: { style: BorderStyle.NONE },
                right: { style: BorderStyle.NONE },
              },
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: 'Pricing Notes',
                      bold: true,
                      size: 17,
                      font: 'Calibri',
                      color: C.navy,
                    }),
                  ],
                }),
              ],
            }),
            new TableCell({
              width: { size: 78, type: WidthType.PERCENTAGE },
              margins: { top: 60, bottom: 60, left: 120, right: 120 },
              borders: {
                top: { style: BorderStyle.NONE },
                bottom: { style: BorderStyle.NONE },
                left: { style: BorderStyle.NONE },
                right: { style: BorderStyle.NONE },
              },
              children: [
                new Paragraph({
                  children: [
                    new TextRun({ text: q.pricing, size: 18, font: 'Calibri', color: C.medium }),
                  ],
                }),
              ],
            }),
          ],
        }),
      );
    }

    if (committeeRows.length) {
      blocks.push(
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: {
            top: { style: BorderStyle.SINGLE, size: 4, color: C.navyBg },
            bottom: { style: BorderStyle.SINGLE, size: 4, color: C.navyBg },
            left: { style: BorderStyle.THICK, size: 12, color: C.navy },
            right: { style: BorderStyle.NONE },
          },
          rows: committeeRows,
        }),
      );
    }
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
                new Paragraph({
                  spacing: { before: 0, after: 60 },
                  children: [
                    new TextRun({
                      text: 'Reviewed by: ________________________________   Date: ____________',
                      size: 17,
                      font: 'Calibri',
                      color: C.yellow,
                    }),
                  ],
                }),
                // Six blank lines for notes
                ...[1, 2, 3, 4, 5, 6].map(
                  () =>
                    new Paragraph({
                      spacing: { before: 0, after: 120 },
                      children: [new TextRun({ text: '', size: 20 })],
                    }),
                ),
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
        new TextRun({
          text: 'Table of Contents',
          bold: true,
          size: 28,
          font: 'Calibri',
          color: C.navy,
        }),
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
          new TextRun({
            text: `${i + 1}.  `,
            bold: true,
            size: 20,
            font: 'Calibri',
            color: C.navy,
          }),
          new TextRun({ text: cat, size: 20, font: 'Calibri', color: C.dark }),
          new TextRun({ text: `  (${count} questions)`, size: 18, font: 'Calibri', color: C.gray }),
        ],
      }),
    );
  }

  sections.push(new Paragraph({ children: [new PageBreak()] }));

  // ── Category Scorecard ─────────────────────────────────────────────────────
  sections.push(
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 200, after: 160 },
      border: { bottom: { style: BorderStyle.SINGLE, size: 8, color: C.grayLight } },
      children: [
        new TextRun({
          text: 'Category Scorecard',
          bold: true,
          size: 28,
          font: 'Calibri',
          color: C.navy,
        }),
      ],
    }),
  );

  // Scorecard table header
  sections.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          tableHeader: true,
          children: [
            new TableCell({
              width: { size: 38, type: WidthType.PERCENTAGE },
              shading: { type: ShadingType.SOLID, color: C.navy },
              margins: { top: 80, bottom: 80, left: 120, right: 120 },
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: 'Category',
                      bold: true,
                      size: 18,
                      font: 'Calibri',
                      color: C.white,
                    }),
                  ],
                }),
              ],
            }),
            new TableCell({
              width: { size: 10, type: WidthType.PERCENTAGE },
              shading: { type: ShadingType.SOLID, color: C.navy },
              margins: { top: 80, bottom: 80, left: 80, right: 80 },
              children: [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [
                    new TextRun({
                      text: 'Qs',
                      bold: true,
                      size: 18,
                      font: 'Calibri',
                      color: C.white,
                    }),
                  ],
                }),
              ],
            }),
            new TableCell({
              width: { size: 13, type: WidthType.PERCENTAGE },
              shading: { type: ShadingType.SOLID, color: C.navy },
              margins: { top: 80, bottom: 80, left: 80, right: 80 },
              children: [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [
                    new TextRun({
                      text: 'Avg Score',
                      bold: true,
                      size: 18,
                      font: 'Calibri',
                      color: C.white,
                    }),
                  ],
                }),
              ],
            }),
            new TableCell({
              width: { size: 13, type: WidthType.PERCENTAGE },
              shading: { type: ShadingType.SOLID, color: C.green },
              margins: { top: 80, bottom: 80, left: 80, right: 80 },
              children: [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [
                    new TextRun({
                      text: 'GREEN',
                      bold: true,
                      size: 18,
                      font: 'Calibri',
                      color: C.white,
                    }),
                  ],
                }),
              ],
            }),
            new TableCell({
              width: { size: 13, type: WidthType.PERCENTAGE },
              shading: { type: ShadingType.SOLID, color: C.yellow },
              margins: { top: 80, bottom: 80, left: 80, right: 80 },
              children: [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [
                    new TextRun({
                      text: 'YELLOW',
                      bold: true,
                      size: 18,
                      font: 'Calibri',
                      color: C.white,
                    }),
                  ],
                }),
              ],
            }),
            new TableCell({
              width: { size: 13, type: WidthType.PERCENTAGE },
              shading: { type: ShadingType.SOLID, color: C.red },
              margins: { top: 80, bottom: 80, left: 80, right: 80 },
              children: [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [
                    new TextRun({
                      text: 'RED',
                      bold: true,
                      size: 18,
                      font: 'Calibri',
                      color: C.white,
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),
        ...categories.map((cat, i) => {
          const catQs = grouped[cat] || [];
          const avgScore = catQs.length
            ? catQs.reduce((s, q) => s + (q.committee_score || 0), 0) / catQs.length
            : 0;
          const greenCount = catQs.filter((q) => q.confidence === 'GREEN').length;
          const yellowCount = catQs.filter((q) => q.confidence === 'YELLOW').length;
          const redCount = catQs.filter((q) => q.confidence === 'RED').length;
          const rowBg = i % 2 === 0 ? C.white : C.grayBg;
          const scoreColor = avgScore >= 7 ? C.green : avgScore >= 5 ? C.yellow : C.red;
          return new TableRow({
            children: [
              new TableCell({
                width: { size: 38, type: WidthType.PERCENTAGE },
                shading: { type: ShadingType.SOLID, color: rowBg },
                margins: { top: 60, bottom: 60, left: 120, right: 120 },
                children: [
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: `${i + 1}. ${cat}`,
                        size: 18,
                        font: 'Calibri',
                        color: C.dark,
                      }),
                    ],
                  }),
                ],
              }),
              new TableCell({
                width: { size: 10, type: WidthType.PERCENTAGE },
                shading: { type: ShadingType.SOLID, color: rowBg },
                margins: { top: 60, bottom: 60, left: 80, right: 80 },
                children: [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                      new TextRun({
                        text: `${catQs.length}`,
                        size: 18,
                        font: 'Calibri',
                        color: C.gray,
                      }),
                    ],
                  }),
                ],
              }),
              new TableCell({
                width: { size: 13, type: WidthType.PERCENTAGE },
                shading: { type: ShadingType.SOLID, color: rowBg },
                margins: { top: 60, bottom: 60, left: 80, right: 80 },
                children: [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                      new TextRun({
                        text: avgScore.toFixed(1),
                        bold: true,
                        size: 18,
                        font: 'Calibri',
                        color: scoreColor,
                      }),
                    ],
                  }),
                ],
              }),
              new TableCell({
                width: { size: 13, type: WidthType.PERCENTAGE },
                shading: { type: ShadingType.SOLID, color: rowBg },
                margins: { top: 60, bottom: 60, left: 80, right: 80 },
                children: [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                      new TextRun({
                        text: `${greenCount}`,
                        bold: greenCount > 0,
                        size: 18,
                        font: 'Calibri',
                        color: greenCount > 0 ? C.green : C.gray,
                      }),
                    ],
                  }),
                ],
              }),
              new TableCell({
                width: { size: 13, type: WidthType.PERCENTAGE },
                shading: { type: ShadingType.SOLID, color: rowBg },
                margins: { top: 60, bottom: 60, left: 80, right: 80 },
                children: [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                      new TextRun({
                        text: `${yellowCount}`,
                        bold: yellowCount > 0,
                        size: 18,
                        font: 'Calibri',
                        color: yellowCount > 0 ? C.yellow : C.gray,
                      }),
                    ],
                  }),
                ],
              }),
              new TableCell({
                width: { size: 13, type: WidthType.PERCENTAGE },
                shading: { type: ShadingType.SOLID, color: rowBg },
                margins: { top: 60, bottom: 60, left: 80, right: 80 },
                children: [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                      new TextRun({
                        text: `${redCount}`,
                        bold: redCount > 0,
                        size: 18,
                        font: 'Calibri',
                        color: redCount > 0 ? C.red : C.gray,
                      }),
                    ],
                  }),
                ],
              }),
            ],
          });
        }),
      ],
    }),
  );

  sections.push(new Paragraph({ children: [new PageBreak()] }));

  // ── Action Required ────────────────────────────────────────────────────────
  const actionQs = questions.filter(
    (q) =>
      q.confidence === 'RED' ||
      q.compliant === 'N' ||
      (q.committee_score > 0 && q.committee_score < 5),
  );
  sections.push(
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 200, after: 80 },
      border: { bottom: { style: BorderStyle.SINGLE, size: 8, color: C.red } },
      children: [
        new TextRun({
          text: `Action Required  (${actionQs.length} questions)`,
          bold: true,
          size: 28,
          font: 'Calibri',
          color: C.red,
        }),
      ],
    }),
    new Paragraph({
      spacing: { before: 0, after: 160 },
      children: [
        new TextRun({
          text: 'Questions with RED confidence, Non-Compliant status, or committee score below 5/10.',
          size: 18,
          font: 'Calibri',
          color: C.gray,
          italics: true,
        }),
      ],
    }),
  );

  if (actionQs.length) {
    sections.push(
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({
            tableHeader: true,
            children: [
              new TableCell({
                width: { size: 12, type: WidthType.PERCENTAGE },
                shading: { type: ShadingType.SOLID, color: C.red },
                margins: { top: 80, bottom: 80, left: 120, right: 120 },
                children: [
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: 'Ref',
                        bold: true,
                        size: 18,
                        font: 'Calibri',
                        color: C.white,
                      }),
                    ],
                  }),
                ],
              }),
              new TableCell({
                width: { size: 32, type: WidthType.PERCENTAGE },
                shading: { type: ShadingType.SOLID, color: C.red },
                margins: { top: 80, bottom: 80, left: 120, right: 120 },
                children: [
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: 'Topic',
                        bold: true,
                        size: 18,
                        font: 'Calibri',
                        color: C.white,
                      }),
                    ],
                  }),
                ],
              }),
              new TableCell({
                width: { size: 18, type: WidthType.PERCENTAGE },
                shading: { type: ShadingType.SOLID, color: C.red },
                margins: { top: 80, bottom: 80, left: 80, right: 80 },
                children: [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                      new TextRun({
                        text: 'Confidence',
                        bold: true,
                        size: 18,
                        font: 'Calibri',
                        color: C.white,
                      }),
                    ],
                  }),
                ],
              }),
              new TableCell({
                width: { size: 18, type: WidthType.PERCENTAGE },
                shading: { type: ShadingType.SOLID, color: C.red },
                margins: { top: 80, bottom: 80, left: 80, right: 80 },
                children: [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                      new TextRun({
                        text: 'Compliant',
                        bold: true,
                        size: 18,
                        font: 'Calibri',
                        color: C.white,
                      }),
                    ],
                  }),
                ],
              }),
              new TableCell({
                width: { size: 10, type: WidthType.PERCENTAGE },
                shading: { type: ShadingType.SOLID, color: C.red },
                margins: { top: 80, bottom: 80, left: 80, right: 80 },
                children: [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                      new TextRun({
                        text: 'Score',
                        bold: true,
                        size: 18,
                        font: 'Calibri',
                        color: C.white,
                      }),
                    ],
                  }),
                ],
              }),
              new TableCell({
                width: { size: 10, type: WidthType.PERCENTAGE },
                shading: { type: ShadingType.SOLID, color: C.red },
                margins: { top: 80, bottom: 80, left: 80, right: 80 },
                children: [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                      new TextRun({
                        text: 'Category',
                        bold: true,
                        size: 18,
                        font: 'Calibri',
                        color: C.white,
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),
          ...actionQs.map((q, i) => {
            const conf = confidenceLabel(q.confidence);
            const comp = compliantLabel(q.compliant);
            const rowBg = i % 2 === 0 ? 'FFF5F5' : C.white;
            return new TableRow({
              children: [
                new TableCell({
                  width: { size: 12, type: WidthType.PERCENTAGE },
                  shading: { type: ShadingType.SOLID, color: rowBg },
                  margins: { top: 60, bottom: 60, left: 120, right: 120 },
                  children: [
                    new Paragraph({
                      children: [
                        new TextRun({
                          text: q.ref,
                          bold: true,
                          size: 17,
                          font: 'Courier New',
                          color: C.navy,
                        }),
                      ],
                    }),
                  ],
                }),
                new TableCell({
                  width: { size: 32, type: WidthType.PERCENTAGE },
                  shading: { type: ShadingType.SOLID, color: rowBg },
                  margins: { top: 60, bottom: 60, left: 120, right: 120 },
                  children: [
                    new Paragraph({
                      children: [
                        new TextRun({
                          text: q.topic || '',
                          size: 17,
                          font: 'Calibri',
                          color: C.dark,
                        }),
                      ],
                    }),
                  ],
                }),
                new TableCell({
                  width: { size: 18, type: WidthType.PERCENTAGE },
                  shading: { type: ShadingType.SOLID, color: rowBg },
                  margins: { top: 60, bottom: 60, left: 80, right: 80 },
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [
                        new TextRun({
                          text: conf.text,
                          bold: true,
                          size: 17,
                          font: 'Calibri',
                          color: conf.color,
                        }),
                      ],
                    }),
                  ],
                }),
                new TableCell({
                  width: { size: 18, type: WidthType.PERCENTAGE },
                  shading: { type: ShadingType.SOLID, color: rowBg },
                  margins: { top: 60, bottom: 60, left: 80, right: 80 },
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [
                        new TextRun({
                          text: comp.text,
                          bold: true,
                          size: 17,
                          font: 'Calibri',
                          color: comp.color,
                        }),
                      ],
                    }),
                  ],
                }),
                new TableCell({
                  width: { size: 10, type: WidthType.PERCENTAGE },
                  shading: { type: ShadingType.SOLID, color: rowBg },
                  margins: { top: 60, bottom: 60, left: 80, right: 80 },
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [
                        new TextRun({
                          text: `${q.committee_score}/10`,
                          bold: true,
                          size: 17,
                          font: 'Calibri',
                          color: q.committee_score < 5 ? C.red : C.yellow,
                        }),
                      ],
                    }),
                  ],
                }),
                new TableCell({
                  width: { size: 10, type: WidthType.PERCENTAGE },
                  shading: { type: ShadingType.SOLID, color: rowBg },
                  margins: { top: 60, bottom: 60, left: 80, right: 80 },
                  children: [
                    new Paragraph({
                      children: [
                        new TextRun({ text: q.category, size: 15, font: 'Calibri', color: C.gray }),
                      ],
                    }),
                  ],
                }),
              ],
            });
          }),
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
          new TextRun({
            text: `${catQs.length} questions  ·  `,
            size: 18,
            font: 'Calibri',
            color: C.gray,
          }),
          new TextRun({
            text: `Avg score: ${avgScore.toFixed(1)}/10  ·  `,
            size: 18,
            font: 'Calibri',
            color: C.gray,
          }),
          new TextRun({ text: `${green} GREEN  `, size: 18, font: 'Calibri', color: C.green }),
          ...(yellow > 0
            ? [
                new TextRun({
                  text: `${yellow} YELLOW  `,
                  size: 18,
                  font: 'Calibri',
                  color: C.yellow,
                }),
              ]
            : []),
          ...(red > 0
            ? [new TextRun({ text: `${red} RED`, size: 18, font: 'Calibri', color: C.red })]
            : []),
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
                    text: 'Confidential — For Internal Review Only · Brim Financial · Page ',
                    size: 16,
                    color: C.gray,
                    font: 'Calibri',
                  }),
                  new TextRun({
                    children: [PageNumber.CURRENT],
                    size: 16,
                    color: C.gray,
                    font: 'Calibri',
                  }),
                  new TextRun({ text: ' of ', size: 16, color: C.gray, font: 'Calibri' }),
                  new TextRun({
                    children: [PageNumber.TOTAL_PAGES],
                    size: 16,
                    color: C.gray,
                    font: 'Calibri',
                  }),
                ],
              }),
            ],
          }),
        },
        children: sections as unknown as Paragraph[],
      },
    ],
  });

  if (options?.returnBuffer) {
    return Packer.toBuffer(doc);
  }

  const blob = await Packer.toBlob(doc);
  saveAs(blob, 'BSB_RFP_Working_Copy_Brim_Financial.docx');
}
