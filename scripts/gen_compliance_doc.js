#!/usr/bin/env node
'use strict';

const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  HeadingLevel, AlignmentType, BorderStyle, WidthType, ShadingType,
  VerticalAlign, Header, Footer, PageNumber, LevelFormat, PageBreak
} = require('docx');
const fs = require('fs');
const path = require('path');
const os = require('os');

const OUTPUT = path.join(os.homedir(), 'Desktop', 'BSB_RFP_Compliance_Regulatory_BRIM_2026-04-06.docx');

// ── Colours ──────────────────────────────────────────────────────────────────
const NAVY    = '1F3864';
const TEAL    = '2E75B6';
const GREEN   = '70AD47';
const YELLOW  = 'FFD966';
const RED_C   = 'FF0000';
const LIGHT_BLUE = 'D5E8F0';
const LIGHT_GREEN = 'E2EFDA';
const LIGHT_YELLOW = 'FFF2CC';
const LIGHT_RED   = 'FFE0E0';
const LIGHT_GRAY  = 'F2F2F2';
const MID_GRAY    = 'D9D9D9';
const WHITE   = 'FFFFFF';

// ── Border helpers ────────────────────────────────────────────────────────────
const thinBorder = (color = 'CCCCCC') => ({ style: BorderStyle.SINGLE, size: 1, color });
const noBorder   = () => ({ style: BorderStyle.NONE, size: 0, color: 'FFFFFF' });
const allBorders = (color = 'CCCCCC') => ({ top: thinBorder(color), bottom: thinBorder(color), left: thinBorder(color), right: thinBorder(color) });
const noBorders  = () => ({ top: noBorder(), bottom: noBorder(), left: noBorder(), right: noBorder() });

// ── Text helpers ──────────────────────────────────────────────────────────────
const t = (text, opts = {}) => new TextRun({ text: String(text || ''), font: 'Arial', size: opts.size || 20, bold: opts.bold, italic: opts.italic, color: opts.color || '000000', ...opts });
const br = () => new TextRun({ break: 1 });

const p = (children, opts = {}) => new Paragraph({
  children: Array.isArray(children) ? children : [children],
  spacing: { before: opts.before ?? 60, after: opts.after ?? 60 },
  alignment: opts.align || AlignmentType.LEFT,
  ...opts
});

const h1 = (text) => new Paragraph({
  heading: HeadingLevel.HEADING_1,
  children: [new TextRun({ text, font: 'Arial', size: 28, bold: true, color: WHITE })],
  spacing: { before: 240, after: 120 },
  shading: { fill: NAVY, type: ShadingType.CLEAR },
  indent: { left: 120, right: 120 }
});

const h2 = (text) => new Paragraph({
  heading: HeadingLevel.HEADING_2,
  children: [new TextRun({ text, font: 'Arial', size: 24, bold: true, color: NAVY })],
  spacing: { before: 200, after: 80 },
  border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: TEAL } }
});

const h3 = (text) => new Paragraph({
  heading: HeadingLevel.HEADING_3,
  children: [new TextRun({ text, font: 'Arial', size: 22, bold: true, color: TEAL })],
  spacing: { before: 160, after: 60 }
});

const bullet = (text, indent = 0) => new Paragraph({
  numbering: { reference: 'bullets', level: indent },
  children: [new TextRun({ text: String(text || ''), font: 'Arial', size: 20 })],
  spacing: { before: 40, after: 40 }
});

const bsbLabel = (text) => p([t('BSB Asked: ', { bold: true, color: '7030A0' }), t(text, { italic: true, color: '555555' })], { before: 100, after: 40 });
const brimLabel = (text) => p([t('BRIM\'s Answer:', { bold: true, color: NAVY })], { before: 80, after: 40 });
const approachLabel = () => p([t('BRIM\'s Approach to Helping BSB:', { bold: true, color: '375623' })], { before: 80, after: 40 });

const noteBox = (text, fillColor = LIGHT_YELLOW, textColor = '7D6608') => new Table({
  width: { size: 9360, type: WidthType.DXA },
  columnWidths: [9360],
  rows: [new TableRow({ children: [new TableCell({
    borders: allBorders('FFD966'),
    shading: { fill: fillColor, type: ShadingType.CLEAR },
    margins: { top: 80, bottom: 80, left: 120, right: 120 },
    width: { size: 9360, type: WidthType.DXA },
    children: [p([t(text, { color: textColor, size: 19 })])]
  })]})],
});

const spacer = (before = 80) => p([t('')], { before, after: 0 });

// ── Cell helpers ──────────────────────────────────────────────────────────────
const hdrCell = (text, width, fill = NAVY) => new TableCell({
  borders: allBorders(NAVY),
  shading: { fill, type: ShadingType.CLEAR },
  margins: { top: 80, bottom: 80, left: 100, right: 100 },
  width: { size: width, type: WidthType.DXA },
  verticalAlign: VerticalAlign.CENTER,
  children: [p([t(text, { bold: true, color: WHITE, size: 18 })], { before: 0, after: 0, align: AlignmentType.LEFT })]
});

const dataCell = (text, width, fill = WHITE, textColor = '000000', bold = false) => new TableCell({
  borders: allBorders('CCCCCC'),
  shading: { fill, type: ShadingType.CLEAR },
  margins: { top: 60, bottom: 60, left: 100, right: 100 },
  width: { size: width, type: WidthType.DXA },
  verticalAlign: VerticalAlign.TOP,
  children: [p([t(text, { size: 18, color: textColor, bold })], { before: 0, after: 0 })]
});

