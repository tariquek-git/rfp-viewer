'use client';

import { useState } from 'react';
import { useRef, useCallback } from 'react';
import {
  FileText,
  Circle,
  Check,
  Minus,
  Columns3,
  ChevronUp,
  ChevronDown,
  GitCompareArrows,
  AlignVerticalSpaceAround,
} from 'lucide-react';
import type { Question, SortConfig, WorkflowStatus, FeedbackItem } from '@/types';
import { countWords, getWordCountColor, getWordCountClasses } from '@/lib/wordCount';
import { detectAIWriting, aiDetectClasses, aiDetectLabel } from '@/lib/aiDetect';

export type TableDensity = 'compact' | 'comfortable' | 'spacious';

interface GridViewProps {
  questions: Question[];
  getConfidenceColor?: (conf: string) => string;
  onSelectQuestion: (q: Question) => void;
  onCellEdit: (ref: string, field: keyof Question, value: string) => void;
  selectedRows: Set<string>;
  onToggleRow: (ref: string) => void;
  onSelectAll: (refs: string[]) => void;
  sortConfig: SortConfig | null;
  onSort: (config: SortConfig | null) => void;
  onCycleStatus: (ref: string) => void;
  pendingDiffKeys: Set<string>;
  density?: TableDensity;
  onChangeDensity?: (d: TableDensity) => void;
  feedbackItems?: FeedbackItem[];
}

type ColumnKey =
  | 'number'
  | 'ref'
  | 'topic'
  | 'requirement'
  | 'bullet'
  | 'paragraph'
  | 'confidence'
  | 'compliant'
  | 'delivery'
  | 'status'
  | 'ai_detect'
  | 'rationale'
  | 'notes'
  | 'pricing'
  | 'capability'
  | 'availability'
  | 'strategic'
  | 'reg_enable'
  | 'committee_score'
  | 'committee_risk'
  | 'feedback_count'
  | 'feedback_bullet'
  | 'feedback_paragraph';

interface ColumnDef {
  key: ColumnKey;
  label: string;
  shortLabel: string;
  defaultVisible: boolean;
  width: string;
  editable?: boolean;
  type?: 'text' | 'badge' | 'bool' | 'score' | 'tags' | 'status';
  sortable?: boolean;
}

type ColumnSource = 'bsb' | 'brim' | 'analysis' | 'feedback';

