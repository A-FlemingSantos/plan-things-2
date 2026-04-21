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
import { usePreferences } from '../../../preferences/context/PreferencesContext.jsx'
import AppThemeScope from '../../../preferences/components/AppThemeScope/AppThemeScope.jsx'
import { buildPlannerView, filterPlannerItems } from './plannerFilters.js'
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
  Star:     () => <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><path d="M8 2.2l1.7 3.5 3.9.6-2.8 2.7.7 3.9L8 11.1 4.5 12.9l.7-3.9L2.4 6.3l3.9-.6L8 2.2z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/></svg>,
  StarFill: () => <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><path d="M8 2.2l1.7 3.5 3.9.6-2.8 2.7.7 3.9L8 11.1 4.5 12.9l.7-3.9L2.4 6.3l3.9-.6L8 2.2z" fill="currentColor"/></svg>,
  CheckCircle: () => <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6.2" stroke="currentColor" strokeWidth="1.3"/><path d="M5.3 8.3l1.6 1.6 3.7-4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  Sun: () => <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="2.5" stroke="currentColor" strokeWidth="1.3"/><path d="M8 1.8v2M8 12.2v2M1.8 8h2M12.2 8h2M3 3l1.4 1.4M11.6 11.6L13 13M13 3l-1.4 1.4M4.4 11.6L3 13" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>,
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

function dateKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
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

