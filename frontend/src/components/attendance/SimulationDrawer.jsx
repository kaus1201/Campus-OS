import { useState, useMemo } from 'react';
import { X, Sparkles } from 'lucide-react';

const DAYS_OF_WEEK = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default function SimulationDrawer({ isOpen, onClose, subjects, timetable }) {
  const [simState, setSimState] = useState({}); // key: "dayIdx_classId", val: "attend"|"skip"

  const toggleSim = (key) => {
    setSimState(prev => {
      const current = prev[key] || 'attend';
      return { ...prev, [key]: current === 'attend' ? 'skip' : 'attend' };
    });
  };

  const next7Days = useMemo(() => {
    return Array.from({length: 7}).map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() + i);
      const dayName = DAYS_OF_WEEK[d.getDay()];
      return {
        id: i,
        dayName,
        label: i === 0 ? "Today" : i === 1 ? "Tomorrow" : d.toLocaleDateString('en-US', {weekday: 'short', month: 'short', day: 'numeric'})
      };
    });
  }, []);

  const scheduledClasses = useMemo(() => {
    const classes = [];
    next7Days.forEach((day) => {
      const dayClasses = timetable.filter(t => t.day_of_week === day.dayName);
      dayClasses.forEach(cls => {
        classes.push({ ...cls, dayIdx: day.id, dayLabel: day.label });
      });
    });
    return classes;
  }, [next7Days, timetable]);

  // Projected math
  const projections = useMemo(() => {
    return subjects.map(subj => {
      let fAttended = 0;
      let fSkipped = 0;
      scheduledClasses.forEach(cls => {
        if (cls.subject_id === subj.id) {
          const key = `${cls.dayIdx}_${cls.id}`;
          const action = simState[key] || 'attend';
          if (action === 'attend') fAttended++;
          else fSkipped++;
        }
      });
      const pPresent = subj.present + fAttended;
      const pTotal = subj.total + fAttended + fSkipped;
      const pPct = pTotal > 0 ? (pPresent / pTotal) * 100 : 0;
      
      let pStatus = "safe";
      if (pPct < subj.target) {
        if (pPct >= subj.target - 5) pStatus = "warning";
        else pStatus = "danger";
      }

      return {
        ...subj,
        pPresent,
        pTotal,
        pPct,
        pStatus,
        delta: pPct - subj.percentage
      };
    });
  }, [subjects, scheduledClasses, simState]);

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-50 transition-opacity" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 w-full max-w-md bg-white border-l border-gray-200 z-50 flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/80">
          <div>
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Sparkles size={18} className="text-indigo-500" /> Attendance Predictor
            </h2>
            <p className="text-gray-500 text-xs mt-0.5">Simulate your upcoming 7 days</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 p-2 cursor-pointer transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-8 bg-white">
          {/* Section 1: The Schedule Toggles */}
          <div>
            <h3 className="text-gray-500 text-xs font-bold mb-3 uppercase tracking-wider">Upcoming Classes</h3>
            {scheduledClasses.length === 0 ? (
              <div className="bg-gray-50 rounded-xl p-4 text-center text-gray-500 text-sm border border-gray-100">
                No classes scheduled for the next 7 days. Add some in your Timetable!
              </div>
            ) : (
              <div className="space-y-3">
                {scheduledClasses.map(cls => {
                  const key = `${cls.dayIdx}_${cls.id}`;
                  const action = simState[key] || 'attend';
                  const isAttending = action === 'attend';
                  return (
                    <div key={key} className="flex items-center justify-between bg-white rounded-xl p-3 border border-gray-200 shadow-sm">
                      <div>
                        <div className="text-xs font-medium text-indigo-600 mb-0.5">{cls.dayLabel} at {cls.start_time}</div>
                        <div className="text-gray-900 text-sm font-medium">{cls.subject_name}</div>
                      </div>
                      <button 
                        onClick={() => toggleSim(key)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-all ${
                          isAttending 
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-sm' 
                            : 'bg-red-50 text-red-700 border border-red-200 line-through opacity-70'
                        }`}
                      >
                        {isAttending ? 'Attending' : 'Skipping'}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Section 2: Projected Results */}
          <div>
            <h3 className="text-gray-500 text-xs font-bold mb-3 uppercase tracking-wider">Projected Stats</h3>
            <div className="grid grid-cols-1 gap-3">
              {projections.map(subj => {
                const colorClass = 
                  subj.pStatus === 'safe' ? 'text-emerald-700 bg-emerald-50 border-emerald-100' :
                  subj.pStatus === 'warning' ? 'text-amber-700 bg-amber-50 border-amber-100' :
                  'text-red-700 bg-red-50 border-red-100';

                return (
                  <div key={subj.id} className="bg-white border border-gray-200 rounded-xl p-4 flex items-center justify-between shadow-sm">
                    <div>
                      <div className="text-gray-900 text-sm font-bold mb-1">{subj.name}</div>
                      <div className="flex gap-3 text-xs text-gray-500">
                        <span>Current: <strong className="text-gray-900">{subj.percentage}%</strong></span>
                        <span>Target: <strong className="text-gray-900">{subj.target}%</strong></span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end">
                      <div className={`px-2 py-1 rounded-md text-sm font-bold border ${colorClass}`}>
                        {subj.pPct.toFixed(1)}%
                      </div>
                      <div className={`text-[10px] mt-1 font-bold ${subj.delta >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                        {subj.delta > 0 ? '+' : ''}{subj.delta.toFixed(1)}%
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
