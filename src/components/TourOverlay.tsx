'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { X, ChevronRight, ChevronLeft, Compass } from 'lucide-react';

interface TourStep {
  title: string;
  body: string;
  target?: string; // data-tour attribute value
  tab?: string;    // switch to this tab before showing
  position?: 'top' | 'bottom' | 'center';
}

const STEPS: TourStep[] = [
  {
    title: 'Welcome to the BSB RFP Workbook',
    body: "This tool helps Brim Financial prepare and manage the response to Bangor Savings Bank's 383-question credit card RFP. You'll find everything here — response editing, analytics, compliance tracking, and final export. Let's take a quick tour.",
    position: 'center',
  },
  {
    title: 'Response Grid — Your Main Workspace',
    body: 'All 383 BSB requirements in a scrollable grid. Each row is one question with Brim\'s drafted response. Edit cells inline, change workflow status, flag for review, or click a REF link to open the full editing panel.',
    target: 'tour-grid-tab',
    tab: 'grid',
    position: 'bottom',
  },
  {
    title: 'Browse by Category',
    body: 'The 383 questions span 12 topic areas — Loyalty, Technology, Processing, Compliance, and more. Click a category to focus the grid. The numbers show total questions and how many are approved.',
    target: 'tour-category-nav',
    tab: 'grid',
    position: 'bottom',
  },
  {
    title: 'Search & Filter',
    body: 'Find any question instantly. Press ⌘K to jump to search, or use the Filters panel to narrow by Confidence level (GREEN / YELLOW / RED), Compliance status, Delivery type, or Workflow status.',
    target: 'tour-search-bar',
    tab: 'grid',
    position: 'bottom',
  },
  {
    title: 'Confidence & Risk Scores',
    body: 'Each response is rated GREEN (strong), YELLOW (needs improvement), or RED (critical gap). The header shows live counts. Currently 376 GREEN and 7 RED. These drive your AI rewrite priority list.',
    target: 'tour-confidence-stats',
    position: 'bottom',
  },
  {
    title: 'Dashboard — Executive View',
    body: 'A high-level summary of the entire workbook: confidence breakdown, procurement risk score (7.4/10), and section-by-section scorecards. Click any stat card to jump directly to those questions in the grid.',
    target: 'tour-dashboard-tab',
    tab: 'dashboard',
    position: 'bottom',
  },
  {
    title: 'Compliance Matrix',
    body: 'Track Y / Partial / N compliance for every requirement. Toggle statuses directly on this view. The matrix gives BSB a clear picture of what is fully met, partially addressed, or not covered — a key deliverable in the submission.',
    target: 'tour-compliance-tab',
    tab: 'compliance',
    position: 'bottom',
  },
  {
    title: 'Export & Submit',
    body: 'Generate the final submission document when you\'re ready. Export as PDF, Word (.docx), HTML, or print — formatted as a professional proposal with an executive summary, compliance matrix, and all 383 responses.',
    target: 'tour-export-tab',
    tab: 'submission',
    position: 'bottom',
  },
  {
    title: 'Settings & Knowledge Base',
    body: "Configure your company facts, key metrics, pricing model, implementation timeline, and SLA commitments. This context is automatically injected into every AI Rewrite, making responses accurate, specific, and on-brand.",
    target: 'tour-settings-btn',
    position: 'bottom',
  },
  {
    title: "You're All Set!",
    body: "Open any question in the Response Grid, then use AI Critique to identify weaknesses and AI Rewrite to strengthen the response. Prioritise the 7 RED questions and 2 HIGH RISK committee scores first. Good luck with the submission!",
    position: 'center',
  },
];

interface Rect { x: number; y: number; width: number; height: number }

const PADDING = 10;
const TOOLTIP_W = 380;

