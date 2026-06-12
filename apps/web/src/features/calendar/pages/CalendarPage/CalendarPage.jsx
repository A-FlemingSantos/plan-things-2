import { useEffect, useMemo, useRef, useState } from 'react'
import ProductAppShell from '../../../../shared/components/ProductAppShell/ProductAppShell.jsx'
import PlanPageHeader from '../../../../shared/components/PlanPageHeader/PlanPageHeader.jsx'
import { useCalendarEvents } from '../../hooks/useCalendarEvents.js'
import { usePreferences } from '../../../preferences/context/PreferencesContext.jsx'
import InviteNotifications from '../../../workspace/components/InviteNotifications/InviteNotifications.jsx'
import AppThemeScope from '../../../preferences/components/AppThemeScope/AppThemeScope.jsx'
import styles from './CalendarPage.module.css'

const VIEW_OPTIONS = [
  { id: 'day', label: 'Dia', status: 'Vista diária' },
  { id: 'work', label: 'Semana de trabalho', status: 'Semana útil' },
  { id: 'week', label: 'Semana', status: 'Vista semanal' },
  { id: 'month', label: 'Mês', status: 'Vista mensal' },
]

const Icon = {
  Logo: () => <svg width="17" height="17" viewBox="0 0 20 20" fill="none"><rect x="2" y="2" width="7" height="7" rx="2" fill="currentColor"/><rect x="11" y="2" width="7" height="7" rx="2" fill="currentColor" opacity=".35"/><rect x="2" y="11" width="7" height="7" rx="2" fill="currentColor" opacity=".55"/><rect x="11" y="11" width="7" height="7" rx="2" fill="currentColor" opacity=".75"/></svg>,
  Home: () => <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><path d="M2 6.5L8 2l6 4.5V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V6.5z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/><path d="M6 15V9h4v6" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/></svg>,
  Calendar: () => <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><rect x="2" y="3" width="12" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.3"/><path d="M5 1.8v2.8M11 1.8v2.8M2.5 6.5h11" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>,
  Files: () => <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><path d="M9 1.5H4a1.5 1.5 0 0 0-1.5 1.5v10A1.5 1.5 0 0 0 4 14.5h8A1.5 1.5 0 0 0 13.5 13V6L9 1.5z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/><path d="M9 1.5V6H13.5" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/></svg>,
  Collapse: () => <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M9 2L5 7l4 5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  Chevron: () => <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M4.5 3l3 3-3 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  ChevDown: () => <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M3 4.5l3 3 3-3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  ChevLeft: () => <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M7.5 3l-3 3 3 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  ChevRight: () => <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M4.5 3l3 3-3 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  Plus: () => <svg width="13" height="13" viewBox="0 0 14 14" fill="none"><path d="M7 2v10M2 7h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>,
  Search: () => <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.3"/><path d="M9.5 9.5L12.5 12.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>,
  Filter: () => <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 4h10M4 7h6M6 10h2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>,
  Share: () => <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="11" cy="3" r="1.5" stroke="currentColor" strokeWidth="1.2"/><circle cx="3" cy="7" r="1.5" stroke="currentColor" strokeWidth="1.2"/><circle cx="11" cy="11" r="1.5" stroke="currentColor" strokeWidth="1.2"/><path d="M4.4 7.8L9.7 10M9.7 4L4.4 6.2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>,
  Print: () => <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M4 4V2h6v2M4 10H2.5A1.5 1.5 0 0 1 1 8.5v-2A1.5 1.5 0 0 1 2.5 5h9A1.5 1.5 0 0 1 13 6.5v2a1.5 1.5 0 0 1-1.5 1.5H10" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/><path d="M4 8.5h6V12H4V8.5z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/></svg>,
  X: () => <svg width="13" height="13" viewBox="0 0 14 14" fill="none"><path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>,
  Popover: () => <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M4 2.5H2.5v7H9.5V8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/><path d="M5 7L9.5 2.5M7 2.5h2.5V5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
}

function createCalendarDate(year, month, day) {
  return new Date(Date.UTC(year, month, day, 12, 0, 0, 0))
}

function yearOf(date) {
  return date.getUTCFullYear()
}

function monthOf(date) {
  return date.getUTCMonth()
}

function dayOfMonth(date) {
  return date.getUTCDate()
}

function weekdayOf(date) {
  return date.getUTCDay()
}

