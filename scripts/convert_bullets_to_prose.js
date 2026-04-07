#!/usr/bin/env node
'use strict';

const Anthropic = require('@anthropic-ai/sdk');
const fs = require('fs');
const path = require('path');

const DATA_PATH = path.join(__dirname, '../public/rfp_data.json');
const client = new Anthropic.default();

const STYLE_EXAMPLE = `
Here is an example of the target style — confident third-person prose, no bullets,
reads naturally in a document or Excel cell:

"BRIM manages the full fulfillment and activation lifecycle for converting portfolios.
Advance cardholder communication begins 60 to 90 days before conversion and is delivered
through BRIM's Communications Engine across email, SMS, push notification, physical mail,
and in-branch channels. These notices inform cardholders of the upcoming card change, what
to expect, and any action required on their part. BSB controls the messaging content,
timing, and channel mix. Bulk card issuance is coordinated through BRIM's card production
and personalization pipeline. Cardholders do not need to wait for the physical card to begin
transacting. BRIM supports instant digital card provisioning at conversion, allowing
cardholders to activate and provision directly to Apple Pay or Google Wallet immediately."

Note: Specific numbers, named clients (MANULIFE, ZOLVE, AFFINITY CREDIT UNION, CWB BANK,
CONTINENTAL BANK, UNI FINANCIAL, MONEY MART/MOMENTUM FINANCIAL), SLA times, and technical
details must be preserved exactly.
`;

function hasBullets(text) {
  if (!text) return false;
  const lines = text.split('\n');
  return lines.some(l => /^\s*[-•*]\s/.test(l) || /^\s*\d+\.\s/.test(l));
}

async function convertToProse(question, paragraph) {
  const msg = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1500,
    temperature: 0.3,
    messages: [{
      role: 'user',
      content: `You are editing an RFP response paragraph for BRIM Financial's submission to Bangor Savings Bank.

TASK: Convert the paragraph below from bullet-point or numbered-list format into flowing, connected prose.

RULES:
- Third person only — "BRIM does X" not "We do X"
- No bullet points, no dashes, no numbered lists in output
- Preserve ALL facts, numbers, client names, SLA times, and technical details exactly
- Minimal changes — convert structure only, do not rewrite content
- 2–4 paragraphs of natural prose, professional tone
- No banned words: comprehensive, robust, seamless, leverage, utilize, cutting-edge, ecosystem
- Do not add new claims or facts not in the original
- Output only the paragraph text — no preamble, no explanation

${STYLE_EXAMPLE}

BSB REQUIREMENT:
${question.requirement}

CURRENT PARAGRAPH (has bullets — convert to prose):
${paragraph}

OUTPUT (prose only):`
    }]
  });

  return msg.content[0].text.trim();
}

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function main() {
  const data = JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));

  const toConvert = data.questions.filter(q => hasBullets(q.paragraph));
  console.log(`Found ${toConvert.length} questions with bullet formatting\n`);

  let updated = 0;
  let errors = 0;

  for (let i = 0; i < toConvert.length; i++) {
    const q = toConvert[i];
    const cat = q.category;
    const req = (q.requirement || '').substring(0, 80);
    console.log(`[${i+1}/${toConvert.length}] [${cat}] ${req}...`);

    try {
      const prose = await convertToProse(q, q.paragraph);

      // Verify it actually removed bullets
      if (hasBullets(prose)) {
        console.log('  ⚠ Still has bullets — using cleaned version');
        // Strip remaining bullets as fallback
        q.paragraph = prose.replace(/^\s*[-•*]\s+/gm, '').replace(/^\s*\d+\.\s+/gm, '');
      } else {
        q.paragraph = prose;
      }

      updated++;
      console.log(`  ✓ Converted (${prose.length} chars)`);

      // Rate limit: small pause between calls
      if (i < toConvert.length - 1) await sleep(800);

    } catch (err) {
      errors++;
      console.error(`  ✗ Error: ${err.message}`);
    }
  }

  fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2));
  console.log(`\nDone. Updated: ${updated} | Errors: ${errors}`);
  console.log('rfp_data.json saved.');
}

main().catch(err => { console.error(err); process.exit(1); });
