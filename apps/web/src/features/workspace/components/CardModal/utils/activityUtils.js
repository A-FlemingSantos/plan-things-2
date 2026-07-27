export const ACTIVITY_SIDEBAR_STORAGE_PREFIX = 'plan-things:card-modal-activity-sidebar-open:v1:'
export const SIDEBAR_PANEL_STORAGE_PREFIX = 'plan-things:card-modal-sidebar-panel:v1:'
export const SIDEBAR_PANELS = ['github', 'activity', 'files', 'checklist']
export const USER_COMMENT_KIND = 'USER_COMMENT'
export const ASSIGNEE_ACTIVITY_KIND = 'ASSIGNEE_ACTIVITY'

export function buildActivitySidebarStorageKey(userId) {
  return `${ACTIVITY_SIDEBAR_STORAGE_PREFIX}${userId || 'anonymous'}`
}

export function buildSidebarPanelStorageKey(userId) {
  return `${SIDEBAR_PANEL_STORAGE_PREFIX}${userId || 'anonymous'}`
}

export function readActivitySidebarOpenState(storageKey) {
  if (typeof window === 'undefined') return false

  const stored = window.localStorage.getItem(storageKey)
  if (stored === 'false') return false
  if (stored === 'true') return true
  return false
}

export function readSidebarPanelState(storageKey) {
  if (typeof window === 'undefined') return null

  const stored = window.localStorage.getItem(storageKey)
  return SIDEBAR_PANELS.includes(stored) ? stored : null
}

export function writeSidebarPanelState(storageKey, panel) {
  if (typeof window === 'undefined') return

  try {
    if (panel && SIDEBAR_PANELS.includes(panel)) {
      window.localStorage.setItem(storageKey, panel)
      return
    }

    window.localStorage.removeItem(storageKey)
  } catch {}
}

export function buildInitials(fullName = '') {
  return fullName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('') || 'PT'
}

export function formatCardCreatedLabel(createdAt) {
  if (!createdAt) return null
  if (typeof createdAt === 'string') return createdAt
  return createdAt.text ?? null
}

export function getTimestampMs(value) {
  if (value == null) return null
  if (typeof value === 'number') return value
  if (typeof value === 'string') {
    const parsed = Date.parse(value)
    return Number.isNaN(parsed) ? null : parsed
  }
  if (typeof value === 'object') {
    if (value.iso) {
      const parsed = Date.parse(value.iso)
      return Number.isNaN(parsed) ? null : parsed
    }
  }
  return null
}

export function buildInitialActivitySnapshot(card = {}) {
  return {
    createdAt: card.createdAt ?? null,
    created: card.created ?? null,
    memberIds: Array.isArray(card.memberIds) ? [...card.memberIds] : [],
  }
}

export function isAssigneeActivityComment(comment = {}) {
  return comment.kind === ASSIGNEE_ACTIVITY_KIND
}

export function isUserComment(comment = {}) {
  return !isAssigneeActivityComment(comment)
}

export function buildInlineAssignmentText(memberNames = []) {
  if (memberNames.length === 0) {
    return 'removeu os responsaveis · Agora'
  }

  return `atribuiu a: ${memberNames.join(', ')} · Agora`
}

export function buildActivityFeedItems({
  activityBase,
  comments,
  activityEvents,
  currentUserName,
  createdAtLabel,
  members,
  getMemberName,
}) {
  const cardCreatedMs = getTimestampMs(activityBase.createdAt) ?? getTimestampMs(activityBase.created) ?? 0
  const items = [
    {
      id: 'activity-created',
      type: 'history',
      sortAt: cardCreatedMs,
      actor: currentUserName,
      text: `criou esta tarefa · ${createdAtLabel}`,
    },
  ]

  const initialMemberIds = Array.isArray(activityBase.memberIds) ? activityBase.memberIds : []
  if (initialMemberIds.length > 0) {
    const initialSummary = initialMemberIds
      .map((memberId) => members.find((member) => member.id === memberId))
      .filter(Boolean)
      .map(getMemberName)
      .join(', ')

    items.push({
      id: 'activity-initial-assignment',
      type: 'history',
      sortAt: cardCreatedMs + 1,
      actor: currentUserName,
      text: `atribuiu a: ${initialSummary || 'Você'} · ${createdAtLabel}`,
    })
  }

  activityEvents.forEach((event) => {
    items.push(event)
  })

  comments.forEach((comment, index) => {
    const sortAt = getTimestampMs(comment.createdAtIso)
      ?? getTimestampMs(comment.createdAt)
      ?? cardCreatedMs + 1000 + index

    if (isAssigneeActivityComment(comment)) {
      items.push({
        id: comment.id,
        type: 'history',
        sortAt,
        actor: comment.authorName ?? currentUserName,
        text: comment.time ? `${comment.text} · ${comment.time}` : comment.text,
      })
      return
    }

    items.push({
      id: comment.id,
      type: 'comment',
      sortAt,
      comment,
    })
  })

  return items.sort((left, right) => {
    if (left.sortAt !== right.sortAt) {
      return left.sortAt - right.sortAt
    }
    return String(left.id).localeCompare(String(right.id))
  })
}
