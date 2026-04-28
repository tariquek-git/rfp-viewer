'use client';

import React, { useCallback } from 'react';
import {
  BookOpen,
  LayoutGrid,
  BarChart3,
  DollarSign,
  Calendar,
  Shield,
  ClipboardCheck,
  FileText,
  Bot,
  Target,
  ClipboardList,
  FileStack,
  Keyboard,
  Settings,
  Circle,
  AlertTriangle,
  Users,
  Briefcase,
} from 'lucide-react';
import ProgressBar from '@/components/ProgressBar';
import { TourLaunchButton } from '@/components/TourOverlay';
import type { ViewTab } from '@/types';
import type { useRFPState } from '@/hooks/useRFPState';

interface AppHeaderProps {
  state: ReturnType<typeof useRFPState>;
  liveStats: { green: number; yellow: number; red: number; total: number };
  lastSaved: number | null;
  showSettings: boolean;
  setShowSettings: (v: boolean) => void;
  setShowShortcuts: (v: boolean) => void;
  setShowTour: (v: boolean) => void;
  onFilterConfidence?: (conf: string) => void;
  deadline?: string;
  onDeadlineChange?: (v: string) => void;
}

const NAV_GROUPS = [
  {
    label: 'RFP Work',
    tabs: [
      { key: 'grid' as ViewTab, icon: LayoutGrid, label: 'Response Grid' },
      { key: 'context' as ViewTab, icon: BarChart3, label: 'Dashboard' },
      { key: 'humanize' as ViewTab, icon: Bot, label: 'AI QA' },
      { key: 'issues' as ViewTab, icon: AlertTriangle, label: 'Issues' },
    ],
  },
  {
    label: 'Strategy',
    tabs: [
      { key: 'dealcontext' as ViewTab, icon: Briefcase, label: 'Deal Context' },
      { key: 'knowledgebase' as ViewTab, icon: BookOpen, label: 'Knowledge Base' },
      { key: 'pricing' as ViewTab, icon: DollarSign, label: 'Pricing' },
      { key: 'timeline' as ViewTab, icon: Calendar, label: 'Timeline' },
      { key: 'sla' as ViewTab, icon: Shield, label: 'SLAs' },
    ],
  },
  {
    label: 'Review & Submit',
    tabs: [
      { key: 'compliance' as ViewTab, icon: ClipboardCheck, label: 'Compliance' },
      { key: 'submission' as ViewTab, icon: FileText, label: 'Export' },
      { key: 'assignments' as ViewTab, icon: Users, label: 'Assignments' },
    ],
  },
];

