'use client';

import type { RFPData } from '@/types';
import { useMemo } from 'react';
import {
  FileText,
  Shield,
  AlertTriangle,
  CheckCircle,
  Crosshair,
  Scale,
  TrendingUp,
} from 'lucide-react';

interface ContextViewProps {
  data: RFPData;
  onNavigate?: (tab: string, filter?: { confidence?: string; category?: string }) => void;
  onBulkApproveGreen?: () => void;
}

function StatCard({
  value,
  label,
  icon: Icon,
  accent,
  onClick,
}: {
  value: number | string;
  label: string;
  icon: React.ElementType;
  accent: string;
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={`bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow ${onClick ? 'cursor-pointer hover:border-blue-300' : ''}`}
    >
      <div className="flex items-start justify-between">
        <div>
          <div className={`text-3xl font-bold ${accent}`}>{value}</div>
          <div className="text-xs text-gray-500 mt-1.5 leading-snug">{label}</div>
        </div>
        <div className={`p-2 rounded-lg bg-gray-50`}>
          <Icon size={18} className="text-gray-400" />
        </div>
      </div>
    </div>
  );
}

function RiskCard({
  value,
  label,
  sublabel,
  accent,
  border,
}: {
  value: number;
  label: string;
  sublabel: string;
  accent: string;
  border: string;
}) {
  return (
    <div className={`border-2 ${border} rounded-xl p-5 text-center shadow-sm`}>
      <div className={`text-3xl font-bold ${accent}`}>{value}</div>
      <div className={`text-sm font-semibold ${accent} mt-1`}>{label}</div>
      <div className="text-xs text-gray-500 mt-1">{sublabel}</div>
    </div>
  );
}

