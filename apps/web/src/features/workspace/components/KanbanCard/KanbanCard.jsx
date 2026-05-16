import { memo } from 'react'
import AuthenticatedAvatar from '../../../../shared/components/AuthenticatedAvatar/AuthenticatedAvatar.jsx'

function KanbanCard({
  card,
  colId,
  isDragging,
  isDropTarget,
  draggedFile,
  isFileDropTarget,
  isFileDropDisabled,
  isConfirmed,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  onFileDragOver,
  onFileDrop,
  onClick,
  onToggleConfirmed,
  labels,
  members,
  CheckIcon,
  CommentIcon,
  ClockIcon,
  styles,
}) {
  const label = labels.find((item) => item.id === card.labelId)
  const comments = card.comments ?? []
  const attachments = card.attachments ?? []
  const [activeChecklist] = Array.isArray(card.checklists) ? card.checklists : []
  const checklistItems = activeChecklist?.items ?? []
  const checklistCheckedItems = checklistItems.filter((item) => Boolean(item.checked ?? item.completed)).length
  const checklistProgress = activeChecklist
    ? (checklistItems.length === 0 ? 0 : Math.round((checklistCheckedItems / checklistItems.length) * 100))
    : null
  const assignedMembers = (card.memberIds ?? [])
    .map((id) => members.find((member) => member.id === id))
    .filter(Boolean)
  const hasFooter = assignedMembers.length > 0
    || comments.length > 0
    || Boolean(card.dueDate)
    || attachments.length > 0
    || checklistProgress !== null
  const isCompactCard = !label && !hasFooter
  const toggleConfirmed = (event) => {
    event.preventDefault()
    event.stopPropagation()
    onToggleConfirmed?.(card)
  }

  return (
    <div
      className={`
        ${styles.card}
        ${isCompactCard ? styles.cardCompact : ''}
        ${isConfirmed ? styles.cardConfirmed : ''}
        ${isDragging ? styles.cardDragging : ''}
        ${isDropTarget ? styles.cardDropTarget : ''}
        ${isFileDropTarget ? styles.cardFileDropTarget : ''}
        ${isFileDropDisabled ? styles.cardFileDropDisabled : ''}
      `}
      role="button"
      tabIndex={0}
      draggable
      onDragStart={() => onDragStart(card.id, colId)}
      onDragOver={(event) => {
        if (draggedFile) {
          event.preventDefault()
          event.stopPropagation()
          event.dataTransfer.dropEffect = isFileDropDisabled ? 'none' : 'copy'
          onFileDragOver?.(isFileDropDisabled ? null : card.id)
          return
        }

        event.preventDefault()
        event.stopPropagation()
        onDragOver({ type: 'card', cardId: card.id, colId })
      }}
      onDrop={(event) => {
        if (draggedFile) {
          event.preventDefault()
          event.stopPropagation()
          if (!isFileDropDisabled) {
            onFileDrop?.(draggedFile, card.id)
          }
          return
        }

        event.preventDefault()
        event.stopPropagation()
        onDrop({ type: 'card', cardId: card.id, colId })
      }}
      onDragEnd={onDragEnd}
      onClick={onClick}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          onClick()
        }
      }}
      aria-label={`Abrir cartão ${card.title}`}
    >
      <div className={styles.cardTitleRow}>
        <button
          type="button"
          className={`${styles.cardConfirmButton} ${isConfirmed ? styles.cardConfirmButtonChecked : ''}`}
          onClick={toggleConfirmed}
          onMouseDown={(event) => event.stopPropagation()}
          onKeyDown={(event) => event.stopPropagation()}
          aria-label={isConfirmed ? `Desmarcar cartão ${card.title}` : `Marcar cartão ${card.title}`}
          aria-pressed={isConfirmed}
          draggable={false}
          tabIndex={0}
        >
          {isConfirmed ? <CheckIcon /> : null}
        </button>
        <div className={styles.cardTitleContent}>
          <div className={`${styles.cardTitleViewport} ${label ? styles.cardTitleViewportWithLabel : ''}`}>
            <p className={`${styles.cardTitle} ${label ? styles.cardTitleWithLabel : ''}`}>{card.title}</p>
          </div>
          {label ? (
            <span className={styles.cardLabel} style={{ background: `${label.color}20`, color: label.color }}>
              {label.text}
            </span>
          ) : null}
        </div>
      </div>

      {hasFooter ? (
        <div className={styles.cardFooter}>
          <div className={styles.cardMembers}>
            {assignedMembers.map((member) => (
              <AuthenticatedAvatar
                key={member.id}
                className={styles.cardAvatar}
                style={{ background: member.color }}
                avatarUrl={member.avatarUrl}
                fallback={member.initials}
                title={member.name ?? member.email ?? member.initials}
                imageClassName={styles.avatarImage}
              />
            ))}
          </div>

          <div className={styles.cardMeta}>
            {comments.length > 0 ? (
              <span className={styles.cardMetaItem}>
                <CommentIcon />
                <span>{comments.length}</span>
              </span>
            ) : null}

            {attachments.length > 0 ? (
              <span className={styles.cardMetaItem} aria-label={`${attachments.length} ${attachments.length === 1 ? 'anexo' : 'anexos'}`}>
                <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                  <path d="M5.1 10.9 9 7a2 2 0 1 0-2.8-2.8L2.8 7.6a3.3 3.3 0 0 0 4.7 4.7l4.1-4.1a4.2 4.2 0 0 0-5.9-5.9L2.9 5.1" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span>{attachments.length}</span>
              </span>
            ) : null}

            {card.dueDate ? (
              <span
                className={`${styles.cardDue} ${['Today', 'Hoje'].includes(card.dueDate) ? styles.cardDueUrgent : ''}`}
                aria-label={`Entrega ${card.dueDate}`}
              >
                {ClockIcon ? <ClockIcon /> : null}
                {card.dueDate}
              </span>
            ) : null}

            {checklistProgress !== null ? (
              <span
                className={styles.cardMetaItem}
                aria-label={`Checklist ${checklistProgress}% concluída`}
              >
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 16 16"
                  fill="none"
                  aria-hidden="true"
                  className={styles.cardChecklistProgressIcon}
                >
                  <circle
                    cx="8"
                    cy="8"
                    r="5.5"
                    className={styles.cardChecklistProgressTrack}
                    strokeWidth="1.6"
                  />
                  <circle
                    cx="8"
                    cy="8"
                    r="5.5"
                    className={styles.cardChecklistProgressValue}
                    strokeWidth="1.6"
                    pathLength="100"
                    strokeDasharray="100"
                    strokeDashoffset={100 - checklistProgress}
                  />
                </svg>
                <span>{checklistProgress}%</span>
              </span>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  )
}

function areKanbanCardPropsEqual(prevProps, nextProps) {
  return prevProps.card === nextProps.card
    && prevProps.colId === nextProps.colId
    && prevProps.isDragging === nextProps.isDragging
    && prevProps.isDropTarget === nextProps.isDropTarget
    && prevProps.draggedFile === nextProps.draggedFile
    && prevProps.isFileDropTarget === nextProps.isFileDropTarget
    && prevProps.isFileDropDisabled === nextProps.isFileDropDisabled
    && prevProps.isConfirmed === nextProps.isConfirmed
    && prevProps.labels === nextProps.labels
    && prevProps.members === nextProps.members
    && prevProps.CheckIcon === nextProps.CheckIcon
    && prevProps.CommentIcon === nextProps.CommentIcon
    && prevProps.ClockIcon === nextProps.ClockIcon
    && prevProps.styles === nextProps.styles
}

export default memo(KanbanCard, areKanbanCardPropsEqual)
