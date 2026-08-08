import { useMemo } from 'react'
import { useAuthenticatedImageUrl } from '../../../shared/hooks/useAuthenticatedImageUrl.js'
import { getDocumentCoverGradient } from '../utils/docVisuals.js'
import {
  buildDocumentCoverStyle,
  isAuthenticatedDocumentCoverUrl,
  resolveDocumentCoverUrl,
} from '../utils/documentCover.js'

export default function DocumentCoverSurface({
  documentId,
  coverImageId,
  className,
  role,
  'aria-label': ariaLabel,
}) {
  const gradient = getDocumentCoverGradient(documentId)
  const rawUrl = resolveDocumentCoverUrl(coverImageId)
  const authenticatedSource = rawUrl && isAuthenticatedDocumentCoverUrl(rawUrl) ? rawUrl : null
  const resolvedUrl = useAuthenticatedImageUrl(authenticatedSource)
  const style = useMemo(
    () => buildDocumentCoverStyle({
      coverImageId,
      documentId,
      gradient,
      resolvedUrl,
    }),
    [coverImageId, documentId, gradient, resolvedUrl],
  )

  return (
    <span
      className={className}
      style={style}
      role={role}
      aria-label={ariaLabel}
    />
  )
}
