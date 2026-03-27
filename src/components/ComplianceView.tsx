'use client';

import { useMemo } from 'react';
import type { Question } from '@/types';

interface ComplianceViewProps {
  questions: Question[];
  categories: string[];
  onUpdateCompliant: (ref: string, value: string) => void;
}

function ComplianceToggle({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const options = ['Y', 'Partial', 'N'];
  return (
    <div className="flex gap-1">
      {options.map((opt) => {
        const active = value === opt;
        const cls = active
          ? opt === 'Y'
            ? 'bg-emerald-600 text-white'
            : opt === 'N'
              ? 'bg-red-600 text-white'
              : 'bg-amber-500 text-white'
          : 'bg-gray-100 text-gray-500 hover:bg-gray-200';
        return (
          <button
            key={opt}
            onClick={() => onChange(opt)}
            className={`text-[10px] font-semibold px-2 py-1 rounded-lg ${cls} transition-colors`}
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
}

export default function ComplianceView({
  questions,
  categories,
  onUpdateCompliant,
}: ComplianceViewProps) {
  const grouped = useMemo(() => {
    const map: Record<string, Question[]> = {};
    for (const q of questions) {
      if (!map[q.category]) map[q.category] = [];
      map[q.category].push(q);
    }
    return map;
  }, [questions]);

  const totals = useMemo(() => {
    let y = 0,
      n = 0,
      partial = 0;
    for (const q of questions) {
      if (q.compliant === 'Y') y++;
      else if (q.compliant === 'N') n++;
      else partial++;
    }
    return { y, n, partial };
  }, [questions]);

  return (
    <div className="overflow-auto h-full p-6 bg-gray-50/30">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Compliance Matrix</h2>
            <p className="text-xs text-gray-400">Toggle compliance status for each question</p>
          </div>
          <div className="flex items-center gap-4 text-xs font-medium">
            <span className="text-emerald-600">{totals.y} Compliant</span>
            <span className="text-amber-600">{totals.partial} Partial</span>
            <span className="text-red-600">{totals.n} Non-compliant</span>
          </div>
        </div>

        {categories.map((cat) => {
          const catQs = grouped[cat];
          if (!catQs || catQs.length === 0) return null;
          const catY = catQs.filter((q) => q.compliant === 'Y').length;
          return (
            <div key={cat} className="mb-6">
              <div className="flex items-center justify-between px-4 py-2 bg-white border border-gray-200 rounded-t-xl">
                <h3 className="text-sm font-semibold text-gray-900">{cat}</h3>
                <span className="text-xs text-gray-400">
                  {catY}/{catQs.length} compliant
                </span>
              </div>
              <div className="bg-white border border-t-0 border-gray-200 rounded-b-xl divide-y divide-gray-100">
                {catQs.map((q) => (
                  <div key={q.ref} className="flex items-center gap-4 px-4 py-2.5 hover:bg-gray-50">
                    <span className="text-xs font-medium text-blue-600 w-40 flex-shrink-0">
                      {q.ref}
                    </span>
                    <span className="text-xs text-gray-600 flex-1 truncate">
                      {q.requirement.slice(0, 100)}
                    </span>
                    <ComplianceToggle
                      value={q.compliant}
                      onChange={(v) => onUpdateCompliant(q.ref, v)}
                    />
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
