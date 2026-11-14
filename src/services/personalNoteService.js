import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './firebase';

const PERSONAL_NOTES_COLLECTION = 'personal_notes';

function getCleanUsername(username) {
  return String(username || 'default').trim().toLowerCase();
}

function getLocalKey(cleanUsername) {
  return `lumina_personal_notes_${cleanUsername}`;
}

export function loadLocalPersonalNotes(username) {
  const cleanUsername = getCleanUsername(username);
  try {
    const saved = localStorage.getItem(getLocalKey(cleanUsername));
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

/**
 * Lấy danh sách ghi chú cá nhân theo tài khoản từ Firebase Firestore (fallback LocalStorage)
 */
export async function fetchUserPersonalNotes(username) {
  const cleanUsername = getCleanUsername(username);

  if (db && username) {
    try {
      const ref = doc(db, PERSONAL_NOTES_COLLECTION, cleanUsername);
      const snap = await getDoc(ref);
      if (snap.exists() && Array.isArray(snap.data()?.notes)) {
        const notes = snap.data().notes;
        try {
          localStorage.setItem(getLocalKey(cleanUsername), JSON.stringify(notes));
        } catch {
          // ignore storage quota errors
        }
        return notes;
      }
    } catch (error) {
      console.warn('Lỗi đọc ghi chú cá nhân từ Firebase:', error);
    }
  }

  return loadLocalPersonalNotes(cleanUsername);
}

/**
 * Lưu danh sách ghi chú cá nhân theo tài khoản lên Firebase Firestore và LocalStorage
 */
export async function saveUserPersonalNotes(username, notes) {
  const cleanUsername = getCleanUsername(username);
  const safeNotes = Array.isArray(notes) ? notes : [];

  try {
    localStorage.setItem(getLocalKey(cleanUsername), JSON.stringify(safeNotes));
  } catch {
    // ignore storage quota errors
  }

  if (db && username) {
    try {
      const ref = doc(db, PERSONAL_NOTES_COLLECTION, cleanUsername);
      await setDoc(
        ref,
        {
          username: cleanUsername,
          notes: safeNotes,
          updatedAt: new Date().toISOString()
        },
        { merge: true }
      );
      return true;
    } catch (error) {
      console.warn('Lỗi lưu ghi chú cá nhân lên Firebase:', error);
      return false;
    }
  }

  return false;
}
