'use client';

import { useState, useMemo, useCallback, useRef, useEffect, lazy, Suspense } from 'react';
import {
  Save,
  Download,
  FileJson,
  CloudUpload,
  CloudDownload,
  Sparkles,
  BookOpen,
  LayoutGrid,
  BarChart3,
  SlidersHorizontal,
  RotateCcw,
  ChevronDown,
  Circle,
  History,
  Search,
  ClipboardCheck,
  FileText,
  Scan,
  DollarSign,
  Calendar,
  Shield,
  Target,
  BookText,
  ClipboardList,
  GitCompareArrows,
  FileStack,
  Bot,
  Keyboard,
  Settings,
} from 'lucide-react';
import { useRFPState } from '@/hooks/useRFPState';
import GridView from '@/components/GridView';
import type { TableDensity } from '@/components/GridView';
import ProgressBar from '@/components/ProgressBar';
import BulkActions from '@/components/BulkActions';
import { useKeyboardShortcuts } from '@/components/KeyboardShortcuts';

const ContextView = lazy(() => import('@/components/ContextView'));
const RulesPanel = lazy(() => import('@/components/RulesPanel'));
const DetailPanel = lazy(() => import('@/components/DetailPanel'));
const KnowledgeBaseView = lazy(() => import('@/components/KnowledgeBase'));
const ComplianceView = lazy(() => import('@/components/ComplianceView'));
const SubmissionView = lazy(() => import('@/components/SubmissionView'));
const PricingView = lazy(() => import('@/components/PricingView'));
const TimelineView = lazy(() => import('@/components/TimelineView'));
const SLAView = lazy(() => import('@/components/SLAView'));
const WinThemesPanel = lazy(() => import('@/components/WinThemes'));
const ConsistencyResults = lazy(() => import('@/components/ConsistencyResults'));
const ExecutiveSummary = lazy(() => import('@/components/ExecutiveSummary'));
const NarrativeAudit = lazy(() => import('@/components/NarrativeAudit'));
const SubmissionChecklist = lazy(() => import('@/components/SubmissionChecklist'));
const KeyboardShortcutsPanel = lazy(() =>
  import('@/components/KeyboardShortcuts').then((m) => ({ default: m.default })),
);
const Onboarding = lazy(() => import('@/components/Onboarding'));
const VersionCompare = lazy(() => import('@/components/VersionCompare'));
const TemplateManager = lazy(() => import('@/components/TemplateManager'));
const HumanizeView = lazy(() => import('@/components/HumanizeView'));
const SettingsPanel = lazy(() => import('@/components/SettingsPanel'));
import { ToastContainer } from '@/components/Toast';
import type { ConsistencyIssue, ViewTab } from '@/types';

