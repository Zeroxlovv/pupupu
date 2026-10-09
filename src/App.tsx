import { useState } from 'react';
import { Settings as SettingsIcon, LogOut, Calendar, BarChart3 } from 'lucide-react';
import { useStore } from './store/useStore';
import GroupSelector from './components/GroupSelector';
import ScheduleView from './components/ScheduleView';
import RatingView from './components/RatingView';
import Settings from './components/Settings';

type Page = 'schedule' | 'rating' | 'settings';

export default function App() {
  const { isLoggedIn, logout } = useStore();
  const [page, setPage] = useState<Page>('schedule');

  if (!isLoggedIn) {
    return <GroupSelector />;
  }

  if (page === 'settings') {
    return <Settings onBack={() => setPage('schedule')} />;
  }

  return (
    <div className="relative">
      {page === 'schedule' && <ScheduleView />}
      {page === 'rating' && <RatingView />}
      
      {/* Bottom navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-slate-900/90 backdrop-blur-md border-t border-white/10 z-50">
        <div className="max-w-2xl mx-auto flex">
          <button
            onClick={() => setPage('schedule')}
            className={`flex-1 py-3 flex flex-col items-center gap-1 transition-colors ${
              page === 'schedule' ? 'text-blue-400' : 'text-slate-400 hover:text-blue-400'
            }`}
          >
            <Calendar className="w-5 h-5" />
            <span className="text-xs">Расписание</span>
          </button>
          <button
            onClick={() => setPage('rating')}
            className={`flex-1 py-3 flex flex-col items-center gap-1 transition-colors ${
              page === 'rating' ? 'text-blue-400' : 'text-slate-400 hover:text-blue-400'
            }`}
          >
            <BarChart3 className="w-5 h-5" />
            <span className="text-xs">Рейтинг</span>
          </button>
          <button
            onClick={() => setPage('settings')}
            className="flex-1 py-3 flex flex-col items-center gap-1 transition-colors text-slate-400 hover:text-blue-400"
          >
            <SettingsIcon className="w-5 h-5" />
            <span className="text-xs">Настройки</span>
          </button>
          <button
            onClick={logout}
            className="flex-1 py-3 flex flex-col items-center gap-1 text-slate-400 hover:text-red-400 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span className="text-xs">Выйти</span>
          </button>
        </div>
      </div>
      
      {/* Bottom padding for nav */}
      <div className="h-16" />
    </div>
  );
}
