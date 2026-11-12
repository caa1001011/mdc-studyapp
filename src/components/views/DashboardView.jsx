import React, { useState, useRef, useEffect } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  RotateCcw
} from 'lucide-react';

export default function DashboardView({ setActiveTab, currentUser }) {
  // Trạng thái ngày đang được chọn (mặc định là ngày hôm nay)
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  // Trạng thái tháng/năm đang xem trong bảng lịch
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  
  // Trạng thái đóng/mở popup lịch
  const [isOpen, setIsOpen] = useState(false);
  
  const pickerRef = useRef(null);

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
  // Thứ trong tuần của ngày 1 (0 là Chủ nhật, 1 là Thứ hai) -> chuyển đổi để Thứ hai là 0
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
    setIsOpen(false);
  };

  const handleGoToToday = () => {
    const today = new Date();
    setSelectedDate(today);
    setCurrentMonth(today.getMonth());
    setCurrentYear(today.getFullYear());
    setIsOpen(false);
  };

  const isToday = (day) => {
    const today = new Date();
    return (
      day === today.getDate() &&
      currentMonth === today.getMonth() &&
      currentYear === today.getFullYear()
    );
  };

  const isSelected = (day) => {
    return (
      day === selectedDate.getDate() &&
      currentMonth === selectedDate.getMonth() &&
      currentYear === selectedDate.getFullYear()
    );
  };

  // Định dạng ngày hiển thị trên nút bấm
  const formattedDisplayDate = selectedDate.toLocaleDateString('vi-VN', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });

  return (
    <div className="w-full min-h-[calc(100vh-140px)] flex flex-col">
      {/* 1. Thanh tiêu đề phía trên cùng - Date Picker ở góc trên bên phải */}
      <div className="w-full flex items-center justify-between pb-6 border-b border-white/10 dark:border-white/10 border-slate-200">
        <div>
          {/* Khu vực tiêu đề trang chủ để bạn tự do phát triển nội dung */}
          <h1 className="text-xl sm:text-2xl font-bold font-display tracking-tight text-slate-800 dark:text-white">
            Trang Chủ
          </h1>
        </div>

        {/* Date Picker ở góc trên bên phải */}
        <div className="relative" ref={pickerRef}>
          {/* Nút bấm mở Date Picker */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center gap-2.5 px-4 py-2.5 rounded-2xl glass-button text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white border border-white/20 dark:border-white/15 shadow-sm transition-all duration-200 cursor-pointer select-none"
          >
            <div className="p-1 rounded-lg bg-indigo-500/10 text-indigo-500 dark:text-purple-400">
              <CalendarIcon className="w-4 h-4" />
            </div>
            <span className="capitalize">{formattedDisplayDate}</span>
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
                    onClick={handlePrevMonth}
                    className="p-1.5 rounded-xl glass-button text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all cursor-pointer"
                    title="Tháng trước"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
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
                {/* Các ô trống trước ngày đầu tiên của tháng */}
                {Array.from({ length: firstDayIndex }).map((_, idx) => (
                  <div key={`empty-${idx}`} className="h-9" />
                ))}

                {/* Các ngày trong tháng */}
                {Array.from({ length: daysInMonth }).map((_, idx) => {
                  const day = idx + 1;
                  const selected = isSelected(day);
                  const today = isToday(day);

                  return (
                    <button
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
                      {/* Dấu chấm nhỏ cho ngày hôm nay nếu không được chọn */}
                      {today && !selected && (
                        <span className="absolute bottom-1 w-1 h-1 rounded-full bg-indigo-500 dark:bg-purple-400" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Chân popup: Nút chọn "Hôm nay" */}
              <div className="mt-3 pt-3 border-t border-slate-200/80 dark:border-white/10 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">
                  Đã chọn: <strong className="text-slate-700 dark:text-slate-200">{selectedDate.getDate()}/{selectedDate.getMonth() + 1}/{selectedDate.getFullYear()}</strong>
                </span>

                <button
                  onClick={handleGoToToday}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-indigo-600 dark:text-purple-300 hover:bg-indigo-50 dark:hover:bg-purple-500/15 transition-all cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Hôm nay</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 2. Khoảng không gian trống bên dưới để bạn tự do thiết kế theo ý muốn */}
      <div className="flex-1 py-8">
        {/* Nơi bạn sẽ thêm các thành phần giao diện tiếp theo */}
      </div>
    </div>
  );
}
