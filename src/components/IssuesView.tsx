'use client';

import React, { useState, useMemo } from 'react';
import { AlertTriangle, AlertCircle, Info, ChevronRight, X, Filter } from 'lucide-react';
import type { Question } from '@/types';

interface IssuesViewProps {
  questions: Question[];
  onSelectQuestion: (q: Question) => void;
}

type SeverityFilter = 'ALL' | 'HIGH' | 'MEDIUM' | 'RED';

const SEVERITY_ORDER: Record<string, number> = { HIGH: 0, MEDIUM: 1, LOW: 2 };

function getRiskSeverity(q: Question): 'HIGH' | 'MEDIUM' | 'LOW' | null {
  const risk = (q.committee_risk || '').toUpperCase().trim();
  if (risk === 'HIGH') return 'HIGH';
  if (risk === 'MEDIUM') return 'MEDIUM';
  if (risk === 'LOW') return 'LOW';
  return null;
}

function getConfidenceRed(q: Question): boolean {
  return (q.confidence || '').toUpperCase().trim() === 'RED';
}

function hasFlag(q: Question): boolean {
  return !!(q.committee_review || '').trim();
}

function SeverityBadge({ level }: { level: 'HIGH' | 'MEDIUM' | 'LOW' }) {
  if (level === 'HIGH')
    return (
      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-700 uppercase tracking-wide">
        <AlertTriangle size={9} /> HIGH
      </span>
    );
  if (level === 'MEDIUM')
    return (
      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-700 uppercase tracking-wide">
        <AlertCircle size={9} /> MEDIUM
      </span>
    );
  return (
    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-600 uppercase tracking-wide">
      <Info size={9} /> LOW
    </span>
  );
}

function ConfidenceBadge({ value }: { value: string }) {
  const v = (value || '').toUpperCase().trim();
  if (v === 'RED')
    return (
      <span className="inline-block w-1.5 h-1.5 rounded-full bg-red-500" title="RED confidence" />
    );
  if (v === 'YELLOW')
    return (
      <span
        className="inline-block w-1.5 h-1.5 rounded-full bg-yellow-400"
        title="YELLOW confidence"
      />
    );
  return (
    <span
      className="inline-block w-1.5 h-1.5 rounded-full bg-green-500"
      title="GREEN confidence"
    />
  );
}

/** Split committee_review — may be pipe-delimited (flag | prior notes) */
function parseFlagText(review: string): { flag: string; notes: string } {
  const idx = review.indexOf(' | ');
  if (idx === -1) return { flag: review, notes: '' };
  return { flag: review.slice(0, idx), notes: review.slice(idx + 3) };
}

