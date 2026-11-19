import { fetchAppsScriptUrl } from './googleDriveService';

/**
 * Gọi Gemini API an toàn thông qua cầu nối Google Apps Script (Proxy)
 * - Gemini API Key được lưu bí mật trong Script Properties trên Apps Script (GEMINI_API_KEY),
 *   không lộ trên trình duyệt và người dùng KHÔNG cần nhập API Key.
 * - Fallback sang VITE_GEMINI_API_KEY nếu chạy môi trường dev cục bộ.
 */
export async function generateGeminiText({
  parts,
  temperature = 0.3,
  model = 'gemini-2.5-flash',
}) {
  const endpoint = await fetchAppsScriptUrl();
  const contents = [{ parts }];
  const generationConfig = { temperature };

  let proxyError = null;

  if (endpoint) {
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify({
          action: 'gemini',
          model,
          contents,
          generationConfig,
        }),
      });

      if (!res.ok) {
        throw new Error(`Không thể kết nối máy chủ AI (HTTP ${res.status}).`);
      }

      const data = await res.json();
      if (data?.ok) {
        return String(data.text || '');
      }
      throw new Error(data?.error || 'Máy chủ AI trả về lỗi.');
    } catch (err) {
      proxyError = err;
    }
  }

  // Fallback tùy chọn nếu có VITE_GEMINI_API_KEY ở môi trường local
  const envKey = (import.meta.env.VITE_GEMINI_API_KEY || '').trim();
  if (envKey) {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(envKey)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents, generationConfig }),
      }
    );

    if (!res.ok) {
      const errBody = await res.text();
      throw new Error(`Lỗi Gemini API (${res.status}): ${errBody.slice(0, 200)}`);
    }

    const data = await res.json();
    return String(data?.candidates?.[0]?.content?.parts?.[0]?.text || '');
  }

  if (proxyError) {
    throw proxyError;
  }

  throw new Error(
    'Hệ thống AI chưa sẵn sàng. Quản trị viên vui lòng cấu hình GEMINI_API_KEY trong Google Apps Script.'
  );
}
