import { useEffect, useMemo, useRef, useState } from 'react'
import ProductAppShell from '../../../../shared/components/ProductAppShell/ProductAppShell.jsx'
import SidebarAccountMenu from '../../../../shared/components/SidebarAccountMenu/SidebarAccountMenu.jsx'
import { WORKSPACE_NAV_ITEMS } from '../../../../shared/config/workspaceNavigation.js'
import { useWorkspaceNavigation } from '../../../../shared/hooks/useWorkspaceNavigation.js'
import { useCalendarEvents } from '../../hooks/useCalendarEvents.js'
import styles from './CalendarPage.module.css'

const WEEKDAYS = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado']
const MINI_WEEKDAYS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']
const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

const VIEW_OPTIONS = [
  { id: 'day', label: 'Dia', status: 'Vista diária' },
  { id: 'work', label: 'Semana de trabalho', status: 'Semana útil' },
  { id: 'week', label: 'Semana', status: 'Vista semanal' },
  { id: 'month', label: 'Mês', status: 'Vista mensal' },
]

const Icon = {
  Logo: () => <svg width="17" height="17" viewBox="0 0 20 20" fill="none"><rect x="2" y="2" width="7" height="7" rx="2" fill="currentColor"/><rect x="11" y="2" width="7" height="7" rx="2" fill="currentColor" opacity=".35"/><rect x="2" y="11" width="7" height="7" rx="2" fill="currentColor" opacity=".55"/><rect x="11" y="11" width="7" height="7" rx="2" fill="currentColor" opacity=".75"/></svg>,
  Home: () => <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><path d="M2 6.5L8 2l6 4.5V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V6.5z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/><path d="M6 15V9h4v6" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/></svg>,
  Canvas: () => <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><rect x="1.5" y="1.5" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.3"/><rect x="8.5" y="1.5" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.3"/><rect x="1.5" y="8.5" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.3"/><rect x="8.5" y="8.5" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.3"/></svg>,
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

const NAV_ITEMS = WORKSPACE_NAV_ITEMS.map((item) => ({
  ...item,
  Icon:
    item.id === 'home' ? Icon.Home :
    item.id === 'canvas' ? Icon.Canvas :
    item.id === 'calendar' ? Icon.Calendar :
    Icon.Files,
}))

function startOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

function addDays(date, amount) {
  const next = new Date(date)
  next.setDate(next.getDate() + amount)
  return next
}

function addMonths(date, amount) {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1)
}

function startOfWeek(date) {
  return addDays(date, -date.getDay())
}

function startOfWorkWeek(date) {
  return addDays(date, date.getDay() === 0 ? -6 : 1 - date.getDay())
}

function daysInMonth(date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
}

function dateKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function isSameDate(a, b) {
  return dateKey(a) === dateKey(b)
}

