import {
  BOARD_FILTER_DEFAULTS,
  hasActiveBoardFilters,
} from './boardFilterDefaults.js'

const DAY_MS = 24 * 60 * 60 * 1000
const WEEK_MS = 7 * DAY_MS
const TWO_WEEKS_MS = 14 * DAY_MS
const FOUR_WEEKS_MS = 28 * DAY_MS
const MONTH_MS = 30 * DAY_MS

function resolveMemberLabel(member) {
  return member?.label ?? member?.name ?? member?.fullName ?? member?.email ?? member?.initials ?? ''
}

function toMillis(value) {
  if (value == null || value === '') return null
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null
  }
  if (typeof value === 'string') {
    const parsed = Date.parse(value)
    return Number.isFinite(parsed) ? parsed : null
  }
  if (typeof value === 'object' && value.iso) {
    return toMillis(value.iso)
  }
  return null
}

function getCardDueAtMs(card) {
  return toMillis(card?.dueAt) ?? toMillis(card?.raw?.dueAt)
}

function getCardActivityMs(card) {
  const commentTimes = (card?.comments ?? [])
    .map((comment) => toMillis(comment.createdAtIso) ?? toMillis(comment.createdAt))
    .filter((value) => value != null)

  const candidates = [
    toMillis(card?.updatedAt),
    toMillis(card?.raw?.updatedAt),
    toMillis(card?.createdAt),
    toMillis(card?.raw?.createdAt),
    commentTimes.length > 0 ? Math.max(...commentTimes) : null,
  ]

  const valid = candidates.filter((value) => value != null)
  return valid.length > 0 ? Math.max(...valid) : null
}

function sectionIsActive(section) {
  if (!section) return false
  return Object.values(section).some((value) => {
    if (Array.isArray(value)) return value.length > 0
    return Boolean(value)
  })
}

function matchesKeyword(card, keyword, context) {
  const needle = keyword.trim().toLowerCase()
  if (!needle) return true

  const label = (context.labels ?? []).find((item) => item.id === card.labelId)
  const memberNames = (card.memberIds ?? [])
    .map((id) => (context.members ?? []).find((member) => member.id === id))
    .map(resolveMemberLabel)

  const haystacks = [
    card.title,
    card.description,
    label?.text,
    label?.name,
    ...memberNames,
  ]

  return haystacks.some((value) => String(value ?? '').toLowerCase().includes(needle))
}

function matchesMembers(card, filter, context) {
  const members = filter.members ?? BOARD_FILTER_DEFAULTS.members
  if (!sectionIsActive(members)) return true

  const memberIds = Array.isArray(card.memberIds) ? card.memberIds : []
  const selectedIds = members.selectedMemberIds ?? []
  const matchAll = filter.matchMode === 'all'
  const checks = []

  if (members.noMembers) {
    checks.push(memberIds.length === 0)
  }
  if (members.assignedToMe) {
    checks.push(Boolean(context.currentUserId) && memberIds.includes(context.currentUserId))
  }
  if (selectedIds.length > 0) {
    checks.push(
      matchAll
        ? selectedIds.every((id) => memberIds.includes(id))
        : selectedIds.some((id) => memberIds.includes(id)),
    )
  }

  if (checks.length === 0) return true
  return matchAll ? checks.every(Boolean) : checks.some(Boolean)
}

function matchesStatus(card, filter) {
  const status = filter.status ?? BOARD_FILTER_DEFAULTS.status
  const wantsCompleted = Boolean(status.completed)
  const wantsNotCompleted = Boolean(status.notCompleted)
  if (wantsCompleted === wantsNotCompleted) return true
  return wantsCompleted ? Boolean(card.isCompleted) : !card.isCompleted
}

function matchesDueDate(card, filter, now) {
  const dueDate = filter.dueDate ?? BOARD_FILTER_DEFAULTS.dueDate
  if (!sectionIsActive(dueDate)) return true

  const dueMs = getCardDueAtMs(card)
  const checks = []

  if (dueDate.noDates) {
    checks.push(dueMs == null)
  }
  if (dueDate.overdue) {
    checks.push(dueMs != null && dueMs < now && !card.isCompleted)
  }
  if (dueDate.dueInDay) {
    checks.push(dueMs != null && dueMs >= now && dueMs <= now + DAY_MS)
  }
  if (dueDate.dueInWeek) {
    checks.push(dueMs != null && dueMs >= now && dueMs <= now + WEEK_MS)
  }
  if (dueDate.dueInMonth) {
    checks.push(dueMs != null && dueMs >= now && dueMs <= now + MONTH_MS)
  }

  return checks.some(Boolean)
}

function matchesLabels(card, filter) {
  const labels = filter.labels ?? BOARD_FILTER_DEFAULTS.labels
  if (!sectionIsActive(labels)) return true

  const selectedIds = labels.selectedLabelIds ?? []
  const matchAll = filter.matchMode === 'all'
  const labelId = card.labelId || ''
  const checks = []

  if (labels.noLabels) {
    checks.push(!labelId)
  }
  if (selectedIds.length > 0) {
    checks.push(
      matchAll
        ? selectedIds.every((id) => labelId === id)
        : selectedIds.includes(labelId),
    )
  }

  if (checks.length === 0) return true
  return matchAll ? checks.every(Boolean) : checks.some(Boolean)
}

function matchesActivity(card, filter, now) {
  const activity = filter.activity ?? BOARD_FILTER_DEFAULTS.activity
  if (!sectionIsActive(activity)) return true

  const activityMs = getCardActivityMs(card)
  const age = activityMs == null ? null : now - activityMs
  const checks = []

  if (activity.activeLastWeek) {
    checks.push(age != null && age <= WEEK_MS)
  }
  if (activity.activeLastTwoWeeks) {
    checks.push(age != null && age <= TWO_WEEKS_MS)
  }
  if (activity.activeLastFourWeeks) {
    checks.push(age != null && age <= FOUR_WEEKS_MS)
  }
  if (activity.noActivityLastFourWeeks) {
    checks.push(age == null || age > FOUR_WEEKS_MS)
  }

  return checks.some(Boolean)
}

export function cardMatchesBoardFilter(card, filter = BOARD_FILTER_DEFAULTS, context = {}) {
  if (!hasActiveBoardFilters(filter)) return true

  const now = Number.isFinite(context.now) ? context.now : Date.now()

  return matchesKeyword(card, filter.keyword ?? '', context)
    && matchesMembers(card, filter, context)
    && matchesStatus(card, filter)
    && matchesDueDate(card, filter, now)
    && matchesLabels(card, filter)
    && matchesActivity(card, filter, now)
}

export function collectMatchingCardIds(columns = [], filter = BOARD_FILTER_DEFAULTS, context = {}) {
  const matchingIds = new Set()

  for (const column of columns) {
    for (const card of column.cards ?? []) {
      if (cardMatchesBoardFilter(card, filter, context)) {
        matchingIds.add(card.id)
      }
    }
  }

  return matchingIds
}
