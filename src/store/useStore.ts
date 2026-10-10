import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Schedule } from '../api/vsuet';

interface CustomLesson {
  id: string;
  weekday: number;
  time: string;
  subject: string;
  kindRaw: string;
  teachers: string[];
  room: string;
  week: string;
  subgroup: string;
}

interface Settings {
  numeratorStartDate: string;
  useDemoData: boolean;
}

interface AppState {
  selectedGroup: string | null;
  isLoggedIn: boolean;
  schedule: Schedule | null;
  loading: boolean;
  error: string | null;
  currentWeek: 'all' | 'numerator' | 'denominator';
  selectedDay: number | null;
  settings: Settings;
  customLessons: CustomLesson[];

  setGroup: (group: string) => void;
  logout: () => void;
  setSchedule: (schedule: Schedule) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setCurrentWeek: (week: 'all' | 'numerator' | 'denominator') => void;
  setSelectedDay: (day: number | null) => void;
  updateSettings: (settings: Partial<Settings>) => void;
  addCustomLesson: (lesson: Omit<CustomLesson, 'id'>) => void;
  removeCustomLesson: (id: string) => void;
  updateCustomLesson: (id: string, lesson: Partial<CustomLesson>) => void;
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      selectedGroup: null,
      isLoggedIn: false,
      schedule: null,
      loading: false,
      error: null,
      currentWeek: 'all',
      selectedDay: null,
      settings: {
        numeratorStartDate: new Date(new Date().getFullYear(), 8, 1).toISOString().split('T')[0],
        useDemoData: true,
      },
      customLessons: [],

      setGroup: (group) => set({ selectedGroup: group, isLoggedIn: true }),
      logout: () => set({ selectedGroup: null, isLoggedIn: false, schedule: null }),
      setSchedule: (schedule) => set({ schedule }),
      setLoading: (loading) => set({ loading }),
      setError: (error) => set({ error }),
      setCurrentWeek: (currentWeek) => set({ currentWeek }),
      setSelectedDay: (selectedDay) => set({ selectedDay }),
      updateSettings: (newSettings) =>
        set((state) => ({
          settings: { ...state.settings, ...newSettings },
        })),
      addCustomLesson: (lesson) =>
        set((state) => ({
          customLessons: [
            ...state.customLessons,
            { ...lesson, id: crypto.randomUUID() },
          ],
        })),
      removeCustomLesson: (id) =>
        set((state) => ({
          customLessons: state.customLessons.filter((l) => l.id !== id),
        })),
      updateCustomLesson: (id, updates) =>
        set((state) => ({
          customLessons: state.customLessons.map((l) =>
            l.id === id ? { ...l, ...updates } : l
          ),
        })),
    }),
    {
      name: 'vsuet-timetable-storage',
    }
  )
);
