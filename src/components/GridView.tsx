"use client";

import { useState } from "react";
import { FileText, Circle } from "lucide-react";
import type { Question } from "@/types";

interface GridViewProps {
  questions: Question[];
  getConfidenceColor: (conf: string) => string;
  onSelectQuestion: (q: Question) => void;
  onCellEdit: (ref: string, field: keyof Question, value: string) => void;
}

function EditableCell({ value, onSave, maxLen = 200 }: { value: string; onSave: (val: string) => void; maxLen?: number }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [expanded, setExpanded] = useState(false);

  if (editing) {
    return (
      <textarea autoFocus value={draft} onChange={(e) => setDraft(e.target.value)}
        onBlur={() => { if (draft !== value) onSave(draft); setEditing(false); }}
        onKeyDown={(e) => { if (e.key === "Escape") { setDraft(value); setEditing(false); } }}
        rows={4}
        className="w-full border-2 border-blue-400 rounded-md px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-y bg-white shadow-inner"
      />
    );
  }

  if (!value) return <span className="text-gray-300 italic cursor-pointer hover:text-blue-400" onClick={() => { setDraft(""); setEditing(true); }}>click to add</span>;

  const truncated = value.length > maxLen && !expanded;
  return (
    <div className="cursor-pointer group" onClick={() => { setDraft(value); setEditing(true); }}>
      <span className="group-hover:bg-blue-50 group-hover:outline group-hover:outline-1 group-hover:outline-blue-200 rounded px-0.5 -mx-0.5 leading-relaxed">
        {truncated ? value.slice(0, maxLen) + " ..." : value}
      </span>
      {value.length > maxLen && (
        <button onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
          className="text-blue-500 text-xs ml-1 hover:underline font-medium">
          {expanded ? "less" : "more"}
        </button>
      )}
    </div>
  );
}

function DeliveryBadge({ label, active }: { label: string; active: boolean }) {
  if (!active) return null;
  const colors: Record<string, string> = {
    OOB: "bg-sky-50 text-sky-700 border-sky-200",
    CFG: "bg-violet-50 text-violet-700 border-violet-200",
    Custom: "bg-amber-50 text-amber-700 border-amber-200",
  };
  return <span className={`text-[10px] px-1.5 py-0.5 rounded border font-semibold uppercase tracking-wide ${colors[label] || "bg-gray-50 text-gray-600 border-gray-200"}`}>{label}</span>;
}

function ConfidenceDot({ confidence }: { confidence: string }) {
  const color = confidence === "GREEN" ? "text-emerald-500" : confidence === "YELLOW" ? "text-amber-400" : confidence === "RED" ? "text-red-500" : "text-gray-300";
  return <Circle size={8} fill="currentColor" className={`${color} flex-shrink-0`} />;
}

export default function GridView({ questions, getConfidenceColor, onSelectQuestion, onCellEdit }: GridViewProps) {
  if (questions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-3">
        <FileText size={48} strokeWidth={1} />
        <p className="text-lg font-medium">No questions match your filters</p>
        <p className="text-sm">Try adjusting your search or filter criteria</p>
      </div>
    );
  }

  return (
    <div className="overflow-auto h-full">
      <table className="w-full text-sm border-collapse">
        <thead className="bg-gray-50/80 backdrop-blur-sm sticky top-0 z-10 border-b">
          <tr>
            <th className="text-left px-3 py-2.5 font-semibold text-gray-500 text-xs uppercase tracking-wider w-10">#</th>
            <th className="text-left px-3 py-2.5 font-semibold text-gray-500 text-xs uppercase tracking-wider w-40">Reference</th>
            <th className="text-left px-3 py-2.5 font-semibold text-gray-500 text-xs uppercase tracking-wider w-40">Topic</th>
            <th className="text-left px-3 py-2.5 font-semibold text-gray-500 text-xs uppercase tracking-wider min-w-[280px]">BSB Requirement</th>
            <th className="text-left px-3 py-2.5 font-semibold text-gray-500 text-xs uppercase tracking-wider min-w-[280px]">Response (Bullet)</th>
            <th className="text-left px-3 py-2.5 font-semibold text-gray-500 text-xs uppercase tracking-wider min-w-[280px]">Response (Paragraph)</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {questions.map((q, i) => {
            const rowBg = q.confidence === "RED" ? "bg-red-50/50" : q.confidence === "YELLOW" ? "bg-amber-50/30" : i % 2 === 0 ? "bg-white" : "bg-gray-50/30";
            return (
              <tr key={q.ref} className={`${rowBg} hover:bg-blue-50/60 group`}>
                <td className="px-3 py-3 text-gray-300 align-top font-mono text-xs">
                  <div className="flex items-center gap-2">
                    <ConfidenceDot confidence={q.confidence} />
                    {q.number}
                  </div>
                </td>
                <td className="px-3 py-3 align-top">
                  <button onClick={() => onSelectQuestion(q)} className="text-blue-600 hover:text-blue-800 hover:underline font-semibold text-left text-[13px]">
                    {q.ref}
                  </button>
                  <div className="flex gap-1 mt-1.5 flex-wrap">
                    <DeliveryBadge label="OOB" active={q.a_oob} />
                    <DeliveryBadge label="CFG" active={q.b_config} />
                    <DeliveryBadge label="Custom" active={q.c_custom} />
                  </div>
                  {q.strategic && <div className="w-1.5 h-1.5 rounded-full bg-violet-500 mt-1.5" title="Strategic Positioning" />}
                </td>
                <td className="px-3 py-3 text-gray-600 align-top text-[13px] leading-snug">{q.topic}</td>
                <td className="px-3 py-3 text-gray-700 align-top text-[13px] leading-relaxed">
                  <EditableCell value={q.requirement} onSave={(v) => onCellEdit(q.ref, "requirement", v)} />
                </td>
                <td className="px-3 py-3 text-gray-700 align-top text-[13px] leading-relaxed">
                  <EditableCell value={q.bullet} onSave={(v) => onCellEdit(q.ref, "bullet", v)} />
                </td>
                <td className="px-3 py-3 text-gray-700 align-top text-[13px] leading-relaxed">
                  <EditableCell value={q.paragraph} onSave={(v) => onCellEdit(q.ref, "paragraph", v)} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
