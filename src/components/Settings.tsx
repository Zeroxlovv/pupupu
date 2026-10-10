import { useState } from 'react';
import { ArrowLeft, Calendar, Globe, Trash2, Plus, Edit3, Save } from 'lucide-react';
import { useStore } from '../store/useStore';

const WEEKDAYS_FULL = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье'];

export default function Settings({ onBack }: { onBack: () => void }) {
  const {
    settings,
    updateSettings,
    customLessons,
    addCustomLesson,
    removeCustomLesson,
    updateCustomLesson,
    selectedGroup,
  } = useStore();

  const [numDate, setNumDate] = useState(settings.numeratorStartDate);
  const [useDemo, setUseDemo] = useState(settings.useDemoData);
  const [showAddLesson, setShowAddLesson] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  function handleSaveSettings() {
    updateSettings({
      numeratorStartDate: numDate,
      useDemoData: useDemo,
    });
    alert('Настройки сохранены!');
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <div className="sticky top-0 z-10 bg-slate-900/80 backdrop-blur-md border-b border-white/10">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={onBack} className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors">
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <h1 className="text-lg font-bold text-white">Настройки</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-4 space-y-6">
        <section className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="w-5 h-5 text-blue-400" />
            <h2 className="text-white font-semibold">Начало числителя</h2>
          </div>
          <p className="text-slate-400 text-sm mb-3">
            Укажите дату, с которой начинается числитель (обычно 1 сентября).
          </p>
          <input
            type="date"
            value={numDate}
            onChange={(e) => setNumDate(e.target.value)}
            className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-400/50 [color-scheme:dark]"
          />
          <div className="mt-2 text-xs text-slate-500">
            Текущая дата: {new Date().toLocaleDateString('ru-RU')}
          </div>
        </section>

        <section className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Globe className="w-5 h-5 text-blue-400" />
            <h2 className="text-white font-semibold">Подключение</h2>
          </div>
          
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={useDemo}
              onChange={(e) => setUseDemo(e.target.checked)}
              className="w-4 h-4 rounded bg-white/10 border-white/30 text-blue-500 focus:ring-blue-400/50"
            />
            <div>
              <span className="text-white text-sm">Демо-режим</span>
              <p className="text-slate-400 text-xs">
                Использовать демо-данные вместо загрузки с сервера
              </p>
            </div>
          </label>
        </section>

        <section className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Edit3 className="w-5 h-5 text-blue-400" />
              <h2 className="text-white font-semibold">Свои занятия</h2>
            </div>
            <button
              onClick={() => setShowAddLesson(!showAddLesson)}
              className="p-2 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 transition-colors"
            >
              <Plus className="w-4 h-4 text-blue-300" />
            </button>
          </div>
          <p className="text-slate-400 text-sm mb-3">
            Добавьте свои занятия, которые будут отображаться вместе с основным расписанием.
          </p>

          {(showAddLesson || editingId) && (
            <LessonForm
              initial={editingId ? customLessons.find(l => l.id === editingId) : undefined}
              onSave={(data) => {
                if (editingId) {
                  updateCustomLesson(editingId, data);
                  setEditingId(null);
                } else {
                  addCustomLesson(data);
                  setShowAddLesson(false);
                }
              }}
              onCancel={() => {
                setShowAddLesson(false);
                setEditingId(null);
              }}
            />
          )}

          {customLessons.length > 0 && (
            <div className="space-y-2 mt-3">
              {customLessons.map(lesson => (
                <div key={lesson.id} className="flex items-center gap-2 p-2 bg-white/5 rounded-lg border border-white/10">
                  <div className="flex-1 min-w-0">
                    <div className="text-white text-sm truncate">{lesson.subject}</div>
                    <div className="text-slate-400 text-xs">
                      {WEEKDAYS_FULL[lesson.weekday]} • {lesson.time}
                      {lesson.room && ` • ауд. ${lesson.room}`}
                    </div>
                  </div>
                  <button onClick={() => setEditingId(lesson.id)} className="p-1.5 rounded hover:bg-white/10 transition-colors">
                    <Edit3 className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                  <button onClick={() => removeCustomLesson(lesson.id)} className="p-1.5 rounded hover:bg-red-500/20 transition-colors">
                    <Trash2 className="w-3.5 h-3.5 text-red-400" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        <button
          onClick={handleSaveSettings}
          className="w-full py-3 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
        >
          <Save className="w-5 h-5" />
          Сохранить настройки
        </button>

        <div className="text-center text-xs text-slate-600 pb-4">
          <p>Расписание ВГУИТ • timetable.vsuet.ru</p>
          <p className="mt-1">Группа: {selectedGroup || 'не выбрана'}</p>
        </div>
      </div>
    </div>
  );
}

function LessonForm({
  initial,
  onSave,
  onCancel,
}: {
  initial?: { weekday: number; time: string; subject: string; kindRaw: string; teachers: string[]; room: string; week: string; subgroup: string };
  onSave: (data: { weekday: number; time: string; subject: string; kindRaw: string; teachers: string[]; room: string; week: string; subgroup: string }) => void;
  onCancel: () => void;
}) {
  const [weekday, setWeekday] = useState(initial?.weekday ?? 0);
  const [time, setTime] = useState(initial?.time ?? '08:30-10:00');
  const [subject, setSubject] = useState(initial?.subject ?? '');
  const [kindRaw, setKindRaw] = useState(initial?.kindRaw ?? '');
  const [teacher, setTeacher] = useState(initial?.teachers?.[0] ?? '');
  const [room, setRoom] = useState(initial?.room ?? '');
  const [week, setWeek] = useState(initial?.week ?? '');
  const [subgroup, setSubgroup] = useState(initial?.subgroup ?? '');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!subject.trim()) return;
    onSave({
      weekday,
      time,
      subject: subject.trim(),
      kindRaw: kindRaw.trim(),
      teachers: teacher.trim() ? [teacher.trim()] : [],
      room: room.trim(),
      week,
      subgroup: subgroup.trim(),
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 p-3 bg-white/5 rounded-xl border border-white/10">
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs text-slate-400 mb-1 block">День недели</label>
          <select
            value={weekday}
            onChange={(e) => setWeekday(Number(e.target.value))}
            className="w-full px-2 py-1.5 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-400/50"
          >
            {WEEKDAYS_FULL.map((d, i) => (
              <option key={i} value={i} className="bg-slate-800">{d}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs text-slate-400 mb-1 block">Время</label>
          <input
            type="text"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            placeholder="08:30-10:00"
            className="w-full px-2 py-1.5 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-400/50"
          />
        </div>
      </div>

      <div>
        <label className="text-xs text-slate-400 mb-1 block">Предмет *</label>
        <input
          type="text"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Название предмета"
          className="w-full px-2 py-1.5 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-400/50"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs text-slate-400 mb-1 block">Тип</label>
          <input
            type="text"
            value={kindRaw}
            onChange={(e) => setKindRaw(e.target.value)}
            placeholder="лекция, пр., лаб."
            className="w-full px-2 py-1.5 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-400/50"
          />
        </div>
        <div>
          <label className="text-xs text-slate-400 mb-1 block">Аудитория</label>
          <input
            type="text"
            value={room}
            onChange={(e) => setRoom(e.target.value)}
            placeholder="301"
            className="w-full px-2 py-1.5 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-400/50"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs text-slate-400 mb-1 block">Преподаватель</label>
          <input
            type="text"
            value={teacher}
            onChange={(e) => setTeacher(e.target.value)}
            placeholder="Иванов И.И."
            className="w-full px-2 py-1.5 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-400/50"
          />
        </div>
        <div>
          <label className="text-xs text-slate-400 mb-1 block">Неделя</label>
          <select
            value={week}
            onChange={(e) => setWeek(e.target.value)}
            className="w-full px-2 py-1.5 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-400/50"
          >
            <option value="" className="bg-slate-800">Любая</option>
            <option value="числитель" className="bg-slate-800">Числитель</option>
            <option value="знаменатель" className="bg-slate-800">Знаменатель</option>
          </select>
        </div>
      </div>

      <div className="flex gap-2 pt-1">
        <button type="submit" className="flex-1 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-lg transition-colors">
          Сохранить
        </button>
        <button type="button" onClick={onCancel} className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-sm rounded-lg transition-colors">
          Отмена
        </button>
      </div>
    </form>
  );
}
