import React, { useState, useEffect } from 'react';
import {
  User,
  Lock,
  ArrowRight,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  Loader2,
  UserPlus,
  GraduationCap,
  IdCard
} from 'lucide-react';
import {
  loginWithCredentials,
  ensureAdminAccount,
  registerStudentAccount
} from '../../services/authService';

const REMEMBER_STORAGE_KEY = 'beacon_remembered_credentials';

export default function LoginView({ onLoginSuccess }) {
  const [mode, setMode] = useState('login'); // 'login' | 'register'

  // Login state
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // Register state (Student only)
  const [fullName, setFullName] = useState('');
  const [className, setClassName] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Shared UI state
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // 1. Đảm bảo giao diện Sáng chuẩn và nạp thông tin ghi nhớ nếu có
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('dark');

    // Khởi tạo tài khoản admin mặc định (admin / 123456) trên Firestore nếu chưa có
    ensureAdminAccount();

    // Nạp thông tin tài khoản và mật khẩu đã lưu từ trước
    try {
      const saved = localStorage.getItem(REMEMBER_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.username) setUsername(parsed.username);
        if (parsed.password) setPassword(parsed.password);
        setRememberMe(true);
      }
    } catch (e) {
      console.error('Lỗi khi đọc thông tin ghi nhớ đăng nhập:', e);
    }
  }, []);

  const switchMode = (nextMode) => {
    setMode(nextMode);
    setErrorMsg('');
    if (nextMode === 'register') {
      setSuccessMsg('');
    }
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setIsLoading(true);

    try {
      const userData = await loginWithCredentials(username, password);

      // Xử lý ghi nhớ thông tin đăng nhập
      if (rememberMe) {
        localStorage.setItem(
          REMEMBER_STORAGE_KEY,
          JSON.stringify({
            username: username.trim(),
            password: password.trim()
          })
        );
      } else {
        localStorage.removeItem(REMEMBER_STORAGE_KEY);
      }

      onLoginSuccess(userData);
    } catch (err) {
      setErrorMsg(err.message || 'Tên đăng nhập hoặc mật khẩu không chính xác.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!fullName.trim()) {
      setErrorMsg('Vui lòng nhập họ và tên.');
      return;
    }
    if (regPassword.trim().length < 6) {
      setErrorMsg('Mật khẩu phải có ít nhất 6 ký tự.');
      return;
    }
    if (regPassword !== confirmPassword) {
      setErrorMsg('Mật khẩu xác nhận không khớp. Vui lòng kiểm tra lại.');
      return;
    }

    setIsLoading(true);
    try {
      const created = await registerStudentAccount({
        username: regUsername,
        password: regPassword,
        fullName,
        className
      });

      // Cách B: Thông báo thành công, chuyển về form đăng nhập và điền sẵn tên đăng nhập
      setUsername(created.username);
      setPassword('');
      setFullName('');
      setClassName('');
      setRegUsername('');
      setRegPassword('');
      setConfirmPassword('');
      setMode('login');
      setSuccessMsg(
        `Đăng ký tài khoản "${created.username}" thành công! Vui lòng nhập mật khẩu để đăng nhập.`
      );
    } catch (err) {
      setErrorMsg(err.message || 'Không thể đăng ký tài khoản. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  const isRegister = mode === 'register';

  return (
    <div className="min-h-screen w-full bg-[#f1f5f9] flex flex-col justify-between items-center px-4 py-8 select-none">
      <div className="w-full flex-1 flex flex-col items-center justify-center max-w-lg mx-auto">
        {/* 1. Logo Beacon Learn chính thức của dự án */}
        <div className="mb-5 flex flex-col items-center">
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl overflow-hidden flex items-center justify-center p-1.5 bg-white shadow-md border border-slate-200">
            <img
              src="/logo.png"
              alt="Beacon Learn Logo"
              className="w-full h-full object-cover rounded-2xl"
            />
          </div>

          <h1
            className="mt-4 text-2xl sm:text-[26px] font-bold tracking-tight text-center font-display"
            style={{ color: '#0f172a' }}
          >
            {isRegister ? 'Đăng ký tài khoản' : 'Đăng nhập ứng dụng'}
          </h1>
          <p
            className="mt-1 text-sm font-medium text-center"
            style={{ color: '#475569' }}
          >
            Beacon Learn — Ứng Dụng Tự Học &amp; Luyện Thi THPT
          </p>
          {isRegister && (
            <span className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold">
              <GraduationCap className="w-3.5 h-3.5" />
              <span>Dành cho tài khoản học sinh</span>
            </span>
          )}
        </div>

        {/* 2. Khung trung tâm với viền Gradient đa sắc nổi bật */}
        <div
          className="w-full max-w-[440px] p-[2.5px] rounded-[26px] shadow-xl shadow-slate-300/60"
          style={{
            background: 'linear-gradient(135deg, #f97316 0%, #fbbf24 35%, #10b981 70%, #06b6d4 100%)'
          }}
        >
          <div className="w-full bg-white rounded-[24px] p-6 sm:p-8">
            {/* Thông báo thành công (sau khi đăng ký xong) */}
            {successMsg && (
              <div className="mb-5 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* Thông báo lỗi nếu có */}
            {errorMsg && (
              <div className="mb-5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {!isRegister ? (
              /* ==================== FORM ĐĂNG NHẬP ==================== */
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                {/* Trường TÀI KHOẢN */}
                <div>
                  <label
                    className="block text-xs font-bold uppercase tracking-wider mb-2"
                    style={{ color: '#1e293b' }}
                  >
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
                      style={{ color: '#0f172a', backgroundColor: '#ffffff', borderColor: '#10b981' }}
                      className="w-full pl-10 pr-4 py-2.5 sm:py-3 rounded-xl border-2 text-sm font-medium placeholder:text-slate-400 focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-400/30 transition-all"
                    />
                  </div>
                </div>

                {/* Trường MẬT KHẨU */}
                <div>
                  <label
                    className="block text-xs font-bold uppercase tracking-wider mb-2"
                    style={{ color: '#1e293b' }}
                  >
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
                      style={{ color: '#0f172a', backgroundColor: '#ffffff', borderColor: '#10b981' }}
                      className="w-full pl-10 pr-10 py-2.5 sm:py-3 rounded-xl border-2 text-sm font-medium placeholder:text-slate-400 focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-400/30 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-700 focus:outline-none cursor-pointer"
                      title={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Checkbox Ghi nhớ tên đăng nhập và mật khẩu */}
                <div className="flex items-center pt-1">
                  <label
                    htmlFor="rememberMeLogin"
                    className="flex items-center gap-2.5 cursor-pointer text-xs font-medium select-none"
                    style={{ color: '#334155' }}
                  >
                    <input
                      id="rememberMeLogin"
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer accent-indigo-600"
                    />
                    <span style={{ color: '#334155' }}>Ghi nhớ tên đăng nhập và mật khẩu</span>
                  </label>
                </div>

                {/* Nút Đăng Nhập */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full mt-4 py-3.5 px-5 rounded-2xl text-sm font-bold tracking-wide shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2 transition-all duration-200 cursor-pointer disabled:opacity-60 disabled:pointer-events-none hover:opacity-95 active:scale-[0.99]"
                  style={{ backgroundColor: '#4f46e5', color: '#ffffff' }}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" style={{ color: '#ffffff' }} />
                      <span style={{ color: '#ffffff' }}>Đang xác thực...</span>
                    </>
                  ) : (
                    <>
                      <span style={{ color: '#ffffff' }}>Đăng Nhập</span>
                      <ArrowRight className="w-4 h-4" style={{ color: '#ffffff' }} />
                    </>
                  )}
                </button>

                {/* Chuyển sang Đăng ký tài khoản học sinh */}
                <div className="pt-4 mt-2 border-t border-slate-100 text-center">
                  <p className="text-xs font-medium" style={{ color: '#475569' }}>
                    Chưa có tài khoản?{' '}
                    <button
                      type="button"
                      onClick={() => switchMode('register')}
                      className="font-bold text-indigo-600 hover:text-indigo-700 hover:underline cursor-pointer"
                    >
                      Đăng ký tài khoản học sinh
                    </button>
                  </p>
                </div>
              </form>
            ) : (
              /* ==================== FORM ĐĂNG KÝ HỌC SINH ==================== */
              <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Họ và tên */}
                  <div>
                    <label
                      className="block text-xs font-bold uppercase tracking-wider mb-1.5"
                      style={{ color: '#1e293b' }}
                    >
                      HỌ VÀ TÊN *
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <IdCard className="w-4 h-4" />
                      </div>
                      <input
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Nguyễn Văn A"
                        style={{ color: '#0f172a', backgroundColor: '#ffffff', borderColor: '#10b981' }}
                        className="w-full pl-9 pr-3 py-2.5 rounded-xl border-2 text-sm font-medium placeholder:text-slate-400 focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-400/30 transition-all"
                      />
                    </div>
                  </div>

                  {/* Lớp (tùy chọn) */}
                  <div>
                    <label
                      className="block text-xs font-bold uppercase tracking-wider mb-1.5"
                      style={{ color: '#1e293b' }}
                    >
                      LỚP (TÙY CHỌN)
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <GraduationCap className="w-4 h-4" />
                      </div>
                      <input
                        type="text"
                        value={className}
                        onChange={(e) => setClassName(e.target.value)}
                        placeholder="VD: Lớp 11A1"
                        style={{ color: '#0f172a', backgroundColor: '#ffffff', borderColor: '#cbd5e1' }}
                        className="w-full pl-9 pr-3 py-2.5 rounded-xl border-2 text-sm font-medium placeholder:text-slate-400 focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-400/30 transition-all"
                      />
                    </div>
                  </div>
                </div>

                {/* Tên đăng nhập */}
                <div>
                  <label
                    className="block text-xs font-bold uppercase tracking-wider mb-1.5"
                    style={{ color: '#1e293b' }}
                  >
                    TÊN ĐĂNG NHẬP *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <User className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      required
                      autoComplete="username"
                      value={regUsername}
                      onChange={(e) => setRegUsername(e.target.value)}
                      placeholder="VD: minhanh11a1 (tối thiểu 3 ký tự)"
                      style={{ color: '#0f172a', backgroundColor: '#ffffff', borderColor: '#10b981' }}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border-2 text-sm font-medium placeholder:text-slate-400 focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-400/30 transition-all"
                    />
                  </div>
                </div>

                {/* Mật khẩu */}
                <div>
                  <label
                    className="block text-xs font-bold uppercase tracking-wider mb-1.5"
                    style={{ color: '#1e293b' }}
                  >
                    MẬT KHẨU *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type={showRegPassword ? 'text' : 'password'}
                      required
                      autoComplete="new-password"
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="Tối thiểu 6 ký tự"
                      style={{ color: '#0f172a', backgroundColor: '#ffffff', borderColor: '#10b981' }}
                      className="w-full pl-10 pr-10 py-2.5 rounded-xl border-2 text-sm font-medium placeholder:text-slate-400 focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-400/30 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegPassword(!showRegPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-700 focus:outline-none cursor-pointer"
                      title={showRegPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                    >
                      {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Xác nhận mật khẩu */}
                <div>
                  <label
                    className="block text-xs font-bold uppercase tracking-wider mb-1.5"
                    style={{ color: '#1e293b' }}
                  >
                    XÁC NHẬN MẬT KHẨU *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      autoComplete="new-password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Nhập lại mật khẩu"
                      style={{ color: '#0f172a', backgroundColor: '#ffffff', borderColor: '#10b981' }}
                      className="w-full pl-10 pr-10 py-2.5 rounded-xl border-2 text-sm font-medium placeholder:text-slate-400 focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-400/30 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-700 focus:outline-none cursor-pointer"
                      title={showConfirmPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Nút Đăng Ký */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full mt-2 py-3.5 px-5 rounded-2xl text-sm font-bold tracking-wide shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 transition-all duration-200 cursor-pointer disabled:opacity-60 disabled:pointer-events-none hover:opacity-95 active:scale-[0.99]"
                  style={{ backgroundColor: '#059669', color: '#ffffff' }}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" style={{ color: '#ffffff' }} />
                      <span style={{ color: '#ffffff' }}>Đang tạo tài khoản...</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" style={{ color: '#ffffff' }} />
                      <span style={{ color: '#ffffff' }}>Đăng Ký Tài Khoản</span>
                    </>
                  )}
                </button>

                {/* Quay lại Đăng nhập */}
                <div className="pt-3.5 mt-2 border-t border-slate-100 text-center">
                  <p className="text-xs font-medium" style={{ color: '#475569' }}>
                    Đã có tài khoản?{' '}
                    <button
                      type="button"
                      onClick={() => switchMode('login')}
                      className="font-bold text-indigo-600 hover:text-indigo-700 hover:underline cursor-pointer"
                    >
                      Quay lại đăng nhập
                    </button>
                  </p>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* 3. Chân trang Footer rõ nét */}
      <footer className="mt-8 text-center text-xs font-mono" style={{ color: '#64748b' }}>
        © 2026 Beacon Learn. All rights reserved.
      </footer>
    </div>
  );
}
