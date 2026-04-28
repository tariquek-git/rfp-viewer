'use client';

import { useState, useRef, useCallback } from 'react';
import { Upload, FileText, X, Trash2, AlertCircle, Loader2, Check } from 'lucide-react';
import type { ExtractedQuestion, IntakeResult, RFPData, Question, DealContext } from '@/types';

interface IntakeViewProps {
  currentQuestionCount: number;
  dealContext: DealContext;
  onImport: (data: RFPData) => void;
  onUpdateDealContext: (ctx: DealContext) => void;
  addToast: (kind: 'info' | 'success' | 'error', msg: string) => void;
  onSwitchToGrid: () => void;
}

function emptyQuestion(ref: string, category: string, number: number): Question {
  return {
    ref,
    category,
    number,
    topic: '',
    requirement: '',
    a_oob: false,
    b_config: false,
    c_custom: false,
    d_dnm: false,
    compliant: 'Y',
    bullet: '',
    paragraph: '',
    confidence: 'YELLOW',
    rationale: '',
    notes: '',
    pricing: '',
    capability: '',
    availability: '',
    strategic: false,
    reg_enable: false,
    committee_review: '',
    committee_risk: '',
    committee_score: 5,
    status: 'draft',
  };
}

function buildRFPData(extracted: ExtractedQuestion[]): RFPData {
  const questions: Question[] = extracted.map((eq) => {
    const base = emptyQuestion(eq.ref, eq.category, eq.number);
    return { ...base, topic: eq.topic, requirement: eq.requirement };
  });
  const categories = Array.from(new Set(questions.map((q) => q.category)));
  return {
    categories,
    questions,
    stats: {
      total: questions.length,
      green: 0,
      yellow: questions.length,
      red: 0,
      compliant_y: questions.length,
      compliant_n: 0,
      compliant_partial: 0,
      with_strategic: 0,
      with_reg_enable: 0,
    },
  };
}

