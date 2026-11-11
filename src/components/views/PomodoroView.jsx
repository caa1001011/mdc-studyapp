import React, { useState, useEffect } from 'react';
import {
  Timer,
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  Volume2,
  VolumeX,
  Sparkles,
  Music,
  CheckCircle2,
  ListTodo
} from 'lucide-react';
import confetti from 'canvas-confetti';

const MODES = [
  { id: 'focus', label: 'Tập Trung', minutes: 25, color: 'purple' },
  { id: 'short', label: 'Nghỉ Ngắn', minutes: 5, color: 'emerald' },
  { id: 'long', label: 'Nghỉ Dài', minutes: 15, color: 'cyan' },
];

const SOUND_TRACKS = [
  { id: 'rain', name: 'Tiếng Mưa Rơi', desc: 'Tạo không gian yên tĩnh', icon: '🌧️' },
  { id: 'lofi', name: 'Nhạc Lo-Fi Êm Dịu', desc: 'Giai điệu nhẹ nhàng', icon: '☕' },
  { id: 'waves', name: 'Tiếng Sóng Biển', desc: 'Thư giãn đầu óc', icon: '🌊' },
  { id: 'forest', name: 'Tiếng Rừng Cây', desc: 'Gần gũi với thiên nhiên', icon: '🌲' },
];

