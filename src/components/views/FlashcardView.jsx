import React, { useState, useEffect } from 'react';
import {
  Layers,
  RotateCw,
  Check,
  X,
  Sparkles,
  Trophy,
  Keyboard
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { FLASHCARD_DECKS } from '../../data/mockData';

export default function FlashcardView() {
  const [selectedDeckIndex, setSelectedDeckIndex] = useState(0);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [rememberedCount, setRememberedCount] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  const currentDeck = FLASHCARD_DECKS[selectedDeckIndex];
  const currentCard = currentDeck.cards[currentCardIndex];

  // Desktop Keyboard Shortcuts (Space = flip, ArrowLeft = Needs review, ArrowRight = Mastered)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (isFinished) return;
      if (e.code === 'Space') {
        e.preventDefault();
        setIsFlipped((prev) => !prev);
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        handleNext(true);
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        handleNext(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFinished, currentCardIndex, selectedDeckIndex]);

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const handleNext = (isKnown) => {
    if (isKnown) {
      setRememberedCount((prev) => prev + 1);
    } else {
      setReviewCount((prev) => prev + 1);
    }

    setIsFlipped(false);

    if (currentCardIndex + 1 < currentDeck.cards.length) {
      setCurrentCardIndex((prev) => prev + 1);
    } else {
      setIsFinished(true);
      confetti({
        particleCount: 90,
        spread: 75,
        origin: { y: 0.6 },
      });
    }
  };

  const handleRestart = () => {
    setCurrentCardIndex(0);
    setIsFlipped(false);
    setRememberedCount(0);
    setReviewCount(0);
    setIsFinished(false);
  };

  return (
    <div className="space-y-6 md:space-y-8 pb-10">
      {/* 1. Header with Desktop Shortcuts Hint */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/15 border border-purple-500/30 text-purple-300 text-xs font-semibold mb-2">
            <Layers className="w-3.5 h-3.5 text-purple-300" />
            <span>Luyện Thẻ Ghi Nhớ (Flashcard)</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-display tracking-tight text-white">
            Thẻ Ghi Nhớ Kiến Thức
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">
            Ôn tập kiến thức nhanh và dễ thuộc bằng phương pháp lật thẻ
          </p>
        </div>

        {/* Keyboard Shortcuts Hint Bar for Desktop */}
        <div className="hidden lg:flex items-center gap-3 px-4 py-2 rounded-2xl glass-card border border-white/10 text-xs text-slate-300">
          <Keyboard className="w-4 h-4 text-purple-400" />
          <span>Phím tắt:</span>
          <span className="px-2 py-0.5 rounded bg-white/[0.08] border border-white/10 font-mono text-[11px] text-white">
            Space
          </span>
          <span className="text-slate-400">Lật thẻ</span>
          <span>•</span>
          <span className="px-2 py-0.5 rounded bg-white/[0.08] border border-white/10 font-mono text-[11px] text-white">
            ← / →
          </span>
          <span className="text-slate-400">Ôn lại / Đã thuộc</span>
        </div>
      </div>

      {/* 2. Desktop 3-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Column (1 col): Deck Selector Library */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 px-1 font-display">
            Các Bộ Thẻ Đang Học
          </h3>

          <div className="space-y-2.5">
            {FLASHCARD_DECKS.map((deck, idx) => {
              const isSelected = selectedDeckIndex === idx;

              return (
                <div
                  key={deck.id}
                  onClick={() => {
                    setSelectedDeckIndex(idx);
                    handleRestart();
                  }}
                  className={`p-4 rounded-2xl glass-card border cursor-pointer transition-all ${
                    isSelected
                      ? 'border-purple-400/60 bg-purple-500/15 shadow-lg shadow-purple-500/20 translate-x-1'
                      : 'border-white/10 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-purple-300">
                      {deck.subject}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {deck.cardCount} thẻ
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-white mt-1.5 line-clamp-1 font-display">
                    {deck.title}
                  </h4>

                  <div className="mt-3">
                    <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                      <span>Đã thuộc</span>
                      <span className="font-bold text-purple-300">
                        {deck.mastered} / {deck.cardCount}
                      </span>
                    </div>
                    <div className="w-full h-1 rounded-full bg-white/10 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-purple-500 to-indigo-400"
                        style={{ width: `${(deck.mastered / deck.cardCount) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Center Stage (2 cols): Card Stage */}
        <div className="lg:col-span-2 space-y-5">
          {!isFinished ? (
            <>
              {/* Card Index & Progress Bar */}
              <div className="flex items-center justify-between text-xs text-slate-400 px-1">
                <span>
                  Thẻ số <strong className="text-purple-300 font-bold text-sm">{currentCardIndex + 1}</strong> / {currentDeck.cards.length}
                </span>
                <div className="flex items-center gap-3">
                  <span className="text-emerald-400 font-semibold">✓ Đã thuộc: {rememberedCount}</span>
                  <span className="text-rose-400 font-semibold">✗ Cần ôn lại: {reviewCount}</span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-purple-500 via-indigo-400 to-cyan-400 transition-all duration-300"
                  style={{
                    width: `${((currentCardIndex + 1) / currentDeck.cards.length) * 100}%`,
                  }}
                />
              </div>

              {/* 3D Flip Card */}
              <div
                className="perspective-1000 w-full h-[400px] cursor-pointer select-none"
                onClick={handleFlip}
              >
                <div
                  className={`relative w-full h-full duration-500 transform-style-3d transition-transform ${
                    isFlipped ? 'rotate-y-180' : ''
                  }`}
                >
                  {/* FRONT FACE */}
                  <div className="absolute inset-0 w-full h-full backface-hidden rounded-3xl glass-card p-8 flex flex-col justify-between border border-purple-500/40 shadow-2xl bg-gradient-to-b from-[#141628] via-[#0d0f1b] to-[#07080f] group">
                    <div className="flex items-center justify-between">
                      <span className="px-3.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-purple-500/20 text-purple-200 border border-purple-400/30">
                        {currentDeck.subject}
                      </span>
                      <div className="flex items-center gap-2 text-slate-400 text-xs">
                        <Sparkles className="w-4 h-4 text-purple-400" />
                        <span>Mặt trước: Câu hỏi / Từ vựng</span>
                      </div>
                    </div>

                    <div className="text-center my-auto px-6">
                      <div className="text-3xl sm:text-4xl font-extrabold font-display tracking-tight text-white shimmer-text">
                        {currentCard.front}
                      </div>
                      {currentCard.phonetic && (
                        <div className="mt-2 text-sm text-purple-300 font-mono">
                          {currentCard.phonetic}
                        </div>
                      )}
                      {currentCard.hint && (
                        <div className="mt-5 p-3.5 rounded-2xl bg-white/[0.04] border border-white/10 text-xs text-slate-300 max-w-lg mx-auto">
                          💡 <strong>Gợi ý:</strong> {currentCard.hint}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-center gap-2 text-xs text-slate-400 pt-3 border-t border-white/10">
                      <RotateCw className="w-4 h-4 text-purple-400" />
                      <span>Nhấn chuột hoặc phím [Space] để lật đáp án</span>
                    </div>
                  </div>

                  {/* BACK FACE */}
                  <div className="absolute inset-0 w-full h-full backface-hidden rotate-y-180 rounded-3xl glass-card p-8 flex flex-col justify-between border border-emerald-500/40 shadow-2xl bg-gradient-to-b from-[#0f211f] via-[#0a1717] to-[#07080f]">
                    <div className="flex items-center justify-between">
                      <span className="px-3.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-200 border border-emerald-400/30">
                        Đáp Án & Giải Thích
                      </span>
                      <span className="text-xs text-emerald-400 font-semibold">✓ Mặt sau</span>
                    </div>

                    <div className="my-auto space-y-4 px-4">
                      <div className="text-xl sm:text-2xl font-bold font-display text-white whitespace-pre-line leading-relaxed">
                        {currentCard.back}
                      </div>
                      {currentCard.example && (
                        <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 text-xs sm:text-sm text-slate-200 leading-relaxed">
                          <strong className="text-emerald-300">Ví dụ minh họa:</strong> "{currentCard.example}"
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-center gap-2 text-xs text-slate-400 pt-3 border-t border-white/10">
                      <RotateCw className="w-4 h-4 text-emerald-400" />
                      <span>Nhấn để lật lại mặt trước</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-center gap-4 pt-2">
                <button
                  onClick={() => handleNext(false)}
                  className="flex-1 max-w-[220px] py-3.5 px-6 rounded-2xl glass-card border-rose-500/30 hover:border-rose-500/60 bg-rose-500/10 text-rose-200 hover:text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-lg hover:scale-[1.02] transition-all"
                >
                  <X className="w-4 h-4 text-rose-400" />
                  <span>Cần Ôn Lại [←]</span>
                </button>

                <button
                  onClick={handleFlip}
                  className="w-12 h-12 rounded-2xl glass-button flex items-center justify-center text-purple-300 hover:text-white"
                  title="Lật thẻ"
                >
                  <RotateCw className="w-4 h-4" />
                </button>

                <button
                  onClick={() => handleNext(true)}
                  className="flex-1 max-w-[220px] py-3.5 px-6 rounded-2xl glass-card border-emerald-500/30 hover:border-emerald-500/60 bg-emerald-500/10 text-emerald-200 hover:text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-lg hover:scale-[1.02] transition-all"
                >
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>Đã Thuộc [→]</span>
                </button>
              </div>
            </>
          ) : (
            <div className="rounded-3xl glass-card p-10 text-center border border-purple-500/40 shadow-2xl relative overflow-hidden">
              <Trophy className="w-16 h-16 text-amber-400 mx-auto mb-4 animate-bounce" />
              <h2 className="text-2xl sm:text-3xl font-extrabold font-display text-white">Hoàn Thành Bộ Thẻ!</h2>
              <p className="text-xs sm:text-sm text-slate-300 mt-2 mb-6">
                Bạn đã ôn xong toàn bộ thẻ trong bộ "{currentDeck.title}"
              </p>

              <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto mb-6">
                <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10">
                  <span className="text-xs text-slate-400 block">Đã thuộc</span>
                  <span className="text-2xl font-bold text-emerald-400 font-display mt-1 block">
                    {rememberedCount} thẻ
                  </span>
                </div>
                <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10">
                  <span className="text-xs text-slate-400 block">Cần ôn lại</span>
                  <span className="text-2xl font-bold text-rose-400 font-display mt-1 block">
                    {reviewCount} thẻ
                  </span>
                </div>
              </div>

              <button
                onClick={handleRestart}
                className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold text-sm shadow-xl shadow-purple-600/30 hover:scale-[1.02] transition-all"
              >
                Học Lại Bộ Này
              </button>
            </div>
          )}
        </div>

        {/* Right Column (1 col): Card List */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 px-1 font-display">
            Danh Sách Thẻ Trong Bộ
          </h3>

          <div className="space-y-2 max-h-[500px] overflow-y-auto scrollbar-none pr-1">
            {currentDeck.cards.map((c, i) => {
              const isCurrent = currentCardIndex === i;

              return (
                <div
                  key={c.id}
                  onClick={() => {
                    setCurrentCardIndex(i);
                    setIsFlipped(false);
                    setIsFinished(false);
                  }}
                  className={`p-3 rounded-xl border cursor-pointer transition-all ${
                    isCurrent
                      ? 'bg-purple-600/25 border-purple-400 text-white shadow-md'
                      : 'bg-white/[0.03] border-white/10 text-slate-400 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-purple-300">#{i + 1}</span>
                    <span className="truncate max-w-[150px]">{c.front.split('(')[0]}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
