// Ngân hàng câu hỏi dự phòng chuẩn chương trình THPT cho 8 trò chơi (dùng ký hiệu Unicode rõ ràng, không LaTeX)

export const FALLBACK_GAME_DATA = {
  // 1. TOÁN HỌC — Phản Xạ Công Thức 60s
  'math-blitz': [
    {
      question: 'Giá trị của sin 30° bằng:',
      options: ['1/2', '√3/2', '√2/2', '1'],
      correctIndex: 0,
      explanation: 'sin 30° = 1/2.',
    },
    {
      question: 'Giá trị của cos 60° bằng:',
      options: ['√3/2', '1/2', '√2/2', '0'],
      correctIndex: 1,
      explanation: 'cos 60° = sin 30° = 1/2.',
    },
    {
      question: 'Giá trị của tan 45° bằng:',
      options: ['0', '√3', '1', '1/√3'],
      correctIndex: 2,
      explanation: 'tan 45° = sin 45° / cos 45° = 1.',
    },
    {
      question: 'Đổi góc 180° sang đơn vị radian ta được:',
      options: ['π/2', '2π', 'π/4', 'π'],
      correctIndex: 3,
      explanation: '180° = π rad.',
    },
    {
      question: 'Công thức lượng giác cơ bản nào sau đây đúng?',
      options: ['sin²α + cos²α = 1', 'sin²α - cos²α = 1', 'sin α + cos α = 1', 'tan α + cot α = 1'],
      correctIndex: 0,
      explanation: 'Với mọi góc α, ta luôn có sin²α + cos²α = 1.',
    },
    {
      question: 'Công thức nhân đôi sin 2α bằng:',
      options: ['2 sin α', '2 sin α · cos α', 'cos²α - sin²α', 'sin α · cos α'],
      correctIndex: 1,
      explanation: 'sin 2α = 2 sin α · cos α.',
    },
    {
      question: 'Đạo hàm của hàm số y = x³ là:',
      options: ['x²', '3x', '3x²', '3x³'],
      correctIndex: 2,
      explanation: '(xⁿ)′ = n · xⁿ⁻¹ ⇒ (x³)′ = 3x².',
    },
    {
      question: 'Đạo hàm của hàm số y = sin x là:',
      options: ['-cos x', '-sin x', 'tan x', 'cos x'],
      correctIndex: 3,
      explanation: '(sin x)′ = cos x.',
    },
    {
      question: 'Giá trị của log₂ 8 bằng:',
      options: ['3', '4', '2', '8'],
      correctIndex: 0,
      explanation: 'Vì 2³ = 8 nên log₂ 8 = 3.',
    },
    {
      question: 'Với cấp số cộng (uₙ) có u₁ = 2 và công sai d = 3, giá trị u₄ bằng:',
      options: ['8', '11', '14', '9'],
      correctIndex: 1,
      explanation: 'u₄ = u₁ + 3d = 2 + 3·3 = 11.',
    },
    {
      question: 'Với cấp số nhân (uₙ) có u₁ = 2 và công bội q = 3, giá trị u₃ bằng:',
      options: ['12', '6', '18', '24'],
      correctIndex: 2,
      explanation: 'u₃ = u₁ · q² = 2 · 3² = 18.',
    },
    {
      question: 'Giá trị của cos(π/3) bằng:',
      options: ['√3/2', '√2/2', '-1/2', '1/2'],
      correctIndex: 3,
      explanation: 'π/3 = 60° ⇒ cos(π/3) = 1/2.',
    },
  ],

  // 2. TOÁN HỌC — Lật Thẻ Công Thức (Memory Match)
  'math-memory': [
    { left: 'sin²α + cos²α', right: '= 1' },
    { left: 'sin 2α', right: '2 sin α · cos α' },
    { left: 'cos 2α', right: 'cos²α - sin²α' },
    { left: 'tan α · cot α', right: '= 1' },
    { left: '(sin x)′', right: 'cos x' },
    { left: '(cos x)′', right: '-sin x' },
    { left: '(eˣ)′', right: 'eˣ' },
    { left: '(ln x)′', right: '1/x' },
    { left: 'logₐ(x · y)', right: 'logₐx + logₐy' },
    { left: 'uₙ (Cấp số cộng)', right: 'u₁ + (n - 1)d' },
    { left: 'uₙ (Cấp số nhân)', right: 'u₁ · qⁿ⁻¹' },
    { left: 'sin 30°', right: '= 1/2' },
  ],

  // 3. VẬT LÝ — Thiên Thạch Công Thức & Đơn Vị
  'physics-drop': [
    {
      question: 'Định luật II Newton',
      options: ['F = m · a', 'F = m · g', 'p = m · v', 'W = F · s'],
      correctIndex: 0,
      explanation: 'Gia tốc cùng hướng với lực tác dụng: F = m · a.',
    },
    {
      question: 'Chu kì dao động của con lắc đơn',
      options: ['T = 2π√(m/k)', 'T = 2π√(l/g)', 'T = 2π√(g/l)', 'T = (1/2π)√(l/g)'],
      correctIndex: 1,
      explanation: 'Con lắc đơn có chu kì T = 2π√(l/g).',
    },
    {
      question: 'Đơn vị chuẩn SI của Công suất (P)',
      options: ['Jun (J)', 'Niutơn (N)', 'Oát (W)', 'Héc (Hz)'],
      correctIndex: 2,
      explanation: 'Công suất có đơn vị là Oát (W = J/s).',
    },
    {
      question: 'Công thức tính Động năng của vật',
      options: ['Wđ = m · g · h', 'Wđ = m · v', 'Wđ = m · v²', 'Wđ = (1/2)m · v²'],
      correctIndex: 3,
      explanation: 'Động năng Wđ = (1/2)m · v².',
    },
    {
      question: 'Liên hệ giữa bước sóng λ, tốc độ v và tần số f',
      options: ['λ = v / f', 'λ = v · f', 'λ = f / v', 'λ = v · f²'],
      correctIndex: 0,
      explanation: 'Bước sóng λ = v · T = v / f.',
    },
    {
      question: 'Định luật Ôm cho đoạn mạch chỉ có điện trở R',
      options: ['I = U · R', 'I = U / R', 'I = R / U', 'U = I / R'],
      correctIndex: 1,
      explanation: 'Cường độ dòng điện I = U / R.',
    },
    {
      question: 'Đơn vị chuẩn SI của Tần số (f)',
      options: ['Giây (s)', 'Mét (m)', 'Héc (Hz)', 'Vôn (V)'],
      correctIndex: 2,
      explanation: 'Tần số dao động đo bằng Héc (Hz = 1/s).',
    },
    {
      question: 'Công thức tính tần số góc ω của con lắc lò xo',
      options: ['ω = √(m/k)', 'ω = 2π√(m/k)', 'ω = k / m', 'ω = √(k/m)'],
      correctIndex: 3,
      explanation: 'Con lắc lò xo có ω = √(k/m).',
    },
    {
      question: 'Khoảng vân giao thoa ánh sáng (khe Y-âng)',
      options: ['i = (λ · D) / a', 'i = (λ · a) / D', 'i = (a · D) / λ', 'i = λ · D · a'],
      correctIndex: 0,
      explanation: 'Khoảng vân giao thoa i = (λ · D) / a.',
    },
    {
      question: 'Đơn vị chuẩn SI của Điện tích (q)',
      options: ['Ampe (A)', 'Cu-lông (C)', 'Ôm (Ω)', 'Vôn (V)'],
      correctIndex: 1,
      explanation: 'Điện tích có đơn vị là Cu-lông (C).',
    },
  ],

  // 4. VẬT LÝ — Phán Xét Tốc Độ (Đúng / Sai)
  'physics-tf': [
    {
      statement: 'Trong dao động điều hòa, vận tốc biến thiên sớm pha π/2 so với li độ.',
      isTrue: true,
      explanation: 'v = x′ nên vận tốc sớm pha π/2 so với li độ x.',
    },
    {
      statement: 'Trong dao động điều hòa, gia tốc luôn cùng chiều với li độ.',
      isTrue: false,
      explanation: 'Sai! a = -ω²x nên gia tốc luôn ngược pha (ngược chiều) với li độ.',
    },
    {
      statement: 'Sóng cơ truyền được trong chân không.',
      isTrue: false,
      explanation: 'Sai! Sóng cơ chỉ truyền được trong môi trường vật chất (rắn, lỏng, khí).',
    },
    {
      statement: 'Sóng điện từ là sóng ngang và truyền được trong chân không.',
      isTrue: true,
      explanation: 'Đúng! Sóng điện từ luôn là sóng ngang và truyền được trong chân không với tốc độ c.',
    },
    {
      statement: 'Cơ năng của vật dao động điều hòa tỉ lệ thuận với bình phương biên độ A.',
      isTrue: true,
      explanation: 'W = (1/2)kA² ⇒ tỉ lệ thuận với A².',
    },
    {
      statement: 'Chu kì của con lắc đơn phụ thuộc vào khối lượng vật nặng.',
      isTrue: false,
      explanation: 'Sai! T = 2π√(l/g) không phụ thuộc vào khối lượng m.',
    },
    {
      statement: 'Hiện tượng cộng hưởng xảy ra khi tần số ngoại lực cưỡng bức bằng tần số riêng của hệ.',
      isTrue: true,
      explanation: 'Khi f = f₀ thì biên độ dao động cưỡng bức đạt cực đại (cộng hưởng).',
    },
    {
      statement: 'Tốc độ truyền âm trong chất khí lớn hơn trong chất rắn.',
      isTrue: false,
      explanation: 'Sai! Tốc độ truyền âm: v(rắn) > v(lỏng) > v(khí).',
    },
    {
      statement: 'Đơn vị của năng lượng điện và công cơ học trong hệ SI đều là Jun (J).',
      isTrue: true,
      explanation: 'Mọi dạng năng lượng và công trong hệ SI đều đo bằng Jun (J).',
    },
    {
      statement: 'Dòng điện xoay chiều có chiều không đổi theo thời gian.',
      isTrue: false,
      explanation: 'Sai! Dòng điện xoay chiều đổi chiều tuần hoàn theo thời gian.',
    },
  ],

  // 5. HÓA HỌC — Phòng Thí Nghiệm Phản Ứng
  'chem-reaction': [
    {
      question: 'Fe + 2HCl → ? + H₂↑',
      options: ['FeCl₂', 'FeCl₃', 'Fe(OH)₂', 'FeO'],
      correctIndex: 0,
      explanation: 'Sắt tác dụng với dung dịch HCl loãng tạo muối sắt(II) clorua FeCl₂ và khí H₂.',
    },
    {
      question: 'Dung dịch NaOH làm quỳ tím chuyển sang màu gì?',
      options: ['Đỏ', 'Xanh', 'Vàng', 'Không đổi màu'],
      correctIndex: 1,
      explanation: 'Dung dịch bazơ (kiềm) làm quỳ tím chuyển sang màu xanh.',
    },
    {
      question: 'Cho dung dịch AgNO₃ tác dụng với dung dịch NaCl tạo kết tủa màu gì?',
      options: ['Vàng đậm', 'Nâu đỏ', 'Trắng (AgCl)', 'Xanh lam'],
      correctIndex: 2,
      explanation: 'Ag⁺ + Cl⁻ → AgCl↓ (kết tủa màu trắng).',
    },
    {
      question: 'Phản ứng giữa axit cacboxylic và ancol (xúc tác H₂SO₄ đặc, t°) gọi là phản ứng:',
      options: ['Trùng hợp', 'Thủy phân', 'Xà phòng hóa', 'Este hóa'],
      correctIndex: 3,
      explanation: 'Axit cacboxylic + Ancol ⇌ Este + H₂O là phản ứng este hóa.',
    },
    {
      question: 'Nhỏ dung dịch BaCl₂ vào dung dịch Na₂SO₄ thu được kết tủa trắng nào?',
      options: ['BaSO₄', 'NaCl', 'Ba(OH)₂', 'BaCO₃'],
      correctIndex: 0,
      explanation: 'Ba²⁺ + SO₄²⁻ → BaSO₄↓ (trắng, không tan trong axit mạnh).',
    },
    {
      question: 'Cu(OH)₂ kết tủa có màu đặc trưng là:',
      options: ['Nâu đỏ', 'Xanh lam', 'Trắng xanh', 'Đen'],
      correctIndex: 1,
      explanation: 'Đồng(II) hiđroxit Cu(OH)₂ là kết tủa màu xanh lam.',
    },
    {
      question: 'Sục khí CO₂ dư vào dung dịch Ca(OH)₂ ban đầu xuất hiện kết tủa trắng:',
      options: ['CaO', 'CaCl₂', 'CaCO₃', 'Ca(HCO₃)₂'],
      correctIndex: 2,
      explanation: 'CO₂ + Ca(OH)₂ → CaCO₃↓ (trắng) + H₂O.',
    },
    {
      question: 'Khí nào sau đây làm mất màu dung dịch nước brom (Br₂)?',
      options: ['CH₄ (Metan)', 'CO₂', 'N₂', 'C₂H₄ (Etilen)'],
      correctIndex: 3,
      explanation: 'Etilen (CH₂=CH₂) có liên kết đôi nên phản ứng cộng làm mất màu dung dịch Br₂.',
    },
    {
      question: 'Fe(OH)₃ kết tủa có màu gì?',
      options: ['Nâu đỏ', 'Trắng xanh', 'Xanh lam', 'Vàng nhạt'],
      correctIndex: 0,
      explanation: 'Sắt(III) hiđroxit Fe(OH)₃ có màu nâu đỏ đặc trưng.',
    },
    {
      question: 'Glucozơ (C₆H₁₂O₆) tác dụng với dung dịch AgNO₃/NH₃ tạo ra hiện tượng gì?',
      options: ['Sủi bọt khí', 'Kết tủa bạc trắng sáng (tráng bạc)', 'Kết tủa xanh', 'Không phản ứng'],
      correctIndex: 1,
      explanation: 'Glucozơ có nhóm -CHO nên tham gia phản ứng tráng bạc tạo lớp Ag sáng bóng.',
    },
  ],

  // 6. HÓA HỌC — Săn Nguyên Tố & Nguyên Tử Khối
  'chem-element': [
    {
      question: 'Nguyên tử khối (M) của Sắt (Fe) bằng:',
      options: ['56', '64', '52', '40'],
      correctIndex: 0,
      explanation: 'M(Fe) = 56 g/mol.',
    },
    {
      question: 'Nguyên tử khối (M) của Đồng (Cu) bằng:',
      options: ['56', '64', '65', '108'],
      correctIndex: 1,
      explanation: 'M(Cu) = 64 g/mol.',
    },
    {
      question: 'Ký hiệu hóa học của nguyên tố Bạc (M = 108) là:',
      options: ['Au', 'Al', 'Ag', 'Ar'],
      correctIndex: 2,
      explanation: 'Bạc có ký hiệu hóa học là Ag (Argentum), M = 108.',
    },
    {
      question: 'Nguyên tử khối (M) của Lưu huỳnh (S) bằng:',
      options: ['16', '31', '35,5', '32'],
      correctIndex: 3,
      explanation: 'M(S) = 32 g/mol.',
    },
    {
      question: 'Nguyên tử khối (M) của Nhôm (Al) bằng:',
      options: ['27', '24', '23', '39'],
      correctIndex: 0,
      explanation: 'M(Al) = 27 g/mol, hóa trị III.',
    },
    {
      question: 'Nguyên tử khối (M) của Canxi (Ca) bằng:',
      options: ['24', '40', '39', '56'],
      correctIndex: 1,
      explanation: 'M(Ca) = 40 g/mol, hóa trị II.',
    },
    {
      question: 'Hóa trị phổ biến của Nhôm (Al) trong các hợp chất là:',
      options: ['I', 'II', 'III', 'IV'],
      correctIndex: 2,
      explanation: 'Nhôm thuộc nhóm IIIA, luôn có hóa trị III trong hợp chất.',
    },
    {
      question: 'Nguyên tử khối (M) của Clo (Cl) bằng:',
      options: ['32', '19', '39', '35,5'],
      correctIndex: 3,
      explanation: 'M(Cl) = 35,5 g/mol.',
    },
    {
      question: 'Nguyên tử khối (M) của Kẽm (Zn) bằng:',
      options: ['65', '64', '56', '137'],
      correctIndex: 0,
      explanation: 'M(Zn) = 65 g/mol, hóa trị II.',
    },
    {
      question: 'Ký hiệu hóa học của Kali (M = 39) là:',
      options: ['Ca', 'K', 'P', 'Na'],
      correctIndex: 1,
      explanation: 'Kali có ký hiệu là K (Kalium), M = 39.',
    },
    {
      question: 'Nguyên tử khối (M) của Natri (Na) bằng:',
      options: ['24', '27', '23', '14'],
      correctIndex: 2,
      explanation: 'M(Na) = 23 g/mol, hóa trị I.',
    },
    {
      question: 'Nguyên tử khối (M) của Bari (Ba) bằng:',
      options: ['108', '88', '127', '137'],
      correctIndex: 3,
      explanation: 'M(Ba) = 137 g/mol, hóa trị II.',
    },
  ],

  // 7. TIẾNG ANH — Xếp Chữ Săn Từ (Word Scramble)
  'eng-scramble': [
    { word: 'ENVIRONMENT', meaning: 'Môi trường', phonetic: '/ɪnˈvaɪ.rən.mənt/', hint: 'Bắt đầu bằng EN...' },
    { word: 'GENERATION', meaning: 'Thế hệ', phonetic: '/ˌdʒen.əˈreɪ.ʃən/', hint: 'Khoảng cách thế hệ: ... gap' },
    { word: 'SUSTAINABLE', meaning: 'Bền vững', phonetic: '/səˈsteɪ.nə.bəl/', hint: 'Phát triển bền vững' },
    { word: 'TECHNOLOGY', meaning: 'Công nghệ', phonetic: '/tekˈnɒl.ə.dʒi/', hint: 'Bắt đầu bằng TECH...' },
    { word: 'INDEPENDENT', meaning: 'Độc lập, tự lập', phonetic: '/ˌɪn.dɪˈpen.dənt/', hint: 'Bắt đầu bằng IN...' },
    { word: 'VOLUNTEER', meaning: 'Tình nguyện viên', phonetic: '/ˌvɒl.ənˈtɪər/', hint: 'Hoạt động cộng đồng' },
    { word: 'CONTRIBUTE', meaning: 'Đóng góp', phonetic: '/kənˈtrɪb.juːt/', hint: '... to society' },
    { word: 'CHALLENGE', meaning: 'Thử thách', phonetic: '/ˈtʃæl.ɪndʒ/', hint: 'Bắt đầu bằng CH...' },
    { word: 'EDUCATION', meaning: 'Giáo dục', phonetic: '/ˌedʒ.uˈkeɪ.ʃən/', hint: 'Bắt đầu bằng EDU...' },
    { word: 'POLLUTION', meaning: 'Sự ô nhiễm', phonetic: '/pəˈluː.ʃən/', hint: 'Air / Water ...' },
  ],

  // 8. TIẾNG ANH — Nối Nghĩa Siêu Tốc (Vocab Speed Link)
  'eng-link': [
    { left: 'sustainable', right: 'bền vững' },
    { left: 'generation gap', right: 'khoảng cách thế hệ' },
    { left: 'take part in', right: 'tham gia vào' },
    { left: 'look forward to', right: 'mong đợi' },
    { left: 'carbon footprint', right: 'dấu chân carbon' },
    { left: 'contribute to', right: 'đóng góp vào' },
    { left: 'renewable energy', right: 'năng lượng tái tạo' },
    { left: 'make a decision', right: 'đưa ra quyết định' },
    { left: 'global warming', right: 'sự nóng lên toàn cầu' },
    { left: 'adapt to', right: 'thích nghi với' },
    { left: 'cultural heritage', right: 'di sản văn hóa' },
    { left: 'be responsible for', right: 'chịu trách nhiệm về' },
    { left: 'critical thinking', right: 'tư duy phản biện' },
    { left: 'carry out', right: 'tiến hành, thực hiện' },
    { left: 'raise awareness', right: 'nâng cao nhận thức' },
  ],
};