const ALL_COLUMNS: (ColumnDef & { source: ColumnSource })[] = [
  {
    key: 'number',
    label: '#',
    shortLabel: '#',
    defaultVisible: true,
    width: 'w-10',
    source: 'bsb',
    sortable: true,
  },
  {
    key: 'ref',
    label: 'Reference',
    shortLabel: 'Ref',
    defaultVisible: true,
    width: 'w-40',
    source: 'bsb',
  },
  {
    key: 'topic',
    label: 'Topic',
    shortLabel: 'Topic',
    defaultVisible: true,
    width: 'w-40',
    source: 'bsb',
    sortable: true,
  },
  {
    key: 'requirement',
    label: 'BSB Requirement',
    shortLabel: 'Requirement',
    defaultVisible: true,
    width: 'min-w-[280px]',
    editable: true,
    source: 'bsb',
  },
  {
    key: 'bullet',
    label: 'Response (Bullet)',
    shortLabel: 'Bullet',
    defaultVisible: true,
    width: 'min-w-[280px]',
    editable: true,
    source: 'brim',
  },
  {
    key: 'paragraph',
    label: 'Response (Paragraph)',
    shortLabel: 'Paragraph',
    defaultVisible: false,
    width: 'min-w-[280px]',
    editable: true,
    source: 'brim',
  },
  {
    key: 'confidence',
    label: 'Confidence',
    shortLabel: 'Conf.',
    defaultVisible: true,
    width: 'w-24',
    type: 'badge',
    source: 'analysis',
    sortable: true,
  },
  {
    key: 'compliant',
    label: 'Compliant',
    shortLabel: 'Compl.',
    defaultVisible: true,
    width: 'w-24',
    type: 'badge',
    source: 'brim',
    sortable: true,
  },
  {
    key: 'delivery',
    label: 'Delivery',
    shortLabel: 'Delivery',
    defaultVisible: true,
    width: 'w-28',
    type: 'tags',
    source: 'brim',
  },
  {
    key: 'status',
    label: 'Status',
    shortLabel: 'Status',
    defaultVisible: true,
    width: 'w-24',
    type: 'status',
    source: 'brim',
    sortable: true,
  },
  {
    key: 'ai_detect',
    label: 'AI Detect',
    shortLabel: 'AI',
    defaultVisible: true,
    width: 'w-20',
    type: 'badge',
    source: 'analysis',
  },
  {
    key: 'rationale',
    label: 'Rationale',
    shortLabel: 'Rationale',
    defaultVisible: false,
    width: 'min-w-[220px]',
    editable: true,
    source: 'brim',
  },
  {
    key: 'notes',
    label: 'Notes',
    shortLabel: 'Notes',
    defaultVisible: false,
    width: 'min-w-[200px]',
    editable: true,
    source: 'brim',
  },
  {
    key: 'pricing',
    label: 'Pricing',
    shortLabel: 'Pricing',
    defaultVisible: false,
    width: 'min-w-[180px]',
    editable: true,
    source: 'brim',
  },
  {
    key: 'capability',
    label: 'Capability',
    shortLabel: 'Cap.',
    defaultVisible: false,
    width: 'min-w-[180px]',
    source: 'brim',
  },
  {
    key: 'availability',
    label: 'Availability',
    shortLabel: 'Avail.',
    defaultVisible: false,
    width: 'min-w-[180px]',
    source: 'brim',
  },
  {
    key: 'strategic',
    label: 'Strategic',
    shortLabel: 'Strat.',
    defaultVisible: false,
    width: 'w-20',
    type: 'bool',
    source: 'analysis',
  },
  {
    key: 'reg_enable',
    label: 'Reg Enable',
    shortLabel: 'Reg.',
    defaultVisible: false,
    width: 'w-20',
    type: 'bool',
    source: 'analysis',
  },
  {
    key: 'committee_score',
    label: 'Committee Score',
    shortLabel: 'Score',
    defaultVisible: true,
    width: 'w-20',
    type: 'score',
    source: 'analysis',
    sortable: true,
  },
  {
    key: 'committee_risk',
    label: 'Committee Risk',
    shortLabel: 'Risk',
    defaultVisible: false,
    width: 'min-w-[200px]',
    source: 'analysis',
  },
  {
    key: 'feedback_count',
    label: 'Feedback',
    shortLabel: 'FB',
    defaultVisible: true,
    width: 'w-16',
    type: 'score',
    source: 'feedback',
  },
  {
    key: 'feedback_bullet',
    label: 'Feedback (Bullet)',
    shortLabel: 'FB Bullet',
    defaultVisible: false,
    width: 'min-w-[200px]',
    source: 'feedback',
  },
  {
    key: 'feedback_paragraph',
    label: 'Feedback (Paragraph)',
    shortLabel: 'FB Para',
    defaultVisible: false,
    width: 'min-w-[200px]',
    source: 'feedback',
  },
];

const SOURCE_HEADER_COLORS: Record<ColumnSource, string> = {
  bsb: 'border-t-2 border-t-orange-400',
  brim: 'border-t-2 border-t-blue-500',
  analysis: 'border-t-2 border-t-violet-500',
  feedback: 'border-t-2 border-t-amber-500',
};

const SOURCE_LABELS: Record<ColumnSource, { label: string; color: string }> = {
  bsb: { label: 'BSB', color: 'bg-orange-100 text-orange-700' },
  brim: { label: 'BRIM', color: 'bg-blue-100 text-blue-700' },
  analysis: { label: 'AI', color: 'bg-violet-100 text-violet-700' },
  feedback: { label: 'FEEDBACK', color: 'bg-amber-100 text-amber-700' },
};

const STATUS_COLORS: Record<WorkflowStatus, string> = {
  draft: 'bg-gray-100 text-gray-600 border-gray-200',
  reviewed: 'bg-blue-50 text-blue-700 border-blue-200',
  approved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  flagged: 'bg-red-50 text-red-700 border-red-200',
};

