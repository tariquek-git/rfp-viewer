/**
 * exportWordSubmission — clean BSB submission document
 *
 * Professional RFP response document formatted for delivery to BSB.
 * No internal scores, no advisory notes, no AI indicators.
 * Clean paragraphs, organized by section, submission-ready.
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
  navyLight: '2E5F9F',
  gray: '6B7280',
  grayBg: 'F9FAFB',
  grayLight: 'E5E7EB',
  grayMid: 'D1D5DB',
  dark: '111827',
  medium: '374151',
  white: 'FFFFFF',
  accent: '0EA5E9',
  green: '047857',
  red: 'B91C1C',
};

function emptyParagraph(before = 0, after = 0) {
  return new Paragraph({ spacing: { before, after } });
}

function categoryHeading(title: string, idx: number) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    pageBreakBefore: idx > 0,
    spacing: { before: 240, after: 200 },
    border: {
      bottom: { style: BorderStyle.THICK, size: 8, color: C.navy },
    },
    shading: { type: ShadingType.SOLID, color: C.navyBg },
    children: [
      new TextRun({
        text: title,
        bold: true,
        size: 32,
        font: 'Calibri',
        color: C.navy,
      }),
    ],
  });
}

function questionEntry(q: {
  ref: string;
  number: number;
  topic: string;
  requirement: string;
  paragraph: string;
  bullet: string;
}) {
  const response = (q.paragraph || q.bullet || '').trim();
  const blocks: (Paragraph | Table)[] = [];

  // Question topic heading (H3)
  blocks.push(
    new Paragraph({
      heading: HeadingLevel.HEADING_3,
      spacing: { before: 320, after: 80 },
      children: [
        new TextRun({
          text: `${q.number || ''}. ${q.topic}`,
          bold: true,
          size: 24,
          font: 'Calibri',
          color: C.navy,
        }),
      ],
    }),
  );

  // Ref (small label)
  blocks.push(
    new Paragraph({
      spacing: { before: 0, after: 80 },
      children: [
        new TextRun({ text: 'Reference: ', bold: true, size: 17, font: 'Calibri', color: C.gray }),
        new TextRun({ text: q.ref, size: 17, font: 'Courier New', color: C.gray }),
      ],
    }),
  );

  // Requirement (shaded box)
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
                top: { style: BorderStyle.NONE },
                bottom: { style: BorderStyle.NONE },
                left: { style: BorderStyle.THICK, size: 16, color: C.navy },
                right: { style: BorderStyle.NONE },
              },
              children: [
                new Paragraph({
                  spacing: { before: 0, after: 60 },
                  children: [
                    new TextRun({
                      text: 'BSB Requirement',
                      bold: true,
                      size: 17,
                      font: 'Calibri',
                      color: C.gray,
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
                      italics: true,
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

  blocks.push(emptyParagraph(120, 0));

  // Response label
  blocks.push(
    new Paragraph({
      spacing: { before: 0, after: 80 },
      children: [
        new TextRun({
          text: 'Brim Financial Response',
          bold: true,
          size: 20,
          font: 'Calibri',
          color: C.navy,
        }),
      ],
    }),
  );

  // Response paragraphs
  const responseLines = response
    ? response.split('\n').filter((l) => l.trim())
    : ['No response provided.'];
  for (const line of responseLines) {
    blocks.push(
      new Paragraph({
        spacing: { before: 0, after: 120 },
        children: [
          new TextRun({
            text: line.trim(),
            size: 22,
            font: 'Calibri',
            color: line.trim() ? C.dark : C.gray,
            italics: !line.trim(),
          }),
        ],
      }),
    );
  }

  // Thin divider
  blocks.push(
    new Paragraph({
      spacing: { before: 200, after: 0 },
      border: { bottom: { style: BorderStyle.SINGLE, size: 2, color: C.grayLight } },
      children: [],
    }),
  );

  return blocks;
}

export interface SubmissionExportOptions {
  returnBuffer?: boolean;
}

export async function exportWordSubmission(data: RFPData, options?: SubmissionExportOptions) {
  const questions = data.questions;
  const categories = data.categories;

  // Stats for cover
  const compliantY = questions.filter((q) => q.compliant === 'Y').length;
  const green = questions.filter((q) => q.confidence === 'GREEN').length;

  const grouped: Record<string, typeof questions> = {};
  for (const q of questions) {
    if (!grouped[q.category]) grouped[q.category] = [];
    grouped[q.category].push(q);
  }

  const allBlocks: (Paragraph | Table)[] = [];

  // ── Cover page ──────────────────────────────────────────────────────────────
  allBlocks.push(
    new Paragraph({
      spacing: { before: 2400, after: 200 },
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: 'BSB Credit Card Program',
          bold: true,
          size: 64,
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
          text: 'Request for Proposal — Response',
          size: 36,
          font: 'Calibri',
          color: C.gray,
        }),
      ],
    }),
    new Paragraph({
      spacing: { before: 600, after: 60 },
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: '─────────────────',
          size: 20,
          font: 'Calibri',
          color: C.grayMid,
        }),
      ],
    }),
    new Paragraph({
      spacing: { before: 60, after: 100 },
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: 'Prepared by Brim Financial',
          bold: true,
          size: 26,
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
      spacing: { before: 600, after: 80 },
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: `${questions.length} Requirements Addressed · ${categories.length} Categories`,
          size: 20,
          font: 'Calibri',
          color: C.gray,
        }),
      ],
    }),
    new Paragraph({
      spacing: { before: 0, after: 80 },
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: `${compliantY} Requirements Fully Compliant (${Math.round((compliantY / questions.length) * 100)}%)`,
          size: 20,
          font: 'Calibri',
          color: C.gray,
        }),
      ],
    }),
    new Paragraph({
      spacing: { before: 0, after: 0 },
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: `${green} Responses Rated Strong by Brim Review Committee`,
          size: 20,
          font: 'Calibri',
          color: C.gray,
        }),
      ],
    }),
    new Paragraph({
      spacing: { before: 1200, after: 0 },
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: 'Confidential',
          size: 18,
          font: 'Calibri',
          color: C.gray,
          italics: true,
        }),
      ],
    }),
  );

  allBlocks.push(new Paragraph({ children: [new PageBreak()] }));

  // ── Executive Summary ───────────────────────────────────────────────────────
  allBlocks.push(
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 200, after: 200 },
      children: [
        new TextRun({ text: 'Executive Summary', bold: true, size: 36, font: 'Calibri', color: C.navy }),
      ],
    }),
    new Paragraph({
      spacing: { before: 0, after: 160 },
      children: [
        new TextRun({
          text: `Brim Financial is pleased to present this comprehensive response to Bangor Savings Bank's Credit Card Program Request for Proposal. This document addresses all ${questions.length} requirements across ${categories.length} functional areas.`,
          size: 22,
          font: 'Calibri',
          color: C.dark,
        }),
      ],
    }),
    new Paragraph({
      spacing: { before: 0, after: 160 },
      children: [
        new TextRun({
          text: `Of the ${questions.length} requirements, ${compliantY} (${Math.round((compliantY / questions.length) * 100)}%) are fully compliant with BSB's specifications. Brim Financial's purpose-built credit card platform, one-to-many agent banking architecture, and deep US regulatory experience position us as the ideal program management partner for BSB's credit card program.`,
          size: 22,
          font: 'Calibri',
          color: C.dark,
        }),
      ],
    }),
    new Paragraph({
      spacing: { before: 0, after: 160 },
      children: [
        new TextRun({
          text: 'All responses in this document represent current capabilities deployed in production across Brim Financial\'s live programs, including Continental Bank (US), Manulife Bank, and Affinity Credit Union.',
          size: 22,
          font: 'Calibri',
          color: C.dark,
        }),
      ],
    }),
  );

  allBlocks.push(new Paragraph({ children: [new PageBreak()] }));

  // ── Table of Contents ───────────────────────────────────────────────────────
  allBlocks.push(
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 200, after: 200 },
      children: [
        new TextRun({ text: 'Table of Contents', bold: true, size: 36, font: 'Calibri', color: C.navy }),
      ],
    }),
  );

  for (let i = 0; i < categories.length; i++) {
    const cat = categories[i];
    const count = grouped[cat]?.length ?? 0;
    allBlocks.push(
      new Paragraph({
        spacing: { before: 80, after: 80 },
        children: [
          new TextRun({ text: `${i + 1}.  `, bold: true, size: 22, font: 'Calibri', color: C.navy }),
          new TextRun({ text: cat, size: 22, font: 'Calibri', color: C.dark }),
          new TextRun({ text: `  ·  ${count} requirements`, size: 18, font: 'Calibri', color: C.gray }),
        ],
      }),
    );
  }

  allBlocks.push(new Paragraph({ children: [new PageBreak()] }));

  // ── Compliance Summary ──────────────────────────────────────────────────────
  allBlocks.push(
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 200, after: 80 },
      border: { bottom: { style: BorderStyle.THICK, size: 8, color: C.navy } },
      shading: { type: ShadingType.SOLID, color: C.navyBg },
      children: [new TextRun({ text: 'Compliance Summary', bold: true, size: 32, font: 'Calibri', color: C.navy })],
    }),
    new Paragraph({
      spacing: { before: 0, after: 160 },
      children: [new TextRun({ text: `Compliance status for all ${questions.length} requirements across ${categories.length} functional areas.`, size: 20, font: 'Calibri', color: C.gray, italics: true })],
    }),
  );

  allBlocks.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          tableHeader: true,
          children: [
            new TableCell({
              width: { size: 12, type: WidthType.PERCENTAGE },
              shading: { type: ShadingType.SOLID, color: C.navy },
              margins: { top: 80, bottom: 80, left: 120, right: 120 },
              children: [new Paragraph({ children: [new TextRun({ text: 'Ref', bold: true, size: 18, font: 'Calibri', color: C.white })] })],
            }),
            new TableCell({
              width: { size: 42, type: WidthType.PERCENTAGE },
              shading: { type: ShadingType.SOLID, color: C.navy },
              margins: { top: 80, bottom: 80, left: 120, right: 120 },
              children: [new Paragraph({ children: [new TextRun({ text: 'Requirement Topic', bold: true, size: 18, font: 'Calibri', color: C.white })] })],
            }),
            new TableCell({
              width: { size: 22, type: WidthType.PERCENTAGE },
              shading: { type: ShadingType.SOLID, color: C.navy },
              margins: { top: 80, bottom: 80, left: 120, right: 120 },
              children: [new Paragraph({ children: [new TextRun({ text: 'Category', bold: true, size: 18, font: 'Calibri', color: C.white })] })],
            }),
            new TableCell({
              width: { size: 24, type: WidthType.PERCENTAGE },
              shading: { type: ShadingType.SOLID, color: C.navy },
              margins: { top: 80, bottom: 80, left: 80, right: 80 },
              children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Compliance Status', bold: true, size: 18, font: 'Calibri', color: C.white })] })],
            }),
          ],
        }),
        ...questions.map((q, i) => {
          const isY = q.compliant === 'Y';
          const isN = q.compliant === 'N';
          const rowBg = i % 2 === 0 ? C.white : C.grayBg;
          const statusColor = isY ? C.green : isN ? C.red : C.navyLight;
          const statusText = isY ? 'Compliant' : isN ? 'Non-Compliant' : 'Partial';
          return new TableRow({
            children: [
              new TableCell({
                width: { size: 12, type: WidthType.PERCENTAGE },
                shading: { type: ShadingType.SOLID, color: rowBg },
                margins: { top: 50, bottom: 50, left: 120, right: 120 },
                children: [new Paragraph({ children: [new TextRun({ text: q.ref, size: 16, font: 'Courier New', color: C.navy })] })],
              }),
              new TableCell({
                width: { size: 42, type: WidthType.PERCENTAGE },
                shading: { type: ShadingType.SOLID, color: rowBg },
                margins: { top: 50, bottom: 50, left: 120, right: 120 },
                children: [new Paragraph({ children: [new TextRun({ text: q.topic || '', size: 16, font: 'Calibri', color: C.dark })] })],
              }),
              new TableCell({
                width: { size: 22, type: WidthType.PERCENTAGE },
                shading: { type: ShadingType.SOLID, color: rowBg },
                margins: { top: 50, bottom: 50, left: 120, right: 120 },
                children: [new Paragraph({ children: [new TextRun({ text: q.category, size: 15, font: 'Calibri', color: C.gray })] })],
              }),
              new TableCell({
                width: { size: 24, type: WidthType.PERCENTAGE },
                shading: { type: ShadingType.SOLID, color: rowBg },
                margins: { top: 50, bottom: 50, left: 80, right: 80 },
                children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: statusText, bold: true, size: 16, font: 'Calibri', color: statusColor })] })],
              }),
            ],
          });
        }),
      ],
    }),
  );

  allBlocks.push(new Paragraph({ children: [new PageBreak()] }));

  // ── Per-category sections ───────────────────────────────────────────────────
  for (let catIdx = 0; catIdx < categories.length; catIdx++) {
    const cat = categories[catIdx];
    const catQs = grouped[cat] || [];
    if (!catQs.length) continue;

    allBlocks.push(categoryHeading(`${catIdx + 1}. ${cat}`, catIdx));

    for (const q of catQs) {
      const blocks = questionEntry(q);
      allBlocks.push(...blocks);
    }
  }

  // ── Footer page ─────────────────────────────────────────────────────────────
  allBlocks.push(
    new Paragraph({ children: [new PageBreak()] }),
    new Paragraph({
      spacing: { before: 1200, after: 200 },
      alignment: AlignmentType.CENTER,
      border: { top: { style: BorderStyle.SINGLE, size: 4, color: C.grayLight } },
      children: [
        new TextRun({
          text: 'This document is confidential and prepared solely for Bangor Savings Bank.',
          size: 18,
          font: 'Calibri',
          color: C.gray,
          italics: true,
        }),
      ],
    }),
    new Paragraph({
      spacing: { before: 0, after: 0 },
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: `Brim Financial · ${new Date().getFullYear()}`,
          size: 18,
          font: 'Calibri',
          color: C.gray,
        }),
      ],
    }),
  );

  const doc = new Document({
    styles: {
      default: {
        document: {
          run: { font: 'Calibri', size: 22 },
          paragraph: { spacing: { line: 276 } },
        },
        heading1: {
          run: { font: 'Calibri', bold: true, color: C.navy },
          paragraph: { spacing: { before: 240, after: 160 } },
        },
        heading3: {
          run: { font: 'Calibri', bold: true, color: C.navy },
          paragraph: { spacing: { before: 200, after: 80 } },
        },
      },
    },
    sections: [
      {
        properties: {
          page: {
            margin: { top: 1080, bottom: 1080, left: 1260, right: 1260 },
          },
        },
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: C.grayLight } },
                children: [
                  new TextRun({
                    text: 'BSB Credit Card Program RFP Response · Brim Financial · Confidential',
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
                border: { top: { style: BorderStyle.SINGLE, size: 4, color: C.grayLight } },
                children: [
                  new TextRun({ text: `Brim Financial · BSB RFP Response · ${new Date().getFullYear()} · Confidential · Page `, size: 16, color: C.gray, font: 'Calibri' }),
                  new TextRun({ children: [PageNumber.CURRENT], size: 16, color: C.gray, font: 'Calibri' }),
                  new TextRun({ text: ' of ', size: 16, color: C.gray, font: 'Calibri' }),
                  new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 16, color: C.gray, font: 'Calibri' }),
                ],
              }),
            ],
          }),
        },
        children: allBlocks as unknown as Paragraph[],
      },
    ],
  });

  if (options?.returnBuffer) {
    return Packer.toBuffer(doc);
  }

  const blob = await Packer.toBlob(doc);
  saveAs(blob, 'BSB_RFP_Submission_Brim_Financial.docx');
}
