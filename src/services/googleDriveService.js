import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './firebase';

const DRIVE_ROOT_FOLDER_NAME = 'BeaconLearn';
const DEFAULT_APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycby2uahZAet5L9WrOHV05pmr_eeecXJoXRKJFM1YniccPe_7t_TGVOogEPDiMu3_lWm7/exec';
const DEPRECATED_APPS_SCRIPT_URLS = new Set([
  'https://script.google.com/macros/s/AKfycbysTls_-ixkdEhQl-g2lJe0uYORqDURQ2G862ujPPu3e-KcLCo6B86Z4UjcZoGb58xy/exec',
]);
const APPS_SCRIPT_URL_STORAGE_KEY = 'lumina_gdrive_apps_script_url';
const SETTINGS_COLLECTION = 'app_settings';
const DRIVE_SETTINGS_DOC = 'google_drive';

const SUBJECT_FOLDER_MAP = {
  'sub-1': 'Toán',
  'sub-2': 'Vật Lý',
  'sub-3': 'Tiếng Anh',
  'sub-4': 'Hóa Học',
};

export function getDriveSubjectFolderName(subject) {
  if (!subject) return 'Chung';
  if (SUBJECT_FOLDER_MAP[subject.id]) return SUBJECT_FOLDER_MAP[subject.id];
  return (subject.name || 'Chung').replace(/\s+Học$/i, '').trim();
}

function resolveActiveAppsScriptUrl(candidate) {
  const clean = String(candidate || '').trim();
  if (!clean || DEPRECATED_APPS_SCRIPT_URLS.has(clean)) {
    return DEFAULT_APPS_SCRIPT_URL;
  }
  return clean;
}

export function getSavedAppsScriptUrl() {
  return resolveActiveAppsScriptUrl(
    import.meta.env.VITE_GOOGLE_APPS_SCRIPT_URL ||
      localStorage.getItem(APPS_SCRIPT_URL_STORAGE_KEY) ||
      DEFAULT_APPS_SCRIPT_URL
  );
}

export async function fetchAppsScriptUrl() {
  const envUrl = (import.meta.env.VITE_GOOGLE_APPS_SCRIPT_URL || '').trim();
  if (envUrl && !DEPRECATED_APPS_SCRIPT_URLS.has(envUrl)) return envUrl;

  if (db) {
    try {
      const snap = await getDoc(doc(db, SETTINGS_COLLECTION, DRIVE_SETTINGS_DOC));
      if (snap.exists() && snap.data()?.appsScriptUrl) {
        const url = String(snap.data().appsScriptUrl).trim();
        if (url && !DEPRECATED_APPS_SCRIPT_URLS.has(url)) {
          localStorage.setItem(APPS_SCRIPT_URL_STORAGE_KEY, url);
          return url;
        }
      }
    } catch {
      // ignore Firestore read error and fallback to localStorage
    }
  }

  const active = resolveActiveAppsScriptUrl(localStorage.getItem(APPS_SCRIPT_URL_STORAGE_KEY));
  try {
    localStorage.setItem(APPS_SCRIPT_URL_STORAGE_KEY, active);
  } catch {
    // ignore
  }
  return active;
}

export async function saveAppsScriptUrl(url) {
  const clean = String(url || '').trim();
  if (clean) {
    localStorage.setItem(APPS_SCRIPT_URL_STORAGE_KEY, clean);
  } else {
    localStorage.removeItem(APPS_SCRIPT_URL_STORAGE_KEY);
  }

  if (db && clean) {
    try {
      await setDoc(
        doc(db, SETTINGS_COLLECTION, DRIVE_SETTINGS_DOC),
        { appsScriptUrl: clean, updatedAt: new Date().toISOString() },
        { merge: true }
      );
    } catch {
      // ignore if rules restrict write
    }
  }
}

function buildTargetFileName(title, originalFileName) {
  const cleanTitle = String(title || '').trim();
  const extMatch = String(originalFileName || '').match(/(\.[a-zA-Z0-9]+)$/);
  const ext = extMatch ? extMatch[1] : '.mp4';

  if (!cleanTitle) return originalFileName || `video${ext}`;
  if (/\.[a-zA-Z0-9]{2,5}$/.test(cleanTitle)) return cleanTitle;
  return `${cleanTitle}${ext}`;
}