function dateFromKey(value) {
  if (!value || typeof value !== 'string') return null
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!match) return null
  const [, yearValue, monthValue, dayValue] = match
  return createCalendarDate(Number(yearValue), Number(monthValue) - 1, Number(dayValue))
}

function dateKeyFromTimeZoneInstant(value, timeZone) {
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return null
  const partByType = Object.fromEntries(new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date).map((part) => [part.type, part.value]))

  const year = partByType.year
  const month = partByType.month
  const day = partByType.day
  if (!year || !month || !day) return null
  return `${year}-${month}-${day}`
}

function currentDateInTimeZone(timeZone) {
  const key = dateKeyFromTimeZoneInstant(new Date(), timeZone)
  if (key) {
    const parsed = dateFromKey(key)
    if (parsed) return parsed
  }

  const fallback = new Date()
  return createCalendarDate(
    fallback.getUTCFullYear(),
    fallback.getUTCMonth(),
    fallback.getUTCDate(),
  )
}

function startOfMonth(date) {
  return createCalendarDate(yearOf(date), monthOf(date), 1)
}

function addDays(date, amount) {
  const next = new Date(date)
  next.setUTCDate(next.getUTCDate() + amount)
  return next
}

function addMonths(date, amount) {
  return createCalendarDate(yearOf(date), monthOf(date) + amount, 1)
}

function startOfWeek(date) {
  return addDays(date, -weekdayOf(date))
}

function startOfWorkWeek(date) {
  const weekDay = weekdayOf(date)
  return addDays(date, weekDay === 0 ? -6 : 1 - weekDay)
}

function daysInMonth(date) {
  return new Date(Date.UTC(yearOf(date), monthOf(date) + 1, 0, 12, 0, 0, 0)).getUTCDate()
}

function dateKey(date) {
  return `${yearOf(date)}-${String(monthOf(date) + 1).padStart(2, '0')}-${String(dayOfMonth(date)).padStart(2, '0')}`
}

function isSameDate(a, b) {
  return dateKey(a) === dateKey(b)
}

function buildMonthCells(monthDate) {
  const first = startOfMonth(monthDate)
  const gridStart = addDays(first, -weekdayOf(first))

  return Array.from({ length: 42 }, (_, index) => {
    const date = addDays(gridStart, index)
    return {
      date,
      key: dateKey(date),
      muted: monthOf(date) !== monthOf(monthDate),
    }
  })
}

function buildRangeDays(startDate, length) {
  return Array.from({ length }, (_, index) => {
    const date = addDays(startDate, index)
    return {
      date,
      key: dateKey(date),
    }
  })
}

function clampDateToMonth(date, monthDate) {
  return createCalendarDate(
    yearOf(monthDate),
    monthOf(monthDate),
    Math.min(dayOfMonth(date), daysInMonth(monthDate)),
  )
}

function capitalizeFirst(value) {
  if (!value) return value
  return value.charAt(0).toUpperCase() + value.slice(1)
}

function normalizeShortMonthLabel(value) {
  return value.replace('.', '').trim().toLowerCase()
}

function buildWeekdayLabels(locale, _timeZone, width = 'long') {
  const firstSunday = createCalendarDate(2026, 0, 4)
  return Array.from({ length: 7 }, (_, index) => {
    const date = addDays(firstSunday, index)
    return capitalizeFirst(new Intl.DateTimeFormat(locale, {
      weekday: width,
      timeZone: 'UTC',
    }).format(date))
  })
}

function formatCellLabel(date, muted, locale, timeZone) {
  if (dayOfMonth(date) === 1) {
    const shortMonth = normalizeShortMonthLabel(new Intl.DateTimeFormat(locale, {
      month: 'short',
      timeZone: 'UTC',
    }).format(date))
    return muted ? `${shortMonth} ${dayOfMonth(date)}` : `${dayOfMonth(date)}`
  }

  return String(dayOfMonth(date)).padStart(2, '0')
}

function formatLongDate(date, locale, timeZone) {
  return capitalizeFirst(new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone,
  }).format(date))
}

function formatShortDate(date, locale, timeZone) {
  const day = new Intl.DateTimeFormat(locale, { day: 'numeric', timeZone }).format(date)
  const shortMonth = normalizeShortMonthLabel(new Intl.DateTimeFormat(locale, {
    month: 'short',
    timeZone,
  }).format(date))

  return `${day} ${shortMonth}`
}

