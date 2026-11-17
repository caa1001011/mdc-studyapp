import React, { useState, useEffect, useRef } from 'react';
import {
  BookOpen,
  Calculator,
  Atom,
  Languages,
  FlaskConical,
  FileEdit,
  Save,
  Loader2,
  Upload,
  Video,
  FileText,
  Image as ImageIcon,
  Trash2,
  Play,
  ArrowLeft,
  Check,
  Network,
  ClipboardCheck,
  ChevronDown,
  ChevronUp,
  Folder,
  FolderPlus,
  Pencil,
  ChevronRight,
  ChevronLeft,
  Maximize2,
  Minimize2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  X
} from 'lucide-react';
import { STUDY_SUBJECTS } from '../../data/mockData';
import { getSessionUser } from '../../services/authService';
import {
  fetchUserNotes,
  saveUserNotes,
  fetchSubjectLessons,
  uploadSubjectLesson,
  uploadDriveLesson,
  fetchLessonFolders,
  createLessonFolder,
  renameLessonFolder,
  deleteLessonFolder,
  deleteSubjectLesson,
  fetchUserLessonProgress,
  saveUserLessonProgress,
  fetchUserRecentLessons,
  saveUserRecentLessons
} from '../../services/studyService';
import {
  getDriveSubjectFolderName,
  fetchAppsScriptUrl,
  getSavedAppsScriptUrl,
  saveAppsScriptUrl
} from '../../services/googleDriveService';

const ICONS_MAP = {
  Calculator: Calculator,
  Atom: Atom,
  Languages: Languages,
  FlaskConical: FlaskConical,
};

const LESSON_SUBFEATURES = [
  {
    id: 'video',
    label: 'Video bài giảng',
    icon: Video,
    accept: 'video/*',
    placeholder: 'Tiêu đề video bài giảng...',
    uploadLabel: 'Tải lên Video bài giảng',
    emptyText: 'Chưa có video bài giảng nào',
  },
  {
    id: 'mindmap',
    label: 'Sơ đồ tư duy',
    icon: Network,
    accept: '.png,.jpg,.jpeg,image/png,image/jpeg',
    placeholder: 'Tiêu đề sơ đồ tư duy...',
    uploadLabel: 'Tải lên Sơ đồ tư duy (.png, .jpg, .jpeg)',
    emptyText: 'Chưa có sơ đồ tư duy nào',
  },
  {
    id: 'exercise',
    label: 'Bài tập củng cố kiến thức',
    icon: ClipboardCheck,
    accept: '.pdf,.doc,.docx,.ppt,.pptx,.png,.jpg,.jpeg,.webp',
    placeholder: 'Tiêu đề bài tập củng cố...',
    uploadLabel: 'Tải lên Bài tập củng cố kiến thức',
    emptyText: 'Chưa có bài tập củng cố kiến thức nào',
  },
];

function getLessonCategory(lesson) {
  return lesson.category || (lesson.fileType === 'video' ? 'video' : 'exercise');
}

function getMindmapImageUrl(lesson) {
  if (!lesson) return '';
  if (lesson.storageType === 'google_drive' && lesson.driveFileId) {
    return `https://lh3.googleusercontent.com/d/${lesson.driveFileId}=w2000`;
  }
  return lesson.url || '';
}

