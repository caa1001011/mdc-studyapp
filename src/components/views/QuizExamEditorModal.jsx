import React, { useState, useRef } from 'react';
import {
  X,
  Plus,
  Wand2,
  Upload,
  Trash2,
  Loader2,
  Save,
  Sparkles,
  FileText,
  CheckCircle,
  Check,
  BookOpen,
  ListChecks,
  ToggleLeft,
  Hash,
  PenTool,
} from 'lucide-react';
import {
  isEnglishSubject,
  normalizeExamData,
  parseRealNumber,
  saveExam,
  generateExamFromDocument,
} from '../../services/quizService';

const uid = (prefix) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

const EMPTY_MC = () => ({
  id: uid('mc'),
  type: 'mc',
  question: '',
  options: ['A. ', 'B. ', 'C. ', 'D. '],
  correctIndex: 0,
  explanation: '',
});

const EMPTY_TF_ITEM = () => ({
  id: uid('tfi'),
  text: '',
  isTrue: true,
});

const EMPTY_TF = (initialItems = 4) => ({
  id: uid('tf'),
  type: 'tf',
  prompt: '',
  items: Array.from({ length: initialItems }, () => EMPTY_TF_ITEM()),
  explanation: '',
});

const EMPTY_SHORT = () => ({
  id: uid('short'),
  type: 'short',
  question: '',
  correctAnswer: '',
  explanation: '',
});

const EMPTY_ESSAY = () => ({
  id: uid('essay'),
  type: 'essay',
  question: '',
  solutionGuide: '',
});

const EMPTY_READING = () => ({
  id: uid('read'),
  title: '',
  passage: '',
  questions: [EMPTY_MC()],
});

const getItemLetter = (idx) => String.fromCharCode(97 + idx); // a, b, c, ...

/**
 * Component con: Trình soạn thảo 1 câu Đúng/Sai (dùng chung cho phần Đúng/Sai và phần Reading)
 * Quy tắc: nếu chỉ có 1 ý con thì KHÔNG đánh thứ tự chữ cái (a, b, ...)
 */
