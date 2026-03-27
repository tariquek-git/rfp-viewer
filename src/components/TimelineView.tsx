'use client';

import { useState } from 'react';
import { Plus, Trash2, Calendar } from 'lucide-react';
import type { TimelineMilestone } from '@/types';

interface TimelineViewProps {
 milestones: TimelineMilestone[];
 onUpdate: (m: TimelineMilestone[]) => void;
}

const PHASES = [
 'Discovery',
 'Configuration',
 'Integration',
 'Testing',
 'Pilot',
 'Training',
 'Rollout',
 'Post-Launch',
];
const STATUSES: TimelineMilestone['status'][] = ['not-started', 'in-progress', 'complete'];
const STATUS_COLORS = {
 'not-started': 'bg-gray-200',
 'in-progress': 'bg-blue-500',
 complete: 'bg-emerald-500',
};

export default function TimelineView({ milestones, onUpdate }: TimelineViewProps) {
 const [adding, setAdding] = useState(false);
 const [draft, setDraft] = useState<Partial<TimelineMilestone>>({
 phase: 'Discovery',
 startWeek: 1,
 durationWeeks: 2,
 status: 'not-started',
 });

 const maxWeek = milestones.reduce((max, m) => Math.max(max, m.startWeek + m.durationWeeks), 12);
 const totalWeeks = Math.max(maxWeek, 12);

 const addMilestone = () => {
 if (!draft.description) return;
 onUpdate([
 ...milestones,
 {
 id: Date.now().toString(),
 phase: draft.phase || 'Discovery',
 description: draft.description || '',
 startWeek: draft.startWeek || 1,
 durationWeeks: draft.durationWeeks || 2,
 owner: draft.owner || '',
 dependencies: draft.dependencies || '',
 status: 'not-started',
 },
 ]);
 setDraft({ phase: 'Discovery', startWeek: 1, durationWeeks: 2, status: 'not-started' });
 setAdding(false);
 };

 const removeMilestone = (id: string) => onUpdate(milestones.filter((m) => m.id !== id));

 const updateMilestone = (id: string, field: keyof TimelineMilestone, value: string | number) => {
 onUpdate(milestones.map((m) => (m.id === id ? { ...m, [field]: value } : m)));
 };

 const phaseColors: Record<string, string> = {
 Discovery: 'bg-blue-400',
 Configuration: 'bg-violet-400',
 Integration: 'bg-indigo-400',
 Testing: 'bg-amber-400',
 Pilot: 'bg-orange-400',
 Training: 'bg-teal-400',
 Rollout: 'bg-emerald-400',
 'Post-Launch': 'bg-gray-400',
 };

 return (
 <div className="overflow-auto h-full p-6 bg-gray-50/30">
 <div className="max-w-6xl mx-auto">
 <div className="flex items-center justify-between mb-6">
 <div className="flex items-center gap-3">
 <div className="p-2 bg-blue-50 rounded-lg">
 <Calendar size={20} className="text-blue-600" />
 </div>
 <div>
 <h2 className="text-lg font-semibold">Implementation Timeline</h2>
 <p className="text-xs text-gray-400">Phase-by-phase implementation plan for BSB</p>
 </div>
 </div>
 <button
 onClick={() => setAdding(true)}
 className="flex items-center gap-1.5 bg-blue-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-blue-700"
 >
 <Plus size={13} /> Add Milestone
 </button>
 </div>

 {/* Gantt-style chart */}
 <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm mb-6">
 {/* Week headers */}
 <div className="flex items-center mb-4 pl-48">
 {Array.from({ length: totalWeeks }, (_, i) => (
 <div key={i} className="flex-1 text-center text-[9px] text-gray-400 font-mono">
 W{i + 1}
 </div>
 ))}
 </div>

 {/* Milestone bars */}
 <div className="space-y-2">
 {milestones.map((m) => (
 <div key={m.id} className="flex items-center group">
 <div className="w-48 flex-shrink-0 pr-4">
 <div className="text-xs font-medium truncate">{m.phase}</div>
 <div className="text-[10px] text-gray-400 truncate">{m.description}</div>
 </div>
 <div className="flex-1 relative h-7">
 <div className="absolute inset-0 flex">
 {Array.from({ length: totalWeeks }, (_, i) => (
 <div
 key={i}
 className="flex-1 border-l border-gray-100"
 />
 ))}
 </div>
 <div
 className={`absolute top-1 h-5 rounded-full ${phaseColors[m.phase] || 'bg-gray-400'} opacity-80 flex items-center justify-center`}
 style={{
 left: `${((m.startWeek - 1) / totalWeeks) * 100}%`,
 width: `${(m.durationWeeks / totalWeeks) * 100}%`,
 }}
 >
 <span className="text-[9px] text-white font-semibold truncate px-2">
 {m.durationWeeks}w
 </span>
 </div>
 </div>
 <div className="w-20 flex-shrink-0 pl-2">
 <select
 value={m.status}
 onChange={(e) => updateMilestone(m.id, 'status', e.target.value)}
 className="text-[10px] bg-transparent border-0 text-gray-500 focus:outline-none focus:bg-blue-50/50 rounded w-full"
 >
 {STATUSES.map((s) => (
 <option key={s} value={s}>
 {s}
 </option>
 ))}
 </select>
 </div>
 <button
 onClick={() => removeMilestone(m.id)}
 className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 ml-1"
 >
 <Trash2 size={12} />
 </button>
 </div>
 ))}
 </div>

 {milestones.length === 0 && (
 <div className="text-center py-12 text-gray-400">
 <Calendar size={32} className="mx-auto mb-2 opacity-30" />
 <p className="text-sm">No milestones yet. Add your implementation phases.</p>
 </div>
 )}
 </div>

 {/* Milestone table */}
 <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
 <table className="w-full text-sm">
 <thead>
 <tr className="bg-gray-50 border-b">
 <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">
 Phase
 </th>
 <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">
 Description
 </th>
 <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase w-20">
 Start
 </th>
 <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase w-24">
 Duration
 </th>
 <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">
 Owner
 </th>
 <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase w-24">
 Status
 </th>
 </tr>
 </thead>
 <tbody className="divide-y divide-gray-100">
 {milestones.map((m) => (
 <tr key={m.id} className="hover:bg-gray-50">
 <td className="px-4 py-2">
 <select
 value={m.phase}
 onChange={(e) => updateMilestone(m.id, 'phase', e.target.value)}
 className="bg-transparent border-0 text-sm font-medium focus:outline-none focus:bg-blue-50/50 rounded"
 >
 {PHASES.map((p) => (
 <option key={p}>{p}</option>
 ))}
 </select>
 </td>
 <td className="px-4 py-2">
 <input
 value={m.description}
 onChange={(e) => updateMilestone(m.id, 'description', e.target.value)}
 className="w-full bg-transparent border-0 text-sm focus:outline-none focus:bg-blue-50/50 rounded"
 placeholder="Description..."
 />
 </td>
 <td className="px-4 py-2">
 <input
 type="number"
 value={m.startWeek}
 min={1}
 onChange={(e) => updateMilestone(m.id, 'startWeek', Number(e.target.value))}
 className="w-full bg-transparent border-0 text-sm focus:outline-none focus:bg-blue-50/50 rounded font-mono"
 />
 </td>
 <td className="px-4 py-2">
 <input
 type="number"
 value={m.durationWeeks}
 min={1}
 onChange={(e) =>
 updateMilestone(m.id, 'durationWeeks', Number(e.target.value))
 }
 className="w-full bg-transparent border-0 text-sm focus:outline-none focus:bg-blue-50/50 rounded font-mono"
 />
 </td>
 <td className="px-4 py-2">
 <input
 value={m.owner}
 onChange={(e) => updateMilestone(m.id, 'owner', e.target.value)}
 className="w-full bg-transparent border-0 text-sm focus:outline-none focus:bg-blue-50/50 rounded text-gray-500"
 placeholder="Team/Person"
 />
 </td>
 <td className="px-4 py-2">
 <span
 className={`inline-block w-2 h-2 rounded-full mr-1.5 ${STATUS_COLORS[m.status]}`}
 />
 <span className="text-xs capitalize">{m.status.replace('-', ' ')}</span>
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>

 {/* Add milestone form */}
 {adding && (
 <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
 <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
 <h3 className="font-semibold mb-4">Add Milestone</h3>
 <div className="space-y-3">
 <select
 value={draft.phase}
 onChange={(e) => setDraft({ ...draft, phase: e.target.value })}
 className="w-full border rounded-lg px-3 py-2 text-sm"
 >
 {PHASES.map((p) => (
 <option key={p}>{p}</option>
 ))}
 </select>
 <input
 placeholder="Description"
 value={draft.description || ''}
 onChange={(e) => setDraft({ ...draft, description: e.target.value })}
 className="w-full border rounded-lg px-3 py-2 text-sm"
 />
 <div className="grid grid-cols-2 gap-3">
 <div>
 <label className="text-xs text-gray-500">Start Week</label>
 <input
 type="number"
 value={draft.startWeek}
 min={1}
 onChange={(e) => setDraft({ ...draft, startWeek: Number(e.target.value) })}
 className="w-full border rounded-lg px-3 py-2 text-sm"
 />
 </div>
 <div>
 <label className="text-xs text-gray-500">Duration (weeks)</label>
 <input
 type="number"
 value={draft.durationWeeks}
 min={1}
 onChange={(e) =>
 setDraft({ ...draft, durationWeeks: Number(e.target.value) })
 }
 className="w-full border rounded-lg px-3 py-2 text-sm"
 />
 </div>
 </div>
 <input
 placeholder="Owner (team/person)"
 value={draft.owner || ''}
 onChange={(e) => setDraft({ ...draft, owner: e.target.value })}
 className="w-full border rounded-lg px-3 py-2 text-sm"
 />
 <div className="flex gap-2 pt-2">
 <button
 onClick={() => setAdding(false)}
 className="flex-1 border rounded-lg py-2 text-sm font-medium"
 >
 Cancel
 </button>
 <button
 onClick={addMilestone}
 disabled={!draft.description}
 className="flex-1 bg-blue-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-40"
 >
 Add
 </button>
 </div>
 </div>
 </div>
 </div>
 )}
 </div>
 </div>
 );
}
