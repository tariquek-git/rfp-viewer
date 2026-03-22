"use client";

import { useState } from "react";
import { X, Plus, Trash2, BookOpen, Rows3 } from "lucide-react";

interface RulesPanelProps {
  onClose: () => void;
  rules: string[];
  onUpdateRules: (rules: string[]) => void;
}

export default function RulesPanel({ onClose, rules, onUpdateRules }: RulesPanelProps) {
  const [activeRuleTab, setActiveRuleTab] = useState<"global" | "section">("global");
  const [newRule, setNewRule] = useState("");

  const addRule = () => {
    if (newRule.trim()) {
      onUpdateRules([...rules, newRule.trim()]);
      setNewRule("");
    }
  };

  const removeRule = (i: number) => {
    onUpdateRules(rules.filter((_, j) => j !== i));
  };

  return (
    <>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/20 z-20" onClick={onClose} />

      {/* Panel */}
      <div className="absolute right-0 top-0 bottom-0 w-[420px] bg-white border-l shadow-2xl z-30 flex flex-col panel-slide-in">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Writing Rules</h2>
            <p className="text-xs text-gray-400 mt-0.5">Guide the AI when rewriting responses</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100">
            <X size={16} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100">
          <button onClick={() => setActiveRuleTab("global")}
            className={`flex items-center gap-1.5 px-5 py-2.5 text-sm font-medium border-b-2 transition-all ${activeRuleTab === "global" ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}>
            <BookOpen size={14} /> Global
          </button>
          <button onClick={() => setActiveRuleTab("section")}
            className={`flex items-center gap-1.5 px-5 py-2.5 text-sm font-medium border-b-2 transition-all ${activeRuleTab === "section" ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}>
            <Rows3 size={14} /> Per-Question
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-5">
          {activeRuleTab === "global" && (
            <div>
              <p className="text-xs text-gray-500 mb-4">These rules apply to <strong>all questions</strong>. The AI follows them during every rewrite.</p>

              {rules.length === 0 ? (
                <div className="border-2 border-dashed border-gray-200 rounded-lg p-6 text-center mb-4">
                  <BookOpen size={24} className="mx-auto text-gray-300 mb-2" />
                  <p className="text-sm text-gray-400">No rules yet</p>
                  <p className="text-xs text-gray-300 mt-1">Add rules to guide AI rewrites</p>
                </div>
              ) : (
                <div className="space-y-2 mb-4">
                  {rules.map((rule, i) => (
                    <div key={i} className="bg-gray-50 border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm text-gray-700 flex items-start justify-between gap-3 group hover:border-gray-300">
                      <span className="leading-relaxed">{rule}</span>
                      <button onClick={() => removeRule(i)} className="text-gray-300 hover:text-red-500 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="space-y-2">
                <textarea
                  value={newRule}
                  onChange={(e) => setNewRule(e.target.value)}
                  placeholder="e.g. Always lead with Brim-specific data points, not generic industry claims..."
                  className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm resize-none h-20 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 placeholder:text-gray-300"
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); addRule(); } }}
                />
                <button onClick={addRule} disabled={!newRule.trim()}
                  className="flex items-center justify-center gap-1.5 w-full bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm">
                  <Plus size={14} /> Add Rule
                </button>
              </div>
            </div>
          )}
          {activeRuleTab === "section" && (
            <div>
              <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
                <h3 className="font-medium text-blue-900 text-sm mb-1.5">Per-Question Rules</h3>
                <p className="text-xs text-blue-700 leading-relaxed">
                  Click any question reference in the grid to open the detail panel. Use the <strong>Row Rules</strong> field at the bottom to add guidance specific to that question.
                </p>
                <p className="text-xs text-blue-600 mt-2">
                  Row rules are combined with global rules and feedback during AI rewrite.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