// Sub-components
function EditableCell({
  value,
  onSave,
  maxLen = 180,
}: {
  value: string;
  onSave: (val: string) => void;
  maxLen?: number;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [expanded, setExpanded] = useState(false);

  if (editing) {
    return (
      <textarea
        autoFocus
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => {
          if (draft !== value) onSave(draft);
          setEditing(false);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            setDraft(value);
            setEditing(false);
          }
        }}
        rows={4}
        className="w-full border-2 border-blue-400 rounded-md px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-y bg-white shadow-inner"
      />
    );
  }

  if (!value)
    return (
      <span
        className="text-gray-300 italic cursor-pointer hover:text-blue-400"
        onClick={() => {
          setDraft('');
          setEditing(true);
        }}
      >
        —
      </span>
    );

  const wc = countWords(value);
  const wcColor = getWordCountColor(wc);
  const truncated = value.length > maxLen && !expanded;

  return (
    <div className="cursor-pointer group">
      <div
        onClick={() => {
          setDraft(value);
          setEditing(true);
        }}
      >
        <span className="group-hover:bg-blue-50 group-hover:outline group-hover:outline-1 group-hover:outline-blue-200 rounded px-0.5 -mx-0.5 leading-relaxed">
          {truncated ? value.slice(0, maxLen) + ' ...' : value}
        </span>
      </div>
      <div className="flex items-center gap-2 mt-0.5">
        {value.length > maxLen && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setExpanded(!expanded);
            }}
            className="text-blue-500 text-xs hover:underline font-medium"
          >
            {expanded ? 'less' : 'more'}
          </button>
        )}
        <span className={`text-[9px] px-1 py-0 rounded ${getWordCountClasses(wcColor)}`}>
          {wc}w
        </span>
      </div>
    </div>
  );
}

function ConfidenceBadge({ value }: { value: string }) {
  const cls =
    value === 'GREEN'
      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
      : value === 'YELLOW'
        ? 'bg-amber-50 text-amber-700 border-amber-200'
        : value === 'RED'
          ? 'bg-red-50 text-red-700 border-red-200'
          : 'bg-gray-50 text-gray-500 border-gray-200';
  return (
    <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${cls}`}>
      {value}
    </span>
  );
}

function CompliantBadge({ value }: { value: string }) {
  const cls =
    value === 'Y'
      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
      : value === 'N'
        ? 'bg-red-50 text-red-700 border-red-200'
        : 'bg-amber-50 text-amber-700 border-amber-200';
  return (
    <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${cls}`}>
      {value}
    </span>
  );
}

