import { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { getAlbumPalette, getInitialPalette } from '../utils/colorPalette';
import PaletteStrip from './PaletteStrip';

/* Kartu album interaktif lengkap dengan cover dan deretan 5 palet warnanya */
export default function AlbumCard({ album, onOpenDetails, isRemovable = false }) {
  const { isSaved, toggleSaved, removeSaved } = useApp();
  const saved = isSaved(album.collectionId);

  const [palette, setPalette] = useState(() => getInitialPalette(album));
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    let isCurrent = true;
    getAlbumPalette(album).then((resolvedPalette) => {
      if (isCurrent && resolvedPalette && resolvedPalette.length >= 4) {
        setPalette(resolvedPalette);
      }
    });
    return () => {
      isCurrent = false;
    };
  }, [album]);

  const artworkSrc = album.artworkUrl600 || album.artworkUrl100;
  const hasValidArtwork = Boolean(artworkSrc) && !imageError;

  const handleSaveToggle = (e) => {
    e.stopPropagation();
    if (isRemovable) {
      removeSaved(album.collectionId);
    } else {
      toggleSaved(album);
    }
  };

  const handleCardActivation = () => {
    if (onOpenDetails) onOpenDetails(album, palette);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleCardActivation();
    }
  };

  return (
    <article
      className="album-card album-card--clickable"
      role="button"
      tabIndex={0}
      onClick={handleCardActivation}
      onKeyDown={handleKeyDown}
      aria-label={`View description and color palette for ${album.collectionName} by ${album.artistName}`}
    >
      <div className="album-card__art-wrap">
        {hasValidArtwork ? (
          <img
            src={artworkSrc}
            alt={`Album artwork for ${album.collectionName} by ${album.artistName}`}
            className="album-card__art image-hover"
            width="300"
            height="300"
            loading="lazy"
            crossOrigin="anonymous"
            onError={() => setImageError(true)}
          />
        ) : (
          <div
            className="album-card__art-fallback"
            style={{
              background: `linear-gradient(135deg, ${palette[0]}, ${palette[2] || palette[1]})`,
              color: '#111827',
            }}
          >
            <span className="album-card__art-fallback-mark">SUNROOM</span>
            <div className="album-card__art-fallback-title">
              {album.collectionName}
            </div>
            <span className="tag" style={{ alignSelf: 'flex-start' }}>
              {album.primaryGenreName || 'Album'}
            </span>
          </div>
        )}

        <button
          type="button"
          className={`album-card__save ${saved ? 'is-saved' : ''}`}
          onClick={handleSaveToggle}
          aria-label={
            isRemovable
              ? `Remove ${album.collectionName} from My Space`
              : saved
              ? `Remove ${album.collectionName} from My Space`
              : `Save ${album.collectionName} to My Space`
          }
          title={saved ? 'Saved in My Space' : 'Save to My Space'}
        >
          {isRemovable ? (
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
          ) : (
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill={saved ? 'currentColor' : 'none'}
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
            </svg>
          )}
        </button>
      </div>

      <div className="album-card__body">
        <div className="album-card__meta">
          <span>{album.primaryGenreName || 'Album'}</span>
          {album.releaseYear && <span>{album.releaseYear}</span>}
        </div>

        <div className="album-card__titles">
          <h3 className="album-card__title" title={album.collectionName}>
            {album.collectionName}
          </h3>
          <p className="album-card__artist" title={album.artistName}>
            {album.artistName}
          </p>
        </div>

        <div className="album-card__palette-wrap">
          <PaletteStrip palette={palette} />
        </div>

        {album.collectionViewUrl && (
          <div className="album-card__footer">
            <span className="album-card__hint">Tap card for mood story</span>
            <a
              href={album.collectionViewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="album-card__store"
              onClick={(e) => e.stopPropagation()}
              aria-label={`Open ${album.collectionName} on Apple Music (opens in new tab)`}
            >
              <span>Apple Music &#8599;</span>
            </a>
          </div>
        )}
      </div>
    </article>
  );
}
