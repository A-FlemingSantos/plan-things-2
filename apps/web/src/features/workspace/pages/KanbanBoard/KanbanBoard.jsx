import { useEffect, useMemo, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useAuth } from '../../../auth/context/AuthContext.jsx'
import { buildWorkspaceBoardPath } from '../../../../shared/config/routes.js'
import { WORKSPACE_NAV_ITEMS } from '../../../../shared/config/workspaceNavigation.js'
import ProductAppShell from '../../../../shared/components/ProductAppShell/ProductAppShell.jsx'
import PlanPageHeader from '../../../../shared/components/PlanPageHeader/PlanPageHeader.jsx'
import PlanSidebarSection from '../../../../shared/components/PlanSidebarSection/PlanSidebarSection.jsx'
import SidebarAccountMenu from '../../../../shared/components/SidebarAccountMenu/SidebarAccountMenu.jsx'
import CardModal from '../../components/CardModal/CardModal.jsx'
import AddColumnComposer from '../../components/AddColumnComposer/AddColumnComposer.jsx'
import BoardHeaderActions from '../../components/BoardHeaderActions/BoardHeaderActions.jsx'
import KanbanColumn from '../../components/KanbanColumn/KanbanColumn.jsx'
import { useWorkspaceNavigation } from '../../../../shared/hooks/useWorkspaceNavigation.js'
import { usePlans } from '../../context/PlansContext.jsx'
import { useBoardColumns } from '../../hooks/useBoardColumns.js'
import { useBoardDragAndDrop } from '../../hooks/useBoardDragAndDrop.js'
import { useResolvedPlanRoute } from '../../hooks/useResolvedPlanRoute.js'
import { useCalendarEvents } from '../../../calendar/hooks/useCalendarEvents.js'
import styles from './KanbanBoard.module.css'

