"use client";

import { useState } from "react";
import { X, Copy, RotateCcw } from "lucide-react";

interface SummaryData {
  coverLetter: string;
  strengthsSummary: string;
  riskAreas: string;
  recommendation: string;
}

interface ExecutiveSummaryProps {
  onClose: () => void;
  onGenerate: () => Promise<SummaryData>;
}

function SummarySection({ title, content, onCopy }: { title: string; content: string; onCopy: () => void }) {
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
        <button onClick={onCopy} className="flex items-center gap-1 text-xs text-gray-400 hover:text-blue-500">
          <Copy size={11} /> Copy
        </button>
      </div>
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
        {content}
      </div>
    </div>
  );
}

export default function ExecutiveSummary({ onClose, onGenerate }: ExecutiveSummaryProps) {
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [error, setError] = useState("");

  const generate = async () => {
    setLoading(true);
    setError("");
    try {
      const result = await onGenerate();
      setSummary(result);
    } catch {
      setError("Failed to generate summary. Please try again.");
    }
    setLoading(false);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-8">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Executive Summary</h2>
            <p className="text-xs text-gray-400">AI-generated overview of Brim&#39;s RFP response</p>
          </div>
          <div className="flex items-center gap-2">
            {summary && (
              <button onClick={generate} className="flex items-center gap-1 text-xs text-gray-500 hover:text-blue-500 font-medium">
                <RotateCcw size={12} /> Regenerate
              </button>
            )}
            <button onClick={onClose} className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100">
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-6">
          {!summary && !loading && (
            <div className="text-center py-16">
              <p className="text-gray-500 mb-4">Generate an AI-powered executive summary of the entire RFP response.</p>
              <button onClick={generate}
                className="bg-gradient-to-r from-violet-600 to-purple-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:from-violet-700 hover:to-purple-700 shadow-sm">
                Generate Summary
              </button>
            </div>
          )}

          {loading && (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <div className="animate-spin w-8 h-8 border-2 border-gray-300 border-t-violet-600 rounded-full mb-3" />
              <p className="text-sm">Generating executive summary...</p>
              <p className="text-xs mt-1">Analyzing all 383 responses</p>
            </div>
          )}

          {error && <div className="text-center text-red-500 text-sm py-8">{error}</div>}

          {summary && (
            <>
              <SummarySection title="Cover Letter" content={summary.coverLetter} onCopy={() => copyToClipboard(summary.coverLetter)} />
              <SummarySection title="Strengths" content={summary.strengthsSummary} onCopy={() => copyToClipboard(summary.strengthsSummary)} />
              <SummarySection title="Risk Areas" content={summary.riskAreas} onCopy={() => copyToClipboard(summary.riskAreas)} />
              <SummarySection title="Recommendation" content={summary.recommendation} onCopy={() => copyToClipboard(summary.recommendation)} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
