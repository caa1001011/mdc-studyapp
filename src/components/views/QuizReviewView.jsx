import React, { useState, useEffect } from 'react';
import {
  HelpCircle,
  Clock,
  CheckCircle,
  XCircle,
  Award,
  ChevronRight,
  ChevronLeft,
  RotateCcw,
  BookOpen
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { QUIZ_SAMPLES } from '../../data/mockData';

export default function QuizReviewView() {
  const quiz = QUIZ_SAMPLES[0];
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes

  const currentQ = quiz.questions[currentQIndex];

  useEffect(() => {
    if (isSubmitted || timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [isSubmitted, timeLeft]);

  const handleSelectOption = (optionIndex) => {
    if (isSubmitted) return;
    setSelectedAnswers({
      ...selectedAnswers,
      [currentQIndex]: optionIndex,
    });
  };

  const calculateScore = () => {
    let score = 0;
    quiz.questions.forEach((q, idx) => {
      if (selectedAnswers[idx] === q.correctIndex) {
        score += 1;
      }
    });
    return score;
  };

  const handleSubmit = () => {
    setIsSubmitted(true);
    confetti({
      particleCount: 100,
      spread: 80,
      origin: { y: 0.6 },
    });
  };

  const handleRetake = () => {
    setSelectedAnswers({});
    setIsSubmitted(false);
    setCurrentQIndex(0);
    setTimeLeft(600);
  };

  const formatTime = (secs) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const score = calculateScore();
  const totalQuestions = quiz.questions.length;

  return (
    <div className="space-y-6 md:space-y-8 pb-10">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/15 border border-blue-500/30 text-blue-300 text-xs font-semibold mb-2">
            <HelpCircle className="w-3.5 h-3.5 text-blue-300" />
            <span>Luyện Tập & Kiểm Tra Kiến Thức</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-display tracking-tight text-white">
            Ôn Tập & Luyện Đề
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">
            {quiz.title} • Thời gian: 10 phút • 5 câu trắc nghiệm
          </p>
        </div>

        {/* Timer Box */}
        {!isSubmitted && (
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl glass-card border-white/15 text-white font-mono text-sm self-start sm:self-auto shadow-lg shadow-purple-500/10">
            <Clock className="w-4 h-4 text-purple-400 animate-pulse" />
            <span>Thời gian còn:</span>
            <span className="font-bold text-purple-300 text-base">{formatTime(timeLeft)}</span>
          </div>
        )}
      </div>

      {/* 2. Main Quiz Stage or Results */}
      {!isSubmitted ? (
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Question Index Progress */}
          <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1">
            <span className="text-xs text-slate-400 font-medium">
              Câu <strong className="text-white">{currentQIndex + 1}</strong> / {totalQuestions}
            </span>

            <div className="flex items-center gap-1.5">
              {quiz.questions.map((_, idx) => {
                const isAnswered = selectedAnswers[idx] !== undefined;
                const isCurrent = currentQIndex === idx;

                return (
                  <button
                    key={idx}
                    onClick={() => setCurrentQIndex(idx)}
                    className={`w-7 h-7 rounded-lg text-xs font-bold transition-all ${
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

          {/* Question Card */}
          <div className="rounded-3xl glass-card p-6 sm:p-8 border border-white/15 space-y-6 shadow-2xl relative overflow-hidden">
            <div className="relative z-10">
              <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-500/20 text-purple-200 border border-purple-400/30 mb-3 inline-block">
                Câu Hỏi Số {currentQIndex + 1}
              </span>

              <h3 className="text-lg sm:text-xl font-bold font-display text-white leading-relaxed">
                {currentQ.question}
              </h3>
            </div>

            {/* Options */}
            <div className="space-y-3 relative z-10">
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
                      className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${
                        isSelected
                          ? 'border-purple-400 bg-purple-500'
                          : 'border-white/20'
                      }`}
                    >
                      {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Navigation & Submit Buttons */}
          <div className="flex items-center justify-between pt-2">
            <button
              disabled={currentQIndex === 0}
              onClick={() => setCurrentQIndex((prev) => prev - 1)}
              className="px-4 py-2.5 rounded-xl glass-button text-xs font-semibold text-slate-300 hover:text-white disabled:opacity-30 disabled:pointer-events-none flex items-center gap-1.5"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Câu Trước</span>
            </button>

            {currentQIndex + 1 < totalQuestions ? (
              <button
                onClick={() => setCurrentQIndex((prev) => prev + 1)}
                className="px-5 py-2.5 rounded-xl bg-purple-600/40 border border-purple-400/40 text-white text-xs font-semibold hover:bg-purple-600/60 transition-all flex items-center gap-1.5 shadow-md shadow-purple-500/20"
              >
                <span>Câu Tiếp Theo</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-xs font-bold shadow-lg shadow-emerald-500/30 hover:scale-[1.02] transition-all"
              >
                Nộp Bài
              </button>
            )}
          </div>
        </div>
      ) : (
        /* QUIZ SCORE REPORT */
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="rounded-3xl glass-card p-8 text-center border border-purple-500/30 shadow-2xl relative overflow-hidden">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-purple-500 via-pink-500 to-amber-400 p-[1.5px] mx-auto mb-4 shadow-xl shadow-purple-500/30">
              <div className="w-full h-full bg-[#0d0e17] rounded-[15px] flex items-center justify-center">
                <Award className="w-8 h-8 text-amber-400" />
              </div>
            </div>

            <h2 className="text-2xl font-bold font-display text-white">Kết Quả Bài Làm</h2>
            <p className="text-xs text-slate-300 mt-1">
              Bạn đã hoàn thành bài kiểm tra trong thời gian quy định
            </p>

            <div className="my-6 inline-flex items-baseline gap-2 px-6 py-3 rounded-2xl bg-white/[0.04] border border-white/10">
              <span className="text-4xl font-extrabold font-display text-white shimmer-text">
                {score} / {totalQuestions}
              </span>
              <span className="text-sm font-semibold text-purple-300">
                ({Math.round((score / totalQuestions) * 100)}% Đúng)
              </span>
            </div>

            <div className="flex items-center justify-center gap-4">
              <button
                onClick={handleRetake}
                className="px-5 py-3 rounded-2xl glass-button text-xs font-semibold text-slate-200 hover:text-white flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Làm Lại Bài Này</span>
              </button>
            </div>
          </div>

          {/* Explanations */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold font-display text-white flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-purple-400" />
              <span>Đáp Án & Lời Giải Chi Tiết</span>
            </h3>

            {quiz.questions.map((q, idx) => {
              const isCorrect = selectedAnswers[idx] === q.correctIndex;

              return (
                <div
                  key={idx}
                  className={`p-5 rounded-2xl glass-card border ${
                    isCorrect ? 'border-emerald-500/30' : 'border-rose-500/30'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
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

                      <div className="mt-3 p-3 rounded-xl bg-white/[0.03] border border-white/10 text-xs text-slate-300">
                        <strong className="text-purple-300">💡 Giải thích:</strong> {q.explanation}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
