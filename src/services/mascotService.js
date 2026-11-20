// Hệ thống sự kiện & tiến hóa linh vật Cá Hề (Clownfish Mascot)

export const CLOWNFISH_TIERS = [
  {
    id: 'baby',
    name: 'Cá Hề Con',
    minXp: 0,
    badge: 'Cấp 1',
    accent: 'from-orange-400 to-amber-500',
    desc: 'Vui tính, luôn cổ vũ bạn trên mọi chặng đường học tập',
  },
  {
    id: 'scholar',
    name: 'Cá Hề Học Bá',
    minXp: 150,
    badge: 'Cấp 2',
    accent: 'from-sky-400 to-indigo-500',
    desc: 'Đeo kính tri thức — sẵn sàng chinh phục mọi công thức khó',
  },
  {
    id: 'knight',
    name: 'Cá Hề Hiệp Sĩ',
    minXp: 400,
    badge: 'Cấp 3',
    accent: 'from-violet-500 to-fuchsia-500',
    desc: 'Băng đô chiến binh — phản xạ siêu tốc, bất bại mọi đấu trường',
  },
  {
    id: 'king',
    name: 'Cá Hề Hoàng Kim',
    minXp: 800,
    badge: 'Cấp 4 • Tối thượng',
    accent: 'from-amber-400 via-yellow-400 to-orange-500',
    desc: 'Vương miện hào quang — thủ khoa đích thực của hệ thống!',
  },
];

export function getClownfishTier(xp = 0) {
  const safeXp = Math.max(0, Number(xp) || 0);
  let idx = 0;
  for (let i = CLOWNFISH_TIERS.length - 1; i >= 0; i -= 1) {
    if (safeXp >= CLOWNFISH_TIERS[i].minXp) {
      idx = i;
      break;
    }
  }
  const tier = CLOWNFISH_TIERS[idx];
  const nextTier = CLOWNFISH_TIERS[idx + 1] || null;
  const progressPct = nextTier
    ? Math.min(
        100,
        Math.round(((safeXp - tier.minXp) / Math.max(1, nextTier.minXp - tier.minXp)) * 100),
      )
    : 100;
  const xpToNext = nextTier ? Math.max(0, nextTier.minXp - safeXp) : 0;

  return { tier, nextTier, progressPct, xpToNext, xp: safeXp };
}

export function emitMascotEvent({ mood = 'happy', message = '', duration = 4500 } = {}) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(
    new CustomEvent('lumina:mascot', {
      detail: { mood, message, duration, ts: Date.now() },
    }),
  );
}

export function setMascotSuppressed(suppressed) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(
    new CustomEvent('lumina:mascot-suppress', {
      detail: { suppressed: Boolean(suppressed) },
    }),
  );
}

export function setMascotXp(xp) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(
    new CustomEvent('lumina:mascot-xp', {
      detail: { xp: Math.max(0, Number(xp) || 0) },
    }),
  );
}

const pickRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];

export const TAP_QUOTES = [
  'Bong bóng may mắn tặng bạn nè! Học tốt nha!',
  'Hê hê, nhột quá! Nhớ giữ phong độ học tập nhé!',
  'Mỗi ngày một chút, kiến thức tự khắc vững vàng!',
  'Mệt rồi thì nghỉ mắt 30 giây rồi chiến tiếp nha!',
  'Vào Trò chơi học tập kiếm XP nâng cấp cho tớ đi!',
  'Bạn giỏi hơn bạn nghĩ nhiều đó, cố lên nào!',
];

export const TAB_GREETINGS = {
  dashboard: {
    mood: 'idle',
    message: 'Chào bạn! Hôm nay mình cùng chinh phục môn nào đây?',
  },
  study: {
    mood: 'study',
    message: 'Đeo kính lên học bài nào! Tớ ngồi đây cổ vũ bạn nhé!',
  },
  flashcards: {
    mood: 'happy',
    message: 'Lật thẻ từ vựng siêu tốc thôi — trí nhớ tăng vù vù!',
  },
  quiz: {
    mood: 'study',
    message: 'Bình tĩnh đọc kỹ đề nha! Làm xong tớ sẽ chúc mừng bạn!',
  },
  games: {
    mood: 'celebrate',
    message: 'Đến sân chơi của tớ rồi! Vào game săn Combo & XP thôi!',
  },
};

