"use client";

import { useState } from "react";
import { FileText, Circle, Check, X, Minus, Columns3 } from "lucide-react";
import type { Question } from "@/types";

interface GridViewProps {
  questions: Question[];
  getConfidenceColor: (conf: string) => string;
  onSelectQuestion: (q: Question) => void;
  onCellEdit: (ref: string, field: keyof Question, value: string) => void;
}

type ColumnKey = "number" | "ref" | "topic" | "requirement" | "bullet" | "paragraph" | "confidence" | "compliant" | "delivery" | "rationale" | "notes" | "pricing" | "capability" | "availability" | "strategic" | "reg_enable" | "committee_score" | "committee_risk";

interface ColumnDef {
  key: ColumnKey;
  label: string;
  shortLabel: string;
  defaultVisible: boolean;
  width: string;
  editable?: boolean;
  type?: "text" | "badge" | "bool" | "score" | "tags";
}

// source: "bsb" = from BSB (their requirements), "brim" = Brim's response/input, "analysis" = AI/committee analysis
type ColumnSource = "bsb" | "brim" | "analysis";

const ALL_COLUMNS: (ColumnDef & { source: ColumnSource })[] = [
  { key: "number", label: "#", shortLabel: "#", defaultVisible: true, width: "w-10", source: "bsb" },
  { key: "ref", label: "Reference", shortLabel: "Ref", defaultVisible: true, width: "w-40", source: "bsb" },
  { key: "topic", label: "Topic", shortLabel: "Topic", defaultVisible: true, width: "w-40", source: "bsb" },
  { key: "requirement", label: "BSB Requirement", shortLabel: "Requirement", defaultVisible: true, width: "min-w-[280px]", editable: true, source: "bsb" },
  { key: "bullet", label: "Response (Bullet)", shortLabel: "Bullet", defaultVisible: true, width: "min-w-[280px]", editable: true, source: "brim" },
  { key: "paragraph", label: "Response (Paragraph)", shortLabel: "Paragraph", defaultVisible: true, width: "min-w-[280px]", editable: true, source: "brim" },
  { key: "confidence", label: "Confidence", shortLabel: "Conf.", defaultVisible: true, width: "w-24", type: "badge", source: "analysis" },
  { key: "compliant", label: "Compliant", shortLabel: "Compl.", defaultVisible: true, width: "w-24", type: "badge", source: "brim" },
  { key: "delivery", label: "Delivery", shortLabel: "Delivery", defaultVisible: true, width: "w-28", type: "tags", source: "brim" },
  { key: "rationale", label: "Rationale", shortLabel: "Rationale", defaultVisible: false, width: "min-w-[220px]", editable: true, source: "brim" },
  { key: "notes", label: "Notes", shortLabel: "Notes", defaultVisible: false, width: "min-w-[200px]", editable: true, source: "brim" },
  { key: "pricing", label: "Pricing", shortLabel: "Pricing", defaultVisible: false, width: "min-w-[180px]", editable: true, source: "brim" },
  { key: "capability", label: "Capability", shortLabel: "Cap.", defaultVisible: false, width: "min-w-[180px]", source: "brim" },
  { key: "availability", label: "Availability", shortLabel: "Avail.", defaultVisible: false, width: "min-w-[180px]", source: "brim" },
  { key: "strategic", label: "Strategic", shortLabel: "Strat.", defaultVisible: false, width: "w-20", type: "bool", source: "analysis" },
  { key: "reg_enable", label: "Reg Enable", shortLabel: "Reg.", defaultVisible: false, width: "w-20", type: "bool", source: "analysis" },
  { key: "committee_score", label: "Committee Score", shortLabel: "Score", defaultVisible: true, width: "w-20", type: "score", source: "analysis" },
  { key: "committee_risk", label: "Committee Risk", shortLabel: "Risk", defaultVisible: false, width: "min-w-[200px]", source: "analysis" },
];

const SOURCE_HEADER_COLORS: Record<ColumnSource, string> = {
  bsb: "border-t-2 border-t-orange-400",
  brim: "border-t-2 border-t-blue-500",
  analysis: "border-t-2 border-t-violet-500",
};

const SOURCE_LABELS: Record<ColumnSource, { label: string; color: string }> = {
  bsb: { label: "BSB", color: "bg-orange-100 text-orange-700" },
  brim: { label: "BRIM", color: "bg-blue-100 text-blue-700" },
  analysis: { label: "AI", color: "bg-violet-100 text-violet-700" },
};

