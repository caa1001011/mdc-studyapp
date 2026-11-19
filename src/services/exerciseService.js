import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc
} from 'firebase/firestore';
import { db } from './firebase';

const EXERCISES_COLLECTION = 'reinforcement_exercises';
const LOCAL_STORAGE_KEY = 'lumina_reinforcement_exercises';

/**
 * Kiểm tra môn học có phải Tiếng Anh không
 */
export function isEnglishSubject(subjectOrId) {
  if (!subjectOrId) return false;
  if (typeof subjectOrId === 'string') {
    return subjectOrId === 'sub-3' || /tiếng anh|english|anh12/i.test(subjectOrId);
  }
  return (
    subjectOrId.id === 'sub-3' ||
    /tiếng anh|english|anh12/i.test(subjectOrId.name || '') ||
    /anh/i.test(subjectOrId.code || '')
  );
}

/**
 * Kiểm tra quyền xem bài tập củng cố:
 * - scope === 'personal': chỉ hiển thị cho đúng tài khoản tạo ra (ownerUsername === username)
 * - scope === 'global' (hoặc không có scope — dữ liệu cũ do Admin tạo): hiển thị cho toàn hệ thống
 */
export function canUserSeeExercise(exercise, username = '') {
  if (!exercise) return false;
  if (exercise.scope === 'personal') {
    const owner = exercise.ownerUsername || exercise.createdBy || '';
    return Boolean(username) && owner === username;
  }
  return true;
}

/**
 * Lấy danh sách toàn bộ bài tập củng cố kiến thức từ Firestore (fallback LocalStorage)
 */
export async function fetchReinforcementExercises() {
  if (db) {
    try {
      const snap = await getDocs(collection(db, EXERCISES_COLLECTION));
      const items = [];
      snap.forEach((docSnap) => {
        items.push({ id: docSnap.id, ...docSnap.data() });
      });
      const sorted = items.sort((a, b) => (a.createdAt || '').localeCompare(b.createdAt || ''));
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(sorted));
      } catch {
        // ignore storage quota errors
      }
      return sorted;
    } catch (error) {
      console.warn('Lỗi tải bài tập củng cố từ Firestore:', error);
    }
  }

  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list)
      ? list.sort((a, b) => (a.createdAt || '').localeCompare(b.createdAt || ''))
      : [];
  } catch {
    return [];
  }
}

/**
 * Tạo mới hoặc cập nhật một bài tập củng cố kiến thức
 * - Admin tạo => scope: 'global' (áp dụng cho môn đó của toàn hệ thống)
 * - Học sinh tạo bằng AI => scope: 'personal', ownerUsername: username (chỉ tài khoản đó nhìn thấy)
 */
export async function saveReinforcementExercise({
  id,
  subjectId,
  subjectName,
  title,
  lessonName = '',
  mcQuestions = [],
  tfQuestions = [],
  creationMethod = 'manual',
  scope = 'global',
  ownerUsername = '',
  createdBy = 'admin',
  createdAt = '',
}) {
  const cleanTitle = String(title || '').trim();
  if (!cleanTitle) {
    throw new Error('Vui lòng nhập tiêu đề bài tập củng cố.');
  }

  const exerciseId = id || `ex-${Date.now()}`;
  const now = new Date().toISOString();
  const normalizedScope = scope === 'personal' ? 'personal' : 'global';
  const payload = {
    id: exerciseId,
    subjectId,
    subjectName,
    title: cleanTitle,
    lessonName: String(lessonName || '').trim(),
    mcQuestions: Array.isArray(mcQuestions) ? mcQuestions : [],
    tfQuestions: Array.isArray(tfQuestions) ? tfQuestions : [],
    totalQuestions: (mcQuestions?.length || 0) + (tfQuestions?.length || 0),
    creationMethod,
    scope: normalizedScope,
    ownerUsername: normalizedScope === 'personal' ? (ownerUsername || createdBy || '') : '',
    createdBy,
    createdAt: createdAt || now,
    updatedAt: now,
  };

  if (db) {
    await setDoc(doc(db, EXERCISES_COLLECTION, exerciseId), payload, { merge: true });
  }

  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    const current = raw ? JSON.parse(raw) : [];
    const exists = current.some((item) => item.id === exerciseId);
    const next = exists
      ? current.map((item) => (item.id === exerciseId ? payload : item))
      : [...current, payload];
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(next));
  } catch {
    // ignore
  }

  return payload;
}

/**
 * Admin: Xóa một bài tập củng cố kiến thức
 */
