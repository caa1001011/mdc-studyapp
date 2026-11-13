import React, { useState } from 'react';
import {
  BookOpen,
  Sparkles,
  Calculator,
  Atom,
  Languages,
  FlaskConical,
  FileEdit
} from 'lucide-react';
import { STUDY_SUBJECTS } from '../../data/mockData';

const ICONS_MAP = {
  Calculator: Calculator,
  Atom: Atom,
  Languages: Languages,
  FlaskConical: FlaskConical,
};

export default function StudySpaceView() {
  const [notesContent, setNotesContent] = useState(
    "1. Công thức Toán: Đạo hàm của hàm hợp luôn nhân thêm u'(x)\n2. Vật Lý: Chu kỳ T con lắc đơn tỉ lệ thuận với căn bậc 2 của chiều dài dây l\n3. Tiếng Anh: Nhớ ôn kỹ 30 từ vựng chủ đề Môi trường cho bài kiểm tra tuần này"
  );

  return (
    <div className="space-y-6 md:space-y-8 pb-10">
      {/* 1. Subjects Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {STUDY_SUBJECTS.map((sub) => {
          const SubIcon = ICONS_MAP[sub.icon] || BookOpen;

          return (
            <div
              key={sub.id}
              className="relative overflow-hidden rounded-3xl glass-card p-5 border border-white/10 group hover:border-purple-400/40 flex items-center gap-4"
            >
              <div className="p-3 rounded-2xl bg-white/[0.05] border border-white/10 text-purple-300 group-hover:scale-110 transition-transform">
                <SubIcon className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold font-display text-white group-hover:text-purple-300 transition-colors">
                {sub.name}
              </h3>
            </div>
          );
        })}
      </div>

      {/* 2. Recent Lessons & Notes Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Recent Lessons (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg md:text-xl font-bold font-display text-white flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-emerald-400" />
            <span>Bài Học Gần Đây</span>
          </h2>

          <div className="p-8 rounded-3xl glass-card border border-white/10 text-center text-xs sm:text-sm text-slate-400">
            Chưa có bài học gần đây.
          </div>
        </div>

        {/* Right: Notes Pad (1 col) */}
        <div className="space-y-4">
          <h2 className="text-lg md:text-xl font-bold font-display text-white flex items-center gap-2">
            <FileEdit className="w-5 h-5 text-purple-400" />
            <span>Sổ Ghi Chú Nhanh</span>
          </h2>

          <div className="p-5 rounded-3xl glass-card border border-white/10 space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-400 pb-2 border-b border-white/10">
              <span className="flex items-center gap-1.5 text-purple-300 font-medium">
                <Sparkles className="w-3.5 h-3.5" />
                Tự động lưu
              </span>
              <span>Ghi chú cá nhân</span>
            </div>

            <textarea
              rows={9}
              value={notesContent}
              onChange={(e) => setNotesContent(e.target.value)}
              placeholder="Ghi chú công thức cần nhớ, bài tập giáo viên dặn..."
              className="w-full bg-transparent resize-none text-xs sm:text-sm text-slate-200 leading-relaxed placeholder-slate-500 focus:outline-none"
            />

            <div className="pt-2 border-t border-white/10 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">Nhấn để sao chép</span>
              <button
                onClick={() => alert('Đã sao chép ghi chú!')}
                className="px-3 py-1.5 rounded-xl glass-button text-xs font-semibold text-purple-300 hover:text-white"
              >
                Sao Chép
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