/* ═══════════════════════════════════════════════════════════════
   ICONS
═══════════════════════════════════════════════════════════════ */
const Icon = {
  Home:     () => <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><path d="M2 6.5L8 2l6 4.5V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V6.5z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/><path d="M6 15V9h4v6" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/></svg>,
  Popover:  () => <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M4 2.5H2.5v7H9.5V8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/><path d="M5 7L9.5 2.5M7 2.5h2.5V5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  Canvas:   () => <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><rect x="1.5" y="1.5" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.3"/><rect x="8.5" y="1.5" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.3"/><rect x="1.5" y="8.5" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.3"/><rect x="8.5" y="8.5" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.3"/></svg>,
  Files:    () => <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><path d="M9 1.5H4a1.5 1.5 0 0 0-1.5 1.5v10A1.5 1.5 0 0 0 4 14.5h8A1.5 1.5 0 0 0 13.5 13V6L9 1.5z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/><path d="M9 1.5V6H13.5" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/></svg>,
  Plus:     () => <svg width="13" height="13" viewBox="0 0 14 14" fill="none"><path d="M7 2v10M2 7h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>,
  X:        () => <svg width="13" height="13" viewBox="0 0 14 14" fill="none"><path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>,
  Collapse: () => <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M9 2L5 7l4 5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  More:     () => <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="3" r="1" fill="currentColor"/><circle cx="7" cy="7" r="1" fill="currentColor"/><circle cx="7" cy="11" r="1" fill="currentColor"/></svg>,
  Check:    () => <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 6l2.5 2.5 5.5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  Edit:     () => <svg width="13" height="13" viewBox="0 0 14 14" fill="none"><path d="M9.5 2.5l2 2L4 12H2v-2L9.5 2.5z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/></svg>,
  Trash:    () => <svg width="13" height="13" viewBox="0 0 14 14" fill="none"><path d="M2 4h10M5 4V2.5h4V4M5.5 6.5v4M8.5 6.5v4M3 4l.8 8h6.4L11 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  Tag:      () => <svg width="13" height="13" viewBox="0 0 14 14" fill="none"><path d="M2 2h5l5 5-5 5-5-5V2z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/><circle cx="4.5" cy="4.5" r="1" fill="currentColor"/></svg>,
  User:     () => <svg width="13" height="13" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="5" r="2.5" stroke="currentColor" strokeWidth="1.3"/><path d="M2 12c0-2.2 2.2-4 5-4s5 1.8 5 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>,
  Clock:    () => <svg width="13" height="13" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.3"/><path d="M7 4v3l2 1.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>,
  Send:     () => <svg width="13" height="13" viewBox="0 0 14 14" fill="none"><path d="M12 2L2 6.5l4 1.5 1.5 4L12 2z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/></svg>,
  Filter:   () => <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 4h10M4 7h6M6 10h2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>,
  Share:    () => <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="11" cy="3" r="1.5" stroke="currentColor" strokeWidth="1.2"/><circle cx="3" cy="7" r="1.5" stroke="currentColor" strokeWidth="1.2"/><circle cx="11" cy="11" r="1.5" stroke="currentColor" strokeWidth="1.2"/><path d="M4.4 7.8L9.7 10M9.7 4L4.4 6.2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>,
  Logo:     () => <svg width="17" height="17" viewBox="0 0 20 20" fill="none"><rect x="2" y="2" width="7" height="7" rx="2" fill="currentColor"/><rect x="11" y="2" width="7" height="7" rx="2" fill="currentColor" opacity=".35"/><rect x="2" y="11" width="7" height="7" rx="2" fill="currentColor" opacity=".55"/><rect x="11" y="11" width="7" height="7" rx="2" fill="currentColor" opacity=".75"/></svg>,
  Chevron:  () => <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M4.5 3l3 3-3 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  Board:    () => <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><rect x="1" y="3" width="4" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.3"/><rect x="6" y="3" width="4" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.3"/><rect x="11" y="3" width="4" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.3"/></svg>,
  Inbox:    () => <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><path d="M3 3h10v10H3V3z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/><path d="M3 9h3l1.2 2h1.6L10 9h3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  Calendar: () => <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><rect x="2" y="3" width="12" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.3"/><path d="M5 1.8v2.8M11 1.8v2.8M2.5 6.5h11" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>,
  Switch:   () => <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><rect x="2" y="4" width="10" height="7.5" rx="1.5" stroke="currentColor" strokeWidth="1.3"/><path d="M5 2.5h7A1.5 1.5 0 0 1 13.5 4v5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>,
  Lock:     () => <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="3" y="6" width="8" height="6" rx="1.4" stroke="currentColor" strokeWidth="1.3"/><path d="M4.8 6V4.4a2.2 2.2 0 1 1 4.4 0V6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>,
  Comment:  () => <svg width="13" height="13" viewBox="0 0 14 14" fill="none"><path d="M12 7A5 5 0 0 1 4 11.5L1.5 12.5l1-2.5A5 5 0 1 1 12 7z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/></svg>,
  Priority: () => <svg width="13" height="13" viewBox="0 0 14 14" fill="none"><path d="M7 2v6M7 10.5v1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>,
  List:     () => <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><path d="M5 5h8M5 10.5h8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/><circle cx="2.5" cy="5" r=".9" fill="currentColor"/><circle cx="2.5" cy="10.5" r=".9" fill="currentColor"/></svg>,
  Link:     () => <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M6.4 9.6L9.6 6.4M6 11.5H4.8A2.8 2.8 0 1 1 4.8 5.9H6M10 4.5h1.2a2.8 2.8 0 1 1 0 5.6H10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  Image:    () => <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="2" y="2.5" width="12" height="11" rx="2" stroke="currentColor" strokeWidth="1.3"/><path d="M4.5 10l2.1-2.2a.8.8 0 0 1 1.2 0l1.7 1.8 1.3-1.3a.8.8 0 0 1 1.1 0L13.5 10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/><circle cx="6" cy="6" r="1" fill="currentColor"/></svg>,
  Code:     () => <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M6 5L3 8l3 3M10 5l3 3-3 3M8.8 3.5L7.2 12.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>,
}

