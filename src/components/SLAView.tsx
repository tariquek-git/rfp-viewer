"use client";

import { useState } from "react";
import { Plus, Trash2, Shield } from "lucide-react";
import type { SLACommitment } from "@/types";

interface SLAViewProps {
  slas: SLACommitment[];
  onUpdate: (s: SLACommitment[]) => void;
}

const SLA_CATEGORIES = ["Availability", "Performance", "Processing", "Support", "Security", "Reporting"];

export default function SLAView({ slas, onUpdate }: SLAViewProps) {
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState<Partial<SLACommitment>>({ category: "Availability" });

  const addSLA = () => {
    if (!draft.metric) return;
    onUpdate([...slas, {
      id: Date.now().toString(),
      category: draft.category || "Availability",
      metric: draft.metric || "",
      target: draft.target || "",
      measurement: draft.measurement || "",
      penalty: draft.penalty || "",
      currentPerformance: draft.currentPerformance || "",
    }]);
    setDraft({ category: "Availability" });
    setAdding(false);
  };

  const removeSLA = (id: string) => onUpdate(slas.filter(s => s.id !== id));
  const updateSLA = (id: string, field: keyof SLACommitment, value: string) => {
    onUpdate(slas.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const grouped = SLA_CATEGORIES.reduce((acc, cat) => {
    const items = slas.filter(s => s.category === cat);
    if (items.length > 0) acc[cat] = items;
    return acc;
  }, {} as Record<string, SLACommitment[]>);

  return (
    <div className="overflow-auto h-full p-6 bg-gray-50/30 dark:bg-gray-900/30">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-violet-50 dark:bg-violet-900/30 rounded-lg">
              <Shield size={20} className="text-violet-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">SLA Framework</h2>
              <p className="text-xs text-gray-400">Service Level Agreements and performance commitments for BSB</p>
            </div>
          </div>
          <button onClick={() => setAdding(true)}
            className="flex items-center gap-1.5 bg-violet-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-violet-700">
            <Plus size={13} /> Add SLA
          </button>
        </div>

        {/* SLA summary */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 shadow-sm text-center">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{slas.length}</div>
            <div className="text-xs text-gray-500">Total SLAs</div>
          </div>
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 shadow-sm text-center">
            <div className="text-2xl font-bold text-emerald-600">{slas.filter(s => s.currentPerformance).length}</div>
            <div className="text-xs text-gray-500">With Performance Data</div>
          </div>
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 shadow-sm text-center">
            <div className="text-2xl font-bold text-amber-600">{slas.filter(s => s.penalty).length}</div>
            <div className="text-xs text-gray-500">With Penalties Defined</div>
          </div>
        </div>

        {/* SLA table by category */}
        {Object.entries(grouped).map(([cat, items]) => (
          <div key={cat} className="mb-6">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">{cat}</h3>
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden shadow-sm">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-750 border-b dark:border-gray-700">
                    <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500 uppercase">Metric</th>
                    <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500 uppercase w-28">Target</th>
                    <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500 uppercase">Measurement</th>
                    <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500 uppercase">Penalty</th>
                    <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500 uppercase w-28">Current</th>
                    <th className="w-8" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {items.map(sla => (
                    <tr key={sla.id} className="group hover:bg-gray-50 dark:hover:bg-gray-750">
                      <td className="px-4 py-2">
                        <input value={sla.metric} onChange={e => updateSLA(sla.id, "metric", e.target.value)}
                          className="w-full bg-transparent border-0 text-sm font-medium focus:outline-none" />
                      </td>
                      <td className="px-4 py-2">
                        <input value={sla.target} onChange={e => updateSLA(sla.id, "target", e.target.value)}
                          className="w-full bg-transparent border-0 text-sm font-mono text-emerald-600 focus:outline-none" placeholder="99.9%" />
                      </td>
                      <td className="px-4 py-2">
                        <input value={sla.measurement} onChange={e => updateSLA(sla.id, "measurement", e.target.value)}
                          className="w-full bg-transparent border-0 text-xs text-gray-500 focus:outline-none" placeholder="How measured..." />
                      </td>
                      <td className="px-4 py-2">
                        <input value={sla.penalty} onChange={e => updateSLA(sla.id, "penalty", e.target.value)}
                          className="w-full bg-transparent border-0 text-xs text-red-500 focus:outline-none" placeholder="Credit/penalty..." />
                      </td>
                      <td className="px-4 py-2">
                        <input value={sla.currentPerformance} onChange={e => updateSLA(sla.id, "currentPerformance", e.target.value)}
                          className="w-full bg-transparent border-0 text-sm font-mono focus:outline-none" placeholder="—" />
                      </td>
                      <td className="px-2">
                        <button onClick={() => removeSLA(sla.id)} className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100">
                          <Trash2 size={12} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}

        {slas.length === 0 && (
          <div className="bg-white dark:bg-gray-800 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl p-12 text-center">
            <Shield size={32} className="mx-auto mb-3 text-gray-300" />
            <p className="text-sm text-gray-500 mb-1">No SLAs defined yet</p>
            <p className="text-xs text-gray-400">Add uptime, response time, and processing commitments</p>
          </div>
        )}

        {/* Add SLA modal */}
        {adding && (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md p-6">
              <h3 className="font-semibold mb-4">Add SLA Commitment</h3>
              <div className="space-y-3">
                <select value={draft.category} onChange={e => setDraft({ ...draft, category: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 text-sm">{SLA_CATEGORIES.map(c => <option key={c}>{c}</option>)}</select>
                <input placeholder="Metric (e.g. Platform Uptime)" value={draft.metric || ""} onChange={e => setDraft({ ...draft, metric: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 text-sm" />
                <input placeholder="Target (e.g. 99.95%)" value={draft.target || ""} onChange={e => setDraft({ ...draft, target: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 text-sm" />
                <input placeholder="Measurement method" value={draft.measurement || ""} onChange={e => setDraft({ ...draft, measurement: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 text-sm" />
                <input placeholder="Penalty if missed" value={draft.penalty || ""} onChange={e => setDraft({ ...draft, penalty: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 text-sm" />
                <div className="flex gap-2 pt-2">
                  <button onClick={() => setAdding(false)} className="flex-1 border rounded-lg py-2 text-sm font-medium">Cancel</button>
                  <button onClick={addSLA} disabled={!draft.metric}
                    className="flex-1 bg-violet-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-violet-700 disabled:opacity-40">Add</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
