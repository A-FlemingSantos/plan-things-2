import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import {
  Calendar,
  Check,
  MoveRight,
  ChevronRight,
  Code,
  FileText,
  Flag,
  Goal,
  History,
  Hourglass,
  Image,
  Link,
  List,
  Maximize2,
  PencilLine,
  Plus,
  Sparkles,
  Star,
  Tag,
  TimerReset,
  Trash2,
  Users,
  X,
} from 'lucide-react'
import AuthenticatedAvatar from '../../../../shared/components/AuthenticatedAvatar/AuthenticatedAvatar.jsx'
import {
  buildBrazilDateRange,
  resolveCardScheduleFromRange,
} from '../../../../shared/components/Calendar/calendarDateUtils.js'
import { buildInlineAssignmentText } from './utils/activityUtils.js'
import { createCardModalUid } from './utils/cardModalCommon.js'
import { buildInitialCardSchedule, formatDueDateLabelFromValue } from './utils/cardModalDateUtils.js'
import { snapCardScheduleTimeToSlot } from './utils/cardModalScheduleUtils.js'
import { CardModalAttachmentAction, CardModalInlineAttachments } from './components/CardModalAttachmentControls.jsx'
import CardModalActivitySidebar from './components/CardModalActivitySidebar.jsx'
import CardModalChecklist from './components/CardModalChecklist.jsx'
import {
  CardModalChecklistAssignMenu,
  CardModalChecklistCreateMenu,
  CardModalChecklistDueMenu,
} from './components/CardModalChecklistMenus.jsx'
import CardModalDateSchedulePicker from './components/CardModalDateSchedulePicker.jsx'
import CardModalFilePicker from './components/CardModalFilePicker.jsx'
import PropertyDatesSummary from './components/PropertyDatesSummary.jsx'
import useCardModalActivity from './hooks/useCardModalActivity.js'
import useCardModalAttachments from './hooks/useCardModalAttachments.js'
import useCardModalChecklist from './hooks/useCardModalChecklist.js'

