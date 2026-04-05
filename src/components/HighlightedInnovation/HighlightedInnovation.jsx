import { useEffect, useRef, useState } from 'react'
import highlightedBackground from '../../../minimal-drift.jpg'
import styles from './HighlightedInnovation.module.css'

export default function HighlightedInnovation() {
  const stageRef = useRef(null)
  const [scrollProgress, setScrollProgress] = useState(0)

  useEffect(() => {
    const updateProgress = () => {
      const stage = stageRef.current
      if (!stage) return

      const rect = stage.getBoundingClientRect()
      const viewportHeight = window.innerHeight || 1
      const earlyStartOffset = viewportHeight * 0.5
      const totalTravel = Math.max(rect.height - viewportHeight + earlyStartOffset * 2, 1)
      const current = Math.min(Math.max(earlyStartOffset - rect.top, 0), totalTravel)
      setScrollProgress(current / totalTravel)
    }

    updateProgress()
    window.addEventListener('scroll', updateProgress, { passive: true })
    window.addEventListener('resize', updateProgress)

    return () => {
      window.removeEventListener('scroll', updateProgress)
      window.removeEventListener('resize', updateProgress)
    }
  }, [])

  const focusStrength = 1 - Math.abs(scrollProgress - 0.5) / 0.5
  const scale = 0.86 + focusStrength * 0.14
  const radius = 40 - focusStrength * 40

  return (
    <div className={styles.stage} ref={stageRef}>
      <div className={styles.stickyFrame}>
        <div
          className={styles.section}
          style={{
            backgroundImage: `url(${highlightedBackground})`,
            transform: `scale(${scale})`,
            borderRadius: `${radius}px`,
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

            <a href="#pricing" className={styles.cta}>
              Planejar com mais inteligência
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
