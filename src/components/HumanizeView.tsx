'use client';

import { useState, useMemo, useCallback } from 'react';
import { Sparkles, Check } from 'lucide-react';
import type { Question } from '@/types';
import {
  detectAIWriting,
  aiDetectClasses,
  aiDetectLabel,
  type AIDetectResult,
} from '@/lib/aiDetect';

interface HumanizeViewProps {
  questions: Question[];
  onUpdateQuestion: (updated: Question) => void;
  addToast: (type: 'success' | 'error' | 'info', message: string) => void;
}

interface HumanizeResult {
  ref: string;
  field: 'bullet' | 'paragraph';
  original: string;
  humanized: string;
  originalDetect: AIDetectResult;
  humanizedDetect: AIDetectResult;
  accepted: boolean;
}

export default function HumanizeView({ questions, onUpdateQuestion, addToast }: HumanizeViewProps) {
  const [results, setResults] = useState<HumanizeResult[]>([]);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [selectedField, setSelectedField] = useState<'bullet' | 'paragraph'>('bullet');
  const [filterLevel, setFilterLevel] = useState<'all' | 'high' | 'medium'>('high');

  // Detect all questions
  const detected = useMemo(() => {
    return questions.map((q) => ({
      ref: q.ref,
      question: q,
      bulletDetect: detectAIWriting(q.bullet),
      paragraphDetect: detectAIWriting(q.paragraph),
    }));
  }, [questions]);

  const filtered = useMemo(() => {
    return detected.filter((d) => {
      const detect = selectedField === 'bullet' ? d.bulletDetect : d.paragraphDetect;
      if (filterLevel === 'high') return detect.level === 'high';
      if (filterLevel === 'medium') return detect.level === 'medium' || detect.level === 'high';
      return detect.level !== 'low';
    });
  }, [detected, selectedField, filterLevel]);

  const stats = useMemo(() => {
    const all = detected.map((d) =>
      selectedField === 'bullet' ? d.bulletDetect : d.paragraphDetect,
    );
    return {
      high: all.filter((d) => d.level === 'high').length,
      medium: all.filter((d) => d.level === 'medium').length,
      low: all.filter((d) => d.level === 'low').length,
    };
  }, [detected, selectedField]);

  const handleBatchHumanize = useCallback(async () => {
    setProcessing(true);
    setResults([]);
    const toProcess = filtered.slice(0, 20); // Max 20 at a time
    setProgress({ current: 0, total: toProcess.length });

    for (let i = 0; i < toProcess.length; i++) {
      const item = toProcess[i];
      const text = item.question[selectedField];
      const detect = selectedField === 'bullet' ? item.bulletDetect : item.paragraphDetect;

      try {
        const res = await fetch('/api/humanize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text,
            triggers: detect.triggers,
            context: `${item.question.category} - ${item.question.topic}`,
          }),
        });
        const data = await res.json();
        if (data.text) {
          const humanizedDetect = detectAIWriting(data.text);
          setResults((prev) => [
            ...prev,
            {
              ref: item.ref,
              field: selectedField,
              original: text,
              humanized: data.text,
              originalDetect: detect,
              humanizedDetect,
              accepted: false,
            },
          ]);
        }
      } catch {
        /* skip failures */
      }

      setProgress({ current: i + 1, total: toProcess.length });
      // Small delay to avoid rate limiting
      if (i < toProcess.length - 1) await new Promise((r) => setTimeout(r, 500));
    }

    setProcessing(false);
    addToast('success', `Humanized ${toProcess.length} responses`);
  }, [filtered, selectedField, addToast]);

  const acceptResult = (idx: number) => {
    const r = results[idx];
    if (!r) return;
    const q = questions.find((q) => q.ref === r.ref);
    if (!q) return;
    onUpdateQuestion({ ...q, [r.field]: r.humanized });
    setResults((prev) => prev.map((p, i) => (i === idx ? { ...p, accepted: true } : p)));
    addToast('success', `Applied humanized version for ${r.ref}`);
  };

  const acceptAll = () => {
    for (let i = 0; i < results.length; i++) {
      if (!results[i].accepted) acceptResult(i);
    }
  };

  return (
    <div className="overflow-auto h-full p-6 bg-gray-50/30">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-50 rounded-lg">
              <Sparkles size={20} className="text-emerald-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">AI Detection & Humanize</h2>
              <p className="text-xs text-gray-400">
                Compare original vs humanized responses side by side
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={selectedField}
              onChange={(e) => setSelectedField(e.target.value as 'bullet' | 'paragraph')}
              className="border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs bg-white"
            >
              <option value="bullet">Bullet Responses</option>
              <option value="paragraph">Paragraph Responses</option>
            </select>
            <select
              value={filterLevel}
              onChange={(e) => setFilterLevel(e.target.value as 'all' | 'high' | 'medium')}
              className="border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs bg-white"
            >
              <option value="high">High Risk Only ({stats.high})</option>
              <option value="medium">Medium + High ({stats.high + stats.medium})</option>
              <option value="all">All Flagged</option>
            </select>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-red-600">{stats.high}</div>
            <div className="text-xs text-red-500">High AI Risk</div>
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-amber-600">{stats.medium}</div>
            <div className="text-xs text-amber-500">Medium Risk</div>
          </div>
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-emerald-600">{stats.low}</div>
            <div className="text-xs text-emerald-500">Human-like</div>
          </div>
        </div>

        {/* Batch actions */}
        <div className="flex items-center gap-2 mb-4">
          <button
            onClick={handleBatchHumanize}
            disabled={processing || filtered.length === 0}
            className="flex items-center gap-1.5 bg-emerald-600 text-white px-4 py-2 rounded-lg text-xs font-medium hover:bg-emerald-700 disabled:opacity-40 shadow-sm"
          >
            <Sparkles size={13} />{' '}
            {processing
              ? `Humanizing ${progress.current}/${progress.total}...`
              : `Humanize ${Math.min(filtered.length, 20)} Responses`}
          </button>
          {results.length > 0 && !processing && (
            <button
              onClick={acceptAll}
              className="flex items-center gap-1.5 bg-blue-600 text-white px-4 py-2 rounded-lg text-xs font-medium hover:bg-blue-700 shadow-sm"
            >
              <Check size={13} /> Accept All ({results.filter((r) => !r.accepted).length})
            </button>
          )}
          {processing && (
            <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all"
                style={{ width: `${(progress.current / progress.total) * 100}%` }}
              />
            </div>
          )}
        </div>

        {/* Results: side by side comparison */}
        {results.length > 0 && (
          <div className="space-y-4 mb-8">
            <h3 className="text-sm font-semibold text-gray-700">Results — Original vs Humanized</h3>
            {results.map((r, idx) => (
              <div
                key={r.ref}
                className={`border rounded-xl overflow-hidden ${r.accepted ? 'border-emerald-200 bg-emerald-50/30' : 'border-gray-200'}`}
              >
                <div className="flex items-center justify-between px-4 py-2 bg-gray-50 border-b">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-semibold text-blue-600">{r.ref}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded border font-semibold ${aiDetectClasses(r.originalDetect.level)}`}
                    >
                      Before: {aiDetectLabel(r.originalDetect.level)} ({r.originalDetect.score})
                    </span>
                    <span className="text-gray-400">→</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded border font-semibold ${aiDetectClasses(r.humanizedDetect.level)}`}
                    >
                      After: {aiDetectLabel(r.humanizedDetect.level)} ({r.humanizedDetect.score})
                    </span>
                  </div>
                  {!r.accepted ? (
                    <button
                      onClick={() => acceptResult(idx)}
                      className="flex items-center gap-1 text-xs bg-emerald-600 text-white px-2.5 py-1 rounded font-medium hover:bg-emerald-700"
                    >
                      <Check size={11} /> Accept
                    </button>
                  ) : (
                    <span className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                      <Check size={11} /> Applied
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-2 divide-x divide-gray-200">
                  <div className="p-4">
                    <div className="text-[10px] font-semibold text-red-500 uppercase mb-2">
                      Original
                    </div>
                    <div className="text-xs text-gray-700 whitespace-pre-wrap leading-relaxed max-h-48 overflow-auto">
                      {r.original.slice(0, 800)}
                      {r.original.length > 800 ? '...' : ''}
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="text-[10px] font-semibold text-emerald-600 uppercase mb-2">
                      Humanized
                    </div>
                    <div className="text-xs text-gray-700 whitespace-pre-wrap leading-relaxed max-h-48 overflow-auto">
                      {r.humanized.slice(0, 800)}
                      {r.humanized.length > 800 ? '...' : ''}
                    </div>
                  </div>
                </div>
                {r.originalDetect.triggers.length > 0 && (
                  <div className="px-4 py-2 bg-gray-50 border-t text-[10px] text-gray-400">
                    Triggers removed: {r.originalDetect.triggers.join(', ')}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Flagged questions list (before humanizing) */}
        {results.length === 0 && (
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500 uppercase">
                    Ref
                  </th>
                  <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500 uppercase">
                    Category
                  </th>
                  <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500 uppercase">
                    AI Score
                  </th>
                  <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500 uppercase">
                    Level
                  </th>
                  <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500 uppercase">
                    Triggers
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((d) => {
                  const detect = selectedField === 'bullet' ? d.bulletDetect : d.paragraphDetect;
                  return (
                    <tr key={d.ref} className="hover:bg-gray-50">
                      <td className="px-4 py-2 font-mono text-xs text-blue-600">{d.ref}</td>
                      <td className="px-4 py-2 text-xs text-gray-600">{d.question.category}</td>
                      <td className="px-4 py-2 text-xs font-bold">{detect.score}</td>
                      <td className="px-4 py-2">
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded border font-semibold ${aiDetectClasses(detect.level)}`}
                        >
                          {aiDetectLabel(detect.level)}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-[10px] text-gray-400">
                        {detect.triggers.slice(0, 3).join(', ')}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div className="text-center py-12 text-gray-400">
                <p className="text-sm font-medium">All responses look human-written</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
