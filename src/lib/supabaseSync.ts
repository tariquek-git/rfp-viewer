import { supabase, isSupabaseConfigured } from './supabase';
import type {
  Question,
  KnowledgeBase,
  PricingModel,
  PricingLineItem,
  WinTheme,
  TimelineMilestone,
  SLACommitment,
  FeedbackItem,
  ValidationRule,
  Version,
  RFPData,
} from '@/types';

export interface SyncResult {
  success: boolean;
  message: string;
  counts?: Record<string, number>;
}

// === PUSH (local -> cloud) ===

export async function pushToCloud(data: {
  questions: Question[];
  globalRules: string[];
  validationRules: ValidationRule[];
  feedbackItems: FeedbackItem[];
  knowledgeBase: KnowledgeBase;
  pricingModel: PricingModel;
  winThemes: WinTheme[];
  milestones: TimelineMilestone[];
  slaCommitments: SLACommitment[];
  versions: Version[];
}): Promise<SyncResult> {
  if (!isSupabaseConfigured() || !supabase) {
    return {
      success: false,
      message:
        'Supabase not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to your environment.',
    };
  }

  try {
    const counts: Record<string, number> = {};

    // Questions
    const questionsData = data.questions.map((q) => ({
      ...q,
      updated_at: new Date().toISOString(),
    }));
    const { error: qErr } = await supabase
      .from('questions')
      .upsert(questionsData, { onConflict: 'ref' });
    if (qErr) throw new Error(`Questions: ${qErr.message}`);
    counts.questions = data.questions.length;

    // Rules (combine global + validation)
    const allRules = [
      ...data.globalRules.map((text, i) => ({ id: `global-${i}`, text, type: 'guidance' })),
      ...data.validationRules.map((r) => ({ id: r.id, text: r.text, type: r.type })),
    ];
    if (allRules.length > 0) {
      await supabase.from('rules').delete().neq('id', '');
      const { error: rErr } = await supabase.from('rules').insert(allRules);
      if (rErr) throw new Error(`Rules: ${rErr.message}`);
    }
    counts.rules = allRules.length;

    // Feedback
    if (data.feedbackItems.length > 0) {
      await supabase.from('feedback').delete().neq('id', 0);
      const fbData = data.feedbackItems.map((f, i) => ({
        id: i + 1,
        question_ref: f.ref,
        field: f.field,
        comment: f.comment,
        resolved: f.resolved,
        created_at: new Date(f.timestamp).toISOString(),
      }));
      const { error: fErr } = await supabase.from('feedback').insert(fbData);
      if (fErr) throw new Error(`Feedback: ${fErr.message}`);
    }
    counts.feedback = data.feedbackItems.length;

    // Knowledge Base
    const { error: kbErr } = await supabase.from('knowledge_base').upsert({
      id: 'default',
      company_facts: data.knowledgeBase.companyFacts,
      key_metrics: data.knowledgeBase.keyMetrics,
      differentiators: data.knowledgeBase.differentiators,
      competitive_positioning: data.knowledgeBase.competitivePositioning,
      updated_at: new Date().toISOString(),
    });
    if (kbErr) throw new Error(`KB: ${kbErr.message}`);

    // Pricing
    if (data.pricingModel.lineItems.length > 0) {
      await supabase.from('pricing_items').delete().neq('id', '');
      const { error: pErr } = await supabase
        .from('pricing_items')
        .insert(data.pricingModel.lineItems);
      if (pErr) throw new Error(`Pricing: ${pErr.message}`);
    }
    counts.pricing = data.pricingModel.lineItems.length;

    // Win Themes
    if (data.winThemes.length > 0) {
      await supabase.from('win_themes').delete().neq('id', '');
      const { error: wtErr } = await supabase.from('win_themes').insert(
        data.winThemes.map((t) => ({
          id: t.id,
          title: t.title,
          description: t.description,
          question_refs: t.questionRefs,
        })),
      );
      if (wtErr) throw new Error(`Win Themes: ${wtErr.message}`);
    }
    counts.winThemes = data.winThemes.length;

    // Milestones
    if (data.milestones.length > 0) {
      await supabase.from('milestones').delete().neq('id', '');
      const { error: mErr } = await supabase.from('milestones').insert(
        data.milestones.map((m) => ({
          id: m.id,
          phase: m.phase,
          description: m.description,
          start_week: m.startWeek,
          duration_weeks: m.durationWeeks,
          owner: m.owner,
          dependencies: m.dependencies,
          status: m.status,
        })),
      );
      if (mErr) throw new Error(`Milestones: ${mErr.message}`);
    }
    counts.milestones = data.milestones.length;

    // SLAs
    if (data.slaCommitments.length > 0) {
      await supabase.from('sla_commitments').delete().neq('id', '');
      const { error: sErr } = await supabase.from('sla_commitments').insert(
        data.slaCommitments.map((s) => ({
          id: s.id,
          category: s.category,
          metric: s.metric,
          target: s.target,
          measurement: s.measurement,
          penalty: s.penalty,
          current_performance: s.currentPerformance,
        })),
      );
      if (sErr) throw new Error(`SLAs: ${sErr.message}`);
    }
    counts.slas = data.slaCommitments.length;

    return { success: true, message: 'Pushed to cloud successfully', counts };
  } catch (e) {
    return { success: false, message: e instanceof Error ? e.message : 'Push failed' };
  }
}

// === PULL (cloud -> local) ===

