#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const DATA_PATH = path.join(__dirname, '../public/rfp_data.json');

const data = JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));

// Accounting & Finance — 9 bullet paragraphs converted to prose
// Indices: 319, 320, 322, 323, 327, 328, 329, 331, 332
const rewrites = {

  319: `BRIM's billing statements present fixed and variable charges with full transparency. Fixed charges — platform access, BIN maintenance, program management, and compliance services — appear as individual line items showing the description, contracted rate, and amount. No ambiguity, no aggregated bundles. Variable charges show the complete formula: unit rate multiplied by actual volume equals the line total. For transaction processing, that is the contracted rate per authorization multiplied by actual authorization volume. For card production, it is the contracted rate per card multiplied by cards issued in the period. Every charge BSB receives traces directly to a contracted term, and BSB's finance team can reconcile the full invoice without requesting supplementary detail from BRIM.`,

  320: `Sub-ledgering by entity is core to how BRIM's platform is built — not a reporting overlay. Every transaction, balance, fee, and accounting entry is tagged at three levels — BIN, ICA, and partner FI entity — at the database layer where data is stored and encrypted. Each partner FI's data is logically isolated with encryption-based segregation. One partner FI cannot access another's data. BSB sees the consolidated view across its entire agent banking portfolio, while each client FI sees only its own. This architecture means BSB does not configure entity separation as a feature — it is the default structure of the platform. For multi-entity accounting, each partner FI's activity flows to its own sub-ledger accounts within BSB's chart of accounts, with automated GL posting at the entity level.`,

  322: `Revenue sharing reports give BSB full visibility into every component of the economics. Gross interchange earned is broken down by network (Visa and Mastercard), card type (consumer credit, business credit, commercial), and interchange category (retail, e-commerce, card-not-present). Network fees — assessment fees, network access fees, and scheme-specific charges — are itemized by fee type. Rewards costs cover points and cashback accrued, redemptions processed, and program administration, presented by rewards program. Processing fees and platform charges appear as individual line items. BSB's finance team can reconcile every revenue and cost component against contracted terms without requesting supplementary data from BRIM. Reports are available on configurable cadences — daily, monthly, or on demand — and can be exported in CSV or API feed format for integration with BSB's financial systems.`,

  323: `BRIM delivers accounting data feeds tailored to each audience in BSB's organization. At the BSB level, the platform provides a daily GL feed in standard format with configurable mapping to BSB's chart of accounts, covering all partner FIs. A daily settlement file gives BSB the net settlement position by partner FI and by network, with transaction-level supporting detail. A monthly reconciliation package covers GL-to-core reconciliation, outstanding items, and suspense account balances. Portfolio-level reports include balances, transaction volumes, delinquency, and charge-off data. Partner FIs receive their own data scoped to their portfolio, with the same daily GL and settlement files at the entity level — they see their numbers, not BSB's consolidated view. BSB's data teams can also pull all reporting directly through API feeds for integration with internal systems or BSB's data warehouse.`,

  327: `BRIM's reconciliation process is designed to minimize BSB's manual effort. Each day, BRIM's GL feed posts automatically to BSB's core banking system using configurable account mapping established during implementation. BRIM's reconciliation engine then compares its internal ledger against the posted GL feed, confirming that what BRIM calculated matches what BSB's core received. Matched items require no action — the system confirms and closes them automatically. Exceptions are flagged with reason codes covering timing differences, amount mismatches, missing entries, and duplicates. The rules engine resolves common exception types automatically. Items that cannot be auto-resolved are escalated to BSB's finance team with full context attached — the transaction record, the discrepancy detail, and the reason code — so BSB's team is reviewing exceptions, not reconstructing the full transaction set from scratch.`,

  328: `BRIM's GL mapping is owned and maintained by BSB's admin team directly through the platform — no BRIM involvement required after go-live. Each BRIM transaction category — purchases, payments, interest postings, fees by type, chargebacks, and settlements — maps to a BSB GL account number. BSB defines the initial mapping during implementation and all ongoing changes are self-service through the admin portal. The rules engine handles conditional mapping for complex GL structures: different GL accounts for different partner FIs so each entity posts to its own sub-ledger, different GL treatment for the same transaction type by product or program, and exception rules for out-of-policy items. When BSB's chart of accounts changes, the mapping update takes minutes in the portal. No development ticket, no BRIM involvement.`,

  329: `Settlement reconciliation runs separately by network and follows the same automated process for both Visa and Mastercard. For Visa, BRIM receives the daily settlement file (TC33/TC50 records) and matches each Visa transaction in its ledger against the settlement record using transaction ID, amount, date, and merchant as match criteria. Matched items post to the GL automatically. Unmatched items are flagged with reason codes — amount difference, missing from Visa file, missing from BRIM ledger, or timing difference — and routed for exception review. For Mastercard, BRIM receives the daily IPM settlement file and runs the same matching logic. The net settlement amount from each scheme reconciles against BRIM's internal position before any GL posting occurs. BSB sees a consolidated view across both networks in its daily settlement report, with the ability to drill to network-level detail for any discrepancy.`,

  331: `BRIM tracks business metrics at the portfolio and partner FI level with no additional configuration required. Standard built-in metrics include customer lifetime value — revenue minus costs over the account lifecycle, segmented by acquisition channel, product type, and partner FI — delinquency rate with drill-down by bucket at 30, 60, 90, and 120+ days past due, revolve rate showing the percentage of accounts carrying a balance month over month, and activation rate by cohort and channel. BSB can add custom metrics through the reporting configuration layer, define threshold alerts on any metric, and schedule automated delivery of metric summaries to its finance and credit teams. All metrics are available at the consolidated portfolio level and at the individual partner FI level, giving BSB both the program-wide view and the per-institution detail it needs to manage the agent banking portfolio.`,

  332: `BRIM's platform generates 1099 forms for BSB's US tax reporting obligations. For 1099-C (Cancellation of Debt), when BSB charges off an account with a balance exceeding $600, the platform captures the cancellation event, debtor information (name, address, TIN), cancellation date, and amount. BRIM generates the 1099-C forms for BSB's review and approval before filing. For 1099-MISC (Miscellaneous Income), when BSB's rewards programs result in reportable income — cash-equivalent rewards exceeding $600 in a calendar year — the platform identifies the affected accounts, calculates the reportable amount, and generates the corresponding 1099-MISC forms. BSB reviews, approves, and files. BRIM handles the data capture and form generation; BSB retains ownership of the filing obligation as the issuer.`

};

let updated = 0;
Object.entries(rewrites).forEach(([idx, prose]) => {
  const i = parseInt(idx);
  if (data.questions[i]) {
    data.questions[i].paragraph = prose;
    updated++;
    console.log(`✓ Updated idx ${i}: [${data.questions[i].category}] ${data.questions[i].requirement?.substring(0,60)}...`);
  }
});

fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2));
console.log(`\nDone. ${updated} Accounting & Finance paragraphs converted to prose.`);
