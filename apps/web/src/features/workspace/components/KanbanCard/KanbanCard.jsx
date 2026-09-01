import { memo } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  Calendar,
  Check,
  CornerDownRight,
  MessageSquareText,
  Paperclip,
} from 'lucide-react'
import AuthenticatedAvatar from '../../../../shared/components/AuthenticatedAvatar/AuthenticatedAvatar.jsx'

const ICON_SIZE = 13
const ICON_SIZE_SM = 12
const ICON_STROKE = 1.75
const disableSortableLayoutChanges = () => false

function isUserComment(comment = {}) {
  return comment.kind !== 'ASSIGNEE_ACTIVITY'
}

function getDescriptionPreview(description) {
  if (!description?.trim()) return ''
  const firstLine = description.trim().split('\n')[0].trim()
  if (firstLine.length <= 72) return firstLine
  return `${firstLine.slice(0, 69)}…`
}

export function KanbanCardView({
  card,
  colTitle,
  isConfirmed,
  isDragging = false,
  isDragOverlay = false,
  onClick,
  onToggleConfirmed,
  labels,
  members,
  styles,
  style,
  setNodeRef,
  dragAttributes = {},
  dragListeners = {},
}) {
  const label = labels.find((item) => item.id === card.labelId)
  const descriptionPreview = getDescriptionPreview(card.description)
  const comments = (card.comments ?? []).filter(isUserComment)
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
  const hasLabel = Boolean(label)
  const isCompactCard = !hasLabel && !descriptionPreview && !hasFooter

  const toggleConfirmed = (event) => {
    event.preventDefault()
    event.stopPropagation()
    onToggleConfirmed?.(card)
  }

  const openCard = () => {
    onClick?.(card, colTitle)
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        ${styles.card}
        ${isCompactCard ? styles.cardCompact : ''}
        ${isConfirmed ? styles.cardConfirmed : ''}
        ${isDragging ? styles.cardDragging : ''}
        ${isDragOverlay ? styles.cardDragOverlay : ''}
      `}
      role="button"
      tabIndex={0}
      {...dragAttributes}
      {...dragListeners}
      onClick={openCard}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          openCard()
        }
      }}
      aria-label={`Abrir cartão ${card.title}`}
    >
      {hasLabel ? (
        <div className={styles.cardLabelBars} aria-label={`Etiqueta ${label.text}`}>
          <span className={styles.cardLabelBar} style={{ background: label.color }} />
        </div>
      ) : null}

      <div className={styles.cardBody}>
        <div className={styles.cardTitleBlock}>
          <button
            type="button"
            className={`${styles.cardConfirmButton} ${isConfirmed ? styles.cardConfirmButtonChecked : ''}`}
            onClick={toggleConfirmed}
            onMouseDown={(event) => event.stopPropagation()}
            onPointerDown={(event) => event.stopPropagation()}
            onKeyDown={(event) => event.stopPropagation()}
            aria-label={isConfirmed ? `Desmarcar cartão ${card.title}` : `Marcar cartão ${card.title}`}
            aria-pressed={isConfirmed}
            tabIndex={0}
          >
            {isConfirmed ? (
              <Check size={ICON_SIZE_SM} strokeWidth={ICON_STROKE} aria-hidden="true" />
            ) : null}
          </button>
          <p className={`${styles.cardTitle} ${isConfirmed ? styles.cardTitleCompleted : ''}`}>{card.title}</p>
        </div>

        {descriptionPreview ? (
          <p className={styles.cardSubtitle}>
            <CornerDownRight
              size={ICON_SIZE_SM}
              strokeWidth={ICON_STROKE}
              aria-hidden="true"
              className={styles.cardSubtitleIcon}
            />
            {descriptionPreview}
          </p>
        ) : null}
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
                <MessageSquareText size={ICON_SIZE} strokeWidth={ICON_STROKE} aria-hidden="true" />
                <span>{comments.length}</span>
              </span>
            ) : null}

            {attachments.length > 0 ? (
              <span className={styles.cardMetaItem} aria-label={`${attachments.length} ${attachments.length === 1 ? 'anexo' : 'anexos'}`}>
                <Paperclip size={ICON_SIZE} strokeWidth={ICON_STROKE} aria-hidden="true" />
                <span>{attachments.length}</span>
              </span>
            ) : null}

            {card.dueDate ? (
              <span
                className={`${styles.cardDue} ${['Amanhã', 'Tomorrow'].includes(card.dueDate) ? styles.cardDueUrgent : ''} ${['Today', 'Hoje'].includes(card.dueDate) ? styles.cardDueToday : ''}`}
                aria-label={`Entrega ${card.dueDate}`}
              >
                <Calendar size={ICON_SIZE} strokeWidth={ICON_STROKE} aria-hidden="true" />
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

function SortableKanbanCard({
  card,
  colId,
  colTitle,
  isConfirmed,
  onClick,
  onToggleConfirmed,
  labels,
  members,
  styles,
  groupId = null,
  isFirstGroupCard = false,
  isLastGroupCard = false,
  suppressLayoutAnimation = false,
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: card.id,
    data: {
      type: 'card',
      columnId: colId,
      cardId: card.id,
      groupId,
      isFirstGroupCard,
      isLastGroupCard,
    },
    animateLayoutChanges: suppressLayoutAnimation
      ? disableSortableLayoutChanges
      : undefined,
  })

  return (
    <KanbanCardView
      card={card}
      colTitle={colTitle}
      isConfirmed={isConfirmed}
      isDragging={isDragging}
      onClick={onClick}
      onToggleConfirmed={onToggleConfirmed}
      labels={labels}
      members={members}
      styles={styles}
      setNodeRef={setNodeRef}
      dragAttributes={attributes}
      dragListeners={listeners}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
    />
  )
}

function KanbanCard({
  card,
  colId,
  colTitle,
  isDragOverlay = false,
  isConfirmed,
  onClick,
  onToggleConfirmed,
  labels,
  members,
  styles,
  groupId,
  isFirstGroupCard,
  isLastGroupCard,
  suppressLayoutAnimation,
}) {
  if (isDragOverlay) {
    return (
      <KanbanCardView
        card={card}
        colTitle={colTitle}
        isConfirmed={isConfirmed}
        isDragOverlay
        onClick={onClick}
        onToggleConfirmed={onToggleConfirmed}
        labels={labels}
        members={members}
        styles={styles}
      />
    )
  }

  return (
    <SortableKanbanCard
      card={card}
      colId={colId}
      colTitle={colTitle}
      isConfirmed={isConfirmed}
      onClick={onClick}
      onToggleConfirmed={onToggleConfirmed}
      labels={labels}
      members={members}
      styles={styles}
      groupId={groupId}
      isFirstGroupCard={isFirstGroupCard}
      isLastGroupCard={isLastGroupCard}
      suppressLayoutAnimation={suppressLayoutAnimation}
    />
  )
}

function areKanbanCardPropsEqual(prevProps, nextProps) {
  return prevProps.card === nextProps.card
    && prevProps.colId === nextProps.colId
    && prevProps.colTitle === nextProps.colTitle
    && prevProps.isDragOverlay === nextProps.isDragOverlay
    && prevProps.isConfirmed === nextProps.isConfirmed
    && prevProps.labels === nextProps.labels
    && prevProps.members === nextProps.members
    && prevProps.onClick === nextProps.onClick
    && prevProps.groupId === nextProps.groupId
    && prevProps.isFirstGroupCard === nextProps.isFirstGroupCard
    && prevProps.isLastGroupCard === nextProps.isLastGroupCard
    && prevProps.suppressLayoutAnimation === nextProps.suppressLayoutAnimation
    && prevProps.styles === nextProps.styles
}

export default memo(KanbanCard, areKanbanCardPropsEqual)
