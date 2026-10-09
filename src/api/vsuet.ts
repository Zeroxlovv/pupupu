// API клиент для timetable.vsuet.ru

const TIMETABLE_BASE = 'https://timetable.vsuet.ru/index.php';
const CORS_PROXIES = [
  'https://api.allorigins.win/raw?url=',
  'https://corsproxy.io/?',
];

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

function clean(s: string): string {
  return (s || '').replace(/\xa0/g, ' ').replace(/\s+/g, ' ').trim();
}

async function fetchWithProxy(url: string, options?: RequestInit): Promise<string> {
  // Try direct first
  try {
    const resp = await fetch(url, { 
      ...options, 
      signal: AbortSignal.timeout(8000),
    });
    if (resp.ok) return await resp.text();
  } catch {
    // Direct failed, try proxies
  }

  // Try CORS proxies
  for (const proxy of CORS_PROXIES) {
    try {
      const proxyUrl = proxy + encodeURIComponent(url);
      const resp = await fetch(proxyUrl, { signal: AbortSignal.timeout(12000) });
      if (resp.ok) {
        const text = await resp.text();
        if (text && text.length > 100) return text;
      }
    } catch {
      continue;
    }
  }

  throw new Error('Не удалось получить данные. Проверьте подключение к интернету.');
}

export async function fetchGroups(): Promise<string[]> {
  try {
    const html = await fetchWithProxy(TIMETABLE_BASE);
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const select = doc.querySelector('select[name="select_group"]');
    if (!select) return getDemoGroups();
    
    const options = select.querySelectorAll('option');
    const groups: string[] = [];
    options.forEach(opt => {
      const val = clean(opt.getAttribute('value') || '');
      if (val && !val.toUpperCase().includes('КУРС')) {
        groups.push(val);
      }
    });
    return groups.length > 0 ? groups : getDemoGroups();
  } catch {
    return getDemoGroups();
  }
}

export async function fetchSchedule(group: string): Promise<Schedule> {
  try {
    const params = new URLSearchParams();
    params.set('select_group', group);
    params.set('submit', '');

    const html = await fetchWithProxy(TIMETABLE_BASE, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    return parseSchedule(html);
  } catch {
    return getDemoSchedule(group);
  }
}

function parseSchedule(html: string): Schedule {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const lessons: Lesson[] = [];

  const tables = doc.querySelectorAll('table');
  tables.forEach(table => {
    const rows = table.querySelectorAll('tr');
    rows.forEach(tr => {
      const ths = tr.querySelectorAll('th');
      const tds = tr.querySelectorAll('td');
      if (tds.length === 0) return;

      let wd: number | null = null;
      let timeStr = '';
      let week = '';

      ths.forEach(th => {
        const txt = clean(th.textContent || '');
        const wdIdx = normWeekday(txt);
        if (wd === null && wdIdx !== null) {
          wd = wdIdx;
          return;
        }
        if (!timeStr) {
          const t = normTime(txt);
          if (t) {
            timeStr = t;
            return;
          }
        }
        if (!week) {
          const w = normWeek(txt);
          if (w) week = w;
        }
      });

      if (wd === null) return;
      const dayIndex = wd;

      tds.forEach(td => {
        const teachers: string[] = [];
        const teacherDivs = td.querySelectorAll('div.link_prepod');
        teacherDivs.forEach(div => {
          const name = clean(div.textContent || '');
          if (/^[А-ЯЁ][а-яё\-]+\s+[А-ЯЁ]\.\s?[А-ЯЁ]?\.?$/.test(name)) {
            teachers.push(name);
          }
        });

        const text = clean(td.textContent || '');
        const { subject, kindRaw, room, groups, subgroup } = parseCellText(text);

        if (!subject && !room && groups.length === 0 && teachers.length === 0) return;

        lessons.push({
          weekday: dayIndex,
          weekdayLabel: WEEKDAYS_RU[dayIndex],
          time: timeStr,
          week,
          subject,
          kind: '',
          kindRaw,
          teachers,
          room,
          groups,
          subgroup,
        });
      });
    });
  });

  const dayMap = new Map<number, Lesson[]>();
  lessons.forEach(l => {
    if (!dayMap.has(l.weekday)) dayMap.set(l.weekday, []);
    dayMap.get(l.weekday)!.push(l);
  });

  const days: DaySchedule[] = [];
  Array.from(dayMap.keys()).sort().forEach(wd => {
    days.push({
      weekday: wd,
      weekdayLabel: WEEKDAYS_RU[wd],
      lessons: dayMap.get(wd)!,
    });
  });

  return { days, lessonCount: lessons.length };
}

function normWeekday(token: string): number | null {
  const aliases: Record<string, number> = {
    'пн': 0, 'пон': 0, 'понедельник': 0,
    'вт': 1, 'втор': 1, 'вторник': 1,
    'ср': 2, 'сред': 2, 'среда': 2,
    'чт': 3, 'чет': 3, 'четверг': 3,
    'пт': 4, 'пят': 4, 'пятница': 4,
    'сб': 5, 'суб': 5, 'суббота': 5,
    'вс': 6, 'воск': 6, 'воскресенье': 6,
  };
  const t = (token || '').toLowerCase().replace(/[^а-яёa-z]/g, '');
  if (t in aliases) return aliases[t];
  for (const [k, v] of Object.entries(aliases)) {
    if (k.length >= 3 && t.startsWith(k)) return v;
  }
  return null;
}

const TIME_RE = /(\d{1,2})[.:](\d{2})\s*[-–—]\s*(\d{1,2})[.:](\d{2})/;

function normTime(token: string): string {
  const m = TIME_RE.exec(token || '');
  if (!m) return '';
  return `${m[1].padStart(2, '0')}:${m[2]}-${m[3].padStart(2, '0')}:${m[4]}`;
}

function normWeek(token: string): string {
  const t = clean(token).toLowerCase();
  if (t.startsWith('числ')) return 'числитель';
  if (t.startsWith('знам')) return 'знаменатель';
  return '';
}

const ROOM_RE = /\(\s*(?:а|ауд|каб|комп|к)\.?\s*([^)]{1,10}?)\s*\)/i;
const ROOM_OK_RE = /^(?:\d[0-9а-яёa-z/]*|Б\s?АЗ|[а-яё]{1,2}\d[0-9а-яёa-z/]*)$/i;
const PERSON_INLINE_RE = /([А-ЯЁ][а-яё\-]{2,}\s+[А-ЯЁ]\.\s?[А-ЯЁ]?\.?)/g;
const SUBGROUP_RE = /подгруппа\s*(\d)/i;

