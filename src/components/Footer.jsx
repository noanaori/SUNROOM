import { Link } from 'react-router-dom';

const CURRENT_YEAR = new Date().getFullYear();

/* Bagian footer yang nyediain link navigasi, tombol lompat ke atas, sampai tautan email */
export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="site-footer__top">
          <div className="site-footer__brand">
            <div className="wordmark">
              <strong>sunroom</strong> <em>moods</em>
            </div>
            <p className="site-footer__tagline">
              A quiet place to see the colors of your favorite music and let every feeling shape your space.
            </p>
          </div>

          <nav className="site-footer__nav" aria-label="Footer navigation">
            <Link to="/">Home</Link>
            <Link to="/discover">Discover</Link>
            <Link to="/my-space">My Space</Link>
            <a href="#main-content" className="sr-only">Back to top</a>
            <a href="mailto:hello@sunroom.moods" className="sr-only">Contact email</a>
          </nav>
        </div>

        <div className="site-footer__bottom">
          <span>
            Sunroom ({CURRENT_YEAR}). Front End Final Project.
          </span>
          <span>
            Album metadata and artwork via Apple iTunes Search API. Visual color archive only, no audio playback.
          </span>
        </div>
      </div>
    </footer>
  );
}
