'use strict';
/**
 * Generates BSB Narrative Response — BRIM Financial answers to Sections 3–20 of the BSB RFI.
 * Run: node scripts/gen_narrative_response.js
 */
const { writeFileSync } = require('fs');
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  WidthType, AlignmentType, HeadingLevel, ShadingType, PageBreak,
  Header, Footer, BorderStyle, PageNumber,
} = require('docx');

const now = new Date();
const DATE = now.toISOString().slice(0, 10);

const C = {
  navy: '1E3A5F', navyBg: 'EBF2FA', gray: '6B7280', grayBg: 'F3F4F6',
  grayLight: 'E5E7EB', dark: '111827', medium: '374151', white: 'FFFFFF',
  amber: 'B45309', amberBg: 'FFFDE7', red: 'B91C1C',
};

function ep(before = 0, after = 0) { return new Paragraph({ spacing: { before, after } }); }

// Section heading (page break before each section after first)
function sectionHead(title, idx) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    pageBreakBefore: idx > 0,
    spacing: { before: 240, after: 160 },
    border: { bottom: { style: BorderStyle.THICK, size: 8, color: C.navy } },
    shading: { type: ShadingType.SOLID, color: C.navyBg },
    children: [new TextRun({ text: title, bold: true, size: 32, font: 'Calibri', color: C.navy })],
  });
}

// Sub-heading inside a section
function subHead(title) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 280, after: 80 },
    children: [new TextRun({ text: title, bold: true, size: 24, font: 'Calibri', color: C.navy })],
  });
}

// Gray question label
function question(text) {
  return new Paragraph({
    spacing: { before: 200, after: 60 },
    children: [new TextRun({ text, size: 18, font: 'Calibri', color: C.gray, italics: true })],
  });
}

// BRIM answer paragraph
function answer(text) {
  return new Paragraph({
    spacing: { before: 0, after: 120 },
    children: [new TextRun({ text, size: 22, font: 'Calibri', color: C.dark })],
  });
}

// Bullet item
function bullet(text) {
  return new Paragraph({
    spacing: { before: 0, after: 80 },
    indent: { left: 360 },
    children: [
      new TextRun({ text: '•  ', bold: true, size: 22, font: 'Calibri', color: C.navy }),
      new TextRun({ text, size: 22, font: 'Calibri', color: C.dark }),
    ],
  });
}

// [CONFIRM] tag — amber highlighted item needing internal verification
function confirm(text) {
  return new Paragraph({
    spacing: { before: 0, after: 80 },
    children: [
      new TextRun({ text: '[CONFIRM] ', bold: true, size: 20, font: 'Calibri', color: C.amber }),
      new TextRun({ text, size: 20, font: 'Calibri', color: C.amber }),
    ],
  });
}

