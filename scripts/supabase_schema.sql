-- ============================================================
-- BSB RFP Workbook — Supabase Schema
-- Run this in your Supabase SQL Editor to create all tables
-- ============================================================

-- 1. QUESTIONS (main RFP data — 383 rows)
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
  compliant TEXT DEFAULT 'N',
  bullet TEXT,
  paragraph TEXT,
  confidence TEXT DEFAULT 'RED',
  rationale TEXT,
  notes TEXT,
  pricing TEXT,
  capability TEXT,
  availability TEXT,
  strategic BOOLEAN DEFAULT false,
  reg_enable BOOLEAN DEFAULT false,
  committee_review TEXT,
  committee_risk TEXT,
  committee_score INTEGER DEFAULT 0,
  status TEXT DEFAULT 'draft',
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_questions_category ON questions(category);
CREATE INDEX IF NOT EXISTS idx_questions_confidence ON questions(confidence);
CREATE INDEX IF NOT EXISTS idx_questions_status ON questions(status);

-- 2. RULES (global guidance + validation rules)
CREATE TABLE IF NOT EXISTS rules (
  id TEXT PRIMARY KEY,
  text TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'guidance'
);

-- 3. FEEDBACK (per-question comments)
CREATE TABLE IF NOT EXISTS feedback (
  id SERIAL PRIMARY KEY,
  question_ref TEXT REFERENCES questions(ref) ON DELETE CASCADE,
  field TEXT NOT NULL,
  comment TEXT NOT NULL,
  resolved BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_feedback_ref ON feedback(question_ref);

-- 4. KNOWLEDGE BASE (singleton config)
CREATE TABLE IF NOT EXISTS knowledge_base (
  id TEXT PRIMARY KEY DEFAULT 'default',
  company_facts TEXT DEFAULT '',
  key_metrics TEXT DEFAULT '',
  differentiators TEXT DEFAULT '',
  competitive_positioning TEXT DEFAULT '',
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 5. PRICING LINE ITEMS
CREATE TABLE IF NOT EXISTS pricing_items (
  id TEXT PRIMARY KEY,
  category TEXT,
  item TEXT,
  unit TEXT,
  unit_price NUMERIC DEFAULT 0,
  quantity NUMERIC DEFAULT 0,
  frequency TEXT DEFAULT 'one-time',
  notes TEXT
);

-- 6. WIN THEMES
CREATE TABLE IF NOT EXISTS win_themes (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  question_refs TEXT[] DEFAULT '{}'
);

-- 7. MILESTONES (implementation timeline)
CREATE TABLE IF NOT EXISTS milestones (
  id TEXT PRIMARY KEY,
  phase TEXT NOT NULL,
  description TEXT,
  start_week INTEGER DEFAULT 0,
  duration_weeks INTEGER DEFAULT 1,
  owner TEXT,
  dependencies TEXT,
  status TEXT DEFAULT 'planned'
);

-- 8. SLA COMMITMENTS
CREATE TABLE IF NOT EXISTS sla_commitments (
  id TEXT PRIMARY KEY,
  category TEXT NOT NULL,
  metric TEXT NOT NULL,
  target TEXT,
  measurement TEXT,
  penalty TEXT,
  current_performance TEXT
);

-- 9. RFP TEMPLATES (saved configurations)
CREATE TABLE IF NOT EXISTS rfp_templates (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  data JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 10. VERSIONS (cloud-backed version history)
CREATE TABLE IF NOT EXISTS versions (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  label TEXT NOT NULL,
  snapshot JSONB NOT NULL,
  created_by TEXT DEFAULT 'system',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_versions_created ON versions(created_at DESC);

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- Using anon key with open access for this internal tool
-- ============================================================

ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_base ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricing_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE win_themes ENABLE ROW LEVEL SECURITY;
ALTER TABLE milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE sla_commitments ENABLE ROW LEVEL SECURITY;
ALTER TABLE rfp_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE versions ENABLE ROW LEVEL SECURITY;

-- Allow full access via anon key (internal tool, password-protected app)
CREATE POLICY "Allow all for anon" ON questions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON rules FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON feedback FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON knowledge_base FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON pricing_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON win_themes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON milestones FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON sla_commitments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON rfp_templates FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON versions FOR ALL USING (true) WITH CHECK (true);

-- ============================================================
-- SEED: Insert default knowledge base row
-- ============================================================
INSERT INTO knowledge_base (id) VALUES ('default') ON CONFLICT (id) DO NOTHING;
