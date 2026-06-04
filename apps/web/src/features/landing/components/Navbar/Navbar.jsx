import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ROUTES } from '../../../../shared/config/routes.js'
import styles from './Navbar.module.css'

const NAV_LINKS = [
  { label: 'Produto',    href: '#how-it-works' },
  { label: 'Preços',     href: '#pricing' },
  { label: 'Ecossistema', href: '#ecosystem' },
  { label: 'Recursos úteis', href: '#faq' },
]

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    if (!menuOpen) return undefined

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        setMenuOpen(false)
      }
    }

    window.addEventListener('keydown', onKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [menuOpen])

  return (
    <header className={`${styles.header} ${scrolled ? styles.scrolled : ''}`}>
      <nav className={`${styles.navbar} container`}>
        {/* Logo */}
        <a href="#hero" className={styles.logo}>
          <span className={styles.logoMark}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <rect x="2"  y="2"  width="7" height="7" rx="2" fill="currentColor" />
              <rect x="11" y="2"  width="7" height="7" rx="2" fill="currentColor" opacity=".35" />
              <rect x="2"  y="11" width="7" height="7" rx="2" fill="currentColor" opacity=".55" />
              <rect x="11" y="11" width="7" height="7" rx="2" fill="currentColor" opacity=".75" />
            </svg>
          </span>
          <span className={styles.logoText}>Plan Things</span>
        </a>

        {/* Divider */}
        <span className={styles.divider} aria-hidden />

        {/* Nav links */}
        <ul className={styles.navLinks}>
          {NAV_LINKS.map(link => (
            <li key={link.label}>
              <a href={link.href} className={styles.navLink}>{link.label}</a>
            </li>
          ))}
        </ul>

        {/* Actions */}
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
      </nav>

      {menuOpen ? (
        <>
          <div
            className={`${styles.mobileOverlay} ${menuOpen ? styles.mobileOverlayOpen : ''}`}
            aria-hidden="false"
            onClick={() => setMenuOpen(false)}
          />

          <div id="landing-mobile-menu" className={`${styles.mobileMenu} ${menuOpen ? styles.mobileMenuOpen : ''}`}>
            <div className={`${styles.mobileMenuInner} container`}>
              <div className={styles.mobileMenuLinks}>
                {NAV_LINKS.map((link) => (
                  <a key={link.label} href={link.href} className={styles.mobileMenuLink} onClick={() => setMenuOpen(false)}>
                    {link.label}
                  </a>
                ))}
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
