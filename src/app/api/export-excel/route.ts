import { NextResponse } from 'next/server';
import ExcelJS from 'exceljs';
import type { RFPData } from '@/types';

// Confidence/compliant color fills
const FILL = {
  GREEN:   { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFd1fae5' } } as ExcelJS.Fill,
  YELLOW:  { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFfef3c7' } } as ExcelJS.Fill,
  RED:     { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFfee2e2' } } as ExcelJS.Fill,
  Y:       { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFd1fae5' } } as ExcelJS.Fill,
  N:       { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFfee2e2' } } as ExcelJS.Fill,
  PARTIAL: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFfef3c7' } } as ExcelJS.Fill,
  HEADER:  { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1e3a5f' } } as ExcelJS.Fill,
  SCORE_GREEN: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFecfdf5' } } as ExcelJS.Fill,
  SCORE_YEL:   { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFfffbeb' } } as ExcelJS.Fill,
  SCORE_RED:   { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFfff1f2' } } as ExcelJS.Fill,
};

const BORDER: Partial<ExcelJS.Borders> = {
  top: { style: 'thin', color: { argb: 'FFe5e7eb' } },
  left: { style: 'thin', color: { argb: 'FFe5e7eb' } },
  bottom: { style: 'thin', color: { argb: 'FFe5e7eb' } },
  right: { style: 'thin', color: { argb: 'FFe5e7eb' } },
};

function delivery(q: { a_oob: boolean; b_config: boolean; c_custom: boolean; d_dnm: boolean }): string {
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
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 10, name: 'Calibri' };
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: false };
    cell.border = BORDER;
  });
  row.height = 24;
  widths.forEach((w, i) => { ws.getColumn(i + 1).width = w; });
  ws.views = [{ state: 'frozen', ySplit: 1, xSplit: 0, showGridLines: true }];
}

export async function POST(request: Request) {
  const body = await request.json() as { data: RFPData };
  const { data } = body;

  const wb = new ExcelJS.Workbook();
  wb.creator = 'Brim Financial';
  wb.created = new Date();

  const MAT_HEADERS = ['#', 'Category', 'Ref', 'Topic', 'Requirement', 'Response (Bullet)', 'Response (Paragraph)', 'Delivery', 'Compliant', 'Confidence', 'Score', 'Status', 'Compliance Notes'];
  const MAT_WIDTHS = [5, 22, 12, 22, 42, 42, 52, 16, 12, 12, 8, 12, 42];

  // ── Sheet 1: Compliance Matrix ────────────────────────────────────────────
  const ws1 = wb.addWorksheet('Compliance Matrix');
  ws1.properties.tabColor = { argb: 'FF1e3a5f' };
  applyHeader(ws1, MAT_HEADERS, MAT_WIDTHS);
  ws1.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: MAT_HEADERS.length } };

  for (const q of data.questions) {
    const row = ws1.addRow([
      q.number ?? '', q.category ?? '', q.ref ?? '', q.topic ?? '',
      q.requirement ?? '', q.bullet ?? '', q.paragraph ?? '',
      delivery(q), q.compliant ?? '', q.confidence ?? '',
      q.committee_score ?? '', q.status ?? '', q.compliance_notes ?? '',
    ]);
    row.height = 70;
    row.eachCell((cell) => {
      cell.border = BORDER;
      cell.alignment = { vertical: 'top', wrapText: true };
      cell.font = { size: 9, name: 'Calibri' };
    });
    // Col I = compliant (index 9), Col J = confidence (index 10)
    const compliantCell = row.getCell(9);
    const confCell = row.getCell(10);
    const scoreCell = row.getCell(11);

    compliantCell.fill = FILL[q.compliant as keyof typeof FILL] ?? FILL.PARTIAL;
    compliantCell.font = { size: 9, bold: true, name: 'Calibri' };
    compliantCell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: false };

    confCell.fill = FILL[q.confidence as keyof typeof FILL] ?? ({ type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFFF' } } as ExcelJS.Fill);
    confCell.font = { size: 9, bold: true, name: 'Calibri' };
    confCell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: false };

    const score = q.committee_score ?? 0;
    scoreCell.fill = score >= 7 ? FILL.SCORE_GREEN : score >= 5 ? FILL.SCORE_YEL : FILL.SCORE_RED;
    scoreCell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: false };
    scoreCell.font = { size: 9, bold: score >= 7, name: 'Calibri' };
  }

  // ── Sheet 2: Category Scorecard ──────────────────────────────────────────
  const ws2 = wb.addWorksheet('Category Scorecard');
  ws2.properties.tabColor = { argb: 'FF059669' };
  const SCORE_HEADERS = ['Category', 'Questions', 'Avg Score', 'GREEN', 'YELLOW', 'RED', 'Compliant (Y)', 'Partial', 'Non-Compliant', 'Compliance %'];
  const SCORE_WIDTHS = [32, 12, 12, 10, 10, 10, 14, 10, 16, 14];
  applyHeader(ws2, SCORE_HEADERS, SCORE_WIDTHS);

  for (const cat of data.categories) {
    const qs = data.questions.filter((q) => q.category === cat);
    const total = qs.length;
    const cy = qs.filter((q) => q.compliant === 'Y').length;
    const avgScore = total > 0 ? Math.round(qs.reduce((s, q) => s + (q.committee_score || 0), 0) / total * 10) / 10 : 0;
    const pct = total > 0 ? cy / total : 0;

    const row = ws2.addRow([
      cat, total, avgScore,
      qs.filter((q) => q.confidence === 'GREEN').length,
      qs.filter((q) => q.confidence === 'YELLOW').length,
      qs.filter((q) => q.confidence === 'RED').length,
      cy,
      qs.filter((q) => q.compliant === 'Partial').length,
      qs.filter((q) => q.compliant === 'N').length,
      pct,
    ]);
    row.height = 20;
    row.eachCell((cell, col) => {
      cell.border = BORDER;
      cell.alignment = { vertical: 'middle', horizontal: col === 1 ? 'left' : 'center' };
      cell.font = { size: 9, name: 'Calibri' };
    });
    row.getCell(10).numFmt = '0%';
    row.getCell(10).fill = pct >= 0.8 ? FILL.GREEN : pct >= 0.6 ? FILL.YELLOW : FILL.RED;
    row.getCell(10).font = { size: 9, bold: true, name: 'Calibri' };
    // Score fill
    row.getCell(3).fill = avgScore >= 7 ? FILL.SCORE_GREEN : avgScore >= 5 ? FILL.SCORE_YEL : FILL.SCORE_RED;
  }

  // ── Sheet 3: Action Required ─────────────────────────────────────────────
  const ws3 = wb.addWorksheet('Action Required');
  ws3.properties.tabColor = { argb: 'FFef4444' };
  applyHeader(ws3, MAT_HEADERS, MAT_WIDTHS);
  ws3.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: MAT_HEADERS.length } };

  const actionQs = data.questions.filter(
    (q) => q.confidence === 'RED' || q.compliant !== 'Y' || q.status === 'flagged'
  );
  for (const q of actionQs) {
    const row = ws3.addRow([
      q.number ?? '', q.category ?? '', q.ref ?? '', q.topic ?? '',
      q.requirement ?? '', q.bullet ?? '', q.paragraph ?? '',
      delivery(q), q.compliant ?? '', q.confidence ?? '',
      q.committee_score ?? '', q.status ?? '', q.compliance_notes ?? '',
    ]);
    row.height = 70;
    row.eachCell((cell) => {
      cell.border = BORDER;
      cell.alignment = { vertical: 'top', wrapText: true };
      cell.font = { size: 9, name: 'Calibri' };
    });
    row.getCell(9).fill = FILL[q.compliant as keyof typeof FILL] ?? FILL.PARTIAL;
    row.getCell(9).font = { size: 9, bold: true, name: 'Calibri' };
    row.getCell(9).alignment = { vertical: 'middle', horizontal: 'center' };
    row.getCell(10).fill = FILL[q.confidence as keyof typeof FILL] ?? ({ type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFFF' } } as ExcelJS.Fill);
    row.getCell(10).font = { size: 9, bold: true, name: 'Calibri' };
    row.getCell(10).alignment = { vertical: 'middle', horizontal: 'center' };
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
