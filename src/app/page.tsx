"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { Save, Download, FileJson, CloudUpload, Sparkles, BookOpen, Settings, LayoutGrid, BarChart3, SlidersHorizontal, RotateCcw, ChevronDown, Circle, History, Search } from "lucide-react";
import type { RFPData, Question, ViewTab } from "@/types";
import GridView from "@/components/GridView";
import ContextView from "@/components/ContextView";
import RulesPanel from "@/components/RulesPanel";
import DetailPanel from "@/components/DetailPanel";
import { ToastContainer, useToast } from "@/components/Toast";
import type { FeedbackItem } from "@/components/FeedbackPanel";

type CellHistory = Record<string, { value: string; timestamp: number; source: "human" | "ai" }[]>;

export default function Home() {
  const [data, setData] = useState<RFPData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<ViewTab>("grid");
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [search, setSearch] = useState("");
  const [confidenceFilter, setConfidenceFilter] = useState("All Confidence");
  const [compliantFilter, setCompliantFilter] = useState("All Compliant");
  const [deliveryFilter, setDeliveryFilter] = useState("All Delivery");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [coverageFilter, setCoverageFilter] = useState("All Coverage");
  const [showRules, setShowRules] = useState(false);
  const [showFilters, setShowFilters] = useState(true);
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [cellHistory, setCellHistory] = useState<CellHistory>({});
  const [feedbackItems, setFeedbackItems] = useState<FeedbackItem[]>([]);
  const [versions, setVersions] = useState<{ label: string; timestamp: number; data: RFPData }[]>([]);
  const [hasUnsaved, setHasUnsaved] = useState(false);
  const [globalRules, setGlobalRules] = useState<string[]>([]);
  const { toasts, addToast, removeToast } = useToast();

  useEffect(() => {
    fetch("/rfp_data.json")
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        const saved = localStorage.getItem("rfp-edits");
        if (saved) try { const edits = JSON.parse(saved); if (edits.questions) setData(edits); } catch {}
        const savedHistory = localStorage.getItem("rfp-cell-history");
        if (savedHistory) try { setCellHistory(JSON.parse(savedHistory)); } catch {}
        const savedRules = localStorage.getItem("rfp-global-rules");
        if (savedRules) try { setGlobalRules(JSON.parse(savedRules)); } catch {}
        const savedFeedback = localStorage.getItem("rfp-feedback");
        if (savedFeedback) try { setFeedbackItems(JSON.parse(savedFeedback)); } catch {}
        const savedVersions = localStorage.getItem("rfp-versions");
        if (savedVersions) try { setVersions(JSON.parse(savedVersions)); } catch {}
        setLoading(false);
      })
      .catch((e) => { console.error(e); setLoading(false); });
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") { e.preventDefault(); saveToLocal(); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  });

  const saveToLocal = useCallback(() => {
    if (!data) return;
    localStorage.setItem("rfp-edits", JSON.stringify(data));
    localStorage.setItem("rfp-cell-history", JSON.stringify(cellHistory));
    localStorage.setItem("rfp-global-rules", JSON.stringify(globalRules));
    localStorage.setItem("rfp-feedback", JSON.stringify(feedbackItems));
    setHasUnsaved(false);
    addToast("success", "Changes saved locally");
  }, [data, cellHistory, globalRules, feedbackItems, addToast]);

  const addCellHistory = useCallback((ref: string, field: string, value: string, source: "human" | "ai") => {
    setCellHistory((prev) => {
      const key = `${ref}:${field}`;
      return { ...prev, [key]: [...(prev[key] || []), { value, timestamp: Date.now(), source }] };
    });
  }, []);

  const updateQuestion = useCallback((updated: Question) => {
    if (!data) return;
    setData({ ...data, questions: data.questions.map((q) => (q.ref === updated.ref ? updated : q)) });
    setHasUnsaved(true);
    if (selectedQuestion?.ref === updated.ref) setSelectedQuestion(updated);
  }, [data, selectedQuestion]);

  const handleCellEdit = useCallback((ref: string, field: keyof Question, value: string) => {
    if (!data) return;
    const q = data.questions.find((q) => q.ref === ref);
    if (!q) return;
    addCellHistory(ref, field, value, "human");
    updateQuestion({ ...q, [field]: value });
  }, [data, addCellHistory, updateQuestion]);

  const handleAiRewrite = useCallback(async (question: Question, field: "bullet" | "paragraph", rowRules: string, feedback: FeedbackItem[]): Promise<string> => {
    const res = await fetch("/api/rewrite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question, field, globalRules, rowRules, feedback }),
    });
    const { text, error } = await res.json();
    if (error) { addToast("error", "AI rewrite failed"); throw new Error(error); }
    addCellHistory(question.ref, field, text, "ai");
    addToast("success", `AI rewrote ${field} response`);
    return text;
  }, [globalRules, addCellHistory, addToast]);

  const handleAddFeedback = useCallback((ref: string, field: string, comment: string) => {
    setFeedbackItems(prev => [...prev, { ref, field, comment, timestamp: Date.now(), resolved: false }]);
    setHasUnsaved(true);
    addToast("info", "Feedback added");
  }, [addToast]);

  const handleResolveFeedback = useCallback((ref: string, timestamp: number) => {
    setFeedbackItems(prev => prev.map(f => f.ref === ref && f.timestamp === timestamp ? { ...f, resolved: true } : f));
    setHasUnsaved(true);
  }, []);

  const saveVersion = useCallback((label?: string) => {
    if (!data) return;
    const v = { label: label || `v${versions.length + 1}`, timestamp: Date.now(), data: JSON.parse(JSON.stringify(data)) };
    const newVersions = [...versions, v];
    setVersions(newVersions);
    localStorage.setItem("rfp-versions", JSON.stringify(newVersions));
  }, [data, versions]);

  const handleSave = useCallback(() => { saveToLocal(); saveVersion("Auto-save"); }, [saveToLocal, saveVersion]);

  const filteredQuestions = useMemo(() => {
    if (!data) return [];
    let qs = data.questions;
    if (activeCategory !== "All") qs = qs.filter((q) => q.category === activeCategory);
    if (search) { const s = search.toLowerCase(); qs = qs.filter((q) => q.ref.toLowerCase().includes(s) || q.topic.toLowerCase().includes(s) || q.requirement.toLowerCase().includes(s) || q.bullet.toLowerCase().includes(s) || q.paragraph.toLowerCase().includes(s)); }
    if (confidenceFilter !== "All Confidence") qs = qs.filter((q) => q.confidence === confidenceFilter);
    if (compliantFilter !== "All Compliant") qs = qs.filter((q) => q.compliant === compliantFilter);
    return qs;
  }, [data, activeCategory, search, confidenceFilter, compliantFilter]);

  const handleExportCSV = useCallback(() => {
    if (!data) return;
    const headers = ["#", "Reference", "Topic", "BSB Requirement", "Response (Bullet)", "Response (Paragraph)", "Confidence", "Compliant"];
    const rows = filteredQuestions.map((q) => [q.number, q.ref, q.topic, q.requirement, q.bullet, q.paragraph, q.confidence, q.compliant]);
    const csv = [headers.join(","), ...rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "rfp_export.csv"; a.click();
    URL.revokeObjectURL(url);
    addToast("success", "Exported as CSV");
  }, [data, filteredQuestions, addToast]);

  const handleExportJSON = useCallback(() => {
    if (!data) return;
    const blob = new Blob([JSON.stringify(filteredQuestions, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "rfp_export.json"; a.click();
    URL.revokeObjectURL(url);
    addToast("success", "Exported as JSON");
  }, [data, filteredQuestions, addToast]);

  const resetFilters = useCallback(() => {
    setSearch(""); setConfidenceFilter("All Confidence"); setCompliantFilter("All Compliant");
    setDeliveryFilter("All Delivery"); setStatusFilter("All Status"); setCoverageFilter("All Coverage");
    setActiveCategory("All");
  }, []);

  const categoryStats = useMemo(() => {
    if (!data) return {};
    const stats: Record<string, number> = { All: data.questions.length };
    for (const q of data.questions) stats[q.category] = (stats[q.category] || 0) + 1;
    return stats;
  }, [data]);

  const getConfidenceColor = useCallback((conf: string) => {
    if (conf === "GREEN" || conf === "High") return "bg-green-500";
    if (conf === "YELLOW" || conf === "Medium") return "bg-yellow-400";
    if (conf === "RED" || conf === "Low") return "bg-red-500";
    return "bg-gray-300";
  }, []);

  const unresolvedFeedback = feedbackItems.filter(f => !f.resolved).length;

  // Loading skeleton
  if (loading) {
    return (
      <div className="flex flex-col h-screen bg-white">
        <div className="border-b px-6 py-4"><div className="skeleton h-6 w-48 mb-2" /><div className="skeleton h-4 w-72" /></div>
        <div className="border-b px-6 py-3 flex gap-2">{Array.from({ length: 8 }).map((_, i) => <div key={i} className="skeleton h-7 w-24 rounded" />)}</div>
        <div className="flex-1 p-6 space-y-3">{Array.from({ length: 10 }).map((_, i) => <div key={i} className="skeleton h-16 w-full rounded" />)}</div>
      </div>
    );
  }

  if (!data) return <div className="flex items-center justify-center h-screen"><p className="text-gray-500">Failed to load data.</p></div>;

  return (
    <div className="flex flex-col h-screen bg-white">
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      {/* Header */}
      <header className="border-b border-gray-200 px-6 py-3 flex items-center justify-between flex-shrink-0 bg-white">
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center">
            <BookOpen size={16} className="text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-gray-900">BSB Credit Card RFP</h1>
              {hasUnsaved && <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-medium">Unsaved</span>}
            </div>
            <p className="text-xs text-gray-400">Brim Financial · {data.stats.total} Questions · {data.categories.length} Categories</p>
          </div>
        </div>

        {/* Nav Tabs */}
        <div className="flex items-center bg-gray-100 rounded-lg p-0.5">
          <button onClick={() => { setActiveTab("grid"); setSelectedQuestion(null); }}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === "grid" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
            <LayoutGrid size={14} /> Grid
          </button>
          <button onClick={() => { setActiveTab("context"); setSelectedQuestion(null); }}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === "context" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
            <BarChart3 size={14} /> Dashboard
          </button>
        </div>

        {/* Right side: stats + actions */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 text-xs font-medium">
            <span className="flex items-center gap-1"><Circle size={7} fill="#10b981" className="text-emerald-500" />{data.stats.green}</span>
            <span className="flex items-center gap-1"><Circle size={7} fill="#f59e0b" className="text-amber-500" />{data.stats.yellow}</span>
            <span className="flex items-center gap-1"><Circle size={7} fill="#ef4444" className="text-red-500" />{data.stats.red}</span>
          </div>
          <div className="w-px h-6 bg-gray-200" />
          <button onClick={() => setShowRules(!showRules)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium border transition-all ${showRules ? "border-blue-300 text-blue-600 bg-blue-50" : "border-gray-200 text-gray-500 hover:bg-gray-50"}`}>
            <BookOpen size={14} /> Rules
          </button>
          <button className="p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100">
            <Settings size={16} />
          </button>
        </div>
      </header>

      {/* Category Tabs */}
      <div className="border-b border-gray-200 px-6 py-2 flex gap-1 overflow-x-auto flex-shrink-0 bg-gray-50/50">
        {["All", ...data.categories].map((cat) => {
          const isActive = activeCategory === cat;
          return (
            <button key={cat} onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-all ${isActive ? "bg-blue-600 text-white shadow-sm" : "text-gray-500 hover:bg-gray-100 hover:text-gray-700"}`}>
              {cat} <span className={`ml-0.5 ${isActive ? "text-blue-200" : "text-gray-400"}`}>{categoryStats[cat] || 0}</span>
            </button>
          );
        })}
      </div>

      {/* Filter & Action Bar (Grid view) */}
      {activeTab === "grid" && (
        <div className="border-b border-gray-200 px-6 py-2.5 flex-shrink-0 bg-white space-y-2">
          {/* Row 1: Search + Actions */}
          <div className="flex items-center gap-2">
            <div className="relative flex-shrink-0">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="text" placeholder="Search questions, topics, responses..." value={search} onChange={(e) => setSearch(e.target.value)}
                className="border border-gray-200 rounded-lg pl-8 pr-3 py-1.5 text-sm w-72 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 bg-gray-50 placeholder:text-gray-400" />
            </div>

            <button onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${showFilters ? "border-blue-300 text-blue-600 bg-blue-50" : "border-gray-200 text-gray-500 hover:bg-gray-50"}`}>
              <SlidersHorizontal size={13} /> Filters
              <ChevronDown size={12} className={`transition-transform ${showFilters ? "rotate-180" : ""}`} />
            </button>

            <span className="text-xs text-gray-400">{filteredQuestions.length} of {data.stats.total}</span>

            <div className="flex-1" />

            <div className="flex items-center gap-1.5">
              <button onClick={handleSave} className="flex items-center gap-1.5 bg-blue-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-blue-700 shadow-sm">
                <Save size={13} /> Save
              </button>
              <button onClick={handleExportCSV} className="flex items-center gap-1.5 border border-gray-200 text-gray-600 px-2.5 py-1.5 rounded-lg text-xs font-medium hover:bg-gray-50">
                <Download size={13} /> CSV
              </button>
              <button onClick={handleExportJSON} className="flex items-center gap-1.5 border border-gray-200 text-gray-600 px-2.5 py-1.5 rounded-lg text-xs font-medium hover:bg-gray-50">
                <FileJson size={13} /> JSON
              </button>
              <div className="w-px h-5 bg-gray-200" />
              <button className="flex items-center gap-1.5 border border-gray-200 text-gray-600 px-2.5 py-1.5 rounded-lg text-xs font-medium hover:bg-gray-50">
                <CloudUpload size={13} /> Push
              </button>
              <button onClick={() => saveVersion()} className="flex items-center gap-1.5 border border-gray-200 text-gray-600 px-2.5 py-1.5 rounded-lg text-xs font-medium hover:bg-gray-50">
                <History size={13} /> v{versions.length + 1}
              </button>
              <div className="w-px h-5 bg-gray-200" />
              <button className="flex items-center gap-1.5 bg-gradient-to-r from-violet-600 to-purple-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:from-violet-700 hover:to-purple-700 shadow-sm">
                <Sparkles size={13} /> AI Rewrite
                <span className="bg-white/20 px-1.5 py-0.5 rounded text-[10px]">{data.stats.yellow + data.stats.red}</span>
              </button>
            </div>
          </div>

          {/* Row 2: Filters (collapsible) */}
          {showFilters && (
            <div className="flex items-center gap-2 pt-0.5">
              <span className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold mr-1">Filter by</span>
              <select value={confidenceFilter} onChange={(e) => setConfidenceFilter(e.target.value)}
                className="border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs text-gray-600 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400">
                <option>All Confidence</option><option>GREEN</option><option>YELLOW</option><option>RED</option>
              </select>
              <select value={compliantFilter} onChange={(e) => setCompliantFilter(e.target.value)}
                className="border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs text-gray-600 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400">
                <option>All Compliant</option><option>Y</option><option>N</option><option>Partial</option>
              </select>
              <select value={deliveryFilter} onChange={(e) => setDeliveryFilter(e.target.value)}
                className="border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs text-gray-600 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400">
                <option>All Delivery</option><option>OOB</option><option>Config</option><option>Custom</option>
              </select>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
                className="border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs text-gray-600 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400">
                <option>All Status</option><option>Draft</option><option>Reviewed</option><option>Final</option><option>QA</option>
              </select>
              <button onClick={resetFilters} className="flex items-center gap-1 text-xs text-gray-400 hover:text-blue-500 font-medium ml-1">
                <RotateCcw size={11} /> Reset
              </button>
            </div>
          )}
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 overflow-hidden relative">
        {activeTab === "grid" && (
          <GridView questions={filteredQuestions} getConfidenceColor={getConfidenceColor} onSelectQuestion={setSelectedQuestion} onCellEdit={handleCellEdit} />
        )}
        {activeTab === "context" && <ContextView data={data} />}
        {showRules && <RulesPanel onClose={() => setShowRules(false)} rules={globalRules} onUpdateRules={(r) => { setGlobalRules(r); setHasUnsaved(true); }} />}
        {selectedQuestion && (
          <DetailPanel question={selectedQuestion} onClose={() => setSelectedQuestion(null)}
            onSave={(updated) => { updateQuestion(updated); addCellHistory(updated.ref, "detail-save", "", "human"); }}
            onAiRewrite={handleAiRewrite} cellHistory={cellHistory}
            feedbackItems={feedbackItems} onAddFeedback={handleAddFeedback} onResolveFeedback={handleResolveFeedback}
          />
        )}
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-200 px-6 py-2 text-[11px] text-gray-400 flex justify-between flex-shrink-0 bg-gray-50/50">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1"><kbd className="px-1 py-0.5 bg-gray-100 rounded text-[10px] font-mono border border-gray-200">⌘S</kbd> save</span>
          <span>Click cell to edit</span>
          <span>Click ref to open detail</span>
        </div>
        <span>{unresolvedFeedback > 0 ? `${unresolvedFeedback} open feedback` : "No open feedback"}</span>
      </footer>
    </div>
  );
}
