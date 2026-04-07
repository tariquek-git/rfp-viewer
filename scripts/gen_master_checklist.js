'use strict';
/**
 * Generates the BSB RFP Master Checklist — what's done, what's blocking, outliers, decisions.
 * Run: node scripts/gen_master_checklist.js
 */
const { writeFileSync, readFileSync } = require('fs');
const path = require('path');
const os = require('os');
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  WidthType, AlignmentType, ShadingType, BorderStyle, Header,
} = require('docx');

const data = JSON.parse(readFileSync(path.join(__dirname, '../public/rfp_data.json'), 'utf8'));
const qs = data.questions;
const DATE = new Date().toISOString().slice(0, 10);

// ── Colors ───────────────────────────────────────────────────────────────────
const C = {
  navy: '1E3A5F', navyBg: 'EBF2FA',
  green: '047857', greenBg: 'ECFDF5',
  yellow: 'B45309', yellowBg: 'FFFBEB',
  red: 'B91C1C', redBg: 'FEF2F2',
  gray: '6B7280', grayBg: 'F3F4F6',
  grayLight: 'E5E7EB', dark: '111827', medium: '374151',
  white: 'FFFFFF', orange: 'C2410C', orangeBg: 'FFF7ED',
};

// ── Helpers ───────────────────────────────────────────────────────────────────
const sp = (b = 0, a = 0) => new Paragraph({ spacing: { before: b, after: a } });

function h1(text, color = C.navy) {
  return new Paragraph({
    spacing: { before: 320, after: 120 },
    children: [new TextRun({ text, bold: true, size: 32, font: 'Calibri', color })],
  });
}

function h2(text) {
  return new Paragraph({
    spacing: { before: 200, after: 80 },
    children: [new TextRun({ text, bold: true, size: 24, font: 'Calibri', color: C.navy })],
  });
}

function body(text, opts = {}) {
  return new Paragraph({
    spacing: { before: 0, after: 120 },
    children: [new TextRun({ text, size: 22, font: 'Calibri', color: C.dark, ...opts })],
  });
}

function checkItem(label, detail, done = true) {
  return new Paragraph({
    spacing: { before: 0, after: 80 },
    children: [
      new TextRun({ text: done ? '✓  ' : '○  ', bold: true, size: 22, font: 'Calibri', color: done ? C.green : C.gray }),
      new TextRun({ text: label, bold: true, size: 22, font: 'Calibri', color: done ? C.dark : C.medium }),
      detail ? new TextRun({ text: '  — ' + detail, size: 20, font: 'Calibri', color: C.gray }) : new TextRun(''),
    ],
  });
}

function blockItem(label, detail) {
  return new Paragraph({
    spacing: { before: 0, after: 100 },
    children: [
      new TextRun({ text: '■  ', bold: true, size: 22, font: 'Calibri', color: C.red }),
      new TextRun({ text: label, bold: true, size: 22, font: 'Calibri', color: C.dark }),
      detail ? new TextRun({ text: '\n     ' + detail, size: 20, font: 'Calibri', color: C.medium }) : new TextRun(''),
    ],
  });
}

function warnItem(label, detail) {
  return new Paragraph({
    spacing: { before: 0, after: 100 },
    children: [
      new TextRun({ text: '▲  ', bold: true, size: 22, font: 'Calibri', color: C.yellow }),
      new TextRun({ text: label, bold: true, size: 22, font: 'Calibri', color: C.dark }),
      detail ? new TextRun({ text: '  — ' + detail, size: 20, font: 'Calibri', color: C.medium }) : new TextRun(''),
    ],
  });
}

function flagItem(num, label, detail) {
  return new Paragraph({
    spacing: { before: 0, after: 100 },
    children: [
      new TextRun({ text: `${num}.  `, bold: true, size: 22, font: 'Calibri', color: C.orange }),
      new TextRun({ text: label, bold: true, size: 22, font: 'Calibri', color: C.dark }),
      detail ? new TextRun({ text: '\n      ' + detail, size: 20, font: 'Calibri', color: C.medium }) : new TextRun(''),
    ],
  });
}

function divider() {
  return new Paragraph({
    spacing: { before: 160, after: 160 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: C.grayLight } },
    children: [],
  });
}