function timeValueFromIsoInTimeZone(iso, timeZone) {
  if (!iso) return null
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return null

  const partByType = Object.fromEntries(new Intl.DateTimeFormat('en-GB', {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(date).map((part) => [part.type, part.value]))

  const hour = partByType.hour
  const minute = partByType.minute
  if (!hour || !minute) return null
  return `${hour}:${minute}`
}

function timeValueMinutes(value) {
  if (!value) return null
  const [hours, minutes] = value.split(':').map(Number)
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null
  return hours * 60 + minutes
}

function addDaysToDateKey(dateKeyValue, days) {
  if (!dateKeyValue) return null
  const [year, month, day] = dateKeyValue.split('-').map(Number)
  if (![year, month, day].every(Number.isFinite)) return null
  const utc = Date.UTC(year, month - 1, day + days, 12, 0, 0, 0)
  const date = new Date(utc)
  return dateKey(date)
}

function moveCardInColumns(columns, cardId, targetColumnId, targetPosition = 0) {
  const nextColumns = columns.map((column) => ({
    ...column,
    cards: Array.isArray(column.cards) ? [...column.cards] : [],
  }))

  let movedCard = null
  let sourceColumnId = null

  nextColumns.forEach((column) => {
    const index = column.cards.findIndex((card) => card.id === cardId)
    if (index < 0) return
    movedCard = column.cards[index]
    sourceColumnId = column.id
    column.cards.splice(index, 1)
  })

  if (!movedCard || sourceColumnId === targetColumnId) {
    return columns
  }

  const targetColumn = nextColumns.find((column) => column.id === targetColumnId)
  if (!targetColumn) {
    return columns
  }

  const nextCard = {
    ...movedCard,
    columnId: targetColumnId,
  }

  const clampedPosition = Math.max(0, Math.min(targetColumn.cards.length, targetPosition))
  targetColumn.cards.splice(clampedPosition, 0, nextCard)

  return nextColumns
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
  const [isPlannerFilterOpen, setIsPlannerFilterOpen] = useState(false)
  const [plannerFilter, setPlannerFilter] = useState('my-day')
  const plannerFilterWrapRef = useRef(null)
  const previousColumnByCardIdRef = useRef(new Map())
  const [plannerPinnedById, setPlannerPinnedById] = useState({})
  const { generalPreferences, formatClockTime } = usePreferences()
  const timeZone = generalPreferences.timezone
  const dateFormat = generalPreferences.dateFormat
  const today = useMemo(() => new Date(), [timeZone])
  const notificationTimerRef = useRef(null)
  const inboxCloseTimerRef = useRef(null)
  const plannerCloseTimerRef = useRef(null)
  const boardViewToolbarRef = useRef(null)
  const { activeNav, handleNavItemClick } = useWorkspaceNavigation()
  const { filteredEvents: plannerCalendarEvents } = useCalendarEvents({
    enabled: isPlannerPanelMounted,
    includeGeneratedFromCard: false,
    enrichGeneratedCardKinds: false,
  })
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
    timeZone,
    dateFormat,
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
    setIsPlannerFilterOpen(false)
    setIsPlannerPanelMounted(true)
    window.requestAnimationFrame(() => setIsPlannerOpen(true))
  }

  const closePlanner = () => {
    setIsPlannerOpen(false)
    setIsPlannerFilterOpen(false)
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

  useEffect(() => {
    if (!isPlannerFilterOpen) return undefined

    const handlePointerDown = (event) => {
      if (plannerFilterWrapRef.current?.contains(event.target)) return
      setIsPlannerFilterOpen(false)
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsPlannerFilterOpen(false)
      }
    }

    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isPlannerFilterOpen])

  const notifyToolbarItem = (message) => {
    setIsBoardSwitcherOpen(false)
    closeFloatingPanel()
    showNotification(message)
  }

  const handlePlanSwitch = (planId) => {
    setIsBoardSwitcherOpen(false)
    openPlan(planId)
  }

	  const todayKey = useMemo(
	    () => dateKeyFromTimeZoneInstant(today, timeZone) ?? dateKey(today),
	    [timeZone, today],
	  )
	  const tomorrowKey = useMemo(() => addDaysToDateKey(todayKey, 1), [todayKey])
	  const doneColumn = useMemo(() => {
	    const doneMatcher = /(^|\b)(conclu[ií]do|feito|done|completed)(\b|$)/i
	    return columns.find((column) => doneMatcher.test(column.title ?? ''))
	  }, [columns])
	  const plannerPinnedStorageKey = useMemo(
	    () => `plan-things:plannerPinned:${activePlan?.id ?? 'none'}`,
	    [activePlan?.id],
	  )
	  const plannerCollapseStorageKey = useMemo(
	    () => `plan-things:plannerCollapse:${activePlan?.id ?? 'none'}`,
	    [activePlan?.id],
	  )
	  const [plannerSectionOpenById, setPlannerSectionOpenById] = useState({})

	  useEffect(() => {
	    try {
	      const stored = window.localStorage.getItem(plannerPinnedStorageKey)
      const parsed = stored ? JSON.parse(stored) : []
      if (Array.isArray(parsed)) {
        setPlannerPinnedById(Object.fromEntries(parsed.map((id) => [id, true])))
        return
      }
    } catch {}
	    setPlannerPinnedById({})
	  }, [plannerPinnedStorageKey])

	  useEffect(() => {
	    try {
	      const stored = window.localStorage.getItem(plannerCollapseStorageKey)
	      const parsed = stored ? JSON.parse(stored) : null
	      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
	        setPlannerSectionOpenById(parsed)
	        return
	      }
	    } catch {}
	    setPlannerSectionOpenById({})
	  }, [plannerCollapseStorageKey])

	  const defaultPlannerSectionOpen = (sectionId) => {
	    if (sectionId === 'my-day:completed') return false
	    if (sectionId.startsWith('planned:')) return true
	    return true
	  }

	  const isPlannerSectionOpen = (sectionId) => {
	    const stored = plannerSectionOpenById?.[sectionId]
	    if (typeof stored === 'boolean') return stored
	    return defaultPlannerSectionOpen(sectionId)
	  }

	  const togglePlannerSection = (sectionId) => {
	    setPlannerSectionOpenById((current) => {
	      const currentValue = typeof current?.[sectionId] === 'boolean'
	        ? current[sectionId]
	        : defaultPlannerSectionOpen(sectionId)
	      const nextValue = !currentValue
	      const next = { ...(current ?? {}) }
	      next[sectionId] = nextValue
	      try {
	        window.localStorage.setItem(plannerCollapseStorageKey, JSON.stringify(next))
	      } catch {}
	      return next
	    })
	  }

	  const togglePlannerPinned = (itemId) => {
	    setPlannerPinnedById((current) => {
	      const next = { ...current }
	      if (next[itemId]) {
        delete next[itemId]
      } else {
        next[itemId] = true
      }
      try {
        window.localStorage.setItem(plannerPinnedStorageKey, JSON.stringify(Object.keys(next)))
      } catch {}
      return next
	    })
	  }

	  const plannerDateFormatter = useMemo(() => new Intl.DateTimeFormat('pt-BR', {
	    timeZone,
	    weekday: 'short',
	    day: 'numeric',
	    month: 'short',
	  }), [timeZone])

	  const plannerBaseItems = useMemo(() => {
	    const planName = activePlan?.name ?? 'Plano'
	    const doneColumnId = doneColumn?.id ?? null

	    const formatDateLabel = (key) => {
	      if (!key) return 'Sem data'
	      if (key === todayKey) return 'Hoje'
	      if (tomorrowKey && key === tomorrowKey) return 'Amanhã'
	      const date = new Date(`${key}T12:00:00Z`)
	      return plannerDateFormatter.format(date).replace(/\./g, '')
	    }

	    const cardItems = columns
	      .flatMap((column) => column.cards.map((card) => ({
	        column,
	        card,
	      })))
	      .map(({ column, card }) => {
	        const startKey = dateKeyFromTimeZoneInstant(card.startAt?.iso, timeZone)
	        const dueKey = dateKeyFromTimeZoneInstant(card.dueAt?.iso, timeZone)
	        const scheduleKey = dueKey ?? startKey
	        const scheduleIso = card.dueAt?.iso ?? card.startAt?.iso ?? null
	        const timeValue = timeValueFromIsoInTimeZone(scheduleIso, timeZone)
	        const itemId = `card:${card.id}`
	        const dateLabel = formatDateLabel(scheduleKey)

	        return {
	          id: itemId,
	          type: 'card',
	          title: card.title,
	          meta: `${planName} · ${column.title} · ${dateLabel}`,
	          pinned: Boolean(plannerPinnedById[itemId]),
	          startKey,
	          dueKey,
	          scheduleKey,
	          timeMinutes: timeValueMinutes(timeValue),
	          isCompleted: Boolean(doneColumnId && card.columnId === doneColumnId),
	          isAssignedToMe: Boolean(
	            currentUser?.id &&
	            Array.isArray(card.memberIds) &&
	            card.memberIds.includes(currentUser.id),
	          ),
	          card,
	          colTitle: column.title,
	        }
	      })

	    const eventItems = plannerCalendarEvents
	      .map((event) => {
	        const rangeLabel = `${formatClockTime(event.start)}–${formatClockTime(event.end)}`
	        const itemId = `event:${event.id}`
	        const dateLabel = formatDateLabel(event.date)
	        return {
	          id: itemId,
	          type: 'event',
	          title: event.title,
	          meta: `Calendário · ${rangeLabel} · ${dateLabel}`,
	          pinned: Boolean(plannerPinnedById[itemId]),
	          startKey: null,
	          dueKey: null,
	          scheduleKey: event.date,
	          timeMinutes: timeValueMinutes(event.start),
	          isCompleted: false,
	          isAssignedToMe: false,
	          event,
	        }
	      })

	    return [...cardItems, ...eventItems]
	  }, [
	    activePlan?.name,
	    columns,
	    currentUser?.id,
	    doneColumn?.id,
	    formatClockTime,
	    plannerDateFormatter,
	    plannerCalendarEvents,
	    plannerPinnedById,
	    timeZone,
	    todayKey,
	    tomorrowKey,
	  ])
	  const plannerFilterCounts = useMemo(() => {
	    const myDayCount = filterPlannerItems(plannerBaseItems, 'my-day', todayKey).length
	    const importantCount = filterPlannerItems(plannerBaseItems, 'important', todayKey).length
	    const plannedCount = filterPlannerItems(plannerBaseItems, 'planned', todayKey).length
	    const completedCount = filterPlannerItems(plannerBaseItems, 'completed', todayKey).length
	    const assignedToMeCount = filterPlannerItems(plannerBaseItems, 'assigned-to-me', todayKey).length

	    return {
	      myDay: myDayCount,
	      important: importantCount,
	      planned: plannedCount,
	      completed: completedCount,
	      assignedToMe: assignedToMeCount,
	    }
	  }, [plannerBaseItems, todayKey])

	  const plannerView = useMemo(() => buildPlannerView({
	    baseItems: plannerBaseItems,
	    filterId: plannerFilter,
	    todayKey,
	  }), [plannerBaseItems, plannerFilter, todayKey])

  const togglePlannerCardCompleted = async (card) => {
    const doneColumnId = doneColumn?.id
    if (!doneColumnId) {
      showNotification('Crie uma coluna "Concluído" para marcar tarefas como feitas.')
      return
    }

    const isCompleted = card.columnId === doneColumnId
    if (!isCompleted) {
      previousColumnByCardIdRef.current.set(card.id, card.columnId)
    }

    const fallbackColumnId = columns.find((column) => column.id !== doneColumnId)?.id ?? null
    const previousColumnId = previousColumnByCardIdRef.current.get(card.id) ?? null
    const undoTargetId =
      previousColumnId && previousColumnId !== doneColumnId
        ? previousColumnId
        : fallbackColumnId
    const targetColumnId = isCompleted ? undoTargetId : doneColumnId

    if (!targetColumnId) return

    if (!isBackendDriven) {
      updateColumns((prev) => moveCardInColumns(prev, card.id, targetColumnId, 0))
      return
    }

    try {
      await moveCard(card.id, targetColumnId, 0)
    } catch (error) {
      showNotification(error?.message ?? 'Não foi possível atualizar a tarefa.')
    }
  }
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
  const coverThemeClassName = activePlan?.coverThemeId ? (styles[`theme${activePlan.coverThemeId}`] ?? '') : ''
  const isImageCover = Boolean(activePlan?.coverImage)
  const boardMainClassName = [
    styles.boardMain,
    coverThemeClassName,
    isImageCover ? styles.boardMainImageCover : '',
  ].filter(Boolean).join(' ')
  const boardCoverStyle = activePlan?.coverThemeId
    ? {
        '--cover-fallback': activePlan.cover,
      }
    : isImageCover
      ? {
          '--cover-bg': `url(${activePlan.coverImage})`,
        }
      : undefined

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

		  const renderPlannerPanel = () => {
		    const plannerFilterOptions = [
		      { id: 'my-day', label: 'Meu Dia', Icon: Icon.Sun, count: plannerFilterCounts.myDay, accent: '#4290da' },
		      { id: 'important', label: 'Importante', Icon: Icon.Star, count: plannerFilterCounts.important, accent: '#d4aef1' },
		      { id: 'planned', label: 'Planejado', Icon: Icon.List, count: plannerFilterCounts.planned, accent: '#0f703a' },
		      { id: 'completed', label: 'Concluída', Icon: Icon.CheckCircle, count: plannerFilterCounts.completed, accent: 'var(--text-3)' },
		      { id: 'assigned-to-me', label: 'Atribuído a mim', Icon: Icon.User, count: plannerFilterCounts.assignedToMe, accent: '#f5a623' },
		    ]

	    const activeFilterOption =
	      plannerFilterOptions.find((option) => option.id === plannerFilter) ?? plannerFilterOptions[0]

	    const totalItems =
	      plannerView.ungroupedItems.length +
	      plannerView.sections.reduce((sum, section) => sum + section.items.length, 0)

	    const renderPlannerItem = (item) => {
	      const isCard = item.type === 'card'
	      const isEvent = item.type === 'event'
	      const itemClassName = [
	        styles.plannerListItem,
	        item.isCompleted ? styles.plannerListItemCompleted : '',
	      ].filter(Boolean).join(' ')

	      const activate = () => {
	        if (isCard) {
	          setActiveCard({ card: item.card, colTitle: item.colTitle })
	          return
	        }
	        if (isEvent) {
	          handleNavItemClick('calendar')
	          closePlanner()
	        }
	      }

	      return (
	        <article
	          key={item.id}
	          className={itemClassName}
	          role="button"
	          tabIndex={0}
	          onClick={activate}
	          onKeyDown={(event) => {
	            if (event.key === 'Enter' || event.key === ' ') {
	              event.preventDefault()
	              activate()
	            }
	          }}
	          aria-label={isCard ? `Abrir tarefa ${item.title}` : `Abrir evento ${item.title}`}
	        >
	          <div className={styles.plannerListLeft}>
	            {isCard ? (
	              <button
	                type="button"
	                className={`${styles.plannerCheckbox} ${item.isCompleted ? styles.plannerCheckboxChecked : ''}`}
	                role="checkbox"
	                aria-checked={item.isCompleted}
	                aria-label={item.isCompleted ? 'Marcar como não concluída' : 'Marcar como concluída'}
	                onClick={(event) => {
	                  event.preventDefault()
	                  event.stopPropagation()
	                  togglePlannerCardCompleted(item.card)
	                }}
	              >
	                {item.isCompleted ? <Icon.Check /> : null}
	              </button>
	            ) : (
	              <span className={styles.plannerEventDot} style={{ background: item.event?.color ?? 'var(--border-2)' }}>
	                <Icon.Calendar />
	              </span>
	            )}
	          </div>

	          <div className={styles.plannerListBody}>
	            <p className={styles.plannerListTitle}>{item.title}</p>
	            <p className={styles.plannerListMeta}>{item.meta}</p>
	          </div>

	          <div className={styles.plannerListRight}>
	            <button
	              type="button"
	              className={`${styles.plannerStarBtn} ${item.pinned ? styles.plannerStarBtnActive : ''}`}
	              aria-pressed={item.pinned}
	              aria-label={item.pinned ? 'Remover estrela' : 'Marcar com estrela'}
	              onClick={(event) => {
	                event.preventDefault()
	                event.stopPropagation()
	                togglePlannerPinned(item.id)
	              }}
	            >
	              {item.pinned ? <Icon.StarFill /> : <Icon.Star />}
	            </button>
	          </div>
	        </article>
	      )
	    }

	    const renderPlannerSection = (section) => {
	      const expanded = isPlannerSectionOpen(section.id)
	      return (
	        <div key={section.id} className={styles.plannerSection}>
	          <button
	            type="button"
	            className={styles.plannerSectionHeaderBtn}
	            aria-expanded={expanded}
	            onClick={() => togglePlannerSection(section.id)}
	          >
	            <span className={styles.plannerSectionChevron} aria-hidden="true">
	              <Icon.Chevron />
	            </span>
	            <span className={styles.plannerSectionTitle}>{section.title}</span>
	            <span className={styles.plannerSectionCount}>{section.items.length}</span>
	          </button>
	          {expanded ? (
	            <div className={styles.plannerSectionBody}>
	              {section.items.map(renderPlannerItem)}
	            </div>
	          ) : null}
	        </div>
	      )
	    }

	    return (
	      <aside
	        id="board-planner-panel"
	        className={`${styles.plannerPanel} ${isPlannerOpen ? '' : styles.plannerPanelClosing}`}
	        aria-label="Planejador"
	      >
	        <div className={styles.plannerPanelHeader}>
	          <div>
	            <span className={styles.plannerEyebrow}>Planejador</span>
	            <div ref={plannerFilterWrapRef} className={styles.plannerTitleWrap}>
	              <button
	                type="button"
	                className={styles.plannerTitleButton}
	                aria-haspopup="menu"
	                aria-expanded={isPlannerFilterOpen}
	                onClick={() => setIsPlannerFilterOpen((open) => !open)}
	              >
	                <span>{activeFilterOption.label}</span>
	                <span className={styles.plannerTitleChevron} aria-hidden="true">
	                  <Icon.Chevron />
	                </span>
	                {activeFilterOption.count ? <span className={styles.plannerTitleCount}>{activeFilterOption.count}</span> : null}
	              </button>

		              {isPlannerFilterOpen && (
		                <div className={styles.plannerFilterMenu} role="menu" aria-label="Filtros do planejador">
		                  {plannerFilterOptions.map(({ id, label, Icon: ItemIcon, count, accent }) => (
		                    <button
		                      key={id}
		                      type="button"
		                      className={`${styles.plannerFilterItem} ${plannerFilter === id ? styles.plannerFilterItemActive : ''}`}
		                      style={{ '--planner-filter-accent': accent }}
		                      role="menuitem"
		                      aria-current={plannerFilter === id ? 'true' : undefined}
		                      onClick={() => {
		                        setPlannerFilter(id)
		                        setIsPlannerFilterOpen(false)
	                      }}
	                    >
	                      <ItemIcon />
	                      <span>{label}</span>
	                      {count ? <span className={styles.plannerFilterCount}>{count}</span> : null}
	                    </button>
	                  ))}
	                </div>
	              )}
	            </div>
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

	        <section className={styles.plannerList} aria-label="Itens do planejador">
	          {totalItems ? (
	            <>
	              {plannerView.ungroupedItems.map(renderPlannerItem)}
	              {plannerView.sections.map(renderPlannerSection)}
	            </>
	          ) : (
	            <div className={styles.plannerEmptyState}>
	              <Icon.Calendar />
	              <strong>Nada para mostrar</strong>
	              <p>Esse filtro não possui tarefas ou eventos no momento.</p>
	            </div>
	          )}
	        </section>
	      </aside>
	    )
	  }

  return (
    <AppThemeScope>
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
        <div className={boardMainClassName} style={boardCoverStyle}>
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

    </AppThemeScope>
  )
}

