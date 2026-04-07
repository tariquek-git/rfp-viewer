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

const DATA_PATH = path.join(__dirname, '../public/rfp_data.json');
const OUTPUT = path.join(os.homedir(), 'Desktop', 'BSB_Compliance_Paragraphs_BRIM_2026-04-06.docx');

// ── Colours ───────────────────────────────────────────────────────────────────
const NAVY='1F3864', TEAL='2E75B6', GREEN='375623', ORANGE='7D4200';
const LIGHT_BLUE='D5E8F0', LIGHT_GREEN='E2EFDA', LIGHT_YELLOW='FFF2CC';
const LIGHT_RED='FFE0E0', LIGHT_GRAY='F5F5F5', WHITE='FFFFFF', RED='C00000';
const MID_GRAY='DDDDDD';

// ── Helpers ───────────────────────────────────────────────────────────────────
const thin = (c='BBBBBB') => ({ style:BorderStyle.SINGLE, size:1, color:c });
const allB = (c='BBBBBB') => ({ top:thin(c), bottom:thin(c), left:thin(c), right:thin(c) });
const noB  = () => ({ style:BorderStyle.NONE, size:0, color:'FFFFFF' });
const noBS = () => ({ top:noB(), bottom:noB(), left:noB(), right:noB() });

const t = (text, o={}) => new TextRun({ text:String(text||''), font:'Arial', size:o.size||20, bold:o.bold, italic:o.italic, color:o.color||'000000', ...o });
const p = (children, o={}) => new Paragraph({ children:Array.isArray(children)?children:[children], spacing:{ before:o.before??60, after:o.after??60 }, alignment:o.align||AlignmentType.LEFT, ...o });
const spacer = (b=80) => p([t('')],{before:b,after:0});

const h1 = (text) => new Paragraph({
  heading:HeadingLevel.HEADING_1,
  children:[new TextRun({ text, font:'Arial', size:26, bold:true, color:WHITE })],
  spacing:{ before:200, after:100 },
  shading:{ fill:NAVY, type:ShadingType.CLEAR },
  indent:{ left:120, right:120 }
});

const h2 = (text, color=NAVY) => new Paragraph({
  heading:HeadingLevel.HEADING_2,
  children:[new TextRun({ text, font:'Arial', size:22, bold:true, color })],
  spacing:{ before:160, after:60 },
  border:{ bottom:{ style:BorderStyle.SINGLE, size:3, color:TEAL } }
});

const label = (text, color=NAVY) => p([t(text, { bold:true, color, size:18 })], { before:80, after:30 });

const textBox = (text, fill, textColor, borderColor) => new Table({
  width:{ size:9360, type:WidthType.DXA }, columnWidths:[9360],
  rows:[new TableRow({ children:[new TableCell({
    borders:allB(borderColor||fill),
    shading:{ fill, type:ShadingType.CLEAR },
    margins:{ top:100, bottom:100, left:160, right:160 },
    width:{ size:9360, type:WidthType.DXA },
    children:[p([t(text, { size:19, color:textColor })])]
  })]})]
});

const twoCol = (left, right, leftFill, rightFill) => new Table({
  width:{ size:9360, type:WidthType.DXA }, columnWidths:[4600, 4760],
  rows:[new TableRow({ children:[
    new TableCell({
      borders:allB('DDDDDD'), shading:{ fill:leftFill, type:ShadingType.CLEAR },
      margins:{ top:80, bottom:80, left:120, right:120 },
      width:{ size:4600, type:WidthType.DXA },
      children:[
        p([t('BEFORE', { bold:true, size:17, color:'888888' })],{ before:0, after:40 }),
        p([t(left, { size:18, color:'555555', italic:true })],{ before:0, after:0 })
      ]
    }),
    new TableCell({
      borders:allB('70AD47'), shading:{ fill:rightFill, type:ShadingType.CLEAR },
      margins:{ top:80, bottom:80, left:120, right:120 },
      width:{ size:4760, type:WidthType.DXA },
      children:[
        p([t('AFTER (Rasha\'s Framework)', { bold:true, size:17, color:GREEN })],{ before:0, after:40 }),
        p([t(right, { size:18, color:'1A3D0A' })],{ before:0, after:0 })
      ]
    }),
  ]})]
});

