import React, { useState, useEffect } from 'react';
import {
  Plus,
  Clock,
  Trash2,
  Edit2,
  X,
  Check,
  Save,
  Loader2
} from 'lucide-react';
import { fetchUserTimetable, saveUserTimetable } from '../../services/timetableService';
import { getSessionUser } from '../../services/authService';

// Default Days of Week (Monday to Sunday)
const DAYS_OF_WEEK = [
  { index: 1, label: 'Thứ Hai', short: 'T2' },
  { index: 2, label: 'Thứ Ba', short: 'T3' },
  { index: 3, label: 'Thứ Tư', short: 'T4' },
  { index: 4, label: 'Thứ Năm', short: 'T5' },
  { index: 5, label: 'Thứ Sáu', short: 'T6' },
  { index: 6, label: 'Thứ Bảy', short: 'T7' },
  { index: 0, label: 'Chủ Nhật', short: 'CN' },
];

// Color Palettes for Subjects
const COLOR_THEMES = [
  { id: 'purple', name: 'Màu Tím', bg: 'bg-purple-500/20', border: 'border-purple-500/40', text: 'text-purple-200', glow: 'shadow-purple-500/20' },
  { id: 'cyan', name: 'Xanh Lam', bg: 'bg-cyan-500/20', border: 'border-cyan-500/40', text: 'text-cyan-200', glow: 'shadow-cyan-500/20' },
  { id: 'emerald', name: 'Xanh Lá', bg: 'bg-emerald-500/20', border: 'border-emerald-500/40', text: 'text-emerald-200', glow: 'shadow-emerald-500/20' },
  { id: 'amber', name: 'Màu Vàng', bg: 'bg-amber-500/20', border: 'border-amber-500/40', text: 'text-amber-200', glow: 'shadow-amber-500/20' },
  { id: 'rose', name: 'Màu Hồng', bg: 'bg-rose-500/20', border: 'border-rose-500/40', text: 'text-rose-200', glow: 'shadow-rose-500/20' },
  { id: 'blue', name: 'Xanh Dương', bg: 'bg-blue-500/20', border: 'border-blue-500/40', text: 'text-blue-200', glow: 'shadow-blue-500/20' },
];

// Default Time Slots (Can be edited, deleted, or added by the user) - Không phân loại buổi
const DEFAULT_TIME_SLOTS = [
  { id: 'slot-1', name: 'Tiết 1', startTime: '07:15', endTime: '08:00' },
  { id: 'slot-2', name: 'Tiết 2', startTime: '08:05', endTime: '08:50' },
  { id: 'slot-3', name: 'Tiết 3', startTime: '09:05', endTime: '09:50' },
  { id: 'slot-4', name: 'Tiết 4', startTime: '09:55', endTime: '10:40' },
  { id: 'slot-5', name: 'Tiết 5', startTime: '10:45', endTime: '11:30' },
  { id: 'slot-6', name: 'Tiết 6', startTime: '13:30', endTime: '14:15' },
  { id: 'slot-7', name: 'Tiết 7', startTime: '14:20', endTime: '15:05' },
  { id: 'slot-8', name: 'Tiết 8', startTime: '15:20', endTime: '16:05' },
  { id: 'slot-9', name: 'Ca Tối', startTime: '19:30', endTime: '21:30' },
];

