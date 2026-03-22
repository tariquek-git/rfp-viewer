"use client";

import { useMemo } from "react";
import { Printer } from "lucide-react";
import type { Question } from "@/types";

interface SubmissionViewProps {
  questions: Question[];
  categories: string[];
}

export default function SubmissionView({ questions, categories }: SubmissionViewProps) {
  const grouped = useMemo(() => {
    const map: Record<string, Question[]> = {};
    for (const q of questions) {
      if (!map[q.category]) map[q.category] = [];
      map[q.category].push(q);
    }
    return map;
  }, [questions]);

  return (
    <div className="overflow-auto h-full bg-white">
      {/* Print button (hidden when printing) */}
      <div className="print:hidden sticky top-0 bg-white border-b px-6 py-3 flex items-center justify-between z-10">
        <div>
          <h2 className="text-sm font-semibold text-gray-900">Submission Preview</h2>
          <p className="text-xs text-gray-400">Read-only formatted view for final review</p>
        </div>
        <button onClick={() => window.print()}
          className="flex items-center gap-1.5 bg-gray-900 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-gray-800">
          <Printer size={13} /> Print / PDF
        </button>
      </div>

      <div className="max-w-4xl mx-auto px-8 py-10 print:px-0 print:py-0 print:max-w-none">
        {/* Title page */}
        <div className="text-center mb-16 print:mb-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">BSB Credit Card RFP Response</h1>
          <p className="text-lg text-gray-500">Prepared by Brim Financial</p>
          <p className="text-sm text-gray-400 mt-4">{new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>
          <p className="text-sm text-gray-400">{questions.length} Questions · {categories.length} Categories</p>
        </div>

        {/* Table of contents */}
        <div className="mb-12 print:mb-8">
          <h2 className="text-lg font-bold text-gray-900 border-b-2 border-gray-900 pb-2 mb-4">Table of Contents</h2>
          <ol className="space-y-1.5">
            {categories.map((cat, i) => {
              const count = grouped[cat]?.length || 0;
              return (
                <li key={cat} className="flex items-center justify-between text-sm">
                  <span className="text-gray-700">{i + 1}. {cat}</span>
                  <span className="text-gray-400">{count} questions</span>
                </li>
              );
            })}
          </ol>
        </div>

        {/* Content by category */}
        {categories.map((cat, catIdx) => {
          const catQs = grouped[cat];
          if (!catQs || catQs.length === 0) return null;
          return (
            <div key={cat} className="mb-12 print:break-before-page">
              <h2 className="text-xl font-bold text-gray-900 border-b-2 border-gray-300 pb-2 mb-6">
                {catIdx + 1}. {cat}
              </h2>
              {catQs.map((q) => (
                <div key={q.ref} className="mb-8">
                  <div className="flex items-baseline gap-3 mb-2">
                    <span className="text-xs font-mono text-gray-400">{q.ref}</span>
                    <span className="text-xs text-gray-400">{q.topic}</span>
                  </div>
                  <div className="mb-3">
                    <h4 className="text-xs font-semibold text-gray-500 uppercase mb-1">Requirement</h4>
                    <p className="text-sm text-gray-600 leading-relaxed">{q.requirement}</p>
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-gray-500 uppercase mb-1">Response</h4>
                    <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
                      {q.paragraph || q.bullet || <span className="text-gray-300 italic">No response provided</span>}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
