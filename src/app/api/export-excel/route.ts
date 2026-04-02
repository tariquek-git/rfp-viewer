import { NextResponse } from 'next/server';
import ExcelJS from 'exceljs';
import type { RFPData } from '@/types';
import { detectAIWriting } from '@/lib/aiDetect';

// Confidence/compliant color fills
const FILL = {
  GREEN: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFd1fae5' } } as ExcelJS.Fill,
  YELLOW: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFfef3c7' } } as ExcelJS.Fill,
  RED: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFfee2e2' } } as ExcelJS.Fill,
  Y: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFd1fae5' } } as ExcelJS.Fill,
  N: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFfee2e2' } } as ExcelJS.Fill,
  PARTIAL: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFfef3c7' } } as ExcelJS.Fill,
  HEADER: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1e3a5f' } } as ExcelJS.Fill,
  SCORE_GREEN: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFecfdf5' } } as ExcelJS.Fill,
  SCORE_YEL: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFfffbeb' } } as ExcelJS.Fill,
  SCORE_RED: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFfff1f2' } } as ExcelJS.Fill,
};

const BORDER: Partial<ExcelJS.Borders> = {
  top: { style: 'thin', color: { argb: 'FFd1d5db' } },
  left: { style: 'thin', color: { argb: 'FFd1d5db' } },
  bottom: { style: 'thin', color: { argb: 'FFd1d5db' } },
  right: { style: 'thin', color: { argb: 'FFd1d5db' } },
};
const BORDER_HEADER_BOTTOM: Partial<ExcelJS.Borders> = {
  top: { style: 'thin', color: { argb: 'FFd1d5db' } },
  left: { style: 'thin', color: { argb: 'FFd1d5db' } },
  bottom: { style: 'medium', color: { argb: 'FF9ca3af' } },
  right: { style: 'thin', color: { argb: 'FFd1d5db' } },
};
const ROW_EVEN: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8F1FA' } };
const ROW_ODD: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFFF' } };

function delivery(q: {
  a_oob: boolean;
  b_config: boolean;
  c_custom: boolean;
  d_dnm: boolean;
}): string {
  const p: string[] = [];
  if (q.a_oob) p.push('OOB');
  if (q.b_config) p.push('Config');
  if (q.c_custom) p.push('Custom');
  if (q.d_dnm) p.push('DNM');
  return p.join(' / ') || '—';
}

function applyHeader(ws: ExcelJS.Worksheet, headers: string[], widths: number[]) {
  const row = ws.addRow(headers);
  row.eachCell((cell) => {
    cell.fill = FILL.HEADER;
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11, name: 'Calibri' };
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: false };
    cell.border = BORDER_HEADER_BOTTOM;
  });
  row.height = 30;
  widths.forEach((w, i) => {
    ws.getColumn(i + 1).width = w;
  });
  ws.views = [{ state: 'frozen', ySplit: 1, xSplit: 0, showGridLines: false }];
}

