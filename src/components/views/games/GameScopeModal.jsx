import React, { useState, useMemo } from 'react';
import {
  X,
  Play,
  Sparkles,
  BookOpen,
  Check,
  Layers,
  Loader2,
  SlidersHorizontal,
  RefreshCw,
} from 'lucide-react';
import { loadUserGameScope, saveUserGameScope } from '../../../services/gameService';

export default function GameScopeModal({
  game,
  username,
  lessonNames = [],
  flashcardDecks = [],
  isLoadingQuestions = false,
  onClose,
  onStart,
}) {
  const isEnglish = game?.subjectId === 'sub-3';
  const hasLessons = lessonNames.length > 0;
  const hasFlashcards = isEnglish && flashcardDecks.length > 0;

  const savedScope = useMemo(
    () => loadUserGameScope(username, game?.subjectId),
    [username, game?.subjectId]
  );

  const [scopeMode, setScopeMode] = useState(() => {
    if (savedScope?.mode === 'flashcard' && hasFlashcards) return 'flashcard';
    if (savedScope?.mode === 'pick' && hasLessons) return 'pick';
    if (hasLessons) return 'upto';
    if (hasFlashcards) return 'flashcard';
    return 'custom';
  });

  const [uptoIndex, setUptoIndex] = useState(() => {
    if (typeof savedScope?.uptoIndex === 'number' && hasLessons) {
      return Math.min(savedScope.uptoIndex, lessonNames.length - 1);
    }
    return Math.min(2, Math.max(0, lessonNames.length - 1));
  });

  const [pickedLessons, setPickedLessons] = useState(() => {
    if (Array.isArray(savedScope?.pickedLessons) && savedScope.pickedLessons.length > 0) {
      const valid = savedScope.pickedLessons.filter((n) => lessonNames.includes(n));
      if (valid.length > 0) return valid;
    }
    return hasLessons ? [lessonNames[0]] : [];
  });

  const [pickedDeckIds, setPickedDeckIds] = useState(() => {
    if (Array.isArray(savedScope?.pickedDeckIds) && savedScope.pickedDeckIds.length > 0) {
      const valid = savedScope.pickedDeckIds.filter((id) =>
        flashcardDecks.some((d) => d.id === id)
      );
      if (valid.length > 0) return valid;
    }
    return hasFlashcards ? [flashcardDecks[0].id] : [];
  });

  const [customTopic, setCustomTopic] = useState(savedScope?.customTopic || '');
  const [forceRefreshAI, setForceRefreshAI] = useState(false);

  const toggleLesson = (name) => {
    setPickedLessons((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]
    );
  };

  const toggleDeck = (deckId) => {
    setPickedDeckIds((prev) =>
      prev.includes(deckId) ? prev.filter((id) => id !== deckId) : [...prev, deckId]
    );
  };

  const selectedLessonsPreview = useMemo(() => {
    if (scopeMode === 'upto' && hasLessons) {
      return lessonNames.slice(0, uptoIndex + 1);
    }
    if (scopeMode === 'pick') {
      return pickedLessons;
    }
    if (scopeMode === 'custom' && customTopic.trim()) {
      return [customTopic.trim()];
    }
    return [];
  }, [scopeMode, hasLessons, lessonNames, uptoIndex, pickedLessons, customTopic]);

  const handleLaunch = (useGeneralFallback = false) => {
    if (!useGeneralFallback) {
      saveUserGameScope(username, game.subjectId, {
        mode: scopeMode,
        uptoIndex,
        pickedLessons,
        pickedDeckIds,
        customTopic,
      });
    }

    if (useGeneralFallback) {
      onStart({
        selectedLessons: [],
        selectedFlashcardDecks: [],
        forceRefreshAI: false,
        scopeSummary: 'Tổng hợp toàn môn',
      });
      return;
    }

    if (scopeMode === 'flashcard' && hasFlashcards) {
      const decks = flashcardDecks.filter((d) => pickedDeckIds.includes(d.id));
      onStart({
        selectedLessons: [],
        selectedFlashcardDecks: decks,
        forceRefreshAI: false,
        scopeSummary:
          decks.length === 1
            ? `Flashcard: ${decks[0].title}`
            : `${decks.length} bộ Flashcard`,
      });
      return;
    }

    const summary =
      scopeMode === 'upto' && hasLessons
        ? `Từ ${lessonNames[0]} → ${lessonNames[uptoIndex]} (${uptoIndex + 1} bài)`
        : selectedLessonsPreview.length === 1
        ? selectedLessonsPreview[0]
        : selectedLessonsPreview.length > 1
        ? `${selectedLessonsPreview.length} bài đã chọn`
        : 'Tổng hợp toàn môn';

    onStart({
      selectedLessons: selectedLessonsPreview,
      selectedFlashcardDecks: [],
      forceRefreshAI,
      scopeSummary: summary,
    });
  };

  const canStartScoped =
    (scopeMode === 'upto' && hasLessons) ||
    (scopeMode === 'pick' && pickedLessons.length > 0) ||
    (scopeMode === 'flashcard' && pickedDeckIds.length > 0) ||
    (scopeMode === 'custom' && customTopic.trim().length > 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-md">
      <div className="w-full max-w-xl max-h-[90vh] flex flex-col rounded-3xl bg-white dark:bg-[#111322] border border-slate-200 dark:border-white/15 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 dark:border-white/10 flex items-center justify-between gap-3 shrink-0">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 dark:text-purple-300">
                {game.subjectName}
              </span>
              <span className="text-slate-400">•</span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">{game.skill}</span>
            </div>
            <h3 className="text-base sm:text-lg font-extrabold font-display text-slate-900 dark:text-white truncate mt-0.5">
              {game.title}
            </h3>
          </div>
          <button
            type="button"
            disabled={isLoadingQuestions}
            onClick={onClose}
            className="p-2 rounded-xl glass-button text-slate-400 hover:text-slate-800 dark:hover:text-white cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <div className="p-3 rounded-2xl bg-indigo-50/70 dark:bg-purple-500/10 border border-indigo-200 dark:border-purple-400/25 flex items-start gap-2.5 text-xs text-slate-700 dark:text-slate-200">
            <SlidersHorizontal className="w-4 h-4 text-indigo-600 dark:text-purple-300 shrink-0 mt-0.5" />
            <span>
              <strong>Khoanh vùng kiến thức đã học:</strong> Chọn phạm vi bài học bạn đã học tới để trò chơi chỉ ra câu hỏi đúng trong phần kiến thức đó.
            </span>
          </div>

          {/* Chế độ chọn phạm vi */}
          <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-100 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 flex-wrap">
            {hasLessons && (
              <>
                <button
                  type="button"
                  onClick={() => setScopeMode('upto')}
                  className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    scopeMode === 'upto'
                      ? 'bg-indigo-600 dark:bg-purple-600 text-white shadow'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Theo tiến độ (Bài 1 → N)
                </button>
                <button
                  type="button"
                  onClick={() => setScopeMode('pick')}
                  className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    scopeMode === 'pick'
                      ? 'bg-indigo-600 dark:bg-purple-600 text-white shadow'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Chọn bài cụ thể
                </button>
              </>
            )}

            {hasFlashcards && (
              <button
                type="button"
                onClick={() => setScopeMode('flashcard')}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap inline-flex items-center justify-center gap-1 ${
                  scopeMode === 'flashcard'
                    ? 'bg-amber-500 text-white shadow'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Từ Flashcard</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setScopeMode('custom')}
              className={`py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                scopeMode === 'custom'
                  ? 'bg-indigo-600 dark:bg-purple-600 text-white shadow'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Tự nhập bài
            </button>
          </div>

          {/* MODE 1: THEO TIẾN ĐỘ (BÀI 1 -> BÀI N) */}
          {scopeMode === 'upto' && hasLessons && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5">
                  Bạn đã học đến bài nào trong môn {game.subjectName}?
                </label>
                <select
                  value={uptoIndex}
                  onChange={(e) => setUptoIndex(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#181b2e] border border-slate-200 dark:border-white/15 text-slate-900 dark:text-white text-xs sm:text-sm font-semibold focus:outline-none focus:border-purple-400"
                >
                  {lessonNames.map((name, idx) => (
                    <option key={name} value={idx}>
                      Đến {name} (gồm {idx + 1} bài đầu)
                    </option>
                  ))}
                </select>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 space-y-2">
                <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-purple-400" />
                  <span>Các bài sẽ có trong trò chơi ({uptoIndex + 1} bài):</span>
                </div>
                <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
                  {lessonNames.slice(0, uptoIndex + 1).map((name) => (
                    <span
                      key={name}
                      className="px-2.5 py-1 rounded-lg bg-indigo-500/10 dark:bg-purple-500/20 border border-indigo-300/60 dark:border-purple-400/30 text-[11px] font-semibold text-indigo-700 dark:text-purple-200"
                    >
                      {name}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* MODE 2: CHỌN BÀI CỤ THỂ */}
          {scopeMode === 'pick' && hasLessons && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-700 dark:text-slate-200">
                  Tích chọn bài học muốn ôn ({pickedLessons.length}/{lessonNames.length})
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPickedLessons([...lessonNames])}
                    className="text-[11px] font-semibold text-indigo-600 dark:text-purple-300 hover:underline cursor-pointer"
                  >
                    Chọn tất cả
                  </button>
                  <button
                    type="button"
                    onClick={() => setPickedLessons([])}
                    className="text-[11px] font-semibold text-slate-400 hover:text-rose-400 cursor-pointer"
                  >
                    Bỏ chọn
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-52 overflow-y-auto pr-1">
                {lessonNames.map((name) => {
                  const active = pickedLessons.includes(name);
                  return (
                    <button
                      key={name}
                      type="button"
                      onClick={() => toggleLesson(name)}
                      className={`p-2.5 rounded-xl border text-left text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                        active
                          ? 'bg-indigo-600/15 dark:bg-purple-600/25 border-indigo-400 dark:border-purple-400 text-indigo-900 dark:text-white'
                          : 'bg-slate-50 dark:bg-white/[0.03] border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:border-purple-400/40'
                      }`}
                    >
                      <span
                        className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 ${
                          active
                            ? 'bg-indigo-600 dark:bg-purple-500 border-indigo-600 dark:border-purple-400 text-white'
                            : 'border-slate-300 dark:border-white/25'
                        }`}
                      >
                        {active && <Check className="w-3 h-3" />}
                      </span>
                      <span className="truncate">{name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* MODE 3: TỪ FLASHCARD (MÔN TIẾNG ANH) */}
          {scopeMode === 'flashcard' && hasFlashcards && (
            <div className="space-y-2.5">
              <div className="text-xs font-bold text-slate-700 dark:text-slate-200">
                Chọn bộ thẻ Flashcard để chơi ngay ({pickedDeckIds.length} bộ đã chọn)
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-52 overflow-y-auto pr-1">
                {flashcardDecks.map((deck) => {
                  const active = pickedDeckIds.includes(deck.id);
                  return (
                    <button
                      key={deck.id}
                      type="button"
                      onClick={() => toggleDeck(deck.id)}
                      className={`p-2.5 rounded-xl border text-left text-xs font-semibold flex items-center justify-between gap-2 transition-all cursor-pointer ${
                        active
                          ? 'bg-amber-500/15 border-amber-400 text-amber-900 dark:text-amber-100'
                          : 'bg-slate-50 dark:bg-white/[0.03] border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:border-amber-400/50'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 ${
                            active
                              ? 'bg-amber-500 border-amber-500 text-white'
                              : 'border-slate-300 dark:border-white/25'
                          }`}
                        >
                          {active && <Check className="w-3 h-3" />}
                        </span>
                        <span className="truncate">{deck.title}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 shrink-0">
                        {deck.cards?.length || 0} từ
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* MODE 4: TỰ NHẬP BÀI / CHỦ ĐỀ */}
          {scopeMode === 'custom' && (
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200">
                Nhập tên bài học hoặc chủ đề bạn muốn luyện
              </label>
              <input
                type="text"
                value={customTopic}
                onChange={(e) => setCustomTopic(e.target.value)}
                placeholder={`VD: ${
                  game.subjectId === 'sub-1'
                    ? 'Công thức lượng giác, Cấp số cộng'
                    : game.subjectId === 'sub-2'
                    ? 'Dao động điều hòa, Con lắc đơn'
                    : game.subjectId === 'sub-4'
                    ? 'Este - Lipit, Kim loại kiềm'
                    : 'Unit 1: A long and healthy life'
                }`}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.05] border border-slate-200 dark:border-white/15 text-slate-900 dark:text-white placeholder-slate-400 text-xs focus:outline-none focus:border-purple-400"
              />
            </div>
          )}

          {/* Tùy chọn làm mới câu hỏi bằng AI */}
          {scopeMode !== 'flashcard' && (
            <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 cursor-pointer select-none pt-1">
              <input
                type="checkbox"
                checked={forceRefreshAI}
                onChange={(e) => setForceRefreshAI(e.target.checked)}
                className="w-4 h-4 rounded accent-purple-600 cursor-pointer"
              />
              <RefreshCw className="w-3.5 h-3.5 text-purple-400" />
              <span>Tạo bộ câu hỏi hoàn toàn mới bằng AI (không dùng lại bộ đã lưu)</span>
            </label>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-slate-200 dark:border-white/10 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 shrink-0">
          <button
            type="button"
            disabled={isLoadingQuestions}
            onClick={() => handleLaunch(true)}
            className="px-3.5 py-2.5 rounded-xl glass-button text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white cursor-pointer"
          >
            Chơi nhanh (Tổng hợp)
          </button>

          <button
            type="button"
            disabled={isLoadingQuestions || !canStartScoped}
            onClick={() => handleLaunch(false)}
            className={`px-5 py-2.5 rounded-xl bg-gradient-to-r ${game.accent} text-white text-xs sm:text-sm font-bold shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer`}
          >
            {isLoadingQuestions ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Đang chuẩn bị câu hỏi...</span>
              </>
            ) : (
              <>
                {scopeMode === 'flashcard' ? (
                  <Play className="w-4 h-4" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
                <span>Bắt Đầu Chơi</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
