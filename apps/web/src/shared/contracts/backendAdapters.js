import { createEmptyCanvasState } from '../../features/canvas/data/canvasTemplates.js'
import { getFileTypeFromName } from '../../features/files/data/libraryRepository.js'
import { normalizeCalendarSnapshot } from './calendarContracts.js'
import { normalizeLibraryItem } from './fileContracts.js'
import { normalizeCanvasState, normalizePlanRecord } from './planContracts.js'

const MEMBER_COLORS = ['#000000', '#4290da', '#0f703a', '#d4aef1', '#ff6766', '#f5a623']
const PLAN_COVERS = ['#f4f0ff', '#f0fff5', '#fff9f0', '#fff0f0', '#f0f6ff', '#f5f5f5']
const COVER_IMAGE_FILES = import.meta.glob('../assets/background-collections/**/*.{webp,png,jpg,jpeg,avif}', {
  eager: true,
  import: 'default',
})
const COVER_IMAGE_URL_BY_ID = Object.entries(COVER_IMAGE_FILES).reduce((acc, [path, url]) => {
  const normalized = String(path).replace(/\\/g, '/')
  const [, afterRoot = ''] = normalized.split('/background-collections/')
  if (!afterRoot) return acc
  acc[`background-collections/${afterRoot}`] = url
  return acc
}, {})
const COVER_IMAGE_THUMB_FILES = import.meta.glob('../assets/background-collections-thumbs/**/*.{webp,png,jpg,jpeg,avif}', {
  eager: true,
  import: 'default',
})
const COVER_IMAGE_THUMB_URL_BY_ID = Object.entries(COVER_IMAGE_THUMB_FILES).reduce((acc, [path, url]) => {
  const normalized = String(path).replace(/\\/g, '/')
  const [, afterRoot = ''] = normalized.split('/background-collections-thumbs/')
  if (!afterRoot) return acc
  acc[`background-collections/${afterRoot}`] = url
  return acc
}, {})

function canonicalizeCoverImageId(value) {
  if (!value) return null
  const normalized = String(value).trim().replace(/\\/g, '/')
  if (!normalized) return null
  if (normalized.startsWith('background-collections/')) return normalized
  const [, afterRoot = ''] = normalized.split('/background-collections/')
  if (!afterRoot) return normalized
  return `background-collections/${afterRoot}`
}

function resolveCoverImageUrl(coverImageId) {
  const canonicalId = canonicalizeCoverImageId(coverImageId)
  if (!canonicalId) return null
  if (canonicalId.startsWith('background-collections/')) {
    return COVER_IMAGE_URL_BY_ID[canonicalId] ?? null
  }
  return COVER_IMAGE_URL_BY_ID[`background-collections/${canonicalId}`] ?? COVER_IMAGE_URL_BY_ID[canonicalId] ?? null
}

function resolveCoverImageThumbUrl(coverImageId) {
  const canonicalId = canonicalizeCoverImageId(coverImageId)
  if (!canonicalId) return null
  if (canonicalId.startsWith('background-collections/')) {
    return COVER_IMAGE_THUMB_URL_BY_ID[canonicalId] ?? null
  }
  return COVER_IMAGE_THUMB_URL_BY_ID[`background-collections/${canonicalId}`] ?? COVER_IMAGE_THUMB_URL_BY_ID[canonicalId] ?? null
}

function shortMonthLabel(date) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: 'numeric',
    month: 'short',
  })
    .format(date)
    .replace('.', '')
    .toLowerCase()
}

function toDate(value) {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

function parseBrazilDateValue(value) {
  if (!value || typeof value !== 'string') return null
  const match = value.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/)
  if (!match) return null
  const [, dayValue, monthValue, yearValue] = match
  let year = Number(yearValue)
  if (yearValue.length === 2) {
    year += 2000
  }
  return {
    year,
    month: Number(monthValue),
    day: Number(dayValue),
  }
}

function createOffsetDateTime(dateValue, timeValue = '09:00') {
  const parsedDate = parseBrazilDateValue(dateValue)
  if (!parsedDate) return null
  const [hours = '09', minutes = '00'] = String(timeValue || '09:00').split(':')

  return `${parsedDate.year}-${String(parsedDate.month).padStart(2, '0')}-${String(parsedDate.day).padStart(2, '0')}T${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00-03:00`
}

function formatDateInputFromIso(value) {
  const date = toDate(value)
  if (!date) return ''
  return new Intl.DateTimeFormat('pt-BR').format(date)
}

function formatTimeInputFromIso(value) {
  const date = toDate(value)
  if (!date) return '09:00'
  return new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date)
}

function formatCardDueLabel(dueAt) {
  const date = toDate(dueAt?.iso)
  if (!date) return ''

  const today = new Date()
  const sameDay =
    today.getFullYear() === date.getFullYear() &&
    today.getMonth() === date.getMonth() &&
    today.getDate() === date.getDate()

  if (sameDay) {
    return 'Hoje'
  }

  return shortMonthLabel(date)
}

