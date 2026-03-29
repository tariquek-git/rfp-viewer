'use client';

import { useState, useMemo, useCallback, useRef, useEffect, lazy, Suspense } from 'react';
import { useRFPState } from '@/hooks/useRFPState';
import GridView from '@/components/GridView';
import type { TableDensity } from '@/components/GridView';
import AppHeader from '@/components/AppHeader';
import CategoryNav from '@/components/CategoryNav';
import GridToolbar from '@/components/GridToolbar';
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
import TourOverlay from '@/components/TourOverlay';
import { ToastContainer } from '@/components/Toast';
import type { ConsistencyIssue, ViewTab } from '@/types';
import { STORAGE_KEYS } from '@/lib/storageKeys';

export default function Home() {
  const state = useRFPState();
  const [consistencyIssues, setConsistencyIssues] = useState<ConsistencyIssue[]>([]);
  const [consistencyLoading, setConsistencyLoading] = useState(false);
  const [density, setDensity] = useState<TableDensity>('comfortable');
  const [showSettings, setShowSettings] = useState(false);
  const [showTour, setShowTour] = useState(false);
  const lastSavedRef = useRef<number | null>(null);
  const [, setLastSavedTick] = useState(0);
  const lastSaved = lastSavedRef.current;
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Live stats computed from questions array (data.stats may be stale)
  const liveStats = useMemo(() => {
    if (!state.data) return { green: 0, yellow: 0, red: 0, total: 0 };
    let green = 0, yellow = 0, red = 0;
    for (const q of state.data.questions) {
      const c = (q.confidence || '').trim().toUpperCase();
      if (c === 'GREEN') green++;
      else if (c === 'YELLOW') yellow++;
      else if (c === 'RED') red++;
    }
    return { green, yellow, red, total: state.data.questions.length };
  }, [state.data]);

  const [showOnboarding, setShowOnboarding] = useState(() => {
    if (typeof window !== 'undefined') return !localStorage.getItem(STORAGE_KEYS.ONBOARDED);
    return false;
  });
  const closeOnboarding = useCallback(() => {
    setShowOnboarding(false);
    localStorage.setItem(STORAGE_KEYS.ONBOARDED, 'true');
  }, []);

  // On first load, check if an emergency snapshot is newer than the main save
  useEffect(() => {
    try {
      const emergency = localStorage.getItem(STORAGE_KEYS.EMERGENCY);
      const main = localStorage.getItem(STORAGE_KEYS.EDITS);
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
        localStorage.removeItem(STORAGE_KEYS.EMERGENCY);
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
            STORAGE_KEYS.EMERGENCY,
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

  return (
    <div className="flex flex-col h-screen bg-white text-gray-900">
      <ToastContainer toasts={state.toasts} onRemove={state.removeToast} />

      {showTour && (
        <TourOverlay
          onNavigate={(tab) => { state.setActiveTab(tab as Parameters<typeof state.setActiveTab>[0]); state.setSelectedQuestion(null); }}
          onClose={() => setShowTour(false)}
        />
      )}

      <AppHeader
        state={state}
        liveStats={liveStats}
        lastSaved={lastSaved}
        showSettings={showSettings}
        setShowSettings={setShowSettings}
        setShowShortcuts={setShowShortcuts}
        setShowTour={setShowTour}
      />

      {(state.activeTab === 'grid' || state.activeTab === 'compliance') && (
        <CategoryNav
          categories={state.data.categories}
          activeCategory={state.activeCategory}
          categoryStats={state.categoryStats}
          onSetCategory={state.setActiveCategory}
        />
      )}

      {state.activeTab === 'grid' && (
        <GridToolbar
          search={state.search}
          onSearchChange={state.setSearch}
          searchInputRef={searchInputRef}
          showFilters={state.showFilters}
          onToggleFilters={() => state.setShowFilters(!state.showFilters)}
          confidenceFilter={state.confidenceFilter}
          onConfidenceChange={state.setConfidenceFilter}
          compliantFilter={state.compliantFilter}
          onCompliantChange={state.setCompliantFilter}
          deliveryFilter={state.deliveryFilter}
          onDeliveryChange={state.setDeliveryFilter}
          statusFilter={state.statusFilter}
          onStatusChange={state.setStatusFilter}
          onResetFilters={state.resetFilters}
          filteredCount={state.filteredQuestions.length}
          totalCount={liveStats.total}
          selectedRows={state.selectedRows}
          onBulkSetStatus={state.bulkSetStatus}
          onClearSelection={() => state.selectAllFiltered([])}
          versionCount={state.versions.length}
          hasVersions={state.versions.length > 0}
          onSave={state.handleSave}
          onExportCSV={state.handleExportCSV}
          onExportJSON={state.handleExportJSON}
          onPushToCloud={state.handlePushToCloud}
          onPullFromCloud={state.handlePullFromCloud}
          onSaveVersion={() => {
            state.saveVersion(`Snapshot ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`);
            state.addToast('success', 'Version snapshot saved');
          }}
          onShowVersionCompare={() => state.setShowVersionCompare(true)}
          onConsistencyCheck={handleConsistencyCheck}
          onShowNarrativeAudit={() => state.setShowNarrativeAudit(true)}
          onShowSummary={() => state.setShowSummary(true)}
          onBulkAiRewrite={() => { state.setActiveTab('humanize'); state.setSelectedQuestion(null); }}
          needsAttention={liveStats.yellow + liveStats.red}
        />
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
          <div className="px-4 py-1 text-xs border-b border-gray-100 bg-gray-50/60 flex items-center gap-1.5 flex-shrink-0 select-none">
            <span className="font-semibold text-gray-600 tracking-tight">
              {{ grid: 'Response Grid', context: 'Dashboard', humanize: 'AI QA', knowledgebase: 'Knowledge Base', pricing: 'Pricing', timeline: 'Timeline', sla: 'SLAs', compliance: 'Compliance', submission: 'Export' }[state.activeTab] || state.activeTab}
            </span>
            {state.activeTab === 'grid' && state.activeCategory !== 'All' && (
              <>
                <span className="text-gray-300 text-[10px]">›</span>
                <span className="text-gray-500">{state.activeCategory}</span>
              </>
            )}
            {state.activeTab === 'grid' && (
              <span className="ml-auto text-[10px] text-gray-400 tabular-nums">
                {state.filteredQuestions.length < liveStats.total
                  ? <><span className="font-semibold text-gray-500">{state.filteredQuestions.length}</span> of {liveStats.total}</>
                  : <><span className="font-semibold text-gray-500">{liveStats.total}</span> questions</>
                }
              </span>
            )}
          </div>
          <div className="flex-1 overflow-hidden relative">
          {state.activeTab === 'grid' && (
            <GridView
              questions={state.filteredQuestions}
              totalCount={state.data?.questions.length ?? 0}
              onClearFilters={handleClearFilters}
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
      <footer className="border-t border-gray-200 px-4 py-1.5 text-[10px] text-gray-400 flex items-center justify-between flex-shrink-0 bg-gray-50/60">
        <div className="flex items-center gap-3">
          {[
            { key: '⌘S', label: 'save' },
            { key: '⌘K', label: 'search' },
            { key: '↑↓', label: 'navigate rows' },
          ].map(({ key, label }) => (
            <span key={key} className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 bg-white rounded text-[9px] font-mono border border-gray-200 shadow-sm">{key}</kbd>
              <span>{label}</span>
            </span>
          ))}
          <span className="text-gray-300">·</span>
          <span>Click ref to open detail</span>
        </div>
        <div className="flex items-center gap-3">
          {state.hasUnsaved && (
            <span className="flex items-center gap-1 text-amber-600 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" /> Unsaved changes
            </span>
          )}
          {state.unresolvedFeedback > 0 && (
            <span className="text-orange-500 font-medium">{state.unresolvedFeedback} open feedback</span>
          )}
          {state.versions.length > 0 && (
            <span className="text-gray-400 font-medium">{state.versions.length} version{state.versions.length !== 1 ? 's' : ''}</span>
          )}
        </div>
      </footer>
    </div>
  );
}
