import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where
} from 'firebase/firestore';
import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject
} from 'firebase/storage';
import { db, storage } from './firebase';

const NOTES_COLLECTION = 'study_notes';
const LESSONS_COLLECTION = 'subject_lessons';
const PROGRESS_COLLECTION = 'lesson_progress';
const USERS_COLLECTION = 'users';

export const DEFAULT_NOTES_CONTENT = '';

/**
 * Xác định loại file từ MIME type hoặc phần mở rộng
 */
function detectFileType(file) {
  const mime = (file?.type || '').toLowerCase();
  const name = (file?.name || '').toLowerCase();

  if (mime.startsWith('video/') || /\.(mp4|webm|ogg|mov|m4v|mkv)$/.test(name)) {
    return 'video';
  }
  if (mime === 'application/pdf' || /\.pdf$/.test(name)) {
    return 'pdf';
  }
  if (mime.startsWith('image/') || /\.(png|jpe?g|gif|webp|svg)$/.test(name)) {
    return 'image';
  }
  return 'document';
}

/**
 * Lấy ghi chú cá nhân của người dùng từ Firestore (fallback LocalStorage)
 */
export async function fetchUserNotes(username) {
  if (!username) return DEFAULT_NOTES_CONTENT;
  const cleanUsername = String(username).trim().toLowerCase();

  if (db) {
    try {
      const noteRef = doc(db, NOTES_COLLECTION, cleanUsername);
      const snap = await getDoc(noteRef);
      if (snap.exists() && typeof snap.data()?.content === 'string') {
        localStorage.setItem(`lumina_study_notes_${cleanUsername}`, snap.data().content);
        return snap.data().content;
      }
    } catch (error) {
      console.warn('Lỗi đọc ghi chú từ collection study_notes:', error);
    }

    try {
      const userRef = doc(db, USERS_COLLECTION, cleanUsername);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists() && typeof userSnap.data()?.studyNotes === 'string') {
        localStorage.setItem(`lumina_study_notes_${cleanUsername}`, userSnap.data().studyNotes);
        return userSnap.data().studyNotes;
      }
    } catch (error) {
      console.warn('Lỗi đọc ghi chú từ users doc:', error);
    }
  }

  try {
    const local = localStorage.getItem(`lumina_study_notes_${cleanUsername}`);
    if (local !== null) return local;
  } catch (error) {
    console.warn('Lỗi đọc ghi chú từ LocalStorage:', error);
  }

  return DEFAULT_NOTES_CONTENT;
}

/**
 * Lưu ghi chú cá nhân của người dùng lên Firebase Firestore & LocalStorage
 */
export async function saveUserNotes(username, content) {
  if (!username) {
    throw new Error('Không xác định được danh tính người dùng để lưu ghi chú.');
  }

  const cleanUsername = String(username).trim().toLowerCase();
  const payload = {
    username: cleanUsername,
    content: content ?? '',
    updatedAt: new Date().toISOString(),
  };

  if (db) {
    try {
      const noteRef = doc(db, NOTES_COLLECTION, cleanUsername);
      await setDoc(noteRef, payload, { merge: true });
    } catch (e1) {
      console.warn('Lỗi lưu ghi chú vào collection study_notes:', e1);
    }

    try {
      const userRef = doc(db, USERS_COLLECTION, cleanUsername);
      await updateDoc(userRef, { studyNotes: payload.content });
    } catch (e2) {
      console.warn('Lỗi lưu ghi chú vào users doc:', e2);
    }
  }

  try {
    localStorage.setItem(`lumina_study_notes_${cleanUsername}`, payload.content);
  } catch (storageError) {
    console.warn('Lỗi ghi LocalStorage cho ghi chú:', storageError);
  }

  return payload;
}

/**
 * Lấy danh sách bài học (file / video) của một môn học hoặc toàn bộ môn học
 */
export async function fetchSubjectLessons(subjectId = null) {
  if (!db) return [];

  try {
    const lessonsRef = collection(db, LESSONS_COLLECTION);
    const q = subjectId ? query(lessonsRef, where('subjectId', '==', subjectId)) : lessonsRef;
    const snap = await getDocs(q);

    const items = [];
    snap.forEach((docSnap) => {
      items.push({ id: docSnap.id, ...docSnap.data() });
    });

    return items.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  } catch (error) {
    console.error('Lỗi tải danh sách bài học từ Firestore:', error);
    throw new Error('Không thể tải danh sách bài học từ Firebase.');
  }
}

/**
 * Upload file hoặc video bài giảng lên Firebase Storage và lưu metadata vào Firestore (Chỉ dành cho Admin)
 */