function buildMemberColor(index) {
  return MEMBER_COLORS[index % MEMBER_COLORS.length]
}

function buildInitials(fullName = '') {
  return fullName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('') || 'PT'
}

function mapRoleToTag(role) {
  if (role === 'OWNER') return { tag: 'Owner', tagColor: '#0f703a' }
  if (role === 'ADMIN') return { tag: 'Admin', tagColor: '#4290da' }
  return { tag: 'Membro', tagColor: '#a0a0a0' }
}

function buildMemberDots(memberCount, offset = 0) {
  return Array.from({ length: Math.max(memberCount, 0) }, (_, index) => buildMemberColor(index + offset))
}

export function mapPlanSummaryToRecord(summary, index = 0) {
  const roleMeta = mapRoleToTag(summary.role)
  const date = toDate(summary.updatedAt?.iso ?? summary.createdAt?.iso)
  const coverThemeId = summary.coverThemeId ?? null
  const coverImageId = summary.coverImageId ?? null
  const coverImage = resolveCoverImageUrl(coverImageId)
  const coverImageThumb = resolveCoverImageThumbUrl(coverImageId)
  const coverColor = summary.cover ?? null
  const cover = coverColor ?? PLAN_COVERS[index % PLAN_COVERS.length]

  return normalizePlanRecord({
    id: summary.id,
    name: summary.name,
    description: summary.description ?? '',
    tag: roleMeta.tag,
    tagColor: roleMeta.tagColor,
    members: buildMemberDots(summary.memberCount, index),
    date: date ? shortMonthLabel(date) : '',
    tasks: Number.isFinite(summary.taskCount) ? summary.taskCount : 0,
    cover,
    coverThemeId,
    coverImageId: canonicalizeCoverImageId(coverImageId),
    coverImage,
    coverImageThumb,
    boardColumns: [],
    canvasState: createEmptyCanvasState(),
    role: summary.role,
    memberCount: summary.memberCount,
    createdAt: summary.createdAt,
    updatedAt: summary.updatedAt,
    labelsMeta: [],
    membersMeta: [],
    boardLoaded: false,
    canvasLoaded: false,
    canvasVersion: 0,
  })
}

export function mergePlanDetails(plan, details) {
  const membersMeta = details.members.map((member, index) => ({
    id: member.userId,
    initials: buildInitials(member.fullName),
    color: buildMemberColor(index),
    name: member.fullName,
    email: member.email,
    role: member.role,
  }))

  const labelsMeta = details.labels.map((label) => ({
    id: label.id,
    text: label.name,
    name: label.name,
    color: label.color,
  }))

  return {
    ...plan,
    role: details.plan.role,
    memberCount: details.plan.memberCount,
    tasks: Number.isFinite(details.plan.taskCount) ? details.plan.taskCount : plan.tasks,
    coverThemeId: details.plan.coverThemeId ?? plan.coverThemeId ?? null,
    coverImageId: canonicalizeCoverImageId(details.plan.coverImageId ?? plan.coverImageId),
    coverImage: resolveCoverImageUrl(details.plan.coverImageId ?? plan.coverImageId) ?? plan.coverImage ?? null,
    coverImageThumb: resolveCoverImageThumbUrl(details.plan.coverImageId ?? plan.coverImageId) ?? plan.coverImageThumb ?? null,
    cover: details.plan.cover ?? plan.cover,
    createdAt: details.plan.createdAt,
    updatedAt: details.plan.updatedAt,
    members: membersMeta.map((member) => member.color),
    membersMeta,
    labelsMeta,
  }
}

function mapBoardComment(comment) {
  return {
    id: comment.id,
    author: comment.authorName,
    authorId: null,
    authorName: comment.authorName,
    text: comment.message,
    time: comment.createdAt?.text ?? 'Agora',
  }
}

function mapBoardCard(card) {
  return {
    id: card.id,
    columnId: card.columnId,
    title: card.title,
    description: card.description ?? '',
    labelId: card.label?.id ?? '',
    memberIds: card.assignees.map((member) => member.id),
    dueDate: formatCardDueLabel(card.dueAt),
    startAt: card.startAt ?? null,
    dueAt: card.dueAt ?? null,
    comments: card.comments.map(mapBoardComment),
    kind: card.kind,
    schedule: {
      selectedCalendarDay: toDate(card.dueAt?.iso)?.getDate() ?? toDate(card.startAt?.iso)?.getDate() ?? 7,
      startEnabled: Boolean(card.startAt?.iso),
      startDateValue: formatDateInputFromIso(card.startAt?.iso),
      dueEnabled: Boolean(card.dueAt?.iso),
      dueDateValue: formatDateInputFromIso(card.dueAt?.iso),
      dueTimeValue: formatTimeInputFromIso(card.dueAt?.iso),
      displayLabel: formatCardDueLabel(card.dueAt),
      preserveDisplayLabel: false,
    },
    checklists: card.checklists ?? [],
    raw: card,
  }
}

