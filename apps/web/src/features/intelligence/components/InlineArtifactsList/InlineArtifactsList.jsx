import { useState } from 'react'
import styles from './InlineArtifactsList.module.css'

const INLINE_TYPE_LABELS = {
  TOOL_STATUS: 'Ferramenta',
}

const INLINE_STATUS_LABELS = {
  pending: 'pendente',
  running: 'em execução',
  completed: 'concluída',
  failed: 'falhou',
}

function resolveInlineTypeLabel(type) {
  return INLINE_TYPE_LABELS[String(type ?? '').trim().toUpperCase()] ?? 'Inline'
}

function resolveInlineStatusLabel(status) {
  const key = String(status ?? '').trim().toLowerCase()
  return INLINE_STATUS_LABELS[key] ?? (key || 'desconhecido')
}

function Chevron({ expanded }) {
  return (
    <svg
      viewBox="0 0 12 12"
      aria-hidden="true"
      className={`${styles.chevron} ${expanded ? styles.chevronExpanded : ''}`}
    >
      <path
        d="M4 2.5L7.5 6 4 9.5"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.4"
      />
    </svg>
  )
}

export default function InlineArtifactsList({ items = [] }) {
  const sortedItems = [...items].sort((left, right) => left.position - right.position)
  const [expandedIds, setExpandedIds] = useState(() => new Set())

  if (sortedItems.length === 0) return null

  const toggleItem = (artifactId) => {
    setExpandedIds((current) => {
      const next = new Set(current)
      if (next.has(artifactId)) {
        next.delete(artifactId)
      } else {
        next.add(artifactId)
      }
      return next
    })
  }

  return (
    <div className={styles.root} data-testid="inline-artifacts-list">
      {sortedItems.map((artifact, index) => {
        const artifactId = artifact.id || `inline-artifact-${index}`
        const expanded = expandedIds.has(artifactId)
        const typeLabel = resolveInlineTypeLabel(artifact.type)
        const statusLabel = resolveInlineStatusLabel(artifact.status)
        const detailTitle = String(artifact.payload?.title ?? '').trim()
        const detailText = String(artifact.detail ?? '').trim()
        const detailNote = String(artifact.payload?.note ?? '').trim()

        return (
          <div key={artifactId} className={styles.item}>
            <button
              type="button"
              className={styles.trigger}
              aria-expanded={expanded ? 'true' : 'false'}
              onClick={() => toggleItem(artifactId)}
            >
              <span className={styles.summary}>
                <span className={`${styles.segment} ${styles.segmentStrong}`}>{typeLabel}</span>
                <span className={styles.separator}>|</span>
                <span className={styles.segment}>{artifact.label || 'item'}</span>
                <span className={styles.separator}>|</span>
                <span className={styles.segment}>{statusLabel}</span>
              </span>
              <Chevron expanded={expanded} />
            </button>
            {expanded ? (
              <div className={styles.details}>
                {detailTitle ? <p className={styles.detailTitle}>{detailTitle}</p> : null}
                {detailText ? <p className={styles.detailBody}>{detailText}</p> : null}
                {detailNote ? <p className={styles.detailMeta}>{detailNote}</p> : null}
              </div>
            ) : null}
          </div>
        )
      })}
    </div>
  )
}
