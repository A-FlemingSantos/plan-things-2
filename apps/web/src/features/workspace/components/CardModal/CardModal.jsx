import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { formatFileSize } from '../../../files/data/libraryRepository.js'

const uid = () => Math.random().toString(36).slice(2, 9)
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

const MONTH_LABELS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']

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

function formatDueDateLabelFromValue(dateValue, fallbackDay) {
  const match = dateValue.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/)

  if (!match) {
    return fallbackDay ? `${fallbackDay} abr` : ''
  }

  const [, dayValue, monthValue] = match
  const day = Number(dayValue)
  const monthIndex = Number(monthValue) - 1
  const monthLabel = MONTH_LABELS[monthIndex] ?? 'abr'

  return `${day} ${monthLabel}`
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

function buildInitialChecklist(card) {
  const [firstChecklist] = Array.isArray(card.checklists) ? card.checklists : []

  if (!firstChecklist) {
    return null
  }

  return {
    id: firstChecklist.id,
    title: firstChecklist.title ?? 'Checklist',
    items: Array.isArray(firstChecklist.items)
      ? firstChecklist.items.map((item) => ({
          id: item.id,
          text: item.title ?? item.text ?? 'Item',
          checked: Boolean(item.completed ?? item.checked),
        }))
      : [],
  }
}

function ComputerIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <rect x="2" y="2.5" width="10" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
      <path d="M5 11.5h4M4 9.5h6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  )
}

