'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import {
  Users,
  UserCheck,
  Flag,
  CheckCircle,
  Clock,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  X,
  Plus,
  Copy,
  Check,
} from 'lucide-react';
import type { Question, RFPData, TeamMember, SectionAssignment, QuestionAssignment } from '@/types';
import { STORAGE_KEYS } from '@/lib/storageKeys';

// ── Default team ──────────────────────────────────────────────────────────────
const DEFAULT_TEAM: TeamMember[] = [
  { id: 'tarique', name: 'Tarique', initials: 'TK', department: 'BD', color: 'bg-blue-500' },
  { id: 'rasha', name: 'Rasha', initials: 'RA', department: 'Compliance/Legal', color: 'bg-purple-500' },
  { id: 'alex', name: 'Alex', initials: 'AL', department: 'Engineering', color: 'bg-green-500' },
  { id: 'sarah', name: 'Sarah', initials: 'SH', department: 'Product', color: 'bg-orange-500' },
  { id: 'maria', name: 'Maria', initials: 'MR', department: 'Product', color: 'bg-pink-500' },
  { id: 'james', name: 'James', initials: 'JW', department: 'Finance', color: 'bg-yellow-500' },
];

const DEPARTMENTS = ['BD', 'Compliance/Legal', 'Engineering', 'Finance', 'Operations', 'Product'];

const STATUS_LABELS: Record<SectionAssignment['status'], string> = {
  'not-started': 'Not Started',
  'in-progress': 'In Progress',
  'needs-review': 'Needs Review',
  'approved': 'Approved',
};

const STATUS_CLASSES: Record<SectionAssignment['status'], string> = {
  'not-started': 'bg-zinc-700 text-zinc-300',
  'in-progress': 'bg-blue-900/60 text-blue-300',
  'needs-review': 'bg-yellow-900/60 text-yellow-300',
  'approved': 'bg-green-900/60 text-green-300',
};

const KANBAN_COLS: { key: QuestionStatus; label: string; color: string }[] = [
  { key: 'not-assigned', label: 'Not Assigned', color: 'border-zinc-600' },
  { key: 'in-progress', label: 'In Progress', color: 'border-blue-600' },
  { key: 'needs-review', label: 'Needs Review', color: 'border-yellow-600' },
  { key: 'approved', label: 'Approved', color: 'border-green-600' },
];

type QuestionStatus = 'not-assigned' | 'in-progress' | 'needs-review' | 'approved';

// ── Small helpers ─────────────────────────────────────────────────────────────
function Avatar({ member, size = 'sm' }: { member: TeamMember; size?: 'sm' | 'md' }) {
  const sz = size === 'sm' ? 'w-6 h-6 text-[9px]' : 'w-8 h-8 text-xs';
  return (
    <span className={`${sz} ${member.color} rounded-full flex items-center justify-center text-white font-bold flex-shrink-0`}>
      {member.initials}
    </span>
  );
}

