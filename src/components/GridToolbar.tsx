'use client';

import React, { memo } from 'react';
import type { WorkflowStatus } from '@/types';
import { isSupabaseConfigured } from '@/lib/supabase';
import {
  Save,
  Download,
  FileJson,
  CloudUpload,
  CloudDownload,
  Sparkles,
  SlidersHorizontal,
  RotateCcw,
  ChevronDown,
  Search,
  FileText,
  Scan,
  BookText,
  History,
  GitCompareArrows,
} from 'lucide-react';
import BulkActions from '@/components/BulkActions';

interface GridToolbarProps {
  search: string;
  onSearchChange: (v: string) => void;
  searchInputRef: React.RefObject<HTMLInputElement | null>;
  showFilters: boolean;
  onToggleFilters: () => void;
  confidenceFilter: string;
  onConfidenceChange: (v: string) => void;
  compliantFilter: string;
  onCompliantChange: (v: string) => void;
  deliveryFilter: string;
  onDeliveryChange: (v: string) => void;
  statusFilter: string;
  onStatusChange: (v: string) => void;
  onResetFilters: () => void;
  filteredCount: number;
  totalCount: number;
  selectedRows: Set<string>;
  onBulkSetStatus: (status: WorkflowStatus) => void;
  onClearSelection: () => void;
  versionCount: number;
  hasVersions: boolean;
  onSave: () => void;
  onExportCSV: () => void;
  onExportJSON: () => void;
  onPushToCloud: () => void;
  onPullFromCloud: () => void;
  onSaveVersion: () => void;
  onShowVersionCompare: () => void;
  onConsistencyCheck: () => void;
  onShowNarrativeAudit: () => void;
  onShowSummary: () => void;
  needsAttention: number;
}

