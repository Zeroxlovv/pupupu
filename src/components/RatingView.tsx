import { useState, useEffect } from 'react';
import { RefreshCw, ChevronRight, User, BookOpen, Award, ArrowLeft, Loader2 } from 'lucide-react';
import { 
  fetchRatingFilters, 
  fetchSubjects, 
  fetchStudentsBySubject, 
  type RatingFilters, 
  type Subject, 
  type Student 
} from '../api/rating';
import { useStore } from '../store/useStore';

type ViewMode = 'select-group' | 'select-subject' | 'view-students';

export default function RatingView() {
  const { selectedGroup } = useStore();
  
  // View state
  const [viewMode, setViewMode] = useState<ViewMode>('select-group');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Filters
  const [filters, setFilters] = useState<RatingFilters>({
    faculties: [],
    groups: [],
    years: [],
    semesters: [],
  });
  
  // Selections
  const [selectedFaculty, setSelectedFaculty] = useState('');
  const [selectedGroupForRating, setSelectedGroupForRating] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedSemester, setSelectedSemester] = useState('');
  
  // Data
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [students, setStudents] = useState<Student[]>([]);

  useEffect(() => {
    loadFilters();
  }, []);

  useEffect(() => {
    // Автовыбор группы из расписания
    if (filters.groups.length > 0 && selectedGroup && !selectedGroupForRating) {
      const groupOption = filters.groups.find(g => 
        g.label.toLowerCase().includes(selectedGroup.toLowerCase())
      );
      if (groupOption) {
        setSelectedGroupForRating(groupOption.value);
      }
    }
  }, [filters, selectedGroup]);

  async function loadFilters() {
    setLoading(true);
    try {
      const data = await fetchRatingFilters();
      setFilters(data);
      
      // Устанавливаем значения по умолчанию
      if (data.years.length > 0) setSelectedYear(data.years[0].value);
      if (data.semesters.length > 0) setSelectedSemester(data.semesters[0].value);
    } catch (e) {
      setError('Не удалось загрузить фильтры');
    }
    setLoading(false);
  }

  async function handleGroupSelect() {
    if (!selectedGroupForRating || !selectedSemester) {
      setError('Выберите группу и семестр');
      return;
    }
    
    setLoading(true);
    setError(null);
    try {
      const subs = await fetchSubjects(selectedGroupForRating, selectedSemester);
      setSubjects(subs);
      setViewMode('select-subject');
    } catch (e) {
      setError('Не удалось загрузить предметы');
    }
    setLoading(false);
  }

  async function handleSubjectSelect(subject: Subject) {
    setLoading(true);
    setError(null);
    setSelectedSubject(subject);
    
    try {
      const studs = await fetchStudentsBySubject(
        selectedGroupForRating, 
        selectedSemester, 
        subject.id
      );
      setStudents(studs);
      setViewMode('view-students');
    } catch (e) {
      setError('Не удалось загрузить студентов');
    }
    setLoading(false);
  }

  function goBack() {
    if (viewMode === 'view-students') {
      setViewMode('select-subject');
      setSelectedSubject(null);
      setStudents([]);
    } else if (viewMode === 'select-subject') {
      setViewMode('select-group');
      setSubjects([]);
    }
  }

  function handleRefresh() {
    if (viewMode === 'select-group') {
      loadFilters();
    } else if (viewMode === 'select-subject') {
      handleGroupSelect();
    } else if (viewMode === 'view-students' && selectedSubject) {
      handleSubjectSelect(selectedSubject);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-slate-900/80 backdrop-blur-md border-b border-white/10">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              {viewMode !== 'select-group' && (
                <button
                  onClick={goBack}
                  className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                >
                  <ArrowLeft className="w-5 h-5 text-white" />
                </button>
              )}
              <div>
                <h1 className="text-lg font-bold text-white flex items-center gap-2">
                  <Award className="w-5 h-5 text-yellow-400" />
                  Рейтинг студентов
                </h1>
                <p className="text-xs text-blue-300/70">
                  {viewMode === 'select-group' && 'Выберите группу'}
                  {viewMode === 'select-subject' && 'Выберите предмет'}
                  {viewMode === 'view-students' && selectedSubject?.name}
                </p>
              </div>
            </div>
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
            >
              <RefreshCw className={`w-5 h-5 text-blue-300 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-4">
        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-400/30 rounded-xl text-red-200 text-sm">
            {error}
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
            <span className="ml-3 text-blue-200">Загрузка...</span>
          </div>
        )}

        {/* View: Select Group */}
        {!loading && viewMode === 'select-group' && (
          <div className="space-y-4">
            {/* Faculty */}
            {filters.faculties.length > 0 && (
              <div>
                <label className="text-sm text-slate-300 mb-2 block font-medium">Факультет</label>
                <select
                  value={selectedFaculty}
                  onChange={(e) => setSelectedFaculty(e.target.value)}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-400/50"
                >
                  <option value="" className="bg-slate-800">Все факультеты</option>
                  {filters.faculties.map(f => (
                    <option key={f.value} value={f.value} className="bg-slate-800">{f.label}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Group */}
            <div>
              <label className="text-sm text-slate-300 mb-2 block font-medium">Группа *</label>
              <select
                value={selectedGroupForRating}
                onChange={(e) => setSelectedGroupForRating(e.target.value)}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-400/50"
                required
              >
                <option value="" className="bg-slate-800">Выберите группу</option>
                {filters.groups
                  .filter(g => !selectedFaculty || g.label.includes(selectedFaculty))
                  .map(g => (
                    <option key={g.value} value={g.value} className="bg-slate-800">{g.label}</option>
                  ))}
              </select>
            </div>

            {/* Year */}
            {filters.years.length > 0 && (
              <div>
                <label className="text-sm text-slate-300 mb-2 block font-medium">Учебный год</label>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-400/50"
                >
                  {filters.years.map(y => (
                    <option key={y.value} value={y.value} className="bg-slate-800">{y.label}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Semester */}
            <div>
              <label className="text-sm text-slate-300 mb-2 block font-medium">Семестр *</label>
              <select
                value={selectedSemester}
                onChange={(e) => setSelectedSemester(e.target.value)}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-400/50"
                required
              >
                {filters.semesters.map(s => (
                  <option key={s.value} value={s.value} className="bg-slate-800">{s.label}</option>
                ))}
              </select>
            </div>

            {/* Continue button */}
            <button
              onClick={handleGroupSelect}
              disabled={!selectedGroupForRating || !selectedSemester}
              className="w-full py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              Продолжить
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* View: Select Subject */}
        {!loading && viewMode === 'select-subject' && (
          <div className="space-y-2">
            <div className="mb-4 p-3 bg-blue-500/10 border border-blue-400/30 rounded-xl">
              <p className="text-blue-200 text-sm">
                <BookOpen className="w-4 h-4 inline mr-1" />
                Группа: {filters.groups.find(g => g.value === selectedGroupForRating)?.label}
              </p>
            </div>

            {subjects.length === 0 ? (
              <div className="text-center py-12">
                <BookOpen className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400">Предметы не найдены</p>
              </div>
            ) : (
              subjects.map(subject => (
                <button
                  key={subject.id}
                  onClick={() => handleSubjectSelect(subject)}
                  className="w-full p-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors text-left flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                      <BookOpen className="w-5 h-5 text-blue-400" />
                    </div>
                    <span className="text-white font-medium">{subject.name}</span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-blue-400 transition-colors" />
                </button>
              ))
            )}
          </div>
        )}

        {/* View: Students List */}
        {!loading && viewMode === 'view-students' && (
          <div>
            <div className="mb-4 p-3 bg-blue-500/10 border border-blue-400/30 rounded-xl">
              <p className="text-blue-200 text-sm">
                <BookOpen className="w-4 h-4 inline mr-1" />
                {selectedSubject?.name}
              </p>
            </div>

            {students.length === 0 ? (
              <div className="text-center py-12">
                <User className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400">Студенты не найдены</p>
              </div>
            ) : (
              <div className="space-y-2">
                {students
                  .sort((a, b) => b.rating - a.rating)
                  .map((student, idx) => (
                    <div
                      key={student.id}
                      className="p-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs text-slate-500 font-mono">#{idx + 1}</span>
                            <h3 className="text-white font-medium">{student.fullName}</h3>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-slate-400">
                            <span className="flex items-center gap-1">
                              <User className="w-3 h-3" />
                              Зачётка: {student.recordBook}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`text-2xl font-bold ${
                            student.rating >= 90 ? 'text-green-400' :
                            student.rating >= 75 ? 'text-blue-400' :
                            student.rating >= 60 ? 'text-yellow-400' :
                            'text-red-400'
                          }`}>
                            {student.rating}
                          </div>
                          {student.grade && (
                            <div className="text-xs text-slate-500">{student.grade}</div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
