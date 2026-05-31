import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../../../auth/context/AuthContext.jsx'
import { apiRequest, triggerBlobDownload } from '../../../../../shared/api/apiClient.js'
import shared from '../blocksShared.module.css'
import {
  isReferenceUnavailable,
  resolveReferenceHref,
  resolveReferenceStatusLabel,
  resolveReferenceSubtitle,
  resolveReferenceTitle,
} from '../referenceBlockUtils.js'

function resolveFileId(block = {}) {
  return block.entityId ?? block.payload?.fileId ?? block.payload?.entityId ?? null
}

export default function FileReferenceBlock({ block }) {
  const { accessToken } = useAuth()
  const [isDownloading, setIsDownloading] = useState(false)
  const [downloadError, setDownloadError] = useState('')

  const title = resolveReferenceTitle(block, 'Arquivo')
  const subtitle = resolveReferenceSubtitle(block)
  const statusLabel = resolveReferenceStatusLabel(block)
  const unavailable = isReferenceUnavailable(block)
  const href = unavailable ? null : resolveReferenceHref(block)
  const fileId = resolveFileId(block)

  const handleDownload = async () => {
    if (!fileId || unavailable) return

    setIsDownloading(true)
    setDownloadError('')
    try {
      const blob = await apiRequest(`/api/files/${fileId}/download`, {
        token: accessToken,
        responseType: 'blob',
      })
      triggerBlobDownload(blob, title)
    } catch (error) {
      setDownloadError(error instanceof Error ? error.message : 'Não foi possível baixar o arquivo.')
    } finally {
      setIsDownloading(false)
    }
  }

  const content = (
    <div>
      <p className={shared.kicker}>Arquivo</p>
      <p className={shared.title}>{title}</p>
      {subtitle ? <p className={shared.meta}>{subtitle}</p> : null}
    </div>
  )

  return (
    <section
      className={`${shared.shell} ${shared.shellCompact}`}
      data-block-kind="entity-reference"
      data-entity-type="FILE_REFERENCE"
      aria-label={`Arquivo: ${title}`}
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
      {!unavailable && fileId ? (
        <button
          type="button"
          className={shared.button}
          onClick={() => { void handleDownload() }}
          disabled={isDownloading}
        >
          {isDownloading ? 'Baixando…' : 'Baixar arquivo'}
        </button>
      ) : null}
      {downloadError ? <p className={shared.meta}>{downloadError}</p> : null}
    </section>
  )
}
