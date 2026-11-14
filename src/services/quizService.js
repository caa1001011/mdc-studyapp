import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc
} from 'firebase/firestore';
import { db } from './firebase';

const EXAMS_COLLECTION = 'exam_quizzes';

export const EXAM_CATEGORIES = [
  { id: 'gk1', name: 'Đề ôn thi giữa kỳ 1' },
  { id: 'hk1', name: 'Đề ôn thi học kỳ 1' },
  { id: 'gk2', name: 'Đề ôn thi giữa kỳ 2' },
  { id: 'hk2', name: 'Đề ôn thi học kỳ 2' },
];

/**
 * Lấy toàn bộ danh sách đề ôn thi từ Firestore
 */
export async function fetchAllExams() {
  if (!db) return [];
  try {
    const snap = await getDocs(collection(db, EXAMS_COLLECTION));
    const exams = [];
    snap.forEach((docSnap) => {
      exams.push({ id: docSnap.id, ...docSnap.data() });
    });
    return exams.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  } catch (error) {
    console.error('Lỗi tải danh sách đề thi từ Firestore:', error);
    return [];
  }
}

/**
 * Admin: Lưu / Tạo mới một đề ôn thi
 */
export async function saveExam({
  id,
  subjectId,
  subjectName,
  categoryId,
  categoryName,
  title,
  durationMinutes,
  questions,
  createdBy,
}) {
  if (!db) {
    throw new Error('Chưa kết nối Firebase Firestore.');
  }

  const examId = id || `exam-${Date.now()}`;
  const examData = {
    id: examId,
    subjectId,
    subjectName,
    categoryId,
    categoryName,
    title: title.trim(),
    durationMinutes: Math.max(1, Number(durationMinutes) || 45),
    questions: questions || [],
    questionsCount: (questions || []).length,
    createdBy: createdBy || 'admin',
    createdAt: new Date().toISOString(),
  };

  await setDoc(doc(db, EXAMS_COLLECTION, examId), examData, { merge: true });
  return examData;
}

/**
 * Admin: Xóa một đề ôn thi
 */
export async function deleteExam(examId) {
  if (!db) {
    throw new Error('Chưa kết nối Firebase Firestore.');
  }
  await deleteDoc(doc(db, EXAMS_COLLECTION, examId));
  return true;
}

/**
 * Bộ phân tích câu hỏi trắc nghiệm từ văn bản thô (dùng khi không có API Key)
 */
function parseQuestionsFromText(rawText) {
  const blocks = rawText
    .split(/(?=Câu\s*\d+\s*[:.]|^\d+\.\s)/gim)
    .map((b) => b.trim())
    .filter(Boolean);

  const parsed = [];
  for (let i = 0; i < blocks.length; i++) {
    const lines = blocks[i].split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    if (lines.length < 2) continue;

    const questionLine = lines[0].replace(/^(Câu\s*\d+\s*[:.]|\d+\.)\s*/i, '').trim();
    const options = [];
    let correctIndex = 0;
    let explanation = '';

    for (let j = 1; j < lines.length; j++) {
      const line = lines[j];
      const optMatch = line.match(/^([A-Da-d])\s*[.):]\s*(.+)$/);
      if (optMatch && options.length < 4) {
        let optText = optMatch[2].trim();
        if (optText.startsWith('*') || /\(đúng\)|\[đúng\]/i.test(optText)) {
          correctIndex = options.length;
          optText = optText.replace(/^\*|\(đúng\)|\[đúng\]/gi, '').trim();
        }
        options.push(`${optMatch[1].toUpperCase()}. ${optText}`);
      } else if (/^Đáp án\s*[:.]/i.test(line)) {
        const ansMatch = line.match(/([A-Da-d])/);
        if (ansMatch) {
          correctIndex = 'ABCD'.indexOf(ansMatch[1].toUpperCase());
        }
      } else if (/^Giải thích\s*[:.]/i.test(line)) {
        explanation = line.replace(/^Giải thích\s*[:.]\s*/i, '').trim();
      }
    }

    if (questionLine && options.length >= 2) {
      while (options.length < 4) {
        const letter = 'ABCD'[options.length];
        options.push(`${letter}. ...`);
      }
      parsed.push({
        id: `q-${Date.now()}-${i}`,
        question: questionLine,
        options,
        correctIndex: Math.max(0, Math.min(3, correctIndex)),
        explanation,
      });
    }
  }

  return parsed;
}

