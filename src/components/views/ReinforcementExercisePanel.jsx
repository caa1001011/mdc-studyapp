import React, { useState, useEffect, useMemo } from 'react';
import {
  ClipboardCheck,
  Plus,
  Pencil,
  Trash2,
  Sparkles,
  Loader2,
  Save,
  X,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  RotateCcw,
  ListChecks,
  ToggleLeft,
  Lock,
  Globe,
  BookOpen
} from 'lucide-react';
import {
  saveReinforcementExercise,
  deleteReinforcementExercise,
  generateReinforcementExerciseFromDocument,
  normalizeTfQuestion,
  isEnglishSubject,
  canUserSeeExercise
} from '../../services/exerciseService';
import { useConfirmDelete } from '../ConfirmDeleteProvider';
import { formatMathText } from '../../utils/mathFormat';

const EMPTY_MC_QUESTION = () => ({
  id: `mc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
  question: '',
  options: ['', '', '', ''],
  correctIndex: 0,
  explanation: '',
});

const EMPTY_TF_ITEM = () => ({
  id: `tfi-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  text: '',
  isTrue: true,
});

const EMPTY_TF_QUESTION = () => ({
  id: `tf-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
  prompt: '',
  items: [EMPTY_TF_ITEM(), EMPTY_TF_ITEM(), EMPTY_TF_ITEM(), EMPTY_TF_ITEM()],
  explanation: '',
});

const getSubItemLabel = (index) => `${String.fromCharCode(97 + (index % 26))})`;

const OPTION_LABELS = ['A', 'B', 'C', 'D'];

// Chấm điểm câu Đúng/Sai chuẩn (mỗi câu tối đa 1,0 điểm):
// Đúng 1 ý: 0,1đ | Đúng 2 ý: 0,25đ | Đúng 3 ý: 0,5đ | Đúng cả 4 ý: 1,0đ
function scoreTrueFalseQuestion(correctItems, totalItems) {
  if (totalItems <= 0 || correctItems <= 0) return 0;
  if (totalItems === 4) {
    const table = [0, 0.1, 0.25, 0.5, 1.0];
    return table[Math.min(4, correctItems)] ?? 0;
  }
  if (correctItems >= totalItems) return 1.0;
  if (correctItems === 1) return 0.1;
  if (correctItems === 2) return 0.25;
  if (correctItems === 3) return 0.5;
  return Number((correctItems / totalItems).toFixed(2));
}

function formatScore(val) {
  return Number(Number(val || 0).toFixed(2))
    .toString()
    .replace('.', ',');
}

export default function ReinforcementExercisePanel({
  subject,
  exercises = [],
  lessonFolders = [],
  initialAiLesson = '',
  onClearInitialAiLesson,
  isLoading = false,
  isAdmin = false,
  username = 'student',
  onExercisesChange,
}) {
  const { requestDelete } = useConfirmDelete();
  const isEnglish = isEnglishSubject(subject);
  const defaultAiMc = isEnglish ? 10 : 8;
  const defaultAiTf = isEnglish ? 0 : 2;

  // Chỉ hiển thị các bài tập toàn hệ thống + bài tập AI cá nhân của chính tài khoản đang đăng nhập
  const visibleExercises = useMemo(
    () => exercises.filter((ex) => canUserSeeExercise(ex, username)),
    [exercises, username]
  );

  // Danh sách tên bài học (unique) trong môn để chọn khi tạo câu hỏi bằng AI
  const availableLessonNames = useMemo(() => {
    const seen = new Set();
    const names = [];
    (lessonFolders || []).forEach((f) => {
      const name = String(f?.name || '').trim();
      if (!name) return;
      const key = name.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        names.push(name);
      }
    });
    return names.sort((a, b) => a.localeCompare(b, 'vi', { numeric: true }));
  }, [lessonFolders]);

  // Chế độ làm bài (người học & admin đều có thể mở làm thử)
  const [activeExercise, setActiveExercise] = useState(null);
  const [mcAnswers, setMcAnswers] = useState({});
  const [tfAnswers, setTfAnswers] = useState({});
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Modal tạo câu hỏi củng cố bằng AI theo bài học (dành cho CẢ Học sinh và Quản trị viên)
  const [isQuickAiOpen, setIsQuickAiOpen] = useState(() => Boolean(initialAiLesson));
  const [quickAiLesson, setQuickAiLesson] = useState(() => initialAiLesson || '');
  const [quickAiCustomTopic, setQuickAiCustomTopic] = useState('');
  const [quickAiExtraText, setQuickAiExtraText] = useState('');
  const [isQuickGenerating, setIsQuickGenerating] = useState(false);
  const [quickAiError, setQuickAiError] = useState('');

  // Modal tạo / chỉnh sửa bài tập (chỉ dành cho Admin)
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingExercise, setEditingExercise] = useState(null);
  const [editorMode, setEditorMode] = useState('manual'); // 'manual' | 'ai'
  const [title, setTitle] = useState('');
  const [draftMc, setDraftMc] = useState([EMPTY_MC_QUESTION()]);
  const [draftTf, setDraftTf] = useState([EMPTY_TF_QUESTION()]);
  const [aiPreviewReady, setAiPreviewReady] = useState(false);

  const [editorError, setEditorError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const openQuickAiModal = (preselectedLesson = '') => {
    const firstAvailable = preselectedLesson || availableLessonNames[0] || '';
    setQuickAiLesson(firstAvailable);
    setQuickAiCustomTopic('');
    setQuickAiExtraText('');
    setQuickAiError('');
    setIsQuickAiOpen(true);
  };

  useEffect(() => {
    if (initialAiLesson && onClearInitialAiLesson) {
      onClearInitialAiLesson();
    }
  }, [initialAiLesson, onClearInitialAiLesson]);

  const handleQuickGenerateWithAI = async (e) => {
    e.preventDefault();
    setQuickAiError('');

    const chosenLesson = (quickAiLesson === '__custom__' ? quickAiCustomTopic : quickAiLesson || quickAiCustomTopic).trim();
    if (!chosenLesson && !quickAiExtraText.trim()) {
      setQuickAiError('Vui lòng chọn bài học hoặc nhập tên bài cần tạo câu hỏi củng cố.');
      return;
    }

    setIsQuickGenerating(true);
    try {
      const result = await generateReinforcementExerciseFromDocument({
        text: quickAiExtraText,
        lessonTitle: chosenLesson,
        mcCount: defaultAiMc,
        tfCount: defaultAiTf,
        subjectName: subject?.name || '',
        isEnglish,
      });

      if (isAdmin) {
        // Quản trị viên: mở giao diện xem trước & chỉnh sửa rồi đăng áp dụng cho toàn hệ thống
        setEditingExercise(null);
        setEditorMode('ai');
        setTitle(chosenLesson || `Bài tập củng cố ${subject?.name || ''}`);
        setDraftMc(result.mcQuestions || []);
        setDraftTf(result.tfQuestions || []);
        setAiPreviewReady(true);
        setEditorError('');
        setIsQuickAiOpen(false);
        setIsEditorOpen(true);
      } else {
        // Học sinh: tự động lưu riêng cho tài khoản học sinh đó và mở làm bài ngay
        const exerciseTitle = chosenLesson
          ? `${chosenLesson} (AI củng cố)`
          : `AI củng cố • ${subject?.name || 'Bài học'}`;
        const saved = await saveReinforcementExercise({
          subjectId: subject.id,
          subjectName: subject.name,
          title: exerciseTitle,
          lessonName: chosenLesson,
          mcQuestions: result.mcQuestions || [],
          tfQuestions: result.tfQuestions || [],
          creationMethod: 'ai',
          scope: 'personal',
          ownerUsername: username,
          createdBy: username,
        });

        if (onExercisesChange) {
          onExercisesChange((prev) => [...prev.filter((item) => item.id !== saved.id), saved]);
        }
        setIsQuickAiOpen(false);
        handleOpenExercise(saved);
      }
    } catch (err) {
      setQuickAiError(err.message || 'Không thể tạo câu hỏi củng cố bằng AI.');
    } finally {
      setIsQuickGenerating(false);
    }
  };

  const openCreateModal = () => {
    setEditingExercise(null);
    setEditorMode('manual');
    setTitle('');
    setDraftMc([EMPTY_MC_QUESTION()]);
    setDraftTf(isEnglish ? [] : [EMPTY_TF_QUESTION()]);
    setAiPreviewReady(false);
    setEditorError('');
    setIsEditorOpen(true);
  };

  const openEditModal = (exercise, e) => {
    if (e) e.stopPropagation();
    setEditingExercise(exercise);
    setEditorMode('manual');
    setTitle(exercise.title || '');
    setDraftMc(
      Array.isArray(exercise.mcQuestions)
        ? exercise.mcQuestions.map((q) => ({
            ...EMPTY_MC_QUESTION(),
            ...q,
            question: formatMathText(q.question || ''),
            options: Array.isArray(q.options)
              ? [0, 1, 2, 3].map((i) => formatMathText(q.options[i] || ''))
              : ['', '', '', ''],
            explanation: formatMathText(q.explanation || ''),
          }))
        : []
    );
    setDraftTf(
      Array.isArray(exercise.tfQuestions)
        ? exercise.tfQuestions.map((q, idx) => normalizeTfQuestion(q, idx))
        : []
    );
    setAiPreviewReady(false);
    setEditorError('');
    setIsEditorOpen(true);
  };

  const handleSaveExercise = async (e) => {
    e.preventDefault();
    setEditorError('');

    if (!title.trim()) {
      setEditorError('Vui lòng nhập tiêu đề bài tập củng cố.');
      return;
    }

    const validMc = draftMc
      .filter((q) => q.question.trim() && q.options.some((o) => o.trim()))
      .map((q) => ({
        ...q,
        question: formatMathText(q.question.trim()),
        options: q.options.map((o) => formatMathText(o.trim())),
        explanation: formatMathText((q.explanation || '').trim()),
      }));

    const validTf = draftTf
      .map((q) => ({
        ...q,
        prompt: formatMathText((q.prompt || '').trim()),
        items: (q.items || [])
          .filter((it) => (it.text || '').trim())
          .map((it) => ({
            ...it,
            text: formatMathText(it.text.trim()),
            isTrue: Boolean(it.isTrue),
          })),
        explanation: formatMathText((q.explanation || '').trim()),
      }))
      .filter((q) => q.items.length > 0);

    if (validMc.length === 0 && validTf.length === 0) {
      setEditorError('Vui lòng thêm ít nhất 1 câu trắc nghiệm 4 lựa chọn hoặc 1 câu Đúng/Sai.');
      return;
    }

    setIsSaving(true);
    try {
      const saved = await saveReinforcementExercise({
        id: editingExercise?.id,
        subjectId: subject.id,
        subjectName: subject.name,
        title: title.trim(),
        mcQuestions: validMc,
        tfQuestions: validTf,
        creationMethod: editingExercise?.creationMethod || editorMode,
        scope: editingExercise?.scope || 'global',
        ownerUsername: editingExercise?.ownerUsername || '',
        createdBy: editingExercise?.createdBy || username,
        createdAt: editingExercise?.createdAt || '',
      });

      if (onExercisesChange) {
        onExercisesChange((prev) => {
          const exists = prev.some((item) => item.id === saved.id);
          return exists
            ? prev.map((item) => (item.id === saved.id ? saved : item))
            : [...prev, saved];
        });
      }

      if (activeExercise?.id === saved.id) {
        setActiveExercise(saved);
      }
      setIsEditorOpen(false);
    } catch (err) {
      setEditorError(err.message || 'Không thể lưu bài tập củng cố.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteExercise = (exercise, e) => {
    if (e) e.stopPropagation();
    const isOwnPersonal =
      exercise.scope === 'personal' &&
      (exercise.ownerUsername === username || exercise.createdBy === username);
    if (!isAdmin && !isOwnPersonal) return;
    const prevActive = activeExercise;
    let backupList = null;

    requestDelete({
      title: 'Xác nhận xóa bài tập',
      message: `Bạn có chắc chắn muốn xóa bài tập "${exercise.title}"?`,
      itemLabel: `Đã xóa "${exercise.title}"`,
      onOptimisticDelete: () => {
        if (onExercisesChange) {
          onExercisesChange((prev) => {
            backupList = prev;
            return prev.filter((item) => item.id !== exercise.id);
          });
        }
        if (activeExercise?.id === exercise.id) {
          setActiveExercise(null);
        }
      },
      onUndo: () => {
        if (onExercisesChange && backupList) {
          onExercisesChange(backupList);
        }
        if (prevActive?.id === exercise.id) {
          setActiveExercise(prevActive);
        }
      },
      onCommitDelete: async () => {
        await deleteReinforcementExercise(exercise.id);
      },
    });
  };

  const handleOpenExercise = (exercise) => {
    setActiveExercise(exercise);
    setMcAnswers({});
    setTfAnswers({});
    setIsSubmitted(false);
  };

  const handleRetry = () => {
    setMcAnswers({});
    setTfAnswers({});
    setIsSubmitted(false);
  };

  // ============================================================================
  // CHẾ ĐỘ LÀM BÀI TẬP CỦNG CỐ
  // ============================================================================
  if (activeExercise) {
    const mcList = (activeExercise.mcQuestions || []).map((q) => ({
      ...q,
      question: formatMathText(q.question || ''),
      options: (q.options || []).map((o) => formatMathText(o || '')),
      explanation: formatMathText(q.explanation || ''),
    }));
    const tfList = (activeExercise.tfQuestions || [])
      .map((q, idx) => normalizeTfQuestion(q, idx))
      .filter(Boolean);
    const allTfItems = tfList.flatMap((q) => q.items || []);
    const totalCount = mcList.length + allTfItems.length;

    let mcCorrectCount = 0;
    let tfScore = 0;
    const tfQuestionScores = {};

    if (isSubmitted) {
      mcList.forEach((q) => {
        if (mcAnswers[q.id] === q.correctIndex) mcCorrectCount += 1;
      });
      tfList.forEach((q) => {
        const items = q.items || [];
        let qCorrect = 0;
        items.forEach((item) => {
          if (tfAnswers[item.id] === item.isTrue) qCorrect += 1;
        });
        const qScore = scoreTrueFalseQuestion(qCorrect, items.length);
        tfScore += qScore;
        tfQuestionScores[q.id] = { correct: qCorrect, total: items.length, score: qScore };
      });
    }

    const mcScore = mcCorrectCount * 1.0;
    const totalScore = mcScore + tfScore;
    const maxScore = mcList.length * 1.0 + tfList.length * 1.0;

    const answeredCount =
      mcList.filter((q) => mcAnswers[q.id] !== undefined).length +
      allTfItems.filter((item) => tfAnswers[item.id] !== undefined).length;

    return (
      <div className="space-y-5">
        {/* Thanh đầu trang làm bài */}
        <div className="p-4 rounded-2xl glass-card border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setActiveExercise(null)}
              className="px-3 py-1.5 rounded-xl glass-button text-xs font-semibold flex items-center gap-1.5 cursor-pointer shrink-0"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Danh sách</span>
            </button>
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-bold font-display text-white truncate">
                {activeExercise.title}
              </h3>
              <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5 flex-wrap">
                <span>{mcList.length} câu trắc nghiệm</span>
                <span>•</span>
                <span>{tfList.length} câu Đúng/Sai</span>
              </div>
            </div>
          </div>

          {isSubmitted ? (
            <div className="flex items-center gap-2 flex-wrap shrink-0">
              <span className="px-3 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-400/35 text-emerald-300 text-xs font-bold">
                Điểm: {formatScore(totalScore)} / {formatScore(maxScore)}
                <span className="font-normal opacity-85 ml-1.5">
                  (TN: {formatScore(mcScore)}đ • Đ/S: {formatScore(tfScore)}đ)
                </span>
              </span>
              <button
                type="button"
                onClick={handleRetry}
                className="px-3 py-1.5 rounded-xl glass-button text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Làm lại</span>
              </button>
            </div>
          ) : (
            <span className="text-xs font-semibold text-purple-300 shrink-0">
              Đã chọn: {answeredCount}/{totalCount} câu
            </span>
          )}
        </div>

        {/* Phần I: Trắc nghiệm 4 lựa chọn */}
        {mcList.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-purple-300 flex items-center gap-2">
              <ListChecks className="w-4 h-4" />
              <span>Phần I. Trắc nghiệm 4 lựa chọn ({mcList.length} câu)</span>
            </h4>

            <div className="space-y-3">
              {mcList.map((q, idx) => {
                const selectedOpt = mcAnswers[q.id];
                const isCorrect = isSubmitted && selectedOpt === q.correctIndex;
                return (
                  <div
                    key={q.id || idx}
                    className="p-4 rounded-2xl glass-card border border-white/10 space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-xs sm:text-sm font-bold text-white leading-relaxed">
                        <span className="text-purple-300 mr-1.5">Câu {idx + 1}:</span>
                        {q.question}
                      </p>
                      {isSubmitted && (
                        isCorrect ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        ) : (
                          <XCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                        )
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {(q.options || []).map((opt, optIdx) => {
                        const isPicked = selectedOpt === optIdx;
                        const isRightOpt = q.correctIndex === optIdx;
                        let styleClass =
                          'bg-white/[0.03] border-white/10 text-slate-300 hover:border-purple-400/40';

                        if (isSubmitted) {
                          if (isRightOpt) {
                            styleClass = 'bg-emerald-500/20 border-emerald-400/60 text-emerald-200 font-semibold';
                          } else if (isPicked && !isRightOpt) {
                            styleClass = 'bg-rose-500/20 border-rose-400/60 text-rose-200';
                          }
                        } else if (isPicked) {
                          styleClass = 'bg-purple-600/25 border-purple-400/70 text-white font-semibold';
                        }

                        return (
                          <button
                            key={optIdx}
                            type="button"
                            disabled={isSubmitted}
                            onClick={() => setMcAnswers((prev) => ({ ...prev, [q.id]: optIdx }))}
                            className={`p-3 rounded-xl border text-left text-xs sm:text-sm transition-all flex items-start gap-2.5 ${
                              isSubmitted ? 'cursor-default' : 'cursor-pointer'
                            } ${styleClass}`}
                          >
                            <span className="w-5 h-5 rounded-md bg-white/10 flex items-center justify-center text-[11px] font-bold shrink-0">
                              {OPTION_LABELS[optIdx]}
                            </span>
                            <span className="leading-snug">{opt}</span>
                          </button>
                        );
                      })}
                    </div>

                    {isSubmitted && q.explanation && (
                      <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-400/25 text-xs text-slate-300 leading-relaxed whitespace-pre-line">
                        <strong className="text-emerald-300">Giải thích:</strong>{' '}
                        {q.explanation}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Phần II: Câu hỏi Đúng / Sai (dạng bảng mệnh đề a, b, c, d...) */}
        {tfList.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-cyan-300 flex items-center gap-2">
              <ToggleLeft className="w-4 h-4" />
              <span>Phần II. Câu hỏi Đúng / Sai ({tfList.length} câu)</span>
            </h4>

            <div className="space-y-4">
              {tfList.map((q, idx) => {
                const qStat = tfQuestionScores[q.id];
                return (
                <div
                  key={q.id || idx}
                  className="p-4 rounded-2xl glass-card border border-white/10 space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-xs sm:text-sm font-bold text-white leading-relaxed">
                      <span className="text-cyan-300 mr-1.5">Câu {idx + 1}:</span>
                      {q.prompt || 'Xét tính đúng/sai của các mệnh đề sau:'}
                    </p>
                    {isSubmitted && qStat && (
                      <span className="px-2.5 py-1 rounded-lg bg-cyan-500/15 border border-cyan-400/30 text-cyan-300 text-[11px] font-bold shrink-0">
                        +{formatScore(qStat.score)}đ ({qStat.correct}/{qStat.total} ý)
                      </span>
                    )}
                  </div>

                  <div className="overflow-x-auto rounded-xl border border-white/10">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-purple-500/10 border-b border-white/10 text-[11px] sm:text-xs font-bold text-purple-300">
                          <th className="py-2.5 px-3 w-12 text-center border-r border-white/10">Ý</th>
                          <th className="py-2.5 px-3 border-r border-white/10">Nội dung khẳng định</th>
                          <th className="py-2.5 px-3 w-20 text-center border-r border-white/10">Đúng</th>
                          <th className="py-2.5 px-3 w-20 text-center">Sai</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/10 text-xs sm:text-sm">
                        {(q.items || []).map((item, subIdx) => {
                          const picked = tfAnswers[item.id];
                          const isItemCorrect = isSubmitted && picked === item.isTrue;
                          return (
                            <tr
                              key={item.id || subIdx}
                              className={
                                isSubmitted
                                  ? isItemCorrect
                                    ? 'bg-emerald-500/[0.06]'
                                    : 'bg-rose-500/[0.06]'
                                  : 'hover:bg-white/[0.02]'
                              }
                            >
                              <td className="py-2.5 px-3 text-center font-bold text-white border-r border-white/10 align-middle">
                                {getSubItemLabel(subIdx)}
                              </td>
                              <td className="py-2.5 px-3 text-slate-200 border-r border-white/10 align-middle leading-relaxed">
                                <div className="flex items-start justify-between gap-2">
                                  <span>{item.text}</span>
                                  {isSubmitted &&
                                    (isItemCorrect ? (
                                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                                    ) : (
                                      <XCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                                    ))}
                                </div>
                              </td>
                              {[true, false].map((val) => {
                                const isPicked = picked === val;
                                const isRightVal = item.isTrue === val;
                                let cellBtnClass =
                                  'border-white/20 bg-white/[0.04] text-slate-400 hover:border-cyan-400/60';
                                if (isSubmitted) {
                                  if (isRightVal) {
                                    cellBtnClass =
                                      'border-emerald-400 bg-emerald-500/25 text-emerald-300 font-bold';
                                  } else if (isPicked && !isRightVal) {
                                    cellBtnClass =
                                      'border-rose-400 bg-rose-500/25 text-rose-300 font-bold';
                                  }
                                } else if (isPicked) {
                                  cellBtnClass =
                                    'border-cyan-400 bg-cyan-500/25 text-cyan-200 font-bold';
                                }

                                return (
                                  <td
                                    key={String(val)}
                                    className={`py-2 px-2 text-center align-middle ${
                                      val ? 'border-r border-white/10' : ''
                                    }`}
                                  >
                                    <button
                                      type="button"
                                      disabled={isSubmitted}
                                      onClick={() =>
                                        setTfAnswers((prev) => ({ ...prev, [item.id]: val }))
                                      }
                                      className={`w-7 h-7 mx-auto rounded-lg border flex items-center justify-center text-xs transition-all ${
                                        isSubmitted ? 'cursor-default' : 'cursor-pointer'
                                      } ${cellBtnClass}`}
                                      aria-label={val ? 'Đúng' : 'Sai'}
                                    >
                                      {isPicked || (isSubmitted && isRightVal) ? '✓' : ''}
                                    </button>
                                  </td>
                                );
                              })}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {isSubmitted && q.explanation && (
                    <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-400/25 text-xs text-slate-300 leading-relaxed whitespace-pre-line">
                      <strong className="text-emerald-300">Giải thích:</strong>{' '}
                      {q.explanation}
                    </div>
                  )}
                </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Thanh nộp bài */}
        <div className="flex items-center justify-end gap-2.5 pt-2">
          {!isSubmitted ? (
            <button
              type="button"
              onClick={() => setIsSubmitted(true)}
              disabled={answeredCount === 0}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-xs sm:text-sm font-bold shadow-lg shadow-purple-600/25 disabled:opacity-50 cursor-pointer"
            >
              Nộp bài &amp; Xem kết quả
            </button>
          ) : (
            <button
              type="button"
              onClick={handleRetry}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-xs sm:text-sm font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Làm lại bài tập</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  // ============================================================================
  // DANH SÁCH BÀI TẬP CỦNG CỐ + MODAL TẠO / CHỈNH SỬA (ADMIN)
  // ============================================================================
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-2">
          <ClipboardCheck className="w-4 h-4 text-purple-300" />
          <h3 className="text-sm font-bold font-display text-white">
            Danh sách bài tập củng cố ({visibleExercises.length})
          </h3>
        </div>

        <div className="flex items-center gap-2 flex-wrap self-start sm:self-auto">
          <button
            type="button"
            onClick={() => openQuickAiModal()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold shadow-md shadow-purple-600/20 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Tạo Câu Hỏi Bằng AI</span>
          </button>

          {isAdmin && (
            <button
              type="button"
              onClick={openCreateModal}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl glass-button border border-purple-400/30 text-purple-200 hover:text-white text-xs font-bold cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tạo Thủ Công</span>
            </button>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="py-10 text-center text-xs text-slate-400 space-y-2">
          <Loader2 className="w-6 h-6 text-purple-400 animate-spin mx-auto" />
          <p>Đang tải bài tập củng cố...</p>
        </div>
      ) : visibleExercises.length === 0 ? (
        <div className="py-10 text-center text-xs sm:text-sm text-slate-400 border border-dashed border-white/10 rounded-2xl space-y-3">
          <p>Chưa có bài tập củng cố kiến thức nào trong môn {subject?.name}.</p>
          <button
            type="button"
            onClick={() => openQuickAiModal()}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs font-bold shadow-md shadow-purple-600/20 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Tạo bộ câu hỏi đầu tiên bằng AI</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {visibleExercises.map((ex) => {
            const mcCount = ex.mcQuestions?.length || 0;
            const tfCount = ex.tfQuestions?.length || 0;
            const isPersonal = ex.scope === 'personal';
            const canDeleteThis =
              isAdmin ||
              (isPersonal && (ex.ownerUsername === username || ex.createdBy === username));

            return (
              <div
                key={ex.id}
                onClick={() => handleOpenExercise(ex)}
                className="p-4 rounded-2xl glass-card border border-white/10 hover:border-purple-400/50 cursor-pointer transition-all flex items-center justify-between gap-3 group"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div
                    className={`p-2.5 rounded-xl border shrink-0 ${
                      isPersonal
                        ? 'bg-cyan-500/15 border-cyan-400/30 text-cyan-300'
                        : 'bg-purple-500/15 border-purple-500/30 text-purple-300'
                    }`}
                  >
                    {isPersonal ? (
                      <Sparkles className="w-4 h-4" />
                    ) : (
                      <ClipboardCheck className="w-4 h-4" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <h4 className="text-xs sm:text-sm font-bold text-white truncate group-hover:text-purple-300 transition-colors">
                        {ex.title}
                      </h4>
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-0.5 flex-wrap">
                      <span>{mcCount} trắc nghiệm</span>
                      {tfCount > 0 && (
                        <>
                          <span>•</span>
                          <span>{tfCount} đúng/sai</span>
                        </>
                      )}
                      {isPersonal && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-cyan-500/15 border border-cyan-400/30 text-[10px] font-semibold text-cyan-300">
                          <Lock className="w-2.5 h-2.5" />
                          Riêng bạn
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-xs font-semibold text-purple-300 mr-1">
                    Làm bài →
                  </span>
                  {isAdmin && !isPersonal && (
                    <button
                      type="button"
                      onClick={(e) => openEditModal(ex, e)}
                      className="p-1.5 rounded-xl glass-button text-purple-300 hover:text-white cursor-pointer"
                      title="Chỉnh sửa bài tập"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                  )}
                  {canDeleteThis && (
                    <button
                      type="button"
                      onClick={(e) => handleDeleteExercise(ex, e)}
                      className="p-1.5 rounded-xl glass-button text-rose-400 hover:bg-rose-500/20 cursor-pointer"
                      title="Xóa bài tập"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL TẠO / CHỈNH SỬA BÀI TẬP CỦNG CỐ (ADMIN) */}
      {isAdmin && isEditorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/45 dark:bg-black/75 backdrop-blur-md">
          <div className="w-full max-w-4xl max-h-[92vh] flex flex-col rounded-3xl bg-white dark:bg-[#111322] border border-slate-200 dark:border-white/20 shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
              <div>
                <h3 className="text-base sm:text-lg font-bold font-display text-white">
                  {editingExercise
                    ? `Chỉnh Sửa Bài Tập • ${editingExercise.title}`
                    : `Tạo Bài Tập Củng Cố • ${subject?.name}`}
                </h3>
                <p className="text-xs text-slate-400">
                  {aiPreviewReady
                    ? 'Xem trước và chỉnh sửa bộ câu hỏi AI vừa tạo trước khi đăng lên hệ thống'
                    : 'Soạn thủ công câu hỏi trắc nghiệm 4 lựa chọn và câu hỏi Đúng / Sai'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => !isSaving && setIsEditorOpen(false)}
                className="p-2 rounded-xl glass-button text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <form onSubmit={handleSaveExercise} className="flex-1 overflow-y-auto p-6 space-y-5">
              {editorError && (
                <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs font-semibold">
                  {editorError}
                </div>
              )}

              {/* Tiêu đề bài tập */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Tiêu đề bài tập củng cố *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="VD: Bài tập củng cố Chương 1 - Hàm số lượng giác"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.05] border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-purple-400"
                />
              </div>

              {aiPreviewReady && (
                <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-400/35 text-xs text-emerald-300 font-semibold">
                  ✓ AI đã tạo xem trước {draftMc.length} câu trắc nghiệm và {draftTf.length} câu Đúng/Sai. Hãy kiểm tra, chỉnh sửa trực tiếp bên dưới trước khi đăng lên hệ thống!
                </div>
              )}

              {/* PHẦN I: TRẮC NGHIỆM 4 LỰA CHỌN */}
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-purple-300 flex items-center gap-1.5">
                    <ListChecks className="w-4 h-4" />
                    <span>Phần I: Trắc nghiệm 4 lựa chọn ({draftMc.length} câu)</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setDraftMc((prev) => [...prev, EMPTY_MC_QUESTION()])}
                    className="px-3 py-1.5 rounded-xl glass-button text-xs font-semibold text-purple-300 hover:text-white flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Thêm câu trắc nghiệm</span>
                  </button>
                </div>

                {draftMc.length === 0 ? (
                  <div className="p-4 rounded-2xl border border-dashed border-white/10 text-center text-xs text-slate-400">
                    Chưa có câu trắc nghiệm 4 lựa chọn nào.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {draftMc.map((q, idx) => (
                      <div
                        key={q.id || idx}
                        className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-2.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-purple-300">
                            Câu trắc nghiệm #{idx + 1}
                          </span>
                          <button
                            type="button"
                            onClick={() => setDraftMc((prev) => prev.filter((_, i) => i !== idx))}
                            className="text-rose-400 hover:text-rose-300 p-1 cursor-pointer"
                            title="Xóa câu này"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <input
                          type="text"
                          value={q.question}
                          onChange={(e) =>
                            setDraftMc((prev) =>
                              prev.map((item, i) =>
                                i === idx ? { ...item, question: e.target.value } : item
                              )
                            )
                          }
                          placeholder="Nhập nội dung câu hỏi trắc nghiệm *"
                          className="w-full px-3 py-2 rounded-xl bg-white/[0.04] border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-purple-400"
                        />

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {OPTION_LABELS.map((label, optIdx) => {
                            const isCorrect = q.correctIndex === optIdx;
                            return (
                              <div key={label} className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setDraftMc((prev) =>
                                      prev.map((item, i) =>
                                        i === idx ? { ...item, correctIndex: optIdx } : item
                                      )
                                    )
                                  }
                                  className={`w-7 h-7 rounded-lg text-xs font-bold shrink-0 border transition-all cursor-pointer ${
                                    isCorrect
                                      ? 'bg-emerald-500/25 border-emerald-400 text-emerald-300'
                                      : 'bg-white/[0.04] border-white/10 text-slate-400 hover:text-white'
                                  }`}
                                  title="Chọn làm đáp án đúng"
                                >
                                  {label}
                                </button>
                                <input
                                  type="text"
                                  value={q.options[optIdx] || ''}
                                  onChange={(e) =>
                                    setDraftMc((prev) =>
                                      prev.map((item, i) => {
                                        if (i !== idx) return item;
                                        const nextOpts = [...item.options];
                                        nextOpts[optIdx] = e.target.value;
                                        return { ...item, options: nextOpts };
                                      })
                                    )
                                  }
                                  placeholder={`Phương án ${label}${isCorrect ? ' (Đáp án đúng)' : ''}`}
                                  className="flex-1 px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-purple-400"
                                />
                              </div>
                            );
                          })}
                        </div>

                        <textarea
                          rows={2}
                          value={q.explanation || ''}
                          onChange={(e) =>
                            setDraftMc((prev) =>
                              prev.map((item, i) =>
                                i === idx ? { ...item, explanation: e.target.value } : item
                              )
                            )
                          }
                          placeholder="Giải thích đáp án (tùy chọn - nhấn Enter để xuống dòng)"
                          className="w-full px-3 py-2 rounded-xl bg-white/[0.04] border border-white/10 text-white placeholder-slate-500 text-xs leading-relaxed resize-y focus:outline-none focus:border-purple-400"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* PHẦN II: CÂU HỎI ĐÚNG / SAI (1 ĐỀ BÀI + NHIỀU Ý a, b, c, d, e...) */}
              <div className="space-y-3 pt-2 border-t border-white/10">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-cyan-300 flex items-center gap-1.5">
                    <ToggleLeft className="w-4 h-4" />
                    <span>Phần II: Câu hỏi Đúng / Sai ({draftTf.length} câu)</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setDraftTf((prev) => [...prev, EMPTY_TF_QUESTION()])}
                    className="px-3 py-1.5 rounded-xl glass-button text-xs font-semibold text-cyan-300 hover:text-white flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Thêm câu Đúng/Sai</span>
                  </button>
                </div>

                {draftTf.length === 0 ? (
                  <div className="p-4 rounded-2xl border border-dashed border-white/10 text-center text-xs text-slate-400">
                    Chưa có câu hỏi Đúng / Sai nào.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {draftTf.map((q, idx) => (
                      <div
                        key={q.id || idx}
                        className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-3"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-bold text-cyan-300">
                            Câu Đúng/Sai #{idx + 1}
                          </span>
                          <button
                            type="button"
                            onClick={() => setDraftTf((prev) => prev.filter((_, i) => i !== idx))}
                            className="text-rose-400 hover:text-rose-300 p-1 cursor-pointer"
                            title="Xóa câu này"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <textarea
                          rows={2}
                          value={q.prompt || ''}
                          onChange={(e) =>
                            setDraftTf((prev) =>
                              prev.map((item, i) =>
                                i === idx ? { ...item, prompt: e.target.value } : item
                              )
                            )
                          }
                          placeholder="Nhập đề bài / câu dẫn chung (VD: Cho hai góc lượng giác a và b thỏa mãn... Xét tính đúng/sai của các mệnh đề sau:)"
                          className="w-full px-3 py-2 rounded-xl bg-white/[0.04] border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-cyan-400 resize-y"
                        />

                        {/* Bảng soạn các ý nhỏ a), b), c), d), e)... */}
                        <div className="overflow-x-auto rounded-xl border border-white/10">
                          <table className="w-full text-left border-collapse">
                            <thead>
                              <tr className="bg-cyan-500/10 border-b border-white/10 text-[11px] font-bold text-cyan-300">
                                <th className="py-2 px-2.5 w-11 text-center border-r border-white/10">Ý</th>
                                <th className="py-2 px-2.5 border-r border-white/10">Nội dung khẳng định</th>
                                <th className="py-2 px-2 w-16 text-center border-r border-white/10">Đúng</th>
                                <th className="py-2 px-2 w-16 text-center border-r border-white/10">Sai</th>
                                <th className="py-2 px-2 w-10 text-center">Xóa</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-white/10">
                              {(q.items || []).map((subItem, subIdx) => (
                                <tr key={subItem.id || subIdx}>
                                  <td className="py-2 px-2.5 text-center text-xs font-bold text-white border-r border-white/10">
                                    {getSubItemLabel(subIdx)}
                                  </td>
                                  <td className="py-1.5 px-2 border-r border-white/10">
                                    <input
                                      type="text"
                                      value={subItem.text}
                                      onChange={(e) =>
                                        setDraftTf((prev) =>
                                          prev.map((question, qIdx) => {
                                            if (qIdx !== idx) return question;
                                            const nextItems = (question.items || []).map((it, sIdx) =>
                                              sIdx === subIdx ? { ...it, text: e.target.value } : it
                                            );
                                            return { ...question, items: nextItems };
                                          })
                                        )
                                      }
                                      placeholder={`Nhập nội dung khẳng định ý ${getSubItemLabel(subIdx)} *`}
                                      className="w-full px-2.5 py-1.5 rounded-lg bg-white/[0.04] border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-cyan-400"
                                    />
                                  </td>
                                  <td className="py-1.5 px-2 text-center border-r border-white/10">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setDraftTf((prev) =>
                                          prev.map((question, qIdx) => {
                                            if (qIdx !== idx) return question;
                                            const nextItems = (question.items || []).map((it, sIdx) =>
                                              sIdx === subIdx ? { ...it, isTrue: true } : it
                                            );
                                            return { ...question, items: nextItems };
                                          })
                                        )
                                      }
                                      className={`w-7 h-7 mx-auto rounded-lg border text-xs font-bold flex items-center justify-center cursor-pointer ${
                                        subItem.isTrue
                                          ? 'bg-emerald-500/25 border-emerald-400 text-emerald-300'
                                          : 'bg-white/[0.04] border-white/10 text-slate-500 hover:text-white'
                                      }`}
                                      title="Đáp án Đúng"
                                    >
                                      {subItem.isTrue ? '✓' : ''}
                                    </button>
                                  </td>
                                  <td className="py-1.5 px-2 text-center border-r border-white/10">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setDraftTf((prev) =>
                                          prev.map((question, qIdx) => {
                                            if (qIdx !== idx) return question;
                                            const nextItems = (question.items || []).map((it, sIdx) =>
                                              sIdx === subIdx ? { ...it, isTrue: false } : it
                                            );
                                            return { ...question, items: nextItems };
                                          })
                                        )
                                      }
                                      className={`w-7 h-7 mx-auto rounded-lg border text-xs font-bold flex items-center justify-center cursor-pointer ${
                                        !subItem.isTrue
                                          ? 'bg-rose-500/25 border-rose-400 text-rose-300'
                                          : 'bg-white/[0.04] border-white/10 text-slate-500 hover:text-white'
                                      }`}
                                      title="Đáp án Sai"
                                    >
                                      {!subItem.isTrue ? '✓' : ''}
                                    </button>
                                  </td>
                                  <td className="py-1.5 px-2 text-center">
                                    {(q.items || []).length > 1 && (
                                      <button
                                        type="button"
                                        onClick={() =>
                                          setDraftTf((prev) =>
                                            prev.map((question, qIdx) =>
                                              qIdx === idx
                                                ? {
                                                    ...question,
                                                    items: (question.items || []).filter(
                                                      (_, sIdx) => sIdx !== subIdx
                                                    ),
                                                  }
                                                : question
                                            )
                                          )
                                        }
                                        className="p-1 text-rose-400 hover:text-rose-300 cursor-pointer"
                                        title="Xóa ý này"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        <div className="flex items-center justify-between gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              setDraftTf((prev) =>
                                prev.map((question, qIdx) =>
                                  qIdx === idx
                                    ? { ...question, items: [...(question.items || []), EMPTY_TF_ITEM()] }
                                    : question
                                )
                              )
                            }
                            className="px-2.5 py-1 rounded-lg glass-button text-[11px] font-semibold text-cyan-300 hover:text-white inline-flex items-center gap-1 cursor-pointer"
                          >
                            <Plus className="w-3 h-3" />
                            <span>Thêm ý ({getSubItemLabel((q.items || []).length)})</span>
                          </button>
                        </div>

                        <textarea
                          rows={3}
                          value={q.explanation || ''}
                          onChange={(e) =>
                            setDraftTf((prev) =>
                              prev.map((item, i) =>
                                i === idx ? { ...item, explanation: e.target.value } : item
                              )
                            )
                          }
                          placeholder="Giải thích đáp án chung cho câu này (tùy chọn - nhấn Enter để xuống dòng)"
                          className="w-full px-3 py-2 rounded-xl bg-white/[0.04] border border-white/10 text-white placeholder-slate-500 text-xs leading-relaxed resize-y focus:outline-none focus:border-cyan-400"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-white/10">
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={() => setIsEditorOpen(false)}
                  className="px-4 py-2.5 rounded-xl glass-button text-xs font-semibold text-slate-300 hover:text-white cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-xs font-bold shadow-lg shadow-emerald-600/25 flex items-center gap-1.5 disabled:opacity-60 cursor-pointer"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Đang lưu...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5" />
                      <span>{editingExercise ? 'Lưu Cập Nhật' : 'Đăng Bài Tập'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL TẠO CÂU HỎI CỦNG CỐ BẰNG AI (DÀNH CHO CẢ HỌC SINH & QUẢN TRỊ VIÊN) */}
      {isQuickAiOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/45 dark:bg-black/75 backdrop-blur-md">
          <div className="w-full max-w-lg rounded-3xl bg-white dark:bg-[#111322] border border-slate-200 dark:border-white/20 shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-purple-500/15 text-purple-600 dark:text-purple-300">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold font-display text-slate-900 dark:text-white">
                    Tạo Câu Hỏi Củng Cố Bằng AI
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {subject?.name}
                  </p>
                </div>
              </div>
              <button
                type="button"
                disabled={isQuickGenerating}
                onClick={() => setIsQuickAiOpen(false)}
                className="p-2 rounded-xl glass-button text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleQuickGenerateWithAI} className="p-6 space-y-4">
              {quickAiError && (
                <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-600 dark:text-rose-300 text-xs font-semibold">
                  {quickAiError}
                </div>
              )}

              {/* Thông tin cấu trúc mặc định & phạm vi áp dụng */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="p-3 rounded-2xl bg-indigo-50/70 dark:bg-purple-500/10 border border-indigo-200 dark:border-purple-400/25 space-y-1">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-purple-300 flex items-center gap-1">
                    <BookOpen className="w-3 h-3" />
                    <span>Cấu trúc câu hỏi</span>
                  </div>
                  <p className="text-xs font-semibold text-slate-800 dark:text-white">
                    {isEnglish
                      ? '10 câu trắc nghiệm 1 lựa chọn'
                      : '8 câu trắc nghiệm + 2 câu Đúng/Sai'}
                  </p>
                </div>

                <div
                  className={`p-3 rounded-2xl border space-y-1 ${
                    isAdmin
                      ? 'bg-emerald-50/70 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-400/25'
                      : 'bg-cyan-50/70 dark:bg-cyan-500/10 border-cyan-200 dark:border-cyan-400/25'
                  }`}
                >
                  <div
                    className={`text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 ${
                      isAdmin
                        ? 'text-emerald-700 dark:text-emerald-300'
                        : 'text-cyan-700 dark:text-cyan-300'
                    }`}
                  >
                    {isAdmin ? <Globe className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                    <span>Phạm vi áp dụng</span>
                  </div>
                  <p className="text-xs font-semibold text-slate-800 dark:text-white">
                    {isAdmin
                      ? `Toàn hệ thống (môn ${subject?.name})`
                      : 'Chỉ riêng tài khoản của bạn'}
                  </p>
                </div>
              </div>

              {/* Chọn bài học */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Chọn bài học cần củng cố *
                </label>
                {availableLessonNames.length > 0 ? (
                  <select
                    value={quickAiLesson}
                    onChange={(e) => setQuickAiLesson(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#181b2e] border border-slate-200 dark:border-white/15 text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:border-purple-400"
                  >
                    {availableLessonNames.map((name) => (
                      <option key={name} value={name}>
                        {name}
                      </option>
                    ))}
                    <option value="__custom__">Khác (tự nhập tên bài học / chủ đề)...</option>
                  </select>
                ) : null}

                {(availableLessonNames.length === 0 || quickAiLesson === '__custom__') && (
                  <input
                    type="text"
                    value={quickAiCustomTopic}
                    onChange={(e) => setQuickAiCustomTopic(e.target.value)}
                    placeholder="VD: Bài 2: Công thức lượng giác"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.05] border border-slate-200 dark:border-white/15 text-slate-900 dark:text-white placeholder-slate-400 text-xs focus:outline-none focus:border-purple-400"
                  />
                )}
              </div>

              {/* Nội dung bổ sung (tùy chọn) */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Ghi chú / nội dung trọng tâm bổ sung (tùy chọn)
                </label>
                <textarea
                  rows={3}
                  value={quickAiExtraText}
                  onChange={(e) => setQuickAiExtraText(e.target.value)}
                  placeholder="Bạn có thể để trống để AI tự tạo theo tên bài học, hoặc dán thêm lý thuyết/dạng bài muốn tập trung..."
                  className="w-full p-3 rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder-slate-400 text-xs focus:outline-none focus:border-purple-400"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-200 dark:border-white/10">
                <button
                  type="button"
                  disabled={isQuickGenerating}
                  onClick={() => setIsQuickAiOpen(false)}
                  className="px-4 py-2.5 rounded-xl glass-button text-xs font-semibold text-slate-600 dark:text-slate-300 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isQuickGenerating}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold shadow-lg shadow-purple-600/25 flex items-center gap-1.5 disabled:opacity-60 cursor-pointer"
                >
                  {isQuickGenerating ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>AI đang tạo 10 câu hỏi...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>
                        {isAdmin ? 'Tạo & Xem Trước (Toàn Hệ Thống)' : 'Tạo 10 Câu Hỏi & Làm Ngay'}
                      </span>
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
