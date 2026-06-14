import { useState } from 'react';
import { BarChart3, Calendar, ClipboardList, BookOpen, MessageSquare, Menu, X } from 'lucide-react';

const navItems = [
  { key: 'attendance', label: 'Attendance', icon: BarChart3 },
  { key: 'timetable', label: 'Timetable', icon: Calendar },
  { key: 'notes', label: 'Notes', icon: BookOpen },
  { key: 'noticeboard', label: 'Notice Board', icon: ClipboardList },
  { key: 'community', label: 'Community', icon: MessageSquare },
];

export default function Sidebar({ activePage, onNavigate }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleNav = (key) => {
    onNavigate(key);
    setMobileOpen(false);
  };

  return (
    <>
      {/* Mobile hamburger button */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="md:hidden fixed top-4 left-4 z-50 p-2.5 rounded-xl bg-white border border-gray-200 text-gray-700 cursor-pointer shadow-sm hover:bg-gray-50"
        aria-label="Toggle menu"
      >
        {mobileOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-30 transition-opacity duration-300"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`
          fixed top-0 left-0 z-40
          h-screen w-[80px]
          bg-gray-950
          border-r border-gray-800
          flex flex-col items-center py-6
          transition-transform duration-300 ease-in-out
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
      >
        {/* Logo area */}
        <div className="mb-10 flex items-center justify-center w-12 h-12 rounded-xl bg-blue-600 text-white font-bold text-xl shadow-lg">
          OS
        </div>

        {/* Navigation */}
        <nav className="flex-1 w-full flex flex-col items-center gap-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.key;
            return (
              <button
                key={item.key}
                onClick={() => handleNav(item.key)}
                title={item.label}
                className={`
                  relative group flex items-center justify-center
                  w-12 h-12 rounded-xl cursor-pointer transition-all duration-200
                  ${isActive 
                    ? 'bg-blue-600/10 text-blue-500' 
                    : 'text-gray-400 hover:bg-gray-800 hover:text-gray-100'}
                `}
              >
                <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                
                {/* Tooltip */}
                <span className="absolute left-16 px-3 py-1.5 rounded-md bg-gray-800 text-white text-xs font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                  {item.label}
                </span>
                
                {/* Active Indicator */}
                {isActive && (
                  <div className="absolute left-0 w-1 h-8 bg-blue-500 rounded-r-md" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Bottom Area (Settings / Profile placeholder) */}
        <div className="mt-auto pt-6">
          <div className="w-10 h-10 rounded-full bg-gray-800 border-2 border-gray-700 overflow-hidden shadow-inner flex items-center justify-center">
            <span className="text-gray-300 text-xs font-bold">ME</span>
          </div>
        </div>
      </aside>
    </>
  );
}
