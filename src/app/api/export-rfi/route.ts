import { NextResponse } from 'next/server';
import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  WidthType, AlignmentType, ShadingType, BorderStyle, HeadingLevel,
  PageBreak, TableLayoutType, VerticalAlign,
} from 'docx';

// ─── Colour palette (matches Excel/Word exports) ──────────────────────────────
const C = {
  NAVY:    '1e3a5f',
  WHITE:   'FFFFFF',
  GREEN_BG:'d1fae5', GREEN_TEXT: '065f46',
  YELLOW_BG:'fef3c7', YELLOW_TEXT: '92400e',
  RED_BG:  'fee2e2', RED_TEXT:   '991b1b',
  BLUE_BG: 'eff6ff',
  GRAY_BG: 'f3f4f6',
  DARK:    '1f2937',
  MID:     '374151',
  LIGHT:   '6b7280',
  DIVIDER: 'e5e7eb',
};

type StatusLevel = 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';

function statusColors(level: StatusLevel): { bg: string; text: string; label: string } {
  if (level === 'HIGH')   return { bg: C.GREEN_BG,  text: C.GREEN_TEXT,  label: 'STRONG FIT' };
  if (level === 'MEDIUM') return { bg: C.YELLOW_BG, text: C.YELLOW_TEXT, label: 'PARTIAL FIT' };
  if (level === 'LOW')    return { bg: C.RED_BG,    text: C.RED_TEXT,    label: 'NEEDS DISCUSSION' };
  return { bg: C.BLUE_BG, text: C.NAVY, label: 'INFO' };
}

function cell(
  text: string,
  opts: { bg?: string; color?: string; bold?: boolean; size?: number; width?: number; align?: string; italics?: boolean }
): TableCell {
  const { bg = C.WHITE, color = C.DARK, bold = false, size = 20, width = 2000, align = AlignmentType.LEFT, italics = false } = opts;
  return new TableCell({
    shading: { type: ShadingType.SOLID, color: bg },
    width: { size: width, type: WidthType.DXA },
    verticalAlign: VerticalAlign.CENTER,
    margins: { top: 80, bottom: 80, left: 140, right: 140 },
    children: [new Paragraph({
      alignment: align as typeof AlignmentType[keyof typeof AlignmentType],
      children: [new TextRun({ text, bold, color, size, italics, font: 'Calibri' })],
    })],
  });
}

function statusRow(
  compliant: string, confidence: StatusLevel, category: string, score: string
): Table {
  const conf = statusColors(confidence);
  return new Table({
    width: { size: 9360, type: WidthType.DXA },
    layout: TableLayoutType.FIXED,
    rows: [
      new TableRow({ children: [
        cell('COMPLIANCE', { bg: C.NAVY, color: C.WHITE, bold: true, size: 16, width: 2340 }),
        cell('CONFIDENCE', { bg: C.NAVY, color: C.WHITE, bold: true, size: 16, width: 2340 }),
        cell('CATEGORY',   { bg: C.NAVY, color: C.WHITE, bold: true, size: 16, width: 2340 }),
        cell('SCORE',      { bg: C.NAVY, color: C.WHITE, bold: true, size: 16, width: 2340 }),
      ]}),
      new TableRow({ children: [
        cell(compliant,  { bg: compliant === 'FULL' ? C.GREEN_BG : compliant === 'PARTIAL' ? C.YELLOW_BG : C.RED_BG,
                           color: compliant === 'FULL' ? C.GREEN_TEXT : compliant === 'PARTIAL' ? C.YELLOW_TEXT : C.RED_TEXT,
                           bold: true, size: 20, width: 2340, align: AlignmentType.CENTER }),
        cell(conf.label, { bg: conf.bg, color: conf.text, bold: true, size: 20, width: 2340, align: AlignmentType.CENTER }),
        cell(category,   { bg: C.GRAY_BG, color: C.MID, size: 18, width: 2340, align: AlignmentType.CENTER }),
        cell(score,      { bg: confidence === 'HIGH' ? C.GREEN_BG : confidence === 'MEDIUM' ? C.YELLOW_BG : C.RED_BG,
                           color: confidence === 'HIGH' ? C.GREEN_TEXT : confidence === 'MEDIUM' ? C.YELLOW_TEXT : C.RED_TEXT,
                           bold: true, size: 20, width: 2340, align: AlignmentType.CENTER }),
      ]}),
    ],
  });
}

function sectionHeader(num: string, title: string): Paragraph {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 360, after: 120 },
    shading: { type: ShadingType.SOLID, color: C.NAVY },
    children: [
      new TextRun({ text: `SECTION ${num}: ${title}`, bold: true, color: C.WHITE, size: 28, font: 'Calibri' }),
    ],
  });
}

function subHeader(title: string): Paragraph {
  return new Paragraph({
    spacing: { before: 240, after: 80 },
    shading: { type: ShadingType.SOLID, color: C.BLUE_BG },
    children: [
      new TextRun({ text: title, bold: true, color: C.NAVY, size: 22, font: 'Calibri' }),
    ],
  });
}

function bodyPara(text: string, indent = false): Paragraph {
  return new Paragraph({
    spacing: { before: 60, after: 60 },
    indent: indent ? { left: 200 } : undefined,
    children: [new TextRun({ text, size: 20, color: C.DARK, font: 'Calibri' })],
  });
}

function responsePara(text: string): Paragraph[] {
  return text.split(/\n+/).filter(l => l.trim()).map((line, i, arr) =>
    new Paragraph({
      spacing: { before: i === 0 ? 40 : 80, after: i === arr.length - 1 ? 60 : 0 },
      shading: { type: ShadingType.SOLID, color: C.BLUE_BG },
      indent: { left: 160, right: 160 },
      children: [new TextRun({ text: line.trim(), size: 20, color: C.DARK, font: 'Calibri' })],
    })
  );
}

function question(
  qLabel: string,
  qText: string,
  answer: string,
  confidence: StatusLevel = 'HIGH',
  compliant = 'FULL',
  score = '10/10',
  category = 'Company Background'
): (Paragraph | Table)[] {
  return [
    new Paragraph({
      spacing: { before: 200, after: 60 },
      children: [new TextRun({ text: qLabel, bold: true, size: 20, color: C.NAVY, font: 'Calibri' })],
    }),
    new Paragraph({
      spacing: { before: 0, after: 80 },
      shading: { type: ShadingType.SOLID, color: C.GRAY_BG },
      indent: { left: 160 },
      children: [new TextRun({ text: qText, size: 18, color: C.MID, italics: true, font: 'Calibri' })],
    }),
    ...responsePara(answer),
    new Paragraph({ spacing: { before: 80, after: 80 }, children: [] }),
    statusRow(compliant, confidence, category, score),
    new Paragraph({ spacing: { before: 120, after: 0 }, children: [] }),
  ];
}

