"use client";

import { useMemo, useState } from "react";
import { Printer, Download, AlertTriangle, CheckCircle, XCircle, Minus, FileText, FileSpreadsheet } from "lucide-react";
import type { Question, RFPData, KnowledgeBase, ValidationRule } from "@/types";
import { exportToWord } from "@/lib/exportWord";
import { exportToPDF } from "@/lib/exportPDF";

interface SubmissionViewProps {
  questions: Question[];
  categories: string[];
  data?: RFPData;
  knowledgeBase?: KnowledgeBase;
  globalRules?: string[];
  validationRules?: ValidationRule[];
}

type ExportMode = "full" | "responses-only" | "executive";

function ConfidenceIndicator({ value }: { value: string }) {
  if (value === "GREEN") return <CheckCircle size={12} className="text-emerald-500 inline" />;
  if (value === "YELLOW") return <AlertTriangle size={12} className="text-amber-500 inline" />;
  if (value === "RED") return <XCircle size={12} className="text-red-500 inline" />;
  return <Minus size={12} className="text-gray-300 inline" />;
}

function ComplianceBadge({ value }: { value: string }) {
  const cls = value === "Y" ? "text-emerald-700 bg-emerald-50 border-emerald-200"
    : value === "N" ? "text-red-700 bg-red-50 border-red-200"
    : "text-amber-700 bg-amber-50 border-amber-200";
  return <span className={`text-[9px] px-1.5 py-0.5 rounded border font-semibold print:border-gray-400 ${cls}`}>{value === "Y" ? "Compliant" : value === "N" ? "Non-Compliant" : "Partial"}</span>;
}

function DeliveryLabel({ q }: { q: Question }) {
  const parts: string[] = [];
  if (q.a_oob) parts.push("Out-of-Box");
  if (q.b_config) parts.push("Configuration");
  if (q.c_custom) parts.push("Custom");
  if (parts.length === 0) return null;
  return <span className="text-[9px] text-gray-500">Delivery: {parts.join(", ")}</span>;
}

