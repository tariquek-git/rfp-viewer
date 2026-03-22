"use client";

import type { RFPData } from "@/types";
import { useMemo } from "react";

interface ContextViewProps {
  data: RFPData;
}

function StatCard({ value, label, color }: { value: number | string; label: string; color?: string }) {
  return (
    <div className={`border rounded-lg p-4 ${color || ""}`}>
      <div className={`text-3xl font-bold ${color ? "" : "text-gray-900"}`}>{value}</div>
      <div className="text-sm text-gray-500 mt-1">{label}</div>
    </div>
  );
}

function SectionScoreCard({ name, score, count, high, med, low }: { name: string; score: number; count: number; high: number; med: number; low: number }) {
  const grade = score >= 7.5 ? "A" : score >= 6.5 ? "B" : score >= 5.5 ? "C" : "D";
  const gradeColor = grade === "A" ? "bg-green-100 text-green-700" : grade === "B" ? "bg-blue-100 text-blue-700" : grade === "C" ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700";
  const total = high + med + low;
  const lowPct = total > 0 ? Math.round((low / total) * 100) : 0;

  return (
    <div className="border rounded-lg p-4">
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-medium text-gray-900">{name}</h4>
        <span className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold ${gradeColor}`}>{grade}</span>
      </div>
      <div className="text-sm text-gray-500 mb-3">
        <span className="font-semibold text-gray-900">{score.toFixed(1)}</span>/10 · {count} questions
      </div>
      <div className="flex h-2 rounded-full overflow-hidden mb-2">
        {high > 0 && <div className="bg-red-400" style={{ width: `${(high / total) * 100}%` }} />}
        {med > 0 && <div className="bg-yellow-400" style={{ width: `${(med / total) * 100}%` }} />}
        {low > 0 && <div className="bg-green-400" style={{ width: `${(low / total) * 100}%` }} />}
      </div>
      <div className="flex justify-between text-xs text-gray-400">
        <span>{high} high</span>
        <span>{med} med</span>
        <span>{low} low</span>
      </div>
      <div className="text-xs text-gray-400 mt-1">{lowPct}% low risk</div>
    </div>
  );
}

export default function ContextView({ data }: ContextViewProps) {
  const sectionStats = useMemo(() => {
    const sections: Record<string, { count: number; totalScore: number; high: number; med: number; low: number }> = {};
    for (const q of data.questions) {
      if (!sections[q.category]) {
        sections[q.category] = { count: 0, totalScore: 0, high: 0, med: 0, low: 0 };
      }
      const s = sections[q.category];
      s.count++;
      s.totalScore += q.committee_score || 0;
      if (q.committee_score <= 4) s.high++;
      else if (q.committee_score <= 6) s.med++;
      else s.low++;
    }
    return sections;
  }, [data]);

  const overallScore = useMemo(() => {
    const total = data.questions.reduce((sum, q) => sum + (q.committee_score || 0), 0);
    return data.questions.length > 0 ? total / data.questions.length : 0;
  }, [data]);

  const riskCounts = useMemo(() => {
    let high = 0, med = 0, low = 0;
    for (const q of data.questions) {
      if (q.committee_score <= 4) high++;
      else if (q.committee_score <= 6) med++;
      else low++;
    }
    return { high, med, low };
  }, [data]);

  return (
    <div className="overflow-auto h-full p-6 space-y-6">
      {/* Top Stats */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard value={data.stats.total} label="Total Questions" />
        <StatCard value={data.stats.green} label={`GREEN (${Math.round((data.stats.green / data.stats.total) * 100)}%)`} color="border-green-200 text-green-600" />
        <StatCard value={data.stats.yellow} label="YELLOW — need strengthening" color="border-yellow-200 text-yellow-600" />
        <StatCard value={data.stats.red} label="RED — gaps / risks" color="border-red-200 text-red-600" />
      </div>

      {/* Strategic & Regulatory */}
      <div className="grid grid-cols-2 gap-4">
        <StatCard value={data.stats.with_strategic} label="Questions with Strategic Positioning" color="border-purple-200 text-purple-600" />
        <StatCard value={data.stats.with_reg_enable} label="Questions with Regulatory Enablement" color="border-blue-200 text-blue-600" />
      </div>

      {/* Procurement Committee Risk Assessment */}
      <div className="border rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Procurement Committee Risk Assessment</h3>
            <p className="text-sm text-gray-500">How a senior bank procurement committee would evaluate each response</p>
          </div>
          <div className="text-right">
            <div className="text-4xl font-bold text-gray-900">{overallScore.toFixed(1)}<span className="text-lg text-gray-400">/10</span></div>
            <div className="text-sm text-gray-500">Overall Score</div>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="border rounded-lg p-4 border-red-200">
            <div className="text-3xl font-bold text-red-500">{riskCounts.high}</div>
            <div className="text-sm font-semibold text-red-500">HIGH RISK</div>
            <div className="text-xs text-gray-400">Score 1-4 · Will be challenged</div>
          </div>
          <div className="border rounded-lg p-4 border-yellow-200">
            <div className="text-3xl font-bold text-yellow-500">{riskCounts.med}</div>
            <div className="text-sm font-semibold text-yellow-500">MEDIUM</div>
            <div className="text-xs text-gray-400">Score 5-6 · Should strengthen</div>
          </div>
          <div className="border rounded-lg p-4 border-green-200">
            <div className="text-3xl font-bold text-green-500">{riskCounts.low}</div>
            <div className="text-sm font-semibold text-green-500">LOW RISK</div>
            <div className="text-xs text-gray-400">Score 7-10 · No concerns</div>
          </div>
        </div>
      </div>

      {/* Section Scorecards */}
      <div className="border rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-1">Section Scorecards</h3>
        <p className="text-sm text-gray-500 mb-4">Click any section to jump to it in Grid view</p>
        <div className="grid grid-cols-3 gap-4">
          {data.categories.map((cat) => {
            const s = sectionStats[cat];
            if (!s) return null;
            const avg = s.count > 0 ? s.totalScore / s.count : 0;
            return (
              <SectionScoreCard
                key={cat}
                name={cat}
                score={avg}
                count={s.count}
                high={s.high}
                med={s.med}
                low={s.low}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