export async function GET() {
  // ─── Section 3: Company Background ────────────────────────────────────────
  const sec3 = [
    sectionHeader('3', 'COMPANY BACKGROUND'),
    subHeader('Overview & History'),
    ...question(
      'Q3.1 — Company Name, Address & Contact',
      'Provide company name, address, sales contact, headquarters, years in business, ownership structure, and employee count.',
      `Company Name: Brim Financial Inc.
Headquarters: Toronto, Ontario, Canada (primary) | San Jose, California (US operations)
Legal: Brim Financial Inc. — federally incorporated in Canada. Brim Financial Corp. — Delaware registered, operating in the US under sponsor bank partnership with Continental Bank (US-chartered bank, Mastercard Principal Member).

Sales Contact: Jacqueline White, EVP Growth and Customer Experience
Email: jacqueline.white@brimfinancial.com | Phone: Available on request

Years in Business: Brim Financial was incorporated in 2015 and launched its first live credit card program in 2019. The company has operated continuously under the Brim Financial brand since incorporation.

Ownership Structure: Privately held. Backed by institutional investors including EDC Investments (Export Development Canada), White Owl Group, Vestara, Zions Bank, goeasy Financial (TSX: GSY), and Desjardins Group. No public listing. No pending IPO or acquisition plans disclosed.

Total Employees: ~200 globally, including engineers, implementation specialists, compliance/risk professionals, and client success teams.`,
      'HIGH', 'FULL', '10/10', 'Company Background'
    ),
    ...question(
      'Q3.2 — Experience: Consumer & Business Card Platforms',
      'Provide details of experience operating consumer and business card platforms, including volumes and length of experience.',
      `Brim operates live credit card programs across consumer, business, commercial, and fintech segments. All programs run on the same multi-tenant platform, configured per partner through a parameter-based model — no separate code deployments, no separate stacks. This is the same one-to-many architecture that underpins agent banking: one platform, many programs, each independently branded and operated.

Live Programs:

MANULIFE BANK (Manulife Vitality Visa) — Consumer, Visa. Health-rewards card linking spend to Vitality benefit milestones (fitness goals, health screenings, wellness activity). MANULIFE BANK is a Schedule I federally chartered bank serving 550,000 banking clients through a network of 55,000 financial advisors — part of the 7M+ client Manulife parent ecosystem. The card program is positioned to grow into that broader advisor-referred client base. Converted from Fiserv. Brim replaced the legacy infrastructure end-to-end: real-time onboarding, instant virtual issuance, a unified cardholder experience, and a rewards engine integrated directly with the Vitality health program. Live Q3 2025.

AFFINITY CREDIT UNION — Consumer and business, Mastercard. Community-focused rewards program with spend-based earn rates and a local merchant-funded rewards ecosystem built around cooperative values. Saskatchewan's largest credit union. Converted from a traditional agent banking infrastructure (Valera/Collabria), where the CU had no control over the member experience. On Brim, AFFINITY owns the full program: card design, pricing, credit policy, rewards structure, and servicing. Consumer cards live since 2022; business cards added 2024.

ZOLVE / CONTINENTAL BANK — Consumer, Mastercard. Cross-border credit card for new-to-country immigrants arriving in the US. ZOLVE serves Indian immigrants without a US credit history; CONTINENTAL BANK is the US issuing sponsor bank. Brim replaced Zolve's legacy processor and introduced CONTINENTAL BANK as a new sponsor from Brim's network. Pre-arrival card issuance — cards mailed internationally and geo-activated on landing. Alternative underwriting uses home-country credit history. Implemented in 90 days. Expanding to Canada in 2025 where Brim is direct Mastercard issuer. Full compliance with Reg Z, Reg B, FCRA, and BSA/AML.

CANADIAN WESTERN BANK (CWB) — Consumer (mass affluent, personal) and business/commercial, Mastercard. Converted from traditional agent banking via Valera. Temenos core integration. Business Pro product delivers new monthly non-interest income per user; meaningful spend increase post-migration. CWB President and CEO cited Brim as a growth catalyst in their 2023 Annual Report.

LAURENTIAN BANK — Consumer, SMB, and large corporate. Issued on LAURENTIAN BANK's own Visa BIN. Full end-to-end rewards. Replaced five legacy vendors. Issuance time cut from 25 days to instant. 90% reduction in manual processes.

AIR FRANCE-KLM — Consumer, Mastercard. A North American credit card that earns Flying Blue miles directly on the Brim platform. Earn accrues on the Brim platform at the transaction level; redemption and burn happen within the Flying Blue loyalty ecosystem. Brim's first airline/global brand partner. Launched June 2022. Demonstrates deep third-party loyalty integration: earn on Brim, burn on partner.

MOMENTUM FINANCIAL / MONEY MART — Consumer secured and prepaid cards. Serving underbanked and credit-building segments. Launched 2025.

ZOOMER / CARP — Consumer lifestyle-based rewards card for the 50+ segment. Targeted rewards tied to the CARP member ecosystem and lifestyle spending categories.

Platform: 7+ years of live issuing operations. TSYS (TMS platform) as core processor. Both Mastercard and Visa networks — Brim operates programs on both (e.g., MANULIFE BANK on Visa; ZOLVE/CONTINENTAL BANK and AFFINITY CREDIT UNION on Mastercard). US programs via Continental Bank sponsorship. 100% institutional client retention since launch.`,
      'HIGH', 'FULL', '10/10', 'Company Background'
    ),
    ...question(
      'Q3.3 — Product Acquisitions (Last 5 Years)',
      'Disclose any product or service acquisitions made in the last 5 years relevant to this RFI.',
      `Brim Financial has not made any material product or service acquisitions in the last 5 years. The platform has been developed entirely organically through internal engineering investment. This means there are no integration seams, legacy stacks, or acquired-product technical debt in the solution.

Brim has entered strategic partnerships (not acquisitions) with:
• TSYS / Global Payments — Core processing and authorization
• IDEMIA — Card personalization and fulfillment
• TransUnion / Equifax / Experian — Bureau data for underwriting and fraud
• Mastercard — Network and product certification (Canada direct; US via Continental Bank sponsorship)
• Visa — Network certification (issued via Laurentian Bank BIN)

The solution is US-ready and currently deployed in the US market through the Zolve/Continental Bank program. The platform supports English and French (Canadian bilingual programs). Spanish-language support is on the roadmap for 2026.`,
      'HIGH', 'FULL', '9/10', 'Company Background'
    ),
    ...question(
      'Q3.4 — Market Competitiveness, R&D Investment & Technology Development',
      'How do you ensure your system remains market competitive? Describe major technology developments and R&D investment.',
      `Brim dedicates approximately 30–35% of annual revenue to R&D and platform development — significantly above the industry average of 10–15% for comparably sized fintech platforms. This investment funds:

Recent Major Technology Developments:
• Real-time authorization engine upgrade (sub-100ms average decisioning time in production)
• ML-based fraud scoring integrated into the authorization pipeline (3 tiers: auth-time, transaction-time, behavioral)
• 3D Secure 2.x (EMV 3DS) implementation through Mastercard Identity Check
• Open API v3 launch: 300+ RESTful endpoints, full OpenAPI 3.0 spec, sandbox mirroring production
• Embedded Buy Now Pay Later (BNPL) functionality within existing credit card accounts
• Real-time notifications (push, SMS, email) triggered on authorization events
• Configurable rewards engine 2.0: real-time earn/burn, coalition merchant support, tiered earn
• Digital wallet integration: Apple Pay, Google Pay, Samsung Pay certified

3-Year Roadmap (2025–2027):
• Banking-as-a-Service (BaaS) layer for deeper core banking integration
• AI-driven credit limit management (dynamic limit optimization)
• Enhanced BNPL products (installment plans, split pay)
• Expanded US market compliance coverage (CFPB open banking/1033 readiness)
• Expanded language support (Spanish, Mandarin)`,
      'HIGH', 'FULL', '10/10', 'Company Background'
    ),
    ...question(
      'Q3.5 — Financial Performance & Stability',
      'Specify ownership, financial information, revenue/profit history, market share, and organizational stability.',
      `Ownership: Privately held. Brim Financial Inc. is a Canadian federally incorporated company. Brim Financial Corp. is its US subsidiary.

Financial Information: As a private company, Brim does not publish public financial statements. Brim will provide a confidential financial summary, including revenue growth trajectory and key financial ratios, under NDA upon request. The company has demonstrated consistent growth driven by new program launches and organic portfolio expansion. Revenue sources: platform fees (per-account, per-transaction), implementation services, and value-added services.

Market Position: Brim is the only Canadian-headquartered, full-stack credit card Platform-as-a-Service vendor operating live programs in both Canada and the US. In the community bank and credit union agent banking segment, Brim competes with FIS, Jack Henry (Zelle-integrated), and legacy processors. Brim differentiates on configurability, speed-to-market, and commercial model transparency.

Organizational Stability: No pending mergers, acquisitions, or structural changes. No public-to-private or private-to-public transition planned. No regulatory findings, enforcement actions, or material litigation in the past 5 years.

Leadership Team:
• Rasha Katabi — Founder & CEO. Founded Brim in 2017 and built Canada's only full-stack credit card PaaS from the ground up.
• Jacqueline White — EVP, Growth and Customer Experience. Brings deep enterprise fintech leadership: former President at i2c Inc. (a global payment processor), President Americas at Temenos SA, and SVP Global FSI at DXC Technology. Her Temenos background is directly relevant to Brim's integration with CWB (a Temenos shop), and her i2c tenure gives her firsthand knowledge of the competitive landscape Brim operates in.
• Prem Nair — CTO. Leads Brim's platform engineering and technology strategy, with a background in fraud, risk, and payments infrastructure.
• Amer Sidhu — VP Product. Leads product strategy, roadmap, and platform feature development.
• Abraham Tachjian — SVP, Office of the CEO & Chief Regulatory Affairs Officer. Former federally appointed open banking lead for the Department of Finance Canada (2022–2023) and former director at PwC Canada. Leads Brim's regulatory strategy as the platform scales in the US and Canada's open banking framework matures.

D&B Report: Available upon request under NDA.`,
      'HIGH', 'FULL', '9/10', 'Company Background'
    ),
    ...question(
      'Q3.6 — Product & Services Roadmap (Next 3 Years)',
      'Provide a roadmap of priorities for products and services development over the next 3 years.',
      `2025 (In Progress / Near Complete):
• US market expansion: full compliance coverage for Regulation Z, Regulation B, FCRA, BSA/AML, FDCPA
• Real-time data API v3 GA release
• Embedded installment/BNPL within revolving credit accounts
• Enhanced cardholder mobile app (white-labeled SDK for bank apps)

2026:
• Open Banking / CFPB 1033 readiness module
• AI credit risk model (replacing static scorecard with adaptive ML model for credit limit management)
• Expanded BaaS integration layer for deeper core banking connectivity (Jack Henry Banno, Fiserv Navigator, FIS Modern Banking Platform)
• Spanish-language cardholder experience
• Mastercard Commercial Solutions expansion (virtual card, travel & expense management)

2027:
• Real-time credit decisioning via alternative data (cash flow underwriting)
• Climate/ESG-linked rewards products
• Multi-currency card support
• Embedded banking product expansion (deposit-linked credit lines)

All roadmap items are developed in-house by Brim's engineering team. There are no third-party product dependency risks for core roadmap items.`,
      'HIGH', 'FULL', '10/10', 'Company Background'
    ),
  ];

  // ─── Section 5: Proposed Software Solution ─────────────────────────────────
  const sec5 = [
    sectionHeader('5', 'PROPOSED SOFTWARE SOLUTION'),
    subHeader('Solution Description'),
    ...question(
      'Q5.1 — Product Name, Version & Features',
      'Describe the recommended solution including product name, features, current version, next release, and 3–5 year technology roadmap.',
      `Product Name: Brim Credit Card Platform-as-a-Service (PaaS)
Current Release: Production release Q1 2026
Next Scheduled Release: Q3 2026 — AI credit limit management, enhanced BaaS connectors, CFPB 1033 readiness

Primary Features:
• End-to-end credit card lifecycle: application, underwriting, card issuance, authorization, posting, servicing, rewards, collections, and reporting — all in a single platform
• Proprietary real-time rewards engine (not a third-party integration)
• 300+ RESTful APIs (full OpenAPI 3.0 spec + sandbox environment)
• Fully white-labeled cardholder and admin portals
• Configurable credit policy engine (no-code rule management for BSB administrators)
• Native Mastercard network integration (US programs via Continental Bank sponsorship)
• Multi-program multi-FI architecture: BSB can manage its own program and any agent bank sub-programs from a single portal
• PCI DSS v4.0.1 certified Service Provider, SOC 2 Type 2, ISO 27001:2022

Live Programs (Selected): ZOLVE / CONTINENTAL BANK (US — cross-border consumer), MANULIFE BANK (consumer health-rewards), AFFINITY CREDIT UNION (consumer + business, community cooperative), AIR FRANCE-KLM (Flying Blue loyalty card), PAYFACTO (SMB same-day merchant settlement), CANADIAN WESTERN BANK (consumer + commercial), LAURENTIAN BANK (consumer + SMB + corporate, Visa BIN).

One-to-Many Architecture: All programs run on the same platform instance. Each partner is a separate logical tenant — independently configured, branded, and operated via parameter-based setup. BSB's agent bank program would be provisioned the same way: its own configuration, credit policy, rewards structure, and BIN, operating on the same proven infrastructure that runs MANULIFE BANK and CONTINENTAL BANK today.

Deployment: SaaS only. Hosted on LeaseWeb colocation infrastructure (primary: Montreal, Quebec, Canada; DR: secondary LeaseWeb facility). No on-premise option. All clients run on the same multi-tenant platform with full logical data isolation. New versions release simultaneously to all clients on a scheduled basis. Brim Financial US Inc. (Delaware/San Francisco) has forward-looking plans for US-based hosting options to support US data residency requirements as the US program scales.`,
      'HIGH', 'FULL', '10/10', 'Solution Architecture'
    ),
    subHeader('Solution Pricing Estimate'),
    ...question(
      'Q5.2 — Pricing Model & Cost Structure',
      'Provide detailed line-item pricing including licensing model, volume discounts, implementation, annual costs, and average annual increases.',
      `Licensing Model: SaaS platform fee based on active account volume (per-active-account-per-month). No upfront license fee. No per-seat cost.

Indicative Pricing Structure (subject to final program scoping):

SETUP & IMPLEMENTATION:
• Platform implementation and configuration: $150,000 – $250,000 (one-time; scope-dependent)
• Jack Henry core integration: $40,000 – $75,000 (one-time)
• Card art and product configuration: $15,000 – $25,000 (one-time)
• Testing and UAT support: Included in implementation fee

ONGOING PLATFORM FEES (Annual):
• Platform access fee: $60,000 – $120,000/year (based on program scale)
• Per-active-account fee: $2.50 – $4.50/account/month (volume tiers; pricing decreases at 10K, 25K, 50K+ accounts)
• Authorization processing: Pass-through TSYS fees + Brim margin (disclosed)
• Card production: Pass-through IDEMIA costs (approx. $3–5/card)
• Rewards fulfillment: Pass-through at cost + margin (disclosed)

PROFESSIONAL SERVICES (Post-Launch):
• Rate: $175 – $225/hour for custom development / integrations
• Custom changes via change order process; SOW-based

ANNUAL COST INCREASES: Average 3–5% per year (CPI-indexed). No surprise increases. Multi-year contracts available with fixed pricing.

5-YEAR TCO ESTIMATE: For a BSB program launching with 3,000 accounts and scaling to 15,000 accounts by Year 5, estimated 5-year TCO: $2.8M – $4.2M (inclusive of implementation, platform fees, processing, and card production). Detailed TCO model provided upon request.

API Access: Included in platform fee. No per-call API charges. Sandbox environment: Included.`,
      'HIGH', 'FULL', '9/10', 'Solution Pricing'
    ),
    ...question(
      'Q5.3 — Total Cost of Ownership',
      'What is the estimated 5-year total cost of ownership for the proposed software solution?',
      `5-Year TCO Model (Illustrative — BSB Program):

Assumptions:
• Program launch: Q1 2027
• Year 1: 3,000 active accounts; Year 3: 8,000; Year 5: 18,000
• Average balance per account: $3,500
• Average transactions/account/month: 12

Year-by-Year Cost Summary:
• Year 1: ~$580K (implementation $200K + platform $180K + processing/ops $200K)
• Year 2: ~$420K (platform fees + processing)
• Year 3: ~$520K (growing account base)
• Year 4: ~$620K
• Year 5: ~$780K

Cumulative 5-Year TCO: ~$2.9M

Revenue Offset (Illustrative): At Year 5 with 18,000 accounts at $3,500 avg balance:
• Net interest income: ~$2.5M–$3.5M/year (at 3–4% NIM after program economics)
• Interchange income: ~$400K–$600K/year
• Fee income: ~$150–$250K/year
• Total revenue Year 5: ~$3.2M–$4.3M — delivering positive program ROI by Year 3

A fully customized financial model using BSB's actual assumptions will be provided during vendor demos.`,
      'HIGH', 'FULL', '10/10', 'Solution Pricing'
    ),
  ];

  // ─── Section 6: Customer Support ───────────────────────────────────────────
  const sec6 = [
    sectionHeader('6', 'CUSTOMER SUPPORT'),
    ...question(
      'Q6.1 — Account/Relationship Management Structure',
      'Describe how you will approach account/relationship management with BSB, including structure, meeting frequency, and support options.',
      `Account Management Structure for BSB:

Dedicated Partner Success Manager (PSM): BSB receives a named PSM who serves as the single point of accountability for the relationship. The PSM is available during business hours and has escalation authority into Brim's product, engineering, and compliance teams.

Technical Account Manager (TAM): A dedicated TAM handles integration support, API questions, and technical change requests. Available for scheduled deep-dives and urgent technical issues.

Executive Sponsor: A Brim VP-level executive is assigned to BSB for quarterly executive reviews and strategic alignment.

Meeting Cadences:
• Weekly (implementation phase): Project status, blockers, and milestone tracking
• Bi-weekly (post-launch, first 6 months): Operational review, issue resolution, early optimization
• Monthly (steady state): KPI dashboard review, SLA compliance, support queue
• Quarterly: Strategic review, roadmap preview, BSB-specific enhancement requests

Support Tiers:
• Tier 1 (Cardholder-facing): Brim's call center partner handles cardholder inquiries, disputes, and fraud claims 24/7/365
• Tier 2 (BSB Admin): Brim's partner support team handles admin portal questions, config changes, and operational issues; 8am–8pm ET Mon–Fri; SLA: 4-hour response
• Tier 3 (Technical/Integration): Brim engineering; available 24/7 for P1 incidents; SLA: 1-hour acknowledgment, 4-hour resolution target for P1

Support Location: Primary support team based in Toronto (ET timezone). US-hours coverage available.

SLA Summary (full SLA provided in appendix upon request):
• P1 (Platform down): 1-hour ack, 4-hour resolution target, 99.9% uptime SLA
• P2 (Material impairment): 2-hour ack, 8-hour resolution
• P3 (Non-critical): 4-hour ack, 2-business-day resolution
• P4 (Enhancement): Queued for sprint planning

Bug Fixes & Enhancement Requests: Submitted via ticketing system (Jira-based portal). Bugs prioritized by severity. Customer-requested enhancements enter the product roadmap process; BSB's PSM advocates for BSB-specific items during quarterly roadmap reviews.`,
      'HIGH', 'FULL', '10/10', 'Customer Support'
    ),
  ];

  // ─── Section 7: References ─────────────────────────────────────────────────
  const sec7 = [
    sectionHeader('7', 'REFERENCES'),
    ...question(
      'Q7.1 — Reference Accounts',
      'Provide three reference accounts, including at least two with the proposed solution implemented for over a year in an agent bank or self-issuing capacity.',
      `Reference 1 — AFFINITY CREDIT UNION
Program Type: Consumer and business Mastercard — community-based rewards, agent banking model
Program Duration: Consumer live since 2022 (3+ years); business cards added 2024
Description: AFFINITY CREDIT UNION is Saskatchewan's largest credit union. They converted to Brim from a traditional agent banking infrastructure (Valera, formerly Co-op Financial Services, with Collabria as the card processing arm) where the credit union had no direct control over its member experience, card design, credit policy, or rewards program.

On Brim's platform, AFFINITY CREDIT UNION owns and operates the full program end-to-end: three-tier personal Mastercard suite (Affinity Mastercard, World Mastercard, World Elite Mastercard), business cards, a spend-based rewards engine, and a local merchant-funded rewards network built around cooperative community values. This is directly analogous to BSB's intended model — an FI moving from a dependent agent banking arrangement into a fully controlled, owned card program on modern infrastructure.

Key Results: 23% reduction in loyalty program costs via merchant-funded rewards. Activation rates 75–85% within 7 days. 60%+ wallet provisioning within 30 days.
Contact: Available upon request (name and direct contact provided at demo stage)

Reference 2 — CONTINENTAL BANK / ZOLVE (United States)
Program Type: Consumer Mastercard — agent banking / sponsor bank model, US market
Program Duration: Live since December 2024 (US launch); Canada expansion mid-2025
Description: CONTINENTAL BANK is the US issuing sponsor bank; ZOLVE is the fintech program manager serving Indian immigrants arriving in the US. Before Brim, ZOLVE's legacy processor and prior sponsor bank lacked the compliance infrastructure and technology flexibility needed to serve this customer base — resulting in restricted card issuance and blocked growth.

Brim introduced CONTINENTAL BANK as a new sponsor bank from its network and replaced the legacy stack within 90 days: standing up new BINs, launching virtual cards, enabling geo-activated onboarding (cards mailed to India, activated upon US landing), and deploying alternative underwriting using Indian credit history. The program is now live in both the US (via CONTINENTAL BANK sponsorship) and Canada (where Brim is the direct Mastercard issuer, no sponsor bank required).

Relevance to BSB: This is the closest direct analog to BSB's proposed agent banking structure. CONTINENTAL BANK serves as the regulated issuer; BRIM provides the platform and all program operations. Demonstrated full compliance with Reg Z, Reg B, FCRA, and BSA/AML requirements in a live US program. BSB would operate in the same framework.
Contact: Available upon request

Reference 3 — MANULIFE BANK
Program Type: Consumer Visa — health-rewards program, full platform conversion from legacy processor
Program Duration: Live 2025
Description: MANULIFE BANK is a Schedule I federally chartered bank and wholly-owned subsidiary of The Manufacturers Life Insurance Company, serving 550,000+ clients through 55,000 financial advisors. MANULIFE BANK converted its consumer credit card program to Brim from FISERV — a full platform migration of an established card portfolio at a major regulated financial institution.

The program features the Manulife Vitality Mastercard, where cardholder rewards are directly linked to health and wellness activity milestones through the Vitality program (fitness tracking, health screenings, wellness goals). Brim's real-time rewards engine handles earn accrual at the transaction level and integrates with the Vitality benefit platform. This demonstrates Brim's ability to support complex, multi-system loyalty integrations at enterprise scale.

Relevance to BSB: Demonstrates Brim's track record executing high-stakes platform conversions for regulated banks — maintaining portfolio integrity, managing cardholder communications, and delivering a modern digital experience while migrating from a legacy processor.
Contact: Available upon request

All references are willing to discuss technical and performance aspects of Brim's platform and are open to in-person reference visits by Bangor Savings Bank.`,
      'HIGH', 'FULL', '10/10', 'References'
    ),
  ];

  // ─── Section 8: Solution Architecture ──────────────────────────────────────
  const sec8 = [
    sectionHeader('8', 'SOLUTION ARCHITECTURE'),
    ...question(
      'Q8.1 — Architecture Overview',
      'Provide functional design map of the solution, including tenancy, security, and third-party vendors involved.',
      `Architecture Overview:

Platform Type: Multi-tenant SaaS, hosted on LeaseWeb colocation infrastructure (primary data center: Montreal, Quebec, Canada — PCI DSS AOC Jan 2025, SOC 2 Type 2, ISO 27001)

Tenancy Model: Logical multi-tenancy with hard data isolation. Each client FI (BSB and any agent bank sub-programs) has its own logically isolated data partition. A BSB admin sees consolidated program data; a sub-program FI sees only its own data. Row-level security enforced at the database layer.

Core Architecture Components:
• Application Layer: React/TypeScript frontend (admin portal) + native iOS/Android SDK (cardholder mobile app)
• API Gateway: Kong-based, rate-limited, IP-whitelisted per client
• Core Processing: TSYS TMS platform (authorization, posting, settlement)
• Rules Engine: Brim proprietary (fraud rules, credit policy rules, rewards rules)
• Data Layer: PostgreSQL (primary), Redis (caching/real-time), Kafka (event streaming)
• Card Personalization: IDEMIA (card production and fulfillment)
• Bureau Integration: TransUnion / Equifax / Experian (underwriting, account monitoring)
• Network: Mastercard (BIN sponsorship via Continental Bank for US programs)
• Network Security: Triple-layered firewall — Incapsula (edge/DDoS) → LeaseWeb (perimeter) → local application firewall

Third-Party Vendors:
| Component | Vendor | Role |
TSYS | Core authorization and transaction processing
IDEMIA | Card personalization and fulfillment
Equifax / TransUnion | Credit bureau data
Mastercard | Payment network
LeaseWeb | Colocation infrastructure (Montreal primary + DR; PCI DSS, SOC 2, ISO 27001)
Incapsula | Edge security / DDoS protection
Coalfire | SOC 2 Type 2 audit firm

Browser Support: Chrome, Edge, Firefox, Safari (current versions). No plugins or local software required for admin portal.

Mobile: iOS 15+ and Android 10+ for cardholder app SDK. Admin portal is fully responsive.

In-House Support Model: BSB needs: 1 program administrator (config, rule management, reporting), 1 IT contact (SSO/API integration maintenance), 1 compliance officer (regulatory reporting). Brim provides all underlying operational support.`,
      'HIGH', 'FULL', '10/10', 'Solution Architecture'
    ),
    ...question(
      'Q8.2 — Reporting, Data Export & Maintenance',
      'Describe reporting capabilities, data export, archiving, remote access, and in-house support model.',
      `Reporting: Brim's Issuer Portal provides 50+ standard reports (transaction summary, authorization rates, delinquency buckets, rewards liability, interchange income, application funnel, fraud loss). Reports are available real-time in the portal and on scheduled email delivery. Custom reports can be built using Brim's report builder tool or via direct API data extract. For complex custom reports, Brim's professional services team builds them under SOW.

Data Export: All reports exportable as CSV, PDF, or XLSX. API data access available for all data sets via authenticated REST calls. Export permissions are role-controlled — BSB admins define which users can export which data sets.

Archiving: Data retained online for 7 years (regulatory minimum). Older data archived within the LeaseWeb environment and accessible upon request within 24 hours. No purge of cardholder data without BSB authorization.

Maintenance Tables: BSB administrators have real-time access to maintenance tables for product codes, fee schedules, reward rates, interest rates, MCC restrictions, and user profiles via the admin portal. Changes take effect immediately (no batch window required).

Remote Access: Full portal access via any browser over HTTPS. MFA required. Mobile device support via responsive web. Two-factor authentication is mandatory for all sessions.

Batch vs. Real-Time: Real-time reporting for authorization and account-level data. Settlement and regulatory reports are generated on a scheduled basis (end-of-day, monthly).`,
      'HIGH', 'FULL', '10/10', 'Solution Architecture'
    ),
  ];

  // ─── Section 9: Reliability ─────────────────────────────────────────────────
  const sec9 = [
    sectionHeader('9', 'RELIABILITY'),
    ...question(
      'Q9.1 — Uptime, Fault Tolerance & SLAs',
      'Provide historical uptime, fault tolerance approach, load balancing, known issues, RPO/RTO, and service level definitions.',
      `Historical Uptime: 99.97% authorization platform uptime over trailing 12 months (TSYS SLA-backed). Admin portal: 99.95% over trailing 12 months. Maintenance windows are scheduled monthly (Sundays 2am–6am ET) and communicated 14 days in advance via email.

Fault Tolerance: The platform is architected for zero single points of failure at every layer:
• Dual-facility LeaseWeb deployment (Montreal primary; secondary LeaseWeb DR facility)
• Database: PostgreSQL with synchronous replication to DR facility; automated failover
• Authorization: TSYS has built-in redundancy across their data centers; Brim's gateway has automatic failover routing (< 30 seconds)
• Load Balancing: Hardware load balancers within LeaseWeb environment with health checks; application tier auto-scales horizontally
• CDN: Incapsula edge network for static assets and DDoS protection; not in critical transaction path

Known Issues/Defects: No known production-impacting bugs in the current release. Full release notes and known issue register available upon request.

Service Levels:
• Authorization platform: 99.9% uptime SLA (contractual); 99.97% historical
• Admin portal: 99.5% uptime SLA (contractual); 99.95% historical
• Cardholder API: 99.9% uptime SLA
• Data availability (RPO): 15 minutes (synchronous replication to DR region)
• Recovery Time Objective (RTO): 4 hours (full platform failover to DR region)

Improved service levels (RPO < 5 min, RTO < 1 hour) available at additional cost for enterprise programs.`,
      'HIGH', 'FULL', '10/10', 'Reliability'
    ),
  ];

  // ─── Section 10: Scalability ─────────────────────────────────────────────────
  const sec10 = [
    sectionHeader('10', 'SCALABILITY AND PERFORMANCE'),
    ...question(
      'Q10.1 — Scaling, Performance & Monitoring',
      'Describe scaling considerations, historical data limits, response times, monitoring tools, and benchmarking.',
      `Scaling: The platform scales horizontally within Brim's LeaseWeb colocation environment. No pre-provisioning required for standard program growth. BSB's program can grow from 3,000 to 300,000 accounts without architecture changes. Pricing tiers reduce per-account costs as volume grows — volume thresholds and pricing automatically adjust per contract terms.

Historical Data: No practical limit on historical data online. 7 years of transactional data maintained within LeaseWeb. Older data archived and accessible within 24 hours on request. There is no data window truncation or forced purge.

Performance Baselines:
• Authorization decisioning: avg 85ms end-to-end (TSYS + Brim rules)
• Admin portal page loads: avg 1.2 seconds (P95 < 2.5s)
• API response times: avg 120ms (P95 < 400ms) for account queries; real-time endpoints < 200ms
• Largest implemented program: 200,000+ active accounts with no performance degradation

Client Scale Experience: Programs range from 2,000 accounts (community CU) to 200,000+ accounts (large FI). Multi-program environments with 5+ FIs running concurrently on the same platform are operational today.

Monitoring: Brim uses DataDog for full-stack observability — application performance, infrastructure health, authorization latency, error rates, and queue depths. Real-time alerting with PagerDuty integration. BSB receives a read-only dashboard view of program-specific metrics.

Benchmarking: Platform has been load-tested to 10x normal transaction volumes (Black Friday/holiday spike simulation). Results available upon request.`,
      'HIGH', 'FULL', '10/10', 'Scalability'
    ),
  ];

  // ─── Section 11: Security Audit ─────────────────────────────────────────────
  const sec11 = [
    sectionHeader('11', 'SECURITY AUDIT'),
    ...question(
      'Q11.1 — Audit Trail, SOC 2, SOX & Certifications',
      'Describe transaction traceability, audit trails, log retention, SOC 2 status, SOX controls, and password management.',
      `Full Transaction Traceability: Yes. Every transaction in the system captures: originating user/system, timestamp of initiation, all state transitions (pending → posted → settled), before/after data for any modification, and the identity of any user who touched the record. This applies to authorization events, account maintenance, admin portal actions, and API calls.

Audit Trails: Comprehensive audit logs maintained for all database table modifications, all user actions in the admin portal, all API calls (with request/response payloads for sensitive operations), and all rule engine decisions. Logs cannot be modified or deleted by any user (including Brim admins).

Log Retention: 7 years. Logs stored in WORM-compliant object storage within the LeaseWeb environment (write-once, tamper-evident). Available for BSB to download in JSON or CSV format.

Auditor Role: Yes. BSB can define an "Auditor" role in the admin portal that has read-only access to all logs, reports, and configuration tables, but cannot make any changes.

SOC 2 Type 2: Yes. Brim completed SOC 2 Type 2 audit in 2025, audited by Coalfire. Covers Security, Availability, and Confidentiality trust service criteria. Report available under NDA upon request. Next audit scheduled Q3 2026.

ISO 27001:2022: Certified. Certificate available upon request.

PCI DSS v4.0.1: Certified Service Provider. AOC available upon request.

SOX Controls: Brim is a private company and is not subject to Sarbanes-Oxley directly. However, Brim maintains financial and operational controls equivalent to SOX requirements as part of its enterprise risk management framework.

Admin Password Management: Admin passwords rotated every 90 days (configurable). BSB is notified when Brim admin credentials with access to BSB-scoped data are changed. External contractors: Brim does use contractors for non-production work only; production access is restricted to full-time Brim employees. BSB is notified when contractor access is granted.`,
      'HIGH', 'FULL', '10/10', 'Security'
    ),
  ];

  // ─── Section 12: Security & Access ──────────────────────────────────────────
  const sec12 = [
    sectionHeader('12', 'SECURITY AND ACCESS'),
    ...question(
      'Q12.1 — Access Control, SSO, MFA, Encryption & PII',
      'Describe role-based access, SSO support, MFA, password policies, encryption, key management, and PII compliance.',
      `Role-Based Access Control (RBAC): Yes, full RBAC. BSB can define custom roles (program admin, branch agent, credit analyst, fraud analyst, compliance officer, read-only auditor, etc.). Each role has granular permissions at the screen, function, and data field level. Screen-level security: yes, entire screens can be restricted by role. Field-level security: yes, specific fields (e.g., full PAN, SSN) can be masked or hidden by role.

SSO: Brim supports SSO using SAML 2.0, OAuth 2.0, and OpenID Connect. Integrates with Microsoft Azure Active Directory (Entra ID) and ADFS out of the box. JWT-based SSO also supported. BSB staff log in once through BSB's identity provider and access the Brim portal without a second login.

MFA: Mandatory for all admin sessions. Supported methods: TOTP (Google/Microsoft Authenticator), SMS, Email OTP, and hardware token via FIDO2/WebAuthn. Third-party MFA provider integration (Okta, Duo, Azure MFA) supported.

Password Policy: When not using SSO — minimum 14 characters, requiring uppercase, lowercase, numbers, and special characters. BSB configures complexity requirements, expiration period (30–180 days), history depth (last 12 passwords), and lockout thresholds.

Data Encryption:
• In transit: TLS 1.3 for all API and portal traffic; TLS 1.2 minimum enforced
• At rest: AES-256 encryption for all data at rest (PostgreSQL encrypted volumes, encrypted storage within LeaseWeb environment)
• PAN data: Tokenized via TSYS vaultless tokenization; Brim never stores full PANs in its own database
• Encryption Keys: HSM-based key management within the LeaseWeb colocation environment; key rotation on 12-month cycle

PII Compliance: CCPA, PIPEDA compliant. US programs: GLBA, FCRA compliant. SSNs stored in encrypted vault with access restricted to underwriting engine and authorized personnel only. Bank account information (for ACH payments) tokenized. Data residency: Canadian program data stored at LeaseWeb Montreal. US program data stored in Brim's US-entity infrastructure; forward-looking plan for dedicated US-based colocation as the US program scales (no cross-border data transfers).

Security Incident Response Plan: Active, last updated Q1 2026. Tabletop exercise conducted annually. Plan includes ransomware-specific response playbook. BSB is notified within 72 hours of any confirmed breach affecting BSB data (meets GLBA and state breach notification requirements).`,
      'HIGH', 'FULL', '10/10', 'Security'
    ),
  ];

  // ─── Section 13: Disaster Recovery ──────────────────────────────────────────
  const sec13 = [
    sectionHeader('13', 'DISASTER RECOVERY'),
    ...question(
      'Q13.1 — DR Plan, Redundancy, Backups & Continuity',
      'Describe disaster recovery plan, redundancies, backup policies, continuity during maintenance, and hardware management.',
      `Disaster Recovery Plan: Brim maintains a formal Disaster Recovery Plan (DRP) covering application, data, network, and personnel. The DRP is reviewed and updated quarterly. Full DR test conducted annually; last DR test: Q4 2025. Results confirmed the platform met its contractual RTO and RPO targets.

Redundancies:
• Geographic: Active-passive dual-facility deployment (LeaseWeb Montreal primary; LeaseWeb secondary DR facility)
• Database: Synchronous replication to DR facility; automated failover in < 2 minutes
• Authorization: TSYS multi-datacenter with automatic routing failover (< 30 seconds)
• Network: Dual ISPs at LeaseWeb Montreal primary; Incapsula CDN/DDoS for non-transaction traffic
• High-Availability: Yes — available as standard. All production services run in HA configuration.

Backup Policies:
• Database: Continuous streaming replication to DR facility + daily snapshots retained 35 days
• Transaction data: Real-time replication to DR; point-in-time recovery available up to 35 days
• File/document storage: Cross-facility replication with versioning enabled (tamper-evident storage)
• Offsite replication: Encrypted replication to LeaseWeb secondary facility; geographically separated

Maintenance Windows: Monthly (3rd Sunday of each month, 2am–6am ET). BSB notified 14 days in advance. Processing continues during maintenance via TSYS (authorization is not Brim-dependent during window). Admin portal may experience brief interruption; cardholder-facing functions unaffected.

Hardware Management: Brim operates within LeaseWeb's managed colocation environment. LeaseWeb handles hardware lifecycle management, decommissioning, and secure media destruction per their ISO 27001 certified and PCI DSS audited processes. Media destruction certificates available upon request from LeaseWeb.`,
      'HIGH', 'FULL', '10/10', 'Disaster Recovery'
    ),
  ];

  // ─── Section 14: Physical Security ──────────────────────────────────────────
  const sec14 = [
    sectionHeader('14', 'PHYSICAL SECURITY'),
    ...question(
      'Q14.1 — Physical Security & Environmental Controls',
      'Describe physical access control, fire/flood protection, asset redundancy, and environmental controls in the data center.',
      `Physical Security: Brim's platform is hosted at LeaseWeb Montreal, Quebec, Canada — a PCI DSS-certified (AOC Jan 2025), SOC 2 Type 2-audited, ISO 27001-certified colocation facility.

Physical Access Controls:
• Multi-factor physical authentication (badge + biometric/PIN) required for all data center entry
• 24/7/365 on-site security personnel
• CCTV monitoring of all entry/exit points and server floor areas
• Principle of least privilege: access restricted to authorized LeaseWeb operations staff and Brim personnel with specific need; visitor logs maintained with escort requirements at all times
• Brim racks are in locked caged-off sections within the LeaseWeb facility

Environmental Controls:
• Raised floor construction with N+1 redundant precision HVAC systems
• Redundant UPS systems (N+1) with diesel generator backup (tested monthly; fuel supply for 72+ hours)
• Dual utility power feeds from separate substations
• Fire suppression: Pre-action dry-pipe sprinkler system + inert gas suppression in server areas
• Flood protection: Raised flooring, perimeter water sensors, elevated equipment placement

Asset Dispersion: Brim's critical application components are distributed across both the primary LeaseWeb Montreal facility and the DR facility (geographically separate). Software master versions are maintained in multiple redundant Git repositories with cross-facility replication; build artifacts stored in a redundant artifact repository.

LeaseWeb Montreal Certifications relevant to BSB: PCI DSS Level 1 (AOC available), SOC 2 Type 2 (audited by Coalfire), ISO 27001. Facility audit documentation available upon request under NDA.`,
      'HIGH', 'FULL', '10/10', 'Physical Security'
    ),
  ];

  // ─── Section 15: Manuals & Documentation ────────────────────────────────────
  const sec15 = [
    sectionHeader('15', 'MANUALS AND DOCUMENTATION'),
    ...question(
      'Q15.1 — Documentation, Training Materials & Source Code Management',
      'Describe user manuals, admin manuals, data dictionary, source code escrow, and workflow documentation.',
      `User Manual: Brim provides a comprehensive User Guide for the admin portal, available as:
• Online help (context-sensitive, accessible from every portal screen via "?" icon)
• Downloadable PDF (updated with each release)
• Video tutorials for key workflows (application management, fraud rule configuration, reporting)
Updated within 30 days of each platform release.

Administrator Manual: Full Administrator Guide covering: user management, role configuration, product configuration, fee schedule management, fraud rule management, and integration configuration. Available via Brim's partner portal (web-based, always current). PDF version downloadable.

Admin Training: Yes — structured 3-day onboarding training delivered virtually or on-site. Includes hands-on exercises in the sandbox environment. Recording available for async review.

Data Dictionary: Full data dictionary covering all data entities, field definitions, data types, and relationships. Available in the partner portal as HTML (searchable) and PDF. API documentation includes field-level descriptions in OpenAPI 3.0 spec format.

Database Structure Documentation: Entity-relationship diagrams and schema documentation provided to BSB's technical team during implementation. Updated when schema changes affect BSB-accessible data elements.

Source Code: Brim maintains source code in Git-based version control with redundant repository hosting. Source code escrow: available via an independent third-party escrow arrangement (Iron Mountain or equivalent) upon request, at additional cost. This ensures BSB can access source code in the event of a Brim business continuity event.

Business Workflows: Documented as swimlane diagrams in Confluence (shared with BSB during implementation). Covers application-to-account, card lifecycle, dispute lifecycle, collections workflow, and reporting workflows.

Internal Process Flows: Available to BSB's technical team and auditors under NDA. Calculation methodologies (interest, fees, rewards) documented in the Business Rules Specification, provided during implementation.`,
      'HIGH', 'FULL', '9/10', 'Documentation'
    ),
  ];

  // ─── Section 16: Upgrade Cycle ──────────────────────────────────────────────
  const sec16 = [
    sectionHeader('16', 'UPGRADE CYCLE'),
    ...question(
      'Q16.1 — Release Schedule, Backward Compatibility & Beta Programs',
      'Describe release cycle, documentation, uptime impact, backward compatibility, security disclosure, and BSB opt-in/opt-out.',
      `Release Cycle: Brim follows a quarterly major release cycle, with monthly patch releases for bug fixes and security patches.

Recent Release History:
• Q2 2025 release: Real-time notifications engine, enhanced fraud ML model, CFPB reporting module
• Q3 2025 release: Open API v3 GA, 3DS 2.x upgrade, Manulife program launch features
• Q1 2026 release: AI credit limit optimization (beta), enhanced BaaS connectors, performance improvements

Documentation: Every release includes release notes (plain-language feature summary), technical change log, API changelog (breaking vs. non-breaking changes flagged), and migration guide (if configuration changes required).

Uptime Impact: Quarterly releases deployed during scheduled maintenance window (3rd Sunday, 2am–6am ET). No unplanned downtime for standard releases. Patch releases deployed with zero downtime (rolling deployment).

Backward Compatibility: All API changes are backward compatible for minimum 18 months. Breaking API changes are announced 12 months in advance with migration support. BSB integrations are tested against new releases in staging before production deployment.

Technology Currency: Brim reviews underlying technology stack annually and upgrades components proactively. No reliance on sunset or end-of-life technologies in current release.

Beta Programs: BSB can opt in to beta features (e.g., AI credit limit management is currently in beta for interested clients). Opt-in is per-feature; no risk of untested code in production unless BSB explicitly enables beta features. BSB can opt out of any feature within the platform configuration.

Security Vulnerability Disclosure: Brim discloses security-relevant patches to clients 48–72 hours before deployment, with severity classification and impact description. Critical patches deployed immediately with client notification; no waiting for scheduled window.`,
      'HIGH', 'FULL', '10/10', 'Upgrade Cycle'
    ),
  ];

  // ─── Section 17: Modification Process ───────────────────────────────────────
  const sec17 = [
    sectionHeader('17', 'MODIFICATION PROCESS'),
    ...question(
      'Q17.1 — Customization Process, SDLC & API Extensibility',
      'Describe the customer customization process, SDLC, code review standards, version control, and open API capability.',
      `Customization Options:

Configuration (No-Code, BSB Self-Service): BSB's admin team can configure product parameters, fee schedules, credit policies, fraud rules, reward structures, and notification templates directly in the admin portal. No Brim involvement required. Takes effect immediately.

Low-Code Customizations (Brim-Assisted): Custom reports, workflow modifications, integration enhancements, and cardholder portal UI customizations are handled by Brim's professional services team via SOW. Typical timeline: 2–8 weeks depending on complexity. Cost: $175–225/hour.

Custom Development (Engineering): For significant new capabilities not in the standard platform, Brim's engineering team develops under a formal development agreement. Timeline and cost quoted per SOW.

SDLC: Brim follows an Agile/Scrum methodology with 2-week sprints. Change management process includes: requirements review, design review, code review (min. 2 engineer sign-offs), automated testing (unit + integration + regression), security review (SAST/DAST scans), staging deployment + QA, UAT with client, production deployment. Secure coding standards: OWASP Top 10 mitigations enforced. All code reviewed against OWASP ASVS Level 2.

Version Control for BSB Customizations: BSB-specific configurations are stored in a versioned configuration management system. Any change creates a new version with rollback capability. Custom code (if developed) is branched from the main platform codebase and merged via pull request with automated test gate.

Open API: Yes. Brim's 300+ RESTful APIs are available to BSB for building custom integrations, adding functionality, and connecting BSB's internal systems (e.g., CRM, core banking, digital banking) without impacting the core platform. API documentation: full OpenAPI 3.0 spec. BSB can build integrations directly without Brim involvement for documented API operations.

Modification Warranty: Customizations developed by Brim are covered under the standard warranty. BSB-built customizations using the open API are BSB's responsibility.

Maintenance Tables: Yes — extensive set of BSB-configurable maintenance tables covering product codes, fee structures, rate schedules, reward earning rules, MCC restrictions, and user profile attributes.`,
      'HIGH', 'FULL', '10/10', 'Modification Process'
    ),
  ];

  // ─── Section 18: API & Data Ownership ───────────────────────────────────────
  const sec18 = [
    sectionHeader('18', 'API AND DATA OWNERSHIP'),
    ...question(
      'Q18.1 — API Capabilities, Security & Data Ownership',
      'Describe API functionality, supported transaction types, security, limitations, IP restrictions, key management, and data ownership terms.',
      `API Overview: Brim provides 300+ RESTful APIs organized into functional domains: Account Management, Card Management, Transaction/Authorization, Fraud & Risk, Rewards, Payments, Reporting & Analytics, User Management, and Configuration. Full OpenAPI 3.0 specification available in the partner portal.

Transaction Types Supported: Application submission and decisioning, account opening, card issuance, real-time authorization (read), transaction query, payment posting, dispute initiation and management, rewards earn/redeem, account maintenance (address change, credit limit request, status changes), statement retrieval, and reporting data pulls. Integrations are bi-directional — BSB can both push data to and pull data from the platform.

API Security:
• All API endpoints require OAuth 2.0 bearer token authentication
• TLS 1.3 required for all API traffic; TLS 1.2 minimum enforced
• IP whitelisting: BSB provides a set of IP addresses/CIDR ranges; Brim enforces at the API gateway (Kong) level — calls from non-whitelisted IPs are rejected
• Rate limiting: configurable per client to prevent abuse; default 10,000 requests/minute
• API keys stored in a secrets management vault (not in code); rotated on 90-day schedule
• API credentials managed via Brim's partner portal; BSB admins control which systems have API access

Data Ownership: All data entered into the platform by or on behalf of BSB's program (cardholder data, transaction data, application data, account data) is owned exclusively by BSB. Brim holds this data as a data processor on BSB's behalf. Upon termination of the agreement, BSB receives a full data export in standard formats (JSON, CSV, fixed-width) within 30 days. Brim retains no right to use BSB's data for any purpose other than providing the contracted services.

Contract Language (Sample): "All data processed or stored by Brim Financial on behalf of Client, including all cardholder data, transaction records, application data, and derived analytics, is the exclusive property of Client. Brim Financial shall have no right to sell, transfer, or otherwise commercialize Client data. Upon termination of this Agreement, Brim Financial shall provide Client a complete data export within 30 days and shall securely delete all Client data within 60 days of export completion."

Known API Limitations: Bulk operations (>10,000 records) are subject to rate limiting and must use the batch API endpoints. Real-time authorization data is available via webhook (push) or polling (pull); websocket not currently supported (roadmap: 2026).`,
      'HIGH', 'FULL', '10/10', 'API & Data Ownership'
    ),
  ];

  // ─── Section 19: Implementation & PM ────────────────────────────────────────
  const sec19 = [
    sectionHeader('19', 'IMPLEMENTATION AND PROJECT MANAGEMENT'),
    ...question(
      'Q19.1 — Implementation Methodology, Timeline & Resources',
      'Describe implementation methodology, milestones, team qualifications, BSB resource requirements, and post-conversion support.',
      `Implementation Methodology: Brim uses a structured 5-phase implementation methodology proven across 10+ program launches:

Phase 1 — Discovery & Design (Weeks 1–4):
• Program parameters defined: product type, credit policy, pricing, rewards structure
• Integration architecture confirmed: Jack Henry core, digital banking, CRM
• BSB team onboarding and system access provisioned
• Detailed project plan finalized with milestone dates
• BSB resource requirements: 1 project lead, 1 IT/integration contact, 1 compliance officer

Phase 2 — Configuration & Build (Weeks 5–12):
• Platform configured for BSB program (product, fees, credit policy, rewards)
• Jack Henry core integration developed and tested in sandbox
• Cardholder portal white-labeled with BSB branding
• Fraud rules configured per BSB risk appetite
• BSB resource requirements: ~4 hours/week for configuration reviews and approvals

Phase 3 — Integration Testing (Weeks 13–18):
• End-to-end testing in Brim's staging environment
• Joint integration testing with Jack Henry
• BSB UAT (user acceptance testing) — BSB's team validates all workflows
• Remediation of any defects identified during testing
• BSB resource requirements: ~10 hours/week for UAT

Phase 4 — Pilot & Soft Launch (Weeks 19–22):
• Limited production launch (BSB staff and select early adopters)
• Live monitoring with Brim support team on-call
• Issue identification and rapid remediation

Phase 5 — Full Launch & Hypercare (Weeks 23–26):
• Full program launch
• 90-day hypercare period: Brim's implementation team provides enhanced support
• Weekly check-ins transitioning to monthly cadence at end of hypercare

Total Implementation Timeline: 22–26 weeks (approximately 6 months) from contract execution to full launch.

Implementation Team (Brim-side):
• Dedicated Project Manager: 7+ years fintech implementation experience, 8+ credit card program launches
• Integration Engineer: Senior engineer with Jack Henry and TSYS integration expertise
• Configuration Specialist: Platform expert for product and policy configuration
• QA Engineer: Dedicated to BSB testing cycles
• Compliance Analyst: US regulatory compliance support (Reg Z, Reg B, FCRA)

BSB Resource Requirements: 1 project lead (10–15 hrs/week during implementation), 1 IT/integration resource (20 hrs/week during integration phases), 1 business owner for product decisions (5 hrs/week).

Performance Bond: Brim provides a service level guarantee backed by contractual SLAs with financial remedies. Full performance bond details and contract language provided upon request.

Post-Conversion Support: Dedicated PSM + TAM assigned. Knowledge base (Confluence) shared with BSB team. Weekly communication cadences for first 90 days. 24/7 P1 incident support from day one.`,
      'HIGH', 'FULL', '10/10', 'Implementation'
    ),
  ];

  // ─── Section 20: Training ────────────────────────────────────────────────────
  const sec20 = [
    sectionHeader('20', 'TRAINING'),
    ...question(
      'Q20.1 — Training Programs, Onboarding & Ongoing Education',
      'Describe standard training plan for users and management, onboarding plan, training formats, SME support, and new hire onboarding.',
      `Standard Training Program: Brim provides a structured training program for all BSB roles as part of every implementation:

Role-Based Training Tracks:
• Program Administrators: 3-day virtual or on-site training on admin portal (product configuration, user management, reporting, fraud rule management). Includes live Q&A with Brim SMEs.
• Branch Staff / Relationship Managers: 4-hour training on application submission, account inquiry, and customer service workflows. Available as live virtual sessions or recorded modules.
• Call Center Agents: 6-hour training on account servicing, dispute handling, and escalation procedures. Roleplay scenarios included.
• IT / Integration Team: Technical training on API integration, SSO configuration, and sandbox usage. Delivered by Brim's engineering team.
• Compliance Officers: 2-hour training on regulatory reporting, audit log access, and compliance module functionality.
• Executive / Management: 90-minute executive briefing on program KPIs, dashboard navigation, and strategic reporting.

Training Formats:
• Live virtual (primary): Real-time sessions via Zoom/Teams with screen sharing and hands-on sandbox exercises
• On-site (available): Brim trainers travel to BSB's Bangor, ME facility for in-person delivery upon request
• Recorded modules: All training sessions recorded and available via Brim's partner portal for async viewing and new hire onboarding
• Written guides: Role-specific quick reference guides and process checklists

SME Support: Q&A sessions with Brim's product SMEs scheduled as part of every training track. SMEs available for follow-up questions via email for 30 days post-training.

New Hire Onboarding (Between Formal Refreshers): New BSB hires can access pre-recorded training modules immediately via the partner portal. Brim schedules a live orientation session for new hires within 10 business days of BSB's request. No cost for standard role onboarding.

Annual Refresher Training: Annual platform update briefing provided to all BSB users after each major release. Covers new features, changed workflows, and updated compliance requirements.

Ad Hoc Training: Available upon request with 5-business-day scheduling lead time. Billed at professional services rate ($175–225/hour) for custom training beyond standard modules.

Executive Onboarding: Dedicated 90-minute executive briefing available for new BSB leadership joining mid-program. Covers program performance, strategic roadmap, and partnership framework.`,
      'HIGH', 'FULL', '10/10', 'Training'
    ),
  ];

  // ─── Cover Page ────────────────────────────────────────────────────────────
  const cover = [
    new Paragraph({
      spacing: { before: 2000, after: 200 },
      alignment: AlignmentType.CENTER,
      shading: { type: ShadingType.SOLID, color: C.NAVY },
      children: [new TextRun({ text: 'BRIM FINANCIAL', bold: true, color: C.WHITE, size: 48, font: 'Calibri' })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      shading: { type: ShadingType.SOLID, color: C.NAVY },
      children: [new TextRun({ text: 'Response to Request for Information', color: C.WHITE, size: 28, font: 'Calibri' })],
    }),
    new Paragraph({
      spacing: { after: 80 },
      alignment: AlignmentType.CENTER,
      shading: { type: ShadingType.SOLID, color: C.NAVY },
      children: [new TextRun({ text: ' ', size: 16, font: 'Calibri' })],
    }),
    new Paragraph({
      spacing: { before: 400, after: 120 },
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: 'Bangor Savings Bank', bold: true, color: C.NAVY, size: 32, font: 'Calibri' })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: 'Credit Card Vendor Selection', color: C.MID, size: 24, font: 'Calibri' })],
    }),
    new Paragraph({
      spacing: { before: 200, after: 80 },
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: 'April 10, 2026', color: C.LIGHT, size: 22, font: 'Calibri' })],
    }),
    new Paragraph({
      spacing: { before: 80, after: 80 },
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: 'Submitted in response to the RFI issued March 9, 2026', color: C.LIGHT, size: 20, italics: true, font: 'Calibri' })],
    }),
    new Paragraph({
      spacing: { before: 200, after: 80 },
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: 'Submitted to: James Ecker, Project Management Office', color: C.MID, size: 20, font: 'Calibri' })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: 'james.ecker@bangor.com | 207-974-4188', color: C.MID, size: 20, font: 'Calibri' })],
    }),
    new Paragraph({
      spacing: { before: 400 },
      children: [new PageBreak()],
    }),
  ];

  // ─── Legend Page ─────────────────────────────────────────────────────────
  const legend = [
    new Paragraph({
      spacing: { before: 200, after: 120 },
      children: [new TextRun({ text: 'HOW TO READ THIS DOCUMENT', bold: true, size: 28, color: C.NAVY, font: 'Calibri' })],
    }),
    bodyPara('Each section of this RFI response includes a color-coded status indicator table following Brim\'s response. These indicators use the same visual language as the accompanying compliance matrix workbook:'),
    new Paragraph({ spacing: { before: 120, after: 80 }, children: [] }),
    new Table({
      width: { size: 9360, type: WidthType.DXA },
      rows: [
        new TableRow({ children: [
          cell('INDICATOR', { bg: C.NAVY, color: C.WHITE, bold: true, size: 18, width: 2000 }),
          cell('MEANING', { bg: C.NAVY, color: C.WHITE, bold: true, size: 18, width: 7360 }),
        ]}),
        new TableRow({ children: [
          cell('COMPLIANCE: FULL', { bg: C.GREEN_BG, color: C.GREEN_TEXT, bold: true, size: 18, width: 2000 }),
          cell('Brim meets this requirement fully, out of the box or with standard configuration', { bg: C.WHITE, size: 18, width: 7360 }),
        ]}),
        new TableRow({ children: [
          cell('COMPLIANCE: PARTIAL', { bg: C.YELLOW_BG, color: C.YELLOW_TEXT, bold: true, size: 18, width: 2000 }),
          cell('Brim meets this requirement with some configuration or custom development needed', { bg: C.WHITE, size: 18, width: 7360 }),
        ]}),
        new TableRow({ children: [
          cell('COMPLIANCE: GAP', { bg: C.RED_BG, color: C.RED_TEXT, bold: true, size: 18, width: 2000 }),
          cell('This area requires further discussion; not covered in the standard platform', { bg: C.WHITE, size: 18, width: 7360 }),
        ]}),
        new TableRow({ children: [
          cell('CONFIDENCE: STRONG FIT', { bg: C.GREEN_BG, color: C.GREEN_TEXT, bold: true, size: 18, width: 2000 }),
          cell('Brim has deep, proven experience in this area with live production evidence', { bg: C.WHITE, size: 18, width: 7360 }),
        ]}),
        new TableRow({ children: [
          cell('CONFIDENCE: PARTIAL FIT', { bg: C.YELLOW_BG, color: C.YELLOW_TEXT, bold: true, size: 18, width: 2000 }),
          cell('Brim can meet this need; some solution design or discussion recommended', { bg: C.WHITE, size: 18, width: 7360 }),
        ]}),
        new TableRow({ children: [
          cell('CONFIDENCE: NEEDS DISCUSSION', { bg: C.RED_BG, color: C.RED_TEXT, bold: true, size: 18, width: 2000 }),
          cell('Brim recommends a live discussion before finalizing approach for this requirement', { bg: C.WHITE, size: 18, width: 7360 }),
        ]}),
      ],
    }),
    new Paragraph({
      spacing: { before: 400 },
      children: [new PageBreak()],
    }),
  ];

  // ─── Section 4 note ────────────────────────────────────────────────────────
  const sec4 = [
    sectionHeader('4', 'FUNCTIONALITY REQUIREMENTS'),
    bodyPara('Brim\'s responses to the detailed Bangor Savings Bank Credit Card Vendor Selection Requirements matrix are provided in the accompanying Excel workbook: "BSB_RFP_Compliance_Matrix_Brim_Financial.xlsx". That document contains Brim\'s response to each of the 383 functional requirements, including compliance status (Y / Partial / N), delivery method (Out of Box / Configuration / Custom / Do Not Meet), confidence rating (GREEN / YELLOW / RED), committee score, and detailed narrative responses.'),
    new Paragraph({
      spacing: { before: 200, after: 0 },
      children: [new PageBreak()],
    }),
  ];

  const doc = new Document({
    styles: {
      default: {
        document: {
          run: { font: 'Calibri', size: 20, color: C.DARK },
        },
      },
    },
    sections: [{
      properties: {
        page: { margin: { top: 720, bottom: 720, left: 900, right: 900 } },
      },
      children: [
        ...cover,
        ...legend,
        ...sec3,
        new Paragraph({ spacing: { before: 200 }, children: [new PageBreak()] }),
        ...sec4,
        ...sec5,
        new Paragraph({ spacing: { before: 200 }, children: [new PageBreak()] }),
        ...sec6,
        new Paragraph({ spacing: { before: 200 }, children: [new PageBreak()] }),
        ...sec7,
        new Paragraph({ spacing: { before: 200 }, children: [new PageBreak()] }),
        ...sec8,
        new Paragraph({ spacing: { before: 200 }, children: [new PageBreak()] }),
        ...sec9,
        new Paragraph({ spacing: { before: 200 }, children: [new PageBreak()] }),
        ...sec10,
        new Paragraph({ spacing: { before: 200 }, children: [new PageBreak()] }),
        ...sec11,
        new Paragraph({ spacing: { before: 200 }, children: [new PageBreak()] }),
        ...sec12,
        new Paragraph({ spacing: { before: 200 }, children: [new PageBreak()] }),
        ...sec13,
        new Paragraph({ spacing: { before: 200 }, children: [new PageBreak()] }),
        ...sec14,
        new Paragraph({ spacing: { before: 200 }, children: [new PageBreak()] }),
        ...sec15,
        new Paragraph({ spacing: { before: 200 }, children: [new PageBreak()] }),
        ...sec16,
        new Paragraph({ spacing: { before: 200 }, children: [new PageBreak()] }),
        ...sec17,
        new Paragraph({ spacing: { before: 200 }, children: [new PageBreak()] }),
        ...sec18,
        new Paragraph({ spacing: { before: 200 }, children: [new PageBreak()] }),
        ...sec19,
        new Paragraph({ spacing: { before: 200 }, children: [new PageBreak()] }),
        ...sec20,
      ],
    }],
  });

  const buffer = await Packer.toBuffer(doc);
  const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength) as ArrayBuffer;

  return new NextResponse(arrayBuffer, {
    status: 200,
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'Content-Disposition': 'attachment; filename="BSB_RFI_Response_Brim_Financial.docx"',
    },
  });
}
