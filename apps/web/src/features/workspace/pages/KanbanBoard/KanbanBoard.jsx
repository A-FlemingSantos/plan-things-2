import { useEffect, useMemo, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useAuth } from '../../../auth/context/AuthContext.jsx'
import { buildWorkspaceBoardPath } from '../../../../shared/config/routes.js'
import { apiRequest, triggerBlobDownload } from '../../../../shared/api/apiClient.js'
import { WORKSPACE_NAV_ITEMS } from '../../../../shared/config/workspaceNavigation.js'
import ProductAppShell from '../../../../shared/components/ProductAppShell/ProductAppShell.jsx'
import PlanPageHeader from '../../../../shared/components/PlanPageHeader/PlanPageHeader.jsx'
import PlanSidebarSection from '../../../../shared/components/PlanSidebarSection/PlanSidebarSection.jsx'
import SidebarAccountMenu from '../../../../shared/components/SidebarAccountMenu/SidebarAccountMenu.jsx'
import CardModal from '../../components/CardModal/CardModal.jsx'
import AddColumnComposer from '../../components/AddColumnComposer/AddColumnComposer.jsx'
import BoardHeaderActions from '../../components/BoardHeaderActions/BoardHeaderActions.jsx'
import InviteNotifications from '../../components/InviteNotifications/InviteNotifications.jsx'
import KanbanColumn from '../../components/KanbanColumn/KanbanColumn.jsx'
import { useWorkspaceNavigation } from '../../../../shared/hooks/useWorkspaceNavigation.js'
import { usePlans } from '../../context/PlansContext.jsx'
import { useBoardColumns } from '../../hooks/useBoardColumns.js'
import { useBoardDragAndDrop } from '../../hooks/useBoardDragAndDrop.js'
import { useResolvedPlanRoute } from '../../hooks/useResolvedPlanRoute.js'
import { useCalendarEvents } from '../../../calendar/hooks/useCalendarEvents.js'
import { usePreferences } from '../../../preferences/context/PreferencesContext.jsx'
import AppThemeScope from '../../../preferences/components/AppThemeScope/AppThemeScope.jsx'
import { formatFileSize, getFileTypeFromName } from '../../../files/data/libraryRepository.js'
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
  Download: () => <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 2v7M4.5 6.5L7 9l2.5-2.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/><path d="M2 10v1.5A1.5 1.5 0 0 0 3.5 13h7a1.5 1.5 0 0 0 1.5-1.5V10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>,
  Plus:     () => <svg width="13" height="13" viewBox="0 0 14 14" fill="none"><path d="M7 2v10M2 7h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>,
  Users:    () => <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M6 8a3 3 0 1 1 0-6 3 3 0 0 1 0 6z" stroke="currentColor" strokeWidth="1.3"/><path d="M1.5 14c0-2.4 2-4.3 4.5-4.3S10.5 11.6 10.5 14" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/><path d="M11.2 7.6a2.4 2.4 0 1 0 0-4.8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/><path d="M11 9.9c1.9.3 3.5 1.9 3.5 4.1" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>,
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
const FILE_DRAG_MIME_TYPE = 'application/x-planthings-file'

function mapApiFileItem(item) {
  return {
    id: item.id,
    name: item.name,
    type: item.type === 'FOLDER' ? 'folder' : getFileTypeFromName(item.name),
    mimeType: item.mimeType ?? '',
    size: item.sizeBytes ?? 0,
    modified: item.updatedAt?.text ?? item.createdAt?.text ?? 'Agora',
    sharedByCurrentUser: Boolean(item.sharedByCurrentUser),
    canUnshare: Boolean(item.canUnshare),
  }
}

function dateKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

const GMAIL_INVITE_ERROR_CODES = new Set([
  'GMAIL_NAO_CONECTADO',
  'GMAIL_SCOPE_AUSENTE',
  'GMAIL_TOKEN_REFRESH_FALHOU',
  'GMAIL_ENVIO_CONVITE_FALHOU',
  'GMAIL_API_NAO_HABILITADA',
])

