import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from './firebase';

const TIMETABLES_COLLECTION = 'timetables';
const USERS_COLLECTION = 'users';

/**
 * Lấy dữ liệu thời khóa biểu của một người dùng cụ thể từ Firebase Firestore
 * Fallback sang LocalStorage nếu chưa có mạng hoặc chưa lưu lên Firebase
 */
export async function fetchUserTimetable(username) {
  if (!username) return null;
  const cleanUsername = String(username).trim().toLowerCase();

  // 1. Thử lấy từ Firestore collection 'timetables'
  if (db) {
    try {
      const timetableRef = doc(db, TIMETABLES_COLLECTION, cleanUsername);
      const snap = await getDoc(timetableRef);

      if (snap.exists() && snap.data()) {
        const data = snap.data();
        if (Array.isArray(data.timeSlots) || Array.isArray(data.scheduleEntries)) {
          // Đồng bộ vào cache local của tài khoản này
          if (data.timeSlots) {
            localStorage.setItem(`lumina_time_slots_${cleanUsername}`, JSON.stringify(data.timeSlots));
          }
          if (data.scheduleEntries) {
            localStorage.setItem(`lumina_schedule_entries_${cleanUsername}`, JSON.stringify(data.scheduleEntries));
          }
          return {
            timeSlots: data.timeSlots || null,
            scheduleEntries: data.scheduleEntries || [],
            source: 'firebase'
          };
        }
      }
    } catch (error) {
      console.warn('Lỗi đọc thời khóa biểu từ collection timetables:', error);
    }

    // 2. Thử kiểm tra trong document của user (collection 'users')
    try {
      const userRef = doc(db, USERS_COLLECTION, cleanUsername);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists() && userSnap.data()?.timetable) {
        const tb = userSnap.data().timetable;
        return {
          timeSlots: tb.timeSlots || null,
          scheduleEntries: tb.scheduleEntries || [],
          source: 'firebase'
        };
      }
    } catch (error) {
      console.warn('Lỗi đọc thời khóa biểu từ users doc:', error);
    }
  }

  // 3. Fallback sang LocalStorage riêng của tài khoản này
  try {
    const localSlots = localStorage.getItem(`lumina_time_slots_${cleanUsername}`);
    const localEntries = localStorage.getItem(`lumina_schedule_entries_${cleanUsername}`);

    if (localSlots || localEntries) {
      return {
        timeSlots: localSlots ? JSON.parse(localSlots) : null,
        scheduleEntries: localEntries ? JSON.parse(localEntries) : [],
        source: 'local'
      };
    }
  } catch (error) {
    console.warn('Lỗi đọc thời khóa biểu từ LocalStorage:', error);
  }

  return null;
}

/**
 * Lưu toàn bộ thời khóa biểu của một người dùng lên Firebase Firestore
 * Lưu đồng thời vào collection 'timetables' và cập nhật vào document của user để đảm bảo tính sẵn sàng
 */
export async function saveUserTimetable(username, { timeSlots, scheduleEntries }) {
  if (!username) {
    throw new Error('Không xác định được danh tính người dùng để lưu thời khóa biểu.');
  }

  const cleanUsername = String(username).trim().toLowerCase();
  const timetablePayload = {
    username: cleanUsername,
    timeSlots: timeSlots || [],
    scheduleEntries: scheduleEntries || [],
    updatedAt: new Date().toISOString()
  };

  // Lưu vào Firestore
  if (db) {
    let savedToFirestore = false;

    // 1. Lưu vào collection timetables riêng biệt
    try {
      const timetableRef = doc(db, TIMETABLES_COLLECTION, cleanUsername);
      await setDoc(timetableRef, timetablePayload, { merge: true });
      savedToFirestore = true;
    } catch (e1) {
      console.warn('Lỗi khi setDoc vào collection timetables:', e1);
    }

    // 2. Lưu bản sao vào document user nếu có
    try {
      const userRef = doc(db, USERS_COLLECTION, cleanUsername);
      await updateDoc(userRef, {
        timetable: timetablePayload
      });
      savedToFirestore = true;
    } catch (e2) {
      console.warn('Lỗi khi updateDoc vào users doc:', e2);
    }

    if (!savedToFirestore) {
      console.warn('Không thể ghi Firestore, sẽ lưu dự phòng cục bộ.');
    }
  }

  // Luôn luôn lưu bản sao vào LocalStorage theo đúng username của người dùng
  try {
    localStorage.setItem(`lumina_time_slots_${cleanUsername}`, JSON.stringify(timeSlots || []));
    localStorage.setItem(`lumina_schedule_entries_${cleanUsername}`, JSON.stringify(scheduleEntries || []));
  } catch (storageError) {
    console.warn('Lỗi ghi LocalStorage:', storageError);
  }

  return timetablePayload;
}
