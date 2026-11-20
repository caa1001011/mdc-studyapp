import { collection, doc, getDoc, getDocs, setDoc } from 'firebase/firestore';
import { db } from './firebase';
import { generateGeminiText } from './geminiService';
import { formatMathText } from '../utils/mathFormat';
import { FALLBACK_GAME_DATA } from '../data/gameFallbackData';

const CACHE_COLLECTION = 'game_question_cache';
const LEADERBOARD_COLLECTION = 'game_leaderboard';
const LOCAL_CACHE_PREFIX = 'beacon_game_cache_';
const LOCAL_SCOPE_PREFIX = 'beacon_game_scope_';
const LOCAL_STATS_PREFIX = 'beacon_game_stats_';

export const GAME_CATALOG = [
  // TOÁN HỌC
  {
    id: 'math-blitz',
    subjectId: 'sub-1',
    subjectName: 'Toán Học',
    title: 'Phản Xạ Công Thức 60s',
    subtitle: 'Tính nhanh lượng giác, đạo hàm, logarit, dãy số trong 60 giây với chuỗi Combo ×4',
    skill: 'Phản xạ nhanh',
    engine: 'blitz',
    accent: 'from-purple-600 to-indigo-600',
    badgeClass: 'bg-purple-500/15 text-purple-300 border-purple-400/30',
    iconName: 'Zap',
  },
  {
    id: 'math-memory',
    subjectId: 'sub-1',
    subjectName: 'Toán Học',
    title: 'Lật Thẻ Công Thức',
    subtitle: 'Ghép đôi biểu thức Toán học và kết quả tương ứng để rèn trí nhớ dài hạn',
    skill: 'Trí nhớ sâu',
    engine: 'memory',
    accent: 'from-violet-600 to-fuchsia-600',
    badgeClass: 'bg-purple-500/15 text-purple-300 border-purple-400/30',
    iconName: 'Grid2x2',
  },

  // VẬT LÝ
  {
    id: 'physics-drop',
    subjectId: 'sub-2',
    subjectName: 'Vật Lý',
    title: 'Thiên Thạch Công Thức',
    subtitle: 'Chọn đúng công thức & đơn vị SI trước khi khối câu hỏi rơi chạm đáy (3 mạng)',
    skill: 'Phản xạ & Đơn vị',
    engine: 'drop',
    accent: 'from-cyan-600 to-blue-600',
    badgeClass: 'bg-cyan-500/15 text-cyan-300 border-cyan-400/30',
    iconName: 'Atom',
  },
  {
    id: 'physics-tf',
    subjectId: 'sub-2',
    subjectName: 'Vật Lý',
    title: 'Phán Xét Tốc Độ Đúng/Sai',
    subtitle: '6 giây cho mỗi nhận định lý thuyết Vật Lý — rèn kỹ năng né bẫy trắc nghiệm',
    skill: 'Né bẫy lý thuyết',
    engine: 'tf-rush',
    accent: 'from-sky-600 to-indigo-600',
    badgeClass: 'bg-cyan-500/15 text-cyan-300 border-cyan-400/30',
    iconName: 'Scale',
  },

  // HÓA HỌC
  {
    id: 'chem-reaction',
    subjectId: 'sub-4',
    subjectName: 'Hóa Học',
    title: 'Phòng Thí Nghiệm Phản Ứng',
    subtitle: 'Hoàn thành phương trình hóa học, nhận biết màu kết tủa và hiện tượng thí nghiệm',
    skill: 'Phương trình & Hiện tượng',
    engine: 'blitz',
    accent: 'from-emerald-600 to-teal-600',
    badgeClass: 'bg-emerald-500/15 text-emerald-300 border-emerald-400/30',
    iconName: 'FlaskConical',
  },
  {
    id: 'chem-element',
    subjectId: 'sub-4',
    subjectName: 'Hóa Học',
    title: 'Săn Nguyên Tố & Hóa Trị',
    subtitle: 'Chế độ sinh tồn 3 mạng chinh phục Ký hiệu, Nguyên tử khối (M) và Hóa trị',
    skill: 'Thuộc bảng M & Hóa trị',
    engine: 'survival',
    accent: 'from-teal-600 to-cyan-600',
    badgeClass: 'bg-emerald-500/15 text-emerald-300 border-emerald-400/30',
    iconName: 'Sparkles',
  },

  // TIẾNG ANH
  {
    id: 'eng-scramble',
    subjectId: 'sub-3',
    subjectName: 'Tiếng Anh',
    title: 'Xếp Chữ Săn Từ Vựng',
    subtitle: 'Chạm sắp xếp chữ cái tạo thành từ Tiếng Anh đúng theo nghĩa & phiên âm IPA',
    skill: 'Nhớ mặt chữ & Chính tả',
    engine: 'scramble',
    accent: 'from-amber-500 to-orange-600',
    badgeClass: 'bg-amber-500/15 text-amber-300 border-amber-400/30',
    iconName: 'Type',
  },
  {
    id: 'eng-link',
    subjectId: 'sub-3',
    subjectName: 'Tiếng Anh',
    title: 'Nối Nghĩa Siêu Tốc',
    subtitle: 'Nối nhanh các cặp từ vựng / Collocation 2 cột liên tục để dọn bảng trong 60 giây',
    skill: 'Phản xạ từ vựng',
    engine: 'link',
    accent: 'from-orange-500 to-rose-500',
    badgeClass: 'bg-amber-500/15 text-amber-300 border-amber-400/30',
    iconName: 'Link2',
  },
];

