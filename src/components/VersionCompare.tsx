'use client';

import { useState, useMemo } from 'react';
import { X, GitCompareArrows } from 'lucide-react';
import type { Version, Question } from '@/types';

interface VersionCompareProps {
  versions: Version[];
  currentQuestions: Question[];
  onClose: () => void;
}

interface Diff {
  ref: string;
  field: string;
  oldValue: string;
  newValue: string;
}

export default function VersionCompare({
  versions,
  currentQuestions,
  onClose,
}: VersionCompareProps) {
  const [leftIdx, setLeftIdx] = useState(versions.length > 1 ? versions.length - 2 : 0);
  const [rightIdx, setRightIdx] = useState(-1); // -1 = current

  const leftLabel = versions[leftIdx]?.label || '?';
  const rightLabel = rightIdx === -1 ? 'Current' : versions[rightIdx]?.label || '?';

  const diffs = useMemo(() => {
    const leftQuestions = versions[leftIdx]?.data.questions || [];
    const rightQuestions =
      rightIdx === -1 ? currentQuestions : versions[rightIdx]?.data.questions || [];
    const result: Diff[] = [];
    const fields: (keyof Question)[] = [
      'bullet',
      'paragraph',
      'rationale',
      'notes',
      'confidence',
      'compliant',
      'status',
      'committee_score',
    ];
    const rightMap = new Map(rightQuestions.map((q) => [q.ref, q]));

    for (const lq of leftQuestions) {
      const rq = rightMap.get(lq.ref);
      if (!rq) continue;
      for (const field of fields) {
        const lv = String(lq[field] ?? '');
        const rv = String(rq[field] ?? '');
        if (lv !== rv) {
          result.push({ ref: lq.ref, field, oldValue: lv, newValue: rv });
        }
      }
    }
    return result;
  }, [versions, leftIdx, rightIdx, currentQuestions]);

  const groupedDiffs = useMemo(() => {
    const map: Record<string, Diff[]> = {};
    for (const d of diffs) {
      if (!map[d.ref]) map[d.ref] = [];
      map[d.ref].push(d);
    }
    return map;
  }, [diffs]);

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div className="flex items-center gap-2">
            <GitCompareArrows size={18} className="text-blue-600" />
            <h2 className="text-base font-semibold">Version Comparison</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
          >
            <X size={16} />
          </button>
        </div>

        {/* Version selectors */}
        <div className="px-6 py-3 border-b flex items-center gap-4">
          <div className="flex-1">
            <label className="text-[10px] text-gray-500 uppercase font-semibold mb-1 block">
              Left (older)
            </label>
            <select
              value={leftIdx}
              onChange={(e) => setLeftIdx(Number(e.target.value))}
              className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm bg-white"
            >
              {versions.map((v, i) => (
                <option key={i} value={i}>
                  {v.label} — {new Date(v.timestamp).toLocaleString()}
                </option>
              ))}
            </select>
          </div>
          <div className="text-gray-400 mt-5">vs</div>
          <div className="flex-1">
            <label className="text-[10px] text-gray-500 uppercase font-semibold mb-1 block">
              Right (newer)
            </label>
            <select
              value={rightIdx}
              onChange={(e) => setRightIdx(Number(e.target.value))}
              className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm bg-white"
            >
              <option value={-1}>Current (unsaved)</option>
              {versions.map((v, i) => (
                <option key={i} value={i}>
                  {v.label} — {new Date(v.timestamp).toLocaleString()}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-auto px-6 py-4">
          <div className="text-xs text-gray-500 mb-4">
            {diffs.length} changes across {Object.keys(groupedDiffs).length} questions between{' '}
            <strong>{leftLabel}</strong> and <strong>{rightLabel}</strong>
          </div>

          {diffs.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <p className="text-lg font-medium">No differences found</p>
              <p className="text-sm mt-1">These versions are identical.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {Object.entries(groupedDiffs).map(([ref, refDiffs]) => (
                <div key={ref} className="border border-gray-200 rounded-xl overflow-hidden">
                  <div className="bg-gray-50 px-4 py-2 text-sm font-semibold text-blue-600">
                    {ref}
                  </div>
                  <div className="divide-y divide-gray-100">
                    {refDiffs.map((d, i) => (
                      <div key={i} className="px-4 py-3">
                        <div className="text-[10px] text-gray-500 uppercase font-semibold mb-1.5">
                          {d.field}
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="bg-red-50 rounded-lg p-2.5 text-xs text-gray-700 whitespace-pre-wrap max-h-32 overflow-auto">
                            {d.oldValue || <span className="text-gray-300 italic">empty</span>}
                          </div>
                          <div className="bg-emerald-50 rounded-lg p-2.5 text-xs text-gray-700 whitespace-pre-wrap max-h-32 overflow-auto">
                            {d.newValue || <span className="text-gray-300 italic">empty</span>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
