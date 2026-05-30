import { Link } from 'react-router-dom'
import shared from '../blocksShared.module.css'

const REFERENCE_LABELS = {
  PLAN_REFERENCE: 'Plano',
  CARD_REFERENCE: 'Cartão',
  FILE_REFERENCE: 'Arquivo',
  MEMBER_REFERENCE: 'Membro',
  INBOX_REFERENCE: 'Inbox',
  GITHUB_COMMIT_REFERENCE: 'Commit',
  GITHUB_PULL_REQUEST_REFERENCE: 'Pull request',
}

function resolveReferenceLabel(blockType) {
  return REFERENCE_LABELS[blockType] ?? 'Referência'
}

function isInternalHref(href) {
  return typeof href === 'string' && href.startsWith('/')
}

function ReferenceLink({ href, className, children }) {
  if (!href) {
    return <div className={className}>{children}</div>
  }

  if (isInternalHref(href)) {
    return (
      <Link to={href} className={`${shared.link} ${className}`}>
        {children}
      </Link>
    )
  }

  return (
    <a
      href={href}
      className={`${shared.link} ${className}`}
      target="_blank"
      rel="noopener noreferrer"
    >
      {children}
    </a>
  )
}

export default function EntityReferenceBlock({ block }) {
  const blockType = String(block?.type ?? '').toUpperCase()
  const payload = block?.payload ?? {}
  const snapshot = block?.snapshot ?? payload.snapshot ?? {}
  const href = block?.href ?? payload.href ?? null
  const title = String(block?.title ?? snapshot.title ?? 'Referência')
  const subtitle = String(snapshot.subtitle ?? '').trim()
  const statusLabel = String(snapshot.statusLabel ?? '').trim()
  const isMock = Boolean(snapshot.mock)

  return (
    <section
      className={`${shared.shell} ${shared.shellCompact}`}
      data-block-kind="entity-reference"
      data-entity-type={blockType}
      aria-label={`${resolveReferenceLabel(blockType)}: ${title}`}
    >
      <div className={shared.linkRow}>
        <ReferenceLink href={href} className={shared.linkRow}>
          <div>
            <p className={shared.kicker}>{resolveReferenceLabel(blockType)}</p>
            <p className={shared.title}>{title}</p>
            {subtitle ? <p className={shared.meta}>{subtitle}</p> : null}
          </div>
        </ReferenceLink>
        {statusLabel ? (
          <span className={`${shared.badge} ${isMock ? shared.badgeMuted : shared.badgeSuccess}`}>
            {statusLabel}
          </span>
        ) : null}
      </div>
      {isMock ? (
        <p className={shared.mockNote}>Link de pré-visualização — entidade simulada.</p>
      ) : null}
    </section>
  )
}