export function mapBoardViewToColumns(boardView) {
  return boardView.columns.map((column) => ({
    id: column.id,
    title: column.title,
    color: column.color,
    cards: column.cards.map(mapBoardCard),
  }))
}

export function mergeBoardIntoPlan(plan, boardView) {
  return {
    ...plan,
    boardColumns: mapBoardViewToColumns(boardView),
    labelsMeta: boardView.labels.map((label) => ({
      id: label.id,
      text: label.name,
      name: label.name,
      color: label.color,
    })),
    tasks: boardView.columns.reduce((sum, column) => sum + column.cards.length, 0),
    boardLoaded: true,
  }
}

export function mapCanvasDocumentToState(canvasDocument) {
  if (!canvasDocument?.documentJson) {
    return createEmptyCanvasState()
  }

  try {
    return normalizeCanvasState(JSON.parse(canvasDocument.documentJson))
  } catch {
    return createEmptyCanvasState()
  }
}

export function buildCanvasSavePayload(canvasState, expectedVersion) {
  return {
    expectedVersion,
    documentJson: JSON.stringify(canvasState),
  }
}

export function buildBoardCardPayload(card) {
  const startAt = card.schedule?.startEnabled
    ? createOffsetDateTime(card.schedule.startDateValue, '09:00')
    : null
  const dueAt = card.schedule?.dueEnabled
    ? createOffsetDateTime(card.schedule.dueDateValue, card.schedule.dueTimeValue || '09:00')
    : null

  return {
    columnId: card.columnId,
    title: card.title,
    description: card.description,
    labelId: card.labelId || null,
    assigneeIds: Array.isArray(card.memberIds) ? card.memberIds : [],
    startAt,
    dueAt,
  }
}

function mapBackendEventSource(event) {
  if (event.generatedFromCard) {
    return {
      id: 'planos',
      name: 'Planos',
      color: '#4290da',
    }
  }

  return {
    id: 'interno',
    name: 'Calendario interno',
    color: '#0f703a',
  }
}

export function mapCalendarEventsToSnapshot(events) {
  const sources = []
  const seen = new Set()

  events.forEach((event) => {
    const source = mapBackendEventSource(event)
    if (seen.has(source.id)) return
    seen.add(source.id)
    sources.push(source)
  })

  return normalizeCalendarSnapshot({
    sources,
    events: events.map((event) => {
      const startsAt = toDate(event.startsAt?.iso)
      const endsAt = toDate(event.endsAt?.iso)
      const source = mapBackendEventSource(event)
      const cardKind = event.cardKind ?? null
      const dateSourceIso =
        event.generatedFromCard && cardKind === 'TAREFA'
          ? event.endsAt?.iso ?? event.startsAt?.iso
          : event.startsAt?.iso ?? event.endsAt?.iso

      return {
        id: event.id,
        title: event.title,
        description: event.description ?? '',
        date: dateSourceIso?.slice(0, 10),
        start: startsAt ? formatTimeInputFromIso(event.startsAt?.iso) : '09:00',
        end: endsAt ? formatTimeInputFromIso(event.endsAt?.iso) : '10:00',
        calendar: event.generatedFromCard ? 'Plano vinculado' : 'Calendario interno',
        sourceId: source.id,
        color: source.color,
        cardKind,
        location: event.location || (event.createdBy ? `Criado por ${event.createdBy}` : ''),
        raw: event,
      }
    }),
  })
}

export function buildCalendarEventPayload(event) {
  const [year, month, day] = String(event.date).split('-')
  const dateValue = `${day}/${month}/${year}`

  return {
    title: event.title,
    description: event.description ?? '',
    location: event.location ?? '',
    startsAt: createOffsetDateTime(dateValue, event.start),
    endsAt: createOffsetDateTime(dateValue, event.end),
  }
}

export function buildLibraryTreeFromApi(items) {
  const foldersAndFiles = items.map((item) => {
    const isFolder = item.type === 'FOLDER'
    const normalizedType = isFolder ? 'folder' : getFileTypeFromName(item.name)

    return normalizeLibraryItem({
      id: item.id,
      name: item.name,
      type: normalizedType,
      size: item.sizeBytes ?? 0,
      modified: item.updatedAt?.text ?? item.createdAt?.text ?? 'Agora',
      modifiedAtIso: item.updatedAt?.iso ?? item.createdAt?.iso ?? null,
      createdAtIso: item.createdAt?.iso ?? null,
      starred: Boolean(item.starred),
      owner: 'me',
      deleted: Boolean(item.deleted),
      parentId: item.parentId ?? null,
      children: [],
    })
  })

  const byId = new Map(foldersAndFiles.map((item) => [item.id, { ...item, children: item.type === 'folder' ? [] : undefined }]))
  const roots = []

  foldersAndFiles.forEach((item) => {
    const current = byId.get(item.id)
    const parentId = item.parentId

    if (parentId) {
      const parent = byId.get(parentId)
      if (parent?.type === 'folder') {
        parent.children = [...(parent.children ?? []), current]
      }
      return
    }

    roots.push(current)
  })

  return roots
}
