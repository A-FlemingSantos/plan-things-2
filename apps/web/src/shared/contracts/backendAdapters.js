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

const DEFAULT_TIME_ZONE = 'America/Sao_Paulo'
const DEFAULT_LOCALE = 'pt-BR'

function normalizeShortMonthLabel(value) {
  return String(value ?? '').replace('.', '').trim().toLowerCase()
}

function normalizeTimeZone(value) {
  const normalized = typeof value === 'string' ? value.trim() : ''
  if (!normalized) return DEFAULT_TIME_ZONE

  try {
    return new Intl.DateTimeFormat('en-US', { timeZone: normalized }).resolvedOptions().timeZone
  } catch {
    return DEFAULT_TIME_ZONE
  }
}

function parseTimeValue(value, fallback = '09:00') {
  const [hoursRaw = '09', minutesRaw = '00'] = String(value || fallback).split(':')
  const hours = Number.parseInt(hoursRaw, 10)
  const minutes = Number.parseInt(minutesRaw, 10)

  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) {
    return parseTimeValue(fallback, '09:00')
  }

  return {
    hours: Math.max(0, Math.min(23, hours)),
    minutes: Math.max(0, Math.min(59, minutes)),
  }
}

function parseDateValue(value, preferredFormat = 'dd/MM/yyyy') {
  if (!value || typeof value !== 'string') return null
  const normalized = value.trim()

  const isoMatch = normalized.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (isoMatch) {
    const [, year, month, day] = isoMatch
    return {
      year: Number(year),
      month: Number(month),
      day: Number(day),
    }
  }

  const slashMatch = normalized.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/)
  if (!slashMatch) return null

  const first = Number(slashMatch[1])
  const second = Number(slashMatch[2])
  const rawYear = slashMatch[3]
  let year = Number(rawYear)
  if (rawYear.length === 2) {
    year += 2000
  }

  let day = first
  let month = second

  if (preferredFormat === 'MM/dd/yyyy') {
    day = second
    month = first
  } else if (first <= 12 && second > 12) {
    day = second
    month = first
  }

  const hasValidMonthDay = (candidateDay, candidateMonth) => (
    candidateMonth >= 1
    && candidateMonth <= 12
    && candidateDay >= 1
    && candidateDay <= 31
  )

  if (!hasValidMonthDay(day, month)) {
    const swappedDay = month
    const swappedMonth = day
    if (!hasValidMonthDay(swappedDay, swappedMonth)) {
      return null
    }
    day = swappedDay
    month = swappedMonth
  }

  return { year, month, day }
}

function zonedPartsFromDate(date, timeZone, locale = 'en-CA') {
  const formatter = new Intl.DateTimeFormat(locale, {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  })
  const partByType = Object.fromEntries(
    formatter
      .formatToParts(date)
      .filter((part) => part.type !== 'literal')
      .map((part) => [part.type, part.value]),
  )

  return {
    year: Number(partByType.year),
    month: Number(partByType.month),
    day: Number(partByType.day),
    hour: Number(partByType.hour),
    minute: Number(partByType.minute),
    second: Number(partByType.second),
  }
}

function zoneOffsetMinutesAt(instantMs, timeZone) {
  const parts = zonedPartsFromDate(new Date(instantMs), timeZone)
  const asUtc = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second)
  return Math.round((asUtc - instantMs) / 60000)
}

function resolveInstantMsForZonedDateTime(dateParts, timeParts, timeZone) {
  const desiredUtc = Date.UTC(
    dateParts.year,
    dateParts.month - 1,
    dateParts.day,
    timeParts.hours,
    timeParts.minutes,
    0,
    0,
  )

  let instant = desiredUtc
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const zoned = zonedPartsFromDate(new Date(instant), timeZone)
    const currentUtc = Date.UTC(
      zoned.year,
      zoned.month - 1,
      zoned.day,
      zoned.hour,
      zoned.minute,
      zoned.second,
      0,
    )
    const delta = desiredUtc - currentUtc
    instant += delta

    if (delta === 0) {
      break
    }
  }

  return instant
}

