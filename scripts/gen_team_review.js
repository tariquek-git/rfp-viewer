#!/usr/bin/env node
'use strict';

const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  HeadingLevel, AlignmentType, BorderStyle, WidthType, ShadingType,
  Header, Footer, PageNumber, LevelFormat, PageBreak, PageOrientation
} = require('docx');
const fs = require('fs');
const path = require('path');
const os = require('os');

const DATA_PATH = path.join(__dirname, '../public/rfp_data.json');
const OUTPUT   = path.join(os.homedir(), 'Desktop', 'BSB_Team_Review_BRIM_2026-04-06.docx');

// ── Colours ───────────────────────────────────────────────────────────────────
const NAVY='1F3864', TEAL='2E75B6', DARK_GREEN='1E5C1E', DARK_RED='8B0000';
const DARK_ORANGE='7D3C00', LIGHT_BLUE='D5E8F0', LIGHT_GREEN='E2EFDA';
const LIGHT_YELLOW='FFF9E6', LIGHT_RED='FDECEA', LIGHT_GRAY='F5F5F5';
const MID_GRAY='E0E0E0', WHITE='FFFFFF', BLACK='000000';

// ── AI Detection Engine ───────────────────────────────────────────────────────
// Calibrated against Partner Relationships (known human, variance 138-194)
// vs Technology/AppProcessing (AI-assisted, variance 30-60)
function scoreAI(paragraph, bullet, requirement) {
  if (!paragraph) return { score:0, flag:'GREEN', confidence:'LOW', signals:[], assessment:'No paragraph content.', risk:'LOW' };

  const p = paragraph;
  const signals = [];
  let aiPoints = 0;   // positive = AI signals
  let humanPoints = 0; // positive = human signals

  const sentences = p.split(/[.!?]+/).filter(s => s.trim().length > 10);
  const lengths = sentences.map(s => s.trim().split(/\s+/).length);
  const avg = lengths.length ? lengths.reduce((a,b)=>a+b,0)/lengths.length : 0;
  const variance = lengths.length >= 3 ? lengths.reduce((a,b)=>a+Math.pow(b-avg,2),0)/lengths.length : 999;

  // ── PRIMARY: Sentence length variance (most reliable signal) ────────────────
  // Human: variance 100-200+  |  AI: variance 20-60
  if (variance < 30)        { aiPoints += 3; signals.push('Very uniform sentence length (variance='+Math.round(variance)+') — strong AI signal'); }
  else if (variance < 60)   { aiPoints += 2; signals.push('Uniform sentence length (variance='+Math.round(variance)+') — AI signal'); }
  else if (variance < 100)  { aiPoints += 1; signals.push('Slightly uniform sentences (variance='+Math.round(variance)+')'); }
  else if (variance >= 150) { humanPoints += 2; signals.push('✓ High sentence variety (variance='+Math.round(variance)+') — strong human marker'); }
  else                       { humanPoints += 1; signals.push('✓ Moderate sentence variety (variance='+Math.round(variance)+')'); }

  // ── AI transition phrases ─────────────────────────────────────────────────────
  const aiTransitions = /\b(additionally|furthermore|moreover|in conclusion|in summary|it is worth noting|it should be noted|as mentioned|as noted|as such|this ensures that|in this way|to this end|with this in mind|going forward|moving forward|it is important to note|in order to|this approach ensures|this approach allows|this approach provides)\b/gi;
  const transMatches = (p.match(aiTransitions) || []);
  if (transMatches.length >= 2) { aiPoints += 2; signals.push('AI transition phrases: ' + [...new Set(transMatches.map(m=>m.toLowerCase()))].slice(0,3).join(', ')); }
  else if (transMatches.length === 1) { aiPoints += 1; signals.push('AI transition phrase: ' + transMatches[0].toLowerCase()); }

  // ── "This X" sentence pattern (very common AI tell) ──────────────────────────
  const thisX = (p.match(/\b(This (allows|ensures|enables|means|gives|creates|provides|helps|supports|approach|process|system|capability|model|architecture|structure|framework))\b/gi) || []);
  if (thisX.length >= 3) { aiPoints += 2; signals.push('"This [verb/noun]" pattern ×'+thisX.length+' — AI tell'); }
  else if (thisX.length >= 1) { aiPoints += 1; signals.push('"This [verb/noun]" pattern ×'+thisX.length); }

  // ── Generic opener ────────────────────────────────────────────────────────────
  const genericOpener = /^(BRIM('s)? platform (supports|enables|provides|offers|allows)|BRIM (supports|enables|provides|offers|allows|is committed to|is designed to|Financial (provides|supports))|The platform (supports|enables|provides))/i;
  if (genericOpener.test(p.trim())) { aiPoints += 1; signals.push('Generic opener — no specific lead'); }

  // ── "BRIM offers X" / "BRIM provides X" patterns ────────────────────────────
  const brimOffers = (p.match(/\bBRIM (offers|provides|delivers|enables|ensures|maintains|manages|handles|processes|supports) (a |the |full |complete |comprehensive |dedicated )/gi) || []);
  if (brimOffers.length >= 3) { aiPoints += 1; signals.push('Repetitive "BRIM [verb] [article]" pattern ×'+brimOffers.length); }

  // ── Passive voice overuse ─────────────────────────────────────────────────────
  const passiveMatches = (p.match(/\b(is designed to|are designed to|is intended to|is able to|are able to|is capable of|are capable of|is configured to|can be utilized|is leveraged|is structured to)\b/gi) || []);
  if (passiveMatches.length >= 2) { aiPoints += 2; signals.push('Passive voice overuse: ' + passiveMatches.slice(0,2).join(', ')); }
  else if (passiveMatches.length === 1) { aiPoints += 1; signals.push('Passive construction: ' + passiveMatches[0]); }

  // ── Bullets still present ─────────────────────────────────────────────────────
  if (/^\s*[-•]\s/m.test(p)) { aiPoints += 3; signals.push('Bullet points present in paragraph field — must fix'); }

  // ── HUMAN SIGNAL PATTERNS ────────────────────────────────────────────────────
  const clients = ['AFFINITY CREDIT UNION','MANULIFE','CWB BANK','ZOLVE','CONTINENTAL BANK','UNI FINANCIAL','MONEY MART','MOMENTUM FINANCIAL','LAURENTIAN','PAYFACTO','FLYING BLUE','AIR FRANCE'];
  const clientMatches = clients.filter(c => p.toUpperCase().includes(c));
  if (clientMatches.length >= 2) { humanPoints += 2; signals.push('✓ Multiple named clients: ' + clientMatches.slice(0,3).join(', ')); }
  else if (clientMatches.length === 1) { humanPoints += 1; signals.push('✓ Named client: ' + clientMatches[0]); }

  // Short punchy sentences (3-8 words) — hallmark of human voice
  const shortDecl = sentences.filter(s => { const w=s.trim().split(/\s+/).length; return w>=3&&w<=8; });
  if (shortDecl.length >= 3) { humanPoints += 2; signals.push('✓ Short declarative sentences ×'+shortDecl.length+' — strong human marker'); }
  else if (shortDecl.length >= 1) { humanPoints += 1; signals.push('✓ Some short declarative sentences ×'+shortDecl.length); }

  // Direct declaration statements
  const directDecl = /\b(this is not|that is not|this is live|this is in production|not a third.party|not a .{0,20} model|not a ticket|not a bolt.on|not theoretical|that separation is intentional)\b/gi;
  if (directDecl.test(p)) { humanPoints += 1; signals.push('✓ Direct declaration statements — human voice marker'); }

  // Technical specificity
  const techSpecific = /\b(jXchange|World-Check|DMDC|TC33|TC50|ISO 8583|MDES|ABU|OIDC|OAuth|SAML|AES-256|TLS 1\.2|IDEMIA|Coalfire|LeaseWeb|Verafin|TransUnion|Experian|Apple Pay|Google (Pay|Wallet)|SFTP|PCI DSS|SOC 2)\b/gi;
  const techMatches = (p.match(techSpecific) || []);
  if (techMatches.length >= 3) { humanPoints += 2; signals.push('✓ High technical specificity: ' + [...new Set(techMatches)].slice(0,4).join(', ')); }
  else if (techMatches.length >= 1) { humanPoints += 1; signals.push('✓ Technical specificity: ' + [...new Set(techMatches)].slice(0,2).join(', ')); }

  // Specific numbers / metrics
  const numberMatches = (p.match(/\b\d+[\+%]|\b\d+[\.,]\d+|\b(99\.\d+%|300\+|150\+|100\+|55,?000|30\s*days?|24\/7|60.90\s*days?|7\+\s*year|12.18\s*month)\b/gi) || []);
  if (numberMatches.length >= 4) { humanPoints += 2; signals.push('✓ Rich specific numbers/metrics ×'+numberMatches.length); }
  else if (numberMatches.length >= 2) { humanPoints += 1; signals.push('✓ Specific numbers/metrics ×'+numberMatches.length); }

  // No named clients AND no short sentences = more likely generic AI
  if (clientMatches.length === 0 && shortDecl.length === 0) {
    aiPoints += 1; signals.push('No named clients + no short sentences — generic pattern');
  }

  // ── Compute final score (0-10) ────────────────────────────────────────────────
  // Base is 3 (AI-assisted default). AI points raise, human points lower.
  // Scale: each point ~1.2 on the 0-10 scale
  let rawScore = 3 + (aiPoints * 1.2) - (humanPoints * 1.0);
  let score = Math.round(Math.max(0, Math.min(10, rawScore)));

  // ── Flag and confidence ───────────────────────────────────────────────────────
  let flag, confidence;
  if (score <= 3)      { flag = 'GREEN'; }
  else if (score <= 6) { flag = 'YELLOW'; }
  else                 { flag = 'RED'; }

  // Confidence based on signal count
  const signalCount = signals.length;
  if (signalCount >= 4) confidence = 'HIGH';
  else if (signalCount >= 2) confidence = 'MEDIUM';
  else confidence = 'LOW';

  // ── Risk assessment ───────────────────────────────────────────────────────────
  let risk, riskReason;
  if (flag === 'RED') {
    risk = 'HIGH';
    riskReason = 'High probability of AI detection by BSB. Rewrite recommended before submission.';
  } else if (flag === 'YELLOW') {
    risk = 'MEDIUM';
    riskReason = 'Some AI signals present. Human review and spot edits recommended.';
  } else {
    risk = 'LOW';
    riskReason = 'Reads naturally. Low risk of AI detection.';
  }

  // ── Assessment text ───────────────────────────────────────────────────────────
  const humanSignals = signals.filter(s => s.startsWith('✓'));
  const aiSignalsList = signals.filter(s => !s.startsWith('✓'));
  let assessment = '';
  if (aiSignalsList.length > 0) assessment += 'AI signals: ' + aiSignalsList.join('; ') + '. ';
  if (humanSignals.length > 0) assessment += 'Human signals: ' + humanSignals.join('; ') + '.';
  if (!assessment) assessment = 'No strong signals either way. Score based on overall pattern analysis.';

  return { score, flag, confidence, signals, assessment, risk, riskReason };
}

// ── docx helpers ──────────────────────────────────────────────────────────────
const thin = (c='CCCCCC') => ({ style:BorderStyle.SINGLE, size:1, color:c });
const allB = (c='CCCCCC') => ({ top:thin(c), bottom:thin(c), left:thin(c), right:thin(c) });
const noB  = () => ({ style:BorderStyle.NONE, size:0, color:'FFFFFF' });
const noBS = () => ({ top:noB(), bottom:noB(), left:noB(), right:noB() });

const t = (text, o={}) => new TextRun({ text:String(text||''), font:'Arial', size:o.size||20, bold:o.bold, italic:o.italic, color:o.color||'000000', ...o });
const p = (children, o={}) => new Paragraph({ children:Array.isArray(children)?children:[children], spacing:{ before:o.before??60, after:o.after??60 }, alignment:o.align||AlignmentType.LEFT, ...o });
const spacer = (b=80) => p([t('')],{before:b,after:0});

function cell(children, fill, width, opts={}) {
  return new TableCell({
    borders: opts.noBorder ? noBS() : allB(opts.borderColor||'CCCCCC'),
    shading: fill ? { fill, type:ShadingType.CLEAR } : undefined,
    margins: { top:100, bottom:100, left:140, right:140 },
    width: { size:width, type:WidthType.DXA },
    verticalAlign: opts.vAlign || undefined,
    children: Array.isArray(children) ? children : [children]
  });
}

function oneRowTable(children, fill, opts={}) {
  return new Table({
    width: { size:9360, type:WidthType.DXA },
    columnWidths:[9360],
    rows:[new TableRow({ children:[cell(children, fill, 9360, opts)] })]
  });
}

function flagColor(flag) {
  if (flag==='GREEN') return LIGHT_GREEN;
  if (flag==='YELLOW') return LIGHT_YELLOW;
  return LIGHT_RED;
}
function flagTextColor(flag) {
  if (flag==='GREEN') return DARK_GREEN;
  if (flag==='YELLOW') return DARK_ORANGE;
  return DARK_RED;
}
function scoreBar(score) {
  const filled = '█'.repeat(score);
  const empty  = '░'.repeat(10-score);
  return filled + empty + ' ' + score + '/10';
}

function buildQuestionBlock(q, idx, ai) {
  const catNum = idx + 1;
  const confColor = ai.confidence==='HIGH' ? DARK_RED : ai.confidence==='MEDIUM' ? DARK_ORANGE : DARK_GREEN;

  const children = [];

  // ── Header row: cat | topic | compliant | score ───────────────────────────
  children.push(new Table({
    width:{ size:9360, type:WidthType.DXA },
    columnWidths:[2400, 3560, 1200, 2200],
    rows:[new TableRow({ children:[
      cell([p([t(q.category||'', {bold:true, size:18, color:WHITE})])], NAVY, 2400, {borderColor:NAVY}),
      cell([p([t(q.topic||'', {size:18, color:WHITE})])], NAVY, 3560, {borderColor:NAVY}),
      cell([p([t(q.compliant||'', {bold:true, size:18, color: q.compliant==='Y'?'90EE90': q.compliant==='N'?'FF6B6B':'FFD700'})])], NAVY, 1200, {borderColor:NAVY}),
      cell([p([t('Score: ' + (q.committee_score||'—') + '/10', {size:18, color:WHITE})])], NAVY, 2200, {borderColor:NAVY}),
    ]})]
  }));

  // ── BSB Requirement ───────────────────────────────────────────────────────
  children.push(oneRowTable([
    p([t('BSB REQUIREMENT', {bold:true, size:18, color:TEAL})], {before:0, after:40}),
    p([t(q.requirement||'', {size:18})], {before:0, after:0}),
  ], LIGHT_BLUE));

  // ── BRIM Answer ──────────────────────────────────────────────────────────
  children.push(oneRowTable([
    p([t('BRIM ANSWER', {bold:true, size:18, color:NAVY})], {before:0, after:40}),
    p([t(q.paragraph||'(No paragraph content)', {size:18})], {before:0, after:0}),
  ], 'F8F8F8'));

  // ── AI Assessment ────────────────────────────────────────────────────────
  children.push(new Table({
    width:{ size:9360, type:WidthType.DXA },
    columnWidths:[4680, 4680],
    rows:[new TableRow({ children:[
      cell([
        p([t('AI DETECTION ASSESSMENT', {bold:true, size:18, color:flagTextColor(ai.flag)})], {before:0, after:40}),
        p([
          t('Flag: ', {bold:true, size:18}),
          t(ai.flag, {bold:true, size:18, color:flagTextColor(ai.flag)}),
          t('   Confidence: ', {bold:true, size:18}),
          t(ai.confidence, {bold:true, size:18, color:confColor}),
          t('   Score: ', {bold:true, size:18}),
          t(ai.score+'/10', {bold:true, size:18}),
        ], {before:0, after:30}),
        p([t(scoreBar(ai.score), {size:18, font:'Courier New', color:flagTextColor(ai.flag)})], {before:0, after:30}),
        p([t(ai.assessment, {size:17, italic:true})], {before:0, after:0}),
      ], flagColor(ai.flag), 4680),
      cell([
        p([t('RISK ASSESSMENT', {bold:true, size:18, color: ai.risk==='HIGH'?DARK_RED: ai.risk==='MEDIUM'?DARK_ORANGE:DARK_GREEN})], {before:0, after:40}),
        p([
          t('Risk: ', {bold:true, size:18}),
          t(ai.risk, {bold:true, size:18, color: ai.risk==='HIGH'?DARK_RED: ai.risk==='MEDIUM'?DARK_ORANGE:DARK_GREEN}),
        ], {before:0, after:30}),
        p([t(ai.riskReason, {size:17})], {before:0, after:20}),
        p([t('Confidence level notes:', {bold:true, size:17})], {before:0, after:10}),
        p([t(ai.confidence === 'HIGH' ? 'Multiple strong signals detected — high confidence in assessment.' : ai.confidence === 'MEDIUM' ? 'Mixed signals — moderate confidence. Human review advised.' : 'Few signals detected — low confidence, likely clean.', {size:17, italic:true})], {before:0, after:0}),
      ], LIGHT_YELLOW, 4680),
    ]})]
  }));

  // ── Committee & Reviewer Notes ───────────────────────────────────────────
  children.push(new Table({
    width:{ size:9360, type:WidthType.DXA },
    columnWidths:[4680, 4680],
    rows:[new TableRow({ children:[
      cell([
        p([t('COMMITTEE REVIEW', {bold:true, size:18, color:NAVY})], {before:0, after:30}),
        p([t(q.committee_review||'No committee notes.', {size:17})], {before:0, after:20}),
        p([t('Internal Risk: ', {bold:true, size:17}), t(q.committee_risk||'—', {size:17})], {before:0, after:0}),
      ], LIGHT_GRAY, 4680),
      cell([
        p([t('REVIEWER FEEDBACK', {bold:true, size:18, color:NAVY})], {before:0, after:30}),
        p([t('Reviewed by: ________________________________  Date: ____________', {size:17, color:'888888'})], {before:0, after:30}),
        p([t('', {size:17})], {before:40, after:0}),
        p([t('', {size:17})], {before:40, after:0}),
        p([t('', {size:17})], {before:40, after:0}),
        p([t('─────────────────────────────────────────────', {size:16, color:'BBBBBB'})], {before:0, after:0}),
        p([t('Notes / feedback:                                                              ', {size:17, color:'888888'})], {before:10, after:0}),
      ], WHITE, 4680),
    ]})]
  }));

  children.push(spacer(80));
  return children;
}

// ── Summary stats ─────────────────────────────────────────────────────────────
function buildSummary(questions, aiResults) {
  const green  = aiResults.filter(r=>r.flag==='GREEN').length;
  const yellow = aiResults.filter(r=>r.flag==='YELLOW').length;
  const red    = aiResults.filter(r=>r.flag==='RED').length;
  const highRisk = aiResults.filter(r=>r.risk==='HIGH').length;
  const totalQ = questions.length;

  // By category
  const cats = [...new Set(questions.map(q=>q.category))];
  const catRows = cats.map(cat => {
    const cqs = questions.map((q,i)=>({q,i})).filter(({q})=>q.category===cat);
    const cGreen  = cqs.filter(({i})=>aiResults[i].flag==='GREEN').length;
    const cYellow = cqs.filter(({i})=>aiResults[i].flag==='YELLOW').length;
    const cRed    = cqs.filter(({i})=>aiResults[i].flag==='RED').length;
    const avgScore = Math.round(cqs.reduce((a,{i})=>a+aiResults[i].score,0)/cqs.length*10)/10;
    return { cat, total:cqs.length, green:cGreen, yellow:cYellow, red:cRed, avgScore };
  });

  const borderC = 'CCCCCC';
  const hdr = (text) => cell([p([t(text,{bold:true,size:18,color:WHITE})])], NAVY, 0, {borderColor:NAVY});

  const summaryTable = new Table({
    width:{ size:9360, type:WidthType.DXA },
    columnWidths:[3200, 800, 900, 1000, 900, 1000, 1560],
    rows:[
      new TableRow({ children:[
        hdr('Category'), hdr('Total'), hdr('🟢 Green'), hdr('🟡 Yellow'), hdr('🔴 Red'), hdr('Avg AI Score'), hdr('Risk Profile'),
      ]}),
      ...catRows.map(r => new TableRow({ children:[
        cell([p([t(r.cat,{size:17})])], WHITE, 3200),
        cell([p([t(String(r.total),{size:17,align:AlignmentType.CENTER})])], WHITE, 800),
        cell([p([t(String(r.green),{size:17,color:DARK_GREEN,bold:true})])], LIGHT_GREEN, 900),
        cell([p([t(String(r.yellow),{size:17,color:DARK_ORANGE,bold:true})])], LIGHT_YELLOW, 1000),
        cell([p([t(String(r.red),{size:17,color:DARK_RED,bold:true})])], LIGHT_RED, 900),
        cell([p([t(String(r.avgScore),{size:17})])], WHITE, 1000),
        cell([p([t(r.red>0?'Review needed':'Clean',{size:17,color:r.red>0?DARK_RED:DARK_GREEN})])], WHITE, 1560),
      ]})),
      new TableRow({ children:[
        cell([p([t('TOTAL',{bold:true,size:18})])], MID_GRAY, 3200),
        cell([p([t(String(totalQ),{bold:true,size:18})])], MID_GRAY, 800),
        cell([p([t(String(green),{bold:true,size:18,color:DARK_GREEN})])], LIGHT_GREEN, 900),
        cell([p([t(String(yellow),{bold:true,size:18,color:DARK_ORANGE})])], LIGHT_YELLOW, 1000),
        cell([p([t(String(red),{bold:true,size:18,color:DARK_RED})])], LIGHT_RED, 900),
        cell([p([t(String(Math.round(aiResults.reduce((a,r)=>a+r.score,0)/totalQ*10)/10),{bold:true,size:18})])], MID_GRAY, 1000),
        cell([p([t(highRisk+' HIGH risk',{bold:true,size:18,color:DARK_RED})])], MID_GRAY, 1560),
      ]}),
    ]
  });

  return summaryTable;
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  const data = JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));
  const questions = data.questions;

  console.log('Scoring ' + questions.length + ' questions...');

  // Score all questions
  const aiResults = questions.map(q => scoreAI(q.paragraph, q.bullet, q.requirement));

  // Patch rfp_data.json with ai_* fields
  questions.forEach((q, i) => {
    q.ai_score      = aiResults[i].score;
    q.ai_flag       = aiResults[i].flag;
    q.ai_confidence = aiResults[i].confidence;
    q.ai_assessment = aiResults[i].assessment;
    q.ai_risk       = aiResults[i].risk;
    if (!q.reviewer)          q.reviewer = '';
    if (!q.reviewer_feedback) q.reviewer_feedback = '';
  });
  fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2));
  console.log('rfp_data.json updated with ai_* fields');

  // ── Stats ──────────────────────────────────────────────────────────────────
  const green  = aiResults.filter(r=>r.flag==='GREEN').length;
  const yellow = aiResults.filter(r=>r.flag==='YELLOW').length;
  const red    = aiResults.filter(r=>r.flag==='RED').length;
  console.log(`\nAI Detection Summary:`);
  console.log(`  GREEN  (low risk): ${green}`);
  console.log(`  YELLOW (medium):   ${yellow}`);
  console.log(`  RED    (high risk): ${red}`);

  // ── Build Word doc ─────────────────────────────────────────────────────────
  const cats = [...new Set(questions.map(q=>q.category))];
  const allChildren = [];

  // Cover page
  allChildren.push(
    spacer(400),
    p([t('BSB RFP — TEAM REVIEW PACKAGE', {bold:true, size:52, color:NAVY})], {align:AlignmentType.CENTER, before:0, after:120}),
    p([t('BRIM Financial  ·  Bangor Savings Bank Credit Card Program', {size:26, color:TEAL})], {align:AlignmentType.CENTER, before:0, after:60}),
    p([t('April 6, 2026  ·  INTERNAL USE ONLY', {size:22, color:'888888'})], {align:AlignmentType.CENTER, before:0, after:200}),
  );

  // Stats boxes
  allChildren.push(
    new Table({
      width:{size:9360, type:WidthType.DXA}, columnWidths:[2340,2340,2340,2340],
      rows:[new TableRow({ children:[
        cell([
          p([t('383', {bold:true, size:52, color:NAVY})], {align:AlignmentType.CENTER, before:60, after:0}),
          p([t('Total Questions', {size:18, color:'555555'})], {align:AlignmentType.CENTER, before:0, after:60}),
        ], LIGHT_BLUE, 2340),
        cell([
          p([t(String(green), {bold:true, size:52, color:DARK_GREEN})], {align:AlignmentType.CENTER, before:60, after:0}),
          p([t('GREEN — Low AI Risk', {size:18, color:DARK_GREEN})], {align:AlignmentType.CENTER, before:0, after:60}),
        ], LIGHT_GREEN, 2340),
        cell([
          p([t(String(yellow), {bold:true, size:52, color:DARK_ORANGE})], {align:AlignmentType.CENTER, before:60, after:0}),
          p([t('YELLOW — Review Advised', {size:18, color:DARK_ORANGE})], {align:AlignmentType.CENTER, before:0, after:60}),
        ], LIGHT_YELLOW, 2340),
        cell([
          p([t(String(red), {bold:true, size:52, color:DARK_RED})], {align:AlignmentType.CENTER, before:60, after:0}),
          p([t('RED — Rewrite Needed', {size:18, color:DARK_RED})], {align:AlignmentType.CENTER, before:0, after:60}),
        ], LIGHT_RED, 2340),
      ]})]
    }),
    spacer(200),
  );

  // How to use section
  allChildren.push(
    oneRowTable([
      p([t('HOW TO USE THIS DOCUMENT', {bold:true, size:20, color:NAVY})], {before:0, after:40}),
      p([t('Purpose:', {bold:true, size:18}), t(' This is the internal team review package for the BSB RFP. Every question has an AI detection score, a risk flag, and a reviewer feedback field. Use this to guide where the team should focus review effort before April 10 submission.', {size:18})], {before:0, after:30}),
      p([t('AI Detection Score (0–10):', {bold:true, size:18}), t(' Heuristic score based on linguistic patterns. 0 = reads like a human wrote it. 10 = reads like AI output. Signals include: transition phrases, passive voice, uniform sentence length, lack of named clients/specifics.', {size:18})], {before:0, after:30}),
      p([t('GREEN (0–2):', {bold:true, size:18, color:DARK_GREEN}), t(' Low risk. Strong human voice markers. Confident naming of clients, specific numbers, short punchy sentences.', {size:18}), t('   YELLOW (3–5):', {bold:true, size:18, color:DARK_ORANGE}), t(' Some AI signals. Spot edit recommended.', {size:18}), t('   RED (6–10):', {bold:true, size:18, color:DARK_RED}), t(' High risk. Rewrite before submission.', {size:18})], {before:0, after:30}),
      p([t('Reviewer Feedback:', {bold:true, size:18}), t(' Each reviewer signs their name and adds notes in the REVIEWER FEEDBACK box. These stay internal — never go to BSB.', {size:18})], {before:0, after:0}),
    ], LIGHT_BLUE),
    spacer(200),
  );

  // Category summary table
  allChildren.push(
    p([t('CATEGORY SUMMARY', {bold:true, size:26, color:NAVY})], {before:0, after:80}),
    buildSummary(questions, aiResults),
    spacer(200),
    new Paragraph({ children:[new TextRun({text:''})], pageBreakBefore:true }),
  );

  // Questions by category
  for (const cat of cats) {
    const catQs = questions.map((q,i)=>({q,i})).filter(({q})=>q.category===cat);

    // Category header
    allChildren.push(
      new Table({
        width:{size:9360, type:WidthType.DXA}, columnWidths:[9360],
        rows:[new TableRow({ children:[cell([
          p([t(cat.toUpperCase(), {bold:true, size:32, color:WHITE})], {before:60, after:20, align:AlignmentType.CENTER}),
          p([t(catQs.length+' questions', {size:20, color:'CCDDFF'})], {before:0, after:60, align:AlignmentType.CENTER}),
        ], NAVY, 9360, {borderColor:NAVY})]})]
      }),
      spacer(120),
    );

    for (const {q, i} of catQs) {
      const blocks = buildQuestionBlock(q, i, aiResults[i]);
      allChildren.push(...blocks);
    }

    allChildren.push(
      new Paragraph({ children:[new TextRun({text:''})], pageBreakBefore:true }),
    );
  }

  const doc = new Document({
    styles:{
      default:{ document:{ run:{ font:'Arial', size:20 } } }
    },
    sections:[{
      properties:{
        page:{
          size:{ width:12240, height:15840 },
          margin:{ top:720, right:720, bottom:720, left:720 }
        }
      },
      headers:{
        default: new Header({ children:[
          new Table({
            width:{size:10800, type:WidthType.DXA}, columnWidths:[7200,3600],
            rows:[new TableRow({ children:[
              cell([p([t('BSB RFP — Team Review Package  ·  BRIM Financial  ·  INTERNAL', {size:16, color:'555555'})])], WHITE, 7200, {noBorder:true}),
              cell([p([t('April 6, 2026', {size:16, color:'888888'})], {align:AlignmentType.RIGHT})], WHITE, 3600, {noBorder:true}),
            ]})]
          })
        ]})
      },
      footers:{
        default: new Footer({ children:[
          p([
            t('BRIM Financial — INTERNAL USE ONLY — Do not distribute to BSB     ', {size:16, color:'888888'}),
            new TextRun({ children:[PageNumber.CURRENT], font:'Arial', size:16, color:'888888' }),
            t(' / ', {size:16, color:'888888'}),
            new TextRun({ children:[PageNumber.TOTAL_PAGES], font:'Arial', size:16, color:'888888' }),
          ], {align:AlignmentType.CENTER, before:0, after:0})
        ]})
      },
      children: allChildren
    }]
  });

  const buffer = await Packer.toBuffer(doc);
  fs.writeFileSync(OUTPUT, buffer);
  console.log('\nWritten: ' + OUTPUT);
  console.log('File size: ' + Math.round(buffer.length/1024) + ' KB');
}

main().catch(err => { console.error(err); process.exit(1); });
