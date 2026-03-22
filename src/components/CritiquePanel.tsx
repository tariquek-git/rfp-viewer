'use client';

import { CheckCircle, AlertTriangle, Lightbulb } from 'lucide-react';
import type { CritiqueResult } from '@/types';

interface CritiquePanelProps {
  result: CritiqueResult;
}

export default function CritiquePanel({ result }: CritiquePanelProps) {
  const scoreColor =
    result.score >= 7
      ? 'text-emerald-600 bg-emerald-50 border-emerald-200'
      : result.score >= 5
        ? 'text-amber-600 bg-amber-50 border-amber-200'
        : 'text-red-600 bg-red-50 border-red-200';

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden bg-white mt-3">
      <div className="px-4 py-2.5 bg-gray-50 border-b flex items-center justify-between">
        <span className="text-xs font-semibold text-gray-600">AI Critique</span>
        <span className={`text-sm font-bold px-2.5 py-0.5 rounded-full border ${scoreColor}`}>
          {result.score}/10
        </span>
      </div>

      <div className="p-4 space-y-3">
        {result.strengths.length > 0 && (
          <div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 mb-1.5">
              <CheckCircle size={12} /> Strengths
            </div>
            <ul className="space-y-1">
              {result.strengths.map((s, i) => (
                <li
                  key={i}
                  className="text-xs text-gray-600 pl-4 relative before:content-[''] before:absolute before:left-1 before:top-1.5 before:w-1.5 before:h-1.5 before:rounded-full before:bg-emerald-400"
                >
                  {s}
                </li>
              ))}
            </ul>
          </div>
        )}

        {result.weaknesses.length > 0 && (
          <div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-red-700 mb-1.5">
              <AlertTriangle size={12} /> Weaknesses
            </div>
            <ul className="space-y-1">
              {result.weaknesses.map((w, i) => (
                <li
                  key={i}
                  className="text-xs text-gray-600 pl-4 relative before:content-[''] before:absolute before:left-1 before:top-1.5 before:w-1.5 before:h-1.5 before:rounded-full before:bg-red-400"
                >
                  {w}
                </li>
              ))}
            </ul>
          </div>
        )}

        {result.suggestions.length > 0 && (
          <div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-blue-700 mb-1.5">
              <Lightbulb size={12} /> Suggestions
            </div>
            <ul className="space-y-1">
              {result.suggestions.map((s, i) => (
                <li
                  key={i}
                  className="text-xs text-gray-600 pl-4 relative before:content-[''] before:absolute before:left-1 before:top-1.5 before:w-1.5 before:h-1.5 before:rounded-full before:bg-blue-400"
                >
                  {s}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
