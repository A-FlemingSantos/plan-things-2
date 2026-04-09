import { useEffect, useLayoutEffect, useRef, useState } from 'react'

const uid = () => Math.random().toString(36).slice(2, 9)
const DEFAULT_CARD_SCHEDULE = {
  selectedCalendarDay: 7,
  startEnabled: false,
  startDateValue: '',
  dueEnabled: true,
  dueDateValue: '07/04/26',
  dueTimeValue: '16:21',
  recurringValue: 'Nunca',
  reminderValue: '1 dia antes',
  displayLabel: '',
  preserveDisplayLabel: false,
}

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function extractDayFromDisplayLabel(value = '') {
  const match = value.match(/(\d{1,2})$/)
  return match ? Number(match[1]) : null
}

function formatCalendarInputValue(day) {
  return `${String(day).padStart(2, '0')}/04/26`
}

function formatDueDateLabelFromValue(dateValue, fallbackDay) {
  const match = dateValue.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/)

  if (!match) {
    return fallbackDay ? `Apr ${fallbackDay}` : ''
  }

  const [, dayValue, monthValue] = match
  const day = Number(dayValue)
  const monthIndex = Number(monthValue) - 1
  const monthLabel = MONTH_LABELS[monthIndex] ?? 'Apr'

  return `${monthLabel} ${day}`
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
    recurringValue: schedule.recurringValue ?? DEFAULT_CARD_SCHEDULE.recurringValue,
    reminderValue: schedule.reminderValue ?? DEFAULT_CARD_SCHEDULE.reminderValue,
    displayLabel: schedule.displayLabel ?? card.dueDate ?? DEFAULT_CARD_SCHEDULE.displayLabel,
    preserveDisplayLabel: typeof schedule.preserveDisplayLabel === 'boolean'
      ? schedule.preserveDisplayLabel
      : DEFAULT_CARD_SCHEDULE.preserveDisplayLabel,
  }
}