export default function Home() {
  const state = useRFPState();
  const [consistencyIssues, setConsistencyIssues] = useState<ConsistencyIssue[]>([]);
  const [consistencyLoading, setConsistencyLoading] = useState(false);
  const [density, setDensity] = useState<TableDensity>('comfortable');
  const [showSettings, setShowSettings] = useState(false);
  const lastSavedRef = useRef<number | null>(null);
  const [, setLastSavedTick] = useState(0);
  const lastSaved = lastSavedRef.current;
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [showOnboarding, setShowOnboarding] = useState(() => {
    if (typeof window !== 'undefined') return !localStorage.getItem('rfp-onboarded');
    return false;
  });
  const closeOnboarding = useCallback(() => {
    setShowOnboarding(false);
    localStorage.setItem('rfp-onboarded', 'true');
  }, []);

  // On first load, check if an emergency snapshot is newer than the main save
  useEffect(() => {
    try {
      const emergency = localStorage.getItem('rfp-emergency');
      const main = localStorage.getItem('rfp-edits');
      if (!emergency) return;
      const { data: emergencyData, timestamp } = JSON.parse(emergency);
      const mainTimestamp = main ? (JSON.parse(main) as { _savedAt?: number })._savedAt ?? 0 : 0;
      if (timestamp > mainTimestamp && emergencyData?.questions?.length) {
        const minutes = Math.round((Date.now() - timestamp) / 60000);
        const label = minutes < 2 ? 'just now' : `${minutes}m ago`;
        if (
          window.confirm(
            `An emergency save from ${label} was found with unsaved changes. Restore it?`,
          )
        ) {
          state.loadTemplateData(emergencyData);
          state.addToast('success', 'Emergency snapshot restored — press ⌘S to save');
        }
        localStorage.removeItem('rfp-emergency');
      }
    } catch {
      /* ignore malformed emergency data */
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // intentionally run only on mount

  const { showShortcuts, setShowShortcuts } = useKeyboardShortcuts({
    onSwitchTab: (tab) => state.setActiveTab(tab as ViewTab),
    onNextFlagged: useCallback(() => {
      if (!state.data) return;
      const flagged = state.data.questions.filter((q) => q.status === 'flagged');
      if (!flagged.length) { state.addToast('info', 'No flagged questions'); return; }
      const currentIdx = flagged.findIndex((q) => q.ref === state.selectedQuestion?.ref);
      const next = flagged[(currentIdx + 1) % flagged.length];
      state.setSelectedQuestion(next);
      state.setActiveTab('grid');
    }, [state]),
    onNextRed: useCallback(() => {
      if (!state.data) return;
      const red = state.data.questions.filter((q) => q.confidence === 'RED');
      if (!red.length) { state.addToast('info', 'No RED confidence questions'); return; }
      const currentIdx = red.findIndex((q) => q.ref === state.selectedQuestion?.ref);
      const next = red[(currentIdx + 1) % red.length];
      state.setSelectedQuestion(next);
      state.setActiveTab('grid');
    }, [state]),
  });

  const [prevHasUnsaved, setPrevHasUnsaved] = useState(state.hasUnsaved);
  if (state.hasUnsaved !== prevHasUnsaved) {
    setPrevHasUnsaved(state.hasUnsaved);
    if (!state.hasUnsaved && state.data) {
      lastSavedRef.current = Date.now();
      setLastSavedTick((t) => t + 1);
    }
  }

  const pendingDiffKeys = useMemo(
    () => new Set(Object.keys(state.pendingDiffs)),
    [state.pendingDiffs],
  );

  // Stable callback — avoids re-rendering GridView rows on every page render
  const { setShowRules, setShowWinThemes, setSelectedQuestion } = state;
  const handleSelectQuestion = useCallback((q: Parameters<typeof setSelectedQuestion>[0]) => {
    setShowRules(false);
    setShowWinThemes(false);
    setSelectedQuestion(q);
  }, [setShowRules, setShowWinThemes, setSelectedQuestion]);

  const handleConsistencyCheck = useCallback(async () => {
    if (!state.data) return;
    state.setShowConsistency(true);
    setConsistencyLoading(true);
    try {
      const qs =
        state.activeCategory !== 'All'
          ? state.data.questions.filter((q) => q.category === state.activeCategory)
          : state.data.questions;
      const res = await fetch('/api/consistency', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questions: qs, knowledgeBase: state.knowledgeBase }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        state.addToast('error', err.error || 'Consistency check failed — try again');
        setConsistencyIssues([]);
      } else {
        setConsistencyIssues((await res.json()).issues || []);
      }
    } catch {
      state.addToast('error', 'Consistency check failed — check your connection');
      setConsistencyIssues([]);
    }
    setConsistencyLoading(false);
  }, [state]);

  const handleGenerateSummary = useCallback(async () => {
    if (!state.data) throw new Error('No data');
    const res = await fetch('/api/summary', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        questions: state.data.questions,
        stats: state.data.stats,
        knowledgeBase: state.knowledgeBase,
      }),
    });
    if (!res.ok) throw new Error('Failed');
    return res.json();
  }, [state.data, state.knowledgeBase]);

  const handleNarrativeAudit = useCallback(async () => {
    if (!state.data) throw new Error('No data');
    const res = await fetch('/api/narrative-audit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        questions: state.data.questions,
        winThemes: state.winThemes,
        knowledgeBase: state.knowledgeBase,
      }),
    });
    if (!res.ok) throw new Error('Failed');
    return res.json();
  }, [state.data, state.winThemes, state.knowledgeBase]);

  const handleUpdateCompliant = useCallback(
    (ref: string, value: string) => {
      state.handleCellEdit(ref, 'compliant', value);
    },
    [state],
  );

  const handleDashboardNavigate = useCallback(
    (tab: string, filter?: { confidence?: string; category?: string }) => {
      state.setActiveTab(tab as ViewTab);
      if (filter?.confidence) state.setConfidenceFilter(filter.confidence);
      if (filter?.category) state.setActiveCategory(filter.category);
    },
    [state],
  );

  const formatTimeSince = useCallback((ts: number | null) => {
    if (!ts) return '';
    const now = performance.timeOrigin + performance.now();
    const diff = Math.floor((now - ts) / 1000);
    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    return `${Math.floor(diff / 3600)}h ago`;
  }, []);

  const handleClearFilters = useCallback(() => {
    state.resetFilters();
  }, [state]);

  // Warn before closing/refreshing with unsaved changes; write emergency snapshot first
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (state.hasUnsaved && state.data) {
        // Synchronously persist an emergency snapshot before the dialog fires
        try {
          localStorage.setItem(
            'rfp-emergency',
            JSON.stringify({ data: state.data, timestamp: Date.now() }),
          );
        } catch {
          /* quota — at least the IDB mirror has a recent copy */
        }
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [state.hasUnsaved, state.data]);

  // Cmd+K / Ctrl+K: focus the search input
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  if (state.loading) {
    return (
      <div className="flex flex-col h-screen bg-white">
        <div className="border-b px-6 py-4">
          <div className="skeleton h-6 w-48 mb-2" />
          <div className="skeleton h-4 w-72" />
        </div>
        <div className="border-b px-6 py-3 flex gap-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="skeleton h-7 w-24 rounded" />
          ))}
        </div>
        <div className="flex-1 p-6 space-y-3">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="skeleton h-16 w-full rounded" />
          ))}
        </div>
      </div>
    );
  }

  if (state.loadError || !state.data)
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4">
        <p className="text-gray-700 font-medium">Failed to load RFP data.</p>
        <p className="text-gray-400 text-sm">Check your network connection and try again.</p>
        <button
          onClick={state.retryLoad}
          className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    );

  // Nav organized into groups
  const NAV_GROUPS = [
    {
      label: 'RFP Work',
      tabs: [
        { key: 'grid' as const, icon: LayoutGrid, label: 'Response Grid' },
        { key: 'context' as const, icon: BarChart3, label: 'Dashboard' },
        { key: 'humanize' as const, icon: Bot, label: 'AI QA' },
      ],
    },
    {
      label: 'Strategy',
      tabs: [
        { key: 'knowledgebase' as const, icon: BookOpen, label: 'Knowledge Base' },
        { key: 'pricing' as const, icon: DollarSign, label: 'Pricing' },
        { key: 'timeline' as const, icon: Calendar, label: 'Timeline' },
        { key: 'sla' as const, icon: Shield, label: 'SLAs' },
      ],
    },
    {
      label: 'Review & Submit',
      tabs: [
        { key: 'compliance' as const, icon: ClipboardCheck, label: 'Compliance' },
        { key: 'submission' as const, icon: FileText, label: 'Export' },
      ],
    },
  ];

  return (
    <div className="flex flex-col h-screen bg-white text-gray-900">
      <ToastContainer toasts={state.toasts} onRemove={state.removeToast} />

      {/* Header */}
      <header className="border-b border-gray-200 px-4 py-2 flex items-center justify-between flex-shrink-0 bg-white">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center">
            <BookOpen size={14} className="text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold text-gray-900">BSB Credit Card RFP</h1>
              {state.hasUnsaved ? (
                <span className="text-[9px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-medium">
                  Unsaved
                </span>
              ) : (
                lastSaved && (
                  <span className="text-[9px] text-gray-400 font-medium">
                    Saved {formatTimeSince(lastSaved)}
                  </span>
                )
              )}
            </div>
            <p className="text-[10px] text-gray-400">
              {state.data.stats.total} Qs · {state.data.categories.length} Categories
            </p>
          </div>
        </div>

        {/* Grouped Nav Tabs */}
        <div className="flex items-center gap-1">
          {NAV_GROUPS.map((group, gi) => (
            <div key={group.label} className="flex items-center">
              {gi > 0 && <div className="w-px h-5 bg-gray-200 mx-1.5" />}
              <span className="text-[8px] text-gray-400 uppercase tracking-wider font-semibold mr-1 hidden lg:inline">
                {group.label}
              </span>
              <div className="flex items-center bg-gray-100 rounded-lg p-0.5">
                {group.tabs.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => {
                      state.setActiveTab(tab.key);
                      state.setSelectedQuestion(null);
                    }}
                    className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-all ${state.activeTab === tab.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    <tab.icon size={11} /> {tab.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2">
          <ProgressBar {...state.statusCounts} />
          <div className="flex items-center gap-1.5 text-[10px] font-medium">
            <span className="flex items-center gap-0.5">
              <Circle size={6} fill="#10b981" className="text-emerald-500" />
              {state.data.stats.green}
            </span>
            <span className="flex items-center gap-0.5">
              <Circle size={6} fill="#f59e0b" className="text-amber-500" />
              {state.data.stats.yellow}
            </span>
            <span className="flex items-center gap-0.5">
              <Circle size={6} fill="#ef4444" className="text-red-500" />
              {state.data.stats.red}
            </span>
          </div>
          <div className="w-px h-5 bg-gray-200" />
          {[
            {
              icon: Target, label: 'Win Themes', active: state.showWinThemes,
              onClick: () => { state.setSelectedQuestion(null); state.setShowWinThemes(!state.showWinThemes); },
              activeClass: 'text-violet-600 bg-violet-50',
            },
            {
              icon: BookOpen, label: 'Rules', active: state.showRules,
              onClick: () => { state.setSelectedQuestion(null); state.setShowRules(!state.showRules); },
              activeClass: 'text-blue-600 bg-blue-50',
            },
            {
              icon: ClipboardList, label: 'Checklist', active: false,
              onClick: () => state.setShowChecklist(true),
              activeClass: '',
            },
            {
              icon: FileStack, label: 'Templates', active: false,
              onClick: () => state.setShowTemplates(true),
              activeClass: '',
            },
            {
              icon: Keyboard, label: 'Keys', active: false,
              onClick: () => setShowShortcuts(true),
              activeClass: '',
            },
            {
              icon: Settings, label: 'Settings', active: showSettings,
              onClick: () => { state.setSelectedQuestion(null); state.setShowRules(false); state.setShowWinThemes(false); setShowSettings(true); },
              activeClass: 'text-gray-700 bg-gray-100',
            },
          ].map(({ icon: Icon, label, active, onClick, activeClass }) => (
            <button
              key={label}
              onClick={onClick}
              title={label}
              aria-label={label}
              className={`flex flex-col items-center gap-0.5 px-1.5 py-1 rounded-md text-center ${active ? activeClass : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}
            >
              <Icon size={14} />
              <span className="text-[8px] leading-none font-medium">{label}</span>
            </button>
          ))}
        </div>
      </header>

      {/* Category Tabs */}
      {(state.activeTab === 'grid' || state.activeTab === 'compliance') && (
        <div className="border-b border-gray-200 px-6 py-1.5 flex gap-1 overflow-x-auto flex-shrink-0 bg-gray-50/50 scrollbar-hide">
          {['All', ...state.data.categories].map((cat) => {
            const isActive = state.activeCategory === cat;
            const catStat = state.categoryStats[cat];
            return (
              <button
                key={cat}
                onClick={() => state.setActiveCategory(cat)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap ${isActive ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-500 hover:bg-gray-100'}`}
              >
                {cat}{' '}
                <span className={isActive ? 'text-blue-200' : 'text-gray-400'}>
                  {catStat?.total || 0}
                </span>
                {catStat && catStat.total > 0 && (
                  <span
                    className={`ml-0.5 text-[8px] ${isActive ? 'text-blue-200' : 'text-gray-300'}`}
                  >
                    ({catStat.approved}/{catStat.total})
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Filter & Action Bar (Grid view) */}
      {state.activeTab === 'grid' && (
        <div className="border-b border-gray-200 px-6 py-2 flex-shrink-0 bg-white space-y-1.5">
          <div className="flex items-center gap-2">
            <div className="relative flex-shrink-0">
              <Search
                size={13}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search… (⌘K)"
                value={state.search}
                onChange={(e) => state.setSearch(e.target.value)}
                className="border border-gray-200 rounded-lg pl-8 pr-3 py-1.5 text-xs w-56 focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-gray-50 placeholder:text-gray-400"
              />
            </div>
            <button
              onClick={() => state.setShowFilters(!state.showFilters)}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border ${state.showFilters ? 'border-blue-300 text-blue-600 bg-blue-50' : 'border-gray-200 text-gray-500'}`}
            >
              <SlidersHorizontal size={12} /> Filters{' '}
              <ChevronDown size={10} className={state.showFilters ? 'rotate-180' : ''} />
            </button>
            <span className="text-[10px] text-gray-500 bg-gray-100 px-2 py-0.5 rounded font-medium">
              {state.filteredQuestions.length}/{state.data.stats.total}
            </span>

            {state.selectedRows.size > 0 && (
              <BulkActions
                selectedCount={state.selectedRows.size}
                onChangeStatus={state.bulkSetStatus}
                onClearSelection={() => state.selectAllFiltered([])}
              />
            )}

            <div className="flex-1" />

            {/* Actions grouped: Save | Export | Cloud | AI */}
            <div className="flex items-center gap-1">
              <button
                onClick={state.handleSave}
                className="flex items-center gap-1 bg-blue-600 text-white px-2.5 py-1.5 rounded-lg text-xs font-medium hover:bg-blue-700 shadow-sm"
              >
                <Save size={12} /> Save
              </button>

              <div className="w-px h-6 bg-gray-300 mx-1" />
              <button
                onClick={state.handleExportCSV}
                className="flex items-center gap-1 border border-gray-200 text-gray-600 px-2 py-1.5 rounded-lg text-xs font-medium hover:bg-gray-50"
              >
                <Download size={11} /> CSV
              </button>
              <button
                onClick={state.handleExportJSON}
                className="flex items-center gap-1 border border-gray-200 text-gray-600 px-2 py-1.5 rounded-lg text-xs font-medium hover:bg-gray-50"
              >
                <FileJson size={11} /> JSON
              </button>

              <div className="w-px h-6 bg-gray-300 mx-1" />
              <button
                onClick={state.handlePushToCloud}
                className="flex items-center gap-1 border border-gray-200 text-gray-600 px-2 py-1.5 rounded-lg text-xs font-medium hover:bg-gray-50"
                title="Push to Supabase"
              >
                <CloudUpload size={11} /> Push
              </button>
              <button
                onClick={state.handlePullFromCloud}
                className="flex items-center gap-1 border border-gray-200 text-gray-600 px-2 py-1.5 rounded-lg text-xs font-medium hover:bg-gray-50"
                title="Pull from Supabase"
              >
                <CloudDownload size={11} /> Pull
              </button>
              <button
                onClick={() => state.saveVersion()}
                className="flex items-center gap-1 border border-gray-200 text-gray-600 px-2 py-1.5 rounded-lg text-xs font-medium hover:bg-gray-50"
              >
                <History size={11} /> v{state.versions.length + 1}
              </button>
              {state.versions.length > 0 && (
                <button
                  onClick={() => state.setShowVersionCompare(true)}
                  className="flex items-center border border-gray-200 text-gray-600 p-1.5 rounded-lg text-xs hover:bg-gray-50"
                  title="Compare versions"
                >
                  <GitCompareArrows size={11} />
                </button>
              )}

              <div className="w-px h-6 bg-gray-300 mx-1" />
              <button
                onClick={handleConsistencyCheck}
                className="flex items-center gap-1 border border-gray-200 text-gray-600 px-2 py-1.5 rounded-lg text-xs font-medium hover:bg-gray-50"
                title="Consistency Check"
              >
                <Scan size={11} /> Check
              </button>
              <button
                onClick={() => state.setShowNarrativeAudit(true)}
                className="flex items-center gap-1 border border-gray-200 text-gray-600 px-2 py-1.5 rounded-lg text-xs font-medium hover:bg-gray-50"
                title="Narrative Audit"
              >
                <BookText size={11} /> Audit
              </button>
              <button
                onClick={() => state.setShowSummary(true)}
                className="flex items-center gap-1 border border-gray-200 text-gray-600 px-2 py-1.5 rounded-lg text-xs font-medium hover:bg-gray-50"
              >
                <FileText size={11} /> Summary
              </button>
              <button className="flex items-center gap-1 bg-gradient-to-r from-violet-600 to-purple-600 text-white px-2.5 py-1.5 rounded-lg text-xs font-medium hover:from-violet-700 hover:to-purple-700 shadow-sm">
                <Sparkles size={11} /> AI Rewrite{' '}
                <span className="bg-white/20 px-1 rounded text-[9px]">
                  {state.data.stats.yellow + state.data.stats.red}
                </span>
              </button>
            </div>
          </div>

          {state.showFilters && (
            <div className="flex items-center gap-1.5 pt-0.5">
              <span className="text-[9px] text-gray-400 uppercase tracking-wider font-semibold mr-1">
                Filter
              </span>
              {[
                {
                  value: state.confidenceFilter,
                  onChange: state.setConfidenceFilter,
                  options: ['All Confidence', 'GREEN', 'YELLOW', 'RED'],
                },
                {
                  value: state.compliantFilter,
                  onChange: state.setCompliantFilter,
                  options: ['All Compliant', 'Y', 'N', 'Partial'],
                },
                {
                  value: state.deliveryFilter,
                  onChange: state.setDeliveryFilter,
                  options: ['All Delivery', 'OOB', 'Config', 'Custom'],
                },
              ].map((f, i) => (
                <div key={i} className="relative">
                  <select
                    value={f.value}
                    onChange={(e) => f.onChange(e.target.value)}
                    className="border border-gray-200 rounded-lg pl-2.5 pr-7 py-1 text-xs text-gray-600 bg-white appearance-none cursor-pointer hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                  >
                    {f.options.map((o) => (
                      <option key={o}>{o}</option>
                    ))}
                  </select>
                  <ChevronDown size={11} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
              ))}
              <div className="relative">
                <select
                  value={state.statusFilter}
                  onChange={(e) => state.setStatusFilter(e.target.value)}
                  className="border border-gray-200 rounded-lg pl-2.5 pr-7 py-1 text-xs text-gray-600 bg-white appearance-none cursor-pointer hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                >
                  <option>All Status</option>
                  <option value="draft">Draft</option>
                  <option value="reviewed">Reviewed</option>
                  <option value="approved">Approved</option>
                  <option value="flagged">Flagged</option>
                </select>
                <ChevronDown size={11} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
              <button
                data-reset-filters
                onClick={state.resetFilters}
                className="flex items-center gap-0.5 text-xs text-gray-400 hover:text-blue-500 font-medium ml-1"
              >
                <RotateCcw size={10} /> Reset
              </button>
            </div>
          )}
        </div>
      )}

      {/* Main Content */}
      <Suspense
        fallback={
          <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
            Loading...
          </div>
        }
      >
        <div className="flex-1 overflow-hidden relative flex flex-col">
          <div className="px-6 py-1 text-xs text-gray-400 border-b border-gray-100 bg-white flex items-center gap-1.5 flex-shrink-0">
            <span className="font-medium text-gray-500">
              {{ grid: 'Response Grid', context: 'Dashboard', humanize: 'AI QA', knowledgebase: 'Knowledge Base', pricing: 'Pricing', timeline: 'Timeline', sla: 'SLAs', compliance: 'Compliance', submission: 'Export' }[state.activeTab] || state.activeTab}
            </span>
            {state.activeTab === 'grid' && state.activeCategory !== 'All' && (
              <>
                <span className="text-gray-300">/</span>
                <span>{state.activeCategory}</span>
              </>
            )}
            <span className="ml-auto text-gray-300">
              {state.activeTab === 'grid' && `${state.filteredQuestions.length} of ${state.data.stats.total}`}
            </span>
          </div>
          <div className="flex-1 overflow-hidden relative">
          {state.activeTab === 'grid' && (
            <GridView
              questions={state.filteredQuestions}
              totalCount={state.data?.questions.length ?? 0}
              onClearFilters={handleClearFilters}
              getConfidenceColor={state.getConfidenceColor}
              onSelectQuestion={handleSelectQuestion}
              onCellEdit={state.handleCellEdit}
              selectedRows={state.selectedRows}
              onToggleRow={state.toggleRow}
              onSelectAll={state.selectAllFiltered}
              sortConfig={state.sortConfig}
              onSort={state.setSortConfig}
              onCycleStatus={state.cycleStatus}
              pendingDiffKeys={pendingDiffKeys}
              density={density}
              onChangeDensity={setDensity}
              feedbackItems={state.feedbackItems}
              searchQuery={state.search}
            />
          )}
          {state.activeTab === 'context' && (
            <ContextView data={state.data} onNavigate={handleDashboardNavigate} />
          )}
          {state.activeTab === 'knowledgebase' && (
            <KnowledgeBaseView
              kb={state.knowledgeBase}
              onUpdate={state.updateKnowledgeBase}
              onSave={state.saveToLocal}
            />
          )}
          {state.activeTab === 'pricing' && (
            <PricingView pricing={state.pricingModel} onUpdate={state.updatePricing} />
          )}
          {state.activeTab === 'timeline' && (
            <TimelineView milestones={state.milestones} onUpdate={state.updateMilestones} />
          )}
          {state.activeTab === 'sla' && (
            <SLAView slas={state.slaCommitments} onUpdate={state.updateSLAs} />
          )}
          {state.activeTab === 'compliance' && (
            <ComplianceView
              questions={state.filteredQuestions}
              categories={state.data.categories}
              onUpdateCompliant={handleUpdateCompliant}
            />
          )}
          {state.activeTab === 'humanize' && (
            <HumanizeView
              questions={state.data.questions}
              onUpdateQuestion={state.updateQuestion}
              addToast={state.addToast}
            />
          )}
          {state.activeTab === 'submission' && (
            <SubmissionView
              questions={state.data.questions}
              categories={state.data.categories}
              data={state.data}
              knowledgeBase={state.knowledgeBase}
              globalRules={state.globalRules}
              validationRules={state.validationRules}
            />
          )}

          {state.showRules && (
            <RulesPanel
              onClose={() => state.setShowRules(false)}
              rules={state.globalRules}
              onUpdateRules={state.setGlobalRules}
              validationRules={state.validationRules}
              onUpdateValidationRules={state.updateValidationRules}
            />
          )}
          {showSettings && (
            <SettingsPanel
              onClose={() => setShowSettings(false)}
              kb={state.knowledgeBase}
              onUpdateKB={state.updateKnowledgeBase}
              onSaveKB={state.saveToLocal}
              globalRules={state.globalRules}
              onUpdateRules={state.setGlobalRules}
              validationRules={state.validationRules}
              onUpdateValidationRules={state.updateValidationRules}
              pricing={state.pricingModel}
              onUpdatePricing={state.updatePricing}
              milestones={state.milestones}
              onUpdateMilestones={state.updateMilestones}
              slas={state.slaCommitments}
              onUpdateSLAs={state.updateSLAs}
              versions={state.versions}
              onSaveVersion={state.saveVersion}
              onDeleteVersion={state.deleteVersion}
              onRestoreVersion={(v) => {
                state.loadTemplateData(v.data);
                state.addToast('success', `Restored "${v.label}" — press ⌘S to save`);
                setShowSettings(false);
              }}
              currentQuestionCount={state.data?.questions.length ?? 0}
            />
          )}
          {state.showWinThemes && (
            <WinThemesPanel
              themes={state.winThemes}
              onUpdate={state.updateWinThemes}
              questions={state.data.questions}
              onClose={() => state.setShowWinThemes(false)}
            />
          )}
          {state.selectedQuestion && (
            <DetailPanel
              question={state.selectedQuestion}
              onClose={() => state.setSelectedQuestion(null)}
              onSave={(updated) => {
                state.updateQuestion(updated);
                state.addCellHistory(updated.ref, 'detail-save', '', 'human');
              }}
              onAiRewrite={state.handleAiRewrite}
              cellHistory={state.cellHistory}
              feedbackItems={state.feedbackItems}
              onAddFeedback={state.handleAddFeedback}
              onResolveFeedback={state.handleResolveFeedback}
              pendingDiffs={state.pendingDiffs}
              onAcceptDiff={state.acceptDiff}
              onRejectDiff={state.rejectDiff}
              onAcceptEditedDiff={state.acceptEditedDiff}
            />
          )}
        </div>
        </div>

        {/* Modals */}
        {state.showConsistency && (
          <ConsistencyResults
            issues={consistencyIssues}
            loading={consistencyLoading}
            onClose={() => state.setShowConsistency(false)}
            onNavigate={(ref) => {
              const q = state.data?.questions.find((q) => q.ref === ref);
              if (q) {
                state.setSelectedQuestion(q);
                state.setShowConsistency(false);
              }
            }}
          />
        )}
        {state.showSummary && (
          <ExecutiveSummary
            onClose={() => state.setShowSummary(false)}
            onGenerate={handleGenerateSummary}
          />
        )}
        {state.showNarrativeAudit && (
          <NarrativeAudit
            onClose={() => state.setShowNarrativeAudit(false)}
            onRun={handleNarrativeAudit}
          />
        )}
        {state.showChecklist && (
          <SubmissionChecklist
            data={state.data}
            pricing={state.pricingModel}
            slas={state.slaCommitments}
            milestones={state.milestones}
            winThemes={state.winThemes}
            knowledgeBase={state.knowledgeBase}
            statusCounts={state.statusCounts}
            onClose={() => state.setShowChecklist(false)}
          />
        )}
        {state.showVersionCompare && state.versions.length > 0 && (
          <VersionCompare
            versions={state.versions}
            currentQuestions={state.data?.questions || []}
            onClose={() => state.setShowVersionCompare(false)}
          />
        )}
        {state.showTemplates && state.data && (
          <TemplateManager
            currentData={state.data}
            onLoadTemplate={state.loadTemplateData}
            onClose={() => state.setShowTemplates(false)}
            addToast={state.addToast}
          />
        )}
        {showShortcuts && <KeyboardShortcutsPanel onClose={() => setShowShortcuts(false)} />}
        {showOnboarding && <Onboarding onClose={closeOnboarding} />}
      </Suspense>

      {/* Footer */}
      <footer className="border-t border-gray-200 px-6 py-2 text-xs text-gray-400 flex items-center justify-between flex-shrink-0 bg-gray-50/50">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1">
            <kbd className="px-1 py-0.5 bg-gray-100 rounded text-[10px] font-mono border border-gray-200">⌘S</kbd> save
          </span>
          <span>Click ref to open detail</span>
        </div>
        <div className="flex items-center gap-3">
          {state.hasUnsaved && (
            <span className="flex items-center gap-1 text-amber-600 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> Unsaved
            </span>
          )}
          {state.unresolvedFeedback > 0 && (
            <span className="text-orange-500">{state.unresolvedFeedback} open feedback</span>
          )}
          <span className="text-gray-300">v{state.versions.length}</span>
        </div>
      </footer>
    </div>
  );
}
