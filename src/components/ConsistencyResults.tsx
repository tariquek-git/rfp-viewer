'use client';

import { X, AlertTriangle, AlertOctagon, Info } from 'lucide-react';
import type { ConsistencyIssue } from '@/types';

interface ConsistencyResultsProps {
  issues: ConsistencyIssue[];
  loading: boolean;
  onClose: () => void;
  onNavigate: (ref: string) => void;
}

const severityConfig = {
  high: {
    icon: AlertOctagon,
    cls: 'bg-red-50 border-red-200 text-red-700',
    badge: 'bg-red-100 text-red-700',
  },
  medium: {
    icon: AlertTriangle,
    cls: 'bg-amber-50 border-amber-200 text-amber-700',
    badge: 'bg-amber-100 text-amber-700',
  },
  low: {
    icon: Info,
    cls: 'bg-blue-50 border-blue-200 text-blue-700',
    badge: 'bg-blue-100 text-blue-700',
  },
};

const typeLabels: Record<string, string> = {
  contradiction: 'Contradiction',
  inconsistent_metric: 'Inconsistent Metric',
  repeated_phrase: 'Repeated Phrase',
  missing_crossref: 'Missing Cross-Reference',
};

export default function ConsistencyResults({
  issues,
  loading,
  onClose,
  onNavigate,
}: ConsistencyResultsProps) {
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-8">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Consistency Check</h2>
            <p className="text-xs text-gray-400">
              {loading ? 'Analyzing responses...' : `${issues.length} issues found`}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-auto p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
              <div className="animate-spin w-8 h-8 border-2 border-gray-300 border-t-blue-600 rounded-full mb-3" />
              <p className="text-sm">Scanning all responses for inconsistencies...</p>
            </div>
          ) : issues.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <p className="text-lg font-medium">No issues found</p>
              <p className="text-sm mt-1">Your responses appear consistent.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {issues.map((issue, i) => {
                const config = severityConfig[issue.severity];
                const Icon = config.icon;
                return (
                  <div key={i} className={`border rounded-xl p-4 ${config.cls}`}>
                    <div className="flex items-start gap-3">
                      <Icon size={16} className="mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${config.badge}`}
                          >
                            {issue.severity.toUpperCase()}
                          </span>
                          <span className="text-[10px] font-medium opacity-70">
                            {typeLabels[issue.type] || issue.type}
                          </span>
                        </div>
                        <p className="text-sm leading-relaxed">{issue.description}</p>
                        <div className="flex items-center gap-1.5 mt-2">
                          {issue.questionRefs.map((ref) => (
                            <button
                              key={ref}
                              onClick={() => onNavigate(ref)}
                              className="text-xs bg-white/60 px-2 py-0.5 rounded border font-medium hover:bg-white"
                            >
                              {ref}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