const GridToolbar = memo(function GridToolbar({
  search,
  onSearchChange,
  searchInputRef,
  showFilters,
  onToggleFilters,
  confidenceFilter,
  onConfidenceChange,
  compliantFilter,
  onCompliantChange,
  deliveryFilter,
  onDeliveryChange,
  statusFilter,
  onStatusChange,
  onResetFilters,
  filteredCount,
  totalCount,
  selectedRows,
  onBulkSetStatus,
  onClearSelection,
  versionCount,
  hasVersions,
  onSave,
  onExportCSV,
  onExportJSON,
  onPushToCloud,
  onPullFromCloud,
  onSaveVersion,
  onShowVersionCompare,
  onConsistencyCheck,
  onShowNarrativeAudit,
  onShowSummary,
  needsAttention,
}: GridToolbarProps) {
  const filterSelects = [
    {
      value: confidenceFilter,
      onChange: onConfidenceChange,
      options: ['All Confidence', 'GREEN', 'YELLOW', 'RED'],
    },
    {
      value: compliantFilter,
      onChange: onCompliantChange,
      options: ['All Compliant', 'Y', 'N', 'Partial'],
    },
    {
      value: deliveryFilter,
      onChange: onDeliveryChange,
      options: ['All Delivery', 'OOB', 'Config', 'Custom'],
    },
  ];

  return (
    <div className="border-b border-gray-200 px-6 py-2 flex-shrink-0 bg-white space-y-1.5">
      <div className="flex items-center gap-2">
        <div className="relative flex-shrink-0">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            ref={searchInputRef}
            data-tour="tour-search-bar"
            type="text"
            placeholder="Search… (⌘K)"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="border border-gray-200 rounded-lg pl-8 pr-3 py-1.5 text-xs w-56 focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-gray-50 placeholder:text-gray-400"
          />
        </div>
        <button
          onClick={onToggleFilters}
          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border ${showFilters ? 'border-blue-300 text-blue-600 bg-blue-50' : 'border-gray-200 text-gray-500'}`}
        >
          <SlidersHorizontal size={12} /> Filters{' '}
          <ChevronDown size={10} className={showFilters ? 'rotate-180' : ''} />
        </button>
        <span className="text-[10px] text-gray-500 bg-gray-100 px-2 py-0.5 rounded font-medium">
          {filteredCount}/{totalCount}
        </span>

        {selectedRows.size > 0 && (
          <BulkActions
            selectedCount={selectedRows.size}
            onChangeStatus={onBulkSetStatus}
            onClearSelection={() => onClearSelection()}
          />
        )}

        <div className="flex-1" />

        <div className="flex items-center gap-1">
          <button
            onClick={onSave}
            className="flex items-center gap-1 bg-blue-600 text-white px-2.5 py-1.5 rounded-lg text-xs font-medium hover:bg-blue-700 shadow-sm"
          >
            <Save size={12} /> Save
          </button>

          <div className="w-px h-6 bg-gray-300 mx-1" />
          <button
            onClick={onExportCSV}
            className="flex items-center gap-1 border border-gray-200 text-gray-600 px-2 py-1.5 rounded-lg text-xs font-medium hover:bg-gray-50"
          >
            <Download size={11} /> CSV
          </button>
          <button
            onClick={onExportJSON}
            className="flex items-center gap-1 border border-gray-200 text-gray-600 px-2 py-1.5 rounded-lg text-xs font-medium hover:bg-gray-50"
          >
            <FileJson size={11} /> JSON
          </button>

          <div className="w-px h-6 bg-gray-300 mx-1" />
          <button
            onClick={onPushToCloud}
            aria-label="Push to Supabase cloud"
            className={`flex items-center gap-1 border px-2 py-1.5 rounded-lg text-xs font-medium transition-colors ${isSupabaseConfigured() ? 'border-gray-200 text-gray-600 hover:bg-gray-50' : 'border-dashed border-gray-200 text-gray-300 cursor-not-allowed'}`}
            title={isSupabaseConfigured() ? 'Push to Supabase' : 'Supabase not configured — add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY'}
          >
            <CloudUpload size={11} /> Push
          </button>
          <button
            onClick={onPullFromCloud}
            aria-label="Pull from Supabase cloud"
            className={`flex items-center gap-1 border px-2 py-1.5 rounded-lg text-xs font-medium transition-colors ${isSupabaseConfigured() ? 'border-gray-200 text-gray-600 hover:bg-gray-50' : 'border-dashed border-gray-200 text-gray-300 cursor-not-allowed'}`}
            title={isSupabaseConfigured() ? 'Pull from Supabase' : 'Supabase not configured — add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY'}
          >
            <CloudDownload size={11} /> Pull
          </button>
          <button
            onClick={onSaveVersion}
            className="flex items-center gap-1 border border-gray-200 text-gray-600 px-2 py-1.5 rounded-lg text-xs font-medium hover:bg-gray-50"
          >
            <History size={11} /> v{versionCount + 1}
          </button>
          {hasVersions && (
            <button
              onClick={onShowVersionCompare}
              aria-label="Compare versions"
              className="flex items-center border border-gray-200 text-gray-600 p-1.5 rounded-lg text-xs hover:bg-gray-50"
              title="Compare versions"
            >
              <GitCompareArrows size={11} />
            </button>
          )}

          <div className="w-px h-6 bg-gray-300 mx-1" />
          <button
            onClick={onConsistencyCheck}
            className="flex items-center gap-1 border border-gray-200 text-gray-600 px-2 py-1.5 rounded-lg text-xs font-medium hover:bg-gray-50"
            title="Consistency Check"
          >
            <Scan size={11} /> Check
          </button>
          <button
            onClick={onShowNarrativeAudit}
            className="flex items-center gap-1 border border-gray-200 text-gray-600 px-2 py-1.5 rounded-lg text-xs font-medium hover:bg-gray-50"
            title="Narrative Audit"
          >
            <BookText size={11} /> Audit
          </button>
          <button
            onClick={onShowSummary}
            className="flex items-center gap-1 border border-gray-200 text-gray-600 px-2 py-1.5 rounded-lg text-xs font-medium hover:bg-gray-50"
          >
            <FileText size={11} /> Summary
          </button>
          <button className="flex items-center gap-1 bg-gradient-to-r from-violet-600 to-purple-600 text-white px-2.5 py-1.5 rounded-lg text-xs font-medium hover:from-violet-700 hover:to-purple-700 shadow-sm">
            <Sparkles size={11} /> AI Rewrite{' '}
            <span className="bg-white/20 px-1 rounded text-[9px]">{needsAttention}</span>
          </button>
        </div>
      </div>

      {showFilters && (
        <div className="flex items-center gap-1.5 pt-0.5">
          <span className="text-[9px] text-gray-400 uppercase tracking-wider font-semibold mr-1">
            Filter
          </span>
          {filterSelects.map((f, i) => (
            <div key={i} className="relative">
              <select
                value={f.value}
                onChange={(e) => f.onChange(e.target.value)}
                className="border border-gray-200 rounded-lg pl-2.5 pr-7 py-1 text-xs text-gray-600 bg-white appearance-none cursor-pointer hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
              >
                {f.options.map((o) => (
                  <option key={o}>{o}</option>
                ))}
              </select>
              <ChevronDown size={11} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          ))}
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => onStatusChange(e.target.value)}
              className="border border-gray-200 rounded-lg pl-2.5 pr-7 py-1 text-xs text-gray-600 bg-white appearance-none cursor-pointer hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
            >
              <option>All Status</option>
              <option value="draft">Draft</option>
              <option value="reviewed">Reviewed</option>
              <option value="approved">Approved</option>
              <option value="flagged">Flagged</option>
            </select>
            <ChevronDown size={11} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
          <button
            data-reset-filters
            onClick={onResetFilters}
            className="flex items-center gap-0.5 text-xs text-gray-400 hover:text-blue-500 font-medium ml-1"
          >
            <RotateCcw size={10} /> Reset
          </button>
        </div>
      )}
    </div>
  );
});

export default GridToolbar;
