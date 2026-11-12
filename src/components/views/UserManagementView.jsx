import React, { useState, useEffect } from 'react';
import {
  Users,
  UserPlus,
  Shield,
  KeyRound,
  Trash2,
  Edit2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RefreshCw,
  Eye,
  EyeOff,
  X,
  GraduationCap,
  Crown
} from 'lucide-react';
import {
  fetchAllUsers,
  createNewUser,
  updateExistingUser,
  deleteExistingUser
} from '../../services/authService';

export default function UserManagementView({ currentUser, onUserUpdated }) {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  // Form tạo tài khoản mới
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newFullName, setNewFullName] = useState('');
  const [newTitle, setNewTitle] = useState('Học sinh Lớp 12A1');
  const [newRole, setNewRole] = useState('student');
  const [showNewPassword, setShowNewPassword] = useState(false);

  // Modal chỉnh sửa tài khoản
  const [editingUser, setEditingUser] = useState(null);
  const [editFullName, setEditFullName] = useState('');
  const [editTitle, setEditTitle] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editRole, setEditRole] = useState('student');

  // Hiển thị mật khẩu trong bảng danh sách
  const [visiblePasswords, setVisiblePasswords] = useState({});

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const list = await fetchAllUsers();
      setUsers(list);
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.message || 'Không thể tải danh sách người dùng từ Firebase.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setFeedback({ type: '', message: '' });
    setIsSubmitting(true);

    try {
      const created = await createNewUser({
        username: newUsername,
        password: newPassword,
        fullName: newFullName,
        title: newTitle,
        role: newRole,
      });

      setUsers((prev) => [created, ...prev.filter((u) => u.username !== created.username)]);
      setNewUsername('');
      setNewPassword('');
      setNewFullName('');
      setNewTitle('Học sinh Lớp 12A1');
      setNewRole('student');
      setFeedback({
        type: 'success',
        message: `Đã tạo thành công tài khoản "${created.username}" trên Firebase Firestore!`,
      });
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.message || 'Có lỗi xảy ra khi tạo tài khoản.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditModal = (u) => {
    setEditingUser(u);
    setEditFullName(u.fullName || '');
    setEditTitle(u.title || '');
    setEditPassword(u.password || '');
    setEditRole(u.role || 'student');
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingUser) return;
    setIsSubmitting(true);
    setFeedback({ type: '', message: '' });

    try {
      const updated = await updateExistingUser(editingUser.username, {
        fullName: editFullName.trim() || editingUser.username,
        title: editTitle.trim(),
        password: editPassword.trim(),
        role: editingUser.username === 'admin' ? 'admin' : editRole,
      });

      setUsers((prev) =>
        prev.map((item) => (item.username === updated.username ? updated : item))
      );

      if (currentUser && currentUser.username === updated.username && onUserUpdated) {
        onUserUpdated(updated);
      }

      setEditingUser(null);
      setFeedback({
        type: 'success',
        message: `Đã cập nhật tài khoản "${updated.username}" trên Firebase Firestore!`,
      });
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.message || 'Không thể cập nhật tài khoản.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteUser = async (username) => {
    if (username === 'admin') return;
    if (!window.confirm(`Bạn có chắc chắn muốn xóa tài khoản "${username}" khỏi hệ thống Firebase?`)) {
      return;
    }

    setFeedback({ type: '', message: '' });
    try {
      await deleteExistingUser(username);
      setUsers((prev) => prev.filter((u) => u.username !== username));
      setFeedback({
        type: 'success',
        message: `Đã xóa tài khoản "${username}" khỏi Firebase Firestore.`,
      });
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.message || 'Không thể xóa tài khoản.',
      });
    }
  };

  const toggleShowPass = (username) => {
    setVisiblePasswords((prev) => ({
      ...prev,
      [username]: !prev[username],
    }));
  };

  return (
    <div className="space-y-6 md:space-y-8 pb-12">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/15 border border-purple-500/30 text-purple-300 text-xs font-semibold mb-2">
            <Shield className="w-3.5 h-3.5 text-purple-300" />
            <span>Bảng Điều Khiển Quản Trị Hệ Thống Cao Nhất</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-display tracking-tight text-white">
            Quản Lý Tài Khoản Người Dùng
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">
            Cấp tài khoản mới, phân quyền và quản lý mật khẩu học sinh trực tiếp trên cơ sở dữ liệu Firebase Firestore
          </p>
        </div>

        <button
          onClick={loadUsers}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2.5 rounded-2xl glass-button text-xs font-semibold text-slate-200 hover:text-white self-start sm:self-auto"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-purple-400' : ''}`} />
          <span>Đồng bộ từ Firebase</span>
        </button>
      </div>

      {/* Feedback Banner */}
      {feedback.message && (
        <div
          className={`p-4 rounded-2xl border flex items-center justify-between gap-3 text-xs sm:text-sm font-semibold ${
            feedback.type === 'success'
              ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
              : 'bg-rose-500/15 border-rose-500/40 text-rose-300'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button
            onClick={() => setFeedback({ type: '', message: '' })}
            className="p-1 rounded-lg hover:bg-white/10"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 2. Main 3-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Cột Trái (1 col): Form Tạo Tài Khoản Mới */}
        <div className="rounded-3xl glass-card p-6 border border-purple-500/30 space-y-5">
          <div className="flex items-center gap-2.5 pb-3 border-b border-white/10">
            <div className="p-2.5 rounded-2xl bg-purple-500/20 text-purple-300 border border-purple-500/30">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold font-display text-white">
                Tạo Tài Khoản Mới
              </h2>
              <p className="text-[11px] text-slate-400">
                Lưu trực tiếp lên Cloud Firestore
              </p>
            </div>
          </div>

          <form onSubmit={handleCreateUser} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Tên đăng nhập (Username) *
              </label>
              <input
                type="text"
                required
                placeholder="VD: giaky12a1, hocsinh01..."
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-white text-xs focus:outline-none focus:border-purple-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Mật khẩu khởi tạo *
              </label>
              <div className="relative">
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  required
                  placeholder="Nhập mật khẩu (tối thiểu 4 ký tự)"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full pl-3.5 pr-10 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-white text-xs focus:outline-none focus:border-purple-400"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  {showNewPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Họ và Tên hiển thị *
              </label>
              <input
                type="text"
                required
                placeholder="VD: Nguyễn Gia Kỳ"
                value={newFullName}
                onChange={(e) => setNewFullName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-white text-xs focus:outline-none focus:border-purple-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Lớp / Chức danh
              </label>
              <input
                type="text"
                placeholder="VD: Học sinh Lớp 12A1"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-white text-xs focus:outline-none focus:border-purple-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Phân quyền hệ thống
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setNewRole('student')}
                  className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                    newRole === 'student'
                      ? 'bg-purple-600/30 text-white border-purple-400/50 shadow-sm'
                      : 'bg-white/[0.03] border-white/10 text-slate-400 hover:text-white'
                  }`}
                >
                  <GraduationCap className="w-4 h-4" />
                  <span>Học Sinh</span>
                </button>

                <button
                  type="button"
                  onClick={() => setNewRole('admin')}
                  className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                    newRole === 'admin'
                      ? 'bg-amber-500/25 text-amber-200 border-amber-400/50 shadow-sm'
                      : 'bg-white/[0.03] border-white/10 text-slate-400 hover:text-white'
                  }`}
                >
                  <Crown className="w-4 h-4 text-amber-400" />
                  <span>Quản Trị Viên</span>
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 px-5 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-purple-600/30 hover:scale-[1.01] transition-all flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span className="text-white">Đang tạo trên Firebase...</span>
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4 text-white" />
                  <span className="text-white">Cấp Tài Khoản Mới</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Cột Phải (2 cols): Danh sách tài khoản trên Firebase */}
        <div className="lg:col-span-2 rounded-3xl glass-card p-6 border border-white/10 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-2xl bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold font-display text-white">
                  Danh Sách Tài Khoản Hệ Thống ({users.length})
                </h2>
                <p className="text-[11px] text-slate-400">
                  Dữ liệu được lưu trữ trên collection <code className="text-purple-300">users</code> của Firebase
                </p>
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="py-16 text-center space-y-3">
              <Loader2 className="w-8 h-8 text-purple-400 animate-spin mx-auto" />
              <p className="text-xs text-slate-400">Đang tải danh sách tài khoản từ Firebase Firestore...</p>
            </div>
          ) : (
            <div className="space-y-3">
              {users.map((u) => {
                const isRootAdmin = u.username === 'admin';
                const isPassShown = Boolean(visiblePasswords[u.username]);

                return (
                  <div
                    key={u.username}
                    className={`p-4 rounded-2xl glass-card border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                      isRootAdmin
                        ? 'border-amber-500/40 bg-amber-500/[0.05]'
                        : 'border-white/10 hover:border-purple-400/40'
                    }`}
                  >
                    <div className="flex items-center gap-3.5">
                      <img
                        src={
                          u.avatar ||
                          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
                        }
                        alt={u.fullName}
                        className="w-11 h-11 rounded-2xl object-cover border border-white/20 flex-shrink-0"
                      />

                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-sm font-bold font-display text-white">
                            {u.fullName || u.username}
                          </h3>
                          <span
                            className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                              u.role === 'admin'
                                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                                : 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                            }`}
                          >
                            {isRootAdmin
                              ? '★ Quản trị tối cao'
                              : u.role === 'admin'
                              ? 'Quản trị viên'
                              : 'Học sinh'}
                          </span>
                        </div>

                        <div className="mt-1 flex items-center gap-3 flex-wrap text-xs text-slate-400">
                          <span>
                            Username: <strong className="text-purple-300 font-mono">{u.username}</strong>
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <KeyRound className="w-3 h-3 text-slate-400" />
                            <span>Mật khẩu:</span>
                            <strong className="text-white font-mono">
                              {isPassShown ? u.password : '••••••'}
                            </strong>
                            <button
                              type="button"
                              onClick={() => toggleShowPass(u.username)}
                              className="ml-1 text-slate-400 hover:text-purple-300"
                              title={isPassShown ? 'Ẩn mật khẩu' : 'Xem mật khẩu'}
                            >
                              {isPassShown ? (
                                <EyeOff className="w-3 h-3" />
                              ) : (
                                <Eye className="w-3 h-3" />
                              )}
                            </button>
                          </span>
                          {u.title && (
                            <>
                              <span>•</span>
                              <span>{u.title}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <button
                        onClick={() => openEditModal(u)}
                        className="px-3 py-1.5 rounded-xl glass-button text-xs font-semibold text-slate-200 hover:text-white flex items-center gap-1.5"
                        title="Đổi mật khẩu / Chỉnh sửa"
                      >
                        <Edit2 className="w-3.5 h-3.5 text-purple-400" />
                        <span>Sửa</span>
                      </button>

                      {!isRootAdmin && (
                        <button
                          onClick={() => handleDeleteUser(u.username)}
                          className="p-2 rounded-xl glass-button text-rose-400 hover:bg-rose-500/20 transition-all"
                          title="Xóa tài khoản"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* 3. Modal Chỉnh sửa tài khoản */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
          <div className="w-full max-w-md rounded-3xl glass-card p-6 border border-white/20 shadow-2xl relative">
            <button
              onClick={() => setEditingUser(null)}
              className="absolute top-5 right-5 p-1 rounded-xl text-slate-400 hover:text-white glass-button"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-lg font-bold font-display text-white mb-1">
              Chỉnh Sửa Tài Khoản: <span className="text-purple-300 font-mono">{editingUser.username}</span>
            </h3>
            <p className="text-xs text-slate-400 mb-5">
              Cập nhật họ tên, chức danh hoặc đổi mật khẩu cho tài khoản này
            </p>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Họ và Tên hiển thị
                </label>
                <input
                  type="text"
                  required
                  value={editFullName}
                  onChange={(e) => setEditFullName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.05] border border-white/10 text-white text-xs focus:outline-none focus:border-purple-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Lớp / Chức danh
                </label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.05] border border-white/10 text-white text-xs focus:outline-none focus:border-purple-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Mật khẩu
                </label>
                <input
                  type="text"
                  required
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.05] border border-white/10 text-white font-mono text-xs focus:outline-none focus:border-purple-400"
                />
              </div>

              {editingUser.username !== 'admin' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Vai trò
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setEditRole('student')}
                      className={`p-2.5 rounded-xl border text-xs font-semibold ${
                        editRole === 'student'
                          ? 'bg-purple-600/30 text-white border-purple-400/50'
                          : 'bg-white/[0.03] border-white/10 text-slate-400'
                      }`}
                    >
                      Học Sinh
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditRole('admin')}
                      className={`p-2.5 rounded-xl border text-xs font-semibold ${
                        editRole === 'admin'
                          ? 'bg-amber-500/25 text-amber-200 border-amber-400/50'
                          : 'bg-white/[0.03] border-white/10 text-slate-400'
                      }`}
                    >
                      Quản Trị Viên
                    </button>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2.5 rounded-xl glass-button text-xs font-semibold text-slate-300 hover:text-white"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-xs font-bold shadow-lg shadow-purple-600/30"
                >
                  Lưu Thay Đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
