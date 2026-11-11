// Mock Data cho Hệ thống Tự Học LuminaLearn (Dành cho Học Sinh Cấp 3 / THPT)

export const USER_PROFILE = {
  name: "Gia Kỳ",
  title: "Học sinh Lớp 12A1",
  avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
  level: 8,
  xp: 2840,
  nextLevelXp: 3500,
  streakDays: 12,
  todayStudyMinutes: 135,
  dailyGoalMinutes: 180,
  tasksDoneToday: 5,
  totalTasksToday: 7,
};

export const DAILY_MOTIVATION = {
  quote: "Đường đi khó, không khó vì ngăn sông cách núi, mà khó vì lòng người ngại núi e sông. Cố gắng hết mình cho kỳ thi sắp tới nhé!",
  author: "Nguyễn Bá Học",
};

export const TIMETABLE_DATA = [
  {
    id: "tt-1",
    day: "Thứ Hai",
    dayIndex: 1,
    time: "07:15 - 08:45",
    period: "Tiết 1 - 2",
    subject: "Toán (Giải Tích)",
    room: "A.302",
    teacher: "Thầy Hoàng Nam",
    color: "from-purple-500/20 to-indigo-500/20 border-purple-500/30 text-purple-300",
    badgeColor: "bg-purple-500/20 text-purple-200 border-purple-500/40",
    status: "completed",
    notes: "Kiểm tra 15 phút phần Đạo hàm & Khảo sát hàm số",
  },
  {
    id: "tt-2",
    day: "Thứ Hai",
    dayIndex: 1,
    time: "09:05 - 10:40",
    period: "Tiết 3 - 4",
    subject: "Vật Lý (Dao Động Cơ)",
    room: "Lab B.104",
    teacher: "Thầy Nguyễn Minh",
    color: "from-cyan-500/20 to-blue-500/20 border-cyan-500/30 text-cyan-300",
    badgeColor: "bg-cyan-500/20 text-cyan-200 border-cyan-500/40",
    status: "ongoing",
    notes: "Thực hành bài con lắc lò xo và con lắc đơn",
  },
  {
    id: "tt-3",
    day: "Thứ Hai",
    dayIndex: 1,
    time: "14:00 - 15:30",
    period: "Ca chiều",
    subject: "Tiếng Anh (Luyện Đề)",
    room: "Phòng 102",
    teacher: "Cô Thu Thảo",
    color: "from-amber-500/20 to-orange-500/20 border-amber-500/30 text-amber-300",
    badgeColor: "bg-amber-500/20 text-amber-200 border-amber-500/40",
    status: "upcoming",
    notes: "Sửa bài tập phần Đọc hiểu & Điền từ",
  },
  {
    id: "tt-4",
    day: "Thứ Ba",
    dayIndex: 2,
    time: "07:15 - 09:50",
    period: "Tiết 1 - 3",
    subject: "Hóa Học (Hữu Cơ)",
    room: "C.201",
    teacher: "Cô Thu Hà",
    color: "from-emerald-500/20 to-teal-500/20 border-emerald-500/30 text-emerald-300",
    badgeColor: "bg-emerald-500/20 text-emerald-200 border-emerald-500/40",
    status: "upcoming",
    notes: "Phản ứng Este hóa và bài toán thủy phân",
  },
  {
    id: "tt-5",
    day: "Thứ Tư",
    dayIndex: 3,
    time: "08:00 - 10:30",
    period: "Tiết 1 - 3",
    subject: "Ngữ Văn (Nghị Luận)",
    room: "B.405",
    teacher: "Cô Thu Nga",
    color: "from-rose-500/20 to-pink-500/20 border-rose-500/30 text-rose-300",
    badgeColor: "bg-rose-500/20 text-rose-200 border-rose-500/40",
    status: "upcoming",
    notes: "Phân tích tác phẩm Vợ Chồng A Phủ",
  },
  {
    id: "tt-6",
    day: "Thứ Năm",
    dayIndex: 4,
    time: "13:30 - 15:05",
    period: "Ca chiều",
    subject: "Tin Học",
    room: "Phòng máy 2",
    teacher: "Thầy Vũ Đức",
    color: "from-blue-500/20 to-violet-500/20 border-blue-500/30 text-blue-300",
    badgeColor: "bg-blue-500/20 text-blue-200 border-blue-500/40",
    status: "upcoming",
    notes: "Lập trình thuật toán tìm kiếm và sắp xếp",
  },
  {
    id: "tt-7",
    day: "Thứ Sáu",
    dayIndex: 5,
    time: "08:00 - 10:40",
    period: "Tiết 1 - 3",
    subject: "Lịch Sử",
    room: "A.302",
    teacher: "Thầy Phạm Quang",
    color: "from-yellow-500/20 to-amber-600/20 border-yellow-500/30 text-yellow-300",
    badgeColor: "bg-yellow-500/20 text-yellow-200 border-yellow-500/40",
    status: "upcoming",
    notes: "Giai đoạn lịch sử Việt Nam 1945 - 1954",
  }
];

