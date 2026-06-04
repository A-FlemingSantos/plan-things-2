import styles from './HowItWorks.module.css'

/** Nível 3: janela do produto (dentro do painel visual). */
export default function ProductMockupFrame({
  label,
  imageSrc,
  imageAlt,
  imageFit = 'cover',
}) {
  return (
    <div className={styles.mockupFrame}>
      <div className={styles.mockupChrome} aria-hidden>
        <div className={styles.mockupTraffic}>
          <span className={styles.mockupDot} data-tone="red" />
          <span className={styles.mockupDot} data-tone="yellow" />
          <span className={styles.mockupDot} data-tone="green" />
        </div>
        {label ? <span className={styles.mockupChromeTitle}>{label}</span> : null}
      </div>

      <div className={styles.mockupMedia}>
        {imageSrc ? (
          <img
            src={imageSrc}
            alt={imageAlt ?? label ?? ''}
            className={styles.mockupImage}
            style={{ objectFit: imageFit }}
          />
        ) : (
          <div className={styles.mockupPlaceholder} aria-hidden>
            <div className={styles.mockupPlaceholderGrid} />
            <p className={styles.mockupPlaceholderHint}>Screenshot do produto</p>
          </div>
        )}
      </div>
    </div>
  )
}
