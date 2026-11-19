import React, { useState, useEffect } from 'react';
import {
  HelpCircle,
  Clock,
  ChevronRight,
  BookOpen,
  Calculator,
  Atom,
  Languages,
  FlaskConical,
  ArrowLeft,
  Plus,
  Trash2,
  Loader2,
  FileText,
  Play,
  Pencil,
} from 'lucide-react';
import { STUDY_SUBJECTS } from '../../data/mockData';
import { getSessionUser } from '../../services/authService';
import {
  EXAM_CATEGORIES,
  fetchAllExams,
  deleteExam,
  normalizeExamData,
} from '../../services/quizService';
import { useConfirmDelete } from '../ConfirmDeleteProvider';
import QuizExamEditorModal from './QuizExamEditorModal';
import QuizExamRunner from './QuizExamRunner';

const ICONS_MAP = {
  Calculator,
  Atom,
  Languages,
  FlaskConical,
};

function getExamSectionBadges(exam) {
  const norm = normalizeExamData(exam);
  const badges = [];
  if (norm.mcQuestions.length > 0) badges.push(`${norm.mcQuestions.length} Trắc nghiệm`);
  if (norm.tfQuestions.length > 0)
    badges.push(`${norm.tfQuestions.length} ${norm.isEnglish ? 'True/False' : 'Đúng/Sai'}`);
  if (!norm.isEnglish && norm.shortQuestions.length > 0)
    badges.push(`${norm.shortQuestions.length} Trả lời ngắn`);
  if (norm.isEnglish && norm.readingPassages.length > 0)
    badges.push(`${norm.readingPassages.length} Reading`);
  if (norm.essayQuestions.length > 0) badges.push(`${norm.essayQuestions.length} Tự luận`);
  return badges;
}

export default function QuizReviewView({ currentUser: propsUser }) {
  const sessionUser = getSessionUser();
  const currentUser = propsUser || sessionUser;
  const username = currentUser?.username || 'student';
  const isAdmin = currentUser?.role === 'admin';
  const { requestDelete } = useConfirmDelete();

  // Navigation state: Subjects -> 4 Exam Categories -> Exam List -> Active Exam
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [activeExam, setActiveExam] = useState(null);

  // Exams data
  const [allExams, setAllExams] = useState([]);
  const [isLoadingExams, setIsLoadingExams] = useState(true);

  // Admin Create/Edit Modal state
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingExam, setEditingExam] = useState(null);

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

  const openCreateModal = () => {
    if (!isAdmin) return;
    setEditingExam(null);
    setIsEditorOpen(true);
  };

  const openEditModal = (exam, e) => {
    e.stopPropagation();
    if (!isAdmin) return;
    setEditingExam(exam);
    setIsEditorOpen(true);
  };

  const handleExamSaved = (savedExam) => {
    setAllExams((prev) => [savedExam, ...prev.filter((ex) => ex.id !== savedExam.id)]);
    setIsEditorOpen(false);
    setEditingExam(null);
  };

  const handleDeleteExam = (examId, e) => {
    e.stopPropagation();
    if (!isAdmin) return;
    const targetExam = allExams.find((ex) => ex.id === examId);
    const examTitle = targetExam?.title || 'đề thi này';
    const prevExams = allExams;

    requestDelete({
      title: 'Xác nhận xóa đề thi',
      message: `Bạn có chắc chắn muốn xóa đề "${examTitle}"?`,
      itemLabel: `Đã xóa đề "${examTitle}"`,
      onOptimisticDelete: () => {
        setAllExams((prev) => prev.filter((ex) => ex.id !== examId));
      },
      onUndo: () => {
        setAllExams(prevExams);
      },
      onCommitDelete: async () => {
        await deleteExam(examId);
      },
    });
  };

  // Filtered exams for current subject & category
  const currentCategoryExams =
    selectedSubject && selectedCategory
      ? allExams.filter(
          (ex) => ex.subjectId === selectedSubject.id && ex.categoryId === selectedCategory.id
        )
      : [];

  // ============================================================================
  // VIEW 4: ĐANG LÀM ĐỀ THI & XEM KẾT QUẢ
  // ============================================================================
  if (activeExam) {
    return (
      <QuizExamRunner
        exam={activeExam}
        subject={selectedSubject}
        category={selectedCategory}
        onExit={() => setActiveExam(null)}
      />
    );
  }

  // ============================================================================
  // VIEW 1, 2, 3: MÔN HỌC -> 4 KỲ THI -> DANH SÁCH ĐỀ (+ MODAL ADMIN TẠO/SỬA ĐỀ)
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
                Chưa có đề nào trong mục &quot;{selectedCategory.name}&quot;.
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
              {currentCategoryExams.map((exam) => {
                const badges = getExamSectionBadges(exam);
                return (
                  <div
                    key={exam.id}
                    onClick={() => setActiveExam(exam)}
                    className="p-5 rounded-3xl glass-card border border-white/10 hover:border-purple-400/50 cursor-pointer transition-all group flex items-center justify-between gap-4"
                  >
                    <div className="space-y-1.5 min-w-0">
                      <h4 className="text-base font-bold font-display text-white group-hover:text-purple-300 transition-colors truncate">
                        {exam.title}
                      </h4>
                      <div className="flex items-center gap-2.5 text-xs text-slate-400 flex-wrap">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-purple-400" />
                          {exam.durationMinutes} phút
                        </span>
                        <span>•</span>
                        <span>{exam.questionsCount || 0} câu hỏi</span>
                      </div>
                      {badges.length > 0 && (
                        <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                          {badges.map((b, i) => (
                            <span
                              key={i}
                              className="px-2 py-0.5 rounded-lg bg-white/[0.05] border border-white/10 text-[10px] font-semibold text-slate-300"
                            >
                              {b}
                            </span>
                          ))}
                        </div>
                      )}
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
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* MODAL ADMIN TẠO / CHỈNH SỬA / AI TẠO ĐỀ THI */}
      {isEditorOpen && isAdmin && selectedSubject && selectedCategory && (
        <QuizExamEditorModal
          subject={selectedSubject}
          category={selectedCategory}
          editingExam={editingExam}
          username={username}
          onClose={() => {
            setIsEditorOpen(false);
            setEditingExam(null);
          }}
          onSaved={handleExamSaved}
        />
      )}
    </div>
  );
}
