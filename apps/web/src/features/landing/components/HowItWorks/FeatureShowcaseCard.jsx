import FeatureVisualPanel from './FeatureVisualPanel.jsx'
import { useRevealOnScroll } from '../../hooks/useRevealOnScroll.js'
import styles from './HowItWorks.module.css'

const VARIANT_CLASS = {
  'image-left': styles.featureRowImageLeft,
  'image-right': styles.featureRowImageRight,
}

export default function FeatureShowcaseCard({
  variant = 'image-left',
  eyebrow,
  headline,
  body,
  link,
  mockupLabel,
  visualTone = 'green',
  imageSrc,
  imageAlt,
  imageFit = 'cover',
}) {
  const { ref, isRevealed } = useRevealOnScroll()
  const variantClass = VARIANT_CLASS[variant] ?? VARIANT_CLASS['image-left']

  const visualColumn = (
    <div className={styles.featureVisualColumn}>
      <FeatureVisualPanel
        tone={visualTone}
        label={mockupLabel}
        imageSrc={imageSrc}
        imageAlt={imageAlt ?? headline}
        imageFit={imageFit}
      />
    </div>
  )

  const contentColumn = (
    <div className={styles.featureCopy}>
      {eyebrow ? <span className={styles.featureEyebrow}>{eyebrow}</span> : null}
      <h2 className={styles.featureHeadline}>{headline}</h2>
      <p className={styles.featureBody}>{body}</p>
      {link ? (
        <a href={link.href} className={styles.featureCta}>
          {link.label}
        </a>
      ) : null}
    </div>
  )

  return (
    <article
      ref={ref}
      className={`${styles.featureRow} ${variantClass} ${isRevealed ? styles.featureRowRevealed : ''}`}
    >
      {variant === 'image-left' ? (
        <>
          {visualColumn}
          {contentColumn}
        </>
      ) : (
        <>
          {contentColumn}
          {visualColumn}
        </>
      )}
    </article>
  )
}
