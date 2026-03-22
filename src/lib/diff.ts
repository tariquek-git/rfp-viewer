import type { DiffResult, DiffSegment } from '@/types';

/**
 * Word-level diff using LCS (Longest Common Subsequence).
 * Falls back to line-level for texts > 1000 words.
 */
export function computeWordDiff(original: string, suggested: string): DiffResult {
  const origWords = tokenize(original);
  const sugWords = tokenize(suggested);

  // Fallback to line-level for very long texts
  if (origWords.length > 1000 || sugWords.length > 1000) {
    return computeLineDiff(original, suggested);
  }

  const segments = diffWords(origWords, sugWords);
  return { original, suggested, segments };
}

function tokenize(text: string): string[] {
  if (!text) return [];
  // Split on whitespace, preserving the whitespace as part of the preceding word
  return text.split(/(\s+)/).filter(Boolean);
}

function diffWords(a: string[], b: string[]): DiffSegment[] {
  const m = a.length;
  const n = b.length;

  // Build LCS table
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  // Backtrack to find diff
  const segments: DiffSegment[] = [];
  let i = m,
    j = n;

  const pending: DiffSegment[] = [];

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && a[i - 1] === b[j - 1]) {
      pending.push({ type: 'equal', text: a[i - 1] });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      pending.push({ type: 'add', text: b[j - 1] });
      j--;
    } else {
      pending.push({ type: 'remove', text: a[i - 1] });
      i--;
    }
  }

  pending.reverse();

  // Merge consecutive segments of the same type
  for (const seg of pending) {
    if (segments.length > 0 && segments[segments.length - 1].type === seg.type) {
      segments[segments.length - 1].text += seg.text;
    } else {
      segments.push({ ...seg });
    }
  }

  return segments;
}

function computeLineDiff(original: string, suggested: string): DiffResult {
  const origLines = original.split('\n');
  const sugLines = suggested.split('\n');
  const segments = diffWords(origLines, sugLines).map((seg) => ({
    ...seg,
    text: seg.text + (seg.text.endsWith('\n') ? '' : '\n'),
  }));
  return { original, suggested, segments };
}
