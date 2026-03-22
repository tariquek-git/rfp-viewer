"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import type { RFPData, Question, ViewTab } from "@/types";
import GridView from "@/components/GridView";
import ContextView from "@/components/ContextView";
import RulesPanel from "@/components/RulesPanel";

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

  useEffect(() => {
    fetch("/rfp_data.json")
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(console.error);
  }, []);

  const filteredQuestions = useMemo(() => {
    if (!data) return [];
    let qs = data.questions;

    if (activeCategory !== "All") {
      qs = qs.filter((q) => q.category === activeCategory);
    }
    if (search) {
      const s = search.toLowerCase();
      qs = qs.filter(
        (q) =>
          q.ref.toLowerCase().includes(s) ||
          q.topic.toLowerCase().includes(s) ||
          q.requirement.toLowerCase().includes(s) ||
          q.bullet.toLowerCase().includes(s) ||
          q.paragraph.toLowerCase().includes(s)
      );
    }
    if (confidenceFilter !== "All Confidence") {
      qs = qs.filter((q) => q.confidence === confidenceFilter);
    }
    if (compliantFilter !== "All Compliant") {
      qs = qs.filter((q) => q.compliant === compliantFilter);
    }
    return qs;
  }, [data, activeCategory, search, confidenceFilter, compliantFilter]);

  const categoryStats = useMemo(() => {
    if (!data) return {};
    const stats: Record<string, number> = { All: data.questions.length };
    for (const q of data.questions) {
      stats[q.category] = (stats[q.category] || 0) + 1;
    }
    return stats;
  }, [data]);

  const getConfidenceColor = useCallback((conf: string) => {
    if (conf === "GREEN" || conf === "High") return "bg-green-500";
    if (conf === "YELLOW" || conf === "Medium") return "bg-yellow-400";
    if (conf === "RED" || conf === "Low") return "bg-red-500";
    return "bg-gray-300";
  }, []);

  const handleSave = useCallback(() => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "rfp_workbook_saved.json";
    a.click();
    URL.revokeObjectURL(url);
  }, [data]);

  const handleExportCSV = useCallback(() => {
    if (!data) return;
    const headers = ["#", "Reference", "Topic", "BSB Requirement", "Response (Bullet)", "Response (Paragraph)", "Confidence", "Compliant"];
    const rows = filteredQuestions.map((q) => [
      q.number, q.ref, q.topic, q.requirement, q.bullet, q.paragraph, q.confidence, q.compliant,
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "rfp_export.csv";
    a.click();
    URL.revokeObjectURL(url);
  }, [data, filteredQuestions]);

  const handleExportJSON = useCallback(() => {
    if (!data) return;
    const blob = new Blob([JSON.stringify(filteredQuestions, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "rfp_export.json";
    a.click();
    URL.revokeObjectURL(url);
  }, [data, filteredQuestions]);

  const resetFilters = useCallback(() => {
    setSearch("");
    setConfidenceFilter("All Confidence");
    setCompliantFilter("All Compliant");
    setDeliveryFilter("All Delivery");
    setStatusFilter("All Status");
    setCoverageFilter("All Coverage");
    setActiveCategory("All");
  }, []);

  if (!data) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-gray-500 text-lg">Loading RFP data...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Header */}
      <header className="border-b px-6 py-3 flex items-center justify-between flex-shrink-0">
        <div>
          <h1 className="text-xl font-bold text-gray-900">BSB Credit Card RFP</h1>
          <p className="text-sm text-gray-500">
            Brim Financial — {data.stats.total} Questions · {data.categories.length} Categories
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setActiveTab("grid")} className={`px-4 py-1.5 rounded text-sm font-medium ${activeTab === "grid" ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>
            Grid
          </button>
          <button onClick={() => setActiveTab("context")} className={`px-4 py-1.5 rounded text-sm font-medium ${activeTab === "context" ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>
            Context &amp; Assumptions
          </button>
          <button onClick={() => setShowRules(!showRules)} className={`px-4 py-1.5 rounded text-sm font-medium border ${showRules ? "border-blue-500 text-blue-600 bg-blue-50" : "border-gray-300 text-gray-700 hover:bg-gray-50"}`}>
            Rules
          </button>
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

      {/* Filters & Actions (Grid view only) */}
      {activeTab === "grid" && (
        <div className="px-6 py-3 border-b flex items-center gap-3 flex-shrink-0 flex-wrap">
          <input type="text" placeholder="Search questions, topics, responses..." value={search} onChange={(e) => setSearch(e.target.value)} className="border rounded px-3 py-1.5 text-sm w-80 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <select value={confidenceFilter} onChange={(e) => setConfidenceFilter(e.target.value)} className="border rounded px-3 py-1.5 text-sm text-gray-600">
            <option>All Confidence</option><option>GREEN</option><option>YELLOW</option><option>RED</option>
          </select>
          <select value={compliantFilter} onChange={(e) => setCompliantFilter(e.target.value)} className="border rounded px-3 py-1.5 text-sm text-gray-600">
            <option>All Compliant</option><option>Y</option><option>N</option><option>Partial</option>
          </select>
          <select value={deliveryFilter} onChange={(e) => setDeliveryFilter(e.target.value)} className="border rounded px-3 py-1.5 text-sm text-gray-600">
            <option>All Delivery</option><option>OOB</option><option>Config</option><option>Custom</option>
          </select>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="border rounded px-3 py-1.5 text-sm text-gray-600">
            <option>All Status</option><option>Draft</option><option>Reviewed</option><option>Final</option><option>QA</option>
          </select>
          <select value={coverageFilter} onChange={(e) => setCoverageFilter(e.target.value)} className="border rounded px-3 py-1.5 text-sm text-gray-600">
            <option>All Coverage</option><option>Complete</option><option>Partial</option><option>Missing</option>
          </select>

          <div className="flex gap-2 ml-auto">
            <button onClick={handleSave} className="bg-blue-500 text-white px-3 py-1.5 rounded text-sm font-medium hover:bg-blue-600">Save</button>
            <button className="bg-green-500 text-white px-3 py-1.5 rounded text-sm font-medium hover:bg-green-600">Feedback on All</button>
            <button onClick={handleExportCSV} className="bg-orange-500 text-white px-3 py-1.5 rounded text-sm font-medium hover:bg-orange-600">Export Excel</button>
            <button onClick={handleExportJSON} className="bg-orange-400 text-white px-3 py-1.5 rounded text-sm font-medium hover:bg-orange-500">Export JSON</button>
            <button className="bg-purple-500 text-white px-3 py-1.5 rounded text-sm font-medium hover:bg-purple-600">☁ Push to Cloud</button>
            {["Draft", "Reviewed", "Final", "QA"].map((s) => (
              <button key={s} className="border border-gray-300 px-3 py-1.5 rounded text-sm font-medium text-gray-700 hover:bg-gray-50">{s}</button>
            ))}
            <button className="border border-gray-300 px-3 py-1.5 rounded text-sm font-medium text-gray-700 hover:bg-gray-50">Versions</button>
            <button className="bg-red-500 text-white px-3 py-1.5 rounded text-sm font-medium hover:bg-red-600">AI Rewrite ({data.stats.yellow + data.stats.red})</button>
          </div>
          <span className="text-sm text-gray-500 ml-2">{filteredQuestions.length} of {data.stats.total} shown</span>
          <button onClick={resetFilters} className="text-sm text-blue-500 hover:underline">Reset</button>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 overflow-hidden relative">
        {activeTab === "grid" && <GridView questions={filteredQuestions} getConfidenceColor={getConfidenceColor} />}
        {activeTab === "context" && <ContextView data={data} />}
        {showRules && <RulesPanel onClose={() => setShowRules(false)} />}
      </div>

      {/* Footer */}
      <footer className="border-t px-6 py-2 text-xs text-gray-400 flex justify-between flex-shrink-0">
        <span>Cmd+S to save · Click any cell to edit · Click reference to open detail panel</span>
        <span>0 items with feedback</span>
      </footer>
    </div>
  );
}
