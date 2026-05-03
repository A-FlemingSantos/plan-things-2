import { Link } from 'react-router-dom'
import highlightedBackground from '../../../../../minimal-drift.jpg'
import { ROUTES } from '../../../../shared/config/routes.js'
import styles from './HighlightedInnovation.module.css'

export default function HighlightedInnovation() {
  return (
    <div className={styles.stage}>
      <div className={styles.stickyFrame}>
        <div
          className={styles.section}
          style={{
            backgroundImage: `url(${highlightedBackground})`,
          }}
        >
          <div className={styles.overlay} aria-hidden />

          <div className={`${styles.inner} container`}>
            <p className={styles.eyebrow}>Recurso em destaque</p>

            <h2 className={styles.heading}>
              Elimine cada gargalo.<br />
              <span className={styles.headingLight}>Entregue com confiança.</span>
            </h2>

            <p className={styles.subtext}>
              A IA do Plan Things monitora seu quadro em tempo real, identifica
              riscos, redistribui cargas e aciona as pessoas certas antes que
              um atraso vire problema.
            </p>

            <Link to={ROUTES.register} className={styles.cta}>
              Planejar com mais inteligência
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
