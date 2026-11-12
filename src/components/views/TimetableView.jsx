import React, { useState, useEffect } from 'react';
import {
  CalendarDays,
  Plus,
  Clock,
  MapPin,
  User,
  FileText,
  Trash2,
  Edit2,
  X,
  Sparkles,
  Settings,
  Check,
  Sun,
  Sunset,
  Moon,
  ChevronDown
} from 'lucide-react';

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

// Default Time Slots (Can be edited, deleted, or added by the user)
const DEFAULT_TIME_SLOTS = [
  { id: 'slot-1', name: 'Tiết 1', startTime: '07:15', endTime: '08:00', session: 'morning' },
  { id: 'slot-2', name: 'Tiết 2', startTime: '08:05', endTime: '08:50', session: 'morning' },
  { id: 'slot-3', name: 'Tiết 3', startTime: '09:05', endTime: '09:50', session: 'morning' },
  { id: 'slot-4', name: 'Tiết 4', startTime: '09:55', endTime: '10:40', session: 'morning' },
  { id: 'slot-5', name: 'Tiết 5', startTime: '10:45', endTime: '11:30', session: 'morning' },
  { id: 'slot-6', name: 'Tiết 6 (Chiều)', startTime: '13:30', endTime: '14:15', session: 'afternoon' },
  { id: 'slot-7', name: 'Tiết 7 (Chiều)', startTime: '14:20', endTime: '15:05', session: 'afternoon' },
  { id: 'slot-8', name: 'Tiết 8 (Chiều)', startTime: '15:20', endTime: '16:05', session: 'afternoon' },
  { id: 'slot-9', name: 'Ca Tối: Tự Học & Luyện Đề', startTime: '19:30', endTime: '21:30', session: 'evening' },
];

// Default Initial Classes placed into the grid (Đã xóa toàn bộ dữ liệu mẫu)
const DEFAULT_SCHEDULE_ENTRIES = [];