function formatTimeSince(ts: number | null): string {
  if (!ts) return '';
  const now = performance.timeOrigin + performance.now();
  const diff = Math.floor((now - ts) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

function AppHeaderInner({
  state,
  liveStats,
  lastSaved,
  showSettings,
  setShowSettings,
  setShowShortcuts,
  setShowTour,
  onFilterConfidence,
  deadline,
  onDeadlineChange,
}: AppHeaderProps) {
  const onToggleWinThemes = useCallback(() => {
    state.setSelectedQuestion(null);
    state.setShowWinThemes(!state.showWinThemes);
  }, [state]);

  const onToggleRules = useCallback(() => {
    state.setSelectedQuestion(null);
    state.setShowRules(!state.showRules);
  }, [state]);

  const onShowChecklist = useCallback(() => state.setShowChecklist(true), [state]);
  const onShowTemplates = useCallback(() => state.setShowTemplates(true), [state]);
  const onShowShortcuts = useCallback(() => setShowShortcuts(true), [setShowShortcuts]);

  const onShowSettings = useCallback(() => {
    state.setSelectedQuestion(null);
    state.setShowRules(false);
    state.setShowWinThemes(false);
    setShowSettings(true);
  }, [state, setShowSettings]);

  const iconButtons: {
    icon: React.ElementType;
    label: string;
    active: boolean;
    onClick: () => void;
    activeClass: string;
    dataTour?: string;
  }[] = [
    {
      icon: Target,
      label: 'Win Themes',
      active: state.showWinThemes,
      onClick: onToggleWinThemes,
      activeClass: 'text-violet-600 bg-violet-50',
    },
    {
      icon: BookOpen,
      label: 'Rules',
      active: state.showRules,
      onClick: onToggleRules,
      activeClass: 'text-blue-600 bg-blue-50',
    },
    {
      icon: ClipboardList,
      label: 'Checklist',
      active: false,
      onClick: onShowChecklist,
      activeClass: '',
    },
    {
      icon: FileStack,
      label: 'Templates',
      active: false,
      onClick: onShowTemplates,
      activeClass: '',
    },
    { icon: Keyboard, label: 'Keys', active: false, onClick: onShowShortcuts, activeClass: '' },
    {
      icon: Settings,
      label: 'Settings',
      active: showSettings,
      onClick: onShowSettings,
      activeClass: 'text-gray-700 bg-gray-100',
      dataTour: 'tour-settings-btn',
    },
  ];

  return (
    <header className="border-b border-gray-200 px-4 py-2 flex items-center justify-between flex-shrink-0 bg-white">
      <div className="flex items-center gap-3">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center">
          <BookOpen size={14} className="text-white" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-bold text-gray-900">BSB Credit Card RFP</h1>
            {state.hasUnsaved ? (
              <span className="text-[9px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-medium">
                Unsaved
              </span>
            ) : (
              lastSaved && (
                <span className="text-[9px] text-gray-400 font-medium">
                  Saved {formatTimeSince(lastSaved)}
                </span>
              )
            )}
          </div>
          <p className="text-[10px] text-gray-400">
            {liveStats.total} Qs · {state.data?.categories.length ?? 0} Categories
          </p>
        </div>
      </div>

      {/* Grouped Nav Tabs */}
      <div className="flex items-center gap-1">
        {NAV_GROUPS.map((group, gi) => (
          <div key={group.label} className="flex items-center">
            {gi > 0 && <div className="w-px h-5 bg-gray-200 mx-1.5" />}
            <span className="text-[8px] text-gray-400 uppercase tracking-wider font-semibold mr-1 hidden lg:inline">
              {group.label}
            </span>
            <div className="flex items-center bg-gray-100 rounded-lg p-0.5">
              {group.tabs.map((tab) => {
                const isAssignments = tab.key === 'assignments';
                const redCount = isAssignments ? liveStats.red : 0;
                return (
                  <button
                    key={tab.key}
                    data-tour={`tour-${tab.key}-tab`}
                    onClick={() => {
                      state.setActiveTab(tab.key);
                      state.setSelectedQuestion(null);
                    }}
                    className={`relative flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-all ${state.activeTab === tab.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    <tab.icon size={11} /> {tab.label}
                    {isAssignments && redCount > 0 && (
                      <span className="ml-0.5 bg-red-500 text-white text-[8px] font-bold px-1 py-0.5 rounded-full leading-none">
                        {redCount}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Right side */}
      <div className="flex items-center gap-2">
        <ProgressBar {...state.statusCounts} />
        <div
          data-tour="tour-confidence-stats"
          className="flex items-center gap-1.5 text-[10px] font-medium"
        >
          <button
            onClick={() => onFilterConfidence?.('GREEN')}
            title="Filter by GREEN confidence"
            className="flex items-center gap-0.5 hover:opacity-70 transition-opacity"
          >
            <Circle size={6} fill="#10b981" className="text-emerald-500" />
            {liveStats.green}
          </button>
          <button
            onClick={() => onFilterConfidence?.('YELLOW')}
            title="Filter by YELLOW confidence"
            className="flex items-center gap-0.5 hover:opacity-70 transition-opacity"
          >
            <Circle size={6} fill="#f59e0b" className="text-amber-500" />
            {liveStats.yellow}
          </button>
          <button
            onClick={() => onFilterConfidence?.('RED')}
            title="Filter by RED confidence"
            className="flex items-center gap-0.5 hover:opacity-70 transition-opacity"
          >
            <Circle size={6} fill="#ef4444" className="text-red-500" />
            {liveStats.red}
          </button>
        </div>
        {onDeadlineChange !== undefined && (
          <div className="flex items-center gap-1 text-[10px] text-gray-500">
            <span className="font-medium text-gray-400">Due:</span>
            <input
              type="date"
              value={deadline || ''}
              onChange={(e) => onDeadlineChange(e.target.value)}
              title="Submission deadline"
              className="border border-gray-200 rounded px-1 py-0.5 text-[10px] text-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white"
            />
          </div>
        )}
        <div className="w-px h-5 bg-gray-200" />
        {iconButtons.map(({ icon: Icon, label, active, onClick, activeClass, dataTour }) => (
          <button
            key={label}
            onClick={onClick}
            title={label}
            aria-label={label}
            data-tour={dataTour}
            className={`flex flex-col items-center gap-0.5 px-1.5 py-1 rounded-md text-center ${active ? activeClass : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}
          >
            <Icon size={14} />
            <span className="text-[8px] leading-none font-medium">{label}</span>
          </button>
        ))}
        <TourLaunchButton onClick={() => setShowTour(true)} />
      </div>
    </header>
  );
}

export default React.memo(AppHeaderInner) as typeof AppHeaderInner;
