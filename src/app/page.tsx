"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { Save, Download, FileJson, CloudUpload, CloudDownload, Sparkles, BookOpen, Settings, LayoutGrid, BarChart3, SlidersHorizontal, RotateCcw, ChevronDown, Circle, History, Search, ClipboardCheck, FileText, Scan, Moon, Sun, Keyboard, DollarSign, Calendar, Shield, Target, BookText, ClipboardList, GitCompareArrows, FileStack } from "lucide-react";
import { useRFPState } from "@/hooks/useRFPState";
import GridView from "@/components/GridView";
import type { TableDensity } from "@/components/GridView";
import ContextView from "@/components/ContextView";
import RulesPanel from "@/components/RulesPanel";
import DetailPanel from "@/components/DetailPanel";
import KnowledgeBaseView from "@/components/KnowledgeBase";
import ComplianceView from "@/components/ComplianceView";
import SubmissionView from "@/components/SubmissionView";
import PricingView from "@/components/PricingView";
import TimelineView from "@/components/TimelineView";
import SLAView from "@/components/SLAView";
import WinThemesPanel from "@/components/WinThemes";
import BulkActions from "@/components/BulkActions";
import ConsistencyResults from "@/components/ConsistencyResults";
import ExecutiveSummary from "@/components/ExecutiveSummary";
import NarrativeAudit from "@/components/NarrativeAudit";
import SubmissionChecklist from "@/components/SubmissionChecklist";
import ProgressBar from "@/components/ProgressBar";
import KeyboardShortcutsPanel, { useKeyboardShortcuts } from "@/components/KeyboardShortcuts";
import Onboarding from "@/components/Onboarding";
import VersionCompare from "@/components/VersionCompare";
import TemplateManager from "@/components/TemplateManager";
import { ToastContainer } from "@/components/Toast";
import type { ConsistencyIssue, ViewTab } from "@/types";