export const FLASHCARD_DECKS = [
  {
    id: "deck-1",
    title: "Tiếng Anh: Từ Vựng Trọng Tâm Hay Gặp Trong Đề Thi",
    subject: "Tiếng Anh",
    cardCount: 30,
    mastered: 22,
    cards: [
      {
        id: "c1",
        front: "Ubiquitous (adj)",
        phonetic: "/juːˈbɪk.wə.təs/",
        hint: "Mô tả cái gì đó có mặt ở khắp mọi nơi",
        back: "Phổ biến, xuất hiện ở khắp nơi.",
        example: "Smartphones have become ubiquitous in daily life.",
        synonyms: "Common, everywhere",
      },
      {
        id: "c2",
        front: "Ephemeral (adj)",
        phonetic: "/ɪˈfem.ər.əl/",
        hint: "Chỉ kéo dài trong thời gian rất ngắn",
        back: "Ngắn ngủi, chóng tàn, phù du.",
        example: "Fashions are ephemeral: new styles quickly replace old ones.",
        synonyms: "Short-lived, fleeting",
      },
      {
        id: "c3",
        front: "Pragmatic (adj)",
        phonetic: "/præɡˈmæt.ɪk/",
        hint: "Dựa vào thực tế thay vì lý thuyết suông",
        back: "Thực tế, có tính thực tiễn.",
        example: "We need a pragmatic approach to solving exam preparation problems.",
        synonyms: "Practical, realistic",
      },
      {
        id: "c4",
        front: "Resilience (noun)",
        phonetic: "/rɪˈzɪl.jəns/",
        hint: "Khả năng vượt qua khó khăn, không bỏ cuộc",
        back: "Sự kiên cường, khả năng tự phục hồi.",
        example: "Students need resilience to overcome difficult mock tests.",
        synonyms: "Determination, strength",
      },
      {
        id: "c5",
        front: "Ambiguous (adj)",
        phonetic: "/æmˈbɪɡ.ju.əs/",
        hint: "Không rõ ràng, có nhiều nghĩa",
        back: "Mơ hồ, không rõ ràng.",
        example: "The question was ambiguous and confused many students.",
        synonyms: "Unclear, confusing",
      }
    ]
  },
  {
    id: "deck-2",
    title: "Toán 12: Công Thức Lượng Giác & Đạo Hàm",
    subject: "Toán Học",
    cardCount: 24,
    mastered: 18,
    cards: [
      {
        id: "m1",
        front: "Công thức nhân đôi: cos(2x) = ?",
        phonetic: "Công thức cơ bản",
        hint: "Có 3 dạng viết tương đương thường gặp",
        back: "cos(2x) = cos²(x) - sin²(x)\n= 2cos²(x) - 1\n= 1 - 2sin²(x)",
        example: "Dùng để hạ bậc khi giải phương trình lượng giác",
        synonyms: "Nhân đôi cos",
      },
      {
        id: "m2",
        front: "Đạo hàm của: [ln(u)]' = ?",
        phonetic: "Hàm số logarit",
        hint: "Đạo hàm của hàm hợp logarit tự nhiên",
        back: "[ln(u)]' = u' / u  (với u > 0)",
        example: "Ví dụ: [ln(x² + 1)]' = 2x / (x² + 1)",
        synonyms: "Đạo hàm ln",
      },
      {
        id: "m3",
        front: "Công thức nguyên hàm từng phần: ∫ u dv = ?",
        phonetic: "Nguyên hàm - Tích phân",
        hint: "Quy tắc: Nhất lô, nhì đa, tam lượng, tứ mũ",
        back: "∫ u dv = u·v - ∫ v du",
        example: "Ví dụ: Tính ∫ x·e^x dx đặt u = x, dv = e^x dx",
        synonyms: "Tích phân từng phần",
      }
    ]
  },
  {
    id: "deck-3",
    title: "Vật Lý 12: Dao Động Cơ & Sóng Ánh Sáng",
    subject: "Vật Lý",
    cardCount: 18,
    mastered: 12,
    cards: [
      {
        id: "p1",
        front: "Chu kỳ con lắc đơn: T = ?",
        phonetic: "Dao động cơ học",
        hint: "Phụ thuộc chiều dài dây l và gia tốc trọng trường g",
        back: "T = 2π√(l / g)",
        example: "Khi chiều dài tăng 4 lần thì chu kỳ T tăng 2 lần",
        synonyms: "Chu kỳ T con lắc đơn",
      },
      {
        id: "p2",
        front: "Khoảng vân giao thoa ánh sáng: i = ?",
        phonetic: "Sóng ánh sáng",
        hint: "Thí nghiệm khe Y-âng",
        back: "i = (λ · D) / a",
        example: "λ: bước sóng, D: khoảng cách 2 khe đến màn, a: khoảng cách 2 khe",
        synonyms: "Khoảng vân i",
      }
    ]
  }
];

