import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc
} from 'firebase/firestore';
import { db } from './firebase';
import { generateGeminiText } from './geminiService';

const EXAMS_COLLECTION = 'exam_quizzes';

export const EXAM_CATEGORIES = [
  { id: 'gk1', name: 'Đề ôn thi giữa kỳ 1' },
  { id: 'hk1', name: 'Đề ôn thi học kỳ 1' },
  { id: 'gk2', name: 'Đề ôn thi giữa kỳ 2' },
  { id: 'hk2', name: 'Đề ôn thi học kỳ 2' },
];

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
 * Chuẩn hóa số thực từ chuỗi người dùng nhập (hỗ trợ cả dấu . và dấu ,)
 */
export function parseRealNumber(raw) {
  if (raw === null || raw === undefined) return NaN;
  const cleaned = String(raw).trim().replace(/\s+/g, '').replace(',', '.');
  if (!cleaned) return NaN;
  if (!/^[+-]?(\d+(\.\d+)?|\.\d+)$/.test(cleaned)) return NaN;
  const num = Number(cleaned);
  return Number.isFinite(num) ? num : NaN;
}

/**
 * So sánh hai đáp án số thực
 */
export function isRealNumberEqual(userRaw, correctRaw) {
  const u = parseRealNumber(userRaw);
  const c = parseRealNumber(correctRaw);
  if (Number.isNaN(u) || Number.isNaN(c)) return false;
  return Math.abs(u - c) <= 1e-6;
}

/**
 * Chuẩn hóa câu hỏi Trắc nghiệm 4 lựa chọn
 */
export function normalizeMcQuestion(q, fallbackIdx = 0) {
  if (!q) return null;
  const rawOptions = Array.isArray(q.options) ? q.options : [];
  const options = [0, 1, 2, 3].map((i) => String(rawOptions[i] ?? '').trim());
  return {
    id: q.id || `mc-${Date.now()}-${fallbackIdx}`,
    type: 'mc',
    question: String(q.question || '').trim(),
    options,
    correctIndex: Math.max(0, Math.min(3, Number(q.correctIndex) || 0)),
    explanation: String(q.explanation || '').trim(),
  };
}

/**
 * Chuẩn hóa câu hỏi Đúng/Sai (1 đề bài + 1 hoặc nhiều ý con)
 */
export function normalizeTfQuestion(q, fallbackIdx = 0) {
  if (!q) return null;
  const baseId = q.id || `tf-${Date.now()}-${fallbackIdx}`;
  if (Array.isArray(q.items) && q.items.length > 0) {
    return {
      id: baseId,
      type: 'tf',
      prompt: String(q.prompt || q.question || '').trim(),
      items: q.items.map((item, idx) => ({
        id: item.id || `${baseId}-item-${idx}`,
        text: String(item.text || '').trim(),
        isTrue: Boolean(item.isTrue),
      })),
      explanation: String(q.explanation || '').trim(),
    };
  }
  return {
    id: baseId,
    type: 'tf',
    prompt: String(q.prompt || '').trim(),
    items: [
      {
        id: `${baseId}-item-0`,
        text: String(q.statement || q.question || '').trim(),
        isTrue: Boolean(q.isTrue),
      },
    ],
    explanation: String(q.explanation || '').trim(),
  };
}

/**
 * Chuẩn hóa câu hỏi Trả lời ngắn (số thực)
 */
export function normalizeShortQuestion(q, fallbackIdx = 0) {
  if (!q) return null;
  return {
    id: q.id || `short-${Date.now()}-${fallbackIdx}`,
    type: 'short',
    question: String(q.question || '').trim(),
    correctAnswer: String(q.correctAnswer ?? '').trim(),
    explanation: String(q.explanation || '').trim(),
  };
}

/**
 * Chuẩn hóa câu hỏi Tự luận (không chấm điểm, chỉ hiển thị phương pháp giải)
 */
export function normalizeEssayQuestion(q, fallbackIdx = 0) {
  if (!q) return null;
  return {
    id: q.id || `essay-${Date.now()}-${fallbackIdx}`,
    type: 'essay',
    question: String(q.question || '').trim(),
    solutionGuide: String(q.solutionGuide || q.explanation || '').trim(),
  };
}

/**
 * Chuẩn hóa bài đọc Reading (môn Tiếng Anh) gồm đoạn văn + câu hỏi MC/TF bên dưới
 */