function isRoom(value: string): boolean {
  return ROOM_OK_RE.test(clean(value));
}

function parseCellText(text: string): { subject: string; kindRaw: string; room: string; groups: string[]; subgroup: string } {
  let t = clean(text);
  
  const groups: string[] = [];
  let m;
  const groupRe = /гр\.\s*([^\s,;)]+)/gi;
  while ((m = groupRe.exec(t)) !== null) {
    groups.push(clean(m[1]));
  }
  t = t.replace(/гр\.\s*[^\s,;)]+/gi, ' ');

  let room = '';
  const roomMatch = ROOM_RE.exec(t);
  if (roomMatch && isRoom(roomMatch[1])) {
    room = clean(roomMatch[1]);
    t = t.slice(0, roomMatch.index) + ' ' + t.slice(roomMatch.index + roomMatch[0].length);
  }

  let subgroup = '';
  const subMatch = SUBGROUP_RE.exec(t);
  if (subMatch) {
    subgroup = subMatch[1];
    t = t.slice(0, subMatch.index) + ' ' + t.slice(subMatch.index + subMatch[0].length);
  }

  t = t.replace(PERSON_INLINE_RE, ' ');

  let kindRaw = '';
  const kindMatch = /^([^:]{2,45}?)\s*:\s*(.+)$/s.exec(clean(t));
  if (kindMatch) {
    const kindText = clean(kindMatch[1]).toLowerCase().replace(/\.$/, '');
    const kinds = ['л', 'лаб', 'пр', 'лекция', 'практика', 'лабораторная', 'семинар'];
    if (kinds.some(k => kindText.startsWith(k))) {
      kindRaw = clean(kindMatch[1]);
      t = kindMatch[2];
    }
  }

  const subject = clean(t).replace(/^[ ,;–—|·"]+|[ ,;–—|·"]+$/g, '');
  return { subject, kindRaw, room, groups, subgroup };
}

export function getDemoGroups(): string[] {
  return [
    'ИСТ-21', 'ИСТ-22', 'ИСТ-23',
    'ИВТ-21', 'ИВТ-22', 'ИВТ-23',
    'ПИ-21', 'ПИ-22', 'ПИ-23',
    'АИТ-21', 'АИТ-22', 'АИТ-23',
    'КСиТ-21', 'КСиТ-22', 'КСиТ-23',
  ];
}

export function getDemoSchedule(group: string): Schedule {
  const subjects = [
    { subject: 'Математический анализ', kind: 'лекция', teacher: 'Иванов И.И.', room: '301' },
    { subject: 'Физика', kind: 'лаб.', teacher: 'Петров П.П.', room: '205' },
    { subject: 'Программирование', kind: 'пр.', teacher: 'Сидоров С.С.', room: '412' },
    { subject: 'Английский язык', kind: 'пр.', teacher: 'Смирнова А.В.', room: '118' },
  ];

  const days: DaySchedule[] = [];
  const times = ['08:30-10:00', '10:10-11:40', '12:10-13:40', '13:50-15:20'];
  
  for (let wd = 0; wd < 6; wd++) {
    const lessons: Lesson[] = [];
    const numLessons = 2 + Math.floor(Math.random() * 2);
    
    for (let i = 0; i < numLessons; i++) {
      const subj = subjects[Math.floor(Math.random() * subjects.length)];
      lessons.push({
        weekday: wd,
        weekdayLabel: ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'][wd],
        time: times[i % times.length],
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
    
    days.push({
      weekday: wd,
      weekdayLabel: ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'][wd],
      lessons,
    });
  }

  return { days, lessonCount: days.reduce((acc, d) => acc + d.lessons.length, 0) };
}
