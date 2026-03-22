"use client";

import { useState, useEffect } from "react";
import { X, Save, Download, FileStack, Trash2 } from "lucide-react";
import { isSupabaseConfigured } from "@/lib/supabase";
import { saveAsTemplate, listTemplates, loadTemplate } from "@/lib/supabaseSync";
import type { RFPData } from "@/types";

interface TemplateManagerProps {
  currentData: RFPData;
  onLoadTemplate: (data: RFPData) => void;
  onClose: () => void;
  addToast: (type: "success" | "error" | "info", message: string) => void;
}

interface TemplateEntry {
  id: string;
  name: string;
  description: string;
  created_at: string;
}

export default function TemplateManager({ currentData, onLoadTemplate, onClose, addToast }: TemplateManagerProps) {
  const [templates, setTemplates] = useState<TemplateEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [saveName, setSaveName] = useState("");
  const [saveDesc, setSaveDesc] = useState("");
  const [saving, setSaving] = useState(false);
  const configured = isSupabaseConfigured();

  useEffect(() => {
    if (configured) {
      setLoading(true);
      listTemplates().then(setTemplates).finally(() => setLoading(false));
    }
  }, [configured]);

  const handleSave = async () => {
    if (!saveName.trim()) return;
    setSaving(true);
    const result = await saveAsTemplate(saveName.trim(), saveDesc.trim(), currentData);
    if (result.success) {
      addToast("success", "Template saved");
      setSaveName(""); setSaveDesc("");
      const updated = await listTemplates();
      setTemplates(updated);
    } else {
      addToast("error", result.message);
    }
    setSaving(false);
  };

  const handleLoad = async (id: string) => {
    const data = await loadTemplate(id);
    if (data) {
      onLoadTemplate(data);
      addToast("success", "Template loaded");
      onClose();
    } else {
      addToast("error", "Failed to load template");
    }
  };

  // Local template support (for when Supabase isn't configured)
  const [localTemplates, setLocalTemplates] = useState<{ name: string; description: string; timestamp: number }[]>([]);

  useEffect(() => {
    if (!configured) {
      try {
        const saved = localStorage.getItem("rfp-templates-index");
        if (saved) setLocalTemplates(JSON.parse(saved));
      } catch { /* */ }
    }
  }, [configured]);

  const handleSaveLocal = () => {
    if (!saveName.trim()) return;
    const key = `rfp-template-${Date.now()}`;
    localStorage.setItem(key, JSON.stringify(currentData));
    const entry = { name: saveName.trim(), description: saveDesc.trim(), timestamp: Date.now() };
    const updated = [...localTemplates, entry];
    setLocalTemplates(updated);
    localStorage.setItem("rfp-templates-index", JSON.stringify(updated));
    setSaveName(""); setSaveDesc("");
    addToast("success", "Template saved locally");
  };

  const handleLoadLocal = (timestamp: number) => {
    try {
      // Find the key by looking through localStorage
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith("rfp-template-")) {
          const data = JSON.parse(localStorage.getItem(key)!);
          if (data) {
            onLoadTemplate(data);
            addToast("success", "Template loaded");
            onClose();
            return;
          }
        }
      }
    } catch { addToast("error", "Failed to load"); }
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-8">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b dark:border-gray-700">
          <div className="flex items-center gap-2">
            <FileStack size={18} className="text-indigo-600" />
            <h2 className="text-base font-semibold">RFP Templates</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100">
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-auto p-6 space-y-6">
          {/* Save as template */}
          <div>
            <h3 className="text-sm font-semibold mb-3">Save Current as Template</h3>
            <input value={saveName} onChange={e => setSaveName(e.target.value)} placeholder="Template name (e.g. 'BSB Card Program v1')"
              className="w-full border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 text-sm mb-2" />
            <input value={saveDesc} onChange={e => setSaveDesc(e.target.value)} placeholder="Description (optional)"
              className="w-full border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 text-sm mb-2" />
            <button onClick={configured ? handleSave : handleSaveLocal} disabled={!saveName.trim() || saving}
              className="flex items-center justify-center gap-1.5 w-full bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-40">
              <Save size={14} /> {saving ? "Saving..." : `Save Template${configured ? "" : " (Local)"}`}
            </button>
          </div>

          {/* Load template */}
          <div>
            <h3 className="text-sm font-semibold mb-3">Load Template</h3>
            {!configured && (
              <p className="text-xs text-amber-600 bg-amber-50 dark:bg-amber-900/10 rounded-lg px-3 py-2 mb-3">
                Supabase not configured. Templates saved locally only.
              </p>
            )}

            {configured && loading && <p className="text-sm text-gray-400">Loading...</p>}

            {configured && templates.length === 0 && !loading && (
              <p className="text-sm text-gray-400 text-center py-6">No templates saved yet</p>
            )}

            {configured && templates.map(t => (
              <div key={t.id} className="flex items-center justify-between border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-3 mb-2 hover:bg-gray-50 dark:hover:bg-gray-800">
                <div>
                  <div className="text-sm font-medium">{t.name}</div>
                  {t.description && <div className="text-xs text-gray-400">{t.description}</div>}
                  <div className="text-[10px] text-gray-400">{new Date(t.created_at).toLocaleDateString()}</div>
                </div>
                <button onClick={() => handleLoad(t.id)}
                  className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium">
                  <Download size={12} /> Load
                </button>
              </div>
            ))}

            {!configured && localTemplates.map((t, i) => (
              <div key={i} className="flex items-center justify-between border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-3 mb-2 hover:bg-gray-50 dark:hover:bg-gray-800">
                <div>
                  <div className="text-sm font-medium">{t.name}</div>
                  {t.description && <div className="text-xs text-gray-400">{t.description}</div>}
                  <div className="text-[10px] text-gray-400">{new Date(t.timestamp).toLocaleDateString()}</div>
                </div>
                <button onClick={() => handleLoadLocal(t.timestamp)}
                  className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium">
                  <Download size={12} /> Load
                </button>
              </div>
            ))}

            {!configured && localTemplates.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-6">No local templates saved yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
