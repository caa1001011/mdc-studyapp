import React, { useState } from 'react';
import {
  LayoutDashboard,
  CalendarDays,
  BookOpen,
  Layers,
  HelpCircle,
  Gamepad2,
  Users,
  PanelLeftClose,
  PanelLeftOpen
} from 'lucide-react';

export const NAV_ITEMS = [
  { id: 'dashboard', label: 'Trang Chủ', icon: LayoutDashboard, badge: null },
  { id: 'timetable', label: 'Thời Khóa Biểu', icon: CalendarDays, badge: null },
  { id: 'study', label: 'Bài Học', icon: BookOpen, badge: null },
  { id: 'flashcards', label: 'Thẻ Ghi Nhớ (Flashcard)', icon: Layers, badge: null },
  { id: 'quiz', label: 'Luyện Đề & Ôn Thi', icon: HelpCircle, badge: null },
  { id: 'games', label: 'Trò Chơi Học Tập', icon: Gamepad2, badge: null },
];

export default function Sidebar({ activeTab, setActiveTab, currentUser }) {
  const [isCollapsed, setIsCollapsed] = useState(() => {
    return localStorage.getItem('lumina_sidebar_collapsed') === 'true';
  });

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
    </aside>
  );
}
