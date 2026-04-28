/**
 * Central registry of all localStorage / IndexedDB keys used by the app.
 * Import from here instead of hard-coding key strings to prevent typos and
 * make it easy to audit or migrate storage in one place.
 */
export const STORAGE_KEYS = {
  /** Full RFP question data + edits */
  EDITS: 'rfp-edits',
  /** Per-cell edit history (source + timestamp) */
  CELL_HISTORY: 'rfp-cell-history',
  /** Global writing rules */
  GLOBAL_RULES: 'rfp-global-rules',
  /** Validation / quality-check rules */
  VALIDATION_RULES: 'rfp-validation-rules',
  /** Inline feedback items */
  FEEDBACK: 'rfp-feedback',
  /** Version snapshots array */
  VERSIONS: 'rfp-versions',
  /** Knowledge base (company facts, metrics, etc.) */
  KNOWLEDGE_BASE: 'rfp-knowledge-base',
  /** Pricing model line items */
  PRICING: 'rfp-pricing',
  /** Win themes */
  WIN_THEMES: 'rfp-win-themes',
  /** Implementation milestones */
  MILESTONES: 'rfp-milestones',
  /** SLA commitments */
  SLAS: 'rfp-slas',
  /** Emergency snapshot written synchronously on beforeunload */
  EMERGENCY: 'rfp-emergency',
  /** Onboarding completed flag */
  ONBOARDED: 'rfp-onboarded',
  /** Tour completed flag */
  TOUR_DONE: 'rfp-tour-done',
  /** Saved template metadata index */
  TEMPLATES_INDEX: 'rfp-templates-index',
  /** Prefix for individual template payloads: `${TEMPLATE_PREFIX}${timestamp}` */
  TEMPLATE_PREFIX: 'rfp-template-',
  /** Submission deadline date string */
  DEADLINE: 'rfp-deadline',
  /** Section ownership assignments */
  SECTION_ASSIGNMENTS: 'rfp-section-assignments',
  /** Per-question assignments */
  QUESTION_ASSIGNMENTS: 'rfp-question-assignments',
  /** Team members roster */
  TEAM_MEMBERS: 'rfp-team-members',
  /** Deal-level account intelligence (per-RFP context) */
  DEAL_CONTEXT: 'rfp-deal-context',
} as const;

export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];