function hashKey(str) {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash + str.charCodeAt(i)) >>> 0;
  }
  return hash.toString(36);
}

function buildCacheDocId(gameId, subjectId, lessonNames) {
  const normalized = [...lessonNames]
    .map((n) => String(n || '').trim().toLowerCase())
    .filter(Boolean)
    .sort()
    .join('|');
  return `${gameId}_${subjectId}_${hashKey(normalized || 'default')}`;
}

function shuffleArray(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function shuffleMcBalanced(questions) {
  if (!Array.isArray(questions) || questions.length === 0) return [];
  const slots = shuffleArray(questions.map((_, i) => i % 4));

  return questions.map((q, idx) => {
    const opts = Array.isArray(q.options) ? q.options.slice(0, 4) : [];
    if (opts.length !== 4) return q;
    const correctIdx = Math.min(3, Math.max(0, Number(q.correctIndex) || 0));
    const correctVal = opts[correctIdx];
    const wrongVals = shuffleArray(opts.filter((_, i) => i !== correctIdx));
    const targetIdx = slots[idx];
    const nextOpts = [];
    let w = 0;
    for (let s = 0; s < 4; s++) {
      nextOpts.push(s === targetIdx ? correctVal : wrongVals[w++]);
    }
    return { ...q, options: nextOpts, correctIndex: targetIdx };
  });
}

/**
 * Chuẩn hóa dữ liệu bộ câu hỏi theo từng engine game
 */
function sanitizeGameItems(engine, rawItems) {
  if (!Array.isArray(rawItems)) return [];

  if (engine === 'memory' || engine === 'link') {
    return rawItems
      .filter((it) => it?.left && it?.right)
      .map((it) => ({
        left: formatMathText(String(it.left).trim()),
        right: formatMathText(String(it.right).trim()),
      }));
  }

  if (engine === 'tf-rush') {
    return rawItems
      .filter((it) => it?.statement)
      .map((it) => ({
        statement: formatMathText(String(it.statement).trim()),
        isTrue: Boolean(it.isTrue),
        explanation: formatMathText(String(it.explanation || '').trim()),
      }));
  }

  if (engine === 'scramble') {
    return rawItems
      .filter((it) => it?.word && it?.meaning)
      .map((it) => {
        const cleanWord = String(it.word)
          .replace(/\([^)]*\)/g, '')
          .replace(/[^a-zA-Z]/g, '')
          .toUpperCase()
          .trim();
        return {
          word: cleanWord,
          meaning: String(it.meaning).trim(),
          phonetic: String(it.phonetic || '').trim(),
          hint: String(it.hint || '').trim(),
        };
      })
      .filter((it) => it.word.length >= 3 && it.word.length <= 14);
  }

  // blitz | drop | survival (MC 4 options)
  const cleaned = rawItems
    .filter((q) => q?.question && Array.isArray(q.options) && q.options.length >= 4)
    .map((q) => ({
      question: formatMathText(String(q.question).trim()),
      options: q.options
        .slice(0, 4)
        .map((o) => formatMathText(String(o || '').replace(/^[A-Da-d]\s*[.):]\s*/, '').trim())),
      correctIndex: Math.min(3, Math.max(0, Number(q.correctIndex) || 0)),
      explanation: formatMathText(String(q.explanation || '').trim()),
    }));

  return shuffleMcBalanced(cleaned);
}