export async function deleteReinforcementExercise(exerciseId) {
  if (db) {
    await deleteDoc(doc(db, EXERCISES_COLLECTION, exerciseId));
  }

  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw) {
      const current = JSON.parse(raw);
      localStorage.setItem(
        LOCAL_STORAGE_KEY,
        JSON.stringify(current.filter((item) => item.id !== exerciseId))
      );
    }
  } catch {
    // ignore
  }

  return true;
}

/**
 * Chuẩn hóa câu hỏi Đúng/Sai sang định dạng mới (1 đề bài + nhiều ý a, b, c, d...)
 */
export function normalizeTfQuestion(q, fallbackIdx = 0) {
  if (!q) return null;
  if (Array.isArray(q.items)) {
    return {
      id: q.id || `tf-${Date.now()}-${fallbackIdx}`,
      prompt: String(q.prompt || '').trim(),
      items: q.items.map((item, idx) => ({
        id: item.id || `${q.id || `tf-${fallbackIdx}`}-item-${idx}`,
        text: String(item.text || '').trim(),
        isTrue: Boolean(item.isTrue),
      })),
      explanation: String(q.explanation || '').trim(),
    };
  }
  // Tương thích dữ liệu cũ (1 phát biểu đơn lẻ)
  return {
    id: q.id || `tf-${Date.now()}-${fallbackIdx}`,
    prompt: '',
    items: [
      {
        id: `${q.id || `tf-${fallbackIdx}`}-item-0`,
        text: String(q.statement || '').trim(),
        isTrue: Boolean(q.isTrue),
      },
    ],
    explanation: String(q.explanation || '').trim(),
  };
}

/**
 * Bộ phân tích câu hỏi Trắc nghiệm 4 lựa chọn & Đúng/Sai (nhiều ý a, b, c, d...) từ văn bản thô
 */
function parseExerciseFromText(rawText) {
  const blocks = rawText
    .split(/(?=Câu\s*\d+\s*[:.]|^\d+\.\s)/gim)
    .map((b) => b.trim())
    .filter(Boolean);

  const mcQuestions = [];
  const tfQuestions = [];

  for (let i = 0; i < blocks.length; i++) {
    const lines = blocks[i].split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    if (lines.length === 0) continue;

    const firstLine = lines[0].replace(/^(Câu\s*\d+\s*[:.]|\d+\.)\s*/i, '').trim();
    const mcOptions = [];
    const tfSubItems = [];
    let correctIndex = 0;
    let explanation = '';

    for (let j = 1; j < lines.length; j++) {
      const line = lines[j];
      const lowerSubMatch = line.match(/^([a-z])\)\s*(.+)$/);
      const upperOptMatch = line.match(/^([A-D])\s*[.):]\s*(.+)$/);

      if (lowerSubMatch) {
        let text = lowerSubMatch[2].trim();
        let isTrue = true;
        if (/\(sai\)|\[sai\]|[-–:]\s*sai$/i.test(text)) {
          isTrue = false;
          text = text.replace(/\s*(\(sai\)|\[sai\]|[-–:]\s*sai)$/i, '').trim();
        } else if (/\(đúng\)|\[đúng\]|[-–:]\s*đúng$/i.test(text)) {
          isTrue = true;
          text = text.replace(/\s*(\(đúng\)|\[đúng\]|[-–:]\s*đúng)$/i, '').trim();
        }
        tfSubItems.push({
          id: `tf-${Date.now()}-${i}-${tfSubItems.length}`,
          text,
          isTrue,
        });
      } else if (upperOptMatch && mcOptions.length < 4) {
        let optText = upperOptMatch[2].trim();
        if (optText.startsWith('*') || /\(đúng\)|\[đúng\]/i.test(optText)) {
          correctIndex = mcOptions.length;
          optText = optText.replace(/^\*|\(đúng\)|\[đúng\]/gi, '').trim();
        }
        mcOptions.push(optText);
      } else if (/^Đáp án\s*[:.]/i.test(line)) {
        const afterColon = line.replace(/^Đáp án\s*[:.]\s*/i, '').trim();
        const ansMatch = afterColon.match(/^([A-Da-d])/);
        if (ansMatch && mcOptions.length >= 2) {
          correctIndex = 'ABCD'.indexOf(ansMatch[1].toUpperCase());
        }
      } else if (/^Giải thích\s*[:.]/i.test(line)) {
        explanation = line.replace(/^Giải thích\s*[:.]\s*/i, '').trim();
      }
    }

    if (tfSubItems.length > 0) {
      tfQuestions.push({
        id: `tf-${Date.now()}-${i}`,
        prompt: firstLine,
        items: tfSubItems,
        explanation,
      });
    } else if (mcOptions.length >= 2) {
      while (mcOptions.length < 4) mcOptions.push('');
      mcQuestions.push({
        id: `mc-${Date.now()}-${i}`,
        question: firstLine,
        options: mcOptions.slice(0, 4),
        correctIndex: Math.min(3, Math.max(0, correctIndex)),
        explanation,
      });
    }
  }

  return { mcQuestions, tfQuestions };
}