function banner(label, bgColor, textColor = C.white) {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [new TableCell({
          shading: { fill: bgColor, type: ShadingType.CLEAR },
          borders: {
            top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE },
            left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE },
          },
          margins: { top: 100, bottom: 100, left: 200, right: 200 },
          children: [new Paragraph({
            spacing: { before: 0, after: 0 },
            children: [new TextRun({ text: label, bold: true, size: 24, font: 'Calibri', color: textColor })],
          })],
        })],
      }),
    ],
  });
}

function ownerTable(owner, items) {
  const rows = [
    new TableRow({
      children: [
        new TableCell({
          columnSpan: 2,
          shading: { fill: C.navy, type: ShadingType.CLEAR },
          borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
          margins: { top: 80, bottom: 80, left: 160, right: 160 },
          children: [new Paragraph({
            spacing: { before: 0, after: 0 },
            children: [new TextRun({ text: owner, bold: true, size: 22, font: 'Calibri', color: C.white })],
          })],
        }),
      ],
    }),
    ...items.map((item, i) => new TableRow({
      children: [
        new TableCell({
          width: { size: 5, type: WidthType.PERCENTAGE },
          shading: { fill: C.navyBg, type: ShadingType.CLEAR },
          borders: { top: { style: BorderStyle.SINGLE, size: 4, color: C.grayLight }, bottom: { style: BorderStyle.SINGLE, size: 4, color: C.grayLight }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.SINGLE, size: 4, color: C.grayLight } },
          margins: { top: 60, bottom: 60, left: 120, right: 120 },
          children: [new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 0, after: 0 },
            children: [new TextRun({ text: String(i + 1), size: 20, font: 'Calibri', color: C.navy, bold: true })],
          })],
        }),
        new TableCell({
          width: { size: 95, type: WidthType.PERCENTAGE },
          shading: { fill: C.white, type: ShadingType.CLEAR },
          borders: { top: { style: BorderStyle.SINGLE, size: 4, color: C.grayLight }, bottom: { style: BorderStyle.SINGLE, size: 4, color: C.grayLight }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
          margins: { top: 60, bottom: 60, left: 120, right: 120 },
          children: [new Paragraph({
            spacing: { before: 0, after: 0 },
            children: [
              new TextRun({ text: item.label, bold: true, size: 20, font: 'Calibri', color: C.dark }),
              item.note ? new TextRun({ text: '  ' + item.note, size: 18, font: 'Calibri', color: C.gray }) : new TextRun(''),
            ],
          })],
        }),
      ],
    })),
  ];
  return new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows });
}

