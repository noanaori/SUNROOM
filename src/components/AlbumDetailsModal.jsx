import { useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import PaletteStrip from './PaletteStrip';

/* Modal pop-up buat nampilin detail info album sama kode palet warnanya */
export default function AlbumDetailsModal({ album, palette = [], onClose }) {
  const { isSaved, toggleSaved } = useApp();

  useEffect(() => {
    if (!album) return;

    /* Tutup modal langsung kalau tombol Escape ditekan */
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [album, onClose]);

  const colors = useMemo(
    () =>
      Array.isArray(palette) && palette.length > 0
        ? palette
        : ['#3B486B', '#68718A', '#8EA8C3', '#A39B98', '#1A2852'],
    [palette],
  );

  if (!album) return null;

  const saved = isSaved(album.collectionId);
  const artworkSrc = album.artworkUrl600 || album.artworkUrl100;

  return (
    <div
      className="modal-backdrop"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-album-title"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className="modal__close"
          onClick={onClose}
          aria-label="Close modal dialog"
          title="Close (Esc)"
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
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        <div className="modal__grid">
          <div className="modal__art">
            {artworkSrc ? (
              <img
                src={artworkSrc}
                alt={`Album artwork for ${album.collectionName}`}
                width="600"
                height="600"
                crossOrigin="anonymous"
              />
            ) : (
              <div
                className="album-card__art-fallback"
                style={{
                  background: `linear-gradient(135deg, ${colors[0] || '#3B486B'}, ${colors[2] || '#68718A'})`,
                  minHeight: '320px',
                }}
              >
                <span className="album-card__art-fallback-mark">SUNROOM</span>
                <div className="album-card__art-fallback-title">
                  {album.collectionName}
                </div>
              </div>
            )}
          </div>

          <div className="modal__body">
            {/* Bagian buat menyusun judul lagu, nama artis, dan info rilisnya */}
            <div className="modal__header-group">
              <span className="mono-label">ALBUM &amp; COLOR ARCHIVE</span>

              <h2 id="modal-album-title" className="modal__title">
                {album.collectionName}
              </h2>
              <p className="modal__artist">{album.artistName}</p>

              <div className="modal__facts">
                {album.primaryGenreName && (
                  <span className="tag">{album.primaryGenreName}</span>
                )}
                {album.releaseYear && (
                  <span className="tag">Released {album.releaseYear}</span>
                )}
                {album.trackCount > 0 && (
                  <span className="tag">
                    {album.trackCount} {album.trackCount === 1 ? 'Track' : 'Tracks'}
                  </span>
                )}
              </div>

              {/* Pakai tag dl buat nulis daftar metadata album biar struktur HTML tetap rapi */}
              <dl className="sr-only">
                <dt>Artist</dt>
                <dd>{album.artistName}</dd>
                <dt>Genre</dt>
                <dd>{album.primaryGenreName || 'Music'}</dd>
              </dl>
            </div>

            {/* Deretan 5 warna utama hasil ekstrak cover album */}
            <div className="modal__palette-section">
              <PaletteStrip palette={colors} large showLabel={true} />
              <div className="modal__hex-row">
                {colors.map((c, i) => (
                  <code key={i} className="modal__hex-chip">
                    {c}
                  </code>
                ))}
              </div>

              {/* Tabel semantik buat nampung daftar kode hex warna palet */}
              <table className="sr-only">
                <thead>
                  <tr>
                    <th>No</th>
                    <th>Swatch</th>
                    <th>Hex</th>
                  </tr>
                </thead>
                <tbody>
                  {colors.map((c, i) => (
                    <tr key={i}>
                      <td>{i + 1}</td>
                      <td>Tone 0{i + 1}</td>
                      <td>{c}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Di baris tombol ini, user bisa nyimpen lagu ke My Space atau langsung buka Apple Music */}
            <div className="modal__cta-group">
              <p className="modal__reveal-hint">
                {saved
                  ? 'This record is in your My Space. Open My Space to see the emotional tone it creates.'
                  : 'Add this record to My Space to reveal its emotional tone.'}
              </p>

              <div className="modal__actions">
                <button
                  type="button"
                  className={`btn btn--ghost ${saved ? 'is-saved' : ''}`}
                  onClick={() => toggleSaved(album)}
                >
                  <span>{saved ? 'Saved in My Space (Remove)' : 'Add to My Space'}</span>
                </button>

                {album.collectionViewUrl && (
                  <a
                    href={album.collectionViewUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn--ghost"
                  >
                    <span>Open in Apple Music</span>
                  </a>
                )}
              </div>
            </div>

            {album.copyright && (
              <p className="modal__note">
                {album.copyright}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
