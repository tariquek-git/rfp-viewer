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

const OUTPUT = path.join(os.homedir(), 'Desktop', 'BSB_Compliance_Reframed_BRIM_2026-04-06.docx');

// ── Colours ───────────────────────────────────────────────────────────────────
const NAVY='1F3864', TEAL='2E75B6', GREEN='375623', ORANGE='7D4200';
const LIGHT_BLUE='D5E8F0', LIGHT_GREEN='E2EFDA', LIGHT_YELLOW='FFF2CC';
const LIGHT_RED='FFE0E0', LIGHT_GRAY='F5F5F5', WHITE='FFFFFF', RED='C00000';

// ── Helpers ───────────────────────────────────────────────────────────────────
const thinBorder = (c='BBBBBB') => ({ style: BorderStyle.SINGLE, size: 1, color: c });
const allBorders = (c='BBBBBB') => ({ top:thinBorder(c), bottom:thinBorder(c), left:thinBorder(c), right:thinBorder(c) });
const noBorder = () => ({ style: BorderStyle.NONE, size: 0, color: 'FFFFFF' });
const noBorders = () => ({ top:noBorder(), bottom:noBorder(), left:noBorder(), right:noBorder() });

const t = (text, o={}) => new TextRun({ text: String(text||''), font:'Arial', size:o.size||20, bold:o.bold, italic:o.italic, color:o.color||'000000', ...o });
const p = (children, o={}) => new Paragraph({ children: Array.isArray(children)?children:[children], spacing:{ before:o.before??60, after:o.after??60 }, alignment:o.align||AlignmentType.LEFT, ...o });
const spacer = (b=80) => p([t('')],{before:b,after:0});

const h1 = (text) => new Paragraph({
  heading: HeadingLevel.HEADING_1,
  children: [new TextRun({ text, font:'Arial', size:26, bold:true, color:WHITE })],
  spacing:{ before:200, after:100 },
  shading:{ fill:NAVY, type:ShadingType.CLEAR },
  indent:{ left:120, right:120 }
});

const h2 = (text) => new Paragraph({
  heading: HeadingLevel.HEADING_2,
  children: [new TextRun({ text, font:'Arial', size:22, bold:true, color:NAVY })],
  spacing:{ before:180, after:60 },
  border:{ bottom:{ style:BorderStyle.SINGLE, size:3, color:TEAL } }
});

const bullet = (text, lvl=0) => new Paragraph({
  numbering:{ reference:'bullets', level:lvl },
  children:[new TextRun({ text:String(text||''), font:'Arial', size:20 })],
  spacing:{ before:40, after:40 }
});

const callout = (text, fill=LIGHT_YELLOW, textColor=ORANGE, borderColor='FFD966') => new Table({
  width:{ size:9360, type:WidthType.DXA }, columnWidths:[9360],
  rows:[new TableRow({ children:[new TableCell({
    borders:allBorders(borderColor),
    shading:{ fill, type:ShadingType.CLEAR },
    margins:{ top:80, bottom:80, left:140, right:140 },
    width:{ size:9360, type:WidthType.DXA },
    children:[p([t(text, { size:19, color:textColor })])]
  })]})]
});

const hdrCell = (text, w, fill=NAVY) => new TableCell({
  borders:allBorders(NAVY), shading:{ fill, type:ShadingType.CLEAR },
  margins:{ top:80, bottom:80, left:100, right:100 },
  width:{ size:w, type:WidthType.DXA }, verticalAlign:VerticalAlign.CENTER,
  children:[p([t(text, { bold:true, color:WHITE, size:18 })],{ before:0, after:0 })]
});

const cell = (text, w, fill=WHITE, color='000000', bold=false) => new TableCell({
  borders:allBorders('CCCCCC'), shading:{ fill, type:ShadingType.CLEAR },
  margins:{ top:60, bottom:60, left:100, right:100 },
  width:{ size:w, type:WidthType.DXA }, verticalAlign:VerticalAlign.TOP,
  children:[p([t(text, { size:18, color, bold })],{ before:0, after:0 })]
});

// ── THE 29 REFRAMED ANSWERS ───────────────────────────────────────────────────
// Format: { id, req (short), frameNote, bullets, approach, flag }
// flag: 'REFRAMED' = was wrong framing, 'OK' = framing was already correct