/**
 * Tạo prompt Gemini chuyên biệt cho từng trò chơi, khoanh vùng CHÍNH XÁC theo các bài đã chọn
 */
function buildGamePrompt(game, selectedLessons) {
  const lessonsStr = selectedLessons.join('; ');
  const mathRule =
    'TUYỆT ĐỐI KHÔNG dùng mã LaTeX (không dùng $, \\frac, \\sqrt, \\alpha, \\pi, ^\\circ...). Hãy dùng trực tiếp ký hiệu Unicode rõ ràng: α, β, π, °, √, ², ³, ≤, ≥, ≠, ±, ·, ×, ⇒, ⇔, phân số dạng 1/2, √3/2, -3π/4, công thức Hóa dạng H₂SO₄, FeCl₂, CO₂.';

  if (game.engine === 'memory') {
    return `Bạn là giáo viên THPT môn ${game.subjectName}. Hãy tạo ĐÚNG 12 cặp thẻ ghép đôi (Biểu thức/Công thức ↔ Kết quả/Định lý ngắn gọn) cho trò chơi "${game.title}".
PHẠM VI KIẾN THỨC BẮT BUỘC: CHỈ nằm trong các bài học sau: [${lessonsStr}]. Không ra kiến thức ngoài các bài này.
${mathRule}
Trả về DUY NHẤT 1 mảng JSON hợp lệ (không markdown):
[
  { "left": "Biểu thức hoặc tên công thức ngắn", "right": "Kết quả hoặc công thức tương ứng ngắn" }
]`;
  }

  if (game.engine === 'link') {
    return `Bạn là giáo viên Tiếng Anh THPT. Hãy tạo ĐÚNG 15 cặp từ vựng / cụm từ (Collocation / Phrasal Verb) và nghĩa tiếng Việt ngắn gọn cho trò chơi "${game.title}".
PHẠM VI KIẾN THỨC BẮT BUỘC: CHỈ bám sát các bài/chủ đề sau: [${lessonsStr}].
Trả về DUY NHẤT 1 mảng JSON hợp lệ (không markdown):
[
  { "left": "từ hoặc cụm từ tiếng Anh", "right": "nghĩa tiếng Việt ngắn gọn" }
]`;
  }

  if (game.engine === 'scramble') {
    return `Bạn là giáo viên Tiếng Anh THPT. Hãy tạo ĐÚNG 12 từ vựng đơn (CHỈ 1 từ gồm 4 đến 12 chữ cái tiếng Anh, không dấu cách, không dấu gạch nối) cho trò chơi xếp chữ "${game.title}".
PHẠM VI KIẾN THỨC BẮT BUỘC: CHỈ bám sát các bài/chủ đề sau: [${lessonsStr}].
Trả về DUY NHẤT 1 mảng JSON hợp lệ (không markdown):
[
  { "word": "ENVIRONMENT", "meaning": "Môi trường", "phonetic": "/ɪnˈvaɪ.rən.mənt/", "hint": "Gợi ý ngắn bằng tiếng Việt" }
]`;
  }

  if (game.engine === 'tf-rush') {
    return `Bạn là giáo viên THPT môn ${game.subjectName}. Hãy tạo ĐÚNG 14 mệnh đề lý thuyết ngắn gọn (nửa đúng, nửa sai, có bẫy thường gặp) cho trò chơi "${game.title}".
PHẠM VI KIẾN THỨC BẮT BUỘC: CHỈ nằm trong các bài học sau: [${lessonsStr}]. Không ra kiến thức ngoài các bài này.
${mathRule}
Trả về DUY NHẤT 1 mảng JSON hợp lệ (không markdown):
[
  { "statement": "Mệnh đề khẳng định ngắn gọn", "isTrue": true, "explanation": "Giải thích siêu ngắn 1 câu" }
]`;
  }

  // blitz | drop | survival
  return `Bạn là giáo viên THPT môn ${game.subjectName}. Hãy tạo ĐÚNG 14 câu hỏi trắc nghiệm phản xạ nhanh (ngắn gọn, rõ ràng, 4 đáp án ngắn) cho trò chơi "${game.title}".
PHẠM VI KIẾN THỨC BẮT BUỘC: CHỈ nằm trong các bài học sau: [${lessonsStr}]. Tuyệt đối không ra câu hỏi thuộc bài chưa học.
${mathRule}
Trả về DUY NHẤT 1 mảng JSON hợp lệ (không markdown):
[
  { "question": "Câu hỏi ngắn gọn", "options": ["Đáp án 1", "Đáp án 2", "Đáp án 3", "Đáp án 4"], "correctIndex": 0, "explanation": "Giải thích ngắn 1 câu" }
]`;
}