export const STUDY_SUBJECTS = [
  {
    id: "sub-1",
    name: "Toán Học",
    code: "TOAN12",
    progress: 78,
    totalHours: 42,
    icon: "Calculator",
    color: "purple",
    tasks: 4,
    notes: 12,
  },
  {
    id: "sub-2",
    name: "Vật Lý",
    code: "LY12",
    progress: 65,
    totalHours: 35,
    icon: "Atom",
    color: "cyan",
    tasks: 2,
    notes: 9,
  },
  {
    id: "sub-3",
    name: "Tiếng Anh",
    code: "ANH12",
    progress: 88,
    totalHours: 58,
    icon: "Languages",
    color: "amber",
    tasks: 6,
    notes: 24,
  },
  {
    id: "sub-4",
    name: "Hóa Học",
    code: "HOA12",
    progress: 52,
    totalHours: 28,
    icon: "FlaskConical",
    color: "emerald",
    tasks: 3,
    notes: 7,
  }
];

export const HOMEWORK_TASKS = [
  {
    id: "t1",
    title: "Làm bài tập phần Tích phân và ứng dụng (Đề số 3)",
    subject: "Toán Học",
    dueDate: "Hôm nay, 22:00",
    priority: "high",
    isDone: false,
  },
  {
    id: "t2",
    title: "Luyện 30 câu trắc nghiệm ngữ pháp & từ vựng Tiếng Anh",
    subject: "Tiếng Anh",
    dueDate: "Hôm nay, 23:00",
    priority: "high",
    isDone: true,
  },
  {
    id: "t3",
    title: "Viết báo cáo thực hành bài con lắc lò xo",
    subject: "Vật Lý",
    dueDate: "Ngày mai, 17:00",
    priority: "medium",
    isDone: false,
  },
  {
    id: "t4",
    title: "Ôn lại 30 thẻ Flashcard từ vựng bài 4",
    subject: "Tiếng Anh",
    dueDate: "Hôm nay, 23:59",
    priority: "medium",
    isDone: true,
  },
  {
    id: "t5",
    title: "Tóm tắt lý thuyết chương Este - Lipit",
    subject: "Hóa Học",
    dueDate: "Thứ Sáu",
    priority: "low",
    isDone: false,
  }
];

