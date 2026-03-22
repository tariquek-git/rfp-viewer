'use client';

interface ProgressBarProps {
  draft: number;
  reviewed: number;
  approved: number;
  flagged: number;
}

export default function ProgressBar({ draft, reviewed, approved, flagged }: ProgressBarProps) {
  const total = draft + reviewed + approved + flagged;
  if (total === 0) return null;

  const pct = (n: number) => `${Math.round((n / total) * 100)}%`;

  return (
    <div className="flex items-center gap-2">
      <div className="flex h-1.5 w-32 rounded-full overflow-hidden bg-gray-100">
        {approved > 0 && <div className="bg-emerald-500" style={{ width: pct(approved) }} />}
        {reviewed > 0 && <div className="bg-blue-500" style={{ width: pct(reviewed) }} />}
        {draft > 0 && <div className="bg-gray-300" style={{ width: pct(draft) }} />}
        {flagged > 0 && <div className="bg-red-500" style={{ width: pct(flagged) }} />}
      </div>
      <span className="text-[10px] text-gray-500 font-medium">
        {approved}/{total}
      </span>
    </div>
  );
}