// ════════════════════════════════════════════════════════════════════════════
// BUILD DOCUMENT
// ════════════════════════════════════════════════════════════════════════════
function build() {
  const children = [];

  // ── COVER ─────────────────────────────────────────────────────────────────
  children.push(
    sp(0, 480),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: 80 },
      children: [new TextRun({ text: 'BRIM FINANCIAL', bold: true, size: 36, font: 'Calibri', color: C.navy })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: 80 },
      children: [new TextRun({ text: 'BSB RFP — Master Checklist', bold: true, size: 28, font: 'Calibri', color: C.dark })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: 80 },
      children: [new TextRun({ text: 'Done · Blocking · Decisions · Outliers · [CONFIRM] Items by Owner', size: 22, font: 'Calibri', color: C.medium })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: 160 },
      children: [new TextRun({ text: `For: Tarique Khan  ·  ${DATE}  ·  Submission deadline April 10, 2026`, size: 20, font: 'Calibri', color: C.gray })],
    }),
    sp(0, 480),
    divider(),
    sp(0, 160),
  );

  // ── SECTION 1 — DONE ──────────────────────────────────────────────────────
  children.push(
    banner('✅  SECTION 1 — COMPLETED', C.green),
    sp(0, 120),
    body('The following items have been completed and are reflected in the current deliverables on Desktop.', { color: C.gray }),
    sp(0, 80),

    h2('Matrix & Data (rfp_data.json)'),
    checkItem('383 questions', '4 editorial passes — initial draft → editorial → QA/tone → final'),
    checkItem('All "Brim" → "BRIM"', 'Bulk Python replace, all 383 questions verified, 0 remaining'),
    checkItem('TSYS fully removed', '10 questions, 21 instances → replaced with "BRIM\'s payment processor"'),
    checkItem('Technology 6 — Visa added', 'Mastercard-only language corrected to Mastercard + Visa throughout'),
    checkItem('Processing 26 — score corrected', 'committee_score 3 → 7 (data entry error; GREEN/Compliant content)'),
    checkItem('Processing 10 — cleaned + flagged', 'Hollow TSYS fraud bullet removed; question flagged for review'),
    checkItem('Compliance summary counts', 'Live counts plugged into narrative Section 4 (no more [CONFIRM])'),
    sp(0, 80),

    h2('Scripts & Code'),
    checkItem('gen_word_exports.js', 'Output filenames fixed (Brim → BRIM), hardcoded paths → portable paths, process.exit(1) on error'),
    checkItem('gen_excel_export.js', 'Same path + error handling fixes'),
    checkItem('gen_narrative_response.js', 'Same path + error handling fixes'),
    checkItem('export-excel/route.ts', 'Input validation added — JSON parse error handling + structural validation'),
    checkItem('next.config.ts', 'X-Frame-Options, X-Content-Type-Options, Referrer-Policy headers added'),
    checkItem('src/types.ts', 'confidence + compliant tightened to strict union types (\'GREEN\' | \'YELLOW\' | \'RED\' etc.)'),
    sp(0, 80),

    h2('Narrative (gen_narrative_response.js)'),
    checkItem('"looks forward to" removed', 'Partner Onboarding section'),
    checkItem('"highly defensible market position" → "cost economics that improve as portfolio scales"'),
    checkItem('"cobbled service model" → "managing multiple separate vendor relationships"'),
    checkItem('"Comprehensive" × 6 → "full", "tested", "complete", "structured"'),
    checkItem('"leading cloud infrastructure" → "major cloud infrastructure" (both instances)'),
    checkItem('Section 19 SilverLake rewritten', 'Confident: "methodology proven across comparable architectures"'),
    checkItem('Data ownership flipped affirmative', 'BSB owns all data, BRIM acts as contracted service provider'),
    checkItem('M&A sentence → "BRIM is not pursuing an IPO"'),
    checkItem('Data retention consolidated', 'Two paragraphs merged into one'),
    checkItem('Upgrade section rewritten', 'Affirmative framing throughout'),
    sp(0, 80),

    h2('Deliverables Generated (Desktop)'),
    checkItem('BSB_RFP_Submission_BRIM_FINAL_2026-04-03.docx', '219 KB — clean, goes to BSB'),
    checkItem('BSB_RFP_WorkingCopy_BRIM_FINAL_2026-04-03.docx', '325 KB — internal only'),
    checkItem('BSB_Matrix_BRIM_FINAL_2026-04-03.xlsx', '240 KB — 3 sheets'),
    checkItem('BSB_Narrative_Response_BRIM_DRAFT_2026-04-03.docx', '27 KB — DRAFT, 28 [CONFIRM] items remain'),
    sp(0, 160),
    divider(),
  );

  // ── SECTION 2 — BLOCKING ──────────────────────────────────────────────────
  children.push(
    banner('🔴  SECTION 2 — BLOCKING (Must Resolve Before April 10)', C.red),
    sp(0, 120),

    blockItem('Sales contact', 'Name, title, phone, email needed for narrative Section 3 and Section 5. Currently 0% complete.'),
    sp(0, 40),
    blockItem('3 reference accounts (Section 7)', 'Full contact details + program description + confirmed willingness to accept calls. This entire section is a placeholder. Minimum: 2 agent bank / card programs live > 1 year. At least 2 must be programs NOT already named in Section 3.'),
    sp(0, 40),
    blockItem('Technology 6 — local US clearing switch (only N in matrix)', 'BRIM has no US local switch connections. Response is correctly framed as credit-only-by-design. Confirm with sales: is this a hard disqualifier for BSB, or is the credit-only framing sufficient? Prepare verbal Q&A response.'),
    sp(0, 40),
    blockItem('Technology 24 — uptime SLA gap', 'BSB wants 99.999% uptime. BRIM contractual SLA is 99.9%. Trailing 12-month actual is 99.97%. Three decisions needed:\n      (a) Can 99.97% trailing figure be disclosed externally?\n      (b) Offer enhanced SLA in submission, or defer to contracting?\n      (c) LeaseWeb — keep named or genericize (see Section 3)'),
    sp(0, 40),
    blockItem('Technology 28 — US data center location', 'BSB asked for specific US data center locations. Current answer is "primary: LeaseWeb Montreal + forward plan for US colocation." Confirm: Is US colocation a firm plan with a timeline, or aspirational? If aspirational, must reword.'),
    sp(0, 40),
    blockItem('Pricing decisions — 5 questions', 'See Section 3 for details. Cannot submit with "NEEDS COMMERCIAL TEAM INPUT" in the matrix.'),
    sp(0, 160),
    divider(),
  );

  // ── SECTION 3 — DECISIONS PENDING ────────────────────────────────────────
  children.push(
    banner('⚠️  SECTION 3 — DECISIONS PENDING (Strategic Choices)', C.yellow, C.dark),
    sp(0, 120),

    h2('Decision 1: Pricing — 5 Questions'),
    body('Five questions in the matrix have pricing fields marked "NEEDS COMMERCIAL TEAM INPUT". These go to BSB in the Excel matrix.'),
    sp(0, 80),
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({ children: [
          new TableCell({ width: { size: 30, type: WidthType.PERCENTAGE }, shading: { fill: C.navy, type: ShadingType.CLEAR }, borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } }, margins: { top: 80, bottom: 80, left: 120, right: 120 }, children: [new Paragraph({ spacing: { before: 0, after: 0 }, children: [new TextRun({ text: 'Ref', bold: true, size: 20, font: 'Calibri', color: C.white })] })] }),
          new TableCell({ width: { size: 30, type: WidthType.PERCENTAGE }, shading: { fill: C.navy, type: ShadingType.CLEAR }, borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } }, margins: { top: 80, bottom: 80, left: 120, right: 120 }, children: [new Paragraph({ spacing: { before: 0, after: 0 }, children: [new TextRun({ text: 'Topic', bold: true, size: 20, font: 'Calibri', color: C.white })] })] }),
          new TableCell({ width: { size: 40, type: WidthType.PERCENTAGE }, shading: { fill: C.navy, type: ShadingType.CLEAR }, borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } }, margins: { top: 80, bottom: 80, left: 120, right: 120 }, children: [new Paragraph({ spacing: { before: 0, after: 0 }, children: [new TextRun({ text: 'Decision needed', bold: true, size: 20, font: 'Calibri', color: C.white })] })] }),
        ]}),
        ...[
          ['Compliance & Reporting 3', 'CFPB TCCP reporting', 'Included in base platform or compliance add-on?'],
          ['Processing 19', 'Verafin AML integration', 'Setup fee / pass-through / included?'],
          ['Accounting & Finance 3', 'Sub-ledgering / multi-entity', 'Confirm: included in base platform'],
          ['Accounting & Finance 4', 'Revenue sharing automation', 'Confirm: included in base platform'],
          ['Accounting & Finance 15', '1099 tax form generation (US)', 'US-specific add-on or included?'],
        ].map(([ref, topic, dec]) => new TableRow({ children: [
          new TableCell({ width: { size: 30, type: WidthType.PERCENTAGE }, shading: { fill: C.navyBg, type: ShadingType.CLEAR }, borders: { top: { style: BorderStyle.SINGLE, size: 4, color: C.grayLight }, bottom: { style: BorderStyle.SINGLE, size: 4, color: C.grayLight }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } }, margins: { top: 60, bottom: 60, left: 120, right: 120 }, children: [new Paragraph({ spacing: { before: 0, after: 0 }, children: [new TextRun({ text: ref, size: 20, font: 'Calibri', color: C.dark })] })] }),
          new TableCell({ width: { size: 30, type: WidthType.PERCENTAGE }, shading: { fill: C.white, type: ShadingType.CLEAR }, borders: { top: { style: BorderStyle.SINGLE, size: 4, color: C.grayLight }, bottom: { style: BorderStyle.SINGLE, size: 4, color: C.grayLight }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } }, margins: { top: 60, bottom: 60, left: 120, right: 120 }, children: [new Paragraph({ spacing: { before: 0, after: 0 }, children: [new TextRun({ text: topic, size: 20, font: 'Calibri', color: C.dark })] })] }),
          new TableCell({ width: { size: 40, type: WidthType.PERCENTAGE }, shading: { fill: C.yellowBg, type: ShadingType.CLEAR }, borders: { top: { style: BorderStyle.SINGLE, size: 4, color: C.grayLight }, bottom: { style: BorderStyle.SINGLE, size: 4, color: C.grayLight }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } }, margins: { top: 60, bottom: 60, left: 120, right: 120 }, children: [new Paragraph({ spacing: { before: 0, after: 0 }, children: [new TextRun({ text: dec, size: 20, font: 'Calibri', color: C.yellow })] })] }),
        ]})),
      ],
    }),
    sp(0, 80),
    body('Options: (A) Fill with actual pricing from commercial team  ·  (B) "Pricing in accompanying commercial proposal"  ·  (C) Confirm capability included, remove flag entirely', { color: C.gray, italics: true }),
    sp(0, 120),

    h2('Decision 2: Jack Henry / SilverLake Positioning'),
    warnItem('Has BRIM actually done a SilverLake integration?', 'Narrative says "methodology proven across comparable core banking architectures, SilverLake fits within that playbook." Matrix says "in scoping for BSB." If BRIM has NOT done a SilverLake integration before, this framing must be reworded to avoid misrepresentation.'),
    warnItem('Name a live JH SilverLake client?', 'Option: name a live reference with SilverLake if one exists. Otherwise keep proven-methodology framing.'),
    sp(0, 80),

    h2('Decision 3: Visa + Mastercard — Play Both or Lead One?'),
    warnItem('Current state', 'All answers now reference both Mastercard and Visa equally (fixed from Mastercard-only). Narrative says "run on Mastercard and Visa networks."'),
    warnItem('Key question', 'Is BRIM\'s Visa capability production-proven for US programs, or is Mastercard the primary network and Visa secondary? If Mastercard-first, leading with Visa equally may create credibility questions during due diligence.'),
    warnItem('Recommendation', 'Clarify with product team which network is fully production-proven for US programs. Adjust emphasis accordingly.'),
    sp(0, 80),

    h2('Decision 4: LeaseWeb — Name or Genericize?'),
    warnItem('2 refs remain', 'Technology 24 (uptime) and Technology 28 (data residency) still name LeaseWeb in BSB-facing bullet/paragraph fields.'),
    warnItem('Narrative says', '"major cloud infrastructure provider" — inconsistent with matrix. Align one way: either both specific (LeaseWeb) or both generic ("BRIM\'s primary data center facility").'),
    warnItem('Note', 'If LeaseWeb is named in the PCI DSS AOC, keep it consistent. Generic is safer if BSB will ask for the AOC.'),
    sp(0, 80),

    h2('Decision 5: 99.97% Uptime Figure'),
    warnItem('Currently in Technology 24', 'Trailing 12-month uptime = 99.97% is in the BSB-facing paragraph. Strong claim.'),
    warnItem('Risk', 'If BSB requests monitoring logs during due diligence, BRIM must be able to produce them. Confirm before submitting.'),
    warnItem('Decision', 'Approved to share externally with BSB? If yes, confirm monitoring data is available on request.'),
    sp(0, 160),
    divider(),
  );

  // ── SECTION 4 — OUTLIER FLAGS ─────────────────────────────────────────────
  children.push(
    banner('🚩  SECTION 4 — OUTLIER FLAGS', C.orange),
    sp(0, 120),

    flagItem(1, 'Technology 6 — Only N in the matrix (RED / Score 3)',
      'Local US clearing switch. BRIM has none. Response is credit-only-by-design framing. BSB may fixate on this during evaluation. Prepare a verbal response for Q&A. This is the highest-risk item in the submission.'),
    flagItem(2, 'Section 7 (References) — 0% complete',
      'Entire section is a single [CONFIRM] item. No content written. No references named. This is the most visible gap in the narrative document.'),
    flagItem(3, 'Section 9 (Reliability) — No uptime % stated',
      'Narrative says "targets high availability" with zero numbers. For a bank evaluating a card processor, uptime is the #1 operational metric. Must add a specific contractual % before submission.'),
    flagItem(4, 'Section 10 (Scalability) — No performance benchmarks',
      'Transactions per second, authorization response time, report generation time — all absent. BSB will ask. Deferred to "detailed benchmarks available under NDA" which is weak for RFP stage.'),
    flagItem(5, 'Activation & Fulfillment 15 — In-branch card printing (YELLOW / Score 5)',
      'Positioned as "API integration with third-party instant issuance hardware" but no provider named. Internal notes question whether any partner FI has actually deployed this. Confirm before submission.'),
    flagItem(6, 'Product Operations 1 — Partial compliance on debit/HSA/prepaid (GREEN / Score 7)',
      'Credit-first platform, debit via integration. Response correctly positioned. Low risk but prep for BSB follow-up on debit capabilities during evaluation.'),
    flagItem(7, 'Processing 10 — Flagged for review',
      'Cleaned up from TSYS removal. Fraud response reads cleanly now. Review and unflag when confirmed.'),
    flagItem(8, 'American Express / Discover — Section 3 says "underway"',
      'If BSB asks about AmEx/Discover during evaluation: honest answer is "in development." Ensure sales team is aligned before the Q&A call.'),
    flagItem(9, 'Accounting & Finance 15 — 1099 filing (US)',
      '$600 threshold is correct US tax law. But confirm BRIM Financial Corp. (Delaware) actually operates 1099 filing for US programs. This is a real operational requirement, not aspirational.'),
    flagItem(10, 'Compliance & Reporting 29 — "Will provide during due diligence"',
      'Soft commitment in BSB-facing text. Confirm the compliance policies + procedures package exists and is ready to send same-day if BSB requests it post-submission.'),
    sp(0, 160),
    divider(),
  );

  // ── SECTION 5 — [CONFIRM] ITEMS BY OWNER ─────────────────────────────────
  children.push(
    banner('📋  SECTION 5 — [CONFIRM] ITEMS BY OWNER (28 Total)', C.navy),
    sp(0, 120),
    body(`28 items require internal BRIM team input before the April 10 submission. Distributed across 6 owner groups.`, { color: C.gray }),
    sp(0, 120),

    ownerTable('Tarique / Sales  (4 items)', [
      { label: 'Sales contact name, title, email, phone', note: 'Narrative Sections 3 + 5' },
      { label: '3 reference accounts — full contact details + program description + willingness to take calls', note: 'Section 7 — BLOCKING' },
      { label: 'Confirm whether onsite training at Bangor, ME is included in standard scope', note: 'Section 20' },
      { label: 'Confirm AmEx/Discover "underway" language is accurate (or remove)', note: 'Section 3' },
    ]),
    sp(0, 120),

    ownerTable('Product / Engineering  (7 items)', [
      { label: 'Last 3 release dates and feature descriptions', note: 'Section 16' },
      { label: 'Current platform version number + next scheduled release date', note: 'Section 5' },
      { label: 'Number of active programs — US and internationally', note: 'Section 5' },
      { label: 'Confirm Jack Henry SilverLake integration methodology claim is accurate', note: 'Section 19' },
      { label: 'Confirm in-branch instant issuance is live with at least 1 FI (not theoretical)', note: 'Activation 15' },
      { label: 'Confirm 99.97% uptime figure is approved for external disclosure', note: 'Technology 24' },
      { label: 'Confirm transactions-per-second capacity benchmark exists and can be cited', note: 'Section 10' },
    ]),
    sp(0, 120),

    ownerTable('Legal / Compliance  (5 items)', [
      { label: 'SOC 2 Type II — report date + next scheduled audit', note: 'Section 11 — attach under NDA' },
      { label: 'PCI DSS Level 1 AOC — attach in appendix', note: 'Section 11' },
      { label: 'Standard data ownership contract language — review and attach', note: 'Section 18' },
      { label: 'Standard SLA document — attach in appendix', note: 'Section 6' },
      { label: 'Compliance policies + procedures package — confirm ready to send day-of request', note: 'Compliance 29' },
    ]),
    sp(0, 120),

    ownerTable('Finance / Commercial  (5 items)', [
      { label: 'Complete pricing section — line-item fee schedule', note: 'Section 5 — BLOCKING' },
      { label: 'API fee structure and cost inclusions', note: 'Section 5' },
      { label: '5-year TCO model for BSB', note: 'Section 5 — Appendix' },
      { label: 'Customization pricing — T&M rates or fixed-price model with examples', note: 'Section 17' },
      { label: 'Confirm 5 flagged pricing questions (Compliance 3, Processing 19, Accounting 3/4/15)', note: 'See Section 3 above' },
    ]),
    sp(0, 120),

    ownerTable('Leadership  (5 items)', [
      { label: 'Headcount — what is appropriate to disclose externally', note: 'Section 3' },
      { label: 'Financial disclosure — revenue/profit ratio approved for RFP', note: 'Section 3' },
      { label: 'Current Dun & Bradstreet report — attach in appendix', note: 'Section 3' },
      { label: 'Independent fiscal health letter or investor confirmation', note: 'Section 3' },
      { label: 'Uptime enhanced SLA decision — offer in submission or defer to contract negotiation', note: 'Technology 24' },
    ]),
    sp(0, 120),

    ownerTable('Architecture / Infrastructure  (2 items)', [
      { label: 'Architecture diagrams — functional, security, tenancy, third-party integrations', note: 'Section 8 — Appendix' },
      { label: 'BCDR executive summary — last DR test date + results', note: 'Section 13 — Appendix' },
    ]),
    sp(0, 160),
    divider(),
  );

  // ── SECTION 6 — TIMELINE ──────────────────────────────────────────────────
  children.push(
    banner('📅  SECTION 6 — WHAT STILL NEEDS TO GET DONE', C.medium),
    sp(0, 120),

    h2('By April 7 — Internal Review Complete'),
    checkItem('Fill in sales contact + references', 'Tarique action', false),
    checkItem('Get pricing decisions from commercial team', '5 flagged questions', false),
    checkItem('Confirm Jack Henry SilverLake claim is accurate', 'Product team', false),
    checkItem('Confirm Visa production depth for US programs', 'Product team', false),
    checkItem('LeaseWeb decision → regenerate all 4 docs', 'If genericizing: 10-minute Python fix + re-export', false),
    checkItem('Add uptime % to narrative Section 9', '99.9% contractual minimum, plus actual if approved', false),
    checkItem('Add performance benchmarks to Section 10', 'TPS + authorization response time', false),
    checkItem('Confirm in-branch card printing is live', 'Activation 15 YELLOW flag', false),
    sp(0, 80),

    h2('By April 9 — Final Review'),
    checkItem('All 28 [CONFIRM] items resolved or explicitly deferred with rationale', '', false),
    checkItem('All appendix docs collected', 'PCI AOC, SOC 2, SLA, BCDR, API docs, architecture diagrams', false),
    checkItem('Processing 10 flag reviewed and cleared', '', false),
    checkItem('Regenerate all 4 deliverables with final timestamps', '', false),
    checkItem('Final read-through of Submission Word doc', 'Tarique + legal', false),
    sp(0, 80),

    h2('April 10 — Submission'),
    checkItem('Package for BSB: Submission Word + Excel Matrix + Narrative Response + Appendices', '', false),
    checkItem('Do NOT include Working Copy in BSB package', 'Internal eyes only', false),
    checkItem('Confirm all [CONFIRM] items filled or explicitly marked as "Available on Request"', '', false),
    sp(0, 160),
    divider(),
    sp(0, 240),

    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: 80 },
      children: [new TextRun({ text: 'BRIM Financial  ·  Internal Use Only  ·  Do Not Distribute', size: 18, font: 'Calibri', color: C.gray, italics: true })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: 0 },
      children: [new TextRun({ text: `Generated ${DATE}  ·  BSB RFP Deadline: April 10, 2026`, size: 18, font: 'Calibri', color: C.gray, italics: true })],
    }),
  );

  return new Document({
    creator: 'BRIM Financial',
    title: 'BSB RFP Master Checklist',
    description: 'Master checklist of completed items, blockers, decisions, outliers, and [CONFIRM] items by owner',
    styles: {
      default: { document: { run: { font: 'Calibri', size: 22 } } },
    },
    sections: [{
      properties: { page: { margin: { top: 1080, bottom: 1080, left: 1080, right: 1080 } } },
      headers: {
        default: new Header({
          children: [new Paragraph({
            alignment: AlignmentType.RIGHT,
            border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: C.grayLight } },
            spacing: { before: 0, after: 80 },
            children: [new TextRun({ text: `BRIM Financial  ·  BSB RFP Master Checklist  ·  ${DATE}  ·  INTERNAL`, size: 16, font: 'Calibri', color: C.gray })],
          })],
        }),
      },
      children,
    }],
  });
}

async function main() {
  const doc = build();
  const buf = await Packer.toBuffer(doc);
  const outPath = path.join(os.homedir(), `Desktop/BSB_Master_Checklist_BRIM_${DATE}.docx`);
  writeFileSync(outPath, buf);
  console.log(`Master Checklist: ${outPath} (${Math.round(buf.byteLength / 1024)}KB)`);
}
main().catch(err => { console.error(err); process.exit(1); });
