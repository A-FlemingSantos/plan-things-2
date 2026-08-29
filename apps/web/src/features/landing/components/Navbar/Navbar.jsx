import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ROUTES } from '../../../../shared/config/routes.js'
import { LANDING_NAV_LINKS } from '../../config/landingNav.js'
import { useLandingActiveSection } from '../../hooks/useLandingActiveSection.js'
import {
  getLandingScrollTop,
  getLandingScrollViewport,
  handleLandingHashClick,
} from '../../utils/landingScroll.js'
import styles from './Navbar.module.css'

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const activeSection = useLandingActiveSection()

  useEffect(() => {
    const viewport = getLandingScrollViewport()
    const onScroll = () => setScrolled(getLandingScrollTop() > 12)
    onScroll()
    viewport?.addEventListener('scroll', onScroll, { passive: true })
    return () => viewport?.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    if (!menuOpen) return undefined

    const viewport = getLandingScrollViewport()
    const previousOverflow = viewport?.style.overflowY ?? ''
    if (viewport) viewport.style.overflowY = 'hidden'

    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        setMenuOpen(false)
      }
    }

    window.addEventListener('keydown', onKeyDown)

    return () => {
      if (viewport) viewport.style.overflowY = previousOverflow
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [menuOpen])

  return (
    <header className={`${styles.header} ${scrolled ? styles.scrolled : ''}`}>
      <nav className={styles.navbarShell} aria-label="Principal">
        <div className={styles.navbar}>
          <a href="#hero" className={styles.logo}>
            <span className={styles.logoMark}>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
                <path d="M10 1.4 17.1 5.35v9.3L10 18.6l-7.1-3.95v-9.3L10 1.4Z" stroke="currentColor" strokeWidth="1.5" />
                <path
                  d="M6.6 8.1 10 10l3.4-1.9M10 10v4.2M6.6 8.1V12l3.4 2.2M13.4 8.1V12L10 14.2M6.6 8.1 10 5.95l3.4 2.15"
                  stroke="currentColor"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            <span className={styles.logoText}>Plan Things</span>
          </a>

          <ul className={styles.navLinks}>
            {LANDING_NAV_LINKS.map(link => {
              const isActive = activeSection === link.href

              return (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className={`${styles.navLink} ${isActive ? styles.navLinkActive : ''}`}
                    aria-current={isActive ? 'true' : undefined}
                  >
                    {link.label}
                  </a>
                </li>
              )
            })}
          </ul>

          <div className={styles.actions}>
            <Link to={ROUTES.login} className={styles.actionLink}>Entrar</Link>
            <Link to={ROUTES.register} className={styles.ctaBtn}>Começar grátis</Link>
            <button
              type="button"
              className={styles.menuBtn}
              aria-expanded={menuOpen}
              aria-controls="landing-mobile-menu"
              aria-label={menuOpen ? 'Fechar menu' : 'Abrir menu'}
              onClick={() => setMenuOpen((value) => !value)}
            >
              <span />
              <span />
              <span />
            </button>
          </div>
        </div>
      </nav>

      {menuOpen ? (
        <>
          <div
            className={`${styles.mobileOverlay} ${menuOpen ? styles.mobileOverlayOpen : ''}`}
            aria-hidden="false"
            onClick={() => setMenuOpen(false)}
          />

          <div id="landing-mobile-menu" className={`${styles.mobileMenu} ${menuOpen ? styles.mobileMenuOpen : ''}`}>
            <div className={styles.mobileMenuInner}>
              <div className={styles.mobileMenuLinks}>
                {LANDING_NAV_LINKS.map((link) => {
                  const isActive = activeSection === link.href

                  return (
                    <a
                      key={link.label}
                      href={link.href}
                      className={`${styles.mobileMenuLink} ${isActive ? styles.mobileMenuLinkActive : ''}`}
                      aria-current={isActive ? 'true' : undefined}
                      onClick={(event) => {
                        handleLandingHashClick(event)
                        setMenuOpen(false)
                      }}
                    >
                      {link.label}
                    </a>
                  )
                })}
              </div>

              <div className={styles.mobileMenuActions}>
                <Link to={ROUTES.login} className={styles.mobileActionLink} onClick={() => setMenuOpen(false)}>Entrar</Link>
                <Link to={ROUTES.register} className={styles.mobileCtaBtn} onClick={() => setMenuOpen(false)}>Começar grátis</Link>
              </div>
            </div>
          </div>
        </>
      ) : null}
    </header>
  )
}
