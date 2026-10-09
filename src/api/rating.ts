// API клиент для рейтинга ВГУИТ
// Работает через CORS-прокси с кэшированием в localStorage

const RATING_BASE = 'https://rating.vsuet.ru/web/Ved/Default.aspx';
const CORS_PROXIES = [
  'https://api.allorigins.win/raw?url=',
  'https://corsproxy.io/?',
];

const CACHE_KEY = 'vsuet_rating_cache';
const CACHE_TTL = 30 * 60 * 1000; // 30 минут

export interface FilterOption {
  value: string;
  label: string;
}

export interface RatingFilters {
  faculties: FilterOption[];
  groups: FilterOption[];
  years: FilterOption[];
  semesters: FilterOption[];
}

export interface Subject {
  id: string;
  name: string;
  shortName?: string;
}

export interface Student {
  id: string;
  fullName: string;
  lastName: string;
  firstName: string;
  middleName: string;
  recordBook: string; // Номер зачётки
  rating: number;
  grade?: string;
}

export interface SubjectData {
  subject: Subject;
  students: Student[];
  lastUpdated: number;
}

interface CacheData {
  filters: RatingFilters;
  subjects: Record<string, SubjectData>;
  timestamp: number;
}

// Получить HTML через CORS-прокси
async function fetchWithProxy(url: string): Promise<string> {
  for (const proxy of CORS_PROXIES) {
    try {
      const proxyUrl = proxy + encodeURIComponent(url);
      const resp = await fetch(proxyUrl, { signal: AbortSignal.timeout(15000) });
      if (resp.ok) {
        const text = await resp.text();
        if (text && text.length > 100) return text;
      }
    } catch (error) {
      console.error(`Proxy ${proxy} failed:`, error);
      continue;
    }
  }
  throw new Error('Не удалось получить данные. Проверьте подключение к интернету.');
}

// Парсинг HTML для извлечения фильтров
function parseFilters(html: string): RatingFilters {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  
  const faculties: FilterOption[] = [];
  const groups: FilterOption[] = [];
  const years: FilterOption[] = [];
  const semesters: FilterOption[] = [];

  // Ищем все select элементы
  const selects = doc.querySelectorAll('select');
  selects.forEach(select => {
    const name = (select.getAttribute('name') || select.id || '').toLowerCase();
    const options = Array.from(select.querySelectorAll('option'))
      .map(opt => ({
        value: opt.getAttribute('value') || '',
        label: opt.textContent?.trim() || ''
      }))
      .filter(opt => opt.value && opt.label && !opt.label.includes('Выберите'));

    if (name.includes('facult') || name.includes('факульт')) {
      faculties.push(...options);
    } else if (name.includes('group') || name.includes('групп')) {
      groups.push(...options);
    } else if (name.includes('year') || name.includes('год') || name.includes('учебн')) {
      years.push(...options);
    } else if (name.includes('sem') || name.includes('семестр')) {
      semesters.push(...options);
    }
  });

  return { faculties, groups, years, semesters };
}

// Парсинг списка предметов
function parseSubjects(html: string): Subject[] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const subjects: Subject[] = [];

  // Ищем ссылки на предметы или select с предметами
  const subjectLinks = doc.querySelectorAll('a[href*="subject"], a[href*="predmet"], .subject-item, .predmet-item');
  subjectLinks.forEach(link => {
    const id = link.getAttribute('href')?.match(/id=(\d+)/)?.[1] || link.getAttribute('data-id') || '';
    const name = link.textContent?.trim() || '';
    if (id && name) {
      subjects.push({ id, name });
    }
  });

  // Если не нашли ссылки, ищем в таблице
  if (subjects.length === 0) {
    const rows = doc.querySelectorAll('table tr, .row');
    rows.forEach((row, idx) => {
      if (idx === 0) return; // Пропускаем заголовок
      const cells = row.querySelectorAll('td');
      if (cells.length >= 2) {
        const id = cells[0]?.textContent?.trim() || String(idx);
        const name = cells[1]?.textContent?.trim() || '';
        if (name) {
          subjects.push({ id, name });
        }
      }
    });
  }

  return subjects;
}

// Парсинг списка студентов с рейтингом
function parseStudents(html: string): Student[] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const students: Student[] = [];

  // Ищем таблицу со студентами
  const tables = doc.querySelectorAll('table');
  tables.forEach(table => {
    const rows = table.querySelectorAll('tr');
    rows.forEach((row, idx) => {
      if (idx === 0) return; // Пропускаем заголовок
      
      const cells = row.querySelectorAll('td');
      if (cells.length >= 3) {
        const fullName = cells[1]?.textContent?.trim() || '';
        const recordBook = cells[2]?.textContent?.trim() || '';
        const ratingText = cells[3]?.textContent?.trim() || '0';
        const rating = parseFloat(ratingText) || 0;

        if (fullName && recordBook) {
          const nameParts = fullName.split(/\s+/);
          students.push({
            id: recordBook,
            fullName,
            lastName: nameParts[0] || '',
            firstName: nameParts[1] || '',
            middleName: nameParts[2] || '',
            recordBook,
            rating,
            grade: cells[4]?.textContent?.trim()
          });
        }
      }
    });
  });

  return students;
}

// Получить кэш
function getCache(): CacheData | null {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return null;
    
    const data: CacheData = JSON.parse(cached);
    if (Date.now() - data.timestamp > CACHE_TTL) {
      return null; // Кэш устарел
    }
    return data;
  } catch {
    return null;
  }
}

