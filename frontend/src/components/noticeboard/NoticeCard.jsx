import { useMemo } from 'react';
import { Pin } from 'lucide-react';

function formatRelativeTime(dateString) {
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now - date;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffSec < 60) return 'just now';
  if (diffMin < 60) return `${diffMin} min ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });
}

export default function NoticeCard({ notice, onTogglePin }) {
  const timeAgo = useMemo(
    () => formatRelativeTime(notice.created_at || notice.timestamp),
    [notice.created_at, notice.timestamp]
  );

  const isPinned = notice.pinned || notice.is_pinned;

  return (
    <div
      className={`
        group relative
        bg-white
        border
        rounded-2xl
        p-5
        transition-all duration-300 shadow-sm
        hover:shadow-md
        ${isPinned ? 'border-amber-300 border-l-4' : 'border-gray-200 hover:border-gray-300'}
      `}
    >
      {/* Top row: Pinned badge + Pin button */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <h3 className="text-gray-900 font-bold text-lg leading-snug truncate">
            {notice.title}
          </h3>
          {isPinned && (
            <span className="shrink-0 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-700 border border-amber-200">
              <Pin size={10} className="fill-amber-700" /> Pinned
            </span>
          )}
        </div>

        <button
          onClick={() => onTogglePin(notice.id || notice._id)}
          className={`
            shrink-0 p-2 rounded-xl
            transition-all duration-300
            cursor-pointer border shadow-sm
            ${
              isPinned
                ? 'bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-100'
                : 'bg-white text-gray-400 border-gray-200 hover:bg-gray-50 hover:text-gray-700'
            }
          `}
          title={isPinned ? 'Unpin notice' : 'Pin notice'}
        >
          <Pin size={16} className={isPinned ? "fill-amber-600" : ""} />
        </button>
      </div>

      {/* Body */}
      <p className="text-gray-700 text-sm leading-relaxed mb-4 whitespace-pre-wrap">
        {notice.body || notice.content}
      </p>

      {/* Footer: Author + Timestamp */}
      <div className="flex items-center justify-between text-xs text-gray-500">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 text-xs font-bold">
            {(notice.author || 'A').charAt(0).toUpperCase()}
          </div>
          <span className="text-gray-700 font-bold">
            {notice.author || 'Anonymous'}
          </span>
        </div>
        <time className="text-gray-400 font-medium" dateTime={notice.created_at || notice.timestamp}>
          {timeAgo}
        </time>
      </div>
    </div>
  );
}
