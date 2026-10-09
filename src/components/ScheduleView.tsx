import { useState, useEffect, useMemo } from 'react';
import {
  Calendar,
  MapPin,
  Users,
  BookOpen,
  RefreshCw,
  Loader2,
  AlertCircle,
  WifiOff,
  Cloud,
  CloudOff,
} from 'lucide-react';
import { fetchSchedule, getDemoSchedule, type Schedule, type Lesson } from '../api/vsuet';
import { useStore } from '../store/useStore';

const WEEKDAYS_SHORT = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
const WEEKDAYS_FULL = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье'];

const OFFLINE_CACHE_KEY = 'vsuet_schedule_cache';

interface ScheduleCache {
  group: string;
  schedule: Schedule;
  timestamp: number;
}

function getCurrentWeekday(): number {
  const day = new Date().getDay();
  return day === 0 ? 6 : day - 1;
}

function isCurrentWeekNumerator(startDate: string): boolean {
  const start = new Date(startDate);
  const now = new Date();
  const diffTime = now.getTime() - start.getTime();
  const diffWeeks = Math.floor(diffTime / (7 * 24 * 60 * 60 * 1000));
  return diffWeeks % 2 === 0;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
}

function saveScheduleCache(group: string, schedule: Schedule) {
  try {
    const cache: ScheduleCache = {
      group,
      schedule,
      timestamp: Date.now(),
    };
    localStorage.setItem(OFFLINE_CACHE_KEY, JSON.stringify(cache));
  } catch (e) {
    console.error('Failed to save schedule cache:', e);
  }
}

function loadScheduleCache(group: string): ScheduleCache | null {
  try {
    const cached = localStorage.getItem(OFFLINE_CACHE_KEY);
    if (!cached) return null;
    const data: ScheduleCache = JSON.parse(cached);
    if (data.group !== group) return null;
    return data;
  } catch {
    return null;
  }
}

