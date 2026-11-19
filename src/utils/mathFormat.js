const SUPERSCRIPT_MAP = {
  '0': '⁰',
  '1': '¹',
  '2': '²',
  '3': '³',
  '4': '⁴',
  '5': '⁵',
  '6': '⁶',
  '7': '⁷',
  '8': '⁸',
  '9': '⁹',
  '+': '⁺',
  '-': '⁻',
  '=': '⁼',
  '(': '⁽',
  ')': '⁾',
  n: 'ⁿ',
  i: 'ⁱ',
};

const SUBSCRIPT_MAP = {
  '0': '₀',
  '1': '₁',
  '2': '₂',
  '3': '₃',
  '4': '₄',
  '5': '₅',
  '6': '₆',
  '7': '₇',
  '8': '₈',
  '9': '₉',
  '+': '₊',
  '-': '₋',
  '=': '₌',
  '(': '₍',
  ')': '₎',
  a: 'ₐ',
  e: 'ₑ',
  i: 'ᵢ',
  k: 'ₖ',
  m: 'ₘ',
  n: 'ₙ',
  o: 'ₒ',
  p: 'ₚ',
  r: 'ᵣ',
  s: 'ₛ',
  t: 'ₜ',
  u: 'ᵤ',
  v: 'ᵥ',
  x: 'ₓ',
};

function toMappedScript(str, map) {
  let out = '';
  for (const ch of str) {
    if (!map[ch]) return null;
    out += map[ch];
  }
  return out;
}

/**
 * Tìm nội dung bên trong cặp ngoặc nhọn {...} bắt đầu tại vị trí startIdx
 */
function readBraceGroup(str, startIdx) {
  if (str[startIdx] !== '{') return null;
  let depth = 0;
  for (let i = startIdx; i < str.length; i++) {
    if (str[i] === '{') depth += 1;
    else if (str[i] === '}') {
      depth -= 1;
      if (depth === 0) {
        return {
          content: str.slice(startIdx + 1, i),
          endIdx: i + 1,
        };
      }
    }
  }
  return null;
}

/**
 * Đổi các biểu thức \frac{a}{b}, \dfrac{a}{b}, \tfrac{a}{b} sang dạng phân số dễ đọc
 */
