const DRIVE_ROOT_FOLDER_NAME = 'BeaconLearn';
const DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive';
const DEFAULT_GOOGLE_CLIENT_ID = '617332611591-5c5hvk72bavv8jho3d1cqehden7a5ho1.apps.googleusercontent.com';
const TOKEN_STORAGE_KEY = 'lumina_gdrive_access_token';
const TOKEN_EXP_STORAGE_KEY = 'lumina_gdrive_token_expires_at';
const CLIENT_ID_STORAGE_KEY = 'lumina_google_client_id';

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

export function getSavedGoogleClientId() {
  return (
    import.meta.env.VITE_GOOGLE_CLIENT_ID ||
    localStorage.getItem(CLIENT_ID_STORAGE_KEY) ||
    DEFAULT_GOOGLE_CLIENT_ID
  ).trim();
}

export function saveGoogleClientId(clientId) {
  const clean = String(clientId || '').trim();
  if (clean) {
    localStorage.setItem(CLIENT_ID_STORAGE_KEY, clean);
  } else {
    localStorage.removeItem(CLIENT_ID_STORAGE_KEY);
  }
}

function getCachedAccessToken() {
  try {
    const token = sessionStorage.getItem(TOKEN_STORAGE_KEY);
    const exp = Number(sessionStorage.getItem(TOKEN_EXP_STORAGE_KEY) || '0');
    if (token && Date.now() < exp - 60_000) {
      return token;
    }
  } catch {
    // ignore sessionStorage errors
  }
  return null;
}

function setCachedAccessToken(token, expiresInSeconds = 3500) {
  try {
    sessionStorage.setItem(TOKEN_STORAGE_KEY, token);
    sessionStorage.setItem(
      TOKEN_EXP_STORAGE_KEY,
      String(Date.now() + expiresInSeconds * 1000)
    );
  } catch {
    // ignore sessionStorage errors
  }
}

function clearCachedAccessToken() {
  try {
    sessionStorage.removeItem(TOKEN_STORAGE_KEY);
    sessionStorage.removeItem(TOKEN_EXP_STORAGE_KEY);
  } catch {
    // ignore
  }
}

function requestOAuthToken(clientId, promptMode) {
  return new Promise((resolve, reject) => {
    if (!window.google?.accounts?.oauth2) {
      reject(
        new Error(
          'Thư viện Google Identity Services chưa tải xong. Vui lòng kiểm tra kết nối mạng và thử lại.'
        )
      );
      return;
    }

    const tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: DRIVE_SCOPE,
      callback: (response) => {
        if (response?.error) {
          reject(new Error(response.error_description || response.error));
          return;
        }
        if (!response?.access_token) {
          reject(new Error('Không nhận được access token từ Google Drive.'));
          return;
        }
        setCachedAccessToken(response.access_token, Number(response.expires_in || 3500));
        resolve(response.access_token);
      },
      error_callback: (err) => {
        reject(new Error(err?.message || 'Người dùng đã hủy hoặc không thể kết nối Google Drive.'));
      },
    });

    tokenClient.requestAccessToken({ prompt: promptMode });
  });
}

/**
 * Tự động lấy Access Token Google Drive (dùng cache nếu còn hạn, thử silent trước, rồi tự mở chọn tài khoản nếu cần)
 */
export async function getDriveAccessToken(explicitClientId = '') {
  const cached = getCachedAccessToken();
  if (cached) return cached;

  const clientId = String(explicitClientId || '').trim() || getSavedGoogleClientId();
  if (!clientId) {
    throw new Error(
      'Chưa cấu hình Google OAuth Client ID (VITE_GOOGLE_CLIENT_ID). Vui lòng nhập Client ID để hệ thống tự động kết nối Google Drive.'
    );
  }

  try {
    // Thử lấy token im lặng trước nếu người dùng đã từng cấp quyền
    return await requestOAuthToken(clientId, '');
  } catch {
    // Tự động mở hộp thoại chọn tài khoản Google lần đầu
    return await requestOAuthToken(clientId, 'select_account');
  }
}

