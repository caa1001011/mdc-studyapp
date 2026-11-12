import React, { useState, useEffect } from 'react';
import {
  User,
  Lock,
  ArrowRight,
  Eye,
  EyeOff,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { loginWithCredentials, ensureAdminAccount } from '../../services/authService';

export default function LoginView({ onLoginSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Luôn luôn đảm bảo Trang Đăng Nhập hiển thị giao diện Sáng chuẩn
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('dark');

    // Khởi tạo tài khoản admin mặc định (admin / 123456) trên Firestore nếu chưa có
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
      setErrorMsg(err.message || 'Tên đăng nhập hoặc mật khẩu không chính xác.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#f8fafc] flex flex-col justify-between items-center px-4 py-8 select-none">
      <div className="w-full flex-1 flex flex-col items-center justify-center max-w-lg mx-auto">
        {/* 1. Logo Beacon Learn chính thức của dự án (giống trang chủ) */}
        <div className="mb-4 flex flex-col items-center">
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl overflow-hidden flex items-center justify-center p-1 bg-white shadow-md border border-slate-200/80">
            <img
              src="/logo.png"
              alt="Beacon Learn Logo"
              className="w-full h-full object-cover rounded-2xl"
            />
          </div>

          <h1 className="mt-4 text-2xl sm:text-[26px] font-bold text-slate-800 tracking-tight text-center font-display">
            Đăng nhập ứng dụng
          </h1>
          <p className="mt-1 text-sm font-medium text-slate-500 text-center">
            Beacon Learn — Ứng Dụng Tự Học & Luyện Thi THPT
          </p>
        </div>

        {/* 2. Khung đăng nhập trung tâm với viền Gradient đa sắc (Rainbow Gradient Border) */}
        <div className="w-full max-w-[420px] p-[2.5px] rounded-[26px] bg-gradient-to-tr from-orange-500 via-amber-400 via-emerald-400 to-cyan-400 shadow-xl shadow-slate-200/60">
          <div className="w-full bg-white rounded-[24px] p-6 sm:p-8">
            {/* Thông báo lỗi nếu đăng nhập sai */}
            {errorMsg && (
              <div className="mb-5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2 animate-fadeIn">
                <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Trường TÀI KHOẢN */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  TÀI KHOẢN
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    autoComplete="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Nhập tên đăng nhập"
                    className="w-full pl-10 pr-4 py-2.5 sm:py-3 rounded-xl border border-emerald-400 text-sm text-slate-800 placeholder-slate-400 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-400/40 focus:border-emerald-500 transition-all font-medium"
                  />
                </div>
              </div>

              {/* Trường MẬT KHẨU */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  MẬT KHẨU
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Nhập mật khẩu"
                    className="w-full pl-10 pr-10 py-2.5 sm:py-3 rounded-xl border border-emerald-400 text-sm text-slate-800 placeholder-slate-400 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-400/40 focus:border-emerald-500 transition-all font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
                    title={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Checkbox Ghi nhớ */}
              <div className="flex items-center pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-600 font-normal">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  />
                  <span>Ghi nhớ tên đăng nhập và mật khẩu</span>
                </label>
              </div>

              {/* Nút Đăng Nhập Màu Xanh Tím Đồng Bộ */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-3 py-3 px-4 rounded-xl bg-gradient-to-r from-[#4f46e5] to-[#5b4fe8] hover:from-[#4338ca] hover:to-[#4f46e5] active:scale-[0.99] text-white text-sm font-semibold shadow-md shadow-indigo-500/25 flex items-center justify-center gap-1.5 transition-all duration-200 cursor-pointer disabled:opacity-70"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Đang xác thực...</span>
                  </>
                ) : (
                  <>
                    <span>Đăng Nhập</span>
                    <ArrowRight className="w-4 h-4 text-white" />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* 3. Chân trang Footer Beacon Learn */}
      <footer className="mt-8 text-center text-xs text-slate-400 font-mono">
        © 2026 Beacon Learn. All rights reserved.
      </footer>
    </div>
  );
}
