'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import type {
  Question,
  PendingDiff,
  CritiqueResult,
  FeedbackItem,
  CellHistoryEntry,
} from '@/types';
import FeedbackPanel from './FeedbackPanel';
import DiffView from './DiffView';
import CritiquePanel from './CritiquePanel';
import { countWords, getWordCountColor, getWordCountClasses } from '@/lib/wordCount';
import { detectAIWriting, aiDetectClasses, aiDetectLabel } from '@/lib/aiDetect';

interface DetailPanelProps {
  question: Question;
  onClose: () => void;
  onSave: (updated: Question) => void;
  onAiRewrite: (
    question: Question,
    field: 'bullet' | 'paragraph',
    rowRules: string,
    feedback: FeedbackItem[],
  ) => Promise<string>;
  cellHistory: Record<string, CellHistoryEntry[]>;
  feedbackItems: FeedbackItem[];
  onAddFeedback: (ref: string, field: string, comment: string) => void;
  onResolveFeedback: (ref: string, timestamp: number) => void;
  pendingDiffs: Record<string, PendingDiff>;
  onAcceptDiff: (key: string) => void;
  onRejectDiff: (key: string) => void;
  onAcceptEditedDiff: (key: string, text: string) => void;
}

function CollapsibleSection({
  title,
  defaultOpen = true,
  children,
  extra,
}: {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
  extra?: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-t pt-3 mt-3">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full text-left mb-2"
      >
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">{title}</h3>
        <div className="flex items-center gap-2">
          {extra && <div onClick={(e) => e.stopPropagation()}>{extra}</div>}
          <ChevronDown
            size={14}
            className={`text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`}
          />
        </div>
      </button>
      {open && <div>{children}</div>}
    </div>
  );
}

function WordCount({ text }: { text: string }) {
  const wc = countWords(text);
  const color = getWordCountColor(wc);
  return (
    <span className={`text-[10px] px-1.5 py-0.5 rounded ${getWordCountClasses(color)}`}>
      {wc} words
    </span>
  );
}

function FieldBlock({
  label,
  value,
  editable,
  onChange,
  rows = 4,
  historyCount,
  history,
}: {
  label: string;
  value: string;
  editable?: boolean;
  onChange?: (val: string) => void;
  rows?: number;
  historyCount?: number;
  history?: CellHistoryEntry[];
}) {
  const [showHistory, setShowHistory] = useState(false);
  return (
    <div className="mb-4">
      <div className="flex items-center justify-between">
        {label && (
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
            {label}
          </label>
        )}
        <div className="flex items-center gap-2">
          {editable && value && <WordCount text={value} />}
          {historyCount !== undefined && historyCount > 0 && (
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="text-xs text-gray-400 hover:text-blue-500"
            >
              {showHistory ? 'hide' : `${historyCount} edits`}
            </button>
          )}
        </div>
      </div>
      {showHistory && history && (
        <div className="mb-2 border rounded bg-gray-50 p-2 max-h-40 overflow-auto">
          {history
            .slice()
            .reverse()
            .map((h, i) => (
              <div key={i} className="text-xs border-b last:border-0 py-1">
                <span
                  className={`font-medium ${h.source === 'ai' ? 'text-purple-600' : h.source === 'ai-edited' ? 'text-indigo-600' : 'text-blue-600'}`}
                >
                  {h.source === 'ai' ? 'AI' : h.source === 'ai-edited' ? 'AI (edited)' : 'Human'}
                  {h.rejected && <span className="text-red-500 ml-1">(rejected)</span>}
                </span>
                <span className="text-gray-400 ml-2">{new Date(h.timestamp).toLocaleString()}</span>
                <div className="text-gray-600 mt-0.5 truncate">{h.value.slice(0, 100)}...</div>
              </div>
            ))}
        </div>
      )}
      {editable ? (
        <textarea
          value={value || ''}
          onChange={(e) => onChange?.(e.target.value)}
          rows={rows}
          className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
        />
      ) : (
        <div className="text-sm text-gray-700 whitespace-pre-wrap bg-gray-50 rounded px-3 py-2 min-h-[2rem]">
          {value || <span className="text-gray-300 italic">—</span>}
        </div>
      )}
    </div>
  );
}

