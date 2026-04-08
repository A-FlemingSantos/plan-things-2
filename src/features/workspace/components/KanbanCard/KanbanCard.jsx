export default function KanbanCard({
  card,
  colId,
  isDragging,
  isDropTarget,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  onClick,
  labels,
  members,
  CommentIcon,
  ClockIcon,
  styles,
}) {
  const label = labels.find((item) => item.id === card.labelId)
  const assignedMembers = card.memberIds
    .map((id) => members.find((member) => member.id === id))
    .filter(Boolean)

  return (
    <div
      className={`
        ${styles.card}
        ${isDragging ? styles.cardDragging : ''}
        ${isDropTarget ? styles.cardDropTarget : ''}
      `}
      role="button"
      tabIndex={0}
      draggable
      onDragStart={() => onDragStart(card.id, colId)}
      onDragOver={(event) => {
        event.preventDefault()
        event.stopPropagation()
        onDragOver({ type: 'card', cardId: card.id, colId })
      }}
      onDrop={(event) => {
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
      aria-label={`Open card ${card.title}`}
    >
      {label ? (
        <span className={styles.cardLabel} style={{ background: `${label.color}20`, color: label.color }}>
          {label.text}
        </span>
      ) : null}

      <p className={styles.cardTitle}>{card.title}</p>

      <div className={styles.cardFooter}>
        <div className={styles.cardMembers}>
          {assignedMembers.map((member) => (
            <span
              key={member.id}
              className={styles.cardAvatar}
              style={{ background: member.color }}
              title={member.initials}
            >
              {member.initials}
            </span>
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
            <span className={`${styles.cardDue} ${card.dueDate === 'Today' ? styles.cardDueUrgent : ''}`}>
              <ClockIcon />
              {card.dueDate}
            </span>
          ) : null}
        </div>
      </div>
    </div>
  )
}
