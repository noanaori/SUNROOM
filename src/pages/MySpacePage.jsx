import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import AlbumDetailsModal from '../components/AlbumDetailsModal';
import PaletteStrip from '../components/PaletteStrip';
import { useApp } from '../context/AppContext';
import {
  derivePaletteMood,
  getAlbumPalette,
  getInitialPalette,
  hexToRgb,
  hslToHex,
  rgbToHsl,
} from '../utils/colorPalette';

const SHARE_FORMATS = [
  { id: 'board', label: 'Full Stage', ratioLabel: 'Default', width: 1400, height: 900 },
  { id: 'story', label: 'Story 9:16', ratioLabel: 'IG Story / TikTok', width: 1080, height: 1920 },
  { id: 'square', label: 'Square 1:1', ratioLabel: 'IG Post', width: 1080, height: 1080 },
  { id: 'wide', label: 'Wide 16:9', ratioLabel: 'X / Desktop', width: 1600, height: 900 },
];

/* Fungsi buat nyatuin 5 warna palet dari semua lagu yang user simpan */
function buildCombinedPalette(collectedPalettes) {
  if (!collectedPalettes || collectedPalettes.length === 0) {
    return ['#1A2852', '#3B486B', '#68718A', '#8EA8C3', '#A39B98'];
  }
  if (collectedPalettes.length === 1) {
    return collectedPalettes[0].palette;
  }

  /* Hitung rata-rata nilai RGB dari seluruh warna lagu yang tersimpan */
  let totalR = 0;
  let totalG = 0;
  let totalB = 0;
  let count = 0;

  collectedPalettes.forEach((item) => {
    item.palette.forEach((hex) => {
      const rgb = hexToRgb(hex);
      totalR += rgb.r;
      totalG += rgb.g;
      totalB += rgb.b;
      count += 1;
    });
  });

  const avgHsl = rgbToHsl({
    r: Math.round(totalR / Math.max(1, count)),
    g: Math.round(totalG / Math.max(1, count)),
    b: Math.round(totalB / Math.max(1, count)),
  });

  const trueBlendHex = hslToHex({
    h: avgHsl.h,
    s: Math.min(0.75, Math.max(0.24, avgHsl.s)),
    l: Math.min(0.72, Math.max(0.32, avgHsl.l)),
  });

  /* Comot 4 warna perwakilan album dan pasang warna hasil campuran di urutan pertama */
  const sampled = [trueBlendHex];
  for (let slot = 0; slot < 4; slot += 1) {
    const albumIdx = slot % collectedPalettes.length;
    const swatchSlot = Math.floor(slot / collectedPalettes.length) + (slot % 3);
    const pal = collectedPalettes[albumIdx].palette;
    const candidate = pal[swatchSlot % pal.length];
    sampled.push(candidate);
  }

  return sampled.slice(0, 5);
}

/* Penentuan satu kata rasa dan kalimat deskripsi yang pas buat kumpulan lagu user */
function deriveCollectionMood(palette, activeSwatchIndex, savedAlbums, isCombined) {
  /* Campur warna palet sambil ngasih bobot lebih ke warna swatch yang lagi aktif */
  const selectedHex = palette[activeSwatchIndex] || palette[0] || '#3B486B';
  const selRgb = hexToRgb(selectedHex);

  let sumR = selRgb.r * 2;
  let sumG = selRgb.g * 2;
  let sumB = selRgb.b * 2;
  let totalWeight = 2;

  const hues = [];
  palette.forEach((hex) => {
    const rgb = hexToRgb(hex);
    sumR += rgb.r;
    sumG += rgb.g;
    sumB += rgb.b;
    totalWeight += 1;
    hues.push(rgbToHsl(rgb).h);
  });

  const { s } = rgbToHsl({
    r: Math.round(sumR / totalWeight),
    g: Math.round(sumG / totalWeight),
    b: Math.round(sumB / totalWeight),
  });

  /* Ukur seberapa lebar variasi spektrum warna dari lagu-lagu yang digabung */
  const hueSpread =
    hues.length > 1 ? Math.max(...hues) - Math.min(...hues) : 0;

  const artistNames = [...new Set(savedAlbums.map((a) => a.artistName).filter(Boolean))]
    .slice(0, 3)
    .join(', ');

  const genres = [...new Set(savedAlbums.map((a) => a.primaryGenreName).filter(Boolean))]
    .slice(0, 2);

  let persona = derivePaletteMood(palette, activeSwatchIndex);

  if (isCombined && hueSpread > 195 && s > 0.36) {
    persona = {
      moodId: 'dreamy',
      moodLabel: 'Daydream',
      word: 'Daydream.',
      quote: 'Drifting between different worlds while your favorite songs play on repeat.',
    };
  }

  return {
    word: persona.word,
    cleanWord: persona.moodLabel,
    caption: persona.quote,
    artistSummary: artistNames || 'your favorite artists',
    genres,
  };
}

