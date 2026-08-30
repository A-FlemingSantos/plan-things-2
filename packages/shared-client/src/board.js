import {
  createOffsetDateTime,
  formatCardDueLabel,
  formatDateInputFromIso,
  formatTimeInputFromIso,
  normalizeTimeZone,
  selectedDayFromSchedule,
} from './dates.js'
import { getFileTypeFromName } from './files.js'

function mapBoardComment(comment) {
  const author = comment.author ?? null

  return {
    id: comment.id,
    author: comment.authorName,
    authorId: author?.id ?? null,
    authorName: comment.authorName,
    authorAvatarUrl: author?.avatarUrl ?? null,
    text: comment.message,
    kind: comment.kind ?? 'USER_COMMENT',
    time: comment.createdAt?.text ?? 'Agora',
    createdAtIso: comment.createdAt?.iso ?? null,
  }
}

function mapBoardChecklistItem(item = {}) {
  const title = item.title ?? item.text ?? ''
  const completed = Boolean(item.completed ?? item.checked)

  return {
    ...item,
    title,
    text: title,
    completed,
    checked: completed,
  }
}

function mapBoardChecklist(checklist = {}) {
  return {
    ...checklist,
    title: checklist.title ?? 'Checklist',
    items: (checklist.items ?? []).map(mapBoardChecklistItem),
  }
}

export function mapBoardCard(card, options = {}) {
  const timeZone = normalizeTimeZone(options.timeZone)
  const locale = options.locale ?? 'pt-BR'
  const dateFormat = options.dateFormat ?? 'dd/MM/yyyy'

  return {
    id: card.id,
    columnId: card.columnId,
    title: card.title,
    description: card.description ?? '',
    isCompleted: Boolean(card.completed),
    completed: Boolean(card.completed),
    starred: Boolean(card.starred),
    labelId: card.label?.id ?? '',
    memberIds: (card.assignees ?? []).map((member) => member.id),
    dueDate: formatCardDueLabel(card.dueAt, { locale, timeZone }),
    startAt: card.startAt ?? null,
    dueAt: card.dueAt ?? null,
    comments: (card.comments ?? []).map(mapBoardComment),
    attachments: Array.isArray(card.attachments)
      ? card.attachments.map((attachment) => ({
          id: attachment.id,
          fileId: attachment.fileId,
          name: attachment.name,
          type: attachment.type === 'FOLDER' ? 'folder' : getFileTypeFromName(attachment.name),
          mimeType: attachment.mimeType ?? '',
          size: attachment.sizeBytes ?? 0,
          attachedBy: attachment.attachedBy ?? null,
          attachedByCurrentUser: Boolean(attachment.attachedByCurrentUser),
          canRemove: Boolean(attachment.canRemove),
          createdAt: attachment.createdAt ?? null,
        }))
      : [],
    kind: card.kind,
    schedule: {
      selectedCalendarDay: selectedDayFromSchedule(card.startAt, card.dueAt, { timeZone }),
      startEnabled: Boolean(card.startAt?.iso),
      startDateValue: formatDateInputFromIso(card.startAt?.iso, { dateFormat, timeZone }),
      dueEnabled: Boolean(card.dueAt?.iso),
      dueDateValue: formatDateInputFromIso(card.dueAt?.iso, { dateFormat, timeZone }),
      dueTimeValue: formatTimeInputFromIso(card.dueAt?.iso, { timeZone }),
      displayLabel: formatCardDueLabel(card.dueAt, { locale, timeZone }),
      preserveDisplayLabel: false,
    },
    checklists: (card.checklists ?? []).map(mapBoardChecklist),
    raw: card,
  }
}

export function mapBoardViewToColumns(boardView, options = {}) {
  return (boardView.columns ?? []).map((column) => ({
    id: column.id,
    title: column.title,
    color: column.color,
    status: typeof column.status === 'string' ? column.status : '',
    cards: (column.cards ?? []).map((card) => mapBoardCard(card, options)),
    groups: mapBoardColumnGroups(column.groups),
  }))
}

function mapBoardColumnGroups(groups) {
  if (!Array.isArray(groups)) {
    return []
  }

  return groups.flatMap((group) => {
    if (!group?.id || !group.startCardId) {
      return []
    }

    return [{
      id: group.id,
      title: typeof group.title === 'string' ? group.title : '',
      startCardId: group.startCardId,
      collapsed: Boolean(group.collapsed),
    }]
  })
}

export function mergeBoardIntoPlan(plan, boardView, options = {}) {
  return {
    ...plan,
    boardColumns: mapBoardViewToColumns(boardView, options),
    labelsMeta: (boardView.labels ?? []).map((label) => ({
      id: label.id,
      text: label.name,
      name: label.name,
      color: label.color,
    })),
    tasks: (boardView.columns ?? []).reduce((sum, column) => sum + (column.cards ?? []).length, 0),
    boardLoaded: true,
  }
}

export function buildBoardCardPayload(card, options = {}) {
  const dateFormat = options.dateFormat ?? 'dd/MM/yyyy'
  const timeZone = normalizeTimeZone(options.timeZone)
  const startAt = card.schedule?.startEnabled
    ? createOffsetDateTime(card.schedule.startDateValue, '09:00', { dateFormat, timeZone })
    : null
  const dueAt = card.schedule?.dueEnabled
    ? createOffsetDateTime(card.schedule.dueDateValue, card.schedule.dueTimeValue || '09:00', { dateFormat, timeZone })
    : null

  return {
    columnId: card.columnId,
    title: card.title,
    description: card.description ?? '',
    labelId: card.labelId || null,
    assigneeIds: Array.isArray(card.memberIds) ? card.memberIds : [],
    completed: Boolean(card.isCompleted ?? card.completed),
    starred: Boolean(card.starred),
    startAt,
    dueAt,
  }
}
