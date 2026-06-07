import { Link } from 'react-router-dom'
import { ROUTES } from '../../../../shared/config/routes.js'
import { LANDING_NAV_LINKS } from '../../config/landingNav.js'
import { useLandingActiveSection } from '../../hooks/useLandingActiveSection.js'
import styles from './SectionNav.module.css'

export default function SectionNav() {
  const active = useLandingActiveSection()

  return (
    <div className={styles.wrapper}>
      <div className={`${styles.bar} container`}>
        <nav className={styles.nav} aria-label="Navegação por seções">
          {LANDING_NAV_LINKS.map(s => (
            <a
              key={s.href}
              href={s.href}
              className={`${styles.link} ${active === s.href ? styles.active : ''}`}
              aria-current={active === s.href ? 'true' : undefined}
            >
              {s.label}
            </a>
          ))}
        </nav>

        <Link to={ROUTES.register} className={styles.cta}>
          Começar
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M3 7h8M8 4l3 3-3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </Link>
      </div>
    </div>
  )
}