/**
 * Tạo danh sách câu hỏi trắc nghiệm từ tài liệu bằng AI (Gemini) hoặc bộ phân tích văn bản
 */
export async function generateQuestionsFromDocument(documentInput, customApiKey = '') {
  const isObj = typeof documentInput === 'object' && documentInput !== null;
  const text = (isObj ? documentInput.text : documentInput || '').trim();
  const fileData = isObj ? documentInput.fileData : null;

  if (!text && !fileData) {
    throw new Error('Vui lòng nhập nội dung tài liệu hoặc chọn tệp đề thi.');
  }

  const apiKey = (customApiKey || import.meta.env.VITE_GEMINI_API_KEY || '').trim();

  if (apiKey) {
    const promptText = `Bạn là giáo viên THPT. Hãy trích xuất hoặc biên soạn các câu hỏi trắc nghiệm 4 lựa chọn từ tài liệu sau và trả về DUY NHẤT một mảng JSON hợp lệ (không markdown, không giải thích thêm).
Mỗi phần tử trong mảng có cấu trúc:
{
  "question": "Nội dung câu hỏi",
  "options": ["A. Đáp án 1", "B. Đáp án 2", "C. Đáp án 3", "D. Đáp án 4"],
  "correctIndex": 0,
  "explanation": "Lời giải thích ngắn gọn"
}
Lưu ý: correctIndex là số nguyên từ 0 đến 3 tương ứng A, B, C, D.`;

    const parts = [{ text: promptText }];
    if (fileData?.base64 && fileData?.mimeType) {
      parts.push({
        inlineData: {
          mimeType: fileData.mimeType,
          data: fileData.base64,
        },
      });
    }
    if (text) {
      parts.push({ text: `Nội dung bổ sung:\n${text.slice(0, 12000)}` });
    }

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(apiKey)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts }],
          generationConfig: { temperature: 0.2 },
        }),
      }
    );

    if (!res.ok) {
      const errBody = await res.text();
      throw new Error(`Lỗi Gemini API (${res.status}): ${errBody.slice(0, 200)}`);
    }

    const data = await res.json();
    const rawOutput = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const jsonMatch = rawOutput.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error('AI không trả về đúng định dạng danh sách câu hỏi JSON.');
    }

    const parsed = JSON.parse(jsonMatch[0]);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      throw new Error('Không trích xuất được câu hỏi nào từ tài liệu.');
    }

    return parsed.map((q, idx) => ({
      id: `q-ai-${Date.now()}-${idx}`,
      question: String(q.question || '').trim(),
      options: Array.isArray(q.options) && q.options.length === 4
        ? q.options.map((o) => String(o).trim())
        : ['A. ', 'B. ', 'C. ', 'D. '],
      correctIndex: Math.max(0, Math.min(3, Number(q.correctIndex) || 0)),
      explanation: String(q.explanation || '').trim(),
    }));
  }

  if (fileData && !text) {
    throw new Error(
      'Để AI đọc tệp PDF/DOC/DOCX, vui lòng nhập Gemini API Key hoặc dán nội dung văn bản trực tiếp vào khung bên dưới.'
    );
  }

  const localParsed = parseQuestionsFromText(text);
  if (localParsed.length > 0) {
    return localParsed;
  }

  throw new Error(
    'Không nhận diện được cấu trúc câu hỏi (VD: "Câu 1: ... A. ... B. ... C. ... D. ..."). Hãy nhập đúng định dạng hoặc nhập Gemini API Key để AI tự động xử lý.'
  );
}
