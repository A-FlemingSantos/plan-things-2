import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import {
  AtSign,
  Calendar,
  CalendarPlus,
  Check,
  MoveRight,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Clock,
  Code,
  Download,
  Ellipsis,
  FileText,
  Flag,
  Folder,
  Funnel,
  Goal,
  History,
  Hourglass,
  Image,
  LayoutGrid,
  Library,
  Link,
  List,
  Maximize2,
  Monitor,
  Paperclip,
  PencilLine,
  Plus,
  Search,
  SendHorizontal,
  SmilePlus,
  Sparkles,
  Star,
  Tag,
  ThumbsUp,
  TimerReset,
  Trash2,
  Users,
  X,
} from 'lucide-react'
import AuthenticatedAvatar from '../../../../shared/components/AuthenticatedAvatar/AuthenticatedAvatar.jsx'
import { RangeCalendar as DateRangeCalendar } from '../../../../shared/components/Calendar/Calendar.jsx'
import {
  buildBrazilDateRange,
  formatCalendarDateToBrazil,
} from '../../../../shared/components/Calendar/calendarDateUtils.js'
import { formatFileSize } from '../../../files/data/libraryRepository.js'
import { createOffsetDateTime } from '@plan-things/shared-client/dates'

const ICON_SIZE = 15
const ICON_SIZE_SM = 12
const ICON_STROKE = 1.75
const ACTIVITY_SIDEBAR_STORAGE_PREFIX = 'plan-things:card-modal-activity-sidebar-open:v1:'

function buildActivitySidebarStorageKey(userId) {
  return `${ACTIVITY_SIDEBAR_STORAGE_PREFIX}${userId || 'anonymous'}`
}

function readActivitySidebarOpenState(storageKey) {
  if (typeof window === 'undefined') return false

  const stored = window.localStorage.getItem(storageKey)
  if (stored === 'false') return false
  if (stored === 'true') return true
  return false
}

const uid = () => Math.random().toString(36).slice(2, 9)
const USER_COMMENT_KIND = 'USER_COMMENT'
const ASSIGNEE_ACTIVITY_KIND = 'ASSIGNEE_ACTIVITY'
const DEFAULT_CARD_SCHEDULE = {
  selectedCalendarDay: 7,
  startEnabled: false,
  startDateValue: '',
  dueEnabled: true,
  dueDateValue: '07/04/26',
  dueTimeValue: '16:21',
  displayLabel: '',
  preserveDisplayLabel: false,
}

const FILE_PICKER_DESKTOP_WIDTH = 680
const FILE_PICKER_MOBILE_WIDTH = 360
const FILE_PICKER_FALLBACK_HEIGHT = 360
const FILE_PICKER_VIEWPORT_MARGIN = 16
const FILE_TYPE_OPTIONS = [
  { id: 'all', label: 'Todos' },
  { id: 'image', label: 'Imagem' },
  { id: 'text', label: 'Texto' },
  { id: 'pdf', label: 'PDF' },
  { id: 'document', label: 'Documento' },
  { id: 'archive', label: 'Arquivo compactado' },
]

function extractDayFromDisplayLabel(value = '') {
  const match = value.match(/(?:^|\s)(\d{1,2})(?:\s|$)/)
  return match ? Number(match[1]) : null
}

function parseBrazilDateValue(value = '') {
  const match = value.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/)

  if (!match) {
    return null
  }

  const [, dayValue, monthValue, yearValue] = match
  const year = yearValue.length === 2 ? 2000 + Number(yearValue) : Number(yearValue)

  return {
    day: Number(dayValue),
    month: Number(monthValue),
    year,
  }
}

function buildCalendarBaseDate(value = '') {
  const parsed = parseBrazilDateValue(value)

  if (!parsed) {
    const today = new Date()
    return new Date(today.getFullYear(), today.getMonth(), 1)
  }

  return new Date(parsed.year, parsed.month - 1, 1)
}

function formatCalendarInputValue(day, baseDate) {
  return `${String(day).padStart(2, '0')}/${String(baseDate.getMonth() + 1).padStart(2, '0')}/${baseDate.getFullYear()}`
}

function buildCalendarDays(baseDate) {
  const year = baseDate.getFullYear()
  const month = baseDate.getMonth()
  const firstDay = new Date(year, month, 1)
  const startDate = new Date(year, month, 1 - firstDay.getDay())
  const today = new Date()

  return Array.from({ length: 42 }, (_, index) => {
    const current = new Date(startDate)
    current.setDate(startDate.getDate() + index)

    return {
      label: current.getDate(),
      muted: current.getMonth() !== month,
      underline:
        current.getDate() === today.getDate() &&
        current.getMonth() === today.getMonth() &&
        current.getFullYear() === today.getFullYear(),
    }
  })
}

function formatCalendarMonthLabel(baseDate) {
  return new Intl.DateTimeFormat('pt-BR', {
    month: 'long',
    year: 'numeric',
  }).format(baseDate)
}

function buildInitialCardSchedule(card) {
  const schedule = card.schedule ?? {}
  const fallbackDay = extractDayFromDisplayLabel(schedule.displayLabel ?? card.dueDate) ?? DEFAULT_CARD_SCHEDULE.selectedCalendarDay

  return {
    selectedCalendarDay: Number.isFinite(schedule.selectedCalendarDay)
      ? schedule.selectedCalendarDay
      : fallbackDay,
    startEnabled: typeof schedule.startEnabled === 'boolean'
      ? schedule.startEnabled
      : DEFAULT_CARD_SCHEDULE.startEnabled,
    startDateValue: schedule.startDateValue ?? DEFAULT_CARD_SCHEDULE.startDateValue,
    dueEnabled: typeof schedule.dueEnabled === 'boolean'
      ? schedule.dueEnabled
      : DEFAULT_CARD_SCHEDULE.dueEnabled,
    dueDateValue: schedule.dueDateValue ?? DEFAULT_CARD_SCHEDULE.dueDateValue,
    dueTimeValue: schedule.dueTimeValue ?? DEFAULT_CARD_SCHEDULE.dueTimeValue,
    displayLabel: schedule.displayLabel ?? card.dueDate ?? DEFAULT_CARD_SCHEDULE.displayLabel,
    preserveDisplayLabel: typeof schedule.preserveDisplayLabel === 'boolean'
      ? schedule.preserveDisplayLabel
      : DEFAULT_CARD_SCHEDULE.preserveDisplayLabel,
  }
}

function buildInitials(fullName = '') {
  return fullName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('') || 'PT'
}

function formatCardCreatedLabel(createdAt) {
  if (!createdAt) return null
  if (typeof createdAt === 'string') return createdAt
  return createdAt.text ?? null
}