export async function uploadSubjectLesson({
  subjectId,
  subjectName,
  category = 'video',
  title,
  file,
  uploadedBy,
  onProgress,
}) {
  if (!db || !storage) {
    throw new Error('Chưa cấu hình Firebase Firestore hoặc Firebase Storage.');
  }
  if (!file) {
    throw new Error('Vui lòng chọn tệp hoặc video bài giảng để tải lên.');
  }

  const lessonId = `lesson-${Date.now()}`;
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const storagePath = `lessons/${subjectId}/${Date.now()}_${safeName}`;
  const storageRef = ref(storage, storagePath);

  const downloadUrl = await new Promise((resolve, reject) => {
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        if (onProgress && snapshot.totalBytes > 0) {
          const pct = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
          onProgress(pct);
        }
      },
      (error) => {
        console.error('Lỗi upload file lên Firebase Storage:', error);
        reject(new Error('Không thể tải tệp lên Firebase Storage. Vui lòng kiểm tra Storage Rules hoặc kết nối mạng.'));
      },
      async () => {
        try {
          const url = await getDownloadURL(uploadTask.snapshot.ref);
          resolve(url);
        } catch (err) {
          reject(err);
        }
      }
    );
  });

  const lessonData = {
    id: lessonId,
    subjectId,
    subjectName,
    category: category || (detectFileType(file) === 'video' ? 'video' : 'exercise'),
    title: title?.trim() || file.name,
    fileName: file.name,
    fileType: detectFileType(file),
    mimeType: file.type || '',
    size: file.size || 0,
    url: downloadUrl,
    storagePath,
    uploadedBy: uploadedBy || 'admin',
    createdAt: new Date().toISOString(),
  };

  await setDoc(doc(db, LESSONS_COLLECTION, lessonId), lessonData);
  return lessonData;
}

/**
 * Xóa một bài học khỏi Firestore và Firebase Storage (Chỉ dành cho Admin)
 */
export async function deleteSubjectLesson(lesson) {
  if (!db) {
    throw new Error('Chưa kết nối Firebase Firestore.');
  }

  await deleteDoc(doc(db, LESSONS_COLLECTION, lesson.id));

  if (storage && lesson.storagePath) {
    try {
      await deleteObject(ref(storage, lesson.storagePath));
    } catch (error) {
      console.warn('Không thể xóa tệp trên Firebase Storage:', error);
    }
  }

  return true;
}

/**
 * Lấy tiến độ xem video bài giảng gần đây của người dùng
 */
export async function fetchUserLessonProgress(username) {
  if (!username) return {};
  const cleanUsername = String(username).trim().toLowerCase();

  if (db) {
    try {
      const progressRef = doc(db, PROGRESS_COLLECTION, cleanUsername);
      const snap = await getDoc(progressRef);
      if (snap.exists() && snap.data()?.items) {
        localStorage.setItem(
          `lumina_lesson_progress_${cleanUsername}`,
          JSON.stringify(snap.data().items)
        );
        return snap.data().items;
      }
    } catch (error) {
      console.warn('Lỗi đọc tiến độ bài học từ Firestore:', error);
    }
  }

  try {
    const raw = localStorage.getItem(`lumina_lesson_progress_${cleanUsername}`);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

/**
 * Lưu tiến độ xem dở video bài giảng cho người dùng hiện tại
 */
export async function saveUserLessonProgress(username, lesson, currentTime, duration) {
  if (!username || !lesson?.id) return null;
  const cleanUsername = String(username).trim().toLowerCase();

  const existing = await fetchUserLessonProgress(cleanUsername);
  const updatedItems = {
    ...existing,
    [lesson.id]: {
      lessonId: lesson.id,
      subjectId: lesson.subjectId,
      subjectName: lesson.subjectName,
      title: lesson.title,
      url: lesson.url,
      fileName: lesson.fileName,
      currentTime: Math.floor(currentTime || 0),
      duration: Math.floor(duration || 0),
      updatedAt: new Date().toISOString(),
    },
  };

  try {
    localStorage.setItem(
      `lumina_lesson_progress_${cleanUsername}`,
      JSON.stringify(updatedItems)
    );
  } catch (e) {
    console.warn('Lỗi lưu tiến độ vào LocalStorage:', e);
  }

  if (db) {
    try {
      const progressRef = doc(db, PROGRESS_COLLECTION, cleanUsername);
      await setDoc(
        progressRef,
        {
          username: cleanUsername,
          items: updatedItems,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
    } catch (error) {
      console.warn('Lỗi lưu tiến độ bài học lên Firestore:', error);
    }
  }

  return updatedItems;
}
