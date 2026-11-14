import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  RotateCcw,
  Plus,
  Clock,
  Trash2,
  X,
  CalendarDays
} from 'lucide-react';
import {
  fetchUserCalendarEvents,
  loadLocalCalendarEvents,
  saveUserCalendarEvents
} from '../../services/calendarEventService';

const toDateKey = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const parseDateKey = (key) => {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
};

const diffDaysFromToday = (targetKey, nowDate) => {
  const todayStart = new Date(nowDate.getFullYear(), nowDate.getMonth(), nowDate.getDate());
  const target = parseDateKey(targetKey);
  return Math.round((target - todayStart) / (1000 * 60 * 60 * 24));
};

export default function DashboardView({ currentUser }) {
  const username = currentUser?.username || '';

  // Đồng bộ thời gian thực (cập nhật mỗi giây)
  const [now, setNow] = useState(() => new Date());
  const lastTodayKeyRef = useRef(toDateKey(new Date()));

  // Trạng thái ngày đang được chọn (mặc định là ngày hôm nay)
  const [selectedDate, setSelectedDate] = useState(() => new Date());

  // Trạng thái tháng/năm đang xem trong bảng lịch
  const [currentMonth, setCurrentMonth] = useState(() => new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(() => new Date().getFullYear());

  // Trạng thái đóng/mở popup lịch
  const [isOpen, setIsOpen] = useState(false);

  // Danh sách sự kiện theo tài khoản (cache LocalStorage + đồng bộ Firebase)
  const [events, setEvents] = useState(() => loadLocalCalendarEvents(username));

  // Modal thêm sự kiện
  const [showAddModal, setShowAddModal] = useState(false);
  const [eventTitle, setEventTitle] = useState('');
  const [eventDate, setEventDate] = useState(() => toDateKey(new Date()));
  const [eventTime, setEventTime] = useState('');
  const [eventNote, setEventNote] = useState('');

  const pickerRef = useRef(null);

  // Tải sự kiện từ Firebase theo tài khoản người dùng
  useEffect(() => {
    let active = true;
    fetchUserCalendarEvents(username).then((loaded) => {
      if (active && Array.isArray(loaded)) {
        setEvents(loaded);
      }
    });
    return () => {
      active = false;
    };
  }, [username]);

  // Đồng bộ thời gian thực & tự động cập nhật khi qua ngày mới
  useEffect(() => {
    const timer = setInterval(() => {
      const current = new Date();
      setNow(current);
      const currentKey = toDateKey(current);
      if (currentKey !== lastTodayKeyRef.current) {
        const prevTodayKey = lastTodayKeyRef.current;
        lastTodayKeyRef.current = currentKey;
        setSelectedDate((prevSelected) => {
          if (toDateKey(prevSelected) === prevTodayKey) {
            setCurrentMonth(current.getMonth());
            setCurrentYear(current.getFullYear());
            return current;
          }
          return prevSelected;
        });
      }
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Đóng popup khi click ra ngoài
  useEffect(() => {
    function handleClickOutside(event) {
      if (pickerRef.current && !pickerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const daysOfWeek = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
  const monthNames = [
    'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4',
    'Tháng 5', 'Tháng 6', 'Tháng 7', 'Tháng 8',
    'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'
  ];

  // Tính toán số ngày trong tháng và ngày bắt đầu của tuần
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayIndex = (new Date(currentYear, currentMonth, 1).getDay() + 6) % 7;

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const handleSelectDay = (day) => {
    const newDate = new Date(currentYear, currentMonth, day);
    setSelectedDate(newDate);
  };

  const handleGoToToday = () => {
    const today = new Date();
    setNow(today);
    setSelectedDate(today);
    setCurrentMonth(today.getMonth());
    setCurrentYear(today.getFullYear());
    setIsOpen(false);
  };

  const isToday = (day) => {
    return (
      day === now.getDate() &&
      currentMonth === now.getMonth() &&
      currentYear === now.getFullYear()
    );
  };

  const isSelected = (day) => {
    return (
      day === selectedDate.getDate() &&
      currentMonth === selectedDate.getMonth() &&
      currentYear === selectedDate.getFullYear()
    );
  };

  const selectedDateKey = toDateKey(selectedDate);

  // Gom sự kiện theo ngày để đánh dấu trên lịch
  const eventsByDate = useMemo(() => {
    const map = {};
    for (const ev of events) {
      if (!map[ev.date]) map[ev.date] = [];
      map[ev.date].push(ev);
    }
    return map;
  }, [events]);

  // Sự kiện của ngày đang chọn
  const selectedDayEvents = useMemo(() => {
    return (eventsByDate[selectedDateKey] || []).slice().sort((a, b) => (a.time || '').localeCompare(b.time || ''));
  }, [eventsByDate, selectedDateKey]);

  // Tất cả sự kiện sắp tới (từ hôm nay trở đi)
  const upcomingEvents = useMemo(() => {
    return events
      .map((ev) => ({
        ...ev,
        daysUntil: diffDaysFromToday(ev.date, now)
      }))
      .filter((ev) => ev.daysUntil >= 0)
      .sort((a, b) => a.date.localeCompare(b.date) || (a.time || '').localeCompare(b.time || ''));
  }, [events, now]);

  const openAddEventModal = (dateKey = selectedDateKey) => {
    setEventTitle('');
    setEventDate(dateKey);
    setEventTime('');
    setEventNote('');
    setShowAddModal(true);
    setIsOpen(false);
  };

  const handleAddEvent = async (e) => {
    e.preventDefault();
    const trimmedTitle = eventTitle.trim();
    if (!trimmedTitle || !eventDate) return;

    const newEvent = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      title: trimmedTitle,
      date: eventDate,
      time: eventTime.trim(),
      note: eventNote.trim(),
      createdBy: username || 'guest'
    };

    const nextEvents = [...events, newEvent];
    setEvents(nextEvents);
    const targetDate = parseDateKey(eventDate);
    setSelectedDate(targetDate);
    setCurrentMonth(targetDate.getMonth());
    setCurrentYear(targetDate.getFullYear());
    setShowAddModal(false);

    await saveUserCalendarEvents(username, nextEvents);
  };

  const handleDeleteEvent = async (id) => {
    const nextEvents = events.filter((ev) => ev.id !== id);
    setEvents(nextEvents);
    await saveUserCalendarEvents(username, nextEvents);
  };

  // Định dạng ngày hiển thị trên nút bấm (đồng bộ thời gian thực)
  const formattedLiveDate = now.toLocaleDateString('vi-VN', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });

  const formattedLiveTime = now.toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit'
  });

  const formatDateDisplay = (key) => {
    const [y, m, d] = key.split('-');
    return `${d}/${m}/${y}`;
  };

  return (
    <div className="w-full min-h-[calc(100vh-140px)] flex flex-col">
      {/* 1. Thanh tiêu đề phía trên cùng - Date Picker đồng bộ thời gian thực ở góc trên bên phải */}
      <div className="w-full flex items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-white/10">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold font-display tracking-tight text-slate-800 dark:text-white">
            Trang Chủ
          </h1>
        </div>

        {/* Date Picker ở góc trên bên phải */}
        <div className="relative" ref={pickerRef}>
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center gap-2.5 px-4 py-2.5 rounded-2xl glass-button text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white border border-white/20 dark:border-white/15 shadow-sm transition-all duration-200 cursor-pointer select-none"
          >
            <div className="p-1 rounded-lg bg-indigo-500/10 text-indigo-500 dark:text-purple-400">
              <CalendarIcon className="w-4 h-4" />
            </div>
            <span className="capitalize">{formattedLiveDate}</span>
            <span className="text-[11px] font-mono px-1.5 py-0.5 rounded-md bg-purple-500/15 text-purple-300">
              {formattedLiveTime}
            </span>
            <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Popup Dropdown Lịch */}
          {isOpen && (
            <div className="absolute right-0 top-full mt-2 z-50 w-80 p-4 rounded-3xl glass-card border border-white/25 dark:border-white/15 bg-white/95 dark:bg-[#0e101c]/95 shadow-2xl backdrop-blur-2xl animate-fadeIn">
              {/* Header Tháng & Năm */}
              <div className="flex items-center justify-between mb-3 px-1">
                <span className="font-display font-bold text-sm text-slate-800 dark:text-white">
                  {monthNames[currentMonth]}, {currentYear}
                </span>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={handlePrevMonth}
                    className="p-1.5 rounded-xl glass-button text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all cursor-pointer"
                    title="Tháng trước"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={handleNextMonth}
                    className="p-1.5 rounded-xl glass-button text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all cursor-pointer"
                    title="Tháng sau"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Các thứ trong tuần */}
              <div className="grid grid-cols-7 gap-1 text-center mb-2">
                {daysOfWeek.map((day, idx) => (
                  <span
                    key={idx}
                    className="text-[11px] font-bold text-slate-400 dark:text-slate-500 py-1"
                  >
                    {day}
                  </span>
                ))}
              </div>

              {/* Lưới các ngày trong tháng */}
              <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: firstDayIndex }).map((_, idx) => (
                  <div key={`empty-${idx}`} className="h-9" />
                ))}

                {Array.from({ length: daysInMonth }).map((_, idx) => {
                  const day = idx + 1;
                  const selected = isSelected(day);
                  const today = isToday(day);
                  const dayKey = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                  const hasEvents = (eventsByDate[dayKey]?.length || 0) > 0;

                  return (
                    <button
                      type="button"
                      key={day}
                      onClick={() => handleSelectDay(day)}
                      className={`h-9 rounded-xl text-xs font-semibold flex items-center justify-center transition-all duration-150 cursor-pointer relative ${
                        selected
                          ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold shadow-md shadow-purple-500/30 scale-105'
                          : today
                          ? 'border border-indigo-400/60 dark:border-purple-400/60 text-indigo-600 dark:text-purple-300 font-bold bg-indigo-50/50 dark:bg-purple-500/10'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10'
                      }`}
                    >
                      {day}
                      {(hasEvents || (today && !selected)) && (
                        <span
                          className={`absolute bottom-1 w-1.5 h-1.5 rounded-full ${
                            hasEvents
                              ? 'bg-cyan-300'
                              : 'bg-indigo-500 dark:bg-purple-400'
                          }`}
                        />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Chân popup: Nút "+ Sự kiện" và "Hôm nay" */}
              <div className="mt-3 pt-3 border-t border-slate-200/80 dark:border-white/10 flex items-center justify-between gap-2">
                <span className="text-[11px] text-slate-400">
                  Đã chọn: <strong className="text-slate-700 dark:text-slate-200">{selectedDate.getDate()}/{selectedDate.getMonth() + 1}/{selectedDate.getFullYear()}</strong>
                </span>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => openAddEventModal(selectedDateKey)}
                    className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold text-cyan-400 hover:bg-cyan-500/15 transition-all cursor-pointer"
                    title="Thêm sự kiện cho ngày đã chọn"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Sự kiện</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleGoToToday}
                    className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold text-indigo-600 dark:text-purple-300 hover:bg-indigo-50 dark:hover:bg-purple-500/15 transition-all cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Hôm nay</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 2. Khu vực Sự kiện gọn gàng, tinh tế ở bên phải */}
      <div className="py-4 flex justify-end">
        <div className="w-full sm:w-80 p-3 rounded-2xl glass-card border border-white/10 space-y-2.5">
          {/* Chỉ hiển thị sự kiện ngày đang chọn khi ngày đó có sự kiện */}
          {selectedDayEvents.length > 0 && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between px-0.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-purple-300">
                  Ngày {formatDateDisplay(selectedDateKey)}
                </span>
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-purple-500/15 text-purple-300">
                  {selectedDayEvents.length}
                </span>
              </div>

              <div className="space-y-1">
                {selectedDayEvents.map((ev) => (
                  <div
                    key={ev.id}
                    className="group px-2.5 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.07] border border-white/10 flex items-center justify-between gap-2 transition-colors"
                  >
                    <div className="min-w-0 flex items-center gap-2 flex-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-purple-400 shrink-0" />
                      <span className="text-xs font-semibold text-white truncate">{ev.title}</span>
                      {ev.time && (
                        <span className="inline-flex items-center gap-0.5 text-[10px] text-cyan-300 shrink-0">
                          <Clock className="w-2.5 h-2.5" />
                          {ev.time}
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteEvent(ev.id)}
                      className="p-1 rounded-md text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer shrink-0"
                      title="Xóa sự kiện"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sự kiện sắp tới */}
          <div className={selectedDayEvents.length > 0 ? 'pt-2 border-t border-white/10 space-y-1.5' : 'space-y-1.5'}>
            <div className="flex items-center justify-between px-0.5">
              <div className="flex items-center gap-1.5">
                <CalendarDays className="w-3.5 h-3.5 text-cyan-300" />
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-300">
                  Sự kiện sắp tới
                </span>
              </div>
              {upcomingEvents.length > 0 && (
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-white/10 text-slate-300">
                  {upcomingEvents.length}
                </span>
              )}
            </div>

            {upcomingEvents.length === 0 ? (
              <p className="text-[11px] text-slate-400 px-0.5">
                Chưa có sự kiện nào sắp tới.
              </p>
            ) : (
              <div className="space-y-1 max-h-48 overflow-y-auto pr-0.5">
                {upcomingEvents.map((ev) => (
                  <div
                    key={`up-${ev.id}`}
                    onClick={() => {
                      const d = parseDateKey(ev.date);
                      setSelectedDate(d);
                      setCurrentMonth(d.getMonth());
                      setCurrentYear(d.getFullYear());
                    }}
                    className="px-2.5 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.07] border border-white/10 flex items-center justify-between gap-2 cursor-pointer transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-semibold text-white truncate">{ev.title}</div>
                      <div className="text-[10px] text-slate-400 flex items-center gap-1">
                        <span>{formatDateDisplay(ev.date)}</span>
                        {ev.time && <span>• {ev.time}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-purple-500/20 text-purple-200 border border-purple-400/25">
                        {ev.daysUntil === 0 ? 'Hôm nay' : `${ev.daysUntil} ngày`}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteEvent(ev.id);
                        }}
                        className="p-1 rounded-md text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                        title="Xóa sự kiện"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal thêm sự kiện */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md p-5 rounded-3xl glass-card border border-white/20 bg-[#0e101c] shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white font-display">Thêm sự kiện mới</h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddEvent} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Tên sự kiện *
                </label>
                <input
                  type="text"
                  required
                  value={eventTitle}
                  onChange={(e) => setEventTitle(e.target.value)}
                  placeholder="VD: Kiểm tra giữa kỳ Toán, Nộp bài tập..."
                  className="w-full px-3.5 py-2 rounded-xl bg-white/[0.06] border border-white/15 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Ngày diễn ra *
                  </label>
                  <input
                    type="date"
                    required
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white/[0.06] border border-white/15 text-sm text-white focus:outline-none focus:border-purple-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Giờ (tùy chọn)
                  </label>
                  <input
                    type="time"
                    value={eventTime}
                    onChange={(e) => setEventTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white/[0.06] border border-white/15 text-sm text-white focus:outline-none focus:border-purple-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Ghi chú (tùy chọn)
                </label>
                <textarea
                  rows={2}
                  value={eventNote}
                  onChange={(e) => setEventNote(e.target.value)}
                  placeholder="Nội dung cần chuẩn bị..."
                  className="w-full px-3.5 py-2 rounded-xl bg-white/[0.06] border border-white/15 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-400 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:bg-white/10 transition-colors cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-semibold shadow-md shadow-purple-500/20 transition-all cursor-pointer"
                >
                  Lưu sự kiện
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
