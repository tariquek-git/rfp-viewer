"use client";

import { useState } from "react";

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
    <div className="absolute right-0 top-0 bottom-0 w-[450px] bg-white border-l shadow-lg z-20 flex flex-col">
      <div className="flex items-center justify-between px-6 py-4 border-b">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Writing Rules &amp; Guidelines</h2>
          <p className="text-sm text-gray-500">Rules are applied when using AI Assist and shown during editing</p>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
      </div>

      <div className="flex gap-2 px-6 pt-4">
        <button onClick={() => setActiveRuleTab("global")} className={`px-3 py-1.5 rounded text-sm font-medium ${activeRuleTab === "global" ? "bg-blue-100 text-blue-700" : "text-gray-600 hover:bg-gray-100"}`}>Global Rules</button>
        <button onClick={() => setActiveRuleTab("section")} className={`px-3 py-1.5 rounded text-sm font-medium ${activeRuleTab === "section" ? "bg-blue-100 text-blue-700" : "text-gray-600 hover:bg-gray-100"}`}>Section Rules</button>
      </div>

      <div className="flex-1 overflow-auto p-6">
        {activeRuleTab === "global" && (
          <div>
            <p className="text-sm text-gray-600 mb-4">These rules apply to ALL questions across the entire RFP. They guide the AI when rewriting responses.</p>
            {rules.length === 0 && <p className="text-sm text-gray-400 italic mb-4">No global rules yet. Add one below.</p>}
            {rules.map((rule, i) => (
              <div key={i} className="border rounded p-3 mb-2 text-sm text-gray-700 flex items-start justify-between">
                <span>{rule}</span>
                <button onClick={() => removeRule(i)} className="text-red-400 hover:text-red-600 ml-2 text-xs flex-shrink-0">remove</button>
              </div>
            ))}
            <div className="flex gap-2 mt-4">
              <textarea value={newRule} onChange={(e) => setNewRule(e.target.value)}
                placeholder='e.g. "Always start with Brim-specific data points, not generalizations"'
                className="border rounded px-3 py-2 text-sm flex-1 resize-none h-16 focus:outline-none focus:ring-2 focus:ring-blue-500"
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); addRule(); } }}
              />
              <button onClick={addRule} className="bg-blue-500 text-white px-4 py-2 rounded text-sm font-medium hover:bg-blue-600 self-end">Add</button>
            </div>
          </div>
        )}
        {activeRuleTab === "section" && (
          <div>
            <h3 className="font-medium text-gray-900 mb-2">Row-Level Rules</h3>
            <p className="text-sm text-gray-500">
              Open any question&apos;s detail panel and use the &quot;Row Rules&quot; field to add guidance specific to that question. Row rules are saved with your edits and sent to the AI during rewrite.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
