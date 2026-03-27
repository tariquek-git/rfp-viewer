import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { RFPData } from '@/types';
import type { ExportOptions } from '@/lib/exportWord';
import { detectAIWriting, aiDetectLabel } from '@/lib/aiDetect';

type RGB = [number, number, number];

const C = {
  green: [4, 120, 87] as RGB,
  greenBg: [220, 252, 231] as RGB,
  yellow: [161, 98, 7] as RGB,
  yellowBg: [254, 249, 195] as RGB,
  red: [185, 28, 28] as RGB,
  redBg: [254, 226, 226] as RGB,
  blue: [29, 78, 216] as RGB,
  blueBg: [219, 234, 254] as RGB,
  purple: [109, 40, 217] as RGB,
  purpleBg: [237, 233, 254] as RGB,
  dark: [17, 24, 39] as RGB,
  gray: [75, 85, 99] as RGB,
  lightGray: [156, 163, 175] as RGB,
  headerBg: [243, 244, 246] as RGB,
  white: [255, 255, 255] as RGB,
  line: [209, 213, 219] as RGB,
};

function confC(c: string): { text: RGB; bg: RGB } {
  if (c === 'GREEN') return { text: C.green, bg: C.greenBg };
  if (c === 'YELLOW') return { text: C.yellow, bg: C.yellowBg };
  if (c === 'RED') return { text: C.red, bg: C.redBg };
  return { text: C.gray, bg: C.headerBg };
}


