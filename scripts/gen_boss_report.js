'use strict';
/**
 * Generates the BSB RFP Process & Methodology Report for senior review.
 * Run: node scripts/gen_boss_report.js
 */
const { writeFileSync, readFileSync } = require('fs');
const path = require('path');
const os = require('os');
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  WidthType, AlignmentType, HeadingLevel, ShadingType, BorderStyle,
  Header, PageNumber,
} = require('docx');

const data = JSON.parse(readFileSync(path.join(__dirname, '../public/rfp_data.json'), 'utf8'));
const qs = data.questions;
const DATE = new Date().toISOString().slice(0, 10);

// ── Live counts ───────────────────────────────────────────────────────────────
const total   = qs.length;
const Y       = qs.filter(q => q.compliant === 'Y').length;
const partial = qs.filter(q => q.compliant === 'Partial').length;
const N       = qs.filter(q => q.compliant === 'N').length;
const GREEN   = qs.filter(q => q.confidence === 'GREEN').length;
const YELLOW  = qs.filter(q => q.confidence === 'YELLOW').length;
const RED     = qs.filter(q => q.confidence === 'RED').length;
const oob     = qs.filter(q => q.a_oob).length;
const config  = qs.filter(q => q.b_config).length;
const custom  = qs.filter(q => q.c_custom).length;
const dnm     = qs.filter(q => q.d_dnm).length;
const cats    = data.categories.length;

// ── Colors ───────────────────────────────────────────────────────────────────
const C = {
  navy: '1E3A5F', navyBg: 'EBF2FA',
  green: '047857', greenBg: 'ECFDF5',
  yellow: 'B45309', yellowBg: 'FFFBEB',
  red: 'B91C1C', redBg: 'FEF2F2',
  gray: '6B7280', grayBg: 'F3F4F6',
  grayLight: 'E5E7EB', dark: '111827', medium: '374151',
  white: 'FFFFFF',
};

// ── Helpers ───────────────────────────────────────────────────────────────────
const sp = (b = 0, a = 0) => new Paragraph({ spacing: { before: b, after: a } });

function h1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 320, after: 120 },
    children: [new TextRun({ text, bold: true, size: 32, font: 'Calibri', color: C.navy })],
  });
}

function h2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 240, after: 80 },
    children: [new TextRun({ text, bold: true, size: 24, font: 'Calibri', color: C.navy })],
  });
}

function body(text, opts = {}) {
  return new Paragraph({
    spacing: { before: 0, after: 120 },
    children: [new TextRun({ text, size: 22, font: 'Calibri', color: C.dark, ...opts })],
  });
}

function bullet(text, opts = {}) {
  return new Paragraph({
    bullet: { level: 0 },
    spacing: { before: 0, after: 60 },
    children: [new TextRun({ text, size: 22, font: 'Calibri', color: C.dark, ...opts })],
  });
}

function bullet2(text, opts = {}) {
  return new Paragraph({
    bullet: { level: 1 },
    spacing: { before: 0, after: 40 },
    children: [new TextRun({ text, size: 20, font: 'Calibri', color: C.medium, ...opts })],
  });
}

function labelValue(label, value) {
  return new Paragraph({
    spacing: { before: 0, after: 80 },
    children: [
      new TextRun({ text: label + ': ', bold: true, size: 22, font: 'Calibri', color: C.navy }),
      new TextRun({ text: value, size: 22, font: 'Calibri', color: C.dark }),
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

function callout(text, color = C.navyBg, borderColor = C.navy) {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    margins: { top: 80, bottom: 80 },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            shading: { fill: color, type: ShadingType.CLEAR },
            borders: {
              top: { style: BorderStyle.SINGLE, size: 6, color: borderColor },
              bottom: { style: BorderStyle.NONE },
              left: { style: BorderStyle.SINGLE, size: 12, color: borderColor },
              right: { style: BorderStyle.NONE },
            },
            margins: { top: 80, bottom: 80, left: 160, right: 160 },
            children: [new Paragraph({
              spacing: { before: 0, after: 0 },
              children: [new TextRun({ text, size: 20, font: 'Calibri', color: C.dark })],
            })],
          }),
        ],
      }),
    ],
  });
}