export default function CardModal({
  card,
  colTitle,
  onClose,
  onUpdate,
  onDelete,
  labels,
  members,
  currentUser,
  calendarDays,
  icons,
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
}) {
  const initialSchedule = buildInitialCardSchedule(card)
  const [title,    setTitle]    = useState(card.title)
  const [desc,     setDesc]     = useState(card.description)
  const [labelId,  setLabelId]  = useState(card.labelId)
  const [memberIds,setMIds]     = useState(card.memberIds)
  const [dueDate,  setDueDate]  = useState(card.dueDate)
  const [comment,  setComment]  = useState('')
  const [comments, setComments] = useState(card.comments)
  const [attachments, setAttachments] = useState(Array.isArray(card.attachments) ? card.attachments : [])
  const [exiting,  setExiting]  = useState(false)
  const [showDetails, setShowDetails] = useState(false)
  const [commentFocused, setCommentFocused] = useState(false)
  const [showMembersMenu, setShowMembersMenu] = useState(false)
  const [showLabelMenu, setShowLabelMenu] = useState(false)
  const [showDateMenu, setShowDateMenu] = useState(false)
  const [showChecklistMenu, setShowChecklistMenu] = useState(false)
  const [showTextMenu, setShowTextMenu] = useState(false)
  const [showListMenu, setShowListMenu] = useState(false)
  const [showInsertMenu, setShowInsertMenu] = useState(false)
  const [showFilePicker, setShowFilePicker] = useState(false)
  const [showAttachmentAddMenu, setShowAttachmentAddMenu] = useState(false)
  const [filePickerFilter, setFilePickerFilter] = useState('plan')
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
  const [dateMenuMonth, setDateMenuMonth] = useState(() => buildCalendarBaseDate(initialSchedule.dueDateValue))
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
  const [checklistSelectedDay, setChecklistSelectedDay] = useState(7)
  const [checklistDateMenuMonth, setChecklistDateMenuMonth] = useState(() => buildCalendarBaseDate('07/04/2026'))
  const [checklistStartEnabled, setChecklistStartEnabled] = useState(false)
  const [checklistStartDateValue, setChecklistStartDateValue] = useState('')
  const [checklistDueEnabled, setChecklistDueEnabled] = useState(true)
  const [checklistDueValue, setChecklistDueValue] = useState('07/04/26')
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [submitError, setSubmitError] = useState(null)
  const commentComposerRef = useRef(null)
  const commentTextareaRef = useRef(null)
  const checklistItemTextareaRef = useRef(null)
  const textMenuRef = useRef(null)
  const textMenuButtonRef = useRef(null)
  const membersMenuRef = useRef(null)
  const membersMenuButtonRef = useRef(null)
  const labelMenuRef = useRef(null)
  const labelMenuButtonRef = useRef(null)
  const dateMenuRef = useRef(null)
  const dateMenuButtonRef = useRef(null)
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
  const attachmentAddToggleRef = useRef(null)
  const localFileInputRef = useRef(null)
  const commentTextRefs = useRef({})
  const dialogTitleId = `card-modal-title-${card.id}`

  const label = labels.find(l => l.id === labelId)
  const currentUserName = currentUser?.fullName ?? currentUser?.email ?? 'Você'
  const dateMenuDays = buildCalendarDays(dateMenuMonth)
  const checklistDateMenuDays = buildCalendarDays(checklistDateMenuMonth)
  const startClose = () => {
    setExiting(true)
    setTimeout(onClose, 220)
  }

  const close = () => {
    if (isSaving || isDeleting) return
    startClose()
  }

  const save = async () => {
    if (isSaving || isDeleting) return

    setIsSaving(true)
    setSubmitError(null)

    try {
      await onUpdate({
        ...card,
        title,
        description: desc,
        labelId,
        memberIds,
        dueDate,
        schedule: {
          selectedCalendarDay,
          startEnabled,
          startDateValue,
          dueEnabled,
          dueDateValue,
          dueTimeValue,
          displayLabel,
          preserveDisplayLabel,
        },
        comments,
        attachments,
      })
      startClose()
    } catch (error) {
      setSubmitError(error?.message ?? 'Não foi possível salvar as alterações do cartão.')
    } finally {
      setIsSaving(false)
    }
  }

  const toggleMember = (id) => {
    setMIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  const addComment = () => {
    if (!comment.trim()) return
    const c = {
      id: uid(),
      author: currentUser?.id ?? null,
      authorId: currentUser?.id ?? null,
      authorName: currentUserName,
      text: comment.trim(),
      time: 'Agora',
    }
    setComments(prev => [...prev, c])
    setComment('')
  }

  const openFilePicker = async () => {
    setShowInsertMenu(false)
    setShowAttachmentAddMenu(false)
    setShowFilePicker(true)
    setFileActionError('')
    await onLoadFiles?.()
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
    setUploadingLocalFile(true)
    setFileActionError('')
    setSubmitError(null)

    try {
      const nextCard = await onUploadLocalFile(localFile, card.id)
      if (nextCard?.attachments) {
        setAttachments(nextCard.attachments)
      }
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
    if (isSaving || isDeleting) return

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
  const handleChecklistCreate = () => {
    if (isBackendDriven) return
    const nextTitle = checklistTitle.trim() || 'Checklist'
    setActiveChecklist({ title: nextTitle, items: [] })
    setChecklistComposerOpen(true)
    setShowChecklistMenu(false)
    setChecklistTitle('Checklist')
  }
  const handleChecklistItemAdd = () => {
    if (isBackendDriven) return
    if (!newChecklistItem.trim() || !activeChecklist) return

    setActiveChecklist(prev => ({
      ...prev,
      items: [...prev.items, { id: uid(), text: newChecklistItem.trim(), checked: false }],
    }))
    setNewChecklistItem('')
    setChecklistComposerOpen(true)
  }
  const toggleChecklistItem = (itemId) => {
    if (isBackendDriven) return
    setActiveChecklist(prev => ({
      ...prev,
      items: prev.items.map(item => item.id === itemId ? { ...item, checked: !item.checked } : item),
    }))
  }
  const handleDateSave = () => {
    const shouldPreserveDisplayLabel =
      dueEnabled &&
      initialSchedule.preserveDisplayLabel &&
      dueDateValue === initialSchedule.dueDateValue &&
      selectedCalendarDay === initialSchedule.selectedCalendarDay

    const nextDueDate = dueEnabled
      ? (shouldPreserveDisplayLabel
          ? initialSchedule.displayLabel
          : formatDueDateLabelFromValue(dueDateValue, selectedCalendarDay))
      : ''

    setDueDate(nextDueDate)
    setDisplayLabel(nextDueDate)
    setPreserveDisplayLabel(shouldPreserveDisplayLabel)
    setShowDateMenu(false)
  }
  const handleDateRemove = () => {
    setDueEnabled(false)
    setDueDate('')
    setDisplayLabel('')
    setPreserveDisplayLabel(false)
    setShowDateMenu(false)
  }
  const selectedMembers = memberIds.map(id => members.find(m => m.id === id)).filter(Boolean)
  const pickerFiles = (filePickerFilter === 'plan' ? planFiles : libraryFiles)
    .filter((file) => file.name.toLowerCase().includes(fileSearch.trim().toLowerCase()))
  const attachedFileIds = new Set(attachments.map((attachment) => attachment.fileId))
  const getMemberName = (member) => {
    if (!member) return 'Membro'
    return member.name ?? member.email ?? member.initials ?? 'Membro'
  }
  const getCommentPresenter = (commentItem) => {
    const memberId = commentItem.authorId ?? commentItem.author
    const member = memberId ? members.find((item) => item.id === memberId) : null

    if (member) {
      return {
        name: getMemberName(member),
        initials: member.initials ?? buildInitials(getMemberName(member)),
        color: member.color ?? 'var(--text-3)',
      }
    }

    const fallbackName = commentItem.authorName ?? commentItem.author ?? 'Você'

    return {
      name: fallbackName,
      initials: buildInitials(fallbackName),
      color: 'var(--text-3)',
    }
  }

  useEffect(() => {
    setAttachments(Array.isArray(card.attachments) ? card.attachments : [])
  }, [card.id, card.attachments])

  useEffect(() => {
    if (showDateMenu) {
      setDateMenuMonth(buildCalendarBaseDate(dueDateValue || startDateValue))
    }
  }, [dueDateValue, showDateMenu, startDateValue])

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
    if (!showAttachmentAddMenu) return

    const handlePointerDown = (event) => {
      const clickedMenu = attachmentAddMenuRef.current?.contains(event.target)
      const clickedButton = attachmentAddToggleRef.current?.contains(event.target)

      if (!clickedMenu && !clickedButton) {
        setShowAttachmentAddMenu(false)
      }
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setShowAttachmentAddMenu(false)
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [showAttachmentAddMenu])

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
    const minimumHeight = commentFocused ? 42 : 42

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

    comments.forEach((commentItem) => {
      const element = commentTextRefs.current[commentItem.id]
      if (!element) return

      const computedStyle = window.getComputedStyle(element)
      const lineHeight = Number.parseFloat(computedStyle.lineHeight) || 19.5
      const maxHeight = lineHeight * 10

      nextOverflowingComments[commentItem.id] = element.scrollHeight > maxHeight + 1
    })

    setOverflowingComments(nextOverflowingComments)
  }, [comments])

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
        {/* Header */}
        <div className={styles.cmHeader}>
          <div className={styles.cmHeaderLeft}>
            <button type="button" className={styles.cmStatusBtn}>
              <span>{colTitle}</span>
              <span className={styles.cmStatusBtnIcon}><icons.Chevron /></span>
            </button>
          </div>
          <div className={styles.cmHeaderActions}>
            <button type="button" className={styles.cmIconBtn} onClick={handleDelete} title="Excluir cartão" aria-label="Excluir cartão" disabled={isSaving || isDeleting}><icons.Trash /></button>
            <button type="button" className={styles.cmIconBtn} onClick={close} title="Fechar" aria-label="Fechar detalhes do cartão" disabled={isSaving || isDeleting}><icons.X /></button>
          </div>
        </div>

        <div className={styles.cmBody}>
          <div className={styles.cmMain}>
            <div className={styles.cmTitleRow}>
              <span className={styles.cmTitleMarker} />
              <textarea
                id={dialogTitleId}
                className={styles.cmTitle}
                value={title}
                onChange={e => setTitle(e.target.value)}
                rows={1}
                placeholder="Título do cartão"
                aria-label="Título do cartão"
              />
            </div>

            <div className={styles.cmToolbar}>
              <button
                ref={membersMenuButtonRef}
                type="button"
                className={`${styles.cmToolbarBtn} ${showMembersMenu ? styles.cmToolbarBtnActive : ''}`}
                onClick={() => setShowMembersMenu(v => !v)}
                aria-expanded={showMembersMenu}
                aria-haspopup="menu"
              >
                <icons.User />
                Membros
                <span className={styles.cmToolbarBtnChevron}><icons.Chevron /></span>
              </button>
              <button
                ref={labelMenuButtonRef}
                type="button"
                className={`${styles.cmToolbarBtn} ${showLabelMenu ? styles.cmToolbarBtnActive : ''}`}
                onClick={() => setShowLabelMenu(v => !v)}
                aria-expanded={showLabelMenu}
                aria-haspopup="menu"
              >
                <icons.Tag />
                Etiquetas
                <span className={styles.cmToolbarBtnChevron}><icons.Chevron /></span>
              </button>
              <button
                ref={dateMenuButtonRef}
                type="button"
                className={`${styles.cmToolbarBtn} ${showDateMenu ? styles.cmToolbarBtnActive : ''}`}
                onClick={() => setShowDateMenu(v => !v)}
                aria-expanded={showDateMenu}
                aria-haspopup="dialog"
              >
                <icons.Clock />
                Datas
                <span className={styles.cmToolbarBtnChevron}><icons.Chevron /></span>
              </button>
              {!isBackendDriven && (
                <button
                  ref={checklistMenuButtonRef}
                  type="button"
                  className={`${styles.cmToolbarBtn} ${showChecklistMenu ? styles.cmToolbarBtnActive : ''}`}
                  onClick={() => setShowChecklistMenu(v => !v)}
                  aria-expanded={showChecklistMenu}
                  aria-haspopup="dialog"
                >
                  <icons.Check />
                  Checklist
                </button>
              )}
            </div>

              <div className={styles.cmSection}>
                <p className={styles.cmSectionTitle}>
                  <icons.List />
                  Descrição
              </p>
              <textarea
                className={styles.cmDesc}
                value={desc}
                onChange={e => setDesc(e.target.value)}
                placeholder="Adicione uma descrição..."
                rows={1}
                aria-label="Descrição do cartão"
                />
              </div>

              <div className={styles.cmSection}>
                  <div className={styles.cmAttachmentHeader}>
                    <p className={styles.cmSectionTitle}>
                      <icons.Files />
                      Anexos
                    </p>
                    <div className={styles.cmAttachmentAddSplit}>
                      <button
                        type="button"
                        className={styles.cmAttachmentAddBtn}
                        onClick={openFilePicker}
                        disabled={uploadingLocalFile}
                      >
                        <icons.Plus />
                        {uploadingLocalFile ? 'Enviando...' : 'Adicionar'}
                      </button>
                      <button
                        ref={attachmentAddToggleRef}
                        type="button"
                        className={styles.cmAttachmentAddToggle}
                        onClick={() => setShowAttachmentAddMenu((value) => !value)}
                        aria-label="Escolher origem do anexo"
                        aria-expanded={showAttachmentAddMenu}
                        aria-haspopup="menu"
                        disabled={uploadingLocalFile}
                      >
                        <span className={`${styles.cmAttachmentAddToggleIcon} ${showAttachmentAddMenu ? styles.cmAttachmentAddToggleIconOpen : ''}`}>
                          <icons.Chevron />
                        </span>
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
                            onClick={openFilePicker}
                            role="menuitem"
                          >
                            <span className={styles.cmAttachmentAddMenuItemIcon}><icons.Files /></span>
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
                            <span className={styles.cmAttachmentAddMenuItemIcon}><ComputerIcon /></span>
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

                  {attachments.length ? (
                  <div className={styles.cmAttachmentList}>
                    {attachments.map((attachment) => (
                      <div key={attachment.id} className={styles.cmAttachmentRow}>
                        <span className={styles.cmAttachmentIcon}><icons.Files /></span>
                        <div className={styles.cmAttachmentBody}>
                          <p className={styles.cmAttachmentName}>{attachment.name}</p>
                          <p className={styles.cmAttachmentMeta}>
                            {formatFileSize(attachment.size)} · {attachment.attachedBy?.fullName ?? 'Membro'}
                          </p>
                        </div>
                        <div className={styles.cmAttachmentActions}>
                          {onDownloadFile ? (
                            <button
                              type="button"
                              className={styles.cmAttachmentIconBtn}
                              onClick={() => {
                                Promise.resolve(onDownloadFile(attachment)).catch((error) => {
                                  setSubmitError(error?.message ?? 'Não foi possível baixar o anexo.')
                                })
                              }}
                              aria-label={`Baixar ${attachment.name}`}
                            >
                              <icons.Download />
                            </button>
                          ) : null}
                          {attachment.canRemove ? (
                            <button
                              type="button"
                              className={styles.cmAttachmentRemoveBtn}
                              onClick={() => handleRemoveAttachment(attachment)}
                              disabled={removingAttachmentId === attachment.id}
                            >
                              {removingAttachmentId === attachment.id ? 'Removendo...' : 'Remover'}
                            </button>
                          ) : null}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className={styles.cmAttachmentEmpty}>Nenhum arquivo anexado a este cartão.</p>
                )}
              </div>

              {activeChecklist && (
                <div className={styles.cmChecklistBlock}>
                  <div className={styles.cmChecklistBlockHeader}>
                    <div className={styles.cmChecklistBlockTitleWrap}>
                      <span className={styles.cmChecklistBlockIcon}><icons.Check /></span>
                      <p className={styles.cmChecklistBlockTitle}>{activeChecklist.title}</p>
                    </div>
                      {!isBackendDriven && (
                        <button
                          type="button"
                          className={styles.cmChecklistDeleteBtn}
                          onClick={() => {
                            setActiveChecklist(null)
                            setNewChecklistItem('')
                            setChecklistComposerOpen(false)
                          }}
                        >
                          Excluir
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
                            disabled={isBackendDriven}
                          >
                            {item.checked && <icons.Check />}
                          </button>
                          <span className={`${styles.cmChecklistItemText} ${item.checked ? styles.cmChecklistItemTextChecked : ''}`}>
                            {item.text}
                          </span>
                        </label>
                      ))}
                    </div>
                  )}

                    {!isBackendDriven && checklistComposerOpen ? (
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
                          <button type="button" className={styles.cmChecklistPrimaryBtn} onClick={handleChecklistItemAdd}>Adicionar</button>
                          <button
                            type="button"
                            className={styles.cmChecklistSecondaryBtn}
                            onClick={() => {
                              setNewChecklistItem('')
                              setChecklistComposerOpen(false)
                              setShowChecklistAssignMenu(false)
                              setShowChecklistDueMenu(false)
                            }}
                          >
                            Cancelar
                          </button>
                          <button
                            ref={checklistAssignButtonRef}
                            type="button"
                            className={styles.cmChecklistMetaBtn}
                            onClick={() => setShowChecklistAssignMenu(v => !v)}
                            aria-expanded={showChecklistAssignMenu}
                            aria-haspopup="menu"
                          >
                            <icons.User /> Atribuir
                          </button>
                          <button
                            ref={checklistDueButtonRef}
                            type="button"
                            className={styles.cmChecklistMetaBtn}
                            onClick={() => setShowChecklistDueMenu(v => !v)}
                            aria-expanded={showChecklistDueMenu}
                            aria-haspopup="dialog"
                          >
                            <icons.Clock /> {checklistDueValue}
                          </button>
                        </div>
                      </>
                    ) : !isBackendDriven ? (
                      <button
                        type="button"
                        className={styles.cmChecklistAddItemBtn}
                        onClick={() => setChecklistComposerOpen(true)}
                      >
                        Adicionar um item
                      </button>
                    ) : null}

                  {isBackendDriven && (
                    <p className={styles.cmChecklistNotice}>
                      Checklist exibido em modo somente leitura enquanto finalizamos a integração completa dessa área.
                    </p>
                  )}
                  </div>
                )}

              <div className={styles.cmSaveRow}>
                {submitError && <p className={styles.cmSubmitError}>{submitError}</p>}
                {label && (
                <span className={styles.cmActiveLabel} style={{ background: label.color + '20', color: label.color }}>
                  {label.text}
                </span>
              )}
              <button type="button" className={styles.cmSaveBtn} onClick={save} disabled={isSaving || isDeleting}>
                {isSaving ? 'Salvando...' : 'Salvar alterações'}
              </button>
            </div>
          </div>

          <div className={styles.cmSidebar}>
            <div className={styles.cmSidebarHeader}>
              <p className={styles.cmSidebarTitle}>
                <icons.Comment />
                Comentários e atividade
              </p>
              <button
                type="button"
                className={styles.cmDetailsToggle}
                onClick={() => setShowDetails(v => !v)}
                aria-expanded={showDetails}
              >
                {showDetails ? 'Ocultar detalhes' : 'Mostrar detalhes'}
              </button>
            </div>

            <div className={styles.cmCommentComposer}>
              <div
                ref={commentComposerRef}
                className={`${styles.cmCommentComposerBox} ${commentFocused ? styles.cmCommentComposerBoxActive : ''}`}
              >
                {commentFocused && !isBackendDriven && (
                  <div className={styles.cmCommentToolbar}>
                    <div className={styles.cmCommentToolbarGroup}>
                      <div className={styles.cmCommentDropdown}>
                        <button
                          ref={textMenuButtonRef}
                          type="button"
                          className={`${styles.cmCommentToolBtn} ${showTextMenu ? styles.cmCommentToolBtnActive : ''}`}
                          onMouseDown={e => e.preventDefault()}
                          onClick={() => setShowTextMenu(v => !v)}
                          aria-expanded={showTextMenu}
                          aria-haspopup="menu"
                        >
                          Tt
                          <span className={styles.cmCommentToolBtnIcon}><icons.Chevron /></span>
                        </button>
                      </div>
                      <button type="button" className={styles.cmCommentToolIconBtn} onMouseDown={e => e.preventDefault()}><strong>B</strong></button>
                      <button type="button" className={styles.cmCommentToolIconBtn} onMouseDown={e => e.preventDefault()}><em>I</em></button>
                      <button type="button" className={styles.cmCommentToolIconBtn} onMouseDown={e => e.preventDefault()}>...</button>
                    </div>
                    <div className={styles.cmCommentToolbarGroup}>
                      <button
                        ref={listMenuButtonRef}
                        type="button"
                        className={`${styles.cmCommentToolBtn} ${showListMenu ? styles.cmCommentToolBtnActive : ''}`}
                        onMouseDown={e => e.preventDefault()}
                        onClick={() => setShowListMenu(v => !v)}
                        aria-expanded={showListMenu}
                        aria-haspopup="menu"
                      >
                        <icons.List />
                        <span className={styles.cmCommentToolBtnIcon}><icons.Chevron /></span>
                      </button>
                      <button
                        ref={insertMenuButtonRef}
                        type="button"
                        className={`${styles.cmCommentToolBtn} ${showInsertMenu ? styles.cmCommentToolBtnActive : ''}`}
                        onMouseDown={e => e.preventDefault()}
                        onClick={() => setShowInsertMenu(v => !v)}
                        aria-expanded={showInsertMenu}
                        aria-haspopup="menu"
                      >
                        <icons.Plus />
                        <span className={styles.cmCommentToolBtnIcon}><icons.Chevron /></span>
                      </button>
                    </div>
                    <div className={styles.cmCommentToolbarGroup}>
                      <button type="button" className={styles.cmCommentToolIconBtn} onMouseDown={e => e.preventDefault()}>
                        <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><path d="M11.5 4.5L6 10l-2.5-2.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/><path d="M6.5 4H4a1.5 1.5 0 0 0-1.5 1.5V12A1.5 1.5 0 0 0 4 13.5h8A1.5 1.5 0 0 0 13.5 12V9.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/><path d="M9.5 4H12a1.5 1.5 0 0 1 1.5 1.5V7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>
                      </button>
                      <button type="button" className={styles.cmCommentToolIconBtn} onMouseDown={e => e.preventDefault()}>
                        <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.3"/><path d="M8 5.2v3M8 10.9h.01" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>
                      </button>
                    </div>
                  </div>
                )}

                <textarea
                  ref={commentTextareaRef}
                  className={styles.cmCommentTextarea}
                  placeholder="Escrever comentário..."
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
                  rows={commentFocused ? 2 : 1}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      addComment()
                    }
                  }}
                />
              </div>
              <button
                type="button"
                className={styles.cmSendBtn}
                onClick={addComment}
                disabled={!comment.trim()}
                aria-label="Enviar comentário"
              >
                <icons.Send />
              </button>
            </div>

            <div className={styles.cmActivityList}>
              {comments.length === 0 && (
                <div className={styles.cmActivityItem}>
                  <div className={styles.cmActivityContent}>
                    <p className={styles.cmActivityText}>Nenhum comentário registrado neste cartão ainda.</p>
                  </div>
                </div>
              )}

              {comments.map(c => {
                const presenter = getCommentPresenter(c)
                const isExpanded = expandedComments[c.id]
                const isOverflowing = overflowingComments[c.id]
                return (
                  <div key={c.id} className={styles.cmActivityItem}>
                    <span className={styles.cmCommentAvatar} style={{ background: presenter.color }}>{presenter.initials}</span>
                    <div className={styles.cmActivityContent}>
                      <p
                        ref={element => {
                          if (element) {
                            commentTextRefs.current[c.id] = element
                          } else {
                            delete commentTextRefs.current[c.id]
                          }
                        }}
                        className={`${styles.cmActivityText} ${!isExpanded ? styles.cmActivityTextClamped : ''}`}
                      >
                        <strong>{presenter.name}</strong> {c.text}
                      </p>
                      {isOverflowing && (
                        <button
                          type="button"
                          className={styles.cmActivityToggle}
                          onMouseDown={e => e.stopPropagation()}
                          onClick={e => {
                            e.stopPropagation()
                            setExpandedComments(prev => ({ ...prev, [c.id]: !prev[c.id] }))
                          }}
                        >
                          {isExpanded ? 'Ver menos' : 'Ver mais'}
                        </button>
                      )}
                      <span className={styles.cmCommentTime}>{c.time}</span>
                    </div>
                  </div>
                )
              })}
            </div>

              {showDetails && (
                <div className={styles.cmDetailsPanel}>
                  <div className={styles.cmMeta}>
                    <p className={styles.cmMetaTitle}><icons.Clock /> Data</p>
                  <input
                    type="text"
                    className={styles.cmDateInput}
                    value={dueDate}
                    onChange={e => {
                      setDueDate(e.target.value)
                      setDisplayLabel(e.target.value)
                      setPreserveDisplayLabel(false)
                    }}
                    placeholder="ex: 14 ago"
                    aria-label="Data de entrega"
                  />
                </div>

                {selectedMembers.length > 0 && (
                  <div className={styles.cmMeta}>
                    <p className={styles.cmMetaTitle}>Selecionados</p>
                    <div className={styles.cmSelectedMembers}>
                      {selectedMembers.map(member => (
                        <span key={member.id} className={styles.cmSelectedMember}>
                          <span className={styles.cmMemberAvatar} style={{ background: member.color }}>{member.initials}</span>
                          {getMemberName(member)}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

      </div>

      {showFilePicker && (
        <div
          className={styles.cmFilePickerOverlay}
          role="dialog"
          aria-modal="true"
          aria-label="Anexar arquivo"
          onClick={(event) => {
            event.stopPropagation()
            setShowFilePicker(false)
          }}
        >
          <div className={styles.cmFilePicker} onClick={e => e.stopPropagation()}>
            <header className={styles.cmFilePickerHeader}>
              <div>
                <p className={styles.cmFilePickerEyebrow}>Anexar arquivo</p>
                <h3>Arquivos do cartão</h3>
              </div>
              <button type="button" className={styles.cmIconBtn} onClick={() => setShowFilePicker(false)} aria-label="Fechar">
                <icons.X />
              </button>
            </header>

            <div className={styles.cmFilePickerControls}>
              <div className={styles.cmFilePickerTabs} role="tablist" aria-label="Fonte do arquivo">
                {[
                  { id: 'plan', label: 'Plano', count: planFiles.length },
                  { id: 'library', label: 'Biblioteca', count: libraryFiles.length },
                ].map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    className={`${styles.cmFilePickerTab} ${filePickerFilter === option.id ? styles.cmFilePickerTabActive : ''}`}
                    onClick={() => setFilePickerFilter(option.id)}
                    role="tab"
                    aria-selected={filePickerFilter === option.id}
                  >
                    {option.label}
                    <span>{option.count}</span>
                  </button>
                ))}
              </div>
              <input
                type="search"
                className={styles.cmFilePickerSearch}
                value={fileSearch}
                onChange={e => setFileSearch(e.target.value)}
                placeholder="Buscar arquivo"
                aria-label="Buscar arquivo"
              />
            </div>

            {fileActionError ? <p className={styles.cmFilePickerError}>{fileActionError}</p> : null}
            {filesError ? <p className={styles.cmFilePickerError}>{filesError}</p> : null}

            <div className={styles.cmFilePickerList}>
              {filesLoading ? (
                Array.from({ length: 5 }, (_, index) => (
                  <div key={`picker-loading-${index}`} className={styles.cmFilePickerSkeleton} />
                ))
              ) : pickerFiles.length ? (
                pickerFiles.map((file) => {
                  const isAttached = attachedFileIds.has(file.id)
                  const isBusy = attachingFileId === file.id

                  return (
                    <button
                      key={file.id}
                      type="button"
                      className={styles.cmFilePickerItem}
                      onClick={() => handleAttachFile(file)}
                      disabled={isAttached || isBusy}
                    >
                      <span className={styles.cmFilePickerIcon}><icons.Files /></span>
                      <span className={styles.cmFilePickerBody}>
                        <span className={styles.cmFilePickerName}>{file.name}</span>
                        <span className={styles.cmFilePickerMeta}>{formatFileSize(file.size)} · {file.modified}</span>
                      </span>
                      <span className={styles.cmFilePickerAction}>
                        {isAttached ? 'Anexado' : isBusy ? 'Anexando...' : 'Anexar'}
                      </span>
                    </button>
                  )
                })
              ) : (
                <div className={styles.cmFilePickerEmpty}>
                  <icons.Files />
                  <strong>Nada para mostrar</strong>
                  <p>{filePickerFilter === 'plan' ? 'Nenhum arquivo compartilhado com este plano.' : 'Nenhum arquivo disponível na sua biblioteca.'}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

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
                onClick={() => toggleMember(m.id)}
                aria-pressed={memberIds.includes(m.id)}
              >
                <span className={styles.cmMemberAvatar} style={{ background: m.color }}>{m.initials}</span>
                <span className={styles.cmMemberName}>{getMemberName(m)}</span>
                {memberIds.includes(m.id) && <span className={styles.cmMemberCheck}><icons.Check /></span>}
              </button>
            ))}
            <button
              type="button"
              className={styles.cmMembersMenuCreate}
              onClick={() => setShowMembersMenu(false)}
            >
              <span className={styles.cmMembersMenuCreateIcon}><icons.Plus /></span>
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
              <icons.X />
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
            >
              Adicionar
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
              className={`${styles.cmChecklistCompactItem} ${memberIds.includes(member.id) ? styles.cmChecklistCompactItemActive : ''}`}
              onClick={() => toggleMember(member.id)}
            >
              <span className={styles.cmMemberAvatar} style={{ background: member.color }}>{member.initials}</span>
              <span>{getMemberName(member)}</span>
              {memberIds.includes(member.id) && (
                <span className={styles.cmLabelCheck}>
                  <icons.Check />
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
              <icons.X />
            </button>
          </div>

          <div className={styles.cmChecklistDateMenuMonthBar}>
            <div className={styles.cmChecklistDateMenuMonthNav}>
              <button type="button" className={styles.cmChecklistDateMenuNavBtn} onClick={() => setChecklistDateMenuMonth((current) => new Date(current.getFullYear(), current.getMonth() - 1, 1))}>‹</button>
            </div>
            <span className={styles.cmChecklistDateMenuMonthLabel}>{formatCalendarMonthLabel(checklistDateMenuMonth)}</span>
            <div className={styles.cmChecklistDateMenuMonthNav}>
              <button type="button" className={styles.cmChecklistDateMenuNavBtn} onClick={() => setChecklistDateMenuMonth((current) => new Date(current.getFullYear(), current.getMonth() + 1, 1))}>›</button>
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
                  {checklistStartEnabled && <icons.Check />}
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
                      setChecklistDueValue('Sem data')
                    } else if (checklistDueValue === 'Sem data') {
                      setChecklistDueValue('07/04/26')
                    }
                  }}
                >
                  {checklistDueEnabled && <icons.Check />}
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
                  setLabelId(labelId === l.id ? null : l.id)
                  setShowLabelMenu(false)
                }}
                aria-pressed={labelId === l.id}
              >
                <span className={styles.cmLabelDot} style={{ background: l.color }} />
                {l.text}
                {labelId === l.id && <span className={styles.cmLabelCheck}><icons.Check /></span>}
              </button>
            ))}
            <button
              type="button"
              className={styles.cmLabelMenuCreate}
              onClick={() => setShowLabelMenu(false)}
            >
              <span className={styles.cmLabelMenuCreateIcon}><icons.Plus /></span>
              Nova Etiqueta
            </button>
          </div>
        </div>
      )}

      {showDateMenu && (
        <div
          ref={dateMenuRef}
          className={styles.cmDateMenu}
          style={{ top: `${dateMenuPosition.top}px`, left: `${dateMenuPosition.left}px` }}
          onClick={e => e.stopPropagation()}
          role="dialog"
          aria-modal="false"
        >
          <div className={styles.cmDateMenuHeader}>
            <h3 className={styles.cmDateMenuTitle}>Datas</h3>
            <button type="button" className={styles.cmDateMenuClose} onClick={() => setShowDateMenu(false)}>
              <icons.X />
            </button>
          </div>

          <div className={styles.cmDateMenuMonthBar}>
            <div className={styles.cmDateMenuMonthNav}>
              <button type="button" className={styles.cmDateMenuNavBtn} onClick={() => setDateMenuMonth((current) => new Date(current.getFullYear(), current.getMonth() - 1, 1))}>‹</button>
            </div>
            <span className={styles.cmDateMenuMonthLabel}>{formatCalendarMonthLabel(dateMenuMonth)}</span>
            <div className={styles.cmDateMenuMonthNav}>
              <button type="button" className={styles.cmDateMenuNavBtn} onClick={() => setDateMenuMonth((current) => new Date(current.getFullYear(), current.getMonth() + 1, 1))}>›</button>
            </div>
          </div>

          <div className={styles.cmDateMenuWeekdays}>
            {['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab'].map(day => (
              <span key={day}>{day}</span>
            ))}
          </div>

          <div className={styles.cmDateMenuGrid}>
            {dateMenuDays.map((day, index) => (
              <button
                key={`${day.label}-${index}`}
                type="button"
                className={`${styles.cmDateMenuDay} ${day.muted ? styles.cmDateMenuDayMuted : ''} ${selectedCalendarDay === day.label && !day.muted ? styles.cmDateMenuDaySelected : ''}`}
                onClick={() => {
                  if (day.muted) return
                  setSelectedCalendarDay(day.label)
                  setDueDateValue(formatCalendarInputValue(day.label, dateMenuMonth))
                }}
              >
                <span className={day.underline ? styles.cmDateMenuDayUnderline : ''}>{day.label}</span>
              </button>
            ))}
          </div>

          <div className={styles.cmDateMenuFields}>
            <div className={styles.cmDateMenuFieldGroup}>
              <label className={styles.cmDateMenuFieldLabel}>Data de inicio</label>
              <div className={styles.cmDateMenuInputRow}>
                <button
                  type="button"
                  className={`${styles.cmDateCheckbox} ${startEnabled ? styles.cmDateCheckboxActive : ''}`}
                  onClick={() => setStartEnabled(v => !v)}
                >
                  {startEnabled && <icons.Check />}
                </button>
                <input
                  type="text"
                  className={styles.cmDateMenuInput}
                  placeholder="D/M/AAAA"
                  value={startDateValue}
                  onChange={e => setStartDateValue(e.target.value)}
                  disabled={!startEnabled}
                  aria-label="Data inicial"
                />
              </div>
            </div>

            <div className={styles.cmDateMenuFieldGroup}>
              <label className={styles.cmDateMenuFieldLabel}>Data de entrega</label>
              <div className={styles.cmDateMenuInputRow}>
                <button
                  type="button"
                  className={`${styles.cmDateCheckbox} ${dueEnabled ? styles.cmDateCheckboxActive : ''}`}
                  onClick={() => setDueEnabled(v => !v)}
                >
                  {dueEnabled && <icons.Check />}
                </button>
                <input
                  type="text"
                  className={`${styles.cmDateMenuInput} ${styles.cmDateMenuInputCompact}`}
                  value={dueDateValue}
                  onChange={e => setDueDateValue(e.target.value)}
                  disabled={!dueEnabled}
                  aria-label="Data de entrega"
                />
                <input
                  type="text"
                  className={`${styles.cmDateMenuInput} ${styles.cmDateMenuInputTime}`}
                  value={dueTimeValue}
                  onChange={e => setDueTimeValue(e.target.value)}
                  disabled={!dueEnabled}
                  aria-label="Hora de entrega"
                />
              </div>
            </div>

          </div>

          <div className={styles.cmDateMenuActions}>
            <button type="button" className={styles.cmDateMenuSave} onClick={handleDateSave}>Salvar</button>
            <button type="button" className={styles.cmDateMenuRemove} onClick={handleDateRemove}>Remover</button>
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
              icon: <icons.Link />,
            },
            {
              label: 'Arquivo',
              description: 'Anexe um arquivo',
              icon: <icons.Files />,
              action: openFilePicker,
            },
            {
              label: 'Imagem',
              description: 'Adicione uma imagem',
              icon: <icons.Image />,
            },
            {
              label: 'Código',
              description: 'Exibir código com destaque',
              icon: <icons.Code />,
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


