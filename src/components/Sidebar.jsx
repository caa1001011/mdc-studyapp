import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  CalendarDays,
  BookOpen,
  Layers,
  HelpCircle,
  Gamepad2,
  Users,
  PanelLeftClose,
  PanelLeftOpen,
  X,
  Menu,
  LogOut
} from 'lucide-react';
import { USER_PROFILE } from '../data/mockData';
import { resolveUserAvatar } from '../utils/avatarUtils';

export const NAV_ITEMS = [
  { id: 'dashboard', label: 'Trang Chủ', shortLabel: 'Trang chủ', icon: LayoutDashboard, badge: null },
  { id: 'timetable', label: 'Thời Khóa Biểu', shortLabel: 'Lịch học', icon: CalendarDays, badge: null },
  { id: 'study', label: 'Bài Học', shortLabel: 'Bài học', icon: BookOpen, badge: null },
  { id: 'flashcards', label: 'Thẻ Ghi Nhớ (Flashcard)', shortLabel: 'Flashcard', icon: Layers, badge: null },
  { id: 'quiz', label: 'Luyện Đề & Ôn Thi', shortLabel: 'Luyện đề', icon: HelpCircle, badge: null },
  { id: 'games', label: 'Trò Chơi Học Tập', shortLabel: 'Trò chơi', icon: Gamepad2, badge: null },
];

const MOBILE_PRIMARY_TAB_IDS = ['dashboard', 'study', 'flashcards', 'quiz'];

