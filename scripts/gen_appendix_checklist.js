'use strict';
/**
 * Generates the BSB RFP Appendix & Supporting Documents Checklist.
 * Run: node scripts/gen_appendix_checklist.js
 */
const { writeFileSync } = require('fs');
const path = require('path');
const os = require('os');
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  WidthType, AlignmentType, ShadingType, BorderStyle, Header,
} = require('docx');

const DATE = new Date().toISOString().slice(0, 10);

const C = {
  navy: '1E3A5F', navyBg: 'EBF2FA',
  green: '047857', greenBg: 'ECFDF5',
  yellow: 'B45309', yellowBg: 'FFFBEB',
  red: 'B91C1C', redBg: 'FEF2F2',
  orange: 'C2410C', orangeBg: 'FFF7ED',
  purple: '6D28D9', purpleBg: 'F5F3FF',
  gray: '6B7280', grayBg: 'F3F4F6',
  grayLight: 'E5E7EB', dark: '111827', medium: '374151',
  white: 'FFFFFF',
};

// ── Helpers ───────────────────────────────────────────────────────────────────
const sp = (b = 0, a = 0) => new Paragraph({ spacing: { before: b, after: a } });

function h1(text, color = C.navy) {
  return new Paragraph({
    spacing: { before: 320, after: 100 },
    children: [new TextRun({ text, bold: true, size: 30, font: 'Calibri', color })],
  });
}

function h2(text, color = C.navy) {
  return new Paragraph({
    spacing: { before: 200, after: 80 },
    children: [new TextRun({ text, bold: true, size: 24, font: 'Calibri', color })],
  });
}

function body(text, opts = {}) {
  return new Paragraph({
    spacing: { before: 0, after: 100 },
    children: [new TextRun({ text, size: 22, font: 'Calibri', color: C.dark, ...opts })],
  });
}

function divider() {
  return new Paragraph({
    spacing: { before: 160, after: 160 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: C.grayLight } },
    children: [],
  });
}

function banner(text, bg, fg = C.white) {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [new TableRow({
      children: [new TableCell({
        shading: { fill: bg, type: ShadingType.CLEAR },
        borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
        margins: { top: 100, bottom: 100, left: 200, right: 200 },
        children: [new Paragraph({
          spacing: { before: 0, after: 0 },
          children: [new TextRun({ text, bold: true, size: 24, font: 'Calibri', color: fg })],
        })],
      })],
    })],
  });
}

// Status pill inline
function statusRun(status) {
  const map = {
    'HAVE': { text: ' ● HAVE ', color: C.green },
    'GET': { text: ' ● GET ', color: C.yellow },
    'FLAG': { text: ' ● FLAG ', color: C.red },
    'IDEA': { text: ' ● IDEA ', color: C.purple },
    'NDA': { text: ' ● NDA ONLY ', color: C.orange },
  };
  const m = map[status] || { text: ` ${status} `, color: C.gray };
  return new TextRun({ text: m.text, bold: true, size: 18, font: 'Calibri', color: m.color });
}

