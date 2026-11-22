import { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import {
  loadBoardLook,
  loadSavedAlbums,
  loadTheme,
  saveBoardLook,
  saveSavedAlbums,
  saveTheme,
} from '../utils/storage';

export const AppContext = createContext(null);

/* Saring dan ambil properti penting album aja biar localStorage nggak berat */
function pickAlbumForStorage(album) {
  return {
    collectionId: album.collectionId,
    collectionName: album.collectionName,
    artistName: album.artistName,
    artworkUrl100: album.artworkUrl100 || '',
    artworkUrl600: album.artworkUrl600 || '',
    releaseDate: album.releaseDate || '',
    releaseYear: album.releaseYear ?? null,
    primaryGenreName: album.primaryGenreName || '',
    trackCount: album.trackCount || 0,
    collectionViewUrl: album.collectionViewUrl || '',
  };
}

/* Baca tema dari storage browser, atau pasang mode gelap sebagai default-nya */
function getPreferredTheme() {
  const stored = loadTheme();
  if (stored) return stored;
  return 'dark';
}

export function AppProvider({ children }) {
  const [theme, setTheme] = useState(getPreferredTheme);
  const [savedAlbums, setSavedAlbums] = useState(loadSavedAlbums);
  const [boardLook, setBoardLook] = useState(loadBoardLook);

  /* Pasang data-theme ke elemen html dan update meta theme-color di DOM */
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    saveTheme(theme);

    const metaTheme = document.querySelector('meta[name="theme-color"]');
    if (metaTheme) {
      metaTheme.setAttribute('content', theme === 'dark' ? '#0d1533' : '#b7c5df');
    }
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((current) => (current === 'dark' ? 'light' : 'dark'));
  }, []);

  /* Simpan data terbarunya ke localStorage tiap kali daftar album berubah */
  useEffect(() => {
    saveSavedAlbums(savedAlbums);
  }, [savedAlbums]);

  const isSaved = useCallback(
    (collectionId) => savedAlbums.some((album) => String(album.collectionId) === String(collectionId)),
    [savedAlbums],
  );

  const toggleSaved = useCallback((album) => {
    setSavedAlbums((current) => {
      const exists = current.some((item) => String(item.collectionId) === String(album.collectionId));
      if (exists) {
        return current.filter((item) => String(item.collectionId) !== String(album.collectionId));
      }
      return [pickAlbumForStorage(album), ...current];
    });
  }, []);

  const removeSaved = useCallback((collectionId) => {
    setSavedAlbums((current) =>
      current.filter((item) => String(item.collectionId) !== String(collectionId)),
    );
  }, []);

  const clearAllSaved = useCallback(() => {
    setSavedAlbums([]);
    setBoardLook(null);
  }, []);

  /* Simpan pilihan warna panggung moodboard ke localStorage */
  useEffect(() => {
    saveBoardLook(boardLook);
  }, [boardLook]);

  const applyBoardLook = useCallback((look) => {
    setBoardLook(look);
  }, []);

  const resetBoardLook = useCallback(() => {
    setBoardLook(null);
  }, []);

  const value = useMemo(
    () => ({
      theme,
      toggleTheme,
      savedAlbums,
      isSaved,
      toggleSaved,
      removeSaved,
      clearAllSaved,
      boardLook,
      applyBoardLook,
      resetBoardLook,
    }),
    [
      theme,
      toggleTheme,
      savedAlbums,
      isSaved,
      toggleSaved,
      removeSaved,
      clearAllSaved,
      boardLook,
      applyBoardLook,
      resetBoardLook,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export { useApp } from './useApp';
export default AppContext;
