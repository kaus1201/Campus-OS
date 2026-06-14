import { useState, useEffect, useCallback } from "react";
import SubjectCard from "./SubjectCard";
import AddSubjectModal from "./AddSubjectModal";
import SimulationDrawer from "./SimulationDrawer";
import { Plus, Wand2, BookX } from "lucide-react";
import {
  fetchSubjects,
  createSubject,
  updateSubject,
  deleteSubject,
  fetchTimetable,
} from "../../api";

function SkeletonCard() {
  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm animate-pulse">
      <div className="flex items-center gap-4 mb-5">
        <div className="w-16 h-16 rounded-full bg-gray-100" />
        <div className="space-y-2 flex-1">
          <div className="h-4 bg-gray-100 rounded w-3/4" />
          <div className="h-3 bg-gray-100 rounded w-1/2" />
        </div>
      </div>
      <div className="flex gap-3 mb-3">
        <div className="h-3 bg-gray-100 rounded w-16" />
        <div className="h-3 bg-gray-100 rounded w-16" />
        <div className="h-3 bg-gray-100 rounded w-16" />
      </div>
      <div className="h-6 bg-gray-100 rounded-full w-24 mb-5" />
      <div className="flex gap-2">
        <div className="h-9 bg-gray-50 rounded-lg flex-1" />
        <div className="h-9 bg-gray-50 rounded-lg flex-1" />
        <div className="h-9 bg-gray-50 rounded-lg flex-1" />
      </div>
    </div>
  );
}

export default function AttendancePage() {
  const [subjects, setSubjects] = useState([]);
  const [timetable, setTimetable] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const load = useCallback(async () => {
    try {
      const [sData, tData] = await Promise.all([
        fetchSubjects(),
        fetchTimetable()
      ]);
      setSubjects(sData || []);
      setTimetable(tData || []);
    } catch {
      /* handled in api.js */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleAction = async (id, action) => {
    try {
      if (action === "delete") {
        await deleteSubject(id);
      } else {
        await updateSubject(id, action);
      }
      await load();
    } catch {
      /* handled in api.js */
    }
  };

  const handleAdd = async (data) => {
    await createSubject(data);
    await load();
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Attendance Tracker
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Track and manage your class attendance
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setDrawerOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 transition-all duration-200 cursor-pointer"
          >
            <Wand2 size={15} className="text-indigo-500" />
            <span className="hidden sm:inline">Simulate</span>
          </button>
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-all duration-200 cursor-pointer"
          >
            <Plus size={15} />
            <span className="hidden sm:inline">Add Subject</span>
          </button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : subjects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24">
          <div className="w-16 h-16 rounded-2xl bg-white border border-gray-200 flex items-center justify-center mb-5">
            <BookX size={28} className="text-gray-300" />
          </div>
          <h3 className="text-gray-900 text-base font-semibold mb-1">
            No subjects yet
          </h3>
          <p className="text-gray-400 text-sm mb-5 text-center max-w-xs">
            Add your first subject to start tracking attendance.
          </p>
          <button
            onClick={() => setModalOpen(true)}
            className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-all duration-200 cursor-pointer flex items-center gap-2"
          >
            <Plus size={15} /> Add Subject
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {subjects.map((subj) => (
            <SubjectCard
              key={subj.id}
              subject={subj}
              onAction={handleAction}
            />
          ))}
        </div>
      )}

      {/* Modal */}
      <AddSubjectModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onAdd={handleAdd}
      />

      {/* Simulation Drawer */}
      <SimulationDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        subjects={subjects}
        timetable={timetable}
      />
    </div>
  );
}