export function normalizeReadingPassage(p, fallbackIdx = 0) {
  if (!p) return null;
  const baseId = p.id || `reading-${Date.now()}-${fallbackIdx}`;
  const rawQuestions = Array.isArray(p.questions) ? p.questions : [];
  const questions = rawQuestions
    .map((q, qIdx) => {
      if (q?.type === 'tf' || Array.isArray(q?.items)) {
        return normalizeTfQuestion(q, qIdx);
      }
      return normalizeMcQuestion(q, qIdx);
    })
    .filter(Boolean);

  return {
    id: baseId,
    title: String(p.title || '').trim(),
    passage: String(p.passage || '').trim(),
    questions,
  };
}

/**
 * Chuẩn hóa toàn bộ dữ liệu đề thi (tương thích ngược với đề cũ chỉ có mảng questions)
 */
export function normalizeExamData(exam) {
  if (!exam) return null;
  const english = isEnglishSubject({ id: exam.subjectId, name: exam.subjectName });
  const rawMc = Array.isArray(exam.mcQuestions)
    ? exam.mcQuestions
    : Array.isArray(exam.questions)
    ? exam.questions
    : [];

  const mcQuestions = rawMc.map((q, i) => normalizeMcQuestion(q, i)).filter(Boolean);
  const tfQuestions = (Array.isArray(exam.tfQuestions) ? exam.tfQuestions : [])
    .map((q, i) => normalizeTfQuestion(q, i))
    .filter(Boolean);
  const shortQuestions = english
    ? []
    : (Array.isArray(exam.shortQuestions) ? exam.shortQuestions : [])
        .map((q, i) => normalizeShortQuestion(q, i))
        .filter(Boolean);
  const readingPassages = english
    ? (Array.isArray(exam.readingPassages) ? exam.readingPassages : [])
        .map((p, i) => normalizeReadingPassage(p, i))
        .filter(Boolean)
    : [];
  const essayQuestions = (Array.isArray(exam.essayQuestions) ? exam.essayQuestions : [])
    .map((q, i) => normalizeEssayQuestion(q, i))
    .filter(Boolean);

  const readingQuestionsCount = readingPassages.reduce(
    (sum, p) => sum + (p.questions?.length || 0),
    0
  );
  const totalQuestions =
    mcQuestions.length +
    tfQuestions.length +
    shortQuestions.length +
    readingQuestionsCount +
    essayQuestions.length;

  return {
    ...exam,
    isEnglish: english,
    mcQuestions,
    tfQuestions,
    shortQuestions,
    readingPassages,
    essayQuestions,
    questionsCount: totalQuestions,
  };
}

/**
 * Tính điểm cho 1 câu Đúng/Sai
 * - Nếu 4 ý: chuẩn Bộ GD (1 ý = 0.1, 2 ý = 0.25, 3 ý = 0.5, 4 ý = 1.0)
 * - Nếu khác 4 ý: tính tỷ lệ đúng / tổng số ý (tối đa 1.0 điểm/câu)
 */
export function scoreTfQuestion(tfQuestion, userItemAnswers = {}) {
  const items = tfQuestion?.items || [];
  const totalItems = items.length;
  if (totalItems === 0) return { correctItems: 0, totalItems: 0, earned: 0, max: 0 };

  let correctItems = 0;
  items.forEach((item) => {
    if (userItemAnswers[item.id] === item.isTrue) {
      correctItems += 1;
    }
  });

  let earned = 0;
  if (totalItems === 4) {
    const table = [0, 0.1, 0.25, 0.5, 1.0];
    earned = table[correctItems] ?? 0;
  } else {
    earned = correctItems / totalItems;
  }

  return { correctItems, totalItems, earned, max: 1 };
}

/**
 * Chấm điểm toàn bộ bài thi (Tự luận không tính điểm)
 */