/**
 * Trích xuất bộ từ vựng trực tiếp từ các bộ Flashcard đã chọn (Tầng 1 — tức thì cho môn Tiếng Anh)
 */
function extractFromFlashcardDecks(engine, decks) {
  const allCards = (decks || []).flatMap((d) => d.cards || []);
  if (allCards.length === 0) return [];

  if (engine === 'scramble') {
    return sanitizeGameItems(
      'scramble',
      allCards.map((c) => ({
        word: c.front,
        meaning: c.back,
        phonetic: c.phonetic || '',
        hint: c.hint || '',
      }))
    );
  }

  if (engine === 'link') {
    return sanitizeGameItems(
      'link',
      allCards.map((c) => ({
        left: String(c.front || '').replace(/\([^)]*\)/g, '').trim(),
        right: String(c.back || '').trim(),
      }))
    );
  }

  return [];
}

/**
 * TẢI CÂU HỎI 3 TẦNG THÔNG MINH (Phương án 3):
 * - Tầng 1: Flashcard (Tiếng Anh) hoặc Cache Firestore / LocalStorage (tức thì 0.2s)
 * - Tầng 2: AI Gemini sinh câu hỏi bám sát các bài học đã khoanh vùng & tự lưu Cache Firestore
 * - Tầng 3: Bộ câu hỏi chuẩn dự phòng theo môn (không bao giờ lỗi / gián đoạn)
 */
