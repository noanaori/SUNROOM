import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useApp } from '../context/AppContext';

/* Header buat nampung navigasi utama web, menu responsif HP, sama tombol ganti tema */
export default function Header() {
  const { theme, toggleTheme, savedAlbums } = useApp();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const savedCount = savedAlbums.length;

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  return (
    <header className="site-header">
      <div className="container site-header__inner">
        <NavLink
          to="/"
          className="wordmark"
          onClick={closeMobileMenu}
          aria-label="Sunroom home"
        >
          <strong>sunroom</strong> <em>moods</em>
        </NavLink>

        <nav className="site-nav" aria-label="Main navigation">
          <ul className="site-nav__list">
            <li>
              <NavLink
                to="/"
                end
                className={({ isActive }) =>
                  `site-nav__link ${isActive ? 'is-active' : ''}`
                }
              >
                Home
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/discover"
                className={({ isActive }) =>
                  `site-nav__link ${isActive ? 'is-active' : ''}`
                }
              >
                Discover
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/my-space"
                className={({ isActive }) =>
                  `site-nav__link ${isActive ? 'is-active' : ''}`
                }
              >
                <span>My Space</span>
                {savedCount > 0 && (
                  <span className="nav-count" aria-label={`${savedCount} saved albums`}>
                    {savedCount}
                  </span>
                )}
              </NavLink>
            </li>
          </ul>
        </nav>

        <div className="site-header__actions">
          <button
            type="button"
            className={`icon-btn theme-toggle-btn ${theme === 'dark' ? 'is-dark' : 'is-light'}`}
            onClick={toggleTheme}
            aria-label={
              theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'
            }
            title={
              theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'
            }
          >
            <span className="theme-toggle-btn__icons" aria-hidden="true">
              <svg
                className="theme-toggle-btn__sun"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="5" />
                <line x1="12" y1="1" x2="12" y2="3" />
                <line x1="12" y1="21" x2="12" y2="23" />
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                <line x1="1" y1="12" x2="3" y2="12" />
                <line x1="21" y1="12" x2="23" y2="12" />
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
              </svg>
              <svg
                className="theme-toggle-btn__moon"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            </span>
          </button>

          <button
            type="button"
            className="icon-btn icon-btn--plain nav-toggle"
            onClick={() => setMobileMenuOpen((open) => !open)}
            aria-expanded={mobileMenuOpen}
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open navigation menu'}
          >
            {mobileMenuOpen ? (
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            ) : (
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            )}
          </button>
        </div>
      </div>

      <div
        className={`mobile-nav ${mobileMenuOpen ? 'is-open' : ''}`}
        aria-hidden={!mobileMenuOpen}
      >
        <div className="container">
          <ul className="mobile-nav__list">
            <li>
              <NavLink
                to="/"
                end
                className={({ isActive }) =>
                  `mobile-nav__link ${isActive ? 'is-active' : ''}`
                }
                onClick={closeMobileMenu}
              >
                <span>Home</span>
                <span className="mobile-nav__index">01</span>
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/discover"
                className={({ isActive }) =>
                  `mobile-nav__link ${isActive ? 'is-active' : ''}`
                }
                onClick={closeMobileMenu}
              >
                <span>Discover</span>
                <span className="mobile-nav__index">02</span>
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/my-space"
                className={({ isActive }) =>
                  `mobile-nav__link ${isActive ? 'is-active' : ''}`
                }
                onClick={closeMobileMenu}
              >
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span>My Space</span>
                  {savedCount > 0 && (
                    <span className="nav-count">{savedCount}</span>
                  )}
                </div>
                <span className="mobile-nav__index">03</span>
              </NavLink>
            </li>
          </ul>
        </div>
      </div>
    </header>
  );
}
