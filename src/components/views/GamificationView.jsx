import React, { useState, useEffect, useMemo } from 'react';
import {
  Gamepad2,
  Trophy,
  Award,
  Sparkles,
  Crown,
  Zap,
  Grid2x2,
  Atom,
  Scale,
  FlaskConical,
  Type,
  Link2,
  Play,
  Flame,
  Target,
  Brain,
  Star,
} from 'lucide-react';
import { STUDY_SUBJECTS } from '../../data/mockData';
import { getSessionUser } from '../../services/authService';
import { fetchLessonFolders } from '../../services/studyService';
import { fetchTextbookDecks, fetchUserFlashcardDecks } from '../../services/flashcardService';
import {
  GAME_CATALOG,
  loadGameQuestions,
  recordGameResult,
  fetchUserGameStats,
  fetchGameLeaderboard,
} from '../../services/gameService';
import GameScopeModal from './games/GameScopeModal';
import GameArena from './games/GameArena';
import ClownfishSvg from '../mascot/ClownfishSvg';
import { getClownfishTier, setMascotXp, TAP_QUOTES } from '../../services/mascotService';

const SUBJECT_FISH_CHEERS = {
  'sub-1': 'Toán Học hả? Khởi động não tính nhanh cùng tớ nào!',
  'sub-2': 'Vật Lý siêu cuốn! Đừng để thiên thạch công thức rơi nha!',
  'sub-3': 'Tiếng Anh nè! Chơi bằng chính bộ Flashcard của bạn cực đã!',
  'sub-4': 'Hóa Học vào phòng thí nghiệm phản ứng thôi!',
};

const GAME_ICONS = {
  Zap,
  Grid2x2,
  Atom,
  Scale,
  FlaskConical,
  Sparkles,
  Type,
  Link2,
};