const questions = [

  { id:'C1', req:'What consumer/business data analysis tools do you offer? (profiles, spending patterns, frontline fee reviews, etc.)',
    frameNote: null,
    bullets: [
      'BRIM gives BSB real-time data tools in the Issuer Portal: customer profiles (individual, household, business entity/UBO), MCC-level spending analytics, product utilization, and acquisition channel attribution — all segmented by BSB\'s org hierarchy and agent bank structure',
      'BSB\'s compliance and credit teams access the data directly — no request to BRIM required',
      'API feeds push the same data into BSB\'s internal BI tools, data lake, or document storage on a configurable schedule',
    ],
    approach: 'BSB owns its data and its analysis workflows. BRIM provides the infrastructure and pre-built tooling. Everything in the Issuer Portal today — live across current bank partners.',
    flag: 'OK'
  },

  { id:'C2', req:'Can you split reports by consumer vs. business, region, BIN, credit office, etc.?',
    frameNote: null,
    bullets: [
      'Yes. All reports segment by consumer vs. business (micro, small/medium, commercial), BIN/BIN-range, region, credit office, origination channel, and card product — today, out of the box',
      'In BSB\'s agent bank model, every report automatically partitions by client FI — BSB sees the consolidated view; each client FI sees only its own data',
      'No custom development required for standard segmentation; advanced cross-dataset joins are available through BRIM\'s analytics team via change management',
    ],
    approach: 'BSB controls segmentation. BRIM delivers the infrastructure that makes multi-charter, multi-jurisdiction reporting work without manual data assembly.',
    flag: 'OK'
  },

  { id:'C3', req:'How do you support data reporting for CFPB Terms of Credit Card Plan (TCCP) semiannual surveys?',
    frameNote: 'REFRAMED — prior answer positioned BRIM as the CFPB-regulated entity. Correct frame: BRIM enables BSB (the regulated party) to fulfill its TCCP obligation.',
    bullets: [
      'BRIM\'s platform captures and stores all data fields BSB needs to respond to CFPB TCCP semiannual surveys: APR tiers, fee structures, credit limits, and promotional terms — segmented by product and issuing entity',
      'BSB, as the regulated issuer, owns the TCCP filing obligation. BRIM provides the data infrastructure so BSB can compile and submit accurately',
      'In BSB\'s agent bank model, reporting segments by issuing institution — each client FI\'s data is isolated so BSB\'s own portfolio is separately reportable',
      'BRIM currently does this for CONTINENTAL BANK (US sponsor bank, ZOLVE program) — comparable CFPB obligations, live today',
    ],
    approach: 'BSB\'s compliance team pulls TCCP data from the Issuer Portal on its own reporting schedule. BRIM does not file on BSB\'s behalf — BRIM ensures the data is there, accurate, and structured correctly when BSB needs it.',
    flag: 'REFRAMED'
  },

  { id:'C4', req:'How do you support data reporting required by card schemes? How do you provide all reconciliation and settlement reports?',
    frameNote: null,
    bullets: [
      'BRIM generates all Mastercard network-mandated reports on BSB\'s behalf: transaction clearing files, interchange qualification reports, chargeback and dispute summaries, and network compliance metrics',
      'Daily reconciliation reports match authorizations to settlements, flag exceptions, and break out interchange fees and network assessments',
      'BSB receives a consolidated settlement view across all agent bank client FIs, with per-FI detail available on demand',
      'SFTP and API delivery to BSB\'s internal systems on a configurable daily or intraday schedule',
    ],
    approach: 'Scheme reporting is managed by BRIM operationally. BSB does not compile these files manually. This is standard production capability across all current BRIM bank partners.',
    flag: 'OK'
  },

  { id:'C5', req:'Describe the ability to customize reporting metrics and outputs. Describe processor involvement in customization.',
    frameNote: null,
    bullets: [
      'BSB customizes metrics, filters, date ranges, and output formats (CSV, PDF, API feed) directly in the Issuer Portal — no ticket to BRIM required for standard changes',
      'Complex custom reports (new calculated fields, cross-dataset joins) go through BRIM\'s change management process with a quoted timeline and no additional processor fees for standard scoping',
      'BSB\'s data teams can also call BRIM\'s reporting APIs directly and build custom views in their own BI environment',
    ],
    approach: 'The default is self-serve. BRIM involvement is only needed for reports that require data architecture changes. Both models are live today.',
    flag: 'OK'
  },

  { id:'C6', req:'How do you provide customizable dashboards per user and per role (application status, fraud queue, approvals, funding)?',
    frameNote: null,
    bullets: [
      'The Issuer Portal delivers role-based dashboards: a compliance officer sees OFAC flags and MLA alerts; a collections manager sees delinquency queues; a credit analyst sees the application pipeline; an executive sees portfolio P&L',
      'BSB\'s admins configure default layouts per role; individual users personalize within those defaults',
      'Dashboard cards update in real time — application status, fraud queue count, pending approvals, and funding pipeline are live, not batch-refreshed',
    ],
    approach: 'Role-based access and dashboards are a standard feature of BRIM\'s Issuer Portal, live across current bank partners. No custom build required for BSB.',
    flag: 'OK'
  },

  { id:'C7', req:'Describe all standard MIS reporting. Are there instances where only out-of-box reporting is available?',
    frameNote: null,
    bullets: [
      'BRIM delivers 50+ standard MIS reports covering: portfolio performance, delinquency aging, charge-off and recovery, interchange and fee income, transaction volume, activation rates, and credit bureau reporting summaries',
      'No BSB-relevant metric is locked to out-of-box only — every standard report is extensible with filters, custom fields, or API access to BSB\'s internal BI environment',
      'A complete report catalog is provided at onboarding with update cadences and delivery options documented',
    ],
    approach: 'Standard MIS is live today. Extensibility is built in by design — BSB is not dependent on BRIM to add a new column or filter.',
    flag: 'OK'
  },

  { id:'C8', req:'Can your solution feed data and documents to BSB\'s internal systems or document storage?',
    frameNote: null,
    bullets: [
      'Yes. BRIM\'s platform exposes 300+ REST APIs that push transaction data, account data, and documents (statements, adverse action notices, dispute correspondence) to BSB\'s internal systems on a configurable schedule',
      'SFTP file feeds support daily, intraday, or event-triggered delivery — compatible with core processors, data lakes, and document management systems',
      'Completed integrations with Fiserv First Data, Temenos T24, and i2c are live in production; Jack Henry integration methodology is proven for BSB\'s architecture',
    ],
    approach: 'BSB\'s internal data architecture stays in BSB\'s control. BRIM delivers data to wherever BSB needs it. API and SFTP integration is a standard production capability today.',
    flag: 'OK'
  },

  { id:'C9', req:'Do you provide full visibility into Mastercard DTI data elements (merchant URL, card-present indicators, EMV info)?',
    frameNote: null,
    bullets: [
      'Yes. BRIM captures Mastercard Digital Transaction Insights (DTI) data at the transaction level: merchant URL, legal merchant name, card-present/not-present indicator, EMV verification status, and token attributes',
      'All DTI fields are available in the Issuer Portal\'s transaction detail view and via API for downstream reporting — live today',
      'BSB\'s risk and compliance teams can use DTI data for dispute analysis, fraud investigation, and scheme compliance reporting without a data request to BRIM',
    ],
    approach: 'DTI data flows automatically from Mastercard into BRIM\'s platform. BSB accesses it directly. No additional integration required.',
    flag: 'OK'
  },

  { id:'C10', req:'Describe data retention options. Does the system keep all data indefinitely? Does it need to be manually purged?',
    frameNote: null,
    bullets: [
      'BRIM retains all transaction, account, and cardholder data for the full duration of the client relationship plus 7 years post-termination — consistent with card scheme and regulatory minimum requirements',
      'Retention is system-enforced; BSB does not run manual purge processes',
      'BSB can configure longer retention periods if internal policy or state law requires it',
      'Archived data remains fully queryable — never moved to an inaccessible tier',
      'Consumer deletion requests (CCPA) are supported through a controlled workflow accessible to BSB admins, with an audit trail',
    ],
    approach: 'Retention policy is set by BSB\'s compliance team and enforced by the platform. BRIM does not make retention decisions on BSB\'s behalf.',
    flag: 'OK'
  },

  { id:'C11', req:'How do you support analytics and reporting for acquisition campaigns?',
    frameNote: null,
    bullets: [
      'BRIM tracks acquisition campaigns from source (mail, digital, branch, pre-approved) through application, approval, activation, and first transaction — campaign metrics are available in the Issuer Portal within 24 hours of application receipt',
      'BSB assigns tracking codes and segments results by product, channel, and branch — available today, no custom build',
      'BSB\'s marketing team accesses campaign analytics directly; BRIM does not prepare custom reports for each campaign',
    ],
    approach: 'Campaign analytics is a standard reporting capability. BSB\'s marketing and compliance teams self-serve from the Issuer Portal.',
    flag: 'OK'
  },

  { id:'C12', req:'What support exists for A/B tests, holdouts, multivariate tests, and uplift measurement?',
    frameNote: null,
    bullets: [
      'BRIM\'s platform supports A/B test and holdout group design at the campaign level — BSB defines the test and control groups, and the platform tracks outcomes separately through the full acquisition funnel',
      'Randomization is configurable at the cardholder, household, business entity, branch cohort, or client FI level',
      'Results — response, approval, activation, early spend by cohort — are available in the Issuer Portal; no data extract request to BRIM required',
    ],
    approach: 'A/B and holdout testing is a built-in capability. BSB\'s marketing team runs and reads tests directly.',
    flag: 'OK'
  },

  { id:'C13', req:'Describe your ability to support BSB and client banks with Metro 2 files, CRA reporting, and regulatory reporting.',
    frameNote: 'REFRAMED — prior answer framed BRIM as generating files for itself. Correct frame: BRIM enables BSB and its client FIs to meet their own Metro 2 and CRA obligations.',
    bullets: [
      'BRIM generates Metro 2 credit bureau reporting files on behalf of BSB and each client FI, submitted monthly to Equifax, Experian, and TransUnion — all required fields, correctly coded to each institution\'s own subscriber code',
      'BSB\'s client FIs\' tradelines never appear under BRIM\'s identifier — each institution reports as the issuer it is',
      'CRA data (geographic distribution of credit by census tract) is captured at origination by BRIM\'s application workflow and available for BSB\'s CRA exam reports at any time — no manual assembly required',
      'e-OSCAR dispute processing handled within 30 days per FCRA; audit trail maintained',
    ],
    approach: 'BSB and its client FIs own their regulatory reporting obligations. BRIM\'s platform automates the data infrastructure so those obligations can be met accurately and on time. This is live today across current bank partners.',
    flag: 'REFRAMED'
  },

  { id:'C14', req:'Describe the ability to pull real-time compliance reports: queue reporting, fraud alerts, OFAC, MLA.',
    frameNote: null,
    bullets: [
      'BSB\'s compliance team pulls real-time reports from the Issuer Portal at any time: OFAC screening results, MLA/SCRA status, fraud alert queue items, and regulatory flag triggers — filterable by date range, flag status, and disposition',
      'OFAC queue shows match score, reviewer notes, and final disposition; MLA queue shows triggered accounts, rate adjustments applied, and benefit period end date',
      'All queue items are SLA-tracked; BSB configures escalation alerts for items aging past defined thresholds',
      'No ticket to BRIM required — BSB compliance officers access directly',
    ],
    approach: 'Compliance reporting is self-serve for BSB. BRIM provides the data and the tooling. BSB controls the review, escalation, and disposition process.',
    flag: 'OK'
  },

  { id:'C15', req:'Describe the ability to provide secondary review queues outside underwriting (fraud alert, OFAC, Reg O, business review, LOS overview).',
    frameNote: null,
    bullets: [
      'BRIM\'s platform includes configurable secondary review queues that operate outside the standard underwriting workflow — applications triggering OFAC hits, MLA flags, Reg O matches, fraud alerts, or business entity reviews route to a compliance queue before card issuance',
      'No card is issued until all queue conditions are cleared; this is system-enforced, not dependent on a manual process step',
      'BSB defines routing rules per flag type (e.g., Reg O items route to BSB\'s compliance team; OFAC items route to the BSA officer)',
      'Each queue shows SLA, reviewer identity, decision, and timestamp — full audit trail',
    ],
    approach: 'Queue design and routing is configured by BSB. BRIM enforces the holds. BSB\'s compliance team owns the review and disposition.',
    flag: 'OK'
  },

  { id:'C16', req:'Reg O: Can your solution identify and flag employee/director/officer applications?',
    frameNote: 'REFRAMED — Reg O is BSB\'s obligation as the issuer. BRIM\'s role is to give BSB the tools to enforce it.',
    bullets: [
      'BRIM\'s platform includes a Reg O identification step in the application workflow — applicants are checked against BSB\'s insider list (employees, directors, officers, and their related interests) at point of application',
      'BSB maintains and updates its own insider list through the Issuer Portal; changes take effect immediately for all new applications',
      'Reg O matches are flagged in the system and held in the compliance queue — no card issues until BSB\'s designated reviewer clears the flag',
      'The Reg O flag persists on the account for its full lifecycle, not just at origination',
    ],
    approach: 'Reg O compliance is BSB\'s obligation as the issuer. BRIM gives BSB the tools to enforce it consistently — across every channel, every application, every day. The insider list, the review queue, and the audit trail are all under BSB\'s direct control.',
    flag: 'REFRAMED'
  },

  { id:'C17', req:'Military Lending Status Verification: Can you identify if a customer is in the military and their current status?',
    frameNote: 'REFRAMED — MLA compliance is BSB\'s obligation as the creditor. BRIM gives BSB the tools to verify and manage it.',
    bullets: [
      'BRIM\'s platform queries the DoD DMDC (Defense Manpower Data Center) MLA database at every new application and runs periodic re-verification post-booking — automatically, without BSB staff initiating the check',
      'When SCRA eligibility is confirmed, BRIM\'s system executes the required account adjustments on BSB\'s behalf: APR cap at 6%, fee waivers, minimum payment recalculation, retroactive to the active-duty entry date',
      'Status changes (activation, discharge, reserve activation) trigger automatic re-evaluation and account updates',
      'BSB\'s compliance team sees MLA/SCRA status in real time in the Issuer Portal and in compliance reports',
    ],
    approach: 'MLA and SCRA compliance are BSB\'s obligations as the creditor. BRIM automates the verification and account treatment so BSB\'s compliance team does not manage this manually. This capability is live across current BRIM bank partners today.',
    flag: 'REFRAMED'
  },

  { id:'C18', req:'OFAC Screening: Do you have the ability to run through the bank\'s established OFAC process?',
    frameNote: null,
    bullets: [
      'Yes. BRIM\'s platform screens every applicant and existing cardholder through World-Check One (LSEG Refinitiv), covering OFAC SDN, UN, OFSI, EU, G7, and global sanctions lists',
      'Screening runs automatically at application, in daily batch re-screening of the full portfolio, and on any name or address change event',
      'Potential matches are surfaced to BSB\'s BSA/AML team in the compliance queue for review and final disposition — BRIM does not make the determination',
      'Authorization controls block transactions from sanctioned entities; every match is logged with an immutable audit trail',
    ],
    approach: 'OFAC compliance is BSB\'s obligation. BRIM provides the screening infrastructure and surfaces matches to the right BSB reviewers. BSB owns the final call. This is a standard, live capability — not a feature to be built.',
    flag: 'OK'
  },

  { id:'C19', req:'Describe how you monitor and remain compliant with CFPB requirements.',
    frameNote: 'REFRAMED — BRIM is not the CFPB-regulated issuer. The correct frame: BRIM monitors CFPB changes as a technology provider and updates the platform so BSB can remain compliant.',
    bullets: [
      'BRIM\'s Chief Regulatory Affairs Officer, Abraham Tachjian (reports directly to the CEO), tracks CFPB rulemaking, enforcement actions, and supervisory guidance on an ongoing basis',
      'When a CFPB rule change requires platform updates, BRIM implements those changes within required timelines and communicates the change to BSB with a clear effective date',
      'Platform controls enforce CFPB-driven requirements at the system level — Reg Z disclosures, adverse action notices, fee calculation rules — so BSB\'s compliance posture is not dependent on manual process controls',
      'BSB, as the card issuer, is the CFPB-regulated party. BRIM\'s role is to ensure the platform never becomes the reason BSB falls short of its CFPB obligations',
    ],
    approach: 'BRIM monitors regulatory changes proactively so BSB does not need to track every CFPB update and then determine what it means for the platform. The platform stays current. BSB stays compliant.',
    flag: 'REFRAMED'
  },

  { id:'C20', req:'Describe how credit card trades are reported to credit bureaus.',
    frameNote: 'REFRAMED — tradeline reporting is BSB\'s obligation as the issuing creditor. BRIM executes it on BSB\'s behalf.',
    bullets: [
      'BRIM generates and submits Metro 2 files on behalf of BSB and each client FI to Equifax, Experian, and TransUnion monthly — under each institution\'s own subscriber code, not BRIM\'s',
      'Reported fields: account open date, credit limit, current balance, 24-month payment history, and special comment codes (SCRA, bankruptcy, deceased, etc.)',
      'Automated QA checks validate file accuracy before submission; e-OSCAR handles FCRA disputes within 30 days',
      'BSB\'s compliance team reviews reporting status in the Issuer Portal and can pull audit records at any time',
    ],
    approach: 'Credit bureau reporting is BSB\'s obligation as the creditor. BRIM operationalizes it — BSB does not compile or submit files manually. This is live today across current BRIM bank partners.',
    flag: 'REFRAMED'
  },

  { id:'C21', req:'Describe how you support rate adjustments for SCRA.',
    frameNote: 'REFRAMED — SCRA compliance is BSB\'s obligation as the creditor. BRIM automates the account treatments on BSB\'s behalf.',
    bullets: [
      'When BRIM\'s platform confirms SCRA eligibility via DMDC, account adjustments execute automatically on BSB\'s behalf: APR reduced to 6% (or lower if existing rate is already below 6%), late/annual/over-limit fees waived, minimum payment recalculated',
      'Adjustments are retroactive to the active-duty entry date; interest accrued above 6% during any processing lag is credited back to the cardholder',
      'The system tracks the benefit period and restores original terms when eligibility ends — without BSB staff manually monitoring each affected account',
      'BSB can configure additional benefits beyond the statutory SCRA minimum if its own credit policy requires it',
    ],
    approach: 'SCRA compliance is BSB\'s obligation. BRIM automates every required account treatment so BSB\'s compliance team is not managing these adjustments case-by-case. Audit records for every adjustment are maintained and accessible to BSB.',
    flag: 'REFRAMED'
  },

  { id:'C22', req:'Describe audit logging for risk rule changes and communication changes. Can you provide a card control audit trail?',
    frameNote: null,
    bullets: [
      'Every change to risk rules, communication templates, or card controls is audit-logged with: user ID, name, role, timestamp, field changed, previous value, and new value',
      'Logs are immutable — no user, including BRIM administrators, can edit or delete them',
      'Retained 7+ years; BSB can search and export by date range, employee, change type, or affected account',
      'Card-level audit trail tracks every individual control change (credit limit, block/unblock, rate change) — searchable by card number, account number, or employee ID',
    ],
    approach: 'BSB\'s compliance and audit teams access logs directly — no data request to BRIM required. The audit trail is owned by BSB, not held by BRIM.',
    flag: 'OK'
  },

  { id:'C23', req:'Regulation B: Describe your ability to capture joint intent for co-applicants/co-borrowers in all applications.',
    frameNote: 'REFRAMED — Reg B is BSB\'s obligation as the creditor. BRIM\'s role is to give BSB an application workflow that captures joint intent correctly in every channel.',
    bullets: [
      'BRIM\'s application workflow presents the joint intent question before collecting any co-applicant data, across all channels: online self-service, in-branch via the Issuer Portal, and telephony via agent-assisted entry',
      'Joint intent is locked at submission and cannot be modified without generating a new application — maintaining a clean audit trail for BSB\'s Reg B compliance',
      'Adverse action notices are generated for both applicants with Reg B-compliant language — automatically, without BSB staff drafting each notice',
      'Joint intent data is accessible to BSB\'s compliance team at the account level and in audit reports',
    ],
    approach: 'Reg B joint intent capture is BSB\'s obligation. BRIM\'s platform enforces the workflow so no application — regardless of channel — bypasses it. BSB owns the policy; BRIM operationalizes the controls.',
    flag: 'REFRAMED'
  },

  { id:'C24', req:'Describe your ability to ensure compliance with state regulations for state-chartered credit unions and banks from different jurisdictions.',
    frameNote: 'REFRAMED — this is one of the questions Rasha specifically flagged. BRIM\'s value is enabling banks from any charter or jurisdiction to operate compliantly — not claiming BRIM itself is regulated under each state\'s rules.',
    bullets: [
      'BRIM\'s platform is designed to support bank issuers from any charter type — federal and state banks, federal and state credit unions — across multiple US jurisdictions simultaneously',
      'At onboarding for each institution, BRIM\'s compliance team maps that institution\'s applicable state regulations (rate caps, fee limits, disclosure requirements) to platform configuration — this has been done for Maine (BSB), and for institutions in other states in BRIM\'s current bank partner portfolio',
      'When state regulations change, BRIM\'s compliance team assesses the platform impact and updates configuration — BSB does not manage this tracking independently',
      'BSB\'s client FIs in other states receive the same treatment: BRIM maps each institution\'s jurisdiction and configures product parameters accordingly',
    ],
    approach: 'BRIM enables BSB to operate a multi-state, multi-charter agent bank program without needing BSB\'s compliance team to maintain a 50-state regulatory tracker. BRIM handles the mapping; BSB and each client FI retain their own regulatory obligations and credit policies.',
    flag: 'REFRAMED'
  },

  { id:'C25', req:'Describe marketing and solicitation channels and how you handle consumer opt-outs.',
    frameNote: null,
    bullets: [
      'BRIM gives BSB marketing and solicitation through email, SMS, push notification (mobile app), in-app messaging, and direct mail file generation — available today',
      'Consumer opt-out preferences are captured at the channel level: a cardholder can opt out of email while remaining opted in to mail',
      'Opt-outs are enforced system-wide — no marketing goes out to an opted-out cardholder regardless of which BSB team initiates the campaign',
      'Digital channel opt-outs take effect immediately; direct mail opt-outs honored within 10 business days',
    ],
    approach: 'BSB\'s marketing team manages campaigns through the Issuer Portal. Opt-out enforcement is automatic and system-wide. No manual suppression list management required.',
    flag: 'OK'
  },

  { id:'C26', req:'Describe your processes to comply with CAN-SPAM and TCPA.',
    frameNote: 'REFRAMED — CAN-SPAM and TCPA compliance are BSB\'s obligations as the sender/caller. BRIM\'s role is to enforce the controls on BSB\'s behalf.',
    bullets: [
      'BRIM\'s platform enforces CAN-SPAM requirements for every marketing email sent on BSB\'s behalf: functioning unsubscribe link, physical mailing address, accurate subject and header — automatically applied, no manual checklist for BSB staff',
      'For TCPA, the platform maintains Do Not Call lists and captures Prior Express Written Consent (PEWC) — with date, time, channel, and specific consent language — before any autodialed or pre-recorded outreach',
      'BSB controls the consent language in its application and onboarding flows; BRIM enforces it system-wide',
      'Opt-outs and suppression lists are maintained in the platform and honored across all outbound channels',
    ],
    approach: 'CAN-SPAM and TCPA compliance are BSB\'s obligations as the issuer and sender. BRIM builds the controls into the platform so BSB does not manage compliance through manual processes or spreadsheet suppression lists.',
    flag: 'REFRAMED'
  },

  { id:'C27', req:'Describe your ability to ensure compliance with state and Federal privacy laws protecting consumer data.',
    frameNote: 'REFRAMED — GLBA, CCPA, and state privacy obligations belong to BSB as the financial institution and data controller. BRIM\'s role is to provide the infrastructure that enables BSB to meet those obligations.',
    bullets: [
      'BRIM\'s platform is built to support BSB\'s GLBA, CCPA/CPRA, and state privacy law obligations: GLBA privacy notices are generated automatically at account opening and annually; CCPA data access, deletion, and opt-out-of-sale requests are supported within the 45-day window',
      'BSB\'s cardholder data is logically partitioned from other BRIM clients — BSB\'s data does not commingle with data from other institutions on the platform',
      'Consumer data is not sold or shared with third parties for marketing; sharing is limited to what is required for transaction processing (card networks) and regulatory obligations (credit bureaus, AML/OFAC vendors)',
      'Platform security: AES-256 encryption at rest, TLS 1.2+ in transit, role-based access controls, data masking for PII — SOC 2 Type II certified',
    ],
    approach: 'BSB is the data controller and the regulated party under GLBA and state privacy law. BRIM provides the platform controls that make it operationally feasible for BSB to meet those obligations at scale — across its own portfolio and across its agent bank client FIs.',
    flag: 'REFRAMED'
  },

  { id:'C28', req:'Describe your issue management and remediation process.',
    frameNote: null,
    bullets: [
      'BRIM uses a formal issue management lifecycle: identification → severity classification (critical, high, medium, low) → root cause analysis → owner assignment → remediation → implementation → validation → closure',
      'Critical issues: BSB is notified within 1 hour; a dedicated incident team is activated',
      'BSB has real-time visibility into all open issues through the Issuer Portal — issue status, owner, remediation timeline, and history are accessible without contacting BRIM directly',
      'Compliance-related issues follow the same lifecycle, with regulatory escalation triggers built in for issues that could affect BSB\'s regulatory reporting or operational compliance',
    ],
    approach: 'Issue management is a collaborative process. BRIM runs it; BSB has full visibility. No issue affecting BSB goes unresolved without BSB knowing its status.',
    flag: 'OK'
  },

  { id:'C29', req:'Is there a set of policies and procedures for logging, tracking, and reporting compliance issues to management?',
    frameNote: null,
    bullets: [
      'Yes. BRIM maintains documented policies and procedures covering compliance issue logging, tracking, escalation, and management reporting',
      'Compliance metrics — open issues, aging, remediation timelines — are reported to BRIM management monthly and to the board quarterly',
      'Board-approved AML policy is reviewed annually; a whistleblower policy provides a confidential reporting channel',
      'These documents are available to BSB for review under NDA and will be provided as part of the appendix package',
    ],
    approach: 'BSB\'s regulators and risk team will want to see that BRIM has a compliance management system with real governance, not just policies on paper. These documents exist today and are ready for BSB\'s due diligence review.',
    flag: 'OK'
  },

];