function escapeDriveQuery(value) {
  return String(value || '').replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

async function findOrCreateDriveFolder(name, parentId, accessToken) {
  const safeName = escapeDriveQuery(name);
  const q = `mimeType='application/vnd.google-apps.folder' and name='${safeName}' and '${parentId}' in parents and trashed=false`;
  const searchUrl = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&fields=files(id,name)&spaces=drive`;

  const searchRes = await fetch(searchUrl, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (searchRes.status === 401) {
    clearCachedAccessToken();
    throw new Error('Phiên kết nối Google Drive đã hết hạn. Vui lòng thử tải lên lại.');
  }

  if (!searchRes.ok) {
    const errText = await searchRes.text();
    throw new Error(`Không thể tìm thư mục "${name}" trên Google Drive: ${errText}`);
  }

  const searchData = await searchRes.json();
  if (Array.isArray(searchData.files) && searchData.files.length > 0) {
    return searchData.files[0].id;
  }

  const createRes = await fetch('https://www.googleapis.com/drive/v3/files?fields=id,name', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name,
      mimeType: 'application/vnd.google-apps.folder',
      parents: [parentId],
    }),
  });

  if (!createRes.ok) {
    const errText = await createRes.text();
    throw new Error(`Không thể tạo thư mục "${name}" trên Google Drive: ${errText}`);
  }

  const created = await createRes.json();
  return created.id;
}

/**
 * Đảm bảo tồn tại cây thư mục: My Drive\BeaconLearn\<Tên môn>\<Tên thư mục bài học>
 */
export async function ensureDriveLessonFolderPath(subjectFolderName, lessonFolderName, accessToken) {
  const rootId = await findOrCreateDriveFolder(DRIVE_ROOT_FOLDER_NAME, 'root', accessToken);
  const subjectId = await findOrCreateDriveFolder(subjectFolderName, rootId, accessToken);
  const lessonFolderId = await findOrCreateDriveFolder(lessonFolderName, subjectId, accessToken);
  return { rootId, subjectId, lessonFolderId };
}

function buildTargetFileName(title, originalFileName) {
  const cleanTitle = String(title || '').trim();
  const extMatch = String(originalFileName || '').match(/(\.[a-zA-Z0-9]+)$/);
  const ext = extMatch ? extMatch[1] : '.mp4';

  if (!cleanTitle) return originalFileName || `video${ext}`;
  if (/\.[a-zA-Z0-9]{2,5}$/.test(cleanTitle)) return cleanTitle;
  return `${cleanTitle}${ext}`;
}

async function setDriveFilePublicReader(fileId, accessToken) {
  try {
    await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}/permissions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        role: 'reader',
        type: 'anyone',
      }),
    });
  } catch {
    // Nếu Google Workspace chặn public anyone, file vẫn lưu trên Drive của Admin
  }
}

/**
 * Upload video lên Google Drive theo đường dẫn My Drive\BeaconLearn\<Môn>\<Thư mục bài>\<file>
 */
export async function uploadVideoToGoogleDrive({
  file,
  title,
  subject,
  folderName,
  clientId = '',
  onProgress,
}) {
  if (!file) throw new Error('Vui lòng chọn tệp video để tải lên.');
  const subjectFolderName = getDriveSubjectFolderName(subject);
  const cleanFolderName = String(folderName || '').trim() || 'Bài học';

  const accessToken = await getDriveAccessToken(clientId);
  const { lessonFolderId } = await ensureDriveLessonFolderPath(
    subjectFolderName,
    cleanFolderName,
    accessToken
  );

  const targetFileName = buildTargetFileName(title, file.name);
  const mimeType = file.type || 'video/mp4';

  // Khởi tạo Resumable Upload Session
  const initRes = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable&fields=id,name,webViewLink',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json; charset=UTF-8',
        'X-Upload-Content-Type': mimeType,
        'X-Upload-Content-Length': String(file.size),
      },
      body: JSON.stringify({
        name: targetFileName,
        parents: [lessonFolderId],
      }),
    }
  );

  if (!initRes.ok) {
    const errText = await initRes.text();
    throw new Error(`Không thể khởi tạo phiên tải lên Google Drive: ${errText}`);
  }

  const uploadUrl = initRes.headers.get('Location');
  if (!uploadUrl) {
    throw new Error('Google Drive không trả về URL tải lên.');
  }

  // Upload file với XHR để theo dõi tiến độ %
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

  await setDriveFilePublicReader(uploaded.id, accessToken);
  if (typeof onProgress === 'function') onProgress(100);

  return {
    driveFileId: uploaded.id,
    driveFolderId: lessonFolderId,
    drivePath: `My Drive\\${DRIVE_ROOT_FOLDER_NAME}\\${subjectFolderName}\\${cleanFolderName}\\${targetFileName}`,
    fileName: targetFileName,
    embedUrl: `https://drive.google.com/file/d/${uploaded.id}/preview`,
    webViewLink: uploaded.webViewLink || `https://drive.google.com/file/d/${uploaded.id}/view`,
  };
}

/**
 * Xóa file trên Google Drive (best-effort khi Admin xóa bài giảng)
 */
export async function deleteFileFromGoogleDrive(driveFileId) {
  if (!driveFileId) return;
  const token = getCachedAccessToken();
  if (!token) return;

  try {
    await fetch(`https://www.googleapis.com/drive/v3/files/${driveFileId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch {
    // ignore best-effort cleanup error
  }
}
