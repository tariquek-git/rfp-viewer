// === Core Data Model ===

export type WorkflowStatus = "draft" | "reviewed" | "approved" | "flagged";

export interface Question {
  ref: string;
  category: string;
  number: number;
  topic: string;
  requirement: string;
  a_oob: boolean;
  b_config: boolean;
  c_custom: boolean;
  d_dnm: boolean;
  compliant: string;
  bullet: string;
  paragraph: string;
  confidence: string;
  rationale: string;
  notes: string;
  pricing: string;
  capability: string;
  availability: string;
  strategic: boolean;
  reg_enable: boolean;
  committee_review: string;
  committee_risk: string;
  committee_score: number;
  status: WorkflowStatus;
}

export interface RFPStats {
  total: number;
  green: number;
  yellow: number;
  red: number;
  compliant_y: number;
  compliant_n: number;
  compliant_partial: number;
  with_strategic: number;
  with_reg_enable: number;
}

export interface RFPData {
  categories: string[];
  questions: Question[];
  stats: RFPStats;
}

// === View Types ===

export type ViewTab = "grid" | "context" | "knowledgebase" | "compliance" | "submission" | "pricing" | "timeline" | "sla";
export type StatusFilter = "All Status" | "draft" | "reviewed" | "approved" | "flagged";

// === Diff / AI Suggestion Types ===

export interface DiffSegment {
  type: "equal" | "add" | "remove";
  text: string;
}

export interface DiffResult {
  original: string;
  suggested: string;
  segments: DiffSegment[];
}

export interface PendingDiff {
  ref: string;
  field: "bullet" | "paragraph";
  original: string;
  suggested: string;
  diff: DiffResult;
  timestamp: number;
  validationResults?: ValidationResult[];
}

// === Knowledge Base ===

export interface KnowledgeBase {
  companyFacts: string;
  keyMetrics: string;
  differentiators: string;
  competitivePositioning: string;
  lastUpdated: number;
}

// === Rules & Validation ===

export interface ValidationRule {
  id: string;
  text: string;
  type: "guidance" | "validation";
}

export interface ValidationResult {
  rule: string;
  passed: boolean;
  message: string;
  severity: "error" | "warning";
}

// === AI Analysis ===

export interface CritiqueResult {
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
  score: number;
}

export interface ConsistencyIssue {
  type: "contradiction" | "inconsistent_metric" | "repeated_phrase" | "missing_crossref";
  description: string;
  questionRefs: string[];
  severity: "high" | "medium" | "low";
}

// === Grid State ===

export interface SortConfig {
  key: string;
  direction: "asc" | "desc";
}

// === Cell History ===

export interface CellHistoryEntry {
  value: string;
  timestamp: number;
  source: "human" | "ai" | "ai-edited";
  accepted?: boolean;
  rejected?: boolean;
}

export type CellHistory = Record<string, CellHistoryEntry[]>;

// === Feedback ===

export interface FeedbackItem {
  ref: string;
  field: string;
  comment: string;
  timestamp: number;
  resolved: boolean;
}

// === Version ===

export interface Version {
  label: string;
  timestamp: number;
  data: RFPData;
}

// === Pricing ===

export interface PricingLineItem {
  id: string;
  category: string;
  description: string;
  type: "one-time" | "recurring" | "per-transaction" | "volume-tiered";
  amount: number;
  unit: string;
  notes: string;
}

export interface PricingModel {
  lineItems: PricingLineItem[];
  implementationFee: number;
  annualRecurring: number;
  currency: string;
  lastUpdated: number;
}

// === Win Themes ===

export interface WinTheme {
  id: string;
  title: string;
  description: string;
  questionRefs: string[];
}

// === Implementation Timeline ===

export interface TimelineMilestone {
  id: string;
  phase: string;
  description: string;
  startWeek: number;
  durationWeeks: number;
  owner: string;
  dependencies: string;
  status: "not-started" | "in-progress" | "complete";
}

// === SLA Framework ===

export interface SLACommitment {
  id: string;
  category: string;
  metric: string;
  target: string;
  measurement: string;
  penalty: string;
  currentPerformance: string;
}

// === Q&A Log ===

export interface QAEntry {
  id: string;
  question: string;
  answer: string;
  submittedDate: string;
  respondedDate: string;
  status: "pending" | "answered" | "clarification-needed";
  affectedRefs: string[];
}

// === Submission Checklist ===

export interface ChecklistItem {
  id: string;
  label: string;
  category: string;
  completed: boolean;
  notes: string;
}

// === Narrative Audit ===

export interface NarrativeAuditResult {
  overallScore: number;
  voiceConsistency: string;
  themeAlignment: { theme: string; coverage: number; gaps: string[] }[];
  genericLanguage: { ref: string; phrase: string; suggestion: string }[];
  storyBreaks: { description: string; refs: string[] }[];
  recommendation: string;
}
