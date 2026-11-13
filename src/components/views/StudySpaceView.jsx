import React, { useState, useEffect, useRef } from 'react';
import {
  BookOpen,
  Sparkles,
  Calculator,
  Atom,
  Languages,
  FlaskConical,
  FileEdit,
  Save,
  Loader2,
  X,
  Upload,
  Video,
  FileText,
  Image as ImageIcon,
  Trash2,
  Play,
  ArrowLeft,
  Check
} from 'lucide-react';
import { STUDY_SUBJECTS } from '../../data/mockData';
import { getSessionUser } from '../../services/authService';
import {
  fetchUserNotes,
  saveUserNotes,
  fetchSubjectLessons,
  uploadSubjectLesson,
  deleteSubjectLesson,
  fetchUserLessonProgress,
  saveUserLessonProgress
} from '../../services/studyService';

const ICONS_MAP = {
  Calculator: Calculator,
  Atom: Atom,
  Languages: Languages,
  FlaskConical: FlaskConical,
};

function formatDuration(seconds) {
  const total = Math.max(0, Math.floor(seconds || 0));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function getLessonIcon(fileType) {
  if (fileType === 'video') return Video;
  if (fileType === 'image') return ImageIcon;
  return FileText;
}

export default function StudySpaceView({ currentUser: propsUser }) {
  const sessionUser = getSessionUser();
  const currentUser = propsUser || sessionUser;
  const username = currentUser?.username || 'admin';
  const isAdmin = currentUser?.role === 'admin';

  // Quick Notes state (đồng bộ theo user, nút Lưu giống Thời khóa biểu)
  const [notesContent, setNotesContent] = useState(() => {
    const cached = localStorage.getItem(`lumina_study_notes_${username}`);
    return cached !== null ? cached : '';
  });
  const [hasUnsavedNotes, setHasUnsavedNotes] = useState(false);
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  // Lessons & Recent In-Progress Videos state
  const [allLessons, setAllLessons] = useState([]);
  const [isLoadingLessons, setIsLoadingLessons] = useState(true);
  const [lessonProgress, setLessonProgress] = useState({});

  // Subject Modal & Lesson Viewer state
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [activeLesson, setActiveLesson] = useState(null);

  // Admin Upload state
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const fileInputRef = useRef(null);

  // Video player ref & progress throttle
  const videoRef = useRef(null);
  const lastSavedTimeRef = useRef(0);
  const hasSeekedRef = useRef(false);

  // Tải ghi chú, bài học và tiến độ xem video khi vào trang
  useEffect(() => {
    let isCancelled = false;

    async function loadInitialData() {
      setIsLoadingLessons(true);
      try {
        const [notes, lessons, progress] = await Promise.all([
          fetchUserNotes(username),
          fetchSubjectLessons(),
          fetchUserLessonProgress(username),
        ]);

        if (!isCancelled) {
          setNotesContent(notes);
          setHasUnsavedNotes(false);
          setAllLessons(lessons);
          setLessonProgress(progress || {});
        }
      } catch (err) {
        console.error('Lỗi khi tải dữ liệu trang Bài học:', err);
      } finally {
        if (!isCancelled) {
          setIsLoadingLessons(false);
        }
      }
    }

    loadInitialData();
    return () => {
      isCancelled = true;
    };
  }, [username]);

  // Lưu ghi chú lên Firebase (y chang nút Lưu thời khóa biểu)
  const handleSaveNotes = async () => {
    if (!hasUnsavedNotes || isSavingNotes) return;
    setIsSavingNotes(true);
    try {
      await saveUserNotes(username, notesContent);
      setHasUnsavedNotes(false);
    } catch (err) {
      console.error('Lỗi lưu ghi chú lên Firebase:', err);
    } finally {
      setIsSavingNotes(false);
    }
  };

  const handleCopyNotes = async () => {
    try {
      await navigator.clipboard.writeText(notesContent);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch {
      // Fallback nếu trình duyệt chặn clipboard API
    }
  };

  // Mở modal của 1 môn học
  const handleOpenSubject = (subject) => {
    setSelectedSubject(subject);
    setActiveLesson(null);
    setUploadTitle('');
    setUploadFile(null);
    setUploadError('');
    setUploadProgress(0);
  };

  // Mở thẳng video bài học từ mục "Bài Học Gần Đây"
  const handleOpenRecentVideo = (progressItem) => {
    const subject = STUDY_SUBJECTS.find((s) => s.id === progressItem.subjectId) || {
      id: progressItem.subjectId,
      name: progressItem.subjectName,
    };
    const matchedLesson = allLessons.find((l) => l.id === progressItem.lessonId) || {
      id: progressItem.lessonId,
      subjectId: progressItem.subjectId,
      subjectName: progressItem.subjectName,
      title: progressItem.title,
      fileName: progressItem.fileName,
      fileType: 'video',
      url: progressItem.url,
    };

    setSelectedSubject(subject);
    hasSeekedRef.current = false;
    setActiveLesson(matchedLesson);
  };

  // Admin: Upload file / video bài giảng vào thẻ môn học
  const handleUploadLesson = async (e) => {
    e.preventDefault();
    if (!isAdmin || !selectedSubject || !uploadFile || isUploading) return;

    setUploadError('');
    setIsUploading(true);
    setUploadProgress(0);

    try {
      const created = await uploadSubjectLesson({
        subjectId: selectedSubject.id,
        subjectName: selectedSubject.name,
        title: uploadTitle,
        file: uploadFile,
        uploadedBy: username,
        onProgress: (pct) => setUploadProgress(pct),
      });

      setAllLessons((prev) => [created, ...prev]);
      setUploadTitle('');
      setUploadFile(null);
      setUploadProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err) {
      setUploadError(err.message || 'Tải lên thất bại. Vui lòng thử lại.');
    } finally {
      setIsUploading(false);
    }
  };

  // Admin: Xóa bài học
  const handleDeleteLesson = async (lesson) => {
    if (!isAdmin) return;
    if (!window.confirm(`Bạn có chắc chắn muốn xóa "${lesson.title}"?`)) return;

    try {
      await deleteSubjectLesson(lesson);
      setAllLessons((prev) => prev.filter((item) => item.id !== lesson.id));
      if (activeLesson?.id === lesson.id) {
        setActiveLesson(null);
      }
    } catch (err) {
      alert(err.message || 'Không thể xóa bài học.');
    }
  };

  // Lưu tiến độ xem video
  const persistVideoProgress = async (lesson, currentTime, duration) => {
    if (!lesson || lesson.fileType !== 'video') return;
    const updated = await saveUserLessonProgress(username, lesson, currentTime, duration);
    if (updated) {
      setLessonProgress(updated);
    }
  };

  const handleVideoLoadedMetadata = () => {
    if (!videoRef.current || !activeLesson || hasSeekedRef.current) return;
    const saved = lessonProgress[activeLesson.id];
    if (saved && saved.currentTime > 0 && (!saved.duration || saved.currentTime < saved.duration - 2)) {
      videoRef.current.currentTime = saved.currentTime;
    }
    hasSeekedRef.current = true;
    lastSavedTimeRef.current = videoRef.current.currentTime || 0;
  };

  const handleVideoTimeUpdate = () => {
    if (!videoRef.current || !activeLesson) return;
    const nowTime = videoRef.current.currentTime || 0;
    const dur = videoRef.current.duration || 0;
    if (Math.abs(nowTime - lastSavedTimeRef.current) >= 5) {
      lastSavedTimeRef.current = nowTime;
      persistVideoProgress(activeLesson, nowTime, dur);
    }
  };

  const handleVideoPauseOrEnd = () => {
    if (!videoRef.current || !activeLesson) return;
    persistVideoProgress(
      activeLesson,
      videoRef.current.currentTime || 0,
      videoRef.current.duration || 0
    );
  };

  const handleCloseModal = () => {
    if (videoRef.current && activeLesson) {
      persistVideoProgress(
        activeLesson,
        videoRef.current.currentTime || 0,
        videoRef.current.duration || 0
      );
    }
    setSelectedSubject(null);
    setActiveLesson(null);
  };

  // Lọc danh sách video đang xem dở cho mục "Bài Học Gần Đây"
  const recentInProgressVideos = Object.values(lessonProgress || {})
    .filter((item) => {
      if (!item || !item.currentTime || item.currentTime <= 0) return false;
      if (item.duration && item.currentTime >= item.duration - 2) return false;
      // Chỉ hiển thị bài học còn tồn tại (nếu danh sách bài học đã tải xong)
      if (!isLoadingLessons && allLessons.length > 0) {
        return allLessons.some((l) => l.id === item.lessonId);
      }
      return allLessons.some((l) => l.id === item.lessonId);
    })
    .sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''));

  const subjectLessons = selectedSubject
    ? allLessons.filter((l) => l.subjectId === selectedSubject.id)
    : [];

  return (
    <div className="space-y-6 md:space-y-8 pb-10">
      {/* 1. Subjects Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {STUDY_SUBJECTS.map((sub) => {
          const SubIcon = ICONS_MAP[sub.icon] || BookOpen;

          return (
            <div
              key={sub.id}
              onClick={() => handleOpenSubject(sub)}
              className="relative overflow-hidden rounded-3xl glass-card p-5 border border-white/10 group hover:border-purple-400/40 flex items-center gap-4 cursor-pointer"
            >
              <div className="p-3 rounded-2xl bg-white/[0.05] border border-white/10 text-purple-300 group-hover:scale-110 transition-transform">
                <SubIcon className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold font-display text-white group-hover:text-purple-300 transition-colors">
                {sub.name}
              </h3>
            </div>
          );
        })}
      </div>

      {/* 2. Recent Lessons & Notes Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left: Recent Lessons (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg md:text-xl font-bold font-display text-white flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-emerald-400" />
            <span>Bài Học Gần Đây</span>
          </h2>

          {recentInProgressVideos.length === 0 ? (
            <div className="p-8 rounded-3xl glass-card border border-white/10 text-center text-xs sm:text-sm text-slate-400">
              Chưa có bài học gần đây.
            </div>
          ) : (
            <div className="space-y-3">
              {recentInProgressVideos.map((item) => {
                const percent = item.duration
                  ? Math.min(100, Math.round((item.currentTime / item.duration) * 100))
                  : 0;

                return (
                  <div
                    key={item.lessonId}
                    onClick={() => handleOpenRecentVideo(item)}
                    className="p-4 rounded-2xl glass-card border border-white/10 hover:border-purple-400/40 cursor-pointer transition-all flex items-center justify-between gap-4 group"
                  >
                    <div className="flex items-center gap-3.5 min-w-0 flex-1">
                      <div className="p-2.5 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-300 group-hover:scale-105 transition-transform flex-shrink-0">
                        <Play className="w-4 h-4 fill-purple-300" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="text-xs sm:text-sm font-bold text-white truncate group-hover:text-purple-300 transition-colors">
                          {item.title}
                        </h4>
                        <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-1">
                          <span className="text-purple-300 font-medium">{item.subjectName}</span>
                          <span>•</span>
                          <span className="font-mono">
                            {formatDuration(item.currentTime)}
                            {item.duration ? ` / ${formatDuration(item.duration)}` : ''}
                          </span>
                        </div>
                        {item.duration > 0 && (
                          <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden mt-2">
                            <div
                              className="h-full bg-gradient-to-r from-purple-500 to-indigo-400 rounded-full"
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                        )}
                      </div>
                    </div>

                    <span className="text-[11px] font-semibold text-purple-300 flex-shrink-0">
                      Xem tiếp
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: Notes Pad (1 col) - Gộp tiêu đề "Sổ Ghi Chú Nhanh" vào khung & thay "Nhấn để sao chép" bằng nút Lưu */}
        <div className="p-5 rounded-3xl glass-card border border-white/10 space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <div className="flex items-center gap-2">
              <FileEdit className="w-4 h-4 text-purple-400" />
              <h2 className="text-sm sm:text-base font-bold font-display text-white">
                Sổ Ghi Chú Nhanh
              </h2>
            </div>
            <span className="flex items-center gap-1 text-[11px] text-purple-300 font-medium">
              <Sparkles className="w-3 h-3" />
              <span>Ghi chú cá nhân</span>
            </span>
          </div>

          <textarea
            rows={9}
            value={notesContent}
            onChange={(e) => {
              setNotesContent(e.target.value);
              setHasUnsavedNotes(true);
            }}
            placeholder="Ghi chú công thức cần nhớ, bài tập giáo viên dặn..."
            className="w-full bg-transparent resize-none text-xs sm:text-sm text-slate-200 leading-relaxed placeholder-slate-500 focus:outline-none"
          />

          <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-2">
            {/* Nút Lưu ghi chú: y chang nút Lưu thời khóa biểu */}
            <button
              onClick={handleSaveNotes}
              disabled={!hasUnsavedNotes || isSavingNotes}
              title={
                hasUnsavedNotes
                  ? `Lưu ghi chú lên Firebase cho tài khoản @${username}`
                  : 'Mặc định mờ. Nút sẽ sáng lên khi bạn chỉnh sửa nội dung ghi chú'
              }
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all duration-300 ${
                hasUnsavedNotes
                  ? 'bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 text-white shadow-lg shadow-emerald-600/35 hover:scale-[1.02] active:scale-[0.98] cursor-pointer border border-emerald-400/50 ring-2 ring-emerald-400/25'
                  : 'border border-white/10 bg-white/[0.04] text-slate-400 opacity-40 cursor-not-allowed shadow-none'
              } ${isSavingNotes ? 'cursor-wait opacity-85' : ''}`}
            >
              {isSavingNotes ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                  <span>Đang lưu...</span>
                </>
              ) : (
                <>
                  <Save className={`w-3.5 h-3.5 ${hasUnsavedNotes ? 'text-white' : 'text-slate-400'}`} />
                  <span>Lưu ghi chú</span>
                </>
              )}
            </button>

            <button
              onClick={handleCopyNotes}
              className="px-3 py-1.5 rounded-xl glass-button text-xs font-semibold text-purple-300 hover:text-white flex items-center gap-1 cursor-pointer"
            >
              {isCopied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Đã sao chép</span>
                </>
              ) : (
                <span>Sao Chép</span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* 3. MODAL: NỘI DUNG MÔN HỌC (ADMIN UPLOAD / HỌC SINH CHỈ XEM - KHÔNG TẢI VỀ) */}
      {selectedSubject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
          <div className="w-full max-w-4xl max-h-[90vh] flex flex-col rounded-3xl glass-card border border-white/20 shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                {activeLesson && (
                  <button
                    onClick={() => {
                      handleVideoPauseOrEnd();
                      setActiveLesson(null);
                    }}
                    className="p-2 rounded-xl glass-button text-slate-300 hover:text-white cursor-pointer"
                    title="Quay lại danh sách bài học"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                )}
                <div>
                  <h3 className="text-base sm:text-lg font-bold font-display text-white">
                    {activeLesson ? activeLesson.title : selectedSubject.name}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    {activeLesson
                      ? `${selectedSubject.name} • Chế độ chỉ xem`
                      : `${subjectLessons.length} tài liệu / bài giảng`}
                  </p>
                </div>
              </div>

              <button
                onClick={handleCloseModal}
                className="p-2 rounded-xl glass-button text-slate-400 hover:text-white cursor-pointer"
                title="Đóng"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {activeLesson ? (
                /* IN-APP VIEWER (NO DOWNLOAD) */
                <div
                  className="w-full rounded-2xl overflow-hidden border border-white/10 bg-black/40 select-none"
                  onContextMenu={(e) => e.preventDefault()}
                >
                  {activeLesson.fileType === 'video' ? (
                    <video
                      ref={videoRef}
                      src={activeLesson.url}
                      controls
                      controlsList="nodownload"
                      disablePictureInPicture
                      onContextMenu={(e) => e.preventDefault()}
                      onLoadedMetadata={handleVideoLoadedMetadata}
                      onTimeUpdate={handleVideoTimeUpdate}
                      onPause={handleVideoPauseOrEnd}
                      onEnded={handleVideoPauseOrEnd}
                      className="w-full max-h-[65vh] bg-black outline-none"
                    />
                  ) : activeLesson.fileType === 'image' ? (
                    <div className="flex items-center justify-center p-4 bg-black/20">
                      <img
                        src={activeLesson.url}
                        alt={activeLesson.title}
                        draggable={false}
                        onContextMenu={(e) => e.preventDefault()}
                        className="max-h-[65vh] w-auto object-contain rounded-xl pointer-events-none select-none"
                      />
                    </div>
                  ) : activeLesson.fileType === 'pdf' ? (
                    <iframe
                      title={activeLesson.title}
                      src={`${activeLesson.url}#toolbar=0&navpanes=0`}
                      className="w-full h-[65vh] border-0 bg-white"
                    />
                  ) : (
                    <iframe
                      title={activeLesson.title}
                      src={`https://docs.google.com/gview?url=${encodeURIComponent(activeLesson.url)}&embedded=true`}
                      className="w-full h-[65vh] border-0 bg-white"
                    />
                  )}
                </div>
              ) : (
                <>
                  {/* ADMIN ONLY: Form Upload File / Video */}
                  {isAdmin && (
                    <form
                      onSubmit={handleUploadLesson}
                      className="p-4 rounded-2xl bg-white/[0.04] border border-purple-500/30 space-y-3"
                    >
                      <div className="flex items-center gap-2 text-xs font-bold text-purple-300 uppercase tracking-wider">
                        <Upload className="w-4 h-4" />
                        <span>Tải lên tài liệu / video bài giảng (Quản trị viên)</span>
                      </div>

                      {uploadError && (
                        <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs">
                          {uploadError}
                        </div>
                      )}

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <input
                          type="text"
                          required
                          placeholder="Tiêu đề bài học..."
                          value={uploadTitle}
                          onChange={(e) => setUploadTitle(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.05] border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-purple-400"
                        />

                        <input
                          ref={fileInputRef}
                          type="file"
                          required
                          accept="video/*,.pdf,.doc,.docx,.ppt,.pptx,.png,.jpg,.jpeg,.webp"
                          onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                          className="w-full px-3 py-2 rounded-xl bg-white/[0.05] border border-white/10 text-slate-300 text-xs file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-purple-600/30 file:text-purple-200 cursor-pointer"
                        />
                      </div>

                      {isUploading && (
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[11px] text-slate-300">
                            <span>Đang tải lên Firebase Storage...</span>
                            <span className="font-mono font-bold text-purple-300">{uploadProgress}%</span>
                          </div>
                          <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-purple-500 to-indigo-400 transition-all"
                              style={{ width: `${uploadProgress}%` }}
                            />
                          </div>
                        </div>
                      )}

                      <div className="flex justify-end">
                        <button
                          type="submit"
                          disabled={isUploading || !uploadFile}
                          className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-xs font-bold flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                        >
                          {isUploading ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              <span>Đang tải lên...</span>
                            </>
                          ) : (
                            <>
                              <Upload className="w-3.5 h-3.5" />
                              <span>Đăng Bài Học</span>
                            </>
                          )}
                        </button>
                      </div>
                    </form>
                  )}

                  {/* Danh sách bài học trong môn */}
                  {isLoadingLessons ? (
                    <div className="py-12 text-center text-xs text-slate-400 space-y-2">
                      <Loader2 className="w-6 h-6 text-purple-400 animate-spin mx-auto" />
                      <p>Đang tải nội dung môn học...</p>
                    </div>
                  ) : subjectLessons.length === 0 ? (
                    <div className="py-12 text-center text-xs sm:text-sm text-slate-400 border border-dashed border-white/10 rounded-2xl">
                      Chưa có bài học nào trong môn {selectedSubject.name}.
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {subjectLessons.map((lesson) => {
                        const LessonIcon = getLessonIcon(lesson.fileType);
                        const savedProg = lessonProgress[lesson.id];

                        return (
                          <div
                            key={lesson.id}
                            onClick={() => {
                              hasSeekedRef.current = false;
                              setActiveLesson(lesson);
                            }}
                            className="p-4 rounded-2xl glass-card border border-white/10 hover:border-purple-400/40 cursor-pointer transition-all flex items-center justify-between gap-4 group"
                          >
                            <div className="flex items-center gap-3.5 min-w-0">
                              <div className="p-2.5 rounded-xl bg-white/[0.05] border border-white/10 text-purple-300 flex-shrink-0">
                                <LessonIcon className="w-4 h-4" />
                              </div>
                              <div className="min-w-0">
                                <h4 className="text-xs sm:text-sm font-bold text-white truncate group-hover:text-purple-300 transition-colors">
                                  {lesson.title}
                                </h4>
                                <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                                  <span className="uppercase font-mono">{lesson.fileType}</span>
                                  {lesson.fileType === 'video' && savedProg?.currentTime > 0 && (
                                    <>
                                      <span>•</span>
                                      <span className="text-emerald-400 font-mono">
                                        Đã xem {formatDuration(savedProg.currentTime)}
                                      </span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 flex-shrink-0">
                              <span className="text-xs font-semibold text-purple-300">
                                Xem
                              </span>
                              {isAdmin && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteLesson(lesson);
                                  }}
                                  className="p-2 rounded-xl glass-button text-rose-400 hover:bg-rose-500/20 cursor-pointer"
                                  title="Xóa bài học"
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
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
