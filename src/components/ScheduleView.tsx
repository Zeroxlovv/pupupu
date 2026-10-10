import { useState, useEffect, useMemo } from 'react';
import { Calendar, MapPin, Users, BookOpen, RefreshCw, Loader2, AlertCircle } from 'lucide-react';
import { fetchSchedule, getDemoSchedule, type Schedule, type Lesson } from '../api/vsuet';
import { useStore } from '../store/useStore';

const WEEKDAYS_SHORT = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
const WEEKDAYS_FULL = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье'];

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

  useEffect(() => {
    loadSchedule();
  }, [selectedGroup]);

  async function loadSchedule() {
    if (!selectedGroup) return;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchSchedule(selectedGroup);
      if (data.days.length > 0) {
        setSchedule(data);
      } else {
        setSchedule(getDemoSchedule(selectedGroup));
        setError('Не удалось загрузить расписание. Показаны демо-данные.');
      }
    } catch (e) {
      setSchedule(getDemoSchedule(selectedGroup));
      setError('Ошибка загрузки. Показаны демо-данные.');
    }
    setLoading(false);
  }

  const filteredLessons = useMemo(() => {
    if (!schedule) return [];
    let lessons: (Lesson & { isCustom?: boolean })[] = [];

    schedule.days.forEach((day: any) => {
      if (selectedDay !== null && day.weekday !== selectedDay) return;
      day.lessons.forEach((lesson: any) => {
        if (currentWeek === 'numerator' && lesson.week === 'знаменатель') return;
        if (currentWeek === 'denominator' && lesson.week === 'числитель') return;
        lessons.push(lesson);
      });
    });

    customLessons.forEach((cl: any) => {
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
      const arr = map.get(l.weekday);
      if (arr) arr.push(l);
    });
    map.forEach((lessons) => {
      lessons.sort((a, b) => a.time.localeCompare(b.time));
    });
    return map;
  }, [filteredLessons]);

  const currentWeekday = getCurrentWeekday();
  const isNumerator = isCurrentWeekNumerator(settings.numeratorStartDate);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <div className="sticky top-0 z-10 bg-slate-900/80 backdrop-blur-md border-b border-white/10">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h1 className="text-lg font-bold text-white">Группа {selectedGroup}</h1>
              <p className="text-xs text-blue-300/70">
                {isNumerator ? '📐 Числитель' : '📏 Знаменатель'}
              </p>
            </div>
            <button
              onClick={loadSchedule}
              disabled={loading}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
            >
              <RefreshCw className={`w-5 h-5 text-blue-300 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

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
          </div>
        </div>
      </div>
    </div>
  );
}