export default function CardModal({
  card,
  colTitle,
  onClose,
  onUpdate,
  onDelete,
  labels,
  members,
  calendarDays,
  icons,
  styles,
}) {
  const initialSchedule = buildInitialCardSchedule(card)
  const [title,    setTitle]    = useState(card.title)
  const [desc,     setDesc]     = useState(card.description)
  const [labelId,  setLabelId]  = useState(card.labelId)
  const [memberIds,setMIds]     = useState(card.memberIds)
  const [dueDate,  setDueDate]  = useState(card.dueDate)
  const [comment,  setComment]  = useState('')
  const [comments, setComments] = useState(card.comments)
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
  const [recurringValue, setRecurringValue] = useState(initialSchedule.recurringValue)
  const [reminderValue, setReminderValue] = useState(initialSchedule.reminderValue)
  const [displayLabel, setDisplayLabel] = useState(initialSchedule.displayLabel)
  const [preserveDisplayLabel, setPreserveDisplayLabel] = useState(initialSchedule.preserveDisplayLabel)
  const [checklistTitle, setChecklistTitle] = useState('Checklist')
  const [activeChecklist, setActiveChecklist] = useState(null)
  const [newChecklistItem, setNewChecklistItem] = useState('')
  const [checklistComposerOpen, setChecklistComposerOpen] = useState(false)
  const [showChecklistAssignMenu, setShowChecklistAssignMenu] = useState(false)
  const [showChecklistDueMenu, setShowChecklistDueMenu] = useState(false)
  const [checklistAssignMenuPosition, setChecklistAssignMenuPosition] = useState({ top: 0, left: 0 })
  const [checklistDueMenuPosition, setChecklistDueMenuPosition] = useState({ top: 0, left: 0 })
  const [checklistSelectedDay, setChecklistSelectedDay] = useState(7)
  const [checklistStartEnabled, setChecklistStartEnabled] = useState(false)
  const [checklistStartDateValue, setChecklistStartDateValue] = useState('')
  const [checklistDueEnabled, setChecklistDueEnabled] = useState(true)
  const [checklistDueValue, setChecklistDueValue] = useState('07/04/26')
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
  const commentTextRefs = useRef({})
  const dialogTitleId = `card-modal-title-${card.id}`

  const label = labels.find(l => l.id === labelId)

  const close = () => { setExiting(true); setTimeout(onClose, 220) }

  const save = () => {
    onUpdate({
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
        recurringValue,
        reminderValue,
        displayLabel,
        preserveDisplayLabel,
      },
      comments,
    })
    close()
  }

  const toggleMember = (id) => {
    setMIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  const addComment = () => {
    if (!comment.trim()) return
    const c = { id: uid(), author: 'm1', text: comment.trim(), time: 'Just now' }
    setComments(prev => [...prev, c])
    setComment('')
  }

  const handleDelete = () => { onDelete(card.id); close() }
  const handleChecklistCreate = () => {
    const nextTitle = checklistTitle.trim() || 'Checklist'
    setActiveChecklist({ title: nextTitle, items: [] })
    setChecklistComposerOpen(true)
    setShowChecklistMenu(false)
    setChecklistTitle('Checklist')
  }
  const handleChecklistItemAdd = () => {
    if (!newChecklistItem.trim() || !activeChecklist) return

    setActiveChecklist(prev => ({
      ...prev,
      items: [...prev.items, { id: uid(), text: newChecklistItem.trim(), checked: false }],
    }))
    setNewChecklistItem('')
    setChecklistComposerOpen(true)
  }
  const toggleChecklistItem = (itemId) => {
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
  const getMemberName = (initials) => {
    if (initials === 'AS') return 'Arthur Santos'
    if (initials === 'MK') return 'Maria Kim'
    if (initials === 'TK') return 'Tom K.'
    return 'Sara R.'
  }

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
            <button type="button" className={styles.cmIconBtn} onClick={handleDelete} title="Delete card" aria-label="Delete card"><icons.Trash /></button>
            <button type="button" className={styles.cmIconBtn} onClick={close} title="Close" aria-label="Close card details"><icons.X /></button>
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
                placeholder="Titulo do cartao"
                aria-label="Card title"
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
            </div>

              <div className={styles.cmSection}>
                <p className={styles.cmSectionTitle}>
                  <icons.List />
                  Descricao
              </p>
              <textarea
                className={styles.cmDesc}
                value={desc}
                onChange={e => setDesc(e.target.value)}
                placeholder="Adicione uma descricao mais detalhada..."
                rows={1}
                aria-label="Card description"
                />
              </div>

              {activeChecklist && (
                <div className={styles.cmChecklistBlock}>
                  <div className={styles.cmChecklistBlockHeader}>
                    <div className={styles.cmChecklistBlockTitleWrap}>
                      <span className={styles.cmChecklistBlockIcon}><icons.Check /></span>
                      <p className={styles.cmChecklistBlockTitle}>{activeChecklist.title}</p>
                    </div>
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

                    {checklistComposerOpen ? (
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
                    ) : (
                      <button
                        type="button"
                        className={styles.cmChecklistAddItemBtn}
                        onClick={() => setChecklistComposerOpen(true)}
                      >
                        Adicionar um item
                      </button>
                    )}
                  </div>
                )}

              <div className={styles.cmSaveRow}>
                {label && (
                <span className={styles.cmActiveLabel} style={{ background: label.color + '20', color: label.color }}>
                  {label.text}
                </span>
              )}
              <button type="button" className={styles.cmSaveBtn} onClick={save}>Salvar alteracoes</button>
            </div>
          </div>

          <div className={styles.cmSidebar}>
            <div className={styles.cmSidebarHeader}>
              <p className={styles.cmSidebarTitle}>
                <icons.Comment />
                Comentarios e atividade
              </p>
              <button
                type="button"
                className={styles.cmDetailsToggle}
                onClick={() => setShowDetails(v => !v)}
                aria-expanded={showDetails}
              >
                {showDetails ? 'Ocultar Detalhes' : 'Mostrar Detalhes'}
              </button>
            </div>

            <div className={styles.cmCommentComposer}>
              <div
                ref={commentComposerRef}
                className={`${styles.cmCommentComposerBox} ${commentFocused ? styles.cmCommentComposerBoxActive : ''}`}
              >
                {commentFocused && (
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
                  placeholder="Escrever um comentario..."
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                  aria-label="Write a comment"
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
                aria-label="Send comment"
              >
                <icons.Send />
              </button>
            </div>

            <div className={styles.cmActivityList}>
              <div className={styles.cmActivityItem}>
                <span className={styles.cmCommentAvatar} style={{ background: '#6b4fd3' }}>AS</span>
                <div className={styles.cmActivityContent}>
                  <p className={styles.cmActivityText}>
                    <strong>Arthur Fleming Santos</strong> adicionou este cartao a {colTitle}
                  </p>
                  <span className={styles.cmCommentTime}>ha 1 hora</span>
                </div>
              </div>

              {comments.map(c => {
                const m = members.find(x => x.id === c.author)
                const isExpanded = expandedComments[c.id]
                const isOverflowing = overflowingComments[c.id]
                return (
                  <div key={c.id} className={styles.cmActivityItem}>
                    <span className={styles.cmCommentAvatar} style={{ background: m?.color }}>{m?.initials}</span>
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
                        <strong>{getMemberName(m?.initials)}</strong> {c.text}
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
                    placeholder="ex: Aug 14"
                    aria-label="Due date"
                  />
                </div>

                {selectedMembers.length > 0 && (
                  <div className={styles.cmMeta}>
                    <p className={styles.cmMetaTitle}>Selecionados</p>
                    <div className={styles.cmSelectedMembers}>
                      {selectedMembers.map(member => (
                        <span key={member.id} className={styles.cmSelectedMember}>
                          <span className={styles.cmMemberAvatar} style={{ background: member.color }}>{member.initials}</span>
                          {getMemberName(member.initials)}
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
            { label: 'Titulo 1', shortcut: 'Ctrl+Alt+1' },
            { label: 'Titulo 2', shortcut: 'Ctrl+Alt+2' },
            { label: 'Titulo 3', shortcut: 'Ctrl+Alt+3' },
            { label: 'Titulo 4', shortcut: 'Ctrl+Alt+4' },
            { label: 'Titulo 5', shortcut: 'Ctrl+Alt+5' },
            { label: 'Titulo 6', shortcut: 'Ctrl+Alt+6' },
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
                <span className={styles.cmMemberName}>{getMemberName(m.initials)}</span>
                {memberIds.includes(m.id) && <span className={styles.cmMemberCheck}><icons.Check /></span>}
              </button>
            ))}
            <button
              type="button"
              className={styles.cmMembersMenuCreate}
              onClick={() => setShowMembersMenu(false)}
            >
              <span className={styles.cmMembersMenuCreateIcon}><icons.Plus /></span>
              Novo Membro
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
            <h3 className={styles.cmChecklistMenuTitle}>Adicionar Checklist</h3>
            <button type="button" className={styles.cmChecklistMenuClose} onClick={() => setShowChecklistMenu(false)}>
              <icons.X />
            </button>
          </div>

          <div className={styles.cmChecklistMenuBody}>
            <label className={styles.cmChecklistMenuLabel}>Titulo</label>
            <input
              type="text"
              className={styles.cmChecklistMenuInput}
              value={checklistTitle}
              onChange={e => setChecklistTitle(e.target.value)}
              aria-label="Checklist title"
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
              <span>{getMemberName(member.initials)}</span>
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
              <button type="button" className={styles.cmChecklistDateMenuNavBtn}>«</button>
              <button type="button" className={styles.cmChecklistDateMenuNavBtn}>‹</button>
            </div>
            <span className={styles.cmChecklistDateMenuMonthLabel}>abril 2026</span>
            <div className={styles.cmChecklistDateMenuMonthNav}>
              <button type="button" className={styles.cmChecklistDateMenuNavBtn}>›</button>
              <button type="button" className={styles.cmChecklistDateMenuNavBtn}>»</button>
            </div>
          </div>

          <div className={styles.cmChecklistDateMenuWeekdays}>
            {['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab'].map(day => (
              <span key={day}>{day}</span>
            ))}
          </div>

          <div className={styles.cmChecklistDateMenuGrid}>
            {calendarDays.map((day, index) => (
              <button
                key={`${day.label}-${index}`}
                type="button"
                className={`${styles.cmChecklistDateMenuDay} ${day.muted ? styles.cmChecklistDateMenuDayMuted : ''} ${checklistSelectedDay === day.label && !day.muted ? styles.cmChecklistDateMenuDaySelected : ''}`}
                onClick={() => {
                  if (day.muted) return
                  setChecklistSelectedDay(day.label)
                  setChecklistDueEnabled(true)
                  setChecklistDueValue(`${String(day.label).padStart(2, '0')}/04/26`)
                }}
              >
                <span className={day.underline ? styles.cmChecklistDateMenuDayUnderline : ''}>{day.label}</span>
              </button>
            ))}
          </div>

          <div className={styles.cmChecklistDateMenuFields}>
            <div className={styles.cmChecklistDateMenuFieldGroup}>
              <label className={styles.cmChecklistDateMenuFieldLabel}>Data de Inicio</label>
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
                  aria-label="Checklist start date"
                />
              </div>
            </div>

            <div className={styles.cmChecklistDateMenuFieldGroup}>
              <label className={styles.cmChecklistDateMenuFieldLabel}>Data de Entrega</label>
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
                  aria-label="Checklist due date"
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
              <button type="button" className={styles.cmDateMenuNavBtn}>«</button>
              <button type="button" className={styles.cmDateMenuNavBtn}>‹</button>
            </div>
            <span className={styles.cmDateMenuMonthLabel}>abril 2026</span>
            <div className={styles.cmDateMenuMonthNav}>
              <button type="button" className={styles.cmDateMenuNavBtn}>›</button>
              <button type="button" className={styles.cmDateMenuNavBtn}>»</button>
            </div>
          </div>

          <div className={styles.cmDateMenuWeekdays}>
            {['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab'].map(day => (
              <span key={day}>{day}</span>
            ))}
          </div>

          <div className={styles.cmDateMenuGrid}>
            {calendarDays.map((day, index) => (
              <button
                key={`${day.label}-${index}`}
                type="button"
                className={`${styles.cmDateMenuDay} ${day.muted ? styles.cmDateMenuDayMuted : ''} ${selectedCalendarDay === day.label && !day.muted ? styles.cmDateMenuDaySelected : ''}`}
                onClick={() => {
                  if (day.muted) return
                  setSelectedCalendarDay(day.label)
                  setDueDateValue(formatCalendarInputValue(day.label))
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
                  aria-label="Start date"
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
                  aria-label="Due date"
                />
                <input
                  type="text"
                  className={`${styles.cmDateMenuInput} ${styles.cmDateMenuInputTime}`}
                  value={dueTimeValue}
                  onChange={e => setDueTimeValue(e.target.value)}
                  disabled={!dueEnabled}
                  aria-label="Due time"
                />
              </div>
            </div>

            <div className={styles.cmDateMenuFieldGroup}>
              <label className={styles.cmDateMenuFieldLabel}>Recorrente</label>
              <button type="button" className={styles.cmDateMenuSelect} onClick={() => setRecurringValue(recurringValue)}>
                <span>{recurringValue}</span>
                <span className={styles.cmDateMenuSelectChevron}><icons.Chevron /></span>
              </button>
            </div>

            <div className={styles.cmDateMenuFieldGroup}>
              <label className={styles.cmDateMenuFieldLabel}>Definir lembrete</label>
              <button type="button" className={styles.cmDateMenuSelect} onClick={() => setReminderValue(reminderValue)}>
                <span>{reminderValue}</span>
                <span className={styles.cmDateMenuSelectChevron}><icons.Chevron /></span>
              </button>
              <p className={styles.cmDateMenuHint}>Lembretes serao enviados a todos os membros e seguidores deste cartao.</p>
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
            },
            {
              label: 'Imagem',
              description: 'Adicione uma imagem',
              icon: <icons.Image />,
            },
            {
              label: 'Codigo',
              description: 'Exibir codigo com destaque',
              icon: <icons.Code />,
            },
          ].map(option => (
            <button
              key={option.label}
              type="button"
              className={styles.cmInsertMenuItem}
              onMouseDown={e => e.preventDefault()}
              onClick={() => setShowInsertMenu(false)}
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


