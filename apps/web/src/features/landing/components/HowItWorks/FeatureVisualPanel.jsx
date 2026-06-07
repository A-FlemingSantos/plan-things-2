import styles from './HowItWorks.module.css'

const FLOATING_CARDS = [
  { id: 'a', title: 'Draft', offset: 'top-left' },
  { id: 'b', title: 'Chat', offset: 'center' },
  { id: 'c', title: 'Prompt', offset: 'bottom-right' },
]

function CardIcon() {
  return (
    <span className={styles.floatingCardIcon} aria-hidden>
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <rect x="2" y="1.5" width="10" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
        <path d="M4.5 5h5M4.5 7.5h3.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      </svg>
    </span>
  )
}

function SkeletonLines() {
  return (
    <div className={styles.floatingCardLines} aria-hidden>
      <span />
      <span />
      <span data-short />
    </div>
  )
}

export default function FeatureVisualPanel({ tone = 'green', label, imageSrc, imageAlt, imageFit = 'cover' }) {
  if (imageSrc) {
    return (
      <div className={styles.featureVisual} data-tone={tone}>
        <img
          src={imageSrc}
          alt={imageAlt ?? label ?? ''}
          className={styles.featureVisualImage}
          style={{ objectFit: imageFit }}
        />
      </div>
    )
  }

  return (
    <div className={styles.featureVisual} data-tone={tone} aria-hidden>
      {FLOATING_CARDS.map((card, index) => (
        <div
          key={card.id}
          className={styles.floatingCard}
          data-offset={card.offset}
          style={{ '--card-index': index }}
        >
          <div className={styles.floatingCardHeader}>
            <CardIcon />
            <span className={styles.floatingCardTitle}>{index === 0 && label ? label : card.title}</span>
          </div>
          <SkeletonLines />
        </div>
      ))}
    </div>
  )
}
