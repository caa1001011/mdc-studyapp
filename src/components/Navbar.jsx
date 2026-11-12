import React, { useState, useEffect } from 'react';
import {
  Flame,
  Star,
  Bell,
  Search,
  Clock,
  Maximize2,
  Command,
  Sun,
  Moon,
  LogOut
} from 'lucide-react';
import { USER_PROFILE } from '../data/mockData';

export default function Navbar({ activeTab, theme, setTheme, currentUser, onLogout }) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
        setIsFullscreen(false);
      }
    }
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const formattedDate = currentTime.toLocaleDateString('vi-VN', {
    weekday: 'long',
    day: 'numeric',
    month: 'numeric',
    year: 'numeric',
  });

  const formattedTime = currentTime.toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  const isDark = theme === 'dark';
  const displayName = currentUser?.fullName || currentUser?.username || USER_PROFILE.name;
  const displayTitle = currentUser?.title || USER_PROFILE.title;
  const displayAvatar = currentUser?.avatar || USER_PROFILE.avatar;
  const displayStreak = currentUser?.streakDays ?? USER_PROFILE.streakDays;
  const displayXp = currentUser?.xp ?? USER_PROFILE.xp;

  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-white/10 px-6 lg:px-10 py-3 transition-all">
      <div className="max-w-[1720px] mx-auto flex items-center justify-between gap-6">
        {/* Left: Brand & Student Subtitle */}
        <div className="flex items-center gap-3.5">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-2xl overflow-hidden shadow-lg shadow-cyan-500/20 border border-white/20 bg-white/5">
            <img 
              src="/logo.png" 
              alt="Beacon Learn Logo" 
              className="w-full h-full object-cover"
            />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="font-display font-bold text-xl tracking-tight text-white">
                Beacon Learn
              </span>
              <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-cyan-500/20 border border-cyan-500/30 text-cyan-200">
                THPT
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-normal">
              Góc tự học & Luyện thi thông minh
            </p>
          </div>
        </div>

        {/* Center: Search & Live Clock */}
        <div className="flex items-center gap-4 flex-1 max-w-xl mx-auto">
          {/* Quick Search */}
          <div className="relative w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm kiếm môn học, bài tập về nhà, thẻ ghi nhớ... (Ctrl + K)"
              className="w-full pl-10 pr-16 py-2 rounded-xl bg-white/[0.04] border border-white/10 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-purple-400/60 focus:bg-white/[0.06] transition-all"
            />
            <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1 px-1.5 py-0.5 rounded bg-white/[0.08] border border-white/10 text-[10px] text-slate-400 font-mono">
              <Command className="w-2.5 h-2.5" />
              <span>K</span>
            </div>
          </div>

          {/* Clock */}
          <div className="hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-xl glass-card border border-white/10 text-slate-300 font-mono text-xs whitespace-nowrap">
            <Clock className="w-3.5 h-3.5 text-purple-400" />
            <span className="font-bold text-white">{formattedTime}</span>
            <span className="text-white/20">|</span>
            <span className="text-[11px] text-slate-400 capitalize">{formattedDate}</span>
          </div>
        </div>

        {/* Right: Badges, Theme Switcher & Profile */}
        <div className="flex items-center gap-3">
          {/* Streak pill */}
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold">
            <Flame className="w-4 h-4 text-amber-400" />
            <span>{displayStreak} ngày</span>
          </div>

          {/* XP pill */}
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-semibold">
            <Star className="w-3.5 h-3.5 text-purple-400 fill-purple-400/40" />
            <span>{Number(displayXp).toLocaleString()} XP</span>
          </div>

          {/* THEME TOGGLE BUTTON (Chuyển đổi Giao diện Sáng / Tối) */}
          <button
            onClick={toggleTheme}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl glass-button text-xs font-semibold transition-all duration-300 ${
              isDark 
                ? 'text-amber-300 hover:text-amber-200 border-amber-500/30 bg-amber-500/10 shadow-sm shadow-amber-500/10' 
                : 'text-indigo-600 hover:text-indigo-700 border-indigo-300/60 bg-white shadow-sm'
            }`}
            title={isDark ? "Chuyển sang Giao diện Sáng (Light Mode)" : "Chuyển sang Giao diện Tối (Dark Mode)"}
          >
            {isDark ? (
              <>
                <Sun className="w-4 h-4 text-amber-400 animate-spin" style={{ animationDuration: '10s' }} />
                <span className="hidden sm:inline">Giao diện Sáng</span>
              </>
            ) : (
              <>
                <Moon className="w-4 h-4 text-indigo-600" />
                <span className="hidden sm:inline">Giao diện Tối</span>
              </>
            )}
          </button>

          {/* Fullscreen Toggle */}
          <button
            onClick={toggleFullscreen}
            className="w-9 h-9 rounded-xl glass-button flex items-center justify-center text-slate-400 hover:text-white transition-all"
            title="Bật/Tắt Toàn Màn Hình"
          >
            <Maximize2 className="w-4 h-4" />
          </button>

          {/* Notifications */}
          <button
            className="relative w-9 h-9 rounded-xl glass-button flex items-center justify-center text-slate-300 hover:text-white"
            title="Thông báo bài tập"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-purple-400" />
          </button>

          {/* User Profile & Logout */}
          <div className="flex items-center gap-2.5 pl-2 border-l border-white/10">
            <img
              src={displayAvatar}
              alt={displayName}
              className="w-9 h-9 rounded-xl object-cover border border-white/20"
            />
            <div className="text-left hidden md:block">
              <div className="text-xs font-bold text-white font-display">
                {displayName}
              </div>
              <div className="text-[10px] text-purple-300">
                {displayTitle}
              </div>
            </div>

            {onLogout && (
              <button
                onClick={onLogout}
                className="ml-1 w-9 h-9 rounded-xl glass-button flex items-center justify-center text-rose-400 hover:text-rose-300 hover:border-rose-500/40 transition-all"
                title="Đăng xuất khỏi hệ thống"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
