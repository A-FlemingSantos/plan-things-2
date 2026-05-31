import { Link } from 'react-router-dom'
import shared from '../blocksShared.module.css'
import {
  isReferenceUnavailable,
  resolveReferenceHref,
  resolveReferenceStatusLabel,
  resolveReferenceSubtitle,
  resolveReferenceTitle,
} from '../referenceBlockUtils.js'

export default function CardReferenceBlock({ block }) {
  const title = resolveReferenceTitle(block, 'Cartão')
  const subtitle = resolveReferenceSubtitle(block)
  const statusLabel = resolveReferenceStatusLabel(block)
  const unavailable = isReferenceUnavailable(block)
  const href = unavailable ? null : resolveReferenceHref(block)

  const content = (
    <div>
      <p className={shared.kicker}>Cartão</p>
      <p className={shared.title}>{title}</p>
      {subtitle ? <p className={shared.meta}>{subtitle}</p> : null}
    </div>
  )

  return (
    <section
      className={`${shared.shell} ${shared.shellCompact}`}
      data-block-kind="entity-reference"
      data-entity-type="CARD_REFERENCE"
      aria-label={`Cartão: ${title}`}
    >
      <div className={shared.linkRow}>
        {href ? (
          <Link to={href} className={`${shared.link} ${shared.linkRow}`}>
            {content}
          </Link>
        ) : (
          <div className={shared.linkRow}>{content}</div>
        )}
        {statusLabel ? (
          <span className={`${shared.badge} ${unavailable ? shared.badgeMuted : shared.badgeSuccess}`}>
            {statusLabel}
          </span>
        ) : null}
      </div>
    </section>
  )
}