export default function TimetableView() {
  // State for Time Slots
  const [timeSlots, setTimeSlots] = useState(() => {
    const saved = localStorage.getItem('lumina_time_slots');
    return saved ? JSON.parse(saved) : DEFAULT_TIME_SLOTS;
  });

  // State for Schedule entries in grid (xóa sạch toàn bộ dữ liệu cũ theo yêu cầu)
  const [scheduleEntries, setScheduleEntries] = useState(() => {
    localStorage.removeItem('lumina_schedule_entries');
    return [];
  });

  // Filter session (all, morning, afternoon, evening)
  const [selectedSessionFilter, setSelectedSessionFilter] = useState('all');

  // Modal State: Add / Edit Time Slot
  const [isSlotModalOpen, setIsSlotModalOpen] = useState(false);
  const [editingSlot, setEditingSlot] = useState(null);
  const [slotName, setSlotName] = useState('');
  const [slotStartTime, setSlotStartTime] = useState('07:15');
  const [slotEndTime, setSlotEndTime] = useState('08:00');
  const [slotSession, setSlotSession] = useState('morning');

  // Modal State: Cell Editor (Add or Edit Class in cell)
  const [isCellModalOpen, setIsCellModalOpen] = useState(false);
  const [selectedCell, setSelectedCell] = useState(null); // { slotId, dayIndex, existingEntry }
  const [cellSubject, setCellSubject] = useState('');
  const [cellRoom, setCellRoom] = useState('');
  const [cellTeacher, setCellTeacher] = useState('');
  const [cellColor, setCellColor] = useState('purple');
  const [cellNotes, setCellNotes] = useState('');

  // Lưu bản sao vào localStorage khi có thay đổi
  useEffect(() => {
    localStorage.setItem('lumina_time_slots', JSON.stringify(timeSlots));
  }, [timeSlots]);

  useEffect(() => {
    localStorage.setItem('lumina_schedule_entries', JSON.stringify(scheduleEntries));
  }, [scheduleEntries]);

  // Open modal to add a brand new time slot
  const handleOpenAddSlot = () => {
    setEditingSlot(null);
    setSlotName(`Tiết ${timeSlots.length + 1}`);
    setSlotStartTime('16:15');
    setSlotEndTime('17:00');
    setSlotSession('afternoon');
    setIsSlotModalOpen(true);
  };

  // Open modal to edit existing time slot
  const handleOpenEditSlot = (slot) => {
    setEditingSlot(slot);
    setSlotName(slot.name);
    setSlotStartTime(slot.startTime);
    setSlotEndTime(slot.endTime);
    setSlotSession(slot.session || 'morning');
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
            ? { ...s, name: slotName, startTime: slotStartTime, endTime: slotEndTime, session: slotSession }
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
        session: slotSession,
      };
      setTimeSlots([...timeSlots, newSlot]);
    }

    setIsSlotModalOpen(false);
  };

  // Delete Time Slot
  const handleDeleteSlot = (slotId) => {
    if (confirm('Bạn có chắc chắn muốn xóa khung thời gian này và toàn bộ các tiết học trong đó?')) {
      setTimeSlots(timeSlots.filter((s) => s.id !== slotId));
      setScheduleEntries(scheduleEntries.filter((e) => e.slotId !== slotId));
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
      setCellRoom(existing.room || '');
      setCellTeacher(existing.teacher || '');
      setCellColor(existing.color || 'purple');
      setCellNotes(existing.notes || '');
    } else {
      setCellSubject('');
      setCellRoom('A.302');
      setCellTeacher('');
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
                room: cellRoom,
                teacher: cellTeacher,
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
        room: cellRoom,
        teacher: cellTeacher,
        color: cellColor,
        notes: cellNotes,
      };
      setScheduleEntries([...scheduleEntries, newEntry]);
    }

    setIsCellModalOpen(false);
  };

  // Delete class from cell
  const handleDeleteCellEntry = () => {
    if (selectedCell?.existingEntry) {
      setScheduleEntries(
        scheduleEntries.filter((item) => item.id !== selectedCell.existingEntry.id)
      );
      setIsCellModalOpen(false);
    }
  };

  // Filter time slots according to selected session
  const filteredSlots = timeSlots.filter((slot) => {
    if (selectedSessionFilter === 'all') return true;
    return slot.session === selectedSessionFilter;
  });

  // Helper to get color object
  const getColorObj = (colorId) => {
    return COLOR_THEMES.find((c) => c.id === colorId) || COLOR_THEMES[0];
  };

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Header & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 text-xs font-semibold mb-2">
            <CalendarDays className="w-3.5 h-3.5 text-cyan-300" />
            <span>Thời Khóa Biểu Tuần</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-display tracking-tight text-white">
            Bảng Thời Khóa Biểu
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">
            Quản lý lịch học trên lớp, ca học thêm và tự do thêm khung giờ phù hợp
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Session Filters */}
          <div className="p-1 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center gap-1">
            <button
              onClick={() => setSelectedSessionFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                selectedSessionFilter === 'all'
                  ? 'bg-purple-600/30 text-white border border-purple-400/50 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Cả Ngày ({timeSlots.length} khung giờ)
            </button>
            <button
              onClick={() => setSelectedSessionFilter('morning')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1 ${
                selectedSessionFilter === 'morning'
                  ? 'bg-amber-500/20 text-amber-200 border border-amber-400/50 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Sun className="w-3 h-3 text-amber-400" />
              <span>Sáng</span>
            </button>
            <button
              onClick={() => setSelectedSessionFilter('afternoon')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1 ${
                selectedSessionFilter === 'afternoon'
                  ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-400/50 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Sunset className="w-3 h-3 text-cyan-400" />
              <span>Chiều</span>
            </button>
            <button
              onClick={() => setSelectedSessionFilter('evening')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1 ${
                selectedSessionFilter === 'evening'
                  ? 'bg-purple-500/20 text-purple-200 border border-purple-400/50 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Moon className="w-3 h-3 text-purple-400" />
              <span>Tối</span>
            </button>
          </div>

          {/* Add Time Slot Button */}
          <button
            onClick={handleOpenAddSlot}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-500 text-white text-xs sm:text-sm font-bold shadow-lg shadow-purple-600/30 hover:scale-[1.02] transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm Khung Giờ Mới</span>
          </button>
        </div>
      </div>

      {/* 2. THE GRAND TIMETABLE MATRIX TABLE */}
      <div className="rounded-2xl glass-card border border-white/15 overflow-hidden shadow-2xl relative">
        <div className="overflow-x-auto scrollbar-none">
          <table className="w-full border-collapse text-left min-w-[900px]">
            {/* Table Header: Days of Week */}
            <thead>
              <tr className="border-b border-white/15 bg-white/[0.04]">
                {/* Column 0: Time Frame header */}
                <th className="py-2.5 px-3 w-36 font-display font-bold text-xs uppercase tracking-wider text-slate-300 sticky left-0 z-20 bg-[#0e101c]/90 backdrop-blur-md border-r border-white/10">
                  <div className="flex items-center justify-between">
                    <span>Khung Giờ</span>
                    <Clock className="w-3.5 h-3.5 text-purple-400" />
                  </div>
                </th>

                {/* Days 1 to 7 */}
                {DAYS_OF_WEEK.map((day) => (
                  <th
                    key={day.index}
                    className="py-2.5 px-2 font-display font-bold text-sm text-white border-r border-white/10 last:border-r-0 text-center min-w-[110px]"
                  >
                    <div className="text-white font-extrabold tracking-wide">{day.label}</div>
                    <div className="text-[10px] text-purple-300/80 font-mono mt-0.5 font-normal">
                      {scheduleEntries.filter((e) => e.dayIndex === day.index).length} môn học
                    </div>
                  </th>
                ))}
              </tr>
            </thead>

            {/* Table Body: Time Slot Rows */}
            <tbody className="divide-y divide-white/10">
              {filteredSlots.map((slot) => {
                return (
                  <tr
                    key={slot.id}
                    className="group/row hover:bg-white/[0.02] transition-colors"
                  >
                    {/* Sticky Left Column: Time Slot Info & Edit Controls */}
                    <td className="py-2 px-3 sticky left-0 z-10 bg-[#0c0d18]/95 backdrop-blur-md border-r border-white/10">
                      <div className="flex items-center justify-between gap-1.5">
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-display font-bold text-xs text-white truncate">
                              {slot.name}
                            </span>
                            <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-white/[0.06] text-slate-400 uppercase tracking-wider font-semibold">
                              {slot.session === 'morning' && 'Sáng'}
                              {slot.session === 'afternoon' && 'Chiều'}
                              {slot.session === 'evening' && 'Tối'}
                            </span>
                          </div>
                          <span className="text-[10px] font-mono text-purple-300 block mt-0.5">
                            {slot.startTime} - {slot.endTime}
                          </span>
                        </div>

                        {/* Slot Action buttons (appear on hover) */}
                        <div className="flex items-center gap-0.5 opacity-0 group-hover/row:opacity-100 transition-opacity shrink-0">
                          <button
                            onClick={() => handleOpenEditSlot(slot)}
                            className="p-1 rounded-md text-slate-400 hover:text-purple-300 hover:bg-white/[0.08]"
                            title="Chỉnh sửa khung giờ này"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => handleDeleteSlot(slot.id)}
                            className="p-1 rounded-md text-slate-400 hover:text-rose-400 hover:bg-white/[0.08]"
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
                          className="p-1.5 border-r border-white/10 last:border-r-0 align-top cursor-pointer transition-all hover:bg-white/[0.03] group/cell relative"
                        >
                          {entry ? (
                            /* Filled Class Cell (Compact Translucent Crystal Gem) */
                            <div
                              className={`w-full min-h-[46px] rounded-xl p-2 border transition-all duration-200 flex flex-col justify-between ${theme.bg} ${theme.border} ${theme.glow} shadow-sm group-hover/cell:scale-[1.01]`}
                            >
                              <div>
                                <span className={`text-xs font-bold font-display line-clamp-1 ${theme.text}`}>
                                  {entry.subject}
                                </span>

                                <div className="mt-0.5 flex items-center gap-2 text-[10px] text-slate-300">
                                  {entry.room && (
                                    <span className="flex items-center gap-1">
                                      <MapPin className="w-2.5 h-2.5 text-cyan-300" />
                                      {entry.room}
                                    </span>
                                  )}
                                  {entry.teacher && (
                                    <span className="truncate max-w-[80px]">
                                      {entry.teacher}
                                    </span>
                                  )}
                                </div>
                              </div>

                              {entry.notes && (
                                <p className="text-[9px] text-slate-300/80 italic mt-0.5 truncate">
                                  {entry.notes}
                                </p>
                              )}
                            </div>
                          ) : (
                            /* Empty Cell (Compact with subtle '+' on hover) */
                            <div className="w-full h-[46px] rounded-xl border border-dashed border-white/10 group-hover/cell:border-purple-400/40 group-hover/cell:bg-purple-500/[0.05] transition-all flex items-center justify-center gap-1 text-slate-500 group-hover/cell:text-purple-300">
                              <Plus className="w-3.5 h-3.5 opacity-0 group-hover/cell:opacity-100 transition-opacity" />
                              <span className="text-[10px] opacity-0 group-hover/cell:opacity-100 transition-opacity">
                                Thêm môn
                              </span>
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

        {/* Empty state if user filtered out all slots */}
        {filteredSlots.length === 0 && (
          <div className="p-12 text-center text-slate-400">
            <Clock className="w-10 h-10 text-slate-500 mx-auto mb-2" />
            <p className="text-sm font-semibold">Chưa có khung giờ nào cho buổi này</p>
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
                    Giờ Bắt Đầu *
                  </label>
                  <input
                    type="time"
                    required
                    value={slotStartTime}
                    onChange={(e) => setSlotStartTime(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.05] border border-white/10 text-white text-xs focus:outline-none focus:border-purple-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Giờ Kết Thúc *
                  </label>
                  <input
                    type="time"
                    required
                    value={slotEndTime}
                    onChange={(e) => setSlotEndTime(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.05] border border-white/10 text-white text-xs focus:outline-none focus:border-purple-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Phân Loại Buổi Trong Ngày
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'morning', label: 'Buổi Sáng', icon: Sun },
                    { id: 'afternoon', label: 'Buổi Chiều', icon: Sunset },
                    { id: 'evening', label: 'Buổi Tối', icon: Moon },
                  ].map((s) => {
                    const SIcon = s.icon;
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => setSlotSession(s.id)}
                        className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                          slotSession === s.id
                            ? 'bg-purple-600/30 text-white border-purple-400/50 shadow-sm'
                            : 'bg-white/[0.03] border-white/10 text-slate-400 hover:text-white'
                        }`}
                      >
                        <SIcon className="w-3.5 h-3.5" />
                        <span>{s.label}</span>
                      </button>
                    );
                  })}
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

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Phòng Học / Địa Điểm
                  </label>
                  <input
                    type="text"
                    placeholder="A.302, Online Zoom..."
                    value={cellRoom}
                    onChange={(e) => setCellRoom(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.05] border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-purple-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Giáo Viên Phụ Trách
                  </label>
                  <input
                    type="text"
                    placeholder="ThS. Nguyễn Văn A"
                    value={cellTeacher}
                    onChange={(e) => setCellTeacher(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.05] border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-purple-400"
                  />
                </div>
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