function EditableCell({ value, onSave, maxLen = 180 }: { value: string; onSave: (val: string) => void; maxLen?: number }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [expanded, setExpanded] = useState(false);

  if (editing) {
    return (
      <textarea autoFocus value={draft} onChange={(e) => setDraft(e.target.value)}
        onBlur={() => { if (draft !== value) onSave(draft); setEditing(false); }}
        onKeyDown={(e) => { if (e.key === "Escape") { setDraft(value); setEditing(false); } }}
        rows={4}
        className="w-full border-2 border-blue-400 rounded-md px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-y bg-white shadow-inner" />
    );
  }

  if (!value) return <span className="text-gray-300 italic cursor-pointer hover:text-blue-400" onClick={() => { setDraft(""); setEditing(true); }}>—</span>;

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

function ConfidenceBadge({ value }: { value: string }) {
  const cls = value === "GREEN" ? "bg-emerald-50 text-emerald-700 border-emerald-200"
    : value === "YELLOW" ? "bg-amber-50 text-amber-700 border-amber-200"
    : value === "RED" ? "bg-red-50 text-red-700 border-red-200"
    : "bg-gray-50 text-gray-500 border-gray-200";
  return <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${cls}`}>{value}</span>;
}

function CompliantBadge({ value }: { value: string }) {
  const cls = value === "Y" ? "bg-emerald-50 text-emerald-700 border-emerald-200"
    : value === "N" ? "bg-red-50 text-red-700 border-red-200"
    : "bg-amber-50 text-amber-700 border-amber-200";
  return <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${cls}`}>{value}</span>;
}

function BoolCell({ value }: { value: boolean }) {
  return value
    ? <Check size={14} className="text-emerald-500" />
    : <Minus size={12} className="text-gray-300" />;
}

function ScoreCell({ value }: { value: number }) {
  const color = value >= 7 ? "text-emerald-600 bg-emerald-50" : value >= 5 ? "text-amber-600 bg-amber-50" : "text-red-600 bg-red-50";
  return <span className={`text-xs font-bold px-2 py-0.5 rounded ${color}`}>{value}/10</span>;
}

function DeliveryTags({ q }: { q: Question }) {
  const tags: { label: string; cls: string }[] = [];
  if (q.a_oob) tags.push({ label: "OOB", cls: "bg-sky-50 text-sky-700 border-sky-200" });
  if (q.b_config) tags.push({ label: "CFG", cls: "bg-violet-50 text-violet-700 border-violet-200" });
  if (q.c_custom) tags.push({ label: "CST", cls: "bg-amber-50 text-amber-700 border-amber-200" });
  if (q.d_dnm) tags.push({ label: "DNM", cls: "bg-gray-50 text-gray-500 border-gray-200" });
  if (tags.length === 0) return <span className="text-gray-300">—</span>;
  return (
    <div className="flex gap-1 flex-wrap">
      {tags.map(t => <span key={t.label} className={`text-[9px] px-1.5 py-0.5 rounded border font-semibold ${t.cls}`}>{t.label}</span>)}
    </div>
  );
}

function ConfidenceDot({ confidence }: { confidence: string }) {
  const color = confidence === "GREEN" ? "text-emerald-500" : confidence === "YELLOW" ? "text-amber-400" : confidence === "RED" ? "text-red-500" : "text-gray-300";
  return <Circle size={8} fill="currentColor" className={`${color} flex-shrink-0`} />;
}

