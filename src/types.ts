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

export type ViewTab = "grid" | "context" | "rules";
export type StatusFilter = "Draft" | "Reviewed" | "Final" | "QA";