export async function loadGameQuestions({
  game,
  selectedLessons = [],
  selectedFlashcardDecks = [],
  forceRefreshAI = false,
}) {
  // TẦNG 1A: Nếu Tiếng Anh và học sinh chọn chơi từ bộ Flashcard -> lấy trực tiếp tức thì!
  if (
    game.subjectId === 'sub-3' &&
    selectedFlashcardDecks.length > 0 &&
    !forceRefreshAI
  ) {
    const fcItems = extractFromFlashcardDecks(game.engine, selectedFlashcardDecks);
    if (fcItems.length >= 4) {
      return {
        items: shuffleArray(fcItems),
        source: 'flashcard',
        sourceLabel: `Từ ${selectedFlashcardDecks.length} bộ Flashcard`,
      };
    }
  }

  const cleanLessons = selectedLessons.map((s) => String(s || '').trim()).filter(Boolean);

  // Nếu chưa chọn bài cụ thể nào -> dùng kho tổng hợp có sẵn
  if (cleanLessons.length === 0) {
    return {
      items: shuffleArray(sanitizeGameItems(game.engine, FALLBACK_GAME_DATA[game.id] || [])),
      source: 'fallback',
      sourceLabel: 'Kho câu hỏi tổng hợp',
    };
  }

  const cacheId = buildCacheDocId(game.id, game.subjectId, cleanLessons);

  // TẦNG 1B: Kiểm tra Cache (LocalStorage -> Firestore) nếu không bấm "Làm mới bằng AI"
  if (!forceRefreshAI) {
    try {
      const localRaw = localStorage.getItem(LOCAL_CACHE_PREFIX + cacheId);
      if (localRaw) {
        const parsed = JSON.parse(localRaw);
        if (Array.isArray(parsed?.items) && parsed.items.length >= 4) {
          return {
            items: shuffleArray(sanitizeGameItems(game.engine, parsed.items)),
            source: 'cache',
            sourceLabel: `Kho câu hỏi theo ${cleanLessons.length} bài đã chọn`,
          };
        }
      }
    } catch {
      // ignore local cache parse error
    }

    if (db) {
      try {
        const snap = await getDoc(doc(db, CACHE_COLLECTION, cacheId));
        if (snap.exists() && Array.isArray(snap.data()?.items) && snap.data().items.length >= 4) {
          const cachedItems = sanitizeGameItems(game.engine, snap.data().items);
          try {
            localStorage.setItem(
              LOCAL_CACHE_PREFIX + cacheId,
              JSON.stringify({ items: cachedItems, cachedAt: Date.now() })
            );
          } catch {
            // ignore quota
          }
          return {
            items: shuffleArray(cachedItems),
            source: 'cache',
            sourceLabel: `Kho câu hỏi theo ${cleanLessons.length} bài đã chọn`,
          };
        }
      } catch (err) {
        console.warn('Không đọc được cache game trên Firestore:', err);
      }
    }
  }

  // TẦNG 2: Gọi AI Gemini tạo bộ câu hỏi bám sát đúng các bài đã khoanh vùng & lưu Cache Firestore
  try {
    const prompt = buildGamePrompt(game, cleanLessons);
    const rawText = await generateGeminiText({
      parts: [{ text: prompt }],
      temperature: forceRefreshAI ? 0.55 : 0.35,
    });

    const jsonMatch = rawText.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      const items = sanitizeGameItems(game.engine, parsed);
      if (items.length >= 4) {
        const payload = {
          id: cacheId,
          gameId: game.id,
          subjectId: game.subjectId,
          lessons: cleanLessons,
          items,
          updatedAt: new Date().toISOString(),
        };

        try {
          localStorage.setItem(LOCAL_CACHE_PREFIX + cacheId, JSON.stringify(payload));
        } catch {
          // ignore
        }

        if (db) {
          setDoc(doc(db, CACHE_COLLECTION, cacheId), payload, { merge: true }).catch(() => {});
        }

        return {
          items: shuffleArray(items),
          source: 'ai',
          sourceLabel: `AI tạo theo ${cleanLessons.length} bài đã chọn`,
        };
      }
    }
  } catch (err) {
    console.warn('AI tạo câu hỏi game thất bại, chuyển sang kho dự phòng:', err);
  }

  // TẦNG 3: Dự phòng an toàn tuyệt đối
  return {
    items: shuffleArray(sanitizeGameItems(game.engine, FALLBACK_GAME_DATA[game.id] || [])),
    source: 'fallback',
    sourceLabel: 'Kho câu hỏi chuẩn dự phòng',
  };
}

/**
 * Lưu / Đọc mốc khoanh vùng bài học của từng học sinh theo môn
 */