function statsTable(rows) {
  const COLS = [40, 20, 40];
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    margins: { top: 40, bottom: 40 },
    rows: rows.map((r, ri) => new TableRow({
      children: r.map((cell, ci) => new TableCell({
        width: { size: COLS[ci], type: WidthType.PERCENTAGE },
        shading: ri === 0
          ? { fill: C.navy, type: ShadingType.CLEAR }
          : ci === 0
            ? { fill: C.navyBg, type: ShadingType.CLEAR }
            : { fill: C.white, type: ShadingType.CLEAR },
        borders: {
          top: { style: BorderStyle.SINGLE, size: 4, color: C.grayLight },
          bottom: { style: BorderStyle.SINGLE, size: 4, color: C.grayLight },
          left: { style: BorderStyle.SINGLE, size: 4, color: C.grayLight },
          right: { style: BorderStyle.SINGLE, size: 4, color: C.grayLight },
        },
        margins: { top: 80, bottom: 80, left: 120, right: 120 },
        children: [new Paragraph({
          alignment: ci === 0 ? AlignmentType.LEFT : AlignmentType.CENTER,
          spacing: { before: 0, after: 0 },
          children: [new TextRun({
            text: String(cell),
            size: ri === 0 ? 20 : 22,
            font: 'Calibri',
            bold: ri === 0 || ci === 0,
            color: ri === 0 ? C.white : C.dark,
          })],
        })],
      })),
    })),
  });
}