export const QUIZ_SAMPLES = [
  {
    id: "quiz-1",
    title: "Đề Ôn Tập: Toán & Tư Duy Logic",
    duration: "10 phút",
    questionsCount: 5,
    difficulty: "Vừa sức",
    category: "Toán Học",
    questions: [
      {
        id: 1,
        question: "Giá trị của đạo hàm hàm số y = e^(2x) tại x = 0 là bao nhiêu?",
        options: ["A. 1", "B. 2", "C. e", "D. 0"],
        correctIndex: 1,
        explanation: "Ta có y' = 2·e^(2x). Khi x = 0 thì y'(0) = 2·e^0 = 2·1 = 2.",
      },
      {
        id: 2,
        question: "Trong tam giác đều cạnh a, bán kính đường tròn ngoại tiếp R bằng:",
        options: ["A. (a√3) / 2", "B. (a√3) / 3", "C. (a√3) / 6", "D. a / 2"],
        correctIndex: 1,
        explanation: "Đường cao h = a√3/2. Trọng tâm chia đường cao theo tỉ lệ 2/3 nên R = (2/3)h = (a√3)/3.",
      },
      {
        id: 3,
        question: "Từ nào đồng nghĩa với 'Meticulous' trong tiếng Anh?",
        options: ["A. Careless", "B. Detailed & Thorough", "C. Rapid", "D. Mysterious"],
        correctIndex: 1,
        explanation: "'Meticulous' nghĩa là rất cẩn thận, tỉ mỉ từng chi tiết nhỏ.",
      },
      {
        id: 4,
        question: "Một vật dao động điều hòa với chu kỳ T = 2s. Tần số dao động f là:",
        options: ["A. 2 Hz", "B. 1 Hz", "C. 0.5 Hz", "D. 4 Hz"],
        correctIndex: 2,
        explanation: "Tần số f = 1 / T = 1 / 2 = 0.5 Hz.",
      },
      {
        id: 5,
        question: "Đơn vị đo cường độ dòng điện trong hệ đo lường quốc tế SI là:",
        options: ["A. Vôn (V)", "B. Oát (W)", "C. Ampe (A)", "D. Jun (J)"],
        correctIndex: 2,
        explanation: "Ampe (kí hiệu A) là đơn vị chuẩn đo cường độ dòng điện.",
      }
    ]
  }
];

export const MEMORY_MATCH_CARDS = [
  { id: 1, pairId: "pair-1", text: "sin²(x) + cos²(x)", type: "formula" },
  { id: 2, pairId: "pair-1", text: "= 1", type: "answer" },
  { id: 3, pairId: "pair-2", text: "F = m · a", type: "formula" },
  { id: 4, pairId: "pair-2", text: "Định luật 2 Newton", type: "answer" },
  { id: 5, pairId: "pair-3", text: "E = m · c²", type: "formula" },
  { id: 6, pairId: "pair-3", text: "Công thức Einstein", type: "answer" },
  { id: 7, pairId: "pair-4", text: "Ubiquitous", type: "formula" },
  { id: 8, pairId: "pair-4", text: "Xuất hiện khắp nơi", type: "answer" },
];

export const BADGES_DATA = [
  {
    id: "b1",
    name: "Cú Đêm Ôn Bài",
    desc: "Hoàn thành 3 phiên Pomodoro sau 21h",
    icon: "Moon",
    unlocked: true,
    color: "from-purple-500 to-indigo-500",
  },
  {
    id: "b2",
    name: "Chăm Chỉ 10 Ngày",
    desc: "Học liên tục 10 ngày không nghỉ",
    icon: "Flame",
    unlocked: true,
    color: "from-amber-500 to-red-500",
  },
  {
    id: "b3",
    name: "Ghi Nhớ Giỏi",
    desc: "Thuộc 50 thẻ Flashcard không sai câu nào",
    icon: "Brain",
    unlocked: true,
    color: "from-cyan-500 to-blue-500",
  },
  {
    id: "b4",
    name: "Tập Trung Tốt",
    desc: "Đạt mốc 500 phút học tập trung",
    icon: "Target",
    unlocked: false,
    color: "from-emerald-500 to-teal-500",
  },
  {
    id: "b5",
    name: "Điểm 10 Trắc Nghiệm",
    desc: "Đạt điểm tuyệt đối trong bài kiểm tra",
    icon: "Crown",
    unlocked: false,
    color: "from-yellow-400 to-amber-500",
  }
];

export const LEADERBOARD_USERS = [
  { rank: 1, name: "Trần Bảo Ngọc", xp: 4820, avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80", badge: "Hạng 1 tuần" },
  { rank: 2, name: "Gia Kỳ (Bạn)", xp: 2840, avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80", badge: "Hạng 2 tuần" },
  { rank: 3, name: "Lê Hoàng Long", xp: 2610, avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80", badge: "Hạng 3 tuần" },
  { rank: 4, name: "Nguyễn Minh Châu", xp: 2190, avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&auto=format&fit=crop&q=80", badge: "Chăm chỉ" },
  { rank: 5, name: "Đặng Tuấn Kiệt", xp: 1950, avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80", badge: "Tiến bộ" },
];
