import { useAuthenticatedImageUrl } from '../../../../shared/hooks/useAuthenticatedImageUrl.js'
import workspaceCoverStyles from '../../pages/Workspace/Workspace.module.css'
import { resolveCoverThemeClass } from './workspaceCoverUtils.js'

export default function PlanCoverThumbnail({ plan, className = '', style }) {
  const coverThemeClassName = resolveCoverThemeClass(workspaceCoverStyles, plan?.coverThemeId)
  const rawCoverImageUrl = plan?.coverImageThumb ?? plan?.coverImage ?? null
  const isImageCover = Boolean(rawCoverImageUrl)
  const resolvedCoverImageUrl = useAuthenticatedImageUrl(isImageCover ? rawCoverImageUrl : null)
  const coverClassName = [
    workspaceCoverStyles.planCover,
    coverThemeClassName,
    isImageCover ? workspaceCoverStyles.planCoverImage : '',
    className,
  ].filter(Boolean).join(' ')
  const coverStyle = plan?.coverThemeId
    ? {
        '--cover-fallback': plan.cover,
        ...style,
      }
    : isImageCover && resolvedCoverImageUrl
      ? {
          '--cover-fallback': plan.cover,
          '--cover-bg': `url(${resolvedCoverImageUrl})`,
          ...style,
        }
      : {
          '--cover-fallback': plan?.cover ?? 'var(--surface-3)',
          ...style,
        }

  return <span className={coverClassName} style={coverStyle} aria-hidden="true" />
}
