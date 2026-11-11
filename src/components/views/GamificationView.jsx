import React, { useState } from 'react';
import {
  Gamepad2,
  Trophy,
  Award,
  Sparkles,
  Crown,
  RotateCcw
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { MEMORY_MATCH_CARDS, BADGES_DATA, LEADERBOARD_USERS } from '../../data/mockData';

export default function GamificationView() {
  const [cards, setCards] = useState(() =>
    [...MEMORY_MATCH_CARDS].sort(() => Math.random() - 0.5)
  );
  const [flippedIndices, setFlippedIndices] = useState([]);
  const [matchedPairIds, setMatchedPairIds] = useState([]);
  const [moves, setMoves] = useState(0);
  const [activeTab, setActiveTab] = useState('minigame'); // 'minigame' | 'leaderboard' | 'badges'

  const handleCardClick = (index) => {
    if (flippedIndices.includes(index) || matchedPairIds.includes(cards[index].pairId)) {
      return;
    }

    if (flippedIndices.length === 0) {
      setFlippedIndices([index]);
    } else if (flippedIndices.length === 1) {
      const firstIndex = flippedIndices[0];
      const secondIndex = index;
      setFlippedIndices([firstIndex, secondIndex]);
      setMoves((prev) => prev + 1);

      if (cards[firstIndex].pairId === cards[secondIndex].pairId) {
        setMatchedPairIds((prev) => [...prev, cards[firstIndex].pairId]);
        setFlippedIndices([]);

        if (matchedPairIds.length + 1 === cards.length / 2) {
          confetti({
            particleCount: 100,
            spread: 80,
            origin: { y: 0.6 },
          });
        }
      } else {
        setTimeout(() => {
          setFlippedIndices([]);
        }, 900);
      }
    }
  };

  const handleResetGame = () => {
    setCards([...MEMORY_MATCH_CARDS].sort(() => Math.random() - 0.5));
    setFlippedIndices([]);
    setMatchedPairIds([]);
    setMoves(0);
  };

  const isGameWon = matchedPairIds.length === cards.length / 2;

  return (
    <div className="space-y-6 md:space-y-8 pb-10">
      {/* 1. Header & Tab Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-semibold mb-2">
            <Gamepad2 className="w-3.5 h-3.5 text-rose-300" />
            <span>Trò Chơi Học Tập & Thử Thách</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-display tracking-tight text-white">
            Trò Chơi & Thi Đua
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">
            Vừa chơi vừa ôn nhanh công thức và thi đua chăm chỉ cùng bạn bè
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-white/[0.04] border border-white/10">
          <button
            onClick={() => setActiveTab('minigame')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'minigame'
                ? 'bg-purple-600/30 text-white border border-purple-400/40 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Ghép Cặp Công Thức
          </button>
          <button
            onClick={() => setActiveTab('leaderboard')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'leaderboard'
                ? 'bg-purple-600/30 text-white border border-purple-400/40 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Bảng Thi Đua Tuần
          </button>
          <button
            onClick={() => setActiveTab('badges')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'badges'
                ? 'bg-purple-600/30 text-white border border-purple-400/40 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Huy Hiệu Đã Đạt
          </button>
        </div>
      </div>

      {/* 2. TAB: MINIGAME */}
      {activeTab === 'minigame' && (
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Controls Bar */}
          <div className="flex items-center justify-between p-4 rounded-2xl glass-card border border-white/10 text-xs">
            <div className="flex items-center gap-3">
              <span className="text-slate-400">
                Số lần lật: <strong className="text-white font-bold text-sm">{moves}</strong>
              </span>
              <span>•</span>
              <span className="text-slate-400">
                Đã ghép đúng: <strong className="text-emerald-400 font-bold text-sm">{matchedPairIds.length} / {cards.length / 2}</strong>
              </span>
            </div>

            <button
              onClick={handleResetGame}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl glass-button text-xs font-semibold text-purple-300 hover:text-white"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Chơi lại</span>
            </button>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {cards.map((card, idx) => {
              const isFlipped = flippedIndices.includes(idx);
              const isMatched = matchedPairIds.includes(card.pairId);

              return (
                <div
                  key={card.id}
                  onClick={() => handleCardClick(idx)}
                  className={`h-28 sm:h-32 rounded-2xl p-3 flex items-center justify-center text-center cursor-pointer transition-all duration-300 border select-none ${
                    isMatched
                      ? 'bg-emerald-500/20 border-emerald-400/50 text-emerald-200 shadow-lg shadow-emerald-500/10'
                      : isFlipped
                      ? 'bg-purple-600/30 border-purple-400 text-white shadow-xl shadow-purple-500/20 scale-105'
                      : 'glass-card border-white/10 hover:border-purple-400/30 text-transparent'
                  }`}
                >
                  {isFlipped || isMatched ? (
                    <span className="text-xs sm:text-sm font-bold font-display leading-snug">
                      {card.text}
                    </span>
                  ) : (
                    <Sparkles className="w-6 h-6 text-purple-400/40" />
                  )}
                </div>
              );
            })}
          </div>

          {/* Victory Card */}
          {isGameWon && (
            <div className="rounded-3xl glass-card p-6 text-center border border-emerald-500/40 shadow-2xl">
              <Trophy className="w-12 h-12 text-amber-400 mx-auto mb-2 animate-bounce" />
              <h3 className="text-xl font-bold font-display text-white">Chúc Mừng! Bạn Đã Hoàn Thành!</h3>
              <p className="text-xs text-slate-300 mt-1 mb-4">
                Bạn đã ghép đúng tất cả các cặp công thức trong {moves} lượt lật.
              </p>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-500/20 border border-purple-500/30 text-purple-200 text-xs font-semibold">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>+120 Điểm Tích Lũy (XP)</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3. TAB: LEADERBOARD */}
      {activeTab === 'leaderboard' && (
        <div className="max-w-2xl mx-auto space-y-3">
          <div className="p-4 rounded-2xl glass-card border border-white/10 flex items-center justify-between text-xs text-slate-400 font-semibold mb-2">
            <span>Hạng & Học Sinh</span>
            <span>Điểm Tích Lũy Tuần</span>
          </div>

          {LEADERBOARD_USERS.map((user) => (
            <div
              key={user.rank}
              className={`p-4 rounded-2xl glass-card border flex items-center justify-between transition-all ${
                user.rank === 2
                  ? 'border-purple-400/40 bg-purple-500/10 shadow-lg shadow-purple-500/10'
                  : 'border-white/10'
              }`}
            >
              <div className="flex items-center gap-3.5">
                <div className="w-7 text-center">
                  {user.rank === 1 && <Crown className="w-5 h-5 text-amber-400 mx-auto" />}
                  {user.rank === 2 && <span className="font-extrabold text-purple-300 font-display text-base">#2</span>}
                  {user.rank === 3 && <span className="font-extrabold text-amber-500 font-display text-base">#3</span>}
                  {user.rank > 3 && <span className="font-bold text-slate-500 text-sm">#{user.rank}</span>}
                </div>

                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-10 h-10 rounded-xl object-cover border border-white/20"
                />

                <div>
                  <h4 className="text-sm font-bold text-white font-display flex items-center gap-2">
                    {user.name}
                    {user.rank === 2 && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/30 text-purple-200 font-semibold border border-purple-400/40">
                        Bạn
                      </span>
                    )}
                  </h4>
                  <span className="text-[11px] text-slate-400">{user.badge}</span>
                </div>
              </div>

              <div className="text-right">
                <span className="text-base font-extrabold font-display text-white block">
                  {user.xp.toLocaleString()}
                </span>
                <span className="text-[10px] text-purple-300">XP</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 4. TAB: BADGES */}
      {activeTab === 'badges' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
          {BADGES_DATA.map((badge) => (
            <div
              key={badge.id}
              className={`p-5 rounded-3xl glass-card border relative overflow-hidden transition-all ${
                badge.unlocked
                  ? 'border-purple-400/40 shadow-lg shadow-purple-500/10'
                  : 'border-white/5 opacity-50'
              }`}
            >
              <div className="flex items-start justify-between">
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg ${
                    badge.unlocked
                      ? 'bg-gradient-to-tr ' + badge.color
                      : 'bg-white/10 text-slate-500'
                  }`}
                >
                  <Award className="w-6 h-6" />
                </div>

                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    badge.unlocked
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      : 'bg-white/[0.04] text-slate-500 border-white/10'
                  }`}
                >
                  {badge.unlocked ? 'Đã Nhận' : 'Chưa Đạt'}
                </span>
              </div>

              <div className="mt-4">
                <h4 className="text-sm font-bold text-white font-display">{badge.name}</h4>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">{badge.desc}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