export default function SubmissionView({ questions, categories, data, knowledgeBase, globalRules, validationRules }: SubmissionViewProps) {
  const exportOpts = { knowledgeBase, globalRules, validationRules };
  const [mode, setMode] = useState<ExportMode>("full");
  const [showAdvisory, setShowAdvisory] = useState(true);
  const [exporting, setExporting] = useState<string | null>(null);

  const handleWordExport = async () => {
    if (!data) return;
    setExporting("word");
    try { await exportToWord(data, exportOpts); } catch (e) { console.error(e); }
    setExporting(null);
  };

  const handlePDFExport = async () => {
    if (!data) return;
    setExporting("pdf");
    try { await exportToPDF(data, exportOpts); } catch (e) { console.error(e); }
    setExporting(null);
  };

  const grouped = useMemo(() => {
    const map: Record<string, Question[]> = {};
    for (const q of questions) {
      if (!map[q.category]) map[q.category] = [];
      map[q.category].push(q);
    }
    return map;
  }, [questions]);

  const stats = useMemo(() => {
    const green = questions.filter(q => q.confidence === "GREEN").length;
    const yellow = questions.filter(q => q.confidence === "YELLOW").length;
    const red = questions.filter(q => q.confidence === "RED").length;
    const compliantY = questions.filter(q => q.compliant === "Y").length;
    const compliantN = questions.filter(q => q.compliant === "N").length;
    const avgScore = questions.reduce((s, q) => s + (q.committee_score || 0), 0) / questions.length;
    const redQuestions = questions.filter(q => q.confidence === "RED");
    const yellowQuestions = questions.filter(q => q.confidence === "YELLOW");
    return { green, yellow, red, compliantY, compliantN, avgScore, redQuestions, yellowQuestions };
  }, [questions]);

  const catStats = useMemo(() => {
    return categories.map(cat => {
      const qs = grouped[cat] || [];
      const avg = qs.reduce((s, q) => s + (q.committee_score || 0), 0) / (qs.length || 1);
      const green = qs.filter(q => q.confidence === "GREEN").length;
      const yellow = qs.filter(q => q.confidence === "YELLOW").length;
      const red = qs.filter(q => q.confidence === "RED").length;
      return { cat, count: qs.length, avg, green, yellow, red };
    });
  }, [categories, grouped]);

  const handleExportHTML = () => {
    const content = document.getElementById("submission-content");
    if (!content) return;
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>BSB Credit Card RFP Response - Brim Financial</title>
<style>
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:800px;margin:0 auto;padding:40px;color:#1f2937;line-height:1.6;font-size:13px}
h1{font-size:24px;text-align:center;margin-bottom:4px}
h2{font-size:18px;border-bottom:2px solid #d1d5db;padding-bottom:8px;margin-top:32px;page-break-after:avoid}
h3{font-size:14px;margin-top:16px;color:#374151}
.subtitle{text-align:center;color:#6b7280;font-size:14px}
.date{text-align:center;color:#9ca3af;font-size:12px;margin-top:12px}
.question{margin-bottom:24px;page-break-inside:avoid}
.ref{font-family:monospace;font-size:11px;color:#6b7280}
.topic{font-size:11px;color:#9ca3af}
.requirement{background:#f9fafb;padding:10px 14px;border-radius:6px;font-size:12px;color:#4b5563;margin:6px 0}
.response{font-size:13px;color:#1f2937;white-space:pre-wrap;line-height:1.7}
.meta{display:flex;gap:12px;font-size:10px;color:#9ca3af;margin-top:4px}
.badge{font-size:9px;padding:2px 6px;border-radius:3px;border:1px solid}
.green{color:#047857;background:#ecfdf5;border-color:#a7f3d0}
.yellow{color:#b45309;background:#fffbeb;border-color:#fde68a}
.red{color:#b91c1c;background:#fef2f2;border-color:#fecaca}
.advisory{background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:16px;margin:16px 0;font-size:12px}
.advisory h4{color:#1e40af;margin:0 0 8px}
.risk-table{width:100%;border-collapse:collapse;font-size:11px;margin:12px 0}
.risk-table th,.risk-table td{border:1px solid #e5e7eb;padding:6px 10px;text-align:left}
.risk-table th{background:#f3f4f6;font-weight:600}
.stats-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin:16px 0}
.stat-card{text-align:center;padding:12px;border:1px solid #e5e7eb;border-radius:6px}
.stat-num{font-size:24px;font-weight:700}
.stat-label{font-size:10px;color:#6b7280;margin-top:4px}
@media print{body{padding:20px;font-size:12px}h2{page-break-before:always}.question{page-break-inside:avoid}}
</style></head><body>${content.innerHTML}</body></html>`;
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "BSB_RFP_Response_Brim_Financial.html";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="overflow-auto h-full bg-white dark:bg-gray-950">
      {/* Toolbar */}
      <div className="print:hidden sticky top-0 bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between z-10">
        <div>
          <h2 className="text-sm font-semibold">Submission Preview</h2>
          <p className="text-xs text-gray-400">Formatted for print / PDF export</p>
        </div>
        <div className="flex items-center gap-2">
          <select value={mode} onChange={e => setMode(e.target.value as ExportMode)}
            className="border border-gray-200 dark:border-gray-700 rounded-lg px-2.5 py-1.5 text-xs bg-white dark:bg-gray-800">
            <option value="full">Full (with advisory notes)</option>
            <option value="responses-only">Responses Only (clean)</option>
            <option value="executive">Executive Summary Only</option>
          </select>
          <label className="flex items-center gap-1.5 text-xs text-gray-500">
            <input type="checkbox" checked={showAdvisory} onChange={e => setShowAdvisory(e.target.checked)} className="rounded" />
            Show advisory
          </label>
          <button onClick={handlePDFExport} disabled={exporting === "pdf"}
            className="flex items-center gap-1.5 bg-red-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-red-700 disabled:opacity-50">
            <FileText size={13} /> {exporting === "pdf" ? "Exporting..." : "PDF"}
          </button>
          <button onClick={handleWordExport} disabled={exporting === "word"}
            className="flex items-center gap-1.5 bg-blue-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-blue-700 disabled:opacity-50">
            <FileSpreadsheet size={13} /> {exporting === "word" ? "Exporting..." : "Word (.docx)"}
          </button>
          <button onClick={handleExportHTML}
            className="flex items-center gap-1.5 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-gray-50 dark:hover:bg-gray-800">
            <Download size={13} /> HTML
          </button>
          <button onClick={() => window.print()}
            className="flex items-center gap-1.5 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-gray-50 dark:hover:bg-gray-800">
            <Printer size={13} /> Print
          </button>
        </div>
      </div>

      <div id="submission-content" className="max-w-[800px] mx-auto px-10 py-12 print:px-6 print:py-4 print:max-w-none text-[13px] leading-relaxed">
        {/* === COVER PAGE === */}
        <div className="text-center mb-20 print:mb-16">
          <div className="text-[10px] uppercase tracking-[0.3em] text-gray-400 mb-6">Confidential</div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">BSB Credit Card Program</h1>
          <h2 className="text-xl text-gray-500 dark:text-gray-400 font-normal border-0 mb-8">Request for Proposal Response</h2>
          <div className="w-16 h-0.5 bg-blue-600 mx-auto mb-8" />
          <p className="text-base text-gray-600 dark:text-gray-400">Prepared by <strong>Brim Financial</strong></p>
          <p className="text-sm text-gray-400 mt-6">{new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>
          <p className="text-xs text-gray-400 mt-2">{questions.length} Requirements Addressed · {categories.length} Categories</p>
        </div>

        {/* === EXECUTIVE OVERVIEW === */}
        {(mode === "full" || mode === "executive") && (
          <div className="mb-16 print:break-before-page">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white border-b-2 border-gray-900 dark:border-gray-100 pb-2 mb-6">Executive Overview</h2>

            <div className="stats-grid grid grid-cols-4 gap-3 mb-6">
              {[
                { num: stats.green, label: "Strong (GREEN)", cls: "text-emerald-600" },
                { num: stats.yellow, label: "Needs Strengthening", cls: "text-amber-600" },
                { num: stats.red, label: "Gaps / Risks", cls: "text-red-600" },
                { num: stats.avgScore.toFixed(1), label: "Avg Committee Score", cls: "text-gray-900 dark:text-white" },
              ].map((s, i) => (
                <div key={i} className="text-center p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <div className={`text-2xl font-bold ${s.cls}`}>{s.num}</div>
                  <div className="text-[10px] text-gray-500 mt-1">{s.label}</div>
                </div>
              ))}
            </div>

            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              Brim Financial is pleased to present our comprehensive response to Bangor Savings Bank&#39;s Credit Card Program RFP.
              Of the {questions.length} requirements, {stats.compliantY} ({Math.round((stats.compliantY / questions.length) * 100)}%) are fully compliant,
              with {stats.green} responses rated GREEN by our internal review committee.
            </p>

            {showAdvisory && stats.red > 0 && (
              <div className="advisory bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
                <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-2">Advisory: {stats.red} Critical Gaps Identified</h4>
                <p className="text-xs text-blue-700 dark:text-blue-400 mb-3">
                  The following requirements have been flagged RED and may require strategic positioning or partnership solutions:
                </p>
                <table className="risk-table w-full text-xs border-collapse">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-800">
                      <th className="border border-gray-200 dark:border-gray-700 px-3 py-1.5 text-left font-semibold">Ref</th>
                      <th className="border border-gray-200 dark:border-gray-700 px-3 py-1.5 text-left font-semibold">Topic</th>
                      <th className="border border-gray-200 dark:border-gray-700 px-3 py-1.5 text-left font-semibold">Score</th>
                      <th className="border border-gray-200 dark:border-gray-700 px-3 py-1.5 text-left font-semibold">Issue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.redQuestions.map(q => (
                      <tr key={q.ref}>
                        <td className="border border-gray-200 dark:border-gray-700 px-3 py-1.5 font-mono">{q.ref}</td>
                        <td className="border border-gray-200 dark:border-gray-700 px-3 py-1.5">{q.topic}</td>
                        <td className="border border-gray-200 dark:border-gray-700 px-3 py-1.5 text-red-600 font-bold">{q.committee_score}/10</td>
                        <td className="border border-gray-200 dark:border-gray-700 px-3 py-1.5 text-gray-600 dark:text-gray-400">{q.compliant === "N" ? "Non-compliant" : "Partial compliance"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Category scorecard */}
            <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3 mt-8">Category Performance</h3>
            <table className="w-full text-xs border-collapse mb-8">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-800">
                  <th className="border border-gray-200 dark:border-gray-700 px-3 py-2 text-left font-semibold">Category</th>
                  <th className="border border-gray-200 dark:border-gray-700 px-3 py-2 text-center font-semibold">Questions</th>
                  <th className="border border-gray-200 dark:border-gray-700 px-3 py-2 text-center font-semibold">Avg Score</th>
                  <th className="border border-gray-200 dark:border-gray-700 px-3 py-2 text-center font-semibold">GREEN</th>
                  <th className="border border-gray-200 dark:border-gray-700 px-3 py-2 text-center font-semibold">YELLOW</th>
                  <th className="border border-gray-200 dark:border-gray-700 px-3 py-2 text-center font-semibold">RED</th>
                </tr>
              </thead>
              <tbody>
                {catStats.map(s => (
                  <tr key={s.cat}>
                    <td className="border border-gray-200 dark:border-gray-700 px-3 py-1.5 font-medium">{s.cat}</td>
                    <td className="border border-gray-200 dark:border-gray-700 px-3 py-1.5 text-center">{s.count}</td>
                    <td className={`border border-gray-200 dark:border-gray-700 px-3 py-1.5 text-center font-bold ${s.avg >= 7 ? "text-emerald-600" : s.avg >= 5 ? "text-amber-600" : "text-red-600"}`}>{s.avg.toFixed(1)}</td>
                    <td className="border border-gray-200 dark:border-gray-700 px-3 py-1.5 text-center text-emerald-600">{s.green}</td>
                    <td className="border border-gray-200 dark:border-gray-700 px-3 py-1.5 text-center text-amber-600">{s.yellow}</td>
                    <td className="border border-gray-200 dark:border-gray-700 px-3 py-1.5 text-center text-red-600">{s.red}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {mode === "executive" && (
          <div className="text-center py-20 text-gray-400">
            <p className="text-sm">Executive summary mode — full responses not included.</p>
            <p className="text-xs mt-2">Switch to &quot;Full&quot; or &quot;Responses Only&quot; for complete content.</p>
          </div>
        )}

        {/* === TABLE OF CONTENTS === */}
        {mode !== "executive" && (
          <div className="mb-12 print:break-before-page">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white border-b-2 border-gray-900 dark:border-gray-100 pb-2 mb-4">Table of Contents</h2>
            <ol className="space-y-2">
              {categories.map((cat, i) => {
                const count = grouped[cat]?.length || 0;
                const cs = catStats[i];
                return (
                  <li key={cat} className="flex items-center justify-between text-sm border-b border-dotted border-gray-200 dark:border-gray-700 pb-1">
                    <span className="text-gray-700 dark:text-gray-300">{i + 1}. {cat}</span>
                    <span className="text-xs text-gray-400 flex items-center gap-2">
                      <span>{count} questions</span>
                      <span className="font-mono">{cs?.avg.toFixed(1)}/10</span>
                    </span>
                  </li>
                );
              })}
            </ol>
          </div>
        )}

        {/* === RESPONSES BY CATEGORY === */}
        {mode !== "executive" && categories.map((cat, catIdx) => {
          const catQs = grouped[cat];
          if (!catQs || catQs.length === 0) return null;
          const cs = catStats[catIdx];

          return (
            <div key={cat} className="mb-16 print:break-before-page">
              {/* Category header */}
              <div className="mb-8">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white border-b-2 border-gray-300 dark:border-gray-600 pb-2 mb-2">
                  {catIdx + 1}. {cat}
                </h2>
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <span>{cs?.count} questions</span>
                  <span>Avg Score: <strong className={cs?.avg >= 7 ? "text-emerald-600" : cs?.avg >= 5 ? "text-amber-600" : "text-red-600"}>{cs?.avg.toFixed(1)}/10</strong></span>
                  <span className="text-emerald-600">{cs?.green} GREEN</span>
                  {(cs?.yellow || 0) > 0 && <span className="text-amber-600">{cs?.yellow} YELLOW</span>}
                  {(cs?.red || 0) > 0 && <span className="text-red-600">{cs?.red} RED</span>}
                </div>
              </div>

              {/* Questions */}
              {catQs.map((q) => (
                <div key={q.ref} className="question mb-10 print:break-inside-avoid">
                  {/* Question header */}
                  <div className="flex items-center gap-3 mb-2">
                    <span className="ref font-mono text-xs text-gray-400">{q.ref}</span>
                    <span className="topic text-xs text-gray-500">{q.topic}</span>
                    <span className="ml-auto flex items-center gap-2">
                      <ConfidenceIndicator value={q.confidence} />
                      <ComplianceBadge value={q.compliant} />
                      <DeliveryLabel q={q} />
                    </span>
                  </div>

                  {/* Requirement */}
                  <div className="requirement bg-gray-50 dark:bg-gray-800 rounded-lg px-4 py-3 mb-3 border-l-3 border-l-gray-300 dark:border-l-gray-600">
                    <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">BSB Requirement</div>
                    <p className="text-[12px] text-gray-600 dark:text-gray-400 leading-relaxed">{q.requirement}</p>
                  </div>

                  {/* Response */}
                  <div className="mb-2">
                    <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Brim Financial Response</div>
                    <div className="response text-[13px] text-gray-800 dark:text-gray-200 leading-[1.75] whitespace-pre-wrap">
                      {q.paragraph || q.bullet || <span className="text-gray-300 italic">No response provided</span>}
                    </div>
                  </div>

                  {/* Advisory notes (only in full mode) */}
                  {mode === "full" && showAdvisory && (
                    <div className="mt-3 space-y-1.5">
                      {q.confidence === "RED" && (
                        <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded px-3 py-2 text-xs text-red-700 dark:text-red-400">
                          <strong>Risk:</strong> {q.committee_risk || "High risk — response needs significant strengthening"}
                        </div>
                      )}
                      {q.confidence === "YELLOW" && q.committee_review && (
                        <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded px-3 py-2 text-xs text-amber-700 dark:text-amber-400">
                          <strong>Note:</strong> {q.committee_review.slice(0, 200)}
                        </div>
                      )}
                      {q.rationale && (
                        <div className="text-[11px] text-gray-500 dark:text-gray-400 italic">
                          {q.rationale.slice(0, 200)}{q.rationale.length > 200 ? "..." : ""}
                        </div>
                      )}
                      {q.pricing && (
                        <div className="text-[11px] text-gray-500 dark:text-gray-400">
                          <strong>Pricing:</strong> {q.pricing}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Score bar */}
                  <div className="flex items-center gap-2 mt-2 pt-2 border-t border-gray-100 dark:border-gray-800">
                    <span className="text-[10px] text-gray-400">Committee Score:</span>
                    <div className="flex-1 h-1 bg-gray-100 dark:bg-gray-700 rounded-full max-w-[100px]">
                      <div className={`h-1 rounded-full ${q.committee_score >= 7 ? "bg-emerald-500" : q.committee_score >= 5 ? "bg-amber-500" : "bg-red-500"}`}
                        style={{ width: `${q.committee_score * 10}%` }} />
                    </div>
                    <span className={`text-[10px] font-bold ${q.committee_score >= 7 ? "text-emerald-600" : q.committee_score >= 5 ? "text-amber-600" : "text-red-600"}`}>
                      {q.committee_score}/10
                    </span>
                  </div>
                </div>
              ))}
            </div>
          );
        })}

        {/* === FOOTER === */}
        <div className="text-center pt-12 mt-12 border-t border-gray-200 dark:border-gray-700 print:break-before-page">
          <p className="text-xs text-gray-400">This document is confidential and prepared solely for Bangor Savings Bank.</p>
          <p className="text-xs text-gray-400 mt-1">Brim Financial · {new Date().getFullYear()}</p>
        </div>
      </div>
    </div>
  );
}
