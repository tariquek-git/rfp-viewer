-- RFP Viewer Supabase Schema
-- Run this in your Supabase SQL Editor to set up the database

-- Questions table
CREATE TABLE IF NOT EXISTS questions (
  ref TEXT PRIMARY KEY,
  category TEXT NOT NULL,
  number INTEGER NOT NULL,
  topic TEXT,
  requirement TEXT,
  a_oob BOOLEAN DEFAULT false,
  b_config BOOLEAN DEFAULT false,
  c_custom BOOLEAN DEFAULT false,
  d_dnm BOOLEAN DEFAULT false,
  compliant TEXT DEFAULT 'Y',
  bullet TEXT DEFAULT '',
  paragraph TEXT DEFAULT '',
  confidence TEXT DEFAULT 'GREEN',
  rationale TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  pricing TEXT DEFAULT '',
  capability TEXT DEFAULT '',
  availability TEXT DEFAULT '',
  strategic BOOLEAN DEFAULT false,
  reg_enable BOOLEAN DEFAULT false,
  committee_review TEXT DEFAULT '',
  committee_risk TEXT DEFAULT '',
  committee_score INTEGER DEFAULT 5,
  status TEXT DEFAULT 'draft',
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Rules
CREATE TABLE IF NOT EXISTS rules (
  id TEXT PRIMARY KEY,
  text TEXT NOT NULL,
  type TEXT DEFAULT 'guidance', -- 'guidance' or 'validation'
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Feedback
CREATE TABLE IF NOT EXISTS feedback (
  id SERIAL PRIMARY KEY,
  question_ref TEXT REFERENCES questions(ref),
  field TEXT NOT NULL,
  comment TEXT NOT NULL,
  resolved BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Versions
CREATE TABLE IF NOT EXISTS versions (
  id SERIAL PRIMARY KEY,
  label TEXT NOT NULL,
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Knowledge Base
CREATE TABLE IF NOT EXISTS knowledge_base (
  id TEXT PRIMARY KEY DEFAULT 'default',
  company_facts TEXT DEFAULT '',
  key_metrics TEXT DEFAULT '',
  differentiators TEXT DEFAULT '',
  competitive_positioning TEXT DEFAULT '',
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Pricing
CREATE TABLE IF NOT EXISTS pricing_items (
  id TEXT PRIMARY KEY,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  type TEXT DEFAULT 'recurring',
  amount NUMERIC DEFAULT 0,
  unit TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Win Themes
CREATE TABLE IF NOT EXISTS win_themes (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  question_refs TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Milestones
CREATE TABLE IF NOT EXISTS milestones (
  id TEXT PRIMARY KEY,
  phase TEXT NOT NULL,
  description TEXT DEFAULT '',
  start_week INTEGER DEFAULT 1,
  duration_weeks INTEGER DEFAULT 2,
  owner TEXT DEFAULT '',
  dependencies TEXT DEFAULT '',
  status TEXT DEFAULT 'not-started',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- SLA Commitments
CREATE TABLE IF NOT EXISTS sla_commitments (
  id TEXT PRIMARY KEY,
  category TEXT NOT NULL,
  metric TEXT NOT NULL,
  target TEXT DEFAULT '',
  measurement TEXT DEFAULT '',
  penalty TEXT DEFAULT '',
  current_performance TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RFP Templates
CREATE TABLE IF NOT EXISTS rfp_templates (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security (optional, enable when auth is added)
-- ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE rules ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_questions_category ON questions(category);
CREATE INDEX IF NOT EXISTS idx_questions_status ON questions(status);
CREATE INDEX IF NOT EXISTS idx_feedback_ref ON feedback(question_ref);
