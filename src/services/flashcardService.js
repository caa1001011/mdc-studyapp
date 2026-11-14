import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  query,
  where
} from 'firebase/firestore';
import { db } from './firebase';

const TEXTBOOK_DECKS_COLLECTION = 'textbook_flashcard_decks';
const USER_DECKS_COLLECTION = 'user_flashcard_decks';

/**
 * Lấy danh sách bộ thẻ Sách Giáo Khoa (theo từng Unit do Admin cung cấp)
 */
export async function fetchTextbookDecks() {
  if (!db) return [];

  try {
    const snap = await getDocs(collection(db, TEXTBOOK_DECKS_COLLECTION));
    const decks = [];
    snap.forEach((docSnap) => {
      decks.push({ id: docSnap.id, ...docSnap.data(), sourceType: 'textbook' });
    });
    return decks.sort((a, b) => (a.createdAt || '').localeCompare(b.createdAt || ''));
  } catch (error) {
    console.error('Lỗi tải bộ thẻ sách giáo khoa từ Firestore:', error);
    return [];
  }
}

/**
 * Admin: Tạo hoặc cập nhật một bộ thẻ Sách Giáo Khoa (theo Unit / Bài học)
 */
export async function saveTextbookDeck({ id, title, bookName, grade, coverImage, cards, createdBy }) {
  if (!db) {
    throw new Error('Chưa kết nối Firebase Firestore.');
  }

  const deckId = id || `tb-${Date.now()}`;
  const deckData = {
    id: deckId,
    title: title.trim(),
    bookName: bookName?.trim() || '',
    grade: grade?.trim() || '',
    coverImage: coverImage || '',
    subject: 'Tiếng Anh',
    sourceType: 'textbook',
    cards: cards || [],
    cardCount: (cards || []).length,
    createdBy: createdBy || 'admin',
    createdAt: new Date().toISOString(),
  };

  await setDoc(doc(db, TEXTBOOK_DECKS_COLLECTION, deckId), deckData, { merge: true });
  return deckData;
}

/**
 * Nén ảnh bìa sách về kích thước gọn nhẹ để lưu trữ nhanh và hiển thị mượt mà
 */