/* ═══════════════════════════════════════════════════════════════
   INITIAL DATA
═══════════════════════════════════════════════════════════════ */
const LABELS = [
  { id: 'l1', text: 'Design',      color: '#d4aef1' },
  { id: 'l2', text: 'Engenharia',  color: '#4290da' },
  { id: 'l3', text: 'Pesquisa',    color: '#f5a623' },
  { id: 'l4', text: 'Marketing',   color: '#ff6766' },
  { id: 'l5', text: 'QA',          color: '#0f703a' },
]

const MEMBERS = [
  { id: 'm1', initials: 'AS', color: '#000'    },
  { id: 'm2', initials: 'MK', color: '#d4aef1' },
  { id: 'm3', initials: 'TK', color: '#4290da' },
  { id: 'm4', initials: 'SR', color: '#0f703a' },
]

const CALENDAR_DAYS = [
  { label: 29, muted: true }, { label: 30, muted: true }, { label: 31, muted: true }, { label: 1 }, { label: 2 }, { label: 3 }, { label: 4 },
  { label: 5 }, { label: 6, underline: true }, { label: 7, selected: true }, { label: 8 }, { label: 9 }, { label: 10 }, { label: 11 },
  { label: 12 }, { label: 13 }, { label: 14 }, { label: 15 }, { label: 16 }, { label: 17 }, { label: 18 },
  { label: 19 }, { label: 20 }, { label: 21 }, { label: 22 }, { label: 23 }, { label: 24 }, { label: 25 },
  { label: 26 }, { label: 27 }, { label: 28 }, { label: 29 }, { label: 30 }, { label: 1, muted: true }, { label: 2, muted: true },
  { label: 3, muted: true }, { label: 4, muted: true }, { label: 5, muted: true }, { label: 6, muted: true }, { label: 7, muted: true }, { label: 8, muted: true }, { label: 9, muted: true },
]

const COL_COLORS = [
  { id: 'gray',   value: '#a0a0a0' },
  { id: 'blue',   value: '#4290da' },
  { id: 'purple', value: '#d4aef1' },
  { id: 'green',  value: '#0f703a' },
  { id: 'red',    value: '#ff6766' },
  { id: 'orange', value: '#f5a623' },
]

const uid = () => Math.random().toString(36).slice(2, 9)

const SCHEDULE_HOURS = Array.from({ length: 10 }, (_, index) => index + 8)

function dateKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function eventMinutes(time) {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

function formatPlannerDate(date) {
  return new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
  }).format(date)
}

function formatPlannerHour(hour) {
  return `${hour}h`
}

const NAV = WORKSPACE_NAV_ITEMS.map((item) => ({
  ...item,
  Icon:
    item.id === 'home' ? Icon.Home :
    item.id === 'canvas' ? Icon.Canvas :
    item.id === 'calendar' ? Icon.Calendar :
    Icon.Files,
}))

