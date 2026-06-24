import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createOffsetDateTime } from '@plan-things/shared-client/dates'
import { createCardModalUid } from '../utils/cardModalCommon.js'
import {
  buildCalendarBaseDate,
  buildCalendarDays,
} from '../utils/cardModalDateUtils.js'
import {
  buildInitialChecklist,
  normalizeChecklist,
  normalizeChecklistItem,
} from '../utils/checklistUtils.js'

export default function useCardModalChecklist({
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
}) {
  const [checklistTitle, setChecklistTitle] = useState('Checklist')
  const [activeChecklist, setActiveChecklist] = useState(() => buildInitialChecklist(card))
  const [newChecklistItem, setNewChecklistItem] = useState('')
  const [checklistComposerOpen, setChecklistComposerOpen] = useState(false)
  const [showChecklistMenu, setShowChecklistMenu] = useState(false)
  const [showChecklistAssignMenu, setShowChecklistAssignMenu] = useState(false)
  const [showChecklistDueMenu, setShowChecklistDueMenu] = useState(false)
  const [checklistMenuPosition, setChecklistMenuPosition] = useState({ top: 0, left: 0 })
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

  const checklistItemTextareaRef = useRef(null)
  const checklistMenuRef = useRef(null)
  const checklistMenuButtonRef = useRef(null)
  const checklistAssignMenuRef = useRef(null)
  const checklistAssignButtonRef = useRef(null)
  const checklistDueMenuRef = useRef(null)
  const checklistDueButtonRef = useRef(null)

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

  const handleChecklistCreate = async () => {
    const nextTitle = checklistTitle.trim() || 'Checklist'

    if (canPersistChecklist) {
      if (isChecklistMutating || activeChecklist) return

      const optimisticChecklist = normalizeChecklist({
        id: `temp-checklist-${createCardModalUid()}`,
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
        id: `temp-checklist-item-${createCardModalUid()}`,
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
      items: [...prev.items, { id: createCardModalUid(), text: newChecklistItem.trim(), checked: false }],
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

  useEffect(() => {
    if (activeChecklist) {
      checklistItemTextareaRef.current?.focus()
    }
  }, [activeChecklist?.items?.length, activeChecklist, checklistComposerOpen])

  return {
    checklistTitle,
    setChecklistTitle,
    activeChecklist,
    newChecklistItem,
    setNewChecklistItem,
    checklistComposerOpen,
    setChecklistComposerOpen,
    showChecklistMenu,
    setShowChecklistMenu,
    showChecklistAssignMenu,
    setShowChecklistAssignMenu,
    showChecklistDueMenu,
    setShowChecklistDueMenu,
    checklistMenuPosition,
    checklistAssignMenuPosition,
    checklistDueMenuPosition,
    checklistSelectedDay,
    setChecklistSelectedDay,
    checklistDateMenuMonth,
    setChecklistDateMenuMonth,
    checklistStartEnabled,
    setChecklistStartEnabled,
    checklistStartDateValue,
    setChecklistStartDateValue,
    checklistDueEnabled,
    setChecklistDueEnabled,
    checklistDueValue,
    setChecklistDueValue,
    checklistAssigneeUserId,
    setChecklistAssigneeUserId,
    isChecklistMutating,
    togglingChecklistItemId,
    checklistItemTextareaRef,
    checklistMenuRef,
    checklistMenuButtonRef,
    checklistAssignMenuRef,
    checklistAssignButtonRef,
    checklistDueMenuRef,
    checklistDueButtonRef,
    checklistDateMenuDays,
    canDeletePersistedChecklist,
    checklistReadOnly,
    checklistDueLabel,
    isChecklistAssignAccentActive,
    isChecklistDueAccentActive,
    closeChecklistComposer,
    handleChecklistCreate,
    handleChecklistDelete,
    handleChecklistItemAdd,
    toggleChecklistItem,
  }
}