export default function PomodoroView() {
  const [activeMode, setActiveMode] = useState(MODES[0]);
  const [secondsLeft, setSecondsLeft] = useState(MODES[0].minutes * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [sessionsCompleted, setSessionsCompleted] = useState(4);
  const [selectedSound, setSelectedSound] = useState(SOUND_TRACKS[0].id);
  const [isSoundPlaying, setIsSoundPlaying] = useState(false);

  // Session tasks state
  const [focusTasks, setFocusTasks] = useState([
    { id: 1, text: 'Giải 3 bài tập tích phân trong sách bài tập', done: true },
    { id: 2, text: 'Học 15 từ vựng Tiếng Anh bài 4', done: false },
    { id: 3, text: 'Làm đề kiểm tra 15 phút môn Vật Lý', done: false },
  ]);

  // Timer Tick
  useEffect(() => {
    let interval = null;
    if (isRunning && secondsLeft > 0) {
      interval = setInterval(() => {
        setSecondsLeft((prev) => prev - 1);
      }, 1000);
    } else if (secondsLeft === 0 && isRunning) {
      setIsRunning(false);
      setSessionsCompleted((prev) => prev + 1);
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    }
    return () => clearInterval(interval);
  }, [isRunning, secondsLeft]);

  const handleModeChange = (mode) => {
    setActiveMode(mode);
    setSecondsLeft(mode.minutes * 60);
    setIsRunning(false);
  };

  const handleReset = () => {
    setSecondsLeft(activeMode.minutes * 60);
    setIsRunning(false);
  };

  const toggleTask = (id) => {
    setFocusTasks(
      focusTasks.map((t) => (t.id === id ? { ...t, done: !t.done } : t))
    );
  };

  const totalSeconds = activeMode.minutes * 60;
  const progressPercent = ((totalSeconds - secondsLeft) / totalSeconds) * 100;
  const radius = 145;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference;

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const timeFormatted = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  return (
    <div className="space-y-6 md:space-y-8 pb-10">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/15 border border-purple-500/30 text-purple-300 text-xs font-semibold mb-2">
            <Timer className="w-3.5 h-3.5 text-purple-300" />
            <span>Phương Pháp Quản Lý Thời Gian Pomodoro</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-display tracking-tight text-white">
            Đồng Hồ Pomodoro
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">
            Học tập trung 25 phút, nghỉ ngắn 5 phút giúp học bài lâu mà không bị mệt mỏi
          </p>
        </div>

        {/* Mode Selector */}
        <div className="flex items-center gap-2 p-1 rounded-2xl bg-white/[0.04] border border-white/10">
          {MODES.map((m) => (
            <button
              key={m.id}
              onClick={() => handleModeChange(m)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeMode.id === m.id
                  ? 'bg-purple-600/35 text-white border border-purple-400/50 shadow-md shadow-purple-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {m.label} ({m.minutes}p)
            </button>
          ))}
        </div>
      </div>

      {/* 2. Desktop 3-Column Focus Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Left (1 col): Tasks */}
        <div className="rounded-3xl glass-card p-6 border border-white/10 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ListTodo className="w-4 h-4 text-purple-400" />
              <h3 className="text-sm font-bold font-display text-white">Mục Tiêu Phiên Này</h3>
            </div>
            <span className="text-[10px] text-purple-300 font-mono">
              {focusTasks.filter((t) => t.done).length}/{focusTasks.length} xong
            </span>
          </div>

          <p className="text-xs text-slate-400">
            Chọn 1 việc cần làm và tập trung giải quyết xong trong phiên này.
          </p>

          <div className="space-y-2.5 pt-1">
            {focusTasks.map((t) => (
              <div
                key={t.id}
                onClick={() => toggleTask(t.id)}
                className={`p-3 rounded-2xl border cursor-pointer transition-all flex items-start gap-3 ${
                  t.done
                    ? 'bg-white/[0.02] border-white/5 opacity-60'
                    : 'bg-white/[0.04] border-white/10 hover:border-purple-400/30'
                }`}
              >
                <div className="mt-0.5 text-purple-400">
                  {t.done ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 fill-emerald-400/20" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border border-slate-500" />
                  )}
                </div>
                <span className={`text-xs ${t.done ? 'line-through text-slate-400' : 'text-slate-200'}`}>
                  {t.text}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Center (2 cols): Clock */}
        <div className="lg:col-span-2 rounded-3xl glass-card p-8 border border-purple-500/25 flex flex-col items-center justify-center relative overflow-hidden">
          <div
            className={`absolute w-80 h-80 rounded-full blur-[90px] transition-all duration-1000 ${
              isRunning
                ? 'bg-gradient-to-tr from-purple-600 via-pink-600 to-cyan-500 opacity-60 animate-pulse'
                : 'bg-purple-900/30 opacity-40'
            }`}
          />

          <div className="relative w-[340px] h-[340px] flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90 drop-shadow-2xl">
              <circle
                cx="50%"
                cy="50%"
                r={radius}
                stroke="rgba(255, 255, 255, 0.05)"
                strokeWidth="10"
                fill="transparent"
              />
              <circle
                cx="50%"
                cy="50%"
                r={radius}
                stroke="url(#auraStudioGradient)"
                strokeWidth="10"
                fill="transparent"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                className="transition-all duration-1000"
              />
              <defs>
                <linearGradient id="auraStudioGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#c084fc" />
                  <stop offset="50%" stopColor="#818cf8" />
                  <stop offset="100%" stopColor="#38bdf8" />
                </linearGradient>
              </defs>
            </svg>

            {/* Inner Content */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 select-none">
              <span className="text-xs font-bold uppercase tracking-widest text-purple-300 font-display">
                {isRunning ? 'Đang Tập Trung Học' : 'Sẵn Sàng'}
              </span>

              <div className="text-6xl font-black font-display tracking-tight text-white shimmer-text my-2">
                {timeFormatted}
              </div>

              <p className="text-xs text-slate-300 max-w-[220px] truncate">
                {focusTasks[0].text}
              </p>

              <div className="mt-3 flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.05] border border-white/10 text-[10px] text-purple-200">
                <Sparkles className="w-3 h-3 text-amber-400" />
                <span>Đã học {sessionsCompleted} phiên hôm nay</span>
              </div>
            </div>
          </div>

          {/* Desktop Controls */}
          <div className="flex items-center gap-5 mt-6 z-10">
            <button
              onClick={handleReset}
              className="w-12 h-12 rounded-2xl glass-button flex items-center justify-center text-slate-400 hover:text-white transition-all"
              title="Đặt lại phiên"
            >
              <RotateCcw className="w-5 h-5" />
            </button>

            <button
              onClick={() => setIsRunning(!isRunning)}
              className="px-10 py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-500 text-white font-bold text-sm shadow-xl shadow-purple-600/40 hover:scale-105 active:scale-95 transition-all flex items-center gap-2.5"
            >
              {isRunning ? (
                <>
                  <Pause className="w-4 h-4 fill-white" />
                  <span>Tạm Dừng</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-white" />
                  <span>Bắt Đầu Học</span>
                </>
              )}
            </button>

            <button
              onClick={() => {
                setSecondsLeft(0);
              }}
              className="w-12 h-12 rounded-2xl glass-button flex items-center justify-center text-slate-400 hover:text-white transition-all"
              title="Hoàn thành phiên"
            >
              <SkipForward className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Right (1 col): Sound player */}
        <div className="rounded-3xl glass-card p-6 border border-white/10 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Music className="w-4 h-4 text-purple-400" />
              <h3 className="text-sm font-bold font-display text-white">Nhạc Nền Học Bài</h3>
            </div>

            <button
              onClick={() => setIsSoundPlaying(!isSoundPlaying)}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold transition-all ${
                isSoundPlaying
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'glass-button text-slate-400 hover:text-white'
              }`}
            >
              {isSoundPlaying ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
              <span>{isSoundPlaying ? 'Bật' : 'Tắt'}</span>
            </button>
          </div>

          <div className="space-y-2.5">
            {SOUND_TRACKS.map((t) => (
              <div
                key={t.id}
                onClick={() => {
                  setSelectedSound(t.id);
                  setIsSoundPlaying(true);
                }}
                className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                  selectedSound === t.id
                    ? 'border-purple-400/50 bg-purple-500/15 text-white shadow-md'
                    : 'border-white/10 bg-white/[0.03] text-slate-400 hover:border-white/20'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-base">{t.icon}</span>
                  <div>
                    <div className="text-xs font-bold text-white">{t.name}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">{t.desc}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
