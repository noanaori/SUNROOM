/* Kumpulan fungsi pembantu buat baca-tulis localStorage dengan aman tanpa bikin web crash */

const KEYS = {
  savedAlbums: 'sunroom:savedAlbums',
  theme: 'sunroom:theme:v2',
  boardLook: 'sunroom:boardLook',
  paletteCache: 'sunroom:paletteCache:v3',
};

function safeParse(raw, fallback) {
  if (!raw) return fallback;
  try {
    const parsed = JSON.parse(raw);
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

export function readStorage(key, fallback) {
  try {
    return safeParse(window.localStorage.getItem(key), fallback);
  } catch {
    return fallback;
  }
}

export function writeStorage(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* Tangkap error kalau localStorage penuh atau user pakai incognito mode */
  }
}

export function removeStorage(key) {
  try {
    window.localStorage.removeItem(key);
  } catch {
    /* Tetap aman walau proses hapus item dari storage gagal */
  }
}

/* Dua fungsi ini ngurus pengambilan dan penyimpanan daftar album koleksi user */

export function loadSavedAlbums() {
  const value = readStorage(KEYS.savedAlbums, []);
  return Array.isArray(value) ? value.filter((album) => album && album.collectionId) : [];
}

export function saveSavedAlbums(albums) {
  writeStorage(KEYS.savedAlbums, albums);
}

/* Fungsi ini bertugas nyimpen dan ngebaca preferensi tema gelap/terang */

export function loadTheme() {
  const value = readStorage(KEYS.theme, null);
  return value === 'dark' || value === 'light' ? value : null;
}

export function saveTheme(theme) {
  writeStorage(KEYS.theme, theme);
}

/* Simpan dan panggil kembali setelan nuansa warna panggung My Space */

export function loadBoardLook() {
  const value = readStorage(KEYS.boardLook, null);
  if (!value || typeof value !== 'object') return null;
  const palette = Array.isArray(value.palette)
    ? value.palette.filter((c) => typeof c === 'string')
    : null;
  return {
    palette: palette && palette.length ? palette : null,
    swatchIndex: Number.isInteger(value.swatchIndex) ? value.swatchIndex : 0,
    mode: value.mode === 'accent' ? 'accent' : 'background',
  };
}

export function saveBoardLook(look) {
  writeStorage(KEYS.boardLook, look);
}

/* Simpan cache warna yang udah diekstrak biar nggak perlu hitung ulang terus */

export function loadPaletteCache() {
  const value = readStorage(KEYS.paletteCache, {});
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
}

export function savePaletteCache(cache) {
  writeStorage(KEYS.paletteCache, cache);
}

export { KEYS };