async function callAppsScript(appsScriptUrl, payload) {
  let res;
  try {
    res = await fetch(appsScriptUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify(payload),
    });
  } catch {
    throw new Error(
      'Không kết nối được Google Apps Script (kiểm tra lại mục "Who has access / Ai có quyền truy cập" trong Apps Script đã chọn "Anyone / Bất kỳ ai" chưa).'
    );
  }

  if (!res.ok) {
    throw new Error(`Không thể kết nối Google Apps Script (HTTP ${res.status}).`);
  }

  const data = await res.json();
  if (!data?.ok) {
    throw new Error(data?.error || 'Google Apps Script trả về lỗi.');
  }
  return data;
}

/**
 * Upload tệp (video bài giảng, sơ đồ tư duy...) lên Google Drive cá nhân của chủ hệ thống
 * thông qua Google Apps Script Bridge: My Drive\BeaconLearn\<Môn>\<Thư mục bài>\<Tên file>
 * Không hiện popup chọn tài khoản Google với bất kỳ quản trị viên nào.
 */
export async function uploadFileToGoogleDrive({
  file,
  title,
  subject,
  folderName,
  appsScriptUrl = '',
  onProgress,
}) {
  if (!file) throw new Error('Vui lòng chọn tệp để tải lên.');

  const endpoint = String(appsScriptUrl || '').trim() || (await fetchAppsScriptUrl());
  if (!endpoint) {
    throw new Error(
      'Chưa cấu hình Google Apps Script Web App URL. Vui lòng dán URL Apps Script (triển khai từ google-apps-script/DriveUploadBridge.gs) để mọi quản trị viên tự động tải tệp lên Google Drive của bạn.'
    );
  }

  const subjectFolderName = getDriveSubjectFolderName(subject);
  const cleanFolderName = String(folderName || '').trim() || 'Bài học';
  const targetFileName = buildTargetFileName(title, file.name);
  const mimeType = file.type || 'application/octet-stream';

  // 1. Nhờ Apps Script (chạy dưới tài khoản Google Drive của bạn) tạo thư mục & phiên Resumable Upload
  const initData = await callAppsScript(endpoint, {
    action: 'initUpload',
    subjectName: subjectFolderName,
    folderName: cleanFolderName,
    fileName: targetFileName,
    mimeType,
    fileSize: file.size,
    origin: window.location.origin,
  });

  const { uploadUrl, folderId } = initData;

  // 2. Upload trực tiếp file video từ trình duyệt lên Resumable Upload URL (không giới hạn 50MB, có % tiến độ)
  const uploaded = await new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', uploadUrl, true);
    xhr.setRequestHeader('Content-Type', mimeType);

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && typeof onProgress === 'function') {
        const pct = Math.min(99, Math.round((event.loaded / event.total) * 100));
        onProgress(pct);
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          resolve(JSON.parse(xhr.responseText));
        } catch {
          reject(new Error('Phản hồi từ Google Drive không hợp lệ.'));
        }
      } else {
        reject(new Error(`Tải lên Google Drive thất bại (HTTP ${xhr.status}).`));
      }
    };

    xhr.onerror = () => {
      reject(new Error('Lỗi kết nối mạng khi tải video lên Google Drive.'));
    };

    xhr.send(file);
  });

  // 3. Nhờ Apps Script bật quyền xem cho học sinh (Anyone with link -> Viewer)
  let webViewLink = uploaded.webViewLink || `https://drive.google.com/file/d/${uploaded.id}/view`;
  try {
    const shared = await callAppsScript(endpoint, {
      action: 'shareFile',
      fileId: uploaded.id,
    });
    if (shared?.webViewLink) {
      webViewLink = shared.webViewLink;
    }
  } catch {
    // ignore if workspace policy blocks public link
  }

  if (typeof onProgress === 'function') onProgress(100);

  return {
    driveFileId: uploaded.id,
    driveFolderId: folderId || '',
    drivePath: `My Drive\\${DRIVE_ROOT_FOLDER_NAME}\\${subjectFolderName}\\${cleanFolderName}\\${targetFileName}`,
    fileName: targetFileName,
    embedUrl: `https://drive.google.com/file/d/${uploaded.id}/preview`,
    webViewLink,
  };
}

export const uploadVideoToGoogleDrive = uploadFileToGoogleDrive;

/**
 * Xóa file trên Google Drive (best-effort khi Admin xóa bài giảng)
 */
export async function deleteFileFromGoogleDrive(driveFileId) {
  if (!driveFileId) return;
  const endpoint = await fetchAppsScriptUrl();
  if (!endpoint) return;

  try {
    await callAppsScript(endpoint, {
      action: 'deleteFile',
      fileId: driveFileId,
    });
  } catch {
    // ignore best-effort cleanup error
  }
}
