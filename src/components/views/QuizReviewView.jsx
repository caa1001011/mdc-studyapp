import React, { useState, useEffect, useRef } from 'react';
import {
  HelpCircle,
  Clock,
  CheckCircle,
  XCircle,
  Award,
  ChevronRight,
  ChevronLeft,
  RotateCcw,
  BookOpen,
  Calculator,
  Atom,
  Languages,
  FlaskConical,
  ArrowLeft,
  Plus,
  Wand2,
  Upload,
  Trash2,
  Loader2,
  Save,
  Sparkles,
  FileText,
  X,
  Play,
  Pencil
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { STUDY_SUBJECTS } from '../../data/mockData';
import { getSessionUser } from '../../services/authService';
import {
  EXAM_CATEGORIES,
  fetchAllExams,
  saveExam,
  deleteExam,
  generateQuestionsFromDocument
} from '../../services/quizService';

const ICONS_MAP = {
  Calculator,
  Atom,
  Languages,
  FlaskConical,
};

const EMPTY_QUESTION = () => ({
  id: `q-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
  question: '',
  options: ['A. ', 'B. ', 'C. ', 'D. '],
  correctIndex: 0,
  explanation: '',
});

export default function QuizReviewView({ currentUser: propsUser }) {
  const sessionUser = getSessionUser();
  const currentUser = propsUser || sessionUser;
  const username = currentUser?.username || 'student';
  const isAdmin = currentUser?.role === 'admin';

  // Navigation state: Subjects -> 4 Exam Categories -> Exam List -> Active Exam
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [activeExam, setActiveExam] = useState(null);

  // Exams data
  const [allExams, setAllExams] = useState([]);
  const [isLoadingExams, setIsLoadingExams] = useState(true);

  // Active exam runner state
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);

  // Admin Create/Edit/Upload Exam Modal state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingExamId, setEditingExamId] = useState(null);
  const [createMethod, setCreateMethod] = useState('manual'); // 'manual' | 'ai'
  const [examTitle, setExamTitle] = useState('');
  const [examDuration, setExamDuration] = useState(45);
  const [draftQuestions, setDraftQuestions] = useState([EMPTY_QUESTION()]);
  const [docText, setDocText] = useState('');
  const [docFile, setDocFile] = useState(null);
  const [geminiApiKey, setGeminiApiKey] = useState('');
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [aiGeneratedNotice, setAiGeneratedNotice] = useState('');
  const [isSavingExam, setIsSavingExam] = useState(false);
  const [modalError, setModalError] = useState('');
  const questionsSectionRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    async function loadExams() {
      setIsLoadingExams(true);
      try {
        const list = await fetchAllExams();
        if (!cancelled) {
          setAllExams(list);
        }
      } catch (err) {
        console.error('Lỗi tải đề thi:', err);
      } finally {
        if (!cancelled) {
          setIsLoadingExams(false);
        }
      }
    }
    loadExams();
    return () => {
      cancelled = true;
    };
  }, []);

  // Countdown timer when taking an exam
  useEffect(() => {
    if (!activeExam || isSubmitted || timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [activeExam, isSubmitted, timeLeft]);

  const handleStartExam = (exam) => {
    setActiveExam(exam);
    setCurrentQIndex(0);
    setSelectedAnswers({});
    setIsSubmitted(false);
    setTimeLeft((exam.durationMinutes || 45) * 60);
  };

  const handleSelectOption = (optionIndex) => {
    if (isSubmitted) return;
    setSelectedAnswers((prev) => ({
      ...prev,
      [currentQIndex]: optionIndex,
    }));
  };

  const handleSubmitExam = () => {
    setIsSubmitted(true);
    confetti({
      particleCount: 100,
      spread: 80,
      origin: { y: 0.6 },
    });
  };

  const handleRetakeExam = () => {
    if (!activeExam) return;
    setSelectedAnswers({});
    setIsSubmitted(false);
    setCurrentQIndex(0);
    setTimeLeft((activeExam.durationMinutes || 45) * 60);
  };

  const formatTime = (secs) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Admin: Modal helpers
  const openCreateModal = () => {
    setEditingExamId(null);
    setCreateMethod('manual');
    setExamTitle('');
    setExamDuration(45);
    setDraftQuestions([EMPTY_QUESTION()]);
    setDocText('');
    setDocFile(null);
    setAiGeneratedNotice('');
    setModalError('');
    setIsCreateModalOpen(true);
  };

  const openEditModal = (exam, e) => {
    e.stopPropagation();
    setEditingExamId(exam.id);
    setCreateMethod('manual');
    setExamTitle(exam.title || '');
    setExamDuration(exam.durationMinutes || 45);
    setDraftQuestions(
      Array.isArray(exam.questions) && exam.questions.length > 0
        ? exam.questions.map((q, idx) => ({
            id: q.id || `q-edit-${Date.now()}-${idx}`,
            question: q.question || '',
            options: Array.isArray(q.options) && q.options.length === 4 ? [...q.options] : ['A. ', 'B. ', 'C. ', 'D. '],
            correctIndex: Number(q.correctIndex) || 0,
            explanation: q.explanation || '',
          }))
        : [EMPTY_QUESTION()]
    );
    setDocText('');
    setDocFile(null);
    setAiGeneratedNotice('');
    setModalError('');
    setIsCreateModalOpen(true);
  };

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

  const handleGenerateWithAI = async () => {
    setModalError('');
    setAiGeneratedNotice('');
    setIsGeneratingAI(true);
    try {
      const generated = await generateQuestionsFromDocument(
        { text: docText, fileData: docFile },
        geminiApiKey
      );
      setDraftQuestions(generated);
      setAiGeneratedNotice(
        `AI đã tạo ${generated.length} câu hỏi. Hãy xem, chỉnh sửa và duyệt bộ đề bên dưới trước khi lưu cho học sinh.`
      );
      setTimeout(() => {
        questionsSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 80);
    } catch (err) {
      setModalError(err.message || 'Không thể tạo câu hỏi từ tài liệu.');
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const updateDraftQuestion = (idx, field, value) => {
    setDraftQuestions((prev) =>
      prev.map((q, i) => (i === idx ? { ...q, [field]: value } : q))
    );
  };

  const updateDraftOption = (qIdx, optIdx, value) => {
    setDraftQuestions((prev) =>
      prev.map((q, i) => {
        if (i !== qIdx) return q;
        const nextOpts = [...q.options];
        nextOpts[optIdx] = value;
        return { ...q, options: nextOpts };
      })
    );
  };

  const handleSaveNewExam = async (e) => {
    e.preventDefault();
    setModalError('');

    if (!examTitle.trim()) {
      setModalError('Vui lòng nhập tên đề thi.');
      return;
    }

    const validQuestions = draftQuestions.filter(
      (q) => q.question.trim() && q.options.every((o) => o.trim())
    );
    if (validQuestions.length === 0) {
      setModalError('Vui lòng thêm ít nhất 1 câu hỏi đầy đủ nội dung và 4 đáp án.');
      return;
    }

    setIsSavingExam(true);
    try {
      const saved = await saveExam({
        id: editingExamId || undefined,
        subjectId: selectedSubject.id,
        subjectName: selectedSubject.name,
        categoryId: selectedCategory.id,
        categoryName: selectedCategory.name,
        title: examTitle,
        durationMinutes: examDuration,
        questions: validQuestions,
        createdBy: username,
      });
      setAllExams((prev) => [saved, ...prev.filter((ex) => ex.id !== saved.id)]);
      setIsCreateModalOpen(false);
    } catch (err) {
      setModalError(err.message || 'Lỗi khi lưu đề thi.');
    } finally {
      setIsSavingExam(false);
    }
  };

  const handleDeleteExam = async (examId, e) => {
    e.stopPropagation();
    if (!isAdmin) return;
    try {
      await deleteExam(examId);
      setAllExams((prev) => prev.filter((ex) => ex.id !== examId));
    } catch (err) {
      console.error('Lỗi xóa đề thi:', err);
    }
  };

  // Filtered exams for current subject & category
  const currentCategoryExams =
    selectedSubject && selectedCategory
      ? allExams.filter(
          (ex) => ex.subjectId === selectedSubject.id && ex.categoryId === selectedCategory.id
        )
      : [];

  // ============================================================================
  // VIEW 4: ĐANG LÀM ĐỀ THI
  // ============================================================================
  if (activeExam) {
    const questions = activeExam.questions || [];
    const currentQ = questions[currentQIndex];
    const totalQuestions = questions.length;
    const score = questions.reduce(
      (acc, q, idx) => (selectedAnswers[idx] === q.correctIndex ? acc + 1 : acc),
      0
    );

    return (
      <div className="space-y-6 md:space-y-8 pb-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => setActiveExam(null)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-300 hover:text-white cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Quay lại danh sách đề</span>
            </button>
            <h1 className="text-2xl sm:text-3xl font-extrabold font-display tracking-tight text-white">
              {activeExam.title}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300">
              {selectedSubject?.name} • {selectedCategory?.name} • Thời gian: {activeExam.durationMinutes} phút • {totalQuestions} câu trắc nghiệm
            </p>
          </div>

          {!isSubmitted && (
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl glass-card border-white/15 text-white font-mono text-sm self-start sm:self-auto shadow-lg shadow-purple-500/10">
              <Clock className="w-4 h-4 text-purple-400 animate-pulse" />
              <span>Thời gian còn:</span>
              <span className="font-bold text-purple-300 text-base">{formatTime(timeLeft)}</span>
            </div>
          )}
        </div>

        {!isSubmitted && currentQ ? (
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1">
              <span className="text-xs text-slate-400 font-medium">
                Câu <strong className="text-white">{currentQIndex + 1}</strong> / {totalQuestions}
              </span>

              <div className="flex items-center gap-1.5 flex-wrap">
                {questions.map((_, idx) => {
                  const isAnswered = selectedAnswers[idx] !== undefined;
                  const isCurrent = currentQIndex === idx;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setCurrentQIndex(idx)}
                      className={`w-7 h-7 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        isCurrent
                          ? 'bg-purple-600 text-white shadow-md shadow-purple-500/30 border border-purple-400'
                          : isAnswered
                          ? 'bg-white/20 text-slate-200 border border-white/20'
                          : 'bg-white/[0.04] text-slate-500 border border-white/10 hover:text-slate-300'
                      }`}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="rounded-3xl glass-card p-6 sm:p-8 border border-white/15 space-y-6 shadow-2xl">
              <div>
                <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-500/20 text-purple-200 border border-purple-400/30 mb-3 inline-block">
                  Câu Hỏi Số {currentQIndex + 1}
                </span>
                <h3 className="text-lg sm:text-xl font-bold font-display text-white leading-relaxed">
                  {currentQ.question}
                </h3>
              </div>

              <div className="space-y-3">
                {currentQ.options.map((opt, optIdx) => {
                  const isSelected = selectedAnswers[currentQIndex] === optIdx;
                  return (
                    <div
                      key={optIdx}
                      onClick={() => handleSelectOption(optIdx)}
                      className={`p-4 rounded-2xl glass-card border cursor-pointer transition-all duration-200 flex items-center justify-between ${
                        isSelected
                          ? 'bg-purple-600/25 border-purple-400 text-white shadow-lg shadow-purple-500/20 translate-x-1'
                          : 'border-white/10 text-slate-300 hover:border-white/25 hover:bg-white/[0.04]'
                      }`}
                    >
                      <span className="text-xs sm:text-sm font-medium">{opt}</span>
                      <div
                        className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors shrink-0 ${
                          isSelected ? 'border-purple-400 bg-purple-500' : 'border-white/20'
                        }`}
                      >
                        {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                disabled={currentQIndex === 0}
                onClick={() => setCurrentQIndex((prev) => prev - 1)}
                className="px-4 py-2.5 rounded-xl glass-button text-xs font-semibold text-slate-300 hover:text-white disabled:opacity-30 disabled:pointer-events-none flex items-center gap-1.5 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Câu Trước</span>
              </button>

              {currentQIndex + 1 < totalQuestions ? (
                <button
                  type="button"
                  onClick={() => setCurrentQIndex((prev) => prev + 1)}
                  className="px-5 py-2.5 rounded-xl bg-purple-600/40 border border-purple-400/40 text-white text-xs font-semibold hover:bg-purple-600/60 transition-all flex items-center gap-1.5 shadow-md shadow-purple-500/20 cursor-pointer"
                >
                  <span>Câu Tiếp Theo</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmitExam}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-xs font-bold shadow-lg shadow-emerald-500/30 hover:scale-[1.02] transition-all cursor-pointer"
                >
                  Nộp Bài
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="rounded-3xl glass-card p-8 text-center border border-purple-500/30 shadow-2xl">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-purple-500 via-pink-500 to-amber-400 p-[1.5px] mx-auto mb-4 shadow-xl shadow-purple-500/30">
                <div className="w-full h-full bg-[#0d0e17] rounded-[15px] flex items-center justify-center">
                  <Award className="w-8 h-8 text-amber-400" />
                </div>
              </div>

              <h2 className="text-2xl font-bold font-display text-white">Kết Quả Bài Làm</h2>
              <div className="my-6 inline-flex items-baseline gap-2 px-6 py-3 rounded-2xl bg-white/[0.04] border border-white/10">
                <span className="text-4xl font-extrabold font-display text-white shimmer-text">
                  {score} / {totalQuestions}
                </span>
                <span className="text-sm font-semibold text-purple-300">
                  ({totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0}% Đúng)
                </span>
              </div>

              <div className="flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={handleRetakeExam}
                  className="px-5 py-3 rounded-2xl glass-button text-xs font-semibold text-slate-200 hover:text-white flex items-center gap-2 cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Làm Lại Bài Này</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveExam(null)}
                  className="px-5 py-3 rounded-2xl bg-purple-600/30 border border-purple-400/40 text-xs font-semibold text-white hover:bg-purple-600/50 flex items-center gap-2 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Về Danh Sách Đề</span>
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-bold font-display text-white flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-purple-400" />
                <span>Đáp Án & Lời Giải Chi Tiết</span>
              </h3>

              {questions.map((q, idx) => {
                const isCorrect = selectedAnswers[idx] === q.correctIndex;
                return (
                  <div
                    key={idx}
                    className={`p-5 rounded-2xl glass-card border ${
                      isCorrect ? 'border-emerald-500/30' : 'border-rose-500/30'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-bold text-purple-300">Câu {idx + 1}</span>
                      {isCorrect ? (
                        <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400 px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30">
                          <CheckCircle className="w-3 h-3" /> Đúng
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-[11px] font-semibold text-rose-400 px-2 py-0.5 rounded-full bg-rose-500/15 border border-rose-500/30">
                          <XCircle className="w-3 h-3" /> Chưa đúng
                        </span>
                      )}
                    </div>

                    <h4 className="text-sm font-bold text-white mb-2">{q.question}</h4>

                    <div className="text-xs space-y-1 text-slate-300">
                      <div>
                        Đáp án đúng: <strong className="text-emerald-400">{q.options[q.correctIndex]}</strong>
                      </div>
                      {selectedAnswers[idx] !== undefined && !isCorrect && (
                        <div>
                          Bạn đã chọn: <strong className="text-rose-400">{q.options[selectedAnswers[idx]]}</strong>
                        </div>
                      )}
                    </div>

                    {q.explanation && (
                      <div className="mt-3 p-3 rounded-xl bg-white/[0.03] border border-white/10 text-xs text-slate-300">
                        <strong className="text-purple-300">💡 Giải thích:</strong> {q.explanation}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ============================================================================
  // VIEW 1, 2, 3: MÔN HỌC -> 4 KỲ THI -> DANH SÁCH ĐỀ (+ MODAL ADMIN TẠO/UP ĐỀ)
  // ============================================================================
  return (
    <div className="space-y-6 md:space-y-8 pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-display tracking-tight text-white flex items-center gap-2.5">
            <HelpCircle className="w-7 h-7 text-blue-400" />
            <span>Luyện Đề & Ôn Thi</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">
            {!selectedSubject
              ? 'Chọn môn học để xem các bộ đề ôn thi giữa kỳ và học kỳ'
              : !selectedCategory
              ? `Môn ${selectedSubject.name} — Chọn kỳ thi để luyện đề`
              : `${selectedSubject.name} • ${selectedCategory.name}`}
          </p>
        </div>

        {selectedSubject && selectedCategory && isAdmin && (
          <button
            type="button"
            onClick={openCreateModal}
            className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-purple-500/25 cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Up / Tạo Đề Mới</span>
          </button>
        )}
      </div>

      {/* VIEW 1: DANH SÁCH THẺ MÔN HỌC */}
      {!selectedSubject && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {STUDY_SUBJECTS.map((sub) => {
            const SubIcon = ICONS_MAP[sub.icon] || BookOpen;
            const subjectExamCount = allExams.filter((ex) => ex.subjectId === sub.id).length;
            return (
              <div
                key={sub.id}
                onClick={() => setSelectedSubject(sub)}
                className="relative overflow-hidden rounded-3xl glass-card p-5 border border-white/10 group hover:border-purple-400/40 flex items-center justify-between gap-4 cursor-pointer transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-2xl bg-white/[0.05] border border-white/10 text-purple-300 group-hover:scale-110 transition-transform">
                    <SubIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold font-display text-white group-hover:text-purple-300 transition-colors">
                      {sub.name}
                    </h3>
                    <span className="text-[11px] text-slate-400">
                      {subjectExamCount} đề thi
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-purple-300 transition-colors" />
              </div>
            );
          })}
        </div>
      )}

      {/* VIEW 2: 4 THẺ KỲ THI CỦA MÔN HỌC ĐÃ CHỌN */}
      {selectedSubject && !selectedCategory && (
        <div className="space-y-4">
          <button
            type="button"
            onClick={() => setSelectedSubject(null)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl glass-button text-xs font-semibold text-slate-300 hover:text-white cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Quay lại các môn học</span>
          </button>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {EXAM_CATEGORIES.map((cat) => {
              const count = allExams.filter(
                (ex) => ex.subjectId === selectedSubject.id && ex.categoryId === cat.id
              ).length;

              return (
                <div
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat)}
                  className="p-6 rounded-3xl glass-card border border-white/10 hover:border-purple-400/50 cursor-pointer transition-all group flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-3.5 rounded-2xl bg-purple-500/15 border border-purple-400/30 text-purple-300 group-hover:scale-105 transition-transform">
                      <FileText className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-base sm:text-lg font-bold font-display text-white group-hover:text-purple-300 transition-colors">
                        {cat.name}
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {count} đề ôn thi hiện có
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-purple-300 transition-colors" />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW 3: DANH SÁCH ĐỀ TRONG KỲ THI ĐÃ CHỌN */}
      {selectedSubject && selectedCategory && (
        <div className="space-y-4">
          <button
            type="button"
            onClick={() => setSelectedCategory(null)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl glass-button text-xs font-semibold text-slate-300 hover:text-white cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Quay lại kỳ thi ({selectedSubject.name})</span>
          </button>

          {isLoadingExams ? (
            <div className="p-10 rounded-3xl glass-card border border-white/10 text-center text-xs text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-purple-400" />
              Đang tải danh sách đề...
            </div>
          ) : currentCategoryExams.length === 0 ? (
            <div className="p-10 rounded-3xl glass-card border border-dashed border-white/15 text-center space-y-3">
              <FileText className="w-10 h-10 text-slate-500 mx-auto" />
              <div className="text-sm font-semibold text-slate-300">
                Chưa có đề nào trong mục "{selectedCategory.name}".
              </div>
              {isAdmin ? (
                <button
                  type="button"
                  onClick={openCreateModal}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600/40 border border-purple-400/40 text-xs font-bold text-white hover:bg-purple-600/60 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tạo / Up Đề Đầu Tiên</span>
                </button>
              ) : (
                <p className="text-xs text-slate-400">
                  Quản trị viên chưa cập nhật đề thi cho mục này.
                </p>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {currentCategoryExams.map((exam) => (
                <div
                  key={exam.id}
                  onClick={() => handleStartExam(exam)}
                  className="p-5 rounded-3xl glass-card border border-white/10 hover:border-purple-400/50 cursor-pointer transition-all group flex items-center justify-between gap-4"
                >
                  <div className="space-y-1.5 min-w-0">
                    <h4 className="text-base font-bold font-display text-white group-hover:text-purple-300 transition-colors truncate">
                      {exam.title}
                    </h4>
                    <div className="flex items-center gap-3 text-xs text-slate-400">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-purple-400" />
                        {exam.durationMinutes} phút
                      </span>
                      <span>•</span>
                      <span>{exam.questions?.length || 0} câu hỏi</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="px-3.5 py-2 rounded-xl bg-purple-600/30 border border-purple-400/30 text-xs font-bold text-purple-200 flex items-center gap-1.5 group-hover:bg-purple-600/50">
                      <Play className="w-3.5 h-3.5" />
                      <span>{isAdmin ? 'Làm Thử' : 'Làm Đề'}</span>
                    </span>
                    {isAdmin && (
                      <>
                        <button
                          type="button"
                          onClick={(e) => openEditModal(exam, e)}
                          className="p-2 rounded-xl text-amber-300 hover:bg-amber-500/20 cursor-pointer"
                          title="Chỉnh sửa đề thi"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleDeleteExam(exam.id, e)}
                          className="p-2 rounded-xl text-rose-400 hover:bg-rose-500/20 cursor-pointer"
                          title="Xóa đề thi"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* MODAL ADMIN TẠO / UP ĐỀ THI */}
      {isCreateModalOpen && isAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="w-full max-w-3xl max-h-[90vh] flex flex-col rounded-3xl bg-[#111322] border border-white/15 shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-purple-500/20 text-purple-300">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white font-display">
                    {editingExamId ? 'Chỉnh Sửa Đề Thi' : 'Up / Tạo Đề Thi Mới'}
                  </h2>
                  <p className="text-[11px] text-slate-400">
                    {selectedSubject?.name} • {selectedCategory?.name}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveNewExam} className="flex-1 overflow-y-auto p-6 space-y-5">
              {modalError && (
                <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs font-semibold">
                  {modalError}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Tên đề thi *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="VD: Đề số 1 - Chương 1 & 2"
                    value={examTitle}
                    onChange={(e) => setExamTitle(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.05] border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-purple-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Thời gian (phút) *
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={180}
                    required
                    value={examDuration}
                    onChange={(e) => setExamDuration(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.05] border border-white/10 text-white text-xs focus:outline-none focus:border-purple-400"
                  />
                </div>
              </div>

              {/* Chọn phương thức: Thủ công hoặc Up đề / Tạo bằng AI */}
              <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-white/[0.04] border border-white/10">
                <button
                  type="button"
                  onClick={() => setCreateMethod('manual')}
                  className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    createMethod === 'manual'
                      ? 'bg-purple-600 text-white shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tạo Thủ Công</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCreateMethod('ai')}
                  className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    createMethod === 'ai'
                      ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Wand2 className="w-3.5 h-3.5" />
                  <span>Up Đề / Tạo Bằng AI</span>
                </button>
              </div>

              {createMethod === 'ai' && (
                <div className="p-4 rounded-2xl bg-white/[0.03] border border-purple-500/30 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <span className="text-xs font-bold text-purple-300 flex items-center gap-1.5">
                      <Wand2 className="w-3.5 h-3.5" />
                      Tải tệp đề thi (.pdf, .doc, .docx, .txt, .md, .csv) hoặc dán nội dung
                    </span>
                    <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl glass-button text-xs font-semibold text-purple-200 cursor-pointer">
                      <Upload className="w-3.5 h-3.5" />
                      <span>Chọn Tệp Đề Thi</span>
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx,.txt,.md,.csv,.rtf"
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
                    placeholder="Dán nội dung đề thi hoặc tài liệu ôn tập vào đây..."
                    className="w-full p-3 rounded-xl bg-white/[0.04] border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-purple-400"
                  />

                  {!import.meta.env.VITE_GEMINI_API_KEY && (
                    <input
                      type="password"
                      value={geminiApiKey}
                      onChange={(e) => setGeminiApiKey(e.target.value)}
                      placeholder="Gemini API Key (tùy chọn - dùng để AI trích xuất từ PDF/DOC/DOCX hoặc văn bản tự do)"
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
                          <span>AI đang tạo câu hỏi...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Tạo Danh Sách Câu Hỏi</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Danh sách câu hỏi soạn thảo / xem lại & duyệt */}
              <div ref={questionsSectionRef} className="space-y-3 pt-1">
                {aiGeneratedNotice && (
                  <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 shrink-0" />
                    <span>{aiGeneratedNotice}</span>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-300">
                    {createMethod === 'ai'
                      ? `Xem lại, chỉnh sửa & duyệt bộ đề (${draftQuestions.length} câu)`
                      : `Danh sách câu hỏi (${draftQuestions.length} câu)`}
                  </span>
                  <button
                    type="button"
                    onClick={() => setDraftQuestions((prev) => [...prev, EMPTY_QUESTION()])}
                    className="px-3 py-1.5 rounded-xl glass-button text-xs font-semibold text-purple-200 flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Thêm Câu Hỏi</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {draftQuestions.map((q, qIdx) => (
                    <div
                      key={q.id}
                      className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-2.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-purple-300">
                          Câu #{qIdx + 1}
                        </span>
                        {draftQuestions.length > 1 && (
                          <button
                            type="button"
                            onClick={() =>
                              setDraftQuestions((prev) => prev.filter((_, i) => i !== qIdx))
                            }
                            className="text-rose-400 hover:text-rose-300 text-xs flex items-center gap-1 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Xóa</span>
                          </button>
                        )}
                      </div>

                      <input
                        type="text"
                        placeholder="Nội dung câu hỏi *"
                        value={q.question}
                        onChange={(e) => updateDraftQuestion(qIdx, 'question', e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-white/[0.04] border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-purple-400"
                      />

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {q.options.map((opt, optIdx) => (
                          <div key={optIdx} className="flex items-center gap-2">
                            <input
                              type="radio"
                              name={`correct-${q.id}`}
                              checked={q.correctIndex === optIdx}
                              onChange={() => updateDraftQuestion(qIdx, 'correctIndex', optIdx)}
                              title="Chọn làm đáp án đúng"
                              className="accent-emerald-500 cursor-pointer shrink-0"
                            />
                            <input
                              type="text"
                              placeholder={`Đáp án ${'ABCD'[optIdx]} *`}
                              value={opt}
                              onChange={(e) => updateDraftOption(qIdx, optIdx, e.target.value)}
                              className="w-full px-3 py-2 rounded-xl bg-white/[0.04] border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-purple-400"
                            />
                          </div>
                        ))}
                      </div>

                      <input
                        type="text"
                        placeholder="Giải thích đáp án (tùy chọn)"
                        value={q.explanation}
                        onChange={(e) => updateDraftQuestion(qIdx, 'explanation', e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-white/[0.04] border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-purple-400"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl glass-button text-xs font-semibold text-slate-300 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSavingExam}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-emerald-500/25 disabled:opacity-50 cursor-pointer"
                >
                  {isSavingExam ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Save className="w-3.5 h-3.5" />
                  )}
                  <span>Lưu Đề Thi</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
