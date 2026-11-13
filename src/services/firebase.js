// Cấu hình kết nối cơ sở dữ liệu Firebase (Sử dụng biến môi trường từ file .env kèm fallback cho môi trường deploy)
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyB0-FwkM0qoA8svofJ7Ubr2lvPPHP1pCFI',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'mdc-studyapp.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'mdc-studyapp',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'mdc-studyapp.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '617332611591',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:617332611591:web:82fcce290e386e97b0a8a2',
};

// Kiểm tra thông tin cấu hình
const hasValidConfig = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId);

// Khởi tạo Firebase App
export const app = hasValidConfig
  ? (!getApps().length ? initializeApp(firebaseConfig) : getApp())
  : null;

// Khởi tạo đối tượng Cơ sở dữ liệu Cloud Firestore & Storage
export const db = app ? getFirestore(app) : null;
export const storage = app ? getStorage(app) : null;

export default db;