/* Render poster moodboard ke elemen canvas biar user bisa download atau share hasilnya */
function generateMoodboardPoster({
  format,
  moodStory,
  isCombined,
  activeAlbum,
  activePalette,
  activeColor,
  savedAlbums,
}) {
  const canvas = document.createElement('canvas');
  canvas.width = format.width;
  canvas.height = format.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  const w = canvas.width;
  const h = canvas.height;

  /* 1. Gambar latar gradien panggung utama */
  const grad = ctx.createLinearGradient(0, 0, w, h);
  grad.addColorStop(0, '#1e2749');
  grad.addColorStop(0.48, activeColor || '#4d4865');
  grad.addColorStop(1, activePalette[2] || '#7e7485');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  const overlay = ctx.createRadialGradient(w * 0.5, h * 0.35, w * 0.1, w * 0.5, h * 0.5, h * 0.9);
  overlay.addColorStop(0, 'rgba(18, 25, 48, 0.12)');
  overlay.addColorStop(1, 'rgba(12, 17, 34, 0.45)');
  ctx.fillStyle = overlay;
  ctx.fillRect(0, 0, w, h);

  const pad = Math.round(w * 0.065);

  /* 2. Pasang deretan judul dan identitas di bagian atas poster */
  const dotR = Math.round(w * 0.018);
  const dotX = pad + dotR;
  const dotY = pad + dotR;

  ctx.fillStyle = activeColor;
  ctx.beginPath();
  ctx.arc(dotX, dotY, dotR, 0, Math.PI * 2);
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
  ctx.stroke();

  const headerTitle = isCombined
    ? `Combined mood of ${savedAlbums.length} collected songs`
    : `Listening to the colors of ${activeAlbum.collectionName}`;
  const headerSub = isCombined
    ? `${moodStory.artistSummary} • ${moodStory.cleanWord}`
    : `${activeAlbum.artistName} • ${moodStory.cleanWord}`;

  ctx.fillStyle = '#ffffff';
  ctx.font = `600 ${Math.round(w * 0.02)}px Inter, sans-serif`;
  ctx.fillText(headerTitle, dotX + dotR + 18, dotY - 2);

  ctx.fillStyle = 'rgba(255, 255, 255, 0.78)';
  ctx.font = `400 ${Math.round(w * 0.016)}px Inter, sans-serif`;
  ctx.fillText(headerSub, dotX + dotR + 18, dotY + Math.round(w * 0.022));

  /* 3. Susun kartu info rasa dan daftar swatch warna */
  let y = pad + Math.round(w * 0.09);
  const contentW = w - pad * 2;

  /* Bikin kartu Emotional Tone */
  ctx.fillStyle = 'rgba(255, 255, 255, 0.92)';
  const toneCardH = format.id === 'story' ? Math.round(h * 0.24) : Math.round(h * 0.34);
  ctx.beginPath();
  ctx.roundRect(pad, y, contentW, toneCardH, 24);
  ctx.fill();

  ctx.fillStyle = '#55607a';
  ctx.font = `600 ${Math.round(w * 0.014)}px Inter, sans-serif`;
  ctx.fillText(
    isCombined ? 'COMBINED EMOTIONAL TONE' : 'EMOTIONAL TONE',
    pad + 36,
    y + 48,
  );

  ctx.fillStyle = '#141a2b';
  const wordSize = Math.round(w * 0.056);
  ctx.font = `600 ${wordSize}px Georgia, serif`;
  ctx.fillText(moodStory.word, pad + 36, y + 56 + wordSize);

  ctx.fillStyle = '#3e4861';
  const capSize = Math.round(w * 0.022);
  ctx.font = `400 ${capSize}px Inter, sans-serif`;
  const words = moodStory.caption.split(' ');
  let line = '';
  let cy = y + 72 + wordSize + capSize;
  words.forEach((word) => {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > contentW - 72) {
      ctx.fillText(line, pad + 36, cy);
      line = word;
      cy += Math.round(capSize * 1.45);
    } else {
      line = test;
    }
  });
  if (line) ctx.fillText(line, pad + 36, cy);

  y += toneCardH + Math.round(h * 0.035);

  /* Bikin kartu Palette Swatches */
  const palCardH = format.id === 'story' ? Math.round(h * 0.38) : Math.round(h * 0.36);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.92)';
  ctx.beginPath();
  ctx.roundRect(pad, y, contentW, palCardH, 24);
  ctx.fill();

  ctx.fillStyle = '#55607a';
  ctx.font = `600 ${Math.round(w * 0.014)}px Inter, sans-serif`;
  ctx.fillText(
    isCombined ? 'COMBINED PALETTE SWATCHES' : 'PALETTE SWATCHES',
    pad + 36,
    y + 46,
  );

  const rowStart = y + 70;
  const rowGap = 14;
  const availH = palCardH - 96;
  const rowH = Math.floor((availH - rowGap * (activePalette.length - 1)) / activePalette.length);

  activePalette.forEach((hex, idx) => {
    const ry = rowStart + idx * (rowH + rowGap);
    ctx.fillStyle = '#eef2f9';
    ctx.beginPath();
    ctx.roundRect(pad + 36, ry, contentW - 72, rowH, 12);
    ctx.fill();

    ctx.fillStyle = hex;
    ctx.beginPath();
    ctx.roundRect(pad + 52, ry + 10, rowH - 20, rowH - 20, 8);
    ctx.fill();

    ctx.fillStyle = '#141a2b';
    ctx.font = `600 ${Math.round(w * 0.018)}px Inter, sans-serif`;
    ctx.fillText(`Tone 0${idx + 1}`, pad + 52 + rowH, ry + Math.round(rowH * 0.62));

    ctx.fillStyle = '#55607a';
    ctx.font = `600 ${Math.round(w * 0.017)}px Inter, sans-serif`;
    ctx.fillText(
      hex.toLowerCase(),
      pad + contentW - 72 - Math.round(w * 0.09),
      ry + Math.round(rowH * 0.62),
    );
  });

  /* Tulis catatan kaki di bagian bawah poster */
  ctx.fillStyle = 'rgba(255, 255, 255, 0.78)';
  ctx.font = `500 ${Math.round(w * 0.016)}px Inter, sans-serif`;
  ctx.fillText(
    `sunroom moods • ${savedAlbums.length} ${savedAlbums.length === 1 ? 'song' : 'songs'} in My Space`,
    pad,
    h - Math.round(pad * 0.55),
  );

  return canvas.toDataURL('image/png');
}

