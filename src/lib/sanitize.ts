/**
 * Sanitize user input to prevent injection attacks.
 * Strips HTML tags and limits string length.
 */
export function sanitizeString(input: unknown, maxLength = 10000): string {
  if (typeof input !== "string") return "";
  return input
    .replace(/<[^>]*>/g, "") // Strip HTML tags
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, "") // Strip control chars (keep newlines/tabs)
    .slice(0, maxLength)
    .trim();
}

/**
 * Sanitize a question object before sending to AI.
 * Ensures no unexpected fields or oversized content.
 */
export function sanitizeQuestionForAI(q: Record<string, unknown>): Record<string, unknown> {
  const allowed = [
    "ref", "category", "number", "topic", "requirement",
    "bullet", "paragraph", "confidence", "rationale", "notes",
    "pricing", "capability", "availability", "committee_review",
    "committee_risk", "committee_score", "compliant", "status",
    "a_oob", "b_config", "c_custom", "d_dnm", "strategic", "reg_enable",
  ];

  const sanitized: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in q) {
      const val = q[key];
      if (typeof val === "string") {
        sanitized[key] = sanitizeString(val, key === "requirement" || key === "bullet" || key === "paragraph" ? 20000 : 5000);
      } else {
        sanitized[key] = val;
      }
    }
  }
  return sanitized;
}

/**
 * Validate that a field name is one of the expected values.
 */
export function validateField(field: unknown): "bullet" | "paragraph" | null {
  if (field === "bullet" || field === "paragraph") return field;
  return null;
}

/**
 * Sanitize an array of rules (strings).
 */
export function sanitizeRules(rules: unknown): string[] {
  if (!Array.isArray(rules)) return [];
  return rules
    .filter((r): r is string => typeof r === "string")
    .map(r => sanitizeString(r, 500))
    .filter(r => r.length > 0)
    .slice(0, 50); // Max 50 rules
}