export function gradeExamSubmission(exam, answers) {
  const normalized = normalizeExamData(exam);
  const mcAnswers = answers?.mc || {};
  const tfAnswers = answers?.tf || {};
  const shortAnswers = answers?.short || {};

  let mcCorrect = 0;
  normalized.mcQuestions.forEach((q) => {
    if (mcAnswers[q.id] === q.correctIndex) mcCorrect += 1;
  });

  let tfEarned = 0;
  let tfMax = 0;
  let tfItemsCorrect = 0;
  let tfItemsTotal = 0;
  normalized.tfQuestions.forEach((q) => {
    const res = scoreTfQuestion(q, tfAnswers[q.id] || {});
    tfEarned += res.earned;
    tfMax += res.max;
    tfItemsCorrect += res.correctItems;
    tfItemsTotal += res.totalItems;
  });

  let shortCorrect = 0;
  normalized.shortQuestions.forEach((q) => {
    if (isRealNumberEqual(shortAnswers[q.id], q.correctAnswer)) shortCorrect += 1;
  });

  let readingEarned = 0;
  let readingMax = 0;
  let readingMcCorrect = 0;
  let readingMcTotal = 0;
  let readingTfItemsCorrect = 0;
  let readingTfItemsTotal = 0;

  normalized.readingPassages.forEach((p) => {
    (p.questions || []).forEach((q) => {
      if (q.type === 'tf') {
        const res = scoreTfQuestion(q, tfAnswers[q.id] || {});
        readingEarned += res.earned;
        readingMax += res.max;
        readingTfItemsCorrect += res.correctItems;
        readingTfItemsTotal += res.totalItems;
      } else {
        readingMcTotal += 1;
        readingMax += 1;
        if (mcAnswers[q.id] === q.correctIndex) {
          readingMcCorrect += 1;
          readingEarned += 1;
        }
      }
    });
  });

  const totalEarned = mcCorrect + tfEarned + shortCorrect + readingEarned;
  const totalMax =
    normalized.mcQuestions.length + tfMax + normalized.shortQuestions.length + readingMax;
  const scoreOutOf10 = totalMax > 0 ? Math.round((totalEarned / totalMax) * 1000) / 100 : 0;
  const percentage = totalMax > 0 ? Math.round((totalEarned / totalMax) * 100) : 0;

  return {
    mcCorrect,
    mcTotal: normalized.mcQuestions.length,
    tfEarned,
    tfMax,
    tfItemsCorrect,
    tfItemsTotal,
    shortCorrect,
    shortTotal: normalized.shortQuestions.length,
    readingEarned,
    readingMax,
    readingMcCorrect,
    readingMcTotal,
    readingTfItemsCorrect,
    readingTfItemsTotal,
    essayTotal: normalized.essayQuestions.length,
    totalEarned: Math.round(totalEarned * 100) / 100,
    totalMax: Math.round(totalMax * 100) / 100,
    scoreOutOf10,
    percentage,
  };
}

/**
 * Lấy toàn bộ danh sách đề ôn thi từ Firestore
 */
export async function fetchAllExams() {
  if (!db) return [];
  try {
    const snap = await getDocs(collection(db, EXAMS_COLLECTION));
    const exams = [];
    snap.forEach((docSnap) => {
      exams.push(normalizeExamData({ id: docSnap.id, ...docSnap.data() }));
    });
    return exams.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  } catch (error) {
    console.error('Lỗi tải danh sách đề thi từ Firestore:', error);
    return [];
  }
}

/**
 * Admin: Lưu / Tạo mới hoặc cập nhật một đề ôn thi
 */
