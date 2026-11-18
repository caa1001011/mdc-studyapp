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
  Save,
  Image as ImageIcon,
  PanelLeftClose,
  PanelLeftOpen,
  ArrowLeft,
  Folder
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { getSessionUser } from '../../services/authService';
import {
  uploadFileToGoogleDrive,
  fetchAppsScriptUrl,
  getSavedAppsScriptUrl,
  saveAppsScriptUrl
} from '../../services/googleDriveService';
import {
  fetchTextbookDecks,
  saveTextbookDeck,
  deleteTextbookDeck,
  fetchFlashcardBooks,
  saveFlashcardBook,
  deleteFlashcardBook,
  fetchUserFlashcardDecks,
  saveUserFlashcardDeck,
  deleteUserFlashcardDeck,
  compressCoverImage,
  generateFlashcardsFromDocument
} from '../../services/flashcardService';

const EMPTY_CARD = () => ({
  id: `card-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
  front: '',
  partOfSpeech: '',
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

  // Danh sách bộ thẻ & đầu sách: Global Success, Mở rộng, và Bộ thẻ cá nhân
  const [textbookDecks, setTextbookDecks] = useState([]);
  const [flashcardBooks, setFlashcardBooks] = useState([]);
  const [personalDecks, setPersonalDecks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Thư mục sách đang chọn (null = trang tổng quan; object = xem các Unit/bộ thẻ trong sách)
  const [selectedBookFolder, setSelectedBookFolder] = useState(null);

  // Modal tạo thư mục sách (Admin)
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [addingBookCategory, setAddingBookCategory] = useState('global_success'); // 'global_success' | 'extended'
  const [newBookName, setNewBookName] = useState('');
  const [newBookGrade, setNewBookGrade] = useState('');
  const [newBookCoverFile, setNewBookCoverFile] = useState(null);
  const [bookUploadProgress, setBookUploadProgress] = useState(0);
  const [bookModalError, setBookModalError] = useState('');
  const [isSavingBook, setIsSavingBook] = useState(false);
  const [appsScriptUrl, setAppsScriptUrl] = useState(() => getSavedAppsScriptUrl());
  const [showScriptConfig, setShowScriptConfig] = useState(() => !getSavedAppsScriptUrl());

  // Bộ thẻ đang chọn học (null = trang danh sách 3 phần)
  const [selectedDeckId, setSelectedDeckId] = useState(null);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [rememberedCount, setRememberedCount] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  // Modal tạo bộ thẻ (Admin tạo trong sách Global Success / Mở rộng, Học sinh tạo Bộ thẻ cá nhân)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createTarget, setCreateTarget] = useState('personal'); // 'personal' | 'textbook'
  const [bookCategory, setBookCategory] = useState('global_success'); // 'global_success' | 'extended'
  const [createMethod, setCreateMethod] = useState('manual'); // 'manual' | 'ai'
  const [deckTitle, setDeckTitle] = useState('');
  const [bookName, setBookName] = useState('');
  const [grade, setGrade] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [isProcessingCover, setIsProcessingCover] = useState(false);
  const [draftCards, setDraftCards] = useState([EMPTY_CARD()]);

  // AI Document import state
  const [docText, setDocText] = useState('');
  const [docFile, setDocFile] = useState(null);
  const [geminiApiKey, setGeminiApiKey] = useState('');
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [aiPreviewReady, setAiPreviewReady] = useState(false);
  const [modalError, setModalError] = useState('');
  const [isSavingDeck, setIsSavingDeck] = useState(false);
  const [isDecksCollapsed, setIsDecksCollapsed] = useState(() => {
    return localStorage.getItem('lumina_flashcard_decks_collapsed') === 'true';
  });

  const toggleDecksCollapsed = () => {
    setIsDecksCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('lumina_flashcard_decks_collapsed', String(next));
      return next;
    });
  };

  // Tải bộ thẻ Sách giáo khoa + Bộ thẻ cá nhân
  useEffect(() => {
    let isCancelled = false;

    async function loadDecks() {
      setIsLoading(true);
      try {
        const [tbDecks, books, myDecks, savedScriptUrl] = await Promise.all([
          fetchTextbookDecks(),
          fetchFlashcardBooks(),
          fetchUserFlashcardDecks(username),
          fetchAppsScriptUrl(),
        ]);

        if (!isCancelled) {
          setTextbookDecks(tbDecks);
          setFlashcardBooks(books);
          setPersonalDecks(myDecks);
          setSelectedDeckId(null);
          if (savedScriptUrl) {
            setAppsScriptUrl(savedScriptUrl);
            setShowScriptConfig(false);
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
  const openCreateModal = (target, options = {}) => {
    setCreateTarget(target);
    setBookCategory(options.category || 'global_success');
    setCreateMethod('manual');
    setDeckTitle('');
    setBookName(options.bookName || '');
    setGrade(options.grade || '');
    setCoverImage('');
    setDraftCards([EMPTY_CARD()]);
    setDocText('');
    setDocFile(null);
    setAiPreviewReady(false);
    setModalError('');
    setIsCreateModalOpen(true);
  };

  // Admin: Mở modal tạo thư mục sách
  const openCreateBookModal = (category) => {
    setAddingBookCategory(category);
    setNewBookName('');
    setNewBookGrade('');
    setNewBookCoverFile(null);
    setBookUploadProgress(0);
    setBookModalError('');
    setIsBookModalOpen(true);
  };

  // Admin: Tạo thư mục sách mới (tùy chọn tải ảnh/PDF bìa lên Google Drive)
  const handleAddBook = async (e) => {
    e.preventDefault();
    if (!isAdmin || !newBookName.trim() || isSavingBook) return;
    setBookModalError('');
    setIsSavingBook(true);
    setBookUploadProgress(0);

    try {
      let coverDriveFileId = '';
      let coverUrl = '';
      let coverEmbedUrl = '';

      if (newBookCoverFile) {
        const driveRes = await uploadFileToGoogleDrive({
          file: newBookCoverFile,
          title: newBookName.trim(),
          subject: 'Tiếng Anh',
          folderName: `Flashcard - ${newBookName.trim()}`,
          appsScriptUrl,
          onProgress: (pct) => setBookUploadProgress(pct),
        });
        coverDriveFileId = driveRes.driveFileId || '';
        coverEmbedUrl = driveRes.embedUrl || '';
        if (coverDriveFileId) {
          coverUrl = `https://drive.google.com/thumbnail?id=${coverDriveFileId}&sz=w600`;
        }
      }

      const saved = await saveFlashcardBook({
        name: newBookName,
        category: addingBookCategory,
        grade: newBookGrade,
        coverDriveFileId,
        coverUrl,
        coverEmbedUrl,
        createdBy: username,
      });
      setFlashcardBooks((prev) => [...prev, saved]);
      setIsBookModalOpen(false);
    } catch (err) {
      setBookModalError(err.message || 'Không thể tạo thư mục sách.');
    } finally {
      setIsSavingBook(false);
    }
  };

  const handleDeleteBook = async (book, deckCount, e) => {
    if (e) e.stopPropagation();
    if (!isAdmin || deckCount > 0) return;
    if (!window.confirm(`Xóa thư mục sách "${book.name}"?`)) return;
    await deleteFlashcardBook(book.id);
    setFlashcardBooks((prev) => prev.filter((b) => b.id !== book.id));
    if (selectedBookFolder?.id === book.id) {
      setSelectedBookFolder(null);
    }
  };

  // Tải & nén ảnh bìa sách (dành cho Admin)
  const handleCoverImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setModalError('');
    setIsProcessingCover(true);
    try {
      const compressed = await compressCoverImage(file);
      setCoverImage(compressed);
    } catch (err) {
      setModalError(err.message || 'Không thể xử lý ảnh bìa.');
    } finally {
      setIsProcessingCover(false);
      e.target.value = '';
    }
  };

  // Đọc file tài liệu (.pdf, .doc, .docx, .txt, .md, .csv, .rtf)
  const handleDocumentFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setModalError('');

    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    const isPlainText = ['txt', 'md', 'csv', 'rtf'].includes(ext) || file.type.startsWith('text/');

    const reader = new FileReader();
    if (isPlainText) {
      reader.onload = (ev) => {
        setDocText(String(ev.target?.result || ''));
        setDocFile(null);
      };
      reader.readAsText(file, 'UTF-8');
    } else {
      reader.onload = (ev) => {
        const dataUrl = String(ev.target?.result || '');
        const base64 = dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl;
        const mimeMap = {
          pdf: 'application/pdf',
          doc: 'application/msword',
          docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        };
        setDocFile({
          name: file.name,
          mimeType: file.type || mimeMap[ext] || 'application/octet-stream',
          base64,
        });
      };
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  };

  // Gọi AI tạo thẻ từ tài liệu
  const handleGenerateWithAI = async () => {
    setModalError('');
    setIsGeneratingAI(true);
    try {
      const generated = await generateFlashcardsFromDocument(
        { text: docText, fileData: docFile },
        geminiApiKey
      );
      setDraftCards(generated);
      setAiPreviewReady(true);
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
          bookName,
          category: bookCategory,
          grade,
          coverImage,
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

  const getCategoryBooks = (category) => {
    const categoryDecks = textbookDecks.filter(
      (d) => (d.category || 'global_success') === category
    );
    const bookMap = new Map();

    flashcardBooks
      .filter((b) => (b.category || 'global_success') === category)
      .forEach((b) => {
        const key = b.name.trim().toLowerCase();
        if (!bookMap.has(key)) {
          bookMap.set(key, { ...b, decks: [] });
        }
      });

    categoryDecks.forEach((deck) => {
      const name = (deck.bookName || (category === 'global_success' ? 'Global Success' : 'Tài liệu mở rộng')).trim();
      const key = name.toLowerCase();
      if (!bookMap.has(key)) {
        bookMap.set(key, { id: `auto-${category}-${key}`, name, category, decks: [] });
      }
      bookMap.get(key).decks.push(deck);
    });

    return Array.from(bookMap.values());
  };

  const globalSuccessBooks = getCategoryBooks('global_success');
  const extendedBooks = getCategoryBooks('extended');

  const activeBookFolder = selectedBookFolder
    ? [...globalSuccessBooks, ...extendedBooks].find(
        (b) =>
          b.id === selectedBookFolder.id ||
          (b.category === selectedBookFolder.category &&
            b.name.toLowerCase() === selectedBookFolder.name.toLowerCase())
      ) || selectedBookFolder
    : null;

  const renderLibrarySection = ({
    title,
    subtitle,
    icon: SectionIcon,
    accentClass,
    category,
    books,
    emptyBookHint,
  }) => (
    <section className="space-y-3.5">
      <div className="flex items-center gap-2.5 min-w-0">
        <div className={`p-2 rounded-xl border shrink-0 ${accentClass}`}>
          <SectionIcon className="w-4 h-4" />
        </div>
        <div className="min-w-0">
          <h2 className="text-base sm:text-lg font-extrabold font-display text-white truncate">
            {title}
          </h2>
          <p className="text-xs text-slate-400 truncate">{subtitle}</p>
        </div>
      </div>

      {isLoading ? (
        <div className="p-6 rounded-2xl glass-card border border-white/10 text-center text-xs text-slate-400">
          <Loader2 className="w-5 h-5 animate-spin mx-auto mb-1.5 text-purple-400" />
          Đang tải danh sách thư mục sách...
        </div>
      ) : !isAdmin && books.length === 0 ? (
        <div className="p-5 rounded-2xl border border-dashed border-white/10 text-center text-xs text-slate-400">
          {emptyBookHint}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
          {books.map((book) => {
            const coverSrc =
              book.coverUrl ||
              (book.coverDriveFileId
                ? `https://drive.google.com/thumbnail?id=${book.coverDriveFileId}&sz=w600`
                : '');
            const fallbackCoverSrc = book.coverDriveFileId
              ? `https://lh3.googleusercontent.com/d/${book.coverDriveFileId}=w600`
              : '';

            return (
              <div
                key={book.id}
                onClick={() => setSelectedBookFolder(book)}
                className="aspect-square rounded-2xl glass-card border border-white/10 hover:border-purple-400/60 cursor-pointer transition-all relative overflow-hidden group flex flex-col justify-between"
              >
                {coverSrc ? (
                  <>
                    <img
                      src={coverSrc}
                      alt={book.name}
                      onError={(e) => {
                        if (fallbackCoverSrc && e.currentTarget.src !== fallbackCoverSrc) {
                          e.currentTarget.src = fallbackCoverSrc;
                        } else {
                          e.currentTarget.style.display = 'none';
                        }
                      }}
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/15" />
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center pt-4">
                    <span className="w-12 h-12 rounded-2xl bg-purple-500/15 border border-purple-400/25 text-purple-300 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Folder className="w-6 h-6" />
                    </span>
                  </div>
                )}

                {isAdmin && book.decks.length === 0 && !String(book.id).startsWith('auto-') && (
                  <button
                    type="button"
                    onClick={(e) => handleDeleteBook(book, book.decks.length, e)}
                    className="absolute top-2 right-2 z-10 p-1.5 rounded-lg bg-black/50 text-rose-300 hover:bg-rose-500 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                    title="Xóa thư mục sách trống"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}

                <div className="relative z-10 p-3 mt-auto">
                  <h3
                    className={`text-xs sm:text-sm font-bold line-clamp-2 font-display ${
                      coverSrc ? 'text-white drop-shadow' : 'text-white group-hover:text-purple-300 transition-colors'
                    }`}
                  >
                    {book.name}
                  </h3>
                  <div
                    className={`flex items-center justify-between text-[11px] mt-1 ${
                      coverSrc ? 'text-slate-200' : 'text-slate-400'
                    }`}
                  >
                    <span className="truncate">{book.grade || `${book.decks.length} bộ thẻ`}</span>
                    {book.grade && <span className="shrink-0">{book.decks.length} bộ</span>}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Admin: Ô vuông dấu + tạo thư mục sách (tự động dịch chuyển sang phải sau mỗi thư mục vừa tạo) */}
          {isAdmin && (
            <button
              type="button"
              onClick={() => openCreateBookModal(category)}
              className="aspect-square rounded-2xl border-2 border-dashed border-purple-400/40 hover:border-purple-400 bg-purple-500/[0.04] hover:bg-purple-500/10 flex flex-col items-center justify-center gap-2 p-3 transition-all cursor-pointer group"
              title="Tạo thư mục sách mới"
            >
              <span className="w-11 h-11 rounded-2xl bg-purple-500/20 border border-purple-400/30 text-purple-300 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Plus className="w-6 h-6" />
              </span>
              <span className="text-xs font-bold text-purple-300 text-center">
                Tạo thư mục
              </span>
            </button>
          )}
        </div>
      )}
    </section>
  );

  return (
    <div className="space-y-5 pb-10">
      {/* 1. Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-3 min-w-0">
          {currentDeck ? (
            <button
              type="button"
              onClick={() => {
                setSelectedDeckId(null);
                handleRestart();
              }}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl glass-button text-xs font-semibold text-slate-200 hover:text-white cursor-pointer shrink-0"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Quay lại</span>
            </button>
          ) : activeBookFolder ? (
            <button
              type="button"
              onClick={() => setSelectedBookFolder(null)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl glass-button text-xs font-semibold text-slate-200 hover:text-white cursor-pointer shrink-0"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Quay lại</span>
            </button>
          ) : null}

          <div className="min-w-0">
            <h1 className="text-lg sm:text-xl font-extrabold font-display tracking-tight text-white truncate">
              {currentDeck
                ? currentDeck.title
                : activeBookFolder
                ? activeBookFolder.name
                : 'Thẻ Ghi Nhớ Từ Vựng Tiếng Anh'}
            </h1>
            <p className="text-xs text-slate-400 mt-0.5 truncate">
              {currentDeck
                ? [currentDeck.bookName || currentDeck.unit, currentDeck.grade, `${currentCards.length} thẻ`]
                    .filter(Boolean)
                    .join(' • ')
                : activeBookFolder
                ? [
                    activeBookFolder.category === 'extended'
                      ? 'Mở rộng'
                      : 'Bộ sách giáo khoa Global Success',
                    activeBookFolder.grade,
                    `${activeBookFolder.decks.length} bộ thẻ`,
                  ]
                    .filter(Boolean)
                    .join(' • ')
                : isAdmin
                ? 'Quản lý thư mục sách Global Success và Mở rộng'
                : 'Bộ sách giáo khoa Global Success, tài liệu mở rộng và bộ thẻ cá nhân'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
          {currentDeck && isDecksCollapsed && (
            <button
              type="button"
              onClick={toggleDecksCollapsed}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl glass-card border border-white/10 hover:border-purple-400/50 transition-all cursor-pointer group"
              title="Mở rộng danh sách bộ thẻ"
            >
              <PanelLeftOpen className="w-3.5 h-3.5 text-purple-300 group-hover:scale-105 transition-transform" />
              <span className="text-xs font-bold text-slate-200 font-display">
                Bộ thẻ
              </span>
              <span className="text-[11px] font-bold px-1.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-mono leading-none">
                {textbookDecks.length + personalDecks.length}
              </span>
            </button>
          )}
          {!isAdmin && (
            <button
              type="button"
              onClick={() => openCreateModal('personal')}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-xs font-bold shadow-md shadow-purple-600/25 hover:scale-[1.02] transition-all cursor-pointer whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tạo Bộ Thẻ Mới</span>
            </button>
          )}
        </div>
      </div>

      {/* 2A. TRANG TỔNG QUAN (KHI CHƯA CHỌN THƯ MỤC SÁCH VÀ CHƯA CHỌN BỘ THẺ) */}
      {!currentDeck && !activeBookFolder ? (
        <div className="space-y-7">
          {/* Phần 1 (trên): Bộ sách giáo khoa Global Success */}
          {renderLibrarySection({
            title: 'Bộ sách giáo khoa Global Success',
            subtitle: 'Chọn Unit trong bộ sách giáo khoa Global Success để học từ vựng',
            icon: BookOpen,
            accentClass: 'bg-amber-500/15 border-amber-400/30 text-amber-300',
            category: 'global_success',
            books: globalSuccessBooks,
            emptyBookHint: 'Chưa có thư mục sách giáo khoa Global Success nào.',
          })}

          {/* Phần 2 (dưới): Mở rộng */}
          {renderLibrarySection({
            title: 'Mở rộng',
            subtitle: 'Các bộ từ vựng mở rộng giúp nâng cao vốn từ Tiếng Anh',
            icon: Sparkles,
            accentClass: 'bg-indigo-500/15 border-indigo-400/30 text-indigo-300',
            category: 'extended',
            books: extendedBooks,
            emptyBookHint: 'Chưa có thư mục sách mở rộng nào.',
          })}

          {/* Phần 3 (chỉ hiển thị cho tài khoản người dùng/học): Bộ thẻ cá nhân */}
          {!isAdmin && (
            <section className="space-y-3.5">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="p-2 rounded-xl border bg-cyan-500/15 border-cyan-400/30 text-cyan-300 shrink-0">
                  <Layers className="w-4 h-4" />
                </div>
                <div className="flex items-center gap-2 min-w-0">
                  <h2 className="text-base sm:text-lg font-extrabold font-display text-white truncate">
                    Bộ thẻ cá nhân
                  </h2>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 shrink-0">
                    {personalDecks.length}
                  </span>
                </div>
              </div>

              {personalDecks.length === 0 ? (
                <div className="p-5 rounded-2xl border border-dashed border-white/10 text-center text-xs text-slate-400">
                  Chưa có bộ thẻ cá nhân nào.
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
                  {personalDecks.map((deck) => (
                    <div
                      key={deck.id}
                      onClick={() => handleSelectDeck(deck.id)}
                      className="p-3.5 rounded-2xl glass-card border border-white/10 hover:border-cyan-400/50 cursor-pointer transition-all flex flex-col justify-between gap-2.5 min-h-[116px] group"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300">
                          {deck.creationMethod === 'ai' ? 'AI tạo' : 'Tự nhập'}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => handleDeleteDeck(deck, e)}
                          className="p-1 rounded-lg text-rose-400 hover:bg-rose-500/20 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                          title="Xóa bộ thẻ cá nhân"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="min-w-0">
                        <h4 className="text-xs sm:text-sm font-bold text-white line-clamp-2 group-hover:text-cyan-300 transition-colors font-display">
                          {deck.title}
                        </h4>
                        <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
                          <span>{deck.cards?.length || 0} thẻ</span>
                          <span className="text-cyan-300 font-semibold">Học →</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}
        </div>
      ) : !currentDeck && activeBookFolder ? (
        /* 2B. BÊN TRONG THƯ MỤC SÁCH: DANH SÁCH CÁC UNIT / BỘ THẺ */
        <div className="space-y-4">
          {!isAdmin && activeBookFolder.decks.length === 0 ? (
            <div className="p-8 rounded-2xl border border-dashed border-white/10 text-center text-xs sm:text-sm text-slate-400">
              Chưa có bộ thẻ nào trong "{activeBookFolder.name}".
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
              {activeBookFolder.decks.map((deck) => (
                <div
                  key={deck.id}
                  onClick={() => handleSelectDeck(deck.id)}
                  className="aspect-square p-3.5 rounded-2xl glass-card border border-white/10 hover:border-purple-400/60 cursor-pointer transition-all flex flex-col justify-between gap-2.5 group"
                >
                  <div className="flex items-start justify-between gap-2">
                    {deck.coverImage ? (
                      <img
                        src={deck.coverImage}
                        alt={deck.title}
                        className="w-10 h-12 rounded-lg object-cover border border-white/15 shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-xl bg-purple-500/15 border border-purple-400/25 flex items-center justify-center shrink-0 text-purple-300">
                        <Layers className="w-4 h-4" />
                      </div>
                    )}

                    {isAdmin && (
                      <button
                        type="button"
                        onClick={(e) => handleDeleteDeck(deck, e)}
                        className="p-1 rounded-lg text-rose-400 hover:bg-rose-500/20 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                        title="Xóa bộ thẻ"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="min-w-0">
                    <h4 className="text-xs sm:text-sm font-bold text-white line-clamp-2 group-hover:text-purple-300 transition-colors font-display">
                      {deck.title}
                    </h4>
                    <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1.5">
                      <span>{deck.cards?.length || 0} thẻ</span>
                      <span className="text-purple-300 font-semibold">Học →</span>
                    </div>
                  </div>
                </div>
              ))}

              {/* Admin: Ô vuông dấu + tạo bộ thẻ theo Unit / cuốn sách */}
              {isAdmin && (
                <button
                  type="button"
                  onClick={() =>
                    openCreateModal('textbook', {
                      category: activeBookFolder.category || 'global_success',
                      bookName: activeBookFolder.name,
                      grade: activeBookFolder.grade || '',
                    })
                  }
                  className="aspect-square rounded-2xl border-2 border-dashed border-purple-400/40 hover:border-purple-400 bg-purple-500/[0.04] hover:bg-purple-500/10 flex flex-col items-center justify-center gap-2 p-3 transition-all cursor-pointer group"
                >
                  <span className="w-11 h-11 rounded-2xl bg-purple-500/20 border border-purple-400/30 text-purple-300 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Plus className="w-6 h-6" />
                  </span>
                  <span className="text-xs font-bold text-purple-300 text-center">
                    {activeBookFolder.category === 'extended' ? 'Thêm bộ thẻ' : 'Thêm Unit'}
                  </span>
                </button>
              )}
            </div>
          )}
        </div>
      ) : (
      /* 2C. CHẾ ĐỘ HỌC FLASHCARD (KHI ĐÃ CHỌN 1 BỘ THẺ) */
      <div className="flex flex-col lg:flex-row items-start gap-5">
        {/* Left Column: Textbook Decks + Personal Decks (Scrollable) */}
        {!isDecksCollapsed && (
          <div className="w-full lg:w-72 shrink-0 transition-all duration-300">
            <div className="rounded-2xl glass-card border border-white/10 p-3 space-y-3">
              {/* Header + Nút thu gọn */}
              <div className="flex items-center justify-between px-1 pb-2 border-b border-white/10">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-300 font-display">
                  Danh sách bộ thẻ
                </span>
                <button
                  type="button"
                  onClick={toggleDecksCollapsed}
                  className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
                  title="Thu gọn danh sách bộ thẻ"
                >
                  <PanelLeftClose className="w-4 h-4" />
                </button>
              </div>

              {/* Vùng cuộn riêng cho danh sách bộ thẻ */}
              <div className="max-h-[calc(100vh-270px)] min-h-[200px] overflow-y-auto pr-1 space-y-4">
                {/* Sách Giáo Khoa (Admin cung cấp) */}
                <div className="space-y-2">
                  <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-1 font-display flex items-center justify-between">
                    <span>Sách Giáo Khoa (Theo Unit)</span>
                    <span className="text-[10px] text-purple-300 font-mono">{textbookDecks.length}</span>
                  </h3>

                  {isLoading ? (
                    <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10 text-center text-xs text-slate-400">
                      <Loader2 className="w-4 h-4 animate-spin mx-auto mb-1 text-purple-400" />
                      Đang tải...
                    </div>
                  ) : textbookDecks.length === 0 ? (
                    <div className="p-3 rounded-xl border border-dashed border-white/10 text-xs text-slate-400 text-center">
                      Chưa có bộ thẻ sách giáo khoa nào.
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      {textbookDecks.map((deck) => {
                        const isSelected = selectedDeckId === deck.id;
                        return (
                          <div
                            key={deck.id}
                            onClick={() => handleSelectDeck(deck.id)}
                            className={`p-2.5 rounded-xl border cursor-pointer transition-all group ${
                              isSelected
                                ? 'border-purple-400/60 bg-purple-500/15 shadow-md shadow-purple-500/15'
                                : 'bg-white/[0.03] border-white/10 hover:border-white/20 hover:bg-white/[0.05]'
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              {deck.coverImage ? (
                                <img
                                  src={deck.coverImage}
                                  alt={deck.bookName || deck.title}
                                  className="w-9 h-11 rounded-lg object-cover border border-white/15 shrink-0 bg-white/5"
                                />
                              ) : (
                                <div className="w-9 h-11 rounded-lg border border-white/10 bg-amber-500/10 flex items-center justify-center shrink-0">
                                  <BookOpen className="w-4 h-4 text-amber-300/75" />
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-1.5">
                                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300 truncate">
                                    {[deck.bookName || deck.unit || 'Sách Giáo Khoa', deck.grade].filter(Boolean).join(' • ')}
                                  </span>
                                  <div className="flex items-center gap-1 shrink-0">
                                    <span className="text-[10px] text-slate-400">
                                      {deck.cards?.length || 0} từ
                                    </span>
                                    {isAdmin && (
                                      <button
                                        type="button"
                                        onClick={(e) => handleDeleteDeck(deck, e)}
                                        className="p-0.5 rounded-md text-rose-400 hover:bg-rose-500/20 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                                        title="Xóa bộ thẻ SGK"
                                      >
                                        <Trash2 className="w-3 h-3" />
                                      </button>
                                    )}
                                  </div>
                                </div>
                                <h4 className="text-xs font-bold text-white mt-0.5 line-clamp-1 font-display">
                                  {deck.title}
                                </h4>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Bộ Thẻ Cá Nhân (Người học tự tạo) */}
                {personalDecks.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-white/10">
                    <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-1 font-display flex items-center justify-between">
                      <span>Bộ Thẻ Tự Tạo</span>
                      <span className="text-[10px] text-cyan-300 font-mono">{personalDecks.length}</span>
                    </h3>

                    <div className="space-y-1.5">
                      {personalDecks.map((deck) => {
                        const isSelected = selectedDeckId === deck.id;
                        return (
                          <div
                            key={deck.id}
                            onClick={() => handleSelectDeck(deck.id)}
                            className={`p-2.5 rounded-xl border cursor-pointer transition-all group ${
                              isSelected
                                ? 'border-purple-400/60 bg-purple-500/15 shadow-md shadow-purple-500/15'
                                : 'bg-white/[0.03] border-white/10 hover:border-white/20 hover:bg-white/[0.05]'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-300">
                                {deck.creationMethod === 'ai' ? 'Tạo bởi AI' : 'Tự nhập'}
                              </span>
                              <div className="flex items-center gap-1">
                                <span className="text-[10px] text-slate-400">
                                  {deck.cards?.length || 0} từ
                                </span>
                                <button
                                  type="button"
                                  onClick={(e) => handleDeleteDeck(deck, e)}
                                  className="p-0.5 rounded-md text-rose-400 hover:bg-rose-500/20 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                                  title="Xóa bộ thẻ cá nhân"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                            <h4 className="text-xs font-bold text-white mt-0.5 line-clamp-1 font-display">
                              {deck.title}
                            </h4>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Center Stage: 3D Flashcard (tự căn giữa & mở rộng đẹp khi thu gọn danh sách bộ thẻ) */}
        <div className="flex-1 min-w-0 w-full">
          <div className="max-w-2xl mx-auto space-y-3.5">
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
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-400 px-0.5">
                  <span>
                    Thẻ số <strong className="text-purple-300 font-bold text-sm">{currentCardIndex + 1}</strong> / {currentCards.length}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-semibold">
                      ✓ Đã thuộc: {rememberedCount}
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 font-semibold">
                      ✗ Cần ôn lại: {reviewCount}
                    </span>
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
              </div>

              {/* 3D Flip Card - Co giãn linh hoạt theo nội dung, key theo từng thẻ để khi chuyển thẻ mới luôn hiện thẳng mặt câu hỏi, không lật ngược từ mặt đáp án */}
              <div
                key={`${currentDeck.id}-${currentCard?.id || currentCardIndex}`}
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
                        {currentDeck.bookName || currentDeck.unit || 'Tiếng Anh'}
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
                      {(currentCard.partOfSpeech || currentCard.phonetic) && (
                        <div className="mt-2 flex items-center justify-center gap-2 flex-wrap">
                          {currentCard.partOfSpeech && (
                            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-cyan-500/15 text-cyan-300 border border-cyan-400/30">
                              {currentCard.partOfSpeech}
                            </span>
                          )}
                          {currentCard.phonetic && (
                            <span className="text-sm text-purple-300 font-mono">
                              {currentCard.phonetic}
                            </span>
                          )}
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
                  className="flex-1 max-w-[220px] py-3.5 px-6 rounded-2xl glass-card border-rose-500/30 hover:border-rose-500/60 bg-rose-500/10 text-rose-700 dark:text-rose-200 hover:text-rose-900 dark:hover:text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-lg hover:scale-[1.02] transition-all cursor-pointer"
                >
                  <X className="w-4 h-4 text-rose-500 dark:text-rose-400" />
                  <span>Cần Ôn Lại [←]</span>
                </button>

                <button
                  onClick={() => handleNext(true)}
                  className="flex-1 max-w-[220px] py-3.5 px-6 rounded-2xl glass-card border-emerald-500/30 hover:border-emerald-500/60 bg-emerald-500/10 text-emerald-700 dark:text-emerald-200 hover:text-emerald-900 dark:hover:text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-lg hover:scale-[1.02] transition-all cursor-pointer"
                >
                  <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
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
        </div>

        {/* Right Column: Card List */}
        <div className="w-full lg:w-64 shrink-0 space-y-3">
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
      )}

      {/* 3. MODAL TẠO BỘ THẺ (NHẬP THỦ CÔNG HOẶC AI TẠO TỪ TÀI LIỆU) */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 dark:bg-black/75 backdrop-blur-md">
          <div className="w-full max-w-3xl max-h-[90vh] flex flex-col rounded-3xl bg-white dark:bg-[#111322] border border-slate-200 dark:border-white/20 shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
              <div>
                <h3 className="text-lg font-bold font-display text-white">
                  {createTarget === 'textbook'
                    ? bookCategory === 'extended'
                      ? `Thêm Bộ Thẻ Mở Rộng • ${bookName || 'Mở rộng'}`
                      : `Thêm Bộ Thẻ Unit • ${bookName || 'Global Success'}`
                    : 'Tạo Bộ Thẻ Cá Nhân Mới'}
                </h3>
                <p className="text-xs text-slate-400">
                  {createTarget === 'textbook'
                    ? 'Tạo bộ thẻ flashcard bằng cách nhập thủ công hoặc dùng AI tạo từ file PDF / TXT rồi xem trước'
                    : 'Bộ thẻ sẽ được lưu riêng trong mục "Bộ thẻ cá nhân" của tài khoản bạn'}
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

              {/* Thông tin bộ thẻ */}
              {createTarget === 'textbook' ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                        Tên bài học (Unit / Bài) *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="VD: Unit 1 - Bài 1: Life Stories"
                        value={deckTitle}
                        onChange={(e) => setDeckTitle(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.05] border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-purple-400"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                        Khối (tùy chọn)
                      </label>
                      <input
                        type="text"
                        placeholder="VD: Khối 12"
                        value={grade}
                        onChange={(e) => setGrade(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.05] border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-purple-400"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-start">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                        Tên sách *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="VD: Global Success 12"
                        value={bookName}
                        onChange={(e) => setBookName(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.05] border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-purple-400"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                        Ảnh bìa sách (tùy chọn)
                      </label>
                      <div className="flex items-center gap-3">
                        <label className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl glass-button text-xs font-semibold text-amber-200 cursor-pointer">
                          {isProcessingCover ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <ImageIcon className="w-3.5 h-3.5" />
                          )}
                          <span>{coverImage ? 'Đổi ảnh bìa' : 'Chèn ảnh bìa'}</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleCoverImageUpload}
                            className="hidden"
                          />
                        </label>
                        {coverImage && (
                          <div className="relative flex items-center gap-2">
                            <img
                              src={coverImage}
                              alt="Bìa sách"
                              className="w-10 h-12 rounded-lg object-cover border border-white/20"
                            />
                            <button
                              type="button"
                              onClick={() => setCoverImage('')}
                              className="p-1 rounded-lg bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 cursor-pointer"
                              title="Xóa ảnh bìa"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Tên bộ thẻ *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Đặt tên bộ thẻ của bạn..."
                    value={deckTitle}
                    onChange={(e) => setDeckTitle(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.05] border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-purple-400"
                  />
                </div>
              )}

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
                      Đưa file PDF / TXT hoặc dán nội dung để AI tạo thẻ xem trước
                    </span>
                    <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl glass-button text-xs font-semibold text-purple-200 cursor-pointer">
                      <Upload className="w-3.5 h-3.5" />
                      <span>Chọn File PDF / TXT</span>
                      <input
                        type="file"
                        accept=".pdf,.txt,.doc,.docx,.md,.csv,.rtf"
                        onChange={handleDocumentFileUpload}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {docFile && (
                    <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-purple-500/15 border border-purple-400/30 text-xs text-purple-200">
                      <span className="truncate font-semibold">Đã chọn tệp: {docFile.name}</span>
                      <button
                        type="button"
                        onClick={() => setDocFile(null)}
                        className="p-1 rounded-lg hover:bg-purple-500/30 text-purple-200 cursor-pointer shrink-0"
                        title="Bỏ chọn tệp"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

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
                      disabled={isGeneratingAI || (!docText.trim() && !docFile)}
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
                          <span>AI Tạo Thẻ Xem Trước</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {createMethod === 'ai' && aiPreviewReady && (
                <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-400/35 text-xs text-emerald-300 flex items-center justify-between gap-2">
                  <span className="font-semibold">
                    ✓ AI đã tạo {draftCards.length} thẻ xem trước. Bạn có thể kiểm tra và chỉnh sửa từng thẻ bên dưới trước khi xuất!
                  </span>
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
                          placeholder="Loại từ (tùy chọn, VD: n, v, adj)"
                          value={card.partOfSpeech || ''}
                          onChange={(e) => handleUpdateDraftCard(idx, 'partOfSpeech', e.target.value)}
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
                          className="sm:col-span-2 w-full px-3 py-2 rounded-xl bg-white/[0.04] border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-purple-400"
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
                      <span>{createMethod === 'ai' ? 'Xuất & Lưu Bộ Thẻ' : 'Lưu Bộ Thẻ'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. MODAL TẠO THƯ MỤC SÁCH (ADMIN) */}
      {isBookModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 dark:bg-black/75 backdrop-blur-md">
          <div className="w-full max-w-md rounded-3xl bg-white dark:bg-[#111322] border border-slate-200 dark:border-white/20 shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
              <div>
                <h3 className="text-base sm:text-lg font-bold font-display text-white">
                  {addingBookCategory === 'extended'
                    ? 'Tạo Thư Mục Sách Mở Rộng'
                    : 'Tạo Thư Mục Sách Global Success'}
                </h3>
                <p className="text-xs text-slate-400">
                  Thư mục dùng để chứa các bộ thẻ flashcard của cuốn sách
                </p>
              </div>
              <button
                type="button"
                onClick={() => !isSavingBook && setIsBookModalOpen(false)}
                className="p-2 rounded-xl glass-button text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddBook} className="p-6 space-y-4">
              {bookModalError && (
                <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs font-semibold">
                  {bookModalError}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Tên sách *
                </label>
                <input
                  type="text"
                  required
                  value={newBookName}
                  onChange={(e) => setNewBookName(e.target.value)}
                  placeholder={
                    addingBookCategory === 'extended'
                      ? 'VD: IELTS Vocabulary, 3000 từ Oxford...'
                      : 'VD: Global Success 12'
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.05] border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-purple-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Khối (không bắt buộc)
                </label>
                <input
                  type="text"
                  value={newBookGrade}
                  onChange={(e) => setNewBookGrade(e.target.value)}
                  placeholder="VD: Khối 12"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.05] border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-purple-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Ảnh bìa sách dạng PDF hoặc ảnh (không bắt buộc, lưu Google Drive)
                </label>
                <div className="flex items-center gap-2">
                  <label className="flex-1 inline-flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl glass-button text-xs font-semibold text-purple-200 cursor-pointer truncate">
                    <Upload className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">
                      {newBookCoverFile ? newBookCoverFile.name : 'Chọn file PDF / ảnh bìa sách'}
                    </span>
                    <input
                      type="file"
                      accept=".pdf,image/*"
                      onChange={(e) => setNewBookCoverFile(e.target.files?.[0] || null)}
                      className="hidden"
                    />
                  </label>
                  {newBookCoverFile && (
                    <button
                      type="button"
                      onClick={() => setNewBookCoverFile(null)}
                      className="p-2 rounded-xl bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 cursor-pointer shrink-0"
                      title="Bỏ chọn file"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {newBookCoverFile && !getSavedAppsScriptUrl() && showScriptConfig && (
                <input
                  type="url"
                  value={appsScriptUrl}
                  onChange={(e) => {
                    setAppsScriptUrl(e.target.value);
                    saveAppsScriptUrl(e.target.value);
                  }}
                  placeholder="Google Apps Script Web App URL (chỉ dán 1 lần)"
                  className="w-full px-3.5 py-2 rounded-xl bg-white/[0.05] border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-purple-400"
                />
              )}

              {isSavingBook && newBookCoverFile && (
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px] text-slate-300">
                    <span>Đang lưu bìa sách lên Google Drive...</span>
                    <span className="font-mono font-bold text-purple-300">{bookUploadProgress}%</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-purple-500 to-indigo-400 transition-all"
                      style={{ width: `${bookUploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-white/10">
                <button
                  type="button"
                  disabled={isSavingBook}
                  onClick={() => setIsBookModalOpen(false)}
                  className="px-4 py-2 rounded-xl glass-button text-xs font-semibold text-slate-300 hover:text-white cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSavingBook || !newBookName.trim()}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-xs font-bold flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                >
                  {isSavingBook ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Đang tạo...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5" />
                      <span>Tạo Thư Mục</span>
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