function getMindmapFallbackUrl(lesson) {
  if (!lesson) return '';
  if (lesson.storageType === 'google_drive' && lesson.driveFileId) {
    return `https://drive.google.com/thumbnail?id=${lesson.driveFileId}&sz=w2000`;
  }
  return lesson.url || '';
}

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
  const [isNotesOpen, setIsNotesOpen] = useState(false);

  // Lessons & Recent In-Progress Videos state
  const [allLessons, setAllLessons] = useState([]);
  const [isLoadingLessons, setIsLoadingLessons] = useState(true);
  const [lessonProgress, setLessonProgress] = useState({});

  // Subject Modal & Lesson Viewer state
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [activeCategory, setActiveCategory] = useState('video');
  const [activeLesson, setActiveLesson] = useState(null);

  // Thư mục bài học (cho Video bài giảng)
  const [folders, setFolders] = useState([]);
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [showNewFolderInput, setShowNewFolderInput] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [editingFolderId, setEditingFolderId] = useState(null);
  const [editingFolderName, setEditingFolderName] = useState('');
  const [folderError, setFolderError] = useState('');
  const [appsScriptUrl, setAppsScriptUrl] = useState(() => getSavedAppsScriptUrl());
  const [showScriptConfig, setShowScriptConfig] = useState(() => !getSavedAppsScriptUrl());
  const [isTheaterMode, setIsTheaterMode] = useState(false);
  const [zoomedMindmap, setZoomedMindmap] = useState(null);
  const [zoomScale, setZoomScale] = useState(1);
  const [recentLessons, setRecentLessons] = useState([]);

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
        const [notes, lessons, progress, loadedFolders, savedScriptUrl, loadedRecent] = await Promise.all([
          fetchUserNotes(username),
          fetchSubjectLessons(),
          fetchUserLessonProgress(username),
          fetchLessonFolders(),
          fetchAppsScriptUrl(),
          fetchUserRecentLessons(username),
        ]);

        if (!isCancelled) {
          setNotesContent(notes);
          setHasUnsavedNotes(false);
          setAllLessons(lessons);
          setLessonProgress(progress || {});
          setFolders(loadedFolders || []);
          setRecentLessons(Array.isArray(loadedRecent) ? loadedRecent.slice(0, 5) : []);
          if (savedScriptUrl) {
            setAppsScriptUrl(savedScriptUrl);
            setShowScriptConfig(false);
          }
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
    setActiveCategory('video');
    setSelectedFolder(null);
    setShowNewFolderInput(false);
    setNewFolderName('');
    setFolderError('');
    setActiveLesson(null);
    setUploadTitle('');
    setUploadFile(null);
    setUploadError('');
    setUploadProgress(0);
  };

  // Admin: Tạo thư mục bài học (VD: "Bài học 1")
  const handleCreateFolder = async (e) => {
    e.preventDefault();
    if (!isAdmin || !selectedSubject || isCreatingFolder) return;
    const clean = newFolderName.trim();
    if (!clean) return;

    setFolderError('');
    setIsCreatingFolder(true);
    try {
      const created = await createLessonFolder({
        subjectId: selectedSubject.id,
        subjectName: selectedSubject.name,
        category: activeCategory,
        name: clean,
        createdBy: username,
      });
      setFolders((prev) => [...prev, created]);
      setNewFolderName('');
      setShowNewFolderInput(false);
    } catch (err) {
      setFolderError(err.message || 'Không thể tạo thư mục bài học.');
    } finally {
      setIsCreatingFolder(false);
    }
  };

  // Admin: Đổi tên thư mục bài học
  const handleRenameFolder = async (folderId) => {
    const clean = editingFolderName.trim();
    if (!clean) {
      setEditingFolderId(null);
      return;
    }
    try {
      await renameLessonFolder(folderId, clean);
      setFolders((prev) => prev.map((f) => (f.id === folderId ? { ...f, name: clean } : f)));
      if (selectedFolder?.id === folderId) {
        setSelectedFolder((prev) => (prev ? { ...prev, name: clean } : null));
      }
    } catch (err) {
      alert(err.message || 'Không thể đổi tên thư mục.');
    } finally {
      setEditingFolderId(null);
    }
  };

  // Admin: Xóa thư mục bài học
  const handleDeleteFolder = async (folder, e) => {
    e.stopPropagation();
    if (!isAdmin) return;
    const folderVideos = allLessons.filter((l) => l.folderId === folder.id);
    if (folderVideos.length > 0) {
      alert('Vui lòng xóa các video bên trong thư mục trước khi xóa thư mục này.');
      return;
    }
    if (!window.confirm(`Bạn có chắc chắn muốn xóa thư mục "${folder.name}"?`)) return;

    try {
      await deleteLessonFolder(folder.id);
      setFolders((prev) => prev.filter((f) => f.id !== folder.id));
      if (selectedFolder?.id === folder.id) {
        setSelectedFolder(null);
      }
    } catch (err) {
      alert(err.message || 'Không thể xóa thư mục.');
    }
  };

  // Ghi nhận bài học / thư mục người dùng vừa truy cập (tối đa 5 bài gần nhất)
  const trackRecentAccess = (entry) => {
    if (!entry || !entry.id) return;
    const item = {
      ...entry,
      accessedAt: new Date().toISOString(),
    };
    setRecentLessons((prev) => {
      const next = [item, ...prev.filter((x) => x.id !== item.id)].slice(0, 5);
      saveUserRecentLessons(username, next);
      return next;
    });
  };

  const handleOpenFolder = (folder) => {
    if (!folder || !selectedSubject) return;
    setSelectedFolder(folder);
    setUploadTitle('');
    setUploadFile(null);
    setUploadError('');
    setUploadProgress(0);
    trackRecentAccess({
      id: folder.id,
      kind: 'folder',
      subjectId: selectedSubject.id,
      subjectName: selectedSubject.name,
      category: activeCategory,
      folderId: folder.id,
      folderName: folder.name,
      title: folder.name,
    });
  };

  const handleOpenLesson = (lesson) => {
    if (!lesson) return;
    hasSeekedRef.current = false;
    setActiveLesson(lesson);
    trackRecentAccess({
      id: lesson.id,
      kind: 'lesson',
      subjectId: lesson.subjectId || selectedSubject?.id,
      subjectName: lesson.subjectName || selectedSubject?.name || '',
      category: getLessonCategory(lesson),
      folderId: lesson.folderId || selectedFolder?.id || null,
      folderName: lesson.folderName || selectedFolder?.name || null,
      title: lesson.title,
      fileType: lesson.fileType || null,
    });
  };

  // Mở lại bài học / thư mục từ mục "Bài Học Gần Đây"
  const handleOpenRecentItem = (item) => {
    const subject = STUDY_SUBJECTS.find((s) => s.id === item.subjectId) || {
      id: item.subjectId,
      name: item.subjectName,
    };

    setSelectedSubject(subject);
    setActiveCategory(item.category || 'video');
    setUploadTitle('');
    setUploadFile(null);
    setUploadError('');
    setUploadProgress(0);

    if (item.kind === 'folder') {
      const matchedFolder = folders.find((f) => f.id === item.folderId || f.id === item.id) || {
        id: item.folderId || item.id,
        subjectId: item.subjectId,
        subjectName: item.subjectName,
        category: item.category || 'video',
        name: item.folderName || item.title,
      };
      setSelectedFolder(matchedFolder);
      setActiveLesson(null);
      trackRecentAccess(item);
      return;
    }

    const matchedLesson = allLessons.find((l) => l.id === item.id);
    if (matchedLesson) {
      const matchedFolder = matchedLesson.folderId
        ? folders.find((f) => f.id === matchedLesson.folderId) || null
        : null;
      setSelectedFolder(matchedFolder);
      hasSeekedRef.current = false;
      setActiveLesson(matchedLesson);
      trackRecentAccess({
        ...item,
        title: matchedLesson.title,
      });
    }
  };

  // Admin: Upload file / video bài giảng / sơ đồ tư duy vào thẻ môn học (lưu lên Google Drive)
  const handleUploadLesson = async (e) => {
    e.preventDefault();
    if (!isAdmin || !selectedSubject || !uploadFile || isUploading) return;
    const isFolderCategory = activeCategory === 'video' || activeCategory === 'mindmap';
    if (isFolderCategory && !selectedFolder) {
      setUploadError('Vui lòng chọn hoặc tạo thư mục bài học trước khi tải lên.');
      return;
    }
    if (activeCategory === 'mindmap' && !/\.(png|jpe?g)$/i.test(uploadFile.name || '') && !/^image\/(png|jpeg)$/i.test(uploadFile.type || '')) {
      setUploadError('Sơ đồ tư duy chỉ hỗ trợ 1 tệp hình ảnh (.png, .jpg, .jpeg).');
      return;
    }

    setUploadError('');
    setIsUploading(true);
    setUploadProgress(0);

    try {
      let created;
      if (isFolderCategory) {
        if (appsScriptUrl) {
          await saveAppsScriptUrl(appsScriptUrl);
        }
        created = await uploadDriveLesson({
          subject: selectedSubject,
          category: activeCategory,
          folderId: selectedFolder.id,
          folderName: selectedFolder.name,
          title: uploadTitle,
          file: uploadFile,
          uploadedBy: username,
          appsScriptUrl,
          onProgress: (pct) => setUploadProgress(pct),
        });
      } else {
        created = await uploadSubjectLesson({
          subjectId: selectedSubject.id,
          subjectName: selectedSubject.name,
          category: activeCategory,
          title: uploadTitle,
          file: uploadFile,
          uploadedBy: username,
          onProgress: (pct) => setUploadProgress(pct),
        });
      }

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

  // Lọc danh sách bài học người dùng đã truy cập gần đây (tối đa 5 bài, bỏ bài đã bị xóa)
  const visibleRecentLessons = recentLessons
    .filter((item) => {
      if (!item) return false;
      if (isLoadingLessons) return true;
      if (item.kind === 'folder') {
        return folders.some((f) => f.id === item.id || f.id === item.folderId);
      }
      return allLessons.some((l) => l.id === item.id);
    })
    .slice(0, 5);

  const subjectLessons = selectedSubject
    ? allLessons.filter((l) => l.subjectId === selectedSubject.id)
    : [];

  const currentSubfeature =
    LESSON_SUBFEATURES.find((item) => item.id === activeCategory) || LESSON_SUBFEATURES[0];

  const currentTabLessons = subjectLessons.filter(
    (l) => getLessonCategory(l) === activeCategory
  );

  const usesFolders = activeCategory === 'video' || activeCategory === 'mindmap';

  const subjectCategoryFolders = selectedSubject
    ? folders.filter((f) => f.subjectId === selectedSubject.id && (f.category || 'video') === activeCategory)
    : [];

  const driveSubjectName = getDriveSubjectFolderName(selectedSubject);

  const displayedLessons =
    usesFolders && selectedFolder
      ? currentTabLessons.filter((l) => l.folderId === selectedFolder.id)
      : currentTabLessons;

  // ============================================================================
  // TRANG CHI TIẾT MÔN HỌC (KHI NHẤP VÀO THẺ MÔN HỌC)
  // ============================================================================
  if (selectedSubject) {
    const SubjectIcon = ICONS_MAP[selectedSubject.icon] || BookOpen;

    return (
      <div className="space-y-5 pb-10">
        {/* Top Back & Subject Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                if (activeLesson) {
                  handleVideoPauseOrEnd();
                  setActiveLesson(null);
                } else {
                  handleCloseModal();
                }
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl glass-button text-xs font-semibold text-slate-300 hover:text-white cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{activeLesson ? `Quay lại ${selectedSubject.name}` : 'Quay lại trang Bài học'}</span>
            </button>

            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-white/[0.06] border border-white/10 text-purple-300">
                <SubjectIcon className="w-4 h-4" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-extrabold font-display text-white">
                  {activeLesson ? activeLesson.title : selectedSubject.name}
                </h1>
                <p className="text-[11px] text-slate-400">
                  {activeLesson
                    ? selectedSubject.name
                    : usesFolders
                    ? `${subjectCategoryFolders.length} bài học`
                    : `${currentTabLessons.length} bài tập`}
                </p>
              </div>
            </div>
          </div>
        </div>

        {activeLesson ? (
          activeLesson.fileType === 'video' || getLessonCategory(activeLesson) === 'mindmap' ? (
            /* YOUTUBE-STYLE ONLINE WATCH / VIEWER FOR VIDEO & MINDMAP */
            (() => {
              const lessonCat = getLessonCategory(activeLesson);
              const isVideoLesson = activeLesson.fileType === 'video';
              const playlist = subjectLessons
                .filter((l) => getLessonCategory(l) === lessonCat)
                .filter((l) => (activeLesson.folderId ? l.folderId === activeLesson.folderId : !l.folderId));
              const currentIdx = playlist.findIndex((l) => l.id === activeLesson.id);
              const prevItem = currentIdx > 0 ? playlist[currentIdx - 1] : null;
              const nextItem = currentIdx >= 0 && currentIdx < playlist.length - 1 ? playlist[currentIdx + 1] : null;
              const driveEmbedSrc = activeLesson.driveFileId
                ? `https://drive.google.com/file/d/${activeLesson.driveFileId}/preview`
                : activeLesson.url;

              return (
                <div className={`grid grid-cols-1 gap-5 ${isTheaterMode ? '' : 'lg:grid-cols-3 items-start'}`}>
                  {/* Cột Trình xem / phát chính */}
                  <div className={isTheaterMode ? 'space-y-3' : 'lg:col-span-2 space-y-3'}>
                    <div
                      className="relative w-full aspect-video rounded-2xl overflow-hidden border border-white/15 bg-black shadow-2xl select-none"
                      onContextMenu={(e) => e.preventDefault()}
                    >
                      {activeLesson.storageType === 'google_drive' ? (
                        <>
                          <iframe
                            key={activeLesson.id}
                            title={activeLesson.title}
                            src={driveEmbedSrc}
                            allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
                            allowFullScreen
                            className="w-full h-full border-0 bg-black"
                          />
                          <div
                            className="absolute top-0 right-0 w-14 h-14 z-10 bg-transparent"
                            title="Trình xem trực tuyến"
                          />
                        </>
                      ) : isVideoLesson ? (
                        <video
                          key={activeLesson.id}
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
                          className="w-full h-full bg-black outline-none"
                        />
                      ) : activeLesson.fileType === 'image' ? (
                        <div className="w-full h-full flex items-center justify-center p-3 bg-slate-900/60">
                          <img
                            src={activeLesson.url}
                            alt={activeLesson.title}
                            draggable={false}
                            onContextMenu={(e) => e.preventDefault()}
                            className="max-h-full max-w-full object-contain rounded-xl pointer-events-none select-none"
                          />
                        </div>
                      ) : (
                        <iframe
                          key={activeLesson.id}
                          title={activeLesson.title}
                          src={`${activeLesson.url}#toolbar=0&navpanes=0`}
                          className="w-full h-full border-0 bg-white"
                        />
                      )}
                    </div>

                    {/* Thanh thông tin & điều khiển dưới trình xem */}
                    <div className="p-4 rounded-2xl glass-card border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="min-w-0">
                        <h2 className="text-base sm:text-lg font-bold font-display text-white truncate">
                          {activeLesson.title}
                        </h2>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 mt-1">
                          <span className="px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-300 border border-purple-400/25 font-semibold">
                            {selectedSubject.name}
                          </span>
                          {(activeLesson.folderName || selectedFolder?.name) && (
                            <span className="inline-flex items-center gap-1 text-amber-300 font-medium">
                              <Folder className="w-3.5 h-3.5" />
                              {activeLesson.folderName || selectedFolder?.name}
                            </span>
                          )}
                          <span>•</span>
                          <span>{isVideoLesson ? 'Phát trực tuyến' : 'Xem trực tuyến'}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          disabled={!prevItem}
                          onClick={() => prevItem && setActiveLesson(prevItem)}
                          className="px-3 py-1.5 rounded-xl glass-button text-xs font-semibold flex items-center gap-1 disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
                          title="Bài trước"
                        >
                          <ChevronLeft className="w-3.5 h-3.5" />
                          <span>Trước</span>
                        </button>

                        <button
                          type="button"
                          disabled={!nextItem}
                          onClick={() => nextItem && setActiveLesson(nextItem)}
                          className="px-3 py-1.5 rounded-xl glass-button text-xs font-semibold flex items-center gap-1 disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
                          title="Tiếp theo"
                        >
                          <span>Tiếp theo</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => setIsTheaterMode((prev) => !prev)}
                          className="hidden lg:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl glass-button text-xs font-semibold cursor-pointer"
                          title={isTheaterMode ? 'Thu gọn trình xem' : 'Chế độ mở rộng'}
                        >
                          {isTheaterMode ? (
                            <Minimize2 className="w-3.5 h-3.5" />
                          ) : (
                            <Maximize2 className="w-3.5 h-3.5" />
                          )}
                          <span>{isTheaterMode ? 'Mặc định' : 'Mở rộng'}</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Danh sách trong cùng thư mục bên phải */}
                  <div className="rounded-2xl glass-card border border-white/10 p-3.5 space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-white/10">
                      <div className="flex items-center gap-2 min-w-0">
                        {isVideoLesson ? (
                          <Video className="w-4 h-4 text-purple-300 shrink-0" />
                        ) : (
                          <Network className="w-4 h-4 text-purple-300 shrink-0" />
                        )}
                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 truncate">
                          {isVideoLesson ? 'Danh sách phát' : 'Danh sách sơ đồ'}{' '}
                          {activeLesson.folderName ? `• ${activeLesson.folderName}` : ''}
                        </h3>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400 shrink-0">
                        {currentIdx >= 0 ? `${currentIdx + 1}/${playlist.length}` : `${playlist.length} mục`}
                      </span>
                    </div>

                    <div className="space-y-2 max-h-[460px] overflow-y-auto pr-0.5">
                      {playlist.map((item, idx) => {
                        const isPlaying = item.id === activeLesson.id;
                        const ItemIcon = isVideoLesson ? Play : Network;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => {
                              hasSeekedRef.current = false;
                              setActiveLesson(item);
                            }}
                            className={`w-full text-left p-2.5 rounded-xl border transition-all flex items-center gap-3 cursor-pointer ${
                              isPlaying
                                ? 'bg-purple-600/25 border-purple-400/60 shadow-sm'
                                : 'bg-white/[0.03] border-white/10 hover:border-white/25 hover:bg-white/[0.06]'
                            }`}
                          >
                            <div
                              className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                                isPlaying
                                  ? 'bg-purple-500/30 text-purple-200'
                                  : 'bg-white/[0.05] text-slate-400'
                              }`}
                            >
                              <ItemIcon className={`w-3.5 h-3.5 ${isPlaying && isVideoLesson ? 'fill-current' : ''}`} />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="text-xs font-bold text-white truncate">
                                {idx + 1}. {item.title}
                              </div>
                              <div className="text-[10px] text-slate-400 mt-0.5">
                                {isPlaying ? (isVideoLesson ? 'Đang phát' : 'Đang xem') : 'Nhấn để xem'}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })()
          ) : (
            /* FULL-PAGE IN-APP VIEWER FOR IMAGE / PDF / DOC (NO DOWNLOAD) */
            <div
              className="w-full rounded-2xl overflow-hidden border border-white/10 bg-black/40 select-none"
              onContextMenu={(e) => e.preventDefault()}
            >
              {activeLesson.fileType === 'image' ? (
                <div className="flex items-center justify-center p-4 bg-black/20">
                  <img
                    src={activeLesson.url}
                    alt={activeLesson.title}
                    draggable={false}
                    onContextMenu={(e) => e.preventDefault()}
                    className="max-h-[75vh] w-auto object-contain rounded-xl pointer-events-none select-none"
                  />
                </div>
              ) : activeLesson.fileType === 'pdf' ? (
                <iframe
                  title={activeLesson.title}
                  src={`${activeLesson.url}#toolbar=0&navpanes=0`}
                  className="w-full h-[75vh] border-0 bg-white"
                />
              ) : (
                <iframe
                  title={activeLesson.title}
                  src={`https://docs.google.com/gview?url=${encodeURIComponent(activeLesson.url)}&embedded=true`}
                  className="w-full h-[75vh] border-0 bg-white"
                />
              )}
            </div>
          )
        ) : (
          <div className="space-y-4">
            {/* 3 tính năng con của Bài học: Video bài giảng, Sơ đồ tư duy, Bài tập củng cố kiến thức */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {LESSON_SUBFEATURES.map((tab) => {
                const TabIcon = tab.icon;
                const tabCount = subjectLessons.filter(
                  (l) => getLessonCategory(l) === tab.id
                ).length;
                const isActive = activeCategory === tab.id;

                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => {
                      setActiveCategory(tab.id);
                      setSelectedFolder(null);
                      setShowNewFolderInput(false);
                      setFolderError('');
                      setUploadTitle('');
                      setUploadFile(null);
                      setUploadError('');
                      setUploadProgress(0);
                      if (fileInputRef.current) {
                        fileInputRef.current.value = '';
                      }
                    }}
                    className={`p-3 rounded-2xl border text-left transition-all flex items-center justify-between gap-2 cursor-pointer ${
                      isActive
                        ? 'bg-purple-600/25 border-purple-400/60 text-white shadow-lg shadow-purple-500/15'
                        : 'bg-white/[0.03] border-white/10 text-slate-300 hover:border-white/25 hover:bg-white/[0.06]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`p-2 rounded-xl shrink-0 ${
                          isActive
                            ? 'bg-purple-500/30 text-purple-200'
                            : 'bg-white/[0.05] text-slate-400'
                        }`}
                      >
                        <TabIcon className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-bold truncate">{tab.label}</span>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold shrink-0 ${
                        isActive
                          ? 'bg-purple-500/40 text-purple-100'
                          : 'bg-white/10 text-slate-400'
                      }`}
                    >
                      {tabCount}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* CẤP 1 CỦA VIDEO BÀI GIẢNG & SƠ ĐỒ TƯ DUY: DANH SÁCH THƯ MỤC BÀI HỌC */}
            {usesFolders && !selectedFolder ? (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h2 className="text-sm font-bold text-white font-display flex items-center gap-2">
                      <Folder className="w-4 h-4 text-amber-400" />
                      <span>Thư mục bài học ({subjectCategoryFolders.length})</span>
                    </h2>
                    {isAdmin && (
                      <p className="text-[11px] text-slate-400 mt-0.5 font-mono">
                        Đường dẫn Google Drive: My Drive\BeaconLearn\{driveSubjectName}\&lt;Tên thư mục&gt;
                      </p>
                    )}
                  </div>

                  {isAdmin && (
                    <button
                      type="button"
                      onClick={() => {
                        setShowNewFolderInput((prev) => !prev);
                        setFolderError('');
                      }}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-xs font-bold shadow-md shadow-purple-600/20 cursor-pointer self-start sm:self-auto"
                    >
                      <FolderPlus className="w-3.5 h-3.5" />
                      <span>Tạo thư mục bài học</span>
                    </button>
                  )}
                </div>

                {folderError && (
                  <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs">
                    {folderError}
                  </div>
                )}

                {isAdmin && showNewFolderInput && (
                  <form
                    onSubmit={handleCreateFolder}
                    className="p-3.5 rounded-2xl bg-white/[0.04] border border-purple-500/30 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5"
                  >
                    <input
                      type="text"
                      required
                      autoFocus
                      value={newFolderName}
                      onChange={(e) => setNewFolderName(e.target.value)}
                      placeholder="Nhập tên thư mục bài học (VD: Bài học 1)..."
                      className="flex-1 px-3.5 py-2 rounded-xl bg-white/[0.05] border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-purple-400"
                    />
                    <div className="flex items-center gap-2 justify-end">
                      <button
                        type="button"
                        onClick={() => {
                          setShowNewFolderInput(false);
                          setNewFolderName('');
                        }}
                        className="px-3 py-2 rounded-xl glass-button text-xs font-semibold cursor-pointer"
                      >
                        Hủy
                      </button>
                      <button
                        type="submit"
                        disabled={isCreatingFolder || !newFolderName.trim()}
                        className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-xs font-bold disabled:opacity-50 cursor-pointer"
                      >
                        {isCreatingFolder ? 'Đang tạo...' : 'Tạo thư mục'}
                      </button>
                    </div>
                  </form>
                )}

                {isLoadingLessons ? (
                  <div className="py-10 text-center text-xs text-slate-400 space-y-2">
                    <Loader2 className="w-6 h-6 text-purple-400 animate-spin mx-auto" />
                    <p>Đang tải danh sách thư mục...</p>
                  </div>
                ) : subjectCategoryFolders.length === 0 ? (
                  <div className="py-10 text-center text-xs sm:text-sm text-slate-400 border border-dashed border-white/10 rounded-2xl">
                    {isAdmin
                      ? `Chưa có thư mục bài học nào trong môn ${selectedSubject.name}. Nhấn "Tạo thư mục bài học" để bắt đầu.`
                      : `Chưa có thư mục bài học nào trong môn ${selectedSubject.name}.`}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {subjectCategoryFolders.map((folder) => {
                      const itemCount = currentTabLessons.filter((l) => l.folderId === folder.id).length;
                      const isEditingThis = editingFolderId === folder.id;

                      return (
                        <div
                          key={folder.id}
                          onClick={() => {
                            if (!isEditingThis) {
                              handleOpenFolder(folder);
                            }
                          }}
                          className="p-4 rounded-2xl glass-card border border-white/10 hover:border-purple-400/50 cursor-pointer transition-all flex items-center justify-between gap-3 group"
                        >
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <div className="p-2.5 rounded-xl bg-amber-500/15 border border-amber-400/30 text-amber-300 shrink-0">
                              <Folder className="w-5 h-5" />
                            </div>
                            <div className="min-w-0 flex-1">
                              {isEditingThis ? (
                                <input
                                  type="text"
                                  autoFocus
                                  value={editingFolderName}
                                  onClick={(e) => e.stopPropagation()}
                                  onChange={(e) => setEditingFolderName(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      e.preventDefault();
                                      handleRenameFolder(folder.id);
                                    } else if (e.key === 'Escape') {
                                      setEditingFolderId(null);
                                    }
                                  }}
                                  onBlur={() => handleRenameFolder(folder.id)}
                                  className="w-full px-2 py-1 rounded-lg text-xs font-bold"
                                />
                              ) : (
                                <h4 className="text-sm font-bold text-white truncate group-hover:text-purple-300 transition-colors">
                                  {folder.name}
                                </h4>
                              )}
                              <p className="text-[11px] text-slate-400 mt-0.5">
                                {itemCount} {activeCategory === 'video' ? 'video bài giảng' : 'sơ đồ tư duy'}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            {isAdmin && !isEditingThis && (
                              <>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingFolderId(folder.id);
                                    setEditingFolderName(folder.name);
                                  }}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-purple-300 hover:bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                                  title="Đổi tên thư mục"
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => handleDeleteFolder(folder, e)}
                                  className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-500/20 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                                  title="Xóa thư mục"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </>
                            )}
                            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-purple-300" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              <>
                {/* Breadcrumb khi đang ở bên trong 1 thư mục */}
                {usesFolders && selectedFolder && (
                  <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-2xl glass-card border border-white/10">
                    <div className="flex items-center gap-2 min-w-0">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedFolder(null);
                          setUploadError('');
                          setUploadProgress(0);
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl glass-button text-xs font-semibold cursor-pointer shrink-0"
                      >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        <span>Thư mục</span>
                      </button>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <div className="flex items-center gap-1.5 min-w-0">
                        <Folder className="w-4 h-4 text-amber-400 shrink-0" />
                        <span className="text-xs sm:text-sm font-bold text-white truncate">
                          {selectedFolder.name}
                        </span>
                      </div>
                    </div>

                    {isAdmin && (
                      <span className="text-[11px] font-mono text-slate-400 truncate">
                        My Drive\BeaconLearn\{driveSubjectName}\{selectedFolder.name}
                      </span>
                    )}
                  </div>
                )}

                {/* ADMIN ONLY: Form Upload (Với Sơ đồ tư duy: chỉ hiện khi thư mục chưa có hình) */}
                {isAdmin && !(activeCategory === 'mindmap' && selectedFolder && displayedLessons.length > 0) && (
                  <form
                    onSubmit={handleUploadLesson}
                    className="p-4 rounded-2xl bg-white/[0.04] border border-purple-500/30 space-y-3"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 text-xs font-bold text-purple-300 uppercase tracking-wider">
                        <Upload className="w-4 h-4" />
                        <span>
                          {usesFolders && selectedFolder
                            ? `Tải ${currentSubfeature.label.toLowerCase()} vào "${selectedFolder.name}"`
                            : `${currentSubfeature.uploadLabel} (Quản trị viên)`}
                        </span>
                      </div>
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
                        placeholder={currentSubfeature.placeholder}
                        value={uploadTitle}
                        onChange={(e) => setUploadTitle(e.target.value)}
                        className="w-full px-3.5 py-2 rounded-xl bg-white/[0.05] border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-purple-400"
                      />

                      <input
                        ref={fileInputRef}
                        type="file"
                        required
                        accept={currentSubfeature.accept}
                        onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                        className="w-full px-3 py-1.5 rounded-xl bg-white/[0.05] border border-white/10 text-slate-300 text-xs file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-100 file:text-indigo-800 dark:file:bg-purple-600/30 dark:file:text-purple-200 cursor-pointer"
                      />
                    </div>

                    {usesFolders && !getSavedAppsScriptUrl() && showScriptConfig && (
                      <input
                        type="url"
                        value={appsScriptUrl}
                        onChange={(e) => {
                          setAppsScriptUrl(e.target.value);
                          saveAppsScriptUrl(e.target.value);
                        }}
                        placeholder="Google Apps Script Web App URL (chỉ dán 1 lần để mọi Admin tự động tải lên Drive của bạn)"
                        className="w-full px-3.5 py-2 rounded-xl bg-white/[0.05] border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-purple-400"
                      />
                    )}

                    {isUploading && (
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[11px] text-slate-300">
                          <span>
                            {usesFolders && selectedFolder
                              ? `Đang tải lên My Drive\\BeaconLearn\\${driveSubjectName}\\${selectedFolder.name}...`
                              : 'Đang tải lên Firebase Storage...'}
                          </span>
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
                            <span>Đăng {currentSubfeature.label}</span>
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                )}

                {/* Danh sách nội dung trong tính năng con / thư mục đang chọn */}
                {isLoadingLessons ? (
                  <div className="py-10 text-center text-xs text-slate-400 space-y-2">
                    <Loader2 className="w-6 h-6 text-purple-400 animate-spin mx-auto" />
                    <p>Đang tải nội dung môn học...</p>
                  </div>
                ) : displayedLessons.length === 0 ? (
                  <div className="py-10 text-center text-xs sm:text-sm text-slate-400 border border-dashed border-white/10 rounded-2xl">
                    {usesFolders && selectedFolder
                      ? `Chưa có ${currentSubfeature.label.toLowerCase()} nào trong "${selectedFolder.name}".`
                      : `${currentSubfeature.emptyText} trong môn ${selectedSubject.name}.`}
                  </div>
                ) : activeCategory === 'mindmap' && selectedFolder ? (
                  /* SƠ ĐỒ TƯ DUY: HIỂN THỊ TRỰC TIẾP 1 HÌNH ẢNH + BẤM ĐỂ PHÓNG TO */
                  (() => {
                    const mindmapLesson = displayedLessons[0];
                    const imgSrc = getMindmapImageUrl(mindmapLesson);
                    const fallbackSrc = getMindmapFallbackUrl(mindmapLesson);

                    return (
                      <div className="rounded-2xl glass-card border border-white/10 overflow-hidden">
                        <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <h4 className="text-sm font-bold text-white truncate">
                              {mindmapLesson.title}
                            </h4>
                            <p className="text-[11px] text-slate-400">
                              Nhấn vào hình bên dưới để phóng to
                            </p>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              type="button"
                              onClick={() => {
                                setZoomScale(1);
                                setZoomedMindmap(mindmapLesson);
                              }}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl glass-button text-xs font-semibold cursor-pointer"
                            >
                              <ZoomIn className="w-3.5 h-3.5" />
                              <span>Phóng to</span>
                            </button>

                            {isAdmin && (
                              <button
                                type="button"
                                onClick={() => handleDeleteLesson(mindmapLesson)}
                                className="p-1.5 rounded-xl glass-button text-rose-400 hover:bg-rose-500/20 cursor-pointer"
                                title="Xóa sơ đồ tư duy"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>

                        <div
                          onClick={() => {
                            setZoomScale(1);
                            setZoomedMindmap(mindmapLesson);
                          }}
                          className="p-4 flex items-center justify-center bg-slate-100/80 dark:bg-black/30 cursor-zoom-in group"
                          title="Nhấn để phóng to sơ đồ tư duy"
                        >
                          <img
                            src={imgSrc}
                            alt={mindmapLesson.title}
                            onError={(e) => {
                              if (fallbackSrc && e.currentTarget.src !== fallbackSrc) {
                                e.currentTarget.src = fallbackSrc;
                              }
                            }}
                            className="max-h-[70vh] w-auto object-contain rounded-xl shadow-lg transition-transform duration-200 group-hover:scale-[1.01]"
                          />
                        </div>
                      </div>
                    );
                  })()
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {displayedLessons.map((lesson) => {
                  const LessonIcon = getLessonIcon(lesson.fileType);
                  const savedProg = lessonProgress[lesson.id];

                  return (
                    <div
                      key={lesson.id}
                      onClick={() => handleOpenLesson(lesson)}
                      className="p-3.5 rounded-2xl glass-card border border-white/10 hover:border-purple-400/40 cursor-pointer transition-all flex items-center justify-between gap-3 group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="p-2 rounded-xl bg-white/[0.05] border border-white/10 text-purple-300 flex-shrink-0">
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
                            className="p-1.5 rounded-xl glass-button text-rose-400 hover:bg-rose-500/20 cursor-pointer"
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
        )}

        {/* MODAL PHÓNG TO SƠ ĐỒ TƯ DUY */}
        {zoomedMindmap && (
          <div
            onClick={() => setZoomedMindmap(null)}
            className="dark-surface fixed inset-0 z-50 flex flex-col bg-black/90 backdrop-blur-md p-4 select-none"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="flex items-center justify-between gap-3 pb-3 text-white"
            >
              <h3 className="text-sm sm:text-base font-bold truncate">
                {zoomedMindmap.title}
              </h3>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setZoomScale((s) => Math.max(0.5, Number((s - 0.25).toFixed(2))))}
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white cursor-pointer"
                  title="Thu nhỏ"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <span className="text-xs font-mono px-2 min-w-[52px] text-center">
                  {Math.round(zoomScale * 100)}%
                </span>
                <button
                  type="button"
                  onClick={() => setZoomScale((s) => Math.min(3, Number((s + 0.25).toFixed(2))))}
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white cursor-pointer"
                  title="Phóng to thêm"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setZoomScale(1)}
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white cursor-pointer"
                  title="Mặc định 100%"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setZoomedMindmap(null)}
                  className="p-2 rounded-xl bg-rose-500/80 hover:bg-rose-500 text-white cursor-pointer"
                  title="Đóng"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div
              onClick={(e) => e.stopPropagation()}
              className="flex-1 overflow-auto flex items-center justify-center"
            >
              <img
                src={getMindmapImageUrl(zoomedMindmap)}
                alt={zoomedMindmap.title}
                onError={(e) => {
                  const fb = getMindmapFallbackUrl(zoomedMindmap);
                  if (fb && e.currentTarget.src !== fb) {
                    e.currentTarget.src = fb;
                  }
                }}
                style={{ transform: `scale(${zoomScale})`, transformOrigin: 'center center' }}
                className="max-h-[85vh] max-w-full object-contain rounded-xl transition-transform duration-150"
              />
            </div>
          </div>
        )}
      </div>
    );
  }

  // ============================================================================
  // TRANG CHÍNH BÀI HỌC (GỌN GÀNG + SỔ GHI CHÚ CÓ THỂ GẤP GỌN)
  // ============================================================================
  return (
    <div className="space-y-5 pb-10">
      {/* 1. Subjects Grid (gọn gàng) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {STUDY_SUBJECTS.map((sub) => {
          const SubIcon = ICONS_MAP[sub.icon] || BookOpen;

          return (
            <div
              key={sub.id}
              onClick={() => handleOpenSubject(sub)}
              className="relative overflow-hidden rounded-2xl glass-card px-4 py-3.5 border border-white/10 group hover:border-purple-400/40 flex items-center gap-3 cursor-pointer transition-all"
            >
              <div className="p-2.5 rounded-xl bg-white/[0.05] border border-white/10 text-purple-300 group-hover:scale-105 transition-transform shrink-0">
                <SubIcon className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold font-display text-white group-hover:text-purple-300 transition-colors truncate">
                {sub.name}
              </h3>
            </div>
          );
        })}
      </div>

      {/* 2. Recent Lessons & Collapsible Notes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
        {/* Left: Recent Lessons */}
        <div className="lg:col-span-2 space-y-3">
          <h2 className="text-base sm:text-lg font-bold font-display text-white flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-emerald-400" />
            <span>Bài Học Gần Đây</span>
          </h2>

          {visibleRecentLessons.length === 0 ? (
            <div className="p-5 rounded-2xl glass-card border border-white/10 text-center text-xs text-slate-400">
              Chưa có bài học gần đây.
            </div>
          ) : (
            <div className="space-y-2.5">
              {visibleRecentLessons.map((item) => {
                const categoryInfo = LESSON_SUBFEATURES.find((c) => c.id === item.category);
                const RecentIcon =
                  item.kind === 'folder'
                    ? Folder
                    : item.category === 'mindmap'
                    ? Network
                    : item.category === 'exercise'
                    ? ClipboardCheck
                    : Play;

                return (
                  <div
                    key={`${item.kind}-${item.id}`}
                    onClick={() => handleOpenRecentItem(item)}
                    className="p-3.5 rounded-2xl glass-card border border-white/10 hover:border-purple-400/40 cursor-pointer transition-all flex items-center justify-between gap-3 group"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="p-2 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-300 group-hover:scale-105 transition-transform flex-shrink-0">
                        <RecentIcon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="text-xs sm:text-sm font-bold text-white truncate group-hover:text-purple-300 transition-colors">
                          {item.title}
                        </h4>
                        <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5 truncate">
                          <span className="text-purple-300 font-medium">{item.subjectName}</span>
                          {categoryInfo && (
                            <>
                              <span>•</span>
                              <span>{categoryInfo.label}</span>
                            </>
                          )}
                          {item.kind === 'lesson' && item.folderName && (
                            <>
                              <span>•</span>
                              <span className="truncate">{item.folderName}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <span className="text-[11px] font-semibold text-purple-300 flex-shrink-0">
                      Mở lại
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: Collapsible Notes Pad (Gấp gọn, chỉ mở khi cần) */}
        <div className="rounded-2xl glass-card border border-white/10 overflow-hidden">
          <button
            type="button"
            onClick={() => setIsNotesOpen((prev) => !prev)}
            className="w-full px-4 py-3.5 flex items-center justify-between gap-2 hover:bg-white/[0.03] transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2 min-w-0">
              <FileEdit className="w-4 h-4 text-purple-400 shrink-0" />
              <h2 className="text-sm font-bold font-display text-white truncate">
                Sổ Ghi Chú Nhanh
              </h2>
              {hasUnsavedNotes && (
                <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" title="Chưa lưu" />
              )}
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-slate-400 shrink-0">
              <span>{isNotesOpen ? 'Thu gọn' : 'Mở ghi chú'}</span>
              {isNotesOpen ? (
                <ChevronUp className="w-4 h-4 text-purple-300" />
              ) : (
                <ChevronDown className="w-4 h-4 text-purple-300" />
              )}
            </div>
          </button>

          {isNotesOpen && (
            <div className="px-4 pb-4 pt-2 border-t border-white/10 space-y-3">
              <textarea
                rows={7}
                value={notesContent}
                onChange={(e) => {
                  setNotesContent(e.target.value);
                  setHasUnsavedNotes(true);
                }}
                placeholder="Ghi chú công thức cần nhớ, bài tập giáo viên dặn..."
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-transparent border border-slate-200 dark:border-transparent resize-none text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none"
              />

              <div className="pt-2.5 border-t border-white/10 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={handleSaveNotes}
                  disabled={!hasUnsavedNotes || isSavingNotes}
                  title={
                    hasUnsavedNotes
                      ? `Lưu ghi chú lên Firebase cho tài khoản @${username}`
                      : 'Mặc định mờ. Nút sẽ sáng lên khi bạn chỉnh sửa nội dung ghi chú'
                  }
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-300 ${
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
                  type="button"
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
          )}
        </div>
      </div>
    </div>
  );
}