export function loadUserGameScope(username, subjectId) {
  try {
    const raw = localStorage.getItem(`${LOCAL_SCOPE_PREFIX}${username}_${subjectId}`);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveUserGameScope(username, subjectId, scopeData) {
  try {
    localStorage.setItem(
      `${LOCAL_SCOPE_PREFIX}${username}_${subjectId}`,
      JSON.stringify(scopeData)
    );
  } catch {
    // ignore
  }
}

/**
 * Lưu kết quả chơi game (Điểm cao nhất từng game + cộng XP vào Bảng xếp hạng Firestore)
 */
export async function recordGameResult({
  username,
  fullName,
  avatar,
  gameId,
  score,
  xpEarned,
}) {
  const cleanUser = String(username || 'student').trim();
  const key = `${LOCAL_STATS_PREFIX}${cleanUser}`;
  let stats = { totalXp: 0, gamesPlayed: 0, bestScores: {} };

  try {
    const raw = localStorage.getItem(key);
    if (raw) stats = { ...stats, ...JSON.parse(raw) };
  } catch {
    // ignore
  }

  const prevBest = Number(stats.bestScores?.[gameId] || 0);
  const isNewRecord = score > prevBest;
  const nextStats = {
    username: cleanUser,
    fullName: fullName || cleanUser,
    avatar: avatar || '',
    totalXp: Number(stats.totalXp || 0) + Number(xpEarned || 0),
    gamesPlayed: Number(stats.gamesPlayed || 0) + 1,
    bestScores: {
      ...(stats.bestScores || {}),
      [gameId]: Math.max(prevBest, score),
    },
    updatedAt: new Date().toISOString(),
  };

  try {
    localStorage.setItem(key, JSON.stringify(nextStats));
  } catch {
    // ignore
  }

  if (db && cleanUser) {
    try {
      const ref = doc(db, LEADERBOARD_COLLECTION, cleanUser);
      const existing = await getDoc(ref);
      const prevCloud = existing.exists() ? existing.data() : {};
      const mergedBest = {
        ...(prevCloud.bestScores || {}),
        ...(nextStats.bestScores || {}),
      };
      mergedBest[gameId] = Math.max(Number(prevCloud.bestScores?.[gameId] || 0), score);

      const cloudPayload = {
        username: cleanUser,
        fullName: fullName || prevCloud.fullName || cleanUser,
        avatar: avatar || prevCloud.avatar || '',
        totalXp: Math.max(Number(prevCloud.totalXp || 0) + Number(xpEarned || 0), nextStats.totalXp),
        gamesPlayed: Math.max(Number(prevCloud.gamesPlayed || 0) + 1, nextStats.gamesPlayed),
        bestScores: mergedBest,
        updatedAt: new Date().toISOString(),
      };
      await setDoc(ref, cloudPayload, { merge: true });
      return { stats: cloudPayload, isNewRecord };
    } catch (err) {
      console.warn('Không lưu được điểm game lên Firestore:', err);
    }
  }

  return { stats: nextStats, isNewRecord };
}

export async function fetchUserGameStats(username) {
  const cleanUser = String(username || 'student').trim();
  let localStats = { totalXp: 0, gamesPlayed: 0, bestScores: {} };
  try {
    const raw = localStorage.getItem(`${LOCAL_STATS_PREFIX}${cleanUser}`);
    if (raw) localStats = { ...localStats, ...JSON.parse(raw) };
  } catch {
    // ignore
  }

  if (db && cleanUser) {
    try {
      const snap = await getDoc(doc(db, LEADERBOARD_COLLECTION, cleanUser));
      if (snap.exists()) {
        const cloud = snap.data();
        return {
          ...localStats,
          ...cloud,
          bestScores: { ...(localStats.bestScores || {}), ...(cloud.bestScores || {}) },
        };
      }
    } catch {
      // fallback local
    }
  }
  return localStats;
}

export async function fetchGameLeaderboard() {
  if (!db) return [];
  try {
    const snap = await getDocs(collection(db, LEADERBOARD_COLLECTION));
    const list = [];
    snap.forEach((docSnap) => {
      const d = docSnap.data();
      if (d?.username) {
        list.push({
          username: d.username,
          fullName: d.fullName || d.username,
          avatar: d.avatar || '',
          totalXp: Number(d.totalXp || 0),
          gamesPlayed: Number(d.gamesPlayed || 0),
        });
      }
    });
    return list.sort((a, b) => b.totalXp - a.totalXp).slice(0, 20);
  } catch (err) {
    console.warn('Lỗi tải bảng xếp hạng game:', err);
    return [];
  }
}
