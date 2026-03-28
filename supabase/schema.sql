-- ============================================================
-- BSB RFP Workbook — Supabase Schema
-- Run this in your Supabase SQL Editor to set up all tables.
-- ============================================================

-- ── Questions ────────────────────────────────────────────────
create table if not exists questions (
  ref               text primary key,
  category          text not null default '',
  number            integer not null default 0,
  topic             text not null default '',
  requirement       text not null default '',
  a_oob             boolean not null default false,
  b_config          boolean not null default false,
  c_custom          boolean not null default false,
  d_dnm             boolean not null default false,
  compliant         text not null default '',
  bullet            text not null default '',
  paragraph         text not null default '',
  confidence        text not null default '',
  rationale         text not null default '',
  notes             text not null default '',
  pricing           text not null default '',
  capability        text not null default '',
  availability      text not null default '',
  strategic         boolean not null default false,
  reg_enable        boolean not null default false,
  committee_review  text not null default '',
  committee_risk    text not null default '',
  committee_score   integer not null default 0,
  status            text not null default 'draft',
  updated_at        timestamptz not null default now()
);

-- ── Rules (global guidance + validation) ─────────────────────
create table if not exists rules (
  id    text primary key,
  text  text not null,
  type  text not null  -- 'guidance' | 'validation'
);

-- ── Feedback ─────────────────────────────────────────────────
create table if not exists feedback (
  id            serial primary key,
  question_ref  text not null,
  field         text not null,
  comment       text not null,
  resolved      boolean not null default false,
  created_at    timestamptz not null default now()
);

-- ── Knowledge Base (single row, id = 'default') ──────────────
create table if not exists knowledge_base (
  id                      text primary key default 'default',
  company_facts           text not null default '',
  key_metrics             text not null default '',
  differentiators         text not null default '',
  competitive_positioning text not null default '',
  updated_at              timestamptz not null default now()
);

-- ── Pricing Line Items ───────────────────────────────────────
create table if not exists pricing_items (
  id          text primary key,
  category    text not null default '',
  description text not null default '',
  type        text not null default 'one-time',
  amount      numeric not null default 0,
  unit        text not null default '',
  notes       text not null default ''
);

-- ── Win Themes ───────────────────────────────────────────────
create table if not exists win_themes (
  id            text primary key,
  title         text not null,
  description   text not null default '',
  question_refs text[] not null default '{}'
);

-- ── Implementation Timeline ──────────────────────────────────
create table if not exists milestones (
  id              text primary key,
  phase           text not null,
  description     text not null default '',
  start_week      integer not null default 0,
  duration_weeks  integer not null default 1,
  owner           text not null default '',
  dependencies    text not null default '',
  status          text not null default 'not-started'
);

-- ── SLA Commitments ─────────────────────────────────────────
create table if not exists sla_commitments (
  id                   text primary key,
  category             text not null,
  metric               text not null,
  target               text not null default '',
  measurement          text not null default '',
  penalty              text not null default '',
  current_performance  text not null default ''
);

-- ── Cloud Version History ────────────────────────────────────
create table if not exists versions (
  id          text primary key,
  label       text not null,
  snapshot    jsonb not null,
  created_by  text not null default 'user',
  created_at  timestamptz not null default now()
);

-- ── RFP Templates ────────────────────────────────────────────
create table if not exists rfp_templates (
  id          text primary key,
  name        text not null,
  description text not null default '',
  data        jsonb not null,
  created_at  timestamptz not null default now()
);

-- ============================================================
-- Row Level Security
-- Enable RLS on all tables and add a policy that allows all
-- operations from authenticated requests using the anon key.
-- For a private internal tool, this is sufficient.
-- ============================================================

alter table questions       enable row level security;
alter table rules           enable row level security;
alter table feedback        enable row level security;
alter table knowledge_base  enable row level security;
alter table pricing_items   enable row level security;
alter table win_themes      enable row level security;
alter table milestones      enable row level security;
alter table sla_commitments enable row level security;
alter table versions        enable row level security;
alter table rfp_templates   enable row level security;

-- Allow all operations via the anon key (internal tool — no user auth required)
create policy "anon full access" on questions       for all using (true) with check (true);
create policy "anon full access" on rules           for all using (true) with check (true);
create policy "anon full access" on feedback        for all using (true) with check (true);
create policy "anon full access" on knowledge_base  for all using (true) with check (true);
create policy "anon full access" on pricing_items   for all using (true) with check (true);
create policy "anon full access" on win_themes      for all using (true) with check (true);
create policy "anon full access" on milestones      for all using (true) with check (true);
create policy "anon full access" on sla_commitments for all using (true) with check (true);
create policy "anon full access" on versions        for all using (true) with check (true);
create policy "anon full access" on rfp_templates   for all using (true) with check (true);

-- ============================================================
-- Indexes for common query patterns
-- ============================================================

create index if not exists idx_questions_category   on questions (category);
create index if not exists idx_questions_confidence on questions (confidence);
create index if not exists idx_questions_status     on questions (status);
create index if not exists idx_feedback_question    on feedback (question_ref);
create index if not exists idx_versions_created_at  on versions (created_at desc);