// ── THE 29 REWRITTEN PARAGRAPHS ───────────────────────────────────────────────
// reframed: true = posture was wrong, needs update in JSON
const rewrites = [

{ id:'C1', req:'Consumer/business data analysis tools',
  reframed: false,
  old: `BRIM's Issuer Portal gives BSB real-time access to customer profiles — individual, household, and business entity/UBO — along with spending pattern analytics segmented by MCC, merchant, and product type. Acquisition channel attribution tracks each application from source (branch, digital, mail, partner) through approval and first use. App interaction analytics and frontline feedback routing are built into the platform. MANULIFE and AFFINITY CREDIT UNION use these analytics tools in production.`,
  new: `BRIM gives BSB real-time data tools through the Issuer Portal so BSB's credit, risk, and compliance teams can do their own analysis without requesting data from BRIM. Customer profiles — individual, household, and business entity/UBO — spending patterns by MCC and merchant, product utilization, and acquisition channel attribution from source through first use are all accessible directly. BSB controls the analysis; BRIM provides the infrastructure.

MANULIFE BANK and AFFINITY CREDIT UNION run these analytics tools in production today across consumer and business portfolios.`
},

{ id:'C2', req:'Report segmentation by consumer/business, region, BIN, credit office',
  reframed: false,
  old: `Every report in BRIM's platform can be segmented by consumer vs. Business, product type, BIN/BIN-range, region, credit office, and client FI. In BSB's agent bank model, the Golden Copy architecture automatically partitions data so each participating institution sees only its own portfolio, while BSB sees the consolidated view. Spend insight reports — MCC breakdown, transaction volume, activation rates — are available in real time through the Issuer Portal and exportable via CSV, PDF, or API.\n\nMANULIFE BANK and AFFINITY CREDIT UNION both run segmented reporting across consumer and business portfolios today.`,
  new: `Every report in the Issuer Portal segments by consumer vs. business (micro, small/medium, commercial), BIN/BIN-range, region, credit office, card product, and origination channel — today, without custom development. In BSB's agent bank model, BRIM's Golden Copy architecture automatically partitions data by institution: each client FI sees only its own portfolio, BSB sees the consolidated view across all of them. BSB's compliance and credit teams self-serve this data without submitting report requests to BRIM.

MANULIFE BANK and AFFINITY CREDIT UNION run segmented reporting across consumer and business portfolios through this infrastructure in production.`
},

{ id:'C3', req:'CFPB TCCP semiannual survey reporting',
  reframed: true,
  old: `BRIM's reporting engine captures the data fields needed for CFPB TCCP semiannual surveys. APR tiers, fee structures, credit limits, promotional terms. All segmentable by product and issuing entity. For BSB's agent bank model, this means each client FI's metrics are isolated for accurate filing. CONTINENTAL BANK, BRIM's live US sponsor bank client for the ZOLVE program, operates under a comparable multi-party reporting structure. During onboarding, BRIM's compliance team maps TCCP field requirements to platform data elements and validates extract formats before the first filing cycle.\n\nZOLVE/CONTINENTAL BANK runs CFPB-compliant data reporting in the US market through this infrastructure today.`,
  new: `BSB, as the card issuer, owns the obligation to respond to CFPB TCCP semiannual surveys. BRIM gives BSB the data infrastructure to fulfill that obligation accurately and on time. The platform captures and maintains all required TCCP data fields — APR tiers, fee structures, credit limits, promotional terms — segmented by product and issuing entity. For BSB's agent bank model, each client FI's metrics are isolated so BSB's own portfolio is separately reportable. During onboarding, BRIM's compliance team maps TCCP field requirements to platform data elements and validates extract formats before BSB's first filing cycle.

ZOLVE/CONTINENTAL BANK uses this same infrastructure to support CFPB data reporting obligations in the live US program today. BRIM does not file on BSB's behalf — BRIM ensures the data is accurate, structured, and accessible when BSB needs it.`
},

{ id:'C4', req:'Card scheme regulatory reporting, reconciliation and settlement',
  reframed: false,
  old: `BRIM processes on the Mastercard network via BRIM's payment processor and produces all scheme-mandated reports — clearing files, interchange qualification, chargeback summaries, and network compliance metrics. Daily reconciliation reports match authorizations to settlements, flag exceptions, and break out interchange fees and network assessments. BSB gets a consolidated settlement view across all agent bank client FIs, with drill-down to individual institution and BIN level. As MANULIFE demonstrates across its 13 product programs, BSB gets a consolidated settlement view across all agent bank partner FIs, with drill-down to individual institution and BIN level.`,
  new: `BRIM generates all Mastercard network-mandated reports on BSB's behalf — clearing files, interchange qualification, chargeback summaries, and network compliance metrics — delivered on the scheme's required schedule. Daily reconciliation reports match authorizations to settlements, flag exceptions, and break out interchange fees and network assessments. BSB receives a consolidated settlement view across all agent bank client FIs, with drill-down to individual institution and BIN level. BRIM manages the relationship with the network and the processor; BSB accesses the outputs directly through the Issuer Portal or via SFTP feed to its own systems.

MANULIFE BANK runs consolidated scheme reporting across 13 card programs through this same infrastructure in production.`
},

{ id:'C5', req:'Customizable reporting metrics and outputs, processor involvement',
  reframed: false,
  old: `BSB can customize reporting metrics, filters, date ranges, and output formats directly in the Issuer Portal — no development request needed for standard changes like adding columns or applying filters. For more complex custom reports involving new calculated fields or cross-dataset joins, BRIM's analytics team scopes the work through the standard change management process with a clear timeline and cost estimate. Typical turnaround is 2-4 weeks. MANULIFE and UNI FINANCIAL both run customized report configurations built for their portfolio structures.\n\nNote: Pre-built regulatory reports (OFAC screening, Metro 2 files, CFPB data submissions, and network settlement reports) are generated on mandatory regulatory timelines — these run independently of the custom report development queue and are not subject to the 2-4 week window.`,
  new: `BSB's reporting team customizes metrics, filters, date ranges, and output formats (CSV, PDF, API feed) directly in the Issuer Portal without submitting a development request to BRIM. Standard changes — adding a column, applying a new filter, changing a date range — require no processor involvement. For more complex custom reports requiring new calculated fields or cross-dataset joins, BRIM's analytics team scopes the work through standard change management with a clear timeline and cost estimate; typical turnaround is two to four weeks.

Regulatory reports — OFAC screening, Metro 2 files, CFPB data exports, and network settlement — run on mandatory schedules independently of the custom report queue and are never delayed by other development work. MANULIFE BANK and UNI FINANCIAL both run custom report configurations built for their portfolio structures today.`
},

{ id:'C6', req:'Customizable dashboards per user and per role',
  reframed: false,
  old: `BRIM's Issuer Portal delivers role-based dashboards where a collections manager sees delinquency queues, a compliance officer sees OFAC and MLA flags, and an executive sees portfolio P&L. Dashboard cards — application status, fraud queue, approvals, funding — are configurable per user and update in real time. BSB admins define default layouts per role, and individual users can personalize from that baseline without affecting others' views.\n\nMANULIFE BANK's 55,000 advisors and AFFINITY CREDIT UNION member service teams each use role-specific dashboards on this platform.`,
  new: `The Issuer Portal delivers role-based dashboards that give each BSB team member exactly the data relevant to their function. A compliance officer sees OFAC flags and MLA alerts. A collections manager sees delinquency queues and contact rates. A credit analyst sees the application pipeline. An executive sees portfolio P&L. Dashboard cards — application status, fraud queue, pending approvals, funding — update in real time and are configurable per user. BSB's admins define default layouts per role; individual users personalize within those defaults without affecting others.

MANULIFE BANK and AFFINITY CREDIT UNION run role-specific dashboards for their teams through this platform in production today.`
},

{ id:'C7', req:'Standard MIS reporting — 50+ reports, out-of-box availability',
  reframed: false,
  old: `BRIM delivers 50+ standard MIS reports out-of-box: portfolio performance, delinquency aging, charge-off/recovery, interchange and fee income, transaction volume, activation rates, and bureau reporting summaries. BSB is never limited to only standard reporting — every report can be extended with filters, segments, or custom fields, and full API access allows feeds into BSB's internal BI tools. A complete report catalog with field definitions and sample output is provided during onboarding.\n\nMANULIFE BANK, AFFINITY CREDIT UNION, and ZOLVE all receive standard MIS packages from this reporting layer in production.`,
  new: `BRIM delivers 50+ standard MIS reports out-of-box covering portfolio performance, delinquency aging, charge-off and recovery, interchange and fee income, transaction volume, activation rates, and credit bureau reporting summaries. BSB's teams access these directly in the Issuer Portal on day one — no configuration required. BSB is never limited to standard reports: every report is extensible with filters, custom fields, or API feeds into BSB's internal BI environment. A complete catalog with field definitions and sample outputs is delivered during onboarding.

MANULIFE BANK, AFFINITY CREDIT UNION, and ZOLVE all receive standard MIS packages from this reporting layer in production today.`
},

{ id:'C8', req:'Data and document feeds to BSB\'s internal systems',
  reframed: false,
  old: `BRIM exposes 300+ REST APIs and supports SFTP file feeds to push transaction data, account data, and documents (statements, adverse action notices, dispute correspondence) into BSB's internal systems on configurable schedules. For the agent bank model, feeds are partitioned by client FI. BRIM has completed core integrations with Fiserv (First Data), Temenos T24, and i2c, and Jack Henry integration uses the same methodology as BRIM's completed Fiserv and i2c integrations.\n\nMANULIFE BANK's Fiserv integration and ZOLVE's CONTINENTAL BANK connection were both built using this same data feed architecture.`,
  new: `BSB's internal systems — core processor, data lake, document management — stay under BSB's control. BRIM delivers data to wherever BSB needs it through 300+ REST APIs and configurable SFTP file feeds, pushing transaction data, account data, and documents (statements, adverse action notices, dispute correspondence) on daily, intraday, or event-triggered schedules. Feeds are partitioned by client FI so each institution in BSB's agent bank program receives only its own data.

BRIM has completed production integrations with Fiserv First Data, Temenos T24, and i2c. Jack Henry integration for BSB uses the same proven methodology. MANULIFE BANK's Fiserv connection and ZOLVE/CONTINENTAL BANK's core integration were both built and are running on this architecture today.`
},

{ id:'C9', req:'Mastercard DTI data elements visibility',
  reframed: false,
  old: `BRIM ingests Mastercard Digital Transaction Insights (DTI) data as part of standard authorization and clearing. Merchant URL, card-present/card-not-present indicators, EMV verification status, and token attributes are captured at the transaction level. Live and accessible today.\nBSB accesses these fields in the Issuer Portal's transaction detail view (click any transaction) and via API for downstream analytics, data warehouse integration, and fraud rule feeds. Use cases include fraud rule configuration (flag CNP from unknown URLs, detect entry method anomalies), spending analytics (segment behavior by channel. Device), and dispute investigation (EMV and entry method data for representment). New DTI data elements are incorporated as Mastercard releases them through standard platform updates. BSB gets them automatically. This data is live in production for BRIM's existing programs, including the ZOLVE/CONTINENTAL BANK US deployment on the Mastercard network.\n\nMANULIFE BANK and CONTINENTAL BANK both access Mastercard network data through this infrastructure today.`,
  new: `BRIM captures Mastercard DTI data at the transaction level as part of standard authorization and clearing — merchant URL, card-present/not-present indicator, EMV verification status, and token attributes are available immediately. BSB's teams access these fields directly in the Issuer Portal's transaction detail view and via API for downstream fraud rules, analytics, and dispute investigation. No data request to BRIM is required. When Mastercard releases new DTI elements, they are incorporated through standard platform updates and available to BSB automatically.

MANULIFE BANK and ZOLVE/CONTINENTAL BANK both access Mastercard network data through this infrastructure today.`
},

{ id:'C10', req:'Data retention options — indefinite, auto, manual purge',
  reframed: false,
  old: `BRIM retains all data for the full client relationship plus 7 years post-termination. No manual purging is needed — retention policies are system-enforced and configurable per data category. BSB can set longer retention periods if internal policy requires it. Archived data stays queryable and is never moved to an inaccessible tier. Consumer deletion requests under CCPA are handled through a controlled process with full audit logging.\n\nMANULIFE BANK and AFFINITY CREDIT UNION both operate under this data retention framework in production.`,
  new: `BRIM retains all transaction, account, and cardholder data for the full client relationship plus seven years post-termination — consistent with card scheme requirements and federal regulatory minimums. Retention is system-enforced; BSB's compliance team does not manage purge processes manually. BSB can configure longer retention periods if state law or internal policy requires it. Archived data remains fully queryable — it is never moved to an inaccessible tier. Consumer deletion requests under CCPA are processed through a controlled workflow with audit logging, accessible to BSB's compliance admins.

MANULIFE BANK and AFFINITY CREDIT UNION both operate under this retention framework in production today.`
},

{ id:'C11', req:'Analytics and reporting for acquisition campaigns',
  reframed: false,
  old: `BRIM tracks acquisition campaigns from source (mail, digital, branch, pre-approved) through application, approval, activation, and first use. Campaign metrics — response rate, approval rate, activation rate, time-to-first-use, average credit line — are visible in the Issuer Portal within 24 hours of application, not just at campaign close. BSB assigns tracking codes and segments results by product, geography, client FI, and customer segment.\n\nMANULIFE BANK and AFFINITY CREDIT UNION both run acquisition campaign analytics through this module today.`,
  new: `BRIM gives BSB's marketing and analytics teams end-to-end acquisition campaign visibility in the Issuer Portal — from source (mail, digital, branch, pre-approved offer) through application, approval, activation, and first transaction. Campaign metrics — response rate, approval rate, activation rate, time-to-first-use, average credit line — are available within 24 hours of application receipt, not just at campaign close. BSB assigns tracking codes and segments results by product, channel, geography, and client FI without requesting data from BRIM.

MANULIFE BANK and AFFINITY CREDIT UNION run acquisition campaign analytics through this module in production today.`
},

{ id:'C12', req:'A/B tests, holdouts, multivariate tests, uplift measurement',
  reframed: false,
  old: `BRIM gives BSB A/B tests, holdout groups, and multivariate testing across direct mail, digital, and branch channels. BSB defines test and control groups, and the platform tracks each cohort through the full funnel. Response, approval, activation, early spend. Randomization can be set at the cardholder, household, business entity, branch cohort, or client FI level. Results are available in the Issuer Portal and exportable for deeper statistical analysis in BSB's own tools. This reporting capability is in production at AFFINITY CREDIT UNION. BRIM maintains\n\nBRIM maintains full audit trails on all A/B test configurations, group assignments, and result data for BSB's compliance record-keeping.`,
  new: `BRIM gives BSB a built-in A/B testing and holdout group framework so BSB's marketing team can measure what actually works — across direct mail, digital, and branch channels — without building a separate analytics environment. BSB defines test and control groups; BRIM's platform tracks each cohort through the full acquisition funnel from response through activation and early spend. Randomization is configurable at the cardholder, household, business entity, branch cohort, or client FI level. Results are available directly in the Issuer Portal and exportable for deeper statistical work in BSB's own tools. All test configurations, group assignments, and result data are audit-logged for BSB's compliance and regulatory record-keeping.

AFFINITY CREDIT UNION runs A/B testing through this capability in production today.`
},

{ id:'C13', req:'Metro 2 files, CRA reporting, regulatory reporting obligations',
  reframed: true,
  old: `BRIM generates Metro 2 files monthly to Equifax, Experian, and TransUnion with all required fields — account status, payment history, credit limit, balance, past-due amounts. For BSB's agent bank model, files are generated per issuing institution so each client FI's tradelines report under its own identifier. CRA data collection is built into the application workflow, and e-OSCAR disputes are resolved within required timelines. Credit union-specific reporting needs are handled through the same configurable framework.\n\nMANULIFE BANK operates under Canadian OSFI/FINTRAC requirements and ZOLVE/CONTINENTAL BANK under US OCC/FDIC requirements — both use this same compliance support framework.`,
  new: `BSB and each of its client FIs own their credit bureau reporting obligations. BRIM operationalizes those obligations: Metro 2 files are generated monthly and submitted to Equifax, Experian, and TransUnion on each institution's behalf — under that institution's own subscriber code, not BRIM's. Tradelines for BSB's client FIs never commingle with BSB's own reporting. CRA data — geographic distribution of credit by census tract — is captured by BRIM's application workflow at origination and available for BSB's CRA examination reports at any time without a manual data extract. e-OSCAR disputes are processed within FCRA-required timelines.

ZOLVE/CONTINENTAL BANK reports US tradelines through this infrastructure today. Each institution's reporting is independent and correctly coded to its own identity as the creditor.`
},

{ id:'C14', req:'Real-time compliance reports: OFAC, MLA, fraud alerts, queue reporting',
  reframed: false,
  old: `BSB can pull real-time compliance reports from the Issuer Portal covering OFAC hits (screened via World-Check One against global sanctions lists), MLA/SCRA verifications, and fraud alert queue items — all filterable by date range, status, and disposition. Every OFAC match is logged with score, reviewer notes, and final disposition. MLA reports show triggered accounts, rate adjustments applied, and verification source. All data is exportable and available via API for BSB's internal compliance systems.\n\nZOLVE/CONTINENTAL BANK runs OFAC/MLA/SCRA compliance reporting through this system for its US program in production.`,
  new: `BSB's compliance team accesses real-time compliance reports directly from the Issuer Portal without requesting data from BRIM. OFAC screening results, MLA/SCRA verification status, fraud alert queue items, and all regulatory flag triggers are available at any time, filterable by date range, status, and reviewer disposition. OFAC match records include screening score, reviewer notes, and final disposition. MLA records show triggered accounts, rate adjustments applied, and benefit period status. All data is exportable and available via API feed into BSB's internal compliance systems.

ZOLVE/CONTINENTAL BANK's compliance team accesses OFAC and MLA reporting through this same workflow for the live US program today.`
},

{ id:'C15', req:'Secondary review queues outside underwriting (OFAC, Reg O, fraud, business)',
  reframed: false,
  old: `BRIM gives BSB configurable secondary review queues outside the standard underwriting workflow. Applications hitting OFAC, fraud alert, Reg O, or business entity review triggers are held in a dedicated compliance queue — no card ships until all conditions are cleared, and this is system-enforced. BSB defines routing rules (e.g., Reg O flags go to BSB's compliance team). Each queue tracks SLAs, and analysts can view the full application, pull bureau data, add notes, and approve or decline with full audit logging.\n\nMANULIFE BANK and AFFINITY CREDIT UNION both route applications through secondary review queues on this platform today.`,
  new: `BRIM's platform gives BSB configurable secondary review queues that sit outside the standard underwriting workflow. Applications that trigger OFAC hits, MLA flags, Reg O matches, fraud alerts, or business entity review requirements are automatically held — no card is issued until all conditions are cleared. This is system-enforced, not dependent on a manual process step. BSB defines routing rules per flag type: Reg O flags route to BSB's compliance team, OFAC flags route to the BSA officer, fraud alerts route to the risk team. Each queue shows SLA status, the full application record, bureau data, reviewer notes, and disposition — with a complete audit trail that BSB's examiners can access directly.

MANULIFE BANK and AFFINITY CREDIT UNION route applications through secondary review queues on this platform today.`
},

{ id:'C16', req:'Reg O — identify and flag employee/director/officer applications',
  reframed: true,
  old: `BRIM's application workflow checks each applicant against BSB's insider list (employees, directors, officers, related interests) and flags matches for Reg O review. Flagged applications route to a dedicated compliance queue, and the Reg O flag persists on the account for its full lifecycle. BSB maintains and uploads the insider list through the Issuer Portal, with changes taking effect immediately. All Reg O events are audit-logged.\n\nZOLVE/CONTINENTAL BANK operates this Reg O identification capability in the US market today.`,
  new: `Reg O compliance is BSB's obligation as the issuer. BRIM gives BSB the tools to enforce it consistently — across every channel, every application, every day. BRIM's application workflow checks each applicant against BSB's insider list (employees, directors, officers, and their related interests) at the point of application. Matches are flagged and routed to a dedicated compliance queue; no card is issued until BSB's designated reviewer clears the flag. BSB maintains and updates its own insider list through the Issuer Portal; changes take effect immediately for all new applications. The Reg O flag persists on the account for its full lifecycle — not just at origination — and all events are audit-logged for examination support.

ZOLVE/CONTINENTAL BANK operates this capability in the US market today.`
},

{ id:'C17', req:'Military Lending Act status verification and SCRA',
  reframed: true,
  old: `BRIM verifies military status at application via the DoD's DMDC MLA database and runs periodic re-verification post-booking. When SCRA eligibility is confirmed, the system automatically caps APR at 6%, waives fees, and adjusts minimum payment calculations. Status changes — active duty entry, discharge, reserve activation — trigger automatic re-evaluation. BSB's compliance team can pull SCRA status history and benefit records from the Issuer Portal for audit and examination support.\n\nZOLVE/CONTINENTAL BANK runs Military Lending Act status verification through this workflow for US cardholders.`,
  new: `MLA and SCRA compliance are BSB's obligations as the creditor. BRIM automates the verification and account treatment so BSB's compliance team does not manage these obligations manually. BRIM's platform queries the DoD DMDC MLA database at every new application and runs periodic re-verification throughout the account lifecycle — automatically, without BSB staff initiating each check. When SCRA eligibility is confirmed, account adjustments execute on BSB's behalf: APR capped at 6%, late fees, annual fees, and over-limit fees waived, minimum payment recalculated, all retroactive to the active-duty entry date. Status changes — activation, discharge, reserve activation — trigger automatic re-evaluation. BSB's compliance team accesses MLA/SCRA status history and benefit records directly in the Issuer Portal for audit and examination support.

ZOLVE/CONTINENTAL BANK runs MLA verification and SCRA account treatment through this workflow for US cardholders today.`
},

{ id:'C18', req:'OFAC Screening through the bank\'s established OFAC process',
  reframed: false,
  old: `BRIM screens every applicant and cardholder through World-Check One (LSEG Refinitiv), covering global sanctions lists including OFAC SDN, UN, OFSI, EU, and G7. Screening runs at application, in daily batch across the full portfolio, and on any name/address change. BSB can route potential matches to its own BSA/AML team for final disposition. Authorization controls block transactions from sanctioned countries in real time. BRIM has no regulatory findings on sanctions screening since founding — financial crime compliance certification.\n\nZOLVE/CONTINENTAL BANK runs OFAC screening through this process for its US program in production.`,
  new: `OFAC compliance is BSB's obligation as the issuer. BRIM provides the screening infrastructure so BSB can fulfill that obligation without building or maintaining its own sanctions screening program. Every applicant and cardholder is screened through World-Check One (LSEG Refinitiv) — covering OFAC SDN, UN, OFSI, EU, G7, and global sanctions lists — automatically at application, in daily batch re-screening of the full portfolio, and on any name or address change event. Potential matches are surfaced to BSB's BSA/AML team in the compliance queue for review and final disposition; BRIM does not make the determination. Authorization controls block transactions from sanctioned entities in real time regardless of screening lag. Every match is logged with an immutable audit trail.

ZOLVE/CONTINENTAL BANK runs OFAC screening through this process for its US program in production today.`
},

{ id:'C19', req:'CFPB requirements monitoring and compliance',
  reframed: true,
  old: `BRIM's Chief Regulatory Affairs Officer (Abraham Tachjian, reports to CEO) leads a team that tracks CFPB rulemaking, enforcement actions, and supervisory highlights. When new rules are issued, the team assesses platform impact and implements changes within required timelines. Platform controls enforce CFPB requirements at the system level — Reg Z disclosures, adverse action notices, ability-to-pay rules, fee formatting. BRIM has had no CFPB enforcement actions or supervisory findings.\n\nZOLVE/CONTINENTAL BANK maintains CFPB compliance through this framework in the live US program today.`,
  new: `BSB is the CFPB-regulated issuer. BRIM's role is to ensure the platform never becomes the reason BSB falls short of its CFPB obligations. BRIM's Chief Regulatory Affairs Officer, Abraham Tachjian (reports directly to the CEO), leads a dedicated team that tracks CFPB rulemaking, enforcement actions, and supervisory guidance on an ongoing basis. When a CFPB rule change requires platform updates, BRIM implements those changes within required timelines and communicates the change to BSB with a clear effective date and any configuration action needed on BSB's side. Platform controls enforce CFPB-driven requirements at the system level — Reg Z disclosures, adverse action notices, ability-to-pay guardrails, fee calculation and formatting rules — so BSB's compliance posture is not dependent on manual process controls.

ZOLVE/CONTINENTAL BANK relies on this framework to maintain CFPB compliance in the live US program today.`
},

{ id:'C20', req:'Credit bureau tradeline reporting',
  reframed: true,
  old: `BRIM reports tradelines monthly to Equifax, Experian, and TransUnion via Metro 2 files — covering account status, credit limit, balance, 24-month payment history, and special comment codes. In BSB's agent bank model, each client FI's tradelines report under that institution's subscriber code, not BRIM's. Automated QA checks validate file accuracy before submission, and e-OSCAR disputes are processed within FCRA-mandated timelines.\n\nZOLVE/CONTINENTAL BANK reports credit card tradelines to US bureaus through this workflow in production.`,
  new: `Credit bureau tradeline reporting is BSB's obligation as the card-issuing creditor — and for each client FI in BSB's agent bank program, it is their obligation respectively. BRIM operationalizes this: Metro 2 files are generated monthly and submitted to Equifax, Experian, and TransUnion on each institution's behalf, under that institution's own subscriber code. BSB's cardholders report as BSB's accounts. Each client FI's cardholders report as that institution's accounts. Tradelines never appear under BRIM's name. Automated QA checks validate file accuracy before submission, and e-OSCAR dispute processing runs within FCRA-mandated timelines. BSB's compliance team monitors bureau reporting status and dispute resolution in the Issuer Portal.

ZOLVE/CONTINENTAL BANK reports US tradelines through this workflow in production today.`
},

{ id:'C21', req:'SCRA rate adjustments',
  reframed: true,
  old: `When SCRA eligibility is confirmed, the system automatically caps APR at 6%, waives late/annual/over-limit fees, and recalculates minimum payments — retroactive to the active-duty entry date. Interest accrued above 6% during any processing lag is credited back. The system tracks the benefit period and restores original terms when eligibility ends. BSB can configure benefits beyond the statutory minimum. All adjustments are logged with dates and terms for examination support.\n\nZOLVE/CONTINENTAL BANK applies SCRA rate adjustments through this process for eligible US servicemembers.`,
  new: `SCRA compliance is BSB's obligation as the creditor — BRIM automates every required account treatment so BSB's compliance team does not manage servicemember accounts case-by-case. When BRIM's platform confirms SCRA eligibility through DMDC, account adjustments execute on BSB's behalf: APR reduced to 6% (or the existing rate if already below 6%), late fees, annual fees, and over-limit fees waived, minimum payment recalculated — all retroactive to the active-duty entry date. Interest accrued above the cap during any processing lag is credited back to the cardholder. The platform tracks the benefit period and restores BSB's original account terms when eligibility ends. BSB can configure benefits beyond the statutory SCRA minimum if its own credit policy requires it. Every adjustment is logged with dates and terms for examination and audit support.

ZOLVE/CONTINENTAL BANK applies SCRA adjustments through this process for eligible US servicemembers today.`
},

{ id:'C22', req:'Audit logging — risk rules, communications, card controls',
  reframed: false,
  old: `Every change to risk rules, communication templates, or card controls is audit-logged with employee user ID, name, role, timestamp, field changed, previous value, and new value. Logs are immutable and retained for 7+ years. BSB can search and export by date range, employee, change type, or affected account. Card-level audit trails track individual control changes (credit limit, block/unblock, rate) and can be scheduled for automatic delivery to BSB's compliance team.\n\nMANULIFE BANK and AFFINITY CREDIT UNION rely on this audit log for their internal compliance and examiner reviews.`,
  new: `Every change made to risk rules, communication templates, or card controls in BRIM's platform is logged automatically — employee user ID, name, role, timestamp, field changed, previous value, and new value are all captured. Logs are immutable: no user, including BRIM administrators, can edit or delete them. BSB's compliance and audit teams access logs directly in the Issuer Portal, searchable and exportable by date range, employee, change type, or affected account. Card-level audit trails cover every individual control change — credit limit adjustments, block/unblock events, rate changes — and are searchable by card number, account number, or employee. Logs are retained for seven or more years and can be scheduled for automatic delivery to BSB's compliance team.

MANULIFE BANK and AFFINITY CREDIT UNION rely on this audit infrastructure for internal compliance programs and examiner reviews today.`
},

{ id:'C23', req:'Regulation B — joint intent for co-applicants, all channels',
  reframed: true,
  old: `BRIM captures joint intent for co-applicants across all channels — online, in-branch, and telephony. The application explicitly presents the joint intent question before collecting co-applicant data, per Reg B. Joint intent is locked at submission and cannot be modified without a new application, maintaining a clean audit trail. Adverse action notices go to both applicants with proper Reg B language, and the system prevents improper spousal information collection per community property state rules.\n\nZOLVE/CONTINENTAL BANK captures joint intent for co-applicants under this Reg B-compliant workflow in the US program.`,
  new: `Regulation B joint intent capture is BSB's obligation as the creditor. BRIM's application workflow enforces it consistently across every channel so no application — regardless of how it is submitted — bypasses the requirement. The joint intent question is presented before any co-applicant data is collected in the online self-service flow, in the in-branch Issuer Portal, and in the agent-assisted telephony flow. Joint intent is locked at submission and cannot be modified without generating a new application, maintaining a clean Reg B audit trail. Adverse action notices are generated automatically for both applicants with Reg B-compliant language; no BSB staff member needs to draft or route them manually.

ZOLVE/CONTINENTAL BANK operates this Reg B-compliant joint intent workflow in the US program today.`
},

{ id:'C24', req:'State regulations for state-chartered institutions across jurisdictions',
  reframed: true,
  old: `BRIM's compliance team tracks state-specific credit card regulations for state-chartered institutions as part of each client onboarding. For BSB (Maine state-chartered), BRIM maps Maine banking regulations and MDPFR requirements to platform configuration. For BSB's agent bank client FIs in other states, BRIM reviews each state's rate caps, fee limits, and disclosure requirements and configures product parameters accordingly. State regulatory changes are monitored through subscription services, and BRIM is actively expanding US state coverage through the CONTINENTAL BANK/ZOLVE program and will map BSB's full partner FI footprint as part of onboarding. For each partner FI BSB brings on in a new state, BRIM's compliance team maps state-specific requirements — rate caps, fee limits, disclosure formats — before that FI's go-live.\n\nZOLVE/CONTINENTAL BANK maintains state-by-state regulatory compliance across its US cardholder base through this process.`,
  new: `BRIM enables BSB to operate a multi-state, multi-charter agent bank program without requiring BSB's compliance team to independently track and implement state-level credit card regulations for every jurisdiction where client FIs are chartered. BRIM's platform is built to support bank issuers from any charter type — federal and state banks, federal and state credit unions — operating simultaneously across multiple US states. At onboarding for each institution, BRIM's compliance team maps that institution's applicable state regulations — rate caps, fee limits, disclosure requirements and formats — to platform configuration before go-live. For BSB (Maine state-chartered), BRIM maps Maine banking regulations and MDPFR requirements specifically. For each client FI BSB brings on in another state, the same process runs for that institution's jurisdiction. When state laws change, BRIM monitors and updates configuration accordingly.

This is active capability: ZOLVE/CONTINENTAL BANK maintains compliance across multiple US state jurisdictions through this process today.`
},

{ id:'C25', req:'Marketing and solicitation channels, consumer opt-outs',
  reframed: false,
  old: `BRIM gives BSB marketing through email, SMS, push notification, in-app messaging, and direct mail file generation. Opt-out preferences are captured at the channel level — a cardholder can opt out of email but stay opted in to mail. Opt-outs are processed within 10 business days per CAN-SPAM and take effect immediately for digital channels. The platform enforces opt-out status system-wide: no marketing communication is delivered to an opted-out cardholder on that channel, regardless of campaign list uploads.\n\nMANULIFE BANK, AFFINITY CREDIT UNION, and PAYFACTO all run cardholder communications through these managed channels today.`,
  new: `BRIM gives BSB marketing and solicitation channels through the Issuer Portal: email, SMS, push notification (mobile app), in-app messaging, and direct mail file generation. BSB's marketing team manages campaigns directly without submitting requests to BRIM. Opt-out preferences are captured and enforced at the channel level — a cardholder can opt out of email while remaining opted in to mail. Opt-outs are enforced system-wide: no marketing communication goes out to an opted-out cardholder on that channel regardless of what is uploaded in a campaign list. Digital channel opt-outs take effect immediately; direct mail opt-outs are honored within 10 business days.

MANULIFE BANK, AFFINITY CREDIT UNION, and PAYFACTO run cardholder communications through these managed channels today.`
},

{ id:'C26', req:'CAN-SPAM and TCPA compliance',
  reframed: true,
  old: `For CAN-SPAM, every marketing email includes a working unsubscribe link and physical address, with opt-outs honored within 10 business days. For TCPA, the platform maintains Do Not Call lists and captures prior express written consent — with date, time, channel, and specific language — before any autodialed or pre-recorded outreach. BSB controls the consent language in its applications; BRIM enforces the flags at the system level. All consent and opt-out records are retained for the full retention period.\n\nZOLVE/CONTINENTAL BANK's US program applies CAN-SPAM and TCPA consent tracking through this framework for all outbound communications.`,
  new: `CAN-SPAM and TCPA compliance obligations belong to BSB as the sender and caller. BRIM builds the controls into the platform so BSB does not manage compliance through manual processes or spreadsheet suppression lists. For CAN-SPAM, every marketing email sent on BSB's behalf automatically includes a functioning unsubscribe link, physical mailing address, and accurate subject and header — no manual checklist required. Unsubscribe requests are honored within 10 business days for mail and immediately for digital channels. For TCPA, the platform maintains Do Not Call lists and captures Prior Express Written Consent (PEWC) — date, time, channel, and specific consent language — before any autodialed or pre-recorded outreach. BSB sets the consent language in its application and onboarding flows; BRIM enforces it system-wide. All consent and opt-out records are retained in full for the duration of the retention period.

ZOLVE/CONTINENTAL BANK's US program applies CAN-SPAM and TCPA consent tracking through this framework for all outbound communications today.`
},

{ id:'C27', req:'Federal and state privacy law compliance (GLBA, CCPA, CPRA)',
  reframed: true,
  old: `BRIM complies with GLBA, CCPA/CPRA, and state privacy laws. Consumer data is encrypted at rest (AES-256) and in transit (TLS 1.2+). GLBA privacy notices are generated at account opening and annually; CCPA access, deletion, and opt-out-of-sale requests are supported within the 45-day window. Role-based access controls and data masking limit PII exposure. SOC 2 Type 2, ISO 27001, and PCI DSS certifications validate these controls. BRIM has had no reportable privacy breaches.\n\nMANULIFE BANK (PIPEDA) and ZOLVE/CONTINENTAL BANK (state privacy laws) both operate under jurisdiction-specific privacy controls through this same framework.`,
  new: `BSB is the GLBA-obligated financial institution and the data controller for its cardholders. BRIM's platform provides the data infrastructure and controls that make it operationally feasible for BSB to meet those obligations at scale — across its own portfolio and across its agent bank client FIs. GLBA privacy notices are generated automatically at account opening and annually; BSB does not produce these manually. CCPA and CPRA consumer access, deletion, and opt-out-of-sale requests are handled through a controlled workflow accessible to BSB's compliance admins within the 45-day window. BSB's cardholder data is logically partitioned from other BRIM clients — it does not commingle with data from other institutions. Consumer data is not sold or shared with third parties for marketing; data flows only to card networks and regulatory vendors as required for transaction processing and compliance. Platform security controls — AES-256 encryption at rest, TLS 1.2+ in transit, role-based access, data masking — are independently validated through SOC 2 Type II and PCI DSS Level 1 certification.

MANULIFE BANK operates under PIPEDA and ZOLVE/CONTINENTAL BANK under US state privacy laws — both through this same platform framework today.`
},

{ id:'C28', req:'Issue management and remediation process',
  reframed: false,
  old: `BRIM logs all issues in a centralized system with severity classification, root cause analysis, owner assignment, and remediation timeline. Critical issues trigger immediate incident response with BSB notification within 1 hour. Every issue follows the same lifecycle: identification, assessment, remediation, implementation, validation, closure. BSB has visibility into issue status through the Issuer Portal. Issue trends are reviewed quarterly by BRIM's executive team and systemic findings drive process improvements.\n\nMANULIFE BANK and AFFINITY CREDIT UNION have used this issue management process through regulatory reviews and operational incidents.`,
  new: `BRIM runs a formal issue management lifecycle: identification, severity classification (critical, high, medium, low), root cause analysis, owner assignment, remediation, implementation, validation, and closure. BSB is kept informed throughout — not just when an issue is resolved. Critical issues trigger BSB notification within one hour and a dedicated incident team is activated. BSB has real-time visibility into all open issues, owner assignments, remediation timelines, and resolution history directly through the Issuer Portal; BSB's team does not need to contact BRIM to check status. Issue trends are reviewed quarterly by BRIM's executive team and systemic findings drive platform improvements. Compliance-related issues include regulatory escalation triggers for issues that could affect BSB's examination readiness.

MANULIFE BANK and AFFINITY CREDIT UNION have operated through this issue management process during regulatory reviews and operational incidents today.`
},

{ id:'C29', req:'Policies and procedures for compliance issue logging and management reporting',
  reframed: false,
  old: `Yes. BRIM maintains policies and procedures for compliance issue logging, tracking, escalation, and management reporting. The AML policy is board-approved annually, and a whistleblower policy provides a confidential reporting channel. Compliance metrics — open issues, aging, remediation timelines — are reported to management monthly and the board quarterly. BRIM will provide these documents for BSB's review during due diligence. The completed financial crime compliance certification independently validates the compliance framework.\n\nMANULIFE BANK and AFFINITY CREDIT UNION both operate under this documented compliance tracking framework.`,
  new: `Yes. BRIM maintains a documented compliance management system with policies and procedures covering issue logging, tracking, escalation, and management reporting. BSB's examiners will want to verify that BRIM, as a third-party service provider, has genuine compliance governance — not just policies on paper. The AML policy is board-approved and reviewed annually. A whistleblower policy provides a confidential reporting channel. Compliance metrics — open issues, aging, remediation timelines — are reported to BRIM management monthly and to the board quarterly. These documents are available to BSB for due diligence review under NDA and will be provided as part of the appendix package before submission.

MANULIFE BANK and AFFINITY CREDIT UNION both operate under this documented compliance governance framework today.`
},

];