function BoardLoadingState({ styles }) {
  return (
    <div className={styles.board} aria-hidden="true">
      {Array.from({ length: 4 }, (_, columnIndex) => (
        <div key={`board-loading-${columnIndex}`} className={styles.boardLoadingColumn}>
          <div className={styles.boardLoadingColumnHeader}>
            <span className={`${styles.boardLoadingBlock} ${styles.boardLoadingColumnTitle}`} />
            <span className={`${styles.boardLoadingBlock} ${styles.boardLoadingColumnMeta}`} />
          </div>
          <div className={styles.boardLoadingCards}>
            {Array.from({ length: 3 }, (_, cardIndex) => (
              <div key={`board-loading-${columnIndex}-${cardIndex}`} className={styles.boardLoadingCard}>
                <span className={`${styles.boardLoadingBlock} ${styles.boardLoadingCardTitle}`} />
                <span className={`${styles.boardLoadingBlock} ${styles.boardLoadingCardText}`} />
                <span className={`${styles.boardLoadingBlock} ${styles.boardLoadingCardTextShort}`} />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   CARD DETAIL MODAL
═══════════════════════════════════════════════════════════════ */
/* ═══════════════════════════════════════════════════════════════
   MAIN BOARD
═══════════════════════════════════════════════════════════════ */
export default function KanbanBoard() {
  const { planId } = useParams()
  const { accessToken, currentUser } = useAuth()
  const { updatePlanBoard, isBackendDriven, loadPlanBoard, applyBoardView, isLoading } = usePlans()
  const { plans, activePlan, openPlan } = useResolvedPlanRoute({
    planId,
    buildPath: buildWorkspaceBoardPath,
  })
  const [activeCard,setActiveCard]= useState(null)   // { card, colTitle }
  const [addingCol, setAddingCol] = useState(false)
  const [newColTitle,setNewColTitle] = useState('')
  const [addColumnError, setAddColumnError] = useState(null)
  const [boardLoadError, setBoardLoadError] = useState(null)
  const [notification, setNotification] = useState(null)
  const [isBoardSwitcherOpen, setIsBoardSwitcherOpen] = useState(false)
  const [isInboxOpen, setIsInboxOpen] = useState(false)
  const [isInboxPanelMounted, setIsInboxPanelMounted] = useState(false)
  const [isPlannerOpen, setIsPlannerOpen] = useState(false)
  const [isPlannerPanelMounted, setIsPlannerPanelMounted] = useState(false)
  const [isPlannerAgendaOpen, setIsPlannerAgendaOpen] = useState(true)
  const today = useMemo(() => new Date(), [])
  const notificationTimerRef = useRef(null)
  const inboxCloseTimerRef = useRef(null)
  const plannerCloseTimerRef = useRef(null)
  const boardViewToolbarRef = useRef(null)
  const { activeNav, handleNavItemClick } = useWorkspaceNavigation()
  const { filteredEvents } = useCalendarEvents()
  const planLabels = activePlan?.labelsMeta?.length ? activePlan.labelsMeta : LABELS
  const planMembers = activePlan?.membersMeta?.length ? activePlan.membersMeta : MEMBERS
  const {
    columns,
    totalCards,
    updateColumns,
    createColumn,
    deleteColumn,
    renameColumn,
    changeColColor,
    addCard,
    updateCard,
    deleteCard,
    moveCard,
  } = useBoardColumns({
    activePlanId: activePlan?.id,
    boardColumns: activePlan?.boardColumns,
    updatePlanBoard,
    isBackendDriven,
    accessToken,
    applyBoardView,
    loadPlanBoard,
  })
  const {
    dragState,
    dropTarget,
    handleDragStart,
    handleDragOver,
    handleDrop,
    handleDragEnd,
  } = useBoardDragAndDrop({
    activePlanId: activePlan?.id,
    columns,
    updateColumns,
    moveCard,
    isBackendDriven,
    onMoveError: (error) => showNotification(error?.message ?? 'Não foi possível mover o cartão.'),
  })

  const addColumn = async () => {
    if (!newColTitle.trim()) return

    try {
      await createColumn(newColTitle)
      setNewColTitle('')
      setAddingCol(false)
      setAddColumnError(null)
    } catch (error) {
      const message = error?.message ?? 'Não foi possível criar a lista.'
      setAddColumnError(message)
      showNotification(message)
    }
  }

  const handleCardUpdate = async (updatedCard) => {
    await updateCard(updatedCard)
    setActiveCard(null)
  }

  const handleCardDelete = async (cardId) => {
    await deleteCard(cardId)
    setActiveCard(null)
  }

  useEffect(() => {
    setBoardLoadError(null)
    if (!activePlan?.id || !isBackendDriven) return

    loadPlanBoard(activePlan.id).catch((error) => {
      setBoardLoadError(error?.message ?? 'Não foi possível carregar o quadro deste plano.')
    })
  }, [activePlan?.id, isBackendDriven, loadPlanBoard])

  const retryLoadBoard = async () => {
    if (!activePlan?.id || !isBackendDriven) return

    setBoardLoadError(null)
    try {
      await loadPlanBoard(activePlan.id)
    } catch (error) {
      setBoardLoadError(error?.message ?? 'Não foi possível carregar o quadro deste plano.')
    }
  }

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

  const openPlanner = () => {
    if (plannerCloseTimerRef.current) {
      clearTimeout(plannerCloseTimerRef.current)
      plannerCloseTimerRef.current = null
    }
    if (inboxCloseTimerRef.current) {
      clearTimeout(inboxCloseTimerRef.current)
      inboxCloseTimerRef.current = null
    }
    setIsBoardSwitcherOpen(false)
    setIsInboxOpen(false)
    setIsInboxPanelMounted(false)
    setIsPlannerPanelMounted(true)
    window.requestAnimationFrame(() => setIsPlannerOpen(true))
  }

  const closePlanner = () => {
    setIsPlannerOpen(false)
    if (plannerCloseTimerRef.current) {
      clearTimeout(plannerCloseTimerRef.current)
    }
    plannerCloseTimerRef.current = setTimeout(() => {
      setIsPlannerPanelMounted(false)
      plannerCloseTimerRef.current = null
    }, 260)
  }

  const openInbox = () => {
    if (inboxCloseTimerRef.current) {
      clearTimeout(inboxCloseTimerRef.current)
      inboxCloseTimerRef.current = null
    }
    if (plannerCloseTimerRef.current) {
      clearTimeout(plannerCloseTimerRef.current)
      plannerCloseTimerRef.current = null
    }
    setIsBoardSwitcherOpen(false)
    setIsPlannerOpen(false)
    setIsPlannerPanelMounted(false)
    setIsInboxPanelMounted(true)
    window.requestAnimationFrame(() => setIsInboxOpen(true))
  }

  const closeInbox = () => {
    setIsInboxOpen(false)
    if (inboxCloseTimerRef.current) {
      clearTimeout(inboxCloseTimerRef.current)
    }
    inboxCloseTimerRef.current = setTimeout(() => {
      setIsInboxPanelMounted(false)
      inboxCloseTimerRef.current = null
    }, 260)
  }

  const closeFloatingPanel = () => {
    closeInbox()
    closePlanner()
  }

  const notifyToolbarItem = (message) => {
    setIsBoardSwitcherOpen(false)
    closeFloatingPanel()
    showNotification(message)
  }

  const handlePlanSwitch = (planId) => {
    setIsBoardSwitcherOpen(false)
    openPlan(planId)
  }

  const plannerEvents = useMemo(() => {
    const todayKey = dateKey(today)
    const todaysEvents = filteredEvents.filter((event) => event.date === todayKey)

    if (todaysEvents.length) return todaysEvents

    return filteredEvents
      .filter((event) => event.date >= todayKey)
      .slice(0, 4)
  }, [filteredEvents, today])
  const hasNoPlan = isBackendDriven && !isLoading && !activePlan
  const isBoardLoading = isBackendDriven && !hasNoPlan && !boardLoadError && (isLoading || !activePlan?.boardLoaded)
  const boardHeaderTitle = isBoardLoading
    ? 'Carregando quadro'
    : hasNoPlan
      ? 'Sem plano ativo'
      : (activePlan?.name ?? 'Plano')
  const boardHeaderMeta = isBoardLoading
    ? 'Sincronizando quadro'
    : hasNoPlan
      ? 'Crie um plano para usar o quadro'
      : `${totalCards} cartões`

  useEffect(() => () => {
    if (notificationTimerRef.current) {
      clearTimeout(notificationTimerRef.current)
    }
    if (inboxCloseTimerRef.current) {
      clearTimeout(inboxCloseTimerRef.current)
    }
    if (plannerCloseTimerRef.current) {
      clearTimeout(plannerCloseTimerRef.current)
    }
  }, [])

  useEffect(() => {
    if (!isBoardSwitcherOpen) return undefined

    const handlePointerDown = (event) => {
      if (boardViewToolbarRef.current?.contains(event.target)) return
      setIsBoardSwitcherOpen(false)
    }

    document.addEventListener('pointerdown', handlePointerDown)

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
    }
  }, [isBoardSwitcherOpen])

  const renderSidebarSecondaryContent = ({ collapsed }) => (
    collapsed ? null : (
      <PlanSidebarSection
        plans={plans}
        activePlanId={activePlan?.id}
        onSelectPlan={openPlan}
      />
    )
  )

  const renderSidebarBottomContent = ({ collapsed }) => (
    <SidebarAccountMenu styles={styles} collapsed={collapsed} />
  )

  const renderInboxPanel = () => (
    <aside
      id="board-inbox-panel"
      className={`${styles.plannerPanel} ${styles.inboxPanel} ${isInboxOpen ? '' : styles.plannerPanelClosing}`}
      aria-label="Caixa de entrada"
    >
      <div className={styles.inboxPanelHeader}>
        <div className={styles.inboxPanelTitle}>
          <Icon.Inbox />
          <h2>Caixa de entrada</h2>
        </div>
        <button
          type="button"
          className={styles.plannerCloseButton}
          aria-label="Fechar caixa de entrada"
          onClick={closeInbox}
        >
          <Icon.X />
        </button>
      </div>

      <button type="button" className={styles.inboxAddCardButton}>
        Adicionar um cartão
      </button>

      <section className={styles.inboxEmptyState} aria-label="Conectar aplicativos">
        <div>
          <h3>Consolide suas tarefas</h3>
          <p>Conecte Gmail e Outlook para transformar mensagens em cartões sem sair do seu fluxo.</p>
        </div>

        <div className={styles.inboxAppsIllustration} aria-hidden="true">
          <span className={`${styles.inboxAppBubble} ${styles.inboxAppBubbleMail}`}><Icon.Inbox /></span>
          <span className={`${styles.inboxAppBubble} ${styles.inboxAppBubbleGmail}`}>M</span>
          <span className={`${styles.inboxAppBubble} ${styles.inboxAppBubbleOutlook}`}>O</span>
          <span className={`${styles.inboxAppBubble} ${styles.inboxAppBubbleSlack}`}>#</span>
          <span className={`${styles.inboxAppBubble} ${styles.inboxAppBubbleTeams}`}>T</span>
        </div>
      </section>

      <div className={styles.inboxPrivateNote}>
        <Icon.Lock />
        <span>A Caixa de Entrada é visível apenas para você</span>
      </div>
    </aside>
  )

  const renderPlannerPanel = () => (
    <aside
      id="board-planner-panel"
      className={`${styles.plannerPanel} ${isPlannerOpen ? '' : styles.plannerPanelClosing}`}
      aria-label="Planejador"
    >
      <div className={styles.plannerPanelHeader}>
        <div>
          <span className={styles.plannerEyebrow}>Planejador</span>
          <h2>{formatPlannerDate(today)}</h2>
        </div>
        <button
          type="button"
          className={styles.plannerCloseButton}
          aria-label="Fechar planejador"
          onClick={closePlanner}
        >
          <Icon.X />
        </button>
      </div>

      <div className={styles.plannerSummary}>
        <button
          type="button"
          className={styles.plannerSummaryToggle}
          aria-expanded={isPlannerAgendaOpen}
          aria-controls="planner-agenda-list"
          onClick={() => setIsPlannerAgendaOpen(open => !open)}
        >
          <span>Agenda do dia</span>
          <Icon.Chevron />
        </button>
        <span>{plannerEvents.length ? `${plannerEvents.length} compromissos` : 'Sem compromissos'}</span>
      </div>

      <div
        id="planner-agenda-list"
        className={`${styles.plannerAgendaList} ${isPlannerAgendaOpen ? '' : styles.plannerAgendaListCollapsed}`}
      >
        <div className={styles.plannerAgendaListInner}>
          {plannerEvents.length ? plannerEvents.map((event) => (
            <article key={event.id} className={styles.plannerAgendaItem} style={{ '--event-color': event.color }}>
              <span>{event.start} - {event.end}</span>
              <strong>{event.title}</strong>
              <p>{[event.location, event.calendar].filter(Boolean).join(' · ')}</p>
            </article>
          )) : (
            <article className={styles.plannerAgendaEmpty}>
              <Icon.Calendar />
              <strong>Dia livre</strong>
              <p>Reserve o próximo bloco de foco.</p>
            </article>
          )}
        </div>
      </div>

      <div className={styles.plannerTimeline} aria-label="Linha do tempo do dia">
        {SCHEDULE_HOURS.map((hour) => (
          <div key={hour} className={styles.plannerTimelineRow}>
            <span>{formatPlannerHour(hour)}</span>
            <div />
          </div>
        ))}

        {plannerEvents.slice(0, 3).map((event) => {
          const startMinutes = eventMinutes(event.start)
          const endMinutes = eventMinutes(event.end)
          const top = Math.max(0, startMinutes - SCHEDULE_HOURS[0] * 60)
          const height = Math.max(30, endMinutes - startMinutes)

          return (
            <article
              key={`timeline-${event.id}`}
              className={styles.plannerTimelineEvent}
              style={{
                '--event-color': event.color,
                '--event-top': `${top}px`,
                '--event-height': `${height}px`,
              }}
            >
              <span>{event.start}</span>
              <strong>{event.title}</strong>
            </article>
          )
        })}
      </div>
    </aside>
  )

  return (
    <>
      <ProductAppShell
        styles={styles}
        activeNav={activeNav}
        onNavItemClick={handleNavItemClick}
        navItems={NAV}
        LogoIcon={Icon.Logo}
        CollapseIcon={Icon.Collapse}
        ChevronIcon={Icon.Chevron}
        HintIcon={Icon.Popover}
        secondaryContent={renderSidebarSecondaryContent}
        bottomContent={renderSidebarBottomContent}
        contentClassName={`${styles.boardWrapper} ${isPlannerPanelMounted || isInboxPanelMounted ? styles.boardWrapperPlannerMounted : ''} ${isPlannerOpen || isInboxOpen ? styles.boardWrapperWithPlanner : ''}`}
      >
        <div className={styles.boardMain}>
        <PlanPageHeader
          title={boardHeaderTitle}
          breadcrumbCurrent={boardHeaderTitle}
          meta={boardHeaderMeta}
          icon={<Icon.Board />}
          sticky
          tone="solid"
          titleSize="medium"
          actions={(
            <BoardHeaderActions
              members={planMembers}
              icons={{
                Plus: Icon.Plus,
                Filter: Icon.Filter,
                Share: Icon.Share,
              }}
              styles={styles}
              onAddMember={() => showNotification('Convites em breve')}
              onFilter={() => showNotification('Filtros avançados em breve')}
              onShare={() => showNotification('Link do quadro copiado')}
            />
          )}
        />

        {/* ── Board ── */}
        {isBoardLoading ? (
          <BoardLoadingState styles={styles} />
        ) : hasNoPlan ? (
          <section className={styles.boardStatusPanel} role="status" aria-live="polite">
            <p className={styles.boardStatusTitle}>Nenhum plano ativo no momento</p>
            <p className={styles.boardStatusText}>Quando houver um plano disponível, o quadro será exibido aqui.</p>
          </section>
        ) : boardLoadError ? (
          <section className={styles.boardStatusPanel} role="status" aria-live="polite">
            <p className={styles.boardStatusTitle}>Não foi possível carregar o quadro</p>
            <p className={styles.boardStatusText}>{boardLoadError}</p>
            <button type="button" className={styles.boardStatusRetry} onClick={retryLoadBoard}>
              Tentar novamente
            </button>
          </section>
        ) : (
          <div className={styles.board}>
            {columns.map(col => (
              <KanbanColumn
                key={col.id}
                col={col}
                dragState={dragState}
                dropTarget={dropTarget}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onDragEnd={handleDragEnd}
                onAddCard={addCard}
                onDeleteCol={deleteColumn}
                onRenameCol={renameColumn}
                onChangeColColor={changeColColor}
                onCardClick={(card, colTitle) => setActiveCard({ card, colTitle })}
                labels={planLabels}
                members={planMembers}
                colorOptions={COL_COLORS}
                icons={{
                  Plus: Icon.Plus,
                  More: Icon.More,
                  Edit: Icon.Edit,
                  Trash: Icon.Trash,
                  X: Icon.X,
                  Comment: Icon.Comment,
                  Clock: Icon.Clock,
                }}
                styles={styles}
              />
            ))}

            <AddColumnComposer
              addingCol={addingCol}
              newColTitle={newColTitle}
              setNewColTitle={(value) => {
                setNewColTitle(value)
                if (addColumnError) {
                  setAddColumnError(null)
                }
              }}
              setAddingCol={setAddingCol}
              addColumn={addColumn}
              errorMessage={addColumnError}
              PlusIcon={Icon.Plus}
              XIcon={Icon.X}
              styles={styles}
            />
          </div>
        )}

        <div ref={boardViewToolbarRef} className={styles.boardViewToolbar} aria-label="Atalhos do quadro">
          <button
            type="button"
            className={`${styles.boardViewToolbarItem} ${isInboxOpen ? styles.boardViewToolbarItemActive : ''}`}
            aria-expanded={isInboxOpen}
            aria-controls="board-inbox-panel"
            onClick={openInbox}
          >
            <Icon.Inbox />
            <span>Caixa de entrada</span>
          </button>

          <button
            type="button"
            className={`${styles.boardViewToolbarItem} ${isPlannerOpen ? styles.boardViewToolbarItemActive : ''}`}
            aria-expanded={isPlannerOpen}
            aria-controls="board-planner-panel"
            onClick={openPlanner}
          >
            <Icon.Calendar />
            <span>Planejador</span>
          </button>

          <button
            type="button"
            className={`${styles.boardViewToolbarItem} ${!isPlannerOpen && !isInboxOpen ? styles.boardViewToolbarItemActive : ''}`}
            aria-current="page"
            onClick={closeFloatingPanel}
          >
            <Icon.Board />
            <span>Quadro</span>
          </button>

          <div className={styles.boardViewSwitcher}>
            <button
              type="button"
              className={styles.boardViewToolbarItem}
              aria-expanded={isBoardSwitcherOpen}
              aria-haspopup="menu"
              onClick={() => {
                closeFloatingPanel()
                setIsBoardSwitcherOpen(open => !open)
              }}
            >
              <Icon.Switch />
              <span>Mudar de quadros</span>
            </button>

            {isBoardSwitcherOpen && (
              <div className={styles.boardViewMenu} role="menu" aria-label="Mudar de quadro">
                {plans.length > 0 ? (
                  plans.map((plan) => (
                    <button
                      key={plan.id}
                      type="button"
                      role="menuitem"
                      className={`${styles.boardViewMenuItem} ${activePlan?.id === plan.id ? styles.boardViewMenuItemActive : ''}`}
                      onClick={() => handlePlanSwitch(plan.id)}
                    >
                      <span className={styles.boardViewMenuDot} style={{ background: plan.tagColor ?? plan.cover ?? '#a0a0a0' }} />
                      <span className={styles.boardViewMenuLabel}>{plan.name}</span>
                    </button>
                  ))
                ) : (
                  <div className={styles.boardViewMenuEmpty}>Nenhum quadro disponível</div>
                )}
              </div>
            )}
          </div>
        </div>
        </div>

        {isInboxPanelMounted && renderInboxPanel()}
        {isPlannerPanelMounted && renderPlannerPanel()}
      </ProductAppShell>

      {/* ── Card modal ── */}
      {activeCard && (
        <CardModal
          card={activeCard.card}
          colTitle={activeCard.colTitle}
          onClose={() => setActiveCard(null)}
          onUpdate={handleCardUpdate}
          onDelete={handleCardDelete}
          labels={planLabels}
          members={planMembers}
          currentUser={currentUser}
          calendarDays={CALENDAR_DAYS}
          icons={Icon}
          styles={styles}
          isBackendDriven={isBackendDriven}
        />
      )}

      {notification && (
        <div className={styles.boardNotification} role="status" aria-live="polite">
          {notification}
        </div>
      )}

    </>
  )
}