function formatRangeLabel(view, selectedDate, visibleMonth, locale, timeZone) {
  if (view === 'month') {
    return capitalizeFirst(new Intl.DateTimeFormat(locale, {
      month: 'long',
      year: 'numeric',
      timeZone,
    }).format(visibleMonth))
  }

  if (view === 'day') {
    return formatLongDate(selectedDate, locale, timeZone)
  }

  const start = view === 'work' ? startOfWorkWeek(selectedDate) : startOfWeek(selectedDate)
  const end = addDays(start, view === 'work' ? 4 : 6)

  if (monthOf(start) === monthOf(end) && yearOf(start) === yearOf(end)) {
    const monthLabel = normalizeShortMonthLabel(new Intl.DateTimeFormat(locale, {
      month: 'short',
      timeZone: 'UTC',
    }).format(start))
    return `${dayOfMonth(start)}-${dayOfMonth(end)} ${monthLabel} ${yearOf(start)}`
  }

  return `${formatShortDate(start, locale, timeZone)} - ${formatShortDate(end, locale, timeZone)} ${yearOf(end)}`
}

function eventMeta(event) {
  return [event.location, event.calendar].filter(Boolean).join(' · ')
}

function isPlanLinkedCalendarItem(event) {
  return event.raw?.generatedFromCard || event.sourceId === 'planos'
}

function isPlanTaskCalendarItem(event) {
  return isPlanLinkedCalendarItem(event) && (event.cardKind === 'TAREFA' || event.raw?.cardKind === 'TAREFA')
}

function calendarItemPrimaryTime(event) {
  return isPlanTaskCalendarItem(event) ? event.end : event.start
}

function calendarItemTimeRangeLabel(event) {
  return isPlanTaskCalendarItem(event) ? event.end : `${event.start} - ${event.end}`
}

function sortCalendarItemsForDay(events) {
  return [...events].sort((left, right) => {
    const timeComparison = calendarItemPrimaryTime(left).localeCompare(calendarItemPrimaryTime(right))
    if (timeComparison !== 0) return timeComparison
    return left.title.localeCompare(right.title)
  })
}