export default function ScheduleView() {
  const {
    selectedGroup,
    schedule,
    setSchedule,
    loading,
    setLoading,
    error,
    setError,
    currentWeek,
    setCurrentWeek,
    selectedDay,
    setSelectedDay,
    settings,
    customLessons,
  } = useStore();

  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [cacheAge, setCacheAge] = useState<number | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    loadSchedule();
    
    // Автообновление каждые 15 минут
    const interval = setInterval(() => {
      loadSchedule(true); // silent refresh
    }, 15 * 60 * 1000);

    // Отслеживание онлайн/офлайн статуса
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      clearInterval(interval);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [selectedGroup]);

  async function loadSchedule(silent = false) {
    if (!selectedGroup) return;
    
    if (!silent) setLoading(true);
    if (!silent) setError(null);

    // Проверяем кэш
    const cached = loadScheduleCache(selectedGroup);
    if (cached) {
      setCacheAge(Date.now() - cached.timestamp);
      setLastUpdated(new Date(cached.timestamp));
      if (!schedule) {
        setSchedule(cached.schedule);
      }
    }

    if (!isOnline) {
      if (!silent) setError('Нет подключения к интернету. Показано сохранённое расписание.');
      setLoading(false);
      return;
    }

    try {
      const data = await fetchSchedule(selectedGroup);
      if (data.days.length > 0) {
        setSchedule(data);
        saveScheduleCache(selectedGroup, data);
        setCacheAge(0);
        setLastUpdated(new Date());
      } else if (!schedule) {
        setSchedule(getDemoSchedule(selectedGroup));
        if (!silent) setError('Не удалось загрузить расписание. Показаны демо-данные.');
      }
    } catch (e) {
      if (!schedule) {
        if (cached) {
          setSchedule(cached.schedule);
          if (!silent) setError('Не удалось обновить расписание. Показано сохранённое.');
        } else {
          setSchedule(getDemoSchedule(selectedGroup));
          if (!silent) setError('Ошибка загрузки. Показаны демо-данные.');
        }
      }
    }
    if (!silent) setLoading(false);
  }

  const filteredLessons = useMemo(() => {
    if (!schedule) return [];
    let lessons: (Lesson & { isCustom?: boolean })[] = [];

    schedule.days.forEach(day => {
      if (selectedDay !== null && day.weekday !== selectedDay) return;
      day.lessons.forEach(lesson => {
        if (currentWeek === 'numerator' && lesson.week === 'знаменатель') return;
        if (currentWeek === 'denominator' && lesson.week === 'числитель') return;
        lessons.push(lesson);
      });
    });

    customLessons.forEach(cl => {
      if (selectedDay !== null && cl.weekday !== selectedDay) return;
      if (currentWeek === 'numerator' && cl.week === 'знаменатель') return;
      if (currentWeek === 'denominator' && cl.week === 'числитель') return;
      lessons.push({
        weekday: cl.weekday,
        weekdayLabel: WEEKDAYS_FULL[cl.weekday],
        time: cl.time,
        week: cl.week,
        subject: cl.subject,
        kind: '',
        kindRaw: cl.kindRaw,
        teachers: cl.teachers,
        room: cl.room,
        groups: selectedGroup ? [selectedGroup] : [],
        subgroup: cl.subgroup,
        isCustom: true,
      });
    });

    return lessons;
  }, [schedule, selectedDay, currentWeek, customLessons, selectedGroup]);

  const groupedByDay = useMemo(() => {
    const map = new Map<number, (Lesson & { isCustom?: boolean })[]>();
    filteredLessons.forEach(l => {
      if (!map.has(l.weekday)) map.set(l.weekday, []);
      map.get(l.weekday)!.push(l);
    });
    map.forEach((lessons) => {
      lessons.sort((a, b) => a.time.localeCompare(b.time));
    });
    return map;
  }, [filteredLessons]);

  const currentWeekday = getCurrentWeekday();
  const isNumerator = isCurrentWeekNumerator(settings.numeratorStartDate);

  function formatCacheAge(): string {
    if (cacheAge === null) return '';
    if (cacheAge < 60000) return 'только что';
    if (cacheAge < 3600000) return `${Math.floor(cacheAge / 60000)} мин. назад`;
    if (cacheAge < 86400000) return `${Math.floor(cacheAge / 3600000)} ч. назад`;
    return `${Math.floor(cacheAge / 86400000)} дн. назад`;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-slate-900/80 backdrop-blur-md border-b border-white/10">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h1 className="text-lg font-bold text-white">Группа {selectedGroup}</h1>
              <p className="text-xs text-blue-300/70">
                {isNumerator ? '📐 Числитель' : '📏 Знаменатель'} • {formatDate(new Date())}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {/* Online/Offline indicator */}
              <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs ${
                isOnline ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'
              }`}>
                {isOnline ? <Cloud className="w-3 h-3" /> : <CloudOff className="w-3 h-3" />}
                {isOnline ? 'Online' : 'Offline'}
              </div>
              <button
                onClick={() => loadSchedule()}
                disabled={loading}
                className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
              >
                <RefreshCw className={`w-5 h-5 text-blue-300 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Cache info */}
          {lastUpdated && (
            <div className="mb-3 flex items-center gap-1 text-xs text-slate-500">
              <span>Обновлено: {formatCacheAge()}</span>
              {!isOnline && (
                <span className="ml-2 text-amber-400 flex items-center gap-1">
                  <WifiOff className="w-3 h-3" />
                  Офлайн-режим
                </span>
              )}
            </div>
          )}

          {/* Week filter */}
          <div className="flex gap-1 mb-3">
            {(['all', 'numerator', 'denominator'] as const).map(w => (
              <button
                key={w}
                onClick={() => setCurrentWeek(w)}
                className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-medium transition-all ${
                  currentWeek === w
                    ? 'bg-blue-500 text-white'
                    : 'bg-white/5 text-slate-300 hover:bg-white/10'
                }`}
              >
                {w === 'all' ? 'Все недели' : w === 'numerator' ? 'Числитель' : 'Знаменатель'}
              </button>
            ))}
          </div>

          {/* Day tabs */}
          <div className="flex gap-1 overflow-x-auto pb-1">
            <button
              onClick={() => setSelectedDay(null)}
              className={`shrink-0 py-1.5 px-3 rounded-lg text-xs font-medium transition-all ${
                selectedDay === null
                  ? 'bg-blue-500 text-white'
                  : 'bg-white/5 text-slate-300 hover:bg-white/10'
              }`}
            >
              Все
            </button>
            {WEEKDAYS_SHORT.map((day, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedDay(idx)}
                className={`shrink-0 py-1.5 px-3 rounded-lg text-xs font-medium transition-all ${
                  selectedDay === idx
                    ? 'bg-blue-500 text-white'
                    : idx === currentWeekday
                    ? 'bg-blue-500/20 text-blue-300 hover:bg-blue-500/30'
                    : 'bg-white/5 text-slate-300 hover:bg-white/10'
                }`}
              >
                {day}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 py-4">
        {error && (
          <div className="mb-4 p-3 bg-amber-500/10 border border-amber-400/30 rounded-xl flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
            <p className="text-amber-200 text-sm">{error}</p>
          </div>
        )}

        {loading && !schedule ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
            <span className="ml-3 text-blue-200">Загрузка расписания...</span>
          </div>
        ) : groupedByDay.size === 0 ? (
          <div className="text-center py-16">
            <Calendar className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400">Нет занятий для отображения</p>
          </div>
        ) : (
          Array.from(groupedByDay.entries())
            .sort(([a], [b]) => a - b)
            .map(([weekday, lessons]) => (
              <div key={weekday} className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${
                    weekday === currentWeekday ? 'bg-blue-500 text-white' : 'bg-white/10 text-blue-300'
                  }`}>
                    {WEEKDAYS_SHORT[weekday]}
                  </div>
                  <h2 className="text-white font-semibold">{WEEKDAYS_FULL[weekday]}</h2>
                  <span className="text-xs text-slate-500 ml-auto">{lessons.length} пар</span>
                </div>

                <div className="space-y-2">
                  {lessons.map((lesson, idx) => (
                    <LessonCard key={idx} lesson={lesson} />
                  ))}
                </div>
              </div>
            ))
        )}
      </div>
    </div>
  );
}

