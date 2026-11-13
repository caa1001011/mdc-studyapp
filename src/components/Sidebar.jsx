import React, { useState } from 'react';
import {
  LayoutDashboard,
  CalendarDays,
  BookOpen,
  Layers,
  HelpCircle,
  Timer,
  Gamepad2,
  Sparkles,
  Music,
  Play,
  Pause,
  Users
} from 'lucide-react';
import { USER_PROFILE } from '../data/mockData';

export const NAV_ITEMS = [
  { id: 'dashboard', label: 'Trang Chủ', icon: LayoutDashboard, badge: null },
  { id: 'timetable', label: 'Thời Khóa Biểu', icon: CalendarDays, badge: 'Hôm nay' },
  { id: 'study', label: 'Bài Học', icon: BookOpen, badge: null },
  { id: 'flashcards', label: 'Thẻ Ghi Nhớ (Flashcard)', icon: Layers, badge: 'Ôn tập' },
  { id: 'quiz', label: 'Luyện Đề & Trắc Nghiệm', icon: HelpCircle, badge: null },
  { id: 'pomodoro', label: 'Đồng Hồ Pomodoro', icon: Timer, badge: '25p' },
  { id: 'games', label: 'Trò Chơi Học Tập', icon: Gamepad2, badge: '+100 XP' },
];

export default function Sidebar({ activeTab, setActiveTab, currentUser }) {
  const [isPlayingMusic, setIsPlayingMusic] = useState(false);
  const percentCompleted = Math.round((USER_PROFILE.todayStudyMinutes / USER_PROFILE.dailyGoalMinutes) * 100);

  const isAdmin = currentUser?.role === 'admin';

  const menuItems = isAdmin
    ? [
        ...NAV_ITEMS,
        { id: 'users', label: 'Quản Lý Tài Khoản', icon: Users, badge: 'Admin' },
      ]
    : NAV_ITEMS;

  const weekDots = [
    { day: 'T2', active: true },
    { day: 'T3', active: true },
    { day: 'T4', active: true },
    { day: 'T5', active: true },
    { day: 'T6', active: false },
    { day: 'T7', active: false },
    { day: 'CN', active: false },
  ];

  return (
    <aside className="w-72 flex-shrink-0 flex flex-col justify-between p-4 glass-panel border-r border-white/10 h-[calc(100vh-53px)] sticky top-[53px] overflow-y-auto scrollbar-none">
      {/* 1. Main Navigation Items */}
      <div className="space-y-1.5">
        <div className="px-3 pb-2 flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-400">
          <span>Danh Mục Tự Học</span>
          <span className="text-[10px] text-purple-300 font-mono">
            {isAdmin ? 'Quản Trị' : 'Lớp 12'}
          </span>
        </div>

        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full group relative flex items-center justify-between px-3.5 py-3 rounded-2xl text-xs sm:text-sm font-semibold transition-all duration-200 ${
                isActive
                  ? 'bg-gradient-to-r from-purple-600/35 to-indigo-600/25 text-white border border-purple-400/50 shadow-lg shadow-purple-500/20 translate-x-1'
                  : 'text-slate-300 hover:text-white hover:bg-white/[0.05] border border-transparent'
              }`}
            >
              {/* Active Indicator Glow Bar */}
              {isActive && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-7 bg-gradient-to-b from-purple-400 to-indigo-400 rounded-r-full shadow-md shadow-purple-400" />
              )}

              <div className="flex items-center gap-3">
                <div
                  className={`p-2 rounded-xl transition-all ${
                    isActive
                      ? 'bg-purple-500/30 text-purple-200 shadow-sm shadow-purple-500/30'
                      : 'text-slate-400 group-hover:text-purple-300 group-hover:bg-white/[0.06]'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <span className="font-display tracking-tight text-left">{item.label}</span>
              </div>

              {item.badge && (
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    item.id === 'users'
                      ? 'bg-amber-500/20 text-amber-300 border-amber-400/40'
                      : isActive
                      ? 'bg-purple-400/20 text-purple-200 border-purple-400/30'
                      : 'bg-white/[0.04] text-slate-400 border-white/10 group-hover:border-white/20'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* 2. Bottom Widgets: Weekly Study Days & Focus Target */}
      <div className="mt-auto space-y-3 pt-4">
        {/* Weekly Study Tracker */}
        <div className="p-3.5 rounded-2xl glass-card border border-white/10">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-300 mb-2">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Chăm Chỉ Trong Tuần
            </span>
            <span className="text-[11px] text-purple-300 font-mono">4/7 ngày</span>
          </div>

          <div className="flex items-center justify-between gap-1">
            {weekDots.map((dot, idx) => (
              <div key={idx} className="flex flex-col items-center gap-1">
                <div
                  className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-bold transition-all ${
                    dot.active
                      ? 'bg-gradient-to-tr from-amber-500 to-red-500 text-white shadow-sm shadow-amber-500/30'
                      : 'bg-white/[0.04] text-slate-500 border border-white/10'
                  }`}
                >
                  {dot.active ? '✓' : ''}
                </div>
                <span className="text-[9px] text-slate-400">{dot.day}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Daily Study Goal */}
        <div className="p-4 rounded-2xl glass-card relative overflow-hidden border border-white/10">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-bold text-slate-200">Mục Tiêu Hôm Nay</span>
            <span className="text-xs font-extrabold text-purple-300 font-display">
              {percentCompleted}%
            </span>
          </div>

          <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden p-[1px] mb-2">
            <div
              className="h-full rounded-full bg-gradient-to-r from-purple-500 via-indigo-400 to-cyan-400 transition-all duration-700"
              style={{ width: `${Math.min(percentCompleted, 100)}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>{USER_PROFILE.todayStudyMinutes}p / {USER_PROFILE.dailyGoalMinutes}p</span>
            <span className="text-emerald-400 font-semibold">+135 XP</span>
          </div>
        </div>

        {/* Mini Ambient Music Player */}
        <div className="p-3 rounded-2xl glass-card border border-white/10 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-300 flex-shrink-0">
              <Music className={`w-4 h-4 ${isPlayingMusic ? 'text-purple-300 animate-pulse' : 'text-slate-400'}`} />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-white truncate font-display">Nhạc Không Lời</div>
              <div className="text-[10px] text-slate-400 truncate">Nhạc nhẹ giúp tập trung học</div>
            </div>
          </div>

          <button
            onClick={() => setIsPlayingMusic(!isPlayingMusic)}
            className="w-8 h-8 rounded-xl glass-button flex items-center justify-center text-purple-300 hover:text-white flex-shrink-0"
            title={isPlayingMusic ? 'Tạm dừng nhạc' : 'Bật nhạc'}
          >
            {isPlayingMusic ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-purple-300" />}
          </button>
        </div>
      </div>
    </aside>
  );
}
