/* Sistem ekstraksi 5 warna palet dari cover album pakai Canvas dan kalkulasi warna */

import { loadPaletteCache, savePaletteCache } from './storage';

const PALETTE_SIZE = 5;

/* Cache di memori biar warna palet langsung muncul tanpa kedip pas ganti halaman */
const memoryCache = new Map();

/* Deretan rumus konversi warna: ubah format dari HEX ke RGB, RGB ke HSL, sampai balik ke HEX lagi */

const clamp = function (value, min, max) {
  return Math.min(max, Math.max(min, value));
};

export function hexToRgb(hex) {
  const clean = String(hex).replace('#', '');
  const full =
    clean.length === 3
      ? clean
          .split('')
          .map((c) => c + c)
          .join('')
      : clean;
  const int = Number.parseInt(full, 16);
  if (Number.isNaN(int)) return { r: 0, g: 0, b: 0 };
  return {
    r: (int >> 16) & 255,
    g: (int >> 8) & 255,
    b: int & 255,
  };
}

function rgbToHex({ r, g, b }) {
  const toHex = (n) => clamp(Math.round(n), 0, 255).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export function rgbToHsl({ r, g, b }) {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const delta = max - min;
  let h = 0;

  if (delta !== 0) {
    if (max === rn) h = ((gn - bn) / delta) % 6;
    else if (max === gn) h = (bn - rn) / delta + 2;
    else h = (rn - gn) / delta + 4;
    h *= 60;
    if (h < 0) h += 360;
  }

  const l = (max + min) / 2;
  const s = delta === 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));
  return { h, s, l };
}

function hslToRgb({ h, s, l }) {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const hp = ((h % 360) + 360) % 360 / 60;
  const x = c * (1 - Math.abs((hp % 2) - 1));
  let rgb;

  if (hp >= 0 && hp < 1) rgb = [c, x, 0];
  else if (hp < 2) rgb = [x, c, 0];
  else if (hp < 3) rgb = [0, c, x];
  else if (hp < 4) rgb = [0, x, c];
  else if (hp < 5) rgb = [x, 0, c];
  else rgb = [c, 0, x];

  const m = l - c / 2;
  return {
    r: Math.round((rgb[0] + m) * 255),
    g: Math.round((rgb[1] + m) * 255),
    b: Math.round((rgb[2] + m) * 255),
  };
}

export function hslToHex(hsl) {
  return rgbToHex(hslToRgb(hsl));
}

/* Jaga batas saturasi dan terangnya biar warna swatch tetap mirip sama aslinya */
function temperColor(hex) {
  const hsl = rgbToHsl(hexToRgb(hex));
  const isAchromatic = hsl.s < 0.08;
  return hslToHex({
    h: hsl.h,
    s: isAchromatic ? hsl.s : clamp(hsl.s, 0.08, 0.86),
    l: clamp(hsl.l, 0.14, 0.88),
  });
}

/* Hitung jarak selisih warna biar nggak ada 2 warna swatch yang terlalu mirip atau kembar */
function colorDistance(a, b) {
  const c1 = hexToRgb(a);
  const c2 = hexToRgb(b);
  const rMean = (c1.r + c2.r) / 2;
  const dr = c1.r - c2.r;
  const dg = c1.g - c2.g;
  const db = c1.b - c2.b;
  return Math.sqrt(
    (2 + rMean / 256) * dr * dr + 4 * dg * dg + (2 + (255 - rMean) / 256) * db * db,
  );
}