function replaceFractions(input) {
  let text = input;
  const fracRegex = /\\(?:d|t)?frac\s*(?=\{)/g;
  let safety = 0;

  while (safety < 30) {
    fracRegex.lastIndex = 0;
    const match = fracRegex.exec(text);
    if (!match) break;
    safety += 1;

    const numStart = match.index + match[0].length;
    const numGroup = readBraceGroup(text, numStart);
    if (!numGroup) break;

    let denStart = numGroup.endIdx;
    while (denStart < text.length && /\s/.test(text[denStart])) denStart += 1;
    const denGroup = readBraceGroup(text, denStart);
    if (!denGroup) break;

    const rawNum = replaceFractions(numGroup.content).trim();
    const rawDen = replaceFractions(denGroup.content).trim();

    const needsParen = (expr) => /[+\-*/]/.test(expr.replace(/^-/, '')) && !/^\(.*\)$/.test(expr);
    const numStr = needsParen(rawNum) ? `(${rawNum})` : rawNum;
    const denStr = needsParen(rawDen) ? `(${rawDen})` : rawDen;

    text = text.slice(0, match.index) + `${numStr}/${denStr}` + text.slice(denGroup.endIdx);
  }

  return text;
}

/**
 * Đổi \sqrt{x} và \sqrt[n]{x} sang ký hiệu căn thức √
 */
function replaceSqrt(input) {
  let text = input;
  const sqrtRegex = /\\sqrt(?:\[([^\]]+)\])?\s*(?=\{)/g;
  let safety = 0;

  while (safety < 30) {
    sqrtRegex.lastIndex = 0;
    const match = sqrtRegex.exec(text);
    if (!match) break;
    safety += 1;

    const rootIndex = match[1] ? match[1].trim() : '';
    const argStart = match.index + match[0].length;
    const argGroup = readBraceGroup(text, argStart);
    if (!argGroup) break;

    const inner = replaceSqrt(argGroup.content).trim();
    const isSimple = /^[a-zA-Z0-9α-ωΑ-Ωπ]+$/.test(inner);
    const body = isSimple ? inner : `(${inner})`;
    const supRoot = rootIndex ? toMappedScript(rootIndex, SUPERSCRIPT_MAP) || `${rootIndex}` : '';
    const prefix = rootIndex === '3' ? '∛' : rootIndex === '4' ? '∜' : `${supRoot}√`;

    text = text.slice(0, match.index) + `${prefix}${body}` + text.slice(argGroup.endIdx);
  }

  return text;
}

/**
 * Chuyển đổi mã LaTeX sang ký hiệu toán học Unicode rõ ràng, dễ đọc, giữ nguyên xuống dòng
 */
export function formatMathText(raw) {
  if (raw === null || raw === undefined) return '';
  let text = String(raw);
  if (!text) return '';

  // Xóa ký tự ngăn cách LaTeX $...$, $$...$$, \(...\), \[...\]
  text = text
    .replace(/\$\$([\s\S]*?)\$\$/g, '$1')
    .replace(/\$([^$\n]+?)\$/g, '$1')
    .replace(/\\\(([\s\S]*?)\\\)/g, '$1')
    .replace(/\\\[([\s\S]*?)\\\]/g, '$1');

  // Mở bọc \text{...}, \mathrm{...}, \mathbf{...}, \textit{...}, \operatorname{...}
  text = text.replace(
    /\\(?:text|mathrm|mathbf|mathit|textit|textbf|operatorname|mathbb|mathcal)\{([^{}]*)\}/g,
    '$1'
  );

  // Xóa \left, \right, \displaystyle, \, \; \: \!
  text = text
    .replace(/\\(?:left|right|displaystyle|textstyle)\b/g, '')
    .replace(/\\[,;:!]/g, ' ');

  // Chuyển đổi căn thức & phân số
  text = replaceSqrt(text);
  text = replaceFractions(text);

  // Ký hiệu độ
  text = text
    .replace(/\^\s*\{\s*\\circ\s*\}/g, '°')
    .replace(/\^\s*\\circ\b/g, '°')
    .replace(/\\(?:degree|circ)\b/g, '°');

  // Chữ cái Hy Lạp & hằng số toán học
  const symbolReplacements = [
    [/\\alpha\b/g, 'α'],
    [/\\beta\b/g, 'β'],
    [/\\gamma\b/g, 'γ'],
    [/\\Gamma\b/g, 'Γ'],
    [/\\delta\b/g, 'δ'],
    [/\\Delta\b/g, 'Δ'],
    [/\\varepsilon\b|\\epsilon\b/g, 'ε'],
    [/\\zeta\b/g, 'ζ'],
    [/\\eta\b/g, 'η'],
    [/\\vartheta\b|\\theta\b/g, 'θ'],
    [/\\Theta\b/g, 'Θ'],
    [/\\lambda\b/g, 'λ'],
    [/\\Lambda\b/g, 'Λ'],
    [/\\mu\b/g, 'μ'],
    [/\\nu\b/g, 'ν'],
    [/\\xi\b/g, 'ξ'],
    [/\\pi\b/g, 'π'],
    [/\\Pi\b/g, 'Π'],
    [/\\rho\b/g, 'ρ'],
    [/\\sigma\b/g, 'σ'],
    [/\\Sigma\b/g, 'Σ'],
    [/\\tau\b/g, 'τ'],
    [/\\varphi\b|\\phi\b/g, 'φ'],
    [/\\Phi\b/g, 'Φ'],
    [/\\psi\b/g, 'ψ'],
    [/\\omega\b/g, 'ω'],
    [/\\Omega\b/g, 'Ω'],
    [/\\infty\b/g, '∞'],

    // Toán tử & quan hệ
    [/\\cdot\b/g, '·'],
    [/\\times\b/g, '×'],
    [/\\div\b/g, '÷'],
    [/\\pm\b/g, '±'],
    [/\\mp\b/g, '∓'],
    [/\\leq\b|\\le\b/g, '≤'],
    [/\\geq\b|\\ge\b/g, '≥'],
    [/\\neq\b|\\ne\b/g, '≠'],
    [/\\approx\b/g, '≈'],
    [/\\equiv\b/g, '≡'],
    [/\\sim\b/g, '∼'],
    [/\\propto\b/g, '∝'],
    [/\\Rightarrow\b|\\implies\b/g, '⇒'],
    [/\\Leftrightarrow\b|\\iff\b/g, '⇔'],
    [/\\rightarrow\b|\\to\b/g, '→'],
    [/\\leftarrow\b/g, '←'],
    [/\\in\b/g, '∈'],
    [/\\notin\b/g, '∉'],
    [/\\subseteq\b/g, '⊆'],
    [/\\subset\b/g, '⊂'],
    [/\\cup\b/g, '∪'],
    [/\\cap\b/g, '∩'],
    [/\\emptyset\b|\\varnothing\b/g, '∅'],
    [/\\forall\b/g, '∀'],
    [/\\exists\b/g, '∃'],
    [/\\angle\b/g, '∠'],
    [/\\perp\b/g, '⊥'],
    [/\\parallel\b/g, '∥'],
    [/\\triangle\b/g, '△'],
    [/\\cdots\b|\\ldots\b|\\dots\b/g, '…'],
    [/\\quad\b|\\qquad\b/g, ' '],

    // Hàm lượng giác, log, lim
    [/\\(sin|cos|tan|cot|sec|csc|arcsin|arccos|arctan|ln|log|lg|lim|max|min|det|gcd)\b/g, '$1'],
  ];

  for (const [pattern, replacement] of symbolReplacements) {
    text = text.replace(pattern, replacement);
  }

  // Vector \vec{a} -> a⃗
  text = text.replace(/\\vec\{([^{}]+)\}/g, '$1⃗');
  text = text.replace(/\\overrightarrow\{([^{}]+)\}/g, '$1⃗');
  text = text.replace(/\\overline\{([^{}]+)\}/g, '$1̄');

  // Số mũ: ^{...} hoặc ^x
  text = text.replace(/\^\{([^{}]+)\}/g, (_, exp) => {
    const mapped = toMappedScript(exp.trim(), SUPERSCRIPT_MAP);
    return mapped || `^(${exp.trim()})`;
  });
  text = text.replace(/\^([0-9n])/g, (_, ch) => SUPERSCRIPT_MAP[ch] || `^${ch}`);

  // Chỉ số dưới: _{...} hoặc _x
  text = text.replace(/_\{([^{}]+)\}/g, (_, sub) => {
    const mapped = toMappedScript(sub.trim(), SUBSCRIPT_MAP);
    return mapped || `_${sub.trim()}`;
  });
  text = text.replace(/_([0-9])/g, (_, ch) => SUBSCRIPT_MAP[ch] || `_${ch}`);

  // Dọn dấu ngoặc nhọn dư thừa từ LaTeX (nhưng không đụng ngoặc tập hợp nếu có khoảng trắng hoặc dấu phẩy/chấm phẩy)
  text = text.replace(/\\\{/g, '{').replace(/\\\}/g, '}');

  // Dọn khoảng trắng thừa trên từng dòng (giữ nguyên ký tự xuống dòng \n)
  text = text
    .split('\n')
    .map((line) => line.replace(/[ \t]{2,}/g, ' ').trimEnd())
    .join('\n');

  return text;
}