function ColumnToggle({ columns, visible, onToggle }: { columns: ColumnDef[]; visible: Set<ColumnKey>; onToggle: (key: ColumnKey) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border border-gray-200 text-gray-500 hover:bg-gray-50">
        <Columns3 size={13} /> Columns
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-xl z-50 w-56 py-2 max-h-80 overflow-auto">
            <div className="px-3 py-1.5 text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Toggle Columns</div>
            {columns.map(col => (
              <button key={col.key} onClick={() => onToggle(col.key)}
                className="flex items-center gap-2 w-full px-3 py-1.5 text-xs hover:bg-gray-50 text-left">
                <div className={`w-4 h-4 rounded border flex items-center justify-center ${visible.has(col.key) ? "bg-blue-600 border-blue-600" : "border-gray-300"}`}>
                  {visible.has(col.key) && <Check size={10} className="text-white" />}
                </div>
                <span className="flex-1">{col.label}</span>
                <span className={`text-[8px] px-1 rounded font-bold ${SOURCE_LABELS[(col as ColumnDef & { source: ColumnSource }).source]?.color || ""}`}>
                  {SOURCE_LABELS[(col as ColumnDef & { source: ColumnSource }).source]?.label || ""}
                </span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default function GridView({ questions, getConfidenceColor, onSelectQuestion, onCellEdit }: GridViewProps) {
  const [visibleCols, setVisibleCols] = useState<Set<ColumnKey>>(() =>
    new Set(ALL_COLUMNS.filter(c => c.defaultVisible).map(c => c.key))
  );

  const toggleColumn = (key: ColumnKey) => {
    setVisibleCols(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  const activeCols = ALL_COLUMNS.filter(c => visibleCols.has(c.key));

  if (questions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-3">
        <FileText size={48} strokeWidth={1} />
        <p className="text-lg font-medium">No questions match your filters</p>
        <p className="text-sm">Try adjusting your search or filter criteria</p>
      </div>
    );
  }

  const getCellValue = (q: Question, col: ColumnDef) => {
    switch (col.key) {
      case "number":
        return (
          <div className="flex items-center gap-2">
            <ConfidenceDot confidence={q.confidence} />
            <span className="font-mono text-xs text-gray-400">{q.number}</span>
          </div>
        );
      case "ref":
        return (
          <button onClick={() => onSelectQuestion(q)} className="text-blue-600 hover:text-blue-800 hover:underline font-semibold text-left text-[13px]">
            {q.ref}
          </button>
        );
      case "confidence":
        return <ConfidenceBadge value={q.confidence} />;
      case "compliant":
        return <CompliantBadge value={q.compliant} />;
      case "delivery":
        return <DeliveryTags q={q} />;
      case "strategic":
        return <BoolCell value={q.strategic} />;
      case "reg_enable":
        return <BoolCell value={q.reg_enable} />;
      case "committee_score":
        return <ScoreCell value={q.committee_score} />;
      default: {
        const val = String(q[col.key as keyof Question] ?? "");
        if (col.editable) {
          return <EditableCell value={val} onSave={(v) => onCellEdit(q.ref, col.key as keyof Question, v)} />;
        }
        if (!val) return <span className="text-gray-300">—</span>;
        return <span className="leading-relaxed">{val.length > 180 ? val.slice(0, 180) + " ..." : val}</span>;
      }
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Column toggle bar + legend */}
      <div className="flex items-center justify-between px-4 py-1.5 bg-gray-50/50 border-b border-gray-100 flex-shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-[10px] text-gray-400 font-medium">{activeCols.length}/{ALL_COLUMNS.length} columns</span>
          <div className="w-px h-3.5 bg-gray-200" />
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1"><span className="w-2.5 h-1 rounded-full bg-orange-400" /><span className="text-[10px] text-gray-500 font-medium">BSB</span></span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-1 rounded-full bg-blue-500" /><span className="text-[10px] text-gray-500 font-medium">Brim</span></span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-1 rounded-full bg-violet-500" /><span className="text-[10px] text-gray-500 font-medium">AI Analysis</span></span>
          </div>
        </div>
        <ColumnToggle columns={ALL_COLUMNS} visible={visibleCols} onToggle={toggleColumn} />
      </div>

      {/* Table */}
      <div className="overflow-auto flex-1">
        <table className="w-full text-sm border-collapse">
          <thead className="bg-gray-50/80 backdrop-blur-sm sticky top-0 z-10 border-b">
            <tr>
              {activeCols.map(col => (
                <th key={col.key} className={`text-left px-3 py-2.5 font-semibold text-gray-500 text-[10px] uppercase tracking-wider ${col.width} ${SOURCE_HEADER_COLORS[col.source]}`}>
                  <div className="flex items-center gap-1.5">
                    {col.shortLabel}
                    <span className={`text-[8px] px-1 py-0 rounded font-bold ${SOURCE_LABELS[col.source].color}`}>
                      {SOURCE_LABELS[col.source].label}
                    </span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {questions.map((q, i) => {
              const rowBg = q.confidence === "RED" ? "bg-red-50/50" : q.confidence === "YELLOW" ? "bg-amber-50/30" : i % 2 === 0 ? "bg-white" : "bg-gray-50/30";
              return (
                <tr key={q.ref} className={`${rowBg} hover:bg-blue-50/60 group`}>
                  {activeCols.map(col => (
                    <td key={col.key} className="px-3 py-2.5 text-gray-700 align-top text-[13px]">
                      {getCellValue(q, col)}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