/* Halaman My Space buat nampilin moodboard personal dari lagu-lagu koleksi user */
export default function MySpacePage() {
  const { savedAlbums, removeSaved, clearAllSaved, boardLook, applyBoardLook } = useApp();

  /* Pasang mode gabungan (combined) sebagai tampilan awal */
  const [viewSelection, setViewSelection] = useState('combined');
  const [activeModalAlbum, setActiveModalAlbum] = useState(null);
  const [activeModalPalette, setActiveModalPalette] = useState([]);
  const [shareFormatId, setShareFormatId] = useState('board');
  const [shareNotice, setShareNotice] = useState('');
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [resolvedPalettes, setResolvedPalettes] = useState({});

  useEffect(() => {
    let active = true;
    savedAlbums.forEach((album) => {
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
  }, [savedAlbums]);

  useEffect(() => {
    if (!showResetConfirm) return undefined;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setShowResetConfirm(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showResetConfirm]);

  const collectedPalettes = useMemo(() => {
    return savedAlbums.map((album) => ({
      albumId: album.collectionId,
      albumTitle: album.collectionName,
      artistName: album.artistName,
      palette: resolvedPalettes[album.collectionId] || getInitialPalette(album),
    }));
  }, [savedAlbums, resolvedPalettes]);

  const isCombinedView =
    savedAlbums.length > 1 &&
    (viewSelection === 'combined' || viewSelection >= savedAlbums.length);

  const safeSingleIndex =
    savedAlbums.length === 1
      ? 0
      : typeof viewSelection === 'number' && viewSelection < savedAlbums.length
      ? viewSelection
      : 0;

  const activeAlbum = savedAlbums[safeSingleIndex] || savedAlbums[0] || null;

  const combinedPalette = useMemo(
    () => buildCombinedPalette(collectedPalettes),
    [collectedPalettes],
  );

  const activePalette = useMemo(() => {
    if (isCombinedView) {
      return combinedPalette;
    }
    if (activeAlbum) {
      return resolvedPalettes[activeAlbum.collectionId] || getInitialPalette(activeAlbum);
    }
    return ['#1A2852', '#3B486B', '#68718A', '#8EA8C3', '#A39B98'];
  }, [isCombinedView, combinedPalette, activeAlbum, resolvedPalettes]);

  const activeSwatchIndex =
    boardLook && Number.isInteger(boardLook.swatchIndex) && boardLook.swatchIndex < activePalette.length
      ? boardLook.swatchIndex
      : 0;
  const activeColor = activePalette[activeSwatchIndex] || activePalette[0];

  const moodStory = useMemo(
    () =>
      deriveCollectionMood(
        activePalette,
        activeSwatchIndex,
        savedAlbums,
        isCombinedView,
      ),
    [activePalette, activeSwatchIndex, savedAlbums, isCombinedView],
  );

  const currentFormat =
    SHARE_FORMATS.find((f) => f.id === shareFormatId) || SHARE_FORMATS[0];

  const handleSelectCombined = () => {
    setViewSelection('combined');
    applyBoardLook({
      palette: combinedPalette,
      swatchIndex: 0,
      mode: 'background',
    });
  };

  const handleSelectAlbumIndex = (idx) => {
    setViewSelection(idx);
    const targetAlbum = savedAlbums[idx];
    if (targetAlbum) {
      applyBoardLook({
        palette: resolvedPalettes[targetAlbum.collectionId] || getInitialPalette(targetAlbum),
        swatchIndex: 0,
        mode: 'background',
      });
    }
  };

  const handleSelectSwatch = (color, index) => {
    applyBoardLook({
      palette: activePalette,
      swatchIndex: index,
      mode: 'background',
    });
  };

  const handleOpenDetails = (album, palette) => {
    setActiveModalAlbum(album);
    setActiveModalPalette(palette || getInitialPalette(album));
  };

  const handleCloseModal = () => {
    setActiveModalAlbum(null);
    setActiveModalPalette([]);
  };

  const showTemporaryNotice = (msg) => {
    setShareNotice(msg);
    setTimeout(() => {
      setShareNotice('');
    }, 3400);
  };

  const handleDownloadPoster = () => {
    if (!activeAlbum) return;
    const targetFormat =
      shareFormatId === 'board' ? SHARE_FORMATS[0] : currentFormat;
    const dataUrl = generateMoodboardPoster({
      format: targetFormat,
      moodStory,
      isCombined: isCombinedView,
      activeAlbum,
      activePalette,
      activeColor,
      savedAlbums,
    });
    if (!dataUrl) return;

    const link = document.createElement('a');
    link.download = `sunroom-${moodStory.cleanWord.toLowerCase()}-${targetFormat.id}.png`;
    link.href = dataUrl;
    link.click();
    showTemporaryNotice(`Poster downloaded (${targetFormat.label})`);
  };

  const handleShareSocial = async () => {
    if (!activeAlbum) return;
    const shareText = isCombinedView
      ? `${moodStory.word} ${moodStory.caption} My combined moodboard of ${savedAlbums.length} songs by ${moodStory.artistSummary} on Sunroom.`
      : `${moodStory.word} ${moodStory.caption} Listening to the colors of ${activeAlbum.collectionName} by ${activeAlbum.artistName} on Sunroom.`;

    const targetFormat =
      shareFormatId === 'board' ? SHARE_FORMATS[0] : currentFormat;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `Sunroom Moods: ${moodStory.word}`,
          text: shareText,
          url: window.location.origin,
        });
        showTemporaryNotice('Shared your moodboard');
        return;
      } catch {
        /* Alihkan ke unduh langsung kalau user batal atau browser nggak support Web Share */
      }
    }

    try {
      await navigator.clipboard.writeText(shareText);
      handleDownloadPoster();
      showTemporaryNotice(
        `Caption copied and ${targetFormat.label} poster downloaded`,
      );
    } catch {
      handleDownloadPoster();
    }
  };

  const renderCover = (album, pal) => {
    const src = album.artworkUrl600 || album.artworkUrl100;
    if (src) {
      return (
        <img
          src={src}
          alt={`Cover artwork for ${album.collectionName} by ${album.artistName}`}
          width="400"
          height="400"
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

  const mosaicAlbums = savedAlbums.slice(0, 4);
  const extraCount = Math.max(0, savedAlbums.length - 4);

  return (
    <div className="page page--myspace">
      <div className="container">
        {savedAlbums.length === 0 ? (
          <div className="state-panel myspace-empty">
            <h1 className="state-panel__title">Your moodboard is waiting for its first feeling</h1>
            <p className="state-panel__text">
              Explore the archive by mood, save the songs and albums that speak to you,
              and reveal the emotional tone they create together.
            </p>
            <Link to="/discover" className="btn btn--primary">
              <span>Explore Album Moods</span>
            </Link>
          </div>
        ) : (
          <>
            {/* 1. Panggung utama poster My Space, bisa nampilin satu lagu atau gabungan mosaik */}
            <section
              className={`hark-wide-stage myspace-stage-poster myspace-stage-poster--${shareFormatId}`}
              style={{
                background: `radial-gradient(circle at 18% 22%, ${activeColor}88, transparent 58%), radial-gradient(circle at 82% 78%, ${activePalette[2] || activePalette[1]}77, transparent 62%), linear-gradient(165deg, #162244 0%, color-mix(in srgb, ${activeColor} 52%, #2b3860) 54%, color-mix(in srgb, ${activePalette[3] || activeColor} 45%, #686d82) 100%)`,
              }}
              aria-label="Personal album color moodboard poster"
            >
              {/* Baris atas buat nampilin identitas moodboard beserta jumlah lagu koleksi */}
              <div className="hark-wide-stage__top">
                <div className="hark-wide-stage__identity">
                  <div
                    className="hark-wide-stage__dot"
                    style={{ backgroundColor: activeColor }}
                    aria-hidden="true"
                  />
                  <div>
                    <strong>
                      {isCombinedView
                        ? `Combined mood of ${savedAlbums.length} collected songs`
                        : `Listening to the colors of ${activeAlbum.collectionName}`}
                    </strong>
                    <span>
                      {isCombinedView
                        ? `${moodStory.artistSummary} • ${moodStory.cleanWord}`
                        : `${activeAlbum.artistName} • ${moodStory.cleanWord}`}
                    </span>
                  </div>
                </div>

                {/* Deretan tombol buat milih mau lihat mode gabungan atau lagu tertentu */}
                {savedAlbums.length > 1 && (
                  <div
                    className="hark-wide-stage__controls"
                    role="group"
                    aria-label="Switch between combined mood and individual songs"
                  >
                    <button
                      type="button"
                      className={`hark-stage-tab hark-stage-tab--wide ${
                        isCombinedView ? 'is-active' : ''
                      }`}
                      onClick={handleSelectCombined}
                      aria-pressed={isCombinedView}
                      title="Combined mood of all saved songs"
                    >
                      All ({savedAlbums.length})
                    </button>

                    {savedAlbums.map((alb, idx) => (
                      <button
                        key={alb.collectionId}
                        type="button"
                        className={`hark-stage-tab ${
                          !isCombinedView && safeSingleIndex === idx ? 'is-active' : ''
                        }`}
                        onClick={() => handleSelectAlbumIndex(idx)}
                        aria-pressed={!isCombinedView && safeSingleIndex === idx}
                        title={alb.collectionName}
                      >
                        {String(idx + 1).padStart(2, '0')}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Susunan 3 kartu utama berdampingan di tengah panggung */}
              <div className="hark-wide-stage__content">
                {/* Kartu kiri: Nampilin satu kata rasa sama kalimat deskripsinya */}
                <div className="hark-stage-side-card hark-stage-side-card--light">
                  <span className="hark-stage-side-card__eyebrow">
                    {isCombinedView ? 'COMBINED EMOTIONAL TONE' : 'EMOTIONAL TONE'}
                  </span>
                  <h1 className="hark-stage-side-card__feeling">{moodStory.word}</h1>
                  <p className="hark-stage-side-card__caption">{moodStory.caption}</p>
                  <div className="hark-stage-side-card__pill-row">
                    {isCombinedView ? (
                      <>
                        {moodStory.genres.map((g) => (
                          <span key={g} className="hark-light-pill">
                            {g}
                          </span>
                        ))}
                        <span className="hark-light-pill">
                          {savedAlbums.length} Songs Combined
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="hark-light-pill">
                          {activeAlbum.primaryGenreName || 'Album'}
                        </span>
                        {activeAlbum.releaseYear && (
                          <span className="hark-light-pill">{activeAlbum.releaseYear}</span>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {/* Kartu tengah: Nampilin cover album atau kolase mosaik 4 lagu */}
                <div className="hark-stage-center-card">
                  {isCombinedView ? (
                    <div
                      className={`hark-stage-center-card__art myspace-cover-mosaic myspace-cover-mosaic--${Math.min(
                        4,
                        mosaicAlbums.length,
                      )}`}
                    >
                      {mosaicAlbums.map((alb, idx) => {
                        const pal = resolvedPalettes[alb.collectionId] || getInitialPalette(alb);
                        return (
                          <div
                            key={alb.collectionId}
                            className="myspace-mosaic-tile album-card--clickable"
                            role="button"
                            tabIndex={0}
                            onClick={() => handleOpenDetails(alb, pal)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                handleOpenDetails(alb, pal);
                              }
                            }}
                            title={`${alb.collectionName} by ${alb.artistName}`}
                          >
                            {renderCover(alb, pal)}
                            <span className="myspace-mosaic-tile__label">
                              {alb.collectionName}
                            </span>
                            <button
                              type="button"
                              className="myspace-mosaic-tile__remove"
                              onClick={(e) => {
                                e.stopPropagation();
                                removeSaved(alb.collectionId);
                              }}
                              aria-label={`Remove ${alb.collectionName} from My Space`}
                              title="Remove from My Space"
                            >
                              &times;
                            </button>
                            {idx === 3 && extraCount > 0 && (
                              <span className="myspace-mosaic-tile__more">
                                +{extraCount} more
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div
                      className="hark-stage-center-card__art album-card--clickable"
                      role="button"
                      tabIndex={0}
                      onClick={() => handleOpenDetails(activeAlbum, activePalette)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          handleOpenDetails(activeAlbum, activePalette);
                        }
                      }}
                      title={`Tap to view details for ${activeAlbum.collectionName}`}
                    >
                      {renderCover(activeAlbum, activePalette)}
                      <button
                        type="button"
                        className="album-card__save is-saved"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeSaved(activeAlbum.collectionId);
                        }}
                        aria-label={`Remove ${activeAlbum.collectionName} from My Space`}
                        title="Remove from My Space"
                      >
                        <svg
                          width="15"
                          height="15"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          aria-hidden="true"
                        >
                          <line x1="18" y1="6" x2="6" y2="18" />
                          <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      </button>
                    </div>
                  )}

                  <div className="hark-stage-center-card__palette">
                    <PaletteStrip
                      palette={activePalette}
                      large
                      showLabel={false}
                      selectedIndex={activeSwatchIndex}
                      onSelectSwatch={handleSelectSwatch}
                    />
                  </div>
                </div>

                {/* Kartu kanan: Nampilin deretan 5 swatch warna lengkap sama kode hex-nya */}
                <div className="hark-stage-side-card hark-stage-side-card--light">
                  <span className="hark-stage-side-card__eyebrow">
                    {isCombinedView ? 'COMBINED SWATCHES' : 'PALETTE SWATCHES'}
                  </span>
                  <div className="hark-stage-hex-list">
                    {activePalette.map((hex, i) => (
                      <button
                        key={`${hex}-${i}`}
                        type="button"
                        className={`hark-stage-hex-row hark-stage-hex-row--light ${
                          activeSwatchIndex === i ? 'is-active' : ''
                        }`}
                        onClick={() => handleSelectSwatch(hex, i)}
                        aria-pressed={activeSwatchIndex === i}
                      >
                        <span
                          className="hark-stage-hex-row__swatch"
                          style={{ backgroundColor: hex }}
                        />
                        <span>
                          {isCombinedView && i === 0 ? 'Blend 01' : `Tone 0${i + 1}`}
                        </span>
                        <code>{hex}</code>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Rak bawah tempat membariskan semua lagu yang tersimpan di My Space */}
              {savedAlbums.length > 1 && (
                <div className="myspace-stage-shelf" aria-label="Collected songs in My Space">
                  <button
                    type="button"
                    className={`myspace-shelf-pill myspace-shelf-pill--combined ${
                      isCombinedView ? 'is-active' : ''
                    }`}
                    onClick={handleSelectCombined}
                  >
                    <span className="myspace-shelf-pill__dots">
                      {combinedPalette.slice(0, 4).map((c, i) => (
                        <i key={i} style={{ backgroundColor: c }} />
                      ))}
                    </span>
                    <span className="myspace-shelf-pill__text">
                      <strong>Combined Mix</strong>
                      <small>{savedAlbums.length} songs blended</small>
                    </span>
                  </button>

                  {savedAlbums.map((alb, idx) => {
                    const pal = resolvedPalettes[alb.collectionId] || getInitialPalette(alb);
                    const isCurrent = !isCombinedView && safeSingleIndex === idx;
                    return (
                      <div
                        key={alb.collectionId}
                        className={`myspace-shelf-pill ${isCurrent ? 'is-active' : ''}`}
                      >
                        <button
                          type="button"
                          className="myspace-shelf-pill__main"
                          onClick={() => handleSelectAlbumIndex(idx)}
                        >
                          <span className="myspace-shelf-pill__thumb">
                            {renderCover(alb, pal)}
                          </span>
                          <span className="myspace-shelf-pill__text">
                            <strong>{alb.collectionName}</strong>
                            <small>{alb.artistName}</small>
                          </span>
                          <span className="myspace-shelf-pill__dots">
                            {pal.slice(0, 4).map((c, i) => (
                              <i key={i} style={{ backgroundColor: c }} />
                            ))}
                          </span>
                        </button>
                        <button
                          type="button"
                          className="myspace-shelf-pill__remove"
                          onClick={() => removeSaved(alb.collectionId)}
                          aria-label={`Remove ${alb.collectionName}`}
                          title="Remove from My Space"
                        >
                          &times;
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            {shareNotice && (
              <div
                className="myspace-share-toast"
                role="status"
                style={{ marginTop: '1.25rem', marginBottom: 0 }}
              >
                <span>{shareNotice}</span>
              </div>
            )}

            {/* 2. Panel kontrol poster: atur ukuran, unduh gambar, bagikan, atau bersihin koleksi */}
            <div className="myspace-bottom-dock" aria-label="Poster format and export controls">
              <div className="myspace-format-footer">
                <span className="mono-label">Display Format:</span>
                {/* Selipin tag ol semantik buat urutan lagu tanpa ngerusak tampilan visual */}
                <ol className="sr-only">
                  {savedAlbums.map((alb) => (
                    <li key={alb.collectionId}>{alb.collectionName}</li>
                  ))}
                </ol>
                <div className="myspace-format-pills" role="group" aria-label="Poster aspect ratio">
                  {SHARE_FORMATS.map((fmt) => (
                    <button
                      key={fmt.id}
                      type="button"
                      className={`myspace-format-pill ${shareFormatId === fmt.id ? 'is-active' : ''}`}
                      onClick={() => setShareFormatId(fmt.id)}
                      aria-pressed={shareFormatId === fmt.id}
                    >
                      <strong>{fmt.label}</strong>
                      <span>{fmt.ratioLabel}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="myspace-export-dock" role="group" aria-label="Download or share poster">
                <button
                  type="button"
                  className="icon-btn"
                  onClick={handleDownloadPoster}
                  aria-label="Download poster"
                  title="Download poster (PNG)"
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                </button>

                <button
                  type="button"
                  className="icon-btn"
                  onClick={handleShareSocial}
                  aria-label="Share moodboard"
                  title="Share moodboard"
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <circle cx="18" cy="5" r="3" />
                    <circle cx="6" cy="12" r="3" />
                    <circle cx="18" cy="19" r="3" />
                    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                  </svg>
                </button>
              </div>

              <div className="myspace-reset-dock">
                <button
                  type="button"
                  className="myspace-reset-btn"
                  onClick={() => setShowResetConfirm(true)}
                  aria-label="Reset all collected songs"
                  title="Clear all songs from My Space"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  </svg>
                  <span>Reset All</span>
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {showResetConfirm && (
        <div
          className="modal-backdrop"
          onClick={() => setShowResetConfirm(false)}
          role="presentation"
        >
          <div
            className="confirm-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Reset confirmation"
            aria-describedby="reset-confirm-desc"
            onClick={(e) => e.stopPropagation()}
          >
            <p id="reset-confirm-desc" className="confirm-modal__text">
              Are you sure you want to clear everything? This will remove all{' '}
              <strong>
                {savedAlbums.length} {savedAlbums.length === 1 ? 'song' : 'songs'}
              </strong>{' '}
              from your moodboard so you can start fresh.
            </p>

            <div className="confirm-modal__actions">
              <button
                type="button"
                className="btn btn--ghost"
                onClick={() => setShowResetConfirm(false)}
              >
                <span>Keep My Songs</span>
              </button>
              <button
                type="button"
                className="btn btn--ghost"
                onClick={() => {
                  clearAllSaved();
                  setViewSelection('combined');
                  setShowResetConfirm(false);
                }}
              >
                <span>Yes, Reset All</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <AlbumDetailsModal
        album={activeModalAlbum}
        palette={activeModalPalette}
        onClose={handleCloseModal}
      />
    </div>
  );
}
