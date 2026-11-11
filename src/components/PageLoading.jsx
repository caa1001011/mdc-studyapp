import React from 'react';
import { Sparkles } from 'lucide-react';

export default function PageLoading() {
  return (
    <div className="w-full min-h-[450px] flex flex-col items-center justify-center p-8">
      <div className="relative flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-cyan-400 p-[1.5px] shadow-xl shadow-purple-500/20 mb-4 animate-pulse">
        <div className="w-full h-full bg-[#0a0b14] rounded-[14px] flex items-center justify-center">
          <Sparkles className="w-6 h-6 text-purple-300 animate-spin" style={{ animationDuration: '3s' }} />
        </div>
      </div>
      <div className="text-sm font-bold font-display text-white tracking-wide">
        Đang tải phân hệ...
      </div>
      <p className="text-xs text-slate-400 mt-1">
        Chỉ nạp mã nguồn của trang được yêu cầu
      </p>
    </div>
  );
}
