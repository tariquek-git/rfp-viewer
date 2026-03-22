"use client";

import { useMemo } from "react";
import { CheckCircle, Circle, AlertTriangle, ClipboardList } from "lucide-react";
import type { ChecklistItem, RFPData, PricingModel, SLACommitment, TimelineMilestone, WinTheme, KnowledgeBase } from "@/types";

interface SubmissionChecklistProps {
  data: RFPData;
  pricing: PricingModel;
  slas: SLACommitment[];
  milestones: TimelineMilestone[];
  winThemes: WinTheme[];
  knowledgeBase: KnowledgeBase;
  statusCounts: { draft: number; reviewed: number; approved: number; flagged: number };
  onClose: () => void;
}

interface AutoCheck {
  label: string;
  category: string;
  passed: boolean;
  detail: string;
}

export default function SubmissionChecklist({
  data, pricing, slas, milestones, winThemes, knowledgeBase, statusCounts, onClose,
}: SubmissionChecklistProps) {
  const checks = useMemo<AutoCheck[]>(() => {
    const c: AutoCheck[] = [];
    const total = data.questions.length;
    const approved = statusCounts.approved;
    const answeredBullet = data.questions.filter(q => q.bullet?.trim()).length;
    const answeredParagraph = data.questions.filter(q => q.paragraph?.trim()).length;
    const redCount = data.stats.red;
    const flagged = statusCounts.flagged;

    c.push({ label: "All questions answered (bullet)", category: "Responses", passed: answeredBullet === total, detail: `${answeredBullet}/${total} have bullet responses` });
    c.push({ label: "All questions answered (paragraph)", category: "Responses", passed: answeredParagraph === total, detail: `${answeredParagraph}/${total} have paragraph responses` });
    c.push({ label: "All questions approved", category: "Responses", passed: approved === total, detail: `${approved}/${total} approved` });
    c.push({ label: "No RED confidence responses", category: "Responses", passed: redCount === 0, detail: `${redCount} RED responses remain` });
    c.push({ label: "No flagged questions", category: "Responses", passed: flagged === 0, detail: `${flagged} questions flagged for review` });

    c.push({ label: "Knowledge base filled", category: "Supporting Materials", passed: !!knowledgeBase.companyFacts && !!knowledgeBase.keyMetrics, detail: knowledgeBase.companyFacts ? "Company facts populated" : "Knowledge base is empty" });
    c.push({ label: "Win themes defined", category: "Supporting Materials", passed: winThemes.length >= 3, detail: `${winThemes.length} themes defined (recommend 3-5)` });

    c.push({ label: "Pricing model populated", category: "Commercial", passed: pricing.lineItems.length > 0, detail: `${pricing.lineItems.length} line items` });
    c.push({ label: "SLA commitments defined", category: "Commercial", passed: slas.length >= 3, detail: `${slas.length} SLAs defined` });
    c.push({ label: "Implementation timeline set", category: "Commercial", passed: milestones.length >= 3, detail: `${milestones.length} milestones defined` });

    return c;
  }, [data, pricing, slas, milestones, winThemes, knowledgeBase, statusCounts]);

  const passedCount = checks.filter(c => c.passed).length;
  const totalChecks = checks.length;
  const readiness = Math.round((passedCount / totalChecks) * 100);

  const grouped = checks.reduce((acc, c) => {
    if (!acc[c.category]) acc[c.category] = [];
    acc[c.category].push(c);
    return acc;
  }, {} as Record<string, AutoCheck[]>);

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-8">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b dark:border-gray-700">
          <div className="flex items-center gap-3">
            <ClipboardList size={20} className="text-blue-600" />
            <div>
              <h2 className="text-base font-semibold">Submission Readiness</h2>
              <p className="text-xs text-gray-400">{passedCount}/{totalChecks} checks passed</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
        </div>

        {/* Readiness meter */}
        <div className="px-6 py-4 border-b dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="flex-1 h-3 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
              <div className={`h-full rounded-full transition-all ${readiness >= 80 ? "bg-emerald-500" : readiness >= 50 ? "bg-amber-500" : "bg-red-500"}`}
                style={{ width: `${readiness}%` }} />
            </div>
            <span className={`text-lg font-bold ${readiness >= 80 ? "text-emerald-600" : readiness >= 50 ? "text-amber-600" : "text-red-600"}`}>{readiness}%</span>
          </div>
        </div>

        <div className="flex-1 overflow-auto px-6 py-4">
          {Object.entries(grouped).map(([cat, items]) => (
            <div key={cat} className="mb-4">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">{cat}</h3>
              <div className="space-y-1.5">
                {items.map((item, i) => (
                  <div key={i} className="flex items-start gap-2.5 py-1.5">
                    {item.passed ? (
                      <CheckCircle size={16} className="text-emerald-500 flex-shrink-0 mt-0.5" />
                    ) : (
                      <AlertTriangle size={16} className="text-amber-500 flex-shrink-0 mt-0.5" />
                    )}
                    <div>
                      <div className={`text-sm ${item.passed ? "text-gray-600 dark:text-gray-400" : "text-gray-900 dark:text-gray-100 font-medium"}`}>{item.label}</div>
                      <div className="text-[10px] text-gray-400">{item.detail}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
