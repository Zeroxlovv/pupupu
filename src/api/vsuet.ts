// API клиент для timetable.vsuet.ru

export interface Lesson {
  weekday: number;
  weekdayLabel: string;
  time: string;
  week: string;
  subject: string;
  kind: string;
  kindRaw: string;
  teachers: string[];
  room: string;
  groups: string[];
  subgroup: string;
}

export interface DaySchedule {
  weekday: number;
  weekdayLabel: string;
  lessons: Lesson[];
}

export interface Schedule {
  days: DaySchedule[];
  lessonCount: number;
}

const WEEKDAYS_RU = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье'];

// Демо-данные групп
export function getDemoGroups(): string[] {
  return [
    'ИСТ-21', 'ИСТ-22', 'ИСТ-23', 'ИСТ-24',
    'ИВТ-21', 'ИВТ-22', 'ИВТ-23', 'ИВТ-24',
    'ПИ-21', 'ПИ-22', 'ПИ-23', 'ПИ-24',
    'АИТ-21', 'АИТ-22', 'АИТ-23',
    'КСиТ-21', 'КСиТ-22', 'КСиТ-23',
    'Т-21', 'Т-22', 'Т-23',
    'Э-21', 'Э-22', 'Э-23',
    'М-261', 'М-262', 'М-263',
    'ХТ-21', 'ХТ-22', 'ХТ-23',
    'ПТ-21', 'ПТ-22', 'ПТ-23',
  ];
}

// Демо-расписание
export function getDemoSchedule(group: string): Schedule {
  const subjects = [
    { subject: 'Математический анализ', kind: 'лекция', teacher: 'Иванов И.И.', room: '301' },
    { subject: 'Физика', kind: 'лаб.', teacher: 'Петров П.П.', room: '205' },
    { subject: 'Программирование', kind: 'пр.', teacher: 'Сидоров С.С.', room: '412' },
    { subject: 'Английский язык', kind: 'пр.', teacher: 'Смирнова А.В.', room: '118' },
    { subject: 'Базы данных', kind: 'лекция', teacher: 'Козлов Д.А.', room: '305' },
    { subject: 'Операционные системы', kind: 'лекция', teacher: 'Новиков В.М.', room: '310' },
  ];
  
  const days: DaySchedule[] = [];
  const times = ['08:30-10:00', '10:10-11:40', '12:10-13:40', '13:50-15:20', '15:30-17:00'];
  
  for (let wd = 0; wd < 6; wd++) {
    const lessons: Lesson[] = [];
    const numLessons = 2 + Math.floor(Math.random() * 3);
    const usedTimes = new Set<number>();
    
    for (let i = 0; i < numLessons; i++) {
      let timeIdx: number;
      do {
        timeIdx = Math.floor(Math.random() * times.length);
      } while (usedTimes.has(timeIdx));
      usedTimes.add(timeIdx);
      
      const subj = subjects[Math.floor(Math.random() * subjects.length)];
      lessons.push({
        weekday: wd,
        weekdayLabel: WEEKDAYS_RU[wd],
        time: times[timeIdx],
        week: i % 2 === 0 ? 'числитель' : 'знаменатель',
        subject: subj.subject,
        kind: '',
        kindRaw: subj.kind,
        teachers: [subj.teacher],
        room: subj.room,
        groups: [group],
        subgroup: '',
      });
    }
    
    lessons.sort((a, b) => a.time.localeCompare(b.time));
    days.push({
      weekday: wd,
      weekdayLabel: WEEKDAYS_RU[wd],
      lessons,
    });
  }

  return { days, lessonCount: days.reduce((acc, d) => acc + d.lessons.length, 0) };
}

// Загрузка групп (всегда демо)
export async function fetchGroups(): Promise<string[]> {
  return getDemoGroups();
}

// Загрузка расписания (всегда демо)
export async function fetchSchedule(group: string): Promise<Schedule> {
  return getDemoSchedule(group);
}