export async function saveExam({
  id,
  subjectId,
  subjectName,
  categoryId,
  categoryName,
  title,
  durationMinutes,
  mcQuestions = [],
  tfQuestions = [],
  shortQuestions = [],
  readingPassages = [],
  essayQuestions = [],
  createdBy,
  createdAt,
}) {
  if (!db) {
    throw new Error('Chưa kết nối Firebase Firestore.');
  }

  const english = isEnglishSubject({ id: subjectId, name: subjectName });
  const examId = id || `exam-${Date.now()}`;
  const now = new Date().toISOString();

  const cleanMc = (mcQuestions || []).map((q, i) => normalizeMcQuestion(q, i)).filter(Boolean);
  const cleanTf = (tfQuestions || []).map((q, i) => normalizeTfQuestion(q, i)).filter(Boolean);
  const cleanShort = english
    ? []
    : (shortQuestions || []).map((q, i) => normalizeShortQuestion(q, i)).filter(Boolean);
  const cleanReading = english
    ? (readingPassages || []).map((p, i) => normalizeReadingPassage(p, i)).filter(Boolean)
    : [];
  const cleanEssay = (essayQuestions || [])
    .map((q, i) => normalizeEssayQuestion(q, i))
    .filter(Boolean);

  const readingQCount = cleanReading.reduce((sum, p) => sum + (p.questions?.length || 0), 0);
  const totalCount =
    cleanMc.length + cleanTf.length + cleanShort.length + readingQCount + cleanEssay.length;

  const examData = {
    id: examId,
    subjectId,
    subjectName,
    categoryId,
    categoryName,
    title: title.trim(),
    durationMinutes: Math.max(1, Number(durationMinutes) || 45),
    isEnglish: english,
    mcQuestions: cleanMc,
    tfQuestions: cleanTf,
    shortQuestions: cleanShort,
    readingPassages: cleanReading,
    essayQuestions: cleanEssay,
    // Giữ trường questions để tương thích ngược nếu cần
    questions: cleanMc,
    questionsCount: totalCount,
    createdBy: createdBy || 'admin',
    createdAt: createdAt || now,
    updatedAt: now,
  };

  await setDoc(doc(db, EXAMS_COLLECTION, examId), examData, { merge: true });
  return normalizeExamData(examData);
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
 * Bộ phân tích văn bản cục bộ (fallback khi không có Gemini API Key)
 */
function parseExamFromTextLocal(rawText, isEnglish = false) {
  const blocks = rawText
    .split(/(?=Câu\s*\d+\s*[:.]|Question\s*\d+\s*[:.]|^\d+\.\s)/gim)
    .map((b) => b.trim())
    .filter(Boolean);

  const mcQuestions = [];
  const tfQuestions = [];
  const shortQuestions = [];
  const essayQuestions = [];

  for (let i = 0; i < blocks.length; i++) {
    const lines = blocks[i].split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    if (lines.length === 0) continue;

    const firstLine = lines[0].replace(/^(Câu\s*\d+\s*[:.]|Question\s*\d+\s*[:.]|\d+\.)\s*/i, '').trim();
    const mcOptions = [];
    const tfItems = [];
    let correctIndex = 0;
    let shortAns = '';
    let explanation = '';
    let solutionGuide = '';

    for (let j = 1; j < lines.length; j++) {
      const line = lines[j];
      const lowerSubMatch = line.match(/^([a-z])\)\s*(.+)$/);
      const upperOptMatch = line.match(/^([A-D])\s*[.):]\s*(.+)$/);

      if (lowerSubMatch) {
        let text = lowerSubMatch[2].trim();
        let isTrue = true;
        if (/\(sai\)|\[sai\]|\(false\)|\[false\]|[-–:]\s*(sai|false)$/i.test(text)) {
          isTrue = false;
          text = text.replace(/\s*(\(sai\)|\[sai\]|\(false\)|\[false\]|[-–:]\s*(sai|false))$/i, '').trim();
        } else if (/\(đúng\)|\[đúng\]|\(true\)|\[true\]|[-–:]\s*(đúng|true)$/i.test(text)) {
          isTrue = true;
          text = text.replace(/\s*(\(đúng\)|\[đúng\]|\(true\)|\[true\]|[-–:]\s*(đúng|true))$/i, '').trim();
        }
        tfItems.push({
          id: `tf-local-${Date.now()}-${i}-${tfItems.length}`,
          text,
          isTrue,
        });
      } else if (upperOptMatch && mcOptions.length < 4) {
        let optText = upperOptMatch[2].trim();
        if (optText.startsWith('*') || /\(đúng\)|\[đúng\]/i.test(optText)) {
          correctIndex = mcOptions.length;
          optText = optText.replace(/^\*|\(đúng\)|\[đúng\]/gi, '').trim();
        }
        mcOptions.push(`${upperOptMatch[1].toUpperCase()}. ${optText}`);
      } else if (/^(Đáp án|Answer)\s*[:.]/i.test(line)) {
        const val = line.replace(/^(Đáp án|Answer)\s*[:.]\s*/i, '').trim();
        const ansMatch = val.match(/^([A-Da-d])(\b|$)/);
        if (ansMatch && mcOptions.length >= 2) {
          correctIndex = 'ABCD'.indexOf(ansMatch[1].toUpperCase());
        } else if (!Number.isNaN(parseRealNumber(val))) {
          shortAns = val;
        }
      } else if (/^(Hướng giải|Phương pháp giải|Lời giải)\s*[:.]/i.test(line)) {
        solutionGuide = line.replace(/^(Hướng giải|Phương pháp giải|Lời giải)\s*[:.]\s*/i, '').trim();
      } else if (/^(Giải thích|Explanation)\s*[:.]/i.test(line)) {
        explanation = line.replace(/^(Giải thích|Explanation)\s*[:.]\s*/i, '').trim();
      }
    }

    if (tfItems.length > 0) {
      tfQuestions.push(
        normalizeTfQuestion({
          id: `tf-local-${Date.now()}-${i}`,
          prompt: firstLine,
          items: tfItems,
          explanation,
        }, i)
      );
    } else if (mcOptions.length >= 2) {
      while (mcOptions.length < 4) {
        mcOptions.push(`${'ABCD'[mcOptions.length]}. `);
      }
      mcQuestions.push(
        normalizeMcQuestion({
          id: `mc-local-${Date.now()}-${i}`,
          question: firstLine,
          options: mcOptions,
          correctIndex,
          explanation,
        }, i)
      );
    } else if (!isEnglish && shortAns) {
      shortQuestions.push(
        normalizeShortQuestion({
          id: `short-local-${Date.now()}-${i}`,
          question: firstLine,
          correctAnswer: shortAns,
          explanation,
        }, i)
      );
    } else if (solutionGuide) {
      essayQuestions.push(
        normalizeEssayQuestion({
          id: `essay-local-${Date.now()}-${i}`,
          question: firstLine,
          solutionGuide,
        }, i)
      );
    }
  }

  return {
    mcQuestions,
    tfQuestions,
    shortQuestions: isEnglish ? [] : shortQuestions,
    readingPassages: [],
    essayQuestions,
  };
}