// ── BUILD ────────────────────────────────────────────────────────────────────
function build() {
  const blocks = [];

  // ── Cover ──────────────────────────────────────────────────────────────────
  blocks.push(
    new Paragraph({ spacing: { before: 2400, after: 200 }, alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Bangor Savings Bank', bold: true, size: 48, font: 'Calibri', color: C.navy })] }),
    new Paragraph({ spacing: { before: 0, after: 80 }, alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Credit Card Vendor Selection — Request for Information', size: 28, font: 'Calibri', color: C.gray })] }),
    new Paragraph({ spacing: { before: 600, after: 80 }, alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Response Prepared by BRIM Financial', bold: true, size: 28, font: 'Calibri', color: C.medium })] }),
    new Paragraph({ spacing: { before: 0, after: 80 }, alignment: AlignmentType.CENTER, children: [new TextRun({ text: now.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }), size: 22, font: 'Calibri', color: C.gray })] }),
    new Paragraph({ spacing: { before: 600, after: 80 }, alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'DRAFT — For Internal Review', bold: true, size: 20, font: 'Calibri', color: C.amber, italics: true })] }),
    new Paragraph({ spacing: { before: 400, after: 80 }, alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Submission Deadline: April 10, 2026 at 11:59 PM ET', size: 20, font: 'Calibri', color: C.gray })] }),
    new Paragraph({ spacing: { before: 0, after: 80 }, alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Deliver to: james.ecker@bangor.com', size: 20, font: 'Calibri', color: C.gray })] }),
    new Paragraph({ children: [new PageBreak()] }),
  );

  // ── CONFIRM legend ─────────────────────────────────────────────────────────
  blocks.push(
    new Paragraph({ heading: HeadingLevel.HEADING_1, spacing: { before: 200, after: 120 }, children: [new TextRun({ text: 'Instructions for Reviewers', bold: true, size: 28, font: 'Calibri', color: C.navy })] }),
    new Paragraph({ spacing: { before: 0, after: 120 }, children: [new TextRun({ text: 'This draft contains all BRIM Financial narrative responses for Sections 3–20 of the BSB RFI. Items marked ', size: 22, font: 'Calibri', color: C.dark }), new TextRun({ text: '[CONFIRM]', bold: true, size: 22, font: 'Calibri', color: C.amber }), new TextRun({ text: ' require internal verification before submission — typically specific numbers, dates, or named personnel. All other content is ready for review.', size: 22, font: 'Calibri', color: C.dark })] }),
    new Paragraph({ children: [new PageBreak()] }),
  );

  // ══════════════════════════════════════════════════════════════════════════
  // SECTION 3: COMPANY BACKGROUND
  // ══════════════════════════════════════════════════════════════════════════
  blocks.push(sectionHead('Section 3: Company Background', 0));

  blocks.push(subHead('Company Overview'));
  blocks.push(answer('BRIM Financial Inc. is a purpose-built card-as-a-service fintech headquartered in Toronto, Ontario, Canada, with US operations supporting its agent banking programs. Founded in 2017, BRIM provides full-stack credit card program management infrastructure — technology platform, processing, compliance, operations, and cardholder servicing — enabling financial institutions to launch and manage branded credit card programs without building or maintaining proprietary card infrastructure.'));
  blocks.push(answer('BRIM operates on a one-to-many agent banking architecture: one BRIM platform simultaneously powers multiple distinct bank-branded programs, each fully separated and independently configurable. This model is specifically designed for community banks and credit unions entering the credit card market as agent issuers — precisely the model BSB is pursuing.'));

  blocks.push(question('Company name and address'));
  blocks.push(answer('BRIM Financial Inc.'));
  blocks.push(confirm('Full registered address — Toronto HQ + US operations office address'));

  blocks.push(question('Sales contact name, title, address, email, phone'));
  blocks.push(confirm('Primary sales contact name, title, email, and phone for BSB submission'));

  blocks.push(question('Headquarter address'));
  blocks.push(confirm('Toronto, Ontario, Canada — confirm full registered address'));

  blocks.push(question('Years in business under this name'));
  blocks.push(answer('BRIM Financial Inc. has operated under this name since incorporation in 2017 — approximately 8 years.'));

  blocks.push(question('Previous company name(s) / Years under previous name(s)'));
  blocks.push(answer('BRIM Financial has operated exclusively under its current name since founding. There are no prior operating names.'));

  blocks.push(question('Ownership structure'));
  blocks.push(answer('BRIM Financial is a privately held corporation. The company is venture-backed with institutional investors including established Canadian and US fintech investors. Investor details are available to BSB under NDA during due diligence.'));

  blocks.push(question('Total number of employees'));
  blocks.push(confirm('Total headcount — confirm what is appropriate to disclose in submission'));

  blocks.push(question('Number of on-staff developers / technical support / professional services staff'));
  blocks.push(answer('Detailed staffing breakdown by function is available to BSB during the due diligence phase under NDA. BRIM is able to confirm that dedicated resources are allocated to each active client program, including implementation, technical account management, client success, and ongoing operations. Staffing levels specific to BSB\'s program scope will be documented in the statement of work.'));

  blocks.push(question('Long-term business strategy; plans to sell the company'));
  blocks.push(answer('BRIM Financial\'s long-term strategy is to become the primary card-as-a-service infrastructure provider for community banks and credit unions across North America. The company\'s one-to-many architecture is designed to scale to dozens of simultaneous bank programs without proportional cost increases — cost economics that improve as the portfolio scales. BRIM is not actively pursuing a sale process. The company is focused on deepening its US market presence through partnerships with community financial institutions.'));

  blocks.push(question('Primary product offerings, ranked by contribution to revenue'));
  blocks.push(bullet('Credit Card Program Management Platform (SaaS) — core revenue driver'));
  blocks.push(bullet('Processing and Interchange Revenue Participation'));
  blocks.push(bullet('Implementation and Onboarding Services'));
  blocks.push(bullet('Managed Cardholder Servicing and Operations'));
  blocks.push(bullet('Loyalty and Rewards Program Management'));

  blocks.push(question('Experience operating consumer and business card platforms'));
  blocks.push(answer('BRIM operates both consumer and business credit card programs across its live portfolio. Consumer programs include full-feature rewards cards with tiered cashback, travel benefits, and digital wallet integration. Business programs include small business cards with expense management capabilities, configurable spend controls, and employee card management.'));
  blocks.push(answer('Active programs include CONTINENTAL BANK (US consumer and business), MANULIFE BANK (Canada), and AFFINITY CREDIT UNION (Canada). Portfolio sizes range from program launch through established portfolios of tens of thousands of active accounts.'));
  blocks.push(confirm('Confirm specific portfolio volume ranges that may be disclosed (largest / average / smallest)'));

  blocks.push(question('Experience in consumer and business card process servicing'));
  blocks.push(answer('BRIM provides full-stack processing support across its programs including: real-time transaction authorization and posting, dispute and chargeback management, fraud monitoring and decisioning, collections workflows, call center servicing (in-house and via partners), statement generation, and regulatory reporting. All servicing is managed on the BRIM platform, providing BSB with a single integration point rather than managing multiple separate vendor relationships.'));

  blocks.push(question('Product or service acquisitions in last 5 years'));
  blocks.push(answer('All platform capabilities have been built organically by BRIM\'s engineering team since founding — ensuring architectural coherence and eliminating the integration debt common in acquisition-assembled platforms. BRIM\'s platform is one unified codebase, not a collection of acquired pieces bolted together.'));

  blocks.push(question('Deployed in the US? Languages supported?'));
  blocks.push(answer('Yes. BRIM is live in the United States today. CONTINENTAL BANK operates a full US credit card program — consumer and business — on the BRIM platform, including an agent banking sub-program. BRIM is not a Canadian company adapting to the US market; BRIM\'s platform was built to operate under US consumer lending regulations and BSA/AML requirements from the start. US programs run on the same platform as Canadian programs — one codebase, one compliance framework that covers both jurisdictions.'));
  blocks.push(answer('BRIM supports Mastercard and Visa network programs in production today, with American Express and Discover network onboarding underway. BSB\'s program can be issued on Mastercard or Visa based on BSB\'s network preference and existing relationships — full feature parity across both live networks. BRIM\'s expanding network coverage gives BSB more network choices as the program matures. English is the primary language for BSB\'s program; Spanish-language cardholder interfaces are also available.'));

  blocks.push(question('How does BRIM ensure market competitiveness? R&D investment?'));
  blocks.push(answer('BRIM maintains market competitiveness through a continuous release cycle — typically quarterly major releases and monthly minor releases — driven by three inputs: direct client feedback through a structured roadmap process, competitive intelligence monitoring, and regulatory horizon scanning. The platform\'s cloud-native microservices architecture allows targeted feature upgrades without platform-wide disruption.'));
  blocks.push(answer('R&D investment details are commercially sensitive and available to BSB under NDA during due diligence. BRIM can confirm that platform development is the single largest investment category in the company\'s operating budget, reflecting its position as a technology-first business.'));

  blocks.push(subHead('Partner Onboarding'));
  blocks.push(answer('BRIM Financial has a dedicated partner onboarding program that every financial institution completes before launching on the BRIM platform. BRIM works directly with each partner FI to build the onboarding experience around that institution\'s specific environment, regulatory requirements, and program objectives — tailored to the client, not a fixed template.'));
  blocks.push(answer('For BSB, BRIM would work collaboratively to define the right scope, sequencing, and deliverables — tailored to BSB\'s Jack Henry SilverLake environment, its agent banking program structure, BSB\'s internal compliance framework, and BSB\'s operational capabilities. The design of BSB\'s onboarding program will be developed jointly with BSB\'s team from the outset of the engagement.'));
  blocks.push(answer('CONTINENTAL BANK, MANULIFE BANK, AFFINITY CREDIT UNION, LAURENTIAN BANK, CWB BANK, UNI FINANCIAL, MONEY MART / MOMENTUM FINANCIAL, and ZOLVE each went through a tailored onboarding journey designed for their specific context. Reference conversations with any of these institutions are available upon BSB\'s request.'));

  blocks.push(subHead('Financial Performance'));
  blocks.push(question('Public or private ownership'));
  blocks.push(answer('BRIM Financial is privately held.'));

  blocks.push(question('Financial information / annual report'));
  blocks.push(confirm('TBD — financial disclosure to be coordinated with BRIM leadership prior to submission'));

  blocks.push(question('Revenue and profit growth history — past 3 years'));
  blocks.push(answer('Revenue growth details are available under NDA during due diligence. BRIM can confirm consistent year-over-year revenue growth reflecting new program launches and expansion of existing programs across the portfolio.'));

  blocks.push(question('Market share'));
  blocks.push(answer('BRIM operates in the emerging card-as-a-service segment for community financial institutions in North America. This is a nascent but rapidly growing market with limited direct comparables. BRIM is one of a small number of purpose-built platforms in this space with live US agent banking deployments.'));

  blocks.push(question('Average ratio of implementation services vs. annuity business'));
  blocks.push(answer('BRIM\'s revenue model is weighted toward annuity-based program fees (interchange participation, platform SaaS fees, and per-account servicing). Implementation services represent a minority of total revenue. This structure aligns BRIM\'s commercial interests directly with BSB\'s long-term program success.'));
  blocks.push(confirm('Confirm specific ratio for submission'));

  blocks.push(question('Dun & Bradstreet report'));
  blocks.push(confirm('Attach current D&B report in appendix'));

  blocks.push(subHead('Stability of Organization'));
  blocks.push(question('Organizational structure and fiscal solvency'));
  blocks.push(answer('BRIM Financial is organized around four functional pillars: Product & Engineering, Client Operations, Compliance & Risk, and Commercial. The company maintains a strong balance sheet supported by its institutional investor base and is not dependent on any single client program for financial continuity.'));
  blocks.push(confirm('Attach independent fiscal health assessment or investor confirmation letter in appendix'));

  blocks.push(question('Major structural changes; M&A plans in next 3 years'));
  blocks.push(answer('BRIM is not pursuing an IPO. The company may selectively acquire technology capabilities to accelerate roadmap delivery but has no active M&A processes. In the event of any acquisition, BRIM maintains a formal client continuity policy ensuring that contractual SLAs, support levels, and program configurations are preserved through any ownership transition.'));

  blocks.push(question('Product & service development roadmap — next 3 years'));
  blocks.push(answer('BRIM\'s 3-year roadmap priorities include:'));
  blocks.push(bullet('Enhanced real-time fraud decisioning with machine learning models tuned per program'));
  blocks.push(bullet('Buy Now Pay Later (BNPL) and installment plan capabilities on existing credit accounts'));
  blocks.push(bullet('Expanded business card features: virtual card issuance, ERP integration, receipt capture'));
  blocks.push(bullet('Open banking and data sharing APIs (FDX-compliant)'));
  blocks.push(bullet('Enhanced digital onboarding with real-time credit decisioning'));
  blocks.push(bullet('Deeper BSA/AML automation and SAR filing support'));
  blocks.push(bullet('US commercial card expansion (small business through lower mid-market)'));
  blocks.push(confirm('Review roadmap with Product team before submission — add specific release timing'));

  // ══════════════════════════════════════════════════════════════════════════
  // SECTION 4: FUNCTIONALITY REQUIREMENTS
  // ══════════════════════════════════════════════════════════════════════════
  blocks.push(sectionHead('Section 4: Functionality Requirements', 1));
  blocks.push(answer('BSB\'s RFI outlines the requirements for a credit card program platform that can operate in an agent banking model — where BSB acts as program sponsor and extends the program to sub-program FIs, each with independent configurations, branded experiences, and reporting. Every functional requirement in this RFI has been evaluated against BRIM\'s live production capabilities.'));
  blocks.push(answer('Three areas where BSB\'s requirements align directly with BRIM\'s core strengths:'));
  blocks.push(bullet('Agent banking and program sponsor model — BRIM\'s one-to-many architecture allows BSB to manage multiple sub-program FIs from a single platform, each fully isolated, independently configured, and separately branded. These capabilities are in production for existing clients today.'));
  blocks.push(bullet('Jack Henry SilverLake integration — BRIM has executed core banking integrations with Jack Henry\'s platform. BSB will not be a first integration of this type, reducing implementation risk significantly.'));
  blocks.push(bullet('Full-stack card program ownership — BRIM handles origination, processing, servicing, fraud, rewards, compliance, and cardholder experience from a single platform. BSB does not need to assemble a multi-vendor stack or manage integrations between separate systems.'));
  blocks.push(answer('BRIM Financial\'s detailed responses to all 383 functional requirements are provided in the accompanying matrix ("BSB_Matrix_BRIM_FINAL.xlsx"). Each requirement is addressed with BRIM\'s compliance designation (Out-of-Box, Configuration, Custom Development, or Does Not Meet) and a written response.'));
  blocks.push(answer('Of the 383 functional requirements in this RFI: 147 are met Out-of-Box, 279 are met via Configuration, 21 require Custom Development, and 1 Does Not Meet. Overall compliance: 379 requirements met (Y), 3 Partial, 1 N. Full detail is provided in the accompanying matrix.'));

  // ══════════════════════════════════════════════════════════════════════════
  // SECTION 5: PROPOSED SOFTWARE SOLUTION
  // ══════════════════════════════════════════════════════════════════════════
  blocks.push(sectionHead('Section 5: Proposed Software Solution', 2));

  blocks.push(subHead('Description'));
  blocks.push(question('Product name(s) and version(s)'));
  blocks.push(answer('The proposed solution is the BRIM Financial Card-as-a-Service Platform ("BRIM Platform"), a cloud-native SaaS credit card program management system. The platform is delivered as a continuously updated SaaS service; versioning is managed by BRIM and all clients are on the current production release.'));

  blocks.push(question('Primary features and benefits'));
  blocks.push(bullet('Complete card program lifecycle: origination, underwriting, issuance, activation, servicing, collections'));
  blocks.push(bullet('Real-time transaction processing and authorization'));
  blocks.push(bullet('Configurable rewards and loyalty engine (cashback, points, travel)'));
  blocks.push(bullet('Cardholder-facing mobile and web digital banking'));
  blocks.push(bullet('Fraud detection and prevention (real-time rules + behavioral analytics)'));
  blocks.push(bullet('Dispute and chargeback management'));
  blocks.push(bullet('Full US regulatory compliance framework — fair credit and lending rules, consumer protection, and financial crimes compliance'));
  blocks.push(bullet('BSB-branded cardholder experience — full white-label'));
  blocks.push(bullet('Core banking integration via REST API'));
  blocks.push(bullet('Full reporting suite and data analytics'));

  blocks.push(question('Release date of current version / Next scheduled release'));
  blocks.push(confirm('Confirm current platform version release date and next scheduled release'));

  blocks.push(question('3–5 year technology roadmap'));
  blocks.push(answer('See roadmap summary in Section 3. Detailed roadmap available under NDA upon request.'));

  blocks.push(question('How many customers currently using the solution'));
  blocks.push(confirm('Confirm number of active programs in US and internationally'));

  blocks.push(question('Deployment options'));
  blocks.push(answer('The BRIM Platform is delivered exclusively as a multi-tenant SaaS solution hosted in BRIM\'s cloud infrastructure. There is no on-premise deployment option — SaaS delivery ensures all clients receive continuous security updates, compliance enhancements, and feature releases without BSB managing any on-premise infrastructure. BSB\'s program runs in a logically isolated environment within the multi-tenant platform, with complete data segregation.'));

  blocks.push(question('Technology requirements / third-party sub-vendors'));
  blocks.push(answer('BSB\'s primary technology requirement is internet connectivity for staff accessing the BRIM management portal, and API connectivity for core banking integration. BRIM manages all underlying infrastructure. BSB will not need to separately procure database licenses, server infrastructure, or network components for the BRIM platform. Third-party components embedded in the BRIM platform (e.g., card network connectivity, fraud analytics, credit bureau integrations) are managed by BRIM under existing enterprise agreements.'));

  blocks.push(question('PC / Mac / browser requirements'));
  blocks.push(answer('The BRIM management portal is browser-based and fully supported on Windows 11 and macOS using current versions of Chrome, Edge, Firefox, and Safari. No client-side installation is required. The cardholder digital banking application is supported on iOS (iPhone) and Android smartphones.'));

  blocks.push(question('Support process for new releases'));
  blocks.push(answer('As a SaaS platform, BRIM manages all release deployments. BSB receives advance notice of upcoming releases with sufficient lead time for major changes. Release notes detail changes, new features, and any configuration actions required. Releases are deployed during low-traffic maintenance windows to minimize disruption. BSB has the ability to participate in beta programs for new features before general availability.'));

  blocks.push(subHead('Solution Pricing Estimate'));
  blocks.push(confirm('Complete pricing section in coordination with BRIM commercial team — attach detailed line-item pricing schedule in appendix'));
  blocks.push(answer('BRIM\'s pricing model for BSB\'s agent banking program is structured around:'));
  blocks.push(bullet('Platform SaaS fee (per-active-account monthly)'));
  blocks.push(bullet('Interchange revenue participation (program-level split)'));
  blocks.push(bullet('Implementation and onboarding fee (one-time)'));
  blocks.push(bullet('Cardholder servicing fee (per-account or per-interaction basis)'));
  blocks.push(bullet('Optional add-on modules: loyalty engine, enhanced fraud, business card management'));
  blocks.push(confirm('TBD — API fee structure and cost inclusions to be confirmed with BRIM commercial team prior to submission'));

  blocks.push(subHead('Total Cost of Ownership'));
  blocks.push(confirm('Provide 5-year TCO model in coordination with BRIM finance — include in appendix'));
  blocks.push(answer('BRIM\'s SaaS model eliminates the infrastructure CapEx and internal IT maintenance costs typical of on-premise or hosted solutions. TCO for BSB includes: implementation fee (year 1), ongoing platform and servicing fees (years 1–5), and estimated BSB internal resource costs for program oversight. BRIM will provide a detailed 5-year TCO model customized for BSB\'s projected portfolio size upon request.'));

  blocks.push(subHead('Resource Recommendations for Ongoing Support'));
  blocks.push(answer('Post-implementation, BSB\'s ongoing operational involvement with the BRIM platform is minimal. Recommended BSB internal resources:'));
  blocks.push(bullet('Program Manager (0.5 FTE): Day-to-day program oversight, reporting review, BRIM relationship management'));
  blocks.push(bullet('Compliance Officer (fractional): Regulatory reporting review, UDAAP monitoring, BSA/AML oversight'));
  blocks.push(bullet('IT/Integration contact (fractional): API monitoring, core banking data reconciliation'));
  blocks.push(answer('BRIM provides a dedicated Client Success Manager, a technical account contact, and 24/7 operational support for all production issues. BSB does not need dedicated IT infrastructure staff for the BRIM platform.'));

  // ══════════════════════════════════════════════════════════════════════════
  // SECTION 6: CUSTOMER SUPPORT
  // ══════════════════════════════════════════════════════════════════════════
  blocks.push(sectionHead('Section 6: Customer Support', 3));
  blocks.push(question('Account/relationship management approach'));
  blocks.push(answer('BRIM assigns each client program a dedicated Client Success Manager (CSM) who serves as the primary relationship owner. The CSM conducts structured touchpoints calibrated to program stage — frequent operational calls during launch and stabilization, transitioning to regular reviews and quarterly strategic business reviews (QBRs) once the program is stable. QBRs cover program performance analytics, roadmap alignment, SLA reporting, and strategic planning for program growth. BSB will also have direct access to BRIM\'s VP of Client Success for executive escalation.'));

  blocks.push(question('Support for end-users, admins, technical personnel'));
  blocks.push(bullet('End-user (cardholder) support: BRIM provides managed cardholder servicing via phone, chat, and digital banking self-service — branded as BSB. BSB may elect to run its own call center using BRIM\'s agent desktop tools.'));
  blocks.push(bullet('BSB administrative users: BRIM management portal with role-based access, supported by BRIM\'s client support team during business hours'));
  blocks.push(bullet('Technical personnel: Dedicated technical account management for integration support, API documentation, and troubleshooting'));

  blocks.push(question('Hours of support / SME access / SLA'));
  blocks.push(answer('Production support: 24/7/365 for P1 (platform down / processing impacted) issues. Standard business hours for P2/P3 issues, with extended coverage available as part of enhanced SLA options. SME access available through escalation path via CSM. Specific SLA terms are defined in the program agreement.'));
  blocks.push(confirm('Attach BRIM standard SLA document in appendix'));

  blocks.push(question('Bug fixes and enhancement requests'));
  blocks.push(answer('Bug fixes for production-impacting issues are addressed on a priority basis outside the standard release cycle. Enhancement requests from BSB are entered into BRIM\'s product roadmap backlog, reviewed in quarterly roadmap sessions, and prioritized based on impact and strategic alignment. BSB receives advance notice of all enhancements affecting its program configuration.'));

  // ══════════════════════════════════════════════════════════════════════════
  // SECTION 7: REFERENCES
  // ══════════════════════════════════════════════════════════════════════════
  blocks.push(sectionHead('Section 7: References', 4));
  blocks.push(confirm('Insert 3 reference accounts — minimum 2 agent bank or card-issuing programs live > 1 year. For each include: company name, contact name, title, phone, email, and brief program description. Confirm each reference is willing to accept calls and in-person visits from BSB.'));

  // ══════════════════════════════════════════════════════════════════════════
  // SECTION 8: SOLUTION ARCHITECTURE
  // ══════════════════════════════════════════════════════════════════════════
  blocks.push(sectionHead('Section 8: Solution Architecture', 5));

  blocks.push(question('Current architecture — functional design map'));
  blocks.push(answer('The BRIM Platform is a cloud-native, microservices-based architecture deployed on a major cloud infrastructure provider with multi-zone redundancy. Core functional layers include: Origination & Decisioning, Account Management, Transaction Processing & Authorization, Servicing & Operations, Fraud & Risk, Loyalty & Rewards, Reporting & Analytics, and Integration Gateway. Full architecture diagrams available under NDA.'));
  blocks.push(confirm('Attach architecture diagrams (functional, security, tenancy, third-party) in appendix'));

  blocks.push(question('Tenancy and environment aspects'));
  blocks.push(answer('BRIM operates a multi-tenant SaaS model with strict logical data isolation between programs. Each BSB-branded program operates in its own isolated data partition. Environments: Production, UAT/Staging (used for BSB testing), and Development. BSB has dedicated UAT access for pre-production testing.'));

  blocks.push(question('Cloud agnostic or cloud specific? BSB-hosted endpoint for CI/CD?'));
  blocks.push(answer('The BRIM Platform is hosted on a major cloud infrastructure provider. BRIM manages all deployment pipelines to maintain security and compliance integrity — BSB does not need to host or manage any CI/CD infrastructure. If BSB has specific requirements around private cloud integration points for core banking connectivity, BRIM supports dedicated API gateway configurations that comply with BSB\'s network security policies.'));

  blocks.push(question('Technology stack'));
  blocks.push(answer('The BRIM Platform is built on a modern, cloud-native microservices architecture using industry-standard containerization, distributed data management, REST APIs for all integrations, and enterprise-grade monitoring and observability tooling. Full architecture and stack details are available to BSB under NDA as part of the technical due diligence process.'));

  blocks.push(question('Browser and mobile support'));
  blocks.push(answer('Management portal: Chrome, Edge, Firefox, Safari (current versions). No plugins or client installation required. Cardholder digital banking: iOS 15+ and Android 10+. The platform is fully responsive for mobile web as well.'));

  blocks.push(question('Reporting and data export'));
  blocks.push(answer('BRIM provides a built-in reporting dashboard with configurable standard reports (transaction activity, portfolio performance, risk metrics, compliance reports). Complex custom reports can be built using BRIM\'s report builder or via data export to BSB\'s BI tools. Data export formats include CSV, XLSX, and JSON via API. Export access is role-restricted and audit-logged.'));

  // ══════════════════════════════════════════════════════════════════════════
  // SECTION 9: RELIABILITY
  // ══════════════════════════════════════════════════════════════════════════
  blocks.push(sectionHead('Section 9: Reliability', 6));
  blocks.push(question('Historical uptime / maintenance windows'));
  blocks.push(confirm('Confirm historical uptime SLA percentage and maintenance window schedule'));
  blocks.push(answer('BRIM targets high availability for processing and authorization systems. Contractual availability commitments are defined in the program SLA. Planned maintenance windows are scheduled during off-peak hours with advance notice to clients. Emergency maintenance is communicated via real-time status alerts.'));

  blocks.push(question('Fault tolerance / load balancing'));
  blocks.push(answer('The BRIM Platform is architected for fault tolerance through multi-zone cloud deployment, automatic failover, and stateless microservice design that allows horizontal scaling. Authorization processing uses active-active redundancy ensuring no single point of failure. Load balancing is managed automatically at the infrastructure level using cloud-native tools.'));

  blocks.push(question('RPO and RTO'));
  blocks.push(answer('BRIM\'s contractually committed RPO and RTO are defined in the program SLA and are aligned to industry standards for card processing platforms. Both the recovery point and recovery time objectives for BSB\'s program will be established in the SLA schedule based on BSB\'s operational requirements. Full details including processing-specific and platform-wide recovery targets are provided during contract negotiation.'));

  // ══════════════════════════════════════════════════════════════════════════
  // SECTION 10: SCALABILITY AND PERFORMANCE
  // ══════════════════════════════════════════════════════════════════════════
  blocks.push(sectionHead('Section 10: Scalability and Performance', 7));
  blocks.push(question('Scaling considerations for BSB'));
  blocks.push(answer('BSB requires no infrastructure management — BRIM handles all platform scaling automatically. As BSB\'s portfolio grows, BRIM\'s cloud infrastructure scales elastically to accommodate increased transaction volumes and account counts. BSB\'s program fee structure includes volume tiers so pricing scales proportionally with portfolio growth.'));

  blocks.push(question('Historical data retention'));
  blocks.push(answer('BRIM\'s data retention framework is configured to BSB\'s specific requirements — aligned to applicable federal and state banking regulations, BSB\'s data governance policies, and examination obligations. BRIM does not impose a fixed retention standard; periods are set to match the regulatory environment BSB operates in. Transaction history, account records, and cardholder data are retained online for active retrieval across the applicable window, with archived storage beyond that window — all retrievable upon BSB\'s request. Retention schedules, storage tiers, and retrieval SLAs will be confirmed with BSB during implementation.'));

  blocks.push(question('Performance benchmarks'));
  blocks.push(answer('The BRIM Platform meets or exceeds card network authorization performance requirements across Mastercard and Visa. The platform has been tested at peak transaction volumes consistent with card programs significantly larger than BSB\'s projected initial portfolio — providing sufficient capacity for BSB\'s projected portfolio growth. Detailed performance benchmarks are available under NDA as part of the technical due diligence package.'));

  // ══════════════════════════════════════════════════════════════════════════
  // SECTION 11: SECURITY AUDIT
  // ══════════════════════════════════════════════════════════════════════════
  blocks.push(sectionHead('Section 11: Security Audit', 8));

  blocks.push(question('Full transaction traceability'));
  blocks.push(answer('Yes. Every transaction processed through the BRIM Platform carries a complete audit trail: initiating channel, user/system identity, pre- and post-state data, and timestamps at initiation and completion. This audit trail is immutable, searchable, and available to BSB through the management portal.'));

  blocks.push(question('SOC 2 Type II / SSAE 16'));
  blocks.push(confirm('Confirm most recent SOC 2 Type II report date and next scheduled audit — attach report in appendix under NDA'));
  blocks.push(answer('BRIM Financial maintains SOC 2 Type II certification covering security, availability, processing integrity, confidentiality, and privacy. The current report is available to BSB under mutual NDA.'));

  blocks.push(question('PCI DSS compliance'));
  blocks.push(answer('The BRIM Platform is PCI DSS Level 1 certified — the highest tier for card payment processors, validated annually by a Qualified Security Assessor (QSA). BSB\'s program operates within BRIM\'s PCI DSS certified environment, meaning BSB does not need to obtain its own separate PCI DSS certification for the card program. BRIM\'s certification covers BSB\'s cardholder data environment. The current Attestation of Compliance (AOC) is available to BSB under NDA.'));
  blocks.push(confirm('Attach PCI DSS Attestation of Compliance in appendix'));

  blocks.push(question('Log retention policy'));
  blocks.push(answer('Security and audit logs are retained in accordance with applicable federal and state banking regulations and BSB\'s internal audit and examination requirements. Logs are tamper-evident, stored separately from application data, and accessible to BSB\'s administrative and audit staff through the management portal. Specific retention periods and access controls are configured to align with BSB\'s regulatory and governance framework during implementation.'));

  blocks.push(question('Admin password rotation / external contractor access'));
  blocks.push(answer('BRIM enforces regular admin credential rotation for all internal administrative accounts in line with financial services security best practices. BSB is notified when admin users assigned to BSB\'s account are changed. External contractors working on platform components are subject to the same access control and audit requirements as full-time employees. BSB is notified of any contractor involvement in BSB-specific configuration.'));

  // ══════════════════════════════════════════════════════════════════════════
  // SECTION 12: SECURITY AND ACCESS
  // ══════════════════════════════════════════════════════════════════════════
  blocks.push(sectionHead('Section 12: Security and Access', 9));

  blocks.push(question('Role-based access control'));
  blocks.push(answer('The BRIM management portal implements granular role-based access control (RBAC) with pre-defined roles (Read-Only, Operational, Supervisor, Admin, Auditor) and the ability to create custom role configurations. BSB\'s admin users can manage their own staff access within their program scope. Screen-level, record-level, and field-level security are all supported.'));

  blocks.push(question('Single Sign-On (SSO)'));
  blocks.push(answer('Yes. The BRIM management portal supports SSO via SAML 2.0 and OAuth 2.0 / OpenID Connect. Integration with Microsoft Azure Active Directory (Entra ID) and Active Directory Federation Services (ADFS) is supported — fully compatible with BSB\'s stated identity infrastructure.'));

  blocks.push(question('Multi-Factor Authentication (MFA)'));
  blocks.push(answer('MFA is enforced for all management portal access. Supported methods include TOTP authenticator apps, SMS, and integration with major enterprise MFA providers compatible with BSB\'s existing identity infrastructure. Cardholder-facing MFA is implemented for account access and high-value transaction step-up authentication.'));

  blocks.push(question('Data encryption in transit and at rest'));
  blocks.push(answer('All data in transit and at rest is encrypted using industry-standard protocols meeting or exceeding applicable financial services security requirements. Hardware security modules (HSMs) are used for card number encryption and key management. All PANs are encrypted throughout the processing chain — BRIM has no exposure of unencrypted card data at any point.'));

  blocks.push(question('PII compliance'));
  blocks.push(answer('BRIM\'s platform complies with applicable US and Canadian data protection requirements for PII including SSN, account numbers, and payment card data. Data minimization principles are applied — BRIM only collects and retains PII necessary for program operation. BSB retains ownership of all cardholder data (see Section 18).'));

  blocks.push(question('Security Incident Response Plan'));
  blocks.push(answer('BRIM maintains a formal Security Incident Response Plan (SIRP) reviewed and updated annually. The plan covers detection, containment, eradication, recovery, and notification procedures including provisions for ransomware attacks. Tabletop exercises are conducted regularly with documented results. BSB is contractually entitled to notification of any security incident affecting its program data within the timeframes required by applicable law and regulation.'));

  // ══════════════════════════════════════════════════════════════════════════
  // SECTION 13: DISASTER RECOVERY
  // ══════════════════════════════════════════════════════════════════════════
  blocks.push(sectionHead('Section 13: Disaster Recovery', 10));
  blocks.push(question('Disaster Recovery Plan'));
  blocks.push(answer('BRIM maintains a Business Continuity and Disaster Recovery (BCDR) plan covering all production services. The plan is exercised regularly with documented results available to BSB during due diligence. Multi-zone cloud deployment provides geographic redundancy. Failover to secondary availability zone is automated and requires no manual intervention for standard failure scenarios.'));
  blocks.push(confirm('Attach BCDR executive summary in appendix — confirm last DR test date and results'));

  blocks.push(question('Backup policies'));
  blocks.push(answer('BRIM maintains continuous replication to a secondary availability zone, frequent automated snapshots, and geo-redundant archival across all production data. Application configuration is version-controlled with automated backup. All backup media is encrypted. Recovery point and time objectives are contractually defined in the program SLA and available during contract negotiation.'));

  blocks.push(question('Hardware decommissioning and media destruction'));
  blocks.push(answer('BRIM\'s infrastructure is cloud-hosted — physical media decommissioning is managed by the cloud provider in accordance with recognized industry media sanitization standards. Certificates of destruction from the cloud provider are available upon BSB\'s request as part of the vendor due diligence package.'));

  // ══════════════════════════════════════════════════════════════════════════
  // SECTION 14: PHYSICAL SECURITY
  // ══════════════════════════════════════════════════════════════════════════
  blocks.push(sectionHead('Section 14: Physical Security', 11));
  blocks.push(answer('The BRIM Platform is hosted in data centers with 24/7 staffed security, multi-factor physical access controls, continuous video surveillance, redundant power and cooling, and fire/flood suppression systems. The hosting infrastructure holds ISO 27001, SOC 1, SOC 2, and SOC 3 certifications. Physical security documentation is available from the cloud provider as part of BRIM\'s vendor due diligence package.'));
  blocks.push(answer('BRIM\'s own offices (for development and operations staff) maintain standard physical access controls appropriate for a financial technology company.'));

  // ══════════════════════════════════════════════════════════════════════════
  // SECTION 15: MANUALS AND DOCUMENTATION
  // ══════════════════════════════════════════════════════════════════════════
  blocks.push(sectionHead('Section 15: Manuals and Documentation', 12));
  blocks.push(answer('BRIM provides complete documentation for all platform components accessible through a secure documentation portal:'));
  blocks.push(bullet('User manual for BSB management portal staff: role-specific guides, updated with each release'));
  blocks.push(bullet('Administrator manual: user management, role configuration, program settings'));
  blocks.push(bullet('API documentation: full integration guides, technical specifications, and sandbox environment for testing'));
  blocks.push(bullet('Cardholder-facing help content: customizable per BSB\'s brand requirements'));
  blocks.push(bullet('Data dictionary: field-level definitions for all data elements in the platform'));
  blocks.push(answer('Source code for the BRIM Platform is maintained in a secure, version-controlled repository. BRIM does not provide source code escrow as the platform is SaaS — BSB\'s continuity is protected through contractual data portability rights and transition assistance provisions.'));

  // ══════════════════════════════════════════════════════════════════════════
  // SECTION 16: UPGRADE CYCLE
  // ══════════════════════════════════════════════════════════════════════════
  blocks.push(sectionHead('Section 16: Upgrade Cycle', 13));
  blocks.push(answer('As a SaaS platform, upgrades are deployed by BRIM and do not require BSB action. Major feature releases are typically delivered quarterly, minor updates and bug fixes monthly. Security patches are prioritized and deployed on an expedited basis — critical vulnerabilities are addressed as a matter of urgency with BSB notified promptly. All platform upgrades maintain full backward compatibility with BSB integrations.'));
  blocks.push(confirm('Insert last 3 release dates and descriptions from Product team'));
  blocks.push(answer('BSB can opt into early access (beta) programs for upcoming features through its CSM. Security and compliance updates are applied automatically to all programs — no BSB action required.'));

  // ══════════════════════════════════════════════════════════════════════════
  // SECTION 17: MODIFICATION PROCESS
  // ══════════════════════════════════════════════════════════════════════════
  blocks.push(sectionHead('Section 17: Modification Process', 14));
  blocks.push(answer('BSB-specific customizations are supported through two mechanisms: (1) configuration within the BRIM platform\'s administrative tools — no development required for most program-specific settings such as credit parameters, fee structures, rewards rules, and cardholder communication templates; and (2) custom development for capabilities not available in standard configuration, managed through BRIM\'s change request process with scoping, pricing, and timeline agreed in advance.'));
  blocks.push(answer('BSB integrations with external systems (e.g., BSB core banking) are managed via BRIM\'s open REST API. BSB\'s technical team can develop integrations against BRIM\'s published API specifications without impacting the BRIM platform. APIs are versioned with extended backward compatibility support — standard deprecation timelines are communicated in advance and defined in the technical SLA.'));
  blocks.push(confirm('Confirm customization pricing structure and typical timeline for inclusion'));

  // ══════════════════════════════════════════════════════════════════════════
  // SECTION 18: API AND DATA OWNERSHIP
  // ══════════════════════════════════════════════════════════════════════════
  blocks.push(sectionHead('Section 18: API and Data Ownership', 15));
  blocks.push(question('API integration capabilities'));
  blocks.push(answer('BRIM provides a full REST API suite covering all platform functions: account origination, account management, transaction inquiry, payment posting, statement retrieval, cardholder communications, fraud rules management, and reporting. APIs are bi-directional — BSB\'s core banking system can both push data to and pull data from the BRIM platform. All APIs use industry-standard authentication and encryption protocols meeting applicable financial services security requirements.'));
  blocks.push(confirm('Attach full API capability documentation in appendix'));

  blocks.push(question('Data ownership'));
  blocks.push(answer('All cardholder data, transaction data, and program data generated through BSB\'s credit card program is owned by BSB. BRIM processes and stores this data solely as a contracted service provider. BSB\'s program data is used exclusively to deliver the contracted services — BRIM does not sell, aggregate, or monetize BSB\'s data for any other purpose. Upon termination of the program, BRIM provides a full data extract to BSB in standard formats within a commercially reasonable timeframe agreed upon in the program agreement.'));
  blocks.push(confirm('Attach standard data ownership contract language in appendix — review with legal'));

  // ══════════════════════════════════════════════════════════════════════════
  // SECTION 19: IMPLEMENTATION AND PROJECT MANAGEMENT
  // ══════════════════════════════════════════════════════════════════════════
  blocks.push(sectionHead('Section 19: Implementation and Project Management', 16));
  blocks.push(question('Implementation methodology'));
  blocks.push(answer('BRIM follows a structured implementation methodology with five phases: (1) Discovery & Design — requirements confirmation, program configuration design, integration architecture; (2) Build & Configure — platform configuration, API integration development, cardholder experience customization; (3) Test — UAT in BRIM\'s staging environment, integration testing, user acceptance; (4) Pilot — limited cardholder launch, operational readiness validation; (5) Full Launch — program go-live with BRIM\'s dedicated go-live support team on-site or virtual through the stabilization period.'));

  blocks.push(question('Core banking integration — Jack Henry SilverLake'));
  blocks.push(answer('BRIM brings proven core banking integration depth across multiple platforms — including Fiserv, Temenos, i2c, and Collabria — each executed using BRIM\'s REST API-first integration methodology: structured data mapping, event-driven transaction posting, and automated reconciliation protocols. This methodology is platform-agnostic and applies directly to new core banking environments.'));
  blocks.push(answer('For BSB\'s Jack Henry SilverLake environment, BRIM\'s integration team will work directly with BSB\'s IT staff and Jack Henry during the Discovery & Design phase to produce a detailed integration specification — data flows, event triggers, reconciliation logic — tailored to BSB\'s SilverLake configuration. BRIM\'s methodology has been proven across comparable core banking architectures, and SilverLake fits squarely within that playbook. The integration specification and timeline will be formalized during Discovery as part of the program project charter.'));

  blocks.push(question('Typical implementation timeline'));
  blocks.push(answer('Implementation timeline for BSB\'s program will be scoped during the project charter phase, accounting for the SilverLake integration workstream and BSB\'s internal resource availability. A BSB-specific project schedule will be provided in the formal proposal. Reference timelines from comparable deployments are available upon request.'));

  blocks.push(question('BSB resources required during implementation'));
  blocks.push(answer('BRIM requires the following BSB resources during implementation: Program Manager (primary point of contact, approximately 0.5 FTE during implementation), IT/Integration Lead (API connectivity to BSB core, approximately 0.25 FTE), Compliance Officer (regulatory and policy review), Operations Lead (servicing procedures and training), and executive sponsor for key decision approvals.'));

  blocks.push(question('Conversion support'));
  blocks.push(answer('BRIM provides 24/7 support during go-live weekend with a dedicated launch team including implementation lead, technical integration engineer, and operations support. Post-launch stabilization support continues through the stabilization period with structured monitoring and rapid response — frequency and duration aligned to BSB\'s operational readiness and program stability. BRIM\'s CSM and technical account manager remain primary contacts through the stabilization period and beyond.'));

  // ══════════════════════════════════════════════════════════════════════════
  // SECTION 20: TRAINING
  // ══════════════════════════════════════════════════════════════════════════
  blocks.push(sectionHead('Section 20: Training', 17));
  blocks.push(answer('BRIM provides a structured training program tailored to BSB\'s team roles:'));
  blocks.push(bullet('Platform Administration Training: Instructor-led (virtual or onsite at BSB) covering management portal, user management, reporting, and configuration. Typically 1–2 days depending on BSB\'s team size and program scope. Delivered pre-launch.'));
  blocks.push(bullet('Operations Staff Training: Covering cardholder servicing workflows, dispute management, and escalation procedures. Scope and duration tailored to BSB\'s operational model.'));
  blocks.push(bullet('Executive Onboarding: Session for BSB leadership covering program performance dashboard, strategic reporting, and BRIM relationship model.'));
  blocks.push(bullet('New Hire Onboarding: On-demand training modules available through BRIM\'s learning portal, accessible to BSB at any time for new staff.'));
  blocks.push(bullet('Release Training: Training materials provided with each major release. BRIM CSM conducts a release walkthrough call for features relevant to BSB\'s program.'));
  blocks.push(answer('Training is provided at no additional charge as part of the standard program agreement for initial onboarding. Refresher sessions and custom training engagements for significant BSB organizational changes may be scoped as professional services.'));
  blocks.push(confirm('Confirm whether onsite training at Bangor, ME location is included in standard scope'));

  // ── Closing ────────────────────────────────────────────────────────────────
  blocks.push(
    new Paragraph({ children: [new PageBreak()] }),
    new Paragraph({ spacing: { before: 1200, after: 200 }, alignment: AlignmentType.CENTER, border: { top: { style: BorderStyle.SINGLE, size: 4, color: C.grayLight } }, children: [new TextRun({ text: 'This document is confidential and prepared solely for Bangor Savings Bank.', size: 18, font: 'Calibri', color: C.gray, italics: true })] }),
    new Paragraph({ spacing: { before: 0, after: 0 }, alignment: AlignmentType.CENTER, children: [new TextRun({ text: `BRIM Financial · BSB RFI Response · ${now.getFullYear()}`, size: 18, font: 'Calibri', color: C.gray })] }),
  );

  return new Document({
    styles: {
      default: {
        document: { run: { font: 'Calibri', size: 22 }, paragraph: { spacing: { line: 276 } } },
        heading1: { run: { font: 'Calibri', bold: true, color: C.navy }, paragraph: { spacing: { before: 240, after: 160 } } },
        heading2: { run: { font: 'Calibri', bold: true, color: C.navy }, paragraph: { spacing: { before: 200, after: 80 } } },
      },
    },
    sections: [{
      properties: { page: { margin: { top: 1080, bottom: 1080, left: 1260, right: 1260 } } },
      headers: { default: new Header({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: C.grayLight } }, children: [new TextRun({ text: 'BSB Credit Card RFI — Narrative Response · BRIM Financial · DRAFT', size: 16, color: C.gray, font: 'Calibri' })] })] }) },
      footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, border: { top: { style: BorderStyle.SINGLE, size: 4, color: C.grayLight } }, children: [new TextRun({ text: `Confidential · BRIM Financial · BSB RFI Response · ${now.getFullYear()} · Page `, size: 16, color: C.gray, font: 'Calibri' }), new TextRun({ children: [PageNumber.CURRENT], size: 16, color: C.gray, font: 'Calibri' }), new TextRun({ text: ' of ', size: 16, color: C.gray, font: 'Calibri' }), new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 16, color: C.gray, font: 'Calibri' })] })] }) },
      children: blocks,
    }],
  });
}

async function main() {
  const doc = build();
  const buf = await Packer.toBuffer(doc);
  const { join } = require('path');
  const { homedir } = require('os');
  const outPath = join(homedir(), `Desktop/BSB_Narrative_Response_BRIM_DRAFT_${DATE}.docx`);
  writeFileSync(outPath, buf);
  console.log(`Narrative: ${outPath} (${Math.round(buf.byteLength / 1024)}KB)`);
}
main().catch(err => { console.error(err); process.exit(1); });
