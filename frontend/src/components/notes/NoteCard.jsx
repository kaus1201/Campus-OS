import { useState } from "react";
import { Trash2, Sparkles, Loader2 } from "lucide-react";

function formatDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function NoteCard({ note, onSummarise, onDelete }) {
  const [summarising, setSummarising] = useState(false);

  const handleSummarise = async () => {
    setSummarising(true);
    try {
      await onSummarise(note.id);
    } finally {
      setSummarising(false);
    }
  };

  return (
    <div className="group bg-white border border-gray-200 rounded-2xl p-5 hover:border-gray-300 transition-all duration-300 hover:shadow-md flex flex-col shadow-sm">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <h3 className="text-gray-900 font-bold text-base leading-snug pr-4">
          {note.title}
        </h3>
        <button
          onClick={() => onDelete(note.id)}
          className="text-gray-400 hover:text-red-500 transition-colors duration-200 p-1 flex-shrink-0 cursor-pointer"
          title="Delete note"
        >
          <Trash2 size={16} />
        </button>
      </div>

      {/* Content preview – 3 lines */}
      <p className="text-gray-600 text-sm leading-relaxed line-clamp-3 mb-3 flex-1">
        {note.content}
      </p>

      {/* Tags */}
      {note.tags && note.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {note.tags.map((tag, i) => (
            <span
              key={i}
              className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* Summary section */}
      {note.summary && (
        <div className="mb-3 p-3 rounded-xl bg-indigo-50 border border-indigo-100">
          <p className="text-xs font-bold text-indigo-700 mb-1 flex items-center gap-1.5">
            <Sparkles size={14} /> AI Summary
          </p>
          <p className="text-gray-700 text-xs leading-relaxed font-medium">
            {note.summary}
          </p>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-100 mt-auto">
        <span className="text-gray-400 text-[11px] font-medium">
          {formatDate(note.created_at)}
        </span>
        <button
          onClick={handleSummarise}
          disabled={summarising}
          className="text-xs font-bold px-3 py-1.5 rounded-lg bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 cursor-pointer flex items-center gap-1.5 shadow-sm"
        >
          {summarising ? (
            <>
              <Loader2 size={14} className="animate-spin" /> Summarising…
            </>
          ) : (
            <>
              <Sparkles size={14} className="text-indigo-500" /> Summarise
            </>
          )}
        </button>
      </div>
    </div>
  );
}