const ICON_SIZE = 15
const ICON_SIZE_SM = 12
const ICON_STROKE = 1.75

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
  const [title,    setTitle]    = useState(card.title)
  const [savedTitle, setSavedTitle] = useState(card.title)
  const [desc,     setDesc]     = useState(card.description ?? '')
  const [savedDesc, setSavedDesc] = useState(card.description ?? '')
  const [labelId,  setLabelId]  = useState(card.labelId)
  const [memberIds,setMIds]     = useState(card.memberIds)
  const [dueDate,  setDueDate]  = useState(card.dueDate)
  const [exiting,  setExiting]  = useState(false)
  const [showMembersMenu, setShowMembersMenu] = useState(false)
  const [showLabelMenu, setShowLabelMenu] = useState(false)
  const [showDateMenu, setShowDateMenu] = useState(false)
  const [showTextMenu, setShowTextMenu] = useState(false)
  const [showListMenu, setShowListMenu] = useState(false)
  const [showInsertMenu, setShowInsertMenu] = useState(false)
  const [membersMenuPosition, setMembersMenuPosition] = useState({ top: 0, left: 0 })
  const [labelMenuPosition, setLabelMenuPosition] = useState({ top: 0, left: 0 })
  const [dateMenuPosition, setDateMenuPosition] = useState({ top: 0, left: 0 })
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
  const [draftCalendarRange, setDraftCalendarRange] = useState(() => (
    buildBrazilDateRange(initialSchedule.startDateValue, initialSchedule.dueDateValue)
  ))
  const [draftDueTimeValue, setDraftDueTimeValue] = useState(() => (
    snapCardScheduleTimeToSlot(initialSchedule.dueTimeValue)
  ))
  const [isConfirmingSchedule, setIsConfirmingSchedule] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isMovingToNextColumn, setIsMovingToNextColumn] = useState(false)
  const [isTogglingCompleted, setIsTogglingCompleted] = useState(false)
  const [submitError, setSubmitError] = useState(null)
  const [saveStatus, setSaveStatus] = useState('')
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const titleTextareaRef = useRef(null)
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
  const listMenuRef = useRef(null)
  const listMenuButtonRef = useRef(null)
  const insertMenuRef = useRef(null)
  const insertMenuButtonRef = useRef(null)
  const saveStatusTimeoutRef = useRef(null)
  const persistCardChangesRef = useRef(async () => false)
  const dialogTitleId = `card-modal-title-${card.id}`

  const getMemberName = (member) => {
    if (!member) return 'Membro'
    return member.name ?? member.email ?? member.initials ?? 'Membro'
  }

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

  const isInteractionBlocked = isSaving || isDeleting

  const checklist = useCardModalChecklist({
    card,
    isBackendDriven,
    members,
    onCreateChecklist,
    onDeleteChecklist,
    onCreateChecklistItem,
    onUpdateChecklistItem,
    timeZone,
    dateFormat,
    setSubmitError,
  })

  const activity = useCardModalActivity({
    card,
    currentUser,
    members,
    getMemberName,
    onAddComment,
    persistCardChangesRef,
    updateSaveStatus,
    setSubmitError,
    isInteractionBlocked,
  })

  const {
    attachments,
    setAttachments,
    openFilePicker,
    ...attachmentUi
  } = useCardModalAttachments({
    card,
    planFiles,
    libraryFiles,
    filesLoading,
    filesError,
    onLoadFiles,
    onAttachFile,
    onUploadLocalFile,
    onRemoveAttachment,
    onCloseInsertMenu: () => setShowInsertMenu(false),
    onSubmitError: setSubmitError,
  })

  const {
    activeChecklist,
    checklistReadOnly,
    showChecklistMenu,
    setShowChecklistMenu,
    isChecklistMutating,
    checklistMenuButtonRef,
    ...checklistBlockUi
  } = checklist

  const {
    comments,
    setComments,
    createdAtLabel,
    isSendingComment,
    isActivitySidebarOpen,
    ...activitySidebarUi
  } = activity

  const isMutating = isInteractionBlocked || isSendingComment

  const label = labels.find(l => l.id === labelId)
  const currentUserName = currentUser?.fullName ?? currentUser?.email ?? 'Você'

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

  persistCardChangesRef.current = persistCardChanges

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

    activity.appendActivityEvent({
      id: createCardModalUid(),
      type: 'history',
      sortAt: Date.now(),
      actor: currentUserName,
      text: buildInlineAssignmentText(nextMembersSummary),
    })
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
  const selectedMembers = memberIds.map(id => members.find(m => m.id === id)).filter(Boolean)
  const selectedMembersSummary = selectedMembers.map(getMemberName).join(', ')
  const selectedLabelSummary = label?.text ?? ''
  const syncDraftScheduleFromCommitted = () => {
    setDraftCalendarRange(buildBrazilDateRange(startDateValue, dueDateValue))
    setDraftDueTimeValue(snapCardScheduleTimeToSlot(dueTimeValue))
  }
  const saveDateRange = async ({
    resolvedSchedule,
    previousDateState,
  }) => {
    if (isMutating || !resolvedSchedule) return false

    const {
      startEnabled: nextStartEnabled,
      startDateValue: nextStartDateValue,
      dueEnabled: nextDueEnabled,
      dueDateValue: nextDueDateValue,
      selectedCalendarDay: nextSelectedCalendarDay,
      dueTimeValue: nextDueTimeValue = previousDateState.dueTimeValue,
    } = resolvedSchedule

    const shouldPreserveDisplayLabel =
      previousDateState.dueEnabled &&
      previousDateState.preserveDisplayLabel &&
      nextDueDateValue === previousDateState.dueDateValue &&
      nextSelectedCalendarDay === previousDateState.selectedCalendarDay &&
      nextDueTimeValue === previousDateState.dueTimeValue

    const nextDueDate = formatDueDateLabelFromValue(nextDueDateValue, nextSelectedCalendarDay)
    const nextSchedule = {
      selectedCalendarDay: nextSelectedCalendarDay,
      startEnabled: nextStartEnabled,
      startDateValue: nextStartDateValue,
      dueEnabled: nextDueEnabled,
      dueDateValue: nextDueDateValue,
      dueTimeValue: nextDueTimeValue,
      displayLabel: nextDueDate,
      preserveDisplayLabel: shouldPreserveDisplayLabel,
    }

    setStartEnabled(nextStartEnabled)
    setStartDateValue(nextStartDateValue)
    setDueEnabled(nextDueEnabled)
    setDueDateValue(nextDueDateValue)
    setDueTimeValue(nextDueTimeValue)
    setSelectedCalendarDay(nextSelectedCalendarDay)
    setDueDate(nextDueDate)
    setDisplayLabel(nextDueDate)
    setPreserveDisplayLabel(shouldPreserveDisplayLabel)

    const saved = await persistCardChanges(
      {
        dueDate: nextDueDate,
        schedule: nextSchedule,
      },
      {
        errorMessage: 'Não foi possível salvar a data do cartão.',
        successMessage: 'Data salva.',
      },
    )

    if (!saved) {
      setSelectedCalendarDay(previousDateState.selectedCalendarDay)
      setStartEnabled(previousDateState.startEnabled)
      setStartDateValue(previousDateState.startDateValue)
      setDueEnabled(previousDateState.dueEnabled)
      setDueDateValue(previousDateState.dueDateValue)
      setDueTimeValue(previousDateState.dueTimeValue)
      setDueDate(previousDateState.dueDate)
      setDisplayLabel(previousDateState.displayLabel)
      setPreserveDisplayLabel(previousDateState.preserveDisplayLabel)
    }

    return saved
  }
  const handleDraftCalendarRangeChange = (range) => {
    setDraftCalendarRange(range ?? null)
  }
  const handleConfirmSchedule = async () => {
    if (isMutating || isConfirmingSchedule) return

    const resolvedSchedule = resolveCardScheduleFromRange(draftCalendarRange)
    if (!resolvedSchedule) return

    const previousDateState = {
      dueDate,
      displayLabel,
      preserveDisplayLabel,
      dueEnabled,
      dueDateValue,
      dueTimeValue,
      startEnabled,
      startDateValue,
      selectedCalendarDay,
    }

    setIsConfirmingSchedule(true)

    try {
      const saved = await saveDateRange({
        resolvedSchedule: {
          ...resolvedSchedule,
          dueTimeValue: snapCardScheduleTimeToSlot(draftDueTimeValue),
        },
        previousDateState,
      })

      if (saved) {
        setShowDateMenu(false)
      }
    } finally {
      setIsConfirmingSchedule(false)
    }
  }
  const openDateMenu = () => {
    syncDraftScheduleFromCommitted()
    setShowDateMenu(true)
  }
  const toggleDateMenu = () => {
    if (showDateMenu) {
      setShowDateMenu(false)
      return
    }

    openDateMenu()
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

  useEffect(() => {
    const nextDescription = card.description ?? ''
    setDesc(nextDescription)
    setSavedDesc(nextDescription)
  }, [card.id])

  useEffect(() => () => {
    if (saveStatusTimeoutRef.current) {
      clearTimeout(saveStatusTimeoutRef.current)
    }
  }, [])

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
                    onClick={toggleDateMenu}
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
                      onClick={toggleDateMenu}
                      aria-expanded={showDateMenu}
                      aria-haspopup="dialog"
                      disabled={isMutating}
                    >
                      <PropertyDatesSummary
                        startEnabled={startEnabled}
                        startDateValue={startDateValue}
                        dueEnabled={dueEnabled}
                        dueDateValue={dueDateValue}
                        styles={styles}
                        iconSize={ICON_SIZE}
                        iconStroke={ICON_STROKE}
                      />
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
              <CardModalAttachmentAction
                styles={styles}
                iconSize={ICON_SIZE}
                iconStroke={ICON_STROKE}
                openFilePicker={openFilePicker}
                {...attachmentUi}
              />
            </div>

            <CardModalInlineAttachments
              styles={styles}
              iconSize={ICON_SIZE}
              iconStroke={ICON_STROKE}
              attachments={attachments}
              onDownloadFile={onDownloadFile}
              {...attachmentUi}
            />

            <CardModalChecklist
              styles={styles}
              iconSize={ICON_SIZE}
              iconSizeSm={ICON_SIZE_SM}
              iconStroke={ICON_STROKE}
              isBackendDriven={isBackendDriven}
              activeChecklist={activeChecklist}
              checklistReadOnly={checklistReadOnly}
              {...checklistBlockUi}
            />

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

          <CardModalActivitySidebar
            styles={styles}
            iconSize={ICON_SIZE}
            iconStroke={ICON_STROKE}
            isMutating={isMutating}
            isActivitySidebarOpen={isActivitySidebarOpen}
            insertMenuButtonRef={insertMenuButtonRef}
            showInsertMenu={showInsertMenu}
            setShowInsertMenu={setShowInsertMenu}
            {...activitySidebarUi}
          />
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

      <CardModalFilePicker
        styles={styles}
        iconSize={ICON_SIZE}
        iconStroke={ICON_STROKE}
        onDownloadFile={onDownloadFile}
        {...attachmentUi}
      />

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

      <CardModalChecklistCreateMenu
        styles={styles}
        iconSize={ICON_SIZE}
        iconStroke={ICON_STROKE}
        showChecklistMenu={showChecklistMenu}
        checklistMenuRef={checklistBlockUi.checklistMenuRef}
        checklistMenuPosition={checklistBlockUi.checklistMenuPosition}
        checklistTitle={checklistBlockUi.checklistTitle}
        setChecklistTitle={checklistBlockUi.setChecklistTitle}
        handleChecklistCreate={checklistBlockUi.handleChecklistCreate}
        isChecklistMutating={isChecklistMutating}
        setShowChecklistMenu={setShowChecklistMenu}
      />

      <CardModalChecklistAssignMenu
        styles={styles}
        iconSize={ICON_SIZE}
        iconSizeSm={ICON_SIZE_SM}
        iconStroke={ICON_STROKE}
        showChecklistAssignMenu={checklistBlockUi.showChecklistAssignMenu}
        checklistAssignMenuRef={checklistBlockUi.checklistAssignMenuRef}
        checklistAssignMenuPosition={checklistBlockUi.checklistAssignMenuPosition}
        members={members}
        getMemberName={getMemberName}
        checklistAssigneeUserId={checklistBlockUi.checklistAssigneeUserId}
        setChecklistAssigneeUserId={checklistBlockUi.setChecklistAssigneeUserId}
        setShowChecklistAssignMenu={checklistBlockUi.setShowChecklistAssignMenu}
      />

      <CardModalChecklistDueMenu
        styles={styles}
        iconSize={ICON_SIZE}
        iconSizeSm={ICON_SIZE_SM}
        iconStroke={ICON_STROKE}
        showChecklistDueMenu={checklistBlockUi.showChecklistDueMenu}
        checklistDueMenuRef={checklistBlockUi.checklistDueMenuRef}
        checklistDueMenuPosition={checklistBlockUi.checklistDueMenuPosition}
        checklistDateMenuMonth={checklistBlockUi.checklistDateMenuMonth}
        setChecklistDateMenuMonth={checklistBlockUi.setChecklistDateMenuMonth}
        checklistDateMenuDays={checklistBlockUi.checklistDateMenuDays}
        checklistSelectedDay={checklistBlockUi.checklistSelectedDay}
        setChecklistSelectedDay={checklistBlockUi.setChecklistSelectedDay}
        checklistStartEnabled={checklistBlockUi.checklistStartEnabled}
        setChecklistStartEnabled={checklistBlockUi.setChecklistStartEnabled}
        checklistStartDateValue={checklistBlockUi.checklistStartDateValue}
        setChecklistStartDateValue={checklistBlockUi.setChecklistStartDateValue}
        checklistDueEnabled={checklistBlockUi.checklistDueEnabled}
        setChecklistDueEnabled={checklistBlockUi.setChecklistDueEnabled}
        checklistDueValue={checklistBlockUi.checklistDueValue}
        setChecklistDueValue={checklistBlockUi.setChecklistDueValue}
        setShowChecklistDueMenu={checklistBlockUi.setShowChecklistDueMenu}
      />

      {showDateMenu && (
        <div
          ref={dateMenuRef}
          className={styles.cmDateMenu}
          style={{ top: `${dateMenuPosition.top}px`, left: `${dateMenuPosition.left}px` }}
          onClick={(event) => event.stopPropagation()}
          role="dialog"
          aria-label="Agendar data e horário"
        >
          <CardModalDateSchedulePicker
            styles={styles}
            calendarRange={draftCalendarRange}
            dueTimeValue={draftDueTimeValue}
            onCalendarRangeChange={handleDraftCalendarRangeChange}
            onTimeChange={setDraftDueTimeValue}
            onConfirm={() => {
              void handleConfirmSchedule()
            }}
            confirmDisabled={isMutating}
            isConfirming={isConfirmingSchedule}
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