/**
 * Gọi AI (Gemini 2.5 Flash) hoặc bộ phân tích văn bản để tạo Bài tập củng cố
 * - Môn Tiếng Anh: mặc định 10 câu Trắc nghiệm 1 lựa chọn (0 câu Đúng/Sai)
 * - Các môn khác: mặc định 8 câu Trắc nghiệm 1 lựa chọn + 2 câu Đúng/Sai (4 ý a,b,c,d)
 * Hỗ trợ tạo trực tiếp từ tên bài học (lessonTitle) và/hoặc tài liệu/file đính kèm
 */
export async function generateReinforcementExerciseFromDocument(
  {
    text = '',
    fileData = null,
    lessonTitle = '',
    mcCount,
    tfCount,
    subjectName = '',
    isEnglish,
  },
  customApiKey = ''
) {
  const cleanText = String(text || '').trim();
  const cleanLesson = String(lessonTitle || '').trim();
  if (!cleanText && !fileData && !cleanLesson) {
    throw new Error(
      'Vui lòng chọn bài học, dán nội dung bài học hoặc chọn tệp tài liệu (.pdf, .txt, .doc, .docx).'
    );
  }

  const englishMode =
    typeof isEnglish === 'boolean' ? isEnglish : isEnglishSubject(subjectName);
  const defaultMc = englishMode ? 10 : 8;
  const defaultTf = englishMode ? 0 : 2;

  const targetMc = Math.max(
    0,
    Math.min(30, mcCount === undefined || mcCount === null ? defaultMc : Number(mcCount) || 0)
  );
  const targetTf = englishMode
    ? 0
    : Math.max(
        0,
        Math.min(30, tfCount === undefined || tfCount === null ? defaultTf : Number(tfCount) || 0)
      );

  if (targetMc === 0 && targetTf === 0) {
    throw new Error('Vui lòng chọn ít nhất 1 câu trắc nghiệm hoặc 1 câu Đúng/Sai để AI tạo.');
  }

  const apiKey = (customApiKey || import.meta.env.VITE_GEMINI_API_KEY || '').trim();

  if (apiKey) {
    const lessonContextLine = cleanLesson
      ? `\nChủ đề / Bài học trọng tâm: "${cleanLesson}" (môn ${subjectName || 'THPT'}).`
      : '';

    const promptText = englishMode
      ? `Bạn là giáo viên Tiếng Anh THPT. Hãy biên soạn bài tập củng cố kiến thức môn Tiếng Anh dựa trên bài học/tài liệu sau.${lessonContextLine}
Yêu cầu bắt buộc:
- Tạo ĐÚNG ${targetMc} câu hỏi trắc nghiệm một lựa chọn (4 phương án A, B, C, D) trong mảng "mcQuestions".
- KHÔNG tạo câu hỏi Đúng/Sai ("tfQuestions" bắt buộc là mảng rỗng []).
- Câu hỏi bám sát chương trình THPT, đa dạng từ vựng, ngữ pháp, đọc hiểu ngắn phù hợp với bài học; giải thích ngắn gọn, rõ ràng (có thể dùng \\n để xuống dòng).

Chỉ trả về DUY NHẤT một đối tượng JSON hợp lệ (không markdown, không giải thích ngoài JSON) theo cấu trúc sau:
{
  "mcQuestions": [
    {
      "question": "Nội dung câu hỏi trắc nghiệm Tiếng Anh",
      "options": ["Phương án A", "Phương án B", "Phương án C", "Phương án D"],
      "correctIndex": 0,
      "explanation": "Giải thích ngắn gọn lý do chọn đáp án đúng"
    }
  ],
  "tfQuestions": []
}${cleanText ? `\n\nNội dung tài liệu bài học bổ sung:\n${cleanText.slice(0, 15000)}` : ''}`
      : `Bạn là giáo viên THPT bộ môn ${subjectName || 'tổng hợp'}. Hãy biên soạn bài tập củng cố kiến thức theo cấu trúc đề thi THPT mới nhất dựa trên bài học/tài liệu sau.${lessonContextLine}
Yêu cầu bắt buộc:
- Đúng ${targetMc} câu hỏi trắc nghiệm 1 lựa chọn gồm 4 phương án A, B, C, D (mcQuestions)
- Đúng ${targetTf} câu hỏi Đúng/Sai dạng chùm (tfQuestions): MỖI câu gồm 1 đề bài/câu dẫn chung ("prompt") và 4 ý khẳng định nhỏ a, b, c, d ("items") để học sinh xét Đúng hoặc Sai cho từng ý.

Chỉ trả về DUY NHẤT một đối tượng JSON hợp lệ (không markdown, không giải thích ngoài JSON) theo cấu trúc sau:
{
  "mcQuestions": [
    {
      "question": "Nội dung câu hỏi trắc nghiệm",
      "options": ["Nội dung phương án A", "Nội dung phương án B", "Nội dung phương án C", "Nội dung phương án D"],
      "correctIndex": 0,
      "explanation": "Giải thích ngắn gọn lý do đáp án đúng (có thể dùng \\n để xuống dòng)"
    }
  ],
  "tfQuestions": [
    {
      "prompt": "Đề bài chung / giả thiết của câu Đúng/Sai. Xét tính đúng/sai của các mệnh đề sau:",
      "items": [
        { "text": "Nội dung khẳng định ý a", "isTrue": true },
        { "text": "Nội dung khẳng định ý b", "isTrue": false },
        { "text": "Nội dung khẳng định ý c", "isTrue": true },
        { "text": "Nội dung khẳng định ý d", "isTrue": false }
      ],
      "explanation": "Giải thích ngắn gọn cho từng ý (có thể dùng \\n để xuống dòng)"
    }
  ]
}${cleanText ? `\n\nNội dung tài liệu bài học bổ sung:\n${cleanText.slice(0, 15000)}` : ''}`;

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
          generationConfig: { temperature: 0.35 },
        }),
      }
    );

    if (!response.ok) {
      const errBody = await response.text();
      console.error('Lỗi Gemini API khi tạo bài tập củng cố:', errBody);
      throw new Error('Không thể gọi AI Gemini. Vui lòng kiểm tra lại API Key hoặc định dạng tệp.');
    }

    const data = await response.json();
    const rawOutput = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const jsonMatch = rawOutput.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('AI không trả về đúng định dạng JSON đề bài tập. Vui lòng thử lại.');
    }

    const parsed = JSON.parse(jsonMatch[0]);
    const mcQuestions = Array.isArray(parsed.mcQuestions)
      ? parsed.mcQuestions
          .filter((q) => q?.question && Array.isArray(q.options))
          .map((q, idx) => {
            const opts = q.options.slice(0, 4).map((o) => String(o || '').replace(/^[A-Da-d]\s*[.):]\s*/, '').trim());
            while (opts.length < 4) opts.push('');
            return {
              id: `mc-ai-${Date.now()}-${idx}`,
              question: String(q.question).trim(),
              options: opts,
              correctIndex: Math.min(3, Math.max(0, Number(q.correctIndex) || 0)),
              explanation: String(q.explanation || '').trim(),
            };
          })
      : [];

    const tfQuestions = englishMode
      ? []
      : Array.isArray(parsed.tfQuestions)
      ? parsed.tfQuestions
          .filter((q) => q && (Array.isArray(q.items) ? q.items.length > 0 : q.statement))
          .map((q, idx) => {
            if (Array.isArray(q.items)) {
              return {
                id: `tf-ai-${Date.now()}-${idx}`,
                prompt: String(q.prompt || '').trim(),
                items: q.items
                  .filter((it) => it?.text)
                  .map((it, subIdx) => ({
                    id: `tf-ai-${Date.now()}-${idx}-${subIdx}`,
                    text: String(it.text).replace(/^[a-z]\)\s*/i, '').trim(),
                    isTrue: Boolean(it.isTrue),
                  })),
                explanation: String(q.explanation || '').trim(),
              };
            }
            return normalizeTfQuestion(q, idx);
          })
      : [];

    if (mcQuestions.length === 0 && tfQuestions.length === 0) {
      throw new Error('AI chưa trích xuất được câu hỏi nào từ bài học/tài liệu này. Vui lòng thử lại.');
    }

    return { mcQuestions, tfQuestions };
  }

  if (!cleanText) {
    throw new Error(
      'Để AI tự động tạo câu hỏi theo bài học hoặc đọc file PDF/DOC/DOCX, vui lòng cấu hình hoặc nhập Gemini API Key.'
    );
  }

  const parsed = parseExerciseFromText(cleanText);
  if (englishMode) {
    parsed.tfQuestions = [];
  }
  if (parsed.mcQuestions.length === 0 && parsed.tfQuestions.length === 0) {
    throw new Error(
      'Chưa cấu hình Gemini API Key nên hệ thống chỉ tách được câu hỏi theo mẫu "Câu 1: ... A. ... B. ... C. ... D. ... Đáp án: A". Hãy nhập Gemini API Key để AI tự tạo câu hỏi cho bài học này.'
    );
  }

  return parsed;
}