export default function TourOverlay({
  onNavigate,
  onClose,
}: {
  onNavigate: (tab: string) => void;
  onClose: () => void;
}) {
  const [step, setStep] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);

  const current = STEPS[step];

  const measure = useCallback(() => {
    if (!current.target) { setRect(null); return; }
    const el = document.querySelector<HTMLElement>(`[data-tour="${current.target}"]`);
    if (!el) { setRect(null); return; }
    const r = el.getBoundingClientRect();
    setRect({ x: r.left, y: r.top, width: r.width, height: r.height });
  }, [current.target]);

  useEffect(() => {
    if (current.tab) onNavigate(current.tab);
    const t = setTimeout(measure, 200);
    window.addEventListener('resize', measure);
    window.addEventListener('scroll', measure, true);
    return () => {
      clearTimeout(t);
      window.removeEventListener('resize', measure);
      window.removeEventListener('scroll', measure, true);
    };
  }, [step, current.tab, measure, onNavigate]);

  const finish = useCallback(() => {
    localStorage.setItem('rfp-tour-done', '1');
    onClose();
  }, [onClose]);

  const next = () => {
    if (step < STEPS.length - 1) setStep(s => s + 1);
    else finish();
  };

  const prev = () => setStep(s => Math.max(0, s - 1));

  // Tooltip position
  const tooltipStyle = (): React.CSSProperties => {
    if (!rect || current.position === 'center') {
      return {
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: TOOLTIP_W,
        zIndex: 10002,
      };
    }
    const margin = 14;
    const clampedLeft = Math.min(
      Math.max(rect.x + rect.width / 2 - TOOLTIP_W / 2, 12),
      (typeof window !== 'undefined' ? window.innerWidth : 1200) - TOOLTIP_W - 12,
    );
    if (current.position === 'bottom' || !current.position) {
      return {
        position: 'fixed',
        top: rect.y + rect.height + PADDING + margin,
        left: clampedLeft,
        width: TOOLTIP_W,
        zIndex: 10002,
      };
    }
    return {
      position: 'fixed',
      top: rect.y - PADDING - margin - 200,
      left: clampedLeft,
      width: TOOLTIP_W,
      zIndex: 10002,
    };
  };

  return (
    <>
      {/* SVG spotlight overlay */}
      <svg
        className="fixed inset-0 pointer-events-none"
        style={{ width: '100vw', height: '100vh', zIndex: 10000 }}
      >
        <defs>
          <mask id="tour-mask">
            <rect width="100%" height="100%" fill="white" />
            {rect && (
              <rect
                x={rect.x - PADDING}
                y={rect.y - PADDING}
                width={rect.width + PADDING * 2}
                height={rect.height + PADDING * 2}
                rx="6"
                fill="black"
              />
            )}
          </mask>
        </defs>
        <rect
          width="100%"
          height="100%"
          fill={rect ? 'rgba(0,0,0,0.58)' : 'rgba(0,0,0,0.55)'}
          mask={rect ? 'url(#tour-mask)' : undefined}
        />
        {/* Spotlight border ring */}
        {rect && (
          <rect
            x={rect.x - PADDING}
            y={rect.y - PADDING}
            width={rect.width + PADDING * 2}
            height={rect.height + PADDING * 2}
            rx="6"
            fill="none"
            stroke="rgba(99,102,241,0.7)"
            strokeWidth="2"
            strokeDasharray="6 3"
          />
        )}
      </svg>

      {/* Click-trap overlay (blocks background interaction) */}
      <div
        className="fixed inset-0"
        style={{ zIndex: 10001 }}
        onClick={(e) => e.stopPropagation()}
      />

      {/* Tooltip card */}
      <div
        style={tooltipStyle()}
        className="bg-white rounded-2xl shadow-2xl overflow-hidden"
      >
        {/* Top accent bar */}
        <div className="h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-500" />

        <div className="p-6">
          {/* Progress dots */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-1.5">
              {STEPS.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setStep(i)}
                  className={`rounded-full transition-all duration-200 ${
                    i === step
                      ? 'w-5 h-2 bg-blue-600'
                      : i < step
                      ? 'w-2 h-2 bg-blue-300'
                      : 'w-2 h-2 bg-gray-200'
                  }`}
                />
              ))}
            </div>
            <button
              onClick={finish}
              className="text-gray-400 hover:text-gray-600 p-1 rounded-md hover:bg-gray-100 transition-colors"
              aria-label="Close tour"
            >
              <X size={15} />
            </button>
          </div>

          {/* Step label */}
          <div className="text-[10px] font-semibold text-blue-600 uppercase tracking-widest mb-1.5">
            Step {step + 1} of {STEPS.length}
          </div>

          <h3 className="text-[15px] font-bold text-gray-900 mb-2.5 leading-snug">
            {current.title}
          </h3>
          <p className="text-sm text-gray-600 leading-relaxed mb-5">{current.body}</p>

          {/* Nav buttons */}
          <div className="flex items-center justify-between">
            <button
              onClick={prev}
              disabled={step === 0}
              className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 disabled:opacity-25 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={15} />
              Back
            </button>
            <button
              onClick={next}
              className="flex items-center gap-1.5 text-sm bg-blue-600 text-white px-5 py-2 rounded-xl hover:bg-blue-700 font-semibold shadow-sm shadow-blue-200 transition-colors"
            >
              {step === STEPS.length - 1 ? 'Finish' : 'Next'}
              {step < STEPS.length - 1 && <ChevronRight size={15} />}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

/** Small launcher button for the header */
export function TourLaunchButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      title="Take a guided tour"
      aria-label="Take a guided tour"
      className="flex flex-col items-center gap-0.5 px-1.5 py-1 rounded-md text-center text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
    >
      <Compass size={14} />
      <span className="text-[8px] leading-none font-medium">Tour</span>
    </button>
  );
}
