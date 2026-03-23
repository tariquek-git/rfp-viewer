'use client';

import { useState } from 'react';
import { X, BookText, RotateCcw, AlertTriangle, CheckCircle } from 'lucide-react';
import type { NarrativeAuditResult } from '@/types';

interface NarrativeAuditProps {
 onClose: () => void;
 onRun: () => Promise<NarrativeAuditResult>;
}

export default function NarrativeAudit({ onClose, onRun }: NarrativeAuditProps) {
 const [loading, setLoading] = useState(false);
 const [result, setResult] = useState<NarrativeAuditResult | null>(null);

 const run = async () => {
 setLoading(true);
 try {
 setResult(await onRun());
 } catch {
 /* */
 }
 setLoading(false);
 };

 const scoreColor = (s: number) =>
 s >= 7 ? 'text-emerald-600' : s >= 5 ? 'text-amber-600' : 'text-red-600';

 return (
 <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-8">
 <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col">
 <div className="flex items-center justify-between px-6 py-4 border-b">
 <div className="flex items-center gap-2">
 <BookText size={18} className="text-indigo-600" />
 <div>
 <h2 className="text-base font-semibold">Narrative Audit</h2>
 <p className="text-xs text-gray-400">
 AI review of voice consistency, theme alignment, and story coherence
 </p>
 </div>
 </div>
 <div className="flex items-center gap-2">
 {result && (
 <button
 onClick={run}
 className="flex items-center gap-1 text-xs text-gray-500 hover:text-blue-500"
 >
 <RotateCcw size={12} /> Re-run
 </button>
 )}
 <button
 onClick={onClose}
 className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
 >
 <X size={16} />
 </button>
 </div>
 </div>

 <div className="flex-1 overflow-auto p-6">
 {!result && !loading && (
 <div className="text-center py-16">
 <BookText size={40} className="mx-auto mb-4 text-gray-300" />
 <p className="text-gray-500 mb-2">
 Audit the narrative consistency of your entire RFP response.
 </p>
 <p className="text-xs text-gray-400 mb-6">
 The AI will analyze voice, theme coverage, generic language, and story coherence.
 </p>
 <button
 onClick={run}
 className="bg-indigo-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-700"
 >
 Run Narrative Audit
 </button>
 </div>
 )}

 {loading && (
 <div className="flex flex-col items-center justify-center py-16 text-gray-400">
 <div className="animate-spin w-8 h-8 border-2 border-gray-300 border-t-indigo-600 rounded-full mb-3" />
 <p className="text-sm">Auditing all responses for narrative quality...</p>
 </div>
 )}

 {result && (
 <div className="space-y-6">
 {/* Overall score */}
 <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
 <div className={`text-4xl font-bold ${scoreColor(result.overallScore)}`}>
 {result.overallScore}
 <span className="text-lg text-gray-300">/10</span>
 </div>
 <div className="flex-1">
 <div className="text-sm font-semibold mb-1">Overall Narrative Quality</div>
 <p className="text-xs text-gray-500 leading-relaxed">{result.voiceConsistency}</p>
 </div>
 </div>

 {/* Theme alignment */}
 {result.themeAlignment.length > 0 && (
 <div>
 <h3 className="text-sm font-semibold mb-3">Win Theme Coverage</h3>
 <div className="space-y-3">
 {result.themeAlignment.map((t, i) => (
 <div key={i} className="border rounded-xl p-4">
 <div className="flex items-center justify-between mb-2">
 <span className="text-sm font-medium">{t.theme}</span>
 <span
 className={`text-sm font-bold ${t.coverage >= 60 ? 'text-emerald-600' : t.coverage >= 30 ? 'text-amber-600' : 'text-red-600'}`}
 >
 {t.coverage}%
 </span>
 </div>
 <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mb-2">
 <div
 className={`h-full rounded-full ${t.coverage >= 60 ? 'bg-emerald-500' : t.coverage >= 30 ? 'bg-amber-500' : 'bg-red-500'}`}
 style={{ width: `${t.coverage}%` }}
 />
 </div>
 {t.gaps.length > 0 && (
 <ul className="space-y-0.5">
 {t.gaps.map((g, j) => (
 <li
 key={j}
 className="text-xs text-gray-500 flex items-start gap-1.5"
 >
 <AlertTriangle
 size={10}
 className="text-amber-500 mt-0.5 flex-shrink-0"
 />{' '}
 {g}
 </li>
 ))}
 </ul>
 )}
 </div>
 ))}
 </div>
 </div>
 )}

 {/* Generic language */}
 {result.genericLanguage.length > 0 && (
 <div>
 <h3 className="text-sm font-semibold mb-3">
 Generic Language Found ({result.genericLanguage.length})
 </h3>
 <div className="space-y-2">
 {result.genericLanguage.map((g, i) => (
 <div
 key={i}
 className="flex items-start gap-3 p-3 bg-amber-50 rounded-lg border border-amber-200"
 >
 <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-mono flex-shrink-0">
 {g.ref}
 </span>
 <div className="flex-1">
 <div className="text-xs">
 <span className="line-through text-red-500">{g.phrase}</span>
 </div>
 <div className="text-xs text-emerald-600 mt-0.5">{g.suggestion}</div>
 </div>
 </div>
 ))}
 </div>
 </div>
 )}

 {/* Story breaks */}
 {result.storyBreaks.length > 0 && (
 <div>
 <h3 className="text-sm font-semibold mb-3">
 Story Breaks ({result.storyBreaks.length})
 </h3>
 <div className="space-y-2">
 {result.storyBreaks.map((b, i) => (
 <div
 key={i}
 className="p-3 bg-red-50 rounded-lg border border-red-200"
 >
 <p className="text-xs text-gray-700">{b.description}</p>
 <div className="flex gap-1 mt-1.5">
 {b.refs.map((r) => (
 <span
 key={r}
 className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-mono"
 >
 {r}
 </span>
 ))}
 </div>
 </div>
 ))}
 </div>
 </div>
 )}

 {/* Recommendation */}
 <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
 <div className="flex items-center gap-1.5 mb-2">
 <CheckCircle size={14} className="text-blue-600" />
 <h3 className="text-sm font-semibold text-blue-900">
 Recommendation
 </h3>
 </div>
 <p className="text-xs text-blue-700 leading-relaxed">
 {result.recommendation}
 </p>
 </div>
 </div>
 )}
 </div>
 </div>
 </div>
 );
}
