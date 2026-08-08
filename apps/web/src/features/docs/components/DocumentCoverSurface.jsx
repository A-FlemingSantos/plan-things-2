import { useMemo } from 'react'
import { useAuthenticatedImageUrl } from '../../../shared/hooks/useAuthenticatedImageUrl.js'
import {
  buildDocumentCoverStyle,
  hasDocumentCover,
  isAuthenticatedDocumentCoverUrl,
  resolveDocumentCoverUrl,
} from '../utils/documentCover.js'

export default function DocumentCoverSurface({
  coverImageId,
  className,
  role,
  'aria-label': ariaLabel,
}) {
  const rawUrl = resolveDocumentCoverUrl(coverImageId)
  const authenticatedSource = rawUrl && isAuthenticatedDocumentCoverUrl(rawUrl) ? rawUrl : null
  const resolvedUrl = useAuthenticatedImageUrl(authenticatedSource)
  const style = useMemo(
    () => buildDocumentCoverStyle({ coverImageId, resolvedUrl }),
    [coverImageId, resolvedUrl],
  )

  if (!hasDocumentCover(coverImageId)) {
    return null
  }

  return (
    <span
      className={className}
      style={style}
      role={role}
      aria-label={ariaLabel}
    />
  )
}
