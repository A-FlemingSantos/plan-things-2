import { useState, useEffect } from 'react'
import styles from './Navbar.module.css'

const NAV_LINKS = [
  { label: 'Produto',    href: '#how-it-works' },
  { label: 'Recursos',   href: '#features' },
  { label: 'Preços',     href: '#pricing' },
  { label: 'Ecossistema', href: '#ecosystem' },
  { label: 'Recursos úteis', href: '#faq' },
]

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

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
          <a href="/login" className={styles.actionLink}>Entrar</a>
          <a href="/cadastro" className={styles.ctaBtn}>Começar grátis</a>
        </div>
      </nav>
    </header>
  )
}