function describeInviteError(error) {
  if (!GMAIL_INVITE_ERROR_CODES.has(error?.code)) {
    return error?.message ?? 'Não foi possível enviar o convite.'
  }

  const code = error.code
  const messageByCode = {
    GMAIL_NAO_CONECTADO: 'Gmail não conectado para este usuário. Conecte o Gmail em Configurações e tente novamente.',
    GMAIL_SCOPE_AUSENTE: 'A conexão Gmail não tem permissão de envio. Reconecte o Gmail em Configurações.',
    GMAIL_TOKEN_REFRESH_FALHOU: 'Não foi possível renovar a autorização Gmail. Reconecte o Gmail em Configurações.',
    GMAIL_ENVIO_CONVITE_FALHOU: 'O Gmail recusou o envio do convite. Verifique a conta conectada e tente novamente.',
    GMAIL_API_NAO_HABILITADA: 'A API do Gmail não está habilitada no projeto Google Cloud. Habilite Gmail API e tente novamente.',
  }

  return `${messageByCode[code]} Código: ${code}.`
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

function formatInviteStatus(status) {
  if (status === 'ACCEPTED') return 'Aceito'
  if (status === 'DECLINED') return 'Recusado'
  if (status === 'REVOKED') return 'Revogado'
  if (status === 'EXPIRED') return 'Expirado'
  return 'Pendente'
}

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
  const {
    updatePlanBoard,
    isBackendDriven,
    loadPlanBoard,
    applyBoardView,
    ensurePlanDetails,
    refreshPlanDetails,
    isLoading,
  } = usePlans()
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
  const [isMembersOpen, setIsMembersOpen] = useState(false)
  const [membersPanelTab, setMembersPanelTab] = useState('members')
  const [membersLoadError, setMembersLoadError] = useState(null)
  const [planInvites, setPlanInvites] = useState([])
  const [planInvitesLoading, setPlanInvitesLoading] = useState(false)
  const [planInvitesError, setPlanInvitesError] = useState('')
  const [revokingInviteId, setRevokingInviteId] = useState('')
  const [isInviteOpen, setIsInviteOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteSubmitting, setInviteSubmitting] = useState(false)
  const [inviteError, setInviteError] = useState('')
  const [inviteResult, setInviteResult] = useState(null)
  const membersButtonRef = useRef(null)
  const membersMenuRef = useRef(null)
  const [membersMenuStyle, setMembersMenuStyle] = useState(null)
  const [isBoardSwitcherOpen, setIsBoardSwitcherOpen] = useState(false)
  const [isInboxOpen, setIsInboxOpen] = useState(false)
  const [isInboxPanelMounted, setIsInboxPanelMounted] = useState(false)
  const [isPlannerOpen, setIsPlannerOpen] = useState(false)
  const [isPlannerPanelMounted, setIsPlannerPanelMounted] = useState(false)
  const [isFilesOpen, setIsFilesOpen] = useState(false)
  const [isFilesPanelMounted, setIsFilesPanelMounted] = useState(false)
  const [planFiles, setPlanFiles] = useState([])
  const [libraryFiles, setLibraryFiles] = useState([])
  const [filesLoading, setFilesLoading] = useState(false)
  const [filesError, setFilesError] = useState(null)
  const [draggedFile, setDraggedFile] = useState(null)
  const [draggedFileRowKey, setDraggedFileRowKey] = useState(null)
  const [draggedFileVisual, setDraggedFileVisual] = useState(null)
  const [fileDropTargetCardId, setFileDropTargetCardId] = useState(null)
  const [filesSectionOpenById, setFilesSectionOpenById] = useState({
    plan: true,
    library: true,
  })
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
  const filesCloseTimerRef = useRef(null)
  const boardViewToolbarRef = useRef(null)
  const { activeNav, handleNavItemClick } = useWorkspaceNavigation()
  const { filteredEvents: plannerCalendarEvents } = useCalendarEvents({
    enabled: isPlannerPanelMounted,
    includeGeneratedFromCard: false,
    enrichGeneratedCardKinds: false,
  })
  const planLabels = activePlan?.labelsMeta?.length ? activePlan.labelsMeta : LABELS
  const planMembers = activePlan?.membersMeta?.length ? activePlan.membersMeta : MEMBERS
  const canManageMembers = isBackendDriven && (activePlan?.role === 'OWNER' || activePlan?.role === 'ADMIN')

  const refreshMembersMenuPosition = () => {
    const button = membersButtonRef.current
    if (!button) return

    const rect = button.getBoundingClientRect()
    const top = rect.bottom + 10
    const right = Math.max(12, window.innerWidth - rect.right)
    setMembersMenuStyle({ top, right })
  }

  useEffect(() => {
    if (!isMembersOpen) return

    const handleMouseDown = (event) => {
      const button = membersButtonRef.current
      const menu = membersMenuRef.current
      if (button && button.contains(event.target)) return
      if (menu && menu.contains(event.target)) return
      setIsMembersOpen(false)
    }

    refreshMembersMenuPosition()
    document.addEventListener('mousedown', handleMouseDown)
    return () => document.removeEventListener('mousedown', handleMouseDown)
  }, [isMembersOpen])

  useEffect(() => {
    if (!isMembersOpen) return

    const handleKeyDown = (event) => {
      if (event.key !== 'Escape') return
      setIsMembersOpen(false)
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isMembersOpen])

  useEffect(() => {
    if (!isMembersOpen) return

    const handleResize = () => refreshMembersMenuPosition()
    window.addEventListener('resize', handleResize)
    window.addEventListener('scroll', handleResize, true)
    return () => {
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('scroll', handleResize, true)
    }
  }, [isMembersOpen])

  useEffect(() => {
    if (!isMembersOpen) return
    if (!isBackendDriven) return
    if (!activePlan?.id) return
    if (activePlan?.membersMeta?.length) return

    setMembersLoadError(null)

    ensurePlanDetails(activePlan.id).catch((error) => {
      setMembersLoadError(error?.message ?? 'Não foi possível carregar os membros deste plano.')
    })
  }, [activePlan?.id, activePlan?.membersMeta?.length, ensurePlanDetails, isBackendDriven, isMembersOpen])

  useEffect(() => {
    if (canManageMembers || membersPanelTab !== 'invites') return
    setMembersPanelTab('members')
  }, [canManageMembers, membersPanelTab])

  const loadPlanInvites = async () => {
    if (!activePlan?.id || !isBackendDriven || !canManageMembers) {
      setPlanInvites([])
      setPlanInvitesError('')
      setPlanInvitesLoading(false)
      return
    }

    setPlanInvitesLoading(true)
    setPlanInvitesError('')
    try {
      const invites = await apiRequest(`/api/plans/${activePlan.id}/invites`, {
        token: accessToken,
      })
      setPlanInvites(Array.isArray(invites) ? invites : [])
    } catch (error) {
      setPlanInvitesError(error?.message ?? 'Não foi possível carregar os convites deste plano.')
    } finally {
      setPlanInvitesLoading(false)
    }
  }

  useEffect(() => {
    if (!isMembersOpen) return
    if (membersPanelTab !== 'invites') return
    loadPlanInvites()
  }, [accessToken, activePlan?.id, canManageMembers, isBackendDriven, isMembersOpen, membersPanelTab])
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

  const toggleMembersPanel = (event) => {
    const rect = event?.currentTarget?.getBoundingClientRect?.() ?? null

    setIsMembersOpen((value) => {
      const next = !value
      if (next) {
        if (rect) {
          setMembersMenuStyle({
            top: rect.bottom + 10,
            right: Math.max(12, window.innerWidth - rect.right),
          })
        } else {
          refreshMembersMenuPosition()
        }
      }

      return next
    })
  }

  const openInviteModal = () => {
    if (!activePlan?.id) return

    if (!isBackendDriven) {
      showNotification('Convites ficam disponíveis apenas quando a sessão está conectada ao backend.')
      return
    }

    if (!canManageMembers) {
      showNotification('Apenas owner/admin podem convidar membros para este plano.')
      return
    }

    setInviteEmail('')
    setInviteError('')
    setInviteResult(null)
    setInviteSubmitting(false)
    setIsInviteOpen(true)
  }

  const closeInviteModal = () => {
    setIsInviteOpen(false)
    setInviteSubmitting(false)
    setInviteError('')
    setInviteResult(null)
  }

  useEffect(() => {
    if (!isInviteOpen) return

    const onKeyDown = (event) => {
      if (event.key === 'Escape') closeInviteModal()
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [isInviteOpen])

  const submitInvite = async () => {
    if (!activePlan?.id || !isBackendDriven) return
    if (!canManageMembers) return

    const email = inviteEmail.trim()
    if (!email) {
      setInviteError('Informe um e-mail para enviar o convite.')
      return
    }

    setInviteSubmitting(true)
    setInviteError('')

    try {
      const result = await apiRequest(`/api/plans/${activePlan.id}/invites`, {
        method: 'POST',
        token: accessToken,
        body: { email },
      })
      setInviteResult(result)
      await loadPlanInvites()
    } catch (error) {
      setInviteError(describeInviteError(error))
    } finally {
      setInviteSubmitting(false)
    }
  }

  const revokePlanInvite = async (inviteId) => {
    if (!activePlan?.id || !isBackendDriven || !canManageMembers || !inviteId) return

    setRevokingInviteId(inviteId)
    try {
      const response = await apiRequest(`/api/plans/${activePlan.id}/invites/${inviteId}/revoke`, {
        method: 'POST',
        token: accessToken,
      })
      await loadPlanInvites()
      showNotification(response?.message ?? 'Convite revogado com sucesso.')
    } catch (error) {
      showNotification(error?.message ?? 'Não foi possível revogar este convite.')
      await loadPlanInvites()
    } finally {
      setRevokingInviteId('')
    }
  }

  const removeMemberFromPlan = async (memberUserId) => {
    if (!activePlan?.id || !isBackendDriven) return
    if (!canManageMembers) return

    try {
      const response = await apiRequest(`/api/plans/${activePlan.id}/members/${memberUserId}`, {
        method: 'DELETE',
        token: accessToken,
      })
      await refreshPlanDetails(activePlan.id)
      showNotification(response?.message ?? 'Membro removido com sucesso.')
    } catch (error) {
      showNotification(error?.message ?? 'Não foi possível remover este membro.')
    }
  }

  const reloadFileLists = async () => {
    if (!activePlan?.id || !isBackendDriven) {
      setPlanFiles([])
      setLibraryFiles([])
      setFilesError(null)
      return { plan: [], library: [] }
    }

    setFilesLoading(true)
    setFilesError(null)

    try {
      const [planItems, libraryItems] = await Promise.all([
        apiRequest(`/api/files/plans/${activePlan.id}`, {
          token: accessToken,
        }),
        apiRequest('/api/files', {
          token: accessToken,
        }),
      ])
      const nextPlanFiles = planItems.map(mapApiFileItem).filter((file) => file.type !== 'folder')
      const nextLibraryFiles = libraryItems.map(mapApiFileItem).filter((file) => file.type !== 'folder')
      setPlanFiles(nextPlanFiles)
      setLibraryFiles(nextLibraryFiles)
      return { plan: nextPlanFiles, library: nextLibraryFiles }
    } catch (error) {
      const message = error?.message ?? 'Não foi possível carregar os arquivos.'
      setFilesError(message)
      showNotification(message)
      return { plan: [], library: [] }
    } finally {
      setFilesLoading(false)
    }
  }

  const refreshActiveCardFromColumns = (nextColumns, cardId) => {
    const nextCard = nextColumns.flatMap((column) => column.cards).find((card) => card.id === cardId)
    if (nextCard) {
      setActiveCard((current) => (
        current?.card?.id === cardId ? { ...current, card: nextCard } : current
      ))
    }
    return nextCard
  }

  const attachFileToCard = async (file, cardId) => {
    if (!activePlan?.id || !isBackendDriven) return null

    await apiRequest(`/api/files/${file.id}/attach/cards/${cardId}`, {
      method: 'POST',
      token: accessToken,
    })
    const nextColumns = await loadPlanBoard(activePlan.id)
    await reloadFileLists()
    showNotification(`"${file.name}" anexado ao cartão.`)
    return refreshActiveCardFromColumns(nextColumns, cardId)
  }

  const startFileDrag = (event, file, rowKey) => {
    const sourceRow = event.currentTarget
    const sourceRect = sourceRow.getBoundingClientRect()
    const offsetX = event.clientX - sourceRect.left
    const offsetY = event.clientY - sourceRect.top

    setDraggedFile(file)
    setDraggedFileRowKey(rowKey)
    setDraggedFileVisual({
      file,
      left: sourceRect.left,
      top: sourceRect.top,
      width: sourceRect.width,
      height: sourceRect.height,
      offsetX,
      offsetY,
    })
    setFileDropTargetCardId(null)
    event.dataTransfer.effectAllowed = 'copy'
    event.dataTransfer.setData(FILE_DRAG_MIME_TYPE, JSON.stringify({ id: file.id }))
    event.dataTransfer.setData('text/plain', file.name)
    const transparentDragImage = document.createElement('canvas')
    transparentDragImage.width = 1
    transparentDragImage.height = 1
    event.dataTransfer.setDragImage?.(transparentDragImage, 0, 0)
  }

  const updateFileDragVisual = (event) => {
    if (!draggedFileVisual || event.clientX === 0 || event.clientY === 0) return

    setDraggedFileVisual((current) => {
      if (!current) return current
      return {
        ...current,
        left: event.clientX - current.offsetX,
        top: event.clientY - current.offsetY,
      }
    })
  }

  useEffect(() => {
    if (!draggedFileVisual) return undefined

    const handleDragOverWindow = (event) => {
      updateFileDragVisual(event)
    }

    window.addEventListener('dragover', handleDragOverWindow, true)

    return () => {
      window.removeEventListener('dragover', handleDragOverWindow, true)
    }
  }, [Boolean(draggedFileVisual)])

  const endFileDrag = () => {
    setDraggedFile(null)
    setDraggedFileRowKey(null)
    setDraggedFileVisual(null)
    setFileDropTargetCardId(null)
  }

  const handleFileDragOverCard = (cardId) => {
    setFileDropTargetCardId(cardId)
  }

  const handleFileDropOnCard = async (file, cardId) => {
    if (!file?.id || !cardId) {
      endFileDrag()
      return
    }

    setFileDropTargetCardId(cardId)

    try {
      await attachFileToCard(file, cardId)
    } catch (error) {
      showNotification(error?.message ?? 'Não foi possível anexar este arquivo ao cartão.')
    } finally {
      endFileDrag()
    }
  }

  const uploadLocalFileToCard = async (localFile, cardId) => {
    if (!activePlan?.id || !isBackendDriven || !(localFile instanceof File)) return null

    const formData = new FormData()
    formData.append('file', localFile)

    await apiRequest(`/api/files/upload/attach/cards/${cardId}`, {
      method: 'POST',
      token: accessToken,
      body: formData,
    })

    const nextColumns = await loadPlanBoard(activePlan.id)
    await reloadFileLists()
    showNotification(`"${localFile.name}" enviado para a Biblioteca e anexado ao cartão.`)
    return refreshActiveCardFromColumns(nextColumns, cardId)
  }

  const removeAttachmentFromCard = async (attachment) => {
    if (!activePlan?.id || !isBackendDriven) return null

    await apiRequest(`/api/files/attachments/${attachment.id}`, {
      method: 'DELETE',
      token: accessToken,
    })
    const nextColumns = await loadPlanBoard(activePlan.id)
    showNotification(`"${attachment.name}" removido do cartão.`)
    return refreshActiveCardFromColumns(nextColumns, activeCard?.card?.id)
  }

  const downloadFile = async (file) => {
    if (!isBackendDriven) {
      showNotification(`Baixando "${file.name}"...`)
      return
    }

    const blob = await apiRequest(`/api/files/${file.fileId ?? file.id}/download`, {
      token: accessToken,
      responseType: 'blob',
    })
    triggerBlobDownload(blob, file.name)
    showNotification(`"${file.name}" baixado.`)
  }

  const shareFileWithPlan = async (file) => {
    if (!activePlan?.id || !isBackendDriven) return

    await apiRequest(`/api/files/${file.id}/share/plans/${activePlan.id}`, {
      method: 'POST',
      token: accessToken,
    })
    await reloadFileLists()
    showNotification(`"${file.name}" compartilhado com o plano.`)
  }

  const unshareFileFromPlan = async (file) => {
    if (!activePlan?.id || !isBackendDriven) return

    await apiRequest(`/api/files/${file.id}/share/plans/${activePlan.id}`, {
      method: 'DELETE',
      token: accessToken,
    })
    const nextColumns = await loadPlanBoard(activePlan.id)
    await reloadFileLists()
    if (activeCard?.card?.id) {
      refreshActiveCardFromColumns(nextColumns, activeCard.card.id)
    }
    showNotification(`"${file.name}" removido do plano.`)
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
    if (filesCloseTimerRef.current) {
      clearTimeout(filesCloseTimerRef.current)
      filesCloseTimerRef.current = null
    }
    setIsBoardSwitcherOpen(false)
    setIsInboxOpen(false)
    setIsInboxPanelMounted(false)
    setIsFilesOpen(false)
    setIsFilesPanelMounted(false)
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
    if (filesCloseTimerRef.current) {
      clearTimeout(filesCloseTimerRef.current)
      filesCloseTimerRef.current = null
    }
    setIsBoardSwitcherOpen(false)
    setIsPlannerOpen(false)
    setIsPlannerPanelMounted(false)
    setIsFilesOpen(false)
    setIsFilesPanelMounted(false)
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

  const openFiles = () => {
    if (filesCloseTimerRef.current) {
      clearTimeout(filesCloseTimerRef.current)
      filesCloseTimerRef.current = null
    }
    if (plannerCloseTimerRef.current) {
      clearTimeout(plannerCloseTimerRef.current)
      plannerCloseTimerRef.current = null
    }
    if (inboxCloseTimerRef.current) {
      clearTimeout(inboxCloseTimerRef.current)
      inboxCloseTimerRef.current = null
    }
    setIsBoardSwitcherOpen(false)
    setIsPlannerOpen(false)
    setIsPlannerPanelMounted(false)
    setIsInboxOpen(false)
    setIsInboxPanelMounted(false)
    setIsFilesPanelMounted(true)
    window.requestAnimationFrame(() => setIsFilesOpen(true))
  }

  const closeFiles = () => {
    setIsFilesOpen(false)
    if (filesCloseTimerRef.current) {
      clearTimeout(filesCloseTimerRef.current)
    }
    filesCloseTimerRef.current = setTimeout(() => {
      setIsFilesPanelMounted(false)
      filesCloseTimerRef.current = null
    }, 260)
  }

  const closeFloatingPanel = () => {
    closeInbox()
    closePlanner()
    closeFiles()
  }

  useEffect(() => {
    if (!isFilesPanelMounted) return
    reloadFileLists()
  }, [activePlan?.id, isFilesPanelMounted])

  const isFilesSectionOpen = (sectionId) => filesSectionOpenById?.[sectionId] !== false

  const toggleFilesSection = (sectionId) => {
    setFilesSectionOpenById((current) => {
      const currentValue = current?.[sectionId] !== false
      return {
        ...(current ?? {}),
        [sectionId]: !currentValue,
      }
    })
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
    if (filesCloseTimerRef.current) {
      clearTimeout(filesCloseTimerRef.current)
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

  const renderFilesPanel = () => {
    const runFileAction = async (action) => {
      try {
        await action()
      } catch (error) {
        showNotification(error?.message ?? 'Não foi possível concluir a ação.')
      }
    }

    const sharedPlanFileIds = new Set(planFiles.map((file) => file.id))
    const fileSections = [
      {
        id: 'plan',
        title: 'Plano',
        emptyText: 'Nenhum arquivo compartilhado com este plano.',
        files: planFiles,
        count: planFiles.length,
      },
      {
        id: 'library',
        title: 'Biblioteca',
        emptyText: 'Nenhum arquivo disponível na sua biblioteca.',
        files: libraryFiles,
        count: libraryFiles.filter((file) => !sharedPlanFileIds.has(file.id)).length,
      },
    ]

    const renderFileRow = (file, sectionId) => {
      const isSharedLibraryFile = sectionId === 'library' && sharedPlanFileIds.has(file.id)
      const rowKey = `${sectionId}:${file.id}`
      const isDraggedFileRow = draggedFileRowKey === rowKey

      return (
        <div
          key={file.id}
          className={`${styles.filesListRow} ${isSharedLibraryFile ? styles.filesListRowMuted : ''} ${isDraggedFileRow ? styles.filesListRowDragging : ''}`}
          title={isSharedLibraryFile ? 'Já compartilhado com o plano' : undefined}
          draggable
          onDragStart={(event) => {
            startFileDrag(event, file, rowKey)
          }}
          onDrag={updateFileDragVisual}
          onDragEnd={endFileDrag}
        >
          <span className={styles.filesListIcon}><Icon.Files /></span>
          <div className={styles.filesListBody}>
            <p className={styles.filesListName}>{file.name}</p>
            <p className={styles.filesListMeta}>{formatFileSize(file.size)} · {file.modified}</p>
          </div>
          {isSharedLibraryFile ? null : (
            <div className={styles.filesListActions}>
              <button
                type="button"
                className={styles.filesActionButton}
                onClick={() => runFileAction(() => downloadFile(file))}
                title="Baixar"
                aria-label={`Baixar ${file.name}`}
              >
                <Icon.Download />
              </button>
              {sectionId === 'library' ? (
                <button
                  type="button"
                  className={styles.filesActionTextButton}
                  onClick={() => runFileAction(() => shareFileWithPlan(file))}
                >
                  Compartilhar
                </button>
              ) : file.canUnshare ? (
                <button
                  type="button"
                  className={styles.filesActionTextButton}
                  onClick={() => runFileAction(() => unshareFileFromPlan(file))}
                >
                  Remover
                </button>
              ) : null}
            </div>
          )}
        </div>
      )
    }

    const renderFileSection = (section) => {
      const expanded = isFilesSectionOpen(section.id)
      return (
        <div key={section.id} className={styles.plannerSection}>
          <button
            type="button"
            className={styles.plannerSectionHeaderBtn}
            aria-expanded={expanded}
            onClick={() => toggleFilesSection(section.id)}
          >
            <span className={styles.plannerSectionChevron} aria-hidden="true">
              <Icon.Chevron />
            </span>
            <span className={styles.plannerSectionTitle}>{section.title}</span>
            <span className={styles.plannerSectionCount}>{section.count ?? section.files.length}</span>
          </button>
          {expanded ? (
            <div className={styles.plannerSectionBody}>
              {section.files.length ? (
                section.files.map((file) => renderFileRow(file, section.id))
              ) : (
                <p className={styles.filesSectionEmpty}>{section.emptyText}</p>
              )}
            </div>
          ) : null}
        </div>
      )
    }

    return (
      <aside
        id="board-files-panel"
        className={`${styles.plannerPanel} ${styles.filesPanel} ${isFilesOpen ? '' : styles.plannerPanelClosing}`}
        aria-label="Arquivos do plano"
      >
        <div className={styles.plannerPanelHeader}>
          <div>
            <span className={styles.plannerEyebrow}>Arquivos</span>
            <h2>Plano</h2>
          </div>
          <button
            type="button"
            className={styles.plannerCloseButton}
            aria-label="Fechar arquivos"
            onClick={closeFiles}
          >
            <Icon.X />
          </button>
        </div>

        <section className={styles.filesList} aria-label="Arquivos do plano e da biblioteca">
          {!isBackendDriven ? (
            <div className={styles.filesEmptyState}>
              <Icon.Lock />
              <strong>Conecte ao backend</strong>
              <p>Arquivos do plano ficam disponíveis em sessões autenticadas.</p>
            </div>
          ) : filesLoading ? (
            Array.from({ length: 5 }, (_, index) => (
              <div key={`file-loading-${index}`} className={styles.filesListSkeleton} />
            ))
          ) : filesError ? (
            <div className={styles.filesEmptyState}>
              <Icon.Files />
              <strong>Não foi possível carregar</strong>
              <p>{filesError}</p>
              <button type="button" onClick={reloadFileLists}>Tentar novamente</button>
            </div>
          ) : planFiles.length || libraryFiles.length ? (
            fileSections.map(renderFileSection)
          ) : (
            <div className={styles.filesEmptyState}>
              <Icon.Files />
              <strong>Nada para mostrar</strong>
              <p>Nenhum arquivo disponível no plano ou na sua biblioteca.</p>
            </div>
          )}
        </section>
      </aside>
    )
  }

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
        contentClassName={`${styles.boardWrapper} ${isPlannerPanelMounted || isInboxPanelMounted || isFilesPanelMounted ? styles.boardWrapperPlannerMounted : ''} ${isPlannerOpen || isInboxOpen || isFilesOpen ? styles.boardWrapperWithPlanner : ''}`}
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
                Users: Icon.Users,
                Filter: Icon.Filter,
                Share: Icon.Share,
              }}
              styles={styles}
              onAddMember={openInviteModal}
              onOpenMembers={toggleMembersPanel}
              membersButtonRef={membersButtonRef}
              onFilter={() => showNotification('Filtros avançados em breve')}
              onShare={() => showNotification('Link do quadro copiado')}
              notifications={<InviteNotifications />}
            />
          )}
        />

        {isMembersOpen ? (
          <div
            ref={membersMenuRef}
            className={styles.planMembersMenu}
            style={membersMenuStyle ?? undefined}
            aria-label="Membros do plano"
            role="menu"
          >
            <div className={styles.planMembersPanelInner}>
              <div className={styles.planMembersTabs} role="tablist" aria-label="Colaboração do plano">
                <button
                  type="button"
                  className={`${styles.planMembersTab} ${membersPanelTab === 'members' ? styles.planMembersTabActive : ''}`}
                  onClick={() => setMembersPanelTab('members')}
                >
                  Membros
                </button>
                {canManageMembers ? (
                  <button
                    type="button"
                    className={`${styles.planMembersTab} ${membersPanelTab === 'invites' ? styles.planMembersTabActive : ''}`}
                    onClick={() => setMembersPanelTab('invites')}
                  >
                    Convites
                    {planInvites.filter((invite) => invite.status === 'PENDING').length ? (
                      <span>{planInvites.filter((invite) => invite.status === 'PENDING').length}</span>
                    ) : null}
                  </button>
                ) : null}
              </div>

              {membersPanelTab === 'members' ? (
                !activePlan ? (
                  <p className={styles.planMembersEmpty}>Nenhum plano ativo.</p>
                ) : membersLoadError ? (
                  <p className={styles.planMembersEmpty}>{membersLoadError}</p>
                ) : !planMembers?.length ? (
                  <p className={styles.planMembersEmpty}>Nenhum membro para exibir.</p>
                ) : (
                  <div className={styles.planMembersList}>
                    {planMembers.map((member) => {
                      const isOwner = member.role === 'OWNER'
                      const isSelf = currentUser?.id && member.id === currentUser.id
                      const canRemove = canManageMembers && !isOwner && !isSelf

                      return (
                        <div key={member.id} className={styles.planMemberRow} role="menuitem">
                          <span className={styles.planMemberAvatar} style={{ background: member.color }}>
                            {member.initials}
                          </span>
                          <div className={styles.planMemberInfo}>
                            <span className={styles.planMemberName}>{member.name}</span>
                            <span className={styles.planMemberEmail}>{member.email}</span>
                          </div>
                          <span className={styles.planMemberRole}>{member.role === 'OWNER' ? 'Owner' : member.role === 'ADMIN' ? 'Admin' : 'Membro'}</span>
                          {canRemove ? (
                            <button
                              type="button"
                              className={styles.planMemberRemove}
                              onClick={() => removeMemberFromPlan(member.id)}
                            >
                              Remover
                            </button>
                          ) : null}
                        </div>
                      )
                    })}
                  </div>
                )
              ) : planInvitesLoading ? (
                <p className={styles.planMembersEmpty}>Carregando convites...</p>
              ) : planInvitesError ? (
                <p className={styles.planMembersEmpty}>{planInvitesError}</p>
              ) : !planInvites.length ? (
                <p className={styles.planMembersEmpty}>Nenhum convite enviado para este plano.</p>
              ) : (
                <div className={styles.planInvitesList}>
                  {planInvites.map((invite) => {
                    const pending = invite.status === 'PENDING'
                    const revoking = revokingInviteId === invite.inviteId

                    return (
                      <div key={invite.inviteId} className={styles.planInviteRow} role="menuitem">
                        <div className={styles.planInviteInfo}>
                          <span className={styles.planMemberName}>{invite.invitedEmail}</span>
                          <span className={styles.planMemberEmail}>
                            {formatInviteStatus(invite.status)}
                            {invite.expiresAt?.text ? ` · expira em ${invite.expiresAt.text}` : ''}
                          </span>
                        </div>
                        <span className={`${styles.planInviteStatus} ${pending ? styles.planInviteStatusPending : ''}`}>
                          {formatInviteStatus(invite.status)}
                        </span>
                        {pending ? (
                          <button
                            type="button"
                            className={styles.planMemberRemove}
                            onClick={() => revokePlanInvite(invite.inviteId)}
                            disabled={revoking}
                          >
                            {revoking ? 'Revogando...' : 'Revogar'}
                          </button>
                        ) : null}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        ) : null}

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
                draggedFile={draggedFile}
                fileDropTargetCardId={fileDropTargetCardId}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onDragEnd={handleDragEnd}
                onFileDragOver={handleFileDragOverCard}
                onFileDrop={handleFileDropOnCard}
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
            className={`${styles.boardViewToolbarItem} ${!isPlannerOpen && !isInboxOpen && !isFilesOpen ? styles.boardViewToolbarItemActive : ''}`}
            aria-current={!isPlannerOpen && !isInboxOpen && !isFilesOpen ? 'page' : undefined}
            onClick={closeFloatingPanel}
          >
            <Icon.Board />
            <span>Quadro</span>
          </button>

          <button
            type="button"
            className={`${styles.boardViewToolbarItem} ${isFilesOpen ? styles.boardViewToolbarItemActive : ''}`}
            aria-expanded={isFilesOpen}
            aria-controls="board-files-panel"
            onClick={openFiles}
          >
            <Icon.Files />
            <span>Arquivos</span>
          </button>
        </div>
        </div>

        {isInboxPanelMounted && renderInboxPanel()}
        {isPlannerPanelMounted && renderPlannerPanel()}
        {isFilesPanelMounted && renderFilesPanel()}
        {draggedFileVisual ? (
          <div
            className={styles.filesDraggedItem}
            style={{
              left: draggedFileVisual.left,
              top: draggedFileVisual.top,
              width: draggedFileVisual.width,
              minHeight: draggedFileVisual.height,
            }}
            aria-hidden="true"
          >
            <span className={styles.filesListIcon}><Icon.Files /></span>
            <div className={styles.filesListBody}>
              <p className={styles.filesListName}>{draggedFileVisual.file.name}</p>
              <p className={styles.filesListMeta}>{formatFileSize(draggedFileVisual.file.size)} · {draggedFileVisual.file.modified}</p>
            </div>
          </div>
        ) : null}
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
          planFiles={planFiles}
          libraryFiles={libraryFiles}
          filesLoading={filesLoading}
          filesError={filesError}
          onLoadFiles={reloadFileLists}
          onAttachFile={attachFileToCard}
          onUploadLocalFile={uploadLocalFileToCard}
          onRemoveAttachment={removeAttachmentFromCard}
          onDownloadFile={downloadFile}
        />
      )}

      {isInviteOpen && (
        <div
          className={styles.modalOverlay}
          role="dialog"
          aria-modal="true"
          aria-label="Convidar membro"
          onMouseDown={closeInviteModal}
        >
          <div
            className={`${styles.cardModal} ${styles.inviteModal}`}
            onMouseDown={(event) => event.stopPropagation()}
          >
            <header className={styles.cmHeader}>
              <div className={styles.cmHeaderLeft}>
                <strong>Convidar membro</strong>
              </div>

              <div className={styles.cmHeaderActions}>
                <button type="button" className={styles.cmIconBtn} onClick={closeInviteModal} aria-label="Fechar">
                  <Icon.X />
                </button>
              </div>
            </header>

            <div className={styles.inviteBody}>
              <label className={styles.inviteField}>
                <span className={styles.inviteLabel}>E-mail</span>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(event) => setInviteEmail(event.target.value)}
                  placeholder="membro@exemplo.com"
                  className={styles.inviteInput}
                  disabled={inviteSubmitting}
                />
              </label>

              {inviteError ? <p className={styles.inviteError}>{inviteError}</p> : null}

              <div className={styles.inviteActions}>
                <button
                  type="button"
                  className={styles.inviteSubmit}
                  onClick={submitInvite}
                  disabled={inviteSubmitting || !inviteEmail.trim()}
                >
                  {inviteSubmitting ? 'Enviando...' : 'Convidar'}
                </button>

                <button type="button" className={styles.inviteCancel} onClick={closeInviteModal} disabled={inviteSubmitting}>
                  Cancelar
                </button>
              </div>

              {inviteResult?.invitedEmail ? (
                <div className={styles.inviteResult}>
                  <p className={styles.inviteResultTitle}>Convite enviado</p>
                  <p className={styles.inviteResultText}>
                    Convite enviado para {inviteResult.invitedEmail}.
                  </p>
                  {inviteResult.expiresAt?.text ? (
                    <p className={styles.inviteResultHint}>Expira em {inviteResult.expiresAt.text}.</p>
                  ) : null}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {notification && (
        <div className={styles.boardNotification} role="status" aria-live="polite">
          {notification}
        </div>
      )}

    </AppThemeScope>
  )
}

