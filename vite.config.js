import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  build: {
    // Tách mã nguồn thành các file (chunks) độc lập cho từng tính năng / trang
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('DashboardView')) return 'view-dashboard';
          if (id.includes('TimetableView')) return 'view-timetable';
          if (id.includes('StudySpaceView')) return 'view-study';
          if (id.includes('FlashcardView')) return 'view-flashcard';
          if (id.includes('QuizReviewView')) return 'view-quiz';
          if (id.includes('PomodoroView')) return 'view-pomodoro';
          if (id.includes('GamificationView')) return 'view-gamification';
          if (id.includes('node_modules')) return 'vendor';
        },
      },
    },
  },
})
