'use client';

import { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import type {
  RFPData,
  Question,
  ViewTab,
  CellHistory,
  CellHistoryEntry,
  FeedbackItem,
  Version,
  KnowledgeBase,
  ValidationRule,
  PendingDiff,
  SortConfig,
  PricingModel,
  WinTheme,
  TimelineMilestone,
  SLACommitment,
  DealContext,
} from '@/types';
import { BSB_DEAL_CONTEXT } from '@/lib/bsbDefaults';
import { computeWordDiff } from '@/lib/diff';
import { pushToCloud, pullFromCloud, pushVersion } from '@/lib/supabaseSync';
import { isSupabaseConfigured } from '@/lib/supabase';
import { useToast } from '@/components/Toast';
import { idbGet, idbMirrorState, idbSet } from '@/lib/indexedDB';
import { STORAGE_KEYS } from '@/lib/storageKeys';

const EMPTY_KB: KnowledgeBase = {
  companyFacts: '',
  keyMetrics: '',
  differentiators: '',
  competitivePositioning: '',
  lastUpdated: 0,
};

const EMPTY_PRICING: PricingModel = {
  lineItems: [],
  implementationFee: 0,
  annualRecurring: 0,
  currency: 'USD',
  lastUpdated: 0,
};

export function useRFPState() {
  // Core data
  const [data, setData] = useState<RFPData | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  // UI state
  const [activeTab, setActiveTab] = useState<ViewTab>('grid');
  const [activeCategory, setActiveCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [confidenceFilter, setConfidenceFilter] = useState('All Confidence');
  const [compliantFilter, setCompliantFilter] = useState('All Compliant');
  const [deliveryFilter, setDeliveryFilter] = useState('All Delivery');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [showRules, setShowRules] = useState(false);
  const [showFilters, setShowFilters] = useState(true);
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);

  // Persistence state
  const [cellHistory, setCellHistory] = useState<CellHistory>({});
  const [feedbackItems, setFeedbackItems] = useState<FeedbackItem[]>([]);
  const [versions, setVersions] = useState<Version[]>([]);
  const [hasUnsaved, setHasUnsaved] = useState(false);
  const [globalRules, setGlobalRules] = useState<string[]>([]);
  const [validationRules, setValidationRules] = useState<ValidationRule[]>([]);
  const [knowledgeBase, setKnowledgeBase] = useState<KnowledgeBase>(EMPTY_KB);
  const [dealContext, setDealContext] = useState<DealContext>(BSB_DEAL_CONTEXT);

  // New state for features
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);
  const [pendingDiffs, setPendingDiffs] = useState<Record<string, PendingDiff>>({});
  const [showConsistency, setShowConsistency] = useState(false);
  const [showSummary, setShowSummary] = useState(false);

  // CPO features state
  const [pricingModel, setPricingModel] = useState<PricingModel>(EMPTY_PRICING);
  const [winThemes, setWinThemes] = useState<WinTheme[]>([]);
  const [milestones, setMilestones] = useState<TimelineMilestone[]>([]);
  const [slaCommitments, setSLACommitments] = useState<SLACommitment[]>([]);
  const [showWinThemes, setShowWinThemes] = useState(false);
  const [showChecklist, setShowChecklist] = useState(false);
  const [showNarrativeAudit, setShowNarrativeAudit] = useState(false);
  const [showVersionCompare, setShowVersionCompare] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);

  const { toasts, addToast, removeToast } = useToast();

  // === Data Loading ===
  useEffect(() => {
    fetch('/rfp_data.json')
      .then((r) => r.json())
      .then((d: RFPData) => {
        // Add default status to questions that don't have it
        const questions = d.questions.map((q) => ({
          ...q,
          status: (q as Question).status || ('draft' as const),
        }));
        let loadedData = { ...d, questions };

        const saved = localStorage.getItem(STORAGE_KEYS.EDITS);
        if (saved) {
          try {
            const edits = JSON.parse(saved);
            if (edits.questions) {
              loadedData = {
                ...edits,
                questions: edits.questions.map((q: Question) => ({
                  ...q,
                  status: q.status || 'draft',
                })),
              };
            }
          } catch {
            // localStorage data corrupted — try IDB mirror
            idbGet<{ data: RFPData }>('rfp-full-state').then((mirror) => {
              if (mirror?.data?.questions?.length) {
                setData({
                  ...mirror.data,
                  questions: mirror.data.questions.map((q) => ({
                    ...q,
                    status: q.status || 'draft',
                  })),
                });
              }
            });
            return; // prevent setData(loadedData) from overwriting IDB-restored data
          }
        }

        setData(loadedData);

        // Load other persisted state
        try {
          const v = localStorage.getItem(STORAGE_KEYS.CELL_HISTORY);
          if (v) setCellHistory(JSON.parse(v));
        } catch {
          /* */
        }
        try {
          const v = localStorage.getItem(STORAGE_KEYS.GLOBAL_RULES);
          if (v) setGlobalRules(JSON.parse(v));
        } catch {
          /* */
        }
        try {
          const v = localStorage.getItem(STORAGE_KEYS.VALIDATION_RULES);
          if (v) setValidationRules(JSON.parse(v));
        } catch {
          /* */
        }
        try {
          const v = localStorage.getItem(STORAGE_KEYS.FEEDBACK);
          if (v) setFeedbackItems(JSON.parse(v));
        } catch {
          /* */
        }
        try {
          const v = localStorage.getItem(STORAGE_KEYS.VERSIONS);
          if (v) setVersions(JSON.parse(v));
          else {
            // localStorage empty — check IDB backup
            idbGet<Version[]>(STORAGE_KEYS.VERSIONS).then((idbVersions) => {
              if (idbVersions?.length) setVersions(idbVersions);
            });
          }
        } catch {
          // Parse failed — try IDB fallback
          idbGet<Version[]>(STORAGE_KEYS.VERSIONS).then((idbVersions) => {
            if (idbVersions?.length) setVersions(idbVersions);
          });
        }
        try {
          const v = localStorage.getItem(STORAGE_KEYS.KNOWLEDGE_BASE);
          if (v) setKnowledgeBase(JSON.parse(v));
        } catch {
          /* */
        }
        try {
          const v = localStorage.getItem(STORAGE_KEYS.DEAL_CONTEXT);
          if (v) setDealContext(JSON.parse(v));
        } catch {
          /* */
        }
        try {
          const v = localStorage.getItem(STORAGE_KEYS.PRICING);
          if (v) setPricingModel(JSON.parse(v));
        } catch {
          /* */
        }
        try {
          const v = localStorage.getItem(STORAGE_KEYS.WIN_THEMES);
          if (v) setWinThemes(JSON.parse(v));
        } catch {
          /* */
        }
        try {
          const v = localStorage.getItem(STORAGE_KEYS.MILESTONES);
          if (v) setMilestones(JSON.parse(v));
        } catch {
          /* */
        }
        try {
          const v = localStorage.getItem(STORAGE_KEYS.SLAS);
          if (v) setSLACommitments(JSON.parse(v));
        } catch {
          /* */
        }

        setLoading(false);
      })
      .catch((e) => {
        console.error('Failed to load RFP data:', e);
        setLoadError(true);
        setLoading(false);
      });
  }, [retryCount]);

  // === Save / Persist ===
  const saveToLocal = useCallback(() => {
    if (!data) return;
    try {
      localStorage.setItem(STORAGE_KEYS.EDITS, JSON.stringify(data));
      localStorage.setItem(STORAGE_KEYS.CELL_HISTORY, JSON.stringify(cellHistory));
      localStorage.setItem(STORAGE_KEYS.GLOBAL_RULES, JSON.stringify(globalRules));
      localStorage.setItem(STORAGE_KEYS.VALIDATION_RULES, JSON.stringify(validationRules));
      localStorage.setItem(STORAGE_KEYS.FEEDBACK, JSON.stringify(feedbackItems));
      localStorage.setItem(STORAGE_KEYS.KNOWLEDGE_BASE, JSON.stringify(knowledgeBase));
      localStorage.setItem(STORAGE_KEYS.DEAL_CONTEXT, JSON.stringify(dealContext));
      localStorage.setItem(STORAGE_KEYS.PRICING, JSON.stringify(pricingModel));
      localStorage.setItem(STORAGE_KEYS.WIN_THEMES, JSON.stringify(winThemes));
      localStorage.setItem(STORAGE_KEYS.MILESTONES, JSON.stringify(milestones));
      localStorage.setItem(STORAGE_KEYS.SLAS, JSON.stringify(slaCommitments));
      setHasUnsaved(false);
      addToast('success', 'Changes saved locally');
      // Mirror to IndexedDB as secondary local backup (async, non-blocking)
      idbMirrorState({
        data,
        cellHistory,
        globalRules,
        validationRules,
        feedbackItems,
        knowledgeBase,
        pricingModel,
        winThemes,
        milestones,
        slaCommitments,
      });
    } catch (err) {
      const isQuota =
        err instanceof DOMException &&
        (err.name === 'QuotaExceededError' || err.name === 'NS_ERROR_DOM_QUOTA_REACHED');
      if (isQuota) {
        // localStorage full — still mirror to IDB so data isn't lost
        idbMirrorState({
          data,
          cellHistory,
          globalRules,
          validationRules,
          feedbackItems,
          knowledgeBase,
          pricingModel,
          winThemes,
          milestones,
          slaCommitments,
        });
        addToast(
          'error',
          'Local storage full — data backed up to browser DB. Delete old versions to free space.',
        );
      } else {
        addToast('error', 'Save failed — check browser permissions');
      }
      console.error('localStorage save failed:', err);
    }
  }, [
    data,
    cellHistory,
    globalRules,
    validationRules,
    feedbackItems,
    knowledgeBase,
    dealContext,
    pricingModel,
    winThemes,
    milestones,
    slaCommitments,
    addToast,
  ]);

  // === Keyboard Shortcuts ===
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        saveToLocal();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [saveToLocal]);

  const saveVersion = useCallback(
    (label?: string) => {
      if (!data) return;
      const isAutoSave = !label || label === 'Auto-save';
      const timeLabel = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const v: Version = {
        label: isAutoSave ? `Auto-save ${timeLabel}` : label,
        timestamp: Date.now(),
        data: JSON.parse(JSON.stringify(data)),
      };
      setVersions((prev) => {
        // Separate auto-saves from named (user-created) versions
        const named = prev.filter((x) => !x.label.startsWith('Auto-save'));
        const autoSaves = prev.filter((x) => x.label.startsWith('Auto-save'));
        // Cap auto-saves at 20 — rotate out the oldest
        const trimmedAutoSaves = autoSaves.length >= 20 ? autoSaves.slice(-19) : autoSaves;
        const next = isAutoSave
          ? [...named, ...trimmedAutoSaves, v]
          : [...named, ...trimmedAutoSaves, v]; // named versions always appended
        try {
          localStorage.setItem(STORAGE_KEYS.VERSIONS, JSON.stringify(next));
        } catch {
          /* quota — IDB fallback below */
        }
        // Mirror versions to IDB for redundancy
        idbSet(STORAGE_KEYS.VERSIONS, next);
        return next;
      });
    },
    [data],
  );

  const deleteVersion = useCallback((timestamp: number) => {
    setVersions((v) => {
      const next = v.filter((x) => x.timestamp !== timestamp);
      localStorage.setItem(STORAGE_KEYS.VERSIONS, JSON.stringify(next));
      return next;
    });
  }, []);

  // === Periodic Auto-Save (every 5 minutes when unsaved changes exist) ===
  const hasUnsavedRef = useRef(hasUnsaved);
  useEffect(() => {
    hasUnsavedRef.current = hasUnsaved;
  }, [hasUnsaved]);

  useEffect(() => {
    const interval = setInterval(
      () => {
        if (hasUnsavedRef.current) {
          saveToLocal();
          saveVersion('Auto-save');
        }
      },
      5 * 60 * 1000,
    ); // 5 minutes
    return () => clearInterval(interval);
  }, [saveToLocal, saveVersion]);

  const [cloudSyncStatus, setCloudSyncStatus] = useState<'idle' | 'syncing' | 'synced' | 'error'>(
    'idle',
  );

  const handleSave = useCallback(async () => {
    saveToLocal();
    saveVersion('Auto-save');

    // Auto-sync to Supabase if configured
    if (isSupabaseConfigured() && data) {
      setCloudSyncStatus('syncing');
      try {
        const result = await pushToCloud({
          questions: data.questions,
          globalRules,
          validationRules,
          feedbackItems,
          knowledgeBase,
          pricingModel,
          winThemes,
          milestones,
          slaCommitments,
          versions,
        });
        if (result.success) {
          // Also save a version snapshot to cloud
          await pushVersion(`Auto-save ${new Date().toLocaleTimeString()}`, data, 'auto');
          setCloudSyncStatus('synced');
          addToast('success', 'Saved locally + synced to cloud');
        } else {
          setCloudSyncStatus('error');
          addToast('warning', `Local saved, cloud sync failed: ${result.message}`);
        }
      } catch {
        setCloudSyncStatus('error');
        addToast('warning', 'Local saved, cloud sync failed');
      }
    }
  }, [
    saveToLocal,
    saveVersion,
    data,
    globalRules,
    validationRules,
    feedbackItems,
    knowledgeBase,
    pricingModel,
    winThemes,
    milestones,
    slaCommitments,
    versions,
    addToast,
  ]);

  // === Cell History ===
  const addCellHistory = useCallback(
    (ref: string, field: string, value: string, source: CellHistoryEntry['source']) => {
      setCellHistory((prev) => {
        const key = `${ref}:${field}`;
        return { ...prev, [key]: [...(prev[key] || []), { value, timestamp: Date.now(), source }] };
      });
    },
    [],
  );

  // === Question Updates ===
  const updateQuestion = useCallback(
    (updated: Question) => {
      if (!data) return;
      setData({
        ...data,
        questions: data.questions.map((q) => (q.ref === updated.ref ? updated : q)),
      });
      setHasUnsaved(true);
      if (selectedQuestion?.ref === updated.ref) setSelectedQuestion(updated);
    },
    [data, selectedQuestion],
  );

  const handleCellEdit = useCallback(
    (ref: string, field: keyof Question, value: string) => {
      if (!data) return;
      const q = data.questions.find((q) => q.ref === ref);
      if (!q) return;
      addCellHistory(ref, field, value, 'human');
      const shouldResetStatus =
        (field === 'bullet' || field === 'paragraph') && q.status === 'approved';
      updateQuestion({
        ...q,
        [field]: value,
        ...(shouldResetStatus ? { status: 'reviewed' as const } : {}),
      });
    },
    [data, addCellHistory, updateQuestion],
  );

  // === Status ===
  const cycleStatus = useCallback(
    (ref: string) => {
      if (!data) return;
      const q = data.questions.find((q) => q.ref === ref);
      if (!q) return;
      const order: Question['status'][] = ['draft', 'reviewed', 'approved', 'flagged'];
      const next = order[(order.indexOf(q.status) + 1) % order.length];
      updateQuestion({ ...q, status: next });
    },
    [data, updateQuestion],
  );

  const bulkSetStatus = useCallback(
    (status: Question['status']) => {
      if (!data) return;
      const updated = data.questions.map((q) => (selectedRows.has(q.ref) ? { ...q, status } : q));
      setData({ ...data, questions: updated });
      setHasUnsaved(true);
      addToast('success', `Set ${selectedRows.size} questions to ${status}`);
      setSelectedRows(new Set());
    },
    [data, selectedRows, addToast],
  );

  // === AI Rewrite (with diff) ===
  const activeRewriteRef = useRef<AbortController | null>(null);

  const cancelRewrite = useCallback(() => {
    activeRewriteRef.current?.abort();
    activeRewriteRef.current = null;
  }, []);

  const handleAiRewrite = useCallback(
    async (
      question: Question,
      field: 'bullet' | 'paragraph',
      rowRules: string,
      feedback: FeedbackItem[],
    ): Promise<string> => {
      // Cancel any in-flight rewrite before starting a new one
      activeRewriteRef.current?.abort();
      const controller = new AbortController();
      activeRewriteRef.current = controller;

      const res = await fetch('/api/rewrite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question,
          field,
          globalRules,
          rowRules,
          feedback,
          knowledgeBase,
          dealContext,
        }),
        signal: controller.signal,
      });
      const { text, error } = await res.json();
      if (error) {
        addToast('error', 'AI rewrite failed');
        throw new Error(error);
      }

      // Create pending diff instead of auto-replacing
      const original = question[field];
      const diff = computeWordDiff(original, text);
      const key = `${question.ref}:${field}`;

      // Optionally validate
      if (validationRules.filter((r) => r.type === 'validation').length > 0) {
        try {
          const valRes = await fetch('/api/validate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              text,
              validationRules: validationRules.filter((r) => r.type === 'validation'),
              question,
              knowledgeBase,
            }),
          });
          const valData = await valRes.json();
          setPendingDiffs((prev) => ({
            ...prev,
            [key]: {
              ref: question.ref,
              field,
              original,
              suggested: text,
              diff,
              timestamp: Date.now(),
              validationResults: valData.results,
            },
          }));
        } catch {
          setPendingDiffs((prev) => ({
            ...prev,
            [key]: {
              ref: question.ref,
              field,
              original,
              suggested: text,
              diff,
              timestamp: Date.now(),
            },
          }));
        }
      } else {
        setPendingDiffs((prev) => ({
          ...prev,
          [key]: {
            ref: question.ref,
            field,
            original,
            suggested: text,
            diff,
            timestamp: Date.now(),
          },
        }));
      }

      activeRewriteRef.current = null;
      addToast('info', `AI suggestion ready for ${field} — review the diff`);
      return text;
    },
    [globalRules, knowledgeBase, dealContext, validationRules, addToast],
  );

  // === Diff Accept/Reject ===
  const acceptDiff = useCallback(
    (key: string) => {
      const diff = pendingDiffs[key];
      if (!diff || !data) return;
      const q = data.questions.find((q) => q.ref === diff.ref);
      if (!q) return;
      addCellHistory(diff.ref, diff.field, diff.suggested, 'ai');
      updateQuestion({ ...q, [diff.field]: diff.suggested });
      setPendingDiffs((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
      addToast('success', `Accepted AI rewrite for ${diff.field}`);
    },
    [pendingDiffs, data, addCellHistory, updateQuestion, addToast],
  );

  const rejectDiff = useCallback(
    (key: string) => {
      const diff = pendingDiffs[key];
      if (!diff) return;
      setCellHistory((prev) => {
        const hKey = `${diff.ref}:${diff.field}`;
        return {
          ...prev,
          [hKey]: [
            ...(prev[hKey] || []),
            { value: diff.suggested, timestamp: Date.now(), source: 'ai' as const, rejected: true },
          ],
        };
      });
      setPendingDiffs((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
      addToast('info', 'Rejected AI suggestion');
    },
    [pendingDiffs, addToast],
  );

  const acceptEditedDiff = useCallback(
    (key: string, editedText: string) => {
      const diff = pendingDiffs[key];
      if (!diff || !data) return;
      const q = data.questions.find((q) => q.ref === diff.ref);
      if (!q) return;
      addCellHistory(diff.ref, diff.field, editedText, 'ai-edited');
      updateQuestion({ ...q, [diff.field]: editedText });
      setPendingDiffs((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
      addToast('success', `Accepted edited AI rewrite for ${diff.field}`);
    },
    [pendingDiffs, data, addCellHistory, updateQuestion, addToast],
  );

  // === Feedback ===
  const handleAddFeedback = useCallback(
    (ref: string, field: string, comment: string) => {
      setFeedbackItems((prev) => [
        ...prev,
        { ref, field, comment, timestamp: Date.now(), resolved: false },
      ]);
      setHasUnsaved(true);
      addToast('info', 'Feedback added');
    },
    [addToast],
  );

  const handleResolveFeedback = useCallback((ref: string, timestamp: number) => {
    setFeedbackItems((prev) =>
      prev.map((f) => (f.ref === ref && f.timestamp === timestamp ? { ...f, resolved: true } : f)),
    );
    setHasUnsaved(true);
  }, []);

  // === Row Selection ===
  const toggleRow = useCallback((ref: string) => {
    setSelectedRows((prev) => {
      const next = new Set(prev);
      if (next.has(ref)) next.delete(ref);
      else next.add(ref);
      return next;
    });
  }, []);

  const selectAllFiltered = useCallback((refs: string[]) => {
    setSelectedRows((prev) => {
      const allSelected = refs.every((r) => prev.has(r));
      if (allSelected) return new Set();
      return new Set(refs);
    });
  }, []);

  // === Filtering ===
  const filteredQuestions = useMemo(() => {
    if (!data) return [];
    let qs = data.questions;
    if (activeCategory !== 'All') qs = qs.filter((q) => q.category === activeCategory);
    if (search) {
      const s = search.toLowerCase();
      qs = qs.filter(
        (q) =>
          q.ref.toLowerCase().includes(s) ||
          q.topic.toLowerCase().includes(s) ||
          q.requirement.toLowerCase().includes(s) ||
          q.bullet.toLowerCase().includes(s) ||
          q.paragraph.toLowerCase().includes(s),
      );
    }
    if (confidenceFilter !== 'All Confidence')
      qs = qs.filter((q) => q.confidence === confidenceFilter);
    if (compliantFilter !== 'All Compliant') qs = qs.filter((q) => q.compliant === compliantFilter);
    if (deliveryFilter !== 'All Delivery') {
      qs = qs.filter((q) => {
        if (deliveryFilter === 'OOB') return q.a_oob;
        if (deliveryFilter === 'Config') return q.b_config;
        if (deliveryFilter === 'Custom') return q.c_custom;
        return true;
      });
    }
    if (statusFilter !== 'All Status') qs = qs.filter((q) => q.status === statusFilter);

    // Apply sort
    if (sortConfig) {
      qs = [...qs].sort((a, b) => {
        const aVal = a[sortConfig.key as keyof Question];
        const bVal = b[sortConfig.key as keyof Question];
        const cmp =
          typeof aVal === 'number' && typeof bVal === 'number'
            ? aVal - bVal
            : String(aVal ?? '').localeCompare(String(bVal ?? ''));
        return sortConfig.direction === 'asc' ? cmp : -cmp;
      });
    }

    return qs;
  }, [
    data,
    activeCategory,
    search,
    confidenceFilter,
    compliantFilter,
    deliveryFilter,
    statusFilter,
    sortConfig,
  ]);

  // === Exports ===
  const handleExportCSV = useCallback(() => {
    if (!data) return;
    const headers = [
      '#',
      'Reference',
      'Category',
      'Topic',
      'BSB Requirement',
      'Response (Bullet)',
      'Response (Paragraph)',
      'Confidence',
      'Compliant',
      'Status',
      'Committee Score',
    ];
    const rows = filteredQuestions.map((q) => [
      q.number,
      q.ref,
      q.category,
      q.topic,
      q.requirement,
      q.bullet,
      q.paragraph,
      q.confidence,
      q.compliant,
      q.status,
      q.committee_score,
    ]);
    const csv = [
      headers.join(','),
      ...rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')),
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'rfp_export.csv';
    a.click();
    URL.revokeObjectURL(url);
    addToast('success', 'Exported as CSV');
  }, [data, filteredQuestions, addToast]);

  const handleExportJSON = useCallback(() => {
    if (!data) return;
    const blob = new Blob([JSON.stringify(filteredQuestions, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'rfp_export.json';
    a.click();
    URL.revokeObjectURL(url);
    addToast('success', 'Exported as JSON');
  }, [data, filteredQuestions, addToast]);

  // === Helpers ===
  const resetFilters = useCallback(() => {
    setSearch('');
    setConfidenceFilter('All Confidence');
    setCompliantFilter('All Compliant');
    setDeliveryFilter('All Delivery');
    setStatusFilter('All Status');
    setActiveCategory('All');
  }, []);

  const categoryStats = useMemo(() => {
    if (!data) return {};
    const stats: Record<string, { total: number; approved: number }> = {};
    stats['All'] = {
      total: data.questions.length,
      approved: data.questions.filter((q) => q.status === 'approved').length,
    };
    for (const q of data.questions) {
      if (!stats[q.category]) stats[q.category] = { total: 0, approved: 0 };
      stats[q.category].total++;
      if (q.status === 'approved') stats[q.category].approved++;
    }
    return stats;
  }, [data]);

  const statusCounts = useMemo(() => {
    if (!data) return { draft: 0, reviewed: 0, approved: 0, flagged: 0 };
    const counts = { draft: 0, reviewed: 0, approved: 0, flagged: 0 };
    for (const q of data.questions) counts[q.status]++;
    return counts;
  }, [data]);

  const unresolvedFeedback = feedbackItems.filter((f) => !f.resolved).length;

  // === Knowledge Base ===
  const updateKnowledgeBase = useCallback((kb: KnowledgeBase) => {
    setKnowledgeBase({ ...kb, lastUpdated: Date.now() });
    setHasUnsaved(true);
  }, []);

  const updateDealContext = useCallback((ctx: DealContext) => {
    setDealContext({ ...ctx, lastUpdated: Date.now() });
    setHasUnsaved(true);
  }, []);

  // === Validation Rules ===
  const updateValidationRules = useCallback((rules: ValidationRule[]) => {
    setValidationRules(rules);
    setHasUnsaved(true);
  }, []);

  const setGlobalRulesWithUnsaved = useCallback((r: string[]) => {
    setGlobalRules(r);
    setHasUnsaved(true);
  }, []);

  // === CPO feature updaters ===
  // === Cloud Sync ===
  const handlePushToCloud = useCallback(async () => {
    if (!data) return;
    addToast('info', 'Pushing to cloud...');
    const result = await pushToCloud({
      questions: data.questions,
      globalRules,
      validationRules,
      feedbackItems,
      knowledgeBase,
      pricingModel,
      winThemes,
      milestones,
      slaCommitments,
      versions,
    });
    addToast(result.success ? 'success' : 'error', result.message);
  }, [
    data,
    globalRules,
    validationRules,
    feedbackItems,
    knowledgeBase,
    pricingModel,
    winThemes,
    milestones,
    slaCommitments,
    versions,
    addToast,
  ]);

  const handlePullFromCloud = useCallback(async () => {
    addToast('info', 'Pulling from cloud...');
    const result = await pullFromCloud();
    if (result.success && result.data) {
      // Merge into local state
      if (result.data.questions.length > 0) {
        setData((prev) => (prev ? { ...prev, questions: result.data!.questions } : prev));
      }
      if (result.data.globalRules.length > 0) setGlobalRules(result.data.globalRules);
      if (result.data.validationRules.length > 0) setValidationRules(result.data.validationRules);
      if (result.data.feedbackItems.length > 0) setFeedbackItems(result.data.feedbackItems);
      if (result.data.knowledgeBase.companyFacts) setKnowledgeBase(result.data.knowledgeBase);
      if (result.data.pricingModel.lineItems.length > 0) setPricingModel(result.data.pricingModel);
      if (result.data.winThemes.length > 0) setWinThemes(result.data.winThemes);
      if (result.data.milestones.length > 0) setMilestones(result.data.milestones);
      if (result.data.slaCommitments.length > 0) setSLACommitments(result.data.slaCommitments);
      setHasUnsaved(true);
      addToast('success', 'Pulled from cloud — save to persist locally');
    } else {
      addToast('error', result.message);
    }
  }, [addToast]);

  // === Load Template ===
  const loadTemplateData = useCallback(
    (templateData: RFPData) => {
      setData(templateData);
      setHasUnsaved(true);
      addToast('success', 'Template loaded — save to persist');
    },
    [addToast],
  );

  const updatePricing = useCallback((p: PricingModel) => {
    setPricingModel(p);
    setHasUnsaved(true);
  }, []);
  const updateWinThemes = useCallback((t: WinTheme[]) => {
    setWinThemes(t);
    setHasUnsaved(true);
  }, []);
  const updateMilestones = useCallback((m: TimelineMilestone[]) => {
    setMilestones(m);
    setHasUnsaved(true);
  }, []);
  const updateSLAs = useCallback((s: SLACommitment[]) => {
    setSLACommitments(s);
    setHasUnsaved(true);
  }, []);

  const retryLoad = useCallback(() => {
    setLoadError(false);
    setLoading(true);
    setRetryCount((c) => c + 1);
  }, []);

  return {
    // Core
    data,
    loading,
    loadError,
    retryLoad,
    activeTab,
    setActiveTab,
    activeCategory,
    setActiveCategory,
    // Filters
    search,
    setSearch,
    confidenceFilter,
    setConfidenceFilter,
    compliantFilter,
    setCompliantFilter,
    deliveryFilter,
    setDeliveryFilter,
    statusFilter,
    setStatusFilter,
    showRules,
    setShowRules,
    showFilters,
    setShowFilters,
    // Selection
    selectedQuestion,
    setSelectedQuestion,
    selectedRows,
    toggleRow,
    selectAllFiltered,
    // Sort
    sortConfig,
    setSortConfig,
    // Data
    filteredQuestions,
    categoryStats,
    statusCounts,
    unresolvedFeedback,
    // Persistence
    cellHistory,
    hasUnsaved,
    globalRules,
    setGlobalRules: setGlobalRulesWithUnsaved,
    validationRules,
    updateValidationRules,
    feedbackItems,
    versions,
    deleteVersion,
    knowledgeBase,
    updateKnowledgeBase,
    dealContext,
    updateDealContext,
    // Actions
    handleSave,
    saveToLocal,
    saveVersion,
    handleCellEdit,
    updateQuestion,
    handleAiRewrite,
    cancelRewrite,
    handleAddFeedback,
    handleResolveFeedback,
    handleExportCSV,
    handleExportJSON,
    resetFilters,
    addCellHistory,
    cycleStatus,
    bulkSetStatus,
    // Diff
    pendingDiffs,
    acceptDiff,
    rejectDiff,
    acceptEditedDiff,
    // Modals
    showConsistency,
    setShowConsistency,
    showSummary,
    setShowSummary,
    showChecklist,
    setShowChecklist,
    showNarrativeAudit,
    setShowNarrativeAudit,
    showWinThemes,
    setShowWinThemes,
    showVersionCompare,
    setShowVersionCompare,
    showTemplates,
    setShowTemplates,
    // Cloud sync
    cloudSyncStatus,
    handlePushToCloud,
    handlePullFromCloud,
    loadTemplateData,
    // CPO features
    pricingModel,
    updatePricing,
    winThemes,
    updateWinThemes,
    milestones,
    updateMilestones,
    slaCommitments,
    updateSLAs,
    // Toast
    toasts,
    addToast,
    removeToast,
  };
}
