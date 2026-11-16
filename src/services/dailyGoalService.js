import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './firebase';

const DAILY_GOALS_COLLECTION = 'daily_goals';

function getCleanUsername(username) {
  return String(username || 'default').trim().toLowerCase();
}

function getLocalKey(cleanUsername) {
  return `lumina_daily_goals_${cleanUsername}`;
}

export function loadLocalDailyGoals(username) {
  const cleanUsername = getCleanUsername(username);
  try {
    const saved = localStorage.getItem(getLocalKey(cleanUsername));
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

/**
 * Lấy danh sách "Mục tiêu hôm nay" theo tài khoản từ Firebase Firestore (fallback LocalStorage)
 */
export async function fetchUserDailyGoals(username) {
  const cleanUsername = getCleanUsername(username);

  if (db && username) {
    try {
      const ref = doc(db, DAILY_GOALS_COLLECTION, cleanUsername);
      const snap = await getDoc(ref);
      if (snap.exists() && Array.isArray(snap.data()?.goals)) {
        const goals = snap.data().goals;
        try {
          localStorage.setItem(getLocalKey(cleanUsername), JSON.stringify(goals));
        } catch {
          // ignore storage quota errors
        }
        return goals;
      }
    } catch (error) {
      console.warn('Lỗi đọc mục tiêu hôm nay từ Firebase:', error);
    }
  }

  return loadLocalDailyGoals(cleanUsername);
}

/**
 * Lưu danh sách "Mục tiêu hôm nay" theo tài khoản lên Firebase Firestore và LocalStorage
 */
export async function saveUserDailyGoals(username, goals) {
  const cleanUsername = getCleanUsername(username);
  const safeGoals = Array.isArray(goals) ? goals : [];

  try {
    localStorage.setItem(getLocalKey(cleanUsername), JSON.stringify(safeGoals));
  } catch {
    // ignore storage quota errors
  }

  if (db && username) {
    try {
      const ref = doc(db, DAILY_GOALS_COLLECTION, cleanUsername);
      await setDoc(
        ref,
        {
          username: cleanUsername,
          goals: safeGoals,
          updatedAt: new Date().toISOString()
        },
        { merge: true }
      );
      return true;
    } catch (error) {
      console.warn('Lỗi lưu mục tiêu hôm nay lên Firebase:', error);
      return false;
    }
  }

  return false;
}
