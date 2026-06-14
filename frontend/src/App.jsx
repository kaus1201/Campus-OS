import { useState } from 'react'
import Sidebar from './components/Sidebar'
import AttendancePage from './components/attendance/AttendancePage'
import NotesPage from './components/notes/NotesPage'
import NoticeBoardPage from './components/noticeboard/NoticeBoardPage'
import CommunityPage from './components/community/CommunityPage'
import TimetablePage from './components/timetable/TimetablePage'

function App() {
  const [activePage, setActivePage] = useState('attendance')

  const renderPage = () => {
    switch (activePage) {
      case 'attendance':
        return <AttendancePage />
      case 'timetable':
        return <TimetablePage />
      case 'notes':
        return <NotesPage />
      case 'noticeboard':
        return <NoticeBoardPage />
      case 'community':
        return <CommunityPage />
      default:
        return <AttendancePage />
    }
  }

  return (
    <div className="flex min-h-screen text-gray-900 bg-gray-50">
      <Sidebar activePage={activePage} onNavigate={setActivePage} />
      <main className="flex-1 ml-0 md:ml-[80px] min-h-screen">
        <div className="max-w-6xl mx-auto px-6 py-8 lg:px-10">
          {renderPage()}
        </div>
      </main>
    </div>
  )
}

export default App
