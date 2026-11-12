import React, { useState, useEffect } from 'react';
import {
  Clock,
  Maximize2,
  Minimize2,
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

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const formattedDate = currentTime.toLocaleDateString('vi-VN', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
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

  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-white/10 dark:border-white/10 border-slate-200/80 px-4 sm:px-6 lg:px-8 py-2 transition-all">
      <div className="max-w-[1720px] mx-auto flex items-center justify-between gap-4">
        {/* 1. Góc trên bên trái: CHỈ CÓ LOGO VÀ TÊN WEB APP */}
        <div className="flex items-center gap-2.5 select-none flex-shrink-0">
          <div className="w-8 h-8 rounded-xl overflow-hidden shadow-sm border border-slate-200 dark:border-white/20 bg-white/90 flex items-center justify-center p-0.5">
            <img 
              src="/logo.png" 
              alt="Beacon Learn Logo" 
              className="w-full h-full object-cover rounded-lg"
            />
          </div>
          <span className="font-display font-bold text-base sm:text-lg tracking-tight text-slate-900 dark:text-white">
            Beacon Learn
          </span>
        </div>

        {/* 2. Giữa: Đồng hồ thời gian thực tinh tế, hiển thị ngày giờ trực quan */}
        <div className="flex items-center justify-center flex-1 mx-2">
          <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full glass-card border border-slate-200/90 dark:border-white/10 shadow-sm transition-all select-none">
            <div className="relative flex items-center justify-center">
              <Clock className="w-3.5 h-3.5 text-indigo-600 dark:text-purple-400" />
              <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping opacity-75" />
              <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-emerald-500" />
            </div>

            {/* Giờ thời gian thực */}
            <span className="font-mono font-bold text-xs sm:text-sm tracking-wider text-slate-800 dark:text-white">
              {formattedTime}
            </span>

            <span className="text-slate-300 dark:text-white/20">|</span>

            {/* Ngày tháng */}
            <span className="text-[11px] sm:text-xs font-medium text-slate-500 dark:text-slate-300 capitalize">
              {formattedDate}
            </span>
          </div>
        </div>

        {/* 3. Góc phải: Nút Đổi giao diện, Toàn màn hình & Tài khoản */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Nút chuyển đổi Giao diện Sáng / Tối */}
          <button
            onClick={toggleTheme}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl glass-button text-xs font-semibold transition-all duration-200 cursor-pointer ${
              isDark 
                ? 'text-amber-300 hover:text-amber-200 border-amber-500/30 bg-amber-500/10' 
                : 'text-indigo-600 hover:text-indigo-700 border-indigo-200 bg-white/90'
            }`}
            title={isDark ? "Chuyển sang Giao diện Sáng" : "Chuyển sang Giao diện Tối"}
          >
            {isDark ? (
              <>
                <Sun className="w-3.5 h-3.5 text-amber-400 animate-spin" style={{ animationDuration: '10s' }} />
                <span className="hidden md:inline">Giao diện Sáng</span>
              </>
            ) : (
              <>
                <Moon className="w-3.5 h-3.5 text-indigo-600" />
                <span className="hidden md:inline">Giao diện Tối</span>
              </>
            )}
          </button>

          {/* Nút bật / tắt toàn màn hình */}
          <button
            onClick={toggleFullscreen}
            className="w-8 h-8 rounded-xl glass-button flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all cursor-pointer"
            title={isFullscreen ? "Thoát toàn màn hình" : "Toàn màn hình"}
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>

          {/* Thông tin tài khoản người dùng */}
          <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-white/10">
            <img
              src={displayAvatar}
              alt={displayName}
              className="w-8 h-8 rounded-xl object-cover border border-slate-200 dark:border-white/20 shadow-xs"
            />
            <div className="text-left hidden lg:block leading-tight">
              <div className="text-xs font-bold text-slate-800 dark:text-white font-display truncate max-w-[120px]">
                {displayName}
              </div>
              <div className="text-[10px] text-indigo-600 dark:text-purple-300 truncate max-w-[120px]">
                {displayTitle}
              </div>
            </div>

            {/* Nút Đăng xuất */}
            {onLogout && (
              <button
                onClick={onLogout}
                className="w-8 h-8 rounded-xl glass-button flex items-center justify-center text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/15 transition-all cursor-pointer"
                title="Đăng xuất"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
