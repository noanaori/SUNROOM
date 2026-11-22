import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import AlbumCard from '../components/AlbumCard';
import AlbumDetailsModal from '../components/AlbumDetailsModal';
import MoodFilters from '../components/MoodFilters';
import { MOODS } from '../constants/moods';
import SearchBar from '../components/SearchBar';
import { fallbackAlbums } from '../services/fallbackAlbums';
import { searchAlbums } from '../services/itunesApi';

const DEFAULT_QUERY = 'dream pop indie soul';

/* Di halaman Discover ini, user bisa bebas nyari lagu, jelajahi album, atau filter sesuai mood */
export default function DiscoverPage() {
  const [searchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const initialMoodParam = searchParams.get('mood') || 'all';
  const validInitialMood = MOODS.some((m) => m.id === initialMoodParam)
    ? initialMoodParam
    : 'all';

  const [searchTerm, setSearchTerm] = useState(initialQuery);
  const [activeMood, setActiveMood] = useState(validInitialMood);
  const [albums, setAlbums] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorNotice, setErrorNotice] = useState(null);

  const [activeModalAlbum, setActiveModalAlbum] = useState(null);
  const [activeModalPalette, setActiveModalPalette] = useState([]);

  const abortControllerRef = useRef(null);

  const executeSearch = useCallback(async (queriesToRun) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsLoading(true);
    setErrorNotice(null);

    const queryList = Array.isArray(queriesToRun)
      ? queriesToRun.filter(Boolean)
      : [queriesToRun].filter(Boolean);

    try {
      if (queryList.length > 1) {
        const batches = await Promise.all(
          queryList.map((q) =>
            searchAlbums(q, {
              signal: controller.signal,
              limit: 10,
            }).catch(() => []),
          ),
        );

        /* Gabungin hasil pencarian dari berbagai artis secara selang-seling biar makin variatif */
        const seen = new Set();
        const combined = [];
        const maxLen = Math.max(0, ...batches.map((b) => b.length));

        for (let i = 0; i < maxLen; i += 1) {
          for (const batch of batches) {
            const item = batch[i];
            if (item && !seen.has(String(item.collectionId))) {
              seen.add(String(item.collectionId));
              combined.push(item);
            }
          }
        }

        setAlbums(combined.slice(0, 32));
      } else {
        const results = await searchAlbums(queryList[0] || DEFAULT_QUERY, {
          signal: controller.signal,
          limit: 32,
        });
        setAlbums(results);
      }
    } catch (err) {
      if (err.name === 'AbortError') return;

      setErrorNotice(
        'Could not reach the iTunes API right now. Showing curated records and their emotional color palettes from the local archive.',
      );
      setAlbums(fallbackAlbums);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const handler = setTimeout(() => {
      const trimmed = searchTerm.trim();

      if (trimmed) {
        executeSearch(trimmed);
      } else {
        const moodObj = MOODS.find((m) => m.id === activeMood) || MOODS[0];
        const queries =
          moodObj && Array.isArray(moodObj.queries) && moodObj.queries.length > 0
            ? moodObj.queries
            : [moodObj?.query || DEFAULT_QUERY];
        executeSearch(queries);
      }
    }, 350);

    return () => {
      clearTimeout(handler);
    };
  }, [searchTerm, activeMood, executeSearch]);

  const handleMoodSelect = (mood) => {
    setActiveMood(mood.id);
    if (mood.id !== 'all') {
      setSearchTerm('');
    }
  };

  const handleOpenDetails = (album, palette) => {
    setActiveModalAlbum(album);
    setActiveModalPalette(palette);
  };

  const handleCloseModal = () => {
    setActiveModalAlbum(null);
    setActiveModalPalette([]);
  };

  const currentMoodObj = MOODS.find((m) => m.id === activeMood) || MOODS[0];

  return (
    <div className="page page--discover">
      <div className="container">
        <header className="discover-head">
          <div className="discover-head__title">
            <span className="eyebrow">The Mood Archive</span>
            <h1 className="display-page">Find the color of your feeling.</h1>
          </div>
          <p className="lede">
            Every song leaves a feeling behind, and every cover holds its colors.
            Choose a mood below or search for an artist you love to uncover their five color palette.
          </p>
        </header>

        <section className="discover-toolbar" aria-label="Search and mood filters">
          <SearchBar
            value={searchTerm}
            onChange={(val) => {
              setSearchTerm(val);
              if (activeMood !== 'all') setActiveMood('all');
            }}
            placeholder="Search by artist, album, or a feeling..."
          />

          <MoodFilters
            activeMood={activeMood}
            onSelectMood={handleMoodSelect}
          />
        </section>

        {errorNotice && (
          <div className="inline-notice" role="alert">
            <span>{errorNotice}</span>
          </div>
        )}

        {!isLoading && (
          <div className="results-meta">
            <span>
              Showing <strong>{albums.length}</strong> {albums.length === 1 ? 'album' : 'albums'}
              {searchTerm
                ? ` matching "${searchTerm}"`
                : activeMood !== 'all'
                ? ` for ${currentMoodObj.label} (${currentMoodObj.feeling})`
                : ''}
            </span>
            <span className="mono-label">FIVE MOOD COLORS PER ALBUM</span>
          </div>
        )}

        {isLoading && (
          <div className="album-grid" aria-busy="true" aria-label="Loading albums">
            {Array.from({ length: 8 }).map((_, index) => (
              <div key={index} className="skeleton-card">
                <div className="skeleton skeleton--art" />
                <div className="skeleton-body">
                  <div className="skeleton skeleton--line" style={{ width: '40%' }} />
                  <div className="skeleton skeleton--line" style={{ width: '85%' }} />
                  <div className="skeleton skeleton--line" style={{ width: '60%' }} />
                  <div
                    className="skeleton skeleton--line"
                    style={{ width: '100%', height: '14px', marginTop: '6px' }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {!isLoading && albums.length === 0 && (
          <div className="state-panel" role="status">
            <h2 className="state-panel__title">No albums matched that feeling</h2>
            <p className="state-panel__text">
              We could not find records matching your search. Try choosing another mood filter or typing a different artist.
            </p>
            <button
              type="button"
              className="btn btn--primary"
              onClick={() => {
                setSearchTerm('');
                setActiveMood('all');
              }}
            >
              Show All Moods
            </button>
          </div>
        )}

        {!isLoading && albums.length > 0 && (
          <section className="album-grid" aria-label="Album results">
            {albums.map((album) => (
              <AlbumCard
                key={album.collectionId}
                album={album}
                onOpenDetails={handleOpenDetails}
              />
            ))}
          </section>
        )}
      </div>

      <AlbumDetailsModal
        album={activeModalAlbum}
        palette={activeModalPalette}
        onClose={handleCloseModal}
      />
    </div>
  );
}
