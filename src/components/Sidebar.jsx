import React, { useState } from 'react';
import {
  LayoutDashboard,
  CalendarDays,
  BookOpen,
  Layers,
  HelpCircle,
  Timer,
  Gamepad2,
  Music,
  Play,
  Pause,
  Users,
  PanelLeftClose,
  PanelLeftOpen
} from 'lucide-react';
import { USER_PROFILE } from '../data/mockData';

export const NAV_ITEMS = [
  { id: 'dashboard', label: 'Trang Chủ', icon: LayoutDashboard, badge: null },
  { id: 'timetable', label: 'Thời Khóa Biểu', icon: CalendarDays, badge: null },
  { id: 'study', label: 'Bài Học', icon: BookOpen, badge: null },
  { id: 'flashcards', label: 'Thẻ Ghi Nhớ (Flashcard)', icon: Layers, badge: null },
  { id: 'quiz', label: 'Luyện Đề & Ôn Thi', icon: HelpCircle, badge: null },
  { id: 'pomodoro', label: 'Đồng Hồ Pomodoro', icon: Timer, badge: null },
  { id: 'games', label: 'Trò Chơi Học Tập', icon: Gamepad2, badge: null },
];

export default function Sidebar({ activeTab, setActiveTab, currentUser }) {
  const [isCollapsed, setIsCollapsed] = useState(() => {
    return localStorage.getItem('lumina_sidebar_collapsed') === 'true';
  });
  const [isPlayingMusic, setIsPlayingMusic] = useState(false);
  const percentCompleted = Math.round((USER_PROFILE.todayStudyMinutes / USER_PROFILE.dailyGoalMinutes) * 100);

  const isAdmin = currentUser?.role === 'admin';

  const menuItems = isAdmin
    ? [
        ...NAV_ITEMS,
        { id: 'users', label: 'Quản Lý Tài Khoản', icon: Users, badge: 'Admin' },
      ]
    : NAV_ITEMS;

  const toggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('lumina_sidebar_collapsed', String(next));
      return next;
    });
  };

  return (
    <aside
      className={`${
        isCollapsed ? 'w-20 p-2.5' : 'w-72 p-4'
      } flex-shrink-0 flex flex-col justify-between glass-panel border-r border-white/10 h-[calc(100vh-53px)] sticky top-[53px] overflow-y-auto scrollbar-none transition-all duration-300`}
    >
      {/* 1. Main Navigation Items */}
      <div className="space-y-1.5">
        {/* Header với nút thu gọn / mở rộng */}
        {!isCollapsed ? (
          <div className="px-2 pb-2 flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-400">
            <span className="truncate">Danh Mục Tự Học</span>
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-[10px] text-purple-300 font-mono">
                {isAdmin ? 'Quản Trị' : 'Lớp 12'}
              </span>
              <button
                type="button"
                onClick={toggleCollapse}
                className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
                title="Thu gọn danh mục tự học"
              >
                <PanelLeftClose className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center pb-2">
            <button
              type="button"
              onClick={toggleCollapse}
              className="p-2 rounded-xl bg-white/[0.05] hover:bg-purple-600/30 border border-white/10 text-purple-300 hover:text-white transition-all cursor-pointer"
              title="Mở rộng danh mục tự học"
            >
              <PanelLeftOpen className="w-4 h-4" />
            </button>
          </div>
        )}

        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              title={isCollapsed ? item.label : undefined}
              className={`w-full group relative flex items-center ${
                isCollapsed ? 'justify-center p-3' : 'justify-between px-3.5 py-3'
              } rounded-2xl text-xs sm:text-sm font-semibold transition-all duration-200 cursor-pointer ${
                isActive
                  ? 'bg-gradient-to-r from-purple-600/35 to-indigo-600/25 text-white border border-purple-400/50 shadow-lg shadow-purple-500/20 translate-x-0.5'
                  : 'text-slate-300 hover:text-white hover:bg-white/[0.05] border border-transparent'
              }`}
            >
              {/* Active Indicator Glow Bar */}
              {isActive && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-7 bg-gradient-to-b from-purple-400 to-indigo-400 rounded-r-full shadow-md shadow-purple-400" />
              )}

              <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3 min-w-0'}`}>
                <div
                  className={`p-2 rounded-xl transition-all flex-shrink-0 ${
                    isActive
                      ? 'bg-purple-500/30 text-purple-200 shadow-sm shadow-purple-500/30'
                      : 'text-slate-400 group-hover:text-purple-300 group-hover:bg-white/[0.06]'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                {!isCollapsed && (
                  <span className="font-display tracking-tight text-left whitespace-nowrap truncate">
                    {item.label}
                  </span>
                )}
              </div>

              {!isCollapsed && item.badge && (
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

              {isCollapsed && item.badge && (
                <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-amber-400" />
              )}
            </button>
          );
        })}
      </div>

      {/* 2. Bottom Widgets: Focus Target & Music Player */}
      <div className="mt-auto space-y-2.5 pt-4">
        {!isCollapsed ? (
          <>
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
                type="button"
                onClick={() => setIsPlayingMusic(!isPlayingMusic)}
                className="w-8 h-8 rounded-xl glass-button flex items-center justify-center text-purple-300 hover:text-white flex-shrink-0 cursor-pointer"
                title={isPlayingMusic ? 'Tạm dừng nhạc' : 'Bật nhạc'}
              >
                {isPlayingMusic ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-purple-300" />}
              </button>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center gap-2">
            {/* Collapsed Goal Indicator */}
            <div
              className="w-12 h-12 rounded-2xl glass-card border border-white/10 flex flex-col items-center justify-center cursor-default group"
              title={`Mục Tiêu Hôm Nay: ${percentCompleted}% (${USER_PROFILE.todayStudyMinutes}p / ${USER_PROFILE.dailyGoalMinutes}p)`}
            >
              <span className="text-[10px] font-extrabold text-purple-300 font-display leading-tight">
                {percentCompleted}%
              </span>
              <div className="w-7 h-1 rounded-full bg-white/10 overflow-hidden mt-1">
                <div
                  className="h-full bg-gradient-to-r from-purple-500 to-indigo-400"
                  style={{ width: `${Math.min(percentCompleted, 100)}%` }}
                />
              </div>
            </div>

            {/* Collapsed Music Button */}
            <button
              type="button"
              onClick={() => setIsPlayingMusic(!isPlayingMusic)}
              className={`w-12 h-12 rounded-2xl glass-card border border-white/10 flex items-center justify-center cursor-pointer transition-all ${
                isPlayingMusic
                  ? 'bg-purple-600/30 text-purple-200 border-purple-400/40 shadow-md shadow-purple-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-white/[0.05]'
              }`}
              title={isPlayingMusic ? 'Tạm dừng nhạc không lời' : 'Bật nhạc không lời tập trung'}
            >
              {isPlayingMusic ? (
                <Pause className="w-4 h-4 text-purple-300 animate-pulse" />
              ) : (
                <Music className="w-4 h-4" />
              )}
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
