import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc
} from 'firebase/firestore';
import { db } from './firebase';

const USERS_COLLECTION = 'users';
const SESSION_STORAGE_KEY = 'lumina_auth_user';

export const DEFAULT_ADMIN_USER = {
  username: 'admin',
  password: '123456',
  fullName: 'Quản Trị Viên',
  title: 'Quản trị hệ thống cao nhất',
  role: 'admin',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  level: 99,
  xp: 9999,
  nextLevelXp: 10000,
  streakDays: 30,
  todayStudyMinutes: 150,
  dailyGoalMinutes: 180,
  createdAt: new Date().toISOString(),
};

/**
 * Đảm bảo tài khoản admin mặc định (admin / 123456) luôn tồn tại trên Firebase Firestore
 */
export async function ensureAdminAccount() {
  if (!db) return DEFAULT_ADMIN_USER;

  try {
    const adminRef = doc(db, USERS_COLLECTION, 'admin');
    const adminSnap = await getDoc(adminRef);

    if (!adminSnap.exists()) {
      await setDoc(adminRef, DEFAULT_ADMIN_USER);
      return DEFAULT_ADMIN_USER;
    }

    return adminSnap.data();
  } catch (error) {
    console.error('Lỗi khi khởi tạo tài khoản admin trên Firestore:', error);
    return DEFAULT_ADMIN_USER;
  }
}

/**
 * Đăng nhập bằng username và password kiểm tra từ Firebase Firestore
 */
export async function loginWithCredentials(username, password) {
  const cleanUsername = username.trim().toLowerCase();
  const cleanPassword = password.trim();

  if (!cleanUsername || !cleanPassword) {
    throw new Error('Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu.');
  }

  // Đảm bảo tài khoản admin đã được tạo trên Firestore
  await ensureAdminAccount();

  if (db) {
    try {
      const userRef = doc(db, USERS_COLLECTION, cleanUsername);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        throw new Error('Tài khoản không tồn tại trong hệ thống.');
      }

      const userData = userSnap.data();
      if (String(userData.password) !== String(cleanPassword)) {
        throw new Error('Mật khẩu không chính xác. Vui lòng thử lại.');
      }

      const safeUser = { ...userData };
      saveSessionUser(safeUser);
      return safeUser;
    } catch (error) {
      // Nếu lỗi do sai tài khoản/mật khẩu thì ném lỗi ra cho UI
      if (
        error.message.includes('Tài khoản không tồn tại') ||
        error.message.includes('Mật khẩu không chính xác')
      ) {
        throw error;
      }
      console.error('Lỗi kết nối Firestore khi đăng nhập:', error);
      throw new Error('Không thể kết nối cơ sở dữ liệu Firebase. Vui lòng kiểm tra kết nối mạng hoặc Firestore Rules.');
    }
  } else {
    throw new Error('Chưa cấu hình kết nối Firebase Firestore.');
  }
}

/**
 * Lấy danh sách toàn bộ tài khoản người dùng trên Firebase Firestore
 */
export async function fetchAllUsers() {
  await ensureAdminAccount();

  if (!db) {
    throw new Error('Chưa kết nối Firebase Firestore.');
  }

  const querySnapshot = await getDocs(collection(db, USERS_COLLECTION));
  const users = [];
  querySnapshot.forEach((docSnap) => {
    users.push(docSnap.data());
  });

  // Sắp xếp admin lên đầu, sau đó theo thời gian tạo mới nhất
  return users.sort((a, b) => {
    if (a.username === 'admin') return -1;
    if (b.username === 'admin') return 1;
    return (b.createdAt || '').localeCompare(a.createdAt || '');
  });
}

/**
 * Tạo mới một tài khoản người dùng trên Firebase Firestore (Dành cho Admin)
 */
export async function createNewUser({ username, password, fullName, title, role = 'student', avatar }) {
  if (!db) {
    throw new Error('Chưa kết nối Firebase Firestore.');
  }

  const cleanUsername = username.trim().toLowerCase();
  if (!cleanUsername) {
    throw new Error('Tên đăng nhập không được để trống.');
  }
  if (!/^[a-z0-9_.-]+$/.test(cleanUsername)) {
    throw new Error('Tên đăng nhập chỉ được chứa chữ cái không dấu, chữ số, dấu chấm, gạch dưới hoặc gạch ngang.');
  }
  if (!password || password.trim().length < 4) {
    throw new Error('Mật khẩu phải có ít nhất 4 ký tự.');
  }

  const userRef = doc(db, USERS_COLLECTION, cleanUsername);
  const existingSnap = await getDoc(userRef);

  if (existingSnap.exists()) {
    throw new Error(`Tên đăng nhập "${cleanUsername}" đã tồn tại. Vui lòng chọn tên khác.`);
  }

  const newUserDoc = {
    username: cleanUsername,
    password: password.trim(),
    fullName: fullName?.trim() || cleanUsername,
    title: title?.trim() || (role === 'admin' ? 'Quản trị hệ thống' : 'Học sinh Lớp 12A1'),
    role: role === 'admin' ? 'admin' : 'student',
    avatar:
      avatar?.trim() ||
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    level: 1,
    xp: 0,
    nextLevelXp: 1000,
    streakDays: 1,
    todayStudyMinutes: 0,
    dailyGoalMinutes: 180,
    createdAt: new Date().toISOString(),
  };

  await setDoc(userRef, newUserDoc);
  return newUserDoc;
}

/**
 * Cập nhật thông tin hoặc mật khẩu của tài khoản trên Firebase Firestore
 */
export async function updateExistingUser(username, updates) {
  if (!db) {
    throw new Error('Chưa kết nối Firebase Firestore.');
  }

  const cleanUsername = username.trim().toLowerCase();
  const userRef = doc(db, USERS_COLLECTION, cleanUsername);

  // Không cho phép hạ quyền của tài khoản admin gốc
  const safeUpdates = { ...updates };
  if (cleanUsername === 'admin') {
    safeUpdates.role = 'admin';
  }

  await updateDoc(userRef, safeUpdates);

  const updatedSnap = await getDoc(userRef);
  const updatedData = updatedSnap.data();

  // Nếu đang cập nhật chính tài khoản đang đăng nhập thì đồng bộ session
  const currentSession = getSessionUser();
  if (currentSession && currentSession.username === cleanUsername) {
    saveSessionUser(updatedData);
  }

  return updatedData;
}

/**
 * Xóa tài khoản người dùng khỏi Firebase Firestore (Không cho phép xóa admin gốc)
 */
export async function deleteExistingUser(username) {
  if (!db) {
    throw new Error('Chưa kết nối Firebase Firestore.');
  }

  const cleanUsername = username.trim().toLowerCase();
  if (cleanUsername === 'admin') {
    throw new Error('Không thể xóa tài khoản Quản trị viên tối cao (admin).');
  }

  const userRef = doc(db, USERS_COLLECTION, cleanUsername);
  await deleteDoc(userRef);
  return true;
}

/**
 * Quản lý phiên đăng nhập trên trình duyệt
 */
export function getSessionUser() {
  try {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveSessionUser(user) {
  try {
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(user));
  } catch (e) {
    console.error('Lỗi lưu phiên đăng nhập:', e);
  }
}

export function clearSessionUser() {
  try {
    localStorage.removeItem(SESSION_STORAGE_KEY);
  } catch (e) {
    console.error('Lỗi xóa phiên đăng nhập:', e);
  }
}
