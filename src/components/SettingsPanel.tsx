'use client';

import { useState } from 'react';
import {
  X,
  Plus,
  Trash2,
  BookOpen,
  ShieldCheck,
  DollarSign,
  Calendar,
  Shield,
  History,
  Download,
  RotateCcw,
  Save,
} from 'lucide-react';
import type {
  KnowledgeBase,
  ValidationRule,
  PricingModel,
  PricingLineItem,
  TimelineMilestone,
  SLACommitment,
  Version,
} from '@/types';

type SettingsTab = 'workspace' | 'rules' | 'pricing' | 'timeline' | 'slas' | 'versions';

interface SettingsPanelProps {
  onClose: () => void;
  // Knowledge Base
  kb: KnowledgeBase;
  onUpdateKB: (kb: KnowledgeBase) => void;
  onSaveKB: () => void;
  // Rules
  globalRules: string[];
  onUpdateRules: (rules: string[]) => void;
  validationRules: ValidationRule[];
  onUpdateValidationRules: (rules: ValidationRule[]) => void;
  // Pricing
  pricing: PricingModel;
  onUpdatePricing: (p: PricingModel) => void;
  // Timeline
  milestones: TimelineMilestone[];
  onUpdateMilestones: (m: TimelineMilestone[]) => void;
  // SLAs
  slas: SLACommitment[];
  onUpdateSLAs: (s: SLACommitment[]) => void;
  // Versions
  versions: Version[];
  onSaveVersion: (label?: string) => void;
  onDeleteVersion: (timestamp: number) => void;
  onRestoreVersion: (v: Version) => void;
  currentQuestionCount: number;
}

function formatRelative(ts: number) {
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return new Date(ts).toLocaleDateString();
}

function LabeledTextarea({
  label,
  description,
  value,
  onChange,
  rows = 4,
}: {
  label: string;
  description?: string;
  value: string;
  onChange: (v: string) => void;
  rows?: number;
}) {
  return (
    <div className="mb-5">
      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
        {label}
      </label>
      {description && <p className="text-xs text-gray-400 mb-1.5">{description}</p>}
      <textarea
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 resize-y"
      />
    </div>
  );
}

/* ── Workspace Tab ── */
function WorkspaceTab({
  kb,
  onUpdate,
  onSave,
}: {
  kb: KnowledgeBase;
  onUpdate: (kb: KnowledgeBase) => void;
  onSave: () => void;
}) {
  return (
    <div>
      <p className="text-xs text-gray-500 mb-5">
        Company context injected into every AI rewrite. Keep this accurate and current.
      </p>
      <LabeledTextarea
        label="Company Facts"
        description="Key facts about Brim Financial (founding, scale, clients, technology)."
        value={kb.companyFacts}
        onChange={(v) => onUpdate({ ...kb, companyFacts: v })}
        rows={4}
      />
      <LabeledTextarea
        label="Key Metrics"
        description="Specific numbers and data points — processing volume, uptime, client count, etc."
        value={kb.keyMetrics}
        onChange={(v) => onUpdate({ ...kb, keyMetrics: v })}
        rows={4}
      />
      <LabeledTextarea
        label="Differentiators"
        description="What makes Brim uniquely positioned for this RFP."
        value={kb.differentiators}
        onChange={(v) => onUpdate({ ...kb, differentiators: v })}
        rows={4}
      />
      <LabeledTextarea
        label="Competitive Positioning"
        description="How to frame Brim versus incumbent processors or competitors."
        value={kb.competitivePositioning}
        onChange={(v) => onUpdate({ ...kb, competitivePositioning: v })}
        rows={3}
      />
      {kb.lastUpdated > 0 && (
        <p className="text-xs text-gray-400 mb-4">
          Last updated: {new Date(kb.lastUpdated).toLocaleString()}
        </p>
      )}
      <button
        onClick={onSave}
        className="flex items-center gap-1.5 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
      >
        <Save size={13} /> Save Knowledge Base
      </button>
    </div>
  );
}