export default function Sidebar({
  activeTab,
  setActiveTab,
  theme = 'dark',
  currentUser,
  isMobileOpen = false,
  onOpenMobile,
  onCloseMobile,
  onLogout
}) {
  const [isCollapsed, setIsCollapsed] = useState(() => {
    return localStorage.getItem('lumina_sidebar_collapsed') === 'true';
  });

  const isAdmin = currentUser?.role === 'admin';
  const isDark = theme === 'dark';

  const menuItems = isAdmin
    ? [
        ...NAV_ITEMS,
        { id: 'users', label: 'Quản Lý Tài Khoản', shortLabel: 'Tài khoản', icon: Users, badge: 'Admin' },
      ]
    : NAV_ITEMS;

  const mobilePrimaryItems = MOBILE_PRIMARY_TAB_IDS.map((id) =>
    menuItems.find((item) => item.id === id)
  ).filter(Boolean);

  const isSecondaryTabActive = !MOBILE_PRIMARY_TAB_IDS.includes(activeTab);

  // Đóng ngăn kéo mobile bằng phím Escape và khóa cuộn nền khi mở
  useEffect(() => {
    if (!isMobileOpen) return undefined;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && onCloseMobile) {
        onCloseMobile();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isMobileOpen, onCloseMobile]);

  const toggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('lumina_sidebar_collapsed', String(next));
      return next;
    });
  };

  const handleSelectTab = (tabId) => {
    setActiveTab(tabId);
    if (onCloseMobile) onCloseMobile();
  };

  const displayName = currentUser?.fullName || currentUser?.username || USER_PROFILE.name;
  const displayTitle = currentUser?.title || USER_PROFILE.title;
  const displayAvatar = resolveUserAvatar(currentUser?.avatar, displayName, currentUser?.role);

  return (
    <>
      {/* 1. DESKTOP LEFT SIDEBAR (chỉ hiển thị từ màn hình lg >= 1024px) */}
      <aside
        className={`hidden lg:flex ${
          isCollapsed ? 'w-20 p-2.5' : 'w-72 p-4'
        } flex-shrink-0 flex-col justify-between glass-panel border-r border-white/10 h-[calc(100vh-53px)] sticky top-[53px] overflow-y-auto scrollbar-none transition-all duration-300`}
      >
        <div className="space-y-1.5">
          {!isCollapsed ? (
            <div className="px-2 pb-2 flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-400">
              <span className="truncate">Danh mục</span>
              <button
                type="button"
                onClick={toggleCollapse}
                className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer shrink-0"
                title="Thu gọn danh mục"
              >
                <PanelLeftClose className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-center pb-2">
              <button
                type="button"
                onClick={toggleCollapse}
                className="p-2 rounded-xl bg-white/[0.05] hover:bg-purple-600/30 border border-white/10 text-purple-300 hover:text-white transition-all cursor-pointer"
                title="Mở rộng danh mục"
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
                type="button"
                onClick={() => handleSelectTab(item.id)}
                title={isCollapsed ? item.label : undefined}
                className={`w-full group relative flex items-center ${
                  isCollapsed ? 'justify-center p-3' : 'justify-between px-3.5 py-3'
                } rounded-2xl text-xs sm:text-sm font-semibold transition-all duration-200 cursor-pointer ${
                  isActive
                    ? 'bg-gradient-to-r from-purple-600/35 to-indigo-600/25 text-white border border-purple-400/50 shadow-lg shadow-purple-500/20 translate-x-0.5'
                    : 'text-slate-300 hover:text-white hover:bg-white/[0.05] border border-transparent'
                }`}
              >
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
      </aside>

      {/* 2. MOBILE & TABLET SLIDE-OVER DRAWER (< lg) */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-50 flex"
          role="dialog"
          aria-modal="true"
          aria-label="Danh mục điều hướng"
        >
          {/* Backdrop */}
          <div
            onClick={onCloseMobile}
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity"
          />

          {/* Drawer panel */}
          <div
            className={`relative z-10 w-[82%] max-w-[300px] h-full flex flex-col justify-between border-r shadow-2xl overflow-y-auto ${
              isDark
                ? 'bg-[#0e101d] border-white/10 text-slate-100'
                : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            <div>
              {/* Drawer Header */}
              <div className="px-4 py-3.5 border-b border-slate-200 dark:border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-xl overflow-hidden border border-slate-200 dark:border-white/15 bg-white p-0.5 shrink-0">
                    <img src="/logo.png" alt="Beacon Learn" className="w-full h-full object-cover rounded-lg" />
                  </div>
                  <span className="font-display font-bold text-base truncate">Beacon Learn</span>
                </div>
                <button
                  type="button"
                  onClick={onCloseMobile}
                  className="w-9 h-9 rounded-xl glass-button flex items-center justify-center text-slate-500 dark:text-slate-300 cursor-pointer"
                  aria-label="Đóng danh mục"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* User profile summary on mobile */}
              <div className="px-4 py-3.5 border-b border-slate-200 dark:border-white/10 flex items-center gap-3">
                <img
                  src={displayAvatar}
                  alt={displayName}
                  className="w-10 h-10 rounded-xl object-cover border border-slate-200 dark:border-white/20 shrink-0"
                />
                <div className="min-w-0">
                  <div className="text-sm font-bold font-display truncate">{displayName}</div>
                  <div className="text-xs text-indigo-600 dark:text-purple-300 truncate">{displayTitle}</div>
                </div>
              </div>

              {/* Navigation items */}
              <nav className="p-3 space-y-1.5">
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleSelectTab(item.id)}
                      className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl text-sm font-semibold transition-all cursor-pointer ${
                        isActive
                          ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-500/25'
                          : isDark
                          ? 'text-slate-300 hover:bg-white/[0.06] hover:text-white'
                          : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <Icon className="w-4 h-4 shrink-0" />
                        <span className="truncate">{item.label}</span>
                      </div>
                      {item.badge && (
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            isActive
                              ? 'bg-white/20 text-white border-white/30'
                              : 'bg-amber-500/15 text-amber-600 dark:text-amber-300 border-amber-400/40'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Logout in mobile drawer */}
            {onLogout && (
              <div className="p-3 border-t border-slate-200 dark:border-white/10 safe-area-bottom">
                <button
                  type="button"
                  onClick={() => {
                    if (onCloseMobile) onCloseMobile();
                    onLogout();
                  }}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-sm font-bold cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Đăng xuất</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. MOBILE FIXED BOTTOM NAVIGATION BAR (< lg) */}
      <nav
        aria-label="Điều hướng nhanh"
        className={`lg:hidden fixed bottom-0 inset-x-0 z-40 border-t backdrop-blur-xl safe-area-bottom ${
          isDark
            ? 'bg-[#0b0d17]/95 border-white/10'
            : 'bg-white/95 border-slate-200 shadow-[0_-4px_20px_rgba(15,23,42,0.06)]'
        }`}
      >
        <div className="grid grid-cols-5 items-center max-w-lg mx-auto px-1 pt-1.5 pb-1">
          {mobilePrimaryItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelectTab(item.id)}
                className={`flex flex-col items-center justify-center gap-0.5 py-1.5 rounded-xl transition-all cursor-pointer ${
                  isActive
                    ? 'text-indigo-600 dark:text-purple-300'
                    : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                <div
                  className={`p-1.5 rounded-xl transition-all ${
                    isActive
                      ? 'bg-indigo-500/15 dark:bg-purple-500/25 scale-105'
                      : ''
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold leading-tight truncate max-w-[64px]">
                  {item.shortLabel}
                </span>
              </button>
            );
          })}

          {/* Nút Thêm (mở drawer cho Thời khóa biểu, Trò chơi, Quản lý tài khoản) */}
          <button
            type="button"
            onClick={onOpenMobile}
            className={`flex flex-col items-center justify-center gap-0.5 py-1.5 rounded-xl transition-all cursor-pointer ${
              isSecondaryTabActive || isMobileOpen
                ? 'text-indigo-600 dark:text-purple-300'
                : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            <div
              className={`p-1.5 rounded-xl transition-all ${
                isSecondaryTabActive || isMobileOpen
                  ? 'bg-indigo-500/15 dark:bg-purple-500/25 scale-105'
                  : ''
              }`}
            >
              <Menu className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold leading-tight">Thêm</span>
          </button>
        </div>
      </nav>
    </>
  );
}
