'use client';

/**
 * Library tab — slow-changing reference content as sub-tabs.
 *
 * Replaces the standalone Deal Context, Knowledge Base, Pricing, Timeline,
 * SLA tabs (and the Versions section formerly in the Settings panel).
 *
 * Each sub-tab mounts the existing view component unchanged. Sub-tab
 * choice is persisted via STORAGE_KEYS.LIBRARY_SUBTAB so refresh keeps
 * the user where they were.
 */

import { lazy, Suspense, useMemo } from 'react';
import {
  Briefcase,
  BookOpen,
  DollarSign,
  Calendar,
  Shield,
  History,
  Trash2,
  Save,
  RotateCcw,
} from 'lucide-react';
import type {
  LibrarySubtab,
  DealContext,
  KnowledgeBase,
  PricingModel,
  TimelineMilestone,
  SLACommitment,
  Version,
  RFPData,
} from '@/types';

const DealContextView = lazy(() => import('@/components/DealContextView'));
const KnowledgeBaseView = lazy(() => import('@/components/KnowledgeBase'));
const PricingView = lazy(() => import('@/components/PricingView'));
const TimelineView = lazy(() => import('@/components/TimelineView'));
const SLAView = lazy(() => import('@/components/SLAView'));

interface LibraryViewProps {
  activeSubtab: LibrarySubtab;
  onChangeSubtab: (s: LibrarySubtab) => void;
  // Deal context
  dealContext: DealContext;
  onUpdateDealContext: (ctx: DealContext) => void;
  // KB
  knowledgeBase: KnowledgeBase;
  onUpdateKnowledgeBase: (kb: KnowledgeBase) => void;
  // Pricing / Timeline / SLA
  pricing: PricingModel;
  onUpdatePricing: (p: PricingModel) => void;
  milestones: TimelineMilestone[];
  onUpdateMilestones: (m: TimelineMilestone[]) => void;
  slas: SLACommitment[];
  onUpdateSLAs: (s: SLACommitment[]) => void;
  // Versions
  versions: Version[];
  onSaveVersion: (label: string) => void;
  onDeleteVersion: (timestamp: number) => void;
  onRestoreVersion: (v: Version) => void;
  // Shared
  onSave: () => void;
  currentData: RFPData;
}

const TABS: { key: LibrarySubtab; label: string; icon: React.ElementType }[] = [
  { key: 'dealcontext', label: 'Deal Context', icon: Briefcase },
  { key: 'knowledgebase', label: 'Knowledge Base', icon: BookOpen },
  { key: 'pricing', label: 'Pricing', icon: DollarSign },
  { key: 'timeline', label: 'Timeline', icon: Calendar },
  { key: 'sla', label: 'SLAs', icon: Shield },
  { key: 'versions', label: 'Versions', icon: History },
];

const FALLBACK = (
  <div className="flex-1 flex items-center justify-center text-gray-400 text-xs p-8">Loading…</div>
);

function VersionsPanel({
  versions,
  currentQuestionCount,
  onSave,
  onDelete,
  onRestore,
}: {
  versions: Version[];
  currentQuestionCount: number;
  onSave: (label: string) => void;
  onDelete: (timestamp: number) => void;
  onRestore: (v: Version) => void;
}) {
  return (
    <div className="overflow-auto h-full p-6 bg-gray-50/30">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-50 rounded-lg">
              <History size={20} className="text-amber-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Versions</h2>
              <p className="text-xs text-gray-400">
                Snapshots of the full workbook. Save before destructive edits; restore to roll back.
              </p>
            </div>
          </div>
          <button
            onClick={() =>
              onSave(
                `Snapshot ${new Date().toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}`,
              )
            }
            className="flex items-center gap-1.5 bg-blue-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-blue-700 shadow-sm"
          >
            <Save size={13} /> Save snapshot
          </button>
        </div>

        {versions.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-sm text-center text-sm text-gray-400">
            No versions saved yet. Take a snapshot before risky edits.
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm divide-y divide-gray-100">
            {versions
              .slice()
              .sort((a, b) => b.timestamp - a.timestamp)
              .map((v) => (
                <div
                  key={v.timestamp}
                  className="flex items-center justify-between px-4 py-3 group"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900">{v.label}</p>
                    <p className="text-[11px] text-gray-400">
                      {new Date(v.timestamp).toLocaleString()} · {v.data.questions.length} questions
                      {v.data.questions.length !== currentQuestionCount && (
                        <span className="ml-2 text-amber-600">
                          (current: {currentQuestionCount})
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => {
                        if (
                          window.confirm(
                            `Restore "${v.label}"? Current unsaved edits will be replaced.`,
                          )
                        ) {
                          onRestore(v);
                        }
                      }}
                      className="flex items-center gap-1 text-xs text-gray-600 hover:text-gray-900 px-2 py-1 rounded border border-gray-200 hover:bg-gray-50"
                    >
                      <RotateCcw size={11} /> Restore
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm(`Delete "${v.label}"? This can't be undone.`)) {
                          onDelete(v.timestamp);
                        }
                      }}
                      className="text-gray-400 hover:text-red-500"
                      title="Delete version"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function LibraryView({
  activeSubtab,
  onChangeSubtab,
  dealContext,
  onUpdateDealContext,
  knowledgeBase,
  onUpdateKnowledgeBase,
  pricing,
  onUpdatePricing,
  milestones,
  onUpdateMilestones,
  slas,
  onUpdateSLAs,
  versions,
  onSaveVersion,
  onDeleteVersion,
  onRestoreVersion,
  onSave,
  currentData,
}: LibraryViewProps) {
  const currentQuestionCount = useMemo(
    () => currentData.questions.length,
    [currentData.questions.length],
  );

  return (
    <div className="flex flex-col h-full">
      {/* Sub-tab navigator */}
      <div className="border-b border-gray-200 px-4 bg-white flex items-center gap-1 overflow-x-auto flex-shrink-0">
        {TABS.map((tab) => {
          const active = activeSubtab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => onChangeSubtab(tab.key)}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 transition-colors whitespace-nowrap ${
                active
                  ? 'border-blue-600 text-gray-900'
                  : 'border-transparent text-gray-500 hover:text-gray-800'
              }`}
            >
              <tab.icon size={12} /> {tab.label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        <Suspense fallback={FALLBACK}>
          {activeSubtab === 'dealcontext' && (
            <DealContextView
              dealContext={dealContext}
              onUpdate={onUpdateDealContext}
              onSave={onSave}
            />
          )}
          {activeSubtab === 'knowledgebase' && (
            <KnowledgeBaseView
              kb={knowledgeBase}
              onUpdate={onUpdateKnowledgeBase}
              onSave={onSave}
            />
          )}
          {activeSubtab === 'pricing' && (
            <PricingView pricing={pricing} onUpdate={onUpdatePricing} />
          )}
          {activeSubtab === 'timeline' && (
            <TimelineView milestones={milestones} onUpdate={onUpdateMilestones} />
          )}
          {activeSubtab === 'sla' && <SLAView slas={slas} onUpdate={onUpdateSLAs} />}
          {activeSubtab === 'versions' && (
            <VersionsPanel
              versions={versions}
              currentQuestionCount={currentQuestionCount}
              onSave={onSaveVersion}
              onDelete={onDeleteVersion}
              onRestore={onRestoreVersion}
            />
          )}
        </Suspense>
      </div>
    </div>
  );
}