/* ── Rules Tab ── */
function RulesTab({
  globalRules,
  onUpdateRules,
  validationRules,
  onUpdateValidationRules,
}: {
  globalRules: string[];
  onUpdateRules: (r: string[]) => void;
  validationRules: ValidationRule[];
  onUpdateValidationRules: (r: ValidationRule[]) => void;
}) {
  const [newRule, setNewRule] = useState('');
  const [newValidation, setNewValidation] = useState('');

  const addRule = () => {
    if (newRule.trim()) {
      onUpdateRules([...globalRules, newRule.trim()]);
      setNewRule('');
    }
  };
  const addValidation = () => {
    if (newValidation.trim()) {
      onUpdateValidationRules([
        ...validationRules,
        { id: Date.now().toString(), text: newValidation.trim(), type: 'validation' },
      ]);
      setNewValidation('');
    }
  };

  return (
    <div className="grid grid-cols-2 gap-6">
      {/* Global Writing Rules */}
      <div>
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
          Global Writing Rules
        </h3>
        <p className="text-xs text-gray-400 mb-3">
          Applied to all AI rewrites as style guidance.
        </p>
        {globalRules.length === 0 ? (
          <div className="border-2 border-dashed border-gray-200 rounded-lg p-5 text-center mb-3">
            <p className="text-xs text-gray-400">No rules yet. Add one below.</p>
          </div>
        ) : (
          <div className="space-y-2 mb-3">
            {globalRules.map((rule, i) => (
              <div key={i} className="flex items-start justify-between gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 group">
                <p className="text-xs text-gray-700 flex-1">{rule}</p>
                <button
                  onClick={() => onUpdateRules(globalRules.filter((_, j) => j !== i))}
                  aria-label="Remove rule"
                  className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 flex-shrink-0 mt-0.5"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>
        )}
        <textarea
          value={newRule}
          onChange={(e) => setNewRule(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); addRule(); } }}
          placeholder="Add a writing rule…"
          rows={2}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 resize-none mb-2"
        />
        <button
          onClick={addRule}
          disabled={!newRule.trim()}
          className="flex items-center gap-1 bg-blue-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-blue-700 disabled:opacity-40 w-full justify-center"
        >
          <Plus size={12} /> Add Rule
        </button>
      </div>

      {/* Validation Rules */}
      <div>
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
          Validation Rules
        </h3>
        <p className="text-xs text-gray-400 mb-3">
          Checked after each AI rewrite for pass/fail.
        </p>
        {validationRules.length === 0 ? (
          <div className="border-2 border-dashed border-amber-200 rounded-lg p-5 text-center mb-3">
            <ShieldCheck size={20} className="mx-auto text-amber-300 mb-1.5" />
            <p className="text-xs text-gray-400">No validation rules yet.</p>
          </div>
        ) : (
          <div className="space-y-2 mb-3">
            {validationRules.map((rule) => (
              <div key={rule.id} className="flex items-start justify-between gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 group">
                <p className="text-xs text-gray-700 flex-1">{rule.text}</p>
                <button
                  onClick={() => onUpdateValidationRules(validationRules.filter((r) => r.id !== rule.id))}
                  aria-label="Remove validation rule"
                  className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 flex-shrink-0 mt-0.5"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>
        )}
        <textarea
          value={newValidation}
          onChange={(e) => setNewValidation(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); addValidation(); } }}
          placeholder="Add a validation rule…"
          rows={2}
          className="w-full border border-amber-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-400 resize-none mb-2"
        />
        <button
          onClick={addValidation}
          disabled={!newValidation.trim()}
          className="flex items-center gap-1 bg-amber-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-amber-700 disabled:opacity-40 w-full justify-center"
        >
          <Plus size={12} /> Add Validation Rule
        </button>
      </div>
    </div>
  );
}

/* ── Pricing Tab ── */
function PricingTab({
  pricing,
  onUpdate,
}: {
  pricing: PricingModel;
  onUpdate: (p: PricingModel) => void;
}) {
  const addItem = () => {
    const item: PricingLineItem = {
      id: Date.now().toString(),
      category: '',
      description: '',
      type: 'one-time',
      amount: 0,
      unit: '',
      notes: '',
    };
    onUpdate({ ...pricing, lineItems: [...pricing.lineItems, item] });
  };
  const updateItem = (id: string, field: keyof PricingLineItem, value: string | number) => {
    onUpdate({
      ...pricing,
      lineItems: pricing.lineItems.map((li) => (li.id === id ? { ...li, [field]: value } : li)),
    });
  };
  const removeItem = (id: string) => {
    onUpdate({ ...pricing, lineItems: pricing.lineItems.filter((li) => li.id !== id) });
  };

  return (
    <div>
      <p className="text-xs text-gray-500 mb-4">
        Define your commercial proposal. Used in Submission and Checklist views.
      </p>
      <div className="overflow-x-auto mb-4">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left text-gray-500 font-semibold uppercase tracking-wide pb-2 pr-2">Category</th>
              <th className="text-left text-gray-500 font-semibold uppercase tracking-wide pb-2 pr-2">Description</th>
              <th className="text-left text-gray-500 font-semibold uppercase tracking-wide pb-2 pr-2 w-28">Type</th>
              <th className="text-left text-gray-500 font-semibold uppercase tracking-wide pb-2 pr-2 w-24">Amount</th>
              <th className="text-left text-gray-500 font-semibold uppercase tracking-wide pb-2 pr-2 w-20">Unit</th>
              <th className="w-8 pb-2" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {pricing.lineItems.map((li) => (
              <tr key={li.id} className="group">
                <td className="py-1.5 pr-2">
                  <input value={li.category} onChange={(e) => updateItem(li.id, 'category', e.target.value)}
                    className="w-full border border-transparent hover:border-gray-200 focus:border-blue-400 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500/20 bg-transparent" />
                </td>
                <td className="py-1.5 pr-2">
                  <input value={li.description} onChange={(e) => updateItem(li.id, 'description', e.target.value)}
                    className="w-full border border-transparent hover:border-gray-200 focus:border-blue-400 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500/20 bg-transparent" />
                </td>
                <td className="py-1.5 pr-2">
                  <select value={li.type} onChange={(e) => updateItem(li.id, 'type', e.target.value)}
                    className="w-full border border-gray-200 rounded px-1.5 py-1 focus:outline-none text-xs bg-white">
                    <option value="one-time">One-time</option>
                    <option value="recurring">Recurring</option>
                    <option value="per-transaction">Per-transaction</option>
                    <option value="volume-tiered">Volume-tiered</option>
                  </select>
                </td>
                <td className="py-1.5 pr-2">
                  <input type="number" value={li.amount} onChange={(e) => updateItem(li.id, 'amount', Number(e.target.value))}
                    className="w-full border border-transparent hover:border-gray-200 focus:border-blue-400 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500/20 bg-transparent" />
                </td>
                <td className="py-1.5 pr-2">
                  <input value={li.unit} onChange={(e) => updateItem(li.id, 'unit', e.target.value)}
                    className="w-full border border-transparent hover:border-gray-200 focus:border-blue-400 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500/20 bg-transparent" />
                </td>
                <td className="py-1.5">
                  <button onClick={() => removeItem(li.id)} aria-label="Remove pricing line item"
                    className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 p-0.5">
                    <Trash2 size={13} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button onClick={addItem}
        className="flex items-center gap-1.5 border border-dashed border-gray-300 text-gray-500 hover:border-blue-400 hover:text-blue-600 px-3 py-1.5 rounded-lg text-xs font-medium w-full justify-center mb-6">
        <Plus size={13} /> Add Line Item
      </button>

      <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Implementation Fee</label>
          <div className="flex items-center gap-1">
            <span className="text-xs text-gray-400">{pricing.currency}</span>
            <input type="number" value={pricing.implementationFee}
              onChange={(e) => onUpdate({ ...pricing, implementationFee: Number(e.target.value) })}
              className="w-full border border-gray-200 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
          </div>
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Annual Recurring</label>
          <div className="flex items-center gap-1">
            <span className="text-xs text-gray-400">{pricing.currency}</span>
            <input type="number" value={pricing.annualRecurring}
              onChange={(e) => onUpdate({ ...pricing, annualRecurring: Number(e.target.value) })}
              className="w-full border border-gray-200 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
          </div>
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Currency</label>
          <select value={pricing.currency} onChange={(e) => onUpdate({ ...pricing, currency: e.target.value })}
            className="w-full border border-gray-200 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-white">
            <option value="USD">USD</option>
            <option value="CAD">CAD</option>
            <option value="EUR">EUR</option>
          </select>
        </div>
      </div>
    </div>
  );
}

/* ── Timeline Tab ── */
const STATUS_COLORS_TL = {
  'not-started': 'bg-gray-100 text-gray-600',
  'in-progress': 'bg-blue-100 text-blue-700',
  complete: 'bg-emerald-100 text-emerald-700',
};

function TimelineTab({
  milestones,
  onUpdate,
}: {
  milestones: TimelineMilestone[];
  onUpdate: (m: TimelineMilestone[]) => void;
}) {
  const addMilestone = () => {
    const m: TimelineMilestone = {
      id: Date.now().toString(),
      phase: '',
      description: '',
      startWeek: 1,
      durationWeeks: 1,
      owner: '',
      dependencies: '',
      status: 'not-started',
    };
    onUpdate([...milestones, m]);
  };
  const updateM = (id: string, field: keyof TimelineMilestone, value: string | number) => {
    onUpdate(milestones.map((m) => (m.id === id ? { ...m, [field]: value } : m)));
  };
  const cycleStatus = (id: string) => {
    const order: TimelineMilestone['status'][] = ['not-started', 'in-progress', 'complete'];
    const m = milestones.find((x) => x.id === id);
    if (!m) return;
    const next = order[(order.indexOf(m.status) + 1) % order.length];
    updateM(id, 'status', next);
  };

  return (
    <div>
      <p className="text-xs text-gray-500 mb-4">
        Implementation milestones shown in the Timeline view and Submission Checklist.
      </p>
      <div className="space-y-3 mb-4">
        {milestones.map((m) => (
          <div key={m.id} className="border border-gray-200 rounded-xl p-4 group">
            <div className="flex items-center gap-3 mb-3">
              <input value={m.phase} onChange={(e) => updateM(m.id, 'phase', e.target.value)}
                placeholder="Phase name"
                className="flex-1 border-b border-transparent hover:border-gray-300 focus:border-blue-400 focus:outline-none text-sm font-semibold text-gray-800 bg-transparent pb-0.5" />
              <button
                onClick={() => cycleStatus(m.id)}
                aria-label={`Milestone status: ${m.status}. Click to cycle`}
                className={`text-[10px] font-semibold px-2.5 py-1 rounded-full capitalize cursor-pointer ${STATUS_COLORS_TL[m.status]}`}>
                {m.status.replace('-', ' ')}
              </button>
              <button onClick={() => onUpdate(milestones.filter((x) => x.id !== m.id))}
                aria-label="Remove milestone"
                className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500">
                <Trash2 size={13} />
              </button>
            </div>
            <input value={m.description} onChange={(e) => updateM(m.id, 'description', e.target.value)}
              placeholder="Description"
              className="w-full border border-transparent hover:border-gray-200 focus:border-blue-400 rounded px-2 py-1 text-xs text-gray-600 focus:outline-none mb-2 bg-transparent" />
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div>
                <label className="text-gray-400 font-medium">Start Week</label>
                <input type="number" value={m.startWeek} min={1}
                  onChange={(e) => updateM(m.id, 'startWeek', Number(e.target.value))}
                  className="w-full mt-0.5 border border-gray-200 rounded px-2 py-1 focus:outline-none" />
              </div>
              <div>
                <label className="text-gray-400 font-medium">Duration (weeks)</label>
                <input type="number" value={m.durationWeeks} min={1}
                  onChange={(e) => updateM(m.id, 'durationWeeks', Number(e.target.value))}
                  className="w-full mt-0.5 border border-gray-200 rounded px-2 py-1 focus:outline-none" />
              </div>
              <div>
                <label className="text-gray-400 font-medium">Owner</label>
                <input value={m.owner} onChange={(e) => updateM(m.id, 'owner', e.target.value)}
                  className="w-full mt-0.5 border border-gray-200 rounded px-2 py-1 focus:outline-none" />
              </div>
            </div>
          </div>
        ))}
      </div>
      <button onClick={addMilestone}
        className="flex items-center gap-1.5 border border-dashed border-gray-300 text-gray-500 hover:border-blue-400 hover:text-blue-600 px-3 py-2 rounded-xl text-xs font-medium w-full justify-center">
        <Plus size={13} /> Add Milestone
      </button>
    </div>
  );
}

/* ── SLAs Tab ── */
function SLAsTab({
  slas,
  onUpdate,
}: {
  slas: SLACommitment[];
  onUpdate: (s: SLACommitment[]) => void;
}) {
  const addSLA = () => {
    const s: SLACommitment = {
      id: Date.now().toString(),
      category: '',
      metric: '',
      target: '',
      measurement: '',
      penalty: '',
      currentPerformance: '',
    };
    onUpdate([...slas, s]);
  };
  const updateS = (id: string, field: keyof SLACommitment, value: string) => {
    onUpdate(slas.map((s) => (s.id === id ? { ...s, [field]: value } : s)));
  };

  return (
    <div>
      <p className="text-xs text-gray-500 mb-4">
        Service level commitments referenced in the Submission view.
      </p>
      {slas.length > 0 && (
        <div className="overflow-x-auto mb-4">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="border-b border-gray-200">
                {['Category', 'Metric', 'Target', 'Measurement', 'Penalty', 'Current Perf.', ''].map((h) => (
                  <th key={h} className="text-left text-gray-500 font-semibold uppercase tracking-wide pb-2 pr-2 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {slas.map((s) => (
                <tr key={s.id} className="group">
                  {(['category', 'metric', 'target', 'measurement', 'penalty', 'currentPerformance'] as const).map((field) => (
                    <td key={field} className="py-1.5 pr-2">
                      <input value={s[field]} onChange={(e) => updateS(s.id, field, e.target.value)}
                        className="w-full border border-transparent hover:border-gray-200 focus:border-blue-400 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500/20 bg-transparent min-w-[80px]" />
                    </td>
                  ))}
                  <td className="py-1.5">
                    <button onClick={() => onUpdate(slas.filter((x) => x.id !== s.id))}
                      aria-label="Remove SLA commitment"
                      className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 p-0.5">
                      <Trash2 size={13} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <button onClick={addSLA}
        className="flex items-center gap-1.5 border border-dashed border-gray-300 text-gray-500 hover:border-blue-400 hover:text-blue-600 px-3 py-1.5 rounded-lg text-xs font-medium w-full justify-center">
        <Plus size={13} /> Add SLA Commitment
      </button>
    </div>
  );
}

/* ── Versions Tab ── */
function VersionsTab({
  versions,
  onSave,
  onDelete,
  onRestore,
  currentQuestionCount,
}: {
  versions: Version[];
  onSave: (label?: string) => void;
  onDelete: (ts: number) => void;
  onRestore: (v: Version) => void;
  currentQuestionCount: number;
}) {
  const [label, setLabel] = useState('');

  const exportVersion = (v: Version) => {
    const blob = new Blob([JSON.stringify(v.data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rfp-${v.label.replace(/\s+/g, '-')}-${new Date(v.timestamp).toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSave = () => {
    onSave(label.trim() || undefined);
    setLabel('');
  };

  return (
    <div>
      <p className="text-xs text-gray-500 mb-4">
        Save named snapshots of the full workbook. Versions are stored locally.
      </p>

      {/* Save current version */}
      <div className="flex gap-2 mb-6">
        <input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); }}
          placeholder="Version label (optional)…"
          className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
        />
        <button
          onClick={handleSave}
          className="flex items-center gap-1.5 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 whitespace-nowrap"
        >
          <History size={13} /> Save Version
        </button>
      </div>

      {/* Version list */}
      {versions.length === 0 ? (
        <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center">
          <History size={28} className="mx-auto text-gray-300 mb-2" />
          <p className="text-sm text-gray-400">No saved versions yet.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {[...versions].reverse().map((v) => (
            <div key={v.timestamp} className="flex items-center justify-between border border-gray-200 rounded-xl px-4 py-3 hover:border-gray-300 group">
              <div className="min-w-0">
                <span className="font-medium text-sm text-gray-800">{v.label}</span>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-gray-400">{formatRelative(v.timestamp)}</span>
                  <span className="text-gray-300">·</span>
                  <span className="text-xs text-gray-400">{new Date(v.timestamp).toLocaleString()}</span>
                  <span className="text-gray-300">·</span>
                  <span className="text-xs text-gray-400">{v.data.questions.length} questions</span>
                </div>
              </div>
              <div className="flex items-center gap-1.5 ml-3 flex-shrink-0">
                <button
                  onClick={() => exportVersion(v)}
                  aria-label={`Export version ${v.label}`}
                  className="p-1.5 rounded text-gray-400 hover:text-blue-600 hover:bg-blue-50"
                  title="Export as JSON"
                >
                  <Download size={13} />
                </button>
                <button
                  onClick={() => {
                    const vCount = v.data.questions?.length ?? 0;
                    const diff = vCount - currentQuestionCount;
                    const diffStr = diff === 0 ? 'same number of questions' : `${Math.abs(diff)} question${Math.abs(diff) === 1 ? '' : 's'} ${diff > 0 ? 'more' : 'fewer'}`;
                    const saved = formatRelative(v.timestamp);
                    if (window.confirm(
                      `Restore "${v.label}" (saved ${saved})?\n\n` +
                      `This version has ${vCount} questions (${diffStr} than current).\n\n` +
                      `Your current unsaved changes will be lost. This cannot be undone.`
                    )) {
                      onRestore(v);
                    }
                  }}
                  aria-label={`Restore version ${v.label}`}
                  className="p-1.5 rounded text-gray-400 hover:text-emerald-600 hover:bg-emerald-50"
                  title="Restore version"
                >
                  <RotateCcw size={13} />
                </button>
                <button
                  onClick={() => {
                    if (window.confirm(`Delete version "${v.label}"?`)) onDelete(v.timestamp);
                  }}
                  aria-label={`Delete version ${v.label}`}
                  className="p-1.5 rounded text-gray-400 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Main SettingsPanel ── */
const TABS: { key: SettingsTab; icon: React.ElementType; label: string }[] = [
  { key: 'workspace', icon: BookOpen, label: 'Workspace' },
  { key: 'rules', icon: ShieldCheck, label: 'Rules' },
  { key: 'pricing', icon: DollarSign, label: 'Pricing' },
  { key: 'timeline', icon: Calendar, label: 'Timeline' },
  { key: 'slas', icon: Shield, label: 'SLAs' },
  { key: 'versions', icon: History, label: 'Versions' },
];

export default function SettingsPanel({
  onClose,
  kb, onUpdateKB, onSaveKB,
  globalRules, onUpdateRules,
  validationRules, onUpdateValidationRules,
  pricing, onUpdatePricing,
  milestones, onUpdateMilestones,
  slas, onUpdateSLAs,
  versions, onSaveVersion, onDeleteVersion, onRestoreVersion, currentQuestionCount,
}: SettingsPanelProps) {
  const [activeTab, setActiveTab] = useState<SettingsTab>('workspace');

  return (
    <>
      <div className="absolute inset-0 bg-black/20 z-20" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Settings & Configuration"
        className="absolute right-0 top-0 bottom-0 w-full sm:w-[680px] lg:w-[720px] bg-white border-l shadow-2xl z-30 flex flex-col panel-slide-in"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Settings & Configuration</h2>
            <p className="text-xs text-gray-500 mt-0.5">Knowledge base, rules, pricing, timeline, SLAs, and version history</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close settings panel"
            className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
          >
            <X size={16} />
          </button>
        </div>

        {/* Tab bar */}
        <div className="flex border-b border-gray-100 flex-shrink-0 overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-all whitespace-nowrap ${
                activeTab === tab.key
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <tab.icon size={14} /> {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-auto p-6">
          {activeTab === 'workspace' && (
            <WorkspaceTab kb={kb} onUpdate={onUpdateKB} onSave={onSaveKB} />
          )}
          {activeTab === 'rules' && (
            <RulesTab
              globalRules={globalRules}
              onUpdateRules={onUpdateRules}
              validationRules={validationRules}
              onUpdateValidationRules={onUpdateValidationRules}
            />
          )}
          {activeTab === 'pricing' && (
            <PricingTab pricing={pricing} onUpdate={onUpdatePricing} />
          )}
          {activeTab === 'timeline' && (
            <TimelineTab milestones={milestones} onUpdate={onUpdateMilestones} />
          )}
          {activeTab === 'slas' && (
            <SLAsTab slas={slas} onUpdate={onUpdateSLAs} />
          )}
          {activeTab === 'versions' && (
            <VersionsTab versions={versions} onSave={onSaveVersion} onDelete={onDeleteVersion} onRestore={onRestoreVersion} currentQuestionCount={currentQuestionCount} />
          )}
        </div>
      </div>
    </>
  );
}
