import ProductMockupFrame from './ProductMockupFrame.jsx'
import styles from './HowItWorks.module.css'

const VARIANT_CLASS = {
  'image-left': styles.featureCardImageLeft,
  'image-right': styles.featureCardImageRight,
}

export default function FeatureShowcaseCard({
  variant = 'image-left',
  eyebrow,
  headline,
  body,
  link,
  mockupLabel,
  imageSrc,
  imageAlt,
  imageFit = 'cover',
}) {
  const variantClass = VARIANT_CLASS[variant] ?? VARIANT_CLASS['image-left']

  const visualColumn = (
    <div className={styles.featureCardVisual}>
      <div className={styles.featureVisualStage}>
        <div className={styles.featureVisualStageInner}>
          <ProductMockupFrame
            label={mockupLabel}
            imageSrc={imageSrc}
            imageAlt={imageAlt ?? headline}
            imageFit={imageFit}
          />
        </div>
      </div>
    </div>
  )

  const contentColumn = (
    <div className={styles.featureCopy}>
      <span className={styles.featureEyebrow}>{eyebrow}</span>
      <h2 className={styles.featureHeadline}>{headline}</h2>
      <p className={styles.featureBody}>{body}</p>
      {link ? (
        <a href={link.href} className={styles.featureLink}>
          {link.label}
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
      ) : null}
    </div>
  )

  return (
    <article className={`${styles.featureCard} ${variantClass}`}>
      <div className={styles.featureCardLayout}>
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
      </div>
    </article>
  )
}