export default function IssuesView({ questions, onSelectQuestion }: IssuesViewProps) {
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>('ALL');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [search, setSearch] = useState('');

  const flaggedQuestions = useMemo(() => {
    return questions
      .filter((q) => {
        const risk = getRiskSeverity(q);
        const isRed = getConfidenceRed(q);
        return (risk === 'HIGH' || risk === 'MEDIUM' || isRed) && hasFlag(q);
      })
      .sort((a, b) => {
        const ra = SEVERITY_ORDER[getRiskSeverity(a) ?? 'LOW'] ?? 2;
        const rb = SEVERITY_ORDER[getRiskSeverity(b) ?? 'LOW'] ?? 2;
        if (ra !== rb) return ra - rb;
        return a.ref.localeCompare(b.ref);
      });
  }, [questions]);

  const categories = useMemo(() => {
    const cats = new Set(flaggedQuestions.map((q) => q.category));
    return ['All', ...Array.from(cats).sort()];
  }, [flaggedQuestions]);

  const filtered = useMemo(() => {
    return flaggedQuestions.filter((q) => {
      const risk = getRiskSeverity(q);
      const isRed = getConfidenceRed(q);

      if (severityFilter === 'HIGH' && risk !== 'HIGH') return false;
      if (severityFilter === 'MEDIUM' && risk !== 'MEDIUM') return false;
      if (severityFilter === 'RED' && !isRed) return false;

      if (categoryFilter !== 'All' && q.category !== categoryFilter) return false;

      if (search) {
        const s = search.toLowerCase();
        return (
          q.ref.toLowerCase().includes(s) ||
          q.topic.toLowerCase().includes(s) ||
          (q.committee_review || '').toLowerCase().includes(s)
        );
      }

      return true;
    });
  }, [flaggedQuestions, severityFilter, categoryFilter, search]);

  const counts = useMemo(() => {
    const high = flaggedQuestions.filter((q) => getRiskSeverity(q) === 'HIGH').length;
    const medium = flaggedQuestions.filter((q) => getRiskSeverity(q) === 'MEDIUM').length;
    const red = flaggedQuestions.filter((q) => getConfidenceRed(q)).length;
    return { high, medium, red, total: flaggedQuestions.length };
  }, [flaggedQuestions]);

  return (
    <div className="flex flex-col h-full overflow-hidden bg-white">
      {/* Summary bar */}
      <div className="flex items-center gap-3 px-5 py-3 border-b border-gray-100 bg-gray-50 flex-shrink-0">
        <div className="flex items-center gap-1.5">
          <AlertTriangle size={13} className="text-red-500" />
          <span className="text-xs font-semibold text-gray-700">Action Required</span>
          <span className="ml-1 px-1.5 py-0.5 rounded-full bg-gray-200 text-[10px] font-bold text-gray-600 tabular-nums">
            {counts.total}
          </span>
        </div>
        <div className="flex items-center gap-2 ml-2">
          <button
            onClick={() => setSeverityFilter(severityFilter === 'HIGH' ? 'ALL' : 'HIGH')}
            className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold transition-all ${severityFilter === 'HIGH' ? 'bg-red-600 text-white' : 'bg-red-100 text-red-700 hover:bg-red-200'}`}
          >
            <AlertTriangle size={9} /> HIGH {counts.high}
          </button>
          <button
            onClick={() => setSeverityFilter(severityFilter === 'MEDIUM' ? 'ALL' : 'MEDIUM')}
            className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold transition-all ${severityFilter === 'MEDIUM' ? 'bg-amber-500 text-white' : 'bg-amber-100 text-amber-700 hover:bg-amber-200'}`}
          >
            <AlertCircle size={9} /> MEDIUM {counts.medium}
          </button>
          <button
            onClick={() => setSeverityFilter(severityFilter === 'RED' ? 'ALL' : 'RED')}
            className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold transition-all ${severityFilter === 'RED' ? 'bg-gray-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            RED conf. {counts.red}
          </button>
        </div>

        {/* Category filter */}
        <div className="ml-auto flex items-center gap-2">
          <Filter size={11} className="text-gray-400" />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="text-xs border border-gray-200 rounded px-2 py-0.5 bg-white text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-300"
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          {/* Search */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search issues…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="text-xs border border-gray-200 rounded pl-2 pr-6 py-0.5 w-44 bg-white focus:outline-none focus:ring-1 focus:ring-blue-300"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-1 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X size={10} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Issues list */}
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-gray-400">
            <AlertTriangle size={28} className="mb-2 opacity-30" />
            <p className="text-sm">No issues match current filters.</p>
          </div>
        ) : (
          <table className="w-full text-xs">
            <thead>
              <tr className="sticky top-0 bg-white border-b border-gray-100 z-10">
                <th className="text-left font-semibold text-gray-500 py-2 pl-5 pr-2 w-24">
                  Severity
                </th>
                <th className="text-left font-semibold text-gray-500 py-2 px-2 w-28">Ref</th>
                <th className="text-left font-semibold text-gray-500 py-2 px-2">Flag / Issue</th>
                <th className="text-left font-semibold text-gray-500 py-2 px-2 w-14 text-center">
                  Score
                </th>
                <th className="py-2 pr-4 w-8"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((q) => {
                const risk = getRiskSeverity(q);
                const { flag, notes } = parseFlagText(q.committee_review || '');
                const rowBg =
                  risk === 'HIGH'
                    ? 'hover:bg-red-50/60'
                    : risk === 'MEDIUM'
                      ? 'hover:bg-amber-50/60'
                      : 'hover:bg-gray-50';
                return (
                  <tr
                    key={q.ref}
                    onClick={() => onSelectQuestion(q)}
                    className={`border-b border-gray-50 cursor-pointer transition-colors ${rowBg}`}
                  >
                    <td className="py-2.5 pl-5 pr-2 align-top">
                      <div className="flex flex-col gap-1">
                        {risk && <SeverityBadge level={risk} />}
                        <ConfidenceBadge value={q.confidence} />
                      </div>
                    </td>
                    <td className="py-2.5 px-2 align-top">
                      <div className="font-semibold text-gray-800 leading-snug">{q.ref}</div>
                      <div className="text-[10px] text-gray-400 mt-0.5 leading-snug">
                        {q.category}
                      </div>
                    </td>
                    <td className="py-2.5 px-2 align-top max-w-0">
                      <div className="font-medium text-gray-800 leading-snug break-words">
                        {flag}
                      </div>
                      {notes && (
                        <div className="text-[10px] text-gray-400 mt-1 leading-snug line-clamp-2">
                          Prior note: {notes}
                        </div>
                      )}
                      <div className="text-[10px] text-gray-500 mt-1.5 italic leading-snug line-clamp-2">
                        {(q.paragraph || q.bullet || '').slice(0, 140)}
                        {(q.paragraph || q.bullet || '').length > 140 ? '…' : ''}
                      </div>
                    </td>
                    <td className="py-2.5 px-2 align-top text-center">
                      <span
                        className={`font-bold tabular-nums ${q.committee_score <= 4 ? 'text-red-600' : q.committee_score <= 6 ? 'text-amber-600' : 'text-green-600'}`}
                      >
                        {q.committee_score}
                      </span>
                      <span className="text-gray-300">/10</span>
                    </td>
                    <td className="py-2.5 pr-4 align-top">
                      <ChevronRight size={13} className="text-gray-300" />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