function TrueFalseQuestionEditor({
  question,
  label,
  onChange,
  onRemove,
  isEnglish = false,
}) {
  const showLetters = question.items.length > 1;
  const trueLabel = isEnglish ? 'True' : 'Đúng';
  const falseLabel = isEnglish ? 'False' : 'Sai';

  const updateItem = (itemIdx, patch) => {
    const nextItems = question.items.map((it, i) => (i === itemIdx ? { ...it, ...patch } : it));
    onChange({ ...question, items: nextItems });
  };

  const addItem = () => {
    onChange({ ...question, items: [...question.items, EMPTY_TF_ITEM()] });
  };

  const removeItem = (itemIdx) => {
    if (question.items.length <= 1) return;
    onChange({ ...question, items: question.items.filter((_, i) => i !== itemIdx) });
  };

  return (
    <div className="p-4 rounded-2xl bg-slate-50/80 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-bold text-indigo-600 dark:text-purple-300">{label}</span>
        {onRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="text-rose-500 hover:text-rose-400 text-xs flex items-center gap-1 cursor-pointer"
            title="Xóa câu hỏi này"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Xóa</span>
          </button>
        )}
      </div>

      <textarea
        rows={2}
        placeholder={
          showLetters
            ? 'Đề bài / giả thiết chung (tùy chọn nếu chỉ có 1 phát biểu)...'
            : 'Đề bài / ngữ cảnh (tùy chọn)...'
        }
        value={question.prompt}
        onChange={(e) => onChange({ ...question, prompt: e.target.value })}
        className="w-full px-3 py-2 rounded-xl bg-white dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-xs focus:outline-none focus:border-purple-400"
      />

      <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-white/10">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="bg-indigo-50/80 dark:bg-purple-500/15 text-indigo-900 dark:text-purple-200">
              {showLetters && (
                <th className="py-2 px-2.5 text-center font-bold w-10 border-b border-slate-200 dark:border-white/10">
                  Ý
                </th>
              )}
              <th className="py-2 px-3 text-left font-bold border-b border-slate-200 dark:border-white/10">
                Nội dung khẳng định *
              </th>
              <th className="py-2 px-2 text-center font-bold w-16 border-b border-slate-200 dark:border-white/10">
                {trueLabel}
              </th>
              <th className="py-2 px-2 text-center font-bold w-16 border-b border-slate-200 dark:border-white/10">
                {falseLabel}
              </th>
              <th className="py-2 px-2 text-center font-bold w-10 border-b border-slate-200 dark:border-white/10">
                Xóa
              </th>
            </tr>
          </thead>
          <tbody>
            {question.items.map((item, idx) => (
              <tr
                key={item.id}
                className="border-b last:border-b-0 border-slate-200/80 dark:border-white/10 bg-white dark:bg-transparent"
              >
                {showLetters && (
                  <td className="py-2 px-2.5 text-center font-bold text-slate-700 dark:text-slate-200">
                    {getItemLetter(idx)})
                  </td>
                )}
                <td className="py-2 px-2">
                  <input
                    type="text"
                    placeholder={
                      showLetters
                        ? `Nhập nội dung ý ${getItemLetter(idx)})...`
                        : 'Nhập nội dung mệnh đề Đúng/Sai...'
                    }
                    value={item.text}
                    onChange={(e) => updateItem(idx, { text: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder-slate-400 text-xs focus:outline-none focus:border-purple-400"
                  />
                </td>
                <td className="py-2 px-2 text-center">
                  <button
                    type="button"
                    onClick={() => updateItem(idx, { isTrue: true })}
                    className={`w-7 h-7 rounded-lg border inline-flex items-center justify-center transition-all cursor-pointer ${
                      item.isTrue
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-600 dark:text-emerald-300 font-bold'
                        : 'border-slate-200 dark:border-white/15 text-transparent hover:border-emerald-400/60'
                    }`}
                    title={`Chọn ${trueLabel}`}
                  >
                    <Check className="w-4 h-4" />
                  </button>
                </td>
                <td className="py-2 px-2 text-center">
                  <button
                    type="button"
                    onClick={() => updateItem(idx, { isTrue: false })}
                    className={`w-7 h-7 rounded-lg border inline-flex items-center justify-center transition-all cursor-pointer ${
                      !item.isTrue
                        ? 'bg-rose-500/20 border-rose-500 text-rose-600 dark:text-rose-300 font-bold'
                        : 'border-slate-200 dark:border-white/15 text-transparent hover:border-rose-400/60'
                    }`}
                    title={`Chọn ${falseLabel}`}
                  >
                    <Check className="w-4 h-4" />
                  </button>
                </td>
                <td className="py-2 px-2 text-center">
                  <button
                    type="button"
                    disabled={question.items.length <= 1}
                    onClick={() => removeItem(idx)}
                    className="p-1 rounded-lg text-rose-500 hover:bg-rose-500/10 disabled:opacity-25 disabled:pointer-events-none cursor-pointer"
                    title="Xóa ý này"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between gap-2 flex-wrap">
        <button
          type="button"
          onClick={addItem}
          className="px-3 py-1.5 rounded-xl border border-indigo-300 dark:border-purple-400/30 bg-indigo-50/70 dark:bg-purple-500/10 text-indigo-700 dark:text-purple-200 text-[11px] font-semibold hover:bg-indigo-100 dark:hover:bg-purple-500/20 inline-flex items-center gap-1 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>
            {showLetters
              ? `Thêm ý (${getItemLetter(question.items.length)}))`
              : 'Thêm ý con (sẽ đánh thứ tự a, b...)'}
          </span>
        </button>
        {!showLetters && (
          <span className="text-[11px] text-slate-500 dark:text-slate-400 italic">
            Chỉ có 1 ý con — hệ thống sẽ không đánh chữ cái a), b)...
          </span>
        )}
      </div>

      <textarea
        rows={2}
        placeholder="Giải thích đáp án (tùy chọn — nhấn Enter để xuống dòng)"
        value={question.explanation}
        onChange={(e) => onChange({ ...question, explanation: e.target.value })}
        className="w-full px-3 py-2 rounded-xl bg-white dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-xs focus:outline-none focus:border-purple-400"
      />
    </div>
  );
}

/**
 * Component con: Trình soạn thảo 1 câu Trắc nghiệm 4 lựa chọn (dùng chung cho MC và Reading)
 */
function McQuestionEditor({ question, label, onChange, onRemove }) {
  const updateOption = (optIdx, value) => {
    const nextOpts = [...question.options];
    nextOpts[optIdx] = value;
    onChange({ ...question, options: nextOpts });
  };

  return (
    <div className="p-4 rounded-2xl bg-slate-50/80 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 space-y-2.5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-indigo-600 dark:text-purple-300">{label}</span>
        {onRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="text-rose-500 hover:text-rose-400 text-xs flex items-center gap-1 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Xóa</span>
          </button>
        )}
      </div>

      <textarea
        rows={2}
        placeholder="Nội dung câu hỏi *"
        value={question.question}
        onChange={(e) => onChange({ ...question, question: e.target.value })}
        className="w-full px-3 py-2 rounded-xl bg-white dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-xs focus:outline-none focus:border-purple-400"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {question.options.map((opt, optIdx) => (
          <div key={optIdx} className="flex items-center gap-2">
            <input
              type="radio"
              name={`correct-${question.id}`}
              checked={question.correctIndex === optIdx}
              onChange={() => onChange({ ...question, correctIndex: optIdx })}
              title="Chọn làm đáp án đúng"
              className="accent-emerald-500 cursor-pointer shrink-0 w-4 h-4"
            />
            <input
              type="text"
              placeholder={`Đáp án ${'ABCD'[optIdx]} *`}
              value={opt}
              onChange={(e) => updateOption(optIdx, e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-white dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-xs focus:outline-none focus:border-purple-400"
            />
          </div>
        ))}
      </div>

      <textarea
        rows={2}
        placeholder="Giải thích đáp án (tùy chọn — nhấn Enter để xuống dòng)"
        value={question.explanation}
        onChange={(e) => onChange({ ...question, explanation: e.target.value })}
        className="w-full px-3 py-2 rounded-xl bg-white dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-xs focus:outline-none focus:border-purple-400"
      />
    </div>
  );
}

export default function QuizExamEditorModal({
  subject,
  category,
  editingExam = null,
  username = 'admin',
  onClose,
  onSaved,
}) {
  const isEnglish = isEnglishSubject(subject);
  const initialNormalized = editingExam ? normalizeExamData(editingExam) : null;

  const [createMethod, setCreateMethod] = useState('manual'); // 'manual' | 'ai'
  const [examTitle, setExamTitle] = useState(initialNormalized?.title || '');
  const [examDuration, setExamDuration] = useState(initialNormalized?.durationMinutes || 45);

  const [mcQuestions, setMcQuestions] = useState(
    initialNormalized ? initialNormalized.mcQuestions : [EMPTY_MC()]
  );
  const [tfQuestions, setTfQuestions] = useState(
    initialNormalized ? initialNormalized.tfQuestions : []
  );
  const [shortQuestions, setShortQuestions] = useState(
    initialNormalized ? initialNormalized.shortQuestions : []
  );
  const [readingPassages, setReadingPassages] = useState(
    initialNormalized ? initialNormalized.readingPassages : []
  );
  const [essayQuestions, setEssayQuestions] = useState(
    initialNormalized ? initialNormalized.essayQuestions : []
  );

  const [activeTab, setActiveTab] = useState('mc'); // 'mc' | 'tf' | 'short' | 'reading' | 'essay'

  // AI states
  const [docText, setDocText] = useState('');
  const [docFile, setDocFile] = useState(null);
  const [geminiApiKey, setGeminiApiKey] = useState('');
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [aiGeneratedNotice, setAiGeneratedNotice] = useState('');

  const [isSavingExam, setIsSavingExam] = useState(false);
  const [modalError, setModalError] = useState('');
  const editorSectionRef = useRef(null);

  const readingSubQuestionsCount = readingPassages.reduce(
    (sum, p) => sum + (p.questions?.length || 0),
    0
  );

  const sectionTabs = isEnglish
    ? [
        { id: 'mc', label: 'Trắc nghiệm 4 lựa chọn', icon: ListChecks, count: mcQuestions.length },
        { id: 'tf', label: 'Đúng / Sai (True/False)', icon: ToggleLeft, count: tfQuestions.length },
        {
          id: 'reading',
          label: 'Reading (Đọc hiểu)',
          icon: BookOpen,
          count: readingPassages.length,
          subLabel: readingSubQuestionsCount > 0 ? `${readingSubQuestionsCount} câu` : '',
        },
        { id: 'essay', label: 'Tự luận', icon: PenTool, count: essayQuestions.length },
      ]
    : [
        { id: 'mc', label: 'Trắc nghiệm 4 lựa chọn', icon: ListChecks, count: mcQuestions.length },
        { id: 'tf', label: 'Đúng / Sai', icon: ToggleLeft, count: tfQuestions.length },
        { id: 'short', label: 'Trả lời ngắn', icon: Hash, count: shortQuestions.length },
        { id: 'essay', label: 'Tự luận', icon: PenTool, count: essayQuestions.length },
      ];

  const handleDocumentFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setModalError('');

    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    const isPlainText = ['txt', 'md', 'csv', 'rtf'].includes(ext) || file.type.startsWith('text/');

    const reader = new FileReader();
    if (isPlainText) {
      reader.onload = (ev) => {
        setDocText(String(ev.target?.result || ''));
        setDocFile(null);
      };
      reader.readAsText(file, 'UTF-8');
    } else {
      reader.onload = (ev) => {
        const dataUrl = String(ev.target?.result || '');
        const base64 = dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl;
        const mimeMap = {
          pdf: 'application/pdf',
          doc: 'application/msword',
          docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        };
        setDocFile({
          name: file.name,
          mimeType: file.type || mimeMap[ext] || 'application/octet-stream',
          base64,
        });
      };
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  };

  const handleGenerateWithAI = async () => {
    setModalError('');
    setAiGeneratedNotice('');
    setIsGeneratingAI(true);
    try {
      const result = await generateExamFromDocument(
        {
          text: docText,
          fileData: docFile,
          subjectName: subject?.name || '',
          isEnglish,
        },
        geminiApiKey
      );

      setMcQuestions(result.mcQuestions || []);
      setTfQuestions(result.tfQuestions || []);
      setShortQuestions(isEnglish ? [] : result.shortQuestions || []);
      setReadingPassages(isEnglish ? result.readingPassages || [] : []);
      setEssayQuestions(result.essayQuestions || []);

      const partsSummary = [];
      if (result.mcQuestions?.length) partsSummary.push(`${result.mcQuestions.length} Trắc nghiệm`);
      if (result.tfQuestions?.length) partsSummary.push(`${result.tfQuestions.length} Đúng/Sai`);
      if (!isEnglish && result.shortQuestions?.length)
        partsSummary.push(`${result.shortQuestions.length} Trả lời ngắn`);
      if (isEnglish && result.readingPassages?.length)
        partsSummary.push(`${result.readingPassages.length} bài Reading`);
      if (result.essayQuestions?.length) partsSummary.push(`${result.essayQuestions.length} Tự luận`);

      // Chuyển tới tab đầu tiên có dữ liệu
      if (result.mcQuestions?.length) setActiveTab('mc');
      else if (result.tfQuestions?.length) setActiveTab('tf');
      else if (isEnglish && result.readingPassages?.length) setActiveTab('reading');
      else if (!isEnglish && result.shortQuestions?.length) setActiveTab('short');
      else if (result.essayQuestions?.length) setActiveTab('essay');

      setAiGeneratedNotice(
        `AI đã trích xuất: ${partsSummary.join(' • ')}. Hãy xem lại và chỉnh sửa kỹ từng phần bên dưới trước khi lưu lên hệ thống!`
      );

      setTimeout(() => {
        editorSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    } catch (err) {
      setModalError(err.message || 'Không thể tạo đề thi từ tài liệu.');
    } finally {
      setIsGeneratingAI(false);
    }
  };

  // Reading helpers
  const updateReadingPassage = (pIdx, patch) => {
    setReadingPassages((prev) => prev.map((p, i) => (i === pIdx ? { ...p, ...patch } : p)));
  };

  const addReadingSubQuestion = (pIdx, type) => {
    const newQ = type === 'tf' ? EMPTY_TF(1) : EMPTY_MC();
    setReadingPassages((prev) =>
      prev.map((p, i) => (i === pIdx ? { ...p, questions: [...p.questions, newQ] } : p))
    );
  };

  const updateReadingSubQuestion = (pIdx, qIdx, updatedQ) => {
    setReadingPassages((prev) =>
      prev.map((p, i) => {
        if (i !== pIdx) return p;
        return {
          ...p,
          questions: p.questions.map((q, j) => (j === qIdx ? updatedQ : q)),
        };
      })
    );
  };

  const removeReadingSubQuestion = (pIdx, qIdx) => {
    setReadingPassages((prev) =>
      prev.map((p, i) => {
        if (i !== pIdx) return p;
        return {
          ...p,
          questions: p.questions.filter((_, j) => j !== qIdx),
        };
      })
    );
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setModalError('');

    if (!examTitle.trim()) {
      setModalError('Vui lòng nhập tên đề thi.');
      return;
    }

    // Lọc và kiểm tra tính hợp lệ từng phần
    const validMc = mcQuestions.filter(
      (q) => q.question.trim() && q.options.every((o) => o.trim())
    );
    const validTf = tfQuestions
      .map((q) => ({
        ...q,
        items: (q.items || []).filter((it) => it.text.trim()),
      }))
      .filter((q) => q.items.length > 0);

    const validShort = [];
    if (!isEnglish) {
      for (let i = 0; i < shortQuestions.length; i++) {
        const sq = shortQuestions[i];
        if (!sq.question.trim() && !sq.correctAnswer.trim()) continue;
        if (!sq.question.trim()) {
          setModalError(`Câu Trả lời ngắn #${i + 1} chưa có nội dung câu hỏi.`);
          setActiveTab('short');
          return;
        }
        if (Number.isNaN(parseRealNumber(sq.correctAnswer))) {
          setModalError(
            `Đáp án câu Trả lời ngắn #${i + 1} phải là một số thực hợp lệ (VD: 12.5 hoặc -3,25).`
          );
          setActiveTab('short');
          return;
        }
        validShort.push(sq);
      }
    }

    const validReading = [];
    if (isEnglish) {
      for (let i = 0; i < readingPassages.length; i++) {
        const p = readingPassages[i];
        const cleanSubs = (p.questions || [])
          .map((q) => {
            if (q.type === 'tf') {
              const items = (q.items || []).filter((it) => it.text.trim());
              return items.length > 0 ? { ...q, items } : null;
            }
            return q.question.trim() && q.options.every((o) => o.trim()) ? q : null;
          })
          .filter(Boolean);

        if (!p.passage.trim() && cleanSubs.length === 0) continue;
        if (!p.passage.trim()) {
          setModalError(`Bài Reading #${i + 1} chưa có đoạn văn bài đọc.`);
          setActiveTab('reading');
          return;
        }
        if (cleanSubs.length === 0) {
          setModalError(
            `Bài Reading #${i + 1} cần ít nhất 1 câu hỏi Trắc nghiệm hoặc Đúng/Sai đầy đủ nội dung.`
          );
          setActiveTab('reading');
          return;
        }
        validReading.push({ ...p, questions: cleanSubs });
      }
    }

    const validEssay = essayQuestions.filter((q) => q.question.trim());

    const totalValid =
      validMc.length +
      validTf.length +
      validShort.length +
      validReading.reduce((s, p) => s + p.questions.length, 0) +
      validEssay.length;

    if (totalValid === 0) {
      setModalError('Vui lòng thêm ít nhất 1 câu hỏi đầy đủ nội dung trước khi lưu đề thi.');
      return;
    }

    setIsSavingExam(true);
    try {
      const saved = await saveExam({
        id: editingExam?.id || undefined,
        subjectId: subject.id,
        subjectName: subject.name,
        categoryId: category.id,
        categoryName: category.name,
        title: examTitle,
        durationMinutes: examDuration,
        mcQuestions: validMc,
        tfQuestions: validTf,
        shortQuestions: validShort,
        readingPassages: validReading,
        essayQuestions: validEssay,
        createdBy: editingExam?.createdBy || username,
        createdAt: editingExam?.createdAt || undefined,
      });
      onSaved(saved);
    } catch (err) {
      setModalError(err.message || 'Lỗi khi lưu đề thi.');
    } finally {
      setIsSavingExam(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/50 dark:bg-black/75 backdrop-blur-sm">
      <div className="w-full max-w-5xl max-h-[92vh] flex flex-col rounded-3xl bg-white dark:bg-[#111322] border border-slate-200 dark:border-white/15 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-white/10 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/15 dark:bg-purple-500/20 text-indigo-600 dark:text-purple-300">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white font-display">
                {editingExam ? 'Chỉnh Sửa Đề Thi' : 'Tạo / Up Đề Thi Mới'}
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {subject?.name} • {category?.name}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          {modalError && (
            <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-600 dark:text-rose-300 text-xs font-semibold">
              {modalError}
            </div>
          )}

          {/* Thông tin cơ bản */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Tên đề thi *
              </label>
              <input
                type="text"
                required
                placeholder="VD: Đề ôn thi số 1 - Chương 1 & 2"
                value={examTitle}
                onChange={(e) => setExamTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.05] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-xs focus:outline-none focus:border-purple-400"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Thời gian (phút) *
              </label>
              <input
                type="number"
                min={1}
                max={240}
                required
                value={examDuration}
                onChange={(e) => setExamDuration(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.05] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-purple-400"
              />
            </div>
          </div>

          {/* Chọn phương thức: Thủ công hoặc Tạo bằng AI */}
          <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-slate-100 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10">
            <button
              type="button"
              onClick={() => setCreateMethod('manual')}
              className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                createMethod === 'manual'
                  ? 'bg-indigo-600 dark:bg-purple-600 text-white shadow'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tạo Thủ Công</span>
            </button>
            <button
              type="button"
              onClick={() => setCreateMethod('ai')}
              className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                createMethod === 'ai'
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Wand2 className="w-3.5 h-3.5" />
              <span>Tạo Đề Bằng AI (Từ File / Tài Liệu)</span>
            </button>
          </div>

          {/* Khu vực tải file / dán nội dung cho AI */}
          {createMethod === 'ai' && (
            <div className="p-4 rounded-2xl bg-indigo-50/50 dark:bg-white/[0.03] border border-indigo-200 dark:border-purple-500/30 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span className="text-xs font-bold text-indigo-700 dark:text-purple-300 flex items-center gap-1.5">
                  <Wand2 className="w-3.5 h-3.5" />
                  Tải tệp đề thi / tài liệu (.pdf, .doc, .docx, .txt, .md) hoặc dán nội dung
                </span>
                <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-white/10 border border-indigo-200 dark:border-white/15 text-xs font-semibold text-indigo-700 dark:text-purple-200 hover:bg-indigo-50 dark:hover:bg-white/15 cursor-pointer self-start sm:self-auto">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Chọn Tệp Tài Liệu</span>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,.txt,.md,.csv,.rtf"
                    onChange={handleDocumentFileUpload}
                    className="hidden"
                  />
                </label>
              </div>

              {docFile && (
                <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-indigo-500/10 dark:bg-purple-500/15 border border-indigo-300 dark:border-purple-400/30 text-xs text-indigo-700 dark:text-purple-200">
                  <span className="truncate font-semibold">Đã chọn tệp: {docFile.name}</span>
                  <button
                    type="button"
                    onClick={() => setDocFile(null)}
                    className="p-1 rounded-lg hover:bg-indigo-500/20 cursor-pointer shrink-0"
                    title="Bỏ chọn tệp"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              <textarea
                rows={4}
                value={docText}
                onChange={(e) => setDocText(e.target.value)}
                placeholder={
                  isEnglish
                    ? 'Dán nội dung đề Tiếng Anh / tài liệu ôn tập (trắc nghiệm, True/False, bài Reading, tự luận)...'
                    : 'Dán nội dung đề thi / tài liệu bài học (trắc nghiệm 4 lựa chọn, đúng/sai, trả lời ngắn, tự luận)...'
                }
                className="w-full p-3 rounded-xl bg-white dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-xs focus:outline-none focus:border-purple-400"
              />

              {!import.meta.env.VITE_GEMINI_API_KEY && (
                <input
                  type="password"
                  value={geminiApiKey}
                  onChange={(e) => setGeminiApiKey(e.target.value)}
                  placeholder="Gemini API Key (tùy chọn — dùng để AI phân tích PDF/DOC/DOCX hoặc văn bản tự do)"
                  className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-xs focus:outline-none focus:border-purple-400"
                />
              )}

              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  Kết quả AI sẽ hiển thị ngay bên dưới để bạn kiểm tra & chỉnh sửa trước khi đăng.
                </span>
                <button
                  type="button"
                  onClick={handleGenerateWithAI}
                  disabled={isGeneratingAI || (!docText.trim() && !docFile)}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs font-bold flex items-center gap-1.5 disabled:opacity-50 cursor-pointer shadow-md shadow-indigo-500/20"
                >
                  {isGeneratingAI ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>AI đang tạo đề...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Phân Tích & Tạo Đề</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Khu vực xem lại & soạn thảo các phần */}
          <div ref={editorSectionRef} className="space-y-4 pt-1">
            {aiGeneratedNotice && (
              <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2">
                <CheckCircle className="w-4 h-4 shrink-0" />
                <span>{aiGeneratedNotice}</span>
              </div>
            )}

            {/* Tabs chuyển đổi các phần của đề thi */}
            <div className="flex items-center gap-2 flex-wrap border-b border-slate-200 dark:border-white/10 pb-3">
              {sectionTabs.map((tab) => {
                const TabIcon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 border transition-all cursor-pointer ${
                      isActive
                        ? 'bg-indigo-600 dark:bg-purple-600 text-white border-indigo-500 dark:border-purple-400 shadow-sm'
                        : 'bg-slate-50 dark:bg-white/[0.04] text-slate-600 dark:text-slate-300 border-slate-200 dark:border-white/10 hover:border-indigo-300 dark:hover:border-white/25'
                    }`}
                  >
                    <TabIcon className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                    <span
                      className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                        isActive
                          ? 'bg-white/20 text-white'
                          : 'bg-slate-200/80 dark:bg-white/10 text-slate-700 dark:text-slate-200'
                      }`}
                    >
                      {tab.count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* TAB 1: TRẮC NGHIỆM 4 LỰA CHỌN */}
            {activeTab === 'mc' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                    Phần Trắc Nghiệm 4 Lựa Chọn ({mcQuestions.length} câu)
                  </span>
                  <button
                    type="button"
                    onClick={() => setMcQuestions((prev) => [...prev, EMPTY_MC()])}
                    className="px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-purple-500/20 border border-indigo-200 dark:border-purple-400/30 text-xs font-semibold text-indigo-700 dark:text-purple-200 inline-flex items-center gap-1 cursor-pointer hover:bg-indigo-100 dark:hover:bg-purple-500/30"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Thêm câu Trắc nghiệm</span>
                  </button>
                </div>

                {mcQuestions.length === 0 ? (
                  <div className="p-6 rounded-2xl border border-dashed border-slate-300 dark:border-white/15 text-center text-xs text-slate-500 dark:text-slate-400">
                    Chưa có câu hỏi Trắc nghiệm 4 lựa chọn nào. Bấm &quot;Thêm câu Trắc nghiệm&quot; để bắt đầu.
                  </div>
                ) : (
                  mcQuestions.map((q, idx) => (
                    <McQuestionEditor
                      key={q.id}
                      question={q}
                      label={`Câu Trắc nghiệm #${idx + 1}`}
                      onChange={(updated) =>
                        setMcQuestions((prev) => prev.map((item, i) => (i === idx ? updated : item)))
                      }
                      onRemove={() => setMcQuestions((prev) => prev.filter((_, i) => i !== idx))}
                    />
                  ))
                )}
              </div>
            )}

            {/* TAB 2: ĐÚNG / SAI */}
            {activeTab === 'tf' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-cyan-600 dark:text-cyan-300 flex items-center gap-1.5">
                    <ToggleLeft className="w-4 h-4" />
                    <span>Phần Câu Hỏi Đúng / Sai ({tfQuestions.length} câu)</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setTfQuestions((prev) => [...prev, EMPTY_TF(4)])}
                    className="px-3 py-1.5 rounded-xl glass-button text-xs font-semibold text-cyan-700 dark:text-cyan-300 hover:text-indigo-700 dark:hover:text-white flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Thêm câu Đúng/Sai</span>
                  </button>
                </div>

                {tfQuestions.length === 0 ? (
                  <div className="p-4 rounded-2xl border border-dashed border-slate-300 dark:border-white/10 text-center text-xs text-slate-500 dark:text-slate-400">
                    Chưa có câu hỏi Đúng / Sai nào.
                  </div>
                ) : (
                  tfQuestions.map((q, idx) => (
                    <TrueFalseQuestionEditor
                      key={q.id}
                      question={q}
                      label={`Câu Đúng/Sai #${idx + 1}`}
                      isEnglish={isEnglish}
                      onChange={(updated) =>
                        setTfQuestions((prev) => prev.map((item, i) => (i === idx ? updated : item)))
                      }
                      onRemove={() => setTfQuestions((prev) => prev.filter((_, i) => i !== idx))}
                    />
                  ))
                )}
              </div>
            )}

            {/* TAB 3 (NON-ENGLISH): TRẢ LỜI NGẮN (SỐ THỰC) */}
            {!isEnglish && activeTab === 'short' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                      Phần Trả Lời Ngắn — Đáp Án Số Thực ({shortQuestions.length} câu)
                    </span>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Học sinh nhập kết quả dạng số thực (hỗ trợ dấu chấm hoặc dấu phẩy, VD: 12.5 hoặc -3,75).
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShortQuestions((prev) => [...prev, EMPTY_SHORT()])}
                    className="px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-purple-500/20 border border-indigo-200 dark:border-purple-400/30 text-xs font-semibold text-indigo-700 dark:text-purple-200 inline-flex items-center gap-1 cursor-pointer hover:bg-indigo-100 dark:hover:bg-purple-500/30"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Thêm câu Trả lời ngắn</span>
                  </button>
                </div>

                {shortQuestions.length === 0 ? (
                  <div className="p-6 rounded-2xl border border-dashed border-slate-300 dark:border-white/15 text-center text-xs text-slate-500 dark:text-slate-400">
                    Chưa có câu hỏi Trả lời ngắn nào. Bấm &quot;Thêm câu Trả lời ngắn&quot; để thêm.
                  </div>
                ) : (
                  shortQuestions.map((sq, idx) => (
                    <div
                      key={sq.id}
                      className="p-4 rounded-2xl bg-slate-50/80 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 space-y-2.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-indigo-600 dark:text-purple-300">
                          Câu Trả lời ngắn #{idx + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setShortQuestions((prev) => prev.filter((_, i) => i !== idx))
                          }
                          className="text-rose-500 hover:text-rose-400 text-xs flex items-center gap-1 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Xóa</span>
                        </button>
                      </div>

                      <textarea
                        rows={2}
                        placeholder="Nội dung câu hỏi *"
                        value={sq.question}
                        onChange={(e) =>
                          setShortQuestions((prev) =>
                            prev.map((item, i) =>
                              i === idx ? { ...item, question: e.target.value } : item
                            )
                          )
                        }
                        className="w-full px-3 py-2 rounded-xl bg-white dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder-slate-400 text-xs focus:outline-none focus:border-purple-400"
                      />

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <div>
                          <label className="block text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 mb-1">
                            Đáp án đúng (Số thực) *
                          </label>
                          <input
                            type="text"
                            inputMode="decimal"
                            placeholder="VD: 12.5 hoặc -3,75"
                            value={sq.correctAnswer}
                            onChange={(e) =>
                              setShortQuestions((prev) =>
                                prev.map((item, i) =>
                                  i === idx ? { ...item, correctAnswer: e.target.value } : item
                                )
                              )
                            }
                            className="w-full px-3 py-2 rounded-xl bg-white dark:bg-white/[0.04] border border-emerald-300 dark:border-emerald-500/40 text-slate-900 dark:text-white placeholder-slate-400 text-xs font-mono focus:outline-none focus:border-emerald-500"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                            Giải thích (tùy chọn)
                          </label>
                          <textarea
                            rows={2}
                            placeholder="Các bước tính ra kết quả (Enter để xuống dòng)..."
                            value={sq.explanation}
                            onChange={(e) =>
                              setShortQuestions((prev) =>
                                prev.map((item, i) =>
                                  i === idx ? { ...item, explanation: e.target.value } : item
                                )
                              )
                            }
                            className="w-full px-3 py-2 rounded-xl bg-white dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder-slate-400 text-xs focus:outline-none focus:border-purple-400"
                          />
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* TAB 3 (ENGLISH): READING (ĐỌC HIỂU) */}
            {isEnglish && activeTab === 'reading' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                      Phần Reading — Đọc Hiểu ({readingPassages.length} bài đọc • {readingSubQuestionsCount} câu hỏi)
                    </span>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Dán đoạn văn bài đọc, sau đó thêm câu hỏi Trắc nghiệm 4 lựa chọn hoặc Đúng/Sai (True/False) ở dưới. Khi học sinh làm bài, đoạn văn hiển thị bên trái và câu hỏi hiển thị bên phải.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setReadingPassages((prev) => [...prev, EMPTY_READING()])}
                    className="px-3 py-1.5 rounded-xl bg-amber-500/15 border border-amber-400/40 text-xs font-semibold text-amber-700 dark:text-amber-200 inline-flex items-center gap-1 cursor-pointer hover:bg-amber-500/25"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Thêm Bài Đọc (Reading)</span>
                  </button>
                </div>

                {readingPassages.length === 0 ? (
                  <div className="p-6 rounded-2xl border border-dashed border-slate-300 dark:border-white/15 text-center text-xs text-slate-500 dark:text-slate-400">
                    Chưa có bài đọc Reading nào. Bấm &quot;Thêm Bài Đọc (Reading)&quot; để dán đoạn văn và tạo câu hỏi.
                  </div>
                ) : (
                  readingPassages.map((passageObj, pIdx) => (
                    <div
                      key={passageObj.id}
                      className="p-4 sm:p-5 rounded-2xl bg-amber-50/40 dark:bg-amber-500/[0.04] border border-amber-300/60 dark:border-amber-400/25 space-y-4"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-extrabold text-amber-700 dark:text-amber-300 flex items-center gap-1.5">
                          <BookOpen className="w-4 h-4" />
                          <span>Bài Đọc Reading #{pIdx + 1}</span>
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setReadingPassages((prev) => prev.filter((_, i) => i !== pIdx))
                          }
                          className="text-rose-500 hover:text-rose-400 text-xs flex items-center gap-1 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Xóa bài đọc</span>
                        </button>
                      </div>

                      <input
                        type="text"
                        placeholder="Tiêu đề bài đọc (tùy chọn, VD: Reading Passage 1 - Climate Change)"
                        value={passageObj.title}
                        onChange={(e) => updateReadingPassage(pIdx, { title: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-white dark:bg-white/[0.05] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder-slate-400 text-xs font-semibold focus:outline-none focus:border-amber-400"
                      />

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          Đoạn văn bài đọc (Reading Passage) *
                        </label>
                        <textarea
                          rows={6}
                          placeholder="Dán toàn bộ nội dung đoạn văn tiếng Anh vào đây..."
                          value={passageObj.passage}
                          onChange={(e) => updateReadingPassage(pIdx, { passage: e.target.value })}
                          className="w-full p-3 rounded-xl bg-white dark:bg-white/[0.05] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder-slate-400 text-xs leading-relaxed focus:outline-none focus:border-amber-400"
                        />
                      </div>

                      {/* Danh sách câu hỏi thuộc bài đọc */}
                      <div className="space-y-3 pt-2 border-t border-amber-300/40 dark:border-white/10">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                            Câu hỏi của bài đọc #{pIdx + 1} ({passageObj.questions.length} câu)
                          </span>
                          <div className="flex items-center gap-2 flex-wrap">
                            <button
                              type="button"
                              onClick={() => addReadingSubQuestion(pIdx, 'mc')}
                              className="px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-purple-500/20 border border-indigo-200 dark:border-purple-400/30 text-[11px] font-semibold text-indigo-700 dark:text-purple-200 inline-flex items-center gap-1 cursor-pointer hover:bg-indigo-100"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>+ Trắc nghiệm 4 lựa chọn</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => addReadingSubQuestion(pIdx, 'tf')}
                              className="px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-500/20 border border-emerald-200 dark:border-emerald-400/30 text-[11px] font-semibold text-emerald-700 dark:text-emerald-200 inline-flex items-center gap-1 cursor-pointer hover:bg-emerald-100"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>+ Đúng / Sai (True/False)</span>
                            </button>
                          </div>
                        </div>

                        {passageObj.questions.length === 0 ? (
                          <div className="p-4 rounded-xl border border-dashed border-slate-300 dark:border-white/15 text-center text-xs text-slate-500 dark:text-slate-400">
                            Thêm ít nhất 1 câu hỏi Trắc nghiệm hoặc True/False cho bài đọc này.
                          </div>
                        ) : (
                          passageObj.questions.map((subQ, qIdx) =>
                            subQ.type === 'tf' ? (
                              <TrueFalseQuestionEditor
                                key={subQ.id}
                                question={subQ}
                                label={`Reading #${pIdx + 1} — Câu ${qIdx + 1} (True/False)`}
                                isEnglish={true}
                                onChange={(updated) => updateReadingSubQuestion(pIdx, qIdx, updated)}
                                onRemove={() => removeReadingSubQuestion(pIdx, qIdx)}
                              />
                            ) : (
                              <McQuestionEditor
                                key={subQ.id}
                                question={subQ}
                                label={`Reading #${pIdx + 1} — Câu ${qIdx + 1} (Trắc nghiệm 4 lựa chọn)`}
                                onChange={(updated) => updateReadingSubQuestion(pIdx, qIdx, updated)}
                                onRemove={() => removeReadingSubQuestion(pIdx, qIdx)}
                              />
                            )
                          )
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* TAB 4: TỰ LUẬN (KHÔNG CHẤM ĐIỂM) */}
            {activeTab === 'essay' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                      Phần Tự Luận ({essayQuestions.length} câu — Không chấm điểm)
                    </span>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Học sinh chỉ xem đề bài tự luận (không tính vào điểm tự động) và xem Phương pháp giải / Hướng giải quyết sau khi nộp bài.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEssayQuestions((prev) => [...prev, EMPTY_ESSAY()])}
                    className="px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-purple-500/20 border border-indigo-200 dark:border-purple-400/30 text-xs font-semibold text-indigo-700 dark:text-purple-200 inline-flex items-center gap-1 cursor-pointer hover:bg-indigo-100 dark:hover:bg-purple-500/30"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Thêm câu Tự luận</span>
                  </button>
                </div>

                {essayQuestions.length === 0 ? (
                  <div className="p-6 rounded-2xl border border-dashed border-slate-300 dark:border-white/15 text-center text-xs text-slate-500 dark:text-slate-400">
                    Chưa có câu hỏi Tự luận nào. Bấm &quot;Thêm câu Tự luận&quot; để thêm đề bài và phương pháp giải.
                  </div>
                ) : (
                  essayQuestions.map((eq, idx) => (
                    <div
                      key={eq.id}
                      className="p-4 rounded-2xl bg-slate-50/80 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 space-y-2.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-indigo-600 dark:text-purple-300">
                          Câu Tự luận #{idx + 1} (Không chấm điểm)
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setEssayQuestions((prev) => prev.filter((_, i) => i !== idx))
                          }
                          className="text-rose-500 hover:text-rose-400 text-xs flex items-center gap-1 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Xóa</span>
                        </button>
                      </div>

                      <textarea
                        rows={3}
                        placeholder="Nội dung câu hỏi tự luận *"
                        value={eq.question}
                        onChange={(e) =>
                          setEssayQuestions((prev) =>
                            prev.map((item, i) =>
                              i === idx ? { ...item, question: e.target.value } : item
                            )
                          )
                        }
                        className="w-full px-3 py-2 rounded-xl bg-white dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder-slate-400 text-xs focus:outline-none focus:border-purple-400"
                      />

                      <div>
                        <label className="block text-[11px] font-semibold text-amber-700 dark:text-amber-300 mb-1">
                          Phương pháp giải / Hướng giải quyết
                        </label>
                        <textarea
                          rows={4}
                          placeholder="Nhập hướng dẫn giải, các bước làm hoặc dàn ý gợi ý (nhấn Enter để xuống dòng)..."
                          value={eq.solutionGuide}
                          onChange={(e) =>
                            setEssayQuestions((prev) =>
                              prev.map((item, i) =>
                                i === idx ? { ...item, solutionGuide: e.target.value } : item
                              )
                            )
                          }
                          className="w-full px-3 py-2 rounded-xl bg-white dark:bg-white/[0.04] border border-amber-300/60 dark:border-amber-400/30 text-slate-900 dark:text-white placeholder-slate-400 text-xs focus:outline-none focus:border-amber-400"
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-slate-200 dark:border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl glass-button text-xs font-semibold text-slate-600 dark:text-slate-300 cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSavingExam}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-emerald-500/25 disabled:opacity-50 cursor-pointer"
            >
              {isSavingExam ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Save className="w-3.5 h-3.5" />
              )}
              <span>{editingExam ? 'Cập Nhật Đề Thi' : 'Lưu & Tạo Đề Thi'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
