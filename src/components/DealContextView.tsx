'use client';

import { useState } from 'react';
import { Save, Briefcase, Plus, X, RotateCcw } from 'lucide-react';
import type { DealContext, RelationshipStage, CompetitorNote } from '@/types';
import { BSB_DEAL_CONTEXT } from '@/lib/bsbDefaults';

interface DealContextViewProps {
  dealContext: DealContext;
  onUpdate: (ctx: DealContext) => void;
  onSave: () => void;
}

const STAGE_LABELS: Record<RelationshipStage, string> = {
  cold: 'Cold — no prior relationship',
  warm: 'Warm — prior touch / referral',
  incumbent_threat: 'Incumbent threat — replacing existing vendor',
  follow_on: 'Follow-on — existing client expanding',
};

function FieldLabel({ label, hint }: { label: string; hint?: string }) {
  return (
    <div className="mb-1.5">
      <label className="block text-sm font-semibold text-gray-900">{label}</label>
      {hint && <p className="text-xs text-gray-500 mt-0.5">{hint}</p>}
    </div>
  );
}

function StringListEditor({
  items,
  onChange,
  placeholder,
  emptyHint,
}: {
  items: string[];
  onChange: (next: string[]) => void;
  placeholder: string;
  emptyHint: string;
}) {
  const [draft, setDraft] = useState('');

  const add = () => {
    const v = draft.trim();
    if (!v) return;
    onChange([...items, v]);
    setDraft('');
  };

  return (
    <div className="space-y-1.5">
      {items.length === 0 ? (
        <p className="text-xs text-gray-400 italic">{emptyHint}</p>
      ) : (
        items.map((item, i) => (
          <div
            key={i}
            className="group flex items-start gap-2 bg-gray-50 border border-gray-200 rounded-md px-2.5 py-1.5"
          >
            <span className="flex-1 text-sm text-gray-800">{item}</span>
            <button
              onClick={() => onChange(items.filter((_, j) => j !== i))}
              className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-opacity"
              title="Remove"
            >
              <X size={14} />
            </button>
          </div>
        ))
      )}
      <div className="flex gap-2">
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              add();
            }
          }}
          placeholder={placeholder}
          className="flex-1 border border-gray-200 rounded-md px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400 placeholder:text-gray-300"
        />
        <button
          onClick={add}
          disabled={!draft.trim()}
          className="flex items-center gap-1 bg-gray-900 text-white px-2.5 py-1.5 rounded-md text-xs font-medium hover:bg-gray-700 disabled:bg-gray-200 disabled:text-gray-400"
        >
          <Plus size={13} /> Add
        </button>
      </div>
    </div>
  );
}

function CompetitorEditor({
  competitors,
  onChange,
}: {
  competitors: CompetitorNote[];
  onChange: (next: CompetitorNote[]) => void;
}) {
  const addCompetitor = () => {
    onChange([...competitors, { id: `c-${Date.now()}`, name: '', positioning: '' }]);
  };

  return (
    <div className="space-y-2">
      {competitors.length === 0 ? (
        <p className="text-xs text-gray-400 italic">
          No competitors flagged. Add when you know who else the bank is talking to.
        </p>
      ) : (
        competitors.map((c, i) => (
          <div
            key={c.id}
            className="grid grid-cols-[1fr_2fr_auto] gap-2 items-start bg-gray-50 border border-gray-200 rounded-md p-2"
          >
            <input
              type="text"
              value={c.name}
              onChange={(e) => {
                const next = [...competitors];
                next[i] = { ...c, name: e.target.value };
                onChange(next);
              }}
              placeholder="Competitor name"
              className="border border-gray-200 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
            />
            <input
              type="text"
              value={c.positioning}
              onChange={(e) => {
                const next = [...competitors];
                next[i] = { ...c, positioning: e.target.value };
                onChange(next);
              }}
              placeholder="Their positioning / what they're saying"
              className="border border-gray-200 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
            />
            <button
              onClick={() => onChange(competitors.filter((_, j) => j !== i))}
              className="text-gray-400 hover:text-red-500"
              title="Remove"
            >
              <X size={14} />
            </button>
          </div>
        ))
      )}
      <button
        onClick={addCompetitor}
        className="flex items-center gap-1 text-xs text-gray-600 hover:text-gray-900 font-medium"
      >
        <Plus size={13} /> Add competitor
      </button>
    </div>
  );
}

