import { Link } from 'react-router-dom'
import { ROUTES } from '../../../../shared/config/routes.js'
import ProductMockupFrame from '../HowItWorks/ProductMockupFrame.jsx'
import styles from './Hero.module.css'

export default function Hero() {
  return (
    <div className={styles.hero}>
      <div className={styles.shell}>
        <div className={styles.copyBlock}>
          <div className={styles.headlineGroup}>
            <h1 className={styles.headline}>Seu time, no mesmo quadro.</h1>
            <p className={styles.subheadline}>From developers to developers</p>
          </div>

          <div className={styles.actions}>
            <Link to={ROUTES.register} className={styles.ctaPrimary}>
              Começar grátis
            </Link>
            <a href="#how-it-works" className={styles.ctaSecondary}>
              Ver como funciona
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
                <path
                  d="M2 7h10M8 3.5l3 3-3 3"
                  stroke="currentColor"
                  strokeWidth="1.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </a>
          </div>
        </div>

        <div className={styles.mockShowcase} aria-label="Prévia do produto">
          <div className={styles.mockFrame}>
            <div className={styles.visualStageInner}>
              <ProductMockupFrame label="Plan Things" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