// ── Framing summary table ─────────────────────────────────────────────────────
function buildFrameTable() {
  const reframed = questions.filter(q => q.flag === 'REFRAMED');
  const ok = questions.filter(q => q.flag === 'OK');
  const COL = [1200, 5800, 2360];
  return new Table({
    width: { size: 9360, type: WidthType.DXA }, columnWidths: COL,
    rows: [
      new TableRow({ children: [
        hdrCell('Q#', COL[0], NAVY),
        hdrCell('Question Topic', COL[1], NAVY),
        hdrCell('Framing Action', COL[2], NAVY),
      ]}),
      ...questions.map((q, i) => new TableRow({ children: [
        cell(q.id, COL[0], i%2===0?WHITE:LIGHT_GRAY, NAVY, true),
        cell(q.req.substring(0,100)+(q.req.length>100?'…':''), COL[1], i%2===0?WHITE:LIGHT_GRAY),
        cell(q.flag, COL[2],
          q.flag==='REFRAMED' ? LIGHT_RED : LIGHT_GREEN,
          q.flag==='REFRAMED' ? RED : GREEN, true),
      ]}))
    ]
  });
}

// ── Build full doc content ────────────────────────────────────────────────────
function buildContent() {
  const c = [];

  // Title
  c.push(new Paragraph({
    children: [t('BSB RFP — Compliance Questions: Reframed', { size:36, bold:true, color:WHITE })],
    alignment: AlignmentType.CENTER,
    shading: { fill:NAVY, type:ShadingType.CLEAR },
    spacing: { before:120, after:60 },
    indent: { left:120, right:120 }
  }));
  c.push(new Paragraph({
    children: [t('Using Rasha\'s Framework: BRIM Enables. BSB Owns Compliance.', { size:22, bold:false, color:WHITE })],
    alignment: AlignmentType.CENTER,
    shading: { fill:NAVY, type:ShadingType.CLEAR },
    spacing: { before:0, after:60 },
    indent: { left:120, right:120 }
  }));
  c.push(new Paragraph({
    children: [
      t('Tarique Khan, BRIM Financial  |  April 6, 2026  |  ', { size:18, color:'555555' }),
      t('Deadline: April 10, 2026', { size:18, color:RED, bold:true }),
    ],
    alignment: AlignmentType.CENTER,
    spacing: { before:120, after:120 }
  }));

  // Rasha's directives box
  c.push(h1('RASHA\'S DIRECTIVES — FRAMING RULES FOR EVERY ANSWER'));
  c.push(spacer(80));

  c.push(callout(
    'DIRECTIVE 1: BRIM is a technology and services provider. BSB is the regulated issuer. BRIM does not own compliance — BRIM enables BSB to meet its own regulatory obligations.',
    LIGHT_BLUE, TEAL, TEAL
  ));
  c.push(spacer(60));
  c.push(callout(
    'DIRECTIVE 2: Every answer must reflect what BRIM currently does — not "tell us what you need and we can support you." Open-ended positioning signals no existing capability. BSB\'s evaluators will move on.',
    LIGHT_GREEN, GREEN, '70AD47'
  ));
  c.push(spacer(60));
  c.push(callout(
    'DIRECTIVE 3: Use "BRIM enables BSB to..." framing. Not "BRIM complies with..." or "BRIM is subject to..." BSB\'s credit policies and charter obligations are BSB\'s. BRIM gives BSB the tools to fulfill them.',
    LIGHT_YELLOW, ORANGE, 'FFD966'
  ));
  c.push(spacer(60));
  c.push(callout(
    'AVOID THE WEBSTER TRAP: The Webster RFP had BRIM answering as if BRIM\'s products are directly subject to ECOA, MLA, Fair Lending, etc. That framing was wrong. Bangor is asking: "Can you support banks from different jurisdictions and charters doing these things?" The answer is yes — here is how BRIM currently does it.',
    LIGHT_RED, RED, 'FFAAAA'
  ));

  // Reframing map
  c.push(spacer(120));
  c.push(h1('FRAMING STATUS — ALL 29 COMPLIANCE QUESTIONS'));
  c.push(spacer(80));
  c.push(p([
    t(`${questions.filter(q=>q.flag==='REFRAMED').length} questions reframed (wrong posture in prior draft)  |  `, { size:19, color:RED, bold:true }),
    t(`${questions.filter(q=>q.flag==='OK').length} questions framing already correct`, { size:19, color:GREEN, bold:true }),
  ], { before:0, after:80 }));
  c.push(buildFrameTable());

  // The 29 answers
  c.push(new Paragraph({ children:[new PageBreak()] }));
  c.push(h1('ALL 29 COMPLIANCE QUESTIONS — REFRAMED ANSWERS'));

  questions.forEach((q, i) => {
    c.push(h2(`${q.id} — ${q.req}`));

    if (q.frameNote) {
      c.push(callout(`FRAMING NOTE: ${q.frameNote}`, LIGHT_RED, RED, 'FFAAAA'));
      c.push(spacer(40));
    }

    c.push(p([t('BRIM\'s Answer (Bullet — for matrix):', { bold:true, color:NAVY })], { before:60, after:30 }));
    q.bullets.forEach(b => c.push(bullet(b)));

    c.push(spacer(40));
    c.push(p([t('BRIM\'s Approach (for narrative/paragraph field):', { bold:true, color:GREEN })], { before:40, after:30 }));
    c.push(new Table({
      width:{ size:9360, type:WidthType.DXA }, columnWidths:[9360],
      rows:[new TableRow({ children:[new TableCell({
        borders:allBorders('70AD47'),
        shading:{ fill:LIGHT_GREEN, type:ShadingType.CLEAR },
        margins:{ top:80, bottom:80, left:140, right:140 },
        width:{ size:9360, type:WidthType.DXA },
        children:[p([t(q.approach, { size:19, color:'374c1a' })])]
      })]})]
    }));

    c.push(spacer(80));
  });

  // Quick cheat sheet
  c.push(new Paragraph({ children:[new PageBreak()] }));
  c.push(h1('QUICK REFERENCE — LANGUAGE CHEAT SHEET'));
  c.push(spacer(80));

  const cheatData = [
    ['WRONG — Do not use', 'RIGHT — Use instead'],
    ['"BRIM complies with CFPB requirements"', '"BRIM\'s platform is updated to reflect CFPB rule changes so BSB can remain compliant"'],
    ['"BRIM verifies military status"', '"BRIM\'s platform enables BSB to verify military status automatically at application via DMDC"'],
    ['"BRIM\'s data handling complies with GLBA"', '"BRIM\'s platform enables BSB to meet its GLBA obligations — privacy notices, data controls, and audit trails are built in"'],
    ['"BRIM captures joint intent per Reg B"', '"BRIM\'s application workflow gives BSB a Reg B-compliant joint intent capture process across all channels"'],
    ['"BRIM is subject to CAN-SPAM and TCPA"', '"BRIM enforces CAN-SPAM and TCPA controls on BSB\'s behalf — unsubscribes, PEWC capture, DNC lists"'],
    ['"Tell us what you need and we can support it"', '"BRIM currently does this — [specific feature/capability in production today]"'],
    ['"We can build / we can configure / we can work with you"', '"This is live today / in production across current bank partners / available out of the box"'],
    ['"BRIM ensures compliance with [regulation]"', '"BRIM enables BSB to fulfill its [regulation] obligations through [specific built capability]"'],
  ];

  const CCOL = [4200, 5160];
  c.push(new Table({
    width:{ size:9360, type:WidthType.DXA }, columnWidths:CCOL,
    rows: cheatData.map((row, i) => new TableRow({ children:[
      cell(row[0], CCOL[0], i===0?RED:i%2===0?'FFE0E0':LIGHT_RED, i===0?WHITE:RED, i===0),
      cell(row[1], CCOL[1], i===0?GREEN:i%2===0?LIGHT_GREEN:'D6EAC8', i===0?WHITE:GREEN, i===0),
    ]}))
  }));

  c.push(spacer(120));
  c.push(new Paragraph({
    children:[t('Internal use only — April 6, 2026. Apply this framing to rfp_data.json bullet and paragraph fields before April 10 submission.', { size:16, italic:true, color:'888888' })],
    alignment: AlignmentType.CENTER,
    border:{ top:{ style:BorderStyle.SINGLE, size:2, color:'CCCCCC' } },
    spacing:{ before:80, after:80 }
  }));

  return c;
}