// ── Update JSON ───────────────────────────────────────────────────────────────
const data = JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));
const cqs = data.questions.filter(q => q.category === 'Compliance & Reporting');
let updated = 0;
rewrites.forEach((rw, i) => {
  if (i < cqs.length) {
    cqs[i].paragraph = rw.new;
    updated++;
  }
});
fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2));
console.log(`Updated ${updated} paragraph fields in rfp_data.json`);

// ── Build Word doc ────────────────────────────────────────────────────────────
function buildContent() {
  const c = [];

  // Title
  c.push(new Paragraph({
    children:[t('BSB RFP — Compliance Paragraphs: Reframed', { size:34, bold:true, color:WHITE })],
    alignment:AlignmentType.CENTER,
    shading:{ fill:NAVY, type:ShadingType.CLEAR },
    spacing:{ before:120, after:60 }, indent:{ left:120, right:120 }
  }));
  c.push(new Paragraph({
    children:[t('All 29 Compliance & Reporting narrative paragraphs rewritten with Rasha\'s framework', { size:20, color:WHITE })],
    alignment:AlignmentType.CENTER,
    shading:{ fill:NAVY, type:ShadingType.CLEAR },
    spacing:{ before:0, after:60 }, indent:{ left:120, right:120 }
  }));
  c.push(new Paragraph({
    children:[
      t('BRIM Financial  |  April 6, 2026  |  ', { size:18, color:'555555' }),
      t('Deadline: April 10, 2026', { size:18, color:RED, bold:true }),
      t(`  |  ${rewrites.filter(r=>r.reframed).length} reframed  |  ${rewrites.filter(r=>!r.reframed).length} refined`, { size:18, color:'555555' }),
    ],
    alignment:AlignmentType.CENTER, spacing:{ before:100, after:100 }
  }));

  // Framework reminder
  c.push(textBox(
    'RASHA\'S RULE: BRIM is a technology and services provider. BSB is the regulated issuer. Never say "BRIM complies with [regulation]." Say "BRIM enables BSB to fulfill its [regulation] obligations through [specific existing capability]." Every answer must reflect what BRIM currently does today — not what BRIM can build.',
    LIGHT_BLUE, TEAL, TEAL
  ));
  c.push(spacer(80));

  // Stats row
  const reframed = rewrites.filter(r=>r.reframed).length;
  c.push(new Table({
    width:{ size:9360, type:WidthType.DXA }, columnWidths:[3120, 3120, 3120],
    rows:[new TableRow({ children:[
      new TableCell({ borders:allB(RED), shading:{ fill:LIGHT_RED, type:ShadingType.CLEAR }, margins:{ top:100, bottom:100, left:120, right:120 }, width:{ size:3120, type:WidthType.DXA },
        children:[p([t(`${reframed} REFRAMED`, { bold:true, size:22, color:RED })],{before:0,after:0,align:AlignmentType.CENTER}), p([t('Wrong posture — now corrected',{size:18,color:RED})],{before:0,after:0,align:AlignmentType.CENTER})] }),
      new TableCell({ borders:allB('70AD47'), shading:{ fill:LIGHT_GREEN, type:ShadingType.CLEAR }, margins:{ top:100, bottom:100, left:120, right:120 }, width:{ size:3120, type:WidthType.DXA },
        children:[p([t(`${rewrites.length-reframed} REFINED`, { bold:true, size:22, color:GREEN })],{before:0,after:0,align:AlignmentType.CENTER}), p([t('Framing OK — prose improved',{size:18,color:GREEN})],{before:0,after:0,align:AlignmentType.CENTER})] }),
      new TableCell({ borders:allB(TEAL), shading:{ fill:LIGHT_BLUE, type:ShadingType.CLEAR }, margins:{ top:100, bottom:100, left:120, right:120 }, width:{ size:3120, type:WidthType.DXA },
        children:[p([t('29 TOTAL', { bold:true, size:22, color:TEAL })],{before:0,after:0,align:AlignmentType.CENTER}), p([t('JSON already updated',{size:18,color:TEAL})],{before:0,after:0,align:AlignmentType.CENTER})] }),
    ]})]
  }));

  c.push(spacer(120));

  // All 29
  rewrites.forEach((rw, i) => {
    if (i > 0 && i % 3 === 0) c.push(new Paragraph({ children:[new PageBreak()] }));

    c.push(h2(`${rw.id} — ${rw.req}`, rw.reframed ? RED : NAVY));

    if (rw.reframed) {
      c.push(textBox('POSTURE CORRECTED: Previous answer positioned BRIM as the regulated party. Rewritten with "BRIM enables BSB to..." framing.', LIGHT_RED, RED, 'FFAAAA'));
      c.push(spacer(40));
    }

    c.push(twoCol(rw.old, rw.new, LIGHT_GRAY, LIGHT_GREEN));
    c.push(spacer(100));
  });

  // Footer note
  c.push(new Paragraph({
    children:[t('All 29 paragraph fields updated in rfp_data.json. These are the narrative paragraphs for the BSB submission doc and narrative response. Internal use only.', { size:16, italic:true, color:'888888' })],
    alignment:AlignmentType.CENTER,
    border:{ top:{ style:BorderStyle.SINGLE, size:2, color:'CCCCCC' } },
    spacing:{ before:80, after:80 }
  }));

  return c;
}

