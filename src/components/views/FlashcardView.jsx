import React, { useState, useEffect, useCallback } from 'react';
import {
  Layers,
  RotateCw,
  Check,
  X,
  Sparkles,
  Trophy,
  Keyboard,
  Plus,
  BookOpen,
  Wand2,
  Trash2,
  Upload,
  Loader2,
  Save
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { getSessionUser } from '../../services/authService';
import {
  fetchTextbookDecks,
  saveTextbookDeck,
  deleteTextbookDeck,
  fetchUserFlashcardDecks,
  saveUserFlashcardDeck,
  deleteUserFlashcardDeck,
  generateFlashcardsFromDocument
} from '../../services/flashcardService';

const EMPTY_CARD = () => ({
  id: `card-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
  front: '',
  phonetic: '',
  hint: '',
  back: '',
  example: '',
});

export default function FlashcardView({ currentUser: propsUser }) {
  const sessionUser = getSessionUser();
  const currentUser = propsUser || sessionUser;
  const username = currentUser?.username || 'student';
  const isAdmin = currentUser?.role === 'admin';

  // Danh sách bộ thẻ: Sách giáo khoa (Admin cấp) & Bộ thẻ cá nhân (Người học tự tạo)
  const [textbookDecks, setTextbookDecks] = useState([]);
  const [personalDecks, setPersonalDecks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Bộ thẻ đang chọn học
  const [selectedDeckId, setSelectedDeckId] = useState(null);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [rememberedCount, setRememberedCount] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  // Modal tạo bộ thẻ (Dùng cho cả Người học tạo bộ cá nhân & Admin tạo bộ SGK)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createTarget, setCreateTarget] = useState('personal'); // 'personal' | 'textbook'
  const [createMethod, setCreateMethod] = useState('manual'); // 'manual' | 'ai'
  const [deckTitle, setDeckTitle] = useState('');
  const [deckUnit, setDeckUnit] = useState('');
  const [draftCards, setDraftCards] = useState([EMPTY_CARD()]);

  // AI Document import state
  const [docText, setDocText] = useState('');
  const [geminiApiKey, setGeminiApiKey] = useState('');
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [modalError, setModalError] = useState('');
  const [isSavingDeck, setIsSavingDeck] = useState(false);

  // Tải bộ thẻ Sách giáo khoa + Bộ thẻ cá nhân
  useEffect(() => {
    let isCancelled = false;

    async function loadDecks() {
      setIsLoading(true);
      try {
        const [tbDecks, myDecks] = await Promise.all([
          fetchTextbookDecks(),
          fetchUserFlashcardDecks(username),
        ]);

        if (!isCancelled) {
          setTextbookDecks(tbDecks);
          setPersonalDecks(myDecks);

          // Mặc định ưu tiên chọn bộ Sách giáo khoa đầu tiên khi người học mới vào
          if (tbDecks.length > 0) {
            setSelectedDeckId(tbDecks[0].id);
          } else if (myDecks.length > 0) {
            setSelectedDeckId(myDecks[0].id);
          } else {
            setSelectedDeckId(null);
          }
        }
      } catch (err) {
        console.error('Lỗi tải dữ liệu Flashcard:', err);
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    }

    loadDecks();
    return () => {
      isCancelled = true;
    };
  }, [username]);

  const allDecks = [...textbookDecks, ...personalDecks];
  const currentDeck = allDecks.find((d) => d.id === selectedDeckId) || null;
  const currentCards = currentDeck?.cards || [];
  const currentCard = currentCards[currentCardIndex] || null;

  const handleRestart = useCallback(() => {
    setCurrentCardIndex(0);
    setIsFlipped(false);
    setRememberedCount(0);
    setReviewCount(0);
    setIsFinished(false);
  }, []);

  const handleSelectDeck = (deckId) => {
    setSelectedDeckId(deckId);
    handleRestart();
  };

  const handleFlip = () => {
    if (!currentCard) return;
    setIsFlipped((prev) => !prev);
  };

  const handleNext = useCallback(
    (isKnown) => {
      if (!currentDeck || currentCards.length === 0) return;

      if (isKnown) {
        setRememberedCount((prev) => prev + 1);
      } else {
        setReviewCount((prev) => prev + 1);
      }

      setIsFlipped(false);

      if (currentCardIndex + 1 < currentCards.length) {
        setCurrentCardIndex((prev) => prev + 1);
      } else {
        setIsFinished(true);
        confetti({
          particleCount: 90,
          spread: 75,
          origin: { y: 0.6 },
        });
      }
    },
    [currentDeck, currentCards.length, currentCardIndex]
  );

  // Phím tắt Desktop (chỉ chạy khi không mở modal và không gõ trong input/textarea)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (isCreateModalOpen || isFinished || !currentCard) return;
      const tag = e.target?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea') return;

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
  }, [isCreateModalOpen, isFinished, currentCard, handleNext]);

  // Mở Modal Tạo Bộ Thẻ
  const openCreateModal = (target) => {
    setCreateTarget(target);
    setCreateMethod('manual');
    setDeckTitle('');
    setDeckUnit('');
    setDraftCards([EMPTY_CARD()]);
    setDocText('');
    setModalError('');
    setIsCreateModalOpen(true);
  };

  // Đọc file tài liệu text (.txt, .md, .csv)
  const handleDocumentFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setDocText(String(ev.target?.result || ''));
    };
    reader.readAsText(file, 'UTF-8');
  };

  // Gọi AI tạo thẻ từ tài liệu
  const handleGenerateWithAI = async () => {
    setModalError('');
    setIsGeneratingAI(true);
    try {
      const generated = await generateFlashcardsFromDocument(docText, geminiApiKey);
      setDraftCards(generated);
    } catch (err) {
      setModalError(err.message || 'Không thể tạo thẻ từ tài liệu.');
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const handleUpdateDraftCard = (index, field, value) => {
    setDraftCards((prev) =>
      prev.map((card, i) => (i === index ? { ...card, [field]: value } : card))
    );
  };

  const handleAddDraftCard = () => {
    setDraftCards((prev) => [...prev, EMPTY_CARD()]);
  };

  const handleRemoveDraftCard = (index) => {
    setDraftCards((prev) => prev.filter((_, i) => i !== index));
  };

  // Lưu bộ thẻ (Admin -> Sách giáo khoa | Học sinh -> Bộ thẻ cá nhân)
  const handleSaveNewDeck = async (e) => {
    e.preventDefault();
    setModalError('');

    if (!deckTitle.trim()) {
      setModalError('Vui lòng đặt tên cho bộ thẻ ghi nhớ.');
      return;
    }

    const validCards = draftCards.filter((c) => c.front.trim() && c.back.trim());
    if (validCards.length === 0) {
      setModalError('Vui lòng nhập ít nhất 1 thẻ có đầy đủ Từ vựng và Nghĩa.');
      return;
    }

    setIsSavingDeck(true);
    try {
      if (createTarget === 'textbook' && isAdmin) {
        const saved = await saveTextbookDeck({
          title: deckTitle,
          unit: deckUnit,
          cards: validCards,
          createdBy: username,
        });
        setTextbookDecks((prev) => [...prev.filter((d) => d.id !== saved.id), saved]);
        handleSelectDeck(saved.id);
      } else {
        const saved = await saveUserFlashcardDeck(username, {
          title: deckTitle,
          cards: validCards,
          creationMethod: createMethod,
        });
        setPersonalDecks((prev) => [saved, ...prev.filter((d) => d.id !== saved.id)]);
        handleSelectDeck(saved.id);
      }

      setIsCreateModalOpen(false);
    } catch (err) {
      setModalError(err.message || 'Không thể lưu bộ thẻ. Vui lòng thử lại.');
    } finally {
      setIsSavingDeck(false);
    }
  };

  const handleDeleteDeck = async (deck, e) => {
    e.stopPropagation();
    if (!window.confirm(`Bạn có chắc chắn muốn xóa bộ thẻ "${deck.title}"?`)) return;

    try {
      if (deck.sourceType === 'textbook' && isAdmin) {
        await deleteTextbookDeck(deck.id);
        const nextList = textbookDecks.filter((d) => d.id !== deck.id);
        setTextbookDecks(nextList);
        if (selectedDeckId === deck.id) {
          setSelectedDeckId(nextList[0]?.id || personalDecks[0]?.id || null);
          handleRestart();
        }
      } else if (deck.sourceType === 'personal') {
        await deleteUserFlashcardDeck(username, deck.id);
        const nextList = personalDecks.filter((d) => d.id !== deck.id);
        setPersonalDecks(nextList);
        if (selectedDeckId === deck.id) {
          setSelectedDeckId(textbookDecks[0]?.id || nextList[0]?.id || null);
          handleRestart();
        }
      }
    } catch (err) {
      alert(err.message || 'Không thể xóa bộ thẻ.');
    }
  };

  return (
    <div className="space-y-5 pb-10">
      {/* 1. Header & Actions (Gọn gàng trên 1 hàng) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold font-display tracking-tight text-white">
            Thẻ Ghi Nhớ Từ Vựng Tiếng Anh
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Học theo từng Unit Sách Giáo Khoa hoặc tự tạo bộ thẻ cá nhân
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-shrink-0">
          <button
            onClick={() => openCreateModal(isAdmin ? 'textbook' : 'personal')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-xs font-bold shadow-md shadow-purple-600/25 hover:scale-[1.02] transition-all cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tạo Bộ Thẻ Mới</span>
          </button>
        </div>
      </div>

      {/* 2. Main 4-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Column (1 col): Textbook Decks + Personal Decks */}
        <div className="space-y-5">
          {/* Sách Giáo Khoa (Admin cung cấp) */}
          <div className="space-y-2.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 px-1 font-display flex items-center justify-between">
              <span>Sách Giáo Khoa (Theo Unit)</span>
              <span className="text-[10px] text-purple-300 font-mono">{textbookDecks.length}</span>
            </h3>

            {isLoading ? (
              <div className="p-4 rounded-2xl glass-card border border-white/10 text-center text-xs text-slate-400">
                <Loader2 className="w-4 h-4 animate-spin mx-auto mb-1 text-purple-400" />
                Đang tải...
              </div>
            ) : textbookDecks.length === 0 ? (
              <div className="p-4 rounded-2xl glass-card border border-dashed border-white/10 text-xs text-slate-400 text-center">
                Chưa có bộ thẻ sách giáo khoa nào.
              </div>
            ) : (
              <div className="space-y-2.5">
                {textbookDecks.map((deck) => {
                  const isSelected = selectedDeckId === deck.id;
                  return (
                    <div
                      key={deck.id}
                      onClick={() => handleSelectDeck(deck.id)}
                      className={`p-4 rounded-2xl glass-card border cursor-pointer transition-all group ${
                        isSelected
                          ? 'border-purple-400/60 bg-purple-500/15 shadow-lg shadow-purple-500/20 translate-x-1'
                          : 'border-white/10 hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300">
                          {deck.unit || 'Sách Giáo Khoa'}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[11px] text-slate-400">
                            {deck.cards?.length || 0} từ
                          </span>
                          {isAdmin && (
                            <button
                              type="button"
                              onClick={(e) => handleDeleteDeck(deck, e)}
                              className="p-1 rounded-lg text-rose-400 hover:bg-rose-500/20 opacity-0 group-hover:opacity-100 transition-opacity"
                              title="Xóa bộ thẻ SGK"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                      <h4 className="text-sm font-bold text-white mt-1.5 line-clamp-2 font-display">
                        {deck.title}
                      </h4>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Bộ Thẻ Cá Nhân (Người học tự tạo) */}
          {personalDecks.length > 0 && (
            <div className="space-y-2.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 px-1 font-display flex items-center justify-between">
                <span>Bộ Thẻ Tự Tạo</span>
                <span className="text-[10px] text-cyan-300 font-mono">{personalDecks.length}</span>
              </h3>

              <div className="space-y-2.5">
                {personalDecks.map((deck) => {
                  const isSelected = selectedDeckId === deck.id;
                  return (
                    <div
                      key={deck.id}
                      onClick={() => handleSelectDeck(deck.id)}
                      className={`p-4 rounded-2xl glass-card border cursor-pointer transition-all group ${
                        isSelected
                          ? 'border-purple-400/60 bg-purple-500/15 shadow-lg shadow-purple-500/20 translate-x-1'
                          : 'border-white/10 hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-300">
                          {deck.creationMethod === 'ai' ? 'Tạo bởi AI' : 'Tự nhập'}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[11px] text-slate-400">
                            {deck.cards?.length || 0} từ
                          </span>
                          <button
                            type="button"
                            onClick={(e) => handleDeleteDeck(deck, e)}
                            className="p-1 rounded-lg text-rose-400 hover:bg-rose-500/20 opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Xóa bộ thẻ cá nhân"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      <h4 className="text-sm font-bold text-white mt-1.5 line-clamp-2 font-display">
                        {deck.title}
                      </h4>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Center Stage (2 cols): 3D Flashcard */}
        <div className="lg:col-span-2 space-y-5">
          {!currentDeck || currentCards.length === 0 ? (
            <div className="rounded-3xl glass-card p-10 text-center border border-white/10 space-y-4">
              <Layers className="w-12 h-12 text-purple-400 mx-auto opacity-70" />
              <h2 className="text-lg sm:text-xl font-bold font-display text-white">
                Chưa có thẻ từ vựng nào để ôn tập
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto">
                Hãy chọn một bộ từ vựng Sách Giáo Khoa do quản trị viên cung cấp hoặc tự tạo bộ thẻ mới bằng cách nhập thủ công / dùng AI.
              </p>
              <button
                onClick={() => openCreateModal('personal')}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-xs font-bold shadow-lg shadow-purple-600/30 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Tạo Bộ Thẻ Mới</span>
              </button>
            </div>
          ) : !isFinished && currentCard ? (
            <>
              {/* Card Index & Progress */}
              <div className="flex items-center justify-between text-xs text-slate-400 px-1">
                <span>
                  Thẻ số <strong className="text-purple-300 font-bold text-sm">{currentCardIndex + 1}</strong> / {currentCards.length}
                </span>
                <div className="flex items-center gap-3">
                  <span className="text-emerald-400 font-semibold">✓ Đã thuộc: {rememberedCount}</span>
                  <span className="text-rose-400 font-semibold">✗ Cần ôn lại: {reviewCount}</span>
                </div>
              </div>

              <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-purple-500 via-indigo-400 to-cyan-400 transition-all duration-300"
                  style={{
                    width: `${((currentCardIndex + 1) / currentCards.length) * 100}%`,
                  }}
                />
              </div>

              {/* 3D Flip Card - Co giãn linh hoạt theo nội dung, không dùng glass-card để tránh :hover ghi đè rotate-y-180 */}
              <div
                className="perspective-1000 w-full cursor-pointer select-none"
                onClick={handleFlip}
              >
                <div
                  className={`grid w-full duration-500 transform-style-3d transition-transform ${
                    isFlipped ? 'rotate-y-180' : ''
                  }`}
                >
                  {/* FRONT FACE */}
                  <div className="col-start-1 row-start-1 w-full backface-hidden rounded-3xl p-6 sm:p-7 flex flex-col justify-between gap-5 border border-purple-500/40 shadow-2xl bg-gradient-to-b from-[#141628] via-[#0d0f1b] to-[#07080f]">
                    <div className="flex items-center justify-between gap-2">
                      <span className="px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-purple-500/20 text-purple-200 border border-purple-400/30">
                        {currentDeck.unit || 'Tiếng Anh'}
                      </span>
                      <div className="flex items-center gap-1.5 text-slate-400 text-xs">
                        <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                        <span>Từ vựng Tiếng Anh</span>
                      </div>
                    </div>

                    <div className="text-center py-4 px-4">
                      <div className="text-2xl sm:text-3xl font-extrabold font-display tracking-tight text-white shimmer-text break-words">
                        {currentCard.front}
                      </div>
                      {currentCard.phonetic && (
                        <div className="mt-2 text-sm text-purple-300 font-mono">
                          {currentCard.phonetic}
                        </div>
                      )}
                      {currentCard.hint && (
                        <div className="mt-4 p-3 rounded-2xl bg-white/[0.04] border border-white/10 text-xs text-slate-300 max-w-lg mx-auto">
                          💡 <strong>Gợi ý:</strong> {currentCard.hint}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-center gap-2 text-xs text-slate-400 pt-3 border-t border-white/10">
                      <RotateCw className="w-3.5 h-3.5 text-purple-400" />
                      <span>Nhấp vào thẻ để lật xem nghĩa</span>
                    </div>
                  </div>

                  {/* BACK FACE */}
                  <div className="col-start-1 row-start-1 w-full backface-hidden rotate-y-180 rounded-3xl p-6 sm:p-7 flex flex-col justify-between gap-5 border border-emerald-500/40 shadow-2xl bg-gradient-to-b from-[#0f211f] via-[#0a1717] to-[#07080f]">
                    <div className="flex items-center justify-between gap-2">
                      <span className="px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-200 border border-emerald-400/30">
                        Nghĩa & Ví Dụ
                      </span>
                      <span className="text-xs text-emerald-400 font-semibold">✓ Mặt sau</span>
                    </div>

                    <div className="py-4 space-y-3 px-4 text-center">
                      <div className="text-xl sm:text-2xl font-bold font-display text-white whitespace-pre-line leading-relaxed break-words">
                        {currentCard.back}
                      </div>
                      {currentCard.example && (
                        <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/10 text-xs sm:text-sm text-slate-200 leading-relaxed text-left">
                          <strong className="text-emerald-300">Ví dụ:</strong> "{currentCard.example}"
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-center gap-2 text-xs text-slate-400 pt-3 border-t border-white/10">
                      <RotateCw className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Nhấp vào thẻ để lật lại mặt trước</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons (Chỉ nhấp trực tiếp vào thẻ để lật) */}
              <div className="flex items-center justify-center gap-4 pt-2">
                <button
                  onClick={() => handleNext(false)}
                  className="flex-1 max-w-[220px] py-3.5 px-6 rounded-2xl glass-card border-rose-500/30 hover:border-rose-500/60 bg-rose-500/10 text-rose-200 hover:text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-lg hover:scale-[1.02] transition-all cursor-pointer"
                >
                  <X className="w-4 h-4 text-rose-400" />
                  <span>Cần Ôn Lại [←]</span>
                </button>

                <button
                  onClick={() => handleNext(true)}
                  className="flex-1 max-w-[220px] py-3.5 px-6 rounded-2xl glass-card border-emerald-500/30 hover:border-emerald-500/60 bg-emerald-500/10 text-emerald-200 hover:text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-lg hover:scale-[1.02] transition-all cursor-pointer"
                >
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>Đã Thuộc [→]</span>
                </button>
              </div>

              {/* Chỉ dẫn thao tác rõ ràng */}
              <div className="hidden lg:flex items-center justify-center gap-3 text-xs text-slate-400">
                <Keyboard className="w-3.5 h-3.5 text-purple-400" />
                <span>
                  <kbd className="px-1.5 py-0.5 rounded bg-white/[0.08] border border-white/10 font-mono text-[11px] text-white">Space</kbd>{' '}
                  Lật thẻ
                </span>
                <span>•</span>
                <span>
                  <kbd className="px-1.5 py-0.5 rounded bg-white/[0.08] border border-white/10 font-mono text-[11px] text-white">←</kbd>{' '}
                  Cần ôn lại
                </span>
                <span>•</span>
                <span>
                  <kbd className="px-1.5 py-0.5 rounded bg-white/[0.08] border border-white/10 font-mono text-[11px] text-white">→</kbd>{' '}
                  Đã thuộc
                </span>
              </div>
            </>
          ) : (
            <div className="rounded-3xl glass-card p-10 text-center border border-purple-500/40 shadow-2xl relative overflow-hidden">
              <Trophy className="w-16 h-16 text-amber-400 mx-auto mb-4 animate-bounce" />
              <h2 className="text-2xl sm:text-3xl font-extrabold font-display text-white">Hoàn Thành Bộ Thẻ!</h2>
              <p className="text-xs sm:text-sm text-slate-300 mt-2 mb-6">
                Bạn đã ôn xong toàn bộ từ vựng trong "{currentDeck.title}"
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
                className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold text-sm shadow-xl shadow-purple-600/30 hover:scale-[1.02] transition-all cursor-pointer"
              >
                Học Lại Bộ Này
              </button>
            </div>
          )}
        </div>

        {/* Right Column (1 col): Card List */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 px-1 font-display">
            Danh Sách Từ Trong Bộ
          </h3>

          <div className="space-y-2 max-h-[500px] overflow-y-auto scrollbar-none pr-1">
            {currentCards.length === 0 ? (
              <div className="p-4 rounded-xl border border-dashed border-white/10 text-xs text-slate-500 text-center">
                Chưa có thẻ nào
              </div>
            ) : (
              currentCards.map((c, i) => {
                const isCurrent = currentCardIndex === i;

                return (
                  <div
                    key={c.id || i}
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
              })
            )}
          </div>
        </div>
      </div>

      {/* 3. MODAL TẠO BỘ THẺ (NHẬP THỦ CÔNG HOẶC AI TẠO TỪ TÀI LIỆU) */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
          <div className="w-full max-w-3xl max-h-[90vh] flex flex-col rounded-3xl glass-card border border-white/20 shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
              <div>
                <h3 className="text-lg font-bold font-display text-white">
                  {createTarget === 'textbook'
                    ? 'Thêm Bộ Thẻ Sách Giáo Khoa (Admin)'
                    : 'Tạo Bộ Thẻ Ghi Nhớ Cá Nhân'}
                </h3>
                <p className="text-xs text-slate-400">
                  Tự đặt tên bộ thẻ và tạo từ vựng bằng cách nhập thủ công hoặc đưa tài liệu cho AI tạo
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="p-2 rounded-xl glass-button text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveNewDeck} className="flex-1 overflow-y-auto p-6 space-y-5">
              {modalError && (
                <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs font-semibold">
                  {modalError}
                </div>
              )}

              {/* Dành cho Admin: chọn lưu vào Sách Giáo Khoa (Unit) hoặc Bộ Thẻ Cá Nhân */}
              {isAdmin && (
                <div className="flex items-center gap-2 p-1 rounded-xl bg-white/[0.04] border border-white/10">
                  <button
                    type="button"
                    onClick={() => setCreateTarget('textbook')}
                    className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      createTarget === 'textbook'
                        ? 'bg-amber-500/25 text-amber-200 border border-amber-400/40'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>Sách Giáo Khoa (Theo Unit)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setCreateTarget('personal')}
                    className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      createTarget === 'personal'
                        ? 'bg-purple-600/35 text-white border border-purple-400/40'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>Bộ Thẻ Cá Nhân</span>
                  </button>
                </div>
              )}

              {/* Tên bộ thẻ & Unit (nếu là SGK) */}
              <div className={`grid gap-3 ${createTarget === 'textbook' ? 'grid-cols-1 sm:grid-cols-3' : 'grid-cols-1'}`}>
                <div className={createTarget === 'textbook' ? 'sm:col-span-2' : ''}>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Tên bộ thẻ *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={
                      createTarget === 'textbook'
                        ? 'VD: Tiếng Anh 12 - Unit 1: Life Stories'
                        : 'Đặt tên bộ thẻ của bạn...'
                    }
                    value={deckTitle}
                    onChange={(e) => setDeckTitle(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.05] border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-purple-400"
                  />
                </div>

                {createTarget === 'textbook' && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Unit / Sách *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="VD: Unit 1"
                      value={deckUnit}
                      onChange={(e) => setDeckUnit(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.05] border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-purple-400"
                    />
                  </div>
                )}
              </div>

              {/* Chuyển đổi phương pháp: Nhập thủ công | Đưa tài liệu cho AI tạo */}
              <div className="flex items-center gap-2 p-1 rounded-xl bg-white/[0.04] border border-white/10">
                <button
                  type="button"
                  onClick={() => setCreateMethod('manual')}
                  className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    createMethod === 'manual'
                      ? 'bg-purple-600/35 text-white border border-purple-400/40'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Nhập Thủ Công</span>
                </button>

                <button
                  type="button"
                  onClick={() => setCreateMethod('ai')}
                  className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    createMethod === 'ai'
                      ? 'bg-purple-600/35 text-white border border-purple-400/40'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Wand2 className="w-3.5 h-3.5" />
                  <span>Đưa Tài Liệu Cho AI Tạo</span>
                </button>
              </div>

              {/* Khu vực AI tạo từ tài liệu */}
              {createMethod === 'ai' && (
                <div className="p-4 rounded-2xl bg-white/[0.03] border border-purple-500/30 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <span className="text-xs font-bold text-purple-300 flex items-center gap-1.5">
                      <Wand2 className="w-3.5 h-3.5" />
                      Dán nội dung tài liệu hoặc tải tệp văn bản (.txt, .md, .csv)
                    </span>
                    <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl glass-button text-xs font-semibold text-purple-200 cursor-pointer">
                      <Upload className="w-3.5 h-3.5" />
                      <span>Chọn Tệp Tài Liệu</span>
                      <input
                        type="file"
                        accept=".txt,.md,.csv"
                        onChange={handleDocumentFileUpload}
                        className="hidden"
                      />
                    </label>
                  </div>

                  <textarea
                    rows={5}
                    value={docText}
                    onChange={(e) => setDocText(e.target.value)}
                    placeholder="Dán đoạn văn Tiếng Anh hoặc danh sách từ vựng từ tài liệu của bạn vào đây..."
                    className="w-full p-3 rounded-xl bg-white/[0.04] border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-purple-400"
                  />

                  {!import.meta.env.VITE_GEMINI_API_KEY && (
                    <input
                      type="password"
                      value={geminiApiKey}
                      onChange={(e) => setGeminiApiKey(e.target.value)}
                      placeholder="Gemini API Key (tùy chọn - để AI tự trích xuất từ đoạn văn bất kỳ)"
                      className="w-full px-3.5 py-2 rounded-xl bg-white/[0.04] border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-purple-400"
                    />
                  )}

                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={handleGenerateWithAI}
                      disabled={isGeneratingAI || !docText.trim()}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs font-bold flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                    >
                      {isGeneratingAI ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>AI đang tạo thẻ...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Tạo Danh Sách Thẻ</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Danh sách thẻ soạn thảo / xem trước */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-300">
                    Danh sách thẻ ({draftCards.length} thẻ)
                  </span>
                  <button
                    type="button"
                    onClick={handleAddDraftCard}
                    className="px-3 py-1.5 rounded-xl glass-button text-xs font-semibold text-purple-300 hover:text-white flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Thêm Thẻ</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {draftCards.map((card, idx) => (
                    <div
                      key={card.id || idx}
                      className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-2.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-purple-300">Thẻ #{idx + 1}</span>
                        {draftCards.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveDraftCard(idx)}
                            className="text-rose-400 hover:text-rose-300 p-1 cursor-pointer"
                            title="Xóa thẻ này"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <input
                          type="text"
                          placeholder="Từ vựng Tiếng Anh *"
                          value={card.front}
                          onChange={(e) => handleUpdateDraftCard(idx, 'front', e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-white/[0.04] border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-purple-400"
                        />
                        <input
                          type="text"
                          placeholder="Nghĩa tiếng Việt *"
                          value={card.back}
                          onChange={(e) => handleUpdateDraftCard(idx, 'back', e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-white/[0.04] border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-purple-400"
                        />
                        <input
                          type="text"
                          placeholder="Phiên âm IPA (tùy chọn)"
                          value={card.phonetic}
                          onChange={(e) => handleUpdateDraftCard(idx, 'phonetic', e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-white/[0.04] border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-purple-400"
                        />
                        <input
                          type="text"
                          placeholder="Ví dụ minh họa (tùy chọn)"
                          value={card.example}
                          onChange={(e) => handleUpdateDraftCard(idx, 'example', e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-white/[0.04] border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-purple-400"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Footer Modal */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl glass-button text-xs font-semibold text-slate-300 hover:text-white cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSavingDeck}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-xs font-bold shadow-lg shadow-emerald-600/30 flex items-center gap-1.5 disabled:opacity-60 cursor-pointer"
                >
                  {isSavingDeck ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Đang lưu...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5" />
                      <span>Lưu Bộ Thẻ</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