// ── Summary Table ─────────────────────────────────────────────────────────────
const summaryRows = [
  ['CFPB (TCCP, Reg Z, monitoring)', '3', 'Full support — dedicated CRRO (Abraham Tachjian)', 'GREEN'],
  ['OFAC / Sanctions Screening', '2', 'World-Check One (LSEG Refinitiv), daily batch re-screening', 'GREEN'],
  ['MLA / SCRA (Military Lending)', '2', 'DMDC MLA database, auto APR cap at 6%', 'GREEN'],
  ['Reg O (Insider Lending)', '1', 'Insider list check at application, flag + queue', 'GREEN'],
  ['Reg B (Equal Credit Opportunity)', '1', 'Joint intent captured all channels', 'GREEN*'],
  ['Metro 2 / Credit Bureau (Equifax, Experian, TU)', '2', 'Monthly Metro 2 to all 3 bureaus + e-OSCAR', 'GREEN'],
  ['CRA (Community Reinvestment Act)', '1', 'CRA data built into application workflow', 'GREEN'],
  ['AML / BSA / FinCEN', '2', 'World-Check + Verafin integration + SAR-ready', 'GREEN'],
  ['KYC / Identity Verification', '1', 'TransUnion + third-party IDV + fraud queue', 'GREEN'],
  ['PCI DSS', '5+', 'PCI DSS Level 1 certified', 'GREEN'],
  ['SOC 2 Type II', '3+', 'SOC 2 Type II certified', 'GREEN'],
  ['GLBA / CCPA / CPRA / State Privacy', '2', 'Full GLBA + CCPA compliance, AES-256 + TLS 1.2+', 'GREEN'],
  ['CAN-SPAM / TCPA', '2', 'Functioning unsubscribe, PEWC consent capture', 'GREEN'],
  ['State Regulations (Maine / MDPFR)', '1', 'BSB-specific Maine regulation mapping at onboarding', 'GREEN'],
  ['Third-Party Risk Management', '2', 'Vendor due diligence, PCI/SOC/ISO control framework', 'GREEN'],
  ['Audit Logging & Issue Management', '3', 'Immutable logs, 7+ year retention, formal CMS', 'GREEN'],
  ['Dispute Processing (Reg Z / FCBA)', '1', 'Built-in dispute workflows, e-OSCAR, Reg Z-compliant', 'GREEN'],
];

function confidenceColor(c) {
  if (c.startsWith('GREEN')) return LIGHT_GREEN;
  if (c.startsWith('YELLOW')) return LIGHT_YELLOW;
  return LIGHT_RED;
}

function buildSummaryTable() {
  const COL = [3800, 600, 3800, 1160];
  const rows = [
    new TableRow({ children: [
      hdrCell('Regulatory Framework', COL[0]),
      hdrCell('Qs', COL[1]),
      hdrCell('BRIM Position', COL[2]),
      hdrCell('Confidence', COL[3]),
    ]}),
    ...summaryRows.map((r, i) => new TableRow({
      children: [
        dataCell(r[0], COL[0], i % 2 === 0 ? WHITE : LIGHT_GRAY, '000000', true),
        dataCell(r[1], COL[1], i % 2 === 0 ? WHITE : LIGHT_GRAY, '444444'),
        dataCell(r[2], COL[2], i % 2 === 0 ? WHITE : LIGHT_GRAY),
        dataCell(r[3], COL[3], confidenceColor(r[3]), '1A5C1A', true),
      ]
    }))
  ];
  return new Table({ width: { size: 9360, type: WidthType.DXA }, columnWidths: COL, rows });
}

// ── Gaps Table ────────────────────────────────────────────────────────────────
const gapRows = [
  ['Local US clearing switch', 'BRIM does not have a local US switch (Technology 6 = N)', 'HIGH'],
  ['SilverLake integration (Jack Henry)', 'Not yet live — in scoping for BSB', 'MEDIUM'],
  ['1099 tax form generation', 'BRIM Financial Corp. (Delaware) — operational capability needs confirmation', 'MEDIUM'],
  ['99.999% uptime SLA', 'Contractual SLA is 99.9% — actual trailing 12M is 99.97% (needs sign-off)', 'MEDIUM'],
];

function buildGapsTable() {
  const COL = [2400, 5200, 1760];
  return new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: COL,
    rows: [
      new TableRow({ children: [
        hdrCell('Regulatory Area', COL[0], '7B0000'),
        hdrCell('Gap', COL[1], '7B0000'),
        hdrCell('Risk', COL[2], '7B0000'),
      ]}),
      ...gapRows.map((r, i) => new TableRow({ children: [
        dataCell(r[0], COL[0], i % 2 === 0 ? LIGHT_RED : 'FFE8E8', '7B0000', true),
        dataCell(r[1], COL[1], i % 2 === 0 ? LIGHT_RED : 'FFE8E8'),
        dataCell(r[2], COL[2], i % 2 === 0 ? LIGHT_RED : 'FFE8E8', r[2] === 'HIGH' ? '7B0000' : '7D4200', true),
      ]}))
    ]
  });
}

// ── Docs Table ────────────────────────────────────────────────────────────────
const docRows = [
  ['PCI DSS Attestation of Compliance (AOC)', 'GET', 'Required'],
  ['SOC 2 Type II report (or summary)', 'GET', 'Required'],
  ['Standard SLA with uptime terms', 'GET', 'Required'],
  ['AML Policy (board-approved)', 'GET', 'BSB may request same-day'],
  ['Compliance policies & procedures package', 'GET', 'BSB may request same-day'],
  ['BCDR summary with last DR test date', 'GET', 'Required'],
  ['Data ownership contract language', 'GET — Legal review', 'Required'],
];

