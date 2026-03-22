"use client";

import { useState, useMemo } from "react";
import { Plus, Trash2, Target, X } from "lucide-react";
import type { WinTheme, Question } from "@/types";

interface WinThemesProps {
  themes: WinTheme[];
  onUpdate: (themes: WinTheme[]) => void;
  questions: Question[];
  onClose: () => void;
}

export default function WinThemesPanel({ themes, onUpdate, questions, onClose }: WinThemesProps) {
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");

  const addTheme = () => {
    if (!newTitle.trim()) return;
    onUpdate([...themes, { id: Date.now().toString(), title: newTitle.trim(), description: newDesc.trim(), questionRefs: [] }]);
    setNewTitle(""); setNewDesc("");
  };

  const removeTheme = (id: string) => onUpdate(themes.filter(t => t.id !== id));

  // Check which questions mention theme keywords
  const themeCoverage = useMemo(() => {
    return themes.map(theme => {
      const keywords = theme.title.toLowerCase().split(/\s+/).filter(w => w.length > 3);
      const covered = questions.filter(q => {
        const text = `${q.bullet} ${q.paragraph}`.toLowerCase();
        return keywords.some(kw => text.includes(kw));
      });
      const uncovered = questions.filter(q => {
        const text = `${q.bullet} ${q.paragraph}`.toLowerCase();
        return !keywords.some(kw => text.includes(kw));
      });
      return { theme, covered: covered.length, total: questions.length, pct: Math.round((covered.length / questions.length) * 100), uncoveredCount: uncovered.length };
    });
  }, [themes, questions]);

  const questionsWithNoTheme = useMemo(() => {
    if (themes.length === 0) return [];
    return questions.filter(q => {
      const text = `${q.bullet} ${q.paragraph}`.toLowerCase();
      return !themes.some(theme => {
        const keywords = theme.title.toLowerCase().split(/\s+/).filter(w => w.length > 3);
        return keywords.some(kw => text.includes(kw));
      });
    });
  }, [themes, questions]);

  return (
    <>
      <div className="absolute inset-0 bg-black/20 z-20" onClick={onClose} />
      <div className="absolute right-0 top-0 bottom-0 w-[480px] bg-white dark:bg-gray-900 border-l shadow-2xl z-30 flex flex-col panel-slide-in">
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <div className="flex items-center gap-2">
            <Target size={18} className="text-violet-600" />
            <div>
              <h2 className="text-base font-semibold">Win Themes</h2>
              <p className="text-xs text-gray-400">Track narrative consistency across all responses</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100">
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-auto p-5 space-y-4">
          {/* Theme cards with coverage */}
          {themeCoverage.map(({ theme, covered, total, pct }) => (
            <div key={theme.id} className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 group">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="font-semibold text-sm">{theme.title}</h3>
                  {theme.description && <p className="text-xs text-gray-400 mt-0.5">{theme.description}</p>}
                </div>
                <button onClick={() => removeTheme(theme.id)} className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100">
                  <Trash2 size={13} />
                </button>
              </div>
              <div className="flex items-center gap-2 mt-3">
                <div className="flex-1 h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${pct > 60 ? "bg-emerald-500" : pct > 30 ? "bg-amber-500" : "bg-red-500"}`}
                    style={{ width: `${pct}%` }} />
                </div>
                <span className="text-[10px] font-medium text-gray-500">{covered}/{total} ({pct}%)</span>
              </div>
            </div>
          ))}

          {/* Questions with no theme coverage */}
          {themes.length > 0 && questionsWithNoTheme.length > 0 && (
            <div className="border-2 border-dashed border-amber-200 dark:border-amber-800 rounded-xl p-4 bg-amber-50/50 dark:bg-amber-900/10">
              <h4 className="text-xs font-semibold text-amber-700 dark:text-amber-400 mb-2">
                {questionsWithNoTheme.length} questions don&#39;t reference any win theme
              </h4>
              <div className="flex flex-wrap gap-1 max-h-20 overflow-auto">
                {questionsWithNoTheme.slice(0, 20).map(q => (
                  <span key={q.ref} className="text-[10px] bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-1.5 py-0.5 rounded">
                    {q.ref}
                  </span>
                ))}
                {questionsWithNoTheme.length > 20 && (
                  <span className="text-[10px] text-amber-600">+{questionsWithNoTheme.length - 20} more</span>
                )}
              </div>
            </div>
          )}

          {/* Add theme */}
          <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-4">
            <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Add Win Theme</h4>
            <input value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder='e.g. "Mobile-first platform"'
              className="w-full border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
            <textarea value={newDesc} onChange={e => setNewDesc(e.target.value)} placeholder="Brief description of this theme..."
              rows={2} className="w-full border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none" />
            <button onClick={addTheme} disabled={!newTitle.trim()}
              className="flex items-center justify-center gap-1.5 w-full bg-violet-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-violet-700 disabled:opacity-40">
              <Plus size={14} /> Add Theme
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
