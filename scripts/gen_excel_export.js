'use strict';
/**
 * Standalone Excel export — BSB RFP Compliance Matrix
 * Run: node scripts/gen_excel_export.js
 */
const { writeFileSync, readFileSync } = require('fs');
const ExcelJS = require('exceljs');

const data = JSON.parse(readFileSync(require('path').join(__dirname, '../public/rfp_data.json'), 'utf8'));
const now = new Date();
const DATE = now.toISOString().slice(0, 10);

const FILL = {
  GREEN:       { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFd1fae5' } },
  YELLOW:      { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFfef3c7' } },
  RED:         { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFfee2e2' } },
  Y:           { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFd1fae5' } },
  N:           { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFfee2e2' } },
  PARTIAL:     { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFfef3c7' } },
  HEADER:      { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1e3a5f' } },
  SCORE_GREEN: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFecfdf5' } },
  SCORE_YEL:   { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFfffbeb' } },
  SCORE_RED:   { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFfff1f2' } },
};
const ROW_EVEN = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8F1FA' } };
const ROW_ODD  = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFFF' } };
const FEEDBACK_FILL = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFDE7' } };
const BORDER = {
  top:    { style: 'thin', color: { argb: 'FFd1d5db' } },
  left:   { style: 'thin', color: { argb: 'FFd1d5db' } },
  bottom: { style: 'thin', color: { argb: 'FFd1d5db' } },
  right:  { style: 'thin', color: { argb: 'FFd1d5db' } },
};
const BORDER_HDR = { ...BORDER, bottom: { style: 'medium', color: { argb: 'FF9ca3af' } } };

function delivery(q) {
  const p = [];
  if (q.a_oob)   p.push('OOB');
  if (q.b_config) p.push('Config');
  if (q.c_custom) p.push('Custom');
  if (q.d_dnm)   p.push('DNM');
  return p.join(' / ') || '—';
}

function applyHeader(ws, headers, widths) {
  const row = ws.addRow(headers);
  row.eachCell(cell => {
    cell.fill = FILL.HEADER;
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11, name: 'Calibri' };
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: false };
    cell.border = BORDER_HDR;
  });
  row.height = 30;
  widths.forEach((w, i) => { ws.getColumn(i + 1).width = w; });
  ws.views = [{ state: 'frozen', ySplit: 1, xSplit: 0, showGridLines: false }];
}

async function main() {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'BRIM Financial';
  wb.created = now;

  const MAT_HEADERS = ['#','Category','Ref','Topic','Requirement','Response (Bullet)','Response (Paragraph)','Delivery','Compliant','Confidence','Score','Status','Compliance Notes','Feedback Notes'];
  const MAT_WIDTHS  = [5, 22, 12, 22, 42, 42, 52, 16, 12, 12, 8, 12, 42, 44];
  const TEXT_COLS   = new Set([4, 5, 6, 12]);
  const CENTER_COLS = new Set([0, 7, 8, 9, 10, 11]);

  function addMatrixRows(ws, questions) {
    let idx = 0;
    for (const q of questions) {
      idx++;
      const bandFill = idx % 2 === 0 ? ROW_EVEN : ROW_ODD;
      const score = q.committee_score ?? 0;
      const row = ws.addRow([
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
        q.compliance_notes ?? '',
        '',
      ]);
      row.height = 80;
      row.eachCell((cell, colNum) => {
        const i = colNum - 1;
        cell.border = BORDER;
        cell.fill = bandFill;
        if (TEXT_COLS.has(i)) {
          cell.alignment = { vertical: 'top', wrapText: true };
          cell.font = { size: 10, name: 'Calibri' };
        } else if (CENTER_COLS.has(i)) {
          cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: false };
          cell.font = { size: 10, name: 'Calibri' };
        } else {
          cell.alignment = { vertical: 'top', wrapText: false };
          cell.font = { size: 10, name: 'Calibri' };
        }
      });
      // Feedback col
      const fb = row.getCell(14);
      fb.fill = FEEDBACK_FILL;
      fb.alignment = { vertical: 'top', wrapText: true };
      fb.font = { size: 10, name: 'Calibri', italic: true, color: { argb: 'FF9E9E9E' } };
      // Compliant / Confidence / Score colours
      const cc = row.getCell(9);
      cc.fill = FILL[q.compliant] ?? FILL.PARTIAL;
      cc.font = { size: 10, bold: true, name: 'Calibri' };
      const cf = row.getCell(10);
      cf.fill = FILL[q.confidence] ?? { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFFF' } };
      cf.font = { size: 10, bold: true, name: 'Calibri' };
      const sc = row.getCell(11);
      sc.fill = score >= 7 ? FILL.SCORE_GREEN : score >= 5 ? FILL.SCORE_YEL : FILL.SCORE_RED;
      sc.font = { size: 10, bold: true, name: 'Calibri' };
    }
  }

  // ── Sheet 1: Compliance Matrix ─────────────────────────────────────────────
  const ws1 = wb.addWorksheet('Compliance Matrix');
  ws1.properties.tabColor = { argb: 'FF1e3a5f' };
  applyHeader(ws1, MAT_HEADERS, MAT_WIDTHS);
  ws1.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: MAT_HEADERS.length } };
  addMatrixRows(ws1, data.questions);

  // ── Sheet 2: Category Scorecard ────────────────────────────────────────────
  const ws2 = wb.addWorksheet('Category Scorecard');
  ws2.properties.tabColor = { argb: 'FF059669' };
  applyHeader(ws2, ['Category','Questions','Avg Score','GREEN','YELLOW','RED','Compliant (Y)','Partial','Non-Compliant','Compliance %'], [32,12,12,10,10,10,14,10,16,14]);
  for (const cat of data.categories) {
    const qs  = data.questions.filter(q => q.category === cat);
    const tot = qs.length;
    const cy  = qs.filter(q => q.compliant === 'Y').length;
    const avg = tot > 0 ? Math.round(qs.reduce((s,q) => s+(q.committee_score||0), 0)/tot*10)/10 : 0;
    const pct = tot > 0 ? cy/tot : 0;
    const row = ws2.addRow([cat,tot,avg,qs.filter(q=>q.confidence==='GREEN').length,qs.filter(q=>q.confidence==='YELLOW').length,qs.filter(q=>q.confidence==='RED').length,cy,qs.filter(q=>q.compliant==='Partial').length,qs.filter(q=>q.compliant==='N').length,pct]);
    row.height = 24;
    row.eachCell((cell, col) => {
      cell.border = BORDER;
      cell.alignment = { vertical: 'middle', horizontal: col===1 ? 'left' : 'center' };
      cell.font = { size: 10, name: 'Calibri' };
    });
    row.getCell(10).numFmt = '0%';
    row.getCell(10).fill = pct >= 0.8 ? FILL.GREEN : pct >= 0.6 ? FILL.YELLOW : FILL.RED;
    row.getCell(10).font = { size: 10, bold: true, name: 'Calibri' };
    row.getCell(3).fill = avg >= 7 ? FILL.SCORE_GREEN : avg >= 5 ? FILL.SCORE_YEL : FILL.SCORE_RED;
    row.getCell(3).font = { size: 10, bold: true, name: 'Calibri' };
  }

  // ── Sheet 3: Action Required ───────────────────────────────────────────────
  const ws3 = wb.addWorksheet('Action Required');
  ws3.properties.tabColor = { argb: 'FFef4444' };
  applyHeader(ws3, MAT_HEADERS, MAT_WIDTHS);
  ws3.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: MAT_HEADERS.length } };
  addMatrixRows(ws3, data.questions.filter(q => q.confidence==='RED' || q.compliant!=='Y' || q.status==='flagged'));

  const outPath = require('path').join(require('os').homedir(), `Desktop/BSB_Matrix_BRIM_FINAL_${DATE}.xlsx`);
  const buf = await wb.xlsx.writeBuffer();
  writeFileSync(outPath, buf);
  console.log(`Excel: ${outPath} (${Math.round(buf.byteLength/1024)}KB)`);
}

main().catch(err => { console.error(err); process.exit(1); });
