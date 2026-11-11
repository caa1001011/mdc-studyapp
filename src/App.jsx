import React, { useState, useEffect, Suspense, lazy } from 'react';
import AuroraBackground from './components/AuroraBackground';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import PageLoading from './components/PageLoading';

// Code Splitting / Lazy Loading: Mỗi phân hệ là 1 file riêng biệt
const DashboardView = lazy(() => import('./components/views/DashboardView'));
const TimetableView = lazy(() => import('./components/views/TimetableView'));
const StudySpaceView = lazy(() => import('./components/views/StudySpaceView'));
const FlashcardView = lazy(() => import('./components/views/FlashcardView'));
const QuizReviewView = lazy(() => import('./components/views/QuizReviewView'));
const PomodoroView = lazy(() => import('./components/views/PomodoroView'));
const GamificationView = lazy(() => import('./components/views/GamificationView'));

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Theme State: 'dark' (mặc định) hoặc 'light' (giao diện sáng)
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('lumina_theme');
    return saved ? saved : 'dark';
  });

  // Cập nhật class 'dark' trên thẻ <html> và lưu vào localStorage
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('lumina_theme', theme);
  }, [theme]);

  // Cơ chế giấu đường dẫn (URL Masking): Giữ địa chỉ luôn là http://localhost:5173/
  useEffect(() => {
    if (window.location.pathname !== '/' || window.location.hash !== '' || window.location.search !== '') {
      window.history.replaceState(null, '', '/');
    }
  }, [activeTab]);

  // Render phân hệ được chọn với Suspense
  const renderView = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardView setActiveTab={setActiveTab} />;
      case 'timetable':
        return <TimetableView />;
      case 'study':
        return <StudySpaceView />;
      case 'flashcards':
        return <FlashcardView />;
      case 'quiz':
        return <QuizReviewView />;
      case 'pomodoro':
        return <PomodoroView />;
      case 'games':
        return <GamificationView />;
      default:
        return <DashboardView setActiveTab={setActiveTab} />;
    }
  };

  return (
    <div className={`min-h-screen relative transition-colors duration-500 selection:bg-purple-500/30 selection:text-purple-200 ${
      theme === 'dark' ? 'text-slate-100' : 'text-slate-800'
    }`}>
      {/* 1. Global Ambient Glow Background (Tự thích ứng theo Dark / Light Mode) */}
      <AuroraBackground theme={theme} />

      {/* 2. Top Navigation Bar (Tích hợp Nút chuyển đổi Sáng / Tối) */}
      <Navbar activeTab={activeTab} theme={theme} setTheme={setTheme} />

      {/* 3. Main Desktop Layout Container */}
      <div className="max-w-[1720px] mx-auto flex">
        {/* Desktop Fixed Left Sidebar */}
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} theme={theme} />

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
