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

function ChevronIcon({ open = false }) {
  return (
    <svg
      width="11"
      height="11"
      viewBox="0 0 12 12"
      fill="none"
      className={open ? styles.chevronOpen : styles.chevron}
    >
      <path
        d="M4.5 3l3 3-3 3"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function ToolsIcon() {
  return (
    <svg
      width="11"
      height="11"
      viewBox="0 0 12 12"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.3"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={styles.toolsIcon}
    >
      <path d="M3.5 5h1.5v-1.5l-1.75-1.75a3 3 0 0 1 4 4l3 3a1 1 0 0 1-1.5 1.5l-3-3a3 3 0 0 1-4-4l1.75 1.75" />
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
              <span className={styles.toolsIconWrap} aria-hidden="true">
                <ToolsIcon />
              </span>
              <span>{typeLabel} | {artifact.label || 'item'} | {statusLabel}</span>
              <span className={styles.chevronWrap} aria-hidden="true">
                <ChevronIcon open={expanded} />
              </span>
            </button>
            {expanded ? (
              <div className={styles.details}>
                {detailTitle ? <p className={styles.detailTitle}>{detailTitle}</p> : null}
                {detailText ? <p className={styles.detailText}>{detailText}</p> : null}
                {detailNote ? <p className={styles.detailMeta}>{detailNote}</p> : null}
              </div>
            ) : null}
          </div>
        )
      })}
    </div>
  )
}
