import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AlbumDetailsModal from '../components/AlbumDetailsModal';
import PaletteStrip from '../components/PaletteStrip';
import { MOODS } from '../constants/moods';
import { useApp } from '../context/AppContext';
import { fallbackAlbums } from '../services/fallbackAlbums';
import { searchAlbums } from '../services/itunesApi';
import {
  derivePaletteMood,
  getAlbumPalette,
  getInitialPalette,
} from '../utils/colorPalette';

const CURATED_LANDING_SONGS = [
  {
    query: 'Lifelike Porter Robinson Nurture',
    fallbackQuery: 'Porter Robinson Nurture',
    country: 'us',
    fallbackIndex: 0,
    preferredTitle: 'Lifelike',
    preferredArtist: 'Porter Robinson • Nurture',
    artistMatch: 'porter robinson',
  },
  {
    query: 'night is young yuragi',
    fallbackQuery: 'yuragi nightlife',
    country: 'jp',
    fallbackIndex: 1,
    preferredTitle: 'night is young',
    preferredArtist: 'yuragi • nightlife',
    artistMatch: 'yuragi',
  },
  {
    query: "purple she's green wisteria",
    fallbackQuery: "she's green wisteria",
    country: 'us',
    fallbackIndex: 2,
    preferredTitle: 'purple',
    preferredArtist: "she's green • wisteria",
    artistMatch: "she's green",
  },
  {
    query: 'Gravits Crayon Case',
    fallbackQuery: 'Crayon Case Gravits',
    country: 'jp',
    fallbackIndex: 3,
    preferredTitle: 'Gravits',
    preferredArtist: 'Crayon Case • Gravits',
    artistMatch: 'crayon case',
  },
  {
    query: 'kinoue64 Space Circumstances Time and Events',
    fallbackQuery: 'kinoue64',
    country: 'jp',
    fallbackIndex: 4,
    preferredTitle: '空間、事情、時間、事象。 (Space, Circumstances, Time, and Events.)',
    preferredArtist: 'kinoue64 • Space, Circumstances, Time, and Events.',
    artistMatch: 'kinoue64',
  },
];

