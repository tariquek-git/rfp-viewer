import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import type { RFPData } from '@/types';
import type { ExportOptions } from './exportWord';
import { detectAIWriting } from '@/lib/aiDetect';

function deliveryLabel(q: { a_oob: boolean; b_config: boolean; c_custom: boolean; d_dnm: boolean }): string {
  const parts: string[] = [];
  if (q.a_oob) parts.push('OOB');
  if (q.b_config) parts.push('Config');
  if (q.c_custom) parts.push('Custom');
  if (q.d_dnm) parts.push('DNM');
  return parts.join(' / ') || '—';
}

export function exportToXLSX(data: RFPData, _options?: ExportOptions): void { // eslint-disable-line @typescript-eslint/no-unused-vars
  const wb = XLSX.utils.book_new();

  // ── Sheet 1 & 3 helper: build rows array ──────────────────────────────────
  const HEADERS = [
    '#', 'Category', 'Ref', 'Topic', 'Requirement',
    'Response (Bullet)', 'Response (Paragraph)', 'Delivery',
    'Compliant', 'Confidence', 'Score', 'Status', 'AI Risk', 'Compliance Notes',
  ];

  function buildRows(questions: RFPData['questions']) {
    return questions.map((q) => {
      const aiResult = detectAIWriting((q.bullet ?? '') + ' ' + (q.paragraph ?? ''));
      const aiRisk = aiResult.level === 'high' ? 'HIGH' : aiResult.level === 'medium' ? 'MEDIUM' : 'LOW';
      return [
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
    });
  }

  function makeSheet(questions: RFPData['questions']) {
    const rows = [HEADERS, ...buildRows(questions)];
    const ws = XLSX.utils.aoa_to_sheet(rows);

    // Column widths
    ws['!cols'] = [6, 20, 12, 20, 40, 40, 50, 16, 12, 12, 8, 12, 10, 40].map(w => ({ wch: w }));

    // Freeze header row
    ws['!freeze'] = { xSplit: 0, ySplit: 1 };

    // Auto-filter on header row
    const lastCol = XLSX.utils.encode_col(HEADERS.length - 1);
    ws['!autofilter'] = { ref: `A1:${lastCol}1` };

    return ws;
  }

  // ── Sheet 1: Compliance Matrix ──────────────────────────────────────────────
  const ws1 = makeSheet(data.questions);
  XLSX.utils.book_append_sheet(wb, ws1, 'Compliance Matrix');

  // ── Sheet 2: Category Scorecard ─────────────────────────────────────────────
  const scoreHeaders = ['Category', 'Questions', 'Avg Score', 'GREEN', 'YELLOW', 'RED', 'Compliant (Y)', 'Partial', 'Non-Compliant (N)', 'Compliance %'];
  const scoreRows = data.categories.map((cat) => {
    const qs = data.questions.filter((q) => q.category === cat);
    const total = qs.length;
    const green = qs.filter((q) => q.confidence === 'GREEN').length;
    const yellow = qs.filter((q) => q.confidence === 'YELLOW').length;
    const red = qs.filter((q) => q.confidence === 'RED').length;
    const cy = qs.filter((q) => q.compliant === 'Y').length;
    const cp = qs.filter((q) => q.compliant === 'Partial').length;
    const cn = qs.filter((q) => q.compliant === 'N').length;
    const avgScore = total > 0 ? parseFloat((qs.reduce((s, q) => s + (q.committee_score || 0), 0) / total).toFixed(1)) : 0;
    const compliancePct = total > 0 ? `${((cy / total) * 100).toFixed(0)}%` : '0%';
    return [cat, total, avgScore, green, yellow, red, cy, cp, cn, compliancePct];
  });
  const ws2 = XLSX.utils.aoa_to_sheet([scoreHeaders, ...scoreRows]);
  ws2['!cols'] = [30, 12, 12, 10, 10, 10, 14, 10, 18, 14].map(w => ({ wch: w }));
  ws2['!freeze'] = { xSplit: 0, ySplit: 1 };
  XLSX.utils.book_append_sheet(wb, ws2, 'Category Scorecard');

  // ── Sheet 3: Action Required ────────────────────────────────────────────────
  const actionQs = data.questions.filter(
    (q) => q.confidence === 'RED' || q.compliant !== 'Y' || q.status === 'flagged'
  );
  const ws3 = makeSheet(actionQs);
  XLSX.utils.book_append_sheet(wb, ws3, 'Action Required');

  // ── Write and download ───────────────────────────────────────────────────────
  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  saveAs(
    new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
    'BSB_RFP_Compliance_Matrix_Brim_Financial.xlsx'
  );
}
