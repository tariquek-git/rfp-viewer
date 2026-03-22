"use client";

import { useState } from "react";
import { Check, X as XIcon, Edit3, AlertTriangle, CheckCircle } from "lucide-react";
import type { PendingDiff, ValidationResult } from "@/types";

interface DiffViewProps {
  diff: PendingDiff;
  onAccept: () => void;
  onReject: () => void;
  onEdit: (editedText: string) => void;
}

function ValidationBadge({ result }: { result: ValidationResult }) {
  const cls = result.passed
    ? "text-emerald-700 bg-emerald-50 border-emerald-200"
    : result.severity === "error"
      ? "text-red-700 bg-red-50 border-red-200"
      : "text-amber-700 bg-amber-50 border-amber-200";
  const Icon = result.passed ? CheckCircle : AlertTriangle;
  return (
    <div className={`flex items-start gap-2 px-3 py-2 rounded-lg border text-xs ${cls}`}>
      <Icon size={13} className="mt-0.5 flex-shrink-0" />
      <div>
        <span className="font-semibold">{result.rule}</span>
        <span className="mx-1">—</span>
        <span>{result.message}</span>
      </div>
    </div>
  );
}

export default function DiffView({ diff, onAccept, onReject, onEdit }: DiffViewProps) {
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(diff.suggested);

  return (
    <div className="border border-blue-200 rounded-xl bg-blue-50/30 overflow-hidden">
      <div className="px-4 py-2.5 bg-blue-100/50 border-b border-blue-200 flex items-center justify-between">
        <span className="text-xs font-semibold text-blue-700">AI Suggestion — Review Before Accepting</span>
        <span className="text-[10px] text-blue-500">{new Date(diff.timestamp).toLocaleTimeString()}</span>
      </div>

      <div className="grid grid-cols-2 divide-x divide-blue-200">
        {/* Original */}
        <div className="p-3">
          <div className="text-[10px] font-semibold text-gray-400 uppercase mb-2">Original</div>
          <div className="text-sm leading-relaxed text-gray-700 whitespace-pre-wrap">
            {diff.diff.segments.map((seg, i) => {
              if (seg.type === "remove") return <span key={i} className="bg-red-100 text-red-800 line-through decoration-red-400">{seg.text}</span>;
              if (seg.type === "equal") return <span key={i}>{seg.text}</span>;
              return null;
            })}
          </div>
        </div>

        {/* Suggested / Edit */}
        <div className="p-3">
          <div className="text-[10px] font-semibold text-gray-400 uppercase mb-2">{editing ? "Edit" : "Suggested"}</div>
          {editing ? (
            <textarea value={editText} onChange={(e) => setEditText(e.target.value)}
              rows={10} className="w-full border border-blue-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-y" />
          ) : (
            <div className="text-sm leading-relaxed text-gray-700 whitespace-pre-wrap">
              {diff.diff.segments.map((seg, i) => {
                if (seg.type === "add") return <span key={i} className="bg-emerald-100 text-emerald-800">{seg.text}</span>;
                if (seg.type === "equal") return <span key={i}>{seg.text}</span>;
                return null;
              })}
            </div>
          )}
        </div>
      </div>

      {/* Validation Results */}
      {diff.validationResults && diff.validationResults.length > 0 && (
        <div className="px-4 py-3 border-t border-blue-200 space-y-1.5">
          <div className="text-[10px] font-semibold text-gray-500 uppercase mb-1">Validation</div>
          {diff.validationResults.map((r, i) => <ValidationBadge key={i} result={r} />)}
        </div>
      )}

      {/* Actions */}
      <div className="px-4 py-3 border-t border-blue-200 flex items-center gap-2">
        {editing ? (
          <>
            <button onClick={() => { onEdit(editText); setEditing(false); }}
              className="flex items-center gap-1.5 bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-emerald-700">
              <Check size={13} /> Accept Edited
            </button>
            <button onClick={() => { setEditText(diff.suggested); setEditing(false); }}
              className="flex items-center gap-1.5 border border-gray-200 text-gray-600 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-gray-50">
              Cancel Edit
            </button>
          </>
        ) : (
          <>
            <button onClick={onAccept}
              className="flex items-center gap-1.5 bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-emerald-700">
              <Check size={13} /> Accept
            </button>
            <button onClick={onReject}
              className="flex items-center gap-1.5 bg-red-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-red-700">
              <XIcon size={13} /> Reject
            </button>
            <button onClick={() => setEditing(true)}
              className="flex items-center gap-1.5 border border-gray-200 text-gray-600 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-gray-50">
              <Edit3 size={13} /> Edit
            </button>
          </>
        )}
      </div>
    </div>
  );
}
