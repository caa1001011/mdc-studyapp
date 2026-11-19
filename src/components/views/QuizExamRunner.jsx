import React, { useState, useEffect, useMemo } from 'react';
import {
  Clock,
  ArrowLeft,
  CheckCircle,
  XCircle,
  Award,
  RotateCcw,
  BookOpen,
  ListChecks,
  ToggleLeft,
  Hash,
  PenTool,
  Lightbulb,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  normalizeExamData,
  gradeExamSubmission,
  scoreTfQuestion,
  isRealNumberEqual,
  parseRealNumber,
} from '../../services/quizService';

const getItemLetter = (idx) => String.fromCharCode(97 + idx);

/**
 * Hiển thị 1 câu Đúng/Sai khi đang làm bài
 * Quy tắc: nếu chỉ có 1 ý con thì KHÔNG đánh chữ cái a), b)...
 */
function TrueFalseQuestionCard({
  question,
  label,
  answers = {},
  onSelect,
  isEnglish = false,
}) {
  const showLetters = (question.items || []).length > 1;
  const trueLabel = isEnglish ? 'True' : 'Đúng';
  const falseLabel = isEnglish ? 'False' : 'Sai';

  return (
    <div className="rounded-2xl glass-card p-4 sm:p-5 border border-white/15 space-y-3.5">
      <div className="space-y-1.5">
        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-200 border border-indigo-400/30 inline-block">
          {label}
        </span>
        {question.prompt && (
          <p className="text-sm sm:text-base font-semibold text-white whitespace-pre-line leading-relaxed">
            {question.prompt}
          </p>
        )}
      </div>

      <div className="overflow-x-auto rounded-xl border border-white/10">
        <table className="w-full text-xs sm:text-sm border-collapse">
          <thead>
            <tr className="bg-white/[0.05] text-slate-300 text-xs">
              {showLetters && (
                <th className="py-2.5 px-3 text-center font-bold w-10 border-b border-white/10">
                  Ý
                </th>
              )}
              <th className="py-2.5 px-3 text-left font-bold border-b border-white/10">
                Nội dung khẳng định
              </th>
              <th className="py-2.5 px-2.5 text-center font-bold w-20 border-b border-white/10">
                {trueLabel}
              </th>
              <th className="py-2.5 px-2.5 text-center font-bold w-20 border-b border-white/10">
                {falseLabel}
              </th>
            </tr>
          </thead>
          <tbody>
            {(question.items || []).map((item, idx) => {
              const chosen = answers[item.id];
              return (
                <tr
                  key={item.id}
                  className="border-b last:border-b-0 border-white/10 hover:bg-white/[0.02]"
                >
                  {showLetters && (
                    <td className="py-3 px-3 text-center font-bold text-purple-300 align-top">
                      {getItemLetter(idx)})
                    </td>
                  )}
                  <td className="py-3 px-3 text-slate-200 leading-relaxed whitespace-pre-line">
                    {item.text}
                  </td>
                  <td className="py-3 px-2 text-center align-middle">
                    <button
                      type="button"
                      onClick={() => onSelect(question.id, item.id, true)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                        chosen === true
                          ? 'bg-emerald-500 text-white border-emerald-400 shadow-md shadow-emerald-500/25'
                          : 'bg-white/[0.04] text-slate-300 border-white/15 hover:border-emerald-400/50'
                      }`}
                    >
                      {trueLabel}
                    </button>
                  </td>
                  <td className="py-3 px-2 text-center align-middle">
                    <button
                      type="button"
                      onClick={() => onSelect(question.id, item.id, false)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                        chosen === false
                          ? 'bg-rose-500 text-white border-rose-400 shadow-md shadow-rose-500/25'
                          : 'bg-white/[0.04] text-slate-300 border-white/15 hover:border-rose-400/50'
                      }`}
                    >
                      {falseLabel}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/**
 * Hiển thị 1 câu Trắc nghiệm 4 lựa chọn khi đang làm bài
 */
function McQuestionCard({ question, label, selectedIndex, onSelect }) {
  return (
    <div className="rounded-2xl glass-card p-4 sm:p-5 border border-white/15 space-y-3.5">
      <div className="space-y-1.5">
        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-500/20 text-purple-200 border border-purple-400/30 inline-block">
          {label}
        </span>
        <h4 className="text-sm sm:text-base font-bold text-white leading-relaxed whitespace-pre-line">
          {question.question}
        </h4>
      </div>

      <div className="grid grid-cols-1 gap-2.5">
        {(question.options || []).map((opt, optIdx) => {
          const isSelected = selectedIndex === optIdx;
          return (
            <button
              key={optIdx}
              type="button"
              onClick={() => onSelect(question.id, optIdx)}
              className={`w-full text-left p-3.5 rounded-xl border transition-all duration-150 flex items-center justify-between gap-3 cursor-pointer ${
                isSelected
                  ? 'bg-purple-600/25 border-purple-400 text-white shadow-md shadow-purple-500/20'
                  : 'bg-white/[0.03] border-white/10 text-slate-300 hover:border-white/25 hover:bg-white/[0.05]'
              }`}
            >
              <span className="text-xs sm:text-sm font-medium leading-relaxed">{opt}</span>
              <div
                className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                  isSelected
                    ? 'border-purple-400 bg-purple-500'
                    : 'border-slate-400/40'
                }`}
              >
                {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

const OPTION_LABELS = ['A', 'B', 'C', 'D'];

const formatScoreVi = (val) =>
  Number(Number(val || 0).toFixed(2))
    .toString()
    .replace('.', ',');

/**
 * Hiển thị kết quả 1 câu Đúng/Sai sau khi nộp bài (đồng bộ giao diện bảng như Bài tập củng cố)
 */
function TrueFalseReviewCard({ question, label, userAnswers = {}, isEnglish = false }) {
  const showLetters = (question.items || []).length > 1;
  const trueLabel = isEnglish ? 'True' : 'Đúng';
  const falseLabel = isEnglish ? 'False' : 'Sai';
  const res = scoreTfQuestion(question, userAnswers);

  return (
    <div className="p-4 sm:p-5 rounded-2xl glass-card border border-white/10 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs sm:text-sm font-bold text-white leading-relaxed whitespace-pre-line">
          <span className="text-cyan-300 mr-1.5">{label}:</span>
          {question.prompt ||
            (isEnglish
              ? 'Decide whether the following statements are True or False:'
              : 'Xét tính đúng/sai của các mệnh đề sau:')}
        </p>
        <span className="px-2.5 py-1 rounded-lg bg-cyan-500/15 border border-cyan-400/30 text-cyan-300 text-[11px] font-bold shrink-0">
          +{formatScoreVi(res.earned)}đ ({res.correctItems}/{res.totalItems} ý)
        </span>
      </div>

      <div className="overflow-x-auto rounded-xl border border-white/10">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-purple-500/10 border-b border-white/10 text-[11px] sm:text-xs font-bold text-purple-300">
              {showLetters && (
                <th className="py-2.5 px-3 w-12 text-center border-r border-white/10">Ý</th>
              )}
              <th className="py-2.5 px-3 border-r border-white/10">Nội dung khẳng định</th>
              <th className="py-2.5 px-3 w-20 text-center border-r border-white/10">{trueLabel}</th>
              <th className="py-2.5 px-3 w-20 text-center">{falseLabel}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10 text-xs sm:text-sm">
            {(question.items || []).map((item, idx) => {
              const picked = userAnswers[item.id];
              const isItemCorrect = picked === item.isTrue;
              return (
                <tr
                  key={item.id || idx}
                  className={isItemCorrect ? 'bg-emerald-500/[0.06]' : 'bg-rose-500/[0.06]'}
                >
                  {showLetters && (
                    <td className="py-2.5 px-3 text-center font-bold text-white border-r border-white/10 align-middle">
                      {getItemLetter(idx)})
                    </td>
                  )}
                  <td className="py-2.5 px-3 text-slate-200 border-r border-white/10 align-middle leading-relaxed">
                    <div className="flex items-start justify-between gap-2">
                      <span>{item.text}</span>
                      {isItemCorrect ? (
                        <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      ) : (
                        <XCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                      )}
                    </div>
                  </td>
                  {[true, false].map((val) => {
                    const isPicked = picked === val;
                    const isRightVal = item.isTrue === val;
                    let cellBtnClass = 'border-white/15 bg-white/[0.03] text-slate-400';
                    if (isRightVal) {
                      cellBtnClass =
                        'border-emerald-400 bg-emerald-500/25 text-emerald-300 font-bold';
                    } else if (isPicked && !isRightVal) {
                      cellBtnClass = 'border-rose-400 bg-rose-500/25 text-rose-300 font-bold';
                    }

                    return (
                      <td
                        key={String(val)}
                        className={`py-2 px-2 text-center align-middle ${
                          val ? 'border-r border-white/10' : ''
                        }`}
                      >
                        <div
                          className={`w-7 h-7 mx-auto rounded-lg border flex items-center justify-center text-xs ${cellBtnClass}`}
                        >
                          {isPicked || isRightVal ? '✓' : ''}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {question.explanation && (
        <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-400/25 text-xs text-slate-300 leading-relaxed whitespace-pre-line">
          <strong className="text-emerald-300">Giải thích:</strong> {question.explanation}
        </div>
      )}
    </div>
  );
}

/**
 * Hiển thị kết quả 1 câu Trắc nghiệm 4 lựa chọn sau khi nộp bài (đồng bộ giao diện lưới 2x2 như Bài tập củng cố)
 */
function McReviewCard({ question, label, selectedIndex }) {
  const isCorrect = selectedIndex === question.correctIndex;
  return (
    <div className="p-4 sm:p-5 rounded-2xl glass-card border border-white/10 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs sm:text-sm font-bold text-white leading-relaxed whitespace-pre-line">
          <span className="text-purple-300 mr-1.5">{label}:</span>
          {question.question}
        </p>
        {isCorrect ? (
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
        ) : (
          <XCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {(question.options || []).map((opt, optIdx) => {
          const isPicked = selectedIndex === optIdx;
          const isRightOpt = question.correctIndex === optIdx;
          const cleanOpt = String(opt || '').replace(/^[A-Da-d]\s*[.):]\s*/, '').trim();

          let styleClass = 'bg-white/[0.03] border-white/10 text-slate-300';
          if (isRightOpt) {
            styleClass = 'bg-emerald-500/20 border-emerald-400/60 text-emerald-200 font-semibold';
          } else if (isPicked && !isRightOpt) {
            styleClass = 'bg-rose-500/20 border-rose-400/60 text-rose-200';
          }

          return (
            <div
              key={optIdx}
              className={`p-3 rounded-xl border text-left text-xs sm:text-sm flex items-start gap-2.5 ${styleClass}`}
            >
              <span className="w-5 h-5 rounded-md bg-white/10 flex items-center justify-center text-[11px] font-bold shrink-0">
                {OPTION_LABELS[optIdx]}
              </span>
              <span className="leading-snug">{cleanOpt}</span>
            </div>
          );
        })}
      </div>

      {question.explanation && (
        <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-400/25 text-xs text-slate-300 leading-relaxed whitespace-pre-line">
          <strong className="text-emerald-300">Giải thích:</strong> {question.explanation}
        </div>
      )}
    </div>
  );
}

export default function QuizExamRunner({ exam, subject, category, onExit }) {
  const normalizedExam = useMemo(() => normalizeExamData(exam), [exam]);
  const isEnglish = normalizedExam.isEnglish;

  // Xây dựng danh sách các phần có dữ liệu trong đề
  const sections = useMemo(() => {
    const list = [];
    if (normalizedExam.mcQuestions.length > 0) {
      list.push({
        id: 'mc',
        label: 'Trắc nghiệm',
        icon: ListChecks,
        count: normalizedExam.mcQuestions.length,
      });
    }
    if (normalizedExam.tfQuestions.length > 0) {
      list.push({
        id: 'tf',
        label: isEnglish ? 'True / False' : 'Đúng / Sai',
        icon: ToggleLeft,
        count: normalizedExam.tfQuestions.length,
      });
    }
    if (!isEnglish && normalizedExam.shortQuestions.length > 0) {
      list.push({
        id: 'short',
        label: 'Trả lời ngắn',
        icon: Hash,
        count: normalizedExam.shortQuestions.length,
      });
    }
    if (isEnglish && normalizedExam.readingPassages.length > 0) {
      list.push({
        id: 'reading',
        label: 'Reading',
        icon: BookOpen,
        count: normalizedExam.readingPassages.length,
      });
    }
    if (normalizedExam.essayQuestions.length > 0) {
      list.push({
        id: 'essay',
        label: 'Tự luận',
        icon: PenTool,
        count: normalizedExam.essayQuestions.length,
      });
    }
    return list;
  }, [normalizedExam, isEnglish]);

  const [activeSectionId, setActiveSectionId] = useState(sections[0]?.id || 'mc');
  const [mcIndex, setMcIndex] = useState(0);
  const [tfIndex, setTfIndex] = useState(0);
  const [activeReadingIdx, setActiveReadingIdx] = useState(0);
  const [readingQIndex, setReadingQIndex] = useState(0);
  const [mcAnswers, setMcAnswers] = useState({});
  const [tfAnswers, setTfAnswers] = useState({});
  const [shortAnswers, setShortAnswers] = useState({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [timeLeft, setTimeLeft] = useState((normalizedExam.durationMinutes || 45) * 60);

  useEffect(() => {
    if (isSubmitted || timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [isSubmitted, timeLeft]);

  const formatTime = (secs) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleSelectMc = (qId, optIdx) => {
    if (isSubmitted) return;
    setMcAnswers((prev) => ({ ...prev, [qId]: optIdx }));
  };

  const handleSelectTf = (qId, itemId, val) => {
    if (isSubmitted) return;
    setTfAnswers((prev) => ({
      ...prev,
      [qId]: { ...(prev[qId] || {}), [itemId]: val },
    }));
  };

  const handleShortChange = (qId, val) => {
    if (isSubmitted) return;
    setShortAnswers((prev) => ({ ...prev, [qId]: val }));
  };

  const handleSubmit = () => {
    setIsSubmitted(true);
    confetti({
      particleCount: 95,
      spread: 75,
      origin: { y: 0.6 },
    });
  };

  const handleRetake = () => {
    setMcAnswers({});
    setTfAnswers({});
    setShortAnswers({});
    setIsSubmitted(false);
    setActiveSectionId(sections[0]?.id || 'mc');
    setMcIndex(0);
    setTfIndex(0);
    setActiveReadingIdx(0);
    setReadingQIndex(0);
    setTimeLeft((normalizedExam.durationMinutes || 45) * 60);
  };

  const currentSectionIdx = sections.findIndex((s) => s.id === activeSectionId);

  const gradeResult = useMemo(
    () =>
      gradeExamSubmission(normalizedExam, {
        mc: mcAnswers,
        tf: tfAnswers,
        short: shortAnswers,
      }),
    [normalizedExam, mcAnswers, tfAnswers, shortAnswers]
  );

  return (
    <div className="space-y-4 sm:space-y-5 pb-10">
      {/* Header gọn gàng gom chung thông tin đề, đồng hồ, nút Nộp bài và thanh chuyển phần */}
      <div className="rounded-2xl glass-card border border-white/10 p-3.5 sm:p-4 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start sm:items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={onExit}
              className="px-3 py-2 rounded-xl glass-button text-xs font-semibold text-slate-300 hover:text-white inline-flex items-center gap-1.5 cursor-pointer shrink-0"
              title="Quay lại danh sách đề"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="hidden xs:inline sm:inline">Danh sách</span>
            </button>

            <div className="min-w-0">
              <h1 className="text-base sm:text-xl font-extrabold font-display tracking-tight text-white truncate">
                {normalizedExam.title}
              </h1>
              <div className="flex items-center gap-1.5 text-[11px] sm:text-xs text-slate-400 mt-0.5 flex-wrap">
                <span className="font-semibold text-purple-300">
                  {subject?.name || normalizedExam.subjectName}
                </span>
                <span>•</span>
                <span className="truncate">{category?.name || normalizedExam.categoryName}</span>
                <span>•</span>
                <span>{normalizedExam.durationMinutes} phút</span>
                <span>•</span>
                <span>{normalizedExam.questionsCount} câu</span>
              </div>
            </div>
          </div>

          {!isSubmitted && (
            <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-white/10">
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.05] border border-white/10 text-white font-mono text-xs sm:text-sm">
                <Clock className="w-3.5 h-3.5 text-purple-400 animate-pulse" />
                <span className="font-bold text-purple-300">{formatTime(timeLeft)}</span>
              </div>
              <button
                type="button"
                onClick={handleSubmit}
                className="px-4 py-1.5 sm:py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white text-xs font-bold shadow-md shadow-emerald-500/25 transition-all cursor-pointer"
              >
                Nộp Bài
              </button>
            </div>
          )}
        </div>

        {/* Thanh chuyển phần tích hợp gọn ngay trong header */}
        {!isSubmitted && sections.length > 1 && (
          <div className="pt-2.5 border-t border-white/10 flex items-center gap-1.5 overflow-x-auto pb-0.5">
            {sections.map((sec) => {
              const SecIcon = sec.icon;
              const active = activeSectionId === sec.id;
              return (
                <button
                  key={sec.id}
                  type="button"
                  onClick={() => setActiveSectionId(sec.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 border transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                    active
                      ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white border-purple-400/60 shadow-sm shadow-purple-500/25'
                      : 'bg-white/[0.03] text-slate-300 border-white/10 hover:border-white/25 hover:text-white'
                  }`}
                >
                  <SecIcon className="w-3.5 h-3.5" />
                  <span>{sec.label}</span>
                  <span
                    className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold leading-none ${
                      active ? 'bg-white/20 text-white' : 'bg-white/10 text-slate-300'
                    }`}
                  >
                    {sec.count}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ============================================================ */}
      {/* ĐANG LÀM BÀI */}
      {/* ============================================================ */}
      {!isSubmitted ? (
        <div className="space-y-4">

          {/* PHẦN 1: TRẮC NGHIỆM 4 LỰA CHỌN (TỪNG CÂU + NÚT CÂU TRƯỚC ĐÓ / CÂU TIẾP THEO) */}
          {activeSectionId === 'mc' && (() => {
            const list = normalizedExam.mcQuestions;
            const safeIdx = Math.min(mcIndex, Math.max(0, list.length - 1));
            const currentQ = list[safeIdx];
            if (!currentQ) return null;

            return (
              <div className="max-w-3xl mx-auto space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-3 rounded-2xl glass-card border border-white/10">
                  <span className="text-xs font-bold text-slate-300">
                    Trắc nghiệm • Câu <strong className="text-white">{safeIdx + 1}</strong> / {list.length}
                  </span>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {list.map((q, idx) => {
                      const isCurrent = idx === safeIdx;
                      const done = mcAnswers[q.id] !== undefined;
                      return (
                        <button
                          key={q.id}
                          type="button"
                          onClick={() => setMcIndex(idx)}
                          className={`w-7 h-7 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            isCurrent
                              ? 'bg-purple-600 text-white border border-purple-400 shadow-md shadow-purple-500/30'
                              : done
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40'
                              : 'bg-white/[0.04] text-slate-400 border border-white/10 hover:text-white'
                          }`}
                        >
                          {idx + 1}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <McQuestionCard
                  question={currentQ}
                  label={`Trắc nghiệm • Câu ${safeIdx + 1} / ${list.length}`}
                  selectedIndex={mcAnswers[currentQ.id]}
                  onSelect={handleSelectMc}
                />

                <div className="flex items-center justify-between gap-3 pt-1">
                  <button
                    type="button"
                    disabled={safeIdx === 0}
                    onClick={() => setMcIndex((prev) => Math.max(0, prev - 1))}
                    className="px-4 py-2.5 rounded-xl glass-button text-xs sm:text-sm font-semibold text-slate-200 hover:text-white disabled:opacity-35 disabled:pointer-events-none inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Câu trước đó</span>
                  </button>

                  {safeIdx + 1 < list.length ? (
                    <button
                      type="button"
                      onClick={() => setMcIndex((prev) => Math.min(list.length - 1, prev + 1))}
                      className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs sm:text-sm font-bold shadow-md shadow-purple-600/25 inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>Câu tiếp theo</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  ) : currentSectionIdx + 1 < sections.length ? (
                    <button
                      type="button"
                      onClick={() => setActiveSectionId(sections[currentSectionIdx + 1].id)}
                      className="px-5 py-2.5 rounded-xl bg-purple-600/40 border border-purple-400/40 text-white text-xs sm:text-sm font-semibold hover:bg-purple-600/60 inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>Sang phần {sections[currentSectionIdx + 1].label}</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleSubmit}
                      className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-xs sm:text-sm font-bold shadow-lg shadow-emerald-500/25 cursor-pointer"
                    >
                      Nộp Bài &amp; Xem Kết Quả
                    </button>
                  )}
                </div>
              </div>
            );
          })()}

          {/* PHẦN 2: ĐÚNG / SAI (TỪNG CÂU + NÚT CÂU TRƯỚC ĐÓ / CÂU TIẾP THEO) */}
          {activeSectionId === 'tf' && (() => {
            const list = normalizedExam.tfQuestions;
            const safeIdx = Math.min(tfIndex, Math.max(0, list.length - 1));
            const currentQ = list[safeIdx];
            if (!currentQ) return null;

            return (
              <div className="max-w-3xl mx-auto space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-3 rounded-2xl glass-card border border-white/10">
                  <span className="text-xs font-bold text-slate-300">
                    {isEnglish ? 'True / False' : 'Đúng / Sai'} • Câu{' '}
                    <strong className="text-white">{safeIdx + 1}</strong> / {list.length}
                  </span>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {list.map((q, idx) => {
                      const isCurrent = idx === safeIdx;
                      const qAns = tfAnswers[q.id] || {};
                      const done =
                        (q.items || []).length > 0 &&
                        q.items.every((it) => qAns[it.id] !== undefined);
                      return (
                        <button
                          key={q.id}
                          type="button"
                          onClick={() => setTfIndex(idx)}
                          className={`w-7 h-7 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            isCurrent
                              ? 'bg-purple-600 text-white border border-purple-400 shadow-md shadow-purple-500/30'
                              : done
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40'
                              : 'bg-white/[0.04] text-slate-400 border border-white/10 hover:text-white'
                          }`}
                        >
                          {idx + 1}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <TrueFalseQuestionCard
                  question={currentQ}
                  label={`${isEnglish ? 'True / False' : 'Đúng / Sai'} • Câu ${safeIdx + 1} / ${list.length}`}
                  answers={tfAnswers[currentQ.id] || {}}
                  onSelect={handleSelectTf}
                  isEnglish={isEnglish}
                />

                <div className="flex items-center justify-between gap-3 pt-1">
                  <button
                    type="button"
                    disabled={safeIdx === 0}
                    onClick={() => setTfIndex((prev) => Math.max(0, prev - 1))}
                    className="px-4 py-2.5 rounded-xl glass-button text-xs sm:text-sm font-semibold text-slate-200 hover:text-white disabled:opacity-35 disabled:pointer-events-none inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Câu trước đó</span>
                  </button>

                  {safeIdx + 1 < list.length ? (
                    <button
                      type="button"
                      onClick={() => setTfIndex((prev) => Math.min(list.length - 1, prev + 1))}
                      className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs sm:text-sm font-bold shadow-md shadow-purple-600/25 inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>Câu tiếp theo</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  ) : currentSectionIdx + 1 < sections.length ? (
                    <button
                      type="button"
                      onClick={() => setActiveSectionId(sections[currentSectionIdx + 1].id)}
                      className="px-5 py-2.5 rounded-xl bg-purple-600/40 border border-purple-400/40 text-white text-xs sm:text-sm font-semibold hover:bg-purple-600/60 inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>Sang phần {sections[currentSectionIdx + 1].label}</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleSubmit}
                      className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-xs sm:text-sm font-bold shadow-lg shadow-emerald-500/25 cursor-pointer"
                    >
                      Nộp Bài &amp; Xem Kết Quả
                    </button>
                  )}
                </div>
              </div>
            );
          })()}

          {/* PHẦN 3 (NON-ENGLISH): TRẢ LỜI NGẮN (SỐ THỰC) */}
          {activeSectionId === 'short' && !isEnglish && (
            <div className="max-w-4xl mx-auto space-y-4">
              {normalizedExam.shortQuestions.map((sq, idx) => {
                const rawVal = shortAnswers[sq.id] || '';
                const hasInvalidInput =
                  rawVal.trim() !== '' && Number.isNaN(parseRealNumber(rawVal));
                return (
                  <div
                    key={sq.id}
                    className="rounded-2xl glass-card p-5 border border-white/15 space-y-3"
                  >
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-cyan-500/20 text-cyan-200 border border-cyan-400/30 inline-block">
                      Trả lời ngắn • Câu {idx + 1}
                    </span>
                    <h4 className="text-sm sm:text-base font-bold text-white leading-relaxed whitespace-pre-line">
                      {sq.question}
                    </h4>
                    <div className="max-w-xs space-y-1">
                      <input
                        type="text"
                        inputMode="decimal"
                        placeholder="Nhập đáp án số thực (VD: 12.5 hoặc -3,75)"
                        value={rawVal}
                        onChange={(e) => handleShortChange(sq.id, e.target.value)}
                        className={`w-full px-3.5 py-2.5 rounded-xl bg-white/[0.06] border text-white placeholder-slate-400 text-sm font-mono focus:outline-none ${
                          hasInvalidInput
                            ? 'border-rose-400 focus:border-rose-400'
                            : 'border-white/15 focus:border-cyan-400'
                        }`}
                      />
                      {hasInvalidInput && (
                        <p className="text-[11px] text-rose-400">
                          Vui lòng nhập một số thực hợp lệ (VD: 5, -2.5, 0,75).
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* PHẦN 3 (ENGLISH): READING — CHIA 2 CỘT (TRÁI: ĐOẠN VĂN | PHẢI: CÂU HỎI MC/TF) */}
          {activeSectionId === 'reading' && isEnglish && (
            <div className="space-y-4">
              {normalizedExam.readingPassages.length > 1 && (
                <div className="flex items-center gap-2 flex-wrap">
                  {normalizedExam.readingPassages.map((p, idx) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        setActiveReadingIdx(idx);
                        setReadingQIndex(0);
                      }}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        activeReadingIdx === idx
                          ? 'bg-amber-500/25 text-amber-200 border-amber-400/60'
                          : 'bg-white/[0.04] text-slate-300 border-white/10 hover:border-white/25'
                      }`}
                    >
                      {p.title || `Reading Passage ${idx + 1}`} ({p.questions.length} câu)
                    </button>
                  ))}
                </div>
              )}

              {(() => {
                const currentPassage =
                  normalizedExam.readingPassages[activeReadingIdx] ||
                  normalizedExam.readingPassages[0];
                if (!currentPassage) return null;

                const subList = currentPassage.questions || [];
                const safeSubIdx = Math.min(readingQIndex, Math.max(0, subList.length - 1));
                const currentSubQ = subList[safeSubIdx];

                return (
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                    {/* BÊN TRÁI: ĐOẠN VĂN BÀI ĐỌC */}
                    <div className="lg:col-span-6 lg:sticky lg:top-4 rounded-3xl glass-card p-5 sm:p-6 border border-amber-400/25 space-y-3 lg:max-h-[75vh] lg:overflow-y-auto shadow-xl">
                      <div className="flex items-center gap-2 pb-2.5 border-b border-white/10">
                        <BookOpen className="w-4 h-4 text-amber-300 shrink-0" />
                        <h3 className="text-sm sm:text-base font-bold font-display text-amber-200">
                          {currentPassage.title || `Reading Passage ${activeReadingIdx + 1}`}
                        </h3>
                      </div>
                      <div className="text-xs sm:text-sm text-slate-200 leading-7 whitespace-pre-line">
                        {currentPassage.passage}
                      </div>
                    </div>

                    {/* BÊN PHẢI: HIỂN THỊ TỪNG CÂU HỎI + NÚT CÂU TRƯỚC ĐÓ / CÂU TIẾP THEO */}
                    <div className="lg:col-span-6 space-y-4">
                      {subList.length > 0 && (
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-2xl glass-card border border-white/10">
                          <span className="text-xs font-bold text-slate-300">
                            Câu <strong className="text-white">{safeSubIdx + 1}</strong> / {subList.length}
                          </span>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {subList.map((sq, qIdx) => {
                              const isCurrent = qIdx === safeSubIdx;
                              const done =
                                sq.type === 'tf'
                                  ? (sq.items || []).length > 0 &&
                                    sq.items.every(
                                      (it) => (tfAnswers[sq.id] || {})[it.id] !== undefined
                                    )
                                  : mcAnswers[sq.id] !== undefined;
                              return (
                                <button
                                  key={sq.id}
                                  type="button"
                                  onClick={() => setReadingQIndex(qIdx)}
                                  className={`w-7 h-7 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                    isCurrent
                                      ? 'bg-purple-600 text-white border border-purple-400 shadow-md shadow-purple-500/30'
                                      : done
                                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40'
                                      : 'bg-white/[0.04] text-slate-400 border border-white/10 hover:text-white'
                                  }`}
                                >
                                  {qIdx + 1}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {currentSubQ &&
                        (currentSubQ.type === 'tf' ? (
                          <TrueFalseQuestionCard
                            question={currentSubQ}
                            label={`Reading • Câu ${safeSubIdx + 1} / ${subList.length} (True / False)`}
                            answers={tfAnswers[currentSubQ.id] || {}}
                            onSelect={handleSelectTf}
                            isEnglish={true}
                          />
                        ) : (
                          <McQuestionCard
                            question={currentSubQ}
                            label={`Reading • Câu ${safeSubIdx + 1} / ${subList.length} (Trắc nghiệm)`}
                            selectedIndex={mcAnswers[currentSubQ.id]}
                            onSelect={handleSelectMc}
                          />
                        ))}

                      {subList.length > 0 && (
                        <div className="flex items-center justify-between gap-3 pt-1">
                          <button
                            type="button"
                            disabled={safeSubIdx === 0 && activeReadingIdx === 0}
                            onClick={() => {
                              if (safeSubIdx > 0) {
                                setReadingQIndex((prev) => prev - 1);
                              } else if (activeReadingIdx > 0) {
                                const prevPassage = normalizedExam.readingPassages[activeReadingIdx - 1];
                                setActiveReadingIdx(activeReadingIdx - 1);
                                setReadingQIndex(Math.max(0, (prevPassage?.questions?.length || 1) - 1));
                              }
                            }}
                            className="px-4 py-2.5 rounded-xl glass-button text-xs sm:text-sm font-semibold text-slate-200 hover:text-white disabled:opacity-35 disabled:pointer-events-none inline-flex items-center gap-1.5 cursor-pointer"
                          >
                            <ChevronLeft className="w-4 h-4" />
                            <span>Câu trước đó</span>
                          </button>

                          {safeSubIdx + 1 < subList.length ? (
                            <button
                              type="button"
                              onClick={() => setReadingQIndex((prev) => prev + 1)}
                              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs sm:text-sm font-bold shadow-md shadow-purple-600/25 inline-flex items-center gap-1.5 cursor-pointer"
                            >
                              <span>Câu tiếp theo</span>
                              <ChevronRight className="w-4 h-4" />
                            </button>
                          ) : activeReadingIdx + 1 < normalizedExam.readingPassages.length ? (
                            <button
                              type="button"
                              onClick={() => {
                                setActiveReadingIdx((prev) => prev + 1);
                                setReadingQIndex(0);
                              }}
                              className="px-5 py-2.5 rounded-xl bg-amber-500/25 border border-amber-400/50 text-amber-200 text-xs sm:text-sm font-bold inline-flex items-center gap-1.5 cursor-pointer"
                            >
                              <span>Bài đọc tiếp theo</span>
                              <ChevronRight className="w-4 h-4" />
                            </button>
                          ) : currentSectionIdx + 1 < sections.length ? (
                            <button
                              type="button"
                              onClick={() => setActiveSectionId(sections[currentSectionIdx + 1].id)}
                              className="px-5 py-2.5 rounded-xl bg-purple-600/40 border border-purple-400/40 text-white text-xs sm:text-sm font-semibold hover:bg-purple-600/60 inline-flex items-center gap-1.5 cursor-pointer"
                            >
                              <span>Sang phần {sections[currentSectionIdx + 1].label}</span>
                              <ChevronRight className="w-4 h-4" />
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={handleSubmit}
                              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-xs sm:text-sm font-bold shadow-lg shadow-emerald-500/25 cursor-pointer"
                            >
                              Nộp Bài &amp; Xem Kết Quả
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* PHẦN 4: TỰ LUẬN (CHỈ HIỂN THỊ CÂU HỎI, KHÔNG CHẤM ĐIỂM) */}
          {activeSectionId === 'essay' && (
            <div className="max-w-4xl mx-auto space-y-4">
              <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-400/30 text-amber-200 text-xs flex items-center gap-2">
                <Lightbulb className="w-4 h-4 shrink-0 text-amber-300" />
                <span>
                  Phần <strong>Tự luận</strong> chỉ hiển thị đề bài, <strong>không chấm điểm tự động</strong>. Sau khi bấm <strong>Nộp Bài</strong>, hệ thống sẽ hiển thị <strong>Phương pháp giải / Hướng giải quyết</strong> để bạn đối chiếu.
                </span>
              </div>

              {normalizedExam.essayQuestions.map((eq, idx) => (
                <div
                  key={eq.id}
                  className="rounded-2xl glass-card p-5 border border-white/15 space-y-2.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-200 border border-amber-400/30">
                      Tự luận • Câu {idx + 1}
                    </span>
                    <span className="text-[11px] text-slate-400">Không chấm điểm</span>
                  </div>
                  <p className="text-sm sm:text-base font-semibold text-white leading-relaxed whitespace-pre-line">
                    {eq.question}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* Điều hướng chuyển phần & Nộp bài ở đáy trang (chỉ dùng cho phần cuộn: Trả lời ngắn & Tự luận) */}
          {(activeSectionId === 'short' || activeSectionId === 'essay') && (
            <div className="max-w-4xl mx-auto flex items-center justify-between pt-3">
              <button
                type="button"
                disabled={currentSectionIdx <= 0}
                onClick={() => setActiveSectionId(sections[currentSectionIdx - 1].id)}
                className="px-4 py-2.5 rounded-xl glass-button text-xs font-semibold text-slate-300 hover:text-white disabled:opacity-30 disabled:pointer-events-none flex items-center gap-1.5 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Phần Trước</span>
              </button>

              {currentSectionIdx + 1 < sections.length ? (
                <button
                  type="button"
                  onClick={() => setActiveSectionId(sections[currentSectionIdx + 1].id)}
                  className="px-5 py-2.5 rounded-xl bg-purple-600/40 border border-purple-400/40 text-white text-xs font-semibold hover:bg-purple-600/60 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <span>Phần Tiếp Theo ({sections[currentSectionIdx + 1].label})</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-xs font-bold shadow-lg shadow-emerald-500/30 hover:scale-[1.02] transition-all cursor-pointer"
                >
                  Nộp Bài &amp; Xem Kết Quả
                </button>
              )}
            </div>
          )}
        </div>
      ) : (
        /* ============================================================ */
        /* KẾT QUẢ & LỜI GIẢI CHI TIẾT SAU KHI NỘP BÀI */
        /* ============================================================ */
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="rounded-3xl glass-card p-6 sm:p-8 text-center border border-purple-500/30 shadow-2xl space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-purple-500 via-pink-500 to-amber-400 p-[1.5px] mx-auto shadow-xl shadow-purple-500/30">
              <div className="w-full h-full bg-white dark:bg-[#0d0e17] rounded-[15px] flex items-center justify-center">
                <Award className="w-8 h-8 text-amber-400" />
              </div>
            </div>

            <h2 className="text-2xl font-bold font-display text-white">Kết Quả Bài Làm</h2>

            {gradeResult.totalMax > 0 ? (
              <div className="inline-flex items-baseline gap-2.5 px-6 py-3 rounded-2xl bg-white/[0.04] border border-white/10">
                <span className="text-4xl font-extrabold font-display text-white shimmer-text">
                  {gradeResult.scoreOutOf10.toFixed(2)} / 10
                </span>
                <span className="text-sm font-semibold text-purple-300">
                  ({gradeResult.percentage}%)
                </span>
              </div>
            ) : (
              <p className="text-sm text-amber-300 font-semibold">
                Đề thi này chỉ gồm câu hỏi Tự luận (không chấm điểm tự động). Xem phương pháp giải bên dưới.
              </p>
            )}

            {/* Tóm tắt điểm từng phần */}
            <div className="flex items-center justify-center gap-2 flex-wrap text-xs">
              {gradeResult.mcTotal > 0 && (
                <span className="px-3 py-1.5 rounded-xl bg-white/[0.05] border border-white/10 text-slate-200">
                  Trắc nghiệm: <strong className="text-emerald-400">{gradeResult.mcCorrect}/{gradeResult.mcTotal}</strong>
                </span>
              )}
              {gradeResult.tfItemsTotal > 0 && (
                <span className="px-3 py-1.5 rounded-xl bg-white/[0.05] border border-white/10 text-slate-200">
                  Đúng/Sai: <strong className="text-emerald-400">{gradeResult.tfItemsCorrect}/{gradeResult.tfItemsTotal} ý</strong>
                </span>
              )}
              {gradeResult.shortTotal > 0 && (
                <span className="px-3 py-1.5 rounded-xl bg-white/[0.05] border border-white/10 text-slate-200">
                  Trả lời ngắn: <strong className="text-emerald-400">{gradeResult.shortCorrect}/{gradeResult.shortTotal}</strong>
                </span>
              )}
              {gradeResult.readingMax > 0 && (
                <span className="px-3 py-1.5 rounded-xl bg-white/[0.05] border border-white/10 text-slate-200">
                  Reading:{' '}
                  <strong className="text-emerald-400">
                    {gradeResult.readingMcTotal > 0 && `${gradeResult.readingMcCorrect}/${gradeResult.readingMcTotal} TN`}
                    {gradeResult.readingMcTotal > 0 && gradeResult.readingTfItemsTotal > 0 && ' • '}
                    {gradeResult.readingTfItemsTotal > 0 && `${gradeResult.readingTfItemsCorrect}/${gradeResult.readingTfItemsTotal} ý T/F`}
                  </strong>
                </span>
              )}
              {gradeResult.essayTotal > 0 && (
                <span className="px-3 py-1.5 rounded-xl bg-amber-500/15 border border-amber-400/30 text-amber-200">
                  Tự luận: {gradeResult.essayTotal} câu (Không chấm điểm)
                </span>
              )}
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleRetake}
                className="px-5 py-2.5 rounded-2xl glass-button text-xs font-semibold text-slate-200 hover:text-white flex items-center gap-2 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Làm Lại Đề Này</span>
              </button>
              <button
                type="button"
                onClick={onExit}
                className="px-5 py-2.5 rounded-2xl bg-purple-600/30 border border-purple-400/40 text-xs font-semibold text-white hover:bg-purple-600/50 flex items-center gap-2 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Về Danh Sách Đề</span>
              </button>
            </div>
          </div>

          {/* Chi tiết từng phần */}
          <div className="space-y-6">
            {/* 1. Review Trắc nghiệm */}
            {normalizedExam.mcQuestions.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-purple-300 flex items-center gap-2">
                  <ListChecks className="w-4 h-4" />
                  <span>Phần I. Trắc nghiệm 4 lựa chọn ({normalizedExam.mcQuestions.length} câu)</span>
                </h3>
                {normalizedExam.mcQuestions.map((q, idx) => (
                  <McReviewCard
                    key={q.id}
                    question={q}
                    label={`Câu ${idx + 1}`}
                    selectedIndex={mcAnswers[q.id]}
                  />
                ))}
              </div>
            )}

            {/* 2. Review Đúng/Sai */}
            {normalizedExam.tfQuestions.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-cyan-300 flex items-center gap-2">
                  <ToggleLeft className="w-4 h-4" />
                  <span>
                    {isEnglish
                      ? `Phần II. True / False (${normalizedExam.tfQuestions.length} câu)`
                      : `Phần II. Câu hỏi Đúng / Sai (${normalizedExam.tfQuestions.length} câu)`}
                  </span>
                </h3>
                {normalizedExam.tfQuestions.map((q, idx) => (
                  <TrueFalseReviewCard
                    key={q.id}
                    question={q}
                    label={`Câu ${idx + 1}`}
                    userAnswers={tfAnswers[q.id] || {}}
                    isEnglish={isEnglish}
                  />
                ))}
              </div>
            )}

            {/* 3. Review Trả lời ngắn */}
            {!isEnglish && normalizedExam.shortQuestions.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-base font-bold font-display text-white flex items-center gap-2">
                  <Hash className="w-5 h-5 text-cyan-400" />
                  <span>Phần Trả Lời Ngắn</span>
                </h3>
                {normalizedExam.shortQuestions.map((sq, idx) => {
                  const userVal = shortAnswers[sq.id] || '';
                  const isCorrect = isRealNumberEqual(userVal, sq.correctAnswer);
                  return (
                    <div
                      key={sq.id}
                      className={`p-5 rounded-2xl glass-card border space-y-2.5 ${
                        isCorrect ? 'border-emerald-500/30' : 'border-rose-500/30'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-cyan-300">
                          Trả lời ngắn • Câu {idx + 1}
                        </span>
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
                      <h4 className="text-sm font-bold text-white whitespace-pre-line">
                        {sq.question}
                      </h4>
                      <div className="text-xs space-y-1 text-slate-300">
                        <div>
                          Đáp án đúng:{' '}
                          <strong className="text-emerald-400 font-mono">{sq.correctAnswer}</strong>
                        </div>
                        <div>
                          Bạn đã nhập:{' '}
                          <strong
                            className={`font-mono ${isCorrect ? 'text-emerald-400' : 'text-rose-400'}`}
                          >
                            {userVal.trim() || '(Bỏ trống)'}
                          </strong>
                        </div>
                      </div>
                      {sq.explanation && (
                        <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10 text-xs text-slate-300 whitespace-pre-line leading-relaxed">
                          <strong className="text-purple-300">💡 Giải thích:</strong>
                          {'\n'}
                          {sq.explanation}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* 4. Review Reading (Tiếng Anh) */}
            {isEnglish && normalizedExam.readingPassages.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-base font-bold font-display text-white flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-amber-400" />
                  <span>Phần Reading (Đọc Hiểu)</span>
                </h3>
                {normalizedExam.readingPassages.map((p, pIdx) => (
                  <div
                    key={p.id}
                    className="p-5 rounded-3xl glass-card border border-amber-400/25 space-y-4"
                  >
                    <div className="space-y-2 pb-3 border-b border-white/10">
                      <h4 className="text-sm font-bold text-amber-200">
                        {p.title || `Reading Passage ${pIdx + 1}`}
                      </h4>
                      <div className="text-xs text-slate-300 whitespace-pre-line leading-relaxed max-h-52 overflow-y-auto pr-1">
                        {p.passage}
                      </div>
                    </div>
                    <div className="space-y-3">
                      {p.questions.map((subQ, qIdx) =>
                        subQ.type === 'tf' ? (
                          <TrueFalseReviewCard
                            key={subQ.id}
                            question={subQ}
                            label={`Reading #${pIdx + 1} • Câu ${qIdx + 1} (True/False)`}
                            userAnswers={tfAnswers[subQ.id] || {}}
                            isEnglish={true}
                          />
                        ) : (
                          <McReviewCard
                            key={subQ.id}
                            question={subQ}
                            label={`Reading #${pIdx + 1} • Câu ${qIdx + 1} (Trắc nghiệm)`}
                            selectedIndex={mcAnswers[subQ.id]}
                          />
                        )
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 5. Review Tự luận (Không chấm điểm — chỉ đưa Phương pháp giải / Hướng giải quyết) */}
            {normalizedExam.essayQuestions.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-base font-bold font-display text-white flex items-center gap-2">
                  <PenTool className="w-5 h-5 text-amber-400" />
                  <span>Phần Tự Luận (Phương Pháp Giải / Hướng Giải Quyết)</span>
                </h3>
                {normalizedExam.essayQuestions.map((eq, idx) => (
                  <div
                    key={eq.id}
                    className="p-5 rounded-2xl glass-card border border-amber-400/30 space-y-3"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-amber-300">
                        Tự luận • Câu {idx + 1}
                      </span>
                      <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-200 border border-amber-400/30">
                        Không chấm điểm
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-white whitespace-pre-line leading-relaxed">
                      {eq.question}
                    </h4>
                    <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-400/25 text-xs text-slate-200 whitespace-pre-line leading-relaxed">
                      <div className="font-bold text-amber-300 mb-1 flex items-center gap-1.5">
                        <Lightbulb className="w-3.5 h-3.5" />
                        <span>Phương pháp giải / Hướng giải quyết:</span>
                      </div>
                      {eq.solutionGuide || 'Quản trị viên chưa nhập hướng dẫn giải cho câu này.'}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
