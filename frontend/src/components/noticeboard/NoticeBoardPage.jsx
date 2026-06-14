import { useState, useEffect, useCallback } from 'react';
import { fetchNotices, createNotice, togglePin } from '../../api';
import NoticeCard from './NoticeCard';
import { ClipboardList, Plus, X, Pin, Loader2 } from 'lucide-react';

export default function NoticeBoardPage() {
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    body: '',
    author: '',
  });

  const loadNotices = useCallback(async () => {
    try {
      const data = await fetchNotices();
      // Accept both array and { notices: [...] } shapes
      const list = Array.isArray(data) ? data : data.notices || [];
      setNotices(list);
    } catch (err) {
      console.error('Failed to fetch notices:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadNotices();
  }, [loadNotices]);

  // Sort: pinned first, then newest
  const sortedNotices = [...notices].sort((a, b) => {
    const aPinned = a.pinned || a.is_pinned ? 1 : 0;
    const bPinned = b.pinned || b.is_pinned ? 1 : 0;
    if (bPinned !== aPinned) return bPinned - aPinned;
    return new Date(b.created_at || b.timestamp) - new Date(a.created_at || a.timestamp);
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.body.trim()) return;

    setSubmitting(true);
    try {
      await createNotice({
        title: formData.title.trim(),
        body: formData.body.trim(),
        author: formData.author.trim() || 'Anonymous',
      });
      setFormData({ title: '', body: '', author: '' });
      setShowForm(false);
      await loadNotices();
    } catch (err) {
      console.error('Failed to create notice:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleTogglePin = async (id) => {
    try {
      await togglePin(id);
      await loadNotices();
    } catch (err) {
      console.error('Failed to toggle pin:', err);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <ClipboardList size={22} className="text-blue-500" /> Notice Board
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Stay updated with the latest announcements
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className={`
            px-4 py-2.5 rounded-xl font-bold text-sm
            transition-all duration-300 cursor-pointer flex items-center gap-2 shadow-sm
            ${
              showForm
                ? 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }
          `}
        >
          {showForm ? <><X size={16} /> Cancel</> : <><Plus size={16} /> New Post</>}
        </button>
      </div>

      {/* Create Form */}
      {showForm && (
        <div className="mb-8 animate-in">
          <form
            onSubmit={handleSubmit}
            className="bg-white border border-gray-200 rounded-2xl p-6 space-y-4 shadow-sm"
          >
            <h2 className="text-gray-900 font-bold text-lg mb-1">Create a new notice</h2>

            <div>
              <label className="block text-gray-600 text-xs font-bold mb-1.5 uppercase tracking-wider">
                Title
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Notice title..."
                required
                className="w-full px-4 py-2.5 rounded-xl bg-white border border-gray-300 text-gray-900 placeholder-gray-400 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all duration-300"
              />
            </div>

            <div>
              <label className="block text-gray-600 text-xs font-bold mb-1.5 uppercase tracking-wider">
                Body
              </label>
              <textarea
                value={formData.body}
                onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                placeholder="Write your notice content..."
                required
                rows={4}
                className="w-full px-4 py-2.5 rounded-xl bg-white border border-gray-300 text-gray-900 placeholder-gray-400 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all duration-300 resize-none"
              />
            </div>

            <div>
              <label className="block text-gray-600 text-xs font-bold mb-1.5 uppercase tracking-wider">
                Your Name
              </label>
              <input
                type="text"
                value={formData.author}
                onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                placeholder="Anonymous"
                className="w-full px-4 py-2.5 rounded-xl bg-white border border-gray-300 text-gray-900 placeholder-gray-400 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all duration-300"
              />
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={submitting || !formData.title.trim() || !formData.body.trim()}
                className="px-6 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-sm cursor-pointer"
              >
                {submitting ? (
                  <span className="flex items-center gap-2">
                    <Loader2 size={16} className="animate-spin" /> Posting...
                  </span>
                ) : (
                  'Post Notice'
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Feed */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <Loader2 size={32} className="animate-spin mb-4 text-blue-500" />
          <p className="text-sm">Loading notices...</p>
        </div>
      ) : sortedNotices.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 rounded-2xl bg-white border border-gray-200 shadow-sm flex items-center justify-center mb-4">
            <ClipboardList size={28} className="text-gray-300" />
          </div>
          <p className="text-lg font-bold text-gray-900 mb-1">No notices yet</p>
          <p className="text-sm text-gray-500">Be the first to post an announcement!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {sortedNotices.map((notice) => (
            <NoticeCard
              key={notice.id || notice._id}
              notice={notice}
              onTogglePin={handleTogglePin}
            />
          ))}
        </div>
      )}
    </div>
  );
}
