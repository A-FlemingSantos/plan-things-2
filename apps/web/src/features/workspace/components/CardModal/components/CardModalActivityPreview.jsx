import { useEffect, useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import AuthenticatedAvatar from '../../../../../shared/components/AuthenticatedAvatar/AuthenticatedAvatar.jsx'

const COLLAPSED_ITEM_LIMIT = 3

function renderActivityItem(item, styles, getCommentPresenter) {
  if (item.type === 'history') {
    return (
      <p key={item.id} className={styles.cmActivityPreviewHistory}>
        <strong>{item.actor}</strong> {item.text}
      </p>
    )
  }

  const comment = item.comment
  const presenter = getCommentPresenter(comment)

  return (
    <article key={comment.id} className={styles.cmActivityPreviewComment}>
      <AuthenticatedAvatar
        className={styles.cmActivityPreviewAvatar}
        imageClassName={styles.avatarImage}
        style={{ background: presenter.color }}
        avatarUrl={presenter.avatarUrl}
        fallback={presenter.initials}
        title={presenter.name}
      />
      <div className={styles.cmActivityPreviewCommentBody}>
        <div className={styles.cmActivityPreviewCommentMeta}>
          <strong>{presenter.name}</strong>
          <span>{comment.time}</span>
        </div>
        <p className={styles.cmActivityPreviewCommentText}>{comment.text}</p>
      </div>
    </article>
  )
}

export default function CardModalActivityPreview({
  styles,
  iconSize,
  iconStroke,
  activityFeedItems,
  getCommentPresenter,
  isActivitySidebarOpen,
  isMutating,
  cardId,
}) {
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    setExpanded(false)
  }, [cardId])

  if (isActivitySidebarOpen) {
    return null
  }

  const canExpand = activityFeedItems.length > COLLAPSED_ITEM_LIMIT
  const visibleItems = expanded
    ? activityFeedItems
    : activityFeedItems.slice(-COLLAPSED_ITEM_LIMIT)

  return (
    <section className={styles.cmActivityPreview} aria-label="Recentes">
      <div
        className={`${styles.cmActivityPreviewPanel} ${expanded ? styles.cmActivityPreviewPanelExpanded : ''}`}
      >
        <header className={styles.cmActivityPreviewHeader}>
          <p className={styles.cmActivityPreviewTitle}>Recentes</p>
        </header>

        <div className={styles.cmActivityPreviewBody}>
          <div className={styles.cmActivityPreviewFeed}>
            {visibleItems.length === 0 ? (
              <p className={styles.cmActivityPreviewEmpty}>Nenhuma atividade ainda.</p>
            ) : (
              visibleItems.map((item) => renderActivityItem(item, styles, getCommentPresenter))
            )}
          </div>

          {!expanded && canExpand ? (
            <div className={styles.cmActivityPreviewFade} aria-hidden="true" />
          ) : null}
        </div>

        {canExpand ? (
          <button
            type="button"
            className={styles.cmActivityPreviewToggleBtn}
            onClick={() => setExpanded((value) => !value)}
            disabled={isMutating}
            aria-expanded={expanded}
            aria-label={expanded ? 'Recolher activity' : 'Ver mais activity'}
          >
            {expanded ? 'Ver menos' : 'Ver mais'}
            {expanded ? (
              <ChevronUp size={iconSize} strokeWidth={iconStroke} aria-hidden="true" />
            ) : (
              <ChevronDown size={iconSize} strokeWidth={iconStroke} aria-hidden="true" />
            )}
          </button>
        ) : null}
      </div>
    </section>
  )
}
