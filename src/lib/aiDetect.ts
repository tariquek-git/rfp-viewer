/**
 * Client-side AI detection heuristics.
 * Scores text on how "AI-written" it sounds based on common patterns.
 */

const AI_PHRASES: Record<string, number> = {
  comprehensive: 3,
  robust: 3,
  seamless: 3,
  streamline: 2,
  leverage: 2,
  holistic: 3,
  'cutting-edge': 3,
  'state-of-the-art': 3,
  'best-in-class': 3,
  'world-class': 3,
  'industry-leading': 3,
  innovative: 2,
  'it is worth noting': 4,
  'it should be noted': 4,
  importantly: 2,
  furthermore: 2,
  moreover: 2,
  'in conclusion': 3,
  'in summary': 3,
  'demonstrates our': 2,
  underscores: 2,
  'commitment to': 1,
  'designed to': 1,
  'tailored to': 1,
  'positioned to': 2,
  'ensuring that': 1,
  'aligns with': 1,
  enhance: 1,
  utilize: 2,
  facilitate: 2,
  optimize: 1,
  empower: 2,
  scalable: 1,
  'end-to-end': 1,
};

export interface AIDetectResult {
  score: number; // 0-20+ raw score
  level: 'low' | 'medium' | 'high'; // risk level
  triggers: string[]; // what was flagged
  suggestion: string; // what to fix
}

export function detectAIWriting(text: string): AIDetectResult {
  if (!text || text.length < 50) return { score: 0, level: 'low', triggers: [], suggestion: '' };

  const lower = text.toLowerCase();
  let score = 0;
  const triggers: string[] = [];

  // Check AI phrases
  for (const [phrase, weight] of Object.entries(AI_PHRASES)) {
    const count = (lower.match(new RegExp(phrase, 'g')) || []).length;
    if (count > 0) {
      score += count * weight;
      triggers.push(`"${phrase}" (${count}x)`);
    }
  }

  // Em-dash overuse (AI loves em-dashes)
  const emDashCount = (text.match(/—/g) || []).length + (text.match(/ - /g) || []).length;
  if (emDashCount > 3) {
    score += emDashCount;
    triggers.push(`em-dashes (${emDashCount})`);
  }

  // Very long sentences (>40 words) - exclude bullet point lists
  const sentences = text.split(/[.!?]+/).filter((s) => s.trim());
  const longSentences = sentences.filter((s) => {
    const trimmed = s.trim();
    // Skip bullet-point blocks (contain multiple - or • lines)
    if ((trimmed.match(/\n\s*[-•]/g) || []).length >= 2) return false;
    return trimmed.split(/\s+/).length > 40;
  }).length;
  if (longSentences > 1) {
    score += longSentences * 2;
    triggers.push(`long sentences (${longSentences})`);
  }

  // Passive voice indicators
  const passiveCount = (
    lower.match(
      /\b(is|are|was|were|been|being)\s+(designed|built|configured|implemented|integrated|developed|positioned|structured|tailored|crafted)\b/g,
    ) || []
  ).length;
  if (passiveCount > 2) {
    score += passiveCount;
    triggers.push(`passive voice (${passiveCount})`);
  }

  // Repetitive sentence starts
  const starts = sentences
    .map((s) => s.trim().split(/\s+/).slice(0, 3).join(' ').toLowerCase())
    .filter(Boolean);
  if (starts.length > 3) {
    const startCounts: Record<string, number> = {};
    for (const s of starts) startCounts[s] = (startCounts[s] || 0) + 1;
    const repeated = Object.entries(startCounts).filter(([, c]) => c > 2);
    if (repeated.length > 0) {
      score += 3;
      triggers.push('repetitive sentence starts');
    }
  }

  const level: AIDetectResult['level'] = score >= 8 ? 'high' : score >= 4 ? 'medium' : 'low';

  let suggestion = '';
  if (level === 'high') {
    suggestion =
      "This response reads as AI-generated. Break up long sentences, replace em-dashes with periods, remove filler words like 'comprehensive', 'robust', 'seamless'. Use specific data points instead of superlatives.";
  } else if (level === 'medium') {
    suggestion =
      'Some AI patterns detected. Consider shortening sentences and replacing generic phrases with specific Brim metrics.';
  }

  return { score, level, triggers, suggestion };
}

/**
 * Get the color classes for an AI detection level.
 */
export function aiDetectClasses(level: AIDetectResult['level']): string {
  switch (level) {
    case 'high':
      return 'text-red-600 bg-red-50 border-red-200';
    case 'medium':
      return 'text-amber-600 bg-amber-50 border-amber-200';
    case 'low':
      return 'text-emerald-600 bg-emerald-50 border-emerald-200';
  }
}

export function aiDetectLabel(level: AIDetectResult['level']): string {
  switch (level) {
    case 'high':
      return 'High AI Risk';
    case 'medium':
      return 'Medium';
    case 'low':
      return 'Human-like';
  }
}