async function main() {
  const doc = new Document({
    numbering: { config:[{ reference:'bullets', levels:[
      { level:0, format:LevelFormat.BULLET, text:'\u2022', alignment:AlignmentType.LEFT,
        style:{ paragraph:{ indent:{ left:480, hanging:240 } } } },
      { level:1, format:LevelFormat.BULLET, text:'\u2013', alignment:AlignmentType.LEFT,
        style:{ paragraph:{ indent:{ left:960, hanging:240 } } } },
    ]}]},
    styles:{
      default:{ document:{ run:{ font:'Arial', size:20, color:'000000' } } },
      paragraphStyles:[
        { id:'Heading1', name:'Heading 1', basedOn:'Normal', next:'Normal', quickFormat:true,
          run:{ size:26, bold:true, font:'Arial', color:WHITE },
          paragraph:{ spacing:{ before:200, after:100 }, outlineLevel:0 } },
        { id:'Heading2', name:'Heading 2', basedOn:'Normal', next:'Normal', quickFormat:true,
          run:{ size:22, bold:true, font:'Arial', color:NAVY },
          paragraph:{ spacing:{ before:180, after:60 }, outlineLevel:1 } },
      ]
    },
    sections:[{
      properties:{ page:{ size:{ width:12240, height:15840 }, margin:{ top:1080, right:1080, bottom:1080, left:1080 } } },
      headers:{ default: new Header({ children:[new Paragraph({
        children:[t('BSB RFP — Compliance Questions Reframed  |  BRIM Financial  |  Rasha\'s Framework Applied  |  INTERNAL', { size:16, color:'888888', italic:true })],
        alignment:AlignmentType.CENTER,
        border:{ bottom:{ style:BorderStyle.SINGLE, size:2, color:'CCCCCC' } },
        spacing:{ after:60 }
      })]})},
      footers:{ default: new Footer({ children:[new Paragraph({
        children:[
          t('April 6, 2026  |  Deadline: April 10, 2026  |  Page ', { size:16, color:'888888' }),
          new TextRun({ children:[PageNumber.CURRENT], font:'Arial', size:16, color:'888888' }),
          t(' of ', { size:16, color:'888888' }),
          new TextRun({ children:[PageNumber.TOTAL_PAGES], font:'Arial', size:16, color:'888888' }),
        ],
        alignment:AlignmentType.CENTER,
        border:{ top:{ style:BorderStyle.SINGLE, size:2, color:'CCCCCC' } },
        spacing:{ before:60 }
      })]})},
      children: buildContent()
    }]
  });

  const buffer = await Packer.toBuffer(doc);
  fs.writeFileSync(OUTPUT, buffer);
  console.log('Written:', OUTPUT);
}

main().catch(err => { console.error(err); process.exit(1); });
