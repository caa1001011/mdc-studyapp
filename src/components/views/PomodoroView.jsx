import React, { useState, useEffect } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  Sparkles,
  CheckCircle2,
  ListTodo,
  Plus,
  Pencil,
  Trash2,
  Check,
  X
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { getSessionUser } from '../../services/authService';

const CYCLE_PRESETS = [
  { id: '25-5', label: '25p / 5p', focus: 25, breakTime: 5 },
  { id: '50-10', label: '50p / 10p', focus: 50, breakTime: 10 },
];

function getTodayKey(username) {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `lumina_pomodoro_sessions_${username}_${y}-${m}-${d}`;
}

export default function PomodoroView() {
  const sessionUser = getSessionUser();
  const username = sessionUser?.username || 'student';

  // Chu kỳ học / nghỉ (mặc định 25p học - 5p nghỉ)
  const [focusMinutes, setFocusMinutes] = useState(25);
  const [breakMinutes, setBreakMinutes] = useState(5);
  const [phase, setPhase] = useState('focus'); // 'focus' | 'break'
  const [secondsLeft, setSecondsLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);

  // Số phiên học hôm nay
  const [sessionsCompleted, setSessionsCompleted] = useState(() => {
    const saved = localStorage.getItem(getTodayKey(username));
    return saved ? Math.max(0, parseInt(saved, 10) || 0) : 0;
  });

  // Mục tiêu phiên này (người học tự thêm / sửa / xóa)
  const [focusTasks, setFocusTasks] = useState(() => {
    const saved = localStorage.getItem(`lumina_pomodoro_tasks_${username}`);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return [];
      }
    }
    return [];
  });
  const [newTaskText, setNewTaskText] = useState('');
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [editingTaskText, setEditingTaskText] = useState('');

  useEffect(() => {
    localStorage.setItem(getTodayKey(username), String(sessionsCompleted));
  }, [sessionsCompleted, username]);

  useEffect(() => {
    localStorage.setItem(`lumina_pomodoro_tasks_${username}`, JSON.stringify(focusTasks));
  }, [focusTasks, username]);

  const completeCurrentSession = (currentPhase) => {
    setIsRunning(false);
    if (currentPhase === 'focus') {
      setSessionsCompleted((prev) => prev + 1);
      confetti({
        particleCount: 70,
        spread: 65,
        origin: { y: 0.6 },
      });
    }
  };

  // Timer Tick
  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          completeCurrentSession(phase);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isRunning, phase]);

  const handlePhaseChange = (nextPhase) => {
    setPhase(nextPhase);
    setIsRunning(false);
    setSecondsLeft((nextPhase === 'focus' ? focusMinutes : breakMinutes) * 60);
  };

  const handleApplyCycle = (nextFocus, nextBreak) => {
    const safeFocus = Math.max(1, Math.min(180, Number(nextFocus) || 25));
    const safeBreak = Math.max(1, Math.min(60, Number(nextBreak) || 5));
    setFocusMinutes(safeFocus);
    setBreakMinutes(safeBreak);
    setIsRunning(false);
    setSecondsLeft((phase === 'focus' ? safeFocus : safeBreak) * 60);
  };

  const handleReset = () => {
    setIsRunning(false);
    setSecondsLeft((phase === 'focus' ? focusMinutes : breakMinutes) * 60);
  };

  const handleSkip = () => {
    setSecondsLeft(0);
    completeCurrentSession(phase);
  };

  // Task CRUD
  const handleAddTask = (e) => {
    e.preventDefault();
    const trimmed = newTaskText.trim();
    if (!trimmed) return;
    setFocusTasks((prev) => [
      ...prev,
      { id: `task-${Date.now()}`, text: trimmed, done: false },
    ]);
    setNewTaskText('');
  };

  const toggleTask = (id) => {
    if (editingTaskId === id) return;
    setFocusTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t))
    );
  };

  const startEditTask = (task, e) => {
    e.stopPropagation();
    setEditingTaskId(task.id);
    setEditingTaskText(task.text);
  };

  const saveEditTask = (id, e) => {
    e?.stopPropagation();
    const trimmed = editingTaskText.trim();
    if (!trimmed) return;
    setFocusTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, text: trimmed } : t))
    );
    setEditingTaskId(null);
    setEditingTaskText('');
  };

  const deleteTask = (id, e) => {
    e.stopPropagation();
    setFocusTasks((prev) => prev.filter((t) => t.id !== id));
    if (editingTaskId === id) {
      setEditingTaskId(null);
    }
  };

  const totalSeconds = Math.max(1, (phase === 'focus' ? focusMinutes : breakMinutes) * 60);
  const progressPercent = ((totalSeconds - secondsLeft) / totalSeconds) * 100;
  const radius = 94;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference;

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const timeFormatted = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  return (
    <div className="space-y-5 pb-10">
      {/* 1. Header: Chỉ giữ lại dòng "Đồng hồ Pomodoro" */}
      <h1 className="text-2xl sm:text-3xl font-extrabold font-display tracking-tight text-white">
        Đồng hồ Pomodoro
      </h1>

      {/* 2. Compact 2-Column Focus Layout (Mục tiêu phiên này + Đồng hồ thu gọn) */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5 items-start">
        {/* Left (2 cols): Mục Tiêu Phiên Này (có thể chỉnh sửa tùy người học) */}
        <div className="lg:col-span-2 rounded-2xl glass-card p-5 border border-white/10 space-y-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ListTodo className="w-4 h-4 text-purple-400" />
              <h3 className="text-sm font-bold font-display text-white">Mục Tiêu Phiên Này</h3>
            </div>
            <span className="text-[11px] text-purple-300 font-mono">
              {focusTasks.filter((t) => t.done).length}/{focusTasks.length} xong
            </span>
          </div>

          <form onSubmit={handleAddTask} className="flex items-center gap-2">
            <input
              type="text"
              value={newTaskText}
              onChange={(e) => setNewTaskText(e.target.value)}
              placeholder="Thêm mục tiêu cho phiên học..."
              className="flex-1 min-w-0 px-3 py-2 rounded-xl bg-white/[0.05] border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-400"
            />
            <button
              type="submit"
              disabled={!newTaskText.trim()}
              className="p-2 rounded-xl bg-purple-600/40 border border-purple-400/40 text-white hover:bg-purple-600/60 disabled:opacity-40 cursor-pointer shrink-0"
              title="Thêm mục tiêu"
            >
              <Plus className="w-4 h-4" />
            </button>
          </form>

          {focusTasks.length === 0 ? (
            <div className="py-6 text-center text-xs text-slate-400 border border-dashed border-white/10 rounded-xl">
              Chưa có mục tiêu nào. Hãy thêm việc cần làm ở trên.
            </div>
          ) : (
            <div className="space-y-2">
              {focusTasks.map((t) => {
                const isEditing = editingTaskId === t.id;
                return (
                  <div
                    key={t.id}
                    onClick={() => toggleTask(t.id)}
                    className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between gap-2 group ${
                      t.done
                        ? 'bg-white/[0.02] border-white/5 opacity-65'
                        : 'bg-white/[0.04] border-white/10 hover:border-purple-400/30'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <div className="shrink-0 text-purple-400">
                        {t.done ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 fill-emerald-400/20" />
                        ) : (
                          <div className="w-4 h-4 rounded-full border border-slate-500" />
                        )}
                      </div>

                      {isEditing ? (
                        <input
                          type="text"
                          value={editingTaskText}
                          onChange={(e) => setEditingTaskText(e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              saveEditTask(t.id);
                            } else if (e.key === 'Escape') {
                              setEditingTaskId(null);
                            }
                          }}
                          autoFocus
                          className="w-full px-2 py-1 rounded-lg bg-white/10 border border-purple-400/50 text-xs text-white focus:outline-none"
                        />
                      ) : (
                        <span className={`text-xs truncate ${t.done ? 'line-through text-slate-400' : 'text-slate-200'}`}>
                          {t.text}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {isEditing ? (
                        <>
                          <button
                            type="button"
                            onClick={(e) => saveEditTask(t.id, e)}
                            className="p-1 rounded-lg text-emerald-400 hover:bg-emerald-500/20 cursor-pointer"
                            title="Lưu"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingTaskId(null);
                            }}
                            className="p-1 rounded-lg text-slate-400 hover:bg-white/10 cursor-pointer"
                            title="Hủy"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={(e) => startEditTask(t, e)}
                            className="p-1 rounded-lg text-slate-400 hover:text-amber-300 hover:bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                            title="Chỉnh sửa"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => deleteTask(t.id, e)}
                            className="p-1 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                            title="Xóa"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right (3 cols): Khung Đồng Hồ Thu Gọn */}
        <div className="lg:col-span-3 rounded-2xl glass-card p-5 sm:p-6 border border-purple-500/25 flex flex-col items-center justify-center relative overflow-hidden space-y-4">
          {/* Điều chỉnh chu kỳ thời gian học / nghỉ & chuyển trạng thái */}
          <div className="w-full flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-white/10 z-10">
            {/* Chuyển Học / Nghỉ */}
            <div className="flex items-center gap-1 p-1 rounded-xl bg-white/[0.04] border border-white/10">
              <button
                type="button"
                onClick={() => handlePhaseChange('focus')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  phase === 'focus'
                    ? 'bg-purple-600/40 text-white border border-purple-400/50'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Học ({focusMinutes}p)
              </button>
              <button
                type="button"
                onClick={() => handlePhaseChange('break')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  phase === 'break'
                    ? 'bg-emerald-600/40 text-white border border-emerald-400/50'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Nghỉ ({breakMinutes}p)
              </button>
            </div>

            {/* Preset + Tùy chỉnh chu kỳ */}
            <div className="flex flex-wrap items-center gap-1.5">
              {CYCLE_PRESETS.map((preset) => {
                const isActivePreset =
                  focusMinutes === preset.focus && breakMinutes === preset.breakTime;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleApplyCycle(preset.focus, preset.breakTime)}
                    className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border transition-all cursor-pointer ${
                      isActivePreset
                        ? 'bg-purple-500/25 border-purple-400/50 text-purple-200'
                        : 'bg-white/[0.03] border-white/10 text-slate-400 hover:text-white'
                    }`}
                  >
                    {preset.label}
                  </button>
                );
              })}

              <div className="flex items-center gap-1 text-[11px] text-slate-300 bg-white/[0.04] border border-white/10 rounded-lg px-2 py-1">
                <span>Học</span>
                <input
                  type="number"
                  min={1}
                  max={180}
                  value={focusMinutes}
                  onChange={(e) => handleApplyCycle(e.target.value, breakMinutes)}
                  className="w-10 bg-transparent text-center font-mono font-bold text-white focus:outline-none"
                  title="Số phút học"
                />
                <span className="text-slate-500">/</span>
                <span>Nghỉ</span>
                <input
                  type="number"
                  min={1}
                  max={60}
                  value={breakMinutes}
                  onChange={(e) => handleApplyCycle(focusMinutes, e.target.value)}
                  className="w-9 bg-transparent text-center font-mono font-bold text-emerald-300 focus:outline-none"
                  title="Số phút nghỉ"
                />
              </div>
            </div>
          </div>

          {/* Đồng hồ đếm ngược thu gọn */}
          <div className="relative w-[220px] h-[220px] flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90 drop-shadow-xl">
              <circle
                cx="50%"
                cy="50%"
                r={radius}
                stroke="rgba(255, 255, 255, 0.06)"
                strokeWidth="8"
                fill="transparent"
              />
              <circle
                cx="50%"
                cy="50%"
                r={radius}
                stroke="url(#auraStudioGradient)"
                strokeWidth="8"
                fill="transparent"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                className="transition-all duration-700"
              />
              <defs>
                <linearGradient id="auraStudioGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#c084fc" />
                  <stop offset="50%" stopColor="#818cf8" />
                  <stop offset="100%" stopColor="#38bdf8" />
                </linearGradient>
              </defs>
            </svg>

            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4 select-none">
              <span className="text-[11px] font-bold uppercase tracking-widest text-purple-300 font-display">
                {isRunning ? (phase === 'focus' ? 'Đang Học' : 'Đang Nghỉ') : 'Sẵn Sàng'}
              </span>

              <div className="text-4xl sm:text-5xl font-black font-display tracking-tight text-white shimmer-text my-1.5">
                {timeFormatted}
              </div>

              <div className="mt-1 flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/[0.05] border border-white/10 text-[10px] text-purple-200">
                <Sparkles className="w-3 h-3 text-amber-400" />
                <span>Đã học {sessionsCompleted} phiên hôm nay</span>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-3 z-10">
            <button
              type="button"
              onClick={handleReset}
              className="w-10 h-10 rounded-xl glass-button flex items-center justify-center text-slate-400 hover:text-white transition-all cursor-pointer"
              title="Đặt lại"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => setIsRunning(!isRunning)}
              className="px-7 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-purple-600/35 hover:scale-[1.03] active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
            >
              {isRunning ? (
                <>
                  <Pause className="w-4 h-4 fill-white" />
                  <span>Tạm Dừng</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-white" />
                  <span>Bắt Đầu</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleSkip}
              className="w-10 h-10 rounded-xl glass-button flex items-center justify-center text-slate-400 hover:text-white transition-all cursor-pointer"
              title="Hoàn thành phiên"
            >
              <SkipForward className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
