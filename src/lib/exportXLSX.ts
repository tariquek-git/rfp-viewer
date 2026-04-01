import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import type { RFPData } from '@/types';
import type { ExportOptions } from './exportWord';
import { detectAIWriting } from '@/lib/aiDetect';

// Header style constants
const HEADER_FILL: ExcelJS.Fill = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'FF1e3a5f' },
};
const HEADER_FONT: Partial<ExcelJS.Font> = {
  bold: true,
  color: { argb: 'FFFFFFFF' },
  size: 10,
};
const BORDER: Partial<ExcelJS.Borders> = {
  top: { style: 'thin', color: { argb: 'FFD1D5DB' } },
  left: { style: 'thin', color: { argb: 'FFD1D5DB' } },
  bottom: { style: 'thin', color: { argb: 'FFD1D5DB' } },
  right: { style: 'thin', color: { argb: 'FFD1D5DB' } },
};

function confidenceFill(confidence: string): ExcelJS.Fill {
  const colors: Record<string, string> = {
    GREEN: 'FFd1fae5',
    YELLOW: 'FFfef3c7',
    RED: 'FFfee2e2',
  };
  const argb = colors[confidence] ?? 'FFFFFFFF';
  return { type: 'pattern', pattern: 'solid', fgColor: { argb } };
}

function compliantFill(compliant: string): ExcelJS.Fill {
  const colors: Record<string, string> = {
    Y: 'FFd1fae5',
    N: 'FFfee2e2',
    Partial: 'FFfef3c7',
  };
  const argb = colors[compliant] ?? 'FFFFFFFF';
  return { type: 'pattern', pattern: 'solid', fgColor: { argb } };
}

function deliveryLabel(q: { a_oob: boolean; b_config: boolean; c_custom: boolean; d_dnm: boolean }): string {
  const parts: string[] = [];
  if (q.a_oob) parts.push('OOB');
  if (q.b_config) parts.push('Config');
  if (q.c_custom) parts.push('Custom');
  if (q.d_dnm) parts.push('DNM');
  return parts.join(' / ') || '—';
}

function applyHeaderRow(ws: ExcelJS.Worksheet, headers: string[], colWidths: number[]) {
  const headerRow = ws.getRow(1);
  headers.forEach((h, i) => {
    const cell = headerRow.getCell(i + 1);
    cell.value = h;
    cell.fill = HEADER_FILL;
    cell.font = HEADER_FONT;
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: false };
    cell.border = BORDER;
  });
  headerRow.height = 22;
  colWidths.forEach((w, i) => {
    ws.getColumn(i + 1).width = w;
  });
  ws.views = [{ state: 'frozen', ySplit: 1, xSplit: 0 }];
  ws.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: headers.length } };
}

function addQuestionRow(ws: ExcelJS.Worksheet, q: import('@/types').Question, rowIdx: number) {
  const aiResult = detectAIWriting((q.bullet ?? '') + ' ' + (q.paragraph ?? ''));
  const aiRisk = aiResult.level === 'high' ? 'HIGH' : aiResult.level === 'medium' ? 'MEDIUM' : 'LOW';

  const row = ws.getRow(rowIdx);
  const values = [
    q.number ?? '',
    q.category ?? '',
    q.ref ?? '',
    q.topic ?? '',
    q.requirement ?? '',
    q.bullet ?? '',
    q.paragraph ?? '',
    deliveryLabel(q),
    q.compliant ?? '',
    q.confidence ?? '',
    q.committee_score ?? '',
    q.status ?? '',
    aiRisk,
    q.compliance_notes ?? '',
  ];

  values.forEach((v, i) => {
    const cell = row.getCell(i + 1);
    cell.value = v;
    cell.border = BORDER;
    cell.alignment = { vertical: 'top', wrapText: true };
    cell.font = { size: 9 };
  });

  // Color the Compliant cell (col I = index 9)
  row.getCell(9).fill = compliantFill(q.compliant ?? '');
  // Color the Confidence cell (col J = index 10)
  row.getCell(10).fill = confidenceFill(q.confidence ?? '');

  row.height = 60;
}