// Сохранить в кэш
function setCache(data: Partial<CacheData>) {
  try {
    const existing = getCache() || { filters: { faculties: [], groups: [], years: [], semesters: [] }, subjects: {}, timestamp: 0 };
    const updated: CacheData = {
      ...existing,
      ...data,
      timestamp: Date.now()
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('Failed to save cache:', error);
  }
}

// Получить фильтры
export async function fetchRatingFilters(forceRefresh = false): Promise<RatingFilters> {
  // Проверяем кэш
  if (!forceRefresh) {
    const cached = getCache();
    if (cached?.filters.faculties.length) {
      return cached.filters;
    }
  }

  try {
    const html = await fetchWithProxy(RATING_BASE);
    const filters = parseFilters(html);
    setCache({ filters });
    return filters;
  } catch (error) {
    console.error('Error fetching filters:', error);
    // Возвращаем демо-данные
    return getDemoFilters();
  }
}

// Получить список предметов для группы
export async function fetchSubjects(group: string, semester: string, forceRefresh = false): Promise<Subject[]> {
  const cacheKey = `subjects_${group}_${semester}`;
  
  // Проверяем кэш
  if (!forceRefresh) {
    const cached = getCache();
    if (cached?.subjects[cacheKey]) {
      return Object.values(cached.subjects[cacheKey]).map(s => s.subject);
    }
  }

  try {
    const url = `${RATING_BASE}?group=${encodeURIComponent(group)}&sem=${encodeURIComponent(semester)}`;
    const html = await fetchWithProxy(url);
    const subjects = parseSubjects(html);
    
    // Сохраняем в кэш
    const cached = getCache();
    if (cached) {
      const subjectsData: Record<string, SubjectData> = {};
      subjects.forEach(subj => {
        subjectsData[`${cacheKey}_${subj.id}`] = {
          subject: subj,
          students: [],
          lastUpdated: Date.now()
        };
      });
      setCache({ subjects: { ...cached.subjects, ...subjectsData } });
    }
    
    return subjects;
  } catch (error) {
    console.error('Error fetching subjects:', error);
    return getDemoSubjects();
  }
}

// Получить список студентов по предмету
export async function fetchStudentsBySubject(
  group: string, 
  semester: string, 
  subjectId: string,
  forceRefresh = false
): Promise<Student[]> {
  const cacheKey = `students_${group}_${semester}_${subjectId}`;
  
  // Проверяем кэш
  if (!forceRefresh) {
    const cached = getCache();
    if (cached?.subjects[cacheKey]?.students.length) {
      return cached.subjects[cacheKey].students;
    }
  }

  try {
    const url = `${RATING_BASE}?group=${encodeURIComponent(group)}&sem=${encodeURIComponent(semester)}&subject=${encodeURIComponent(subjectId)}`;
    const html = await fetchWithProxy(url);
    const students = parseStudents(html);
    
    // Сохраняем в кэш
    const cached = getCache();
    if (cached) {
      setCache({
        subjects: {
          ...cached.subjects,
          [cacheKey]: {
            subject: { id: subjectId, name: '' },
            students,
            lastUpdated: Date.now()
          }
        }
      });
    }
    
    return students;
  } catch (error) {
    console.error('Error fetching students:', error);
    return getDemoStudents();
  }
}

// Демо-данные
function getDemoFilters(): RatingFilters {
  return {
    faculties: [
      { value: '1', label: 'ИТ (Информационные технологии)' },
      { value: '2', label: 'ЭХТ (Экономика и химическая технология)' },
      { value: '3', label: 'Т (Технологический)' },
    ],
    groups: [
      { value: '100', label: 'ИСТ-21' },
      { value: '101', label: 'ИСТ-22' },
      { value: '110', label: 'ИВТ-21' },
      { value: '111', label: 'ИВТ-22' },
    ],
    years: [
      { value: '2024', label: '2024-2025' },
      { value: '2023', label: '2023-2024' },
    ],
    semesters: [
      { value: 'cur', label: 'Текущий семестр' },
      { value: '1', label: '1 семестр' },
      { value: '2', label: '2 семестр' },
    ],
  };
}

function getDemoSubjects(): Subject[] {
  return [
    { id: '1', name: 'Математический анализ' },
    { id: '2', name: 'Физика' },
    { id: '3', name: 'Программирование' },
    { id: '4', name: 'Базы данных' },
  ];
}

function getDemoStudents(): Student[] {
  return [
    { id: '12345', fullName: 'Иванов Иван Иванович', lastName: 'Иванов', firstName: 'Иван', middleName: 'Иванович', recordBook: '12345', rating: 95 },
    { id: '12346', fullName: 'Петров Пётр Петрович', lastName: 'Петров', firstName: 'Пётр', middleName: 'Петрович', recordBook: '12346', rating: 87 },
    { id: '12347', fullName: 'Сидорова Анна Сергеевна', lastName: 'Сидорова', firstName: 'Анна', middleName: 'Сергеевна', recordBook: '12347', rating: 92 },
  ];
}

// Очистить кэш
export function clearRatingCache() {
  localStorage.removeItem(CACHE_KEY);
}

// Получить информацию о кэше
export function getCacheInfo(): { timestamp: number; age: number } | null {
  const cached = getCache();
  if (!cached) return null;
  return {
    timestamp: cached.timestamp,
    age: Date.now() - cached.timestamp
  };
}