export default function GamificationView({ currentUser: propsUser }) {
  const sessionUser = getSessionUser();
  const currentUser = propsUser || sessionUser;
  const username = currentUser?.username || 'student';
  const fullName = currentUser?.fullName || username;
  const avatar = currentUser?.avatar || '';

  const [activeTab, setActiveTab] = useState('arcade'); // 'arcade' | 'leaderboard' | 'badges'
  const [subjectFilter, setSubjectFilter] = useState(STUDY_SUBJECTS[0]?.id || 'sub-1');

  // Dữ liệu bài học & flashcard để khoanh vùng kiến thức
  const [lessonFolders, setLessonFolders] = useState([]);
  const [englishDecks, setEnglishDecks] = useState([]);
  const [userStats, setUserStats] = useState({ totalXp: 0, gamesPlayed: 0, bestScores: {} });
  const [leaderboard, setLeaderboard] = useState([]);

  // Luồng chọn game -> khoanh vùng bài học -> chơi game
  const [pendingGame, setPendingGame] = useState(null);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false);
  const [activeSession, setActiveSession] = useState(null); // { game, items, sourceLabel, scopeSummary }
  const [hubFishFlip, setHubFishFlip] = useState(false);
  const [hubFishMood, setHubFishMood] = useState('happy');
  const [hubFishLine, setHubFishLine] = useState(
    'Chọn một trò chơi và khoanh vùng bài học — kiếm XP để giúp tớ tiến hóa nhé!',
  );

  useEffect(() => {
    let cancelled = false;
    async function loadInitial() {
      const [foldersRes, tbDecksRes, personalDecksRes, statsRes, boardRes] = await Promise.all([
        fetchLessonFolders().catch(() => []),
        fetchTextbookDecks().catch(() => []),
        fetchUserFlashcardDecks(username).catch(() => []),
        fetchUserGameStats(username).catch(() => ({ totalXp: 0, gamesPlayed: 0, bestScores: {} })),
        fetchGameLeaderboard().catch(() => []),
      ]);
      if (cancelled) return;
      setLessonFolders(Array.isArray(foldersRes) ? foldersRes : []);
      setEnglishDecks([
        ...(Array.isArray(tbDecksRes) ? tbDecksRes : []),
        ...(Array.isArray(personalDecksRes) ? personalDecksRes : []),
      ]);
      setUserStats(statsRes || { totalXp: 0, gamesPlayed: 0, bestScores: {} });
      setMascotXp(Number(statsRes?.totalXp || 0));
      setLeaderboard(Array.isArray(boardRes) ? boardRes : []);
    }
    loadInitial();
    return () => {
      cancelled = true;
    };
  }, [username]);

  // Danh sách tên bài học unique theo môn (sắp xếp tự nhiên Bài 1, Bài 2, ...)
  const getLessonNamesForSubject = (subjectId) => {
    const seen = new Set();
    const names = [];
    lessonFolders
      .filter((f) => f.subjectId === subjectId)
      .forEach((f) => {
        const clean = String(f.name || '').trim();
        if (!clean) return;
        const key = clean.toLowerCase();
        if (!seen.has(key)) {
          seen.add(key);
          names.push(clean);
        }
      });
    return names.sort((a, b) => a.localeCompare(b, 'vi', { numeric: true }));
  };

  const filteredGames = useMemo(
    () => GAME_CATALOG.filter((g) => g.subjectId === subjectFilter),
    [subjectFilter],
  );

  const handleStartWithScope = async ({
    selectedLessons,
    selectedFlashcardDecks,
    forceRefreshAI,
    scopeSummary,
  }) => {
    if (!pendingGame) return;
    setIsLoadingQuestions(true);
    try {
      const { items, sourceLabel } = await loadGameQuestions({
        game: pendingGame,
        selectedLessons,
        selectedFlashcardDecks,
        forceRefreshAI,
      });
      setActiveSession({
        game: pendingGame,
        items,
        sourceLabel,
        scopeSummary,
      });
      setPendingGame(null);
    } finally {
      setIsLoadingQuestions(false);
    }
  };

  const handleGameComplete = async ({ score, xpEarned }) => {
    if (!activeSession?.game) return { isNewRecord: false };
    const { stats, isNewRecord } = await recordGameResult({
      username,
      fullName,
      avatar,
      gameId: activeSession.game.id,
      score,
      xpEarned,
    });
    setUserStats(stats);
    setMascotXp(Number(stats?.totalXp || 0));
    fetchGameLeaderboard()
      .then((board) => setLeaderboard(board))
      .catch(() => {});
    return { isNewRecord };
  };

  // Huy hiệu động theo thành tích thực tế
  const dynamicBadges = useMemo(() => {
    const played = Number(userStats.gamesPlayed || 0);
    const xp = Number(userStats.totalXp || 0);
    const distinctGames = Object.keys(userStats.bestScores || {}).length;
    const maxSingleScore = Math.max(0, ...Object.values(userStats.bestScores || {}).map(Number));

    return [
      {
        id: 'first-play',
        name: 'Khởi Động Hứng Khởi',
        desc: 'Hoàn thành ván trò chơi học tập đầu tiên',
        icon: Play,
        unlocked: played >= 1,
        color: 'from-purple-500 to-indigo-500',
      },
      {
        id: 'five-games',
        name: 'Chiến Binh Chăm Chỉ',
        desc: 'Hoàn thành ít nhất 5 ván luyện phản xạ',
        icon: Flame,
        unlocked: played >= 5,
        color: 'from-amber-500 to-rose-500',
      },
      {
        id: 'multi-subject',
        name: 'Toàn Diện 4 Môn',
        desc: 'Thử sức ít nhất 4 trò chơi khác nhau',
        icon: Brain,
        unlocked: distinctGames >= 4,
        color: 'from-cyan-500 to-blue-500',
      },
      {
        id: 'high-score',
        name: 'Phản Xạ Siêu Tốc',
        desc: 'Đạt từ 1.000 điểm trở lên trong 1 ván chơi',
        icon: Target,
        unlocked: maxSingleScore >= 1000,
        color: 'from-emerald-500 to-teal-500',
      },
      {
        id: 'xp-master',
        name: 'Thủ Khoa Game Học Tập',
        desc: 'Tích lũy từ 500 XP trở lên qua các trò chơi',
        icon: Crown,
        unlocked: xp >= 500,
        color: 'from-yellow-400 to-amber-500',
      },
      {
        id: 'all-eight',
        name: 'Chinh Phục Cả 8 Game',
        desc: 'Đã chơi qua toàn bộ 8 trò chơi của hệ thống',
        icon: Star,
        unlocked: distinctGames >= 8,
        color: 'from-fuchsia-500 to-pink-500',
      },
    ];
  }, [userStats]);

  // Nếu đang ở trong màn chơi của 1 game
  if (activeSession) {
    return (
      <>
        <GameArena
          game={activeSession.game}
          items={activeSession.items}
          sourceLabel={activeSession.sourceLabel}
          scopeSummary={activeSession.scopeSummary}
          userXp={userStats.totalXp || 0}
          onComplete={handleGameComplete}
          onChangeScope={() => setPendingGame(activeSession.game)}
          onExit={() => setActiveSession(null)}
        />

        {pendingGame && (
          <GameScopeModal
            game={pendingGame}
            username={username}
            lessonNames={getLessonNamesForSubject(pendingGame.subjectId)}
            flashcardDecks={pendingGame.subjectId === 'sub-3' ? englishDecks : []}
            isLoadingQuestions={isLoadingQuestions}
            onClose={() => setPendingGame(null)}
            onStart={handleStartWithScope}
          />
        )}
      </>
    );
  }

  return (
    <div className="space-y-5 sm:space-y-6 pb-10">
      {/* 1. Header & Tab Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-display tracking-tight text-white flex items-center gap-2.5">
            <Gamepad2 className="w-7 h-7 text-rose-400" />
            <span>Trò Chơi Học Tập</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">
            8 trò chơi rèn phản xạ &amp; trí nhớ sâu — khoanh vùng đúng bài học bạn đang học
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="px-3 py-1.5 rounded-xl bg-amber-500/15 border border-amber-400/30 text-amber-300 text-xs font-bold inline-flex items-center gap-1.5">
            <Trophy className="w-3.5 h-3.5" />
            <span>{userStats.totalXp || 0} XP</span>
          </div>

          <div className="flex items-center gap-1 p-1 rounded-xl bg-white/[0.04] border border-white/10">
            <button
              type="button"
              onClick={() => setActiveTab('arcade')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'arcade'
                  ? 'bg-purple-600/40 text-white border border-purple-400/40 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Sảnh Game (8)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('leaderboard')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'leaderboard'
                  ? 'bg-purple-600/40 text-white border border-purple-400/40 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Bảng Xếp Hạng
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('badges')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'badges'
                  ? 'bg-purple-600/40 text-white border border-purple-400/40 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Huy Hiệu
            </button>
          </div>
        </div>
      </div>

      {/* 2. TAB: SẢNH 8 TRÒ CHƠI */}
      {activeTab === 'arcade' && (() => {
        const fishInfo = getClownfishTier(userStats.totalXp || 0);
        const handleTapHubFish = () => {
          setHubFishFlip(true);
          setHubFishMood('celebrate');
          setHubFishLine(TAP_QUOTES[Math.floor(Math.random() * TAP_QUOTES.length)]);
          setTimeout(() => {
            setHubFishFlip(false);
            setHubFishMood('happy');
          }, 750);
        };

        return (
        <div className="space-y-4">
          {/* Thẻ tiến hóa & tương tác Linh vật Cá Hề */}
          <div className="rounded-2xl glass-card border border-orange-400/25 p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center gap-3.5 justify-between">
            <div className="flex items-center gap-3.5 min-w-0">
              <button
                type="button"
                onClick={handleTapHubFish}
                title="Chạm vào Cá Hề để tương tác!"
                className="shrink-0 rounded-2xl bg-gradient-to-br from-orange-500/20 to-sky-500/15 border border-orange-400/30 p-1.5 hover:scale-105 active:scale-95 transition-transform cursor-pointer"
              >
                <ClownfishSvg
                  mood={hubFishMood}
                  tier={fishInfo.tier.id}
                  size={60}
                  isFlipping={hubFishFlip}
                  showBubbles
                />
              </button>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm sm:text-base font-extrabold text-white">
                    {fishInfo.tier.name}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold text-white bg-gradient-to-r ${fishInfo.tier.accent}`}>
                    {fishInfo.tier.badge}
                  </span>
                  <span className="text-[11px] text-slate-400 hidden md:inline">
                    • Chạm vào cá để tương tác
                  </span>
                </div>
                <p className="text-xs sm:text-[13px] text-orange-200/95 mt-0.5 leading-snug">
                  “{hubFishLine}”
                </p>
              </div>
            </div>

            <div className="sm:w-56 shrink-0 space-y-1.5">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-400 font-medium">
                  {fishInfo.nextTier ? `Tiến hóa: ${fishInfo.nextTier.name}` : 'Đã đạt cấp tối thượng!'}
                </span>
                <span className="font-mono font-bold text-amber-300">
                  {fishInfo.nextTier ? `còn ${fishInfo.xpToNext} XP` : 'MAX'}
                </span>
              </div>
              <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                <div
                  className={`h-full rounded-full bg-gradient-to-r ${fishInfo.tier.accent} transition-all duration-500`}
                  style={{ width: `${fishInfo.progressPct}%` }}
                />
              </div>
            </div>
          </div>

          {/* Bộ lọc theo môn học */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {STUDY_SUBJECTS.map((sub) => {
              const count = GAME_CATALOG.filter((g) => g.subjectId === sub.id).length;
              const active = subjectFilter === sub.id;
              return (
                <button
                  key={sub.id}
                  type="button"
                  onClick={() => {
                    setSubjectFilter(sub.id);
                    setHubFishMood('happy');
                    setHubFishLine(SUBJECT_FISH_CHEERS[sub.id] || 'Chọn game và chiến thôi!');
                  }}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                    active
                      ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white border-purple-400/50 shadow-sm'
                      : 'glass-card text-slate-300 border-white/10 hover:text-white'
                  }`}
                >
                  {sub.name} ({count})
                </button>
              );
            })}
          </div>

          {/* Lưới thẻ trò chơi theo môn đã chọn */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filteredGames.map((game) => {
              const Icon = GAME_ICONS[game.iconName] || Gamepad2;
              const best = Number(userStats.bestScores?.[game.id] || 0);

              return (
                <div
                  key={game.id}
                  onClick={() => setPendingGame(game)}
                  className="group rounded-3xl glass-card border border-white/10 hover:border-purple-400/50 p-5 flex flex-col justify-between gap-4 cursor-pointer transition-all"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <div
                        className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${game.accent} text-white flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform`}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${game.badgeClass}`}
                      >
                        {game.subjectName}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-base font-extrabold font-display text-white group-hover:text-purple-300 transition-colors">
                        {game.title}
                      </h3>
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed line-clamp-3">
                        {game.subtitle}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3 pt-2 border-t border-white/10">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-400">{game.skill}</span>
                      <span className="font-mono font-bold text-amber-300">
                        {best > 0 ? `Kỷ lục: ${best}` : 'Chưa chơi'}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setPendingGame(game);
                      }}
                      className={`w-full py-2.5 px-3 rounded-xl bg-gradient-to-r ${game.accent} text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-md group-hover:opacity-95 transition-opacity cursor-pointer`}
                    >
                      <Play className="w-3.5 h-3.5" />
                      <span>Chọn bài &amp; Chơi</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        );
      })()}

      {/* 3. TAB: BẢNG XẾP HẠNG THẬT TRÊN FIRESTORE */}
      {activeTab === 'leaderboard' && (
        <div className="max-w-3xl mx-auto rounded-3xl glass-card p-5 sm:p-6 border border-white/10 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base sm:text-lg font-bold font-display text-white flex items-center gap-2">
              <Crown className="w-5 h-5 text-amber-400" />
              <span>Bảng Xếp Hạng Trò Chơi Học Tập</span>
            </h3>
            <span className="text-xs text-slate-400">{leaderboard.length} học sinh</span>
          </div>

          {leaderboard.length === 0 ? (
            <div className="py-10 text-center text-xs text-slate-400 border border-dashed border-white/10 rounded-2xl">
              Chưa có điểm xếp hạng nào. Hãy chơi ván đầu tiên để ghi tên lên bảng vàng!
            </div>
          ) : (
            <div className="space-y-2.5">
              {leaderboard.map((u, idx) => {
                const isMe = u.username === username;
                return (
                  <div
                    key={u.username}
                    className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 ${
                      isMe
                        ? 'bg-purple-600/20 border-purple-400/50'
                        : 'bg-white/[0.03] border-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span
                        className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-extrabold shrink-0 ${
                          idx === 0
                            ? 'bg-amber-400/25 text-amber-300 border border-amber-400/50'
                            : idx === 1
                            ? 'bg-slate-300/20 text-slate-200 border border-slate-300/40'
                            : idx === 2
                            ? 'bg-orange-400/20 text-orange-300 border border-orange-400/40'
                            : 'bg-white/5 text-slate-400'
                        }`}
                      >
                        #{idx + 1}
                      </span>
                      <div className="min-w-0">
                        <div className="text-sm font-bold text-white truncate">
                          {u.fullName} {isMe && <span className="text-xs text-purple-300">(Bạn)</span>}
                        </div>
                        <div className="text-[11px] text-slate-400">{u.gamesPlayed} ván đã chơi</div>
                      </div>
                    </div>

                    <span className="px-3 py-1 rounded-xl bg-amber-500/15 border border-amber-400/30 text-amber-300 font-mono font-extrabold text-xs shrink-0">
                      {u.totalXp} XP
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 4. TAB: HUY HIỆU */}
      {activeTab === 'badges' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {dynamicBadges.map((b) => {
            const BIcon = b.icon;
            return (
              <div
                key={b.id}
                className={`p-5 rounded-3xl glass-card border flex items-center gap-4 transition-all ${
                  b.unlocked ? 'border-amber-400/40' : 'border-white/10 opacity-60'
                }`}
              >
                <div
                  className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${b.color} text-white flex items-center justify-center shrink-0 shadow-lg`}
                >
                  <BIcon className="w-6 h-6" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-white truncate">{b.name}</h4>
                    {b.unlocked && (
                      <Award className="w-4 h-4 text-amber-400 shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">{b.desc}</p>
                  <span
                    className={`inline-block mt-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      b.unlocked
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : 'bg-white/10 text-slate-400'
                    }`}
                  >
                    {b.unlocked ? 'Đã mở khóa' : 'Chưa mở khóa'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL KHOANH VÙNG BÀI HỌC TRƯỚC KHI VÀO GAME */}
      {pendingGame && (
        <GameScopeModal
          game={pendingGame}
          username={username}
          lessonNames={getLessonNamesForSubject(pendingGame.subjectId)}
          flashcardDecks={pendingGame.subjectId === 'sub-3' ? englishDecks : []}
          isLoadingQuestions={isLoadingQuestions}
          onClose={() => setPendingGame(null)}
          onStart={handleStartWithScope}
        />
      )}
    </div>
  );
}
