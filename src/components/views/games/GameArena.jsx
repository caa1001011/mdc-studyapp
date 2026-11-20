import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  ArrowLeft,
  Clock,
  Flame,
  Heart,
  RotateCcw,
  SlidersHorizontal,
  CheckCircle2,
  XCircle,
  Lightbulb,
  SkipForward,
  Sparkles,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import ClownfishSvg from '../../mascot/ClownfishSvg';
import {
  getClownfishTier,
  getGameReaction,
  setMascotSuppressed,
} from '../../../services/mascotService';

function shuffle(arr) {
  const c = [...arr];
  for (let i = c.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [c[i], c[j]] = [c[j], c[i]];
  }
  return c;
}

const OPTION_LETTERS = ['A', 'B', 'C', 'D'];

/**
 * Màn hình tổng kết sau khi hoàn thành ván chơi
 */
function GameResultSummary({
  game,
  score,
  correctCount,
  totalAnswered,
  bestCombo,
  xpEarned,
  isNewRecord,
  scopeSummary,
  userXp,
  onReplay,
  onChangeScope,
  onExit,
}) {
  const accuracy = totalAnswered > 0 ? Math.round((correctCount / totalAnswered) * 100) : 0;
  const fishTier = getClownfishTier((userXp || 0) + (xpEarned || 0));
  const fishMood = isNewRecord
    ? 'celebrate'
    : accuracy >= 70
      ? 'celebrate'
      : accuracy >= 40
        ? 'happy'
        : 'study';
  const fishReaction = getGameReaction(
    isNewRecord
      ? 'record'
      : accuracy >= 70
        ? 'finish_great'
        : accuracy >= 40
          ? 'finish_good'
          : 'finish_try',
  );

  return (
    <div className="max-w-xl mx-auto rounded-3xl glass-card border border-purple-500/35 p-6 sm:p-8 text-center space-y-5 shadow-2xl">
      <div className="flex flex-col items-center gap-2">
        <div className="relative">
          <ClownfishSvg mood={fishMood} tier={fishTier.tier.id} size={96} showBubbles />
        </div>
        <div className="clownfish-bubble-box rounded-2xl px-4 py-2 text-xs sm:text-sm font-semibold max-w-md">
          “{fishReaction.message}”
        </div>
      </div>

      <div className="space-y-1">
        {isNewRecord && (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/50 text-amber-300 text-xs font-bold mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Kỷ lục cá nhân mới!</span>
          </span>
        )}
        <h2 className="text-2xl font-extrabold font-display text-white">Hoàn Thành Ván Chơi!</h2>
        <p className="text-xs text-slate-400">
          {game.title} • {scopeSummary}
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="p-3 rounded-2xl bg-white/[0.04] border border-white/10">
          <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Điểm số</div>
          <div className="text-xl font-extrabold text-amber-300 font-mono mt-0.5">{score}</div>
        </div>
        <div className="p-3 rounded-2xl bg-white/[0.04] border border-white/10">
          <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Chính xác</div>
          <div className="text-xl font-extrabold text-emerald-400 font-mono mt-0.5">{accuracy}%</div>
        </div>
        <div className="p-3 rounded-2xl bg-white/[0.04] border border-white/10">
          <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Combo Max</div>
          <div className="text-xl font-extrabold text-orange-400 font-mono mt-0.5">×{bestCombo}</div>
        </div>
        <div className="p-3 rounded-2xl bg-white/[0.04] border border-white/10">
          <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Thưởng XP</div>
          <div className="text-xl font-extrabold text-purple-300 font-mono mt-0.5">+{xpEarned}</div>
        </div>
      </div>

      <div className="flex items-center justify-center gap-2.5 flex-wrap pt-2">
        <button
          type="button"
          onClick={onReplay}
          className={`px-5 py-2.5 rounded-xl bg-gradient-to-r ${game.accent} text-white text-xs sm:text-sm font-bold shadow-lg inline-flex items-center gap-1.5 cursor-pointer`}
        >
          <RotateCcw className="w-4 h-4" />
          <span>Chơi lại</span>
        </button>
        <button
          type="button"
          onClick={onChangeScope}
          className="px-4 py-2.5 rounded-xl glass-button text-xs sm:text-sm font-semibold text-slate-200 hover:text-white inline-flex items-center gap-1.5 cursor-pointer"
        >
          <SlidersHorizontal className="w-4 h-4" />
          <span>Đổi bài học</span>
        </button>
        <button
          type="button"
          onClick={onExit}
          className="px-4 py-2.5 rounded-xl glass-button text-xs sm:text-sm font-semibold text-slate-300 hover:text-white inline-flex items-center gap-1.5 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Về sảnh</span>
        </button>
      </div>
    </div>
  );
}

/**
 * ENGINE 1: BLITZ (60s) & SURVIVAL (3 mạng) — dùng cho Toán Blitz, Hóa Phản Ứng, Hóa Nguyên Tố
 */
