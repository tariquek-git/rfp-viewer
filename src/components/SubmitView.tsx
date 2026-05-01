'use client';

/**
 * Submit tab — pre-flight + export pipeline.
 *
 * Stacks the Compliance status matrix and the Submission/Export view
 * (which already contains all export formats). Adds a button to launch
 * the SubmissionChecklist modal — keeping it as a modal in PR 1, will
 * become inline in a later iteration.
 */

import { lazy, Suspense } from 'react';
import { ClipboardCheck, FileText, ListChecks } from 'lucide-react';
import type { Question, RFPData, KnowledgeBase, ValidationRule, FeedbackItem } from '@/types';

const ComplianceView = lazy(() => import('@/components/ComplianceView'));
const SubmissionView = lazy(() => import('@/components/SubmissionView'));

interface SubmitViewProps {
  questions: Question[];
  categories: string[];
  data: RFPData;
  knowledgeBase?: KnowledgeBase;
  globalRules?: string[];
  validationRules?: ValidationRule[];
  feedbackItems?: FeedbackItem[];
  onUpdateCompliant: (ref: string, value: string) => void;
  onAddFeedback?: (ref: string, field: string, comment: string) => void;
  onResolveFeedback?: (ref: string, timestamp: number) => void;
  onShowChecklist: () => void;
}

const FALLBACK = (
  <div className="flex-1 flex items-center justify-center text-gray-400 text-xs">Loading…</div>
);

export default function SubmitView({
  questions,
  categories,
  data,
  knowledgeBase,
  globalRules,
  validationRules,
  feedbackItems,
  onUpdateCompliant,
  onAddFeedback,
  onResolveFeedback,
  onShowChecklist,
}: SubmitViewProps) {
  return (
    <div className="overflow-auto h-full">
      {/* Anchor nav + checklist trigger */}
      <div className="sticky top-0 z-10 bg-white/95 backdrop-blur border-b border-gray-100 px-4 py-2 flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <span className="text-[11px] uppercase tracking-wider text-gray-400 font-semibold">
            Jump to
          </span>
          <a
            href="#submit-compliance"
            className="flex items-center gap-1 text-gray-600 hover:text-gray-900 font-medium"
          >
            <ClipboardCheck size={12} /> Compliance
          </a>
          <a
            href="#submit-export"
            className="flex items-center gap-1 text-gray-600 hover:text-gray-900 font-medium"
          >
            <FileText size={12} /> Export
          </a>
        </div>
        <button
          onClick={onShowChecklist}
          className="flex items-center gap-1.5 bg-gray-900 text-white px-2.5 py-1 rounded-md text-xs font-medium hover:bg-gray-700"
        >
          <ListChecks size={12} /> Pre-flight checklist
        </button>
      </div>

      <section id="submit-compliance">
        <Suspense fallback={FALLBACK}>
          <ComplianceView
            questions={questions}
            categories={categories}
            onUpdateCompliant={onUpdateCompliant}
          />
        </Suspense>
      </section>

      <section id="submit-export" className="border-t border-gray-200">
        <Suspense fallback={FALLBACK}>
          <SubmissionView
            questions={questions}
            categories={categories}
            data={data}
            knowledgeBase={knowledgeBase}
            globalRules={globalRules}
            validationRules={validationRules}
            feedbackItems={feedbackItems}
            onAddFeedback={onAddFeedback}
            onResolveFeedback={onResolveFeedback}
          />
        </Suspense>
      </section>
    </div>
  );
}