export async function exportToPDF(data: RFPData, options?: ExportOptions) {
  const kb = options?.knowledgeBase;
  const globalRules = options?.globalRules || [];
  const validationRules = options?.validationRules || [];
  const doc = new jsPDF('p', 'mm', 'a4');
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const M = 15; // margin
  const CW = W - M * 2; // content width

  const qs = data.questions;
  const cats = data.categories;
  const green = qs.filter(q => q.confidence === 'GREEN').length;
  const yellow = qs.filter(q => q.confidence === 'YELLOW').length;
  const red = qs.filter(q => q.confidence === 'RED').length;
  const avg = (qs.reduce((s, q) => s + (q.committee_score || 0), 0) / qs.length).toFixed(1);
  const compY = qs.filter(q => q.compliant === 'Y').length;

  // Helper: add header/footer to every page
  const addPageMeta = () => {
    doc.setFontSize(7);
    doc.setTextColor(...C.lightGray);
    doc.text('BSB Credit Card RFP Response — Brim Financial — Confidential', W / 2, 8, { align: 'center' });
    doc.text(`Page ${doc.getNumberOfPages()}`, W - M, H - 5, { align: 'right' });
  };

  // ========== COVER PAGE ==========
  addPageMeta();
  doc.setFontSize(9);
  doc.setTextColor(...C.lightGray);
  doc.text('C O N F I D E N T I A L', W / 2, 60, { align: 'center' });

  doc.setFontSize(32);
  doc.setTextColor(...C.dark);
  doc.text('BSB Credit Card Program', W / 2, 85, { align: 'center' });

  doc.setFontSize(18);
  doc.setTextColor(...C.gray);
  doc.text('Request for Proposal Response', W / 2, 97, { align: 'center' });

  doc.setDrawColor(...C.blue);
  doc.setLineWidth(0.8);
  doc.line(W / 2 - 20, 108, W / 2 + 20, 108);

  doc.setFontSize(14);
  doc.setTextColor(...C.dark);
  doc.text('Prepared by Brim Financial', W / 2, 120, { align: 'center' });

  doc.setFontSize(11);
  doc.setTextColor(...C.gray);
  doc.text(new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }), W / 2, 132, { align: 'center' });
  doc.text(`${qs.length} Requirements · ${cats.length} Categories`, W / 2, 140, { align: 'center' });

  // ========== EXECUTIVE OVERVIEW ==========
  doc.addPage();
  addPageMeta();

  doc.setFontSize(20);
  doc.setTextColor(...C.dark);
  doc.text('Executive Overview', M, 22);
  doc.setDrawColor(...C.dark);
  doc.setLineWidth(0.5);
  doc.line(M, 25, W - M, 25);

  // Stats table
  autoTable(doc, {
    startY: 30,
    margin: { left: M, right: M },
    head: [['GREEN (Strong)', 'YELLOW (Strengthen)', 'RED (Gap/Risk)', 'Avg Score']],
    body: [[`${green} (${Math.round(green / qs.length * 100)}%)`, `${yellow}`, `${red}`, `${avg}/10`]],
    headStyles: { fillColor: C.headerBg, textColor: C.dark, fontSize: 8, fontStyle: 'bold', halign: 'center' },
    bodyStyles: { fontSize: 12, fontStyle: 'bold', halign: 'center' },
    columnStyles: {
      0: { textColor: C.green },
      1: { textColor: C.yellow },
      2: { textColor: C.red },
      3: { textColor: C.dark },
    },
  });

  let y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 6;
  doc.setFontSize(9);
  doc.setTextColor(...C.dark);
  doc.text(`${compY} of ${qs.length} requirements (${Math.round(compY / qs.length * 100)}%) fully compliant.`, M, y);

  // Category scorecard
  y += 8;
  doc.setFontSize(14);
  doc.setTextColor(...C.dark);
  doc.text('Category Performance', M, y);

  autoTable(doc, {
    startY: y + 3,
    margin: { left: M, right: M },
    head: [['Category', 'Qs', 'Avg', 'G', 'Y', 'R', 'Compliant']],
    body: cats.map(cat => {
      const cqs = qs.filter(q => q.category === cat);
      const cavg = cqs.reduce((s, q) => s + (q.committee_score || 0), 0) / (cqs.length || 1);
      return [cat, `${cqs.length}`, cavg.toFixed(1),
        `${cqs.filter(q => q.confidence === 'GREEN').length}`,
        `${cqs.filter(q => q.confidence === 'YELLOW').length}`,
        `${cqs.filter(q => q.confidence === 'RED').length}`,
        `${cqs.filter(q => q.compliant === 'Y').length}/${cqs.length}`];
    }),
    headStyles: { fillColor: C.headerBg, textColor: C.dark, fontSize: 7, fontStyle: 'bold' },
    bodyStyles: { fontSize: 7, textColor: C.dark },
    columnStyles: { 0: { cellWidth: 50 }, 2: { fontStyle: 'bold' }, 3: { textColor: C.green }, 4: { textColor: C.yellow }, 5: { textColor: C.red } },
  });

  // ========== CLAUDE CPO ANALYSIS ==========
  doc.addPage();
  addPageMeta();

  autoTable(doc, {
    startY: 15,
    margin: { left: M, right: M },
    head: [['AI REVIEW NOTES — CLAUDE (CPO ANALYSIS)']],
    body: [['Internal use only — do not include in final submission to BSB.']],
    headStyles: { fillColor: C.purpleBg, textColor: C.purple, fontSize: 11, fontStyle: 'bold' },
    bodyStyles: { fillColor: C.white, textColor: C.gray, fontSize: 7, fontStyle: 'italic' },
  });

  const aiHigh = qs.filter(q => detectAIWriting(q.bullet + ' ' + q.paragraph).level === 'high').length;
  const aiMed = qs.filter(q => detectAIWriting(q.bullet + ' ' + q.paragraph).level === 'medium').length;

  autoTable(doc, {
    startY: (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 3,
    margin: { left: M, right: M },
    body: [
      [{ content: 'AI Detection', styles: { fontStyle: 'bold', textColor: C.purple, fontSize: 9 } }, `${aiHigh} High risk, ${aiMed} Medium. Main triggers: em-dashes, filler words, long sentences.`],
      [{ content: 'STRENGTHS', styles: { fontStyle: 'bold', textColor: C.green, fontSize: 9 } }, `${Math.round(green / qs.length * 100)}% GREEN confidence. ${compY} compliant. Strong in Loyalty, Processing, Customer Experience. Named FI references add credibility.`],
      [{ content: 'WEAKNESSES', styles: { fontStyle: 'bold', textColor: C.red, fontSize: 9 } }, `${red} critical gaps: Visa/STAR/NYCE network (Tech 6), data architecture (Tech 24, 28), in-branch printing (A&F 15), settlement (Proc 26), debit (ProdOps 45-46). Capability gaps, not response quality.`],
      [{ content: 'RECOMMENDATIONS', styles: { fontStyle: 'bold', textColor: C.blue, fontSize: 9 } }, `1) Position non-compliant as credit-first strategy. 2) Present concrete Visa partnership timeline. 3) Humanize ${aiHigh} high-risk responses. 4) Debit = out of scope with transition plan.`],
    ],
    columnStyles: { 0: { cellWidth: 35 }, 1: { cellWidth: CW - 35 } },
    bodyStyles: { fontSize: 8, textColor: C.dark, cellPadding: 4 },
    alternateRowStyles: { fillColor: [250, 250, 255] },
  });

  // RED questions table
  const redQs = qs.filter(q => q.confidence === 'RED');
  if (redQs.length > 0) {
    autoTable(doc, {
      startY: (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 5,
      margin: { left: M, right: M },
      head: [['Ref', 'Topic', 'Score', 'Issue']],
      body: redQs.map(q => [q.ref, q.topic, `${q.committee_score}/10`, q.compliant === 'N' ? 'Non-compliant' : 'Partial']),
      headStyles: { fillColor: C.redBg, textColor: C.red, fontSize: 8, fontStyle: 'bold' },
      bodyStyles: { fontSize: 7, textColor: C.dark },
      columnStyles: { 2: { textColor: C.red, fontStyle: 'bold' } },
    });
  }

  // ========== KB + RULES (if present) ==========
  if (kb && (kb.companyFacts || kb.keyMetrics)) {
    doc.addPage();
    addPageMeta();
    doc.setFontSize(16);
    doc.setTextColor(...C.dark);
    doc.text('Knowledge Base', M, 22);

    const kbRows: string[][] = [];
    if (kb.companyFacts) kbRows.push(['Company Facts', kb.companyFacts]);
    if (kb.keyMetrics) kbRows.push(['Key Metrics', kb.keyMetrics]);
    if (kb.differentiators) kbRows.push(['Differentiators', kb.differentiators]);
    if (kb.competitivePositioning) kbRows.push(['Competitive Positioning', kb.competitivePositioning]);

    autoTable(doc, {
      startY: 27,
      margin: { left: M, right: M },
      body: kbRows,
      columnStyles: { 0: { cellWidth: 35, fontStyle: 'bold', textColor: C.blue }, 1: { cellWidth: CW - 35 } },
      bodyStyles: { fontSize: 8, textColor: C.dark, cellPadding: 4 },
      alternateRowStyles: { fillColor: C.blueBg },
    });
  }

  if (globalRules.length > 0 || validationRules.length > 0) {
    const rulesY = kb ? (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10 : 27;
    if (!kb) { doc.addPage(); addPageMeta(); }
    doc.setFontSize(14);
    doc.setTextColor(...C.dark);
    doc.text('Writing Rules', M, rulesY);

    const ruleRows = [
      ...globalRules.map((r, i) => [`${i + 1}. ${r}`, 'Global']),
      ...validationRules.map(r => [r.text, 'Validation']),
    ];
    if (ruleRows.length > 0) {
      autoTable(doc, {
        startY: rulesY + 4,
        margin: { left: M, right: M },
        head: [['Rule', 'Type']],
        body: ruleRows,
        headStyles: { fillColor: C.headerBg, textColor: C.dark, fontSize: 7, fontStyle: 'bold' },
        bodyStyles: { fontSize: 7, textColor: C.dark },
        columnStyles: { 0: { cellWidth: CW - 25 }, 1: { cellWidth: 25, halign: 'center' } },
      });
    }
  }

  // ========== RESPONSES BY CATEGORY ==========
  for (const cat of cats) {
    const catQs = qs.filter(q => q.category === cat);
    if (catQs.length === 0) continue;

    doc.addPage();
    addPageMeta();

    // Category header
    doc.setFontSize(18);
    doc.setTextColor(...C.dark);
    doc.text(cat, M, 22);
    doc.setDrawColor(...C.line);
    doc.setLineWidth(0.3);
    doc.line(M, 25, W - M, 25);

    const catAvg = catQs.reduce((s, q) => s + (q.committee_score || 0), 0) / catQs.length;
    doc.setFontSize(8);
    doc.setTextColor(...C.gray);
    doc.text(`${catQs.length} questions · Avg Score: ${catAvg.toFixed(1)}/10 · ${catQs.filter(q => q.confidence === 'GREEN').length}G ${catQs.filter(q => q.confidence === 'YELLOW').length}Y ${catQs.filter(q => q.confidence === 'RED').length}R`, M, 30);

    // Each question as a table
    for (const q of catQs) {
      const cc = confC(q.confidence);
      const ai = detectAIWriting(q.bullet + ' ' + q.paragraph);
      const delivery: string[] = [];
      if (q.a_oob) delivery.push('OOB');
      if (q.b_config) delivery.push('Config');
      if (q.c_custom) delivery.push('Custom');

      const rows: (string | { content: string; styles: Record<string, unknown> })[][] = [];

      // Status row
      rows.push([
        { content: `${q.ref}  ·  ${q.topic}`, styles: { fontStyle: 'bold', textColor: C.blue, fontSize: 9 } },
        { content: `${q.confidence} | ${q.compliant === 'Y' ? 'Compliant' : q.compliant === 'N' ? 'Non-Compliant' : 'Partial'} | Score: ${q.committee_score}/10 | AI: ${aiDetectLabel(ai.level)}${delivery.length ? ' | ' + delivery.join(',') : ''}`,
          styles: { fontSize: 7, textColor: cc.text } },
      ]);

      // BSB Requirement
      rows.push([
        { content: 'BSB REQUIREMENT', styles: { fontStyle: 'bold', fontSize: 6, textColor: C.lightGray } },
        { content: q.requirement, styles: { fontSize: 7, textColor: C.gray, fillColor: C.headerBg } },
      ]);

      // Brim Response
      rows.push([
        { content: 'BRIM RESPONSE', styles: { fontStyle: 'bold', fontSize: 6, textColor: C.blue } },
        { content: q.paragraph || q.bullet || 'No response.', styles: { fontSize: 8, textColor: C.dark } },
      ]);

      // Score reasoning
      if (q.committee_review) {
        rows.push([
          { content: 'SCORE REASONING', styles: { fontStyle: 'bold', fontSize: 6, textColor: cc.text } },
          { content: q.committee_review, styles: { fontSize: 7, textColor: cc.text, fillColor: cc.bg } },
        ]);
      }

      // Rationale
      if (q.rationale) {
        rows.push([
          { content: 'SOURCE', styles: { fontStyle: 'bold', fontSize: 6, textColor: C.lightGray } },
          { content: q.rationale.slice(0, 300), styles: { fontSize: 6, textColor: C.gray, fontStyle: 'italic' } },
        ]);
      }

      // Pricing
      if (q.pricing) {
        rows.push([
          { content: 'PRICING', styles: { fontStyle: 'bold', fontSize: 6, textColor: C.lightGray } },
          { content: q.pricing, styles: { fontSize: 7, textColor: C.gray } },
        ]);
      }

      // Claude note for flagged items
      if (ai.level !== 'low') {
        rows.push([
          { content: 'CLAUDE NOTE', styles: { fontStyle: 'bold', fontSize: 6, textColor: C.purple } },
          { content: `AI score ${ai.score} (${aiDetectLabel(ai.level)}). ${ai.triggers.slice(0, 3).join(', ')}. ${ai.suggestion.slice(0, 150)}`,
            styles: { fontSize: 6, textColor: C.purple, fillColor: C.purpleBg } },
        ]);
      }

      // Claude recommendation for RED
      if (q.confidence === 'RED') {
        rows.push([
          { content: 'CLAUDE REC', styles: { fontStyle: 'bold', fontSize: 6, textColor: C.purple } },
          { content: q.compliant === 'N'
            ? 'Capability gap. Position as credit-first focus. Present partnership/roadmap timeline.'
            : 'Partial compliance. Separate what IS covered vs config/partnership needs. Prepare for Q&A.',
            styles: { fontSize: 7, textColor: C.purple, fillColor: C.purpleBg, fontStyle: 'italic' } },
        ]);
      }

      autoTable(doc, {
        startY: (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable?.finalY
          ? (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 4
          : 35,
        margin: { left: M, right: M },
        body: rows,
        columnStyles: { 0: { cellWidth: 25 }, 1: { cellWidth: CW - 25 } },
        bodyStyles: { cellPadding: 3 },
        didDrawPage: () => addPageMeta(),
      });
    }
  }

  // ========== FINAL PAGE ==========
  doc.addPage();
  addPageMeta();
  doc.setFontSize(12);
  doc.setTextColor(...C.gray);
  doc.text('This document is confidential and prepared solely', W / 2, H / 2 - 10, { align: 'center' });
  doc.text('for Bangor Savings Bank.', W / 2, H / 2 - 3, { align: 'center' });
  doc.setFontSize(10);
  doc.text(`Brim Financial · ${new Date().getFullYear()}`, W / 2, H / 2 + 8, { align: 'center' });

  doc.save('BSB_RFP_Response_Brim_Financial.pdf');
}
