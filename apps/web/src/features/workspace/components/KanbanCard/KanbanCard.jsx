import AuthenticatedAvatar from '../../../../shared/components/AuthenticatedAvatar/AuthenticatedAvatar.jsx'

export default function KanbanCard({
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
  const assignedMembers = card.memberIds
    .map((id) => members.find((member) => member.id === id))
    .filter(Boolean)
  const hasFooter = assignedMembers.length > 0 || card.comments.length > 0 || Boolean(card.dueDate)
  const isCompactCard = !label && !hasFooter
  const toggleConfirmed = (event) => {
    event.preventDefault()
    event.stopPropagation()
    onToggleConfirmed?.(card.id)
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
      {label ? (
        <span className={styles.cardLabel} style={{ background: `${label.color}20`, color: label.color }}>
          {label.text}
        </span>
      ) : null}

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
        <p className={styles.cardTitle}>{card.title}</p>
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
            {card.comments.length > 0 ? (
              <span className={styles.cardMetaItem}>
                <CommentIcon />
                <span>{card.comments.length}</span>
              </span>
            ) : null}

            {card.dueDate ? (
              <span className={`${styles.cardDue} ${['Today', 'Hoje'].includes(card.dueDate) ? styles.cardDueUrgent : ''}`}>
                <ClockIcon />
                {card.dueDate}
              </span>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  )
}