/* Fungsi ini ngecek kontras biar teks di atas background warna tetap kebaca dengan jelas */
export function getReadableInk(hex) {
  const { r, g, b } = hexToRgb(hex);
  const channel = (v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  const luminance = 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
  return luminance > 0.45 ? '#262622' : '#F6F4EE';
}

/* Palet cadangan yang konsisten kalau gambar cover gagal ke-load */

function hashString(input) {
  let hash = 2166136261;
  const str = String(input);
  for (let i = 0; i < str.length; i += 1) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

/* Rumus acak berbasis judul lagu biar album yang sama selalu dapet warna yang konsisten */
function createRandom(seed) {
  let state = seed || 1;
  return function random() {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function buildFallbackPalette(album = {}) {
  if (Array.isArray(album.curatedPalette) && album.curatedPalette.length >= 4) {
    return album.curatedPalette.slice(0, PALETTE_SIZE);
  }

  const seedSource =
    album.collectionId ||
    `${album.collectionName || album.title || ''}-${album.artistName || album.artist || ''}` ||
    'sunroom';
  const random = createRandom(hashString(seedSource));

  const baseHue = Math.floor(random() * 360);
  /* Variasi nada warna biar hasilnya tetap serasi dan enak dilihat */
  const spreads = [0, 12, -14, 24, -22];
  const lightnessSteps = [0.52, 0.66, 0.38, 0.74, 0.28];
  const colors = spreads.map((offset, index) => {
    const hue = (baseHue + offset + 360) % 360;
    const saturation = 0.28 + random() * 0.28;
    const lightness = lightnessSteps[index] + (random() - 0.5) * 0.06;
    return hslToHex({ h: hue, s: saturation, l: clamp(lightness, 0.22, 0.82) });
  });

  return colors;
}

/* Comot warna asli dari cover album lewat bantuan elemen Canvas */

function loadImage(url) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    /* Pasang crossOrigin sebelum src biar browser ngizinin canvas ngebaca data pikselnya */
    image.crossOrigin = 'anonymous';
    image.decoding = 'async';
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('image-load-failed'));
    image.src = url;
  });
}

function sampleImage(image) {
  const size = 72;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('no-canvas-context');

  context.drawImage(image, 0, 0, size, size);
  /* Tarik seluruh susunan data piksel gambar dari canvas pakai getImageData */
  const { data } = context.getImageData(0, 0, size, size);

  const buckets = new Map();
  for (let i = 0; i < data.length; i += 4) {
    const alpha = data[i + 3];
    if (alpha < 128) continue;

    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const hsl = rgbToHsl({ r, g, b });

    /* Tampung berbagai gradasi warna dari yang gelap sampai krem terang */
    if (hsl.l < 0.04 || hsl.l > 0.97) continue;

    /* Kumpulin piksel-piksel yang warnanya mirip ke dalam kelompok yang sama */
    const key = `${r >> 4}-${g >> 4}-${b >> 4}`;
    const existing = buckets.get(key);
    if (existing) {
      existing.count += 1;
      existing.r += r;
      existing.g += g;
      existing.b += b;
    } else {
      buckets.set(key, { count: 1, r, g, b });
    }
  }

  const ranked = [...buckets.values()]
    .sort((a, b) => b.count - a.count)
    .map((bucket) =>
      temperColor(
        rgbToHex({
          r: bucket.r / bucket.count,
          g: bucket.g / bucket.count,
          b: bucket.b / bucket.count,
        }),
      ),
    );

  /* Saring 5 warna paling dominan bertahap pakai perulangan for */
  const picked = [];
  const thresholds = [38, 24, 14, 7, 0];

  for (const minDistance of thresholds) {
    for (const color of ranked) {
      if (picked.length >= PALETTE_SIZE) break;
      if (picked.includes(color) && minDistance > 0) continue;
      const farEnough = picked.every((chosen) => colorDistance(chosen, color) > minDistance);
      if (farEnough) picked.push(color);
    }
    if (picked.length >= PALETTE_SIZE) break;
  }

  /* Lengkapi sendiri jadi 5 warna senada kalau cover cuma punya satu warna polos */
  if (picked.length > 0 && picked.length < PALETTE_SIZE) {
    const baseHsl = rgbToHsl(hexToRgb(picked[0]));
    const steps = [-0.14, 0.1, -0.07, 0.18, -0.2];
    let stepIdx = 0;
    do {
      const delta = steps[stepIdx % steps.length];
      picked.push(
        hslToHex({
          h: baseHsl.h,
          s: baseHsl.s,
          l: clamp(baseHsl.l + delta, 0.14, 0.88),
        }),
      );
      stepIdx += 1;
    } while (picked.length < PALETTE_SIZE);
  }

  return picked.slice(0, PALETTE_SIZE);
}