export default function IntakeView({
  currentQuestionCount,
  dealContext,
  onImport,
  onUpdateDealContext,
  addToast,
  onSwitchToGrid,
}: IntakeViewProps) {
  const [file, setFile] = useState<File | null>(null);
  const [extracting, setExtracting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<IntakeResult | null>(null);
  const [edited, setEdited] = useState<ExtractedQuestion[]>([]);
  const [accountName, setAccountName] = useState('');
  const [updateDealContextName, setUpdateDealContextName] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setFile(null);
    setError(null);
    setResult(null);
    setEdited([]);
    setAccountName('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleFile = (f: File) => {
    setError(null);
    setResult(null);
    setEdited([]);
    setFile(f);
  };

  const onDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }, []);

  const submit = async () => {
    if (!file) return;
    setExtracting(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/intake-rfp', { method: 'POST', body: fd });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || 'Extraction failed');
        addToast('error', json.error || 'Extraction failed');
        return;
      }
      const r = json as IntakeResult;
      setResult(r);
      setEdited(r.questions);
      setAccountName(r.detectedAccountName || dealContext.accountName);
      addToast('success', `Extracted ${r.questions.length} questions from ${r.fileName}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Network error');
      addToast('error', 'Extraction failed — check connection');
    } finally {
      setExtracting(false);
    }
  };

  const updateRow = (i: number, field: keyof ExtractedQuestion, value: string | number) => {
    setEdited((prev) => {
      const next = [...prev];
      next[i] = { ...next[i], [field]: value };
      return next;
    });
  };

  const deleteRow = (i: number) => {
    setEdited((prev) => prev.filter((_, j) => j !== i));
  };

  const importQuestions = () => {
    if (edited.length === 0) {
      addToast('error', 'Nothing to import');
      return;
    }
    if (currentQuestionCount > 0) {
      const ok = window.confirm(
        `This will REPLACE the current ${currentQuestionCount} questions with ${edited.length} from ${result?.fileName}. Save a version snapshot first if you want a rollback. Continue?`,
      );
      if (!ok) return;
    }
    const data = buildRFPData(edited);
    onImport(data);
    if (updateDealContextName && accountName.trim() && accountName !== dealContext.accountName) {
      onUpdateDealContext({ ...dealContext, accountName: accountName.trim() });
    }
    addToast('success', `Imported ${edited.length} questions — opening grid`);
    onSwitchToGrid();
  };

  const categoryCounts = edited.reduce<Record<string, number>>((acc, q) => {
    acc[q.category] = (acc[q.category] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="overflow-auto h-full p-6 bg-gray-50/30">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-emerald-50 rounded-lg">
            <Upload size={20} className="text-emerald-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Intake new RFP</h2>
            <p className="text-xs text-gray-400">
              Upload the bank&apos;s RFP file. Claude extracts the question list — review, edit,
              then import into the workbook.
            </p>
          </div>
        </div>

        {/* Upload area */}
        {!result && (
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={onDrop}
            className="bg-white border-2 border-dashed border-gray-300 rounded-xl p-10 text-center hover:border-blue-400 transition-colors"
          >
            <FileText size={32} className="mx-auto text-gray-300 mb-3" />
            {file ? (
              <div className="space-y-3">
                <p className="text-sm text-gray-700 font-medium">{file.name}</p>
                <p className="text-xs text-gray-400">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                <div className="flex items-center justify-center gap-2">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="text-xs text-gray-600 hover:text-gray-900 font-medium px-3 py-1.5 border border-gray-200 rounded-md"
                    disabled={extracting}
                  >
                    Choose different file
                  </button>
                  <button
                    onClick={submit}
                    disabled={extracting}
                    className="flex items-center gap-1.5 bg-blue-600 text-white px-4 py-1.5 rounded-md text-xs font-medium hover:bg-blue-700 disabled:bg-gray-300"
                  >
                    {extracting ? (
                      <>
                        <Loader2 size={13} className="animate-spin" /> Extracting questions (this
                        can take 30-90s)...
                      </>
                    ) : (
                      <>Extract questions</>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <>
                <p className="text-sm text-gray-600 mb-1">Drag a PDF or Excel file here, or</p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  click to browse
                </button>
                <p className="text-xs text-gray-400 mt-2">PDF or .xlsx, max 25MB</p>
              </>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.xlsx,.xls,application/pdf,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFile(f);
              }}
              className="hidden"
            />
          </div>
        )}

        {error && (
          <div className="mt-4 flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg p-3">
            <AlertCircle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Preview + import */}
        {result && (
          <>
            <div className="mt-4 mb-4 bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Check size={16} className="text-emerald-500" />
                  <span className="text-sm font-medium text-gray-900">
                    Extracted {edited.length} of {result.questions.length} questions
                  </span>
                  <span className="text-xs text-gray-400">from {result.fileName}</span>
                </div>
                <button
                  onClick={reset}
                  className="text-xs text-gray-500 hover:text-gray-900 flex items-center gap-1"
                >
                  <X size={12} /> Discard, start over
                </button>
              </div>

              {result.warnings.length > 0 && (
                <div className="mb-3 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded p-2">
                  {result.warnings.map((w, i) => (
                    <p key={i}>⚠ {w}</p>
                  ))}
                </div>
              )}

              <div className="grid grid-cols-[1fr_auto] gap-3 items-start mb-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Detected account name
                  </label>
                  <input
                    type="text"
                    value={accountName}
                    onChange={(e) => setAccountName(e.target.value)}
                    placeholder="Bank name as it appears in the RFP"
                    className="w-full border border-gray-200 rounded-md px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                  />
                </div>
                <label className="flex items-center gap-1.5 text-xs text-gray-700 mt-6">
                  <input
                    type="checkbox"
                    checked={updateDealContextName}
                    onChange={(e) => setUpdateDealContextName(e.target.checked)}
                  />
                  Update Deal Context account name
                </label>
              </div>

              <div className="flex flex-wrap gap-2 text-[10px] mb-2">
                {Object.entries(categoryCounts).map(([cat, n]) => (
                  <span key={cat} className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full">
                    {cat} <span className="text-gray-400">·</span> {n}
                  </span>
                ))}
              </div>
            </div>

            {/* Editable preview table */}
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
              <div className="max-h-[60vh] overflow-auto">
                <table className="w-full text-xs">
                  <thead className="bg-gray-50 sticky top-0 z-10">
                    <tr className="text-left text-gray-600 font-semibold">
                      <th className="px-3 py-2 w-10">#</th>
                      <th className="px-3 py-2 w-44">Category</th>
                      <th className="px-3 py-2 w-12">No.</th>
                      <th className="px-3 py-2 w-56">Topic</th>
                      <th className="px-3 py-2">Requirement</th>
                      <th className="px-3 py-2 w-8"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {edited.map((q, i) => (
                      <tr
                        key={i}
                        className="border-t border-gray-100 hover:bg-gray-50/50 align-top"
                      >
                        <td className="px-3 py-2 text-gray-400 tabular-nums">{i + 1}</td>
                        <td className="px-3 py-2">
                          <input
                            type="text"
                            value={q.category}
                            onChange={(e) => updateRow(i, 'category', e.target.value)}
                            className="w-full bg-transparent border-0 focus:outline-none focus:bg-white focus:ring-1 focus:ring-blue-400 rounded px-1 py-0.5"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="number"
                            value={q.number}
                            onChange={(e) => updateRow(i, 'number', Number(e.target.value))}
                            className="w-12 bg-transparent border-0 focus:outline-none focus:bg-white focus:ring-1 focus:ring-blue-400 rounded px-1 py-0.5 tabular-nums"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="text"
                            value={q.topic}
                            onChange={(e) => updateRow(i, 'topic', e.target.value)}
                            className="w-full bg-transparent border-0 focus:outline-none focus:bg-white focus:ring-1 focus:ring-blue-400 rounded px-1 py-0.5"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <textarea
                            value={q.requirement}
                            onChange={(e) => updateRow(i, 'requirement', e.target.value)}
                            rows={2}
                            className="w-full bg-transparent border-0 focus:outline-none focus:bg-white focus:ring-1 focus:ring-blue-400 rounded px-1 py-0.5 resize-y text-gray-700"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <button
                            onClick={() => deleteRow(i)}
                            className="text-gray-300 hover:text-red-500"
                            title="Remove row"
                          >
                            <Trash2 size={13} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Import action */}
            <div className="mt-4 flex items-center justify-end gap-3">
              {currentQuestionCount > 0 && (
                <span className="text-xs text-amber-600">
                  ⚠ This replaces the current {currentQuestionCount} questions in the workbook
                </span>
              )}
              <button
                onClick={importQuestions}
                disabled={edited.length === 0}
                className="bg-emerald-600 text-white px-4 py-1.5 rounded-md text-sm font-medium hover:bg-emerald-700 disabled:bg-gray-300"
              >
                Import {edited.length} questions
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