function LessonCard({ lesson }: { lesson: Lesson & { isCustom?: boolean } }) {
  return (
    <div className={`p-3 rounded-xl border transition-all ${
      lesson.isCustom
        ? 'bg-purple-500/10 border-purple-400/30'
        : 'bg-white/5 border-white/10 hover:bg-white/8'
    }`}>
      <div className="flex items-start gap-3">
        <div className="shrink-0 text-center">
          <div className="text-xs text-blue-300 font-mono">{lesson.time || '—'}</div>
          {lesson.week && (
            <div className="text-[10px] text-slate-500 mt-0.5">
              {lesson.week === 'числитель' ? 'числ.' : 'знам.'}
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-white font-medium text-sm truncate">
              {lesson.subject || 'Не указано'}
            </h3>
            {lesson.kindRaw && (
              <span className="shrink-0 text-[10px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300">
                {lesson.kindRaw}
              </span>
            )}
            {lesson.isCustom && (
              <span className="shrink-0 text-[10px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300">
                своё
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 mt-1.5">
            {lesson.teachers.length > 0 && (
              <div className="flex items-center gap-1 text-xs text-slate-400">
                <Users className="w-3 h-3" />
                <span>{lesson.teachers.join(', ')}</span>
              </div>
            )}
            {lesson.room && (
              <div className="flex items-center gap-1 text-xs text-slate-400">
                <MapPin className="w-3 h-3" />
                <span>ауд. {lesson.room}</span>
              </div>
            )}
            {lesson.subgroup && (
              <div className="flex items-center gap-1 text-xs text-slate-400">
                <BookOpen className="w-3 h-3" />
                <span>подгр. {lesson.subgroup}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