function buildMonthCells(monthDate) {
  const first = startOfMonth(monthDate)
  const gridStart = addDays(first, -first.getDay())

  return Array.from({ length: 42 }, (_, index) => {
    const date = addDays(gridStart, index)
    return {
      date,
      key: dateKey(date),
      muted: date.getMonth() !== monthDate.getMonth(),
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
  return new Date(
    monthDate.getFullYear(),
    monthDate.getMonth(),
    Math.min(date.getDate(), daysInMonth(monthDate)),
  )
}

function formatCellLabel(date, muted) {
  if (date.getDate() === 1) {
    return muted ? `${MONTHS[date.getMonth()].slice(0, 3)} ${date.getDate()}` : `${date.getDate()}`
  }

  return String(date.getDate()).padStart(2, '0')
}

function formatLongDate(date) {
  return `${date.getDate()} de ${MONTHS[date.getMonth()]} de ${date.getFullYear()}`
}

function formatShortDate(date) {
  return `${date.getDate()} de ${MONTHS[date.getMonth()]}`
}

function formatRangeLabel(view, selectedDate, visibleMonth) {
  if (view === 'month') {
    return `${MONTHS[visibleMonth.getMonth()]} ${visibleMonth.getFullYear()}`
  }

  if (view === 'day') {
    return formatLongDate(selectedDate)
  }

  const start = view === 'work' ? startOfWorkWeek(selectedDate) : startOfWeek(selectedDate)
  const end = addDays(start, view === 'work' ? 4 : 6)

  if (start.getMonth() === end.getMonth()) {
    return `${start.getDate()}-${end.getDate()} de ${MONTHS[start.getMonth()]} ${start.getFullYear()}`
  }

  return `${formatShortDate(start)} - ${formatShortDate(end)} ${end.getFullYear()}`
}

function eventMeta(event) {
  return [event.location, event.calendar].filter(Boolean).join(' · ')
}

function MiniCalendar({ monthDate, selectedDate, onSelectDate, onShiftMonth }) {
  return (
    <div className={styles.miniCalendar}>
      <div className={styles.miniCalendarHeader}>
        <button type="button" className={styles.sidebarToggle} aria-label="Expandir mês"><Icon.ChevDown /></button>
        <span>{MONTHS[monthDate.getMonth()]} {monthDate.getFullYear()}</span>
        <div className={styles.miniCalendarNav}>
          <button type="button" aria-label="Mês anterior" onClick={() => onShiftMonth(-1)}><Icon.ChevLeft /></button>
          <button type="button" aria-label="Próximo mês" onClick={() => onShiftMonth(1)}><Icon.ChevRight /></button>
        </div>
      </div>

      <div className={styles.miniCalendarGrid}>
        {MINI_WEEKDAYS.map((weekday, index) => (
          <span key={`${weekday}-${index}`} className={styles.miniWeekday}>{weekday}</span>
        ))}
        {buildMonthCells(monthDate).map(({ date, key, muted }) => (
          <button
            key={key}
            type="button"
            className={`${styles.miniDay} ${muted ? styles.miniDayMuted : ''} ${isSameDate(date, selectedDate) ? styles.miniDaySelected : ''}`}
            onClick={() => onSelectDate(date)}
          >
            {date.getDate()}
          </button>
        ))}
      </div>
    </div>
  )
}

function EventDialog({ selectedDate, onClose, onCreate }) {
  const [title, setTitle] = useState('')
  const [start, setStart] = useState('09:00')
  const [end, setEnd] = useState('10:00')

  const submit = (event) => {
    event.preventDefault()
    if (!title.trim()) return
    onCreate({
      title: title.trim(),
      date: dateKey(selectedDate),
      start,
      end,
      sourceId: 'arthur',
      calendar: 'Arthur Fleming',
      location: 'Plan Things',
    })
    onClose()
  }

  return (
    <div className={styles.dialogBackdrop} role="presentation">
      <form className={styles.eventDialog} onSubmit={submit} role="dialog" aria-modal="true" aria-label="Novo evento">
        <div className={styles.dialogHeader}>
          <h2>Novo evento</h2>
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
        <p className={styles.dialogDate}>{formatLongDate(selectedDate)}</p>
        <button type="submit" className={styles.dialogSubmit} disabled={!title.trim()}>Salvar</button>
      </form>
    </div>
  )
}

function AgendaList({ date, events, onClose, onCreate }) {
  return (
    <aside className={styles.agendaPanel}>
      <div className={styles.agendaHeader}>
        <div>
          <p>{formatShortDate(date)}</p>
          <span>{events.length} eventos</span>
        </div>
        <button type="button" className={styles.agendaCloseButton} onClick={onClose} aria-label="Fechar agenda">
          <Icon.X />
        </button>
      </div>
      <div className={styles.agendaList}>
        {events.length ? events.map((event) => (
          <div key={event.id} className={styles.agendaItem} style={{ '--event-color': event.color }}>
            <div className={styles.agendaTime}>{event.start}<span>{event.end}</span></div>
            <div>
              <p>{event.title}</p>
              {eventMeta(event) && <span>{eventMeta(event)}</span>}
            </div>
          </div>
        )) : (
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

export default function CalendarPage() {
  const today = useMemo(() => new Date(), [])
  const [selectedDate, setSelectedDate] = useState(today)
  const [visibleMonth, setVisibleMonth] = useState(startOfMonth(today))
  const [view, setView] = useState('month')
  const [search, setSearch] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [agendaPanelOpen, setAgendaPanelOpen] = useState(true)
  const [notification, setNotification] = useState(null)
  const notificationTimerRef = useRef(null)
  const { activeNav, handleNavItemClick } = useWorkspaceNavigation()
  const { calendarSources, filteredEvents, createEvent } = useCalendarEvents({ search })

  const cells = useMemo(() => buildMonthCells(visibleMonth), [visibleMonth])
  const eventsByDate = useMemo(() => {
    return filteredEvents.reduce((grouped, event) => {
      grouped[event.date] = grouped[event.date] ? [...grouped[event.date], event] : [event]
      return grouped
    }, {})
  }, [filteredEvents])
  const selectedEvents = eventsByDate[dateKey(selectedDate)] ?? []
  const viewStatus = VIEW_OPTIONS.find((option) => option.id === view)?.status ?? 'Vista mensal'
  const rangeDays = useMemo(() => {
    if (view === 'day') return buildRangeDays(selectedDate, 1)
    if (view === 'work') return buildRangeDays(startOfWorkWeek(selectedDate), 5)
    if (view === 'week') return buildRangeDays(startOfWeek(selectedDate), 7)
    return []
  }, [selectedDate, view])

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
    if (date.getMonth() !== visibleMonth.getMonth() || date.getFullYear() !== visibleMonth.getFullYear()) {
      setVisibleMonth(startOfMonth(date))
    }
  }

  const shiftMonth = (amount) => {
    const nextMonth = addMonths(visibleMonth, amount)
    setVisibleMonth(nextMonth)
    setSelectedDate((current) => clampDateToMonth(current, nextMonth))
  }

  const handleCreateEvent = (event) => {
    const createdEvent = createEvent(event)
    showNotification(`Evento "${createdEvent.title}" criado`)
  }

  const handlePrint = () => {
    window.print()
  }

  const renderMonthGrid = () => (
    <div className={styles.monthGrid} aria-label="Calendário mensal">
      {WEEKDAYS.map((weekday) => (
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
              {formatCellLabel(date, muted)}
            </span>
            <span className={styles.eventStack}>
              {dayEvents.slice(0, 3).map((event) => (
                <span key={event.id} className={styles.eventChip} style={{ '--event-color': event.color }}>
                  <span>{event.start}</span>
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

        return (
          <article key={key} className={`${styles.rangeDay} ${selected ? styles.rangeDaySelected : ''}`}>
            <button type="button" className={styles.rangeDayHeader} onClick={() => selectDate(date)}>
              <span className={styles.rangeWeekday}>{WEEKDAYS[date.getDay()]}</span>
              <span className={`${styles.rangeDayNumber} ${isToday ? styles.dayNumberToday : ''}`}>{date.getDate()}</span>
              <span>{MONTHS[date.getMonth()]}</span>
            </button>
            <div className={styles.rangeEventList}>
              {dayEvents.length ? dayEvents.map((event) => (
                <div key={event.id} className={styles.rangeEvent} style={{ '--event-color': event.color }}>
                  <span>{event.start} - {event.end}</span>
                  <p>{event.title}</p>
                  {eventMeta(event) && <small>{eventMeta(event)}</small>}
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

  const renderSidebarSecondaryContent = ({ collapsed }) => collapsed ? null : (
    <div className={styles.calendarSidebarContent}>
      <MiniCalendar
        monthDate={visibleMonth}
        selectedDate={selectedDate}
        onSelectDate={selectDate}
        onShiftMonth={shiftMonth}
      />

      <button type="button" className={styles.addCalendarButton} onClick={() => showNotification('Conexão de calendário em breve')}>
        <Icon.Plus />
        Adicionar calendário
      </button>

      <div className={styles.calendarSources}>
        {calendarSources.map((source) => (
          <button type="button" key={source.id} className={styles.calendarSource} onClick={() => showNotification(`Fonte ativa: ${source.name}`)}>
            <span className={styles.sourceChevron}><Icon.ChevRight /></span>
            <span className={styles.sourceDot} style={{ background: source.color }} />
            <span>{source.name}</span>
          </button>
        ))}
      </div>
    </div>
  )

  const renderSidebarBottomContent = ({ collapsed }) => (
    <SidebarAccountMenu styles={styles} collapsed={collapsed} />
  )

  return (
    <>
      <ProductAppShell
        styles={styles}
        activeNav={activeNav}
        onNavItemClick={handleNavItemClick}
        navItems={NAV_ITEMS}
        LogoIcon={Icon.Logo}
        CollapseIcon={Icon.Collapse}
        ChevronIcon={Icon.Chevron}
        HintIcon={Icon.Popover}
        secondaryContent={renderSidebarSecondaryContent}
        bottomContent={renderSidebarBottomContent}
        contentClassName={styles.main}
        contentTag="main"
      >
        <header className={styles.commandBar}>
          <div className={styles.commandLeft}>
            <button type="button" className={styles.primaryButton} onClick={() => setDialogOpen(true)}>
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
          </div>
        </header>

        <div className={styles.monthHeader}>
          <button type="button" className={styles.todayButton} onClick={goToday}>Hoje</button>
          <button type="button" className={styles.iconButton} onClick={() => shiftMonth(-1)} aria-label="Mês anterior"><Icon.ChevLeft /></button>
          <button type="button" className={styles.iconButton} onClick={() => shiftMonth(1)} aria-label="Próximo mês"><Icon.ChevRight /></button>
          <h1>{formatRangeLabel(view, selectedDate, visibleMonth)}</h1>
          <Icon.ChevDown />
          <span className={styles.viewStatus}>{viewStatus}</span>
        </div>

        {view === 'day' || view === 'week' || view === 'work' ? (
          renderRangeView()
        ) : (
          <section className={`${styles.calendarWorkspace} ${agendaPanelOpen ? '' : styles.calendarWorkspaceFull}`}>
            {renderMonthGrid()}
            {agendaPanelOpen && (
              <AgendaList
                date={selectedDate}
                events={selectedEvents}
                onClose={() => setAgendaPanelOpen(false)}
                onCreate={() => setDialogOpen(true)}
              />
            )}
          </section>
        )}
      </ProductAppShell>

      {dialogOpen && (
        <EventDialog
          selectedDate={selectedDate}
          onClose={() => setDialogOpen(false)}
          onCreate={handleCreateEvent}
        />
      )}

      {notification && (
        <div className={styles.notification} role="status" aria-live="polite">
          {notification}
        </div>
      )}
    </>
  )
}