function buildDocsTable() {
  const COL = [4800, 2000, 2560];
  return new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: COL,
    rows: [
      new TableRow({ children: [
        hdrCell('Document', COL[0], TEAL),
        hdrCell('Status', COL[1], TEAL),
        hdrCell('Priority', COL[2], TEAL),
      ]}),
      ...docRows.map((r, i) => new TableRow({ children: [
        dataCell(r[0], COL[0], i % 2 === 0 ? WHITE : LIGHT_GRAY, '000000', true),
        dataCell(r[1], COL[1], LIGHT_YELLOW, '7D4200', true),
        dataCell(r[2], COL[2], i % 2 === 0 ? WHITE : LIGHT_GRAY),
      ]}))
    ]
  });
}

// ── Section content ───────────────────────────────────────────────────────────
function buildContent() {
  const c = [];

  // ── TITLE ─────────────────────────────────────────────────────────────────
  c.push(new Paragraph({
    children: [t('BSB RFP — Compliance & Regulatory Questions', { size: 36, bold: true, color: WHITE })],
    alignment: AlignmentType.CENTER,
    spacing: { before: 120, after: 60 },
    shading: { fill: NAVY, type: ShadingType.CLEAR },
    indent: { left: 120, right: 120 }
  }));
  c.push(new Paragraph({
    children: [t('How BRIM Answers Them + Approach to Supporting BSB', { size: 24, bold: false, color: WHITE })],
    alignment: AlignmentType.CENTER,
    spacing: { before: 0, after: 60 },
    shading: { fill: NAVY, type: ShadingType.CLEAR },
    indent: { left: 120, right: 120 }
  }));
  c.push(new Paragraph({
    children: [
      t('Prepared for: Tarique Khan, BRIM Financial   |   ', { size: 18, color: '555555' }),
      t('Date: April 6, 2026', { size: 18, color: '555555', bold: true }),
      t('   |   Submission Deadline: April 10, 2026', { size: 18, color: RED_C, bold: true }),
    ],
    alignment: AlignmentType.CENTER,
    spacing: { before: 120, after: 120 },
  }));

  // ── SUMMARY TABLE ─────────────────────────────────────────────────────────
  c.push(h1('REGULATORY FRAMEWORKS COVERED — SUMMARY'));
  c.push(spacer(80));
  c.push(p([t('17 regulatory frameworks addressed across 29 Compliance & Reporting questions and regulatory-adjacent questions across all 12 categories. All GREEN unless noted.', { size: 19, italic: true, color: '444444' })], { before: 0, after: 80 }));
  c.push(buildSummaryTable());
  c.push(p([t('* Reg B score = 6 (lowest in compliance category). See Section 5 for detail.', { size: 17, italic: true, color: '888888' })], { before: 80, after: 120 }));

  // ── SECTION 1: CFPB ───────────────────────────────────────────────────────
  c.push(new Paragraph({ children: [new PageBreak()] }));
  c.push(h1('SECTION 1: CFPB REQUIREMENTS'));

  c.push(h2('1.1 — CFPB TCCP Semiannual Surveys'));
  c.push(bsbLabel('How do you support CFPB Terms of Credit Card Plan (TCCP) semiannual survey reporting? How do you support issuance of cards to consumers and businesses covered under CFPB rules?'));
  c.push(brimLabel());
  c.push(bullet('Reporting engine captures all TCCP-required data fields: APR tiers, fee structures, credit limits, promotional terms — segmented by product and issuing entity'));
  c.push(bullet('For BSB\'s agent bank model: TCCP reporting segments by issuing institution — each client FI\'s metrics are isolated for accurate filing'));
  c.push(bullet('CONTINENTAL BANK (BRIM\'s live US sponsor bank / ZOLVE program) operates under comparable CFPB obligations today'));
  c.push(approachLabel());
  c.push(p([t('BRIM pre-populates the TCCP survey data fields and makes them accessible in the Issuer Portal on the reporting schedule. BSB does not need to compile these fields manually — the platform maintains the data continuously and exports in survey-ready format.')], { before: 40, after: 40 }));
  c.push(noteBox('[CONFIRM] Pricing — commercial team to confirm: Is CFPB TCCP reporting included in base or billable as an add-on?'));

  c.push(h2('1.2 — CFPB Ongoing Monitoring'));
  c.push(bsbLabel('How do you monitor and remain compliant with CFPB requirements?'));
  c.push(brimLabel());
  c.push(bullet('Chief Regulatory Affairs Officer: Abraham Tachjian — reports directly to the CEO'));
  c.push(bullet('Tracks CFPB rulemaking, enforcement actions, supervisory highlights, and guidance updates'));
  c.push(bullet('Platform controls enforce CFPB requirements at the system level: Reg Z disclosures, adverse action notices, ability-to-pay guardrails, fee calculation rules'));
  c.push(bullet('When new rules are issued: compliance team assesses platform impact and implements changes within required timelines'));
  c.push(approachLabel());
  c.push(p([t('BRIM monitors CFPB changes proactively. BSB does not need a dedicated CFPB tracker. When new rules affect the platform, BRIM communicates changes to BSB with a clear effective date and any configuration changes needed. BSB is never left discovering a CFPB change on its own.')], { before: 40, after: 40 }));

  // ── SECTION 2: OFAC ───────────────────────────────────────────────────────
  c.push(h1('SECTION 2: OFAC / SANCTIONS SCREENING'));

  c.push(h2('2.1 — OFAC Screening at Application'));
  c.push(bsbLabel('Do you have the ability to run through the bank\'s established OFAC process?'));
  c.push(brimLabel());
  c.push(bullet('Provider: World-Check One (LSEG Refinitiv) — covers OFAC SDN, UN, OFSI, EU, G7, and global sanctions lists'));
  c.push(bullet('Screening runs at: application submission, daily batch re-screening of full portfolio, and on any name/address change event'));
  c.push(bullet('Authorization controls block transactions from sanctioned entities regardless of screening status'));
  c.push(bullet('Every OFAC match is logged with score, reviewer notes, and final disposition — full immutable audit trail'));
  c.push(approachLabel());
  c.push(p([t('BSB routes potential OFAC matches to its own BSA/AML team for final disposition through a dedicated compliance queue in the Issuer Portal. The system enforces the hold — no card is issued until the match is resolved and documented. BSB does not need to build a separate OFAC workflow.')], { before: 40, after: 40 }));

  c.push(h2('2.2 — Real-Time Compliance Report Pull (OFAC + MLA)'));
  c.push(bsbLabel('Describe the ability to pull real-time compliance reports such as queue reporting, fraud alerts, OFAC, and MLA.'));
  c.push(brimLabel());
  c.push(bullet('BSB pulls real-time reports from the Issuer Portal: OFAC hits, MLA/SCRA status, fraud alert queues, regulatory flag triggers — all filterable by date range, status, and disposition'));
  c.push(bullet('OFAC queue shows match score, reviewer notes, final disposition; MLA queue shows triggered accounts, rate adjustments applied, benefit period end date'));
  c.push(bullet('All queue items SLA-tracked with escalation alerts if items age past BSB\'s defined threshold'));

  // ── SECTION 3: MLA / SCRA ─────────────────────────────────────────────────
  c.push(h1('SECTION 3: MLA / SCRA — MILITARY LENDING ACT + SCRA'));

  c.push(h2('3.1 — Military Status Verification'));
  c.push(bsbLabel('Are you able to identify if the customer is in the military and what their current status is to allow for the appropriate regulatory action?'));
  c.push(brimLabel());
  c.push(bullet('Verification source: DoD DMDC (Defense Manpower Data Center) MLA database — checked at application'));
  c.push(bullet('Post-booking: periodic re-verification continues throughout the account lifecycle'));
  c.push(bullet('Status changes (active duty entry, discharge, reserve activation) trigger automatic re-evaluation'));
  c.push(approachLabel());
  c.push(p([t('Fully automated. BSB does not run a manual military status check — BRIM\'s system queries DMDC at application and on a recurring basis. BSB\'s compliance team sees MLA status in the account record and in real-time compliance reports.')], { before: 40, after: 40 }));

  c.push(h2('3.2 — SCRA Rate Adjustments'));
  c.push(bsbLabel('Describe how you support rate adjustments for SCRA.'));
  c.push(brimLabel());
  c.push(p([t('Automatic actions when SCRA eligibility is confirmed:', { bold: true, color: NAVY })], { before: 60, after: 20 }));
  c.push(bullet('APR capped at 6% (or existing rate if already below 6%)', 1));
  c.push(bullet('Late fees, annual fees, over-limit fees waived', 1));
  c.push(bullet('Minimum payment recalculated', 1));
  c.push(bullet('Retroactive to the date of active-duty entry', 1));
  c.push(bullet('Interest accrued above 6% during any processing lag is credited back'));
  c.push(bullet('System tracks benefit period and restores original terms when eligibility ends'));
  c.push(bullet('BSB can configure benefits beyond the statutory minimum if desired'));

  // ── SECTION 4: Reg O ──────────────────────────────────────────────────────
  c.push(h1('SECTION 4: REGULATION O — INSIDER LENDING'));

  c.push(h2('4.1 — Reg O Identification & Flagging'));
  c.push(bsbLabel('Does your solution provide the ability to identify employee/director/officer applications and flag them?'));
  c.push(brimLabel());
  c.push(bullet('Reg O check runs at point of application against BSB\'s insider list (employees, directors, officers, and their related interests)'));
  c.push(bullet('Matches are flagged and routed to the Reg O secondary review queue — no card ships until cleared'));
  c.push(bullet('The Reg O flag persists on the account for its full lifecycle — not just at origination'));
  c.push(bullet('BSB maintains the insider list via the Issuer Portal; changes take effect immediately for new applications'));
  c.push(approachLabel());
  c.push(p([t('BSB uploads and maintains its own insider list. BRIM enforces the check system-wide. If Reg O is triggered, the application goes into a configurable compliance queue that BSB routes to its compliance team — with a full audit trail of who reviewed it, when, and the disposition.')], { before: 40, after: 40 }));

  // ── SECTION 5: Reg B ──────────────────────────────────────────────────────
  c.push(h1('SECTION 5: REGULATION B — EQUAL CREDIT OPPORTUNITY ACT'));

  c.push(h2('5.1 — Joint Intent for Co-Applicants'));
  c.push(bsbLabel('Describe your ability to capture joint intent for co-applicants/co-borrowers in all applications: online, in-person, telephony, etc.'));
  c.push(brimLabel());
  c.push(bullet('Joint intent captured across all channels: online self-service, in-branch (Issuer Portal), telephony (agent-assisted)'));
  c.push(bullet('The application explicitly presents the joint intent question before collecting co-applicant data, per Reg B'));
  c.push(bullet('Joint intent locked at submission — cannot be modified without a new application'));
  c.push(bullet('Adverse action notices sent to both applicants with proper Reg B language'));
  c.push(noteBox('ATTENTION: Committee score = 6 (lowest in Compliance & Reporting category). The capability is there but the response is less detailed. If BSB asks: confirm (a) exact wording of joint intent disclosure, (b) whether telephony workflow captures verbal consent flag or written form.', LIGHT_YELLOW, '7D4200'));

  // ── SECTION 6: Metro 2 ────────────────────────────────────────────────────
  c.push(h1('SECTION 6: METRO 2 / CREDIT BUREAU REPORTING'));

  c.push(h2('6.1 — Regulatory Reporting (Metro 2, CRA, e-OSCAR)'));
  c.push(bsbLabel('Describe your ability to support BSB and its client banks in maintaining compliance with regulatory reporting requirements including Metro 2 files, CRA reporting, etc.'));
  c.push(brimLabel());
  c.push(bullet('Metro 2 files generated monthly to Equifax, Experian, and TransUnion — all required fields: account status, payment history, credit limit, balance, past-due amounts'));
  c.push(bullet('Agent bank model: files generated per issuing institution — each client FI\'s tradelines report under its own subscriber code, not BRIM\'s'));
  c.push(bullet('CRA data: built into the application workflow — geographic distribution of credit by census tract captured automatically'));
  c.push(bullet('e-OSCAR disputes: processed within 30 days per FCRA; full audit trail'));
  c.push(approachLabel());
  c.push(p([t('Automated Metro 2 generation means BSB does not manually compile credit bureau files. For BSB\'s client FIs, each institution gets its own correctly-coded tradelines. CRA data is captured at origination so BSB can run CRA exam-ready reports at any time without a custom extract.')], { before: 40, after: 40 }));

  c.push(h2('6.2 — Tradeline Reporting Detail'));
  c.push(bsbLabel('Describe how credit card trades are reported to credit bureaus.'));
  c.push(brimLabel());
  c.push(bullet('Monthly Metro 2 to all 3 bureaus: account open date, credit limit, current balance, 24-month payment history, special comment codes (bankruptcy, SCRA, deceased, etc.)'));
  c.push(bullet('Automated QA checks validate file accuracy before submission'));
  c.push(bullet('e-OSCAR portal handles disputes within 30 days per FCRA'));

  // ── SECTION 7: AML / BSA ──────────────────────────────────────────────────
  c.push(h1('SECTION 7: AML / BSA / FINCEN'));

  c.push(h2('7.1 — AML Monitoring + Suspicious Activity'));
  c.push(bsbLabel('Describe how you monitor for and report unusual or suspicious activity on individual accounts or across portfolios.'));
  c.push(brimLabel());
  c.push(bullet('Processor-level fraud monitoring and threshold-based alerting for unusual transaction patterns'));
  c.push(bullet('Board-approved AML policy, reviewed annually'));
  c.push(bullet('Whistleblower policy providing a confidential reporting channel for compliance issues'));
  c.push(bullet('Compliance metrics reported to management monthly, to board quarterly'));
  c.push(approachLabel());
  c.push(p([t('BRIM supports BSB\'s SAR filing process — flagged accounts are surfaced in the compliance queue with transaction detail, pattern notes, and review log. BSB\'s BSA officer makes the final SAR determination using BRIM\'s case data.')], { before: 40, after: 40 }));

  c.push(h2('7.2 — Verafin Integration (AML)'));
  c.push(bsbLabel('Describe your ability to integrate with Verafin to support fraud detection in applications and existing accounts.'));
  c.push(brimLabel());
  c.push(bullet('Verafin integration available — BRIM\'s platform passes account and transaction data to Verafin for AML monitoring, fraud analytics, and SAR workflow'));
  c.push(bullet('Integration method: API-based real-time feed or scheduled batch, depending on BSB\'s Verafin configuration'));
  c.push(noteBox('[CONFIRM] Pricing for Verafin integration — setup fee, pass-through, or included in base? (Assign to Commercial Team)'));

  // ── SECTION 8: KYC ────────────────────────────────────────────────────────
  c.push(h1('SECTION 8: KYC / IDENTITY VERIFICATION'));

  c.push(h2('8.1 — KYC Controls at Application'));
  c.push(bsbLabel('Describe your capabilities for KYC document review and how your system supports fraud, KYC, and identity-verification controls during consumer and business applications.'));
  c.push(brimLabel());
  c.push(bullet('TransUnion used for identity verification at application — real-time IDV check'));
  c.push(bullet('Document-based KYC: platform receives uploaded IDs, passports, or business documents and routes to a review queue'));
  c.push(bullet('Business applications: UBO (Ultimate Beneficial Ownership) identification built into business app workflow, consistent with FinCEN CDD rule'));
  c.push(bullet('KYC flags route to secondary review queue — no card issued until cleared'));
  c.push(approachLabel());
  c.push(p([t('BSB defines its own KYC threshold rules. BRIM enforces them at application and routes exceptions to the appropriate queue. Clean applications require no manual review step — only triggered ones go to human review.')], { before: 40, after: 40 }));

  // ── SECTION 9: PCI / SOC 2 ───────────────────────────────────────────────
  c.push(new Paragraph({ children: [new PageBreak()] }));
  c.push(h1('SECTION 9: PCI DSS + SECURITY CERTIFICATIONS'));

  c.push(h2('9.1 — PCI DSS Compliance'));
  c.push(bsbLabel('(Across multiple questions) Describe encryption, PIN key management, network/system access controls.'));
  c.push(brimLabel());
  c.push(bullet('PCI DSS Level 1 certified — highest level of card data security certification'));
  c.push(bullet('Encryption: AES-256 at rest, TLS 1.2+ in transit — all cardholder data'));
  c.push(bullet('PIN key management follows HSM (Hardware Security Module) standards'));
  c.push(bullet('Tokenization: vaultless tokenization for digital wallet provisioning'));
  c.push(bullet('Access controls: role-based with least-privilege enforcement, IP restrictions configurable'));
  c.push(bullet('Annual PCI DSS audit — AOC (Attestation of Compliance) available to BSB'));
  c.push(noteBox('[GET] Attach PCI DSS AOC in appendix package for BSB submission.'));
  c.push(approachLabel());
  c.push(p([t('BSB inherits BRIM\'s PCI DSS Level 1 certification for the card processing functions BRIM performs. BSB\'s own PCI scope is reduced — BRIM handles the most sensitive card data environments. The same PCI coverage applies to BSB\'s client FIs.')], { before: 40, after: 40 }));

  c.push(h2('9.2 — SOC 2 Type II'));
  c.push(bsbLabel('(Across multiple questions) Describe your information security program.'));
  c.push(brimLabel());
  c.push(bullet('SOC 2 Type II certified — audited against trust service criteria: security, availability, processing integrity, confidentiality, privacy'));
  c.push(bullet('ISO 27001 alignment referenced in privacy/security responses'));
  c.push(noteBox('[GET] Attach SOC 2 Type II report or summary in appendix package (provide under NDA).'));

  // ── SECTION 10: Privacy ───────────────────────────────────────────────────
  c.push(h1('SECTION 10: GLBA / CCPA / STATE PRIVACY LAWS'));

  c.push(h2('10.1 — Privacy Law Compliance'));
  c.push(bsbLabel('Describe your ability to research and ensure compliance with state and Federal regulations for Privacy laws that protect consumer data.'));
  c.push(brimLabel());
  c.push(bullet('GLBA compliant: Privacy notices generated at account opening and annually; opt-out mechanisms in place'));
  c.push(bullet('CCPA/CPRA compliant: Consumer access, deletion, and opt-out-of-sale requests handled within the 45-day window'));
  c.push(bullet('Data protection: AES-256 at rest, TLS 1.2+ in transit; role-based access controls; data masking limits PII exposure'));
  c.push(bullet('Certifications: SOC 2 Type II, ISO 27001 alignment, PCI DSS — all support privacy obligations'));
  c.push(approachLabel());
  c.push(p([t('BSB\'s cardholder data is logically partitioned from other BRIM clients. BRIM generates GLBA-required privacy notices as part of the account lifecycle — BSB does not need to separately generate and deliver these. CCPA rights requests are handled through a controlled workflow accessible to BSB admins.')], { before: 40, after: 40 }));

  c.push(h2('10.2 — Information Sharing / Third-Party Disclosure'));
  c.push(bsbLabel('Describe your consumer information sharing practices with other third parties or affiliates. How do you control this?'));
  c.push(brimLabel());
  c.push(bullet('Consumer data is not sold or shared with third parties for marketing purposes'));
  c.push(bullet('Sharing limited to: credit bureaus (tradeline reporting), fraud/AML vendors (World-Check, TransUnion), and card networks (Mastercard/Visa) as required for transaction processing'));
  c.push(bullet('BSB retains ownership of all cardholder data — data ownership stated in BSB-favorable terms in the contract'));

  // ── SECTION 11: CAN-SPAM / TCPA ──────────────────────────────────────────
  c.push(h1('SECTION 11: CAN-SPAM / TCPA'));

  c.push(h2('11.1 — CAN-SPAM & TCPA Compliance'));
  c.push(bsbLabel('Describe your processes to comply with CAN-SPAM and TCPA.'));
  c.push(brimLabel());
  c.push(p([t('CAN-SPAM:', { bold: true, color: NAVY })], { before: 60, after: 20 }));
  c.push(bullet('Every marketing email includes working unsubscribe link, physical mailing address, accurate headers', 1));
  c.push(bullet('Opt-outs honored within 10 business days. No purchased email lists.', 1));
  c.push(p([t('TCPA:', { bold: true, color: NAVY })], { before: 60, after: 20 }));
  c.push(bullet('Platform maintains Do Not Call lists', 1));
  c.push(bullet('Prior Express Written Consent (PEWC) captured — with date, time, channel, and specific consent language — before any autodialed or pre-recorded outreach', 1));
  c.push(bullet('BSB controls the consent language; BRIM enforces it system-wide'));

  c.push(h2('11.2 — Consumer Marketing Opt-Outs'));
  c.push(bsbLabel('Can you describe how you handle consumer opt-outs of marketing and solicitation communications?'));
  c.push(brimLabel());
  c.push(bullet('Opt-out preferences captured at the channel level — cardholder can opt out of email while remaining opted in to mail'));
  c.push(bullet('Digital channel opt-outs take effect immediately; direct mail opt-outs honored within 10 business days per CAN-SPAM'));
  c.push(bullet('Platform enforces opt-out status system-wide — no marketing goes out to an opted-out cardholder regardless of which BSB team initiates the campaign'));

  // ── SECTION 12: State Regs ────────────────────────────────────────────────
  c.push(h1('SECTION 12: STATE REGULATIONS — MAINE + CLIENT FI STATES'));

  c.push(h2('12.1 — State-Chartered Institution Compliance'));
  c.push(bsbLabel('Describe your ability to research and ensure compliance with state regulations for credit cards offered to state-chartered institutions.'));
  c.push(brimLabel());
  c.push(bullet('BRIM\'s compliance team researches state-specific credit card regulations as part of each client onboarding'));
  c.push(bullet('For BSB (Maine state-chartered bank): BRIM maps Maine banking regulations and MDPFR (Maine Department of Professional and Financial Regulation) requirements to platform configuration'));
  c.push(bullet('For BSB\'s client FIs in other states: BRIM reviews each state\'s rate caps, fee limits, and disclosure requirements; configures product parameters accordingly'));
  c.push(bullet('State regulation changes trigger compliance team review and platform update'));

  // ── SECTION 13: Third-Party Risk ──────────────────────────────────────────
  c.push(h1('SECTION 13: THIRD-PARTY RISK MANAGEMENT'));

  c.push(h2('13.1 — Agent Bank / Client FI Due Diligence'));
  c.push(bsbLabel('Describe your ability to support BSB\'s regulatory and due diligence needs for managing third-party vendor relationships and client FI onboarding.'));
  c.push(brimLabel());
  c.push(bullet('BRIM maintains a vendor due diligence package (PCI, SOC 2, ISO control framework) for BSB to use in its own third-party risk management program'));
  c.push(bullet('For client FI onboarding: BRIM provides partner due diligence templates, regulatory compliance checklists, and contracting document templates'));
  c.push(bullet('BRIM\'s control framework documentation maps to OCC third-party risk guidance (OCC 2013-29) and FFIEC guidance'));
  c.push(approachLabel());
  c.push(p([t('BSB\'s regulators will review BSB\'s third-party risk management of BRIM. BRIM proactively provides the documentation BSB needs: PCI AOC, SOC 2 report, control framework summary, and incident response plan. BSB does not need to assemble this from scratch.')], { before: 40, after: 40 }));

  c.push(h2('13.2 — Control Framework Summary'));
  c.push(bsbLabel('Summarize the processor\'s control framework and how it translates to BSB\'s risk posture.'));
  c.push(brimLabel());
  c.push(bullet('Certifications: PCI DSS Level 1, SOC 2 Type II'));
  c.push(bullet('Network rule compliance: Mastercard and Visa compliance programs'));
  c.push(bullet('Change management: all changes follow a formal SDLC with testing, UAT, and production promotion gates'));
  c.push(bullet('Incident response: critical incidents trigger BSB notification within 1 hour'));
  c.push(bullet('Automated compliance checks run against partner programs before any change goes live'));

  // ── SECTION 14: Audit Logging ─────────────────────────────────────────────
  c.push(h1('SECTION 14: AUDIT LOGGING & ISSUE MANAGEMENT'));

  c.push(h2('14.1 — Audit Logs'));
  c.push(bsbLabel('Describe how you provide audit logging for all risk rule changes and communication changes. Can you provide a card control audit trail?'));
  c.push(brimLabel());
  c.push(bullet('Every change logged with: user ID, name, role, timestamp, field changed, previous value, new value'));
  c.push(bullet('Logs are immutable — cannot be edited or deleted by any user, including BRIM admins'));
  c.push(bullet('Retained 7+ years'));
  c.push(bullet('BSB can search and export by date range, employee, change type, or affected account'));
  c.push(bullet('Card-level audit trail tracks individual control changes (credit limit, block/unblock, rate change) — searchable by card number, account, or employee'));

  c.push(h2('14.2 — Issue Management & Remediation'));
  c.push(bsbLabel('Describe your issue management and remediation process.'));
  c.push(brimLabel());
  c.push(bullet('Centralized issue tracking system with severity classification: critical, high, medium, low'));
  c.push(bullet('Lifecycle: identification → assessment → remediation → implementation → validation → closure'));
  c.push(bullet('Critical issues: BSB notified within 1 hour; dedicated incident team activated'));
  c.push(bullet('BSB has visibility into issue status through the Issuer Portal'));

  c.push(h2('14.3 — Compliance Policies & Procedures'));
  c.push(bsbLabel('Is there a set of policies and procedures that address logging, tracking, and reporting compliance issues to management?'));
  c.push(brimLabel());
  c.push(bullet('Yes. Board-approved AML policy reviewed annually'));
  c.push(bullet('Whistleblower policy with confidential reporting channel'));
  c.push(bullet('Compliance metrics (open issues, aging, remediation timelines) reported to management monthly, to board quarterly'));
  c.push(noteBox('[GET] Compliance policies & procedures package for appendix. Note: BSB may ask for this same-day — have it ready.'));

  // ── SECTION 15: Reg Z ─────────────────────────────────────────────────────
  c.push(h1('SECTION 15: DISPUTE PROCESSING (REG Z / FCBA)'));

  c.push(h2('15.1 — Dispute Processing Capability'));
  c.push(bsbLabel('Detail your dispute processing capabilities. Will BSB have the ability to initiate disputes aligned to Reg Z requirements?'));
  c.push(brimLabel());
  c.push(bullet('Built-in dispute workflow: Reg Z/FCBA-compliant — 30-day acknowledgement, 90-day resolution timeline'));
  c.push(bullet('BSB initiates disputes through the Issuer Portal; dispute status tracked in real time'));
  c.push(bullet('e-OSCAR integration for bureau dispute processing'));
  c.push(bullet('Provisional credit can be issued system-side during dispute investigation'));
  c.push(bullet('Chargeback management: BRIM manages representment, retrieval requests, and pre-arbitration workflows through the card networks'));

  // ── SECTION 16: Queue Framework ───────────────────────────────────────────
  c.push(h1('SECTION 16: SECONDARY REVIEW QUEUES — ALL COMPLIANCE FLAGS'));

  c.push(h2('16.1 — Unified Compliance Queue Framework'));
  c.push(bsbLabel('Describe the ability to provide a secondary review queue outside of underwriting for fraud alert review, OFAC review, Reg O, business review, and LOS overview.'));
  c.push(brimLabel());
  c.push(p([t('A single configurable compliance queue framework handles all of:', { color: NAVY })], { before: 60, after: 40 }));
  c.push(bullet('OFAC hits'));
  c.push(bullet('MLA / SCRA flags'));
  c.push(bullet('Reg O insider flags'));
  c.push(bullet('Business entity / UBO review'));
  c.push(bullet('Fraud alert queue'));
  c.push(bullet('KYC document review'));
  c.push(spacer(40));
  c.push(p([t('BSB defines routing rules per flag type (e.g., Reg O goes to BSB compliance team; OFAC goes to BSA officer). Each queue tracks SLAs and escalates items aging past BSB\'s configured thresholds. No card is issued until all queue conditions are cleared — this is system-enforced, not process-enforced.')], { before: 40, after: 40 }));

  // ── SECTION 17: Dashboards ────────────────────────────────────────────────
  c.push(h1('SECTION 17: ROLE-BASED COMPLIANCE DASHBOARDS'));

  c.push(h2('17.1 — Compliance-Relevant Dashboard Views'));
  c.push(bsbLabel('Describe how you provide customizable dashboards per user and per role with previews including fraud queue, approvals, and compliance-relevant views.'));
  c.push(brimLabel());
  c.push(p([t('Issuer Portal delivers role-based dashboards:', { bold: true, color: NAVY })], { before: 60, after: 20 }));
  c.push(bullet('Compliance officer: OFAC flags, MLA alerts, Reg O queue, open issue count', 1));
  c.push(bullet('Collections manager: Delinquency queues, charge-off pipeline, FDCPA-relevant contact log', 1));
  c.push(bullet('BSA officer: AML alerts, Verafin feed status, SAR-ready case export', 1));
  c.push(bullet('Executive: Portfolio P&L, compliance metric summary, open issue aging', 1));
  c.push(bullet('All configurable — BSB admins define default layouts per role'));

  // ── GAPS ──────────────────────────────────────────────────────────────────
  c.push(new Paragraph({ children: [new PageBreak()] }));
  c.push(h1('WHAT BRIM CANNOT DO — HONEST GAPS'));
  c.push(spacer(80));
  c.push(p([t('These are known gaps. Have verbal responses prepared for BSB Q&A.', { size: 19, italic: true, color: '7B0000' })], { before: 0, after: 80 }));
  c.push(buildGapsTable());

  // ── DOCUMENTS ─────────────────────────────────────────────────────────────
  c.push(spacer(160));
  c.push(h1('COMPLIANCE DOCUMENTS TO HAVE READY'));
  c.push(spacer(80));
  c.push(p([t('These must be collected and ready before April 10. BSB will likely request most of them.', { size: 19, italic: true, color: '444444' })], { before: 0, after: 80 }));
  c.push(buildDocsTable());

  // ── FOOTER NOTE ───────────────────────────────────────────────────────────
  c.push(spacer(120));
  c.push(new Paragraph({
    children: [t('Source: rfp_data.json — 29 Compliance & Reporting questions + regulatory-adjacent questions across all 12 categories. Internal use only. For BSB submission use BSB_RFP_Submission_BRIM_FINAL.docx.', { size: 16, italic: true, color: '888888' })],
    alignment: AlignmentType.CENTER,
    spacing: { before: 80, after: 80 },
    border: { top: { style: BorderStyle.SINGLE, size: 2, color: 'CCCCCC' } }
  }));

  return c;
}