async function extractFromArtwork(url) {
  if (!url) return [];
  try {
    const image = await loadImage(url);
    return sampleImage(image);
  } catch {
    return [];
  }
}

/* Fungsi utama buat ngambil palet warna album */

/* Ambil palet awal langsung dari cache atau rumus cepat biar halaman nggak kosong */
export function getInitialPalette(album) {
  const key = String(album?.collectionId ?? '');
  if (key && memoryCache.has(key)) return memoryCache.get(key);

  const cached = key ? loadPaletteCache()[key] : null;
  if (Array.isArray(cached) && cached.length >= 4) {
    if (key) memoryCache.set(key, cached);
    return cached;
  }

  return buildFallbackPalette(album);
}

function padPalette(colors, album) {
  const fallback = buildFallbackPalette(album);
  const result = [...colors];
  for (const color of fallback) {
    if (result.length >= PALETTE_SIZE) break;
    const farEnough = result.every((chosen) => colorDistance(chosen, color) > 24);
    if (farEnough) result.push(color);
  }
  /* Pastikan jumlah warna pas 5 kotak swatch pakai perulangan while */
  while (result.length < PALETTE_SIZE) {
    result.push(fallback[result.length % fallback.length]);
  }
  return result.slice(0, PALETTE_SIZE);
}

/* Jalankan ekstraksi gambar asli, lalu simpan hasilnya ke cache lokal */
export async function getAlbumPalette(album) {
  const key = String(album?.collectionId ?? '');

  if (key && memoryCache.has(key)) return memoryCache.get(key);

  const stored = key ? loadPaletteCache()[key] : null;
  if (Array.isArray(stored) && stored.length >= 4) {
    if (key) memoryCache.set(key, stored);
    return stored;
  }

  const artworkUrl = album?.artworkUrl600 || album?.artworkUrl100;
  const extracted = await extractFromArtwork(artworkUrl);
  const palette =
    extracted.length >= 1 ? padPalette(extracted, album) : buildFallbackPalette(album);

  if (key) {
    memoryCache.set(key, palette);
    try {
      const cache = loadPaletteCache();
      cache[key] = palette;
      savePaletteCache(cache);
    } catch {
      /* Tetap jalan lancar meskipun penyimpanan ke cache mengalami kendala */
    }
  }

  return palette;
}

/* Kelompokkan kategori mood pakai percabangan switch-case */
function resolveMoodCategoryTag(moodId) {
  switch (moodId) {
    case 'golden-hour':
      return 'Golden hour';
    case 'afterglow':
      return 'Afterglow';
    case 'nostalgic':
      return 'Nostalgic';
    case 'melancholy':
      return 'Melancholy';
    case 'euphoric':
      return 'Euphoric';
    case 'dreamy':
    default:
      return 'Dreamy';
  }
}

