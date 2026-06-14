import { useState, useEffect } from "react";
import { Trash2 } from "lucide-react";

const RADIUS = 26;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function statusColor(status) {
  if (status === "safe") return { ring: "#10b981", label: "text-emerald-600" };
  if (status === "warning") return { ring: "#f59e0b", label: "text-amber-600" };
  return { ring: "#ef4444", label: "text-red-600" };
}

export default function SubjectCard({ subject, onAction }) {
  const { id, name, present, total, target, percentage, can_skip, need_attend, status } = subject;
  const absent = total - present;
  const pct = percentage ?? (total > 0 ? Math.round((present / total) * 100) : 0);
  const colors = statusColor(status || "safe");

  let chipText = "No classes yet";
  let chipSafe = true;
  if (total > 0) {
    if (pct >= target) {
      chipText = can_skip > 0 ? `Can skip ${can_skip}` : "On target";
      chipSafe = true;
    } else {
      chipText = `Attend ${need_attend} more`;
      chipSafe = false;
    }
  }

  const [offset, setOffset] = useState(CIRCUMFERENCE);

  useEffect(() => {
    const timer = requestAnimationFrame(() => {
      setOffset(CIRCUMFERENCE - (Math.min(pct, 100) / 100) * CIRCUMFERENCE);
    });
    return () => cancelAnimationFrame(timer);
  }, [pct]);

  return (
    <div className="group relative bg-white border border-gray-100 rounded-2xl p-5 hover:border-gray-200 transition-all duration-200 shadow-sm hover:shadow-md">
      {/* Delete button */}
      <button
        onClick={() => onAction(id, "delete")}
        className="absolute top-4 right-4 text-gray-300 hover:text-red-500 transition-colors duration-200 cursor-pointer opacity-0 group-hover:opacity-100"
        title="Delete subject"
      >
        <Trash2 size={14} />
      </button>

      {/* Top: ring + name */}
      <div className="flex items-center gap-4 mb-4">
        <div className="relative flex-shrink-0">
          <svg width="64" height="64" viewBox="0 0 64 64" className="-rotate-90">
            <circle
              cx="32" cy="32" r={RADIUS}
              fill="none" stroke="#f3f4f6"
              strokeWidth="5"
            />
            <circle
              cx="32" cy="32" r={RADIUS}
              fill="none"
              stroke={colors.ring}
              strokeWidth="5"
              strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={offset}
              style={{ transition: "stroke-dashoffset 0.8s cubic-bezier(0.4,0,0.2,1)" }}
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-gray-900">
            {pct}%
          </span>
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="text-gray-900 font-semibold text-sm truncate pr-6">{name}</h3>
          <p className="text-gray-400 text-xs mt-0.5">Target: {target}%</p>
        </div>
      </div>

      {/* Stats row */}
      <div className="flex items-center gap-4 text-[11px] text-gray-400 mb-3">
        <span className="flex items-center gap-1">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500" />
          Present: {present}
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-red-400" />
          Absent: {absent}
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-gray-300" />
          Total: {total}
        </span>
      </div>

      {/* Status chip */}
      <div className="mb-4">
        <span
          className={`inline-block text-[11px] font-semibold px-2.5 py-0.5 rounded-md ${
            chipSafe
              ? "bg-emerald-50 text-emerald-700"
              : status === "warning"
              ? "bg-amber-50 text-amber-700"
              : "bg-red-50 text-red-700"
          }`}
        >
          {chipText}
        </span>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => onAction(id, "attend")}
          className="flex-1 text-[11px] font-semibold py-2 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors duration-150 cursor-pointer"
        >
          +1 Attended
        </button>
        <button
          onClick={() => onAction(id, "skip")}
          className="flex-1 text-[11px] font-semibold py-2 rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors duration-150 cursor-pointer"
        >
          +1 Skipped
        </button>
        <button
          onClick={() => onAction(id, "reset")}
          className="flex-1 text-[11px] font-semibold py-2 rounded-lg bg-gray-50 text-gray-500 hover:bg-gray-100 transition-colors duration-150 cursor-pointer"
        >
          Reset
        </button>
      </div>
    </div>
  );
}