/* Komponen landing page utama buat majang hero senja, pratinjau album, dan moodboard interaktif */
export default function HomePage() {
  const navigate = useNavigate();
  const { savedAlbums, isSaved, toggleSaved, applyBoardLook } = useApp();

  const [featuredAlbums, setFeaturedAlbums] = useState(() => fallbackAlbums.slice(0, 5));
  const [activeIndex, setActiveIndex] = useState(3);
  const [resolvedPalettes, setResolvedPalettes] = useState({});
  const [selectedSwatchIndex, setSelectedSwatchIndex] = useState(0);
  const [customBentoIndex, setCustomBentoIndex] = useState(3);

  const [heroSearch, setHeroSearch] = useState('');
  const [activeModalAlbum, setActiveModalAlbum] = useState(null);
  const [activeModalPalette, setActiveModalPalette] = useState([]);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    async function loadFeatured() {
      try {
        const fetchedList = await Promise.all(
          CURATED_LANDING_SONGS.map(async (item) => {
            const fallbackItem = {
              ...fallbackAlbums[item.fallbackIndex],
              collectionName: item.preferredTitle,
              artistName: item.preferredArtist,
            };
            try {
              let results = await searchAlbums(item.query, {
                signal: controller.signal,
                limit: 6,
                country: item.country,
                entity: 'song',
              });
              if (!results || results.length === 0) {
                results = await searchAlbums(item.fallbackQuery, {
                  signal: controller.signal,
                  limit: 6,
                  country: 'us',
                  entity: 'song',
                });
              }
              if (results && results.length > 0) {
                const match =
                  results.find((r) =>
                    r.artistName.toLowerCase().includes(item.artistMatch),
                  ) || results[0];
                return {
                  ...match,
                  collectionName: item.preferredTitle,
                  artistName: item.preferredArtist,
                };
              }
            } catch {
              /* Pakai data cadangan kalau panggilan ke API iTunes gagal */
            }
            return fallbackItem;
          }),
        );

        if (!cancelled && fetchedList.length === 5) {
          setFeaturedAlbums(fetchedList);
        }
      } catch {
        /* Sediain data lagu cadangan kalau koneksi offline atau ada error */
      }
    }

    loadFeatured();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, []);

  useEffect(() => {
    let active = true;
    featuredAlbums.forEach((album) => {
      getAlbumPalette(album).then((resolved) => {
        if (active && resolved && resolved.length >= 4) {
          setResolvedPalettes((prev) => {
            if (prev[album.collectionId]) return prev;
            return { ...prev, [album.collectionId]: resolved };
          });
        }
      });
    });
    return () => {
      active = false;
    };
  }, [featuredAlbums]);

  const getPaletteFor = (album) =>
    (album && resolvedPalettes[album.collectionId]) || getInitialPalette(album);

  const activeAlbum = featuredAlbums[activeIndex] || featuredAlbums[0] || fallbackAlbums[0];
  const activePalette = getPaletteFor(activeAlbum);
  const activeFeeling = derivePaletteMood(activePalette, selectedSwatchIndex);
  const activeHex = activePalette[selectedSwatchIndex] || activePalette[0] || '#8EA8C3';
  const activeSaved = isSaved(activeAlbum.collectionId);

  const customBentoAlbum =
    featuredAlbums[customBentoIndex] || featuredAlbums[0] || fallbackAlbums[0];
  const customBentoPalette = getPaletteFor(customBentoAlbum);

  const handleOpenDetails = (album) => {
    setActiveModalAlbum(album);
    setActiveModalPalette(getPaletteFor(album));
  };

  const handleCloseModal = () => {
    setActiveModalAlbum(null);
    setActiveModalPalette([]);
  };

  const handleHeroSearchSubmit = (e) => {
    e.preventDefault();
    if (heroSearch.trim()) {
      navigate(`/discover?q=${encodeURIComponent(heroSearch.trim())}`);
    } else {
      navigate('/discover');
    }
  };

  const handleApplyToMySpace = (album, swatchIdx = 0) => {
    const pal = getPaletteFor(album);
    if (!isSaved(album.collectionId)) {
      toggleSaved(album);
    }
    applyBoardLook({
      palette: pal,
      swatchIndex: swatchIdx,
      mode: 'background',
    });
    navigate('/my-space');
  };

  const renderCover = (album, pal, priority = false) => {
    const src = album.artworkUrl600 || album.artworkUrl100;
    if (src) {
      return (
        <img
          src={src}
          alt={`Cover artwork for ${album.collectionName} by ${album.artistName}`}
          width="400"
          height="400"
          fetchpriority={priority ? 'high' : undefined}
          loading={priority ? undefined : 'lazy'}
          crossOrigin="anonymous"
        />
      );
    }
    return (
      <div
        className="hark-art-fallback"
        style={{
          background: `linear-gradient(135deg, ${pal[0]}, ${pal[2] || pal[1]})`,
        }}
      >
        <span>SUNROOM</span>
        <strong>{album.collectionName}</strong>
      </div>
    );
  };

  const stripAlbums = featuredAlbums.slice(0, 5);
  const moodShowcaseItems = MOODS.filter((m) => m.id !== 'all').slice(0, 5);

  return (
    <div className="hark-landing">
      {/* Bagian 1: Hero utama lengkap dengan kartu pratinjau dan form pencarian cepat */}
      <section className="hark-hero-wrap" aria-label="Sunroom Introduction">
        <div className="hark-hero">
          {/* Sisi kiri: Susunan cover album, kutipan rasa, dan 5 warna paletnya */}
          <div className="hark-hero__visual">
            <div className="hark-hero__canvas">
              <div className="hark-hero__main-album">
                <div className="hark-hero__cover-frame">
                  {renderCover(activeAlbum, activePalette, true)}
                </div>
                <div className="hark-hero__album-meta">
                  <div>
                    <span className="hark-chip">{activeFeeling.moodLabel}</span>
                    <h2>{activeAlbum.collectionName}</h2>
                    <p>{activeAlbum.artistName}</p>
                  </div>
                  <PaletteStrip palette={activePalette} showLabel={false} />
                </div>
              </div>

              <div className="hark-float-card hark-float-card--top">
                <span className="hark-float-card__label">The feeling inside this record</span>
                <p>&ldquo;{activeFeeling.quote}&rdquo;</p>
              </div>

              <div className="hark-float-card hark-float-card--bottom">
                <div className="hark-float-card__row">
                  <span className="hark-float-card__label">Colors from the cover</span>
                  <span className="hark-float-card__hex">{activeHex}</span>
                </div>
                <div className="hark-mini-swatches">
                  {activePalette.map((hex, i) => (
                    <button
                      key={`${hex}-${i}`}
                      type="button"
                      className={`hark-mini-swatch ${selectedSwatchIndex === i ? 'is-active' : ''}`}
                      style={{ backgroundColor: hex }}
                      onClick={() => setSelectedSwatchIndex(i)}
                      aria-label={`Preview swatch ${hex}`}
                      title={hex}
                    />
                  ))}
                </div>
              </div>
            </div>

            <button
              type="button"
              className="hark-learn-pill"
              onClick={() => handleOpenDetails(activeAlbum)}
            >
              View album palette
            </button>
          </div>

          {/* Sisi kanan: Pengenalan Sunroom lengkap dengan tombol aksi utama */}
          <div className="hark-hero__right">
            <div className="hark-brand-box">
              <h1 className="hark-brand-title">
                <strong>sunroom</strong> <em>moods</em>
              </h1>
              <p className="hark-brand-sub">
                A quiet place to see the colors of your favorite music.
                <span>Whatever you feel today, let an album color your space.</span>
              </p>

              <div className="hark-entry-stack">
                <Link to="/discover" className="hark-pill-btn hark-pill-btn--solid">
                  <span>Explore Album Moods</span>
                </Link>

                <Link to="/my-space" className="hark-pill-btn hark-pill-btn--solid">
                  <span>
                    Open My Space{savedAlbums.length > 0 ? ` (${savedAlbums.length})` : ''}
                  </span>
                </Link>

                <div className="hark-divider">
                  <span>or</span>
                </div>

                <form onSubmit={handleHeroSearchSubmit} className="hark-entry-form">
                  <label htmlFor="hero-mood-input" className="sr-only">
                    Search by feeling, album, or artist
                  </label>
                  <input
                    id="hero-mood-input"
                    type="text"
                    value={heroSearch}
                    onChange={(e) => setHeroSearch(e.target.value)}
                    placeholder="Type a feeling, song, or artist"
                    className="hark-entry-input"
                  />
                  <button type="submit" className="hark-pill-btn hark-pill-btn--mist">
                    Find Your Mood
                  </button>
                </form>
              </div>

              <p className="hark-brand-footnote">
                Every album cover holds five colors waiting to be felt.
                Collect the records you love and shape your personal moodboard in{' '}
                <Link to="/my-space">My Space</Link>.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Bagian 2: Deretan 5 lagu pilihan beserta balon kutipan yang interaktif */}
      <section className="hark-strip-section" aria-label="Featured Album Moods">
        <div className="container">
          <div className="hark-strip-grid">
            {stripAlbums.map((album, idx) => {
              const pal = getPaletteFor(album);
              const feeling =
                idx === activeIndex
                  ? activeFeeling
                  : derivePaletteMood(pal, 0);
              const isCenter = idx === activeIndex;

              return (
                <div
                  key={album.collectionId}
                  className={`hark-strip-item ${isCenter ? 'is-active' : ''}`}
                >
                  <button
                    type="button"
                    className="hark-strip-card"
                    onClick={() => {
                      setActiveIndex(idx);
                      setSelectedSwatchIndex(0);
                    }}
                    aria-pressed={isCenter}
                  >
                    <div className="hark-strip-card__art">
                      {renderCover(album, pal)}
                      <span className="hark-strip-card__tag">{feeling.moodLabel}</span>
                    </div>
                    <div className="hark-strip-card__body">
                      <strong>{album.collectionName}</strong>
                      <span>{album.artistName}</span>
                      <div className="hark-strip-card__bar">
                        {pal.map((c, i) => (
                          <span key={i} style={{ backgroundColor: c }} />
                        ))}
                      </div>
                    </div>
                  </button>

                  {isCenter && (
                    <div className="hark-speech-bubble">
                      <p>&ldquo;{feeling.quote}&rdquo;</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Bagian 3: Panggung moodboard interaktif dengan background yang dinamis */}
      <section className="hark-stage-section" aria-label="Interactive Mood Atmosphere Stage">
        <div className="container">
          <div
            className="hark-wide-stage"
            style={{
              background: `radial-gradient(circle at 18% 22%, ${activeHex}88, transparent 58%), radial-gradient(circle at 82% 78%, ${activePalette[(selectedSwatchIndex + 2) % activePalette.length] || activePalette[1]}77, transparent 62%), linear-gradient(165deg, #162244 0%, color-mix(in srgb, ${activeHex} 52%, #2b3860) 54%, color-mix(in srgb, ${activePalette[(selectedSwatchIndex + 1) % activePalette.length] || activeHex} 45%, #686d82) 100%)`,
            }}
          >
            <div className="hark-wide-stage__top">
              <div className="hark-wide-stage__identity">
                <div
                  className="hark-wide-stage__dot"
                  style={{ backgroundColor: activeHex }}
                  aria-hidden="true"
                />
                <div>
                  <strong>Listening to the colors of {activeAlbum.collectionName}</strong>
                  <span>{activeAlbum.artistName} &bull; {activeFeeling.moodLabel}</span>
                </div>
              </div>

              <div className="hark-wide-stage__controls">
                {stripAlbums.map((alb, idx) => (
                  <button
                    key={alb.collectionId}
                    type="button"
                    className={`hark-stage-tab ${activeIndex === idx ? 'is-active' : ''}`}
                    onClick={() => {
                      setActiveIndex(idx);
                      setSelectedSwatchIndex(0);
                    }}
                  >
                    0{idx + 1}
                  </button>
                ))}
              </div>
            </div>

            <div className="hark-wide-stage__content">
              <div className="hark-stage-side-card">
                <span className="hark-stage-side-card__eyebrow">Emotional Tone</span>
                <h3>{activeFeeling.moodLabel}</h3>
                <p>{activeFeeling.quote}</p>
                <div className="hark-stage-side-card__pill-row">
                  <span className="hark-chip">{activeAlbum.primaryGenreName || 'Album'}</span>
                  {activeAlbum.releaseYear && (
                    <span className="hark-chip">{activeAlbum.releaseYear}</span>
                  )}
                </div>
              </div>

              <div className="hark-stage-center-card">
                <div className="hark-stage-center-card__art">
                  {renderCover(activeAlbum, activePalette)}
                  <button
                    type="button"
                    className={`album-card__save ${activeSaved ? 'is-saved' : ''}`}
                    onClick={() => toggleSaved(activeAlbum)}
                    aria-label={
                      activeSaved
                        ? `Remove ${activeAlbum.collectionName} from My Space`
                        : `Save ${activeAlbum.collectionName} to My Space`
                    }
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill={activeSaved ? 'currentColor' : 'none'}
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                    </svg>
                  </button>
                </div>
                <div className="hark-stage-center-card__palette">
                  <PaletteStrip
                    palette={activePalette}
                    large
                    showLabel={false}
                    selectedIndex={selectedSwatchIndex}
                    onSelectSwatch={(_, idx) => setSelectedSwatchIndex(idx)}
                  />
                </div>
              </div>

              <div className="hark-stage-side-card">
                <span className="hark-stage-side-card__eyebrow">Palette Swatches</span>
                <div className="hark-stage-hex-list">
                  {activePalette.map((hex, i) => (
                    <button
                      key={`${hex}-${i}`}
                      type="button"
                      className={`hark-stage-hex-row ${selectedSwatchIndex === i ? 'is-active' : ''}`}
                      onClick={() => setSelectedSwatchIndex(i)}
                    >
                      <span
                        className="hark-stage-hex-row__swatch"
                        style={{ backgroundColor: hex }}
                      />
                      <span>Tone 0{i + 1}</span>
                      <code>{hex}</code>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="hark-wide-stage__bottom">
              <button
                type="button"
                className="hark-stage-action-pill"
                onClick={() => handleOpenDetails(activeAlbum)}
              >
                View full album details
              </button>

              <button
                type="button"
                className="hark-stage-action-pill hark-stage-action-pill--primary"
                onClick={() => handleApplyToMySpace(activeAlbum, selectedSwatchIndex)}
              >
                Bring these colors into My Space
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Bagian 4: Penjelasan fitur Sunroom pakai layout zig-zag kiri dan kanan */}
      <section className="hark-features-section" aria-label="How Sunroom Connects Emotion and Color">
        <div className="container">
          {/* Baris 1: Tabel semantik perbandingan 5 warna palet dari tiap lagu */}
          <div className="hark-feature-row">
            <div className="hark-feature-copy">
              <h2>Every song leaves a color behind</h2>
              <p>
                We rarely remember an album by its tracklist alone. We remember how the room
                felt while it played and the shades resting on its cover.
              </p>
              <p>
                Sunroom reads the artwork of each album and reveals five colors that carry its emotion,
                ready for you to keep.
              </p>
            </div>

            <div className="hark-visual-stage hark-visual-stage--twilight">
              <div className="hark-floating-question">
                Which albums feel like a quiet evening?
              </div>

              <div className="hark-matrix-card">
                <div className="hark-matrix-card__head">
                  <strong>Albums and Their Mood Colors</strong>
                  <span>Five Tones Each</span>
                </div>

                <div className="hark-matrix-rows">
                  {stripAlbums.map((alb, idx) => {
                    const pal = getPaletteFor(alb);
                    const feel = derivePaletteMood(pal, 0);
                    return (
                      <button
                        key={alb.collectionId}
                        type="button"
                        className="hark-matrix-row"
                        onClick={() => handleOpenDetails(alb)}
                      >
                        <span className="hark-matrix-row__idx">0{idx + 1}</span>
                        <span className="hark-matrix-row__thumb">
                          {renderCover(alb, pal)}
                        </span>
                        <span className="hark-matrix-row__title">
                          <strong>{alb.collectionName}</strong>
                          <small>{alb.artistName}</small>
                        </span>
                        <span className="hark-matrix-row__mood">{feel.moodLabel}</span>
                        <span className="hark-matrix-row__swatches">
                          {pal.map((c, i) => (
                            <i key={i} style={{ backgroundColor: c }} />
                          ))}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="hark-floating-reply">
                Five colors sampled directly from each album cover.
              </div>
            </div>
          </div>

          {/* Baris 2: Daftar berurutan ol yang langsung nyambung ke filter Discover */}
          <div className="hark-feature-row hark-feature-row--reverse">
            <div className="hark-visual-stage hark-visual-stage--dusk">
              <div className="hark-mood-stack">
                {moodShowcaseItems.map((mood, idx) => {
                  const pairedAlbum = featuredAlbums[idx] || fallbackAlbums[idx];
                  const pal = getPaletteFor(pairedAlbum);
                  return (
                    <button
                      key={mood.id}
                      type="button"
                      className="hark-mood-pill-row"
                      onClick={() => navigate(`/discover?mood=${mood.id}`)}
                    >
                      <span className="hark-mood-pill-row__action">{mood.label}</span>
                      <span className="hark-mood-pill-row__text">feels like</span>
                      <span className="hark-mood-pill-row__cover">
                        {renderCover(pairedAlbum, pal)}
                      </span>
                      <strong className="hark-mood-pill-row__album">
                        {pairedAlbum.collectionName}
                      </strong>
                      <span className="hark-mood-pill-row__dots">
                        {pal.slice(0, 4).map((c, i) => (
                          <i key={i} style={{ backgroundColor: c }} />
                        ))}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="hark-feature-copy">
              <h2>Begin with how you feel right now</h2>
              <p>
                Some days you do not know which song you are looking for, only the feeling you want
                to sit with for a while.
              </p>
              <p>
                Choose a mood like Dreamy, Golden hour, Afterglow, Nostalgic, or Melancholy,
                and wander through albums whose sounds and colors share that emotion.
              </p>
            </div>
          </div>

          {/* Baris 3: Cara nyimpen album ke moodboard pribadi di My Space */}
          <div className="hark-feature-row">
            <div className="hark-feature-copy">
              <h2>A personal space shaped by your mood</h2>
              <p>
                Save the albums that speak to you into My Space. Together they become a living
                moodboard of the music and feelings you care about.
              </p>
              <p>
                Pick any album from your collection and let its palette color the light and atmosphere of your board.
              </p>
            </div>

            <div
              className="hark-visual-stage hark-visual-stage--sky"
              style={{
                background: `linear-gradient(160deg, ${customBentoPalette[0]}88 0%, ${customBentoPalette[2] || customBentoPalette[1]}77 52%, rgba(150, 150, 162, 0.75) 100%)`,
              }}
            >
              <div className="hark-custom-grid">
                {featuredAlbums.slice(0, 4).map((alb, idx) => {
                  const pal = getPaletteFor(alb);
                  const feel = derivePaletteMood(pal, 0);
                  const isCurrent = customBentoIndex === idx;
                  return (
                    <div
                      key={alb.collectionId}
                      className={`hark-custom-panel ${isCurrent ? 'is-selected' : ''}`}
                    >
                      <button
                        type="button"
                        className="hark-custom-panel__select"
                        onClick={() => setCustomBentoIndex(idx)}
                      >
                        <div className="hark-custom-panel__top">
                          <div className="hark-custom-panel__cover">
                            {renderCover(alb, pal)}
                          </div>
                          <div className="hark-custom-panel__info">
                            <span>{feel.moodLabel}</span>
                            <strong>{alb.collectionName}</strong>
                            <small>{alb.artistName}</small>
                          </div>
                        </div>
                        <div className="hark-custom-panel__swatches">
                          {pal.map((c, i) => (
                            <span key={i} style={{ backgroundColor: c }} />
                          ))}
                        </div>
                      </button>
                      <button
                        type="button"
                        className="hark-custom-panel__apply"
                        onClick={() => handleApplyToMySpace(alb, 0)}
                      >
                        Use in My Space
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Bagian 5: Penutup halaman dengan ajakan buat mulai menata ruang pribadi di My Space */}
      <section className="hark-manifesto-section" aria-label="Sunroom Manifesto">
        <div className="container">
          <div className="hark-manifesto-block hark-manifesto-block--large">
            <p className="hark-manifesto-statement">
              At Sunroom, we turn the emotions inside your favorite albums
              into gentle colors that shape your personal space.
            </p>
            <Link to="/my-space" className="hark-outline-pill">
              Open My Space
            </Link>
          </div>
        </div>
      </section>

      <AlbumDetailsModal
        album={activeModalAlbum}
        palette={activeModalPalette}
        onClose={handleCloseModal}
      />
    </div>
  );
}
