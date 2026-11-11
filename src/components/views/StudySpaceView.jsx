import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  CheckCircle2,
  Circle,
  Plus,
  Clock,
  Sparkles,
  Calculator,
  Atom,
  Languages,
  FlaskConical,
  FileEdit
} from 'lucide-react';
import { STUDY_SUBJECTS, HOMEWORK_TASKS } from '../../data/mockData';

const ICONS_MAP = {
  Calculator: Calculator,
  Atom: Atom,
  Languages: Languages,
  FlaskConical: FlaskConical,
};

export default function StudySpaceView() {
  const [tasks, setTasks] = useState(() => {
    const local = localStorage.getItem('lumina_homework_tasks');
    return local ? JSON.parse(local) : HOMEWORK_TASKS;
  });
  const [filterPriority, setFilterPriority] = useState('all');
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskSubject, setNewTaskSubject] = useState('Toán Học');
  const [notesContent, setNotesContent] = useState(
    "1. Công thức Toán: Đạo hàm của hàm hợp luôn nhân thêm u'(x)\n2. Vật Lý: Chu kỳ T con lắc đơn tỉ lệ thuận với căn bậc 2 của chiều dài dây l\n3. Tiếng Anh: Nhớ ôn kỹ 30 từ vựng chủ đề Môi trường cho bài kiểm tra tuần này"
  );

  // Lưu danh sách bài tập vào localStorage khi có thay đổi
  useEffect(() => {
    localStorage.setItem('lumina_homework_tasks', JSON.stringify(tasks));
  }, [tasks]);

  const toggleTask = (id) => {
    setTasks(
      tasks.map((t) => (t.id === id ? { ...t, isDone: !t.isDone } : t))
    );
  };

  const handleAddTask = (e) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    const newTask = {
      id: `task-${Date.now()}`,
      title: newTaskTitle,
      subject: newTaskSubject,
      dueDate: 'Hôm nay',
      priority: 'high',
      isDone: false,
    };

    setTasks([newTask, ...tasks]);
    setNewTaskTitle('');
  };

  const filteredTasks = tasks.filter((t) => {
    if (filterPriority === 'all') return true;
    if (filterPriority === 'pending') return !t.isDone;
    if (filterPriority === 'done') return t.isDone;
    return true;
  });

  return (
    <div className="space-y-6 md:space-y-8 pb-10">
      {/* 1. Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold mb-2">
          <BookOpen className="w-3.5 h-3.5 text-emerald-300" />
          <span>Góc Môn Học & Bài Tập Về Nhà</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold font-display tracking-tight text-white">
          Môn Học & Bài Tập
        </h1>
        <p className="text-xs sm:text-sm text-slate-300 mt-1">
          Theo dõi tiến độ học từng môn và danh sách bài tập cần hoàn thành
        </p>
      </div>

      {/* 2. Subjects Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {STUDY_SUBJECTS.map((sub) => {
          const SubIcon = ICONS_MAP[sub.icon] || BookOpen;

          return (
            <div
              key={sub.id}
              className="relative overflow-hidden rounded-3xl glass-card p-5 border border-white/10 group hover:border-purple-400/40"
            >
              <div className="flex items-center justify-between">
                <div className="p-3 rounded-2xl bg-white/[0.05] border border-white/10 text-purple-300 group-hover:scale-110 transition-transform">
                  <SubIcon className="w-5 h-5" />
                </div>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-white/[0.05] text-slate-300 border border-white/10">
                  {sub.code}
                </span>
              </div>

              <div className="mt-4">
                <h3 className="text-base font-bold font-display text-white group-hover:text-purple-300 transition-colors">
                  {sub.name}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Đã học {sub.totalHours} giờ • {sub.tasks} bài tập
                </p>
              </div>

              {/* Progress */}
              <div className="mt-4">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-slate-400 font-medium">Tiến độ bài học</span>
                  <span className="text-purple-300 font-bold">{sub.progress}%</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-purple-500 to-indigo-400 rounded-full"
                    style={{ width: `${sub.progress}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 3. Homework Checklist & Notes Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Homework Checklist (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h2 className="text-lg md:text-xl font-bold font-display text-white flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <span>Bài Tập Về Nhà</span>
            </h2>

            {/* Filter buttons */}
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-white/[0.04] border border-white/10">
              <button
                onClick={() => setFilterPriority('all')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                  filterPriority === 'all'
                    ? 'bg-purple-600/30 text-white border border-purple-400/40'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Tất cả ({tasks.length})
              </button>
              <button
                onClick={() => setFilterPriority('pending')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                  filterPriority === 'pending'
                    ? 'bg-purple-600/30 text-white border border-purple-400/40'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Chưa xong ({tasks.filter((t) => !t.isDone).length})
              </button>
              <button
                onClick={() => setFilterPriority('done')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                  filterPriority === 'done'
                    ? 'bg-purple-600/30 text-white border border-purple-400/40'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Đã xong ({tasks.filter((t) => t.isDone).length})
              </button>
            </div>
          </div>

          {/* Quick Add Task Input */}
          <form onSubmit={handleAddTask} className="flex gap-2">
            <input
              type="text"
              placeholder="Thêm bài tập mới cần làm... (Nhấn Enter để lưu)"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              className="flex-1 px-4 py-3 rounded-2xl bg-white/[0.04] border border-white/10 text-white text-xs sm:text-sm placeholder-slate-500 focus:outline-none focus:border-purple-400"
            />
            <button
              type="submit"
              className="px-5 py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-xs sm:text-sm font-semibold flex items-center gap-1.5 shadow-lg shadow-purple-600/30 hover:scale-[1.02] transition-all flex-shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Thêm Bài</span>
            </button>
          </form>

          {/* Task List */}
          <div className="space-y-2.5">
            {filteredTasks.map((task) => (
              <div
                key={task.id}
                onClick={() => toggleTask(task.id)}
                className={`p-4 rounded-2xl glass-card border cursor-pointer transition-all flex items-center justify-between gap-4 ${
                  task.isDone
                    ? 'border-white/5 opacity-60 bg-white/[0.02]'
                    : 'border-white/10 hover:border-purple-400/40'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <button className="text-purple-400 focus:outline-none flex-shrink-0">
                    {task.isDone ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 fill-emerald-400/20" />
                    ) : (
                      <Circle className="w-5 h-5 text-slate-500 hover:text-purple-300" />
                    )}
                  </button>

                  <div>
                    <h4
                      className={`text-xs sm:text-sm font-semibold ${
                        task.isDone ? 'line-through text-slate-400' : 'text-white'
                      }`}
                    >
                      {task.title}
                    </h4>

                    <div className="mt-1 flex items-center gap-3 text-[11px] text-slate-400">
                      <span className="text-purple-300 font-medium">#{task.subject}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1 text-slate-400">
                        <Clock className="w-3 h-3 text-amber-400" />
                        {task.dueDate}
                      </span>
                    </div>
                  </div>
                </div>

                <span
                  className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                    task.priority === 'high'
                      ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                      : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  }`}
                >
                  {task.priority === 'high' ? 'Gấp' : 'Bình thường'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Notes Pad (1 col) */}
        <div className="space-y-4">
          <h2 className="text-lg md:text-xl font-bold font-display text-white flex items-center gap-2">
            <FileEdit className="w-5 h-5 text-purple-400" />
            <span>Sổ Ghi Chú Nhanh</span>
          </h2>

          <div className="p-5 rounded-3xl glass-card border border-white/10 space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-400 pb-2 border-b border-white/10">
              <span className="flex items-center gap-1.5 text-purple-300 font-medium">
                <Sparkles className="w-3.5 h-3.5" />
                Tự động lưu
              </span>
              <span>Ghi chú cá nhân</span>
            </div>

            <textarea
              rows={9}
              value={notesContent}
              onChange={(e) => setNotesContent(e.target.value)}
              placeholder="Ghi chú công thức cần nhớ, bài tập giáo viên dặn..."
              className="w-full bg-transparent resize-none text-xs sm:text-sm text-slate-200 leading-relaxed placeholder-slate-500 focus:outline-none"
            />

            <div className="pt-2 border-t border-white/10 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">Nhấn để sao chép</span>
              <button
                onClick={() => alert('Đã sao chép ghi chú!')}
                className="px-3 py-1.5 rounded-xl glass-button text-xs font-semibold text-purple-300 hover:text-white"
              >
                Sao Chép
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