function McArcadeEngine({ items, mode = 'blitz', accent, onFinish, onFishReact }) {
  const [queue] = useState(() => shuffle(items));
  const [idx, setIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [bestCombo, setBestCombo] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [answeredCount, setAnsweredCount] = useState(0);
  const [lives, setLives] = useState(3);
  const [timeLeft, setTimeLeft] = useState(mode === 'blitz' ? 60 : 12);
  const [feedback, setFeedback] = useState(null); // { picked, isRight, explanation }
  const finishedRef = useRef(false);

  const currentQ = queue[idx % queue.length];

  const triggerFinish = useCallback(
    (finalScore, finalCorrect, finalAnswered, finalBestCombo) => {
      if (finishedRef.current) return;
      finishedRef.current = true;
      onFinish({
        score: finalScore,
        correctCount: finalCorrect,
        totalAnswered: finalAnswered,
        bestCombo: finalBestCombo,
      });
    },
    [onFinish]
  );

  // Timer
  useEffect(() => {
    if (finishedRef.current || feedback) return undefined;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (mode === 'blitz' && prev === 11) {
          onFishReact?.('urgent_time');
        }
        if (prev <= 1) {
          if (mode === 'blitz') {
            triggerFinish(score, correctCount, answeredCount, bestCombo);
            return 0;
          }
          // Survival: hết giờ 1 câu -> mất 1 mạng
          const nextLives = lives - 1;
          setLives(nextLives);
          setCombo(0);
          setAnsweredCount((a) => a + 1);
          if (nextLives <= 0) {
            triggerFinish(score, correctCount, answeredCount + 1, bestCombo);
            return 0;
          }
          setIdx((i) => i + 1);
          return 12;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [mode, feedback, lives, score, correctCount, answeredCount, bestCombo, triggerFinish, onFishReact]);

  const handlePick = (optIdx) => {
    if (feedback || finishedRef.current) return;
    const isRight = optIdx === currentQ.correctIndex;
    const nextAnswered = answeredCount + 1;
    let nextScore = score;
    let nextCombo = combo;
    let nextBest = bestCombo;
    let nextCorrect = correctCount;
    let nextLives = lives;

    if (isRight) {
      nextCombo = combo + 1;
      nextBest = Math.max(bestCombo, nextCombo);
      const mult = Math.min(4, 1 + Math.floor(nextCombo / 3));
      nextScore = score + 100 * mult;
      nextCorrect = correctCount + 1;
      onFishReact?.('correct', { combo: nextCombo });
    } else {
      nextCombo = 0;
      if (mode === 'survival') {
        nextLives = lives - 1;
      }
      if (mode === 'survival' && nextLives === 1) {
        onFishReact?.('urgent_life');
      } else {
        onFishReact?.('wrong');
      }
    }

    setScore(nextScore);
    setCombo(nextCombo);
    setBestCombo(nextBest);
    setCorrectCount(nextCorrect);
    setAnsweredCount(nextAnswered);
    setLives(nextLives);
    setFeedback({
      picked: optIdx,
      isRight,
      explanation: currentQ.explanation,
    });

    setTimeout(() => {
      if (mode === 'survival' && nextLives <= 0) {
        triggerFinish(nextScore, nextCorrect, nextAnswered, nextBest);
        return;
      }
      if (mode === 'survival' && idx + 1 >= queue.length) {
        triggerFinish(nextScore, nextCorrect, nextAnswered, nextBest);
        return;
      }
      setFeedback(null);
      setIdx((i) => i + 1);
      if (mode === 'survival') setTimeLeft(12);
    }, isRight ? 550 : 1200);
  };

  if (!currentQ) return null;
  const multiplier = Math.min(4, 1 + Math.floor(combo / 3));

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      {/* HUD */}
      <div className="grid grid-cols-3 gap-2.5">
        <div className="p-3 rounded-2xl glass-card border border-white/10 flex items-center justify-between">
          <span className="text-[11px] text-slate-400 font-bold">Điểm</span>
          <span className="text-base sm:text-lg font-extrabold font-mono text-amber-300">{score}</span>
        </div>
        <div className="p-3 rounded-2xl glass-card border border-white/10 flex items-center justify-between">
          <span className="text-[11px] text-slate-400 font-bold flex items-center gap-1">
            <Flame className="w-3.5 h-3.5 text-orange-400" />
            Combo
          </span>
          <span className="text-base sm:text-lg font-extrabold font-mono text-orange-300">
            {combo} <span className="text-xs text-purple-300">(×{multiplier})</span>
          </span>
        </div>
        <div className="p-3 rounded-2xl glass-card border border-white/10 flex items-center justify-between">
          {mode === 'blitz' ? (
            <>
              <span className="text-[11px] text-slate-400 font-bold flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-cyan-400" />
                Giây
              </span>
              <span
                className={`text-base sm:text-lg font-extrabold font-mono ${
                  timeLeft <= 10 ? 'text-rose-400 animate-pulse' : 'text-cyan-300'
                }`}
              >
                {timeLeft}s
              </span>
            </>
          ) : (
            <>
              <span className="text-[11px] text-slate-400 font-bold">Mạng</span>
              <div className="flex items-center gap-0.5">
                {[0, 1, 2].map((h) => (
                  <Heart
                    key={h}
                    className={`w-4 h-4 ${
                      h < lives ? 'text-rose-500 fill-rose-500' : 'text-slate-600'
                    }`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Thanh thời gian */}
      <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
        <div
          className={`h-full bg-gradient-to-r ${accent} transition-all duration-1000 ease-linear`}
          style={{ width: `${(timeLeft / (mode === 'blitz' ? 60 : 12)) * 100}%` }}
        />
      </div>

      {/* Thẻ câu hỏi */}
      <div className="p-5 sm:p-6 rounded-3xl glass-card border border-white/15 space-y-5 shadow-xl">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span className="font-bold text-purple-300">Câu #{answeredCount + 1}</span>
          {mode === 'survival' && <span className="font-mono">{timeLeft}s</span>}
        </div>

        <h3 className="text-base sm:text-xl font-extrabold font-display text-white leading-relaxed">
          {currentQ.question}
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {currentQ.options.map((opt, oIdx) => {
            let cls =
              'bg-white/[0.04] border-white/15 text-slate-200 hover:border-purple-400/60 hover:bg-white/[0.08]';
            if (feedback) {
              if (oIdx === currentQ.correctIndex) {
                cls = 'bg-emerald-500/25 border-emerald-400 text-emerald-200 font-bold';
              } else if (oIdx === feedback.picked && !feedback.isRight) {
                cls = 'bg-rose-500/25 border-rose-400 text-rose-200';
              } else {
                cls = 'bg-white/[0.02] border-white/5 text-slate-500';
              }
            }
            return (
              <button
                key={oIdx}
                type="button"
                disabled={Boolean(feedback)}
                onClick={() => handlePick(oIdx)}
                className={`p-3.5 rounded-2xl border text-left text-xs sm:text-sm font-semibold flex items-center gap-2.5 transition-all cursor-pointer ${cls}`}
              >
                <span className="w-6 h-6 rounded-lg bg-white/10 flex items-center justify-center text-xs font-bold shrink-0">
                  {OPTION_LETTERS[oIdx]}
                </span>
                <span className="leading-snug">{opt}</span>
              </button>
            );
          })}
        </div>

        {feedback && feedback.explanation && (
          <div
            className={`p-3 rounded-xl border text-xs leading-relaxed ${
              feedback.isRight
                ? 'bg-emerald-500/15 border-emerald-400/35 text-emerald-200'
                : 'bg-rose-500/15 border-rose-400/35 text-rose-200'
            }`}
          >
            <strong>{feedback.isRight ? 'Chính xác!' : 'Chưa đúng:'}</strong> {feedback.explanation}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * ENGINE 2: PHYSICS DROP — Thiên thạch câu hỏi rơi từ trên xuống (3 mạng)
 */
function PhysicsDropEngine({ items, onFinish, onFishReact }) {
  const [queue] = useState(() => shuffle(items));
  const [idx, setIdx] = useState(0);
  const [dropPct, setDropPct] = useState(0);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [bestCombo, setBestCombo] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [answeredCount, setAnsweredCount] = useState(0);
  const [lives, setLives] = useState(3);
  const [flash, setFlash] = useState(null); // 'hit' | 'miss'
  const finishedRef = useRef(false);

  const currentQ = queue[idx % queue.length];

  const finishNow = useCallback(
    (s, c, a, bc) => {
      if (finishedRef.current) return;
      finishedRef.current = true;
      onFinish({ score: s, correctCount: c, totalAnswered: a, bestCombo: bc });
    },
    [onFinish]
  );

  useEffect(() => {
    if (finishedRef.current || flash) return undefined;
    // Tốc độ rơi tăng nhẹ theo điểm
    const stepMs = Math.max(55, 110 - Math.floor(score / 400) * 8);
    const interval = setInterval(() => {
      setDropPct((prev) => {
        if (prev >= 96) {
          const nextLives = lives - 1;
          setLives(nextLives);
          setCombo(0);
          setAnsweredCount((a) => a + 1);
          setFlash('miss');
          setTimeout(() => {
            if (nextLives <= 0) {
              finishNow(score, correctCount, answeredCount + 1, bestCombo);
              return;
            }
            setFlash(null);
            setDropPct(0);
            setIdx((i) => i + 1);
          }, 700);
          return 100;
        }
        return prev + 1.5;
      });
    }, stepMs);
    return () => clearInterval(interval);
  }, [flash, lives, score, correctCount, answeredCount, bestCombo, finishNow]);

  const handleShoot = (optIdx) => {
    if (flash || finishedRef.current) return;
    const isRight = optIdx === currentQ.correctIndex;
    const nextAnswered = answeredCount + 1;

    if (isRight) {
      const nextCombo = combo + 1;
      const nextBest = Math.max(bestCombo, nextCombo);
      const speedBonus = Math.round((100 - dropPct) * 1.5);
      const nextScore = score + 100 + speedBonus;
      setScore(nextScore);
      setCombo(nextCombo);
      setBestCombo(nextBest);
      setCorrectCount((c) => c + 1);
      setAnsweredCount(nextAnswered);
      setFlash('hit');
      onFishReact?.('correct', { combo: nextCombo });
      setTimeout(() => {
        if (idx + 1 >= queue.length * 2) {
          finishNow(nextScore, correctCount + 1, nextAnswered, nextBest);
          return;
        }
        setFlash(null);
        setDropPct(0);
        setIdx((i) => i + 1);
      }, 450);
    } else {
      const nextLives = lives - 1;
      setLives(nextLives);
      setCombo(0);
      setAnsweredCount(nextAnswered);
      setFlash('miss');
      onFishReact?.(nextLives === 1 ? 'urgent_life' : 'wrong');
      setTimeout(() => {
        if (nextLives <= 0) {
          finishNow(score, correctCount, nextAnswered, bestCombo);
          return;
        }
        setFlash(null);
        setDropPct(0);
        setIdx((i) => i + 1);
      }, 850);
    }
  };

  if (!currentQ) return null;

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="grid grid-cols-3 gap-2.5">
        <div className="p-3 rounded-2xl glass-card border border-white/10 flex items-center justify-between">
          <span className="text-[11px] text-slate-400 font-bold">Điểm</span>
          <span className="text-base font-extrabold font-mono text-amber-300">{score}</span>
        </div>
        <div className="p-3 rounded-2xl glass-card border border-white/10 flex items-center justify-between">
          <span className="text-[11px] text-slate-400 font-bold">Combo</span>
          <span className="text-base font-extrabold font-mono text-orange-300">×{combo}</span>
        </div>
        <div className="p-3 rounded-2xl glass-card border border-white/10 flex items-center justify-between">
          <span className="text-[11px] text-slate-400 font-bold">Mạng</span>
          <div className="flex items-center gap-0.5">
            {[0, 1, 2].map((h) => (
              <Heart
                key={h}
                className={`w-4 h-4 ${h < lives ? 'text-rose-500 fill-rose-500' : 'text-slate-600'}`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Vùng rơi thiên thạch */}
      <div className="relative h-56 sm:h-64 rounded-3xl glass-card border border-cyan-400/25 overflow-hidden bg-gradient-to-b from-slate-900/40 via-indigo-950/30 to-rose-950/30">
        {/* Vạch nguy hiểm dưới đáy */}
        <div className="absolute bottom-0 inset-x-0 h-2 bg-gradient-to-r from-rose-500/60 via-orange-500/60 to-rose-500/60" />

        {/* Khối câu hỏi đang rơi */}
        <div
          className="absolute left-1/2 -translate-x-1/2 w-[90%] max-w-md transition-[top] duration-100 ease-linear"
          style={{ top: `${Math.min(72, dropPct * 0.72)}%` }}
        >
          <div
            className={`px-4 py-3 rounded-2xl border shadow-xl text-center transition-colors ${
              flash === 'hit'
                ? 'bg-emerald-500/30 border-emerald-400 text-emerald-100 scale-105'
                : flash === 'miss'
                ? 'bg-rose-500/30 border-rose-400 text-rose-100'
                : 'bg-[#12162b]/95 border-cyan-400/50 text-white'
            }`}
          >
            <div className="text-[10px] font-bold uppercase tracking-wider text-cyan-300 mb-0.5">
              Chọn công thức / đơn vị đúng
            </div>
            <div className="text-sm sm:text-base font-extrabold">{currentQ.question}</div>
          </div>
        </div>
      </div>

      {/* 4 nút bắn đáp án */}
      <div className="grid grid-cols-2 gap-2.5">
        {currentQ.options.map((opt, oIdx) => {
          const isRightOpt = oIdx === currentQ.correctIndex;
          return (
            <button
              key={oIdx}
              type="button"
              disabled={Boolean(flash)}
              onClick={() => handleShoot(oIdx)}
              className={`p-3.5 rounded-2xl border text-xs sm:text-sm font-bold text-center transition-all cursor-pointer ${
                flash && isRightOpt
                  ? 'bg-emerald-500/25 border-emerald-400 text-emerald-200'
                  : 'glass-card border-white/15 text-white hover:border-cyan-400/70 hover:bg-cyan-500/15 active:scale-95'
              }`}
            >
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/**
 * ENGINE 3: TRUE / FALSE SPEED RUSH (6 giây / mệnh đề, 3 mạng) — Vật Lý
 */
function TrueFalseRushEngine({ items, onFinish, onFishReact }) {
  const [queue] = useState(() => shuffle(items));
  const [idx, setIdx] = useState(0);
  const [timeLeft, setTimeLeft] = useState(6);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [bestCombo, setBestCombo] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [answeredCount, setAnsweredCount] = useState(0);
  const [lives, setLives] = useState(3);
  const [feedback, setFeedback] = useState(null);
  const finishedRef = useRef(false);

  const current = queue[idx % queue.length];

  const finishNow = useCallback(
    (s, c, a, bc) => {
      if (finishedRef.current) return;
      finishedRef.current = true;
      onFinish({ score: s, correctCount: c, totalAnswered: a, bestCombo: bc });
    },
    [onFinish]
  );

  useEffect(() => {
    if (finishedRef.current || feedback) return undefined;
    const t = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          const nextLives = lives - 1;
          setLives(nextLives);
          setCombo(0);
          setAnsweredCount((a) => a + 1);
          onFishReact?.(nextLives === 1 ? 'urgent_life' : 'wrong');
          setFeedback({ isRight: false, text: `Hết giờ! ${current?.explanation || ''}` });
          setTimeout(() => {
            if (nextLives <= 0 || idx + 1 >= queue.length) {
              finishNow(score, correctCount, answeredCount + 1, bestCombo);
              return;
            }
            setFeedback(null);
            setIdx((i) => i + 1);
            setTimeLeft(6);
          }, 1200);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [feedback, lives, idx, queue.length, current, score, correctCount, answeredCount, bestCombo, finishNow, onFishReact]);

  const handleAnswer = (val) => {
    if (feedback || finishedRef.current) return;
    const isRight = val === current.isTrue;
    const nextAnswered = answeredCount + 1;
    let nextScore = score;
    let nextCombo = combo;
    let nextBest = bestCombo;
    let nextCorrect = correctCount;
    let nextLives = lives;

    if (isRight) {
      nextCombo = combo + 1;
      nextBest = Math.max(bestCombo, nextCombo);
      nextScore = score + 100 + timeLeft * 15;
      nextCorrect = correctCount + 1;
      onFishReact?.('correct', { combo: nextCombo });
    } else {
      nextCombo = 0;
      nextLives = lives - 1;
      onFishReact?.(nextLives === 1 ? 'urgent_life' : 'wrong');
    }

    setScore(nextScore);
    setCombo(nextCombo);
    setBestCombo(nextBest);
    setCorrectCount(nextCorrect);
    setAnsweredCount(nextAnswered);
    setLives(nextLives);
    setFeedback({ isRight, text: current.explanation });

    setTimeout(() => {
      if (nextLives <= 0 || idx + 1 >= queue.length) {
        finishNow(nextScore, nextCorrect, nextAnswered, nextBest);
        return;
      }
      setFeedback(null);
      setIdx((i) => i + 1);
      setTimeLeft(6);
    }, isRight ? 600 : 1300);
  };

  if (!current) return null;

  return (
    <div className="max-w-xl mx-auto space-y-4">
      <div className="grid grid-cols-3 gap-2.5">
        <div className="p-3 rounded-2xl glass-card border border-white/10 flex items-center justify-between">
          <span className="text-[11px] text-slate-400 font-bold">Điểm</span>
          <span className="text-base font-extrabold font-mono text-amber-300">{score}</span>
        </div>
        <div className="p-3 rounded-2xl glass-card border border-white/10 flex items-center justify-between">
          <span className="text-[11px] text-slate-400 font-bold">Câu</span>
          <span className="text-base font-extrabold font-mono text-sky-300">
            {idx + 1}/{queue.length}
          </span>
        </div>
        <div className="p-3 rounded-2xl glass-card border border-white/10 flex items-center justify-between">
          <span className="text-[11px] text-slate-400 font-bold">Mạng</span>
          <div className="flex items-center gap-0.5">
            {[0, 1, 2].map((h) => (
              <Heart
                key={h}
                className={`w-4 h-4 ${h < lives ? 'text-rose-500 fill-rose-500' : 'text-slate-600'}`}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
        <div
          className={`h-full transition-all duration-1000 ease-linear ${
            timeLeft <= 2 ? 'bg-rose-500' : 'bg-gradient-to-r from-sky-500 to-indigo-500'
          }`}
          style={{ width: `${(timeLeft / 6) * 100}%` }}
        />
      </div>

      <div className="p-6 sm:p-8 rounded-3xl glass-card border border-white/15 text-center space-y-5 shadow-xl">
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-sky-500/15 border border-sky-400/30 text-sky-300 text-xs font-bold">
          <Clock className="w-3.5 h-3.5" />
          <span>{timeLeft} giây</span>
        </span>

        <p className="text-base sm:text-xl font-bold text-white leading-relaxed">
          {current.statement}
        </p>

        {feedback && (
          <div
            className={`p-3 rounded-xl border text-xs font-semibold ${
              feedback.isRight
                ? 'bg-emerald-500/15 border-emerald-400/40 text-emerald-200'
                : 'bg-rose-500/15 border-rose-400/40 text-rose-200'
            }`}
          >
            {feedback.isRight ? '✓ Chính xác! ' : '✕ Chưa đúng! '}
            {feedback.text}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 pt-1">
          <button
            type="button"
            disabled={Boolean(feedback)}
            onClick={() => handleAnswer(true)}
            className="py-4 rounded-2xl bg-emerald-500/20 hover:bg-emerald-500/30 border-2 border-emerald-400/60 text-emerald-200 font-extrabold text-base flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer"
          >
            <CheckCircle2 className="w-5 h-5" />
            <span>ĐÚNG</span>
          </button>
          <button
            type="button"
            disabled={Boolean(feedback)}
            onClick={() => handleAnswer(false)}
            className="py-4 rounded-2xl bg-rose-500/20 hover:bg-rose-500/30 border-2 border-rose-400/60 text-rose-200 font-extrabold text-base flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer"
          >
            <XCircle className="w-5 h-5" />
            <span>SAI</span>
          </button>
        </div>
      </div>
    </div>
  );
}

function buildMemoryDeck(items, count) {
  const chosen = shuffle(items).slice(0, Math.min(count, items.length));
  const deck = [];
  chosen.forEach((pair, idx) => {
    const pid = `p-${idx}`;
    deck.push({ id: `${pid}-l`, pairId: pid, text: pair.left, side: 'left' });
    deck.push({ id: `${pid}-r`, pairId: pid, text: pair.right, side: 'right' });
  });
  return shuffle(deck);
}

/**
 * ENGINE 4: FORMULA MEMORY MATCH — Lật thẻ ghép đôi (3 mức độ) — Toán Học
 */
function MemoryMatchEngine({ items, onFinish, onFishReact }) {
  const initialCount = Math.min(6, items.length);
  const [pairCount, setPairCount] = useState(initialCount);
  const [cards, setCards] = useState(() => buildMemoryDeck(items, initialCount));
  const [flipped, setFlipped] = useState([]);
  const [matchedIds, setMatchedIds] = useState([]);
  const [moves, setMoves] = useState(0);
  const [elapsed, setElapsed] = useState(0);

  const handleChangeDifficulty = (count) => {
    setPairCount(count);
    setCards(buildMemoryDeck(items, count));
    setFlipped([]);
    setMatchedIds([]);
    setMoves(0);
    setElapsed(0);
  };

  useEffect(() => {
    if (cards.length > 0 && matchedIds.length === cards.length / 2) return undefined;
    const t = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(t);
  }, [cards.length, matchedIds.length]);

  const handleFlip = (index) => {
    if (flipped.length === 2 || flipped.includes(index) || matchedIds.includes(cards[index].pairId)) {
      return;
    }

    const nextFlipped = [...flipped, index];
    setFlipped(nextFlipped);

    if (nextFlipped.length === 2) {
      const [first, second] = nextFlipped;
      const nextMoves = moves + 1;
      setMoves(nextMoves);

      if (cards[first].pairId === cards[second].pairId) {
        const nextMatched = [...matchedIds, cards[first].pairId];
        setMatchedIds(nextMatched);
        setFlipped([]);
        onFishReact?.('correct', { combo: nextMatched.length });

        if (nextMatched.length === cards.length / 2) {
          const totalPairs = cards.length / 2;
          const computedScore = Math.max(200, totalPairs * 200 - nextMoves * 15 - elapsed * 2);
          setTimeout(() => {
            onFinish({
              score: computedScore,
              correctCount: totalPairs,
              totalAnswered: nextMoves,
              bestCombo: totalPairs,
            });
          }, 500);
        }
      } else {
        onFishReact?.('wrong');
        setTimeout(() => setFlipped([]), 800);
      }
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-2xl glass-card border border-white/10 text-xs">
        <div className="flex items-center gap-1.5">
          {[4, 6, 8]
            .filter((n) => n <= items.length)
            .map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => handleChangeDifficulty(n)}
                className={`px-3 py-1.5 rounded-xl font-bold cursor-pointer transition-all ${
                  pairCount === n
                    ? 'bg-purple-600 text-white'
                    : 'bg-white/[0.05] text-slate-300 hover:text-white'
                }`}
              >
                {n === 4 ? 'Dễ (4 cặp)' : n === 6 ? 'Vừa (6 cặp)' : 'Khó (8 cặp)'}
              </button>
            ))}
        </div>

        <div className="flex items-center gap-3 text-slate-300 font-mono">
          <span>
            Ghép: <strong className="text-emerald-400">{matchedIds.length}/{cards.length / 2}</strong>
          </span>
          <span>
            Lượt: <strong className="text-white">{moves}</strong>
          </span>
          <span>
            <strong className="text-cyan-300">{elapsed}s</strong>
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
        {cards.map((card, i) => {
          const isOpen = flipped.includes(i) || matchedIds.includes(card.pairId);
          const isMatched = matchedIds.includes(card.pairId);
          return (
            <button
              key={card.id}
              type="button"
              onClick={() => handleFlip(i)}
              className={`h-24 sm:h-28 p-2.5 rounded-2xl border flex items-center justify-center text-center transition-all duration-200 cursor-pointer ${
                isMatched
                  ? 'bg-emerald-500/20 border-emerald-400/60 text-emerald-200'
                  : isOpen
                  ? 'bg-purple-600/25 border-purple-400 text-white shadow-lg shadow-purple-500/20'
                  : 'glass-card border-white/15 hover:border-purple-400/50 text-purple-300'
              }`}
            >
              {isOpen ? (
                <span className="text-xs sm:text-sm font-bold leading-snug break-words">
                  {card.text}
                </span>
              ) : (
                <span className="text-2xl font-extrabold opacity-50">?</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/**
 * ENGINE 5: WORD SCRAMBLE — Xếp Chữ Săn Từ Vựng (Tiếng Anh)
 */
function WordScrambleEngine({ items, onFinish, onFishReact }) {
  const [queue] = useState(() => shuffle(items).slice(0, 10));
  const [idx, setIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [bestCombo, setBestCombo] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [lives, setLives] = useState(3);
  const [pickedIndices, setPickedIndices] = useState([]);
  const [status, setStatus] = useState(null); // 'correct' | 'wrong'

  const current = queue[idx];

  const scrambledLetters = useMemo(() => {
    if (!current?.word) return [];
    const chars = current.word.split('');
    let mixed = shuffle(chars);
    if (mixed.join('') === current.word && chars.length > 2) {
      mixed = [mixed[mixed.length - 1], ...mixed.slice(0, -1)];
    }
    return mixed;
  }, [current]);

  const advance = useCallback(
    (nextScore, nextCorrect, nextBest, nextLives) => {
      if (nextLives <= 0 || idx + 1 >= queue.length) {
        onFinish({
          score: nextScore,
          correctCount: nextCorrect,
          totalAnswered: idx + 1,
          bestCombo: nextBest,
        });
        return;
      }
      setPickedIndices([]);
      setStatus(null);
      setIdx((i) => i + 1);
    },
    [idx, queue.length, onFinish]
  );

  const handleTapPoolLetter = (poolIdx) => {
    if (status || pickedIndices.includes(poolIdx)) return;
    const next = [...pickedIndices, poolIdx];
    setPickedIndices(next);

    if (next.length === current.word.length) {
      const formed = next.map((pi) => scrambledLetters[pi]).join('');
      if (formed === current.word) {
        const nextCombo = combo + 1;
        const nextBest = Math.max(bestCombo, nextCombo);
        const nextScore = score + 120 + nextCombo * 20;
        setScore(nextScore);
        setCombo(nextCombo);
        setBestCombo(nextBest);
        setCorrectCount((c) => c + 1);
        setStatus('correct');
        onFishReact?.('correct', { combo: nextCombo });
        setTimeout(() => advance(nextScore, correctCount + 1, nextBest, lives), 700);
      } else {
        const nextLives = lives - 1;
        setLives(nextLives);
        setCombo(0);
        setStatus('wrong');
        onFishReact?.(nextLives === 1 ? 'urgent_life' : 'wrong');
        setTimeout(() => {
          if (nextLives <= 0) {
            advance(score, correctCount, bestCombo, 0);
          } else {
            setPickedIndices([]);
            setStatus(null);
          }
        }, 850);
      }
    }
  };

  const handleHint = () => {
    if (status || !current) return;
    const nextCharPos = pickedIndices.length;
    if (nextCharPos >= current.word.length) return;
    const neededChar = current.word[nextCharPos];
    const foundPoolIdx = scrambledLetters.findIndex(
      (ch, i) => ch === neededChar && !pickedIndices.includes(i)
    );
    if (foundPoolIdx !== -1) {
      handleTapPoolLetter(foundPoolIdx);
    }
  };

  if (!current) return null;

  return (
    <div className="max-w-xl mx-auto space-y-4">
      <div className="grid grid-cols-3 gap-2.5">
        <div className="p-3 rounded-2xl glass-card border border-white/10 flex items-center justify-between">
          <span className="text-[11px] text-slate-400 font-bold">Điểm</span>
          <span className="text-base font-extrabold font-mono text-amber-300">{score}</span>
        </div>
        <div className="p-3 rounded-2xl glass-card border border-white/10 flex items-center justify-between">
          <span className="text-[11px] text-slate-400 font-bold">Từ</span>
          <span className="text-base font-extrabold font-mono text-amber-200">
            {idx + 1}/{queue.length}
          </span>
        </div>
        <div className="p-3 rounded-2xl glass-card border border-white/10 flex items-center justify-between">
          <span className="text-[11px] text-slate-400 font-bold">Mạng</span>
          <div className="flex items-center gap-0.5">
            {[0, 1, 2].map((h) => (
              <Heart
                key={h}
                className={`w-4 h-4 ${h < lives ? 'text-rose-500 fill-rose-500' : 'text-slate-600'}`}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="p-5 sm:p-6 rounded-3xl glass-card border border-amber-400/25 text-center space-y-5 shadow-xl">
        <div className="space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-amber-300">
            Nghĩa tiếng Việt
          </span>
          <h3 className="text-xl sm:text-2xl font-extrabold text-white">{current.meaning}</h3>
          {current.phonetic && (
            <p className="text-xs sm:text-sm font-mono text-amber-200/80">{current.phonetic}</p>
          )}
          {current.hint && <p className="text-xs text-slate-400 italic">Gợi ý: {current.hint}</p>}
        </div>

        {/* Các ô chữ đang ghép */}
        <div className="flex items-center justify-center gap-1.5 flex-wrap min-h-[48px]">
          {current.word.split('').map((_, slotIdx) => {
            const poolIdx = pickedIndices[slotIdx];
            const char = poolIdx !== undefined ? scrambledLetters[poolIdx] : '';
            return (
              <button
                key={slotIdx}
                type="button"
                disabled={poolIdx === undefined || Boolean(status)}
                onClick={() =>
                  setPickedIndices((prev) => prev.filter((_, i) => i !== slotIdx))
                }
                className={`w-9 h-10 sm:w-10 sm:h-11 rounded-xl border-2 font-mono font-extrabold text-base flex items-center justify-center transition-all ${
                  status === 'correct'
                    ? 'bg-emerald-500/25 border-emerald-400 text-emerald-200'
                    : status === 'wrong'
                    ? 'bg-rose-500/25 border-rose-400 text-rose-200'
                    : char
                    ? 'bg-amber-500/20 border-amber-400 text-white cursor-pointer'
                    : 'bg-white/[0.03] border-dashed border-white/20 text-transparent'
                }`}
              >
                {char || '_'}
              </button>
            );
          })}
        </div>

        {/* Kho chữ cái bị xáo trộn */}
        <div className="flex items-center justify-center gap-2 flex-wrap pt-1">
          {scrambledLetters.map((ch, pIdx) => {
            const used = pickedIndices.includes(pIdx);
            return (
              <button
                key={pIdx}
                type="button"
                disabled={used || Boolean(status)}
                onClick={() => handleTapPoolLetter(pIdx)}
                className={`w-10 h-11 rounded-xl border font-mono font-extrabold text-base transition-all cursor-pointer ${
                  used
                    ? 'opacity-20 bg-white/5 border-white/5 text-slate-500 pointer-events-none'
                    : 'bg-white/[0.08] border-white/20 text-white hover:border-amber-400 hover:bg-amber-500/20 active:scale-90'
                }`}
              >
                {ch}
              </button>
            );
          })}
        </div>

        <div className="flex items-center justify-center gap-2.5 pt-1">
          <button
            type="button"
            onClick={handleHint}
            disabled={Boolean(status)}
            className="px-3.5 py-2 rounded-xl glass-button text-xs font-semibold text-amber-300 inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Lightbulb className="w-3.5 h-3.5" />
            <span>Gợi ý 1 chữ</span>
          </button>
          <button
            type="button"
            onClick={() => setPickedIndices([])}
            disabled={pickedIndices.length === 0 || Boolean(status)}
            className="px-3.5 py-2 rounded-xl glass-button text-xs font-semibold text-slate-300 cursor-pointer disabled:opacity-40"
          >
            Xóa hết
          </button>
          <button
            type="button"
            onClick={() => advance(score, correctCount, bestCombo, lives)}
            disabled={Boolean(status)}
            className="px-3.5 py-2 rounded-xl glass-button text-xs font-semibold text-slate-300 inline-flex items-center gap-1 cursor-pointer"
          >
            <SkipForward className="w-3.5 h-3.5" />
            <span>Bỏ qua</span>
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * ENGINE 6: VOCAB SPEED LINK — Nối Nghĩa 2 Cột Siêu Tốc 60s (Tiếng Anh)
 */
function VocabSpeedLinkEngine({ items, onFinish, onFishReact }) {
  const [pool] = useState(() => shuffle(items));
  const [round, setRound] = useState(0);
  const [selectedLeft, setSelectedLeft] = useState(null);
  const [matchedKeys, setMatchedKeys] = useState([]);
  const [wrongPair, setWrongPair] = useState(null);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [bestCombo, setBestCombo] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [answeredCount, setAnsweredCount] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const finishedRef = useRef(false);

  const boardPairs = useMemo(() => {
    const start = (round * 5) % pool.length;
    const slice = [];
    for (let i = 0; i < Math.min(5, pool.length); i++) {
      slice.push({ ...pool[(start + i) % pool.length], key: `r${round}-${i}` });
    }
    return slice;
  }, [pool, round]);

  const shuffledRight = useMemo(() => shuffle(boardPairs), [boardPairs]);

  useEffect(() => {
    if (finishedRef.current) return undefined;
    const t = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev === 11) {
          onFishReact?.('urgent_time');
        }
        if (prev <= 1) {
          if (!finishedRef.current) {
            finishedRef.current = true;
            onFinish({
              score,
              correctCount,
              totalAnswered: answeredCount,
              bestCombo,
            });
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [score, correctCount, answeredCount, bestCombo, onFinish, onFishReact]);

  const handleRightClick = (rightItem) => {
    if (!selectedLeft || matchedKeys.includes(rightItem.key)) return;
    setAnsweredCount((a) => a + 1);

    if (selectedLeft.key === rightItem.key) {
      const nextMatched = [...matchedKeys, rightItem.key];
      const nextCombo = combo + 1;
      const nextBest = Math.max(bestCombo, nextCombo);
      setMatchedKeys(nextMatched);
      setSelectedLeft(null);
      setCombo(nextCombo);
      setBestCombo(nextBest);
      setCorrectCount((c) => c + 1);
      setScore((s) => s + 100 + Math.min(3, Math.floor(nextCombo / 3)) * 25);
      onFishReact?.('correct', { combo: nextCombo });

      if (nextMatched.length === boardPairs.length) {
        setTimeout(() => {
          setMatchedKeys([]);
          setSelectedLeft(null);
          setRound((r) => r + 1);
        }, 350);
      }
    } else {
      setCombo(0);
      setWrongPair({ left: selectedLeft.key, right: rightItem.key });
      onFishReact?.('wrong');
      setTimeout(() => {
        setWrongPair(null);
        setSelectedLeft(null);
      }, 450);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="grid grid-cols-3 gap-2.5">
        <div className="p-3 rounded-2xl glass-card border border-white/10 flex items-center justify-between">
          <span className="text-[11px] text-slate-400 font-bold">Điểm</span>
          <span className="text-base font-extrabold font-mono text-amber-300">{score}</span>
        </div>
        <div className="p-3 rounded-2xl glass-card border border-white/10 flex items-center justify-between">
          <span className="text-[11px] text-slate-400 font-bold">Combo</span>
          <span className="text-base font-extrabold font-mono text-orange-300">×{combo}</span>
        </div>
        <div className="p-3 rounded-2xl glass-card border border-white/10 flex items-center justify-between">
          <span className="text-[11px] text-slate-400 font-bold">Giây</span>
          <span
            className={`text-base font-extrabold font-mono ${
              timeLeft <= 10 ? 'text-rose-400 animate-pulse' : 'text-cyan-300'
            }`}
          >
            {timeLeft}s
          </span>
        </div>
      </div>

      <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-amber-500 to-rose-500 transition-all duration-1000 ease-linear"
          style={{ width: `${(timeLeft / 60) * 100}%` }}
        />
      </div>

      <div className="p-4 sm:p-5 rounded-3xl glass-card border border-white/15 space-y-3">
        <p className="text-xs text-center text-slate-400">
          Chạm <strong>1 từ bên trái</strong> rồi chạm <strong>nghĩa tương ứng bên phải</strong> để nối cặp!
        </p>
        <div className="grid grid-cols-2 gap-3">
          {/* Cột trái: Tiếng Anh */}
          <div className="space-y-2.5">
            {boardPairs.map((item) => {
              const isMatched = matchedKeys.includes(item.key);
              const isSelected = selectedLeft?.key === item.key;
              const isWrong = wrongPair?.left === item.key;
              return (
                <button
                  key={item.key}
                  type="button"
                  disabled={isMatched}
                  onClick={() => setSelectedLeft(item)}
                  className={`w-full p-3 rounded-2xl border text-left text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                    isMatched
                      ? 'opacity-25 bg-emerald-500/15 border-emerald-400/40 text-emerald-300 pointer-events-none'
                      : isWrong
                      ? 'bg-rose-500/25 border-rose-400 text-rose-200'
                      : isSelected
                      ? 'bg-amber-500/25 border-amber-400 text-white shadow-md shadow-amber-500/20'
                      : 'bg-white/[0.04] border-white/15 text-white hover:border-amber-400/50'
                  }`}
                >
                  {item.left}
                </button>
              );
            })}
          </div>

          {/* Cột phải: Nghĩa tiếng Việt */}
          <div className="space-y-2.5">
            {shuffledRight.map((item) => {
              const isMatched = matchedKeys.includes(item.key);
              const isWrong = wrongPair?.right === item.key;
              return (
                <button
                  key={item.key}
                  type="button"
                  disabled={isMatched || !selectedLeft}
                  onClick={() => handleRightClick(item)}
                  className={`w-full p-3 rounded-2xl border text-left text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                    isMatched
                      ? 'opacity-25 bg-emerald-500/15 border-emerald-400/40 text-emerald-300 pointer-events-none'
                      : isWrong
                      ? 'bg-rose-500/25 border-rose-400 text-rose-200'
                      : selectedLeft
                      ? 'bg-white/[0.06] border-white/20 text-slate-100 hover:border-emerald-400/60'
                      : 'bg-white/[0.03] border-white/10 text-slate-300'
                  }`}
                >
                  {item.right}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Wrapper chính cho mọi trò chơi
 */
export default function GameArena({
  game,
  items,
  sourceLabel,
  scopeSummary,
  userXp = 0,
  onComplete,
  onChangeScope,
  onExit,
}) {
  const [runId, setRunId] = useState(0);
  const [result, setResult] = useState(null);
  const [fishState, setFishState] = useState(() => getGameReaction('start'));
  const [fishFlip, setFishFlip] = useState(false);
  const fishResetRef = useRef(null);

  const fishTier = useMemo(() => getClownfishTier(userXp), [userXp]);

  // Ẩn Cá Hề nổi ở góc trong khi đang ở đấu trường game (dùng Cá Hề đấu trường chuyên biệt)
  useEffect(() => {
    setMascotSuppressed(true);
    return () => {
      setMascotSuppressed(false);
      if (fishResetRef.current) clearTimeout(fishResetRef.current);
    };
  }, []);

  const handleFishReact = useCallback((type, meta = {}) => {
    const reaction = getGameReaction(type, meta);
    setFishState(reaction);
    if (type === 'correct' && (meta.combo || 0) >= 3) {
      setFishFlip(true);
      setTimeout(() => setFishFlip(false), 720);
    }
    if (fishResetRef.current) clearTimeout(fishResetRef.current);
    if (type !== 'urgent_life' && type !== 'urgent_time') {
      fishResetRef.current = setTimeout(() => {
        setFishState((prev) => ({ ...prev, mood: 'idle' }));
      }, 2600);
    }
  }, []);

  const handleEngineFinish = useCallback(
    async ({ score, correctCount, totalAnswered, bestCombo }) => {
      const xpEarned = Math.max(20, Math.round(score / 15));
      confetti({ particleCount: 90, spread: 75, origin: { y: 0.6 } });
      let isNewRecord = false;
      if (onComplete) {
        const res = await onComplete({ score, xpEarned });
        isNewRecord = Boolean(res?.isNewRecord);
      }
      setResult({ score, correctCount, totalAnswered, bestCombo, xpEarned, isNewRecord });
    },
    [onComplete]
  );

  const handleReplay = () => {
    setResult(null);
    setFishState(getGameReaction('start'));
    setRunId((r) => r + 1);
  };

  return (
    <div className="space-y-4 sm:space-y-5 pb-10">
      {/* Header gọn gàng */}
      <div className="rounded-2xl glass-card border border-white/10 p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={onExit}
            className="px-3 py-2 rounded-xl glass-button text-xs font-semibold text-slate-300 hover:text-white inline-flex items-center gap-1.5 cursor-pointer shrink-0"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Sảnh game</span>
          </button>
          <div className="min-w-0">
            <h2 className="text-base sm:text-lg font-extrabold font-display text-white truncate">
              {game.title}
            </h2>
            <p className="text-[11px] text-slate-400 truncate">
              {game.subjectName} • {scopeSummary} • {sourceLabel}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onChangeScope}
          className="px-3 py-1.5 rounded-xl glass-button text-xs font-semibold text-purple-300 hover:text-white inline-flex items-center gap-1.5 self-start sm:self-auto cursor-pointer shrink-0"
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span>Đổi phạm vi bài</span>
        </button>
      </div>

      {/* Đồng hành Cá Hề tương tác trực tiếp trong màn chơi */}
      {!result && (
        <div className="max-w-2xl mx-auto rounded-2xl glass-card border border-orange-400/25 px-3.5 py-2.5 flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              setFishFlip(true);
              setTimeout(() => setFishFlip(false), 700);
            }}
            title="Chạm vào Cá Hề để lấy may!"
            className="shrink-0 cursor-pointer focus:outline-none"
          >
            <ClownfishSvg
              mood={fishState.mood}
              tier={fishTier.tier.id}
              size={52}
              isFlipping={fishFlip}
              showBubbles
            />
          </button>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-extrabold text-orange-600 dark:text-orange-300 uppercase tracking-wider">
                {fishTier.tier.name}
              </span>
              {fishState.mood === 'combo' && (
                <span className="px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-700 border border-amber-300 dark:bg-amber-500/20 dark:border-amber-400/40 text-[10px] font-bold dark:text-amber-300">
                  SIÊU TỐC
                </span>
              )}
              {fishState.mood === 'urgent' && (
                <span className="px-1.5 py-0.5 rounded-md bg-rose-100 text-rose-700 border border-rose-300 dark:bg-rose-500/20 dark:border-rose-400/40 text-[10px] font-bold dark:text-rose-300">
                  CẨN THẬN!
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm font-medium text-slate-800 dark:text-white/95 leading-snug mt-0.5">
              “{fishState.message}”
            </p>
          </div>
        </div>
      )}

      {result ? (
        <GameResultSummary
          game={game}
          score={result.score}
          correctCount={result.correctCount}
          totalAnswered={result.totalAnswered}
          bestCombo={result.bestCombo}
          xpEarned={result.xpEarned}
          isNewRecord={result.isNewRecord}
          scopeSummary={scopeSummary}
          userXp={userXp}
          onReplay={handleReplay}
          onChangeScope={onChangeScope}
          onExit={onExit}
        />
      ) : (
        <div key={runId}>
          {(game.engine === 'blitz' || game.engine === 'survival') && (
            <McArcadeEngine
              items={items}
              mode={game.engine}
              accent={game.accent}
              onFinish={handleEngineFinish}
              onFishReact={handleFishReact}
            />
          )}
          {game.engine === 'drop' && (
            <PhysicsDropEngine
              items={items}
              onFinish={handleEngineFinish}
              onFishReact={handleFishReact}
            />
          )}
          {game.engine === 'tf-rush' && (
            <TrueFalseRushEngine
              items={items}
              onFinish={handleEngineFinish}
              onFishReact={handleFishReact}
            />
          )}
          {game.engine === 'memory' && (
            <MemoryMatchEngine
              items={items}
              onFinish={handleEngineFinish}
              onFishReact={handleFishReact}
            />
          )}
          {game.engine === 'scramble' && (
            <WordScrambleEngine
              items={items}
              onFinish={handleEngineFinish}
              onFishReact={handleFishReact}
            />
          )}
          {game.engine === 'link' && (
            <VocabSpeedLinkEngine
              items={items}
              onFinish={handleEngineFinish}
              onFishReact={handleFishReact}
            />
          )}
        </div>
      )}
    </div>
  );
}
