"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import type { RFPData, Question, ViewTab } from "@/types";
import GridView from "@/components/GridView";
import ContextView from "@/components/ContextView";
import RulesPanel from "@/components/RulesPanel";
import DetailPanel from "@/components/DetailPanel";

type CellHistory = Record<string, { value: string; timestamp: number; source: "human" | "ai" }[]>;

export default function Home() {
  const [data, setData] = useState<RFPData | null>(null);
  const [activeTab, setActiveTab] = useState<ViewTab>("grid");
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [search, setSearch] = useState("");
  const [confidenceFilter, setConfidenceFilter] = useState("All Confidence");
  const [compliantFilter, setCompliantFilter] = useState("All Compliant");
  const [deliveryFilter, setDeliveryFilter] = useState("All Delivery");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [coverageFilter, setCoverageFilter] = useState("All Coverage");
  const [showRules, setShowRules] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [cellHistory, setCellHistory] = useState<CellHistory>({});
  const [feedbackCount, setFeedbackCount] = useState(0);
  const [versions, setVersions] = useState<{ label: string; timestamp: number; data: RFPData }[]>([]);
  const [hasUnsaved, setHasUnsaved] = useState(false);
  const [globalRules, setGlobalRules] = useState<string[]>([]);

  // Load data
  useEffect(() => {
    fetch("/rfp_data.json")
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        // Load saved edits from localStorage
        const saved = localStorage.getItem("rfp-edits");
        if (saved) {
          try {
            const edits = JSON.parse(saved);
            if (edits.questions) setData(edits);
          } catch {}
        }
        const savedHistory = localStorage.getItem("rfp-cell-history");
        if (savedHistory) try { setCellHistory(JSON.parse(savedHistory)); } catch {}
        const savedRules = localStorage.getItem("rfp-global-rules");
        if (savedRules) try { setGlobalRules(JSON.parse(savedRules)); } catch {}
        const savedVersions = localStorage.getItem("rfp-versions");
        if (savedVersions) try { setVersions(JSON.parse(savedVersions)); } catch {}
      })
      .catch(console.error);
  }, []);

  // Cmd+S to save
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        saveToLocal();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  });

  const saveToLocal = useCallback(() => {
    if (!data) return;
    localStorage.setItem("rfp-edits", JSON.stringify(data));
    localStorage.setItem("rfp-cell-history", JSON.stringify(cellHistory));
    localStorage.setItem("rfp-global-rules", JSON.stringify(globalRules));
    setHasUnsaved(false);
  }, [data, cellHistory, globalRules]);

  const addCellHistory = useCallback((ref: string, field: string, value: string, source: "human" | "ai") => {
    setCellHistory((prev) => {
      const key = `${ref}:${field}`;
      const existing = prev[key] || [];
      return { ...prev, [key]: [...existing, { value, timestamp: Date.now(), source }] };
    });
  }, []);

  // Update a question in the data
  const updateQuestion = useCallback((updated: Question) => {
    if (!data) return;
    setData({
      ...data,
      questions: data.questions.map((q) => (q.ref === updated.ref ? updated : q)),
    });
    setHasUnsaved(true);
    if (selectedQuestion?.ref === updated.ref) setSelectedQuestion(updated);
  }, [data, selectedQuestion]);

  // Inline cell edit from grid
  const handleCellEdit = useCallback((ref: string, field: keyof Question, value: string) => {
    if (!data) return;
    const q = data.questions.find((q) => q.ref === ref);
    if (!q) return;
    addCellHistory(ref, field, value, "human");
    updateQuestion({ ...q, [field]: value });
  }, [data, addCellHistory, updateQuestion]);

  // AI rewrite
  const handleAiRewrite = useCallback(async (question: Question, field: "bullet" | "paragraph"): Promise<string> => {
    const res = await fetch("/api/rewrite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question, field, globalRules }),
    });
    const { text, error } = await res.json();
    if (error) throw new Error(error);
    addCellHistory(question.ref, field, text, "ai");
    return text;
  }, [globalRules, addCellHistory]);

  // Save version snapshot
  const saveVersion = useCallback((label?: string) => {
    if (!data) return;
    const v = { label: label || `v${versions.length + 1}`, timestamp: Date.now(), data: JSON.parse(JSON.stringify(data)) };
    const newVersions = [...versions, v];
    setVersions(newVersions);
    localStorage.setItem("rfp-versions", JSON.stringify(newVersions));
  }, [data, versions]);

  const filteredQuestions = useMemo(() => {
    if (!data) return [];
    let qs = data.questions;
    if (activeCategory !== "All") qs = qs.filter((q) => q.category === activeCategory);
    if (search) { const s = search.toLowerCase(); qs = qs.filter((q) => q.ref.toLowerCase().includes(s) || q.topic.toLowerCase().includes(s) || q.requirement.toLowerCase().includes(s) || q.bullet.toLowerCase().includes(s) || q.paragraph.toLowerCase().includes(s)); }
    if (confidenceFilter !== "All Confidence") qs = qs.filter((q) => q.confidence === confidenceFilter);
    if (compliantFilter !== "All Compliant") qs = qs.filter((q) => q.compliant === compliantFilter);
    return qs;
  }, [data, activeCategory, search, confidenceFilter, compliantFilter]);

  // Export helpers
  const handleSave = useCallback(() => {
    saveToLocal();
    saveVersion("Auto-save");
  }, [saveToLocal, saveVersion]);

  const handleExportCSV = useCallback(() => {
    if (!data) return;
    const headers = ["#", "Reference", "Topic", "BSB Requirement", "Response (Bullet)", "Response (Paragraph)", "Confidence", "Compliant"];
    const rows = filteredQuestions.map((q) => [q.number, q.ref, q.topic, q.requirement, q.bullet, q.paragraph, q.confidence, q.compliant]);
    const csv = [headers.join(","), ...rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "rfp_export.csv"; a.click();
    URL.revokeObjectURL(url);
  }, [data, filteredQuestions]);

  const handleExportJSON = useCallback(() => {
    if (!data) return;
    const blob = new Blob([JSON.stringify(filteredQuestions, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "rfp_export.json"; a.click();
    URL.revokeObjectURL(url);
  }, [data, filteredQuestions]);

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

  if (!data) return <div className="flex items-center justify-center h-screen bg-gray-50"><div className="text-gray-500 text-lg">Loading RFP data...</div></div>;

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Header */}
      <header className="border-b px-6 py-3 flex items-center justify-between flex-shrink-0">
        <div>
          <h1 className="text-xl font-bold text-gray-900">
            BSB Credit Card RFP
            {hasUnsaved && <span className="text-xs text-orange-500 ml-2 font-normal">unsaved changes</span>}
          </h1>
          <p className="text-sm text-gray-500">Brim Financial — {data.stats.total} Questions · {data.categories.length} Categories</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => { setActiveTab("grid"); setSelectedQuestion(null); }} className={`px-4 py-1.5 rounded text-sm font-medium ${activeTab === "grid" ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>Grid</button>
          <button onClick={() => { setActiveTab("context"); setSelectedQuestion(null); }} className={`px-4 py-1.5 rounded text-sm font-medium ${activeTab === "context" ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>Context &amp; Assumptions</button>
          <button onClick={() => setShowRules(!showRules)} className={`px-4 py-1.5 rounded text-sm font-medium border ${showRules ? "border-blue-500 text-blue-600 bg-blue-50" : "border-gray-300 text-gray-700 hover:bg-gray-50"}`}>Rules</button>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <span>{data.stats.total} questions</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-green-500 inline-block" />{data.stats.green}</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-yellow-400 inline-block" />{data.stats.yellow}</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" />{data.stats.red}</span>
        </div>
      </header>

      {/* Category Tabs */}
      <div className="border-b px-6 py-2 flex gap-1 overflow-x-auto flex-shrink-0">
        {["All", ...data.categories].map((cat) => (
          <button key={cat} onClick={() => setActiveCategory(cat)} className={`px-3 py-1 rounded text-sm whitespace-nowrap ${activeCategory === cat ? "bg-blue-100 text-blue-700 font-medium" : "text-gray-600 hover:bg-gray-100"}`}>
            {cat} <span className="text-xs text-gray-400">{categoryStats[cat] || 0}</span>
          </button>
        ))}
      </div>

      {/* Filters & Actions */}
      {activeTab === "grid" && (
        <div className="px-6 py-3 border-b flex items-center gap-3 flex-shrink-0 flex-wrap">
          <input type="text" placeholder="Search questions, topics, responses..." value={search} onChange={(e) => setSearch(e.target.value)} className="border rounded px-3 py-1.5 text-sm w-80 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <select value={confidenceFilter} onChange={(e) => setConfidenceFilter(e.target.value)} className="border rounded px-3 py-1.5 text-sm text-gray-600"><option>All Confidence</option><option>GREEN</option><option>YELLOW</option><option>RED</option></select>
          <select value={compliantFilter} onChange={(e) => setCompliantFilter(e.target.value)} className="border rounded px-3 py-1.5 text-sm text-gray-600"><option>All Compliant</option><option>Y</option><option>N</option><option>Partial</option></select>
          <select value={deliveryFilter} onChange={(e) => setDeliveryFilter(e.target.value)} className="border rounded px-3 py-1.5 text-sm text-gray-600"><option>All Delivery</option><option>OOB</option><option>Config</option><option>Custom</option></select>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="border rounded px-3 py-1.5 text-sm text-gray-600"><option>All Status</option><option>Draft</option><option>Reviewed</option><option>Final</option><option>QA</option></select>
          <select value={coverageFilter} onChange={(e) => setCoverageFilter(e.target.value)} className="border rounded px-3 py-1.5 text-sm text-gray-600"><option>All Coverage</option><option>Complete</option><option>Partial</option><option>Missing</option></select>

          <div className="flex gap-2 ml-auto">
            <button onClick={handleSave} className="bg-blue-500 text-white px-3 py-1.5 rounded text-sm font-medium hover:bg-blue-600">Save</button>
            <button onClick={handleExportCSV} className="bg-orange-500 text-white px-3 py-1.5 rounded text-sm font-medium hover:bg-orange-600">Export Excel</button>
            <button onClick={handleExportJSON} className="bg-orange-400 text-white px-3 py-1.5 rounded text-sm font-medium hover:bg-orange-500">Export JSON</button>
            <button className="bg-purple-500 text-white px-3 py-1.5 rounded text-sm font-medium hover:bg-purple-600">☁ Push to Cloud</button>
            {["Draft", "Reviewed", "Final", "QA"].map((s) => (
              <button key={s} className="border border-gray-300 px-3 py-1.5 rounded text-sm font-medium text-gray-700 hover:bg-gray-50">{s}</button>
            ))}
            <button onClick={() => saveVersion()} className="border border-gray-300 px-3 py-1.5 rounded text-sm font-medium text-gray-700 hover:bg-gray-50">
              Versions{versions.length > 0 && ` (${versions.length})`}
            </button>
            <button className="bg-red-500 text-white px-3 py-1.5 rounded text-sm font-medium hover:bg-red-600">AI Rewrite ({data.stats.yellow + data.stats.red})</button>
          </div>
          <span className="text-sm text-gray-500 ml-2">{filteredQuestions.length} of {data.stats.total} shown</span>
          <button onClick={resetFilters} className="text-sm text-blue-500 hover:underline">Reset</button>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 overflow-hidden relative">
        {activeTab === "grid" && (
          <GridView
            questions={filteredQuestions}
            getConfidenceColor={getConfidenceColor}
            onSelectQuestion={setSelectedQuestion}
            onCellEdit={handleCellEdit}
          />
        )}
        {activeTab === "context" && <ContextView data={data} />}
        {showRules && <RulesPanel onClose={() => setShowRules(false)} rules={globalRules} onUpdateRules={(r) => { setGlobalRules(r); setHasUnsaved(true); }} />}
        {selectedQuestion && (
          <DetailPanel
            question={selectedQuestion}
            onClose={() => setSelectedQuestion(null)}
            onSave={(updated) => { updateQuestion(updated); addCellHistory(updated.ref, "detail-save", "", "human"); }}
            onAiRewrite={handleAiRewrite}
            cellHistory={cellHistory}
          />
        )}
      </div>

      {/* Footer */}
      <footer className="border-t px-6 py-2 text-xs text-gray-400 flex justify-between flex-shrink-0">
        <span>Cmd+S to save · Click any cell to edit · Click reference to open detail panel</span>
        <span>{feedbackCount} items with feedback</span>
      </footer>
    </div>
  );
}
