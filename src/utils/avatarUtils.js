// Tiện ích tạo Avatar mặc định trung tính, hiện đại, phù hợp với mọi người dùng (SVG offline 100%)

const LEGACY_UNSPLASH_AVATARS = [
  'photo-1534528741775-53994a69daeb',
];

const AVATAR_PALETTES = [
  ['#6366f1', '#8b5cf6'], // Indigo -> Violet
  ['#0ea5e9', '#6366f1'], // Sky -> Indigo
  ['#10b981', '#0d9488'], // Emerald -> Teal
  ['#3b82f6', '#2563eb'], // Blue
  ['#8b5cf6', '#d946ef'], // Violet -> Fuchsia
  ['#f59e0b', '#ea580c'], // Amber -> Orange
  ['#06b6d4', '#0284c7'], // Cyan -> Sky
];

const ADMIN_PALETTE = ['#4f46e5', '#7c3aed'];

export function isLegacyDefaultAvatar(url) {
  const clean = String(url || '').trim();
  if (!clean) return true;
  return LEGACY_UNSPLASH_AVATARS.some((marker) => clean.includes(marker));
}

export function getUserInitials(name = '') {
  const clean = String(name || '')
    .trim()
    .replace(/\s+/g, ' ');
  if (!clean) return '';
  const parts = clean.split(' ').filter(Boolean);
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  const first = parts[parts.length - 2]?.[0] || '';
  const last = parts[parts.length - 1]?.[0] || '';
  return `${first}${last}`.toUpperCase();
}

function pickPalette(seed = '', role = 'student') {
  if (role === 'admin') return ADMIN_PALETTE;
  let hash = 0;
  const s = String(seed || 'user');
  for (let i = 0; i < s.length; i += 1) {
    hash = (hash * 31 + s.charCodeAt(i)) >>> 0;
  }
  return AVATAR_PALETTES[hash % AVATAR_PALETTES.length];
}

function escapeXml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Tạo SVG Data URL avatar mặc định trung tính (chữ cái viết tắt trên nền gradient hoặc icon người tối giản)
 */
export function getDefaultAvatarDataUrl(name = '', role = 'student') {
  const initials = getUserInitials(name);
  const [c1, c2] = pickPalette(name, role);

  const centerContent = initials
    ? `<text x="64" y="67" text-anchor="middle" dominant-baseline="central" fill="#ffffff" font-family="Roboto, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif" font-size="46" font-weight="700" letter-spacing="-1">${escapeXml(
        initials,
      )}</text>`
    : `<circle cx="64" cy="48" r="20" fill="#ffffff" fill-opacity="0.92" />
       <path d="M28 106 C30 82, 46 72, 64 72 C82 72, 98 82, 100 106" fill="#ffffff" fill-opacity="0.92" />`;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128">
    <defs>
      <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${c1}" />
        <stop offset="100%" stop-color="${c2}" />
      </linearGradient>
    </defs>
    <rect width="128" height="128" rx="32" fill="url(#g)" />
    <circle cx="96" cy="24" r="34" fill="#ffffff" fill-opacity="0.12" />
    <circle cx="24" cy="112" r="28" fill="#000000" fill-opacity="0.08" />
    ${centerContent}
  </svg>`;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

/**
 * Trả về avatar hợp lệ cho người dùng:
 * - Nếu người dùng có avatar tùy chỉnh thật -> giữ nguyên
 * - Nếu trống hoặc là ảnh Unsplash mặc định cũ -> dùng avatar chữ cái/trung tính mới
 */
export function resolveUserAvatar(avatarUrl, name = '', role = 'student') {
  if (!isLegacyDefaultAvatar(avatarUrl)) {
    return avatarUrl;
  }
  return getDefaultAvatarDataUrl(name, role);
}
