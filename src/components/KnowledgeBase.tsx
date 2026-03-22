"use client";

import { Save, BookOpen } from "lucide-react";
import type { KnowledgeBase as KBType } from "@/types";
import { countWords } from "@/lib/wordCount";

interface KnowledgeBaseProps {
  kb: KBType;
  onUpdate: (kb: KBType) => void;
  onSave: () => void;
}

function KBSection({ label, description, value, onChange }: { label: string; description: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="mb-6">
      <label className="block text-sm font-semibold text-gray-900 mb-1">{label}</label>
      <p className="text-xs text-gray-400 mb-2">{description}</p>
      <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={6}
        className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 placeholder:text-gray-300"
        placeholder={`Enter ${label.toLowerCase()}...`} />
      <div className="text-right text-[10px] text-gray-400 mt-1">{countWords(value)} words</div>
    </div>
  );
}

export default function KnowledgeBaseView({ kb, onUpdate, onSave }: KnowledgeBaseProps) {
  const update = (field: keyof KBType, value: string) => {
    onUpdate({ ...kb, [field]: value });
  };

  return (
    <div className="overflow-auto h-full p-6 bg-gray-50/30">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <BookOpen size={20} className="text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Knowledge Base</h2>
              <p className="text-xs text-gray-400">These facts are injected into every AI rewrite prompt to ensure consistency and accuracy.</p>
            </div>
          </div>
          <button onClick={onSave} className="flex items-center gap-1.5 bg-blue-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-blue-700 shadow-sm">
            <Save size={13} /> Save
          </button>
        </div>

        {kb.lastUpdated > 0 && (
          <p className="text-[10px] text-gray-400 mb-4">Last updated: {new Date(kb.lastUpdated).toLocaleString()}</p>
        )}

        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <KBSection label="Company Facts" description="Key facts about Brim Financial: founding, FI partnerships, platform capabilities, team size, etc."
            value={kb.companyFacts} onChange={(v) => update("companyFacts", v)} />

          <KBSection label="Key Metrics" description="Numbers the AI should cite: FI launches, transaction volumes, uptime, response times, etc."
            value={kb.keyMetrics} onChange={(v) => update("keyMetrics", v)} />

          <KBSection label="Differentiators" description="What makes Brim unique vs. competitors: technology advantages, platform features, approach."
            value={kb.differentiators} onChange={(v) => update("differentiators", v)} />

          <KBSection label="Competitive Positioning" description="How Brim positions against specific competitors, market gaps Brim fills."
            value={kb.competitivePositioning} onChange={(v) => update("competitivePositioning", v)} />
        </div>
      </div>
    </div>
  );
}
