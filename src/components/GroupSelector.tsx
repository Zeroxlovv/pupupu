import { useState, useEffect, useMemo } from 'react';
import { Search, GraduationCap, Loader2, WifiOff } from 'lucide-react';
import { fetchGroups, getDemoGroups } from '../api/vsuet';
import { useStore } from '../store/useStore';

export default function GroupSelector() {
  const { setGroup, settings } = useStore();
  const [groups, setGroups] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [usingDemo, setUsingDemo] = useState(false);

  useEffect(() => {
    loadGroups();
  }, []);

  async function loadGroups() {
    setLoading(true);
    setError(null);
    try {
      if (settings.useDemoData) {
        setGroups(getDemoGroups());
        setUsingDemo(true);
      } else {
        const fetched = await fetchGroups();
        if (fetched.length > 0) {
          setGroups(fetched);
          setUsingDemo(false);
        } else {
          setGroups(getDemoGroups());
          setUsingDemo(true);
          setError('Не удалось загрузить список групп. Показаны демо-группы.');
        }
      }
    } catch (e) {
      setGroups(getDemoGroups());
      setUsingDemo(true);
      setError('Не удалось подключиться к серверу. Показаны демо-группы.');
    }
    setLoading(false);
  }

  const filteredGroups = useMemo(() => {
    if (!search.trim()) return groups;
    const q = search.toLowerCase().trim();
    return groups.filter(g => g.toLowerCase().includes(q));
  }, [groups, search]);

  function handleSelect(group: string) {
    setGroup(group);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex flex-col items-center justify-center p-4">
      <div className="text-center mb-8">
        <div className="w-20 h-20 bg-blue-500/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-4 border border-blue-400/30">
          <GraduationCap className="w-10 h-10 text-blue-400" />
        </div>
        <h1 className="text-3xl font-bold text-white mb-2">Расписание ВГУИТ</h1>
        <p className="text-blue-200/70 text-sm">Выберите вашу группу для начала</p>
      </div>

      <div className="w-full max-w-md mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Поиск группы..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400/50 transition-all"
          />
        </div>
      </div>

      {error && (
        <div className="w-full max-w-md mb-4 p-3 bg-amber-500/10 border border-amber-400/30 rounded-xl flex items-start gap-2">
          <WifiOff className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <p className="text-amber-200 text-sm">{error}</p>
        </div>
      )}

      <div className="w-full max-w-md bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
            <span className="ml-2 text-blue-200">Загрузка групп...</span>
          </div>
        ) : (
          <div className="max-h-80 overflow-y-auto">
            {filteredGroups.length === 0 ? (
              <div className="p-6 text-center text-slate-400">Группы не найдены</div>
            ) : (
              filteredGroups.map((group) => (
                <button
                  key={group}
                  onClick={() => handleSelect(group)}
                  className="w-full px-4 py-3 text-left text-white hover:bg-blue-500/20 transition-colors border-b border-white/5 last:border-b-0 flex items-center gap-3"
                >
                  <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center shrink-0">
                    <span className="text-blue-300 text-xs font-bold">{group.slice(0, 2)}</span>
                  </div>
                  <span className="font-medium">{group}</span>
                  {usingDemo && <span className="ml-auto text-xs text-slate-500">демо</span>}
                </button>
              ))
            )}
          </div>
        )}
      </div>

      {usingDemo && (
        <p className="mt-4 text-xs text-slate-500 text-center">
          * В демо-режиме показаны примеры групп
        </p>
      )}
    </div>
  );
}
