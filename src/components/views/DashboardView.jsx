import React, { useState } from 'react';
import {
  Sparkles,
  Flame,
  Clock,
  CheckCircle2,
  ChevronRight,
  Play,
  Pause,
  Layers,
  Calendar,
  Brain,
  ArrowUpRight,
  TrendingUp,
  Circle,
  Crown,
  Timer,
  Users
} from 'lucide-react';
import {
  USER_PROFILE,
  DAILY_MOTIVATION,
  TIMETABLE_DATA,
  FLASHCARD_DECKS,
  HOMEWORK_TASKS,
  LEADERBOARD_USERS
} from '../../data/mockData';

export default function DashboardView({ setActiveTab, currentUser }) {
  const [tasks, setTasks] = useState(HOMEWORK_TASKS);
  const [isQuickPomoRunning, setIsQuickPomoRunning] = useState(false);
  const [quickPomoSeconds, setQuickPomoSeconds] = useState(25 * 60);

  const displayName = currentUser?.fullName || currentUser?.username || USER_PROFILE.name;
  const isAdmin = currentUser?.role === 'admin';

  const todayClasses = TIMETABLE_DATA.filter((item) => item.dayIndex === 1);

  const toggleTask = (id) => {
    setTasks(
      tasks.map((t) => (t.id === id ? { ...t, isDone: !t.isDone } : t))
    );
  };

  const formatPomoTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6 md:space-y-8">
      {/* 1. Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl glass-card p-8 border border-white/15">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-purple-500/25 via-pink-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 left-10 w-72 h-72 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col xl:flex-row xl:items-center justify-between gap-6">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/15 border border-purple-500/30 text-purple-300 text-xs font-semibold mb-3">
              <Sparkles className="w-3.5 h-3.5 text-purple-300" />
              <span>Góc học tập & Luyện thi THPT</span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold font-display tracking-tight text-white leading-tight">
              Chào mừng trở lại, <span className="shimmer-text">{displayName}</span> ✨
            </h1>

            <p className="mt-2.5 text-sm sm:text-base text-slate-300 italic leading-relaxed font-light">
              "{DAILY_MOTIVATION.quote}"
            </p>
            <span className="block mt-1 text-xs text-purple-300 font-semibold tracking-wide">
              — {DAILY_MOTIVATION.author}
            </span>
          </div>

          {/* Quick Buttons */}
          <div className="flex items-center gap-3 flex-wrap">
            {isAdmin && (
              <button
                onClick={() => setActiveTab('users')}
                className="flex items-center gap-2.5 px-5 py-3.5 rounded-2xl glass-button text-amber-300 hover:text-amber-200 border border-amber-500/40 font-bold text-sm transition-all"
              >
                <Users className="w-4 h-4 text-amber-400" />
                <span>Quản Lý Tài Khoản</span>
              </button>
            )}

            <button
              onClick={() => setActiveTab('pomodoro')}
              className="flex items-center gap-2.5 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-500 text-white font-bold text-sm shadow-xl shadow-purple-600/35 hover:scale-[1.02] transition-all"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>Bật Pomodoro 25p</span>
            </button>

            <button
              onClick={() => setActiveTab('flashcards')}
              className="flex items-center gap-2.5 px-6 py-3.5 rounded-2xl glass-button text-slate-200 hover:text-white font-semibold text-sm transition-all"
            >
              <Layers className="w-4 h-4 text-purple-300" />
              <span>Ôn Thẻ Ghi Nhớ</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Key Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {/* Metric 1: Streak */}
        <div className="relative overflow-hidden rounded-3xl glass-card p-5 border border-amber-500/20 group hover:border-amber-500/50 transition-all">
          <div className="absolute top-0 right-0 w-28 h-28 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Chuỗi Ngày Học Tập</span>
            <div className="p-2.5 rounded-2xl bg-amber-500/15 text-amber-300 border border-amber-500/30">
              <Flame className="w-5 h-5 text-amber-400" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold font-display text-white tracking-tight">
              {USER_PROFILE.streakDays}
            </span>
            <span className="text-xs text-amber-400 font-bold uppercase tracking-wider">Ngày liên tục 🔥</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-400">Duy trì thói quen học mỗi ngày</p>
        </div>

        {/* Metric 2: Today Focus Time */}
        <div className="relative overflow-hidden rounded-3xl glass-card p-5 border border-purple-500/20 group hover:border-purple-500/50 transition-all">
          <div className="absolute top-0 right-0 w-28 h-28 bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Thời Gian Tự Học Hôm Nay</span>
            <div className="p-2.5 rounded-2xl bg-purple-500/15 text-purple-300 border border-purple-500/30">
              <Clock className="w-5 h-5 text-purple-400" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold font-display text-white tracking-tight">
              {USER_PROFILE.todayStudyMinutes}
            </span>
            <span className="text-xs text-purple-300 font-semibold">/ {USER_PROFILE.dailyGoalMinutes} phút (75%)</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-400">Còn 45 phút để hoàn thành chỉ tiêu</p>
        </div>

        {/* Metric 3: Experience XP */}
        <div className="relative overflow-hidden rounded-3xl glass-card p-5 border border-cyan-500/20 group hover:border-cyan-500/50 transition-all">
          <div className="absolute top-0 right-0 w-28 h-28 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Điểm Tích Lũy</span>
            <div className="p-2.5 rounded-2xl bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
              <TrendingUp className="w-5 h-5 text-cyan-400" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold font-display text-white tracking-tight">
              {USER_PROFILE.xp.toLocaleString()}
            </span>
            <span className="text-xs text-cyan-300 font-bold">XP (Hạng 2 tuần)</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-400">Tích lũy từ Pomodoro và làm bài tập</p>
        </div>

        {/* Metric 4: Tasks Done */}
        <div className="relative overflow-hidden rounded-3xl glass-card p-5 border border-emerald-500/20 group hover:border-emerald-500/50 transition-all">
          <div className="absolute top-0 right-0 w-28 h-28 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Bài Tập Đã Xong</span>
            <div className="p-2.5 rounded-2xl bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold font-display text-white tracking-tight">
              {tasks.filter((t) => t.isDone).length}
            </span>
            <span className="text-xs text-emerald-300 font-semibold">/ {tasks.length} bài tập</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-400">2 bài có hạn nộp hôm nay</p>
        </div>
      </div>

      {/* 3. Main Desktop Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Schedule & Tasks */}
        <div className="lg:col-span-2 space-y-6">
          {/* Today's Timetable Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-purple-500/15 text-purple-300 border border-purple-500/30">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-xl font-bold font-display text-white">
                    Thời Khóa Biểu Hôm Nay
                  </h2>
                  <p className="text-xs text-slate-400">Lịch học trên lớp và ca học thêm</p>
                </div>
              </div>

              <button
                onClick={() => setActiveTab('timetable')}
                className="text-xs font-bold text-purple-400 hover:text-purple-300 flex items-center gap-1.5 transition-colors"
              >
                <span>Xem thời khóa biểu cả tuần</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              {todayClasses.map((item) => (
                <div
                  key={item.id}
                  className="relative overflow-hidden rounded-2xl glass-card p-5 border border-white/10 hover:border-purple-400/40 transition-all flex items-center justify-between gap-5 group"
                >
                  <div className="flex items-center gap-5">
                    {/* Time block */}
                    <div className="p-3 rounded-2xl bg-white/[0.04] border border-white/10 text-center min-w-[110px]">
                      <span className="text-sm font-extrabold text-white font-display block">
                        {item.time.split(' - ')[0]}
                      </span>
                      <span className="text-[11px] text-purple-300 block">
                        đến {item.time.split(' - ')[1]}
                      </span>
                      <span className="text-[10px] text-slate-400 block mt-1 px-1.5 py-0.5 rounded bg-white/[0.04]">
                        {item.period}
                      </span>
                    </div>

                    {/* Details */}
                    <div>
                      <div className="flex items-center gap-2.5">
                        <h3 className="text-base font-bold text-white font-display group-hover:text-purple-300 transition-colors">
                          {item.subject}
                        </h3>
                        <span className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full border ${item.badgeColor}`}>
                          {item.status === 'completed' && '✓ Đã xong'}
                          {item.status === 'ongoing' && '● Đang học'}
                          {item.status === 'upcoming' && '○ Sắp tới'}
                        </span>
                      </div>

                      <div className="mt-2 flex items-center gap-4 text-xs text-slate-300">
                        <span>Phòng: <strong className="text-white">{item.room}</strong></span>
                        <span>•</span>
                        <span>GV: {item.teacher}</span>
                        {item.notes && (
                          <>
                            <span>•</span>
                            <span className="text-slate-400 italic">"{item.notes}"</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => setActiveTab('study')}
                    className="px-4 py-2 rounded-xl glass-button text-xs font-semibold text-slate-200 hover:text-white"
                  >
                    Xem bài tập
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Homework Checklist */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-xl font-bold font-display text-white">
                    Bài Tập Về Nhà Cần Hoàn Thành
                  </h2>
                  <p className="text-xs text-slate-400">Click vào để đánh dấu đã làm xong</p>
                </div>
              </div>

              <button
                onClick={() => setActiveTab('study')}
                className="text-xs font-bold text-purple-400 hover:text-purple-300 flex items-center gap-1.5 transition-colors"
              >
                <span>Xem tất cả bài tập</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2.5">
              {tasks.slice(0, 4).map((task) => (
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
                        className={`text-sm font-semibold ${
                          task.isDone ? 'line-through text-slate-400' : 'text-white'
                        }`}
                      >
                        {task.title}
                      </h4>
                      <div className="mt-1 flex items-center gap-3 text-[11px] text-slate-400">
                        <span className="text-purple-300 font-medium">#{task.subject}</span>
                        <span>•</span>
                        <span className="text-amber-400 font-medium">Hạn: {task.dueDate}</span>
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
        </div>

        {/* Right 1 Column: Widgets */}
        <div className="space-y-6">
          {/* Widget 1: Mini Pomodoro */}
          <div className="rounded-3xl glass-card p-6 border border-purple-500/30 relative overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Timer className="w-4 h-4 text-purple-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-purple-300 font-display">
                  Đồng Hồ Tập Trung
                </span>
              </div>

              <button
                onClick={() => setActiveTab('pomodoro')}
                className="text-[11px] text-slate-400 hover:text-purple-300 flex items-center gap-1"
              >
                <span>Mở rộng</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="text-center my-3">
              <div className="text-4xl font-black font-display text-white shimmer-text">
                {formatPomoTime(quickPomoSeconds)}
              </div>
              <p className="text-xs text-slate-400 mt-1">Phiên học 25 phút • Tập trung giải bài</p>
            </div>

            <div className="flex items-center justify-center gap-3 mt-4">
              <button
                onClick={() => setIsQuickPomoRunning(!isQuickPomoRunning)}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-xs font-bold shadow-lg shadow-purple-600/30 hover:scale-[1.02] transition-all flex items-center justify-center gap-1.5"
              >
                {isQuickPomoRunning ? (
                  <>
                    <Pause className="w-3.5 h-3.5 fill-white" />
                    <span>Tạm Dừng</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-white" />
                    <span>Bắt Đầu</span>
                  </>
                )}
              </button>

              <button
                onClick={() => {
                  setQuickPomoSeconds(25 * 60);
                  setIsQuickPomoRunning(false);
                }}
                className="px-3 py-2.5 rounded-xl glass-button text-xs font-semibold text-slate-400 hover:text-white"
              >
                Đặt lại
              </button>
            </div>
          </div>

          {/* Widget 2: Flashcard Suggestion */}
          <div className="rounded-3xl glass-card p-6 border border-white/10 space-y-4">
            <div className="flex items-center gap-2">
              <Brain className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-bold font-display text-white">Thẻ Ghi Nhớ Gợi Ý</h3>
            </div>

            <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10">
              <span className="text-[10px] font-bold uppercase tracking-wider text-purple-300">
                {FLASHCARD_DECKS[0].subject}
              </span>
              <h4 className="text-sm font-bold text-white mt-1">
                {FLASHCARD_DECKS[0].title}
              </h4>
              <p className="text-xs text-slate-400 mt-1">
                {FLASHCARD_DECKS[0].mastered} / {FLASHCARD_DECKS[0].cardCount} thẻ đã thuộc
              </p>
            </div>

            <button
              onClick={() => setActiveTab('flashcards')}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-500 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-purple-600/25 hover:scale-[1.02] transition-all"
            >
              <span>Ôn Luyện Thẻ Này</span>
              <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>

          {/* Widget 3: Leaderboard */}
          <div className="rounded-3xl glass-card p-6 border border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Crown className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-bold font-display text-white">Thi Đua Tuần Này</h3>
              </div>
              <button
                onClick={() => setActiveTab('games')}
                className="text-[11px] text-purple-400 hover:text-purple-300"
              >
                Xem tất cả
              </button>
            </div>

            <div className="space-y-2">
              {LEADERBOARD_USERS.slice(0, 3).map((u) => (
                <div
                  key={u.rank}
                  className={`p-2.5 rounded-xl border flex items-center justify-between text-xs ${
                    u.rank === 2
                      ? 'bg-purple-500/15 border-purple-500/40 text-purple-200'
                      : 'bg-white/[0.03] border-white/5 text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="font-extrabold w-4 text-center font-display text-amber-400">
                      #{u.rank}
                    </span>
                    <img src={u.avatar} alt={u.name} className="w-6 h-6 rounded-lg object-cover" />
                    <span className="font-semibold text-white truncate max-w-[120px]">{u.name}</span>
                  </div>
                  <span className="font-mono font-bold text-purple-300">{u.xp} XP</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