function docRow(status, name, description, owner = '', referenced = '') {
  const statusColors = {
    'HAVE': C.greenBg, 'GET': C.yellowBg, 'FLAG': C.redBg, 'IDEA': C.purpleBg, 'NDA': C.orangeBg,
  };
  const statusTextColors = {
    'HAVE': C.green, 'GET': C.yellow, 'FLAG': C.red, 'IDEA': C.purple, 'NDA': C.orange,
  };
  return new TableRow({
    children: [
      new TableCell({
        width: { size: 12, type: WidthType.PERCENTAGE },
        shading: { fill: statusColors[status] || C.grayBg, type: ShadingType.CLEAR },
        borders: { top: { style: BorderStyle.SINGLE, size: 4, color: C.grayLight }, bottom: { style: BorderStyle.SINGLE, size: 4, color: C.grayLight }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.SINGLE, size: 4, color: C.grayLight } },
        margins: { top: 60, bottom: 60, left: 100, right: 100 },
        children: [new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 0, after: 0 }, children: [new TextRun({ text: status, bold: true, size: 18, font: 'Calibri', color: statusTextColors[status] || C.gray })] })],
      }),
      new TableCell({
        width: { size: 28, type: WidthType.PERCENTAGE },
        shading: { fill: C.white, type: ShadingType.CLEAR },
        borders: { top: { style: BorderStyle.SINGLE, size: 4, color: C.grayLight }, bottom: { style: BorderStyle.SINGLE, size: 4, color: C.grayLight }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.SINGLE, size: 4, color: C.grayLight } },
        margins: { top: 60, bottom: 60, left: 120, right: 120 },
        children: [new Paragraph({ spacing: { before: 0, after: 0 }, children: [new TextRun({ text: name, bold: true, size: 20, font: 'Calibri', color: C.dark })] })],
      }),
      new TableCell({
        width: { size: 40, type: WidthType.PERCENTAGE },
        shading: { fill: C.white, type: ShadingType.CLEAR },
        borders: { top: { style: BorderStyle.SINGLE, size: 4, color: C.grayLight }, bottom: { style: BorderStyle.SINGLE, size: 4, color: C.grayLight }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.SINGLE, size: 4, color: C.grayLight } },
        margins: { top: 60, bottom: 60, left: 120, right: 120 },
        children: [new Paragraph({ spacing: { before: 0, after: 0 }, children: [new TextRun({ text: description, size: 19, font: 'Calibri', color: C.medium })] })],
      }),
      new TableCell({
        width: { size: 12, type: WidthType.PERCENTAGE },
        shading: { fill: C.grayBg, type: ShadingType.CLEAR },
        borders: { top: { style: BorderStyle.SINGLE, size: 4, color: C.grayLight }, bottom: { style: BorderStyle.SINGLE, size: 4, color: C.grayLight }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
        margins: { top: 60, bottom: 60, left: 100, right: 100 },
        children: [new Paragraph({ spacing: { before: 0, after: 0 }, children: [new TextRun({ text: owner, size: 18, font: 'Calibri', color: C.gray, italics: true })] })],
      }),
    ],
  });
}

function tableHeader() {
  return new TableRow({
    children: ['Status', 'Document', 'What It Is / Why It Matters', 'Owner'].map((h, i) => new TableCell({
      width: { size: [12, 28, 40, 12][i], type: WidthType.PERCENTAGE },
      shading: { fill: C.navy, type: ShadingType.CLEAR },
      borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
      margins: { top: 80, bottom: 80, left: 120, right: 120 },
      children: [new Paragraph({ spacing: { before: 0, after: 0 }, children: [new TextRun({ text: h, bold: true, size: 19, font: 'Calibri', color: C.white })] })],
    })),
  });
}

function docTable(rows) {
  return new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: [tableHeader(), ...rows] });
}