function StatusBadge({ value, onClick }: { value: WorkflowStatus; onClick: () => void }) {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold capitalize cursor-pointer hover:opacity-80 ${STATUS_COLORS[value]}`}
    >
      {value}
    </button>
  );
}

function BoolCell({ value }: { value: boolean }) {
  return value ? (
    <Check size={14} className="text-emerald-500" />
  ) : (
    <Minus size={12} className="text-gray-300" />
  );
}

function ScoreCell({ value }: { value: number }) {
  const color =
    value >= 7
      ? 'text-emerald-600 bg-emerald-50'
      : value >= 5
        ? 'text-amber-600 bg-amber-50'
        : 'text-red-600 bg-red-50';
  return <span className={`text-xs font-bold px-2 py-0.5 rounded ${color}`}>{value}/10</span>;
}

function DeliveryTags({ q }: { q: Question }) {
  const tags: { label: string; cls: string }[] = [];
  if (q.a_oob) tags.push({ label: 'OOB', cls: 'bg-sky-50 text-sky-700 border-sky-200' });
  if (q.b_config)
    tags.push({ label: 'CFG', cls: 'bg-violet-50 text-violet-700 border-violet-200' });
  if (q.c_custom) tags.push({ label: 'CST', cls: 'bg-amber-50 text-amber-700 border-amber-200' });
  if (q.d_dnm) tags.push({ label: 'DNM', cls: 'bg-gray-50 text-gray-500 border-gray-200' });
  if (tags.length === 0) return <span className="text-gray-300">—</span>;
  return (
    <div className="flex gap-1 flex-wrap">
      {tags.map((t) => (
        <span
          key={t.label}
          className={`text-[9px] px-1.5 py-0.5 rounded border font-semibold ${t.cls}`}
        >
          {t.label}
        </span>
      ))}
    </div>
  );
}

function ConfidenceDot({ confidence }: { confidence: string }) {
  const color =
    confidence === 'GREEN'
      ? 'text-emerald-500'
      : confidence === 'YELLOW'
        ? 'text-amber-400'
        : confidence === 'RED'
          ? 'text-red-500'
          : 'text-gray-300';
  return <Circle size={8} fill="currentColor" className={`${color} flex-shrink-0`} />;
}

function ColumnToggle({
  columns,
  visible,
  onToggle,
}: {
  columns: ColumnDef[];
  visible: Set<ColumnKey>;
  onToggle: (key: ColumnKey) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border border-gray-200 text-gray-500 hover:bg-gray-50"
      >
        <Columns3 size={13} /> Columns
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-xl z-50 w-56 py-2 max-h-80 overflow-auto">
            <div className="px-3 py-1.5 text-[10px] text-gray-400 uppercase tracking-wider font-semibold">
              Toggle Columns
            </div>
            {columns.map((col) => (
              <button
                key={col.key}
                onClick={() => onToggle(col.key)}
                className="flex items-center gap-2 w-full px-3 py-1.5 text-xs hover:bg-gray-50 text-left"
              >
                <div
                  className={`w-4 h-4 rounded border flex items-center justify-center ${visible.has(col.key) ? 'bg-blue-600 border-blue-600' : 'border-gray-300'}`}
                >
                  {visible.has(col.key) && <Check size={10} className="text-white" />}
                </div>
                <span className="flex-1">{col.label}</span>
                <span
                  className={`text-[8px] px-1 rounded font-bold ${SOURCE_LABELS[(col as ColumnDef & { source: ColumnSource }).source]?.color || ''}`}
                >
                  {SOURCE_LABELS[(col as ColumnDef & { source: ColumnSource }).source]?.label || ''}
                </span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function DensityToggle({
  density,
  onChange,
}: {
  density: TableDensity;
  onChange: (d: TableDensity) => void;
}) {
  const [open, setOpen] = useState(false);
  const densities: { key: TableDensity; label: string }[] = [
    { key: 'compact', label: 'Compact' },
    { key: 'comfortable', label: 'Comfortable' },
    { key: 'spacious', label: 'Spacious' },
  ];
  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border border-gray-200 text-gray-500 hover:bg-gray-50"
      >
        <AlignVerticalSpaceAround size={13} /> Density
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-xl z-50 w-36 py-1">
            {densities.map((d) => (
              <button
                key={d.key}
                onClick={() => {
                  onChange(d.key);
                  setOpen(false);
                }}
                className={`w-full text-left px-3 py-1.5 text-xs hover:bg-gray-50 ${density === d.key ? 'text-blue-600 font-semibold' : 'text-gray-600'}`}
              >
                {d.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default function GridView({
  questions,
  onSelectQuestion,
  onCellEdit,
  selectedRows,
  onToggleRow,
  onSelectAll,
  sortConfig,
  onSort,
  onCycleStatus,
  pendingDiffKeys,
  density = 'comfortable',
  onChangeDensity,
  feedbackItems = [],
}: GridViewProps) {
  const [visibleCols, setVisibleCols] = useState<Set<ColumnKey>>(
    () => new Set(ALL_COLUMNS.filter((c) => c.defaultVisible).map((c) => c.key)),
  );
  const [focusedRow, setFocusedRow] = useState(-1);
  const tableRef = useRef<HTMLDivElement>(null);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setFocusedRow((prev) => Math.min(prev + 1, questions.length - 1));
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setFocusedRow((prev) => Math.max(prev - 1, 0));
      }
      if (e.key === 'Enter' && focusedRow >= 0 && focusedRow < questions.length) {
        e.preventDefault();
        onSelectQuestion(questions[focusedRow]);
      }
    },
    [focusedRow, questions, onSelectQuestion],
  );

  const toggleColumn = (key: ColumnKey) => {
    setVisibleCols((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const handleSort = (key: ColumnKey) => {
    if (!sortConfig || sortConfig.key !== key) {
      onSort({ key, direction: 'asc' });
    } else if (sortConfig.direction === 'asc') {
      onSort({ key, direction: 'desc' });
    } else {
      onSort(null);
    }
  };

  const activeCols = ALL_COLUMNS.filter((c) => visibleCols.has(c.key));
  const allRefsSelected = questions.length > 0 && questions.every((q) => selectedRows.has(q.ref));

  if (questions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-3">
        <FileText size={48} strokeWidth={1} />
        <p className="text-lg font-medium">No questions match your filters</p>
        <p className="text-sm">Try adjusting your search or filter criteria</p>
      </div>
    );
  }

  const getCellValue = (q: Question, col: ColumnDef & { source: ColumnSource }) => {
    switch (col.key) {
      case 'number':
        return (
          <div className="flex items-center gap-2">
            <ConfidenceDot confidence={q.confidence} />
            <span className="font-mono text-xs text-gray-400">{q.number}</span>
          </div>
        );
      case 'ref': {
        const hasDiff =
          pendingDiffKeys.has(`${q.ref}:bullet`) || pendingDiffKeys.has(`${q.ref}:paragraph`);
        return (
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onSelectQuestion(q)}
              className="text-blue-600 hover:text-blue-800 hover:underline font-semibold text-left text-[13px]"
            >
              {q.ref}
            </button>
            {hasDiff && <GitCompareArrows size={12} className="text-violet-500 animate-pulse" />}
          </div>
        );
      }
      case 'confidence':
        return <ConfidenceBadge value={q.confidence} />;
      case 'compliant':
        return <CompliantBadge value={q.compliant} />;
      case 'delivery':
        return <DeliveryTags q={q} />;
      case 'status':
        return <StatusBadge value={q.status} onClick={() => onCycleStatus(q.ref)} />;
      case 'ai_detect': {
        const detect = detectAIWriting(q.bullet + ' ' + q.paragraph);
        return (
          <span
            className={`text-[9px] px-1.5 py-0.5 rounded border font-semibold ${aiDetectClasses(detect.level)}`}
          >
            {aiDetectLabel(detect.level)}
          </span>
        );
      }
      case 'strategic':
        return <BoolCell value={q.strategic} />;
      case 'reg_enable':
        return <BoolCell value={q.reg_enable} />;
      case 'committee_score':
        return <ScoreCell value={q.committee_score} />;
      case 'feedback_count': {
        const fbItems = feedbackItems.filter(f => f.ref === q.ref && !f.resolved);
        if (fbItems.length === 0) return <span className="text-gray-300">0</span>;
        return (
          <span className="text-xs font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
            {fbItems.length}
          </span>
        );
      }
      case 'feedback_bullet': {
        const fbBullet = feedbackItems.filter(f => f.ref === q.ref && f.field === 'bullet' && !f.resolved);
        if (fbBullet.length === 0) return <span className="text-gray-300">—</span>;
        return (
          <div className="space-y-1">
            {fbBullet.slice(0, 3).map(f => (
              <div key={f.timestamp} className="text-xs bg-amber-50 border border-amber-200 rounded px-2 py-1 text-amber-800">
                {f.comment.length > 120 ? f.comment.slice(0, 120) + '...' : f.comment}
              </div>
            ))}
          </div>
        );
      }
      case 'feedback_paragraph': {
        const fbPara = feedbackItems.filter(f => f.ref === q.ref && f.field === 'paragraph' && !f.resolved);
        if (fbPara.length === 0) return <span className="text-gray-300">—</span>;
        return (
          <div className="space-y-1">
            {fbPara.slice(0, 3).map(f => (
              <div key={f.timestamp} className="text-xs bg-amber-50 border border-amber-200 rounded px-2 py-1 text-amber-800">
                {f.comment.length > 120 ? f.comment.slice(0, 120) + '...' : f.comment}
              </div>
            ))}
          </div>
        );
      }
      default: {
        const val = String(q[col.key as keyof Question] ?? '');
        if (col.editable) {
          return (
            <EditableCell
              value={val}
              onSave={(v) => onCellEdit(q.ref, col.key as keyof Question, v)}
            />
          );
        }
        if (!val) return <span className="text-gray-300">—</span>;
        return (
          <span className="leading-relaxed">
            {val.length > 180 ? val.slice(0, 180) + ' ...' : val}
          </span>
        );
      }
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-1.5 bg-gray-50/50 border-b border-gray-100 flex-shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-[10px] text-gray-400 font-medium">
            {activeCols.length}/{ALL_COLUMNS.length} columns
          </span>
          <div className="w-px h-3.5 bg-gray-200" />
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-1 rounded-full bg-orange-400" />
              <span className="text-[10px] text-gray-500 font-medium">BSB</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-1 rounded-full bg-blue-500" />
              <span className="text-[10px] text-gray-500 font-medium">Brim</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-1 rounded-full bg-violet-500" />
              <span className="text-[10px] text-gray-500 font-medium">AI Analysis</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-1 rounded-full bg-amber-500" />
              <span className="text-[10px] text-gray-500 font-medium">Feedback</span>
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {onChangeDensity && <DensityToggle density={density} onChange={onChangeDensity} />}
          <ColumnToggle columns={ALL_COLUMNS} visible={visibleCols} onToggle={toggleColumn} />
        </div>
      </div>

      <div
        className="overflow-auto flex-1 focus:outline-none"
        ref={tableRef}
        tabIndex={0}
        onKeyDown={handleKeyDown}
      >
        <table className={`w-full text-sm border-collapse density-${density}`}>
          <thead className="bg-gray-50/80 backdrop-blur-sm sticky top-0 z-10 border-b">
            <tr>
              {/* Checkbox header */}
              <th className="w-10 px-2 py-2.5">
                <input
                  type="checkbox"
                  checked={allRefsSelected}
                  onChange={() => onSelectAll(questions.map((q) => q.ref))}
                  className="w-3.5 h-3.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500/20"
                />
              </th>
              {activeCols.map((col) => (
                <th
                  key={col.key}
                  className={`text-left px-3 py-2.5 font-semibold text-gray-500 text-[10px] uppercase tracking-wider ${col.width} ${SOURCE_HEADER_COLORS[col.source]} ${col.sortable ? 'cursor-pointer hover:text-gray-700 select-none' : ''}`}
                  onClick={() => col.sortable && handleSort(col.key)}
                >
                  <div className="flex items-center gap-1">
                    {col.shortLabel}
                    {col.sortable &&
                      sortConfig?.key === col.key &&
                      (sortConfig.direction === 'asc' ? (
                        <ChevronUp size={11} />
                      ) : (
                        <ChevronDown size={11} />
                      ))}
                    <span
                      className={`text-[8px] px-1 py-0 rounded font-bold ${SOURCE_LABELS[col.source].color}`}
                    >
                      {SOURCE_LABELS[col.source].label}
                    </span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {questions.map((q, i) => {
              const rowBg =
                q.confidence === 'RED'
                  ? 'bg-red-50/50'
                  : q.confidence === 'YELLOW'
                    ? 'bg-amber-50/30'
                    : i % 2 === 0
                      ? 'bg-white'
                      : 'bg-gray-50/30';
              const isSelected = selectedRows.has(q.ref);
              const isFocused = i === focusedRow;
              return (
                <tr
                  key={q.ref}
                  onClick={() => setFocusedRow(i)}
                  className={`${rowBg} hover:bg-blue-50/60 group relative ${isSelected ? 'ring-1 ring-inset ring-blue-300 bg-blue-50/40' : ''} ${isFocused ? 'ring-2 ring-inset ring-blue-500' : ''}`}
                >
                  <td className="px-2 py-2.5">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => onToggleRow(q.ref)}
                      className="w-3.5 h-3.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500/20"
                    />
                  </td>
                  {activeCols.map((col) => (
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
