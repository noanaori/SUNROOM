/* Modul komunikasi ke iTunes Search API buat narik data album dan lagu */

const API_BASE = 'https://itunes.apple.com/search';
const DEFAULT_LIMIT = 36;
const DEFAULT_COUNTRY = 'us';

const UNSAFE_TITLE_PATTERN =
  /\b(sex|sexual|sensual|erotic|explicit|porn|xxx|strip|nude|naked|fetish|playboy|seductive|seduction|lust|booty|twerk|horny|kinky|nsfw|hentai|orgasm|onlyfans|69)\b/i;

/* Saring ketat judul lagu biar bersih dari lirik vulgar atau tema sensual */
function isFamilyFriendlyRecord(raw) {
  if (!raw) return false;
  if (raw.collectionExplicitness === 'explicit' || raw.trackExplicitness === 'explicit') {
    return false;
  }
  const combinedText = `${raw.collectionName || ''} ${raw.trackName || ''} ${raw.artistName || ''}`;
  if (UNSAFE_TITLE_PATTERN.test(combinedText)) {
    return false;
  }
  return true;
}

/* Tata ulang respon mentah dari API biar bentuk properti objeknya rapi dan konsisten */
function normalizeAlbum(raw) {
  return {
    collectionId: raw.collectionId || raw.trackId,
    collectionName: raw.collectionName || raw.trackName || 'Untitled album',
    artistName: raw.artistName || 'Unknown artist',
    artworkUrl100: raw.artworkUrl100 || '',
    /* Ubah link gambar jadi 600x600 biar tampilan cover albumnya tajem dan jernih */
    artworkUrl600: raw.artworkUrl100
      ? raw.artworkUrl100.replace(/\/100x100bb\./, '/600x600bb.')
      : '',
    releaseDate: raw.releaseDate || '',
    releaseYear: raw.releaseDate ? new Date(raw.releaseDate).getFullYear() : null,
    primaryGenreName: raw.primaryGenreName || '',
    trackCount: raw.trackCount || 1,
    collectionViewUrl: raw.collectionViewUrl || raw.trackViewUrl || '',
    copyright: raw.copyright || '',
  };
}

/* Buang data kembar pakai Set biar setiap album yang muncul selalu unik */
function normalizeResults(rawResults) {
  const seen = new Set();
  const albums = [];

  for (const raw of rawResults || []) {
    const uniqueId = raw && (raw.collectionId || raw.trackId);
    const title = raw && (raw.collectionName || raw.trackName);
    if (!uniqueId || !title) continue;
    if (!isFamilyFriendlyRecord(raw)) continue;
    const id = String(uniqueId);
    if (seen.has(id)) continue;
    seen.add(id);
    albums.push(normalizeAlbum(raw));
  }

  return albums;
}

export function buildSearchUrl(
  term,
  { limit = DEFAULT_LIMIT, country = DEFAULT_COUNTRY, entity = 'album' } = {},
) {
  const params = new URLSearchParams({
    term,
    media: 'music',
    entity,
    country,
    limit: String(limit),
  });
  return `${API_BASE}?${params.toString()}`;
}

/* Fungsi ini bertugas nembak API iTunes sesuai kata kunci yang diketik user */
export async function searchAlbums(term, options = {}) {
  const query = String(term || '').trim();
  if (!query) return [];

  const url = buildSearchUrl(query, options);

  let response;
  try {
    response = await fetch(url, { signal: options.signal });
  } catch (error) {
    if (error.name === 'AbortError') throw error;
    throw new Error('network');
  }

  if (!response.ok) {
    throw new Error('network');
  }

  let payload;
  try {
    payload = await response.json();
  } catch {
    throw new Error('network');
  }

  return normalizeResults(payload.results);
}

export { normalizeAlbum, normalizeResults, DEFAULT_LIMIT };