export function getScoreReaction(scoreOutOf10, label = 'bài làm') {
  const s = Number(scoreOutOf10) || 0;
  if (s >= 8.5) {
    return {
      mood: 'celebrate',
      message: pickRandom([
        `Xuất sắc ${s.toFixed(1)}/10! Chúc mừng bạn chinh phục ${label}!`,
        `Đỉnh quá đi! ${s.toFixed(1)}/10 luôn — tớ thả pháo bong bóng ăn mừng nè!`,
        `Quá đỉnh ${s.toFixed(1)}/10! Học bá đích thực là đây!`,
      ]),
    };
  }
  if (s >= 6.5) {
    return {
      mood: 'happy',
      message: pickRandom([
        `Khá lắm! Đạt ${s.toFixed(1)}/10 cho ${label} — cố thêm chút nữa là chạm mốc 9-10!`,
        `Chúc mừng hoàn thành ${label} (${s.toFixed(1)}/10)! Xem lại câu sai để lên trình nhé!`,
      ]),
    };
  }
  if (s >= 4.5) {
    return {
      mood: 'study',
      message: `Hoàn thành ${label} (${s.toFixed(1)}/10)! Ôn kỹ lời giải bên dưới, lần sau chắc chắn bứt phá!`,
    };
  }
  return {
    mood: 'wrong',
    message: `Không sao đâu (${s.toFixed(1)}/10)! Cứ xem kỹ giải thích từng câu rồi làm lại, tớ luôn cổ vũ bạn!`,
  };
}

export function getGameReaction(type, meta = {}) {
  switch (type) {
    case 'start':
      return {
        mood: 'happy',
        message: pickRandom([
          'Sẵn sàng chưa? Bơi hết tốc lực săn điểm cao nào!',
          'Khởi động vây nào! Chinh phục ván này nhé!',
        ]),
      };
    case 'correct':
      if ((meta.combo || 0) >= 3) {
        return {
          mood: 'combo',
          message: pickRandom([
            `Combo ×${meta.combo}! Bốc lửa quá, không ai cản nổi!`,
            `Siêu tốc! Chuỗi ${meta.combo} câu chuẩn xác liên tiếp!`,
            `Đeo kính râm lên nào — Combo ×${meta.combo} quá chất!`,
          ]),
        };
      }
      if ((meta.combo || 0) === 2) {
        return {
          mood: 'combo',
          message: 'Combo ×2! Giữ vững nhịp phản xạ nhé!',
        };
      }
      return {
        mood: 'happy',
        message: pickRandom([
          'Chuẩn xác! + điểm ngay!',
          'Tuyệt vời! Phản xạ nhanh lắm!',
          'Đúng rồi! Tiếp tục phát huy nhé!',
          'Hay quá! Kiến thức vững ghê!',
        ]),
      };
    case 'wrong':
      return {
        mood: 'wrong',
        message: pickRandom([
          'Ôi suýt trúng! Bình tĩnh gỡ lại câu sau nhé!',
          'Hụt xíu thôi! Ghi nhớ đáp án này rồi chiến tiếp!',
          'Không sao đâu, vấp nhẹ để nhớ lâu hơn!',
        ]),
      };
    case 'urgent_time':
      return {
        mood: 'urgent',
        message: 'Chỉ còn vài giây nữa thôi! Tăng tốc hết cỡ nào!',
      };
    case 'urgent_life':
      return {
        mood: 'urgent',
        message: 'Cẩn thận, chỉ còn 1 tim thôi! Đọc kỹ nhé!',
      };
    case 'record':
      return {
        mood: 'celebrate',
        message: 'PHÁ KỶ LỤC CÁ NHÂN! Chúc mừng nhà vô địch đại dương!',
      };
    case 'finish_great':
      return {
        mood: 'celebrate',
        message: 'Chơi quá xuất sắc! Nhận XP để giúp tớ tiến hóa nhé!',
      };
    case 'finish_good':
      return {
        mood: 'happy',
        message: 'Ván đấu hay lắm! Chơi thêm 1 ván nữa để phá kỷ lục nào!',
      };
    case 'finish_try':
      return {
        mood: 'study',
        message: 'Đừng nản nhé! Xem lại các câu sai bên dưới rồi phục thù ngay!',
      };
    default:
      return { mood: 'idle', message: 'Cố lên nhé!' };
  }
}
