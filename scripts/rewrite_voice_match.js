#!/usr/bin/env node
'use strict';

/**
 * rewrite_voice_match.js
 * Rewrites paragraph fields for all categories EXCEPT Loyalty and Benefits
 * and Partner Relationships (those are already in the correct voice).
 *
 * Usage:
 *   ANTHROPIC_API_KEY=sk-ant-... node scripts/rewrite_voice_match.js
 *
 * Optional — run a single category:
 *   ANTHROPIC_API_KEY=sk-ant-... CATEGORY="Technology" node scripts/rewrite_voice_match.js
 *
 * Optional — dry run (no writes):
 *   DRY_RUN=1 ANTHROPIC_API_KEY=sk-ant-... node scripts/rewrite_voice_match.js
 */

const Anthropic = require('@anthropic-ai/sdk');
const fs = require('fs');
const path = require('path');

const DATA_PATH = path.join(__dirname, '../public/rfp_data.json');
const client = new Anthropic.default();

const SKIP_CATEGORIES = ['Loyalty and Benefits', 'Partner Relationships'];
const TARGET_CATEGORY = process.env.CATEGORY || null;
const DRY_RUN = process.env.DRY_RUN === '1';

// ── Voice guide built from Partner Relationships examples ──────────────────
const VOICE_GUIDE = `
VOICE AND STYLE GUIDE — based on approved Partner Relationships answers:

1. THIRD PERSON throughout. "BRIM does X" — never "We do X" or "Our platform..."
2. LEAD with what BRIM does or delivers — not with what BSB asked for
3. SHORT declarative sentences mixed with longer explanatory ones. Not all the same length.
4. NAMED CLIENTS used as evidence where relevant:
   - MANULIFE (migrated from Fiserv)
   - ZOLVE / CONTINENTAL BANK (BIN migration from i2c, 30 days)
   - AFFINITY CREDIT UNION (live production, agent banking model)
   - CWB BANK (live production, agent banking model)
   - UNI FINANCIAL (migrated from Collabria)
   - MONEY MART / MOMENTUM FINANCIAL (migrated from legacy platform)
   Only cite these where genuinely relevant — do not force them in
5. OWNERSHIP LINE at the end where appropriate: "BSB owns X. BRIM provides Y."
6. NO BULLETS, NO NUMBERED LISTS. Flowing prose only.
7. NO BANNED WORDS: comprehensive, robust, seamless, leverage, utilize, cutting-edge, ecosystem, looks forward to, purpose-designed
8. CONFIDENT, NOT DEFERENTIAL. "BRIM does X" not "BRIM aims to support X" or "BRIM can help with X"
9. SPECIFIC. Name the feature, the mechanism, the number, the integration.
10. 2–4 paragraphs. Do not pad. 150–350 words typical.

EXAMPLE OF TARGET STYLE (Partner Relationships — Partner Acquisition, score 10/10):
"BRIM approaches partner acquisition as a shared effort between its team and BSB. This is not a handoff model where BSB sells on its own. BRIM works alongside BSB from the earliest conversations with a prospective partner bank through onboarding, launch, and long-term program growth. BRIM's experience supporting financial institutions through similar transitions gives BSB a concrete advantage in these conversations. BRIM helped AFFINITY CREDIT UNION and CWB BANK stand up card programs through a partnered model, and supported MANULIFE in converting away from Fiserv onto the platform. Each of those programs is live in production today. BSB can draw on those stories when engaging prospective partners — use cases, program profiles, migration timelines, and outcome data that show a prospective partner bank exactly what the transition looks like. During the acquisition stage, BRIM's team joins BSB in prospect meetings, conducts technical discovery against the partner bank's core platform, and provides tailored demo environments. Once a partner commits, BRIM runs the implementation on a proven 10–12 week methodology and BSB retains full governance over the program from day one. BSB owns the partner relationships. BRIM provides the platform, the data, and the operational experience to help BSB turn those relationships into well-performing card programs."
`;

async function rewriteParagraph(question, currentParagraph) {
  const msg = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1200,
    temperature: 0.35,
    messages: [{
      role: 'user',
      content: `You are rewriting an RFP response paragraph for BRIM Financial's submission to Bangor Savings Bank.

${VOICE_GUIDE}

TASK: Rewrite the paragraph below to match the voice and style described above.
- Preserve all facts, numbers, named clients, SLA times, and technical details exactly
- Convert any remaining bullets or lists to flowing prose
- Minimal structural changes — improve voice, not content
- Output only the paragraph text — no preamble, no labels, no explanation

CATEGORY: ${question.category}
TOPIC: ${question.topic || ''}
BSB REQUIREMENT: ${question.requirement}

CURRENT PARAGRAPH:
${currentParagraph}

REWRITTEN PARAGRAPH (prose, third person, no bullets):`
    }]
  });

  return msg.content[0].text.trim();
}

