import { useMemo, useState } from 'react'
import ProductAppShell from '../../../../shared/components/ProductAppShell/ProductAppShell.jsx'
import SidebarAccountMenu from '../../../../shared/components/SidebarAccountMenu/SidebarAccountMenu.jsx'
import { ROUTES } from '../../../../shared/config/routes.js'
import { useWorkspaceNavigation } from '../../../../shared/hooks/useWorkspaceNavigation.js'
import styles from './CalendarPage.module.css'

const WEEKDAYS = ['Domingo', 'Segunda-feira', 'Terca-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sabado']
const MINI_WEEKDAYS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']
const MONTHS = [
  'Janeiro', 'Fevereiro', 'Marco', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
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

const NAV_ITEMS = [
  { id: 'home', label: 'Home', Icon: Icon.Home, path: ROUTES.workspace },
  { id: 'canvas', label: 'Canvas', Icon: Icon.Canvas, path: ROUTES.canvas },
  { id: 'calendar', label: 'Calendar', Icon: Icon.Calendar, path: ROUTES.calendar },
  { id: 'files', label: 'Files', Icon: Icon.Files, path: ROUTES.files },
]

const INITIAL_EVENTS = [
  { id: 'evt-1', title: 'Daily product sync', date: '2026-04-09', start: '09:00', end: '09:30', calendar: 'Arthur Fleming', color: '#0f6cbd', location: 'Teams' },
  { id: 'evt-2', title: 'Sprint planning', date: '2026-04-13', start: '10:00', end: '11:30', calendar: 'rm95433', color: '#0f703a', location: 'Workspace' },
  { id: 'evt-3', title: 'Design review', date: '2026-04-15', start: '14:00', end: '15:00', calendar: 'Gmail', color: '#b146c2', location: 'Studio' },
  { id: 'evt-4', title: 'Print agenda notes', date: '2026-04-17', start: '16:00', end: '16:20', calendar: 'Arthur Fleming', color: '#d83b01', location: 'Desk' },
  { id: 'evt-5', title: 'Release checkpoint', date: '2026-04-23', start: '11:00', end: '11:45', calendar: 'Arthur Fleming', color: '#0f6cbd', location: 'Teams' },
]

const CALENDAR_SOURCES = [
  { id: 'arthur', name: 'arthurfleming.santos@o...', color: '#0f6cbd' },
  { id: 'student', name: 'rm95433@estudante.fi...', color: '#0f703a' },
  { id: 'gmail', name: 'flemingsantosa@gmail...', color: '#b146c2' },
]

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

function formatCellLabel(date, muted) {
  if (date.getDate() === 1) {
    return muted ? `${MONTHS[date.getMonth()].slice(0, 3)} ${date.getDate()}` : `${date.getDate()}`
  }

  return String(date.getDate()).padStart(2, '0')
}

function MiniCalendar({ monthDate, selectedDate, onSelectDate }) {
  return (
    <div className={styles.miniCalendar}>
      <div className={styles.miniCalendarHeader}>
        <button type="button" className={styles.sidebarToggle} aria-label="Expandir mes"><Icon.ChevDown /></button>
        <span>{MONTHS[monthDate.getMonth()]} {monthDate.getFullYear()}</span>
        <div className={styles.miniCalendarNav}>
          <button type="button" aria-label="Mes anterior"><Icon.ChevLeft /></button>
          <button type="button" aria-label="Proximo mes"><Icon.ChevRight /></button>
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
      id: `evt-${Date.now()}`,
      title: title.trim(),
      date: dateKey(selectedDate),
      start,
      end,
      calendar: 'Arthur Fleming',
      color: '#0f6cbd',
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
          <span>Titulo</span>
          <input value={title} onChange={(event) => setTitle(event.target.value)} autoFocus />
        </label>
        <div className={styles.dialogRow}>
          <label className={styles.dialogField}>
            <span>Inicio</span>
            <input type="time" value={start} onChange={(event) => setStart(event.target.value)} />
          </label>
          <label className={styles.dialogField}>
            <span>Fim</span>
            <input type="time" value={end} onChange={(event) => setEnd(event.target.value)} />
          </label>
        </div>
        <p className={styles.dialogDate}>{selectedDate.getDate()} de {MONTHS[selectedDate.getMonth()]} de {selectedDate.getFullYear()}</p>
        <button type="submit" className={styles.dialogSubmit} disabled={!title.trim()}>Salvar</button>
      </form>
    </div>
  )
}

export default function CalendarPage() {
  const today = new Date()
  const [selectedDate, setSelectedDate] = useState(today)
  const [visibleMonth, setVisibleMonth] = useState(startOfMonth(today))
  const [view, setView] = useState('month')
  const [search, setSearch] = useState('')
  const [events, setEvents] = useState(INITIAL_EVENTS)
  const [dialogOpen, setDialogOpen] = useState(false)
  const { activeNav, handleNavItemClick } = useWorkspaceNavigation()

  const cells = useMemo(() => buildMonthCells(visibleMonth), [visibleMonth])
  const visibleEvents = useMemo(() => {
    const term = search.trim().toLowerCase()
    return events.filter((event) => !term || event.title.toLowerCase().includes(term) || event.location.toLowerCase().includes(term))
  }, [events, search])
  const eventsByDate = useMemo(() => {
    return visibleEvents.reduce((grouped, event) => {
      grouped[event.date] = grouped[event.date] ? [...grouped[event.date], event] : [event]
      return grouped
    }, {})
  }, [visibleEvents])
  const selectedEvents = eventsByDate[dateKey(selectedDate)] ?? []

  const goToday = () => {
    setSelectedDate(today)
    setVisibleMonth(startOfMonth(today))
  }

  const selectDate = (date) => {
    setSelectedDate(date)
    if (date.getMonth() !== visibleMonth.getMonth() || date.getFullYear() !== visibleMonth.getFullYear()) {
      setVisibleMonth(startOfMonth(date))
    }
  }

  const renderSidebarSecondaryContent = ({ collapsed }) => collapsed ? null : (
    <div className={styles.calendarSidebarContent}>
      <MiniCalendar monthDate={visibleMonth} selectedDate={selectedDate} onSelectDate={selectDate} />

      <button type="button" className={styles.addCalendarButton}>
        <Icon.Plus />
        Adicionar calendario
      </button>

      <div className={styles.calendarSources}>
        {CALENDAR_SOURCES.map((source) => (
          <button type="button" key={source.id} className={styles.calendarSource}>
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
            {['day', 'work', 'week', 'month', 'split'].map((mode) => (
              <button
                type="button"
                key={mode}
                className={`${styles.commandButton} ${view === mode ? styles.commandButtonActive : ''}`}
                onClick={() => setView(mode)}
              >
                {mode === 'day' && 'Dia'}
                {mode === 'work' && 'Semana de trabalho'}
                {mode === 'week' && 'Semana'}
                {mode === 'month' && 'Mes'}
                {mode === 'split' && 'Modo divisao'}
              </button>
            ))}
          </div>

          <div className={styles.commandRight}>
            <div className={styles.searchWrap}>
              <Icon.Search />
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar eventos" />
              {search && <button type="button" onClick={() => setSearch('')} aria-label="Limpar busca"><Icon.X /></button>}
            </div>
            <button type="button" className={styles.commandButton}><Icon.Filter />Filtro<Icon.ChevDown /></button>
            <button type="button" className={styles.commandButton}><Icon.Share />Compartilhar<Icon.ChevDown /></button>
            <button type="button" className={styles.commandButton}><Icon.Print />Imprimir</button>
          </div>
        </header>

        <div className={styles.monthHeader}>
          <button type="button" className={styles.todayButton} onClick={goToday}>Hoje</button>
          <button type="button" className={styles.iconButton} onClick={() => setVisibleMonth(addMonths(visibleMonth, -1))} aria-label="Mes anterior"><Icon.ChevLeft /></button>
          <button type="button" className={styles.iconButton} onClick={() => setVisibleMonth(addMonths(visibleMonth, 1))} aria-label="Proximo mes"><Icon.ChevRight /></button>
          <h1>{MONTHS[visibleMonth.getMonth()]} {visibleMonth.getFullYear()}</h1>
          <Icon.ChevDown />
          <span className={styles.viewStatus}>{view === 'month' ? 'Vista mensal' : 'Vista compacta'}</span>
        </div>

        <section className={styles.calendarWorkspace}>
          <div className={styles.monthGrid} aria-label="Calendario mensal">
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

          <aside className={styles.agendaPanel}>
            <div className={styles.agendaHeader}>
              <p>{selectedDate.getDate()} de {MONTHS[selectedDate.getMonth()]}</p>
              <span>{selectedEvents.length} eventos</span>
            </div>
            <div className={styles.agendaList}>
              {selectedEvents.length ? selectedEvents.map((event) => (
                <div key={event.id} className={styles.agendaItem} style={{ '--event-color': event.color }}>
                  <div className={styles.agendaTime}>{event.start}<span>{event.end}</span></div>
                  <div>
                    <p>{event.title}</p>
                    <span>{event.location} · {event.calendar}</span>
                  </div>
                </div>
              )) : (
                <div className={styles.agendaEmpty}>
                  <Icon.Calendar />
                  <p>Nenhum evento neste dia</p>
                  <button type="button" onClick={() => setDialogOpen(true)}>Criar evento</button>
                </div>
              )}
            </div>
          </aside>
        </section>
      </ProductAppShell>

      {dialogOpen && (
        <EventDialog
          selectedDate={selectedDate}
          onClose={() => setDialogOpen(false)}
          onCreate={(event) => setEvents((current) => [...current, event])}
        />
      )}
    </>
  )
}