export async function pullFromCloud(): Promise<{
  success: boolean;
  message: string;
  data?: {
    questions: Question[];
    globalRules: string[];
    validationRules: ValidationRule[];
    feedbackItems: FeedbackItem[];
    knowledgeBase: KnowledgeBase;
    pricingModel: PricingModel;
    winThemes: WinTheme[];
    milestones: TimelineMilestone[];
    slaCommitments: SLACommitment[];
  };
}> {
  if (!isSupabaseConfigured() || !supabase) {
    return { success: false, message: 'Supabase not configured' };
  }

  try {
    // Questions
    const { data: questions, error: qErr } = await supabase
      .from('questions')
      .select('*')
      .order('number');
    if (qErr) throw new Error(`Questions: ${qErr.message}`);

    // Rules
    const { data: rules } = await supabase.from('rules').select('*');
    const globalRules = (rules || [])
      .filter((r: { type: string }) => r.type === 'guidance')
      .map((r: { text: string }) => r.text);
    const validationRules = (rules || [])
      .filter((r: { type: string }) => r.type === 'validation')
      .map((r: { id: string; text: string; type: string }) => ({
        id: r.id,
        text: r.text,
        type: r.type as 'validation',
      }));

    // Feedback
    const { data: feedback } = await supabase.from('feedback').select('*').order('created_at');
    const feedbackItems: FeedbackItem[] = (feedback || []).map(
      (f: {
        question_ref: string;
        field: string;
        comment: string;
        resolved: boolean;
        created_at: string;
      }) => ({
        ref: f.question_ref,
        field: f.field,
        comment: f.comment,
        resolved: f.resolved,
        timestamp: new Date(f.created_at).getTime(),
      }),
    );

    // KB
    const { data: kb } = await supabase
      .from('knowledge_base')
      .select('*')
      .eq('id', 'default')
      .single();
    const knowledgeBase: KnowledgeBase = kb
      ? {
          companyFacts: kb.company_facts || '',
          keyMetrics: kb.key_metrics || '',
          differentiators: kb.differentiators || '',
          competitivePositioning: kb.competitive_positioning || '',
          lastUpdated: new Date(kb.updated_at).getTime(),
        }
      : {
          companyFacts: '',
          keyMetrics: '',
          differentiators: '',
          competitivePositioning: '',
          lastUpdated: 0,
        };

    // Pricing
    const { data: pricingItems } = await supabase.from('pricing_items').select('*');
    const pricingModel: PricingModel = {
      lineItems: (pricingItems || []) as PricingLineItem[],
      implementationFee: 0,
      annualRecurring: 0,
      currency: 'USD',
      lastUpdated: Date.now(),
    };

    // Win Themes
    const { data: themes } = await supabase.from('win_themes').select('*');
    const winThemes: WinTheme[] = (themes || []).map(
      (t: { id: string; title: string; description: string; question_refs: string[] }) => ({
        id: t.id,
        title: t.title,
        description: t.description,
        questionRefs: t.question_refs || [],
      }),
    );

    // Milestones
    const { data: ms } = await supabase.from('milestones').select('*').order('start_week');
    const milestones: TimelineMilestone[] = (ms || []).map(
      (m: {
        id: string;
        phase: string;
        description: string;
        start_week: number;
        duration_weeks: number;
        owner: string;
        dependencies: string;
        status: string;
      }) => ({
        id: m.id,
        phase: m.phase,
        description: m.description,
        startWeek: m.start_week,
        durationWeeks: m.duration_weeks,
        owner: m.owner,
        dependencies: m.dependencies,
        status: m.status as TimelineMilestone['status'],
      }),
    );

    // SLAs
    const { data: slas } = await supabase.from('sla_commitments').select('*');
    const slaCommitments: SLACommitment[] = (slas || []).map(
      (s: {
        id: string;
        category: string;
        metric: string;
        target: string;
        measurement: string;
        penalty: string;
        current_performance: string;
      }) => ({
        id: s.id,
        category: s.category,
        metric: s.metric,
        target: s.target,
        measurement: s.measurement,
        penalty: s.penalty,
        currentPerformance: s.current_performance,
      }),
    );

    return {
      success: true,
      message: 'Pulled from cloud',
      data: {
        questions: (questions || []) as Question[],
        globalRules,
        validationRules,
        feedbackItems,
        knowledgeBase,
        pricingModel,
        winThemes,
        milestones,
        slaCommitments,
      },
    };
  } catch (e) {
    return { success: false, message: e instanceof Error ? e.message : 'Pull failed' };
  }
}

// === TEMPLATES ===

export async function saveAsTemplate(
  name: string,
  description: string,
  data: RFPData,
): Promise<SyncResult> {
  if (!isSupabaseConfigured() || !supabase) {
    return { success: false, message: 'Supabase not configured' };
  }
  const { error } = await supabase.from('rfp_templates').insert({
    id: Date.now().toString(),
    name,
    description,
    data,
    created_at: new Date().toISOString(),
  });
  if (error) return { success: false, message: error.message };
  return { success: true, message: 'Template saved' };
}

export async function listTemplates(): Promise<
  { id: string; name: string; description: string; created_at: string }[]
> {
  if (!isSupabaseConfigured() || !supabase) return [];
  const { data } = await supabase
    .from('rfp_templates')
    .select('id, name, description, created_at')
    .order('created_at', { ascending: false });
  return (data || []) as { id: string; name: string; description: string; created_at: string }[];
}

export async function loadTemplate(id: string): Promise<RFPData | null> {
  if (!isSupabaseConfigured() || !supabase) return null;
  const { data } = await supabase.from('rfp_templates').select('data').eq('id', id).single();
  return data?.data as RFPData | null;
}