function EventDialog({
  selectedDate,
  initialEvent = null,
  onClose,
  onCreate,
  formatLongDateLabel,
}) {
  const [title, setTitle] = useState(initialEvent?.title ?? '')
  const [start, setStart] = useState(initialEvent?.start ?? '09:00')
  const [end, setEnd] = useState(initialEvent?.end ?? '10:00')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState(null)

  const submit = async (event) => {
    event.preventDefault()
    if (!title.trim() || isSubmitting) return

    if (!start || !end || end <= start) {
      setSubmitError('O horário de fim precisa ser depois do início.')
      return
    }

    setIsSubmitting(true)
    setSubmitError(null)

    try {
      await onCreate({
        title: title.trim(),
        date: initialEvent?.date ?? dateKey(selectedDate),
        start,
        end,
        description: initialEvent?.description ?? initialEvent?.raw?.description ?? '',
        sourceId: initialEvent?.sourceId ?? 'arthur',
        calendar: initialEvent?.calendar ?? 'Arthur Fleming',
        location: initialEvent?.location || 'Plan Things',
      })
      onClose()
    } catch (error) {
      setSubmitError(error?.message ?? 'Não foi possível criar o evento.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className={styles.dialogBackdrop} role="presentation">
      <form
        className={styles.eventDialog}
        onSubmit={submit}
        role="dialog"
        aria-modal="true"
        aria-label={initialEvent ? 'Editar evento' : 'Novo evento'}
      >
        <div className={styles.dialogHeader}>
          <h2>{initialEvent ? 'Editar evento' : 'Novo evento'}</h2>
          <button type="button" onClick={onClose} aria-label="Fechar"><Icon.X /></button>
        </div>
        <label className={styles.dialogField}>
          <span>Título</span>
          <input value={title} onChange={(event) => setTitle(event.target.value)} autoFocus />
        </label>
        <div className={styles.dialogRow}>
          <label className={styles.dialogField}>
            <span>Início</span>
            <input type="time" value={start} onChange={(event) => setStart(event.target.value)} />
          </label>
          <label className={styles.dialogField}>
            <span>Fim</span>
            <input type="time" value={end} onChange={(event) => setEnd(event.target.value)} />
          </label>
        </div>
        <p className={styles.dialogDate}>{formatLongDateLabel(selectedDate)}</p>
        {submitError && <p className={styles.dialogError}>{submitError}</p>}
        <button type="submit" className={styles.dialogSubmit} disabled={!title.trim() || isSubmitting}>
          {isSubmitting ? 'Salvando...' : 'Salvar'}
        </button>
      </form>
    </div>
  )
}

function AgendaList({
  date,
  events,
  onClose,
  onCreate,
  onEditEvent,
  onDeleteEvent,
  formatShortDateLabel,
  formatEventPrimaryTime,
  formatEventEndTime,
}) {
  return (
    <aside className={styles.agendaPanel}>
      <div className={styles.agendaHeader}>
        <div>
          <p>{formatShortDateLabel(date)}</p>
          <span>{events.length} eventos</span>
        </div>
        <button type="button" className={styles.agendaCloseButton} onClick={onClose} aria-label="Fechar agenda">
          <Icon.X />
        </button>
      </div>
      <div className={styles.agendaList}>
        {events.length ? events.map((event) => {
          const linkedToPlan = isPlanLinkedCalendarItem(event)
          const planTask = isPlanTaskCalendarItem(event)

          return (
            <div key={event.id} className={styles.agendaItem} style={{ '--event-color': event.color }}>
              <div className={styles.agendaTime}>
                {formatEventPrimaryTime(event)}
                {!planTask && <span>{formatEventEndTime(event)}</span>}
              </div>
              <div className={styles.agendaItemContent}>
                <p>{event.title}</p>
                {eventMeta(event) && <span>{eventMeta(event)}</span>}
                {!linkedToPlan && (
                  <div className={styles.agendaItemActions}>
                    <button
                      type="button"
                      className={styles.agendaAction}
                      onClick={() => onEditEvent(event)}
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      className={`${styles.agendaAction} ${styles.agendaActionDanger}`}
                      onClick={() => onDeleteEvent(event)}
                    >
                      Excluir
                    </button>
                  </div>
                )}
              </div>
            </div>
          )
        }) : (
          <div className={styles.agendaEmpty}>
            <Icon.Calendar />
            <p>Nenhum evento neste dia</p>
            <button type="button" onClick={onCreate}>Criar evento</button>
          </div>
        )}
      </div>
    </aside>
  )
}

function CalendarLoadingState({ styles }) {
  return (
    <section className={styles.calendarLoading} aria-hidden="true">
      <div className={styles.calendarLoadingGrid}>
        {Array.from({ length: 35 }, (_, index) => (
          <div key={`calendar-loading-${index}`} className={styles.calendarLoadingCell}>
            <span className={`${styles.calendarLoadingBlock} ${styles.calendarLoadingDay}`} />
            <span className={`${styles.calendarLoadingBlock} ${styles.calendarLoadingEvent}`} />
            <span className={`${styles.calendarLoadingBlock} ${styles.calendarLoadingEventShort}`} />
          </div>
        ))}
      </div>
    </section>
  )
}

export function CalendarWorkspaceView({ embedded = false }) {
  const { generalPreferences, formatIntl, formatClockTime } = usePreferences()
  const locale = generalPreferences.language
  const timeZone = generalPreferences.timezone
  const initialToday = useMemo(() => currentDateInTimeZone(timeZone), [timeZone])
  const [selectedDate, setSelectedDate] = useState(() => initialToday)
  const [visibleMonth, setVisibleMonth] = useState(() => startOfMonth(initialToday))
  const [view, setView] = useState(() => (typeof window !== 'undefined' && window.matchMedia('(max-width: 768px)').matches ? 'day' : 'month'))
  const [search, setSearch] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingEvent, setEditingEvent] = useState(null)
  const [agendaPanelOpen, setAgendaPanelOpen] = useState(true)
  const [notification, setNotification] = useState(null)
  const [deleteError, setDeleteError] = useState(null)
  const notificationTimerRef = useRef(null)
  const today = useMemo(() => currentDateInTimeZone(timeZone), [timeZone])
  const { filteredEvents, isLoading, loadError, createEvent, updateEvent, deleteEvent } = useCalendarEvents({ search })
  const weekdayLabels = useMemo(() => buildWeekdayLabels(locale, timeZone, 'long'), [locale, timeZone])
  const formatLongDateLabel = (date) => formatLongDate(date, locale, timeZone)
  const formatShortDateLabel = (date) => formatShortDate(date, locale, timeZone)
  const formatShortMonthLabel = (date) => capitalizeFirst(
    normalizeShortMonthLabel(formatIntl(date, { month: 'short' })),
  )
  const formatEventPrimaryTime = (event) => formatClockTime(calendarItemPrimaryTime(event))
  const formatEventEndTime = (event) => formatClockTime(event.end)
  const formatEventRangeLabel = (event) => {
    if (isPlanTaskCalendarItem(event)) {
      return formatClockTime(event.end)
    }

    return `${formatClockTime(event.start)} - ${formatClockTime(event.end)}`
  }

  const cells = useMemo(() => buildMonthCells(visibleMonth), [visibleMonth])
  const eventsByDate = useMemo(() => {
    const grouped = filteredEvents.reduce((accumulator, event) => {
      accumulator[event.date] = accumulator[event.date] ? [...accumulator[event.date], event] : [event]
      return accumulator
    }, {})

    return Object.fromEntries(Object.entries(grouped).map(([key, events]) => [key, sortCalendarItemsForDay(events)]))
  }, [filteredEvents])
  const selectedEvents = eventsByDate[dateKey(selectedDate)] ?? []
  const viewStatus = VIEW_OPTIONS.find((option) => option.id === view)?.status ?? 'Vista mensal'
  const calendarRangeLabel = useMemo(
    () => formatRangeLabel(view, selectedDate, visibleMonth, locale, timeZone),
    [locale, selectedDate, timeZone, view, visibleMonth],
  )
  const rangeDays = useMemo(() => {
    if (view === 'day') return buildRangeDays(selectedDate, 1)
    if (view === 'work') return buildRangeDays(startOfWorkWeek(selectedDate), 5)
    if (view === 'week') return buildRangeDays(startOfWeek(selectedDate), 7)
    return []
  }, [selectedDate, view])

  useEffect(() => {
    const nextToday = currentDateInTimeZone(timeZone)
    setSelectedDate(nextToday)
    setVisibleMonth(startOfMonth(nextToday))
  }, [timeZone])

  useEffect(() => () => {
    if (notificationTimerRef.current) {
      clearTimeout(notificationTimerRef.current)
    }
  }, [])

  const showNotification = (message) => {
    if (notificationTimerRef.current) {
      clearTimeout(notificationTimerRef.current)
    }
    setNotification(message)
    notificationTimerRef.current = setTimeout(() => {
      setNotification(null)
      notificationTimerRef.current = null
    }, 2600)
  }

  const goToday = () => {
    setSelectedDate(today)
    setVisibleMonth(startOfMonth(today))
  }

  const selectDate = (date) => {
    setSelectedDate(date)
    if (view === 'month') {
      setAgendaPanelOpen(true)
    }
    if (monthOf(date) !== monthOf(visibleMonth) || yearOf(date) !== yearOf(visibleMonth)) {
      setVisibleMonth(startOfMonth(date))
    }
  }

  const shiftMonth = (amount) => {
    const nextMonth = addMonths(visibleMonth, amount)
    setVisibleMonth(nextMonth)
    setSelectedDate((current) => clampDateToMonth(current, nextMonth))
  }

  const openCreateDialog = () => {
    setEditingEvent(null)
    setDialogOpen(true)
  }

  const handleEditEvent = (event) => {
    if (event.raw?.generatedFromCard) {
      showNotification('Eventos vinculados a cartões devem ser editados no quadro.')
      return
    }

    setEditingEvent(event)
    setDialogOpen(true)
  }

  const handleSaveEvent = async (event) => {
    if (editingEvent) {
      const updatedEvent = await updateEvent(editingEvent.id, event)
      showNotification(`Evento "${updatedEvent.title}" atualizado`)
      setEditingEvent(null)
      return updatedEvent
    }

    const createdEvent = await createEvent(event)
    showNotification(`Evento "${createdEvent.title}" criado`)
    return createdEvent
  }

  const handleDeleteEvent = async (event) => {
    await handleDeleteEventAttempt(event)
  }

  const handleDeleteEventAttempt = async (event, options = {}) => {
    if (event.raw?.generatedFromCard) {
      showNotification('Eventos vinculados a cartões devem ser removidos no quadro.')
      return
    }

    if (!options.skipConfirm) {
      const shouldDelete = window.confirm(`Deseja excluir o evento "${event.title}"?`)
      if (!shouldDelete) {
        return
      }
    }

    try {
      await deleteEvent(event.id)
      setDeleteError(null)
      showNotification(`Evento "${event.title}" excluído`)
    } catch (error) {
      const message = error?.message ?? `Não foi possível excluir "${event.title}".`
      setDeleteError({
        event,
        message,
      })
      showNotification(message)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  const renderMonthGrid = () => (
    <div className={styles.monthGrid} aria-label="Calendário mensal">
      {weekdayLabels.map((weekday) => (
        <div key={weekday} className={styles.weekday}>{weekday}</div>
      ))}

      {cells.map(({ date, key, muted }) => {
        const dayEvents = eventsByDate[key] ?? []
        const selected = isSameDate(date, selectedDate)
        const isToday = isSameDate(date, today)
        return (
          <button
            type="button"
            key={key}
            className={`${styles.dayCell} ${muted ? styles.dayCellMuted : ''} ${selected ? styles.dayCellSelected : ''}`}
            onClick={() => selectDate(date)}
          >
            <span className={`${styles.dayNumber} ${isToday ? styles.dayNumberToday : ''}`}>
              {formatCellLabel(date, muted, locale, timeZone)}
            </span>
            <span className={styles.eventStack}>
              {dayEvents.slice(0, 3).map((event) => (
                <span key={event.id} className={styles.eventChip} style={{ '--event-color': event.color }}>
                  <span>{formatEventRangeLabel(event)}</span>
                  {event.title}
                </span>
              ))}
              {dayEvents.length > 3 && <span className={styles.moreEvents}>+{dayEvents.length - 3} eventos</span>}
            </span>
          </button>
        )
      })}
    </div>
  )

  const renderRangeView = () => (
    <section className={styles.rangeWorkspace} aria-label={view === 'day' ? 'Calendário diário' : 'Calendário semanal'}>
      {rangeDays.map(({ date, key }) => {
        const dayEvents = eventsByDate[key] ?? []
        const selected = isSameDate(date, selectedDate)
        const isToday = isSameDate(date, today)
        const weekDayIndex = weekdayOf(date)

        return (
          <article key={key} className={`${styles.rangeDay} ${selected ? styles.rangeDaySelected : ''}`}>
            <button type="button" className={styles.rangeDayHeader} onClick={() => selectDate(date)}>
              <span className={styles.rangeWeekday}>{weekdayLabels[weekDayIndex]}</span>
              <span className={`${styles.rangeDayNumber} ${isToday ? styles.dayNumberToday : ''}`}>{dayOfMonth(date)}</span>
              <span>{formatShortMonthLabel(date)}</span>
            </button>
            <div className={styles.rangeEventList}>
              {dayEvents.length ? dayEvents.map((event) => (
                <div key={event.id} className={styles.rangeEvent} style={{ '--event-color': event.color }}>
                  <span>{formatEventRangeLabel(event)}</span>
                  <p>{event.title}</p>
                  {eventMeta(event) && <small>{eventMeta(event)}</small>}
                  {!isPlanLinkedCalendarItem(event) && (
                    <div className={styles.rangeEventActions}>
                      <button
                        type="button"
                        className={styles.agendaAction}
                        onClick={() => handleEditEvent(event)}
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        className={`${styles.agendaAction} ${styles.agendaActionDanger}`}
                        onClick={() => handleDeleteEvent(event)}
                      >
                        Excluir
                      </button>
                    </div>
                  )}
                </div>
              )) : (
                <button type="button" className={styles.rangeEmpty} onClick={() => {
                  selectDate(date)
                  setDialogOpen(true)
                }}>
                  Nenhum evento
                </button>
              )}
            </div>
          </article>
        )
      })}
    </section>
  )

  const commandHeaderActions = (
    <div className={styles.commandHeaderActions}>
      <div className={styles.commandLeft}>
        <button type="button" className={styles.primaryButton} onClick={openCreateDialog}>
          <Icon.Calendar />
          Novo evento
        </button>
        {VIEW_OPTIONS.map((mode) => (
          <button
            type="button"
            key={mode.id}
            className={`${styles.commandButton} ${view === mode.id ? styles.commandButtonActive : ''}`}
            onClick={() => setView(mode.id)}
          >
            {mode.label}
          </button>
        ))}
      </div>

      <div className={styles.commandRight}>
        <div className={styles.searchWrap}>
          <Icon.Search />
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar eventos" />
          {search && <button type="button" onClick={() => setSearch('')} aria-label="Limpar busca"><Icon.X /></button>}
        </div>
        <button type="button" className={styles.commandButton} onClick={() => showNotification('Filtros avançados em breve')}><Icon.Filter />Filtro<Icon.ChevDown /></button>
        <button type="button" className={styles.commandButton} onClick={() => showNotification('Link do calendário copiado')}><Icon.Share />Compartilhar<Icon.ChevDown /></button>
        <button type="button" className={styles.commandButton} onClick={handlePrint}><Icon.Print />Imprimir</button>
        {!embedded ? <InviteNotifications /> : null}
      </div>
    </div>
  )

  const monthHeaderPrimary = (
    <div className={styles.monthHeaderPrimary}>
      <button type="button" className={styles.todayButton} onClick={goToday}>Hoje</button>
      <button type="button" className={styles.iconButton} onClick={() => shiftMonth(-1)} aria-label="Mês anterior"><Icon.ChevLeft /></button>
      <button type="button" className={styles.iconButton} onClick={() => shiftMonth(1)} aria-label="Próximo mês"><Icon.ChevRight /></button>
      <h1>{calendarRangeLabel}</h1>
      <Icon.ChevDown />
      <span className={styles.viewStatus}>{viewStatus}</span>
    </div>
  )

  const calendarWorkspace = (
    <>
      {loadError && (
        <div className={styles.loadError} role="status" aria-live="polite">
          {loadError}
        </div>
      )}

      {deleteError && (
        <div className={styles.deleteError} role="status" aria-live="polite">
          <span>{deleteError.message}</span>
          <button
            type="button"
            className={styles.deleteErrorRetry}
            onClick={() => handleDeleteEventAttempt(deleteError.event, { skipConfirm: true })}
          >
            Tentar novamente
          </button>
        </div>
      )}

      <div className={`${styles.monthHeader} ${embedded ? styles.monthHeaderEmbedded : ''}`}>
        {embedded ? (
          <>
            {monthHeaderPrimary}
            {commandHeaderActions}
          </>
        ) : (
          monthHeaderPrimary
        )}
      </div>

      {isLoading && !loadError ? (
        <CalendarLoadingState styles={styles} />
      ) : view === 'day' || view === 'week' || view === 'work' ? (
        renderRangeView()
      ) : (
        <section className={`${styles.calendarWorkspace} ${agendaPanelOpen ? '' : styles.calendarWorkspaceFull}`}>
          {renderMonthGrid()}
          {agendaPanelOpen && (
            <AgendaList
              date={selectedDate}
              events={selectedEvents}
              onClose={() => setAgendaPanelOpen(false)}
              onCreate={openCreateDialog}
              onEditEvent={handleEditEvent}
              onDeleteEvent={handleDeleteEvent}
              formatShortDateLabel={formatShortDateLabel}
              formatEventPrimaryTime={formatEventPrimaryTime}
              formatEventEndTime={formatEventEndTime}
            />
          )}
        </section>
      )}
    </>
  )

  const calendarOverlays = (
    <>
      {dialogOpen && (
        <EventDialog
          selectedDate={editingEvent ? (dateFromKey(editingEvent.date) ?? selectedDate) : selectedDate}
          initialEvent={editingEvent}
          onClose={() => {
            setDialogOpen(false)
            setEditingEvent(null)
          }}
          onCreate={handleSaveEvent}
          formatLongDateLabel={formatLongDateLabel}
        />
      )}

      {notification && (
        <div className={styles.notification} role="status" aria-live="polite">
          {notification}
        </div>
      )}
    </>
  )

  if (embedded) {
    return (
      <>
        <div className={`${styles.main} ${styles.mainEmbedded}`}>
          {calendarWorkspace}
        </div>
        {calendarOverlays}
      </>
    )
  }

  return (
    <AppThemeScope>
      <ProductAppShell
        contentClassName={styles.main}
        contentTag="main"
        mobileTitle="Calendário"
      >
        <PlanPageHeader
          title="Calendário"
          icon={<Icon.Calendar />}
          sticky
          tone="solid"
          titleSize="medium"
          actions={commandHeaderActions}
        />

        {calendarWorkspace}
      </ProductAppShell>

      {calendarOverlays}
    </AppThemeScope>
  )
}

export default function CalendarPage() {
  return <CalendarWorkspaceView />
}