/**
 * Tạo đề thi đầy đủ các phần từ tài liệu/file bằng AI (Gemini 2.5 Flash) để Admin xem trước & chỉnh sửa
 */
export async function generateExamFromDocument(documentInput) {
  const isObj = typeof documentInput === 'object' && documentInput !== null;
  const text = (isObj ? documentInput.text : documentInput || '').trim();
  const fileData = isObj ? documentInput.fileData : null;
  const subjectName = isObj ? documentInput.subjectName || '' : '';
  const isEnglish = isObj
    ? Boolean(documentInput.isEnglish) || isEnglishSubject(subjectName)
    : false;

  if (!text && !fileData) {
    throw new Error('Vui lòng nhập nội dung tài liệu hoặc chọn tệp đề thi.');
  }

  try {
    const promptText = isEnglish
      ? `Bạn là giáo viên Tiếng Anh THPT. Hãy trích xuất hoặc biên soạn bộ đề thi môn Tiếng Anh từ tài liệu sau và trả về DUY NHẤT một object JSON hợp lệ (không markdown, không giải thích thêm).
Cấu trúc JSON bắt buộc:
{
  "mcQuestions": [
    {
      "question": "Nội dung câu hỏi trắc nghiệm 4 lựa chọn (không thuộc bài Reading)",
      "options": ["A. ...", "B. ...", "C. ...", "D. ..."],
      "correctIndex": 0,
      "explanation": "Giải thích ngắn gọn"
    }
  ],
  "tfQuestions": [
    {
      "prompt": "Đề bài chung (có thể để trống nếu chỉ có 1 ý)",
      "items": [
        { "text": "Mệnh đề khẳng định", "isTrue": true }
      ],
      "explanation": "Giải thích chi tiết"
    }
  ],
  "readingPassages": [
    {
      "title": "Reading Passage 1",
      "passage": "Toàn bộ nội dung đoạn văn bài đọc",
      "questions": [
        {
          "type": "mc",
          "question": "Câu hỏi trắc nghiệm đọc hiểu",
          "options": ["A. ...", "B. ...", "C. ...", "D. ..."],
          "correctIndex": 0,
          "explanation": "Giải thích"
        },
        {
          "type": "tf",
          "prompt": "Read the passage and decide if the following statements are True or False",
          "items": [
            { "text": "Phát biểu 1", "isTrue": true },
            { "text": "Phát biểu 2", "isTrue": false }
          ],
          "explanation": "Giải thích"
        }
      ]
    }
  ],
  "essayQuestions": [
    {
      "question": "Đề bài tự luận / viết lại câu / viết đoạn văn",
      "solutionGuide": "Phương pháp giải / dàn ý / đáp án gợi ý"
    }
  ]
}
Lưu ý: Không tạo phần trả lời ngắn cho môn Tiếng Anh. Nếu tài liệu không có phần nào thì để mảng rỗng [].`
      : `Bạn là giáo viên THPT môn ${subjectName || 'khoa học tự nhiên'}. Hãy trích xuất hoặc biên soạn bộ đề thi từ tài liệu sau và trả về DUY NHẤT một object JSON hợp lệ (không markdown, không giải thích thêm).
Cấu trúc JSON bắt buộc:
{
  "mcQuestions": [
    {
      "question": "Nội dung câu hỏi trắc nghiệm 4 lựa chọn",
      "options": ["A. ...", "B. ...", "C. ...", "D. ..."],
      "correctIndex": 0,
      "explanation": "Lời giải thích (có thể dùng \\n để xuống dòng)"
    }
  ],
  "tfQuestions": [
    {
      "prompt": "Đề bài / giả thiết chung của câu Đúng/Sai",
      "items": [
        { "text": "Nội dung khẳng định a", "isTrue": true },
        { "text": "Nội dung khẳng định b", "isTrue": false },
        { "text": "Nội dung khẳng định c", "isTrue": true },
        { "text": "Nội dung khẳng định d", "isTrue": false }
      ],
      "explanation": "Giải thích từng ý (dùng \\n xuống dòng)"
    }
  ],
  "shortQuestions": [
    {
      "question": "Nội dung câu hỏi trả lời ngắn (đáp án là số thực)",
      "correctAnswer": "12.5",
      "explanation": "Hướng dẫn tính ra kết quả"
    }
  ],
  "essayQuestions": [
    {
      "question": "Nội dung câu hỏi tự luận",
      "solutionGuide": "Phương pháp giải / hướng giải quyết chi tiết từng bước"
    }
  ]
}
Lưu ý: correctAnswer trong shortQuestions phải là một số thực (VD: "12.5", "-3", "0.75"). Nếu tài liệu không có phần nào thì để mảng rỗng [].`;

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
      parts.push({ text: `Nội dung tài liệu:\n${text.slice(0, 18000)}` });
    }

    const rawOutput = await generateGeminiText({ parts, temperature: 0.2 });
    const jsonMatch = rawOutput.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('AI không trả về đúng định dạng đề thi JSON.');
    }

    const parsed = JSON.parse(jsonMatch[0]);
    const now = Date.now();

    const mcQuestions = (Array.isArray(parsed.mcQuestions) ? parsed.mcQuestions : [])
      .map((q, idx) => normalizeMcQuestion({ ...q, id: `mc-ai-${now}-${idx}` }, idx))
      .filter((q) => q && q.question);

    const tfQuestions = (Array.isArray(parsed.tfQuestions) ? parsed.tfQuestions : [])
      .map((q, idx) => normalizeTfQuestion({ ...q, id: `tf-ai-${now}-${idx}` }, idx))
      .filter((q) => q && (q.prompt || q.items.some((it) => it.text)));

    const shortQuestions = isEnglish
      ? []
      : (Array.isArray(parsed.shortQuestions) ? parsed.shortQuestions : [])
          .map((q, idx) => normalizeShortQuestion({ ...q, id: `short-ai-${now}-${idx}` }, idx))
          .filter((q) => q && q.question);

    const readingPassages = isEnglish
      ? (Array.isArray(parsed.readingPassages) ? parsed.readingPassages : [])
          .map((p, idx) => normalizeReadingPassage({ ...p, id: `read-ai-${now}-${idx}` }, idx))
          .filter((p) => p && (p.passage || p.questions.length > 0))
      : [];

    const essayQuestions = (Array.isArray(parsed.essayQuestions) ? parsed.essayQuestions : [])
      .map((q, idx) => normalizeEssayQuestion({ ...q, id: `essay-ai-${now}-${idx}` }, idx))
      .filter((q) => q && q.question);

    const total =
      mcQuestions.length +
      tfQuestions.length +
      shortQuestions.length +
      readingPassages.reduce((s, p) => s + p.questions.length, 0) +
      essayQuestions.length;

    if (total === 0) {
      throw new Error('AI không trích xuất được câu hỏi nào từ tài liệu này.');
    }

    return {
      mcQuestions,
      tfQuestions,
      shortQuestions,
      readingPassages,
      essayQuestions,
    };
  } catch (aiErr) {
    if (text && !fileData) {
      const localResult = parseExamFromTextLocal(text, isEnglish);
      const localTotal =
        localResult.mcQuestions.length +
        localResult.tfQuestions.length +
        localResult.shortQuestions.length +
        localResult.essayQuestions.length;

      if (localTotal > 0) {
        return localResult;
      }
    }
    throw aiErr;
  }
}

// Giữ export cũ để đảm bảo tương thích
export const generateQuestionsFromDocument = generateExamFromDocument;
