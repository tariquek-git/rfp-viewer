"use client";

import { useState } from "react";
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
      <textarea
        autoFocus
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => { if (draft !== value) onSave(draft); setEditing(false); }}
        onKeyDown={(e) => { if (e.key === "Escape") { setDraft(value); setEditing(false); } }}
        rows={4}
        className="w-full border border-blue-400 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
      />
    );
  }

  if (!value) return <span className="text-gray-300 italic cursor-pointer" onClick={() => { setDraft(""); setEditing(true); }}>— click to add</span>;

  const truncated = value.length > maxLen && !expanded;
  return (
    <div className="cursor-pointer group" onClick={() => { setDraft(value); setEditing(true); }}>
      <span className="group-hover:bg-blue-50 group-hover:outline group-hover:outline-1 group-hover:outline-blue-200 rounded px-0.5 -mx-0.5">
        {truncated ? value.slice(0, maxLen) + " …" : value}
      </span>
      {value.length > maxLen && (
        <button
          onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
          className="text-blue-500 text-xs ml-1 hover:underline"
        >
          {expanded ? "Show less" : "Show more"}
        </button>
      )}
    </div>
  );
}

function DeliveryBadge({ label, active }: { label: string; active: boolean }) {
  if (!active) return null;
  const colors: Record<string, string> = {
    OOB: "bg-blue-100 text-blue-700",
    CFG: "bg-purple-100 text-purple-700",
    Custom: "bg-orange-100 text-orange-700",
  };
  return <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${colors[label] || "bg-gray-100 text-gray-600"}`}>{label}</span>;
}

export default function GridView({ questions, getConfidenceColor, onSelectQuestion, onCellEdit }: GridViewProps) {
  return (
    <div className="overflow-auto h-full">
      <table className="w-full text-sm border-collapse">
        <thead className="bg-gray-50 sticky top-0 z-10">
          <tr className="border-b">
            <th className="text-left px-3 py-2 font-medium text-gray-500 w-10">#</th>
            <th className="text-left px-3 py-2 font-medium text-gray-500 w-36">Reference ↕</th>
            <th className="text-left px-3 py-2 font-medium text-gray-500 w-36">Topic ↕</th>
            <th className="text-left px-3 py-2 font-medium text-gray-500 min-w-[300px]">BSB Requirement (Exact)</th>
            <th className="text-left px-3 py-2 font-medium text-gray-500 min-w-[300px]">Response (Bullet)</th>
            <th className="text-left px-3 py-2 font-medium text-gray-500 min-w-[300px]">Response (Paragraph)</th>
          </tr>
        </thead>
        <tbody>
          {questions.map((q) => {
            const rowBg = q.confidence === "RED" ? "bg-red-50" : q.confidence === "YELLOW" ? "bg-yellow-50" : "";
            return (
              <tr key={q.ref} className={`border-b hover:bg-blue-50/30 ${rowBg}`}>
                <td className="px-3 py-3 text-gray-400 align-top">{q.number}</td>
                <td className="px-3 py-3 align-top">
                  <button onClick={() => onSelectQuestion(q)} className="text-blue-600 hover:underline font-medium text-left">
                    {q.ref}
                  </button>
                  <div className="flex gap-1 mt-1">
                    <DeliveryBadge label="OOB" active={q.a_oob} />
                    <DeliveryBadge label="CFG" active={q.b_config} />
                    <DeliveryBadge label="Custom" active={q.c_custom} />
                  </div>
                  {q.strategic && <span className="inline-block w-2 h-2 rounded-full bg-purple-500 mt-1" title="Strategic Positioning" />}
                </td>
                <td className="px-3 py-3 text-gray-700 align-top">
                  <div>{q.topic}</div>
                </td>
                <td className="px-3 py-3 text-gray-700 align-top">
                  <EditableCell value={q.requirement} onSave={(v) => onCellEdit(q.ref, "requirement", v)} />
                </td>
                <td className="px-3 py-3 text-gray-700 align-top">
                  <EditableCell value={q.bullet} onSave={(v) => onCellEdit(q.ref, "bullet", v)} />
                </td>
                <td className="px-3 py-3 text-gray-700 align-top">
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
