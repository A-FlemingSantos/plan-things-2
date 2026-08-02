import { useEffect, useMemo, useState } from 'react'
import { useTransientNotification } from '../../../../shared/hooks/useTransientNotification.js'
import LoadingScreen from '../../../../shared/components/Loader/LoadingScreen.jsx'
import ProductAppShell from '../../../../shared/components/ProductAppShell/ProductAppShell.jsx'
import {
  addDays,
  addMonths,
  buildMonthCells,
  buildRangeDays,
  buildWeekdayLabels,
  capitalizeFirst,
  clampDateToMonth,
  currentDateInTimeZone,
  dateFromKey,
  dayOfMonth,
  formatCellLabel,
  formatLongDate,
  formatRangeLabel,
  formatShortDate,
  isSameDate,
  monthOf,
  normalizeShortMonthLabel,
  startOfMonth,
  startOfWeek,
  startOfWorkWeek,
  utcCalendarDateKey,
  weekdayOf,
  yearOf,
} from '../../../../shared/utils/dateTime/index.js'
import { useCalendarEvents } from '../../hooks/useCalendarEvents.js'
import { usePreferences } from '../../../preferences/context/PreferencesContext.jsx'
import AppThemeScope from '../../../preferences/components/AppThemeScope/AppThemeScope.jsx'
import {
  CalendarIcon,
  ChevDownIcon,
  ChevLeftIcon,
  ChevRightIcon,
  FilterIcon,
  PrintIcon,
  SearchIcon,
  ShareIcon,
  XIcon,
} from '../../../../shared/components/icons/index.js'
import styles from './CalendarWorkspaceView.module.css'

const VIEW_OPTIONS = [
  { id: 'day', label: 'Dia', status: 'Vista diária' },
  { id: 'work', label: 'Semana de trabalho', status: 'Semana útil' },
  { id: 'week', label: 'Semana', status: 'Vista semanal' },
  { id: 'month', label: 'Mês', status: 'Vista mensal' },
]

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
        date: initialEvent?.date ?? utcCalendarDateKey(selectedDate),
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
          <button type="button" onClick={onClose} aria-label="Fechar"><XIcon /></button>
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
          <XIcon />
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
            <CalendarIcon />
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
    <LoadingScreen
      className={styles.calendarLoading}
      label="Carregando calendário"
    />
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
  const { notification, pushNotification: showNotification } = useTransientNotification()
  const [deleteError, setDeleteError] = useState(null)
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
  const selectedEvents = eventsByDate[utcCalendarDateKey(selectedDate)] ?? []
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
          <CalendarIcon />
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
          <SearchIcon />
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar eventos" />
          {search && <button type="button" onClick={() => setSearch('')} aria-label="Limpar busca"><XIcon /></button>}
        </div>
        <button type="button" className={styles.commandButton} onClick={() => showNotification('Filtros avançados em breve')}><FilterIcon />Filtro<ChevDownIcon /></button>
        <button type="button" className={styles.commandButton} onClick={() => showNotification('Link do calendário copiado')}><ShareIcon />Compartilhar<ChevDownIcon /></button>
        <button type="button" className={styles.commandButton} onClick={handlePrint}><PrintIcon />Imprimir</button>
      </div>
    </div>
  )

  const monthHeaderPrimary = (
    <div className={styles.monthHeaderPrimary}>
      <button type="button" className={styles.todayButton} onClick={goToday}>Hoje</button>
      <button type="button" className={styles.iconButton} onClick={() => shiftMonth(-1)} aria-label="Mês anterior"><ChevLeftIcon /></button>
      <button type="button" className={styles.iconButton} onClick={() => shiftMonth(1)} aria-label="Próximo mês"><ChevRightIcon /></button>
      <h1>{calendarRangeLabel}</h1>
      <ChevDownIcon />
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
      >
        {commandHeaderActions}

        {calendarWorkspace}
      </ProductAppShell>

      {calendarOverlays}
    </AppThemeScope>
  )
}

export default CalendarWorkspaceView
