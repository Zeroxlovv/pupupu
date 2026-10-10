// API клиент для рейтинга ВГУИТ

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
}

export interface Student {
  id: string;
  fullName: string;
  recordBook: string;
  rating: number;
}

// Демо-данные фильтров
export function getDemoFilters(): RatingFilters {
  return {
    faculties: [
      { value: '1', label: 'ИТ (Информационные технологии)' },
      { value: '2', label: 'ЭХТ (Экономика и химическая технология)' },
      { value: '3', label: 'Т (Технологический)' },
      { value: '4', label: 'УИТС (Управление и информатизация)' },
    ],
    groups: [
      { value: '100', label: 'ИСТ-21' },
      { value: '101', label: 'ИСТ-22' },
      { value: '102', label: 'ИСТ-23' },
      { value: '110', label: 'ИВТ-21' },
      { value: '111', label: 'ИВТ-22' },
      { value: '112', label: 'ИВТ-23' },
      { value: '120', label: 'ПИ-21' },
      { value: '121', label: 'ПИ-22' },
      { value: '122', label: 'ПИ-23' },
    ],
    years: [
      { value: '2024', label: '2024-2025' },
      { value: '2023', label: '2023-2024' },
      { value: '2022', label: '2022-2023' },
    ],
    semesters: [
      { value: 'cur', label: 'Текущий семестр' },
      { value: '1', label: '1 семестр' },
      { value: '2', label: '2 семестр' },
      { value: '3', label: '3 семестр' },
      { value: '4', label: '4 семестр' },
    ],
  };
}

// Демо-предметы
export function getDemoSubjects(): Subject[] {
  return [
    { id: '1', name: 'Математический анализ' },
    { id: '2', name: 'Физика' },
    { id: '3', name: 'Программирование' },
    { id: '4', name: 'Базы данных' },
    { id: '5', name: 'Операционные системы' },
    { id: '6', name: 'Английский язык' },
  ];
}

// Демо-студенты
export function getDemoStudents(): Student[] {
  const names = [
    'Иванов Иван Иванович',
    'Петров Пётр Петрович',
    'Сидорова Анна Сергеевна',
    'Козлов Дмитрий Александрович',
    'Морозова Елена Викторовна',
    'Волков Алексей Николаевич',
    'Новикова Мария Дмитриевна',
    'Федоров Сергей Владимирович',
    'Кузнецова Ольга Андреевна',
    'Попов Андрей Михайлович',
  ];
  
  return names.map((name, idx) => ({
    id: String(idx + 1),
    fullName: name,
    recordBook: String(10000 + idx),
    rating: 60 + Math.floor(Math.random() * 40),
  }));
}

// Загрузка фильтров
export async function fetchRatingFilters(): Promise<RatingFilters> {
  return getDemoFilters();
}

// Загрузка предметов
export async function fetchSubjects(): Promise<Subject[]> {
  return getDemoSubjects();
}

// Загрузка студентов
export async function fetchStudentsBySubject(): Promise<Student[]> {
  return getDemoStudents();
}