export default function DetailPanel({
  question,
  onClose,
  onSave,
  onAiRewrite,
  cellHistory,
  feedbackItems,
  onAddFeedback,
  onResolveFeedback,
  pendingDiffs,
  onAcceptDiff,
  onRejectDiff,
  onAcceptEditedDiff,
}: DetailPanelProps) {
  const [q, setQ] = useState<Question>({ ...question });
  const [rewritingBullet, setRewritingBullet] = useState(false);
  const [rewritingParagraph, setRewritingParagraph] = useState(false);
  const [rowRules, setRowRules] = useState('');
  const [dirty, setDirty] = useState(false);
  const [critiquing, setCritiquing] = useState<'bullet' | 'paragraph' | null>(null);
  const [critiqueResults, setCritiqueResults] = useState<Record<string, CritiqueResult>>({});
  const [rescoring, setRescoring] = useState(false);
  const [humanizing, setHumanizing] = useState<'bullet' | 'paragraph' | null>(null);

  const [questionKey, setQuestionKey] = useState(question.ref);
  if (question.ref !== questionKey) {
    setQuestionKey(question.ref);
    setQ({ ...question });
    setDirty(false);
  }

  const update = (field: keyof Question, value: string | boolean | number) => {
    setQ({ ...q, [field]: value } as Question);
    setDirty(true);
  };

  const handleRewrite = async (field: 'bullet' | 'paragraph') => {
    const setLoading = field === 'bullet' ? setRewritingBullet : setRewritingParagraph;
    setLoading(true);
    try {
      const myFeedback = feedbackItems.filter((f) => f.ref === q.ref && !f.resolved);
      await onAiRewrite(q, field, rowRules, myFeedback);
    } catch (e) {
      console.error('AI rewrite failed:', e);
    }
    setLoading(false);
  };

  const handleCritique = async (field: 'bullet' | 'paragraph') => {
    setCritiquing(field);
    try {
      const res = await fetch('/api/critique', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: q, field }),
      });
      const result = await res.json();
      setCritiqueResults((prev) => ({ ...prev, [`${q.ref}:${field}`]: result }));
    } catch (e) {
      console.error('Critique failed:', e);
    }
    setCritiquing(null);
  };

  const handleRescore = async () => {
    setRescoring(true);
    try {
      const res = await fetch('/api/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: q }),
      });
      const result = await res.json();
      if (result.committee_score) {
        setQ({
          ...q,
          committee_score: result.committee_score,
          committee_review: result.committee_review || q.committee_review,
          committee_risk: result.committee_risk || q.committee_risk,
        });
        setDirty(true);
      }
    } catch (e) {
      console.error('Re-score failed:', e);
    }
    setRescoring(false);
  };

  const handleHumanize = async (field: 'bullet' | 'paragraph') => {
    setHumanizing(field);
    try {
      const text = q[field];
      const detection = detectAIWriting(text);
      const res = await fetch('/api/humanize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          triggers: detection.triggers,
          context: `${q.category} - ${q.topic}`,
        }),
      });
      const result = await res.json();
      if (result.text) {
        update(field, result.text);
      }
    } catch (e) {
      console.error('Humanize failed:', e);
    }
    setHumanizing(null);
  };

  // AI detection for current responses
  const bulletDetect = detectAIWriting(q.bullet);
  const paragraphDetect = detectAIWriting(q.paragraph);

  const confClass =
    q.confidence === 'GREEN'
      ? 'text-green-600 bg-green-50 border-green-200'
      : q.confidence === 'YELLOW'
        ? 'text-yellow-600 bg-yellow-50 border-yellow-200'
        : q.confidence === 'RED'
          ? 'text-red-600 bg-red-50 border-red-200'
          : 'text-gray-600';

  const historyFor = (field: string) => cellHistory[`${q.ref}:${field}`] || [];
  const bulletDiffKey = `${q.ref}:bullet`;
  const paragraphDiffKey = `${q.ref}:paragraph`;

  return (
    <div className="absolute right-0 top-0 bottom-0 w-[560px] bg-white border-l shadow-xl z-30 flex flex-col panel-slide-in">
      <div className="flex items-center justify-between px-6 py-4 border-b flex-shrink-0">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">{q.ref}</h2>
          <p className="text-sm text-gray-500">
            {q.category} · {q.topic}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {dirty && (
            <button
              onClick={() => {
                onSave(q);
                setDirty(false);
              }}
              className="bg-blue-500 text-white px-3 py-1.5 rounded text-sm font-medium hover:bg-blue-600"
            >
              Save
            </button>
          )}
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 text-lg font-bold"
          >
            ×
          </button>
        </div>
      </div>

      <div className="px-6 py-3 border-b flex items-center gap-2 flex-shrink-0 flex-wrap">
        <span className={`text-xs px-2 py-1 rounded border font-medium ${confClass}`}>
          {q.confidence}
        </span>
        <span className="text-xs px-2 py-1 rounded border border-gray-200 font-medium">
          Compliant: {q.compliant}
        </span>
        <span
          className={`text-xs px-2 py-1 rounded border font-medium capitalize ${
            q.status === 'approved'
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : q.status === 'reviewed'
                ? 'bg-blue-50 text-blue-700 border-blue-200'
                : q.status === 'flagged'
                  ? 'bg-red-50 text-red-700 border-red-200'
                  : 'bg-gray-100 text-gray-600 border-gray-200'
          }`}
        >
          {q.status}
        </span>
        {q.a_oob && (
          <span className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-700 font-medium">
            OOB
          </span>
        )}
        {q.b_config && (
          <span className="text-xs px-2 py-1 rounded bg-purple-100 text-purple-700 font-medium">
            CFG
          </span>
        )}
        {q.c_custom && (
          <span className="text-xs px-2 py-1 rounded bg-orange-100 text-orange-700 font-medium">
            Custom
          </span>
        )}
        {q.strategic && (
          <span className="text-xs px-2 py-1 rounded bg-indigo-100 text-indigo-700 font-medium">
            Strategic
          </span>
        )}
        {q.reg_enable && (
          <span className="text-xs px-2 py-1 rounded bg-teal-100 text-teal-700 font-medium">
            Reg Enable
          </span>
        )}
        <span className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-600 font-medium ml-auto">
          Score: {q.committee_score}/10
        </span>
      </div>

      <div className="flex-1 overflow-auto px-6 py-4 space-y-1">
        <FieldBlock label="BSB Requirement" value={q.requirement} />

        {/* Bullet response */}
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Response (Bullet)
            </label>
            {bulletDetect.level !== 'low' && (
              <span
                className={`text-[9px] px-1.5 py-0.5 rounded border font-semibold ${aiDetectClasses(bulletDetect.level)}`}
                title={bulletDetect.triggers.join(', ')}
              >
                {aiDetectLabel(bulletDetect.level)}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {historyFor('bullet').length > 0 && (
              <span className="text-xs text-gray-400">{historyFor('bullet').length} edits</span>
            )}
            {bulletDetect.level !== 'low' && (
              <button
                onClick={() => handleHumanize('bullet')}
                disabled={humanizing === 'bullet'}
                className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded hover:bg-emerald-200 disabled:opacity-50 font-medium"
              >
                {humanizing === 'bullet' ? '...' : 'Humanize'}
              </button>
            )}
            <button
              onClick={() => handleCritique('bullet')}
              disabled={critiquing === 'bullet'}
              className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded hover:bg-blue-200 disabled:opacity-50 font-medium"
            >
              {critiquing === 'bullet' ? '...' : 'Critique'}
            </button>
            <button
              onClick={() => handleRewrite('bullet')}
              disabled={rewritingBullet}
              className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded hover:bg-purple-200 disabled:opacity-50 font-medium"
            >
              {rewritingBullet ? 'Rewriting...' : 'AI Rewrite'}
            </button>
          </div>
        </div>
        {pendingDiffs[bulletDiffKey] ? (
          <DiffView
            diff={pendingDiffs[bulletDiffKey]}
            onAccept={() => onAcceptDiff(bulletDiffKey)}
            onReject={() => onRejectDiff(bulletDiffKey)}
            onEdit={(text) => onAcceptEditedDiff(bulletDiffKey, text)}
          />
        ) : (
          <FieldBlock
            label=""
            value={q.bullet}
            editable
            onChange={(v) => update('bullet', v)}
            rows={6}
            historyCount={historyFor('bullet').length}
            history={historyFor('bullet')}
          />
        )}
        {critiqueResults[`${q.ref}:bullet`] && (
          <CritiquePanel result={critiqueResults[`${q.ref}:bullet`]} />
        )}

        {/* Paragraph response */}
        <div className="flex items-center justify-between mb-1 mt-4">
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Response (Paragraph)
            </label>
            {paragraphDetect.level !== 'low' && (
              <span
                className={`text-[9px] px-1.5 py-0.5 rounded border font-semibold ${aiDetectClasses(paragraphDetect.level)}`}
                title={paragraphDetect.triggers.join(', ')}
              >
                {aiDetectLabel(paragraphDetect.level)}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {historyFor('paragraph').length > 0 && (
              <span className="text-xs text-gray-400">{historyFor('paragraph').length} edits</span>
            )}
            {paragraphDetect.level !== 'low' && (
              <button
                onClick={() => handleHumanize('paragraph')}
                disabled={humanizing === 'paragraph'}
                className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded hover:bg-emerald-200 disabled:opacity-50 font-medium"
              >
                {humanizing === 'paragraph' ? '...' : 'Humanize'}
              </button>
            )}
            <button
              onClick={() => handleCritique('paragraph')}
              disabled={critiquing === 'paragraph'}
              className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded hover:bg-blue-200 disabled:opacity-50 font-medium"
            >
              {critiquing === 'paragraph' ? '...' : 'Critique'}
            </button>
            <button
              onClick={() => handleRewrite('paragraph')}
              disabled={rewritingParagraph}
              className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded hover:bg-purple-200 disabled:opacity-50 font-medium"
            >
              {rewritingParagraph ? 'Rewriting...' : 'AI Rewrite'}
            </button>
          </div>
        </div>
        {pendingDiffs[paragraphDiffKey] ? (
          <DiffView
            diff={pendingDiffs[paragraphDiffKey]}
            onAccept={() => onAcceptDiff(paragraphDiffKey)}
            onReject={() => onRejectDiff(paragraphDiffKey)}
            onEdit={(text) => onAcceptEditedDiff(paragraphDiffKey, text)}
          />
        ) : (
          <FieldBlock
            label=""
            value={q.paragraph}
            editable
            onChange={(v) => update('paragraph', v)}
            rows={6}
            historyCount={historyFor('paragraph').length}
            history={historyFor('paragraph')}
          />
        )}
        {critiqueResults[`${q.ref}:paragraph`] && (
          <CritiquePanel result={critiqueResults[`${q.ref}:paragraph`]} />
        )}

        {/* Collapsible: Additional Fields */}
        <CollapsibleSection title="Additional Fields" defaultOpen={false}>
          <FieldBlock
            label="Rationale"
            value={q.rationale}
            editable
            onChange={(v) => update('rationale', v)}
            rows={3}
            historyCount={historyFor('rationale').length}
            history={historyFor('rationale')}
          />
          <FieldBlock
            label="Notes"
            value={q.notes}
            editable
            onChange={(v) => update('notes', v)}
            rows={3}
            historyCount={historyFor('notes').length}
            history={historyFor('notes')}
          />
          <FieldBlock
            label="Pricing"
            value={q.pricing}
            editable
            onChange={(v) => update('pricing', v)}
            rows={2}
          />
          <FieldBlock label="Capability" value={q.capability} />
          <FieldBlock label="Availability" value={q.availability} />
        </CollapsibleSection>

        {/* Collapsible: Committee Review */}
        <CollapsibleSection
          title="Committee Review"
          defaultOpen={false}
          extra={
            <button
              onClick={handleRescore}
              disabled={rescoring}
              className="text-xs bg-violet-100 text-violet-700 px-2 py-0.5 rounded hover:bg-violet-200 disabled:opacity-50 font-medium"
            >
              {rescoring ? 'Scoring...' : 'Re-score'}
            </button>
          }
        >
          <FieldBlock label="Review" value={q.committee_review} />
          <FieldBlock label="Risk Assessment" value={q.committee_risk} />
          <div className="flex items-center gap-2 mb-4">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Score
            </label>
            <input
              type="number"
              min={1}
              max={10}
              value={q.committee_score}
              onChange={(e) => update('committee_score', Number(e.target.value))}
              className="w-16 border rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-xs text-gray-400">/10</span>
          </div>
        </CollapsibleSection>

        {/* Row Rules */}
        <CollapsibleSection title="Row Rules" defaultOpen={true}>
          <p className="text-xs text-gray-400 mb-2">
            Give the AI direction for this specific question.
          </p>
          <textarea
            value={rowRules}
            onChange={(e) => setRowRules(e.target.value)}
            placeholder="e.g. Emphasize Brim's 8 FI launches. Mention mobile-first approach."
            rows={3}
            className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
          />
        </CollapsibleSection>

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
