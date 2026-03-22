"use client";

import { useState, useEffect } from "react";
import type { Question } from "@/types";
import FeedbackPanel from "./FeedbackPanel";
import type { FeedbackItem } from "./FeedbackPanel";

interface DetailPanelProps {
  question: Question;
  onClose: () => void;
  onSave: (updated: Question) => void;
  onAiRewrite: (question: Question, field: "bullet" | "paragraph", rowRules: string, feedback: FeedbackItem[]) => Promise<string>;
  cellHistory: Record<string, { value: string; timestamp: number; source: string }[]>;
  feedbackItems: FeedbackItem[];
  onAddFeedback: (ref: string, field: string, comment: string) => void;
  onResolveFeedback: (ref: string, timestamp: number) => void;
}

function FieldBlock({ label, value, editable, onChange, rows = 4, historyCount, history }: {
  label: string; value: string; editable?: boolean; onChange?: (val: string) => void; rows?: number; historyCount?: number;
  history?: { value: string; timestamp: number; source: string }[];
}) {
  const [showHistory, setShowHistory] = useState(false);
  return (
    <div className="mb-4">
      <div className="flex items-center justify-between">
        {label && <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">{label}</label>}
        {historyCount !== undefined && historyCount > 0 && (
          <button onClick={() => setShowHistory(!showHistory)} className="text-xs text-gray-400 hover:text-blue-500">
            {showHistory ? "hide" : `${historyCount} edits`}
          </button>
        )}
      </div>
      {showHistory && history && (
        <div className="mb-2 border rounded bg-gray-50 p-2 max-h-40 overflow-auto">
          {history.slice().reverse().map((h, i) => (
            <div key={i} className="text-xs border-b last:border-0 py-1">
              <span className={`font-medium ${h.source === "ai" ? "text-purple-600" : "text-blue-600"}`}>
                {h.source === "ai" ? "AI" : "Human"}
              </span>
              <span className="text-gray-400 ml-2">{new Date(h.timestamp).toLocaleString()}</span>
              <div className="text-gray-600 mt-0.5 truncate">{h.value.slice(0, 100)}...</div>
            </div>
          ))}
        </div>
      )}
      {editable ? (
        <textarea value={value || ""} onChange={(e) => onChange?.(e.target.value)} rows={rows}
          className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y" />
      ) : (
        <div className="text-sm text-gray-700 whitespace-pre-wrap bg-gray-50 rounded px-3 py-2 min-h-[2rem]">
          {value || <span className="text-gray-300 italic">—</span>}
        </div>
      )}
    </div>
  );
}

export default function DetailPanel({ question, onClose, onSave, onAiRewrite, cellHistory, feedbackItems, onAddFeedback, onResolveFeedback }: DetailPanelProps) {
  const [q, setQ] = useState<Question>({ ...question });
  const [rewritingBullet, setRewritingBullet] = useState(false);
  const [rewritingParagraph, setRewritingParagraph] = useState(false);
  const [rowRules, setRowRules] = useState("");
  const [dirty, setDirty] = useState(false);

  useEffect(() => { setQ({ ...question }); setDirty(false); }, [question]);

  const update = (field: keyof Question, value: string | boolean | number) => {
    setQ({ ...q, [field]: value } as Question);
    setDirty(true);
  };

  const handleRewrite = async (field: "bullet" | "paragraph") => {
    const setLoading = field === "bullet" ? setRewritingBullet : setRewritingParagraph;
    setLoading(true);
    try {
      const myFeedback = feedbackItems.filter(f => f.ref === q.ref && !f.resolved);
      const result = await onAiRewrite(q, field, rowRules, myFeedback);
      update(field, result);
    } catch (e) { console.error("AI rewrite failed:", e); }
    setLoading(false);
  };

  const confClass = q.confidence === "GREEN" ? "text-green-600 bg-green-50 border-green-200" :
    q.confidence === "YELLOW" ? "text-yellow-600 bg-yellow-50 border-yellow-200" :
    q.confidence === "RED" ? "text-red-600 bg-red-50 border-red-200" : "text-gray-600";

  const historyFor = (field: string) => cellHistory[`${q.ref}:${field}`] || [];

  return (
    <div className="absolute right-0 top-0 bottom-0 w-[600px] bg-white border-l shadow-xl z-30 flex flex-col panel-slide-in">
      <div className="flex items-center justify-between px-6 py-4 border-b flex-shrink-0">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">{q.ref}</h2>
          <p className="text-sm text-gray-500">{q.category} · {q.topic}</p>
        </div>
        <div className="flex items-center gap-2">
          {dirty && <button onClick={() => { onSave(q); setDirty(false); }} className="bg-blue-500 text-white px-3 py-1.5 rounded text-sm font-medium hover:bg-blue-600">Save</button>}
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
        </div>
      </div>

      <div className="px-6 py-3 border-b flex items-center gap-2 flex-shrink-0 flex-wrap">
        <span className={`text-xs px-2 py-1 rounded border font-medium ${confClass}`}>{q.confidence}</span>
        <span className="text-xs px-2 py-1 rounded border border-gray-200 font-medium">Compliant: {q.compliant}</span>
        {q.a_oob && <span className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-700 font-medium">OOB</span>}
        {q.b_config && <span className="text-xs px-2 py-1 rounded bg-purple-100 text-purple-700 font-medium">CFG</span>}
        {q.c_custom && <span className="text-xs px-2 py-1 rounded bg-orange-100 text-orange-700 font-medium">Custom</span>}
        {q.strategic && <span className="text-xs px-2 py-1 rounded bg-indigo-100 text-indigo-700 font-medium">Strategic</span>}
        {q.reg_enable && <span className="text-xs px-2 py-1 rounded bg-teal-100 text-teal-700 font-medium">Reg Enable</span>}
        <span className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-600 font-medium ml-auto">Score: {q.committee_score}/10</span>
      </div>

      <div className="flex-1 overflow-auto px-6 py-4 space-y-1">
        <FieldBlock label="BSB Requirement" value={q.requirement} />

        {/* Bullet response with AI rewrite */}
        <div className="flex items-center justify-between mb-1">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Response (Bullet)</label>
          <div className="flex items-center gap-3">
            {historyFor("bullet").length > 0 && <span className="text-xs text-gray-400">{historyFor("bullet").length} edits</span>}
            <button onClick={() => handleRewrite("bullet")} disabled={rewritingBullet}
              className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded hover:bg-purple-200 disabled:opacity-50 font-medium">
              {rewritingBullet ? "Rewriting..." : "✨ AI Rewrite"}
            </button>
          </div>
        </div>
        <FieldBlock label="" value={q.bullet} editable onChange={(v) => update("bullet", v)} rows={6}
          historyCount={historyFor("bullet").length} history={historyFor("bullet")} />

        {/* Paragraph response with AI rewrite */}
        <div className="flex items-center justify-between mb-1">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Response (Paragraph)</label>
          <div className="flex items-center gap-3">
            {historyFor("paragraph").length > 0 && <span className="text-xs text-gray-400">{historyFor("paragraph").length} edits</span>}
            <button onClick={() => handleRewrite("paragraph")} disabled={rewritingParagraph}
              className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded hover:bg-purple-200 disabled:opacity-50 font-medium">
              {rewritingParagraph ? "Rewriting..." : "✨ AI Rewrite"}
            </button>
          </div>
        </div>
        <FieldBlock label="" value={q.paragraph} editable onChange={(v) => update("paragraph", v)} rows={6}
          historyCount={historyFor("paragraph").length} history={historyFor("paragraph")} />

        <FieldBlock label="Rationale" value={q.rationale} editable onChange={(v) => update("rationale", v)} rows={3}
          historyCount={historyFor("rationale").length} history={historyFor("rationale")} />
        <FieldBlock label="Notes" value={q.notes} editable onChange={(v) => update("notes", v)} rows={3}
          historyCount={historyFor("notes").length} history={historyFor("notes")} />
        <FieldBlock label="Pricing" value={q.pricing} editable onChange={(v) => update("pricing", v)} rows={2} />
        <FieldBlock label="Capability" value={q.capability} />
        <FieldBlock label="Availability" value={q.availability} />

        <div className="border-t pt-4 mt-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Committee Review</h3>
          <FieldBlock label="Review" value={q.committee_review} />
          <FieldBlock label="Risk Assessment" value={q.committee_risk} />
          <div className="flex items-center gap-2 mb-4">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Score</label>
            <input type="number" min={1} max={10} value={q.committee_score} onChange={(e) => update("committee_score", Number(e.target.value))}
              className="w-16 border rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <span className="text-xs text-gray-400">/10</span>
          </div>
        </div>

        {/* Row Rules - directions for AI */}
        <div className="border-t pt-4 mt-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-1">Row Rules</h3>
          <p className="text-xs text-gray-400 mb-2">Give the AI direction for this specific question. These rules + global rules + your feedback all guide the rewrite.</p>
          <textarea value={rowRules} onChange={(e) => setRowRules(e.target.value)}
            placeholder="e.g. Emphasize Brim's 8 FI launches in the last 18 months. Mention mobile-first approach. Avoid generic statements."
            rows={3} className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y" />
        </div>

        {/* Feedback */}
        <FeedbackPanel
          question={q}
          feedbackItems={feedbackItems}
          onAddFeedback={onAddFeedback}
          onResolveFeedback={onResolveFeedback}
        />
      </div>
    </div>
  );
}
