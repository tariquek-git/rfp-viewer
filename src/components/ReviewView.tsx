'use client';

/**
 * Review tab — merged status dashboard.
 *
 * Combines the former Dashboard (ContextView) and Issues (IssuesView)
 * tabs into one scrollable surface so the user has a single place to see
 * "where is this RFP at right now."
 *
 * Logic comes entirely from the underlying components — this is a layout
 * wrapper. Anchor links at the top jump between the two sections.
 */

import { lazy, Suspense } from 'react';
import { LayoutDashboard, AlertTriangle } from 'lucide-react';
import type { RFPData, FeedbackItem, Question } from '@/types';

const ContextView = lazy(() => import('@/components/ContextView'));
const IssuesView = lazy(() => import('@/components/IssuesView'));

interface ReviewViewProps {
  data: RFPData;
  onNavigate: (tab: string, filter?: { confidence?: string; category?: string }) => void;
  feedbackItems: FeedbackItem[];
  onAddFeedback: (ref: string, field: string, comment: string) => void;
  onBulkApproveGreen: () => void;
  onSelectQuestion: (q: Question) => void;
}

const FALLBACK = (
  <div className="flex-1 flex items-center justify-center text-gray-400 text-xs">Loading…</div>
);

export default function ReviewView({
  data,
  onNavigate,
  feedbackItems,
  onAddFeedback,
  onBulkApproveGreen,
  onSelectQuestion,
}: ReviewViewProps) {
  return (
    <div className="overflow-auto h-full">
      {/* Anchor nav so the user can jump between dashboard and issues */}
      <div className="sticky top-0 z-10 bg-white/95 backdrop-blur border-b border-gray-100 px-4 py-2 flex items-center gap-3 text-xs">
        <span className="text-[11px] uppercase tracking-wider text-gray-400 font-semibold">
          Jump to
        </span>
        <a
          href="#review-dashboard"
          className="flex items-center gap-1 text-gray-600 hover:text-gray-900 font-medium"
        >
          <LayoutDashboard size={12} /> Dashboard
        </a>
        <a
          href="#review-issues"
          className="flex items-center gap-1 text-gray-600 hover:text-gray-900 font-medium"
        >
          <AlertTriangle size={12} /> Issues
        </a>
      </div>

      <section id="review-dashboard">
        <Suspense fallback={FALLBACK}>
          <ContextView
            data={data}
            onNavigate={onNavigate}
            feedbackItems={feedbackItems}
            onAddFeedback={onAddFeedback}
            onBulkApproveGreen={onBulkApproveGreen}
          />
        </Suspense>
      </section>

      <section id="review-issues" className="border-t border-gray-200">
        <Suspense fallback={FALLBACK}>
          <IssuesView questions={data.questions} onSelectQuestion={onSelectQuestion} />
        </Suspense>
      </section>
    </div>
  );
}