export default function Home() {
  const state = useRFPState();
  const [consistencyIssues, setConsistencyIssues] = useState<ConsistencyIssue[]>([]);
  const [consistencyLoading, setConsistencyLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [density, setDensity] = useState<TableDensity>("comfortable");
  const [lastSaved, setLastSaved] = useState<number | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("rfp-dark-mode");
    if (saved === "true") { setDarkMode(true); document.documentElement.classList.add("dark"); }
  }, []);

  const toggleDarkMode = useCallback(() => {
    setDarkMode(prev => {
      const next = !prev;
      if (next) document.documentElement.classList.add("dark"); else document.documentElement.classList.remove("dark");
      localStorage.setItem("rfp-dark-mode", String(next));
      return next;
    });
  }, []);

  useEffect(() => { if (!localStorage.getItem("rfp-onboarded")) setShowOnboarding(true); }, []);
  const closeOnboarding = useCallback(() => { setShowOnboarding(false); localStorage.setItem("rfp-onboarded", "true"); }, []);

  const { showShortcuts, setShowShortcuts } = useKeyboardShortcuts({
    onToggleDarkMode: toggleDarkMode,
    onSwitchTab: (tab) => state.setActiveTab(tab as ViewTab),
  });

  useEffect(() => { if (!state.hasUnsaved && state.data) setLastSaved(Date.now()); }, [state.hasUnsaved, state.data]);

  const pendingDiffKeys = useMemo(() => new Set(Object.keys(state.pendingDiffs)), [state.pendingDiffs]);

  const handleConsistencyCheck = useCallback(async () => {
    if (!state.data) return;
    state.setShowConsistency(true); setConsistencyLoading(true);
    try {
      const qs = state.activeCategory !== "All" ? state.data.questions.filter(q => q.category === state.activeCategory) : state.data.questions;
      const res = await fetch("/api/consistency", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ questions: qs, knowledgeBase: state.knowledgeBase }) });
      setConsistencyIssues((await res.json()).issues || []);
    } catch { setConsistencyIssues([]); }
    setConsistencyLoading(false);
  }, [state]);

  const handleGenerateSummary = useCallback(async () => {
    if (!state.data) throw new Error("No data");
    const res = await fetch("/api/summary", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ questions: state.data.questions, stats: state.data.stats, knowledgeBase: state.knowledgeBase }) });
    if (!res.ok) throw new Error("Failed");
    return res.json();
  }, [state.data, state.knowledgeBase]);

  const handleNarrativeAudit = useCallback(async () => {
    if (!state.data) throw new Error("No data");
    const res = await fetch("/api/narrative-audit", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ questions: state.data.questions, winThemes: state.winThemes, knowledgeBase: state.knowledgeBase }) });
    if (!res.ok) throw new Error("Failed");
    return res.json();
  }, [state.data, state.winThemes, state.knowledgeBase]);

  const handleUpdateCompliant = useCallback((ref: string, value: string) => { state.handleCellEdit(ref, "compliant", value); }, [state]);

  const formatTimeSince = (ts: number | null) => {
    if (!ts) return "";
    const diff = Math.floor((Date.now() - ts) / 1000);
    if (diff < 60) return "just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    return `${Math.floor(diff / 3600)}h ago`;
  };

  if (state.loading) {
    return (
      <div className="flex flex-col h-screen bg-white dark:bg-gray-950">
        <div className="border-b dark:border-gray-800 px-6 py-4"><div className="skeleton h-6 w-48 mb-2" /><div className="skeleton h-4 w-72" /></div>
        <div className="border-b dark:border-gray-800 px-6 py-3 flex gap-2">{Array.from({ length: 8 }).map((_, i) => <div key={i} className="skeleton h-7 w-24 rounded" />)}</div>
        <div className="flex-1 p-6 space-y-3">{Array.from({ length: 10 }).map((_, i) => <div key={i} className="skeleton h-16 w-full rounded" />)}</div>
      </div>
    );
  }

  if (!state.data) return <div className="flex items-center justify-center h-screen"><p className="text-gray-500">Failed to load data.</p></div>;

  const NAV_TABS = [
    { key: "grid" as const, icon: LayoutGrid, label: "Grid" },
    { key: "context" as const, icon: BarChart3, label: "Dashboard" },
    { key: "knowledgebase" as const, icon: BookOpen, label: "KB" },
    { key: "pricing" as const, icon: DollarSign, label: "Pricing" },
    { key: "timeline" as const, icon: Calendar, label: "Timeline" },
    { key: "sla" as const, icon: Shield, label: "SLA" },
    { key: "compliance" as const, icon: ClipboardCheck, label: "Compliance" },
    { key: "submission" as const, icon: FileText, label: "Submit" },
  ];

  return (
    <div className="flex flex-col h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100">
      <ToastContainer toasts={state.toasts} onRemove={state.removeToast} />

      {/* Header */}
      <header className="border-b border-gray-200 dark:border-gray-800 px-4 py-2.5 flex items-center justify-between flex-shrink-0 bg-white dark:bg-gray-950">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center">
            <BookOpen size={14} className="text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold">BSB Credit Card RFP</h1>
              {state.hasUnsaved ? (
                <span className="text-[9px] bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-1.5 py-0.5 rounded font-medium">Unsaved</span>
              ) : lastSaved && (
                <span className="text-[9px] text-gray-400 font-medium">Saved {formatTimeSince(lastSaved)}</span>
              )}
            </div>
            <p className="text-[10px] text-gray-400">{state.data.stats.total} Qs · {state.data.categories.length} Categories</p>
          </div>
        </div>

        {/* Nav Tabs */}
        <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-0.5 overflow-x-auto">
          {NAV_TABS.map(tab => (
            <button key={tab.key} onClick={() => { state.setActiveTab(tab.key); state.setSelectedQuestion(null); }}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md text-[11px] font-medium whitespace-nowrap transition-all ${state.activeTab === tab.key ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm" : "text-gray-500 dark:text-gray-400 hover:text-gray-700"}`}>
              <tab.icon size={12} /> {tab.label}
            </button>
          ))}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2">
          <ProgressBar {...state.statusCounts} />
          <div className="flex items-center gap-1.5 text-[10px] font-medium">
            <span className="flex items-center gap-0.5"><Circle size={6} fill="#10b981" className="text-emerald-500" />{state.data.stats.green}</span>
            <span className="flex items-center gap-0.5"><Circle size={6} fill="#f59e0b" className="text-amber-500" />{state.data.stats.yellow}</span>
            <span className="flex items-center gap-0.5"><Circle size={6} fill="#ef4444" className="text-red-500" />{state.data.stats.red}</span>
          </div>
          <div className="w-px h-5 bg-gray-200 dark:bg-gray-700" />
          <button onClick={() => state.setShowWinThemes(!state.showWinThemes)}
            className={`p-1.5 rounded-md text-xs ${state.showWinThemes ? "text-violet-600 bg-violet-50 dark:bg-violet-900/20" : "text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800"}`} title="Win Themes">
            <Target size={15} />
          </button>
          <button onClick={() => state.setShowRules(!state.showRules)}
            className={`p-1.5 rounded-md text-xs ${state.showRules ? "text-blue-600 bg-blue-50 dark:bg-blue-900/20" : "text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800"}`} title="Rules">
            <BookOpen size={15} />
          </button>
          <button onClick={() => state.setShowChecklist(true)} className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800" title="Submission Checklist">
            <ClipboardList size={15} />
          </button>
          <button onClick={() => state.setShowTemplates(true)} className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800" title="Templates">
            <FileStack size={15} />
          </button>
          <button onClick={toggleDarkMode} className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800" title={darkMode ? "Light mode" : "Dark mode"}>
            {darkMode ? <Sun size={15} /> : <Moon size={15} />}
          </button>
          <button onClick={() => setShowShortcuts(true)} className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800" title="Keyboard shortcuts (?)">
            <Keyboard size={15} />
          </button>
        </div>
      </header>

      {/* Category Tabs */}
      {(state.activeTab === "grid" || state.activeTab === "compliance") && (
        <div className="border-b border-gray-200 dark:border-gray-800 px-6 py-1.5 flex gap-1 overflow-x-auto flex-shrink-0 bg-gray-50/50 dark:bg-gray-900/50">
          {["All", ...state.data.categories].map((cat) => {
            const isActive = state.activeCategory === cat;
            const catStat = state.categoryStats[cat];
            return (
              <button key={cat} onClick={() => state.setActiveCategory(cat)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium whitespace-nowrap ${isActive ? "bg-blue-600 text-white shadow-sm" : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"}`}>
                {cat} <span className={isActive ? "text-blue-200" : "text-gray-400"}>{catStat?.total || 0}</span>
                {catStat && catStat.total > 0 && <span className={`ml-0.5 text-[8px] ${isActive ? "text-blue-200" : "text-gray-300 dark:text-gray-500"}`}>({catStat.approved}/{catStat.total})</span>}
              </button>
            );
          })}
        </div>
      )}

      {/* Filter & Action Bar (Grid view) */}
      {state.activeTab === "grid" && (
        <div className="border-b border-gray-200 dark:border-gray-800 px-6 py-2 flex-shrink-0 bg-white dark:bg-gray-950 space-y-1.5">
          <div className="flex items-center gap-2">
            <div className="relative flex-shrink-0">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="text" placeholder="Search..." value={state.search} onChange={(e) => state.setSearch(e.target.value)}
                className="border border-gray-200 dark:border-gray-700 rounded-lg pl-8 pr-3 py-1.5 text-xs w-64 focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-gray-50 dark:bg-gray-800 dark:text-gray-100 placeholder:text-gray-400" />
            </div>
            <button onClick={() => state.setShowFilters(!state.showFilters)}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium border ${state.showFilters ? "border-blue-300 text-blue-600 bg-blue-50 dark:bg-blue-900/20" : "border-gray-200 dark:border-gray-700 text-gray-500"}`}>
              <SlidersHorizontal size={12} /> Filters <ChevronDown size={10} className={state.showFilters ? "rotate-180" : ""} />
            </button>
            <span className="text-[10px] text-gray-400">{state.filteredQuestions.length}/{state.data.stats.total}</span>

            {state.selectedRows.size > 0 && <BulkActions selectedCount={state.selectedRows.size} onChangeStatus={state.bulkSetStatus} onClearSelection={() => state.selectAllFiltered([])} />}

            <div className="flex-1" />

            <div className="flex items-center gap-1">
              <button onClick={state.handleSave} className="flex items-center gap-1 bg-blue-600 text-white px-2.5 py-1.5 rounded-lg text-[11px] font-medium hover:bg-blue-700 shadow-sm">
                <Save size={12} /> Save
              </button>
              <button onClick={state.handleExportCSV} className="flex items-center gap-1 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 px-2 py-1.5 rounded-lg text-[11px] font-medium hover:bg-gray-50 dark:hover:bg-gray-800">
                <Download size={12} /> CSV
              </button>
              <button onClick={state.handleExportJSON} className="flex items-center gap-1 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 px-2 py-1.5 rounded-lg text-[11px] font-medium hover:bg-gray-50 dark:hover:bg-gray-800">
                <FileJson size={12} /> JSON
              </button>
              <div className="w-px h-4 bg-gray-200 dark:bg-gray-700" />
              <button onClick={state.handlePushToCloud} className="flex items-center gap-1 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 px-2 py-1.5 rounded-lg text-[11px] font-medium hover:bg-gray-50 dark:hover:bg-gray-800" title="Push to Supabase">
                <CloudUpload size={12} /> Push
              </button>
              <button onClick={state.handlePullFromCloud} className="flex items-center gap-1 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 px-2 py-1.5 rounded-lg text-[11px] font-medium hover:bg-gray-50 dark:hover:bg-gray-800" title="Pull from Supabase">
                <CloudDownload size={12} /> Pull
              </button>
              <button onClick={() => state.saveVersion()} className="flex items-center gap-1 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 px-2 py-1.5 rounded-lg text-[11px] font-medium hover:bg-gray-50 dark:hover:bg-gray-800">
                <History size={12} /> v{state.versions.length + 1}
              </button>
              {state.versions.length > 0 && (
                <button onClick={() => state.setShowVersionCompare(true)} className="flex items-center gap-1 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 px-2 py-1.5 rounded-lg text-[11px] font-medium hover:bg-gray-50 dark:hover:bg-gray-800" title="Compare versions">
                  <GitCompareArrows size={12} />
                </button>
              )}
              <div className="w-px h-4 bg-gray-200 dark:bg-gray-700" />
              <button onClick={handleConsistencyCheck} className="flex items-center gap-1 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 px-2 py-1.5 rounded-lg text-[11px] font-medium hover:bg-gray-50 dark:hover:bg-gray-800" title="Consistency Check">
                <Scan size={12} /> Check
              </button>
              <button onClick={() => state.setShowNarrativeAudit(true)} className="flex items-center gap-1 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 px-2 py-1.5 rounded-lg text-[11px] font-medium hover:bg-gray-50 dark:hover:bg-gray-800" title="Narrative Audit">
                <BookText size={12} /> Audit
              </button>
              <button onClick={() => state.setShowSummary(true)} className="flex items-center gap-1 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 px-2 py-1.5 rounded-lg text-[11px] font-medium hover:bg-gray-50 dark:hover:bg-gray-800">
                <FileText size={12} /> Summary
              </button>
              <button className="flex items-center gap-1 bg-gradient-to-r from-violet-600 to-purple-600 text-white px-2.5 py-1.5 rounded-lg text-[11px] font-medium hover:from-violet-700 hover:to-purple-700 shadow-sm">
                <Sparkles size={12} /> AI Rewrite <span className="bg-white/20 px-1 py-0 rounded text-[9px]">{state.data.stats.yellow + state.data.stats.red}</span>
              </button>
            </div>
          </div>

          {state.showFilters && (
            <div className="flex items-center gap-1.5 pt-0.5">
              <span className="text-[9px] text-gray-400 uppercase tracking-wider font-semibold mr-1">Filter</span>
              {[
                { value: state.confidenceFilter, onChange: state.setConfidenceFilter, options: ["All Confidence", "GREEN", "YELLOW", "RED"] },
                { value: state.compliantFilter, onChange: state.setCompliantFilter, options: ["All Compliant", "Y", "N", "Partial"] },
                { value: state.deliveryFilter, onChange: state.setDeliveryFilter, options: ["All Delivery", "OOB", "Config", "Custom"] },
              ].map((f, i) => (
                <select key={i} value={f.value} onChange={(e) => f.onChange(e.target.value)}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1 text-[11px] text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800 focus:outline-none">
                  {f.options.map(o => <option key={o}>{o}</option>)}
                </select>
              ))}
              <select value={state.statusFilter} onChange={(e) => state.setStatusFilter(e.target.value)}
                className="border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1 text-[11px] text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800 focus:outline-none">
                <option>All Status</option><option value="draft">Draft</option><option value="reviewed">Reviewed</option><option value="approved">Approved</option><option value="flagged">Flagged</option>
              </select>
              <button onClick={state.resetFilters} className="flex items-center gap-0.5 text-[11px] text-gray-400 hover:text-blue-500 font-medium ml-1">
                <RotateCcw size={10} /> Reset
              </button>
            </div>
          )}
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 overflow-hidden relative">
        {state.activeTab === "grid" && (
          <GridView questions={state.filteredQuestions} getConfidenceColor={state.getConfidenceColor}
            onSelectQuestion={state.setSelectedQuestion} onCellEdit={state.handleCellEdit}
            selectedRows={state.selectedRows} onToggleRow={state.toggleRow} onSelectAll={state.selectAllFiltered}
            sortConfig={state.sortConfig} onSort={state.setSortConfig} onCycleStatus={state.cycleStatus}
            pendingDiffKeys={pendingDiffKeys} density={density} onChangeDensity={setDensity} />
        )}
        {state.activeTab === "context" && <ContextView data={state.data} />}
        {state.activeTab === "knowledgebase" && <KnowledgeBaseView kb={state.knowledgeBase} onUpdate={state.updateKnowledgeBase} onSave={state.saveToLocal} />}
        {state.activeTab === "pricing" && <PricingView pricing={state.pricingModel} onUpdate={state.updatePricing} />}
        {state.activeTab === "timeline" && <TimelineView milestones={state.milestones} onUpdate={state.updateMilestones} />}
        {state.activeTab === "sla" && <SLAView slas={state.slaCommitments} onUpdate={state.updateSLAs} />}
        {state.activeTab === "compliance" && <ComplianceView questions={state.filteredQuestions} categories={state.data.categories} onUpdateCompliant={handleUpdateCompliant} />}
        {state.activeTab === "submission" && <SubmissionView questions={state.data.questions} categories={state.data.categories} />}

        {state.showRules && <RulesPanel onClose={() => state.setShowRules(false)} rules={state.globalRules} onUpdateRules={state.setGlobalRules} validationRules={state.validationRules} onUpdateValidationRules={state.updateValidationRules} />}
        {state.showWinThemes && <WinThemesPanel themes={state.winThemes} onUpdate={state.updateWinThemes} questions={state.data.questions} onClose={() => state.setShowWinThemes(false)} />}
        {state.selectedQuestion && (
          <DetailPanel question={state.selectedQuestion} onClose={() => state.setSelectedQuestion(null)}
            onSave={(updated) => { state.updateQuestion(updated); state.addCellHistory(updated.ref, "detail-save", "", "human"); }}
            onAiRewrite={state.handleAiRewrite} cellHistory={state.cellHistory}
            feedbackItems={state.feedbackItems} onAddFeedback={state.handleAddFeedback} onResolveFeedback={state.handleResolveFeedback}
            pendingDiffs={state.pendingDiffs} onAcceptDiff={state.acceptDiff} onRejectDiff={state.rejectDiff} onAcceptEditedDiff={state.acceptEditedDiff} />
        )}
      </div>

      {/* Modals */}
      {state.showConsistency && <ConsistencyResults issues={consistencyIssues} loading={consistencyLoading} onClose={() => state.setShowConsistency(false)} onNavigate={(ref) => { const q = state.data?.questions.find(q => q.ref === ref); if (q) { state.setSelectedQuestion(q); state.setShowConsistency(false); } }} />}
      {state.showSummary && <ExecutiveSummary onClose={() => state.setShowSummary(false)} onGenerate={handleGenerateSummary} />}
      {state.showNarrativeAudit && <NarrativeAudit onClose={() => state.setShowNarrativeAudit(false)} onRun={handleNarrativeAudit} />}
      {state.showChecklist && <SubmissionChecklist data={state.data} pricing={state.pricingModel} slas={state.slaCommitments} milestones={state.milestones} winThemes={state.winThemes} knowledgeBase={state.knowledgeBase} statusCounts={state.statusCounts} onClose={() => state.setShowChecklist(false)} />}
      {state.showVersionCompare && state.versions.length > 0 && (
        <VersionCompare versions={state.versions} currentQuestions={state.data?.questions || []} onClose={() => state.setShowVersionCompare(false)} />
      )}
      {state.showTemplates && state.data && (
        <TemplateManager currentData={state.data} onLoadTemplate={state.loadTemplateData} onClose={() => state.setShowTemplates(false)} addToast={state.addToast} />
      )}
      {showShortcuts && <KeyboardShortcutsPanel onClose={() => setShowShortcuts(false)} />}
      {showOnboarding && <Onboarding onClose={closeOnboarding} />}

      {/* Footer */}
      <footer className="border-t border-gray-200 dark:border-gray-800 px-6 py-1.5 text-[10px] text-gray-400 flex justify-between flex-shrink-0 bg-gray-50/50 dark:bg-gray-900/50">
        <div className="flex items-center gap-3">
          <span><kbd className="px-1 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-[9px] font-mono border border-gray-200 dark:border-gray-700">⌘S</kbd> save</span>
          <span><kbd className="px-1 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-[9px] font-mono border border-gray-200 dark:border-gray-700">?</kbd> shortcuts</span>
          <span><kbd className="px-1 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-[9px] font-mono border border-gray-200 dark:border-gray-700">D</kbd> dark mode</span>
        </div>
        <span>{state.unresolvedFeedback > 0 ? `${state.unresolvedFeedback} open feedback` : "No open feedback"}</span>
      </footer>
    </div>
  );
}
