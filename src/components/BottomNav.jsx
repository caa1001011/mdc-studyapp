import React from 'react';
import {
  LayoutDashboard,
  CalendarDays,
  BookOpen,
  Layers,
  Gamepad2
} from 'lucide-react';

const MOBILE_NAV = [
  { id: 'dashboard', label: 'Trang Chủ', icon: LayoutDashboard },
  { id: 'timetable', label: 'Lịch Học', icon: CalendarDays },
  { id: 'study', label: 'Bài Tập', icon: BookOpen },
  { id: 'flashcards', label: 'Thẻ Nhớ', icon: Layers },
  { id: 'games', label: 'Đấu Trường', icon: Gamepad2 },
];

export default function BottomNav({ activeTab, setActiveTab }) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass-panel border-t border-white/10 px-2 py-2 safe-bottom transition-all">
      <div className="max-w-md mx-auto flex items-center justify-around">
        {MOBILE_NAV.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`relative flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all duration-200 ${
                isActive
                  ? 'text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {/* Active Ambient Glow Background */}
              {isActive && (
                <span className="absolute inset-0 bg-purple-500/20 rounded-xl blur-xs border border-purple-400/40" />
              )}

              <div className="relative z-10 flex flex-col items-center">
                <Icon
                  className={`w-5 h-5 transition-transform duration-200 ${
                    isActive ? 'scale-110 text-purple-300 drop-shadow-[0_0_8px_rgba(192,132,252,0.8)]' : ''
                  }`}
                />
                <span className={`text-[10px] mt-1 font-medium font-display tracking-tight ${
                  isActive ? 'text-purple-200 font-semibold' : 'text-slate-400'
                }`}>
                  {item.label}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