/* Baca nuansa warna palet buat nentuin kata rasa sama kalimat kutipannya */
export function derivePaletteMood(palette = [], activeSwatchIndex = 0) {
  if (!Array.isArray(palette) || palette.length === 0) {
    return {
      moodId: 'melancholy',
      moodCategory: resolveMoodCategoryTag('melancholy'),
      moodLabel: 'Melancholy',
      word: 'Melancholy.',
      quote: 'Quiet songs for late nights when you just want to sit with your own thoughts.',
    };
  }

  const primaryHex = palette[typeof activeSwatchIndex === 'number' ? activeSwatchIndex : 0] || palette[0];
  const primaryRgb = hexToRgb(primaryHex);

  let sumR = primaryRgb.r * 2;
  let sumG = primaryRgb.g * 2;
  let sumB = primaryRgb.b * 2;
  let weight = 2;

  palette.forEach((hex) => {
    const rgb = hexToRgb(hex);
    sumR += rgb.r;
    sumG += rgb.g;
    sumB += rgb.b;
    weight += 1;
  });

  const { h, s, l } = rgbToHsl({
    r: Math.round(sumR / weight),
    g: Math.round(sumG / weight),
    b: Math.round(sumB / weight),
  });

  /* Kalau warnanya monokrom kayak abu-abu atau hitam */
  if (s < 0.15) {
    if (l < 0.45) {
      return {
        moodId: 'melancholy',
        moodLabel: 'Solitude',
        word: 'Solitude.',
        quote: 'Quiet monochrome shadows and a calm space away from all the noise.',
      };
    }
    return {
      moodId: 'dreamy',
      moodLabel: 'Stillness',
      word: 'Stillness.',
      quote: 'Soft silver light and unhurried melodies that let your mind rest.',
    };
  }

  /* Kalau warnanya hijau segar padang rumput atau mint (contoh: Lifelike) */
  if (h >= 72 && h < 175) {
    if (l >= 0.44) {
      return {
        moodId: 'dreamy',
        moodLabel: 'Serene',
        word: 'Serene.',
        quote: 'Fresh meadow greens and open skies where your mind has room to breathe.',
      };
    }
    return {
      moodId: 'melancholy',
      moodLabel: 'Stillness',
      word: 'Stillness.',
      quote: 'Deep forest shades and unhurried tunes that slow the whole room down.',
    };
  }

  /* Kalau didominasi warna biru langit atau laut (contoh: purple, Gravits, kinoue64) */
  if (h >= 175 && h < 248) {
    if (l >= 0.56) {
      return {
        moodId: 'dreamy',
        moodLabel: 'Dreamy',
        word: 'Dreamy.',
        quote: 'Soft periwinkle blues and weightless melodies drifting across a quiet sky.',
      };
    }
    if (h < 208) {
      return {
        moodId: 'dreamy',
        moodLabel: 'Tranquil',
        word: 'Tranquil.',
        quote: 'Cool water reflections and gentle chords floating in the afternoon stillness.',
      };
    }
    return {
      moodId: 'melancholy',
      moodLabel: 'Melancholy',
      word: 'Melancholy.',
      quote: 'Deep twilight blue and honest melodies for late nights lost in thought.',
    };
  }

  /* Kalau warnanya ungu senja, nila, atau lavender */
  if (h >= 248 && h < 325) {
    if (l < 0.48) {
      return {
        moodId: 'afterglow',
        moodLabel: 'Afterglow',
        word: 'Afterglow.',
        quote: 'Velvet midnight indigo for the quiet hours after everyone else is asleep.',
      };
    }
    return {
      moodId: 'nostalgic',
      moodLabel: 'Wistful',
      word: 'Wistful.',
      quote: 'Soft lavender dusk and a familiar melody you still quietly hold onto.',
    };
  }

  /* Kalau warnanya emas hangat, krem, persik, atau senja (contoh: night is young) */
  if (h >= 18 && h < 72) {
    if (l >= 0.58) {
      return {
        moodId: 'golden-hour',
        moodLabel: 'Golden hour',
        word: 'Golden hour.',
        quote: 'Warm apricot light and tender chords that feel like the sun setting slow.',
      };
    }
    return {
      moodId: 'nostalgic',
      moodLabel: 'Nostalgic',
      word: 'Nostalgic.',
      quote: 'Warm analog earth tones and a chorus that brings back a place you once loved.',
    };
  }

  /* Kalau warnanya merah muda lembut atau merah hangat */
  if (l >= 0.56) {
    return {
      moodId: 'dreamy',
      moodLabel: 'Tender',
      word: 'Tender.',
      quote: 'Blush evening tones and gentle melodies that stay warm in your memory.',
    };
  }

  return {
    moodId: 'euphoric',
    moodLabel: 'Euphoric',
    word: 'Euphoric.',
    quote: 'Vivid crimson warmth and bright melodies when you feel everything at once.',
  };
}

export { PALETTE_SIZE };
