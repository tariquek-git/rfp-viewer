"use client";

import { X, ChevronDown } from "lucide-react";
import { useState } from "react";
import type { WorkflowStatus } from "@/types";

interface BulkActionsProps {
  selectedCount: number;
  onChangeStatus: (status: WorkflowStatus) => void;
  onClearSelection: () => void;
}

export default function BulkActions({ selectedCount, onChangeStatus, onClearSelection }: BulkActionsProps) {
  const [showStatusMenu, setShowStatusMenu] = useState(false);

  if (selectedCount === 0) return null;

  const statuses: { value: WorkflowStatus; label: string; cls: string }[] = [
    { value: "draft", label: "Draft", cls: "text-gray-600" },
    { value: "reviewed", label: "Reviewed", cls: "text-blue-600" },
    { value: "approved", label: "Approved", cls: "text-emerald-600" },
    { value: "flagged", label: "Flagged", cls: "text-red-600" },
  ];

  return (
    <div className="bg-blue-600 text-white px-4 py-2 flex items-center gap-3 text-xs font-medium rounded-lg shadow-lg">
      <span>{selectedCount} selected</span>
      <div className="w-px h-4 bg-blue-400" />

      {/* Status dropdown */}
      <div className="relative">
        <button onClick={() => setShowStatusMenu(!showStatusMenu)} className="flex items-center gap-1 bg-blue-500 hover:bg-blue-400 px-2.5 py-1 rounded">
          Set Status <ChevronDown size={12} />
        </button>
        {showStatusMenu && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setShowStatusMenu(false)} />
            <div className="absolute left-0 top-full mt-1 bg-white border rounded-lg shadow-xl z-50 w-36 py-1">
              {statuses.map((s) => (
                <button key={s.value} onClick={() => { onChangeStatus(s.value); setShowStatusMenu(false); }}
                  className={`w-full text-left px-3 py-1.5 text-xs hover:bg-gray-50 ${s.cls}`}>
                  {s.label}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      <button onClick={onClearSelection} className="flex items-center gap-1 hover:bg-blue-500 px-2 py-1 rounded">
        <X size={12} /> Clear
      </button>
    </div>
  );
}