// ── Document ──────────────────────────────────────────────────────────────────
async function main() {
  const doc = new Document({
    numbering: {
      config: [
        {
          reference: 'bullets',
          levels: [
            { level: 0, format: LevelFormat.BULLET, text: '\u2022', alignment: AlignmentType.LEFT,
              style: { paragraph: { indent: { left: 480, hanging: 240 } } } },
            { level: 1, format: LevelFormat.BULLET, text: '\u2013', alignment: AlignmentType.LEFT,
              style: { paragraph: { indent: { left: 960, hanging: 240 } } } },
          ]
        }
      ]
    },
    styles: {
      default: {
        document: { run: { font: 'Arial', size: 20, color: '000000' } }
      },
      paragraphStyles: [
        { id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true,
          run: { size: 28, bold: true, font: 'Arial', color: WHITE },
          paragraph: { spacing: { before: 240, after: 120 }, outlineLevel: 0 } },
        { id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true,
          run: { size: 24, bold: true, font: 'Arial', color: NAVY },
          paragraph: { spacing: { before: 200, after: 80 }, outlineLevel: 1 } },
        { id: 'Heading3', name: 'Heading 3', basedOn: 'Normal', next: 'Normal', quickFormat: true,
          run: { size: 22, bold: true, font: 'Arial', color: TEAL },
          paragraph: { spacing: { before: 160, after: 60 }, outlineLevel: 2 } },
      ]
    },
    sections: [{
      properties: {
        page: {
          size: { width: 12240, height: 15840 },
          margin: { top: 1080, right: 1080, bottom: 1080, left: 1080 }
        }
      },
      headers: {
        default: new Header({
          children: [new Paragraph({
            children: [
              t('BSB RFP — Compliance & Regulatory Questions  |  BRIM Financial  |  CONFIDENTIAL — INTERNAL USE ONLY', { size: 16, color: '888888', italic: true })
            ],
            alignment: AlignmentType.CENTER,
            border: { bottom: { style: BorderStyle.SINGLE, size: 2, color: 'CCCCCC' } },
            spacing: { after: 60 }
          })]
        })
      },
      footers: {
        default: new Footer({
          children: [new Paragraph({
            children: [
              t('April 6, 2026  |  Submission Deadline: April 10, 2026  |  Page ', { size: 16, color: '888888' }),
              new TextRun({ children: [PageNumber.CURRENT], font: 'Arial', size: 16, color: '888888' }),
              t(' of ', { size: 16, color: '888888' }),
              new TextRun({ children: [PageNumber.TOTAL_PAGES], font: 'Arial', size: 16, color: '888888' }),
            ],
            alignment: AlignmentType.CENTER,
            border: { top: { style: BorderStyle.SINGLE, size: 2, color: 'CCCCCC' } },
            spacing: { before: 60 }
          })]
        })
      },
      children: buildContent()
    }]
  });

  const buffer = await Packer.toBuffer(doc);
  fs.writeFileSync(OUTPUT, buffer);
  console.log('Written:', OUTPUT);
}

main().catch(err => { console.error(err); process.exit(1); });