function hasProblem(text) {
  if (!text) return false;
  const lines = text.split('\n');
  // Has bullets
  if (lines.some(l => /^\s*[-•*]\s/.test(l) || /^\s*\d+\.\s/.test(l))) return true;
  // Has first person
  if (/\bwe\b|\bour\b|\bwe've\b|\bwe're\b/i.test(text)) return true;
  // Has banned words
  const banned = /\bcomprehensive\b|\brobust\b|\bseamless\b|\bleverage\b|\butilize\b|\bcutting-edge\b|\becosystem\b/i;
  if (banned.test(text)) return true;
  return false;
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function main() {
  if (!process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY.startsWith('placeholder')) {
    console.error('ERROR: Set ANTHROPIC_API_KEY environment variable');
    console.error('Usage: ANTHROPIC_API_KEY=sk-ant-... node scripts/rewrite_voice_match.js');
    process.exit(1);
  }

  const data = JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));

  const toProcess = data.questions.filter(q => {
    if (SKIP_CATEGORIES.includes(q.category)) return false;
    if (TARGET_CATEGORY && q.category !== TARGET_CATEGORY) return false;
    if (!q.paragraph) return false;
    return hasProblem(q.paragraph);
  });

  // Also catch any that don't have problems but could benefit from voice match
  // For a full pass, remove the hasProblem filter:
  const allEligible = data.questions.filter(q => {
    if (SKIP_CATEGORIES.includes(q.category)) return false;
    if (TARGET_CATEGORY && q.category !== TARGET_CATEGORY) return false;
    return q.paragraph && q.paragraph.length > 50;
  });

  const queue = TARGET_CATEGORY ? allEligible : toProcess;

  console.log(`Categories to skip: ${SKIP_CATEGORIES.join(', ')}`);
  if (TARGET_CATEGORY) {
    console.log(`Single category mode: ${TARGET_CATEGORY}`);
    console.log(`Questions to process: ${queue.length}`);
  } else {
    console.log(`Questions with voice/format issues: ${toProcess.length}`);
    console.log(`\nTo run a full voice pass on one category:`);
    console.log(`  ANTHROPIC_API_KEY=... CATEGORY="Technology" node scripts/rewrite_voice_match.js\n`);
  }

  if (DRY_RUN) {
    console.log('DRY RUN — no writes');
    queue.forEach((q, i) => console.log(`  ${i+1}. [${q.category}] ${q.requirement?.substring(0,70)}...`));
    return;
  }

  if (queue.length === 0) {
    console.log('Nothing to process.');
    return;
  }

  let updated = 0, errors = 0, skipped = 0;
  const categoryCount = {};

  for (let i = 0; i < queue.length; i++) {
    const q = queue[i];
    const cat = q.category;
    if (!categoryCount[cat]) categoryCount[cat] = 0;

    const req = (q.requirement || '').substring(0, 70);
    process.stdout.write(`[${i+1}/${queue.length}] [${cat}] ${req}... `);

    try {
      const rewritten = await rewriteParagraph(q, q.paragraph);

      if (!rewritten || rewritten.length < 50) {
        console.log('⚠ Too short, skipped');
        skipped++;
        continue;
      }

      // Find and update in data.questions
      const idx = data.questions.findIndex(dq => dq === q);
      if (idx !== -1) {
        data.questions[idx].paragraph = rewritten;
        updated++;
        categoryCount[cat]++;
        console.log(`✓ (${rewritten.length} chars)`);
      }

      // Save after every 10 updates as checkpoint
      if (updated % 10 === 0) {
        fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2));
        console.log(`  → Checkpoint saved (${updated} updated so far)`);
      }

      // Rate limit
      if (i < queue.length - 1) await sleep(600);

    } catch (err) {
      errors++;
      console.log(`✗ ${err.message}`);
      if (err.status === 529 || err.status === 429) {
        console.log('  Rate limited — waiting 10s...');
        await sleep(10000);
      }
    }
  }

  // Final save
  fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2));

  console.log('\n── Summary ──────────────────────────────');
  console.log(`Updated: ${updated} | Errors: ${errors} | Skipped: ${skipped}`);
  Object.entries(categoryCount).forEach(([cat, n]) => console.log(`  ${cat}: ${n}`));
  console.log('rfp_data.json saved.');
}

main().catch(err => { console.error(err); process.exit(1); });