export default function DealContextView({ dealContext, onUpdate, onSave }: DealContextViewProps) {
  const update = <K extends keyof DealContext>(field: K, value: DealContext[K]) => {
    onUpdate({ ...dealContext, [field]: value });
  };

  const resetToBSB = () => {
    if (
      window.confirm(
        'Reset all fields to the BSB default? This overwrites any edits you have made.',
      )
    ) {
      onUpdate({ ...BSB_DEAL_CONTEXT });
    }
  };

  return (
    <div className="overflow-auto h-full p-6 bg-gray-50/30">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-violet-50 rounded-lg">
              <Briefcase size={20} className="text-violet-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Deal Context</h2>
              <p className="text-xs text-gray-400">
                Account-specific intelligence injected into every AI rewrite and critique. The
                things only you know about this deal.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={resetToBSB}
              className="flex items-center gap-1.5 text-xs font-medium text-gray-600 hover:text-gray-900 px-2.5 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50"
              title="Reset all fields to the BSB starter context"
            >
              <RotateCcw size={12} /> Reset to BSB
            </button>
            <button
              onClick={onSave}
              className="flex items-center gap-1.5 bg-blue-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-blue-700 shadow-sm"
            >
              <Save size={13} /> Save
            </button>
          </div>
        </div>

        {dealContext.lastUpdated > 0 && (
          <p className="text-[10px] text-gray-400 mb-4">
            Last updated: {new Date(dealContext.lastUpdated).toLocaleString()}
          </p>
        )}

        {/* Account profile */}
        <section className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm mb-4">
          <h3 className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-wider">Account</h3>

          <div className="grid grid-cols-[1fr_1fr] gap-4 mb-4">
            <div>
              <FieldLabel label="Account name" />
              <input
                type="text"
                value={dealContext.accountName}
                onChange={(e) => update('accountName', e.target.value)}
                placeholder="Bangor Savings Bank"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              />
            </div>
            <div>
              <FieldLabel label="Relationship stage" />
              <select
                value={dealContext.relationshipStage}
                onChange={(e) => update('relationshipStage', e.target.value as RelationshipStage)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 bg-white"
              >
                {(Object.keys(STAGE_LABELS) as RelationshipStage[]).map((s) => (
                  <option key={s} value={s}>
                    {STAGE_LABELS[s]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mb-4">
            <FieldLabel
              label="Account profile"
              hint="Size, charter, geography, brand. The shape of the bank."
            />
            <textarea
              value={dealContext.accountProfile}
              onChange={(e) => update('accountProfile', e.target.value)}
              rows={3}
              placeholder="$7B mutual savings bank, Maine + NH, depositor-owned..."
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 resize-y"
            />
          </div>

          <div>
            <FieldLabel
              label="Prior engagement"
              hint="Touch points, referral source, history with us."
            />
            <textarea
              value={dealContext.priorEngagement}
              onChange={(e) => update('priorEngagement', e.target.value)}
              rows={2}
              placeholder="No prior — intro via Mastercard..."
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 resize-y"
            />
          </div>
        </section>

        {/* Strategic framing — highest leverage */}
        <section className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm mb-4">
          <h3 className="text-sm font-bold text-gray-900 mb-1 uppercase tracking-wider">
            Strategic framing
          </h3>
          <p className="text-xs text-gray-500 mb-4">
            Highest leverage on every prompt. The AI sees these on every rewrite.
          </p>

          <div className="mb-5">
            <FieldLabel
              label="Must emphasize"
              hint="What we want to land. Press Enter to add each item."
            />
            <StringListEditor
              items={dealContext.mustEmphasize}
              onChange={(v) => update('mustEmphasize', v)}
              placeholder="e.g. Mutual ownership / depositor benefit"
              emptyHint="Nothing flagged. Add 3-5 items the AI should weave in."
            />
          </div>

          <div>
            <FieldLabel
              label="Must avoid"
              hint="Phrases, framings, or claims that hurt us with this account."
            />
            <StringListEditor
              items={dealContext.mustAvoid}
              onChange={(v) => update('mustAvoid', v)}
              placeholder="e.g. Don't name Jack Henry proactively"
              emptyHint="Nothing flagged. Add things the AI should never say to this bank."
            />
          </div>
        </section>

        {/* Evaluator personas */}
        <section className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm mb-4">
          <h3 className="text-sm font-bold text-gray-900 mb-1 uppercase tracking-wider">
            Evaluators
          </h3>
          <p className="text-xs text-gray-500 mb-4">Who will actually read these answers.</p>

          <div className="mb-4">
            <FieldLabel label="Primary / committee" />
            <textarea
              value={dealContext.evaluatorPrimary}
              onChange={(e) => update('evaluatorPrimary', e.target.value)}
              rows={2}
              placeholder="Procurement committee + Maine FDIC examiner..."
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 resize-y"
            />
          </div>

          <div className="mb-4">
            <FieldLabel label="Technical evaluator" />
            <textarea
              value={dealContext.evaluatorTechnical}
              onChange={(e) => update('evaluatorTechnical', e.target.value)}
              rows={2}
              placeholder="Centrix DTS replacement team..."
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 resize-y"
            />
          </div>

          <div>
            <FieldLabel label="Business sponsor" />
            <textarea
              value={dealContext.evaluatorBusiness}
              onChange={(e) => update('evaluatorBusiness', e.target.value)}
              rows={2}
              placeholder="EVP Card Services / Everblue program owner..."
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 resize-y"
            />
          </div>
        </section>

        {/* Competitors */}
        <section className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm mb-4">
          <h3 className="text-sm font-bold text-gray-900 mb-1 uppercase tracking-wider">
            Competitive context
          </h3>
          <p className="text-xs text-gray-500 mb-4">Who else they are talking to and how.</p>
          <CompetitorEditor
            competitors={dealContext.competitors}
            onChange={(v) => update('competitors', v)}
          />
        </section>

        {/* Free-form notes */}
        <section className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <h3 className="text-sm font-bold text-gray-900 mb-1 uppercase tracking-wider">Notes</h3>
          <p className="text-xs text-gray-500 mb-4">
            Catchall for call notes, hunches, late-breaking signals — anything that does not fit the
            structured fields.
          </p>
          <textarea
            value={dealContext.freeformNotes}
            onChange={(e) => update('freeformNotes', e.target.value)}
            rows={8}
            placeholder="Their CIO mentioned in the kickoff that they're scarred by their last vendor's outage..."
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 resize-y"
          />
        </section>
      </div>
    </div>
  );
}