export async function exportToXLSX(data: RFPData, _options?: ExportOptions): Promise<void> { // eslint-disable-line @typescript-eslint/no-unused-vars
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Brim Financial';
  workbook.created = new Date();

  const MATRIX_HEADERS = [
    '#', 'Category', 'Ref', 'Topic', 'Requirement',
    'Response (Bullet)', 'Response (Paragraph)', 'Delivery',
    'Compliant', 'Confidence', 'Score', 'Status', 'AI Risk', 'Compliance Notes',
  ];
  const MATRIX_WIDTHS = [6, 20, 12, 20, 40, 40, 50, 16, 12, 12, 8, 12, 10, 40];

  // ── Sheet 1: Compliance Matrix ──────────────────────────────────────────────
  const ws1 = workbook.addWorksheet('Compliance Matrix');
  ws1.properties.tabColor = { argb: 'FF1e3a5f' };
  applyHeaderRow(ws1, MATRIX_HEADERS, MATRIX_WIDTHS);
  data.questions.forEach((q, i) => addQuestionRow(ws1, q, i + 2));

  // ── Sheet 2: Category Scorecard ─────────────────────────────────────────────
  const ws2 = workbook.addWorksheet('Category Scorecard');
  ws2.properties.tabColor = { argb: 'FF059669' };
  const SCORE_HEADERS = ['Category', 'Questions', 'Avg Score', 'GREEN', 'YELLOW', 'RED', 'Compliant (Y)', 'Partial', 'Non-Compliant (N)', 'Compliance %'];
  const SCORE_WIDTHS = [30, 12, 12, 10, 10, 10, 14, 10, 18, 14];
  applyHeaderRow(ws2, SCORE_HEADERS, SCORE_WIDTHS);

  data.categories.forEach((cat, i) => {
    const qs = data.questions.filter((q) => q.category === cat);
    const total = qs.length;
    const green = qs.filter((q) => q.confidence === 'GREEN').length;
    const yellow = qs.filter((q) => q.confidence === 'YELLOW').length;
    const red = qs.filter((q) => q.confidence === 'RED').length;
    const cy = qs.filter((q) => q.compliant === 'Y').length;
    const cp = qs.filter((q) => q.compliant === 'Partial').length;
    const cn = qs.filter((q) => q.compliant === 'N').length;
    const avgScore = total > 0 ? qs.reduce((s, q) => s + (q.committee_score || 0), 0) / total : 0;
    const compliancePct = total > 0 ? cy / total : 0;

    const row = ws2.getRow(i + 2);
    const vals = [cat, total, parseFloat(avgScore.toFixed(1)), green, yellow, red, cy, cp, cn, compliancePct];
    vals.forEach((v, ci) => {
      const cell = row.getCell(ci + 1);
      cell.value = v;
      cell.border = BORDER;
      cell.alignment = { vertical: 'middle', horizontal: ci === 0 ? 'left' : 'center' };
      cell.font = { size: 9 };
    });
    // Format compliance % column
    row.getCell(10).numFmt = '0.0%';
    // Color compliance % cell
    const pct = typeof compliancePct === 'number' ? compliancePct : 0;
    row.getCell(10).fill = {
      type: 'pattern', pattern: 'solid',
      fgColor: { argb: pct >= 0.8 ? 'FFd1fae5' : pct >= 0.6 ? 'FFfef3c7' : 'FFfee2e2' },
    };
    row.height = 18;
  });

  // ── Sheet 3: Action Required ────────────────────────────────────────────────
  const ws3 = workbook.addWorksheet('Action Required');
  ws3.properties.tabColor = { argb: 'FFef4444' };
  applyHeaderRow(ws3, MATRIX_HEADERS, MATRIX_WIDTHS);
  const actionQs = data.questions.filter(
    (q) => q.confidence === 'RED' || q.compliant !== 'Y' || q.status === 'flagged'
  );
  actionQs.forEach((q, i) => addQuestionRow(ws3, q, i + 2));

  // ── Save ────────────────────────────────────────────────────────────────────
  const buffer = await workbook.xlsx.writeBuffer();
  saveAs(new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), 'BSB_RFP_Compliance_Matrix_Brim_Financial.xlsx');
}
