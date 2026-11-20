import React, { useId } from 'react';

/**
 * Linh vật Cá Hề (Clownfish) vẽ bằng SVG + CSS animation thuần (60fps, siêu nhẹ).
 * Hỗ trợ 7 biểu cảm (mood) và 4 cấp tiến hóa (tier: baby | scholar | knight | king).
 */
export default function ClownfishSvg({
  mood = 'idle',
  tier = 'baby',
  size = 72,
  isFlipping = false,
  showBubbles = true,
  className = '',
}) {
  const uid = useId().replace(/:/g, '');
  const isFastTail = mood === 'combo' || mood === 'urgent' || mood === 'celebrate';
  const showSunglasses = mood === 'combo';
  const showStudyGlasses = !showSunglasses && (mood === 'study' || tier === 'scholar');
  const showHeadband = tier === 'knight';
  const showCrown = tier === 'king' || mood === 'celebrate';
  const showAura = tier === 'king' || mood === 'combo' || mood === 'celebrate';

  const animClass = isFlipping
    ? 'clownfish-anim-flip'
    : mood === 'celebrate'
      ? 'clownfish-anim-celebrate'
      : mood === 'combo'
        ? 'clownfish-anim-combo'
        : mood === 'happy'
          ? 'clownfish-anim-happy'
          : mood === 'wrong'
            ? 'clownfish-anim-wrong'
            : mood === 'urgent'
              ? 'clownfish-anim-urgent'
              : 'clownfish-anim-idle';

  const bodyGradId = `cf-body-${uid}`;
  const finGradId = `cf-fin-${uid}`;
  const auraGradId = `cf-aura-${uid}`;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 110"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`select-none overflow-visible ${animClass} ${className}`}
      aria-label="Linh vật Cá Hề"
    >
      <defs>
        <linearGradient id={bodyGradId} x1="20" y1="26" x2="96" y2="84" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor={tier === 'king' ? '#fbbf24' : '#ff8c38'} />
          <stop offset="55%" stopColor={tier === 'king' ? '#f97316' : '#f9601b'} />
          <stop offset="100%" stopColor={tier === 'king' ? '#ea580c' : '#d93f0b'} />
        </linearGradient>
        <linearGradient id={finGradId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ff9b42" />
          <stop offset="100%" stopColor="#ea4c10" />
        </linearGradient>
        <radialGradient id={auraGradId} cx="50%" cy="50%" r="50%">
          <stop
            offset="0%"
            stopColor={mood === 'combo' ? '#f59e0b' : tier === 'king' ? '#facc15' : '#38bdf8'}
            stopOpacity="0.45"
          />
          <stop offset="100%" stopColor="#f97316" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Hào quang khi Combo / Ăn mừng / Hoàng Kim */}
      {showAura && <circle cx="58" cy="58" r="46" fill={`url(#${auraGradId})`} />}

      {/* Bong bóng nước bay lên */}
      {showBubbles && (
        <g>
          <circle
            cx="15"
            cy="42"
            r="4.2"
            fill="#bae6fd"
            fillOpacity="0.65"
            stroke="#e0f2fe"
            strokeWidth="1.2"
            className="clownfish-bubble-1"
          />
          <circle
            cx="9"
            cy="28"
            r="2.7"
            fill="#bae6fd"
            fillOpacity="0.55"
            stroke="#e0f2fe"
            strokeWidth="1"
            className="clownfish-bubble-2"
          />
          <circle
            cx="22"
            cy="23"
            r="2.1"
            fill="#e0f2fe"
            fillOpacity="0.7"
            className="clownfish-bubble-3"
          />
        </g>
      )}

      {/* Vây đuôi vẫy liên tục */}
      <g className={isFastTail ? 'clownfish-tail-fast' : 'clownfish-tail'}>
        <path
          d="M89 57 C101 42, 113 41, 112 57 C113 73, 101 72, 89 57 Z"
          fill={`url(#${finGradId})`}
          stroke="#1e1b4b"
          strokeWidth="2.8"
          strokeLinejoin="round"
        />
        <path d="M96 51 C102 49, 105 51, 107 54" stroke="#ffffff" strokeWidth="1.8" strokeLinecap="round" opacity="0.6" />
      </g>

      {/* Vây lưng trên */}
      <path
        d="M42 35 C47 20, 66 20, 74 35 C65 37, 50 37, 42 35 Z"
        fill={`url(#${finGradId})`}
        stroke="#1e1b4b"
        strokeWidth="2.6"
        strokeLinejoin="round"
      />
      <path
        d="M72 37 C77 27, 86 29, 86 41"
        fill={`url(#${finGradId})`}
        stroke="#1e1b4b"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Vây bụng dưới */}
      <path
        d="M54 78 C58 89, 71 89, 75 76"
        fill={`url(#${finGradId})`}
        stroke="#1e1b4b"
        strokeWidth="2.4"
        strokeLinejoin="round"
      />

      {/* Thân Cá Hề bầu bĩnh */}
      <ellipse
        cx="56"
        cy="58"
        rx="36"
        ry="24"
        fill={`url(#${bodyGradId})`}
        stroke="#1e1b4b"
        strokeWidth="3"
      />

      {/* 3 sọc trắng đặc trưng của Cá Hề */}
      {/* Sọc đầu */}
      <path
        d="M39 36 C34 49, 34 67, 40 79 C44 80, 48 80, 49 79 C44 67, 44 49, 48 36 C45 35, 42 35, 39 36 Z"
        fill="#ffffff"
        stroke="#1e1b4b"
        strokeWidth="2.2"
        strokeLinejoin="round"
      />
      {/* Sọc giữa */}
      <path
        d="M61 34 C57 48, 57 68, 62 82 C66 82, 70 81, 71 80 C67 67, 67 49, 70 36 C67 35, 64 34, 61 34 Z"
        fill="#ffffff"
        stroke="#1e1b4b"
        strokeWidth="2.2"
        strokeLinejoin="round"
      />
      {/* Sọc nhỏ gần đuôi */}
      <path
        d="M82 43 C79 52, 79 64, 82 72 C85 70, 87 68, 88 66 C86 60, 86 54, 88 49 C86 46, 84 44, 82 43 Z"
        fill="#ffffff"
        stroke="#1e1b4b"
        strokeWidth="2"
        strokeLinejoin="round"
      />

      {/* Ánh sáng bóng nhẹ trên lưng */}
      <ellipse cx="48" cy="43" rx="13" ry="4" fill="#ffffff" opacity="0.22" />

      {/* Vây bên hông vẫy */}
      <g className="clownfish-fin">
        <path
          d="M52 61 C44 69, 49 78, 59 73 C62 71, 61 64, 52 61 Z"
          fill="#ff9e44"
          stroke="#1e1b4b"
          strokeWidth="2.3"
          strokeLinejoin="round"
        />
      </g>

      {/* Má hồng dễ thương */}
      <ellipse cx="32" cy="64" rx="4.2" ry="2.4" fill="#fda4af" opacity="0.7" />

      {/* BIỂU CẢM MẮT & MIỆNG */}
      {showSunglasses ? (
        /* Kính râm Combo bốc lửa */
        <g>
          <rect x="21" y="47" width="16" height="10" rx="3.5" fill="#0f172a" stroke="#facc15" strokeWidth="1.8" />
          <line x1="24" y1="50" x2="29" y2="54" stroke="#38bdf8" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="37" y1="51" x2="43" y2="49" stroke="#facc15" strokeWidth="1.8" />
        </g>
      ) : mood === 'happy' || mood === 'celebrate' ? (
        /* Mắt cười cong vui vẻ */
        <path
          d="M25 54 C27 49, 33 49, 35 54"
          stroke="#1e1b4b"
          strokeWidth="3"
          strokeLinecap="round"
        />
      ) : mood === 'wrong' ? (
        /* Mắt hơi choáng kiểu dễ thương (><) */
        <g stroke="#1e1b4b" strokeWidth="2.6" strokeLinecap="round">
          <line x1="26" y1="49" x2="34" y2="57" />
          <line x1="34" y1="49" x2="26" y2="57" />
        </g>
      ) : mood === 'urgent' ? (
        /* Mắt mở to hồi hộp */
        <g>
          <circle cx="30" cy="53" r="6.5" fill="#ffffff" stroke="#1e1b4b" strokeWidth="2.2" />
          <circle cx="29" cy="53" r="2.6" fill="#0f172a" />
          <circle cx="28" cy="51.5" r="1" fill="#ffffff" />
        </g>
      ) : (
        /* Mắt tròn long lanh mặc định / học bài */
        <g>
          <circle cx="30" cy="53" r="5.6" fill="#ffffff" stroke="#1e1b4b" strokeWidth="2" />
          <circle cx="29" cy="53" r="3.2" fill="#0f172a" />
          <circle cx="27.5" cy="51.2" r="1.4" fill="#ffffff" />
        </g>
      )}

      {/* Kính học bá (Study mode / Scholar tier) */}
      {showStudyGlasses && (
        <g>
          <circle cx="30" cy="53" r="7.4" fill="#e0f2fe" fillOpacity="0.22" stroke="#1e293b" strokeWidth="2" />
          <line x1="37.4" y1="52" x2="44" y2="50" stroke="#1e293b" strokeWidth="1.8" strokeLinecap="round" />
        </g>
      )}

      {/* Miệng theo tâm trạng */}
      {mood === 'wrong' ? (
        <path d="M23 65 Q26 62 29 65" stroke="#1e1b4b" strokeWidth="2.2" strokeLinecap="round" fill="none" />
      ) : mood === 'urgent' ? (
        <ellipse cx="25" cy="65" rx="2.8" ry="3.5" fill="#1e1b4b" />
      ) : mood === 'celebrate' || mood === 'happy' || mood === 'combo' ? (
        <path d="M22 62 Q26 69 31 63" stroke="#1e1b4b" strokeWidth="2.4" strokeLinecap="round" fill="#fecdd3" />
      ) : (
        <path d="M23 62 Q26.5 66 30 62.5" stroke="#1e1b4b" strokeWidth="2.3" strokeLinecap="round" fill="none" />
      )}

      {/* Giọt mồ hôi khi gấp / sai */}
      {(mood === 'urgent' || mood === 'wrong') && (
        <path
          d="M40 41 C40 41, 44 46, 44 48.5 C44 50.5, 42.2 52, 40 52 C37.8 52, 36 50.5, 36 48.5 C36 46, 40 41, 40 41 Z"
          fill="#38bdf8"
          stroke="#0284c7"
          strokeWidth="1.2"
        />
      )}

      {/* PHỤ KIỆN TIẾN HÓA */}
      {/* Băng đô Hiệp Sĩ (Tier 3) */}
      {showHeadband && !showCrown && (
        <g>
          <path d="M26 40 Q40 34 51 39" stroke="#6366f1" strokeWidth="4.5" strokeLinecap="round" />
          <circle cx="38" cy="37" r="3" fill="#facc15" stroke="#1e1b4b" strokeWidth="1.2" />
        </g>
      )}

      {/* Vương miện Hoàng Kim (Tier 4 hoặc khi Ăn mừng) */}
      {showCrown && (
        <g transform="translate(27, 16) rotate(-10)">
          <path
            d="M2 16 L0 5 L7 10 L12 2 L17 10 L24 5 L22 16 Z"
            fill="#facc15"
            stroke="#92400e"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <circle cx="12" cy="12" r="1.8" fill="#ef4444" />
        </g>
      )}

      {/* Ngôi sao lấp lánh khi Celebrate / Combo */}
      {(mood === 'celebrate' || mood === 'combo') && (
        <g>
          <path
            d="M95 26 L97 31 L102 33 L97 35 L95 40 L93 35 L88 33 L93 31 Z"
            fill="#facc15"
          />
          <path
            d="M17 18 L18.5 21.5 L22 23 L18.5 24.5 L17 28 L15.5 24.5 L12 23 L15.5 21.5 Z"
            fill="#38bdf8"
          />
        </g>
      )}
    </svg>
  );
}
