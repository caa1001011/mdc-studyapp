import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './firebase';

const CALENDAR_EVENTS_COLLECTION = 'calendar_events';

function getCleanUsername(username) {
  return String(username || 'default').trim().toLowerCase();
}

function getLocalKey(cleanUsername) {
  return `lumina_calendar_events_${cleanUsername}`;
}

export function loadLocalCalendarEvents(username) {
  const cleanUsername = getCleanUsername(username);
  try {
    const saved = localStorage.getItem(getLocalKey(cleanUsername));
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

/**
 * Lấy danh sách sự kiện lịch theo tài khoản từ Firebase Firestore (fallback LocalStorage)
 */
export async function fetchUserCalendarEvents(username) {
  const cleanUsername = getCleanUsername(username);

  if (db && username) {
    try {
      const ref = doc(db, CALENDAR_EVENTS_COLLECTION, cleanUsername);
      const snap = await getDoc(ref);
      if (snap.exists() && Array.isArray(snap.data()?.events)) {
        const events = snap.data().events;
        try {
          localStorage.setItem(getLocalKey(cleanUsername), JSON.stringify(events));
        } catch {
          // ignore storage quota errors
        }
        return events;
      }
    } catch (error) {
      console.warn('Lỗi đọc sự kiện lịch từ Firebase:', error);
    }
  }

  return loadLocalCalendarEvents(cleanUsername);
}

/**
 * Lưu danh sách sự kiện lịch theo tài khoản lên Firebase Firestore và LocalStorage
 */
export async function saveUserCalendarEvents(username, events) {
  const cleanUsername = getCleanUsername(username);
  const safeEvents = Array.isArray(events) ? events : [];

  try {
    localStorage.setItem(getLocalKey(cleanUsername), JSON.stringify(safeEvents));
  } catch {
    // ignore storage quota errors
  }

  if (db && username) {
    try {
      const ref = doc(db, CALENDAR_EVENTS_COLLECTION, cleanUsername);
      await setDoc(
        ref,
        {
          username: cleanUsername,
          events: safeEvents,
          updatedAt: new Date().toISOString()
        },
        { merge: true }
      );
      return true;
    } catch (error) {
      console.warn('Lỗi lưu sự kiện lịch lên Firebase:', error);
      return false;
    }
  }

  return false;
}
