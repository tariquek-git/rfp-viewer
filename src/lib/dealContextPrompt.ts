/**
 * Renders a DealContext into a prompt fragment for LLM injection.
 *
 * Returns an empty string if the context is effectively empty so callers
 * can do `${dealContextSection(ctx)}` without conditional checks.
 *
 * Section contexts are filtered to the question's category if provided.
 */

import type { DealContext, SectionContext } from '@/types';

function isEmpty(ctx: DealContext | null | undefined): boolean {
  if (!ctx) return true;
  return (
    !ctx.accountName.trim() &&
    !ctx.accountProfile.trim() &&
    ctx.mustEmphasize.length === 0 &&
    ctx.mustAvoid.length === 0 &&
    !ctx.evaluatorPrimary.trim() &&
    !ctx.freeformNotes.trim()
  );
}

function competitorLine(ctx: DealContext): string {
  if (!ctx.competitors.length) return '';
  const list = ctx.competitors
    .filter((c) => c.name.trim())
    .map((c) => (c.positioning ? `${c.name} (${c.positioning})` : c.name))
    .join('; ');
  return list ? `Competitors in play: ${list}` : '';
}

function sectionLine(sections: SectionContext[], category: string | undefined): string {
  if (!category || !sections.length) return '';
  const match = sections.find((s) => s.category.toLowerCase() === category.toLowerCase());
  if (!match) return '';
  const parts: string[] = [];
  if (match.emphasis.trim()) parts.push(`Emphasis: ${match.emphasis.trim()}`);
  if (match.mustInclude.length) {
    parts.push(`Must include: ${match.mustInclude.filter((x) => x.trim()).join('; ')}`);
  }
  if (!parts.length) return '';
  return `\nSECTION CONTEXT (${match.category}):\n${parts.join('\n')}`;
}

/**
 * Build the deal-context prompt section. Returns '' if no meaningful context.
 * Pass `category` to also append any matching SectionContext.
 */
export function dealContextSection(ctx: DealContext | null | undefined, category?: string): string {
  if (isEmpty(ctx)) return '';
  const c = ctx as DealContext;

  const lines: string[] = [];
  lines.push('DEAL CONTEXT (account-specific intelligence — apply to every answer):');
  if (c.accountName.trim()) {
    lines.push(
      c.accountProfile.trim()
        ? `Account: ${c.accountName.trim()} — ${c.accountProfile.trim()}`
        : `Account: ${c.accountName.trim()}`,
    );
  } else if (c.accountProfile.trim()) {
    lines.push(`Account profile: ${c.accountProfile.trim()}`);
  }
  if (c.relationshipStage) lines.push(`Relationship stage: ${c.relationshipStage}`);
  if (c.priorEngagement.trim()) lines.push(`Prior engagement: ${c.priorEngagement.trim()}`);

  if (c.mustEmphasize.length) {
    lines.push(`Must emphasize: ${c.mustEmphasize.filter((x) => x.trim()).join('; ')}`);
  }
  if (c.mustAvoid.length) {
    lines.push(`Must avoid: ${c.mustAvoid.filter((x) => x.trim()).join('; ')}`);
  }
  if (c.evaluatorPrimary.trim()) lines.push(`Primary evaluator: ${c.evaluatorPrimary.trim()}`);
  if (c.evaluatorTechnical.trim()) {
    lines.push(`Technical evaluator: ${c.evaluatorTechnical.trim()}`);
  }
  if (c.evaluatorBusiness.trim()) {
    lines.push(`Business evaluator: ${c.evaluatorBusiness.trim()}`);
  }
  const compLine = competitorLine(c);
  if (compLine) lines.push(compLine);
  if (c.freeformNotes.trim()) lines.push(`Additional context: ${c.freeformNotes.trim()}`);

  return `\n${lines.join('\n')}${sectionLine(c.sectionContexts, category)}`;
}