function formatOffset(offsetMinutes) {
  const sign = offsetMinutes >= 0 ? '+' : '-'
  const absolute = Math.abs(offsetMinutes)
  const hours = Math.floor(absolute / 60)
  const minutes = absolute % 60
  return `${sign}${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
}

function toDateKeyByTimeZone(value, timeZone = DEFAULT_TIME_ZONE) {
  const date = toDate(value)
  if (!date) return null
  const parts = zonedPartsFromDate(date, normalizeTimeZone(timeZone))
  return `${String(parts.year).padStart(4, '0')}-${String(parts.month).padStart(2, '0')}-${String(parts.day).padStart(2, '0')}`
}

function createOffsetDateTime(dateValue, timeValue = '09:00', options = {}) {
  const preferredDateFormat = options.dateFormat ?? 'dd/MM/yyyy'
  const parsedDate = parseDateValue(dateValue, preferredDateFormat)
  if (!parsedDate) return null
  const parsedTime = parseTimeValue(timeValue)
  const timeZone = normalizeTimeZone(options.timeZone)
  const instantMs = resolveInstantMsForZonedDateTime(parsedDate, parsedTime, timeZone)
  const offsetMinutes = zoneOffsetMinutesAt(instantMs, timeZone)

  return `${String(parsedDate.year).padStart(4, '0')}-${String(parsedDate.month).padStart(2, '0')}-${String(parsedDate.day).padStart(2, '0')}T${String(parsedTime.hours).padStart(2, '0')}:${String(parsedTime.minutes).padStart(2, '0')}:00${formatOffset(offsetMinutes)}`
}

function formatDateInputFromIso(value, options = {}) {
  const dateKey = toDateKeyByTimeZone(value, options.timeZone)
  if (!dateKey) return ''
  const [year, month, day] = dateKey.split('-')
  const dateFormat = options.dateFormat ?? 'dd/MM/yyyy'

  if (dateFormat === 'MM/dd/yyyy') {
    return `${month}/${day}/${year}`
  }

  if (dateFormat === 'yyyy-MM-dd') {
    return `${year}-${month}-${day}`
  }

  return `${day}/${month}/${year}`
}

function formatTimeInputFromIso(value, options = {}) {
  const date = toDate(value)
  if (!date) return '09:00'
  const timeZone = normalizeTimeZone(options.timeZone)
  const { hour, minute } = zonedPartsFromDate(date, timeZone)
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
}

function formatCompactDayMonthFromIso(value, options = {}) {
  const date = toDate(value)
  if (!date) return ''
  const locale = options.locale ?? DEFAULT_LOCALE
  const timeZone = normalizeTimeZone(options.timeZone)
  const parts = new Intl.DateTimeFormat(locale, {
    timeZone,
    day: 'numeric',
    month: 'short',
  }).formatToParts(date)
  const partByType = Object.fromEntries(parts.map((part) => [part.type, part.value]))
  const day = partByType.day ?? ''
  const month = normalizeShortMonthLabel(partByType.month ?? '')
  return `${day} ${month}`.trim()
}

function dayOfMonthFromDateKey(dateKey) {
  if (!dateKey || typeof dateKey !== 'string') return null
  const [, , day] = dateKey.split('-')
  const numeric = Number(day)
  return Number.isFinite(numeric) ? numeric : null
}

function formatCardDueLabel(dueAt, options = {}) {
  const timeZone = normalizeTimeZone(options.timeZone)
  const dueDateKey = toDateKeyByTimeZone(dueAt?.iso, timeZone)
  if (!dueDateKey) return ''

  const todayDateKey = toDateKeyByTimeZone(new Date(), timeZone)
  const sameDay = todayDateKey && todayDateKey === dueDateKey

  if (sameDay) {
    return 'Hoje'
  }

  return formatCompactDayMonthFromIso(dueAt?.iso, options)
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

function mapBoardCard(card, options = {}) {
  const timeZone = normalizeTimeZone(options.timeZone)
  const locale = options.locale ?? DEFAULT_LOCALE
  const dateFormat = options.dateFormat ?? 'dd/MM/yyyy'
  const dueDateKey = toDateKeyByTimeZone(card.dueAt?.iso, timeZone)
  const startDateKey = toDateKeyByTimeZone(card.startAt?.iso, timeZone)
  const selectedCalendarDay = dayOfMonthFromDateKey(dueDateKey ?? startDateKey) ?? 7

  return {
    id: card.id,
    columnId: card.columnId,
    title: card.title,
    description: card.description ?? '',
    labelId: card.label?.id ?? '',
    memberIds: card.assignees.map((member) => member.id),
    dueDate: formatCardDueLabel(card.dueAt, { locale, timeZone }),
    startAt: card.startAt ?? null,
    dueAt: card.dueAt ?? null,
    comments: card.comments.map(mapBoardComment),
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
      selectedCalendarDay,
      startEnabled: Boolean(card.startAt?.iso),
      startDateValue: formatDateInputFromIso(card.startAt?.iso, {
        dateFormat,
        timeZone,
      }),
      dueEnabled: Boolean(card.dueAt?.iso),
      dueDateValue: formatDateInputFromIso(card.dueAt?.iso, {
        dateFormat,
        timeZone,
      }),
      dueTimeValue: formatTimeInputFromIso(card.dueAt?.iso, { timeZone }),
      displayLabel: formatCardDueLabel(card.dueAt, { locale, timeZone }),
      preserveDisplayLabel: false,
    },
    checklists: card.checklists ?? [],
    raw: card,
  }
}

export function mapBoardViewToColumns(boardView, options = {}) {
  return boardView.columns.map((column) => ({
    id: column.id,
    title: column.title,
    color: column.color,
    cards: column.cards.map((card) => mapBoardCard(card, options)),
  }))
}

export function mergeBoardIntoPlan(plan, boardView, options = {}) {
  return {
    ...plan,
    boardColumns: mapBoardViewToColumns(boardView, options),
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

export function buildBoardCardPayload(card, options = {}) {
  const dateFormat = options.dateFormat ?? 'dd/MM/yyyy'
  const timeZone = normalizeTimeZone(options.timeZone)
  const startAt = card.schedule?.startEnabled
    ? createOffsetDateTime(card.schedule.startDateValue, '09:00', {
        dateFormat,
        timeZone,
      })
    : null
  const dueAt = card.schedule?.dueEnabled
    ? createOffsetDateTime(card.schedule.dueDateValue, card.schedule.dueTimeValue || '09:00', {
        dateFormat,
        timeZone,
      })
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

export function mapCalendarEventsToSnapshot(events, options = {}) {
  const timeZone = normalizeTimeZone(options.timeZone)
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
        date: toDateKeyByTimeZone(dateSourceIso, timeZone) ?? dateSourceIso?.slice(0, 10),
        start: startsAt ? formatTimeInputFromIso(event.startsAt?.iso, { timeZone }) : '09:00',
        end: endsAt ? formatTimeInputFromIso(event.endsAt?.iso, { timeZone }) : '10:00',
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

export function buildCalendarEventPayload(event, options = {}) {
  const timeZone = normalizeTimeZone(options.timeZone)
  return {
    title: event.title,
    description: event.description ?? '',
    location: event.location ?? '',
    startsAt: createOffsetDateTime(event.date, event.start, {
      dateFormat: 'yyyy-MM-dd',
      timeZone,
    }),
    endsAt: createOffsetDateTime(event.date, event.end, {
      dateFormat: 'yyyy-MM-dd',
      timeZone,
    }),
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
      sharedByCurrentUser: Boolean(item.sharedByCurrentUser),
      canUnshare: Boolean(item.canUnshare),
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