export function compressCoverImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Không thể đọc tệp ảnh bìa.'));
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error('Tệp ảnh không hợp lệ.'));
      img.onload = () => {
        const maxSide = 320;
        let { width, height } = img;
        if (width > maxSide || height > maxSide) {
          if (width >= height) {
            height = Math.round((height * maxSide) / width);
            width = maxSide;
          } else {
            width = Math.round((width * maxSide) / height);
            height = maxSide;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.78));
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Admin: Xóa một bộ thẻ Sách Giáo Khoa
 */
export async function deleteTextbookDeck(deckId) {
  if (!db) {
    throw new Error('Chưa kết nối Firebase Firestore.');
  }
  await deleteDoc(doc(db, TEXTBOOK_DECKS_COLLECTION, deckId));
  return true;
}

/**
 * Lấy danh sách bộ thẻ cá nhân do người học tự tạo
 */
export async function fetchUserFlashcardDecks(username) {
  if (!username) return [];
  const cleanUsername = String(username).trim().toLowerCase();

  if (db) {
    try {
      const q = query(
        collection(db, USER_DECKS_COLLECTION),
        where('owner', '==', cleanUsername)
      );
      const snap = await getDocs(q);
      const decks = [];
      snap.forEach((docSnap) => {
        decks.push({ id: docSnap.id, ...docSnap.data(), sourceType: 'personal' });
      });
      localStorage.setItem(`lumina_user_flashcards_${cleanUsername}`, JSON.stringify(decks));
      return decks.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
    } catch (error) {
      console.warn('Lỗi tải bộ thẻ cá nhân từ Firestore:', error);
    }
  }

  try {
    const raw = localStorage.getItem(`lumina_user_flashcards_${cleanUsername}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Người học: Lưu bộ thẻ cá nhân tự tạo (nhập thủ công hoặc từ AI)
 */
export async function saveUserFlashcardDeck(username, { id, title, cards, creationMethod = 'manual' }) {
  if (!username) {
    throw new Error('Không xác định được tài khoản người học.');
  }

  const cleanUsername = String(username).trim().toLowerCase();
  const deckId = id || `user-${cleanUsername}-${Date.now()}`;
  const deckData = {
    id: deckId,
    owner: cleanUsername,
    title: title.trim(),
    subject: 'Tiếng Anh',
    sourceType: 'personal',
    creationMethod,
    cards: cards || [],
    cardCount: (cards || []).length,
    createdAt: new Date().toISOString(),
  };

  if (db) {
    try {
      await setDoc(doc(db, USER_DECKS_COLLECTION, deckId), deckData, { merge: true });
    } catch (error) {
      console.warn('Lỗi lưu bộ thẻ cá nhân lên Firestore:', error);
    }
  }

  try {
    const raw = localStorage.getItem(`lumina_user_flashcards_${cleanUsername}`);
    const current = raw ? JSON.parse(raw) : [];
    const updated = [deckData, ...current.filter((d) => d.id !== deckId)];
    localStorage.setItem(`lumina_user_flashcards_${cleanUsername}`, JSON.stringify(updated));
  } catch (e) {
    console.warn('Lỗi ghi LocalStorage bộ thẻ cá nhân:', e);
  }

  return deckData;
}

/**
 * Người học: Xóa bộ thẻ cá nhân của chính mình
 */
export async function deleteUserFlashcardDeck(username, deckId) {
  const cleanUsername = String(username || '').trim().toLowerCase();

  if (db) {
    try {
      await deleteDoc(doc(db, USER_DECKS_COLLECTION, deckId));
    } catch (error) {
      console.warn('Lỗi xóa bộ thẻ cá nhân trên Firestore:', error);
    }
  }

  try {
    const raw = localStorage.getItem(`lumina_user_flashcards_${cleanUsername}`);
    const current = raw ? JSON.parse(raw) : [];
    const updated = current.filter((d) => d.id !== deckId);
    localStorage.setItem(`lumina_user_flashcards_${cleanUsername}`, JSON.stringify(updated));
  } catch (e) {
    console.warn('Lỗi cập nhật LocalStorage khi xóa bộ thẻ:', e);
  }

  return true;
}

/**
 * Trích xuất cặp từ vựng Tiếng Anh từ tài liệu thô (dùng khi chưa có API Key hoặc làm fallback)
 */
function parseVocabularyFromText(rawText) {
  const lines = rawText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  const cards = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].replace(/^[-*•\d.)]+\s*/, '').trim();
    if (!line) continue;

    // Hỗ trợ các định dạng phổ biến: "word (/phonetic/) : meaning", "word - meaning", "word = meaning", "word\tmeaning"
    const match = line.match(/^([^:=\-\t]+?)(?:\s*(\/[^/]+\/))?\s*(?::|=|-|–|\t)\s*(.+)$/);
    if (match) {
      const front = match[1].trim();
      const phonetic = (match[2] || '').trim();
      const back = match[3].trim();
      if (front && back) {
        cards.push({
          id: `ai-${Date.now()}-${i}`,
          front,
          phonetic,
          hint: '',
          back,
          example: '',
        });
      }
    }
  }

  return cards;
}

/**
 * Gọi AI (Gemini API nếu có VITE_GEMINI_API_KEY, hoặc bộ phân tích thông minh) để tạo flashcard từ tài liệu (văn bản hoặc file PDF/DOC/DOCX/TXT...)
 */
export async function generateFlashcardsFromDocument(documentInput, customApiKey = '') {
  const isObj = typeof documentInput === 'object' && documentInput !== null;
  const text = (isObj ? documentInput.text : documentInput || '').trim();
  const fileData = isObj ? documentInput.fileData : null;

  if (!text && !fileData) {
    throw new Error('Vui lòng nhập nội dung tài liệu hoặc chọn tệp tài liệu.');
  }

  const apiKey = (customApiKey || import.meta.env.VITE_GEMINI_API_KEY || '').trim();

  if (apiKey) {
    const promptText = `Bạn là trợ lý học từ vựng Tiếng Anh THPT. Hãy trích xuất các từ vựng Tiếng Anh quan trọng từ tài liệu sau và trả về DUY NHẤT một mảng JSON hợp lệ (không markdown, không giải thích thêm).
Mỗi phần tử trong mảng có cấu trúc:
{
  "front": "Từ vựng Tiếng Anh (kèm từ loại nếu có, ví dụ: Ubiquitous (adj))",
  "phonetic": "Phiên âm IPA (ví dụ: /juːˈbɪk.wə.təs/)",
  "back": "Nghĩa tiếng Việt ngắn gọn, dễ hiểu",
  "hint": "Gợi ý ngắn bằng tiếng Việt",
  "example": "1 câu ví dụ Tiếng Anh ngắn"
}${text ? `\n\nNội dung tài liệu:\n${text.slice(0, 12000)}` : ''}`;

    const parts = [{ text: promptText }];
    if (fileData?.base64 && fileData?.mimeType) {
      parts.push({
        inlineData: {
          mimeType: fileData.mimeType,
          data: fileData.base64,
        },
      });
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(apiKey)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts }],
          generationConfig: { temperature: 0.3 },
        }),
      }
    );

    if (!response.ok) {
      const errBody = await response.text();
      console.error('Lỗi Gemini API:', errBody);
      throw new Error('Không thể gọi AI Gemini. Vui lòng kiểm tra lại API Key hoặc định dạng tệp.');
    }

    const data = await response.json();
    const rawOutput = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const jsonMatch = rawOutput.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error('AI không trả về đúng định dạng danh sách từ vựng. Vui lòng thử lại.');
    }

    const parsed = JSON.parse(jsonMatch[0]);
    return parsed
      .filter((item) => item?.front && item?.back)
      .map((item, idx) => ({
        id: `ai-${Date.now()}-${idx}`,
        front: String(item.front).trim(),
        phonetic: String(item.phonetic || '').trim(),
        back: String(item.back).trim(),
        hint: String(item.hint || '').trim(),
        example: String(item.example || '').trim(),
      }));
  }

  if (fileData && !text) {
    throw new Error(
      'Để AI đọc trực tiếp tệp PDF/DOC/DOCX, vui lòng nhập Gemini API Key (hoặc dán nội dung văn bản dạng "Từ vựng - Nghĩa").'
    );
  }

  // Fallback phân tích trực tiếp tài liệu dạng danh sách từ vựng
  const parsedCards = parseVocabularyFromText(text);
  if (parsedCards.length === 0) {
    throw new Error(
      'Chưa cấu hình Gemini API Key nên hệ thống chỉ trích xuất được danh sách dạng "Từ vựng - Nghĩa" hoặc "Từ vựng : Nghĩa" trên từng dòng. Hãy nhập Gemini API Key hoặc định dạng tài liệu theo từng dòng.'
    );
  }
  return parsedCards;
}