function ConfidenceBadge({ confidence }: { confidence: Question['confidence'] }) {
  const cls =
    confidence === 'GREEN'
      ? 'bg-emerald-900/50 text-emerald-400'
      : confidence === 'YELLOW'
        ? 'bg-yellow-900/50 text-yellow-400'
        : 'bg-red-900/50 text-red-400';
  return (
    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${cls}`}>{confidence}</span>
  );
}

function SectionProgress({ approved, total }: { approved: number; total: number }) {
  const pct = total === 0 ? 0 : Math.round((approved / total) * 100);
  return (
    <div className="flex items-center gap-2 min-w-[80px]">
      <div className="flex-1 h-1.5 bg-zinc-700 rounded-full overflow-hidden">
        <div
          className="h-full bg-green-500 rounded-full transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-[10px] text-zinc-400 tabular-nums w-8 text-right">{pct}%</span>
    </div>
  );
}

// ── Storage helpers ────────────────────────────────────────────────────────────
function loadStorage<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function saveStorage<T>(key: string, value: T) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {/* quota */}
}

// ── Main Component ─────────────────────────────────────────────────────────────
interface AssignmentsViewProps {
  data: RFPData;
}

type SubView = 'sections' | 'board' | 'report';

export default function AssignmentsView({ data }: AssignmentsViewProps) {
  const [subView, setSubView] = useState<SubView>('sections');
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>(() =>
    loadStorage(STORAGE_KEYS.TEAM_MEMBERS, DEFAULT_TEAM),
  );
  const [sectionAssignments, setSectionAssignments] = useState<Record<string, SectionAssignment>>(
    () => loadStorage(STORAGE_KEYS.SECTION_ASSIGNMENTS, {}),
  );
  const [questionAssignments, setQuestionAssignments] = useState<Record<string, QuestionAssignment>>(
    () => loadStorage(STORAGE_KEYS.QUESTION_ASSIGNMENTS, {}),
  );
  const [rosterOpen, setRosterOpen] = useState(false);

  // Persist on change
  useEffect(() => { saveStorage(STORAGE_KEYS.TEAM_MEMBERS, teamMembers); }, [teamMembers]);
  useEffect(() => { saveStorage(STORAGE_KEYS.SECTION_ASSIGNMENTS, sectionAssignments); }, [sectionAssignments]);
  useEffect(() => { saveStorage(STORAGE_KEYS.QUESTION_ASSIGNMENTS, questionAssignments); }, [questionAssignments]);

  const memberMap = useMemo(() => {
    const m: Record<string, TeamMember> = {};
    teamMembers.forEach((t) => (m[t.id] = t));
    return m;
  }, [teamMembers]);

  const categorySummaries = useMemo(() => {
    return data.categories.map((cat) => {
      const qs = data.questions.filter((q) => q.category === cat);
      const green = qs.filter((q) => q.confidence === 'GREEN').length;
      const yellow = qs.filter((q) => q.confidence === 'YELLOW').length;
      const red = qs.filter((q) => q.confidence === 'RED').length;
      const approvedQs = qs.filter(
        (q) => (questionAssignments[q.ref]?.assignedTo && getQStatus(questionAssignments[q.ref]) === 'approved'),
      ).length;
      return { cat, total: qs.length, green, yellow, red, approvedQs };
    });
  }, [data, questionAssignments]);

  function getQStatus(qa: QuestionAssignment | undefined): QuestionStatus {
    if (!qa || !qa.assignedTo) return 'not-assigned';
    // Infer status from section assignment if question has an assignee but we need board column
    // We store an explicit status in the QuestionAssignment — but spec doesn't include it,
    // so we use a convention: store status in a parallel map keyed by ref
    // We'll piggyback on questionAssignments with an extra field stored via type assertion
    const extended = qa as QuestionAssignment & { boardStatus?: QuestionStatus };
    return extended.boardStatus ?? 'in-progress';
  }

  function setQStatus(ref: string, status: QuestionStatus) {
    setQuestionAssignments((prev) => {
      const existing = prev[ref] || { ref, assignedTo: '' };
      return {
        ...prev,
        [ref]: {
          ...existing,
          boardStatus: status,
        } as QuestionAssignment & { boardStatus: QuestionStatus },
      };
    });
  }

  function updateSectionAssignment(cat: string, patch: Partial<SectionAssignment>) {
    setSectionAssignments((prev) => {
      const existing = prev[cat];
      const defaults: SectionAssignment = {
        category: cat,
        ownerId: '',
        department: '',
        status: 'not-started',
      };
      return {
        ...prev,
        [cat]: { ...defaults, ...existing, ...patch },
      };
    });
  }

  function updateQuestionAssignee(ref: string, memberId: string) {
    setQuestionAssignments((prev) => {
      const existing = prev[ref] || { ref, assignedTo: '' };
      const newStatus: QuestionStatus = memberId ? 'in-progress' : 'not-assigned';
      return {
        ...prev,
        [ref]: {
          ...existing,
          assignedTo: memberId,
          boardStatus: memberId ? ((existing as QuestionAssignment & { boardStatus?: QuestionStatus }).boardStatus ?? newStatus) : 'not-assigned',
        } as QuestionAssignment & { boardStatus: QuestionStatus },
      };
    });
  }

  // Section assignment summary counts
  const sectionSummary = useMemo(() => {
    const total = data.categories.length;
    const approved = data.categories.filter(
      (c) => sectionAssignments[c]?.status === 'approved',
    ).length;
    const inProgress = data.categories.filter(
      (c) => sectionAssignments[c]?.status === 'in-progress' || sectionAssignments[c]?.status === 'needs-review',
    ).length;
    const notAssigned = data.categories.filter(
      (c) => !sectionAssignments[c]?.ownerId,
    ).length;
    return { total, approved, inProgress, notAssigned };
  }, [data.categories, sectionAssignments]);

  return (
    <div className="flex flex-col h-full bg-zinc-950 text-zinc-100">
      {/* Sub-nav */}
      <div className="flex items-center gap-1 px-6 py-3 border-b border-zinc-800 flex-shrink-0">
        <div className="flex items-center bg-zinc-800 rounded-lg p-0.5 gap-0.5">
          {([
            { key: 'sections', icon: UserCheck, label: 'Section Ownership' },
            { key: 'board', icon: Flag, label: 'Question Board' },
            { key: 'report', icon: CheckCircle, label: 'Progress Report' },
          ] as { key: SubView; icon: React.ElementType; label: string }[]).map(({ key, icon: Icon, label }) => (
            <button
              key={key}
              onClick={() => setSubView(key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                subView === key
                  ? 'bg-zinc-700 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Icon size={12} />
              {label}
            </button>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-3 text-xs text-zinc-500">
          <span><span className="text-zinc-300 font-semibold">{sectionSummary.total}</span> sections</span>
          <span className="text-green-400"><span className="font-semibold">{sectionSummary.approved}</span> approved</span>
          <span className="text-blue-400"><span className="font-semibold">{sectionSummary.inProgress}</span> in progress</span>
          <span className="text-zinc-400"><span className="font-semibold">{sectionSummary.notAssigned}</span> unassigned</span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {subView === 'sections' && (
          <SectionOwnershipView
            categorySummaries={categorySummaries}
            sectionAssignments={sectionAssignments}
            teamMembers={teamMembers}
            memberMap={memberMap}
            onUpdate={updateSectionAssignment}
            rosterOpen={rosterOpen}
            setRosterOpen={setRosterOpen}
            onUpdateTeam={setTeamMembers}
          />
        )}
        {subView === 'board' && (
          <QuestionBoardView
            questions={data.questions}
            categories={data.categories}
            questionAssignments={questionAssignments}
            teamMembers={teamMembers}
            memberMap={memberMap}
            onSetStatus={setQStatus}
            onAssign={updateQuestionAssignee}
          />
        )}
        {subView === 'report' && (
          <ProgressReportView
            data={data}
            categorySummaries={categorySummaries}
            sectionAssignments={sectionAssignments}
            questionAssignments={questionAssignments}
            memberMap={memberMap}
          />
        )}
      </div>
    </div>
  );
}

// ── Sub-view A: Section Ownership ─────────────────────────────────────────────
interface SectionOwnershipProps {
  categorySummaries: { cat: string; total: number; green: number; yellow: number; red: number; approvedQs: number }[];
  sectionAssignments: Record<string, SectionAssignment>;
  teamMembers: TeamMember[];
  memberMap: Record<string, TeamMember>;
  onUpdate: (cat: string, patch: Partial<SectionAssignment>) => void;
  rosterOpen: boolean;
  setRosterOpen: (v: boolean) => void;
  onUpdateTeam: (members: TeamMember[]) => void;
}

function SectionOwnershipView({
  categorySummaries,
  sectionAssignments,
  teamMembers,
  memberMap,
  onUpdate,
  rosterOpen,
  setRosterOpen,
  onUpdateTeam,
}: SectionOwnershipProps) {
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [newMember, setNewMember] = useState<Partial<TeamMember>>({});
  const [showAddForm, setShowAddForm] = useState(false);

  const COLORS = [
    'bg-blue-500', 'bg-purple-500', 'bg-green-500', 'bg-orange-500',
    'bg-pink-500', 'bg-yellow-500', 'bg-red-500', 'bg-teal-500',
  ];

  function saveMember() {
    if (!newMember.name) return;
    const member: TeamMember = {
      id: newMember.id || newMember.name.toLowerCase().replace(/\s+/g, '-'),
      name: newMember.name,
      initials: newMember.initials || newMember.name.slice(0, 2).toUpperCase(),
      department: newMember.department || 'BD',
      color: newMember.color || 'bg-blue-500',
    };
    if (editingMember) {
      onUpdateTeam(teamMembers.map((m) => (m.id === editingMember.id ? member : m)));
    } else {
      onUpdateTeam([...teamMembers, member]);
    }
    setNewMember({});
    setEditingMember(null);
    setShowAddForm(false);
  }

  return (
    <div className="overflow-auto h-full p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Table */}
        <div className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden">
          <div className="grid grid-cols-[2fr_1.5fr_1fr_1.2fr_1fr_1.5fr_80px] text-[10px] font-semibold text-zinc-500 uppercase tracking-wider px-4 py-2.5 border-b border-zinc-800 bg-zinc-800/40">
            <span>Section</span>
            <span>Owner</span>
            <span>Department</span>
            <span>Status</span>
            <span>Due Date</span>
            <span>Notes</span>
            <span>Progress</span>
          </div>

          {categorySummaries.map(({ cat, total, green, yellow, red, approvedQs }) => {
            const sa = sectionAssignments[cat];
            const owner = sa?.ownerId ? memberMap[sa.ownerId] : null;

            return (
              <div
                key={cat}
                className="grid grid-cols-[2fr_1.5fr_1fr_1.2fr_1fr_1.5fr_80px] items-center px-4 py-2.5 border-b border-zinc-800/60 hover:bg-zinc-800/30 transition-colors gap-2"
              >
                {/* Category */}
                <div>
                  <div className="text-sm font-medium text-zinc-100 truncate">{cat}</div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[10px] text-zinc-500">{total} Qs</span>
                    <span className="text-[10px] text-emerald-500">{green}G</span>
                    <span className="text-[10px] text-yellow-500">{yellow}Y</span>
                    {red > 0 && <span className="text-[10px] text-red-500 font-semibold">{red}R</span>}
                  </div>
                </div>

                {/* Owner */}
                <div>
                  <select
                    value={sa?.ownerId || ''}
                    onChange={(e) => onUpdate(cat, { ownerId: e.target.value })}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-md text-xs text-zinc-200 px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="">Unassigned</option>
                    {teamMembers.map((m) => (
                      <option key={m.id} value={m.id}>{m.initials} — {m.name}</option>
                    ))}
                  </select>
                  {owner && (
                    <div className="flex items-center gap-1 mt-1">
                      <Avatar member={owner} size="sm" />
                      <span className="text-[10px] text-zinc-400">{owner.name}</span>
                    </div>
                  )}
                </div>

                {/* Department */}
                <select
                  value={sa?.department || ''}
                  onChange={(e) => onUpdate(cat, { department: e.target.value })}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-md text-xs text-zinc-200 px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">—</option>
                  {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>

                {/* Status */}
                <select
                  value={sa?.status || 'not-started'}
                  onChange={(e) => onUpdate(cat, { status: e.target.value as SectionAssignment['status'] })}
                  className={`w-full border rounded-md text-xs px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                    STATUS_CLASSES[sa?.status || 'not-started']
                  } bg-zinc-800 border-zinc-700`}
                >
                  {(Object.keys(STATUS_LABELS) as SectionAssignment['status'][]).map((s) => (
                    <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                  ))}
                </select>

                {/* Due Date */}
                <input
                  type="date"
                  value={sa?.dueDate || ''}
                  onChange={(e) => onUpdate(cat, { dueDate: e.target.value })}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-md text-xs text-zinc-300 px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />

                {/* Notes */}
                <input
                  type="text"
                  value={sa?.notes || ''}
                  onChange={(e) => onUpdate(cat, { notes: e.target.value })}
                  placeholder="Add note…"
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-md text-xs text-zinc-300 px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder-zinc-600"
                />

                {/* Progress */}
                <SectionProgress approved={approvedQs} total={total} />
              </div>
            );
          })}
        </div>

        {/* Team Roster */}
        <div className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden">
          <button
            onClick={() => setRosterOpen(!rosterOpen)}
            className="w-full flex items-center justify-between px-4 py-3 hover:bg-zinc-800/40 transition-colors"
          >
            <div className="flex items-center gap-2 text-sm font-semibold text-zinc-200">
              <Users size={14} className="text-zinc-400" />
              Team Roster
              <span className="text-xs font-normal text-zinc-500">({teamMembers.length} members)</span>
            </div>
            {rosterOpen ? <ChevronDown size={14} className="text-zinc-500" /> : <ChevronRight size={14} className="text-zinc-500" />}
          </button>

          {rosterOpen && (
            <div className="px-4 pb-4 border-t border-zinc-800">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-3">
                {teamMembers.map((m) => (
                  <div key={m.id} className="flex items-center gap-2.5 bg-zinc-800 rounded-lg px-3 py-2.5">
                    <Avatar member={m} size="md" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-zinc-100 truncate">{m.name}</div>
                      <div className="text-[10px] text-zinc-500">{m.department}</div>
                    </div>
                    <button
                      onClick={() => {
                        setEditingMember(m);
                        setNewMember({ ...m });
                        setShowAddForm(true);
                      }}
                      className="text-zinc-600 hover:text-zinc-300 transition-colors"
                    >
                      <ChevronRight size={12} />
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => {
                    setEditingMember(null);
                    setNewMember({});
                    setShowAddForm(true);
                  }}
                  className="flex items-center justify-center gap-2 bg-zinc-800/40 border border-dashed border-zinc-700 rounded-lg px-3 py-2.5 text-xs text-zinc-500 hover:text-zinc-300 hover:border-zinc-500 transition-colors"
                >
                  <Plus size={12} />
                  Add Member
                </button>
              </div>

              {/* Add/Edit form */}
              {showAddForm && (
                <div className="mt-4 bg-zinc-800 rounded-lg p-4 border border-zinc-700">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-semibold text-zinc-200">
                      {editingMember ? 'Edit Member' : 'Add Member'}
                    </span>
                    <button onClick={() => { setShowAddForm(false); setEditingMember(null); setNewMember({}); }}>
                      <X size={14} className="text-zinc-500 hover:text-zinc-300" />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] text-zinc-500 mb-1 block">Name</label>
                      <input
                        type="text"
                        value={newMember.name || ''}
                        onChange={(e) => setNewMember((p) => ({ ...p, name: e.target.value }))}
                        className="w-full bg-zinc-700 border border-zinc-600 rounded text-xs text-zinc-200 px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-zinc-500 mb-1 block">Initials</label>
                      <input
                        type="text"
                        maxLength={3}
                        value={newMember.initials || ''}
                        onChange={(e) => setNewMember((p) => ({ ...p, initials: e.target.value.toUpperCase() }))}
                        className="w-full bg-zinc-700 border border-zinc-600 rounded text-xs text-zinc-200 px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-zinc-500 mb-1 block">Department</label>
                      <select
                        value={newMember.department || ''}
                        onChange={(e) => setNewMember((p) => ({ ...p, department: e.target.value }))}
                        className="w-full bg-zinc-700 border border-zinc-600 rounded text-xs text-zinc-200 px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="">Select…</option>
                        {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] text-zinc-500 mb-1 block">Color</label>
                      <div className="flex gap-1.5 flex-wrap">
                        {COLORS.map((c) => (
                          <button
                            key={c}
                            onClick={() => setNewMember((p) => ({ ...p, color: c }))}
                            className={`w-5 h-5 rounded-full ${c} ${newMember.color === c ? 'ring-2 ring-white ring-offset-1 ring-offset-zinc-800' : ''}`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-between mt-3">
                    {editingMember && (
                      <button
                        onClick={() => {
                          onUpdateTeam(teamMembers.filter((m) => m.id !== editingMember.id));
                          setShowAddForm(false);
                          setEditingMember(null);
                          setNewMember({});
                        }}
                        className="text-xs text-red-500 hover:text-red-400"
                      >
                        Remove
                      </button>
                    )}
                    <div className="ml-auto flex gap-2">
                      <button
                        onClick={() => { setShowAddForm(false); setEditingMember(null); setNewMember({}); }}
                        className="text-xs text-zinc-500 hover:text-zinc-300"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={saveMember}
                        className="text-xs bg-blue-600 hover:bg-blue-500 text-white px-3 py-1 rounded-md"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Sub-view B: Question Board ────────────────────────────────────────────────
interface QuestionBoardProps {
  questions: Question[];
  categories: string[];
  questionAssignments: Record<string, QuestionAssignment>;
  teamMembers: TeamMember[];
  memberMap: Record<string, TeamMember>;
  onSetStatus: (ref: string, status: QuestionStatus) => void;
  onAssign: (ref: string, memberId: string) => void;
}

function QuestionBoardView({
  questions,
  categories,
  questionAssignments,
  teamMembers,
  memberMap,
  onSetStatus,
  onAssign,
}: QuestionBoardProps) {
  const [catFilter, setCatFilter] = useState('All');
  const [redOnly, setRedOnly] = useState(false);
  const [unassignedOnly, setUnassignedOnly] = useState(false);
  const [selectedQ, setSelectedQ] = useState<Question | null>(null);

  const filtered = useMemo(() => {
    return questions.filter((q) => {
      if (catFilter !== 'All' && q.category !== catFilter) return false;
      if (redOnly && q.confidence !== 'RED') return false;
      if (unassignedOnly && questionAssignments[q.ref]?.assignedTo) return false;
      return true;
    });
  }, [questions, catFilter, redOnly, unassignedOnly, questionAssignments]);

  function getColQuestions(col: QuestionStatus) {
    return filtered.filter((q) => {
      const qa = questionAssignments[q.ref];
      const status = getQStatusFrom(qa);
      return status === col;
    });
  }

  function getQStatusFrom(qa: QuestionAssignment | undefined): QuestionStatus {
    if (!qa || !qa.assignedTo) return 'not-assigned';
    const extended = qa as QuestionAssignment & { boardStatus?: QuestionStatus };
    return extended.boardStatus ?? 'in-progress';
  }

  function cycleToNextStatus(ref: string) {
    const qa = questionAssignments[ref];
    const current = getQStatusFrom(qa);
    const order: QuestionStatus[] = ['not-assigned', 'in-progress', 'needs-review', 'approved'];
    const nextIdx = (order.indexOf(current) + 1) % order.length;
    onSetStatus(ref, order[nextIdx]);
  }

  return (
    <div className="flex flex-col h-full">
      {/* Filters */}
      <div className="flex items-center gap-3 px-6 py-3 border-b border-zinc-800 flex-shrink-0 flex-wrap">
        <select
          value={catFilter}
          onChange={(e) => setCatFilter(e.target.value)}
          className="bg-zinc-800 border border-zinc-700 rounded text-xs text-zinc-200 px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="All">All Categories</option>
          {categories.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <label className="flex items-center gap-1.5 text-xs text-zinc-400 cursor-pointer">
          <input
            type="checkbox"
            checked={redOnly}
            onChange={(e) => setRedOnly(e.target.checked)}
            className="rounded bg-zinc-700 border-zinc-600 text-red-500 focus:ring-red-500 focus:ring-offset-zinc-900"
          />
          <span className="text-red-400 font-medium">RED only</span>
        </label>
        <label className="flex items-center gap-1.5 text-xs text-zinc-400 cursor-pointer">
          <input
            type="checkbox"
            checked={unassignedOnly}
            onChange={(e) => setUnassignedOnly(e.target.checked)}
            className="rounded bg-zinc-700 border-zinc-600 text-blue-500 focus:ring-blue-500 focus:ring-offset-zinc-900"
          />
          Unassigned only
        </label>
        <span className="ml-auto text-xs text-zinc-600">{filtered.length} questions</span>
      </div>

      {/* Board */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden">
        <div className="flex gap-4 h-full px-6 py-4 min-w-max">
          {KANBAN_COLS.map(({ key, label, color }) => {
            const colQs = getColQuestions(key);
            return (
              <div key={key} className="flex flex-col w-64 flex-shrink-0">
                <div className={`flex items-center justify-between mb-3 pb-2 border-b-2 ${color}`}>
                  <span className="text-xs font-semibold text-zinc-300">{label}</span>
                  <span className="text-xs text-zinc-500 bg-zinc-800 px-1.5 py-0.5 rounded-full">
                    {colQs.length}
                  </span>
                </div>
                <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                  {colQs.map((q) => {
                    const qa = questionAssignments[q.ref];
                    const assignee = qa?.assignedTo ? memberMap[qa.assignedTo] : null;
                    return (
                      <div
                        key={q.ref}
                        className="bg-zinc-800 rounded-lg p-3 border border-zinc-700 hover:border-zinc-600 cursor-pointer transition-colors"
                        onClick={() => setSelectedQ(q)}
                      >
                        <div className="flex items-start justify-between gap-1 mb-1.5">
                          <span className="text-[10px] font-mono text-zinc-500 leading-tight">{q.ref}</span>
                          <ConfidenceBadge confidence={q.confidence} />
                        </div>
                        <p className="text-xs text-zinc-200 leading-snug line-clamp-2 mb-2">{q.topic}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] text-zinc-600 bg-zinc-700/50 rounded px-1.5 py-0.5 truncate max-w-[100px]">
                            {q.category}
                          </span>
                          <div className="flex items-center gap-1">
                            {assignee && <Avatar member={assignee} size="sm" />}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                cycleToNextStatus(q.ref);
                              }}
                              title="Advance status"
                              className="text-[9px] text-zinc-500 hover:text-blue-400 transition-colors"
                            >
                              →
                            </button>
                          </div>
                        </div>
                        {/* Assignee select */}
                        <div className="mt-2" onClick={(e) => e.stopPropagation()}>
                          <select
                            value={qa?.assignedTo || ''}
                            onChange={(e) => onAssign(q.ref, e.target.value)}
                            className="w-full bg-zinc-700 border border-zinc-600 rounded text-[10px] text-zinc-300 px-1.5 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          >
                            <option value="">Assign to…</option>
                            {teamMembers.map((m) => (
                              <option key={m.id} value={m.id}>{m.initials} — {m.name}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    );
                  })}
                  {colQs.length === 0 && (
                    <div className="text-center py-8 text-xs text-zinc-700">Empty</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Question detail modal */}
      {selectedQ && (
        <div
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedQ(null)}
        >
          <div
            className="bg-zinc-900 border border-zinc-700 rounded-xl max-w-xl w-full p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="text-[10px] font-mono text-zinc-500 mb-1">{selectedQ.ref}</div>
                <h3 className="text-sm font-semibold text-zinc-100">{selectedQ.topic}</h3>
              </div>
              <div className="flex items-center gap-2">
                <ConfidenceBadge confidence={selectedQ.confidence} />
                <button onClick={() => setSelectedQ(null)}>
                  <X size={14} className="text-zinc-500 hover:text-zinc-300" />
                </button>
              </div>
            </div>
            <div className="text-xs text-zinc-400 mb-3">
              <span className="text-zinc-600 font-medium">Category: </span>{selectedQ.category}
            </div>
            <div className="bg-zinc-800 rounded-lg p-3 mb-3">
              <div className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">Requirement</div>
              <p className="text-xs text-zinc-300 leading-relaxed">{selectedQ.requirement}</p>
            </div>
            {selectedQ.bullet && (
              <div className="bg-zinc-800 rounded-lg p-3">
                <div className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">Current Response</div>
                <p className="text-xs text-zinc-300 leading-relaxed">{selectedQ.bullet}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Sub-view C: Progress Report ───────────────────────────────────────────────
interface ProgressReportProps {
  data: RFPData;
  categorySummaries: { cat: string; total: number; green: number; yellow: number; red: number; approvedQs: number }[];
  sectionAssignments: Record<string, SectionAssignment>;
  questionAssignments: Record<string, QuestionAssignment>;
  memberMap: Record<string, TeamMember>;
}

function ProgressReportView({
  data,
  categorySummaries,
  sectionAssignments,
  questionAssignments,
  memberMap,
}: ProgressReportProps) {
  const [copied, setCopied] = useState(false);

  function getQStatusFrom(qa: QuestionAssignment | undefined): QuestionStatus {
    if (!qa || !qa.assignedTo) return 'not-assigned';
    const extended = qa as QuestionAssignment & { boardStatus?: QuestionStatus };
    return extended.boardStatus ?? 'in-progress';
  }

  const stats = useMemo(() => {
    const total = data.questions.length;
    const qStatuses = data.questions.map((q) => getQStatusFrom(questionAssignments[q.ref]));
    const approved = qStatuses.filter((s) => s === 'approved').length;
    const inProgress = qStatuses.filter((s) => s === 'in-progress').length;
    const needsReview = qStatuses.filter((s) => s === 'needs-review').length;
    const notStarted = qStatuses.filter((s) => s === 'not-assigned').length;
    const redUnaddressed = data.questions.filter(
      (q) => q.confidence === 'RED' && getQStatusFrom(questionAssignments[q.ref]) === 'not-assigned',
    ).length;
    return { total, approved, inProgress, needsReview, notStarted, redUnaddressed };
  }, [data, questionAssignments]);

  function daysRemaining(dueDate?: string): number | null {
    if (!dueDate) return null;
    const diff = new Date(dueDate).getTime() - Date.now();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  function generateReport(): string {
    const today = new Date().toLocaleDateString('en-CA');
    const lines: string[] = [
      '═══════════════════════════════════════════',
      'BSB CREDIT CARD RFP — STATUS REPORT',
      `Generated: ${today}`,
      '═══════════════════════════════════════════',
      '',
      'OVERALL PROGRESS',
      `Total Questions:   ${stats.total}`,
      `Approved:          ${stats.approved} (${Math.round((stats.approved / stats.total) * 100)}%)`,
      `In Progress:       ${stats.inProgress}`,
      `Needs Review:      ${stats.needsReview}`,
      `Not Started:       ${stats.notStarted}`,
      `RED Unaddressed:   ${stats.redUnaddressed}`,
      '',
      'SECTION STATUS',
      '───────────────────────────────────────────',
    ];

    for (const { cat, total, approvedQs } of categorySummaries) {
      const sa = sectionAssignments[cat];
      const owner = sa?.ownerId ? memberMap[sa.ownerId]?.name : 'Unassigned';
      const status = sa ? STATUS_LABELS[sa.status] : 'Not Started';
      const pct = Math.round((approvedQs / total) * 100);
      const bar = '█'.repeat(Math.round(pct / 10)) + '░'.repeat(10 - Math.round(pct / 10));
      lines.push(`${cat}`);
      lines.push(`  Owner: ${owner} | Status: ${status} | Progress: [${bar}] ${pct}%`);
      if (sa?.dueDate) {
        const days = daysRemaining(sa.dueDate);
        lines.push(`  Due: ${sa.dueDate}${days !== null ? ` (${days >= 0 ? days + ' days remaining' : Math.abs(days) + ' days overdue'})` : ''}`);
      }
      lines.push('');
    }

    return lines.join('\n');
  }

  function handleCopy() {
    navigator.clipboard.writeText(generateReport()).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  const BIG_STAT_CARDS = [
    { label: 'Total Questions', value: stats.total, color: 'text-zinc-200' },
    { label: 'Approved', value: stats.approved, color: 'text-green-400' },
    { label: 'In Progress', value: stats.inProgress, color: 'text-blue-400' },
    { label: 'Needs Review', value: stats.needsReview, color: 'text-yellow-400' },
    { label: 'Not Started', value: stats.notStarted, color: 'text-zinc-500' },
    { label: 'RED Unaddressed', value: stats.redUnaddressed, color: 'text-red-400' },
  ];

  return (
    <div className="overflow-auto h-full p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Big stats */}
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
          {BIG_STAT_CARDS.map(({ label, value, color }) => (
            <div key={label} className="bg-zinc-900 rounded-xl border border-zinc-800 p-4 text-center">
              <div className={`text-2xl font-bold tabular-nums ${color}`}>{value}</div>
              <div className="text-[10px] text-zinc-500 mt-1 leading-tight">{label}</div>
            </div>
          ))}
        </div>

        {/* Section progress table */}
        <div className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden">
          <div className="px-4 py-3 border-b border-zinc-800">
            <h3 className="text-sm font-semibold text-zinc-200">Section Progress</h3>
          </div>
          <div className="grid grid-cols-[2fr_1.5fr_2fr_1fr_1fr] text-[10px] font-semibold text-zinc-500 uppercase tracking-wider px-4 py-2.5 border-b border-zinc-800 bg-zinc-800/40">
            <span>Section</span>
            <span>Owner</span>
            <span>Progress</span>
            <span>Status</span>
            <span>Due</span>
          </div>
          {categorySummaries.map(({ cat, total, approvedQs }) => {
            const sa = sectionAssignments[cat];
            const owner = sa?.ownerId ? memberMap[sa.ownerId] : null;
            const days = daysRemaining(sa?.dueDate);
            return (
              <div
                key={cat}
                className="grid grid-cols-[2fr_1.5fr_2fr_1fr_1fr] items-center px-4 py-3 border-b border-zinc-800/60 hover:bg-zinc-800/20 transition-colors"
              >
                <span className="text-sm text-zinc-200 truncate">{cat}</span>
                <div className="flex items-center gap-1.5">
                  {owner ? (
                    <>
                      <Avatar member={owner} size="sm" />
                      <span className="text-xs text-zinc-400 truncate">{owner.name}</span>
                    </>
                  ) : (
                    <span className="text-xs text-zinc-600">Unassigned</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500 rounded-full transition-all"
                      style={{ width: `${total === 0 ? 0 : Math.round((approvedQs / total) * 100)}%` }}
                    />
                  </div>
                  <span className="text-xs text-zinc-400 tabular-nums w-12 text-right">
                    {approvedQs}/{total}
                  </span>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded font-medium ${STATUS_CLASSES[sa?.status || 'not-started']}`}>
                  {STATUS_LABELS[sa?.status || 'not-started']}
                </span>
                <span className={`text-xs tabular-nums ${days !== null && days < 0 ? 'text-red-400 font-semibold' : days !== null && days < 3 ? 'text-yellow-400' : 'text-zinc-500'}`}>
                  {days !== null ? (days >= 0 ? `${days}d` : `${Math.abs(days)}d late`) : '—'}
                </span>
              </div>
            );
          })}
        </div>

        {/* Generate report */}
        <div className="flex justify-end">
          <button
            onClick={handleCopy}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? 'Copied!' : 'Generate Status Report'}
          </button>
        </div>
      </div>
    </div>
  );
}

// Need React import for JSX in sub-components
import React from 'react';
