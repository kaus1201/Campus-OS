import { useState, useEffect, useCallback } from "react";
import { Plus, X, Trash2, CalendarX2 } from "lucide-react";
import { fetchTimetable, deleteTimetableEntry, fetchSubjects, createTimetableEntry } from "../../api";

const DAYS_OF_WEEK = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export default function TimetablePage() {
  const [timetable, setTimetable] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  
  const [formData, setFormData] = useState({
    subject_id: "",
    day_of_week: "Monday",
    start_time: "09:00",
    end_time: "10:00"
  });

  const loadData = useCallback(async () => {
    try {
      const [tData, sData] = await Promise.all([
        fetchTimetable(),
        fetchSubjects()
      ]);
      setTimetable(tData || []);
      setSubjects(sData || []);
    } catch (err) {
      console.error("Failed to load timetable:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleDelete = async (id) => {
    try {
      await deleteTimetableEntry(id);
      await loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!formData.subject_id) return;
    try {
      await createTimetableEntry({
        ...formData,
        subject_id: Number(formData.subject_id)
      });
      setShowForm(false);
      await loadData();
    } catch (err) {
      console.error(err);
    }
  };

  // Group timetable by day
  const grouped = DAYS_OF_WEEK.reduce((acc, day) => {
    acc[day] = timetable.filter(t => t.day_of_week === day);
    return acc;
  }, {});

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            Timetable
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Manage your weekly class schedule
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 cursor-pointer shadow-sm ${
            showForm
              ? 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {showForm ? <X size={16} /> : <Plus size={16} />}
          <span className="hidden sm:inline">{showForm ? 'Cancel' : 'Add Class'}</span>
        </button>
      </div>

      {showForm && (
        <div className="mb-8 animate-in bg-white border border-gray-200 shadow-sm rounded-2xl p-6">
          <h2 className="text-gray-900 font-bold text-lg mb-4">Schedule a Class</h2>
          <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-gray-600 text-xs font-bold mb-1.5 uppercase tracking-wider">Subject</label>
              <select
                value={formData.subject_id}
                onChange={e => setFormData({...formData, subject_id: e.target.value})}
                required
                className="w-full px-4 py-2.5 rounded-xl bg-white border border-gray-300 text-gray-900 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              >
                <option value="">Select Subject</option>
                {subjects.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-gray-600 text-xs font-bold mb-1.5 uppercase tracking-wider">Day</label>
              <select
                value={formData.day_of_week}
                onChange={e => setFormData({...formData, day_of_week: e.target.value})}
                required
                className="w-full px-4 py-2.5 rounded-xl bg-white border border-gray-300 text-gray-900 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              >
                {DAYS_OF_WEEK.map(day => (
                  <option key={day} value={day}>{day}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-gray-600 text-xs font-bold mb-1.5 uppercase tracking-wider">Start Time</label>
              <input
                type="time"
                value={formData.start_time}
                onChange={e => setFormData({...formData, start_time: e.target.value})}
                required
                className="w-full px-4 py-2.5 rounded-xl bg-white border border-gray-300 text-gray-900 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-gray-600 text-xs font-bold mb-1.5 uppercase tracking-wider">End Time</label>
              <input
                type="time"
                value={formData.end_time}
                onChange={e => setFormData({...formData, end_time: e.target.value})}
                required
                className="w-full px-4 py-2.5 rounded-xl bg-white border border-gray-300 text-gray-900 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div className="lg:col-span-4 flex justify-end mt-2">
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-blue-600 text-white font-medium text-sm hover:bg-blue-700 shadow-sm cursor-pointer"
              >
                Save Schedule
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-2 border-gray-200 border-t-blue-600 rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-6">
          {DAYS_OF_WEEK.map(day => {
            const classes = grouped[day];
            if (classes.length === 0) return null;
            
            return (
              <div key={day} className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                <div className="bg-gray-50/80 px-6 py-3 border-b border-gray-200 flex items-center gap-2">
                  <h3 className="text-gray-900 font-bold">{day}</h3>
                  <span className="text-gray-400 text-xs font-medium bg-gray-200/50 px-2 py-0.5 rounded-full">{classes.length} classes</span>
                </div>
                <div className="divide-y divide-gray-100">
                  {classes.map(cls => (
                    <div key={cls.id} className="p-4 sm:px-6 flex items-center justify-between hover:bg-gray-50/50 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="flex flex-col items-center justify-center bg-blue-50 border border-blue-100 text-blue-700 rounded-xl px-3 py-1.5 min-w-[90px]">
                          <span className="text-sm font-bold">{cls.start_time}</span>
                          <span className="text-[10px] font-medium opacity-70">{cls.end_time}</span>
                        </div>
                        <div>
                          <h4 className="text-gray-900 font-semibold">{cls.subject_name}</h4>
                          <p className="text-gray-500 text-xs">Target: {cls.subject_target}%</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDelete(cls.id)}
                        className="text-gray-400 hover:text-red-500 transition-colors p-2 cursor-pointer bg-white rounded-lg hover:bg-red-50"
                        title="Delete class"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
          {timetable.length === 0 && (
            <div className="text-center py-24 text-gray-500">
              <div className="w-16 h-16 rounded-2xl bg-white border border-gray-200 shadow-sm flex items-center justify-center mx-auto mb-4">
                <CalendarX2 size={24} className="text-gray-400" />
              </div>
              <h3 className="text-gray-900 font-bold mb-1">Schedule is empty</h3>
              <p className="text-sm text-gray-500">Add a class to get started!</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
