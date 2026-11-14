import React, { useState, useEffect, Suspense, lazy } from 'react';
import AuroraBackground from './components/AuroraBackground';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import PageLoading from './components/PageLoading';
import LoginView from './components/views/LoginView';
import { getSessionUser, saveSessionUser, clearSessionUser, ensureAdminAccount } from './services/authService';

// Code Splitting / Lazy Loading: Mỗi phân hệ là 1 file riêng biệt
const DashboardView = lazy(() => import('./components/views/DashboardView'));
const TimetableView = lazy(() => import('./components/views/TimetableView'));
const StudySpaceView = lazy(() => import('./components/views/StudySpaceView'));
const FlashcardView = lazy(() => import('./components/views/FlashcardView'));
const QuizReviewView = lazy(() => import('./components/views/QuizReviewView'));
const GamificationView = lazy(() => import('./components/views/GamificationView'));
const UserManagementView = lazy(() => import('./components/views/UserManagementView'));

export default function App() {
  // Duy trì trạng thái đăng nhập: Khi refresh trang sẽ giữ nguyên tài khoản, chỉ đăng xuất khi bấm nút Đăng xuất
  const [currentUser, setCurrentUser] = useState(() => getSessionUser());
  const [activeTab, setActiveTab] = useState('dashboard');

  // Theme State cho Trang Chủ sau khi đăng nhập: 'dark' (mặc định) hoặc 'light'
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('lumina_theme');
    return saved ? saved : 'dark';
  });

  // Khởi tạo tài khoản admin mặc định trên Firebase Firestore ngay khi mở ứng dụng
  useEffect(() => {
    ensureAdminAccount();
  }, []);

  // Cập nhật class 'dark' trên thẻ <html>:
  // - Nếu chưa đăng nhập (đang ở Trang Đăng Nhập): Luôn luôn là Giao diện Sáng (Light Mode)
  // - Nếu đã đăng nhập: Áp dụng theo theme người dùng chọn
  useEffect(() => {
    const root = document.documentElement;
    if (!currentUser) {
      root.classList.remove('dark');
      return;
    }

    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('lumina_theme', theme);
  }, [theme, currentUser]);

  // Cơ chế giấu đường dẫn (URL Masking)
  useEffect(() => {
    if (window.location.pathname !== '/' || window.location.hash !== '' || window.location.search !== '') {
      window.history.replaceState(null, '', '/');
    }
  }, [activeTab, currentUser]);

  const handleLoginSuccess = (userData) => {
    saveSessionUser(userData);
    setCurrentUser(userData);
    setActiveTab('dashboard');
  };

  const handleLogout = () => {
    clearSessionUser();
    setCurrentUser(null);
    setActiveTab('dashboard');
  };

  // Nếu chưa đăng nhập -> Hiển thị Trang Đăng Nhập (luôn ở Giao diện Sáng)
  if (!currentUser) {
    return <LoginView onLoginSuccess={handleLoginSuccess} />;
  }

  // Render phân hệ được chọn sau khi đăng nhập thành công
  const renderView = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardView setActiveTab={setActiveTab} currentUser={currentUser} />;
      case 'timetable':
        return <TimetableView currentUser={currentUser} />;
      case 'study':
        return <StudySpaceView currentUser={currentUser} />;
      case 'flashcards':
        return <FlashcardView currentUser={currentUser} />;
      case 'quiz':
        return <QuizReviewView />;
      case 'games':
        return <GamificationView />;
      case 'users':
        return currentUser?.role === 'admin' ? (
          <UserManagementView
            currentUser={currentUser}
            onUserUpdated={(updated) => setCurrentUser(updated)}
          />
        ) : (
          <DashboardView setActiveTab={setActiveTab} currentUser={currentUser} />
        );
      default:
        return <DashboardView setActiveTab={setActiveTab} currentUser={currentUser} />;
    }
  };

  return (
    <div className={`min-h-screen relative transition-colors duration-500 selection:bg-purple-500/30 selection:text-purple-200 ${
      theme === 'dark' ? 'text-slate-100' : 'text-slate-800'
    }`}>
      {/* 1. Global Ambient Glow Background (Tự thích ứng theo Dark / Light Mode) */}
      <AuroraBackground theme={theme} />

      {/* 2. Top Navigation Bar (Tích hợp Nút chuyển đổi Sáng / Tối & Đăng xuất) */}
      <Navbar
        activeTab={activeTab}
        theme={theme}
        setTheme={setTheme}
        currentUser={currentUser}
        onLogout={handleLogout}
      />

      {/* 3. Main Desktop Layout Container */}
      <div className="max-w-[1720px] mx-auto flex">
        {/* Desktop Fixed Left Sidebar */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          theme={theme}
          currentUser={currentUser}
        />

        {/* Desktop Expansive Main Stage */}
        <main className="flex-1 min-w-0 px-6 lg:px-10 py-6 pb-16">
          <Suspense fallback={<PageLoading />}>
            {renderView()}
          </Suspense>
        </main>
      </div>
    </div>
  );
}
