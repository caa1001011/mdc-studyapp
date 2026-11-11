// Cấu hình kết nối cơ sở dữ liệu Firebase (Sử dụng biến môi trường từ file .env)
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
};

// Kiểm tra thông tin cấu hình từ file .env
const hasValidConfig = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId);

// Khởi tạo Firebase App
export const app = hasValidConfig
  ? (!getApps().length ? initializeApp(firebaseConfig) : getApp())
  : null;

// Khởi tạo đối tượng Cơ sở dữ liệu Cloud Firestore
export const db = app ? getFirestore(app) : null;

export default db;