async function main() {
  const doc = new Document({
    styles:{
      default:{ document:{ run:{ font:'Arial', size:20, color:'000000' } } },
      paragraphStyles:[
        { id:'Heading1', name:'Heading 1', basedOn:'Normal', next:'Normal', quickFormat:true,
          run:{ size:26, bold:true, font:'Arial', color:WHITE }, paragraph:{ spacing:{ before:200, after:100 }, outlineLevel:0 } },
        { id:'Heading2', name:'Heading 2', basedOn:'Normal', next:'Normal', quickFormat:true,
          run:{ size:22, bold:true, font:'Arial', color:NAVY }, paragraph:{ spacing:{ before:160, after:60 }, outlineLevel:1 } },
      ]
    },
    sections:[{
      properties:{ page:{ size:{ width:12240, height:15840 }, margin:{ top:1080, right:1080, bottom:1080, left:1080 } } },
      headers:{ default:new Header({ children:[new Paragraph({
        children:[t('BSB RFP — Compliance Paragraphs Reframed  |  Rasha\'s Framework  |  BRIM Financial  |  INTERNAL', { size:16, color:'888888', italic:true })],
        alignment:AlignmentType.CENTER,
        border:{ bottom:{ style:BorderStyle.SINGLE, size:2, color:'CCCCCC' } },
        spacing:{ after:60 }
      })]})},
      footers:{ default:new Footer({ children:[new Paragraph({
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

  const buf = await Packer.toBuffer(doc);
  fs.writeFileSync(OUTPUT, buf);
  console.log('Written:', OUTPUT);
}

main().catch(err => { console.error(err); process.exit(1); });