// ════════════════════════════════════════════════════════════════════════════
// BUILD
// ════════════════════════════════════════════════════════════════════════════
function build() {
  const children = [];

  // COVER
  children.push(
    sp(0, 480),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 0, after: 80 }, children: [new TextRun({ text: 'BRIM FINANCIAL', bold: true, size: 36, font: 'Calibri', color: C.navy })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 0, after: 80 }, children: [new TextRun({ text: 'BSB RFP — Appendix & Supporting Documents', bold: true, size: 28, font: 'Calibri', color: C.dark })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 0, after: 80 }, children: [new TextRun({ text: 'What We Have · What To Get · Flags · Differentiators', size: 22, font: 'Calibri', color: C.medium })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 0, after: 160 }, children: [new TextRun({ text: `${DATE}  ·  Submission deadline April 10, 2026  ·  Internal Use`, size: 20, font: 'Calibri', color: C.gray })] }),
    sp(0, 160),
    docTable([
      docRow('HAVE', 'Already in hand', 'Can include in submission package now', ''),
      docRow('GET', 'Attainable by Apr 9', 'Need to request from internal team (1–3 days)', ''),
      docRow('NDA', 'NDA / due diligence only', 'Share after BSB signs mutual NDA — not in open submission', ''),
      docRow('FLAG', 'Decision needed', 'Sensitive, unclear, or potentially problematic', ''),
      docRow('IDEA', 'Differentiator idea', 'Not required — would make BRIM stand out significantly', ''),
    ]),
    sp(0, 480),
    divider(),
    sp(0, 160),
  );

  // ── SECTION 1: COMPLIANCE CERTIFICATIONS ─────────────────────────────────
  children.push(
    banner('A.  COMPLIANCE CERTIFICATIONS', C.navy),
    sp(0, 80),
    body('These are the documents BSB will need for their vendor/TPRM process. Referenced explicitly in Partner Relationships 25, 26, Technology 28.'),
    sp(0, 80),
    docTable([
      docRow('HAVE', 'PCI DSS Level 1 AOC', 'Attestation of Compliance — annual, issued by QSA. Highest tier for card processors. BSB operates within BRIM\'s certified environment.', 'Security / Legal'),
      docRow('HAVE', 'SOC 2 Type 2 Report (Coalfire)', 'Annual audit covering security, availability, processing integrity, confidentiality, privacy. Named auditor: Coalfire.', 'Security / Legal'),
      docRow('HAVE', 'ISO 27001:2022 Certificate', 'Information security management standard. Triple certification (PCI + SOC 2 + ISO) is a competitive differentiator.', 'Security / Legal'),
      docRow('GET', 'Penetration Test Summary', 'Referenced in Partner Relationships 26. Findings + remediation summary. Full report under NDA; exec summary can be provided.', 'Security'),
      docRow('GET', 'BCP/DR Test Results Summary', 'Last BCDR exercise date + pass/fail + key metrics. Referenced in narrative Section 13. Not the full test plan — just the exec summary.', 'Ops'),
      docRow('NDA', 'Full SOC 2 Report', 'Detailed audit findings. Share only after BSB signs mutual NDA. Note current report date + expiry in appendix index.', 'Legal'),
      docRow('NDA', 'Pen Test Full Report', 'Full findings only under NDA. Not for open submission.', 'Security'),
      docRow('FLAG', 'ISO 27001 — Confirm BRIM entity vs. hosting provider', 'Submissions says ISO 27001 certified — confirm whether this applies to BRIM\'s own operations or only the hosting infrastructure (LeaseWeb / cloud provider). If the latter, reword.', 'Tarique'),
    ]),
    sp(0, 160),
  );

  // ── SECTION 2: LEGAL & CONTRACTUAL ───────────────────────────────────────
  children.push(
    banner('B.  LEGAL & CONTRACTUAL DOCUMENTS', C.navy),
    sp(0, 80),
    body('Referenced in responses across partner onboarding, data ownership, SLA, and agreement sections.'),
    sp(0, 80),
    docTable([
      docRow('GET', 'BRIM Standard SLA Document', 'Uptime commitments, P1/P2/P3 definitions, credit mechanisms. Referenced in Section 6. Required before BSB will sign. Include exec summary; full doc negotiated separately.', 'Legal'),
      docRow('GET', 'Standard Agent Bank Agreement Template', 'Referenced in Partner Relationships 10. BSB will want to review standard terms before shortlisting. Cover page + key terms summary is enough for RFP stage.', 'Legal'),
      docRow('GET', 'Data Processing Agreement (DPA) template', 'BSB is a US bank — GLBA, CCPA, state privacy laws apply. They will need a DPA. Proactively including one signals maturity and speeds contracting.', 'Legal'),
      docRow('GET', 'Data Ownership / Exit Rights Summary', 'Narrative Section 18 promises "data portability upon termination." Replace "commercially reasonable timeframe" with a specific commitment (e.g., 30 days, standard formats: CSV/JSON).', 'Legal'),
      docRow('GET', 'Consumer Privacy Notice (sample)', 'Referenced in Product Operations 48 + 49. "Available for BSB\'s review." Provide a sample — shows the cardholder experience BSB would be signing onto.', 'Legal / Product'),
      docRow('FLAG', '"Commercially reasonable timeframe" for data export', 'Currently in narrative Section 18. Needs a specific number. BSB\'s legal team will redline this. Recommend: 30 business days.', 'Tarique / Legal'),
      docRow('FLAG', 'Canadian vs. US contract entity', 'BRIM Financial Inc. (Canada) vs. BRIM Financial Corp. (Delaware). BSB is a US bank. Confirm which entity signs the BSB agreement. If BRIM Financial Corp., confirm it is active and in good standing.', 'Legal'),
    ]),
    sp(0, 160),
  );

  // ── SECTION 3: TECHNICAL DOCUMENTATION ───────────────────────────────────
  children.push(
    banner('C.  TECHNICAL DOCUMENTATION', C.navy),
    sp(0, 80),
    body('Referenced in Technology section responses and narrative Sections 8, 18. BSB\'s IT team will evaluate these.'),
    sp(0, 80),
    docTable([
      docRow('GET', 'Architecture Diagram — Functional', 'High-level: how BSB\'s program sits in BRIM\'s multi-tenant platform. One page. Referenced in narrative Section 8.', 'Engineering'),
      docRow('GET', 'Architecture Diagram — Security', 'Security zones, data flow, encryption points. PCI-friendly version (no internal details).', 'Security / Engineering'),
      docRow('GET', 'Architecture Diagram — Tenancy Model', 'Shows data isolation between BRIM, BSB, and partner FIs. Critical for a bank evaluating data sovereignty.', 'Engineering'),
      docRow('GET', 'API Documentation Overview', '1–2 page summary of API capability. Full interactive docs (Swagger/Postman) shared after NDA. Referenced in narrative Section 18.', 'Product / Engineering'),
      docRow('GET', 'Jack Henry SilverLake Integration Spec (draft)', 'Even a 1-page scope outline showing BRIM has thought through the jXchange endpoints, data flows, and reconciliation logic. Addresses BSB\'s #1 technical concern.', 'Engineering'),
      docRow('GET', 'Sandbox / UAT Access Credentials', 'Partner Relationships 6 promises a live sandbox. If this can be provided to BSB during evaluation, it is a massive differentiator — they can actually test before signing.', 'Product'),
      docRow('NDA', 'Full API specification', 'Full endpoint docs, authentication details — share under NDA only.', 'Engineering'),
      docRow('FLAG', '99.97% uptime — monitoring data', 'Narrative promises "monitoring logs available for due diligence review." Confirm these logs exist and are exportable in a format BSB\'s IT team can review. If not, soften the claim.', 'Engineering / Ops'),
      docRow('FLAG', 'Jack Henry SilverLake — live reference?', 'If no current client uses SilverLake, the integration spec above is even more important. Be explicit: "BRIM has not yet deployed with SilverLake — this is the integration approach we will follow." Hiding this creates more risk than disclosing it.', 'Tarique'),
    ]),
    sp(0, 160),
  );

  // ── SECTION 4: FINANCIAL & COMMERCIAL ────────────────────────────────────
  children.push(
    banner('D.  FINANCIAL & COMMERCIAL', C.navy),
    sp(0, 80),
    body('BSB will evaluate financial stability and commercial terms. Most of these are decisions, not documents that exist yet.'),
    sp(0, 80),
    docTable([
      docRow('GET', 'Pricing Schedule (Line-Item)', '5 matrix questions still flagged "NEEDS COMMERCIAL TEAM INPUT." Even a one-page indicative pricing summary resolves these. Full pricing can be in a separate sealed commercial envelope.', 'Commercial'),
      docRow('GET', 'Implementation Cost Estimate', 'Separate from platform pricing. One-time setup, Jack Henry integration, BSB onboarding, go-live support. Ballpark range is better than nothing.', 'Commercial'),
      docRow('GET', '5-Year TCO Model', 'Referenced in narrative Section 5. Helps BSB build their internal business case. BRIM\'s incumbents (Elan, FIS, etc.) will provide this. BRIM should too.', 'Commercial / Finance'),
      docRow('GET', 'D&B Report (current)', 'Dun & Bradstreet company report. Referenced in narrative Section 3. BSB\'s procurement will pull this anyway — providing it proactively shows confidence.', 'Finance'),
      docRow('FLAG', 'Financial disclosure (P&L, revenue)', 'Narrative Section 3 defers to "due diligence." Understand what BSB is actually asking for. If they want a full audit, that is a legal/leadership decision. Recommend: audited revenue figure for last fiscal year only.', 'Leadership / Legal'),
      docRow('FLAG', 'Investor / ownership disclosure', 'Narrative says "investor details available under NDA." BSB (a community bank) may want to understand who owns BRIM before signing a 5-year agreement. Prepare a one-paragraph ownership summary approved by leadership.', 'Leadership'),
    ]),
    sp(0, 160),
  );

  // ── SECTION 5: PROGRAM EVIDENCE & CASE STUDIES ───────────────────────────
  children.push(
    banner('E.  PROGRAM EVIDENCE & CASE STUDIES', C.navy),
    sp(0, 80),
    body('BRIM has live programs that directly parallel what BSB wants. One-page case studies are high-impact and low-effort to produce. BSB evaluators will remember these more than any matrix answer.'),
    sp(0, 80),
    docTable([
      docRow('IDEA', 'Continental Bank (US) Case Study', 'US agent banking credit card program. Consumer + business. This is the most directly relevant proof point for BSB. One page: program scope, key metrics, outcome. Ask Continental for permission to use.', 'Tarique / Sales'),
      docRow('IDEA', 'Manulife Bank Case Study', 'Fiserv migration → BRIM. 5 months. 55,000 advisors, 550,000 banking clients. Shows migration competence. Directly addresses BSB\'s risk around switching processors.', 'Tarique / Sales'),
      docRow('IDEA', 'Affinity Credit Union Case Study', 'Canadian credit union — most structurally similar to a US community bank. Agent banking model. If Affinity is willing to be a reference, this is the closest BSB analogue in BRIM\'s portfolio.', 'Tarique / Sales'),
      docRow('IDEA', 'One-to-Many Architecture Infographic', 'Single visual showing how one BRIM platform powers BSB + multiple partner FIs simultaneously. No other vendor in this space has this at scale. One diagram communicates the differentiation better than 5 paragraphs.', 'Marketing / Design'),
      docRow('IDEA', 'Sample QBR Report (Anonymized)', 'What BSB would receive quarterly. Shows the relationship management model is real, not aspirational. Anonymize client name and data.', 'Client Success'),
      docRow('IDEA', 'Sample Cardholder App Screenshots', 'What BSB\'s cardholders would actually see. White-label UI demo. Evaluators form emotional impressions; a good app screenshot does more work than specs.', 'Product'),
      docRow('IDEA', 'Sample Admin Portal Screenshots', 'What BSB\'s operations staff would use daily. Shows the "configurable" claims are real.', 'Product'),
    ]),
    sp(0, 160),
  );

  // ── SECTION 6: BSB-SPECIFIC & REGULATORY ─────────────────────────────────
  children.push(
    banner('F.  BSB-SPECIFIC & REGULATORY', C.navy),
    sp(0, 80),
    body('Items specific to Bangor Savings Bank as a Maine-chartered community bank. These were not in the original RFP but would signal that BRIM did its homework on BSB specifically.'),
    sp(0, 80),
    docTable([
      docRow('IDEA', 'Maine Banking Regulatory Note', 'BSB is chartered in Maine, supervised by the Maine Bureau of Financial Institutions + FDIC. A one-paragraph note confirming BRIM\'s US entity is familiar with Maine requirements, or that BRIM has supported other FDIC-supervised institutions, would stand out.', 'Compliance'),
      docRow('IDEA', 'CRA / Community Reinvestment Note', 'Community banks care about CRA. A note on how BRIM\'s program supports BSB\'s CRA obligations (community lending data, reporting, card program design options) would resonate with BSB leadership.', 'Compliance / Product'),
      docRow('IDEA', 'BSB Agent Banking Program Vision (1-pager)', 'A custom one-page mockup showing what BSB\'s agent banking card program could look like in Year 1 — partner FIs, card products, estimated portfolio volume. Shows BRIM has thought about BSB specifically, not just card programs generically.', 'Tarique / Sales'),
      docRow('FLAG', 'FDIC / Call Report data integration', 'BSB will ask about regulatory reporting integration. The matrix covers CFPB TCCP. But as an FDIC-insured bank, BSB also files Call Reports. Confirm whether BRIM\'s reporting module exports data in a format that feeds BSB\'s Call Report workflow.', 'Product / Compliance'),
      docRow('FLAG', 'Regulation II (Durbin Amendment)', 'BSB is likely a Durbin-exempt bank (assets under $10B). But if partner FIs grow above the threshold, debit interchange rules change. Flag this for the sales conversation — it affects program economics over time.', 'Tarique'),
      docRow('FLAG', 'Reg E compliance for debit', 'Product Operations 45/46 reference debit support. Confirm BRIM\'s error resolution process meets Reg E requirements for debit — especially the 10/45-day investigation windows for unauthorized transactions.', 'Compliance'),
    ]),
    sp(0, 160),
  );

  // ── SECTION 7: THINGS WE DIDN'T THINK OF ─────────────────────────────────
  children.push(
    banner('G.  THINGS WE DIDN\'T THINK OF — HIGH IMPACT', C.purple, C.white),
    sp(0, 80),
    body('These are not in the RFP, not referenced in responses, but would materially strengthen BRIM\'s position.'),
    sp(0, 80),
    docTable([
      docRow('IDEA', 'Cover Letter from BRIM CEO/President', 'A 1-page letter from BRIM\'s CEO or President addressed to BSB\'s evaluation committee. Named, signed, BRIM letterhead. Signals this is a board-level commitment, not just a sales proposal. Almost every shortlisted vendor will have this.', 'Leadership'),
      docRow('IDEA', 'BRIM Team Bios (BSB account team)', 'Photos + bios for the 3–4 named people who would serve BSB: PAM, Technical Lead, Compliance Liaison, Implementation Lead. Community banks buy relationships. Putting faces on the team is high-signal.', 'Tarique / HR'),
      docRow('IDEA', 'Competitive Positioning Memo (internal)', 'A 1-page internal memo (not for BSB) mapping BRIM against the likely competitors (Elan Financial, FIS, i2c, Fiserv). Helps Tarique answer "how are you different from X" in the Q&A. Not submitted to BSB.', 'Tarique'),
      docRow('IDEA', 'Reference Call Prep Sheet', 'One page for each reference account contact: who they are, what to say, what to avoid, BRIM talking points. So reference calls go well, not just happen.', 'Tarique / Sales'),
      docRow('IDEA', 'Implementation Timeline Visual', 'A simple Gantt or swim-lane chart showing a 16–20 week BSB launch plan: Discovery, SilverLake integration, UAT, pilot, go-live. One diagram beats 3 paragraphs. BSB\'s project team will want this.', 'Tarique / Engineering'),
      docRow('IDEA', 'Glossary of Terms', 'RFP responses use ICA, BIN, STIP, jXchange, PAN, TPRM, etc. A 1-page glossary in the appendix helps BSB evaluators who are not card industry insiders. Small effort, high signal of professionalism.', 'Tarique'),
      docRow('IDEA', 'Win Theme Summary (1-pager)', 'Three-column: BSB\'s stated priorities → BRIM\'s response → proof point. Summarizes why BRIM wins. For the evaluators who read executive summaries, not full submissions.', 'Tarique'),
      docRow('FLAG', 'AI Use Disclosure (internal only)', 'BRIM has an internal methodology document showing AI was used to assist (not generate) responses. If Rasha or leadership asks, the document exists. Not submitted to BSB unless asked.', 'Tarique'),
    ]),
    sp(0, 160),
    divider(),
  );

  // ── LEGEND & SUMMARY ─────────────────────────────────────────────────────
  children.push(
    h1('Summary Count'),
    docTable([
      docRow('HAVE', 'Items in hand', 'Can include in submission package now — just need to confirm versions are current', ''),
      docRow('GET', 'Items to request', 'Attainable from internal teams in 1–3 days — assign owners immediately', ''),
      docRow('NDA', 'NDA-gated', 'Prepare for due diligence phase; reference in appendix index as "available upon NDA execution"', ''),
      docRow('FLAG', 'Decisions/flags', 'Require a decision before submission — some could change what we say in the matrix', ''),
      docRow('IDEA', 'Differentiator ideas', 'Not required — but each one makes BRIM look more prepared than competitors', ''),
    ]),
    sp(0, 120),
    body('Recommended action order: (1) Collect all HAVE items and confirm they are current versions. (2) Assign GET items to owners with April 8 deadline. (3) Make FLAG decisions with Rasha / legal. (4) Pick the top 3–4 IDEA items that are fastest to produce — cover letter, team bios, implementation Gantt, and the win theme one-pager are the highest ROI.', { color: C.gray, italics: true }),
    sp(0, 240),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 0, after: 0 }, children: [new TextRun({ text: `BRIM Financial  ·  Internal Use Only  ·  Generated ${DATE}`, size: 18, font: 'Calibri', color: C.gray, italics: true })] }),
  );

  return new Document({
    creator: 'BRIM Financial',
    title: 'BSB RFP Appendix & Supporting Documents Checklist',
    styles: { default: { document: { run: { font: 'Calibri', size: 22 } } } },
    sections: [{
      properties: { page: { margin: { top: 1080, bottom: 1080, left: 1080, right: 1080 } } },
      headers: {
        default: new Header({
          children: [new Paragraph({
            alignment: AlignmentType.RIGHT,
            border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: C.grayLight } },
            spacing: { before: 0, after: 80 },
            children: [new TextRun({ text: `BRIM Financial  ·  BSB RFP Appendix Checklist  ·  ${DATE}  ·  INTERNAL`, size: 16, font: 'Calibri', color: C.gray })],
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
  const outPath = path.join(os.homedir(), `Desktop/BSB_Appendix_Checklist_BRIM_${DATE}.docx`);
  writeFileSync(outPath, buf);
  console.log(`Appendix Checklist: ${outPath} (${Math.round(buf.byteLength / 1024)}KB)`);
}
main().catch(err => { console.error(err); process.exit(1); });