function twoColTable(rows, leftPct = 40) {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    margins: { top: 40, bottom: 40 },
    rows: rows.map((r, ri) => new TableRow({
      children: r.map((cell, ci) => new TableCell({
        width: { size: ci === 0 ? leftPct : 100 - leftPct, type: WidthType.PERCENTAGE },
        shading: ri === 0
          ? { fill: C.navy, type: ShadingType.CLEAR }
          : ci === 0
            ? { fill: C.navyBg, type: ShadingType.CLEAR }
            : { fill: C.white, type: ShadingType.CLEAR },
        borders: {
          top: { style: BorderStyle.SINGLE, size: 4, color: C.grayLight },
          bottom: { style: BorderStyle.SINGLE, size: 4, color: C.grayLight },
          left: { style: BorderStyle.SINGLE, size: 4, color: C.grayLight },
          right: { style: BorderStyle.SINGLE, size: 4, color: C.grayLight },
        },
        margins: { top: 80, bottom: 80, left: 120, right: 120 },
        children: [new Paragraph({
          spacing: { before: 0, after: 0 },
          children: [new TextRun({
            text: String(cell),
            size: ri === 0 ? 20 : 22,
            font: 'Calibri',
            bold: ri === 0,
            color: ri === 0 ? C.white : C.dark,
          })],
        })],
      })),
    })),
  });
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
      children: [new TextRun({ text: 'BSB Credit Card Program RFP', size: 28, font: 'Calibri', color: C.medium })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: 80 },
      children: [new TextRun({ text: 'Process, Methodology & AI Approach', bold: true, size: 28, font: 'Calibri', color: C.dark })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: 160 },
      children: [new TextRun({ text: `Prepared for Internal Review  ·  ${DATE}`, size: 20, font: 'Calibri', color: C.gray })],
    }),
    sp(0, 480),
    divider(),
    sp(0, 160),
  );

  // ── SECTION 1 — PROJECT OVERVIEW ──────────────────────────────────────────
  children.push(
    h1('1. Project Overview'),
    body('BRIM Financial is responding to the Bangor Savings Bank (BSB) Credit Card Program Request for Proposal. BSB is evaluating a card-as-a-service partner to manage their full credit card program — consumer, business, and commercial — under an agent banking model.'),
    sp(0, 80),
    twoColTable([
      ['Item', 'Detail'],
      ['Client', 'Bangor Savings Bank (BSB), Bangor, Maine'],
      ['Submission deadline', 'April 10, 2026'],
      ['RFP scope', '383 functional requirements across 12 categories'],
      ['Program type', 'Agent banking credit card (consumer + commercial)'],
      ['Core banking', 'Jack Henry SilverLake'],
      ['Card networks', 'Mastercard + Visa'],
      ['Prepared by', 'Tarique Khan, BD & Strategy — BRIM Financial'],
    ]),
    sp(0, 160),
    h2('Deliverables Package'),
    body('Four documents make up the complete BRIM submission to BSB:'),
    bullet('BSB_RFP_Submission_BRIM_FINAL.docx — The formal response. Contains all 383 answers (bullet format), compliance status, and supporting narrative. This is what BSB receives.'),
    bullet('BSB_Matrix_BRIM_FINAL.xlsx — Excel compliance matrix. Three sheets: full question-by-question matrix with color coding, category scorecard, and action-required flags.'),
    bullet('BSB_Narrative_Response_BRIM_DRAFT.docx — Qualitative responses to Sections 3–20 of the RFP (company background, architecture, security, implementation, etc.). In DRAFT status pending [CONFIRM] items.'),
    bullet('BSB_RFP_WorkingCopy_BRIM_FINAL.docx — Internal working copy. Includes all internal committee scores, risk ratings, and review notes that are NEVER shared with BSB.'),
    sp(0, 160),
    divider(),
  );

  // ── SECTION 2 — METHODOLOGY ───────────────────────────────────────────────
  children.push(
    h1('2. Methodology & Approach'),
    body('The BSB RFP response was built using an AI-assisted, human-reviewed workflow. The approach is designed to maximize response quality and consistency across 383 questions while keeping humans in control of all compliance determinations, risk ratings, and final content decisions.'),
    sp(0, 80),
    h2('Three-Layer Workflow'),
    bullet('Layer 1 — AI drafts: Claude Sonnet 4.6 generates initial bullet and paragraph responses for each question, drawing only from a provided knowledge base (BRIM facts, metrics, client evidence). No internet search. No fabrication.'),
    bullet('Layer 2 — Human editorial review: Tarique reviews every response, applies committee scores (0–10), assigns confidence ratings (GREEN/YELLOW/RED), sets compliance status (Y/Partial/N), and flags questions needing escalation. AI never sets any of these values.'),
    bullet('Layer 3 — AI refinement with rule enforcement: AI rewrites responses based on human feedback, global writing rules, and row-specific rules. All outputs are validated (length, format, banned words) before being saved.'),
    sp(0, 120),
    callout(
      'AI was used only to draft and refine the text of responses. Every compliance determination, risk rating, and scoring decision is human-authored and human-reviewed. The AI does not score, rate, or evaluate BRIM\'s capabilities — humans do.',
      C.greenBg, C.green,
    ),
    sp(0, 160),
    h2('What This Is Not'),
    bullet('Not a web search or research tool — all information comes from BRIM\'s internal knowledge base or the Claude model\'s training data'),
    bullet('Not autonomous — every question was reviewed by a human before inclusion in any deliverable'),
    bullet('Not a black box — every field has an audit trail (timestamp, source: human / ai / ai-edited)'),
    sp(0, 160),
    divider(),
  );

  // ── SECTION 3 — GLOBAL WRITING RULES ─────────────────────────────────────
  children.push(
    h1('3. Global Writing Rules & Guardrails'),
    body('The following rules were enforced on every AI rewrite request via the system prompt. They cannot be overridden by individual questions.'),
    sp(0, 80),
    h2('Banned Words — Hard Enforced on Every Rewrite'),
    callout(
      'comprehensive · robust · seamless · leverage · utilize · cutting-edge · ecosystem\n\nAny response containing these words is rejected at the rewrite layer.',
      C.yellowBg, C.yellow,
    ),
    sp(0, 120),
    h2('Tone & Format Rules'),
    bullet('Sound confident without being vague — no hedging on high-confidence answers'),
    bullet('Bullet format for matrix responses (scannable for procurement committees)'),
    bullet('Polished professional prose for narrative responses'),
    bullet('Do not fabricate statistics, client names, or metrics not in the knowledge base'),
    bullet('"BRIM" always uppercase throughout all documents'),
    bullet('Named client references in ALL CAPS (CONTINENTAL BANK, MANULIFE BANK, AFFINITY CREDIT UNION)'),
    sp(0, 120),
    h2('Hard Editorial Rules Applied This Session'),
    bullet('TSYS removed from all BSB-facing content — replaced with "BRIM\'s payment processor" (10 questions, 21 instances)'),
    bullet('"Looks forward to", "purpose-designed", "cobbled", "leading cloud", "highly defensible market position" — all removed'),
    bullet('"Comprehensive" → replaced with "full", "complete", "tested", "structured" throughout'),
    bullet('"Leading enterprise MFA providers" → "major enterprise MFA providers"'),
    bullet('Data ownership always stated in BSB-favorable terms (all data owned by BSB, non-monetization pledge)'),
    bullet('Hedging language minimized in GREEN/high-confidence answers'),
    sp(0, 160),
    divider(),
  );

  // ── SECTION 4 — DATA SOURCES ──────────────────────────────────────────────
  children.push(
    h1('4. Data Sources & What We Did NOT Use'),
    h2('What Was Used'),
    bullet('rfp_data.json — 383-question matrix (1.4 MB), the single source of truth for all deliverables'),
    bullet('BRIM knowledge base — company facts, metrics, and program evidence provided internally'),
    bullet('Claude Sonnet 4.6 training data — general fintech and card industry knowledge'),
    bullet('Named production programs as evidence: CONTINENTAL BANK (US consumer + business), MANULIFE BANK, AFFINITY CREDIT UNION, ZOLVE, LAURENTIAN BANK, CWB BANK'),
    sp(0, 80),
    h2('What Was NOT Used'),
    callout(
      'No web search. No external URL fetching. No real-time market data. No competitor research. No scraping.\n\nAll responses are grounded in BRIM\'s internal knowledge base and Claude\'s training. Third-party names (TransUnion, World-Check, Mastercard, Visa) appear only where live production integrations are confirmed.',
      C.navyBg, C.navy,
    ),
    sp(0, 120),
    h2('AI Detection Note'),
    body('Because responses are AI-assisted (drafted and refined by Claude), standard AI detection tools will flag this content. This is expected and intended — the workflow is by design AI-assisted with human review, not AI-only. The human editorial layer (scoring, compliance ratings, flagging, and rewriting) is the primary quality control. All claims are grounded in documented production evidence, not AI hallucination.'),
    sp(0, 160),
    divider(),
  );

  // ── SECTION 5 — AI ARCHITECTURE ──────────────────────────────────────────
  children.push(
    h1('5. AI Architecture & Work Effort'),
    h2('How Claude Was Used'),
    bullet('Rewrite API (/api/rewrite) — field-by-field response rewriting with rules enforcement and knowledge base injection'),
    bullet('Batch consistency review — parallel 3-agent runs to check scoring, tone, and content accuracy across all 383 questions'),
    bullet('Editorial passes — multi-agent parallel runs for tone QA, compliance verification, and outlier detection'),
    bullet('Bulk data fixes — Python scripts for systematic corrections (capitalization, vendor name replacement, score corrections)'),
    sp(0, 120),
    h2('Work Effort Summary — BSB RFP (April 3–5, 2026)'),
    statsTable([
      ['Metric', 'Count', 'Notes'],
      ['Working sessions', '~6–8', 'Across April 3–5, 2026'],
      ['Narrative editorial passes', '4', 'Initial → Editorial → QA/Tone → Final'],
      ['Parallel agent batches', '7', '3 agents per batch = ~21 total agent invocations'],
      ['Python bulk-fix scripts', '15+', 'Capitalization, TSYS removal, score corrections'],
      ['Back-and-forth exchanges', '50+', 'Across all sessions combined'],
      ['Est. tokens processed', '~2–3M', 'Input + output, all runs combined'],
      ['Model used', 'Claude Sonnet 4.6', 'Throughout — no model switching'],
      ['Questions reviewed', '383', 'All questions, all categories'],
    ]),
    sp(0, 120),
    h2('API Parameters & Constraints'),
    twoColTable([
      ['Parameter', 'Value'],
      ['Model temperature', '0.4 (balanced — not too creative, not too rigid)'],
      ['Max tokens per rewrite', '2,000 output tokens'],
      ['Request body size limit', '64 KB (rejects oversized payloads with HTTP 413)'],
      ['API timeout', '30 seconds with AbortSignal (returns HTTP 504 on timeout)'],
      ['Output min length', '50 characters (rejects incomplete responses with HTTP 422)'],
      ['Output max length', '10,000 characters (auto-truncated with warning)'],
      ['Max global rules per request', '50 rules'],
      ['Max feedback items per request', '20 items'],
    ]),
    sp(0, 160),
    divider(),
  );

  // ── SECTION 6 — HUMAN-IN-THE-LOOP ────────────────────────────────────────
  children.push(
    h1('6. Human-in-the-Loop Controls'),
    body('Every question in the matrix has six human-authored fields that AI is structurally prohibited from writing. These fields control what gets exported, what gets flagged, and what BSB sees.'),
    sp(0, 80),
    statsTable([
      ['Field', 'Values', 'Purpose'],
      ['confidence', 'GREEN / YELLOW / RED', 'Risk signal — drives color coding and action-required flags'],
      ['compliant', 'Y / Partial / N', 'Compliance determination — drives scorecard and executive summary'],
      ['committee_score', '0–10 integer', 'Internal procurement scoring — not shared with BSB'],
      ['committee_review', 'Free text', 'Internal risk commentary — NEVER exported to BSB'],
      ['committee_risk', 'LOW / MEDIUM / HIGH', 'Escalation signal for committee review'],
      ['status', 'draft / reviewed / approved / flagged', 'Workflow gate — flagged items surface in Action Required tab'],
    ]),
    sp(0, 120),
    callout(
      'The AI only writes the "bullet" and "paragraph" response fields. It never scores, rates, or determines compliance for any question. All risk and compliance decisions are human-made.',
      C.greenBg, C.green,
    ),
    sp(0, 160),
    divider(),
  );

  // ── SECTION 7 — SECURITY & SANITIZATION ──────────────────────────────────
  children.push(
    h1('7. Security & Input/Output Sanitization'),
    h2('Input Sanitization (Before AI Call)'),
    bullet('Field allowlist enforced — only 24 predefined fields are permitted through to the AI. Any unknown fields are stripped entirely.'),
    bullet('HTML stripping — all HTML tags removed from every string field via regex before the AI prompt is constructed'),
    bullet('Control character removal — non-printable characters (except tabs and newlines) stripped'),
    bullet('String length limits — requirement/bullet/paragraph fields max 20,000 chars; all other fields max 5,000 chars'),
    bullet('Global rules capped at 50 rules × 500 chars each; feedback items capped at 20'),
    sp(0, 80),
    h2('Schema Validation (Zod — Before Sanitization)'),
    bullet('All API requests validated against Zod schemas before any processing begins'),
    bullet('Invalid field types, enum violations, or out-of-range numbers return HTTP 400 with specific error details'),
    bullet('committee_score validated as integer in range [0, 10]'),
    bullet('confidence validated as enum: GREEN | YELLOW | RED'),
    bullet('compliant validated as enum: Y | N | Partial'),
    bullet('status validated as enum: draft | reviewed | approved | flagged'),
    sp(0, 80),
    h2('Output Validation (After AI Response)'),
    bullet('Minimum length check: responses under 50 characters rejected with HTTP 422 (incomplete)'),
    bullet('Maximum length cap: responses over 10,000 characters auto-truncated with a warning flag'),
    bullet('Type check: only text content blocks accepted (images, tool calls silently rejected)'),
    sp(0, 80),
    h2('Security Headers (All Pages)'),
    bullet('Strict-Transport-Security: max-age=63072000 (2 years, HSTS preload eligible)'),
    bullet('X-Frame-Options: SAMEORIGIN (clickjacking prevention)'),
    bullet('X-Content-Type-Options: nosniff (MIME type sniffing prevention)'),
    bullet('Referrer-Policy: strict-origin-when-cross-origin (minimal referrer leakage)'),
    sp(0, 160),
    divider(),
  );

  // ── SECTION 8 — DATA ISOLATION ────────────────────────────────────────────
  children.push(
    h1('8. Data Isolation — What BSB Sees vs. Internal Only'),
    body('rfp_data.json contains two classes of fields. The export layer enforces strict separation — internal fields have never appeared in any BSB-facing document.'),
    sp(0, 80),
    twoColTable([
      ['Field', 'Goes to BSB?'],
      ['bullet (response text)', 'YES — Submission Word + Excel matrix'],
      ['paragraph (response text)', 'YES — Submission Word + Excel matrix'],
      ['compliance_notes', 'YES — Only where non-compliant or partial'],
      ['requirement (question text)', 'YES — Shown alongside responses'],
      ['compliant (Y/Partial/N)', 'YES — Color-coded in Excel'],
      ['confidence (GREEN/YELLOW/RED)', 'YES — Color-coded in Excel'],
      ['notes (working notes)', 'NO — Internal only, never exported'],
      ['rationale', 'NO — Internal only, never exported'],
      ['committee_review', 'NO — Internal only, never exported'],
      ['committee_risk (LOW/MED/HIGH)', 'NO — Internal only, never exported'],
      ['committee_score (0–10)', 'NO — Internal only, never exported'],
    ], 50),
    sp(0, 120),
    callout(
      'The internal notes field across all 383 questions contains BRIM INTERNAL NOTE markers, QUESTIONS FOR BRIM, and working commentary. This field is structurally isolated and confirmed absent from all four deliverable documents.',
      C.yellowBg, C.yellow,
    ),
    sp(0, 160),
    divider(),
  );

  // ── SECTION 9 — VERSION CONTROL ───────────────────────────────────────────
  children.push(
    h1('9. Version Control & Audit Trail'),
    bullet('Cell history — every edit (human or AI) is logged with timestamp and source tag (human / ai / ai-edited). Full per-question edit history is reviewable in the app.'),
    bullet('Manual snapshots — users can save named snapshots at any point (e.g., "pre-review-Apr5"). Snapshots stored in browser localStorage with IndexedDB mirror as backup.'),
    bullet('Emergency auto-save — triggered on tab close; if a newer emergency save is detected on next load, the user is prompted to restore.'),
    bullet('All four deliverable docs are regenerated fresh from rfp_data.json on demand — no stale state. Any edit to the matrix is immediately reflected in the next export.'),
    bullet('JSON is the single source of truth — Word and Excel are always derived, never edited directly.'),
    sp(0, 160),
    divider(),
  );

  // ── SECTION 10 — DELIVERABLES STATUS ─────────────────────────────────────
  children.push(
    h1('10. Deliverables Status — April 5, 2026'),
    h2('Compliance Summary (Live from rfp_data.json)'),
    statsTable([
      ['Metric', 'Count', 'Percentage'],
      [`Total requirements (${cats} categories)`, String(total), '100%'],
      ['Fully compliant (Y)', String(Y), `${(Y/total*100).toFixed(1)}%`],
      ['Partial compliance', String(partial), `${(partial/total*100).toFixed(1)}%`],
      ['Non-compliant (N)', String(N), `${(N/total*100).toFixed(1)}%`],
      ['GREEN confidence', String(GREEN), `${(GREEN/total*100).toFixed(1)}%`],
      ['YELLOW confidence', String(YELLOW), `${(YELLOW/total*100).toFixed(1)}%`],
      ['RED confidence', String(RED), `${(RED/total*100).toFixed(1)}%`],
      ['Out-of-box capability', String(oob), `${(oob/total*100).toFixed(1)}%`],
      ['Via configuration', String(config), `${(config/total*100).toFixed(1)}%`],
      ['Custom development required', String(custom), `${(custom/total*100).toFixed(1)}%`],
      ['Does not meet', String(dnm), `${(dnm/total*100).toFixed(1)}%`],
    ]),
    sp(0, 120),
    h2('Deliverable Files'),
    twoColTable([
      ['Document', 'Status'],
      ['BSB_RFP_Submission_BRIM_FINAL_2026-04-03.docx (219 KB)', 'CLEAN — TSYS removed, all BRIM uppercase, goes to BSB'],
      ['BSB_RFP_WorkingCopy_BRIM_FINAL_2026-04-03.docx (325 KB)', 'CLEAN — Internal use only, includes scores/risk'],
      ['BSB_Matrix_BRIM_FINAL_2026-04-03.xlsx (240 KB)', 'CLEAN — 3 sheets: Matrix, Scorecard, Action Required'],
      ['BSB_Narrative_Response_BRIM_DRAFT_2026-04-03.docx (27 KB)', 'DRAFT — 28 [CONFIRM] items remain; not ready for submission'],
    ], 55),
    sp(0, 120),
    h2('Known Gaps Before April 10 Submission'),
    bullet('Section 7 (References) — 0% complete. Three reference accounts with full contact details required.', { color: C.red }),
    bullet('Section 9 (Reliability) — No uptime % stated. Must add specific SLA figure.', { color: C.red }),
    bullet('Pricing — 5 questions flagged for commercial team input. Decision pending.', { color: C.yellow }),
    bullet('28 [CONFIRM] items distributed across Sections 3–20 require BRIM team input.', { color: C.yellow }),
    bullet('Technology 6 (Non-compliant) — Only N in the matrix. Local US clearing switch. Sales alignment needed.', { color: C.yellow }),
    sp(0, 160),
    divider(),
    sp(0, 240),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: 80 },
      children: [new TextRun({ text: 'BRIM Financial  ·  Confidential & Proprietary', size: 18, font: 'Calibri', color: C.gray, italics: true })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: 0 },
      children: [new TextRun({ text: `Generated ${DATE}  ·  Do not distribute without approval`, size: 18, font: 'Calibri', color: C.gray, italics: true })],
    }),
  );

  return new Document({
    creator: 'BRIM Financial',
    title: 'BSB RFP Process Methodology Report',
    description: 'Internal methodology and status report for the Bangor Savings Bank credit card RFP response',
    styles: {
      default: {
        document: {
          run: { font: 'Calibri', size: 22 },
        },
      },
    },
    sections: [{
      properties: { page: { margin: { top: 1080, bottom: 1080, left: 1080, right: 1080 } } },
      headers: {
        default: new Header({
          children: [new Paragraph({
            alignment: AlignmentType.RIGHT,
            border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: C.grayLight } },
            spacing: { before: 0, after: 80 },
            children: [
              new TextRun({ text: 'BRIM Financial  ·  BSB RFP  ·  Process & Methodology  ·  CONFIDENTIAL', size: 16, font: 'Calibri', color: C.gray }),
            ],
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
  const outPath = path.join(os.homedir(), `Desktop/BSB_Process_Methodology_BRIM_${DATE}.docx`);
  writeFileSync(outPath, buf);
  console.log(`Boss Report: ${outPath} (${Math.round(buf.byteLength / 1024)}KB)`);
}
main().catch(err => { console.error(err); process.exit(1); });