function SectionScoreCard({
  name,
  score,
  count,
  high,
  med,
  low,
  onClick,
}: {
  name: string;
  score: number;
  count: number;
  high: number;
  med: number;
  low: number;
  onClick?: () => void;
}) {
  const grade = score >= 7.5 ? 'A' : score >= 6.5 ? 'B' : score >= 5.5 ? 'C' : 'D';
  const gradeColors: Record<string, string> = {
    A: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    B: 'bg-blue-100 text-blue-700 border-blue-200',
    C: 'bg-amber-100 text-amber-700 border-amber-200',
    D: 'bg-red-100 text-red-700 border-red-200',
  };
  const total = high + med + low;
  const lowPct = total > 0 ? Math.round((low / total) * 100) : 0;

  return (
    <div
      onClick={onClick}
      className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-all hover:border-blue-300 cursor-pointer group"
    >
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-semibold text-sm text-gray-900 group-hover:text-blue-600 transition-colors">
          {name}
        </h4>
        <span
          className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border ${gradeColors[grade]}`}
        >
          {grade}
        </span>
      </div>
      <div className="text-sm text-gray-500 mb-3">
        <span className="font-bold text-gray-900 text-xl">{score.toFixed(1)}</span>
        <span className="text-gray-400">/10</span>
        <span className="text-gray-300 mx-1.5">·</span>
        <span>{count} questions</span>
      </div>
      <div className="flex h-1.5 rounded-full overflow-hidden mb-2 bg-gray-100">
        {high > 0 && (
          <div className="bg-red-400 rounded-l" style={{ width: `${(high / total) * 100}%` }} />
        )}
        {med > 0 && <div className="bg-amber-400" style={{ width: `${(med / total) * 100}%` }} />}
        {low > 0 && (
          <div className="bg-emerald-400 rounded-r" style={{ width: `${(low / total) * 100}%` }} />
        )}
      </div>
      <div className="flex justify-between text-[10px] text-gray-400 font-medium">
        <span>{high} high</span>
        <span>{med} med</span>
        <span>{low} low</span>
      </div>
      <div className="text-[10px] text-gray-400 mt-1">{lowPct}% low risk</div>
    </div>
  );
}

export default function ContextView({ data, onNavigate, onBulkApproveGreen }: ContextViewProps) {
  const sectionStats = useMemo(() => {
    const sections: Record<
      string,
      { count: number; totalScore: number; high: number; med: number; low: number }
    > = {};
    for (const q of data.questions) {
      if (!sections[q.category])
        sections[q.category] = { count: 0, totalScore: 0, high: 0, med: 0, low: 0 };
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
    let high = 0,
      med = 0,
      low = 0;
    for (const q of data.questions) {
      if (q.committee_score <= 4) high++;
      else if (q.committee_score <= 6) med++;
      else low++;
    }
    return { high, med, low };
  }, [data]);

  // Flagged questions for the Action Required card
  const flaggedIssues = useMemo(() => {
    return data.questions
      .filter((q) => {
        const risk = (q.committee_risk || '').toUpperCase().trim();
        return (risk === 'HIGH' || risk === 'MEDIUM') && (q.committee_review || '').trim();
      })
      .sort((a, b) => {
        const order = { HIGH: 0, MEDIUM: 1 };
        const ra = order[(a.committee_risk || '').toUpperCase().trim() as keyof typeof order] ?? 2;
        const rb = order[(b.committee_risk || '').toUpperCase().trim() as keyof typeof order] ?? 2;
        return ra - rb;
      });
  }, [data]);

  // Compute live stats from questions array so they stay accurate after edits
  const liveStats = useMemo(() => {
    let green = 0,
      yellow = 0,
      red = 0,
      with_strategic = 0,
      with_reg_enable = 0,
      compliant_y = 0;
    for (const q of data.questions) {
      const c = (q.confidence || '').trim().toUpperCase();
      if (c === 'GREEN') green++;
      else if (c === 'YELLOW') yellow++;
      else if (c === 'RED') red++;
      if (q.strategic) with_strategic++;
      if (q.reg_enable) with_reg_enable++;
      if (q.compliant === 'Y') compliant_y++;
    }
    return {
      total: data.questions.length,
      green,
      yellow,
      red,
      with_strategic,
      with_reg_enable,
      compliant_y,
    };
  }, [data]);

  const greenPct = Math.round((liveStats.green / liveStats.total) * 100);

  const readinessScore = useMemo(() => {
    if (liveStats.total === 0) return 0;
    return Math.round(
      (liveStats.green / liveStats.total) * 50 + (liveStats.compliant_y / liveStats.total) * 50,
    );
  }, [liveStats]);

  return (
    <div className="overflow-auto h-full p-6 space-y-6 bg-gray-50/30">
      {/* Top Stats */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard
          value={liveStats.total}
          label="Total Questions"
          icon={FileText}
          accent="text-gray-900"
          onClick={() => onNavigate?.('grid')}
        />
        <StatCard
          value={liveStats.green}
          label={`GREEN (${greenPct}%) — click to filter`}
          icon={CheckCircle}
          accent="text-emerald-600"
          onClick={() => onNavigate?.('grid', { confidence: 'GREEN' })}
        />
        <StatCard
          value={liveStats.yellow}
          label="YELLOW — click to filter"
          icon={AlertTriangle}
          accent="text-amber-600"
          onClick={() => onNavigate?.('grid', { confidence: 'YELLOW' })}
        />
        <StatCard
          value={liveStats.red}
          label="RED — click to filter"
          icon={Shield}
          accent="text-red-600"
          onClick={() => onNavigate?.('grid', { confidence: 'RED' })}
        />
      </div>

      {/* Strategic & Regulatory */}
      <div className="grid grid-cols-2 gap-4">
        <StatCard
          value={liveStats.with_strategic}
          label="Questions with Strategic Positioning"
          icon={Crosshair}
          accent="text-violet-600"
        />
        <StatCard
          value={liveStats.with_reg_enable}
          label="Questions with Regulatory Enablement"
          icon={Scale}
          accent="text-blue-600"
        />
      </div>

      {/* Procurement Committee Risk Assessment — elevated */}
      <div className="bg-white border-2 border-blue-200 rounded-xl p-6 shadow-md">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-50 rounded-lg">
              <TrendingUp size={20} className="text-gray-600" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-gray-900">
                Procurement Committee Risk Assessment
              </h3>
              <p className="text-xs text-gray-400">
                How a senior bank procurement committee would evaluate each response
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-4xl font-bold text-gray-900">
              {overallScore.toFixed(1)}
              <span className="text-lg text-gray-300 ml-0.5">/10</span>
            </div>
            <div className="text-[11px] text-gray-400 font-medium uppercase tracking-wide">
              Overall Score
            </div>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <RiskCard
            value={riskCounts.high}
            label="HIGH RISK"
            sublabel="Score 1-4 · Will be challenged"
            accent="text-red-600"
            border="border-red-200 bg-red-50/50"
          />
          <RiskCard
            value={riskCounts.med}
            label="MEDIUM"
            sublabel="Score 5-6 · Should strengthen"
            accent="text-amber-600"
            border="border-amber-200 bg-amber-50/50"
          />
          <RiskCard
            value={riskCounts.low}
            label="LOW RISK"
            sublabel="Score 7-10 · No concerns"
            accent="text-emerald-600"
            border="border-emerald-200 bg-emerald-50/50"
          />
        </div>
      </div>

      {/* Action Required — flagged issues summary */}
      {flaggedIssues.length > 0 && (
        <div className="bg-white border-2 border-red-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <AlertTriangle size={16} className="text-red-500" />
              <h3 className="text-sm font-semibold text-gray-900">Action Required</h3>
              <span className="ml-1 px-1.5 py-0.5 rounded-full bg-red-100 text-[10px] font-bold text-red-700 tabular-nums">
                {flaggedIssues.length} issues
              </span>
            </div>
            <button
              onClick={() => onNavigate?.('issues')}
              className="text-[11px] text-blue-600 hover:text-blue-800 font-medium flex items-center gap-0.5"
            >
              View all →
            </button>
          </div>
          <div className="space-y-2">
            {flaggedIssues.slice(0, 5).map((q) => {
              const isHigh = (q.committee_risk || '').toUpperCase().trim() === 'HIGH';
              const flagText = (q.committee_review || '').split(' | ')[0];
              return (
                <div
                  key={q.ref}
                  onClick={() => onNavigate?.('issues')}
                  className="flex items-start gap-2.5 p-2.5 rounded-lg bg-gray-50 hover:bg-gray-100 cursor-pointer transition-colors"
                >
                  <span
                    className={`mt-0.5 flex-shrink-0 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${isHigh ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}
                  >
                    {isHigh ? 'HIGH' : 'MED'}
                  </span>
                  <div className="min-w-0">
                    <span className="text-[11px] font-semibold text-gray-700">{q.ref} </span>
                    <span className="text-[11px] text-gray-500 leading-snug">{flagText}</span>
                  </div>
                </div>
              );
            })}
            {flaggedIssues.length > 5 && (
              <button
                onClick={() => onNavigate?.('issues')}
                className="w-full text-[11px] text-gray-400 hover:text-gray-600 py-1 text-center"
              >
                +{flaggedIssues.length - 5} more — view all issues →
              </button>
            )}
          </div>
        </div>
      )}

      {/* Submission Readiness + Bulk Approve */}
      <div className="grid grid-cols-2 gap-4">
        <div
          className={`border-2 rounded-xl p-5 shadow-sm flex flex-col justify-between ${
            readinessScore >= 80
              ? 'border-emerald-300 bg-emerald-50/40'
              : readinessScore >= 60
                ? 'border-amber-300 bg-amber-50/40'
                : 'border-red-300 bg-red-50/40'
          }`}
        >
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-1">Submission Readiness</h3>
            <p className="text-[10px] text-gray-400 mb-3">
              Composite score: 50% GREEN confidence + 50% fully compliant
            </p>
          </div>
          <div className="flex items-end gap-2">
            <span
              className={`text-5xl font-bold ${
                readinessScore >= 80
                  ? 'text-emerald-600'
                  : readinessScore >= 60
                    ? 'text-amber-600'
                    : 'text-red-600'
              }`}
            >
              {readinessScore}
            </span>
            <span className="text-lg text-gray-400 mb-1">/100</span>
            <span
              className={`ml-auto text-xs font-semibold px-2 py-1 rounded-full ${
                readinessScore >= 80
                  ? 'bg-emerald-100 text-emerald-700'
                  : readinessScore >= 60
                    ? 'bg-amber-100 text-amber-700'
                    : 'bg-red-100 text-red-700'
              }`}
            >
              {readinessScore >= 80
                ? 'Ready'
                : readinessScore >= 60
                  ? 'Nearly Ready'
                  : 'Needs Work'}
            </span>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-1">Bulk Approve GREEN</h3>
            <p className="text-[10px] text-gray-400 mb-3">
              Approve all GREEN-confidence questions that are not yet approved.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-500">
              {
                data.questions.filter((q) => q.confidence === 'GREEN' && q.status !== 'approved')
                  .length
              }{' '}
              GREEN questions pending approval
            </span>
            {onBulkApproveGreen && (
              <button
                onClick={onBulkApproveGreen}
                className="ml-auto text-xs bg-emerald-600 text-white px-3 py-1.5 rounded-lg hover:bg-emerald-700 font-medium disabled:opacity-50"
                disabled={
                  data.questions.filter((q) => q.confidence === 'GREEN' && q.status !== 'approved')
                    .length === 0
                }
              >
                Approve All GREEN
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Section Scorecards */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        <h3 className="text-base font-semibold text-gray-900 mb-1">Section Scorecards</h3>
        <p className="text-xs text-gray-400 mb-5">Click any section to jump to it in Grid view</p>
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
                onClick={() => onNavigate?.('grid', { category: cat })}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
