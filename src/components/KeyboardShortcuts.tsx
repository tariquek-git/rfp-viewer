"use client";

import { useEffect, useState } from "react";
import { X, Keyboard } from "lucide-react";

const SHORTCUTS = [
  { keys: ["⌘", "S"], description: "Save changes" },
  { keys: ["?"], description: "Toggle this shortcuts panel" },
  { keys: ["D"], description: "Toggle dark mode" },
  { keys: ["Esc"], description: "Close panel / modal" },
  { keys: ["↑", "↓"], description: "Navigate between rows (when grid focused)" },
  { keys: ["Enter"], description: "Open detail panel for focused row" },
  { keys: ["1"], description: "Switch to Grid view" },
  { keys: ["2"], description: "Switch to Dashboard view" },
  { keys: ["3"], description: "Switch to Knowledge Base" },
  { keys: ["4"], description: "Switch to Compliance view" },
  { keys: ["5"], description: "Switch to Submission view" },
];

export function useKeyboardShortcuts(handlers: {
  onToggleDarkMode?: () => void;
  onSwitchTab?: (tab: string) => void;
}) {
  const [showShortcuts, setShowShortcuts] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.tagName === "SELECT") return;

      if (e.key === "?") { e.preventDefault(); setShowShortcuts(prev => !prev); }
      if (e.key === "d" && !e.metaKey && !e.ctrlKey) { handlers.onToggleDarkMode?.(); }
      if (e.key === "Escape") setShowShortcuts(false);

      // Number keys for tab switching
      const tabMap: Record<string, string> = { "1": "grid", "2": "context", "3": "knowledgebase", "4": "compliance", "5": "submission" };
      if (tabMap[e.key] && !e.metaKey && !e.ctrlKey) { handlers.onSwitchTab?.(tabMap[e.key]); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handlers]);

  return { showShortcuts, setShowShortcuts };
}

export default function KeyboardShortcutsPanel({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-8" onClick={onClose}>
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b dark:border-gray-700">
          <div className="flex items-center gap-2">
            <Keyboard size={18} className="text-gray-500" />
            <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">Keyboard Shortcuts</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800">
            <X size={16} />
          </button>
        </div>
        <div className="p-4 space-y-1">
          {SHORTCUTS.map((s, i) => (
            <div key={i} className="flex items-center justify-between py-2 px-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">
              <span className="text-sm text-gray-700 dark:text-gray-300">{s.description}</span>
              <div className="flex items-center gap-1">
                {s.keys.map((k, j) => (
                  <kbd key={j} className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-[11px] font-mono border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 min-w-[24px] text-center">
                    {k}
                  </kbd>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="px-6 py-3 border-t dark:border-gray-700 text-center">
          <span className="text-[10px] text-gray-400">Press <kbd className="px-1 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-[10px] font-mono border border-gray-200 dark:border-gray-600">?</kbd> to toggle</span>
        </div>
      </div>
    </div>
  );
}
