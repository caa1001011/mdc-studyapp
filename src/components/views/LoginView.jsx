import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Lock,
  User,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  BookOpen,
  Timer,
  Layers,
  AlertCircle,
  Loader2,
  CheckCircle2
} from 'lucide-react';
import AuroraBackground from '../AuroraBackground';
import { loginWithCredentials, ensureAdminAccount } from '../../services/authService';

export default function LoginView({ onLoginSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Luôn luôn cố định trang đăng nhập ở Giao diện Sáng (Light Mode - Liquid Glass)
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('dark');

    // Tự động khởi tạo tài khoản admin (admin / 123456) trên Firebase nếu chưa có
    ensureAdminAccount();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);

    try {
      const userData = await loginWithCredentials(username, password);
      onLoginSuccess(userData);
    } catch (err) {
      setErrorMsg(err.message || 'Đăng nhập không thành công. Vui lòng kiểm tra lại thông tin.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex flex-col justify-between text-slate-800 selection:bg-indigo-500/20 selection:text-indigo-900 overflow-x-hidden">
      {/* 1. Nền Liquid Glass Light Mode cố định */}
      <AuroraBackground theme="light" />

      {/* 2. Top Brand Header */}
      <header className="w-full glass-panel border-b border-slate-200/80 px-6 lg:px-12 py-3.5 z-20">
        <div className="max-w-[1440px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="relative flex items-center justify-center w-10 h-10 rounded-2xl overflow-hidden shadow-md shadow-indigo-500/15 border border-white bg-white">
              <img
                src="/logo.png"
                alt="Beacon Learn Logo"
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display font-bold text-xl tracking-tight text-slate-900">
                  Beacon Learn
                </span>
                <span className="px-2.5 py-0.5 text-[10px] font-bold rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700">
                  THPT
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">
                Góc tự học & Luyện thi thông minh
              </p>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50/90 border border-indigo-200/80 text-indigo-700 text-xs font-semibold shadow-2xs">
            <ShieldCheck className="w-4 h-4 text-indigo-600" />
            <span>Hệ thống Học Tập Nội Bộ • Bảo Mật Cloud Firebase</span>
          </div>
        </div>
      </header>

      {/* 3. Main Stage: 2-Column Hero & Login Card */}
      <main className="flex-1 flex items-center justify-center px-6 py-10 z-10">
        <div className="w-full max-w-[1200px] grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Cột Trái (7 cols): Giới thiệu hệ thống theo chuẩn UI Trang chủ */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-500/15 border border-purple-500/30 text-purple-300 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>Nền tảng Tự học & Ôn thi THPT Chuyên Biệt</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-extrabold font-display tracking-tight text-slate-900 leading-[1.15]">
              Chinh phục kỳ thi cùng{' '}
              <span className="shimmer-text">Beacon Learn</span> ✨
            </h1>

            <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-xl">
              Không gian học tập trực quan kết hợp phương pháp quản lý thời gian Pomodoro, thẻ ghi nhớ 3D Flashcard, thời khóa biểu ma trận và luyện đề trắc nghiệm thông minh.
            </p>

            {/* 3 Feature Cards đồng bộ với Metric Cards của Dashboard */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div className="rounded-3xl glass-card p-5 border border-white">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-200/80 flex items-center justify-center text-indigo-600 mb-3">
                  <Timer className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold font-display text-slate-900">
                  Đồng Hồ Pomodoro
                </h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Tập trung 25 phút kết hợp âm thanh thư giãn giúp học sâu không mỏi mệt.
                </p>
              </div>

              <div className="rounded-3xl glass-card p-5 border border-white">
                <div className="w-10 h-10 rounded-2xl bg-sky-50 border border-sky-200/80 flex items-center justify-center text-sky-600 mb-3">
                  <Layers className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold font-display text-slate-900">
                  Flashcard 3D & Đề Thi
                </h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Ôn từ vựng, công thức Toán - Lý - Hóa với hiệu ứng lật thẻ 3D nhạy bén.
                </p>
              </div>

              <div className="rounded-3xl glass-card p-5 border border-white">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-200/80 flex items-center justify-center text-emerald-600 mb-3">
                  <BookOpen className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold font-display text-slate-900">
                  Lịch Học & Bài Tập
                </h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Theo dõi thời khóa biểu cả tuần, tiến độ từng môn và danh sách bài tập.
                </p>
              </div>
            </div>
          </div>

          {/* Cột Phải (5 cols): Khung Đăng Nhập Liquid Glass */}
          <div className="lg:col-span-5">
            <div className="relative overflow-hidden rounded-3xl glass-card p-8 sm:p-10 border border-white shadow-2xl">
              {/* Ánh sáng trang trí góc thẻ */}
              <div className="absolute -top-16 -right-16 w-48 h-48 bg-indigo-400/15 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-sky-400/15 rounded-full blur-3xl pointer-events-none" />

              <div className="relative z-10">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 block mb-1">
                      Cổng Truy Cập Học Sinh & Quản Trị
                    </span>
                    <h2 className="text-2xl font-extrabold font-display text-slate-900">
                      Đăng Nhập Hệ Thống
                    </h2>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600 shadow-inner">
                    <Lock className="w-5 h-5" />
                  </div>
                </div>

                {/* Thông báo lỗi nếu có */}
                {errorMsg && (
                  <div className="mb-5 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-start gap-2.5">
                    <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Trường Username */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Tên đăng nhập
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="text"
                        required
                        autoComplete="username"
                        placeholder="Nhập tên đăng nhập (VD: admin)"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 rounded-2xl text-sm font-medium focus:outline-none transition-all"
                      />
                    </div>
                  </div>

                  {/* Trường Mật khẩu */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Mật khẩu
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        autoComplete="current-password"
                        placeholder="Nhập mật khẩu của bạn"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full pl-11 pr-11 py-3 rounded-2xl text-sm font-medium focus:outline-none transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-indigo-600 transition-colors"
                        title={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                      >
                        {showPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Ghi nhớ phiên đăng nhập */}
                  <div className="flex items-center justify-between pt-1">
                    <label
                      onClick={() => setRememberMe(!rememberMe)}
                      className="flex items-center gap-2 text-xs font-medium text-slate-600 cursor-pointer select-none"
                    >
                      <CheckCircle2
                        className={`w-4 h-4 transition-colors ${
                          rememberMe ? 'text-indigo-600 fill-indigo-100' : 'text-slate-300'
                        }`}
                      />
                      <span>Duy trì trạng thái đăng nhập</span>
                    </label>

                    <span className="text-[11px] text-slate-400 font-medium">
                      Quên mật khẩu? Liên hệ Admin
                    </span>
                  </div>

                  {/* Nút Đăng nhập Sapphire */}
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full mt-2 py-3.5 px-6 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-500 text-white font-bold text-sm shadow-xl flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-white" />
                        <span className="text-white">Đang xác thực tài khoản...</span>
                      </>
                    ) : (
                      <>
                        <span className="text-white">Đăng Nhập Vào Trang Chủ</span>
                        <ArrowRight className="w-4 h-4 text-white" />
                      </>
                    )}
                  </button>
                </form>

                {/* Ghi chú không có chức năng tự đăng ký */}
                <div className="mt-6 pt-5 border-t border-slate-200/80 text-center">
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Hệ thống lưu trữ và phân quyền tập trung. Tắt chức năng tự đăng ký — tài khoản mới chỉ được khởi tạo bởi{' '}
                    <strong className="text-indigo-700 font-semibold">Quản trị viên hệ thống</strong>.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* 4. Footer */}
      <footer className="w-full py-4 px-6 text-center text-xs text-slate-400 z-10">
        © 2026 Beacon Learn — Hệ thống Tự học & Luyện thi THPT • Đồng bộ dữ liệu thời gian thực với Google Firebase
      </footer>
    </div>
  );
}
