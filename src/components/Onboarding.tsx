"use client";

import { useState } from "react";
import { BookOpen, Sparkles, ShieldCheck, BarChart3, ArrowRight, X } from "lucide-react";

interface OnboardingProps {
  onClose: () => void;
}

const STEPS = [
  {
    icon: BookOpen,
    title: "Knowledge Base",
    description: "Start by filling in your company facts, metrics, and differentiators. The AI uses this to write accurate, fact-based responses.",
    action: "Go to KB tab and paste your key data points",
    color: "text-blue-600 bg-blue-50",
  },
  {
    icon: ShieldCheck,
    title: "Set Writing Rules",
    description: "Add global writing rules and validation rules. Global rules guide every AI rewrite. Validation rules check the output.",
    action: "Click Rules in the header to get started",
    color: "text-violet-600 bg-violet-50",
  },
  {
    icon: Sparkles,
    title: "AI Rewrite with Diff",
    description: "Click any question reference to open the detail panel. Hit 'AI Rewrite' and the AI will suggest changes you can accept, reject, or edit.",
    action: "Open a question and try AI Rewrite",
    color: "text-purple-600 bg-purple-50",
  },
  {
    icon: BarChart3,
    title: "Track Progress",
    description: "Click status badges to cycle through Draft, Reviewed, Approved, Flagged. Use the Dashboard tab to see overall progress and risk scores.",
    action: "Set your first question to Approved",
    color: "text-emerald-600 bg-emerald-50",
  },
];

export default function Onboarding({ onClose }: OnboardingProps) {
  const [step, setStep] = useState(0);
  const current = STEPS[step];

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-8">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b dark:border-gray-700">
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">Welcome to RFP Viewer</h2>
          <button onClick={onClose} className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100">
            <X size={16} />
          </button>
        </div>

        <div className="p-8 text-center">
          <div className={`w-16 h-16 rounded-2xl ${current.color} flex items-center justify-center mx-auto mb-4`}>
            <current.icon size={28} />
          </div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">{current.title}</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 leading-relaxed">{current.description}</p>
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg px-4 py-3 text-xs text-gray-600 dark:text-gray-400 font-medium">
            {current.action}
          </div>
        </div>

        <div className="px-6 py-4 border-t dark:border-gray-700 flex items-center justify-between">
          {/* Step dots */}
          <div className="flex items-center gap-1.5">
            {STEPS.map((_, i) => (
              <button key={i} onClick={() => setStep(i)}
                className={`w-2 h-2 rounded-full transition-all ${i === step ? "bg-blue-600 w-5" : "bg-gray-300 dark:bg-gray-600"}`} />
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button onClick={onClose} className="text-xs text-gray-400 hover:text-gray-600 font-medium px-3 py-1.5">
              Skip
            </button>
            {step < STEPS.length - 1 ? (
              <button onClick={() => setStep(step + 1)}
                className="flex items-center gap-1.5 bg-blue-600 text-white px-4 py-1.5 rounded-lg text-xs font-medium hover:bg-blue-700">
                Next <ArrowRight size={12} />
              </button>
            ) : (
              <button onClick={onClose}
                className="flex items-center gap-1.5 bg-emerald-600 text-white px-4 py-1.5 rounded-lg text-xs font-medium hover:bg-emerald-700">
                Get Started <ArrowRight size={12} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