export async function POST(request: Request) {
  const body = (await request.json()) as { data: RFPData };
  const { data } = body;

  const wb = new ExcelJS.Workbook();
  wb.creator = 'Brim Financial';
  wb.created = new Date();

  const MAT_HEADERS = [
    '#',
    'Category',
    'Ref',
    'Topic',
    'Requirement',
    'Response (Bullet)',
    'Response (Paragraph)',
    'Delivery',
    'Compliant',
    'Confidence',
    'Score',
    'Status',
    'AI Risk',
    'Compliance Notes',
    'Feedback Notes',
  ];
  const MAT_WIDTHS = [5, 22, 12, 22, 42, 42, 52, 16, 12, 12, 8, 12, 10, 42, 44];
  const FEEDBACK_FILL: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFDE7' } };

  // ── Sheet 1: Compliance Matrix ────────────────────────────────────────────
  const ws1 = wb.addWorksheet('Compliance Matrix');
  ws1.properties.tabColor = { argb: 'FF1e3a5f' };
  applyHeader(ws1, MAT_HEADERS, MAT_WIDTHS);
  ws1.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: MAT_HEADERS.length } };

  // 0-indexed: 0=#, 1=Category, 2=Ref, 3=Topic, 4=Requirement, 5=Bullet, 6=Paragraph,
  //            7=Delivery, 8=Compliant, 9=Confidence, 10=Score, 11=Status, 12=AIRisk, 13=ComplianceNotes, 14=FeedbackNotes
  const TEXT_COLS = new Set([4, 5, 6, 13]); // wrap text, top-aligned
  const CENTER_COLS = new Set([0, 7, 8, 9, 10, 11, 12]); // center + middle, no wrap

  let rowIdx = 0;
  for (const q of data.questions) {
    rowIdx++;
    const bandFill = rowIdx % 2 === 0 ? ROW_EVEN : ROW_ODD;
    const score = q.committee_score ?? 0;
    const aiResult = detectAIWriting((q.bullet ?? '') + ' ' + (q.paragraph ?? ''));
    const aiRiskLabel =
      aiResult.level === 'high' ? 'HIGH' : aiResult.level === 'medium' ? 'MEDIUM' : 'LOW';
    const row = ws1.addRow([
      q.number ?? '',
      q.category ?? '',
      q.ref ?? '',
      q.topic ?? '',
      q.requirement ?? '',
      q.bullet ?? '',
      q.paragraph ?? '',
      delivery(q),
      q.compliant ?? '',
      q.confidence ?? '',
      `${score}/10`,
      q.status ?? '',
      aiRiskLabel,
      q.compliance_notes ?? '',
      '',
    ]);
    row.height = 80;
    row.eachCell((cell, colNum) => {
      const idx = colNum - 1;
      cell.border = BORDER;
      cell.fill = bandFill;
      if (TEXT_COLS.has(idx)) {
        cell.alignment = { vertical: 'top', wrapText: true };
        cell.font = { size: 10, name: 'Calibri' };
      } else if (CENTER_COLS.has(idx)) {
        cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: false };
        cell.font = { size: 10, name: 'Calibri' };
      } else {
        cell.alignment = { vertical: 'top', wrapText: false };
        cell.font = { size: 10, name: 'Calibri' };
      }
    });

    // Feedback Notes column (col 15) — light yellow, wrap text
    const feedbackCell1 = row.getCell(15);
    feedbackCell1.fill = FEEDBACK_FILL;
    feedbackCell1.alignment = { vertical: 'top', wrapText: true };
    feedbackCell1.font = { size: 10, name: 'Calibri', italic: true, color: { argb: 'FF9E9E9E' } };

    // Compliant (col 9), Confidence (col 10), Score (col 11), AI Risk (col 13)
    const compliantCell = row.getCell(9);
    const confCell = row.getCell(10);
    const scoreCell = row.getCell(11);
    const aiCell = row.getCell(13);

    compliantCell.fill = FILL[q.compliant as keyof typeof FILL] ?? FILL.PARTIAL;
    compliantCell.font = { size: 10, bold: true, name: 'Calibri' };

    confCell.fill =
      FILL[q.confidence as keyof typeof FILL] ??
      ({ type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFFF' } } as ExcelJS.Fill);
    confCell.font = { size: 10, bold: true, name: 'Calibri' };

    scoreCell.fill = score >= 7 ? FILL.SCORE_GREEN : score >= 5 ? FILL.SCORE_YEL : FILL.SCORE_RED;
    scoreCell.font = { size: 10, bold: true, name: 'Calibri' };

    aiCell.fill =
      aiResult.level === 'high' ? FILL.RED : aiResult.level === 'medium' ? FILL.YELLOW : FILL.GREEN;
    aiCell.font = { size: 10, bold: aiResult.level === 'high', name: 'Calibri' };
  }

  // ── Sheet 2: Category Scorecard ──────────────────────────────────────────
  const ws2 = wb.addWorksheet('Category Scorecard');
  ws2.properties.tabColor = { argb: 'FF059669' };
  const SCORE_HEADERS = [
    'Category',
    'Questions',
    'Avg Score',
    'GREEN',
    'YELLOW',
    'RED',
    'Compliant (Y)',
    'Partial',
    'Non-Compliant',
    'Compliance %',
  ];
  const SCORE_WIDTHS = [32, 12, 12, 10, 10, 10, 14, 10, 16, 14];
  applyHeader(ws2, SCORE_HEADERS, SCORE_WIDTHS);

  for (const cat of data.categories) {
    const qs = data.questions.filter((q) => q.category === cat);
    const total = qs.length;
    const cy = qs.filter((q) => q.compliant === 'Y').length;
    const avgScore =
      total > 0
        ? Math.round((qs.reduce((s, q) => s + (q.committee_score || 0), 0) / total) * 10) / 10
        : 0;
    const pct = total > 0 ? cy / total : 0;

    const row = ws2.addRow([
      cat,
      total,
      avgScore,
      qs.filter((q) => q.confidence === 'GREEN').length,
      qs.filter((q) => q.confidence === 'YELLOW').length,
      qs.filter((q) => q.confidence === 'RED').length,
      cy,
      qs.filter((q) => q.compliant === 'Partial').length,
      qs.filter((q) => q.compliant === 'N').length,
      pct,
    ]);
    row.height = 24;
    row.eachCell((cell, col) => {
      cell.border = BORDER;
      cell.alignment = { vertical: 'middle', horizontal: col === 1 ? 'left' : 'center' };
      cell.font = { size: 10, name: 'Calibri' };
    });
    row.getCell(10).numFmt = '0%';
    row.getCell(10).fill = pct >= 0.8 ? FILL.GREEN : pct >= 0.6 ? FILL.YELLOW : FILL.RED;
    row.getCell(10).font = { size: 10, bold: true, name: 'Calibri' };
    // Score fill
    row.getCell(3).fill =
      avgScore >= 7 ? FILL.SCORE_GREEN : avgScore >= 5 ? FILL.SCORE_YEL : FILL.SCORE_RED;
    row.getCell(3).font = { size: 10, bold: true, name: 'Calibri' };
  }

  // ── Sheet 3: Action Required ─────────────────────────────────────────────
  const ws3 = wb.addWorksheet('Action Required');
  ws3.properties.tabColor = { argb: 'FFef4444' };
  applyHeader(ws3, MAT_HEADERS, MAT_WIDTHS);
  ws3.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: MAT_HEADERS.length } };

  const actionQs = data.questions.filter(
    (q) => q.confidence === 'RED' || q.compliant !== 'Y' || q.status === 'flagged',
  );
  let actionIdx = 0;
  for (const q of actionQs) {
    actionIdx++;
    const bandFill = actionIdx % 2 === 0 ? ROW_EVEN : ROW_ODD;
    const score = q.committee_score ?? 0;
    const aiResult3 = detectAIWriting((q.bullet ?? '') + ' ' + (q.paragraph ?? ''));
    const aiRiskLabel3 =
      aiResult3.level === 'high' ? 'HIGH' : aiResult3.level === 'medium' ? 'MEDIUM' : 'LOW';
    const row = ws3.addRow([
      q.number ?? '',
      q.category ?? '',
      q.ref ?? '',
      q.topic ?? '',
      q.requirement ?? '',
      q.bullet ?? '',
      q.paragraph ?? '',
      delivery(q),
      q.compliant ?? '',
      q.confidence ?? '',
      `${score}/10`,
      q.status ?? '',
      aiRiskLabel3,
      q.compliance_notes ?? '',
      '',
    ]);
    row.height = 80;
    row.eachCell((cell, colNum) => {
      const idx = colNum - 1;
      cell.border = BORDER;
      cell.fill = bandFill;
      if (TEXT_COLS.has(idx)) {
        cell.alignment = { vertical: 'top', wrapText: true };
        cell.font = { size: 10, name: 'Calibri' };
      } else if (CENTER_COLS.has(idx)) {
        cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: false };
        cell.font = { size: 10, name: 'Calibri' };
      } else {
        cell.alignment = { vertical: 'top', wrapText: false };
        cell.font = { size: 10, name: 'Calibri' };
      }
    });
    // Feedback Notes column (col 15) — light yellow
    const feedbackCell3 = row.getCell(15);
    feedbackCell3.fill = FEEDBACK_FILL;
    feedbackCell3.alignment = { vertical: 'top', wrapText: true };
    feedbackCell3.font = { size: 10, name: 'Calibri', italic: true, color: { argb: 'FF9E9E9E' } };
    row.getCell(9).fill = FILL[q.compliant as keyof typeof FILL] ?? FILL.PARTIAL;
    row.getCell(9).font = { size: 10, bold: true, name: 'Calibri' };
    row.getCell(10).fill =
      FILL[q.confidence as keyof typeof FILL] ??
      ({ type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFFF' } } as ExcelJS.Fill);
    row.getCell(10).font = { size: 10, bold: true, name: 'Calibri' };
    const sc = row.getCell(11);
    sc.fill = score >= 7 ? FILL.SCORE_GREEN : score >= 5 ? FILL.SCORE_YEL : FILL.SCORE_RED;
    sc.font = { size: 10, bold: true, name: 'Calibri' };
    const ai3 = row.getCell(13);
    ai3.fill =
      aiResult3.level === 'high'
        ? FILL.RED
        : aiResult3.level === 'medium'
          ? FILL.YELLOW
          : FILL.GREEN;
    ai3.font = { size: 10, bold: aiResult3.level === 'high', name: 'Calibri' };
  }

  const buffer = await wb.xlsx.writeBuffer();

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="BSB_RFP_Compliance_Matrix_Brim_Financial.xlsx"',
    },
  });
}