function getTimestampMs(value) {
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

function buildInitialActivitySnapshot(card = {}) {
  return {
    createdAt: card.createdAt ?? null,
    created: card.created ?? null,
    memberIds: Array.isArray(card.memberIds) ? [...card.memberIds] : [],
  }
}

function isAssigneeActivityComment(comment = {}) {
  return comment.kind === ASSIGNEE_ACTIVITY_KIND
}

function isUserComment(comment = {}) {
  return !isAssigneeActivityComment(comment)
}

function buildInlineAssignmentText(memberNames = []) {
  if (memberNames.length === 0) {
    return 'removeu os responsaveis · Agora'
  }

  return `atribuiu a: ${memberNames.join(', ')} · Agora`
}

function buildActivityFeedItems({
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

function normalizeChecklistItem(item = {}) {
  const title = item.title ?? item.text ?? 'Item'
  const completed = Boolean(item.completed ?? item.checked)

  return {
    ...item,
    title,
    text: title,
    completed,
    checked: completed,
    assignee: item.assignee ?? null,
    assigneeUserId: item.assigneeUserId ?? item.assignee?.id ?? null,
    startAt: item.startAt ?? null,
    dueAt: item.dueAt ?? null,
  }
}

function normalizeChecklist(checklist) {
  if (!checklist) {
    return null
  }

  return {
    ...checklist,
    title: checklist.title ?? 'Checklist',
    items: Array.isArray(checklist.items) ? checklist.items.map(normalizeChecklistItem) : [],
  }
}

function buildInitialChecklist(card) {
  const [firstChecklist] = Array.isArray(card.checklists) ? card.checklists : []
  return normalizeChecklist(firstChecklist ?? null)
}

function getChecklistAssigneeName(item) {
  return item.assignee?.fullName ?? item.assignee?.name ?? item.assignee?.email ?? ''
}

function getFileExtension(name = '') {
  const parts = name.toLowerCase().split('.')
  return parts.length > 1 ? parts.at(-1) ?? '' : ''
}

function getFileCategory(file) {
  const extension = getFileExtension(file?.name)

  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'avif', 'bmp'].includes(extension)) {
    return { id: 'image', label: 'Imagem' }
  }

  if (['txt', 'md', 'csv', 'json', 'xml', 'log', 'ini', 'yml', 'yaml'].includes(extension)) {
    return { id: 'text', label: 'Texto' }
  }

  if (extension === 'pdf') {
    return { id: 'pdf', label: 'PDF' }
  }

  if (['doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'odt', 'ods'].includes(extension)) {
    return { id: 'document', label: 'Documento' }
  }

  if (['zip', 'rar', '7z', 'tar', 'gz'].includes(extension)) {
    return { id: 'archive', label: 'Arquivo' }
  }

  return { id: 'all', label: 'Arquivo' }
}

export default function CardModal({
  card,
  colTitle,
  onClose,
  onUpdate,
  onDelete,
  onMoveToNextColumn,
  canMoveToNextColumn = false,
  onToggleCardCompleted,
  onAddComment,
  labels,
  members,
  currentUser,
  styles,
  isBackendDriven = false,
  planFiles = [],
  libraryFiles = [],
  filesLoading = false,
  filesError = null,
  onLoadFiles,
  onAttachFile,
  onUploadLocalFile,
  onRemoveAttachment,
  onDownloadFile,
  onCreateChecklist,
  onDeleteChecklist,
  onCreateChecklistItem,
  onUpdateChecklistItem,
  timeZone = 'America/Sao_Paulo',
  dateFormat = 'dd/MM/yyyy',
}) {
  const initialSchedule = buildInitialCardSchedule(card)
  const activitySidebarStorageKey = useMemo(
    () => buildActivitySidebarStorageKey(currentUser?.id),
    [currentUser?.id],
  )
  const [title,    setTitle]    = useState(card.title)
  const [savedTitle, setSavedTitle] = useState(card.title)
  const [desc,     setDesc]     = useState(card.description ?? '')
  const [savedDesc, setSavedDesc] = useState(card.description ?? '')
  const [labelId,  setLabelId]  = useState(card.labelId)
  const [memberIds,setMIds]     = useState(card.memberIds)
  const [dueDate,  setDueDate]  = useState(card.dueDate)
  const [comment,  setComment]  = useState('')
  const [comments, setComments] = useState(card.comments)
  const [activityBase, setActivityBase] = useState(() => buildInitialActivitySnapshot(card))
  const [activityEvents, setActivityEvents] = useState([])
  const [attachments, setAttachments] = useState(Array.isArray(card.attachments) ? card.attachments : [])
  const [exiting,  setExiting]  = useState(false)
  const [isActivitySidebarOpen, setIsActivitySidebarOpen] = useState(() => (
    readActivitySidebarOpenState(buildActivitySidebarStorageKey(currentUser?.id))
  ))
  const [commentFocused, setCommentFocused] = useState(false)
  const [commentFollow, setCommentFollow] = useState(false)
  const [showMembersMenu, setShowMembersMenu] = useState(false)
  const [showLabelMenu, setShowLabelMenu] = useState(false)
  const [showDateMenu, setShowDateMenu] = useState(false)
  const [showChecklistMenu, setShowChecklistMenu] = useState(false)
  const [showTextMenu, setShowTextMenu] = useState(false)
  const [showListMenu, setShowListMenu] = useState(false)
  const [showInsertMenu, setShowInsertMenu] = useState(false)
  const [showFilePicker, setShowFilePicker] = useState(false)
  const [showAttachmentAddMenu, setShowAttachmentAddMenu] = useState(false)
  const [filePickerOpening, setFilePickerOpening] = useState(false)
  const [filePickerFilter, setFilePickerFilter] = useState('plan')
  const [filePickerTypeFilter, setFilePickerTypeFilter] = useState('all')
  const [showFilePickerTypeMenu, setShowFilePickerTypeMenu] = useState(false)
  const [filePickerPosition, setFilePickerPosition] = useState({ top: 0, left: 0 })
  const [fileSearch, setFileSearch] = useState('')
  const [fileActionError, setFileActionError] = useState('')
  const [attachingFileId, setAttachingFileId] = useState(null)
  const [uploadingLocalFile, setUploadingLocalFile] = useState(false)
  const [removingAttachmentId, setRemovingAttachmentId] = useState(null)
  const [membersMenuPosition, setMembersMenuPosition] = useState({ top: 0, left: 0 })
  const [labelMenuPosition, setLabelMenuPosition] = useState({ top: 0, left: 0 })
  const [dateMenuPosition, setDateMenuPosition] = useState({ top: 0, left: 0 })
  const [checklistMenuPosition, setChecklistMenuPosition] = useState({ top: 0, left: 0 })
  const [expandedComments, setExpandedComments] = useState({})
  const [overflowingComments, setOverflowingComments] = useState({})
  const [textMenuPosition, setTextMenuPosition] = useState({ top: 0, left: 0 })
  const [listMenuPosition, setListMenuPosition] = useState({ top: 0, left: 0 })
  const [insertMenuPosition, setInsertMenuPosition] = useState({ top: 0, left: 0 })
  const [selectedCalendarDay, setSelectedCalendarDay] = useState(initialSchedule.selectedCalendarDay)
  const [startEnabled, setStartEnabled] = useState(initialSchedule.startEnabled)
  const [startDateValue, setStartDateValue] = useState(initialSchedule.startDateValue)
  const [dueEnabled, setDueEnabled] = useState(initialSchedule.dueEnabled)
  const [dueDateValue, setDueDateValue] = useState(initialSchedule.dueDateValue)
  const [dueTimeValue, setDueTimeValue] = useState(initialSchedule.dueTimeValue)
  const [displayLabel, setDisplayLabel] = useState(initialSchedule.displayLabel)
  const [preserveDisplayLabel, setPreserveDisplayLabel] = useState(initialSchedule.preserveDisplayLabel)
  const [checklistTitle, setChecklistTitle] = useState('Checklist')
  const [activeChecklist, setActiveChecklist] = useState(() => buildInitialChecklist(card))
  const [newChecklistItem, setNewChecklistItem] = useState('')
  const [checklistComposerOpen, setChecklistComposerOpen] = useState(false)
  const [showChecklistAssignMenu, setShowChecklistAssignMenu] = useState(false)
  const [showChecklistDueMenu, setShowChecklistDueMenu] = useState(false)
  const [checklistAssignMenuPosition, setChecklistAssignMenuPosition] = useState({ top: 0, left: 0 })
  const [checklistDueMenuPosition, setChecklistDueMenuPosition] = useState({ top: 0, left: 0 })
  const [checklistSelectedDay, setChecklistSelectedDay] = useState(() => new Date().getDate())
  const [checklistDateMenuMonth, setChecklistDateMenuMonth] = useState(() => buildCalendarBaseDate(''))
  const [checklistStartEnabled, setChecklistStartEnabled] = useState(false)
  const [checklistStartDateValue, setChecklistStartDateValue] = useState('')
  const [checklistDueEnabled, setChecklistDueEnabled] = useState(false)
  const [checklistDueValue, setChecklistDueValue] = useState('')
  const [checklistAssigneeUserId, setChecklistAssigneeUserId] = useState(null)
  const [isChecklistMutating, setIsChecklistMutating] = useState(false)
  const [togglingChecklistItemId, setTogglingChecklistItemId] = useState(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isSendingComment, setIsSendingComment] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isMovingToNextColumn, setIsMovingToNextColumn] = useState(false)
  const [isTogglingCompleted, setIsTogglingCompleted] = useState(false)
  const [submitError, setSubmitError] = useState(null)
  const [saveStatus, setSaveStatus] = useState('')
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const commentComposerRef = useRef(null)
  const commentTextareaRef = useRef(null)
  const titleTextareaRef = useRef(null)
  const checklistItemTextareaRef = useRef(null)
  const textMenuRef = useRef(null)
  const textMenuButtonRef = useRef(null)
  const membersMenuRef = useRef(null)
  const membersMenuButtonRef = useRef(null)
  const membersMenuLabelRef = useRef(null)
  const labelMenuRef = useRef(null)
  const labelMenuButtonRef = useRef(null)
  const labelMenuLabelRef = useRef(null)
  const dateMenuRef = useRef(null)
  const dateMenuButtonRef = useRef(null)
  const dateMenuLabelRef = useRef(null)
  const checklistMenuRef = useRef(null)
  const checklistMenuButtonRef = useRef(null)
  const checklistAssignMenuRef = useRef(null)
  const checklistAssignButtonRef = useRef(null)
  const checklistDueMenuRef = useRef(null)
  const checklistDueButtonRef = useRef(null)
  const listMenuRef = useRef(null)
  const listMenuButtonRef = useRef(null)
  const insertMenuRef = useRef(null)
  const insertMenuButtonRef = useRef(null)
  const attachmentAddMenuRef = useRef(null)
  const attachmentAddButtonRef = useRef(null)
  const attachmentAddSplitRef = useRef(null)
  const filePickerRef = useRef(null)
  const filePickerTypeButtonRef = useRef(null)
  const filePickerTypeMenuRef = useRef(null)
  const localFileInputRef = useRef(null)
  const commentTextRefs = useRef({})
  const activityFeedRef = useRef(null)
  const saveStatusTimeoutRef = useRef(null)
  const dialogTitleId = `card-modal-title-${card.id}`

  useEffect(() => {
    setIsActivitySidebarOpen(readActivitySidebarOpenState(activitySidebarStorageKey))
  }, [activitySidebarStorageKey])

  useEffect(() => {
    setActivityBase(buildInitialActivitySnapshot(card))
    setActivityEvents([])
  }, [card.id])

  const label = labels.find(l => l.id === labelId)
  const currentUserName = currentUser?.fullName ?? currentUser?.email ?? 'Você'
  const checklistDateMenuDays = buildCalendarDays(checklistDateMenuMonth)
  const canPersistChecklist = isBackendDriven
    && typeof onCreateChecklist === 'function'
    && typeof onCreateChecklistItem === 'function'
    && typeof onUpdateChecklistItem === 'function'
  const canDeletePersistedChecklist = isBackendDriven
    && typeof onDeleteChecklist === 'function'
  const checklistReadOnly = isBackendDriven && !canPersistChecklist
  const checklistDueLabel = checklistDueEnabled && checklistDueValue ? checklistDueValue : 'Sem data'
  const isChecklistAssignAccentActive = showChecklistAssignMenu || Boolean(checklistAssigneeUserId)
  const isChecklistDueAccentActive = showChecklistDueMenu || checklistDueEnabled || Boolean(checklistDueValue)

  const resetChecklistItemDraft = () => {
    setNewChecklistItem('')
    setChecklistAssigneeUserId(null)
    setChecklistStartEnabled(false)
    setChecklistStartDateValue('')
    setChecklistDueEnabled(false)
    setChecklistDueValue('')
    setShowChecklistAssignMenu(false)
    setShowChecklistDueMenu(false)
    setChecklistSelectedDay(new Date().getDate())
    setChecklistDateMenuMonth(buildCalendarBaseDate(''))
  }

  const closeChecklistComposer = () => {
    resetChecklistItemDraft()
    setChecklistComposerOpen(false)
  }
  const isInteractionBlocked = isSaving || isDeleting
  const isMutating = isInteractionBlocked || isSendingComment

  const updateSaveStatus = (message = '') => {
    if (saveStatusTimeoutRef.current) {
      clearTimeout(saveStatusTimeoutRef.current)
      saveStatusTimeoutRef.current = null
    }

    setSaveStatus(message)

    if (!message || message === 'Salvando...') {
      return
    }

    saveStatusTimeoutRef.current = setTimeout(() => {
      setSaveStatus('')
      saveStatusTimeoutRef.current = null
    }, 2200)
  }

  const buildNextCard = (overrides = {}) => {
    const hasOverride = (key) => Object.prototype.hasOwnProperty.call(overrides, key)
    const validMemberIds = new Set((Array.isArray(members) ? members : [])
      .map((member) => member?.id)
      .filter(Boolean))
    const shouldFilterMemberIds = validMemberIds.size > 0
    const nextSchedule = {
      selectedCalendarDay,
      startEnabled,
      startDateValue,
      dueEnabled,
      dueDateValue,
      dueTimeValue,
      displayLabel,
      preserveDisplayLabel,
      ...(overrides.schedule ?? {}),
    }

    const nextMemberIds = Array.isArray(hasOverride('memberIds') ? overrides.memberIds : memberIds)
      ? (hasOverride('memberIds') ? overrides.memberIds : memberIds)
      : []

    return {
      ...card,
      title: hasOverride('title') ? overrides.title : savedTitle,
      description: hasOverride('description') ? overrides.description : savedDesc,
      labelId: hasOverride('labelId') ? overrides.labelId : labelId,
      memberIds: nextMemberIds
        .filter((memberId) => !shouldFilterMemberIds || validMemberIds.has(memberId)),
      dueDate: hasOverride('dueDate') ? overrides.dueDate : dueDate,
      schedule: nextSchedule,
      comments: hasOverride('comments') ? overrides.comments : comments,
      attachments: hasOverride('attachments') ? overrides.attachments : attachments,
      checklists: hasOverride('checklists') ? overrides.checklists : (activeChecklist ? [activeChecklist] : []),
    }
  }

  const applyPersistedCard = (nextCard, options = {}) => {
    if (!nextCard || typeof nextCard !== 'object') {
      return
    }

    const nextTitle = nextCard.title ?? ''
    const nextDescription = nextCard.description ?? ''
    const nextSchedule = buildInitialCardSchedule(nextCard)
    const shouldSyncTitleDraft = options.syncTitleDraft ?? (title === savedTitle)
    const shouldSyncDescriptionDraft = options.syncDescriptionDraft ?? (desc === savedDesc)

    if (shouldSyncTitleDraft) {
      setTitle(nextTitle)
    }
    setSavedTitle(nextTitle)

    if (shouldSyncDescriptionDraft) {
      setDesc(nextDescription)
    }
    setSavedDesc(nextDescription)

    setLabelId(nextCard.labelId ?? '')
    setMIds(Array.isArray(nextCard.memberIds) ? nextCard.memberIds : [])
    setDueDate(nextCard.dueDate ?? '')
    setComments(Array.isArray(nextCard.comments) ? nextCard.comments : [])
    setAttachments(Array.isArray(nextCard.attachments) ? nextCard.attachments : [])

    setSelectedCalendarDay(nextSchedule.selectedCalendarDay)
    setStartEnabled(nextSchedule.startEnabled)
    setStartDateValue(nextSchedule.startDateValue)
    setDueEnabled(nextSchedule.dueEnabled)
    setDueDateValue(nextSchedule.dueDateValue)
    setDueTimeValue(nextSchedule.dueTimeValue)
    setDisplayLabel(nextSchedule.displayLabel)
    setPreserveDisplayLabel(nextSchedule.preserveDisplayLabel)
  }

  const persistCardChanges = async (overrides = {}, options = {}) => {
    if (isInteractionBlocked) return false

    setIsSaving(true)
    setSubmitError(null)
    updateSaveStatus(options.pendingMessage ?? 'Salvando...')

    try {
      const persistedCard = await onUpdate(buildNextCard(overrides))
      applyPersistedCard(persistedCard, options.syncState)
      if (typeof options.onSuccess === 'function') {
        options.onSuccess(persistedCard)
      }
      updateSaveStatus(options.successMessage ?? 'Alterações salvas.')
      return persistedCard ?? true
    } catch (error) {
      setSubmitError(error?.message ?? options.errorMessage ?? 'Não foi possível salvar as alterações do cartão.')
      updateSaveStatus('')
      return false
    } finally {
      setIsSaving(false)
    }
  }

  const startClose = () => {
    setExiting(true)
    setTimeout(onClose, 220)
  }

  const close = () => {
    if (isMutating) return
    startClose()
  }

  const handleMoveToNextColumn = async () => {
    if (isMutating || !canMoveToNextColumn || !onMoveToNextColumn) return

    setIsMovingToNextColumn(true)
    try {
      await onMoveToNextColumn()
    } catch {
      // Parent handles user feedback.
    } finally {
      setIsMovingToNextColumn(false)
    }
  }

  const handleToggleCardCompleted = async () => {
    if (isMutating || isTogglingCompleted || !onToggleCardCompleted) return

    setIsTogglingCompleted(true)
    try {
      await onToggleCardCompleted(card)
    } finally {
      setIsTogglingCompleted(false)
    }
  }

  const saveTitle = async () => {
    const nextTitle = title.trim()
    if (!nextTitle) return
    if (nextTitle === savedTitle) {
      setTitle(savedTitle)
      setIsEditingTitle(false)
      return
    }

    const saved = await persistCardChanges(
      { title: nextTitle },
      {
        errorMessage: 'Não foi possível salvar o título do cartão.',
        successMessage: 'Título salvo.',
        syncState: {
          syncTitleDraft: true,
        },
        onSuccess: () => {
          setIsEditingTitle(false)
        },
      },
    )

    if (!saved) {
      setTimeout(() => titleTextareaRef.current?.focus(), 0)
    }
  }

  const cancelTitleEdit = () => {
    setTitle(savedTitle)
    setIsEditingTitle(false)
    setSubmitError(null)
  }

  const saveDescription = async () => {
    if (desc === savedDesc) return

    const saved = await persistCardChanges(
      { description: desc },
      {
        errorMessage: 'Não foi possível salvar a descrição do cartão.',
        successMessage: 'Descrição salva.',
        syncState: {
          syncDescriptionDraft: true,
        },
      },
    )

    if (!saved) {
      setDesc(savedDesc)
    }
  }

  const toggleMember = async (id) => {
    if (isMutating) return

    const previousMemberIds = memberIds
    const nextMemberIds = previousMemberIds.includes(id)
      ? previousMemberIds.filter((memberId) => memberId !== id)
      : [...previousMemberIds, id]

    setMIds(nextMemberIds)
    const saved = await persistCardChanges(
      { memberIds: nextMemberIds },
      {
        errorMessage: 'Não foi possível atualizar os membros do cartão.',
        successMessage: 'Membros salvos.',
      },
    )

    if (!saved) {
      setMIds(previousMemberIds)
      return
    }

    if (isBackendDriven) {
      return
    }

    const nextMembersSummary = nextMemberIds
      .map((memberId) => members.find((member) => member.id === memberId))
      .filter(Boolean)
      .map(getMemberName)

    setActivityEvents((prev) => [
      ...prev,
      {
        id: uid(),
        type: 'history',
        sortAt: Date.now(),
        actor: currentUserName,
        text: buildInlineAssignmentText(nextMembersSummary),
      },
    ])
  }

  const addComment = async () => {
    const nextCommentText = comment.trim()
    if (!nextCommentText || isMutating) return

    setIsSendingComment(true)
    setSubmitError(null)
    updateSaveStatus('Salvando...')

    try {
      if (typeof onAddComment === 'function') {
        const createdComment = await onAddComment(card.id, nextCommentText)
        if (createdComment) {
          setComments((prev) => [...prev, createdComment])
        }
      } else {
        const createdComment = {
          id: uid(),
          author: currentUser?.id ?? null,
          authorId: currentUser?.id ?? null,
          authorName: currentUserName,
          kind: USER_COMMENT_KIND,
          text: nextCommentText,
          time: 'Agora',
          createdAtIso: new Date().toISOString(),
        }
        setComments((prev) => [...prev, createdComment])
        const saved = await persistCardChanges(
          { comments: [...comments, createdComment] },
          {
            errorMessage: 'Não foi possível salvar o comentário.',
            successMessage: 'Comentário salvo.',
          },
        )

        if (!saved) {
          setComments((prev) => prev.filter((item) => item.id !== createdComment.id))
          return
        }
      }

      setComment('')
      setCommentFollow(false)
      setCommentFocused(false)
      updateSaveStatus('Comentário salvo.')
    } catch (error) {
      setSubmitError(error?.message ?? 'Não foi possível salvar o comentário.')
      updateSaveStatus('')
    } finally {
      setIsSendingComment(false)
    }
  }

  const updateFilePickerPosition = () => {
    const rect = attachmentAddButtonRef.current?.getBoundingClientRect()
    if (!rect) return

    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight
    const pickerWidth = viewportWidth <= 768
      ? Math.min(FILE_PICKER_MOBILE_WIDTH, viewportWidth - 40)
      : Math.min(FILE_PICKER_DESKTOP_WIDTH, viewportWidth - 64)
    const pickerHeight = filePickerRef.current?.getBoundingClientRect?.().height ?? FILE_PICKER_FALLBACK_HEIGHT
    const minLeft = FILE_PICKER_VIEWPORT_MARGIN
    const maxLeft = Math.max(minLeft, viewportWidth - pickerWidth - FILE_PICKER_VIEWPORT_MARGIN)
    const idealLeft = rect.left
    const left = Math.min(Math.max(minLeft, idealLeft), maxLeft)
    const preferredTopBelow = rect.bottom + 4
    const preferredTopAbove = rect.top - pickerHeight - 4
    const minTop = FILE_PICKER_VIEWPORT_MARGIN
    const maxTop = Math.max(minTop, viewportHeight - pickerHeight - FILE_PICKER_VIEWPORT_MARGIN)

    let top = preferredTopBelow

    if (preferredTopBelow + pickerHeight > viewportHeight - FILE_PICKER_VIEWPORT_MARGIN) {
      top = preferredTopAbove >= minTop ? preferredTopAbove : maxTop
    }

    top = Math.min(Math.max(minTop, top), maxTop)

    setFilePickerPosition({
      top,
      left,
    })
  }

  const openFilePicker = async (nextFilter = 'library') => {
    setShowInsertMenu(false)
    setShowAttachmentAddMenu(false)
    setFilePickerFilter(nextFilter)
    setFilePickerTypeFilter('all')
    setShowFilePickerTypeMenu(false)
    setFileSearch('')
    updateFilePickerPosition()
    setFilePickerOpening(true)
    setShowFilePicker(true)
    setFileActionError('')
    try {
      await onLoadFiles?.()
    } finally {
      setFilePickerOpening(false)
    }
  }

  const handleAttachFile = async (file) => {
    if (!onAttachFile || attachingFileId || attachedFileIds.has(file.id)) return

    setAttachingFileId(file.id)
    setFileActionError('')

    try {
      const nextCard = await onAttachFile(file, card.id)
      if (nextCard?.attachments) {
        setAttachments(nextCard.attachments)
      }
      setShowFilePickerTypeMenu(false)
      setFilePickerOpening(false)
      setShowFilePicker(false)
      setFileSearch('')
    } catch (error) {
      setFileActionError(error?.message ?? 'Não foi possível anexar este arquivo.')
    } finally {
      setAttachingFileId(null)
    }
  }

  const handleRemoveAttachment = async (attachment) => {
    if (!onRemoveAttachment || removingAttachmentId || !attachment.canRemove) return

    setRemovingAttachmentId(attachment.id)
    setSubmitError(null)

    try {
      const nextCard = await onRemoveAttachment(attachment)
      if (nextCard?.attachments) {
        setAttachments(nextCard.attachments)
      } else {
        setAttachments((current) => current.filter((item) => item.id !== attachment.id))
      }
    } catch (error) {
      setSubmitError(error?.message ?? 'Não foi possível remover o anexo.')
    } finally {
      setRemovingAttachmentId(null)
    }
  }

  const handleLocalFileInput = async (event) => {
    const [localFile] = Array.from(event.target.files ?? [])
    event.target.value = ''

    if (!localFile || !onUploadLocalFile || uploadingLocalFile) return

    setShowAttachmentAddMenu(false)
    setShowFilePickerTypeMenu(false)
    setUploadingLocalFile(true)
    setFileActionError('')
    setSubmitError(null)

    try {
      const nextCard = await onUploadLocalFile(localFile, card.id)
      if (nextCard?.attachments) {
        setAttachments(nextCard.attachments)
      }
      setShowFilePickerTypeMenu(false)
      setFilePickerOpening(false)
      setShowFilePicker(false)
      setFileSearch('')
    } catch (error) {
      const message = error?.message ?? 'Não foi possível enviar e anexar este arquivo.'
      setFileActionError(message)
      setSubmitError(message)
    } finally {
      setUploadingLocalFile(false)
    }
  }

  const handleDelete = async () => {
    if (isMutating) return

    setIsDeleting(true)
    setSubmitError(null)

    try {
      await onDelete(card.id)
      startClose()
    } catch (error) {
      setSubmitError(error?.message ?? 'Não foi possível excluir o cartão.')
    } finally {
      setIsDeleting(false)
    }
  }
  const handleChecklistCreate = async () => {
    const nextTitle = checklistTitle.trim() || 'Checklist'

    if (canPersistChecklist) {
      if (isChecklistMutating || activeChecklist) return

      const optimisticChecklist = normalizeChecklist({
        id: `temp-checklist-${uid()}`,
        title: nextTitle,
        items: [],
      })

      setIsChecklistMutating(true)
      setSubmitError(null)
      setActiveChecklist(optimisticChecklist)
      setChecklistComposerOpen(true)
      setShowChecklistMenu(false)
      setChecklistTitle('Checklist')
      resetChecklistItemDraft()

      try {
        const createdChecklist = await onCreateChecklist(card.id, nextTitle)
        setActiveChecklist(normalizeChecklist(createdChecklist))
      } catch (error) {
        setActiveChecklist(null)
        setChecklistComposerOpen(false)
        setSubmitError(error?.message ?? 'Não foi possível criar a checklist.')
      } finally {
        setIsChecklistMutating(false)
      }
      return
    }

    setActiveChecklist({ title: nextTitle, items: [] })
    setChecklistComposerOpen(true)
    setShowChecklistMenu(false)
    setChecklistTitle('Checklist')
    resetChecklistItemDraft()
  }
  const handleChecklistDelete = async () => {
    if (!activeChecklist || isChecklistMutating) return

    if (canDeletePersistedChecklist) {
      const previousChecklist = activeChecklist

      setIsChecklistMutating(true)
      setSubmitError(null)
      setActiveChecklist(null)
      closeChecklistComposer()

      try {
        await onDeleteChecklist(previousChecklist.id)
      } catch (error) {
        setActiveChecklist(previousChecklist)
        setChecklistComposerOpen(true)
        setSubmitError(error?.message ?? 'Não foi possível excluir a checklist.')
      } finally {
        setIsChecklistMutating(false)
      }
      return
    }

    setActiveChecklist(null)
    closeChecklistComposer()
  }
  const handleChecklistItemAdd = async () => {
    if (!newChecklistItem.trim() || !activeChecklist) return

    const startAt = checklistStartEnabled
      ? createOffsetDateTime(checklistStartDateValue, '09:00', { timeZone, dateFormat })
      : null
    const dueAt = checklistDueEnabled
      ? createOffsetDateTime(checklistDueValue, '09:00', { timeZone, dateFormat })
      : null

    if (checklistStartEnabled && !startAt) {
      setSubmitError('Informe uma data inicial válida para o item da checklist.')
      return
    }

    if (checklistDueEnabled && !dueAt) {
      setSubmitError('Informe uma data de entrega válida para o item da checklist.')
      return
    }

    if (canPersistChecklist) {
      if (isChecklistMutating || activeChecklist.id?.startsWith('temp-checklist-')) return

      const previousChecklist = activeChecklist
      const previousDraft = {
        newChecklistItem,
        checklistAssigneeUserId,
        checklistStartEnabled,
        checklistStartDateValue,
        checklistDueEnabled,
        checklistDueValue,
        checklistSelectedDay,
        checklistDateMenuMonth,
      }
      const optimisticItem = normalizeChecklistItem({
        id: `temp-checklist-item-${uid()}`,
        title: newChecklistItem.trim(),
        completed: false,
        assigneeUserId: checklistAssigneeUserId,
        assignee: members.find((member) => member.id === checklistAssigneeUserId) ?? null,
        startAt,
        dueAt,
      })

      setIsChecklistMutating(true)
      setSubmitError(null)
      setActiveChecklist((prev) => (
        prev
          ? {
              ...prev,
              items: [...prev.items, optimisticItem],
            }
          : prev
      ))
      resetChecklistItemDraft()
      setChecklistComposerOpen(true)

      try {
        const createdItem = await onCreateChecklistItem(activeChecklist.id, {
          title: newChecklistItem.trim(),
          assigneeUserId: checklistAssigneeUserId,
          startAt,
          dueAt,
        })

        setActiveChecklist((prev) => (
          prev
            ? {
                ...prev,
                items: prev.items.map((item) => (
                  item.id === optimisticItem.id ? normalizeChecklistItem(createdItem) : item
                )),
              }
            : prev
        ))
      } catch (error) {
        setActiveChecklist(previousChecklist)
        setNewChecklistItem(previousDraft.newChecklistItem)
        setChecklistAssigneeUserId(previousDraft.checklistAssigneeUserId)
        setChecklistStartEnabled(previousDraft.checklistStartEnabled)
        setChecklistStartDateValue(previousDraft.checklistStartDateValue)
        setChecklistDueEnabled(previousDraft.checklistDueEnabled)
        setChecklistDueValue(previousDraft.checklistDueValue)
        setChecklistSelectedDay(previousDraft.checklistSelectedDay)
        setChecklistDateMenuMonth(previousDraft.checklistDateMenuMonth)
        setSubmitError(error?.message ?? 'Não foi possível adicionar o item da checklist.')
      } finally {
        setIsChecklistMutating(false)
      }
      return
    }

    setActiveChecklist(prev => ({
      ...prev,
      items: [...prev.items, { id: uid(), text: newChecklistItem.trim(), checked: false }],
    }))
    resetChecklistItemDraft()
    setChecklistComposerOpen(true)
  }
  const toggleChecklistItem = async (itemId) => {
    const currentItem = activeChecklist?.items?.find((item) => item.id === itemId)
    if (!currentItem) return

    if (canPersistChecklist) {
      if (isChecklistMutating || currentItem.id?.startsWith('temp-checklist-item-')) return

      const optimisticItem = normalizeChecklistItem({
        ...currentItem,
        completed: !Boolean(currentItem.completed ?? currentItem.checked),
      })

      setTogglingChecklistItemId(itemId)
      setSubmitError(null)
      setActiveChecklist((prev) => (
        prev
          ? {
              ...prev,
              items: prev.items.map((item) => (
                item.id === itemId ? optimisticItem : item
              )),
            }
          : prev
      ))

      try {
        const updatedItem = await onUpdateChecklistItem({
          id: currentItem.id,
          title: currentItem.title ?? currentItem.text,
          completed: !Boolean(currentItem.completed ?? currentItem.checked),
          assigneeUserId: currentItem.assigneeUserId ?? currentItem.assignee?.id ?? null,
          startAt: currentItem.startAt?.iso ?? currentItem.startAt ?? null,
          dueAt: currentItem.dueAt?.iso ?? currentItem.dueAt ?? null,
        })

        setActiveChecklist((prev) => (
          prev
            ? {
                ...prev,
                items: prev.items.map((item) => (
                  item.id === itemId ? normalizeChecklistItem(updatedItem) : item
                )),
              }
            : prev
        ))
      } catch (error) {
        setActiveChecklist((prev) => (
          prev
            ? {
                ...prev,
                items: prev.items.map((item) => (
                  item.id === itemId ? currentItem : item
                )),
              }
            : prev
        ))
        setSubmitError(error?.message ?? 'Não foi possível atualizar o item da checklist.')
      } finally {
        setTogglingChecklistItemId(null)
      }
      return
    }

    setActiveChecklist(prev => ({
      ...prev,
      items: prev.items.map(item => item.id === itemId ? { ...item, checked: !item.checked } : item),
    }))
  }
  const getMemberName = (member) => {
    if (!member) return 'Membro'
    return member.name ?? member.email ?? member.initials ?? 'Membro'
  }
  const selectedMembers = memberIds.map(id => members.find(m => m.id === id)).filter(Boolean)
  const selectedMembersSummary = selectedMembers.map(getMemberName).join(', ')
  const selectedLabelSummary = label?.text ?? ''
  const selectedDueDateSummary = dueEnabled && dueDateValue && (displayLabel || dueDate)
    ? dueDateValue
    : ''
  const createdAtLabel = formatCardCreatedLabel(activityBase.createdAt) ?? formatCardCreatedLabel(activityBase.created) ?? 'Recentemente'
  const visibleComments = useMemo(() => comments.filter(isUserComment), [comments])
  const activityFeedItems = useMemo(
    () => buildActivityFeedItems({
      activityBase,
      comments,
      activityEvents,
      currentUserName,
      createdAtLabel,
      members,
      getMemberName,
    }),
    [activityBase, comments, activityEvents, currentUserName, createdAtLabel, members],
  )
  const datesSummary = selectedDueDateSummary
    || (startEnabled && startDateValue ? `${startDateValue} → Vencimento` : null)
  const isDatesEmptyPlaceholder = !datesSummary
  const selectedCalendarRange = useMemo(
    () => buildBrazilDateRange(startDateValue, dueDateValue),
    [startDateValue, dueDateValue],
  )
  const handleCalendarRangeChange = (range) => {
    if (!range?.start || !range?.end) return

    setStartDateValue(formatCalendarDateToBrazil(range.start))
    setStartEnabled(true)
    setDueDateValue(formatCalendarDateToBrazil(range.end))
    setDueEnabled(true)
    setSelectedCalendarDay(range.end.day)
  }
  const handleLabelSelect = async (nextLabelId) => {
    if (isMutating) return

    const previousLabelId = labelId
    setLabelId(nextLabelId)
    setShowLabelMenu(false)

    const saved = await persistCardChanges(
      { labelId: nextLabelId },
      {
        errorMessage: 'Não foi possível salvar a etiqueta do cartão.',
        successMessage: 'Etiqueta salva.',
      },
    )

    if (!saved) {
      setLabelId(previousLabelId)
    }
  }
  const pickerSourceFiles = filePickerFilter === 'plan' ? planFiles : libraryFiles
  const pickerFiles = pickerSourceFiles.filter((file) => {
    const matchesSearch = file.name.toLowerCase().includes(fileSearch.trim().toLowerCase())
    const category = getFileCategory(file)
    const matchesType = filePickerTypeFilter === 'all' || category.id === filePickerTypeFilter

    return matchesSearch && matchesType
  })
  const isFilePickerLoading = filePickerOpening || filesLoading
  const attachedFileIds = new Set(attachments.map((attachment) => attachment.fileId))
  const activeFileTypeLabel = FILE_TYPE_OPTIONS.find((option) => option.id === filePickerTypeFilter)?.label ?? 'Tipo'
  const getCommentPresenter = (commentItem) => {
    const memberId = commentItem.authorId ?? commentItem.author
    const member = memberId ? members.find((item) => item.id === memberId) : null

    if (member) {
      return {
        name: getMemberName(member),
        initials: member.initials ?? buildInitials(getMemberName(member)),
        color: member.color ?? 'var(--text-3)',
        avatarUrl: member.avatarUrl ?? null,
      }
    }

    const fallbackName = commentItem.authorName ?? commentItem.author ?? 'Você'

    return {
      name: fallbackName,
      initials: buildInitials(fallbackName),
      color: 'var(--text-3)',
      avatarUrl: commentItem.authorAvatarUrl ?? null,
    }
  }

  useEffect(() => {
    const nextDescription = card.description ?? ''
    setDesc(nextDescription)
    setSavedDesc(nextDescription)
  }, [card.id])

  useEffect(() => {
    setAttachments(Array.isArray(card.attachments) ? card.attachments : [])
  }, [card.id, card.attachments])

  useEffect(() => () => {
    if (saveStatusTimeoutRef.current) {
      clearTimeout(saveStatusTimeoutRef.current)
    }
  }, [])

  useEffect(() => {
    if (showChecklistDueMenu) {
      setChecklistDateMenuMonth(buildCalendarBaseDate(checklistDueValue || checklistStartDateValue))
    }
  }, [checklistDueValue, checklistStartDateValue, showChecklistDueMenu])

  useEffect(() => {
    if (!showChecklistMenu) return

    const handlePointerDown = (event) => {
      const clickedMenu = checklistMenuRef.current?.contains(event.target)
      const clickedButton = checklistMenuButtonRef.current?.contains(event.target)

      if (!clickedMenu && !clickedButton) {
        setShowChecklistMenu(false)
      }
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setShowChecklistMenu(false)
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [showChecklistMenu])

  useEffect(() => {
    if (!showAttachmentAddMenu && !showFilePicker) return

    const handlePointerDown = (event) => {
      const clickedAttachmentControls = attachmentAddSplitRef.current?.contains(event.target)
      const clickedFilePicker = filePickerRef.current?.contains(event.target)

      if (!clickedAttachmentControls && !clickedFilePicker) {
        setShowAttachmentAddMenu(false)
        setShowFilePickerTypeMenu(false)
        setFilePickerOpening(false)
        setShowFilePicker(false)
      }
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setShowAttachmentAddMenu(false)
        setShowFilePickerTypeMenu(false)
        setFilePickerOpening(false)
        setShowFilePicker(false)
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [showAttachmentAddMenu, showFilePicker])

  useEffect(() => {
    if (!showFilePicker) return

    updateFilePickerPosition()

    const handleViewportChange = () => {
      updateFilePickerPosition()
    }

    window.addEventListener('resize', handleViewportChange)
    window.addEventListener('scroll', handleViewportChange, true)

    return () => {
      window.removeEventListener('resize', handleViewportChange)
      window.removeEventListener('scroll', handleViewportChange, true)
    }
  }, [showFilePicker])

  useLayoutEffect(() => {
    if (!showFilePicker) return
    updateFilePickerPosition()
  }, [showFilePicker, isFilePickerLoading, fileActionError, filesError, pickerFiles.length, filePickerFilter, filePickerTypeFilter])

  useEffect(() => {
    if (!showFilePickerTypeMenu) return

    const handlePointerDown = (event) => {
      const clickedButton = filePickerTypeButtonRef.current?.contains(event.target)
      const clickedMenu = filePickerTypeMenuRef.current?.contains(event.target)

      if (!clickedButton && !clickedMenu) {
        setShowFilePickerTypeMenu(false)
      }
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setShowFilePickerTypeMenu(false)
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [showFilePickerTypeMenu])

  useEffect(() => {
    if (!showChecklistAssignMenu) return

    const handlePointerDown = (event) => {
      const clickedMenu = checklistAssignMenuRef.current?.contains(event.target)
      const clickedButton = checklistAssignButtonRef.current?.contains(event.target)

      if (!clickedMenu && !clickedButton) {
        setShowChecklistAssignMenu(false)
      }
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setShowChecklistAssignMenu(false)
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [showChecklistAssignMenu])

  useEffect(() => {
    if (!showChecklistDueMenu) return

    const handlePointerDown = (event) => {
      const clickedMenu = checklistDueMenuRef.current?.contains(event.target)
      const clickedButton = checklistDueButtonRef.current?.contains(event.target)

      if (!clickedMenu && !clickedButton) {
        setShowChecklistDueMenu(false)
      }
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setShowChecklistDueMenu(false)
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [showChecklistDueMenu])

  useEffect(() => {
    if (!showMembersMenu) return

    const handlePointerDown = (event) => {
      const clickedMenu = membersMenuRef.current?.contains(event.target)
      const clickedButton = membersMenuButtonRef.current?.contains(event.target)
        || membersMenuLabelRef.current?.contains(event.target)

      if (!clickedMenu && !clickedButton) {
        setShowMembersMenu(false)
      }
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setShowMembersMenu(false)
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [showMembersMenu])

  useEffect(() => {
    if (!showLabelMenu) return

    const handlePointerDown = (event) => {
      const clickedMenu = labelMenuRef.current?.contains(event.target)
      const clickedButton = labelMenuButtonRef.current?.contains(event.target)
        || labelMenuLabelRef.current?.contains(event.target)

      if (!clickedMenu && !clickedButton) {
        setShowLabelMenu(false)
      }
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setShowLabelMenu(false)
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [showLabelMenu])

  useEffect(() => {
    if (!showDateMenu) return

    const handlePointerDown = (event) => {
      const clickedMenu = dateMenuRef.current?.contains(event.target)
      const clickedButton = dateMenuButtonRef.current?.contains(event.target)
        || dateMenuLabelRef.current?.contains(event.target)

      if (!clickedMenu && !clickedButton) {
        setShowDateMenu(false)
      }
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setShowDateMenu(false)
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [showDateMenu])

  useEffect(() => {
    if (!showTextMenu) return

    const handlePointerDown = (event) => {
      const clickedMenu = textMenuRef.current?.contains(event.target)
      const clickedButton = textMenuButtonRef.current?.contains(event.target)

      if (!clickedMenu && !clickedButton) {
        setShowTextMenu(false)
      }
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setShowTextMenu(false)
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [showTextMenu])

  useEffect(() => {
    if (!showInsertMenu) return

    const handlePointerDown = (event) => {
      const clickedMenu = insertMenuRef.current?.contains(event.target)
      const clickedButton = insertMenuButtonRef.current?.contains(event.target)

      if (!clickedMenu && !clickedButton) {
        setShowInsertMenu(false)
      }
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setShowInsertMenu(false)
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [showInsertMenu])

  useEffect(() => {
    if (!showListMenu) return

    const handlePointerDown = (event) => {
      const clickedMenu = listMenuRef.current?.contains(event.target)
      const clickedButton = listMenuButtonRef.current?.contains(event.target)

      if (!clickedMenu && !clickedButton) {
        setShowListMenu(false)
      }
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setShowListMenu(false)
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [showListMenu])

  useLayoutEffect(() => {
    if (!showChecklistMenu || !checklistMenuButtonRef.current) return

    const updatePosition = () => {
      const rect = checklistMenuButtonRef.current.getBoundingClientRect()
      setChecklistMenuPosition({
        top: rect.bottom + 8,
        left: rect.left,
      })
    }

    updatePosition()

    window.addEventListener('resize', updatePosition)
    window.addEventListener('scroll', updatePosition, true)

    return () => {
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', updatePosition, true)
    }
  }, [showChecklistMenu])

  useLayoutEffect(() => {
    if (!showChecklistAssignMenu || !checklistAssignButtonRef.current) return

    const updatePosition = () => {
      const rect = checklistAssignButtonRef.current.getBoundingClientRect()
      setChecklistAssignMenuPosition({
        top: rect.bottom + 8,
        left: rect.left,
      })
    }

    updatePosition()

    window.addEventListener('resize', updatePosition)
    window.addEventListener('scroll', updatePosition, true)

    return () => {
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', updatePosition, true)
    }
  }, [showChecklistAssignMenu])

  useLayoutEffect(() => {
    if (!showChecklistDueMenu || !checklistDueButtonRef.current) return

    const updatePosition = () => {
      const rect = checklistDueButtonRef.current.getBoundingClientRect()
      const menuHeight = checklistDueMenuRef.current?.offsetHeight ?? 340
      const menuWidth = checklistDueMenuRef.current?.offsetWidth ?? 272
      const maxLeft = Math.max(12, window.innerWidth - menuWidth - 12)
      setChecklistDueMenuPosition({
        top: Math.max(12, rect.top - menuHeight - 8),
        left: Math.min(rect.left, maxLeft),
      })
    }

    updatePosition()

    window.addEventListener('resize', updatePosition)
    window.addEventListener('scroll', updatePosition, true)

    return () => {
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', updatePosition, true)
    }
  }, [showChecklistDueMenu])

  useLayoutEffect(() => {
    if (!showMembersMenu || !membersMenuButtonRef.current) return

    const updatePosition = () => {
      const rect = membersMenuButtonRef.current.getBoundingClientRect()
      setMembersMenuPosition({
        top: rect.bottom + 8,
        left: rect.left,
      })
    }

    updatePosition()

    window.addEventListener('resize', updatePosition)
    window.addEventListener('scroll', updatePosition, true)

    return () => {
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', updatePosition, true)
    }
  }, [showMembersMenu])

  useLayoutEffect(() => {
    if (!showLabelMenu || !labelMenuButtonRef.current) return

    const updatePosition = () => {
      const rect = labelMenuButtonRef.current.getBoundingClientRect()
      setLabelMenuPosition({
        top: rect.bottom + 8,
        left: rect.left,
      })
    }

    updatePosition()

    window.addEventListener('resize', updatePosition)
    window.addEventListener('scroll', updatePosition, true)

    return () => {
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', updatePosition, true)
    }
  }, [showLabelMenu])

  useLayoutEffect(() => {
    if (!showDateMenu || !dateMenuButtonRef.current) return

    const updatePosition = () => {
      const rect = dateMenuButtonRef.current.getBoundingClientRect()
      setDateMenuPosition({
        top: rect.bottom + 8,
        left: rect.left,
      })
    }

    updatePosition()

    window.addEventListener('resize', updatePosition)
    window.addEventListener('scroll', updatePosition, true)

    return () => {
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', updatePosition, true)
    }
  }, [showDateMenu])

  useLayoutEffect(() => {
    if (!showTextMenu || !textMenuButtonRef.current) return

    const updatePosition = () => {
      const rect = textMenuButtonRef.current.getBoundingClientRect()
      setTextMenuPosition({
        top: rect.bottom + 8,
        left: rect.left,
      })
    }

    updatePosition()

    window.addEventListener('resize', updatePosition)
    window.addEventListener('scroll', updatePosition, true)

    return () => {
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', updatePosition, true)
    }
  }, [showTextMenu])

  useLayoutEffect(() => {
    if (!showInsertMenu || !insertMenuButtonRef.current) return

    const updatePosition = () => {
      const rect = insertMenuButtonRef.current.getBoundingClientRect()
      setInsertMenuPosition({
        top: rect.bottom + 8,
        left: Math.max(16, rect.right - 280),
      })
    }

    updatePosition()

    window.addEventListener('resize', updatePosition)
    window.addEventListener('scroll', updatePosition, true)

    return () => {
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', updatePosition, true)
    }
  }, [showInsertMenu])

  useLayoutEffect(() => {
    if (!commentTextareaRef.current) return

    const textarea = commentTextareaRef.current
    const minimumHeight = commentFocused ? 96 : 40

    textarea.style.height = 'auto'
    textarea.style.height = `${minimumHeight}px`

    const nextHeight = Math.min(textarea.scrollHeight, 160)
    textarea.style.height = `${Math.max(nextHeight, minimumHeight)}px`
  }, [comment, commentFocused])

  useEffect(() => {
    if (activeChecklist) {
      checklistItemTextareaRef.current?.focus()
    }
  }, [activeChecklist?.items?.length, activeChecklist, checklistComposerOpen])

  useLayoutEffect(() => {
    const nextOverflowingComments = {}

    visibleComments.forEach((commentItem) => {
      const element = commentTextRefs.current[commentItem.id]
      if (!element) return

      const computedStyle = window.getComputedStyle(element)
      const lineHeight = Number.parseFloat(computedStyle.lineHeight) || 19.5
      const maxHeight = lineHeight * 10

      nextOverflowingComments[commentItem.id] = element.scrollHeight > maxHeight + 1
    })

    setOverflowingComments(nextOverflowingComments)
  }, [visibleComments])

  useLayoutEffect(() => {
    const feed = activityFeedRef.current
    if (!feed) return
    feed.scrollTop = feed.scrollHeight
  }, [activityFeedItems])

  useLayoutEffect(() => {
    if (!showListMenu || !listMenuButtonRef.current) return

    const updatePosition = () => {
      const rect = listMenuButtonRef.current.getBoundingClientRect()
      setListMenuPosition({
        top: rect.bottom + 8,
        left: Math.max(16, rect.left - 24),
      })
    }

    updatePosition()

    window.addEventListener('resize', updatePosition)
    window.addEventListener('scroll', updatePosition, true)

    return () => {
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', updatePosition, true)
    }
  }, [showListMenu])

  return (
    <div className={`${styles.modalOverlay} ${exiting ? styles.overlayOut : ''}`} onClick={close}>
      <div
        className={`${styles.cardModal} ${exiting ? styles.modalOut : ''}`}
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby={dialogTitleId}
      >
        <div className={styles.cmTopBar}>
          <div className={styles.cmBreadcrumbs}>
            <span>Quadro</span>
            <span className={styles.cmBreadcrumbSep}>/</span>
            <span className={styles.cmBreadcrumbCurrent}>{colTitle}</span>
          </div>
          <div className={styles.cmTopBarMeta}>
            <span className={styles.cmCreatedAt}>Criada em {createdAtLabel}</span>
            <span className={styles.cmTopBarDivider} aria-hidden="true" />
            <button type="button" className={styles.cmTopBarLink}>Faça uma pergunta</button>
            <button type="button" className={styles.cmTopBarLink}>Compartilhar</button>
            <span className={styles.cmTopBarDivider} aria-hidden="true" />
            <button type="button" className={styles.cmIconBtn} title="Favoritar" aria-label="Favoritar"><Star size={ICON_SIZE} strokeWidth={ICON_STROKE} aria-hidden="true" /></button>
            <button type="button" className={styles.cmIconBtn} onClick={handleDelete} title="Excluir cartão" aria-label="Excluir cartão" disabled={isMutating}><Trash2 size={ICON_SIZE} strokeWidth={ICON_STROKE} aria-hidden="true" /></button>
            <button type="button" className={styles.cmIconBtn} onClick={close} title="Fechar" aria-label="Fechar detalhes do cartão" disabled={isMutating}><X size={ICON_SIZE} strokeWidth={ICON_STROKE} aria-hidden="true" /></button>
          </div>
        </div>

        <div className={`${styles.cmBody} ${!isActivitySidebarOpen ? styles.cmBodyActivityCollapsed : ''}`}>
          <div className={styles.cmMain}>
            <div className={styles.cmTaskTypeRow}>
              <button type="button" className={styles.cmTaskTypePill} aria-label="Tipo de tarefa">
                <span className={styles.cmTaskTypeIcon}><List size={ICON_SIZE} strokeWidth={ICON_STROKE} aria-hidden="true" /></span>
                <span>Tarefa</span>
                <span className={styles.cmStatusBtnIcon}><ChevronRight size={11} strokeWidth={ICON_STROKE} aria-hidden="true" /></span>
              </button>
            </div>

            <div className={styles.cmTitleRow}>
              <div className={styles.cmTitleEditor}>
                <textarea
                  ref={titleTextareaRef}
                  id={dialogTitleId}
                  className={styles.cmTitle}
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  onFocus={() => setIsEditingTitle(true)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      void saveTitle()
                    }
                    if (e.key === 'Escape') {
                      e.preventDefault()
                      cancelTitleEdit()
                    }
                  }}
                  rows={1}
                  placeholder="Título do cartão"
                  aria-label="Título do cartão"
                  disabled={isMutating}
                />
                {isEditingTitle && (
                  <>
                    <button
                      type="button"
                      className={`${styles.cmTitleAction} ${styles.cmTitleConfirm}`}
                      aria-label="Confirmar novo título"
                      title="Confirmar"
                      disabled={isMutating || !title.trim()}
                      onClick={() => {
                        void saveTitle()
                      }}
                    >
                      <Check size={ICON_SIZE_SM} strokeWidth={ICON_STROKE} aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      className={`${styles.cmTitleAction} ${styles.cmTitleCancel}`}
                      aria-label="Cancelar renomeação"
                      title="Cancelar"
                      disabled={isMutating}
                      onClick={cancelTitleEdit}
                    >
                      <X size={ICON_SIZE} strokeWidth={ICON_STROKE} aria-hidden="true" />
                    </button>
                  </>
                )}
              </div>
            </div>

            <div className={styles.cmAiBar}>
              <span className={styles.cmAiBarIcon} aria-hidden="true">
                <span className={styles.cmAiBarIconGlow} aria-hidden="true" />
                <span className={styles.cmAiBarIconMark}>
                  <Sparkles size={11} strokeWidth={ICON_STROKE} aria-hidden="true" />
                </span>
              </span>
              <span className={styles.cmAiBarText}>Peça ao Intelligence para escrever uma descrição, gerar subtarefas ou encontrar tarefas semelhantes</span>
            </div>

            <div className={styles.cmPropertiesGrid}>
              <div className={styles.cmPropertiesCol}>
                <div className={styles.cmPropertyRow}>
                  <button type="button" className={styles.cmPropertyLabelBtn}>
                    <Goal size={ICON_SIZE} strokeWidth={ICON_STROKE} aria-hidden="true" /> Status
                  </button>
                  <div className={styles.cmPropertyValue}>
                    <div className={styles.cmStatusSplit}>
                      <div className={styles.cmStatusSplitMain}>
                        <span className={styles.cmStatusSplitMainLeft}>
                          <span className={styles.cmStatusSplitLabel}>{colTitle}</span>
                        </span>
                        <span className={styles.cmStatusSplitDivider} aria-hidden="true" />
                        <button
                          type="button"
                          className={styles.cmStatusSplitToggle}
                          aria-label="Mover para a próxima coluna"
                          disabled={isMutating || isMovingToNextColumn || !canMoveToNextColumn}
                          onClick={() => { void handleMoveToNextColumn() }}
                        >
                          <MoveRight size={ICON_SIZE_SM} strokeWidth={ICON_STROKE} aria-hidden="true" />
                        </button>
                      </div>
                      <button
                        type="button"
                        className={`${styles.cmStatusSplitAction} ${card.isCompleted ? styles.cmStatusSplitActionChecked : ''}`}
                        aria-label={card.isCompleted ? 'Desmarcar tarefa concluída' : 'Concluir tarefa'}
                        aria-pressed={Boolean(card.isCompleted)}
                        disabled={isMutating || isTogglingCompleted}
                        onClick={() => { void handleToggleCardCompleted() }}
                      >
                        <Check size={16} strokeWidth={ICON_STROKE} aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                </div>

                <div className={styles.cmPropertyRow}>
                  <button
                    ref={dateMenuLabelRef}
                    type="button"
                    className={styles.cmPropertyLabelBtn}
                    onClick={() => setShowDateMenu((value) => !value)}
                    aria-expanded={showDateMenu}
                    aria-haspopup="dialog"
                    disabled={isMutating}
                  >
                    <Calendar size={ICON_SIZE} strokeWidth={ICON_STROKE} aria-hidden="true" /> Datas
                  </button>
                  <div className={styles.cmPropertyValue}>
                    <button
                      ref={dateMenuButtonRef}
                      type="button"
                      className={`${styles.cmPropertyBtn} ${showDateMenu ? styles.cmPropertyBtnActive : ''}`}
                      onClick={() => setShowDateMenu((value) => !value)}
                      aria-expanded={showDateMenu}
                      aria-haspopup="dialog"
                      disabled={isMutating}
                    >
                      {isDatesEmptyPlaceholder ? (
                        <span className={styles.cmPropertyDatesSummary}>
                          <span className={styles.cmPropertyDatesPart}>
                            <CalendarPlus size={ICON_SIZE} strokeWidth={ICON_STROKE} aria-hidden="true" />
                            Início
                          </span>
                          <span className={styles.cmPropertyDatesSep} aria-hidden="true">→</span>
                          <span className={styles.cmPropertyDatesPart}>
                            <CalendarPlus size={ICON_SIZE} strokeWidth={ICON_STROKE} aria-hidden="true" />
                            Vencimento
                          </span>
                        </span>
                      ) : (
                        datesSummary
                      )}
                    </button>
                  </div>
                </div>

                <div className={styles.cmPropertyRow}>
                  <button type="button" className={styles.cmPropertyLabelBtn}>
                    <Hourglass size={ICON_SIZE} strokeWidth={ICON_STROKE} aria-hidden="true" /> Estimativa de tempo
                  </button>
                  <div className={styles.cmPropertyValue}>
                    <span className={styles.cmPropertyEmpty}>Vazio</span>
                  </div>
                </div>

                <div className={styles.cmPropertyRow}>
                  <button
                    ref={labelMenuLabelRef}
                    type="button"
                    className={styles.cmPropertyLabelBtn}
                    onClick={() => setShowLabelMenu(v => !v)}
                    aria-expanded={showLabelMenu}
                    aria-haspopup="menu"
                    disabled={isMutating}
                  >
                    <Tag size={ICON_SIZE} strokeWidth={ICON_STROKE} aria-hidden="true" /> Etiquetas
                  </button>
                  <div className={styles.cmPropertyValue}>
                    <button
                      ref={labelMenuButtonRef}
                      type="button"
                      className={`${styles.cmPropertyBtn} ${showLabelMenu ? styles.cmPropertyBtnActive : ''}`}
                      onClick={() => setShowLabelMenu(v => !v)}
                      aria-expanded={showLabelMenu}
                      aria-haspopup="menu"
                      disabled={isMutating}
                    >
                      {selectedLabelSummary ? (
                        <span
                          className={styles.cmToolbarLabelChip}
                          style={{ background: `${label.color}20`, color: label.color }}
                          title={selectedLabelSummary}
                        >
                          {selectedLabelSummary}
                        </span>
                      ) : (
                        <span className={styles.cmPropertyEmpty}>Vazio</span>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              <div className={styles.cmPropertiesCol}>
                <div className={styles.cmPropertyRow}>
                  <button
                    ref={membersMenuLabelRef}
                    type="button"
                    className={styles.cmPropertyLabelBtn}
                    onClick={() => setShowMembersMenu(v => !v)}
                    aria-expanded={showMembersMenu}
                    aria-haspopup="menu"
                    disabled={isMutating}
                  >
                    <Users size={ICON_SIZE} strokeWidth={ICON_STROKE} aria-hidden="true" /> Responsáveis
                  </button>
                  <div className={styles.cmPropertyValue}>
                    <button
                      ref={membersMenuButtonRef}
                      type="button"
                      className={`${styles.cmAssigneeChip} ${showMembersMenu ? styles.cmPropertyBtnActive : ''}`}
                      onClick={() => setShowMembersMenu(v => !v)}
                      aria-expanded={showMembersMenu}
                      aria-haspopup="menu"
                      disabled={isMutating}
                    >
                      {selectedMembers.length > 0 ? (
                        <>
                          <AuthenticatedAvatar
                            className={styles.cmAssigneeAvatar}
                            imageClassName={styles.avatarImage}
                            style={{ background: selectedMembers[0].color }}
                            avatarUrl={selectedMembers[0].avatarUrl}
                            fallback={selectedMembers[0].initials}
                            title={getMemberName(selectedMembers[0])}
                          />
                          <span className={styles.cmAssigneeName}>{selectedMembersSummary}</span>
                        </>
                      ) : (
                        <span className={styles.cmPropertyEmpty}>Vazio</span>
                      )}
                    </button>
                  </div>
                </div>

                <div className={styles.cmPropertyRow}>
                  <button type="button" className={styles.cmPropertyLabelBtn}>
                    <Flag size={ICON_SIZE} strokeWidth={ICON_STROKE} aria-hidden="true" /> Prioridade
                  </button>
                  <div className={styles.cmPropertyValue}>
                    <span className={styles.cmPropertyEmpty}>Vazio</span>
                  </div>
                </div>

                <div className={styles.cmPropertyRow}>
                  <button type="button" className={styles.cmPropertyLabelBtn}>
                    <TimerReset size={ICON_SIZE} strokeWidth={ICON_STROKE} aria-hidden="true" /> Rastrear tempo
                  </button>
                  <div className={styles.cmPropertyValue}>
                    <span className={styles.cmPropertyEmpty}>Start</span>
                  </div>
                </div>
              </div>
            </div>

            <div className={`${styles.cmDescSection} ${desc.trim() ? styles.cmDescSectionHasValue : ''}`}>
              <div className={styles.cmDescToolbar}>
                <button
                  type="button"
                  className={styles.cmDescToolbarBtn}
                  title="Histórico da descrição"
                  aria-label="Histórico da descrição"
                  onMouseDown={(event) => event.preventDefault()}
                  disabled={isMutating}
                >
                  <History size={ICON_SIZE_SM} strokeWidth={ICON_STROKE} aria-hidden="true" />
                </button>
                <button
                  type="button"
                  className={styles.cmDescToolbarBtn}
                  title="Expandir descrição"
                  aria-label="Expandir descrição"
                  onMouseDown={(event) => event.preventDefault()}
                  disabled={isMutating}
                >
                  <Maximize2 size={ICON_SIZE_SM} strokeWidth={ICON_STROKE} aria-hidden="true" />
                </button>
              </div>
              <div className={styles.cmDescEditor}>
                {!desc.trim() ? (
                  <div className={styles.cmDescPlaceholder} aria-hidden="true">
                    <span>Adicione uma descrição ou escreva com</span>
                    <span className={styles.cmDescPlaceholderAi}>
                      <PencilLine size={ICON_SIZE} strokeWidth={ICON_STROKE} aria-hidden="true" />
                      <span>IA</span>
                    </span>
                  </div>
                ) : null}
                <textarea
                  className={styles.cmDesc}
                  value={desc}
                  onChange={(event) => setDesc(event.target.value)}
                  onBlur={() => {
                    void saveDescription()
                  }}
                  onKeyDown={(event) => {
                    if (event.key === 'Escape' && !isMutating) {
                      event.preventDefault()
                      setDesc(savedDesc)
                      event.currentTarget.blur()
                    }
                  }}
                  rows={4}
                  aria-label="Descrição do cartão"
                  disabled={isMutating}
                />
              </div>
            </div>

            <div className={styles.cmActionList}>
              <button type="button" className={styles.cmActionItem}>
                <span className={styles.cmActionItemIcon}><Plus size={ICON_SIZE} strokeWidth={ICON_STROKE} aria-hidden="true" /></span>
                Adicione os campos
              </button>
              <button type="button" className={styles.cmActionItem}>
                <span className={styles.cmActionItemIcon}><Plus size={ICON_SIZE} strokeWidth={ICON_STROKE} aria-hidden="true" /></span>
                Adicionar subtarefa
              </button>
              <button type="button" className={styles.cmActionItem}>
                <span className={styles.cmActionItemIcon}><Link size={ICON_SIZE} strokeWidth={ICON_STROKE} aria-hidden="true" /></span>
                Vincular itens ou adicionar dependências
              </button>
              <button
                ref={checklistMenuButtonRef}
                type="button"
                className={styles.cmActionItem}
                onClick={() => {
                  if (!checklistReadOnly && !activeChecklist) setShowChecklistMenu(v => !v)
                }}
                aria-expanded={showChecklistMenu}
                aria-haspopup="dialog"
                disabled={checklistReadOnly || Boolean(activeChecklist) || isChecklistMutating}
                title={
                  checklistReadOnly
                    ? 'Checklist indisponível para edição neste modo.'
                    : activeChecklist
                      ? 'Este cartão já possui uma checklist.'
                      : undefined
                }
              >
                <span className={styles.cmActionItemIcon}><Check size={ICON_SIZE_SM} strokeWidth={ICON_STROKE} aria-hidden="true" /></span>
                Criar checklist
              </button>
              <div ref={attachmentAddSplitRef} className={styles.cmActionAttachWrap}>
                <button
                  ref={attachmentAddButtonRef}
                  type="button"
                  className={styles.cmActionItem}
                  aria-label="Adicionar anexo"
                  aria-expanded={showAttachmentAddMenu}
                  aria-haspopup="menu"
                  onClick={() => {
                    setFilePickerOpening(false)
                    setShowFilePicker(false)
                    setShowAttachmentAddMenu((value) => !value)
                  }}
                  disabled={uploadingLocalFile}
                >
                  <span className={styles.cmActionItemIcon}><Paperclip size={ICON_SIZE} strokeWidth={ICON_STROKE} aria-hidden="true" /></span>
                  {uploadingLocalFile ? 'Enviando...' : 'Anexar arquivo'}
                </button>

                {showAttachmentAddMenu && (
                  <div
                    ref={attachmentAddMenuRef}
                    className={styles.cmAttachmentAddMenu}
                    role="menu"
                  >
                    <button
                      type="button"
                      className={styles.cmAttachmentAddMenuItem}
                      onClick={() => {
                        void openFilePicker()
                      }}
                      role="menuitem"
                    >
                      <span className={styles.cmAttachmentAddMenuItemIcon}><FileText size={ICON_SIZE} strokeWidth={ICON_STROKE} aria-hidden="true" /></span>
                      Biblioteca
                    </button>
                    <button
                      type="button"
                      className={styles.cmAttachmentAddMenuItem}
                      onClick={() => {
                        setShowAttachmentAddMenu(false)
                        localFileInputRef.current?.click()
                      }}
                      role="menuitem"
                    >
                      <span className={styles.cmAttachmentAddMenuItemIcon}><Monitor size={14} strokeWidth={ICON_STROKE} aria-hidden="true" /></span>
                      Meu Computador
                    </button>
                  </div>
                )}
              </div>
            </div>

            <input
              ref={localFileInputRef}
              type="file"
              className={styles.cmHiddenFileInput}
              onChange={handleLocalFileInput}
              tabIndex={-1}
              aria-hidden="true"
            />

            {attachments.length > 0 && (
              <div className={styles.cmInlineAttachments}>
                {attachments.map((attachment) => (
                  <div key={attachment.id} className={styles.cmInlineAttachmentRow}>
                    <span className={styles.cmInlineAttachmentIcon}><FileText size={ICON_SIZE} strokeWidth={ICON_STROKE} aria-hidden="true" /></span>
                    <div className={styles.cmInlineAttachmentBody}>
                      <span className={styles.cmInlineAttachmentName}>{attachment.name}</span>
                      <span className={styles.cmInlineAttachmentMeta}>
                        {formatFileSize(attachment.size)}
                        {attachment.attachedBy?.fullName ? ` · ${attachment.attachedBy.fullName}` : ''}
                      </span>
                    </div>
                    <div className={styles.cmInlineAttachmentActions}>
                      {onDownloadFile ? (
                        <button
                          type="button"
                          className={styles.cmInlineAttachmentBtn}
                          onClick={() => {
                            Promise.resolve(onDownloadFile(attachment)).catch((error) => {
                              setSubmitError(error?.message ?? 'Não foi possível baixar o anexo.')
                            })
                          }}
                          aria-label={`Baixar ${attachment.name}`}
                        >
                          <Download size={14} strokeWidth={ICON_STROKE} aria-hidden="true" />
                        </button>
                      ) : null}
                      {attachment.canRemove ? (
                        <button
                          type="button"
                          className={styles.cmInlineAttachmentBtn}
                          onClick={() => handleRemoveAttachment(attachment)}
                          disabled={removingAttachmentId === attachment.id}
                          aria-label={`Remover ${attachment.name}`}
                        >
                          <X size={ICON_SIZE} strokeWidth={ICON_STROKE} aria-hidden="true" />
                        </button>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            )}

              {activeChecklist && (
                <div className={styles.cmChecklistBlock}>
                  <div className={styles.cmChecklistBlockHeader}>
                    <div className={styles.cmChecklistBlockTitleWrap}>
                      <span className={styles.cmChecklistBlockIcon}><Check size={ICON_SIZE_SM} strokeWidth={ICON_STROKE} aria-hidden="true" /></span>
                      <p className={styles.cmChecklistBlockTitle}>{activeChecklist.title}</p>
                    </div>
                      {(!isBackendDriven || canDeletePersistedChecklist) && (
                        <button
                          type="button"
                          className={styles.cmChecklistDeleteBtn}
                          onClick={handleChecklistDelete}
                          disabled={isChecklistMutating}
                        >
                          {isChecklistMutating ? 'Excluindo...' : 'Excluir'}
                        </button>
                      )}
                  </div>

                  <div className={styles.cmChecklistProgressRow}>
                    <span className={styles.cmChecklistProgressLabel}>
                      {activeChecklist.items.length === 0
                        ? '0%'
                        : `${Math.round((activeChecklist.items.filter(item => item.checked).length / activeChecklist.items.length) * 100)}%`}
                    </span>
                    <div className={styles.cmChecklistProgressBar}>
                      <span
                        className={styles.cmChecklistProgressFill}
                        style={{
                          width: activeChecklist.items.length === 0
                            ? '0%'
                            : `${Math.round((activeChecklist.items.filter(item => item.checked).length / activeChecklist.items.length) * 100)}%`,
                        }}
                      />
                    </div>
                  </div>

                  {activeChecklist.items.length > 0 && (
                    <div className={styles.cmChecklistItems}>
                      {activeChecklist.items.map(item => (
                        <label key={item.id} className={styles.cmChecklistItemRow}>
                          <button
                            type="button"
                            className={`${styles.cmChecklistItemCheckbox} ${item.checked ? styles.cmChecklistItemCheckboxActive : ''}`}
                            onClick={() => toggleChecklistItem(item.id)}
                            disabled={checklistReadOnly || togglingChecklistItemId === item.id}
                          >
                            {item.checked && <Check size={ICON_SIZE_SM} strokeWidth={ICON_STROKE} aria-hidden="true" />}
                          </button>
                          <div className={styles.cmChecklistItemBody}>
                            <span className={`${styles.cmChecklistItemText} ${item.checked ? styles.cmChecklistItemTextChecked : ''}`}>
                              {item.text}
                            </span>
                            {(getChecklistAssigneeName(item) || item.dueAt?.text) && (
                              <span className={styles.cmChecklistItemMeta}>
                                {getChecklistAssigneeName(item) || 'Sem responsável'}
                                {item.dueAt?.text ? ` · ${item.dueAt.text}` : ''}
                              </span>
                            )}
                          </div>
                        </label>
                      ))}
                    </div>
                  )}

                    {!checklistReadOnly && checklistComposerOpen ? (
                      <>
                        <textarea
                          ref={checklistItemTextareaRef}
                          className={styles.cmChecklistItemInput}
                          placeholder="Adicionar um item"
                          value={newChecklistItem}
                          onChange={e => setNewChecklistItem(e.target.value)}
                          rows={1}
                          onKeyDown={e => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault()
                              handleChecklistItemAdd()
                            }
                          }}
                        />

                        <div className={styles.cmChecklistActions}>
                          <button
                            type="button"
                            className={styles.cmChecklistPrimaryBtn}
                            onClick={handleChecklistItemAdd}
                            disabled={isChecklistMutating || !newChecklistItem.trim()}
                          >
                            {isChecklistMutating ? 'Adicionando...' : 'Adicionar'}
                          </button>
                          <button
                            type="button"
                            className={styles.cmChecklistSecondaryBtn}
                            onClick={closeChecklistComposer}
                            disabled={isChecklistMutating}
                          >
                            Cancelar
                          </button>
                          <button
                            ref={checklistAssignButtonRef}
                            type="button"
                            className={`${styles.cmChecklistMetaBtn} ${isChecklistAssignAccentActive ? styles.cmChecklistMetaBtnActive : ''}`}
                            onClick={() => setShowChecklistAssignMenu(v => !v)}
                            aria-expanded={showChecklistAssignMenu}
                            aria-haspopup="menu"
                            disabled={isChecklistMutating}
                          >
                            <Users size={ICON_SIZE} strokeWidth={ICON_STROKE} aria-hidden="true" /> {checklistAssigneeUserId ? 'Responsável definido' : 'Atribuir'}
                          </button>
                          <button
                            ref={checklistDueButtonRef}
                            type="button"
                            className={`${styles.cmChecklistMetaBtn} ${isChecklistDueAccentActive ? styles.cmChecklistMetaBtnActive : ''}`}
                            onClick={() => setShowChecklistDueMenu(v => !v)}
                            aria-expanded={showChecklistDueMenu}
                            aria-haspopup="dialog"
                            disabled={isChecklistMutating}
                          >
                            <Clock size={ICON_SIZE} strokeWidth={ICON_STROKE} aria-hidden="true" /> {checklistDueLabel}
                          </button>
                        </div>
                      </>
                    ) : !checklistReadOnly ? (
                      <button
                        type="button"
                        className={styles.cmChecklistAddItemBtn}
                        onClick={() => setChecklistComposerOpen(true)}
                        disabled={isChecklistMutating}
                      >
                        Adicionar um item
                      </button>
                    ) : null}

                  {checklistReadOnly && (
                    <p className={styles.cmChecklistNotice}>
                      Checklist exibido em modo somente leitura enquanto finalizamos a integração completa dessa área.
                    </p>
                  )}
                  </div>
                )}

              {submitError ? (
                <div className={styles.cmSaveRow}>
                  <p className={styles.cmSubmitError}>{submitError}</p>
                </div>
              ) : null}
              {!submitError && saveStatus ? (
                <div className={styles.cmSaveRow}>
                  <p className={styles.cmSubmitSuccess} role="status" aria-live="polite">{saveStatus}</p>
                </div>
              ) : null}
          </div>

          <div className={`${styles.cmSidebarShell} ${!isActivitySidebarOpen ? styles.cmSidebarShellCollapsed : ''}`}>
            <button
              type="button"
              className={styles.cmSidebarToggleBtn}
              title={isActivitySidebarOpen ? 'Recolher Activity' : 'Expandir Activity'}
              aria-label={isActivitySidebarOpen ? 'Recolher Activity' : 'Expandir Activity'}
              aria-expanded={isActivitySidebarOpen}
              onClick={() => {
                setIsActivitySidebarOpen((open) => {
                  const next = !open
                  if (typeof window !== 'undefined') {
                    try {
                      window.localStorage.setItem(activitySidebarStorageKey, String(next))
                    } catch {}
                  }
                  return next
                })
              }}
              disabled={isMutating}
            >
              {isActivitySidebarOpen ? (
                <ChevronsRight size={ICON_SIZE} strokeWidth={ICON_STROKE} aria-hidden="true" />
              ) : (
                <ChevronsLeft size={ICON_SIZE} strokeWidth={ICON_STROKE} aria-hidden="true" />
              )}
            </button>

            {isActivitySidebarOpen ? (
          <div className={styles.cmSidebar}>
            <div className={styles.cmSidebarHeader}>
              <p className={styles.cmSidebarTitle}>Activity</p>
              <div className={styles.cmSidebarHeaderActions}>
                <button type="button" className={styles.cmSidebarHeaderBtn} aria-label="Buscar atividade"><Search size={ICON_SIZE} strokeWidth={ICON_STROKE} aria-hidden="true" /></button>
                <button type="button" className={styles.cmSidebarHeaderBtn} aria-label="Filtrar atividade"><Funnel size={14} strokeWidth={ICON_STROKE} aria-hidden="true" /></button>
                <button type="button" className={styles.cmSidebarHeaderBtn} aria-label="Notificações">1</button>
              </div>
            </div>

            <div className={styles.cmSidebarContent}>
              <div ref={activityFeedRef} className={styles.cmActivityFeed}>
                <div className={styles.cmActivitySpacer} aria-hidden="true" />
                <div className={styles.cmActivityTimeline}>
                  {activityFeedItems.map((item) => {
                    if (item.type === 'history') {
                      return (
                        <p key={item.id} className={styles.cmHistoryItem}>
                          <strong>{item.actor}</strong> (você) {item.text}
                        </p>
                      )
                    }

                    const c = item.comment
                    const presenter = getCommentPresenter(c)
                    const isExpanded = expandedComments[c.id]
                    const isOverflowing = overflowingComments[c.id]
                    return (
                      <article key={c.id} className={styles.cmCommentCard}>
                        <header className={styles.cmCommentCardHeader}>
                          <AuthenticatedAvatar
                            className={styles.cmCommentAvatar}
                            imageClassName={styles.avatarImage}
                            style={{ background: presenter.color }}
                            avatarUrl={presenter.avatarUrl}
                            fallback={presenter.initials}
                            title={presenter.name}
                          />
                          <div className={styles.cmCommentCardMeta}>
                            <strong className={styles.cmCommentAuthor}>{presenter.name}</strong>
                            <span className={styles.cmCommentTime}>{c.time}</span>
                          </div>
                        </header>
                        <div className={styles.cmCommentCardBody}>
                          <p
                            ref={element => {
                              if (element) {
                                commentTextRefs.current[c.id] = element
                              } else {
                                delete commentTextRefs.current[c.id]
                              }
                            }}
                            className={`${styles.cmCommentCardText} ${!isExpanded ? styles.cmCommentCardTextClamped : ''}`}
                          >
                            {c.text}
                          </p>
                          {isOverflowing && (
                            <button
                              type="button"
                              className={styles.cmCommentCardToggle}
                              onMouseDown={e => e.stopPropagation()}
                              onClick={e => {
                                e.stopPropagation()
                                setExpandedComments(prev => ({ ...prev, [c.id]: !prev[c.id] }))
                              }}
                            >
                              {isExpanded ? 'Ver menos' : 'Ver mais'}
                            </button>
                          )}
                        </div>
                        <footer className={styles.cmCommentCardFooter}>
                          <div className={styles.cmCommentCardActions}>
                            <button type="button" className={styles.cmCommentCardActionBtn} aria-label="Curtir comentário">
                              <ThumbsUp size={ICON_SIZE} strokeWidth={ICON_STROKE} aria-hidden="true" />
                            </button>
                            <button type="button" className={styles.cmCommentCardActionBtn} aria-label="Adicionar reação">
                              <SmilePlus size={ICON_SIZE} strokeWidth={ICON_STROKE} aria-hidden="true" />
                            </button>
                          </div>
                          <button type="button" className={styles.cmCommentReplyBtn}>
                            Responder
                          </button>
                        </footer>
                      </article>
                    )
                  })}
                </div>
              </div>

              <div className={styles.cmCommentDock}>
                <div ref={commentComposerRef} className={styles.cmCommentComposer}>
                  <div
                    className={`${styles.cmCommentComposerBox} ${commentFocused ? styles.cmCommentComposerBoxActive : ''}`}
                  >
                    <textarea
                      ref={commentTextareaRef}
                      className={styles.cmCommentTextarea}
                      placeholder="Escreva um comentário..."
                      value={comment}
                      onChange={e => setComment(e.target.value)}
                      aria-label="Escrever comentário"
                      onFocus={() => setCommentFocused(true)}
                      onBlur={e => {
                        if (
                          !comment.trim() &&
                          !commentComposerRef.current?.contains(e.relatedTarget)
                        ) {
                          setCommentFocused(false)
                        }
                      }}
                      onKeyDown={e => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault()
                          void addComment()
                        }
                      }}
                      disabled={isMutating}
                    />

                    <div className={styles.cmCommentComposerFooter}>
                      <div className={styles.cmCommentComposerFooterLeft}>
                        <button
                          type="button"
                          className={styles.cmCommentAddBtn}
                          onMouseDown={e => e.preventDefault()}
                          aria-label="Adicionar bloco"
                        >
                          <Plus size={ICON_SIZE} strokeWidth={ICON_STROKE} aria-hidden="true" />
                        </button>

                        <span className={styles.cmComposerDivider} aria-hidden="true" />

                        <button type="button" className={styles.cmCommentTypeBtn}>
                          Comentário
                          <ChevronRight size={11} strokeWidth={ICON_STROKE} aria-hidden="true" />
                        </button>

                        <span className={styles.cmComposerDivider} aria-hidden="true" />

                        <button
                          ref={insertMenuButtonRef}
                          type="button"
                          className={styles.cmCommentToolIconBtn}
                          onMouseDown={e => e.preventDefault()}
                          aria-label="Aplicativos"
                          aria-expanded={showInsertMenu}
                          aria-haspopup="menu"
                          onClick={() => setShowInsertMenu(v => !v)}
                        >
                          <LayoutGrid size={ICON_SIZE} strokeWidth={ICON_STROKE} aria-hidden="true" />
                        </button>
                        <button type="button" className={styles.cmCommentToolIconBtn} onMouseDown={e => e.preventDefault()} aria-label="Anexar ao comentário">
                          <Paperclip size={ICON_SIZE} strokeWidth={ICON_STROKE} aria-hidden="true" />
                        </button>
                        <button type="button" className={styles.cmCommentToolIconBtn} onMouseDown={e => e.preventDefault()} aria-label="Mencionar">
                          <AtSign size={ICON_SIZE} strokeWidth={ICON_STROKE} aria-hidden="true" />
                        </button>
                      </div>

                      <div className={styles.cmCommentComposerFooterRight}>
                        <button type="button" className={styles.cmCommentToolIconBtn} onMouseDown={e => e.preventDefault()} aria-label="Mais opções">
                          <Ellipsis size={ICON_SIZE} strokeWidth={ICON_STROKE} aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          className={styles.cmCommentSendBtn}
                          onMouseDown={e => e.preventDefault()}
                          onClick={() => { void addComment() }}
                          disabled={!comment.trim() || isMutating}
                          aria-label="Enviar comentário"
                        >
                          <SendHorizontal size={ICON_SIZE} strokeWidth={ICON_STROKE} aria-hidden="true" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
            ) : null}
          </div>
        </div>

      </div>

      {showTextMenu && (
        <div
          ref={textMenuRef}
          className={styles.cmTextMenu}
          style={{ top: `${textMenuPosition.top}px`, left: `${textMenuPosition.left}px` }}
          onClick={e => e.stopPropagation()}
          role="menu"
        >
          {[
            { label: 'Texto normal', shortcut: 'Ctrl+Alt+0' },
            { label: 'Título 1', shortcut: 'Ctrl+Alt+1' },
            { label: 'Título 2', shortcut: 'Ctrl+Alt+2' },
            { label: 'Título 3', shortcut: 'Ctrl+Alt+3' },
            { label: 'Título 4', shortcut: 'Ctrl+Alt+4' },
            { label: 'Título 5', shortcut: 'Ctrl+Alt+5' },
            { label: 'Título 6', shortcut: 'Ctrl+Alt+6' },
          ].map(option => (
            <button
              key={option.label}
              type="button"
              className={styles.cmTextMenuItem}
              onMouseDown={e => e.preventDefault()}
              onClick={() => setShowTextMenu(false)}
            >
              <span>{option.label}</span>
              <span className={styles.cmTextMenuShortcut}>{option.shortcut}</span>
            </button>
          ))}
        </div>
      )}

      {showFilePicker && (
        <div
          ref={filePickerRef}
          className={styles.cmFilePicker}
          style={{ top: `${filePickerPosition.top}px`, left: `${filePickerPosition.left}px` }}
          role="dialog"
          aria-label="Anexar arquivo"
          onClick={e => e.stopPropagation()}
        >
          <div className={styles.cmFilePickerControls}>
            <div className={styles.cmFilePickerTopRow}>
              <div className={styles.cmFilePickerTabs} role="tablist" aria-label="Fonte do arquivo">
                {[
                  { id: 'plan', label: 'Plano', count: planFiles.length },
                  { id: 'library', label: 'Biblioteca', count: libraryFiles.length },
                ].map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    className={`${styles.cmFilePickerTab} ${filePickerFilter === option.id ? styles.cmFilePickerTabActive : ''}`}
                    onClick={() => {
                      setFilePickerFilter(option.id)
                      setShowFilePickerTypeMenu(false)
                    }}
                    role="tab"
                    aria-selected={filePickerFilter === option.id}
                  >
                    <span className={styles.cmFilePickerTabIcon}>
                      {option.id === 'plan' ? <Folder size={ICON_SIZE} strokeWidth={ICON_STROKE} aria-hidden="true" /> : <Library size={ICON_SIZE} strokeWidth={ICON_STROKE} aria-hidden="true" />}
                    </span>
                    <span className={styles.cmFilePickerTabLabel}>{option.label}</span>
                    <span className={styles.cmFilePickerTabCount}>{option.count}</span>
                  </button>
                ))}
              </div>
              <div className={styles.cmFilePickerToolbarRow}>
                <button
                  ref={filePickerTypeButtonRef}
                  type="button"
                  className={`${styles.cmFilePickerFilterBtn} ${showFilePickerTypeMenu ? styles.cmFilePickerFilterBtnActive : ''}`}
                  onClick={() => setShowFilePickerTypeMenu((current) => !current)}
                  aria-haspopup="menu"
                  aria-expanded={showFilePickerTypeMenu}
                >
                  <Funnel size={ICON_SIZE} strokeWidth={ICON_STROKE} aria-hidden="true" />
                  <span>{activeFileTypeLabel}</span>
                  <span className={styles.cmFilePickerFilterBtnChevron}><ChevronRight size={11} strokeWidth={ICON_STROKE} aria-hidden="true" /></span>
                </button>

                {showFilePickerTypeMenu && (
                  <div ref={filePickerTypeMenuRef} className={styles.cmFilePickerTypeMenu} role="menu">
                    {FILE_TYPE_OPTIONS.map((option) => (
                      <button
                        key={option.id}
                        type="button"
                        className={`${styles.cmFilePickerTypeMenuItem} ${filePickerTypeFilter === option.id ? styles.cmFilePickerTypeMenuItemActive : ''}`}
                        onClick={() => {
                          setFilePickerTypeFilter(option.id)
                          setShowFilePickerTypeMenu(false)
                        }}
                        role="menuitemradio"
                        aria-checked={filePickerTypeFilter === option.id}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className={styles.cmFilePickerSearchRow}>
              <label className={styles.cmFilePickerSearchField}>
                <span className={styles.cmFilePickerSearchIcon}><Search size={ICON_SIZE} strokeWidth={ICON_STROKE} aria-hidden="true" /></span>
                <input
                  type="search"
                  className={styles.cmFilePickerSearch}
                  value={fileSearch}
                  onChange={e => setFileSearch(e.target.value)}
                  placeholder="Buscar arquivo..."
                  aria-label="Buscar arquivo"
                />
              </label>
              <button type="button" className={styles.cmFilePickerViewBtn} aria-label="Lista">
                <List size={ICON_SIZE} strokeWidth={ICON_STROKE} aria-hidden="true" />
              </button>
            </div>
          </div>

          {fileActionError ? <p className={styles.cmFilePickerError}>{fileActionError}</p> : null}
          {filesError ? <p className={styles.cmFilePickerError}>{filesError}</p> : null}

          <div className={styles.cmFilePickerList}>
            {isFilePickerLoading ? (
              Array.from({ length: 5 }, (_, index) => (
                <div key={`picker-loading-${index}`} className={styles.cmFilePickerSkeleton} />
              ))
            ) : pickerFiles.length ? (
              pickerFiles.map((file) => {
                const isAttached = attachedFileIds.has(file.id)
                const isBusy = attachingFileId === file.id
                const fileCategory = getFileCategory(file)

                return (
                  <div
                    key={file.id}
                    className={styles.cmFilePickerItem}
                  >
                    <span className={styles.cmFilePickerIcon}><FileText size={ICON_SIZE} strokeWidth={ICON_STROKE} aria-hidden="true" /></span>
                    <span className={styles.cmFilePickerBody}>
                      <span className={styles.cmFilePickerName}>{file.name}</span>
                      <span className={styles.cmFilePickerMeta}>{formatFileSize(file.size)} · {file.modified}</span>
                      <span className={`${styles.cmFilePickerBadge} ${styles[`cmFilePickerBadge${fileCategory.id.charAt(0).toUpperCase()}${fileCategory.id.slice(1)}`] ?? ''}`}>
                        {fileCategory.label}
                      </span>
                    </span>
                    <span className={styles.cmFilePickerItemActions}>
                      {onDownloadFile ? (
                        <button
                          type="button"
                          className={styles.cmFilePickerMoreBtn}
                          onClick={() => {
                            Promise.resolve(onDownloadFile(file)).catch((error) => {
                              setFileActionError(error?.message ?? 'Não foi possível baixar este arquivo.')
                            })
                          }}
                          aria-label={`Baixar ${file.name}`}
                        >
                          <Download size={14} strokeWidth={ICON_STROKE} aria-hidden="true" />
                        </button>
                      ) : null}
                      <button
                        type="button"
                        className={`${styles.cmFilePickerAttachBtn} ${isAttached ? styles.cmFilePickerAttachBtnDisabled : ''}`}
                        onClick={() => handleAttachFile(file)}
                        disabled={isAttached || isBusy}
                      >
                        <Paperclip size={ICON_SIZE} strokeWidth={ICON_STROKE} aria-hidden="true" />
                        {isAttached ? 'Anexado' : isBusy ? 'Anexando...' : 'Anexar'}
                      </button>
                    </span>
                  </div>
                )
              })
            ) : (
              <div className={styles.cmFilePickerEmpty}>
                <FileText size={ICON_SIZE} strokeWidth={ICON_STROKE} aria-hidden="true" />
                <strong>Nada para mostrar</strong>
                <p>{filePickerFilter === 'plan' ? 'Nenhum arquivo compartilhado com este plano.' : 'Nenhum arquivo disponível na sua biblioteca.'}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {showMembersMenu && (
        <div
          ref={membersMenuRef}
          className={styles.cmMembersMenu}
          style={{ top: `${membersMenuPosition.top}px`, left: `${membersMenuPosition.left}px` }}
          onClick={e => e.stopPropagation()}
          role="menu"
        >
          <div className={styles.cmMemberList}>
            {members.map(m => (
              <button
                key={m.id}
                type="button"
                className={`${styles.cmMemberOpt} ${memberIds.includes(m.id) ? styles.cmMemberOptActive : ''}`}
                onClick={() => {
                  void toggleMember(m.id)
                }}
                aria-pressed={memberIds.includes(m.id)}
                disabled={isMutating}
              >
                <AuthenticatedAvatar
                  className={styles.cmMemberAvatar}
                  imageClassName={styles.avatarImage}
                  style={{ background: m.color }}
                  avatarUrl={m.avatarUrl}
                  fallback={m.initials}
                  title={getMemberName(m)}
                />
                <span className={styles.cmMemberName}>{getMemberName(m)}</span>
                {memberIds.includes(m.id) && <span className={styles.cmMemberCheck}><Check size={ICON_SIZE_SM} strokeWidth={ICON_STROKE} aria-hidden="true" /></span>}
              </button>
            ))}
            <button
              type="button"
              className={styles.cmMembersMenuCreate}
              onClick={() => setShowMembersMenu(false)}
              disabled={isMutating}
            >
              <span className={styles.cmMembersMenuCreateIcon}><Plus size={ICON_SIZE} strokeWidth={ICON_STROKE} aria-hidden="true" /></span>
              Novo membro
            </button>
          </div>
        </div>
      )}

      {showChecklistMenu && (
        <div
          ref={checklistMenuRef}
          className={styles.cmChecklistMenu}
          style={{ top: `${checklistMenuPosition.top}px`, left: `${checklistMenuPosition.left}px` }}
          onClick={e => e.stopPropagation()}
          role="dialog"
          aria-modal="false"
        >
          <div className={styles.cmChecklistMenuHeader}>
            <h3 className={styles.cmChecklistMenuTitle}>Adicionar checklist</h3>
            <button type="button" className={styles.cmChecklistMenuClose} onClick={() => setShowChecklistMenu(false)}>
              <X size={ICON_SIZE} strokeWidth={ICON_STROKE} aria-hidden="true" />
            </button>
          </div>

          <div className={styles.cmChecklistMenuBody}>
            <label className={styles.cmChecklistMenuLabel}>Título</label>
            <input
              type="text"
              className={styles.cmChecklistMenuInput}
              value={checklistTitle}
              onChange={e => setChecklistTitle(e.target.value)}
              aria-label="Título do checklist"
            />
            <button
              type="button"
              className={styles.cmChecklistMenuAdd}
              onClick={handleChecklistCreate}
              disabled={isChecklistMutating}
            >
              {isChecklistMutating ? 'Adicionando...' : 'Adicionar'}
            </button>
          </div>
        </div>
      )}

      {showChecklistAssignMenu && (
        <div
          ref={checklistAssignMenuRef}
          className={styles.cmChecklistCompactMenu}
          style={{ top: `${checklistAssignMenuPosition.top}px`, left: `${checklistAssignMenuPosition.left}px` }}
          onClick={e => e.stopPropagation()}
          role="menu"
        >
          {members.map(member => (
            <button
              key={member.id}
              type="button"
              className={`${styles.cmChecklistCompactItem} ${checklistAssigneeUserId === member.id ? styles.cmChecklistCompactItemActive : ''}`}
              onClick={() => {
                setChecklistAssigneeUserId((current) => (current === member.id ? null : member.id))
                setShowChecklistAssignMenu(false)
              }}
            >
              <AuthenticatedAvatar
                className={styles.cmMemberAvatar}
                imageClassName={styles.avatarImage}
                style={{ background: member.color }}
                avatarUrl={member.avatarUrl}
                fallback={member.initials}
                title={getMemberName(member)}
              />
              <span>{getMemberName(member)}</span>
              {checklistAssigneeUserId === member.id && (
                <span className={styles.cmLabelCheck}>
                  <Check size={ICON_SIZE_SM} strokeWidth={ICON_STROKE} aria-hidden="true" />
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {showChecklistDueMenu && (
        <div
          ref={checklistDueMenuRef}
          className={styles.cmChecklistDateMenu}
          style={{ top: `${checklistDueMenuPosition.top}px`, left: `${checklistDueMenuPosition.left}px` }}
          onClick={e => e.stopPropagation()}
          role="dialog"
          aria-modal="false"
        >
          <div className={styles.cmChecklistDateMenuHeader}>
            <h3 className={styles.cmChecklistDateMenuTitle}>Datas</h3>
            <button type="button" className={styles.cmChecklistDateMenuClose} onClick={() => setShowChecklistDueMenu(false)}>
              <X size={ICON_SIZE} strokeWidth={ICON_STROKE} aria-hidden="true" />
            </button>
          </div>

          <div className={styles.cmChecklistDateMenuMonthBar}>
            <div className={styles.cmChecklistDateMenuMonthNav}>
              <button type="button" className={styles.cmChecklistDateMenuNavBtn} onClick={() => setChecklistDateMenuMonth((current) => new Date(current.getFullYear(), current.getMonth() - 1, 1))} aria-label="Mês anterior">
                <ChevronLeft size={ICON_SIZE} strokeWidth={ICON_STROKE} aria-hidden="true" />
              </button>
            </div>
            <span className={styles.cmChecklistDateMenuMonthLabel}>{formatCalendarMonthLabel(checklistDateMenuMonth)}</span>
            <div className={styles.cmChecklistDateMenuMonthNav}>
              <button type="button" className={styles.cmChecklistDateMenuNavBtn} onClick={() => setChecklistDateMenuMonth((current) => new Date(current.getFullYear(), current.getMonth() + 1, 1))} aria-label="Próximo mês">
                <ChevronRight size={ICON_SIZE} strokeWidth={ICON_STROKE} aria-hidden="true" />
              </button>
            </div>
          </div>

          <div className={styles.cmChecklistDateMenuWeekdays}>
            {['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab'].map(day => (
              <span key={day}>{day}</span>
            ))}
          </div>

          <div className={styles.cmChecklistDateMenuGrid}>
            {checklistDateMenuDays.map((day, index) => (
              <button
                key={`${day.label}-${index}`}
                type="button"
                className={`${styles.cmChecklistDateMenuDay} ${day.muted ? styles.cmChecklistDateMenuDayMuted : ''} ${checklistSelectedDay === day.label && !day.muted ? styles.cmChecklistDateMenuDaySelected : ''}`}
                onClick={() => {
                  if (day.muted) return
                  setChecklistSelectedDay(day.label)
                  setChecklistDueEnabled(true)
                  setChecklistDueValue(formatCalendarInputValue(day.label, checklistDateMenuMonth))
                }}
              >
                <span className={day.underline ? styles.cmChecklistDateMenuDayUnderline : ''}>{day.label}</span>
              </button>
            ))}
          </div>

          <div className={styles.cmChecklistDateMenuFields}>
            <div className={styles.cmChecklistDateMenuFieldGroup}>
              <label className={styles.cmChecklistDateMenuFieldLabel}>Data de início</label>
              <div className={styles.cmChecklistDateMenuInputRow}>
                <button
                  type="button"
                  className={`${styles.cmDateCheckbox} ${checklistStartEnabled ? styles.cmDateCheckboxActive : ''}`}
                  onClick={() => setChecklistStartEnabled(v => !v)}
                >
                  {checklistStartEnabled && <Check size={ICON_SIZE_SM} strokeWidth={ICON_STROKE} aria-hidden="true" />}
                </button>
                <input
                  type="text"
                  className={styles.cmChecklistDateMenuInput}
                  placeholder="D/M/AAAA"
                  value={checklistStartDateValue}
                  onChange={e => setChecklistStartDateValue(e.target.value)}
                  disabled={!checklistStartEnabled}
                  aria-label="Data inicial do checklist"
                />
              </div>
            </div>

            <div className={styles.cmChecklistDateMenuFieldGroup}>
              <label className={styles.cmChecklistDateMenuFieldLabel}>Data de entrega</label>
              <div className={styles.cmChecklistDateMenuInputRow}>
                <button
                  type="button"
                  className={`${styles.cmDateCheckbox} ${checklistDueEnabled ? styles.cmDateCheckboxActive : ''}`}
                  onClick={() => {
                    setChecklistDueEnabled(v => !v)
                    if (checklistDueEnabled) {
                      setChecklistDueValue('')
                    } else if (!checklistDueValue) {
                      setChecklistDueValue(formatCalendarInputValue(checklistSelectedDay, checklistDateMenuMonth))
                    }
                  }}
                >
                  {checklistDueEnabled && <Check size={ICON_SIZE_SM} strokeWidth={ICON_STROKE} aria-hidden="true" />}
                </button>
                <input
                  type="text"
                  className={styles.cmChecklistDateMenuInput}
                  value={checklistDueValue}
                  onChange={e => setChecklistDueValue(e.target.value)}
                  disabled={!checklistDueEnabled}
                  aria-label="Data de entrega do checklist"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {showDateMenu && (
        <div
          ref={dateMenuRef}
          className={styles.cmDateMenu}
          style={{ top: `${dateMenuPosition.top}px`, left: `${dateMenuPosition.left}px` }}
          onClick={(event) => event.stopPropagation()}
          role="dialog"
          aria-label="Calendário de datas"
        >
          <DateRangeCalendar
            value={selectedCalendarRange ?? undefined}
            onChange={handleCalendarRangeChange}
          />
        </div>
      )}

      {showLabelMenu && (
        <div
          ref={labelMenuRef}
          className={styles.cmLabelMenu}
          style={{ top: `${labelMenuPosition.top}px`, left: `${labelMenuPosition.left}px` }}
          onClick={e => e.stopPropagation()}
          role="menu"
        >
          <div className={styles.cmLabelMenuList}>
            {labels.map(l => (
              <button
                key={l.id}
                type="button"
                className={`${styles.cmLabelOpt} ${labelId === l.id ? styles.cmLabelOptActive : ''}`}
                style={labelId === l.id ? { background: l.color + '20', borderColor: l.color, color: l.color } : {}}
                onClick={() => {
                  void handleLabelSelect(labelId === l.id ? null : l.id)
                }}
                aria-pressed={labelId === l.id}
                disabled={isMutating}
              >
                <span className={styles.cmLabelDot} style={{ background: l.color }} />
                {l.text}
                {labelId === l.id && <span className={styles.cmLabelCheck}><Check size={ICON_SIZE_SM} strokeWidth={ICON_STROKE} aria-hidden="true" /></span>}
              </button>
            ))}
            <button
              type="button"
              className={styles.cmLabelMenuCreate}
              onClick={() => setShowLabelMenu(false)}
              disabled={isMutating}
            >
              <span className={styles.cmLabelMenuCreateIcon}><Plus size={ICON_SIZE} strokeWidth={ICON_STROKE} aria-hidden="true" /></span>
              Nova Etiqueta
            </button>
          </div>
        </div>
      )}

      {showInsertMenu && (
        <div
          ref={insertMenuRef}
          className={styles.cmInsertMenu}
          style={{ top: `${insertMenuPosition.top}px`, left: `${insertMenuPosition.left}px` }}
          onClick={e => e.stopPropagation()}
          role="menu"
        >
          {[
            {
              label: 'Link',
              description: 'Insira um link',
              icon: <Link size={ICON_SIZE} strokeWidth={ICON_STROKE} aria-hidden="true" />,
            },
            {
              label: 'Arquivo',
              description: 'Anexe um arquivo',
              icon: <FileText size={ICON_SIZE} strokeWidth={ICON_STROKE} aria-hidden="true" />,
              action: openFilePicker,
            },
            {
              label: 'Imagem',
              description: 'Adicione uma imagem',
              icon: <Image size={ICON_SIZE} strokeWidth={ICON_STROKE} aria-hidden="true" />,
            },
            {
              label: 'Código',
              description: 'Exibir código com destaque',
              icon: <Code size={ICON_SIZE} strokeWidth={ICON_STROKE} aria-hidden="true" />,
            },
          ].map(option => (
            <button
              key={option.label}
              type="button"
              className={styles.cmInsertMenuItem}
              onMouseDown={e => e.preventDefault()}
              onClick={() => {
                if (option.action) {
                  option.action()
                  return
                }
                setShowInsertMenu(false)
              }}
            >
              <span className={styles.cmInsertMenuIcon}>{option.icon}</span>
              <span className={styles.cmInsertMenuContent}>
                <span className={styles.cmInsertMenuLabel}>{option.label}</span>
                <span className={styles.cmInsertMenuDescription}>{option.description}</span>
              </span>
            </button>
          ))}
        </div>
      )}

      {showListMenu && (
        <div
          ref={listMenuRef}
          className={styles.cmListMenu}
          style={{ top: `${listMenuPosition.top}px`, left: `${listMenuPosition.left}px` }}
          onClick={e => e.stopPropagation()}
          role="menu"
        >
          {[
            { label: 'Lista de marcadores', shortcut: 'Ctrl+Shift+8' },
            { label: 'Lista numerada', shortcut: 'Ctrl+Shift+7' },
          ].map(option => (
            <button
              key={option.label}
              type="button"
              className={styles.cmListMenuItem}
              onMouseDown={e => e.preventDefault()}
              onClick={() => setShowListMenu(false)}
            >
              <span>{option.label}</span>
              <span className={styles.cmListMenuShortcut}>{option.shortcut}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}


