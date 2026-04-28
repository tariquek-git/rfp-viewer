/**
 * Audience-aware prompt nuance.
 *
 * Bank RFPs route every question to one of a handful of evaluator types
 * (compliance/risk reviewer, IT/integration evaluator, business sponsor,
 * generalist). The same factual answer should be FRAMED differently for
 * each audience. This module derives an audience tag from the question's
 * category and returns the prompt fragment that nudges Claude to frame
 * accordingly.
 *
 * Pattern-based (regex on category text) so it adapts to future RFPs
 * with different category labels — not a hardcoded BSB category list.
 */

export type Audience = 'compliance' | 'it' | 'business' | 'general';

/**
 * Map a question.category string to an audience. Pattern-based so the
 * mapping adapts to category names in future RFPs (e.g. "Risk &
 * Regulatory" or "Engineering" or "Commercial").
 */
export function deriveAudience(category: string): Audience {
  const c = category.toLowerCase();

  if (
    /compl|\brisk\b|audit|regulat|legal|fraud|privacy|\baml\b|\bkyc\b|gdpr|\bpci\b|\bsox\b/.test(c)
  ) {
    return 'compliance';
  }

  if (
    /\btech\b|technology|integrat|\bapi\b|infrastructure|security|\bprocess\b|processing|operations|fulfill|\bapplication\b/.test(
      c,
    )
  ) {
    return 'it';
  }

  if (
    /business|account|partner|customer|experience|marketing|loyalty|pricing|finance|accounting|collection|sales/.test(
      c,
    )
  ) {
    return 'business';
  }

  return 'general';
}

const AUDIENCE_GUIDANCE: Record<Audience, string> = {
  compliance: `Audience: compliance, risk, or audit reviewer.
- Frame answers around who retains oversight, what controls exist, and what evidence is available.
- Cite specific frameworks (SOC 2, PCI DSS Level 1, ISO 27001, NIST) only when directly relevant; do not name-drop.
- Show the bank retains ownership of policy, approvals, and risk decisions; the platform is a technology provider, not a decisioning authority.
- Be precise about what is built-in vs. configurable vs. customer responsibility.
- Avoid sales language and forward-looking hedges.`,

  it: `Audience: technology or integration evaluator.
- Frame answers in concrete technical terms: APIs, latency, integration patterns, data flow, error handling, throughput.
- Be specific over abstract. Real numbers and named protocols beat adjectives.
- Address operational reality: failure modes, observability, dependencies, deployment cadence.
- Avoid marketing language and unverifiable performance claims.`,

  business: `Audience: business sponsor or line-of-business owner at the bank.
- Frame answers in terms of outcomes for the bank: cardholder experience, time-to-value, revenue or growth levers, operational lift.
- Lead with what the bank can now offer or do that it could not before; mechanism is supporting detail.
- Use less technical depth unless directly tied to a business outcome.
- Quantify with numbers the bank can verify (timelines, scale, customer counts) where the data exists.`,

  general: `Audience: cross-functional procurement committee with mixed technical depth.
- Balance precision with accessibility.
- Lead with what the bank gets; follow with how it works.
- One concrete proof point beats three abstract claims.`,
};

/**
 * Returns the prompt fragment for a given audience. Designed to be
 * inserted as a discrete labeled section in the user prompt, after
 * question context and before formatting/rule instructions.
 */
export function audienceGuidance(audience: Audience): string {
  return AUDIENCE_GUIDANCE[audience];
}

/**
 * Convenience: derive audience from a category and return its guidance
 * as a labeled prompt section ready for template literal interpolation.
 */
export function audienceSection(category: string): string {
  const audience = deriveAudience(category);
  return `\nAUDIENCE FRAMING (this question's evaluator):
${audienceGuidance(audience)}`;
}