// Hàm hỗ trợ nhập thời gian 24 giờ (HH:mm) không có AM/PM
const format24hTime = (val) => {
  const digits = val.replace(/\D/g, '').slice(0, 4);
  if (!digits) return '';
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}:${digits.slice(2)}`;
};

// Chuẩn hóa định dạng thời gian 24 giờ khi người dùng rời khỏi ô nhập (onBlur)
const handleTimeBlur = (val, setter, fallback = '07:00') => {
  if (!val || !val.trim()) {
    setter(fallback);
    return;
  }
  const digits = val.replace(/\D/g, '');
  if (!digits) {
    setter(fallback);
    return;
  }
  let h = 0;
  let m = 0;
  if (digits.length === 1 || digits.length === 2) {
    h = parseInt(digits, 10);
    m = 0;
  } else if (digits.length === 3) {
    h = parseInt(digits.slice(0, 2), 10);
    m = parseInt(digits.slice(2) + '0', 10);
  } else {
    h = parseInt(digits.slice(0, 2), 10);
    m = parseInt(digits.slice(2, 4), 10);
  }

  // Giới hạn 24 giờ (00..23) và phút (00..59)
  h = Math.min(23, Math.max(0, isNaN(h) ? 0 : h));
  m = Math.min(59, Math.max(0, isNaN(m) ? 0 : m));

  const paddedH = String(h).padStart(2, '0');
  const paddedM = String(m).padStart(2, '0');
  setter(`${paddedH}:${paddedM}`);
};

export default function TimetableView({ currentUser: propsUser }) {
  const sessionUser = getSessionUser();
  const currentUser = propsUser || sessionUser;
  const username = currentUser?.username || 'admin';

  // Trạng thái thay đổi: Mặc định là false (nút Lưu sẽ mờ)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [, setSaveStatus] = useState(null); // null | 'success' | 'error'
  const [, setIsLoadingFromFirebase] = useState(false);

  // State for Time Slots
  const [timeSlots, setTimeSlots] = useState(() => {
    const saved = localStorage.getItem(`lumina_time_slots_${username}`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed.map((s) => ({
          ...s,
          name: s.name.replace(' (Chiều)', '').replace(': Tự Học & Luyện Đề', '')
        }));
      } catch {
        return DEFAULT_TIME_SLOTS;
      }
    }
    return DEFAULT_TIME_SLOTS;
  });

  // State for Schedule entries in grid (mỗi tài khoản mới bắt đầu với thời khóa biểu rỗng)
  const [scheduleEntries, setScheduleEntries] = useState(() => {
    const saved = localStorage.getItem(`lumina_schedule_entries_${username}`);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return [];
      }
    }
    return [];
  });

  // Modal State: Add / Edit Time Slot
  const [isSlotModalOpen, setIsSlotModalOpen] = useState(false);
  const [editingSlot, setEditingSlot] = useState(null);
  const [slotName, setSlotName] = useState('');
  const [slotStartTime, setSlotStartTime] = useState('07:15');
  const [slotEndTime, setSlotEndTime] = useState('08:00');

  // Modal State: Cell Editor (Add or Edit Class in cell)
  const [isCellModalOpen, setIsCellModalOpen] = useState(false);
  const [selectedCell, setSelectedCell] = useState(null); // { slotId, dayIndex, existingEntry }
  const [cellSubject, setCellSubject] = useState('');
  const [cellColor, setCellColor] = useState('purple');
  const [cellNotes, setCellNotes] = useState('');

  // Tải dữ liệu thời khóa biểu cá nhân của người dùng từ Firebase Firestore khi mở trang
  useEffect(() => {
    let isCancelled = false;

    async function loadData() {
      if (!username) return;
      setIsLoadingFromFirebase(true);
      try {
        const data = await fetchUserTimetable(username);
        if (!isCancelled) {
          if (data) {
            if (Array.isArray(data.timeSlots) && data.timeSlots.length > 0) {
              setTimeSlots(data.timeSlots);
            } else {
              setTimeSlots(DEFAULT_TIME_SLOTS);
            }
            setScheduleEntries(Array.isArray(data.scheduleEntries) ? data.scheduleEntries : []);
          } else {
            setTimeSlots(DEFAULT_TIME_SLOTS);
            setScheduleEntries([]);
          }
        }
      } catch (err) {
        console.error('Lỗi khi tải thời khóa biểu từ Firebase:', err);
      } finally {
        if (!isCancelled) {
          setIsLoadingFromFirebase(false);
          setHasUnsavedChanges(false);
        }
      }
    }

    loadData();

    return () => {
      isCancelled = true;
    };
  }, [username]);

  // Lưu bản sao vào localStorage theo user khi có thay đổi
  useEffect(() => {
    localStorage.setItem(`lumina_time_slots_${username}`, JSON.stringify(timeSlots));
  }, [timeSlots, username]);

  useEffect(() => {
    localStorage.setItem(`lumina_schedule_entries_${username}`, JSON.stringify(scheduleEntries));
  }, [scheduleEntries, username]);

  // Open modal to add a brand new time slot
  const handleOpenAddSlot = () => {
    setEditingSlot(null);
    let nextNum = 1;
    timeSlots.forEach((s) => {
      const m = s.name.trim().match(/^Tiết\s*(\d+)/i);
      if (m) {
        const val = parseInt(m[1], 10);
        if (val >= nextNum) nextNum = val + 1;
      }
    });
    setSlotName(`Tiết ${nextNum}`);
    setSlotStartTime('16:15');
    setSlotEndTime('17:00');
    setIsSlotModalOpen(true);
  };

  // Open modal to edit existing time slot
  const handleOpenEditSlot = (slot) => {
    setEditingSlot(slot);
    setSlotName(slot.name);
    setSlotStartTime(slot.startTime);
    setSlotEndTime(slot.endTime);
    setIsSlotModalOpen(true);
  };

  // Submit Time Slot (Add or Update)
  const handleSaveSlot = (e) => {
    e.preventDefault();
    if (!slotName.trim()) return;

    if (editingSlot) {
      // Update
      setTimeSlots(
        timeSlots.map((s) =>
          s.id === editingSlot.id
            ? { ...s, name: slotName, startTime: slotStartTime, endTime: slotEndTime }
            : s
        )
      );
    } else {
      // Add new
      const newSlot = {
        id: `slot-${Date.now()}`,
        name: slotName,
        startTime: slotStartTime,
        endTime: slotEndTime,
      };
      setTimeSlots([...timeSlots, newSlot]);
    }

    setHasUnsavedChanges(true);
    setIsSlotModalOpen(false);
  };

  // Delete Time Slot - Tự động sửa lại số thứ tự tiết học cho đúng thứ tự
  const handleDeleteSlot = (slotId) => {
    if (confirm('Bạn có chắc chắn muốn xóa khung thời gian này và toàn bộ các tiết học trong đó?')) {
      const remainingSlots = timeSlots.filter((s) => s.id !== slotId);

      // Đánh số lại các tiết học liên tiếp (Tiết 1, Tiết 2, Tiết 3...)
      let periodCounter = 1;
      const renumberedSlots = remainingSlots.map((s) => {
        const trimmed = s.name.trim();
        if (/^Tiết(\s*\d+)?/i.test(trimmed)) {
          const newName = trimmed.replace(/^Tiết(\s*\d+)?/i, `Tiết ${periodCounter}`);
          periodCounter++;
          return { ...s, name: newName };
        }
        return s;
      });

      setTimeSlots(renumberedSlots);
      setScheduleEntries(scheduleEntries.filter((e) => e.slotId !== slotId));
      setHasUnsavedChanges(true);
    }
  };

  // Open Cell Editor
  const handleCellClick = (slotId, dayIndex) => {
    const existing = scheduleEntries.find(
      (e) => e.slotId === slotId && e.dayIndex === dayIndex
    );

    setSelectedCell({ slotId, dayIndex, existingEntry: existing });

    if (existing) {
      setCellSubject(existing.subject);
      setCellColor(existing.color || 'purple');
      setCellNotes(existing.notes || '');
    } else {
      setCellSubject('');
      setCellColor('purple');
      setCellNotes('');
    }

    setIsCellModalOpen(true);
  };

  // Save Cell
  const handleSaveCell = (e) => {
    e.preventDefault();
    if (!cellSubject.trim() || !selectedCell) return;

    const { slotId, dayIndex, existingEntry } = selectedCell;

    if (existingEntry) {
      // Update existing
      setScheduleEntries(
        scheduleEntries.map((item) =>
          item.id === existingEntry.id
            ? {
                ...item,
                subject: cellSubject,
                color: cellColor,
                notes: cellNotes,
              }
            : item
        )
      );
    } else {
      // Insert new
      const newEntry = {
        id: `entry-${Date.now()}`,
        slotId,
        dayIndex,
        subject: cellSubject,
        color: cellColor,
        notes: cellNotes,
      };
      setScheduleEntries([...scheduleEntries, newEntry]);
    }

    setHasUnsavedChanges(true);
    setIsCellModalOpen(false);
  };

  // Delete class from cell
  const handleDeleteCellEntry = () => {
    if (selectedCell?.existingEntry) {
      setScheduleEntries(
        scheduleEntries.filter((item) => item.id !== selectedCell.existingEntry.id)
      );
      setHasUnsavedChanges(true);
      setIsCellModalOpen(false);
    }
  };

  // Lưu toàn bộ thời khóa biểu lên Firebase cho tài khoản hiện tại
  const handleSaveTimetable = async () => {
    if (!hasUnsavedChanges || isSaving) return;
    setIsSaving(true);
    setSaveStatus(null);
    try {
      await saveUserTimetable(username, {
        timeSlots,
        scheduleEntries
      });
      // Chỉ làm mờ nút lưu theo đúng yêu cầu (không hiện thông báo che/đẩy giao diện)
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error('Lỗi lưu thời khóa biểu lên Firebase:', error);
      setSaveStatus('error');
      setTimeout(() => {
        setSaveStatus(null);
      }, 4000);
    } finally {
      setIsSaving(false);
    }
  };

  // Helper to get color object
  const getColorObj = (colorId) => {
    return COLOR_THEMES.find((c) => c.id === colorId) || COLOR_THEMES[0];
  };

  return (
    <div className="space-y-5 pb-12">
      {/* 1. Header & Controls - Đổi tên thành "Thời khóa biểu cá nhân" và tích hợp nút Lưu Firebase */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-display tracking-tight text-white">
            Thời khóa biểu cá nhân
          </h1>
        </div>

        {/* Action Controls: Nút Lưu thời khóa biểu (Firebase) & Thêm Khung Giờ Mới */}
        <div className="flex items-center gap-2.5 shrink-0">
          {/* Nút "Lưu thời khóa biểu": Mặc định mờ, khi có thay đổi thì sáng lên */}
          <button
            onClick={handleSaveTimetable}
            disabled={!hasUnsavedChanges || isSaving}
            title={
              hasUnsavedChanges
                ? `Lưu thời khóa biểu lên Firebase cho tài khoản @${username}`
                : 'Mặc định mờ. Nút sẽ sáng lên khi bạn thêm mới, sửa, xóa khung giờ hoặc môn học'
            }
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all duration-300 ${
              hasUnsavedChanges
                ? 'bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 text-white shadow-lg shadow-emerald-600/35 hover:scale-[1.02] active:scale-[0.98] cursor-pointer border border-emerald-400/50 ring-2 ring-emerald-400/25'
                : 'border border-white/10 bg-white/[0.04] text-slate-400 opacity-40 cursor-not-allowed shadow-none'
            } ${isSaving ? 'cursor-wait opacity-85' : ''}`}
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>Đang lưu...</span>
              </>
            ) : (
              <>
                <Save className={`w-4 h-4 ${hasUnsavedChanges ? 'text-white' : 'text-slate-400'}`} />
                <span>Lưu thời khóa biểu</span>
              </>
            )}
          </button>

          {/* Add Time Slot Button */}
          <button
            onClick={handleOpenAddSlot}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-500 text-white text-xs sm:text-sm font-bold shadow-lg shadow-purple-600/30 hover:scale-[1.02] transition-all shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm Khung Giờ Mới</span>
          </button>
        </div>
      </div>

      {/* 2. THE GRAND TIMETABLE MATRIX TABLE */}
      <div className="rounded-2xl glass-card border border-white/15 overflow-hidden shadow-2xl relative">
        <div className="overflow-x-auto scrollbar-none">
          <table className="w-full border-collapse text-left min-w-[720px] table-fixed">
            {/* Table Header: Days of Week */}
            <thead>
              <tr className="border-b border-white/15 bg-white/[0.04]">
                {/* Column 0: Time Frame header - Gọn chiều ngang & chuẩn UI */}
                <th className="py-2.5 px-2 w-[105px] whitespace-nowrap font-display font-bold text-xs uppercase tracking-wider text-slate-300 sticky left-0 z-20 bg-[#0e101c]/95 backdrop-blur-md border-r border-white/10 text-center">
                  <div className="flex items-center justify-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                    <span>Khung Giờ</span>
                  </div>
                </th>

                {/* Days 1 to 7 - Căn chỉnh đồng đều, gọn gàng, chuẩn UI */}
                {DAYS_OF_WEEK.map((day) => (
                  <th
                    key={day.index}
                    className="py-2.5 px-2 font-display font-bold text-xs sm:text-sm text-white border-r border-white/10 last:border-r-0 text-center"
                  >
                    <span className="tracking-wide">{day.label}</span>
                  </th>
                ))}
              </tr>
            </thead>

            {/* Table Body: Time Slot Rows */}
            <tbody className="divide-y divide-white/10">
              {timeSlots.map((slot) => {
                return (
                  <tr
                    key={slot.id}
                    className="group/row hover:bg-white/[0.02] transition-colors"
                  >
                    {/* Sticky Left Column: Time Slot Info & Edit Controls - Gọn gàng */}
                    <td className="py-1.5 px-2 w-[105px] whitespace-nowrap sticky left-0 z-10 bg-[#0c0d18]/95 backdrop-blur-md border-r border-white/10">
                      <div className="flex items-center justify-between gap-1">
                        <div className="min-w-0">
                          <span className="font-display font-bold text-xs text-white block truncate leading-tight">
                            {slot.name}
                          </span>
                          <span className="text-[10px] font-mono text-purple-300 block leading-tight mt-0.5">
                            {slot.startTime} - {slot.endTime}
                          </span>
                        </div>

                        {/* Slot Action buttons (appear on hover) */}
                        <div className="flex items-center gap-0.5 opacity-0 group-hover/row:opacity-100 transition-opacity shrink-0">
                          <button
                            onClick={() => handleOpenEditSlot(slot)}
                            className="p-1 rounded text-slate-400 hover:text-purple-300 hover:bg-white/[0.08] cursor-pointer"
                            title="Chỉnh sửa khung giờ này"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => handleDeleteSlot(slot.id)}
                            className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-white/[0.08] cursor-pointer"
                            title="Xóa khung giờ này"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </td>

                    {/* Cells for each Day */}
                    {DAYS_OF_WEEK.map((day) => {
                      const entry = scheduleEntries.find(
                        (e) => e.slotId === slot.id && e.dayIndex === day.index
                      );
                      const theme = entry ? getColorObj(entry.color) : null;

                      return (
                        <td
                          key={day.index}
                          onClick={() => handleCellClick(slot.id, day.index)}
                          className="p-1 border-r border-white/10 last:border-r-0 align-middle cursor-pointer transition-all hover:bg-white/[0.03] group/cell relative"
                        >
                          {entry ? (
                            /* Filled Class Cell: Gọn gàng, chữ vừa vặn, không chiếm quá nhiều diện tích */
                            <div
                              title={entry.notes ? `${entry.subject} (${entry.notes})` : entry.subject}
                              className={`w-full min-h-[42px] rounded-xl px-2 py-1 border transition-all duration-200 flex flex-col items-center justify-center text-center overflow-hidden ${theme.bg} ${theme.border} ${theme.glow} shadow-sm group-hover/cell:scale-[1.01]`}
                            >
                              <span className={`text-xs font-bold font-display line-clamp-1 leading-snug text-center ${theme.text}`}>
                                {entry.subject}
                              </span>
                              {entry.notes && (
                                <span className="text-[9.5px] font-medium text-slate-200/90 truncate max-w-full block leading-none mt-0.5 px-1.5 py-0.5 rounded bg-black/20 dark:bg-white/10">
                                  {entry.notes}
                                </span>
                              )}
                            </div>
                          ) : (
                            /* Empty Cell: Gọn gàng với biểu tượng nhẹ khi hover */
                            <div className="w-full h-[42px] rounded-xl border border-dashed border-white/10 group-hover/cell:border-purple-400/40 group-hover/cell:bg-purple-500/[0.05] transition-all flex items-center justify-center text-slate-500 group-hover/cell:text-purple-300">
                              <Plus className="w-3.5 h-3.5 opacity-0 group-hover/cell:opacity-100 transition-opacity" />
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Empty state if user deleted all slots */}
        {timeSlots.length === 0 && (
          <div className="p-12 text-center text-slate-400">
            <Clock className="w-10 h-10 text-slate-500 mx-auto mb-2" />
            <p className="text-sm font-semibold">Chưa có khung giờ nào trong thời khóa biểu</p>
            <button
              onClick={handleOpenAddSlot}
              className="mt-3 px-4 py-2 rounded-xl bg-purple-600/30 text-purple-200 text-xs font-bold border border-purple-400/40"
            >
              + Thêm Khung Giờ Mới
            </button>
          </div>
        )}
      </div>

      {/* 3. MODAL: ADD / EDIT TIME SLOT (Khung Thời Gian) */}
      {isSlotModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
          <div className="w-full max-w-md rounded-3xl glass-card p-6 border border-white/20 shadow-2xl relative">
            <button
              onClick={() => setIsSlotModalOpen(false)}
              className="absolute top-5 right-5 p-1 rounded-xl text-slate-400 hover:text-white glass-button"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-lg font-bold font-display text-white mb-1">
              {editingSlot ? 'Chỉnh Sửa Khung Giờ' : 'Thêm Khung Giờ Mới'}
            </h3>
            <p className="text-xs text-slate-400 mb-5">
              Cài đặt tên và khoảng thời gian cho tiết học theo thời gian biểu của bạn
            </p>

            <form onSubmit={handleSaveSlot} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Tên Khung Giờ (Ví dụ: Tiết 1, Tiết 6, Ca Tối...) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Tiết 1 / Ca Học Thêm / Tự Học"
                  value={slotName}
                  onChange={(e) => setSlotName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.05] border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-purple-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Giờ Bắt Đầu (24h) *
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      placeholder="07:15"
                      maxLength={5}
                      value={slotStartTime}
                      onChange={(e) => setSlotStartTime(format24hTime(e.target.value))}
                      onBlur={() => handleTimeBlur(slotStartTime, setSlotStartTime, '07:00')}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.05] border border-white/10 text-white placeholder-slate-500 text-xs font-mono focus:outline-none focus:border-purple-400"
                    />
                    <Clock className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono mt-1 block">
                    Định dạng 24h (VD: 07:15, 13:30)
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Giờ Kết Thúc (24h) *
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      placeholder="08:00"
                      maxLength={5}
                      value={slotEndTime}
                      onChange={(e) => setSlotEndTime(format24hTime(e.target.value))}
                      onBlur={() => handleTimeBlur(slotEndTime, setSlotEndTime, '08:00')}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.05] border border-white/10 text-white placeholder-slate-500 text-xs font-mono focus:outline-none focus:border-purple-400"
                    />
                    <Clock className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono mt-1 block">
                    Định dạng 24h (VD: 08:00, 17:00)
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsSlotModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl glass-button text-xs font-semibold text-slate-300 hover:text-white"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-xs font-bold shadow-lg shadow-purple-600/30 hover:scale-[1.02] transition-all"
                >
                  {editingSlot ? 'Lưu Thay Đổi' : 'Tạo Khung Giờ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. MODAL: EDIT / ADD CLASS CELL (Xếp Môn Học Vào Ô) */}
      {isCellModalOpen && selectedCell && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
          <div className="w-full max-w-md rounded-3xl glass-card p-6 border border-white/20 shadow-2xl relative">
            <button
              onClick={() => setIsCellModalOpen(false)}
              className="absolute top-5 right-5 p-1 rounded-xl text-slate-400 hover:text-white glass-button"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-purple-500/20 text-purple-300 border border-purple-400/30">
                {DAYS_OF_WEEK.find((d) => d.index === selectedCell.dayIndex)?.label}
              </span>
              <span className="text-xs text-slate-400 font-mono">
                {timeSlots.find((s) => s.id === selectedCell.slotId)?.name} (
                {timeSlots.find((s) => s.id === selectedCell.slotId)?.startTime} -{' '}
                {timeSlots.find((s) => s.id === selectedCell.slotId)?.endTime})
              </span>
            </div>

            <h3 className="text-lg font-bold font-display text-white mb-4">
              {selectedCell.existingEntry ? 'Chỉnh Sửa Môn Học' : 'Xếp Môn Học Vào Tiết Này'}
            </h3>

            <form onSubmit={handleSaveCell} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Tên Môn Học *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Toán Học / Vật Lý / Tiếng Anh..."
                  value={cellSubject}
                  onChange={(e) => setCellSubject(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.05] border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-purple-400"
                />
              </div>

              {/* Color Theme Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Màu Sắc Đánh Dấu Môn Học
                </label>
                <div className="grid grid-cols-6 gap-2">
                  {COLOR_THEMES.map((theme) => (
                    <button
                      key={theme.id}
                      type="button"
                      onClick={() => setCellColor(theme.id)}
                      className={`h-9 rounded-xl border flex items-center justify-center transition-all ${theme.bg} ${theme.border} ${
                        cellColor === theme.id ? 'ring-2 ring-white scale-105 shadow-lg' : 'opacity-70 hover:opacity-100'
                      }`}
                      title={theme.name}
                    >
                      {cellColor === theme.id && <Check className="w-4 h-4 text-white" />}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Ghi Chú Tiết Học (Tùy Chọn)
                </label>
                <input
                  type="text"
                  placeholder="Kiểm tra 15p, chuẩn bị bài thực hành..."
                  value={cellNotes}
                  onChange={(e) => setCellNotes(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.05] border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-purple-400"
                />
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-white/10">
                {selectedCell.existingEntry ? (
                  <button
                    type="button"
                    onClick={handleDeleteCellEntry}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-rose-400 hover:bg-rose-500/10 text-xs font-semibold transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Xóa Môn Này</span>
                  </button>
                ) : (
                  <div />
                )}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsCellModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl glass-button text-xs font-semibold text-slate-300 hover:text-white"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-xs font-bold shadow-lg shadow-purple-600/30 hover:scale-[1.02] transition-all"
                  >
                    Lưu Tiết Học
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
