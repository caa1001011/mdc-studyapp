import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X } from 'lucide-react';
import ClownfishSvg from './ClownfishSvg';
import {
  TAP_QUOTES,
  TAB_GREETINGS,
  getClownfishTier,
} from '../../services/mascotService';
import { fetchUserGameStats } from '../../services/gameService';

const MINIMIZE_STORAGE_KEY = 'lumina_clownfish_minimized';

export default function FloatingClownfish({ activeTab, currentUser }) {
  const username = currentUser?.username || 'student';

  const [minimized, setMinimized] = useState(() => {
    try {
      return localStorage.getItem(MINIMIZE_STORAGE_KEY) === '1';
    } catch {
      return false;
    }
  });
  const [suppressed, setSuppressed] = useState(false);
  const [xp, setXp] = useState(0);
  const [mood, setMood] = useState('idle');
  const [message, setMessage] = useState('');
  const [isFlipping, setIsFlipping] = useState(false);

  const hideTimerRef = useRef(null);
  const flipTimerRef = useRef(null);
  const prevTabRef = useRef(activeTab);

  const showBubble = useCallback((nextMood, nextMsg, duration = 4500) => {
    setMood(nextMood || 'happy');
    setMessage(nextMsg || '');
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => {
      setMessage('');
      setMood((curr) => (curr === 'study' ? 'study' : 'idle'));
    }, duration);
  }, []);

  // Tải XP thực tế để hiển thị đúng cấp tiến hóa Cá Hề trên toàn hệ thống
  useEffect(() => {
    let cancelled = false;
    fetchUserGameStats(username)
      .then((stats) => {
        if (!cancelled && stats) {
          setXp(Number(stats.totalXp || 0));
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [username]);

  // Lắng nghe sự kiện từ các màn hình học bài / nộp bài / flashcard / game
  useEffect(() => {
    const onMascot = (e) => {
      const detail = e.detail || {};
      if (!detail.message) return;
      showBubble(detail.mood || 'happy', detail.message, detail.duration || 4800);
    };
    const onSuppress = (e) => {
      setSuppressed(Boolean(e.detail?.suppressed));
    };
    const onXp = (e) => {
      if (typeof e.detail?.xp === 'number') {
        setXp(e.detail.xp);
      }
    };

    window.addEventListener('lumina:mascot', onMascot);
    window.addEventListener('lumina:mascot-suppress', onSuppress);
    window.addEventListener('lumina:mascot-xp', onXp);
    return () => {
      window.removeEventListener('lumina:mascot', onMascot);
      window.removeEventListener('lumina:mascot-suppress', onSuppress);
      window.removeEventListener('lumina:mascot-xp', onXp);
    };
  }, [showBubble]);

  // Chào nhẹ theo ngữ cảnh khi chuyển trang (không làm phiền nếu đã thu gọn)
  useEffect(() => {
    if (prevTabRef.current === activeTab) return;
    prevTabRef.current = activeTab;
    if (minimized || suppressed) return;
    const greeting = TAB_GREETINGS[activeTab];
    if (greeting) {
      const t = setTimeout(() => {
        showBubble(greeting.mood, greeting.message, 3800);
      }, 350);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [activeTab, minimized, suppressed, showBubble]);

  // Dọn timer khi unmount
  useEffect(() => {
    return () => {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
      if (flipTimerRef.current) clearTimeout(flipTimerRef.current);
    };
  }, []);

  const handleToggleMinimize = (nextVal) => {
    setMinimized(nextVal);
    try {
      localStorage.setItem(MINIMIZE_STORAGE_KEY, nextVal ? '1' : '0');
    } catch {
      // ignore
    }
    if (!nextVal) {
      showBubble('happy', 'Tớ quay lại rồi nè! Cùng học vui nhé!', 3200);
    }
  };

  const handleTapFish = () => {
    setIsFlipping(true);
    if (flipTimerRef.current) clearTimeout(flipTimerRef.current);
    flipTimerRef.current = setTimeout(() => setIsFlipping(false), 720);

    const quote = TAP_QUOTES[Math.floor(Math.random() * TAP_QUOTES.length)];
    showBubble('happy', quote, 4000);
  };

  if (suppressed) return null;

  const { tier } = getClownfishTier(xp);

  // Trạng thái thu gọn thành bong bóng nhỏ 1 chạm ở góc
  if (minimized) {
    return (
      <div className="fixed bottom-20 right-3 lg:bottom-5 lg:right-5 z-40">
        <button
          type="button"
          onClick={() => handleToggleMinimize(false)}
          title="Hiện linh vật Cá Hề"
          className="w-11 h-11 rounded-full bg-gradient-to-br from-orange-500/90 to-amber-500/90 border border-orange-300/60 shadow-lg flex items-center justify-center hover:scale-110 transition-transform cursor-pointer"
        >
          <ClownfishSvg mood="idle" tier={tier.id} size={32} showBubbles={false} />
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-20 right-3 lg:bottom-5 lg:right-5 z-40 pointer-events-none flex flex-col items-end gap-2 max-w-[270px] sm:max-w-[300px]">
      {/* Bong bóng thoại */}
      {message && (
        <div className="pointer-events-auto clownfish-speech-enter clownfish-bubble-box relative rounded-2xl rounded-br-sm px-3.5 py-2.5 text-xs sm:text-[13px] font-medium leading-snug">
          <div className="flex items-start gap-2">
            <span className="flex-1">{message}</span>
            <button
              type="button"
              onClick={() => setMessage('')}
              aria-label="Đóng lời thoại"
              className="text-slate-400 hover:text-orange-400 transition-colors shrink-0 mt-0.5 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Chú Cá Hề tương tác + nút thu gọn nhỏ */}
      <div className="pointer-events-auto relative group flex items-center">
        <button
          type="button"
          onClick={() => handleToggleMinimize(true)}
          title="Thu gọn Cá Hề"
          className="opacity-70 sm:opacity-0 sm:group-hover:opacity-100 absolute -top-1 -right-1 w-5 h-5 rounded-full bg-slate-900/80 border border-white/20 text-slate-300 hover:text-white flex items-center justify-center transition-opacity z-10 cursor-pointer"
        >
          <X className="w-3 h-3" />
        </button>

        <button
          type="button"
          onClick={handleTapFish}
          title={`${tier.name} — Chạm để tương tác!`}
          className="relative p-1 rounded-full hover:scale-105 active:scale-95 transition-transform cursor-pointer focus:outline-none"
        >
          <ClownfishSvg
            mood={mood}
            tier={tier.id}
            size={66}
            isFlipping={isFlipping}
            showBubbles
          />
        </button>
      </div>
    </div>
  );
}
