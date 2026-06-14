import { useState, useEffect, useCallback, useMemo } from "react";
import NoteCard from "./NoteCard";
import NoteForm from "./NoteForm";
import TagChat from "./TagChat";
import { Plus, StickyNote, Hash, MessageCircle } from "lucide-react";
import {
  fetchNotes,
  createNote,
  deleteNote,
  summariseNote,
} from "../../api";

function SkeletonCard() {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm animate-pulse">
      <div className="h-5 bg-gray-200 rounded w-3/4 mb-3" />
      <div className="space-y-2 mb-3">
        <div className="h-3 bg-gray-100 rounded w-full" />
        <div className="h-3 bg-gray-100 rounded w-5/6" />
        <div className="h-3 bg-gray-100 rounded w-2/3" />
      </div>
      <div className="flex gap-1.5 mb-3">
        <div className="h-5 bg-gray-200 rounded-full w-14" />
        <div className="h-5 bg-gray-200 rounded-full w-16" />
      </div>
      <div className="h-3 bg-gray-200 rounded w-24 mt-3" />
    </div>
  );
}

export default function NotesPage() {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTag, setActiveTag] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [chatTag, setChatTag] = useState(null);

  const load = useCallback(async () => {
    try {
      const data = await fetchNotes();
      setNotes(data || []);
    } catch {
      /* handled in api.js */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Extract unique tags from all notes
  const allTags = useMemo(() => {
    const tagSet = new Set();
    notes.forEach((n) => n.tags?.forEach((t) => tagSet.add(t)));
    return [...tagSet].sort();
  }, [notes]);

  // Filter notes by active tag
  const filtered = useMemo(() => {
    if (!activeTag) return notes;
    return notes.filter((n) => n.tags?.includes(activeTag));
  }, [notes, activeTag]);

  const handleCreate = async (data) => {
    await createNote(data);
    setShowForm(false);
    await load();
  };

  const handleDelete = async (id) => {
    await deleteNote(id);
    await load();
  };

  const handleSummarise = async (id) => {
    await summariseNote(id);
    await load();
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)]">
      {/* ── Sidebar ──────────────────────────── */}
      <aside className="hidden md:flex flex-col w-56 flex-shrink-0 border-r border-gray-200 bg-white -mx-6 -my-8 lg:-mx-10">
        <div className="p-5 border-b border-gray-200 bg-white">
          <h2 className="text-gray-900 font-bold text-lg">Notes</h2>
          <p className="text-gray-500 text-xs mt-0.5">
            {notes.length} note{notes.length !== 1 && "s"}
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-0.5">
          {/* All notes */}
          <button
            onClick={() => setActiveTag(null)}
            className={`w-full text-left text-sm px-3 py-2 rounded-xl transition-all duration-200 cursor-pointer ${
              !activeTag
                ? "bg-blue-50 text-blue-700 font-medium"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            }`}
          >
            All Notes
          </button>

          {allTags.length > 0 && (
            <div className="pt-4 pb-2 px-3">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                Tags
              </span>
            </div>
          )}

          {allTags.map((tag) => (
            <div
              key={tag}
              className={`flex items-center rounded-xl transition-all duration-200 ${
                activeTag === tag
                  ? "bg-blue-50"
                  : "hover:bg-gray-100"
              }`}
            >
              <button
                onClick={() => setActiveTag(tag === activeTag ? null : tag)}
                className={`flex-1 flex items-center text-left text-sm px-3 py-2 truncate cursor-pointer transition-colors duration-200 ${
                  activeTag === tag
                    ? "text-blue-700 font-medium"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <Hash size={14} className="mr-1.5 opacity-50" />
                {tag}
              </button>
              <button
                onClick={() => setChatTag(tag)}
                className="text-[10px] font-medium px-2 py-1 mr-2 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100 hover:bg-indigo-100 transition-all duration-200 cursor-pointer flex-shrink-0 flex items-center gap-1"
                title={`Chat about #${tag}`}
              >
                <MessageCircle size={10} /> Chat
              </button>
            </div>
          ))}
        </div>
      </aside>

      {/* ── Main Area ────────────────────────── */}
      <main className="flex-1 px-6 py-6 overflow-y-auto">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-1.5">
                {activeTag ? (
                  <>
                    <Hash className="text-gray-400" size={24} />
                    {activeTag}
                  </>
                ) : (
                  "All Notes"
                )}
              </h1>
              <p className="text-gray-500 text-sm mt-1">
                {filtered.length} note{filtered.length !== 1 && "s"}
                {activeTag && (
                  <button
                    onClick={() => setActiveTag(null)}
                    className="ml-3 text-blue-600 hover:text-blue-700 transition-colors cursor-pointer"
                  >
                    Clear filter
                  </button>
                )}
              </p>
            </div>
            <button
              onClick={() => setShowForm(!showForm)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-all duration-200 cursor-pointer shadow-sm"
            >
              {showForm ? (
                "Cancel"
              ) : (
                <>
                  <Plus size={16} />
                  New Note
                </>
              )}
            </button>
          </div>

          {/* Mobile tag pills */}
          <div className="md:hidden flex flex-wrap gap-2 mb-6">
            <button
              onClick={() => setActiveTag(null)}
              className={`text-xs px-3 py-1.5 rounded-full transition-all duration-200 cursor-pointer ${
                !activeTag
                  ? "bg-blue-50 border-blue-200 text-blue-700 font-medium border"
                  : "bg-white border-gray-200 text-gray-600 border"
              }`}
            >
              All
            </button>
            {allTags.map((tag) => (
              <button
                key={tag}
                onClick={() => setActiveTag(tag === activeTag ? null : tag)}
                className={`text-xs px-3 py-1.5 rounded-full transition-all duration-200 cursor-pointer ${
                  activeTag === tag
                    ? "bg-blue-50 border-blue-200 text-blue-700 font-medium border"
                    : "bg-white border-gray-200 text-gray-600 border"
                }`}
              >
                #{tag}
              </button>
            ))}
          </div>

          {/* Note Form */}
          {showForm && (
            <div className="mb-6">
              <NoteForm
                onSubmit={handleCreate}
                onCancel={() => setShowForm(false)}
              />
            </div>
          )}

          {/* Notes Grid */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {[...Array(6)].map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24">
              <div className="w-20 h-20 rounded-2xl bg-white border border-gray-200 shadow-sm flex items-center justify-center mb-6">
                <StickyNote size={32} className="text-gray-300" />
              </div>
              <h3 className="text-gray-900 text-lg font-semibold mb-2">
                {activeTag ? `No notes tagged #${activeTag}` : "No notes yet"}
              </h3>
              <p className="text-gray-500 text-sm mb-6 text-center">
                {activeTag
                  ? "Try a different tag or create a new note."
                  : "Create your first note to capture important information."}
              </p>
              {!showForm && (
                <button
                  onClick={() => setShowForm(true)}
                  className="px-5 py-2.5 rounded-xl text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-all duration-200 cursor-pointer shadow-sm flex items-center gap-2"
                >
                  <Plus size={16} /> New Note
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 items-start">
              {filtered.map((note) => (
                <NoteCard
                  key={note.id}
                  note={note}
                  onDelete={handleDelete}
                  onSummarise={handleSummarise}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Tag Chat Drawer */}
      {chatTag && (
        <TagChat tag={chatTag} onClose={() => setChatTag(null)} />
      )}
    </div>
  );
}
