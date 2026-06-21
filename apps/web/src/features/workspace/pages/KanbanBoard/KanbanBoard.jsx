import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { DndContext, DragOverlay } from '@dnd-kit/core'
import { SortableContext, horizontalListSortingStrategy } from '@dnd-kit/sortable'
import { useLocation, useParams, useSearchParams } from 'react-router-dom'
import { useAuth } from '../../../auth/context/AuthContext.jsx'
import { buildWorkspaceBoardPath } from '../../../../shared/config/routes.js'
import { apiRequest, triggerBlobDownload } from '../../../../shared/api/apiClient.js'
import ProductAppShell from '../../../../shared/components/ProductAppShell/ProductAppShell.jsx'
import WorkspaceHeader from '../../../../shared/components/WorkspaceHeader/WorkspaceHeader.jsx'
import AuthenticatedAvatar from '../../../../shared/components/AuthenticatedAvatar/AuthenticatedAvatar.jsx'
import CardModal from '../../components/CardModal/CardModal.jsx'
import AddColumnComposer from '../../components/AddColumnComposer/AddColumnComposer.jsx'
import BoardHeader from '../../components/BoardHeader/BoardHeader.jsx'
import KanbanColumn from '../../components/KanbanColumn/KanbanColumn.jsx'
import KanbanCard from '../../components/KanbanCard/KanbanCard.jsx'
import InboxDropPanel from '../../components/InboxDropPanel/InboxDropPanel.jsx'
import { usePlans } from '../../context/PlansContext.jsx'
import { useBoardColumns } from '../../hooks/useBoardColumns.js'
import { moveCardInColumns } from '../../hooks/boardDnDUtils.js'
import { useKanbanBoardDnd } from '../../hooks/useKanbanBoardDnd.js'
import { useResolvedPlanRoute } from '../../hooks/useResolvedPlanRoute.js'
import { useCalendarEvents } from '../../../calendar/hooks/useCalendarEvents.js'
import { CalendarWorkspaceView } from '../../../calendar/pages/CalendarPage/CalendarPage.jsx'
import { usePreferences } from '../../../preferences/context/PreferencesContext.jsx'
import AppThemeScope from '../../../preferences/components/AppThemeScope/AppThemeScope.jsx'
import { getFileTypeFromName } from '../../../files/data/libraryRepository.js'
import { buildPlannerView, filterPlannerItems } from './plannerFilters.js'
import {
  KANBAN_ADD_LIST_COLOR_OPTIONS,
  KANBAN_DEFAULT_LABELS,
  resolveKanbanAccentColor,
  resolveKanbanAccentForeground,
} from '../../data/kanbanColorPalette.js'
import {
  KANBAN_COLUMN_STATUS_OPTIONS,
  KANBAN_DEFAULT_COLUMN_STATUS,
} from '../../data/kanbanColumnStatusOptions.js'
import IntelligenceComposer from '../../../../shared/components/IntelligenceComposer/IntelligenceComposer.jsx'
import IntelligenceConversationThread from '../../../intelligence/components/IntelligenceConversationThread/IntelligenceConversationThread.jsx'
import { useIntelligenceComposerContext } from '../../../intelligence/hooks/useIntelligenceComposerContext.js'
import { useAiConversation } from '../../../intelligence/hooks/useAiConversation.js'
import styles from './KanbanBoard.module.css'

/* ═══════════════════════════════════════════════════════════════
   ICONS
═══════════════════════════════════════════════════════════════ */
const Icon = {
  Inbox: () => <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><path d="M3 3h10v10H3V3z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/><path d="M3 9h3l1.2 2h1.6L10 9h3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  X: () => <svg width="13" height="13" viewBox="0 0 14 14" fill="none"><path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>,
  Send: () => <svg width="13" height="13" viewBox="0 0 14 14" fill="none"><path d="M12 2L2 6.5l4 1.5 1.5 4L12 2z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/></svg>,
  Trash: () => <svg width="13" height="13" viewBox="0 0 14 14" fill="none"><path d="M2 4h10M5 4V2.5h4V4M5.5 6.5v4M8.5 6.5v4M3 4l.8 8h6.4L11 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  Lock: () => <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="3" y="6" width="8" height="6" rx="1.4" stroke="currentColor" strokeWidth="1.3"/><path d="M4.8 6V4.4a2.2 2.2 0 1 1 4.4 0V6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>,
  Sun: () => <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="2.5" stroke="currentColor" strokeWidth="1.3"/><path d="M8 1.8v2M8 12.2v2M1.8 8h2M12.2 8h2M3 3l1.4 1.4M11.6 11.6L13 13M13 3l-1.4 1.4M4.4 11.6L3 13" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>,
  Star: () => <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><path d="M8 2.2l1.7 3.5 3.9.6-2.8 2.7.7 3.9L8 11.1 4.5 12.9l.7-3.9L2.4 6.3l3.9-.6L8 2.2z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/></svg>,
  StarFill: () => <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><path d="M8 2.2l1.7 3.5 3.9.6-2.8 2.7.7 3.9L8 11.1 4.5 12.9l.7-3.9L2.4 6.3l3.9-.6L8 2.2z" fill="currentColor"/></svg>,
  List: () => <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><path d="M5 5h8M5 10.5h8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/><circle cx="2.5" cy="5" r=".9" fill="currentColor"/><circle cx="2.5" cy="10.5" r=".9" fill="currentColor"/></svg>,
  CheckCircle: () => <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6.2" stroke="currentColor" strokeWidth="1.3"/><path d="M5.3 8.3l1.6 1.6 3.7-4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  User: () => <svg width="13" height="13" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="5" r="2.5" stroke="currentColor" strokeWidth="1.3"/><path d="M2 12c0-2.2 2.2-4 5-4s5 1.8 5 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>,
  Check: () => <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 6l2.5 2.5 5.5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  Calendar: () => <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><rect x="2" y="3" width="12" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.3"/><path d="M5 1.8v2.8M11 1.8v2.8M2.5 6.5h11" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>,
  Chevron: () => <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M4.5 3l3 3-3 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  Board: () => <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><rect x="1" y="3" width="4" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.3"/><rect x="6" y="3" width="4" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.3"/><rect x="11" y="3" width="4" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.3"/></svg>,
  Bolt: () => <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><path d="M9.1 1.8L4.8 8h2.9L6.9 14.2 11.2 8H8.3l.8-6.2z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>,
}

/* ═══════════════════════════════════════════════════════════════
   INITIAL DATA
═══════════════════════════════════════════════════════════════ */
const MEMBERS = [
  { id: 'm1', initials: 'AS', color: '#000'    },
  { id: 'm2', initials: 'MK', color: '#d4aef1' },
  { id: 'm3', initials: 'TK', color: '#4290da' },
  { id: 'm4', initials: 'SR', color: '#0f703a' },
]

const uid = () => Math.random().toString(36).slice(2, 9)

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

function mapApiAttachmentItem(item) {
  return {
    id: item.id,
    fileId: item.fileId,
    name: item.name,
    type: item.type === 'FOLDER' ? 'folder' : getFileTypeFromName(item.name),
    mimeType: item.mimeType ?? '',
    size: item.sizeBytes ?? 0,
    attachedBy: item.attachedBy ?? null,
    attachedByCurrentUser: Boolean(item.attachedByCurrentUser),
    canRemove: Boolean(item.canRemove),
    createdAt: item.createdAt ?? null,
  }
}

function mapAttachmentToFileItem(attachment) {
  return {
    id: attachment.fileId,
    name: attachment.name,
    type: attachment.type,
    mimeType: attachment.mimeType ?? '',
    size: attachment.size ?? 0,
    modified: attachment.createdAt?.text ?? 'Agora',
    sharedByCurrentUser: true,
    canUnshare: true,
  }
}

function upsertFileItem(items, nextItem) {
  if (!Array.isArray(items) || !nextItem?.id) {
    return items
  }

  const existingIndex = items.findIndex((item) => item.id === nextItem.id)
  if (existingIndex < 0) {
    return [...items, nextItem]
  }

  const currentItem = items[existingIndex]
  const mergedItem = { ...currentItem, ...nextItem }
  const hasChanges = Object.keys(mergedItem).some((key) => mergedItem[key] !== currentItem[key])
  if (!hasChanges) {
    return items
  }

  const nextItems = [...items]
  nextItems[existingIndex] = mergedItem
  return nextItems
}

function appendAttachmentToColumns(columns, cardId, nextAttachment) {
  if (!Array.isArray(columns) || !cardId || !nextAttachment?.id) {
    return columns
  }

  let hasChanges = false

  const nextColumns = columns.map((column) => {
    let columnChanged = false
    const nextCards = column.cards.map((card) => {
      if (card.id !== cardId) {
        return card
      }

      const currentAttachments = Array.isArray(card.attachments) ? card.attachments : []
      const existingIndex = currentAttachments.findIndex((attachment) => (
        attachment.id === nextAttachment.id || attachment.fileId === nextAttachment.fileId
      ))
      const nextAttachments = existingIndex >= 0
        ? currentAttachments.map((attachment, index) => (
            index === existingIndex ? { ...attachment, ...nextAttachment } : attachment
          ))
        : [...currentAttachments, nextAttachment]

      const attachmentsChanged = nextAttachments.length !== currentAttachments.length
        || nextAttachments.some((attachment, index) => attachment !== currentAttachments[index])

      if (!attachmentsChanged) {
        return card
      }

      columnChanged = true
      hasChanges = true
      return {
        ...card,
        attachments: nextAttachments,
      }
    })

    return columnChanged ? { ...column, cards: nextCards } : column
  })

  return hasChanges ? nextColumns : columns
}

function removeAttachmentFromColumns(columns, attachmentId) {
  if (!Array.isArray(columns) || !attachmentId) {
    return columns
  }

  let hasChanges = false

  const nextColumns = columns.map((column) => {
    let columnChanged = false
    const nextCards = column.cards.map((card) => {
      const currentAttachments = Array.isArray(card.attachments) ? card.attachments : []
      const nextAttachments = currentAttachments.filter((attachment) => attachment.id !== attachmentId)
      if (nextAttachments.length === currentAttachments.length) {
        return card
      }

      columnChanged = true
      hasChanges = true
      return {
        ...card,
        attachments: nextAttachments,
      }
    })

    return columnChanged ? { ...column, cards: nextCards } : column
  })

  return hasChanges ? nextColumns : columns
}

function insertCardInOrder(cards, nextCard) {
  const cardsWithoutCurrent = cards.filter((card) => card.id !== nextCard.id)
  const rawPosition = nextCard.position

  if (!Number.isFinite(rawPosition)) {
    return [...cardsWithoutCurrent, nextCard]
  }

  const insertionIndex = Math.max(0, Math.min(rawPosition, cardsWithoutCurrent.length))
  return [
    ...cardsWithoutCurrent.slice(0, insertionIndex),
    nextCard,
    ...cardsWithoutCurrent.slice(insertionIndex),
  ]
}

function replaceCardInColumns(columns, nextCard) {
  if (!Array.isArray(columns) || !nextCard?.id) {
    return columns
  }

  const inferredColumnId = nextCard.columnId
    ?? columns.find((column) => column.cards.some((card) => card.id === nextCard.id))?.id
  if (!inferredColumnId) {
    return columns
  }

  const cardForColumns = nextCard.columnId === inferredColumnId
    ? nextCard
    : { ...nextCard, columnId: inferredColumnId }
  const hasTargetColumn = columns.some((column) => column.id === inferredColumnId)
  if (!hasTargetColumn) {
    return columns
  }

  let hasChanges = false

  const nextColumns = columns.map((column) => {
    const hasCard = column.cards.some((card) => card.id === nextCard.id)

    if (column.id === inferredColumnId) {
      const nextCards = hasCard
        ? column.cards.map((card) => (card.id === cardForColumns.id ? cardForColumns : card))
        : insertCardInOrder(column.cards, cardForColumns)
      const cardsChanged = nextCards.length !== column.cards.length
        || nextCards.some((card, index) => card !== column.cards[index])

      if (!cardsChanged) {
        return column
      }

      hasChanges = true
      return {
        ...column,
        cards: nextCards,
      }
    }

    if (!hasCard) {
      return column
    }

    hasChanges = true
    return {
      ...column,
      cards: column.cards.filter((card) => card.id !== nextCard.id),
    }
  })

  return hasChanges ? nextColumns : columns
}

function removeCardFromColumns(columns, cardId) {
  if (!Array.isArray(columns) || !cardId) {
    return columns
  }

  let hasChanges = false

  const nextColumns = columns.map((column) => {
    const nextCards = column.cards.filter((card) => card.id !== cardId)
    if (nextCards.length === column.cards.length) {
      return column
    }

    hasChanges = true
    return {
      ...column,
      cards: nextCards,
    }
  })

  return hasChanges ? nextColumns : columns
}

function findCardInColumns(columns, cardId) {
  if (!Array.isArray(columns) || !cardId) {
    return null
  }

  return columns.flatMap((column) => column.cards).find((card) => card.id === cardId) ?? null
}

function normalizeCardDateLike(value) {
  if (!value) return ''
  if (typeof value === 'string') return value
  return value.iso ?? value.text ?? ''
}

function buildCardPersistenceSignature(card) {
  if (!card) {
    return null
  }

  return JSON.stringify({
    id: card.id ?? null,
    columnId: card.columnId ?? null,
    position: Number.isFinite(card.position) ? card.position : null,
    title: card.title ?? '',
    description: card.description ?? '',
    isCompleted: Boolean(card.isCompleted),
    starred: Boolean(card.starred),
    labelId: card.labelId ?? '',
    memberIds: Array.isArray(card.memberIds) ? card.memberIds : [],
    dueDate: card.dueDate ?? '',
    startAt: normalizeCardDateLike(card.startAt),
    dueAt: normalizeCardDateLike(card.dueAt),
    comments: Array.isArray(card.comments)
      ? card.comments.map((comment) => ({
          id: comment.id ?? null,
          text: comment.text ?? '',
          kind: comment.kind ?? '',
          createdAtIso: comment.createdAtIso ?? '',
        }))
      : [],
    attachments: Array.isArray(card.attachments)
      ? card.attachments.map((attachment) => ({
          id: attachment.id ?? null,
          fileId: attachment.fileId ?? null,
          name: attachment.name ?? '',
          size: attachment.size ?? 0,
        }))
      : [],
  })
}

function areCardsEquivalentForPersistence(leftCard, rightCard) {
  if (leftCard === rightCard) {
    return true
  }
  if (!leftCard || !rightCard) {
    return false
  }
  return buildCardPersistenceSignature(leftCard) === buildCardPersistenceSignature(rightCard)
}

function dateKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function describeInboxError(error) {
  const messageByCode = {
    CARTAO_SEM_DESTINATARIOS: 'Escolha ao menos um membro para receber este cartão por e-mail.',
    DESTINATARIO_INVALIDO: 'Todos os destinatários precisam fazer parte deste plano.',
    GMAIL_NAO_CONECTADO: 'Gmail não conectado para este usuário. Conecte o Gmail em Configurações e tente novamente.',
    GMAIL_SCOPE_AUSENTE: 'A conexão Gmail não tem permissão de envio. Reconecte o Gmail em Configurações.',
    GMAIL_TOKEN_REFRESH_FALHOU: 'Não foi possível renovar a autorização Gmail. Reconecte o Gmail em Configurações.',
    GMAIL_ENVIO_CONVITE_FALHOU: 'O Gmail recusou o envio do e-mail. Verifique a conta conectada e tente novamente.',
    GMAIL_API_NAO_HABILITADA: 'A API do Gmail não está habilitada no projeto Google Cloud. Habilite Gmail API e tente novamente.',
  }

  if (!messageByCode[error?.code]) {
    return error?.message ?? 'Não foi possível enviar o cartão por e-mail.'
  }

  return `${messageByCode[error.code]} Código: ${error.code}.`
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
  const location = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()
  const { accessToken, currentUser } = useAuth()
  const {
    updatePlanBoard,
    isBackendDriven,
    loadPlanBoard,
    applyBoardView,
    ensurePlanDetails,
    isLoading,
  } = usePlans()
  const { plans, activePlan, openPlan } = useResolvedPlanRoute({
    planId,
    buildPath: buildWorkspaceBoardPath,
  })
  const [boardViewMode, setBoardViewMode] = useState(() => {
    if (location.state?.boardViewMode === 'calendar') return 'calendar'
    return 'kanban'
  })
  const [activeCard,setActiveCard]= useState(null)   // { card, colTitle }
  const [addingCol, setAddingCol] = useState(false)
  const [newColTitle,setNewColTitle] = useState('')
  const [newColColor, setNewColColor] = useState('')
  const [newColStatus, setNewColStatus] = useState(KANBAN_DEFAULT_COLUMN_STATUS)
  const [addColumnError, setAddColumnError] = useState(null)
  const [boardLoadError, setBoardLoadError] = useState(null)
  const [notification, setNotification] = useState(null)
  const [isInboxOpen, setIsInboxOpen] = useState(false)
  const [isInboxPanelMounted, setIsInboxPanelMounted] = useState(false)
  const [inboxRecipientCard, setInboxRecipientCard] = useState(null)
  const [inboxSelectedMemberIds, setInboxSelectedMemberIds] = useState([])
  const [inboxSendingCardId, setInboxSendingCardId] = useState('')
  const [inboxError, setInboxError] = useState('')
  const [inboxItems, setInboxItems] = useState([])
  const [isClearingInbox, setIsClearingInbox] = useState(false)
  const [isPlannerOpen, setIsPlannerOpen] = useState(false)
  const [isPlannerPanelMounted, setIsPlannerPanelMounted] = useState(false)
  const [isIntelligenceOpen, setIsIntelligenceOpen] = useState(false)
  const [isIntelligencePanelMounted, setIsIntelligencePanelMounted] = useState(false)
  const [intelligenceDraft, setIntelligenceDraft] = useState('')
  const [kanbanAiChips, setKanbanAiChips] = useState([])
  const intelligenceActiveConnectors = kanbanAiChips.filter((c) => c.kind === 'connector').map((c) => c.type)
  const {
    messages: intelligenceMessages,
    isThinking: isIntelligenceThinking,
    hasConversation: hasIntelligenceConversation,
    submitMessage: submitIntelligenceMessage,
    canSubmitWith: canSubmitIntelligenceMessage,
  } = useAiConversation({
    accessToken,
    enabled: isIntelligenceOpen || isIntelligencePanelMounted,
    scope: {
      planId: activePlan?.id ?? null,
      planName: activePlan?.name ?? null,
    },
    aiChips: kanbanAiChips,
    setAiChips: setKanbanAiChips,
  })
  const [toolbarMetrics, setToolbarMetrics] = useState({ left: null, width: 0, height: 44, bottom: 24 })
  const [planFiles, setPlanFiles] = useState([])
  const [libraryFiles, setLibraryFiles] = useState([])
  const [filesLoading, setFilesLoading] = useState(false)
  const [filesError, setFilesError] = useState(null)
  const [isPlannerFilterOpen, setIsPlannerFilterOpen] = useState(false)
  const [plannerFilter, setPlannerFilter] = useState('my-day')
  const plannerFilterWrapRef = useRef(null)
  const [plannerPinnedById, setPlannerPinnedById] = useState({})
  const { generalPreferences, localPreferences, formatClockTime } = usePreferences()
  const timeZone = generalPreferences.timezone
  const dateFormat = generalPreferences.dateFormat
  const boardAccentColor = resolveKanbanAccentColor(localPreferences?.kanbanAccentColor)
  const boardAccentForeground = resolveKanbanAccentForeground(localPreferences?.kanbanAccentColor)
  const boardAccentStyle = useMemo(() => ({
    '--kanban-accent-color': boardAccentColor,
    '--kanban-accent-foreground': boardAccentForeground,
  }), [boardAccentColor, boardAccentForeground])
  const today = useMemo(() => new Date(), [timeZone])
  const notificationTimerRef = useRef(null)
  const inboxCloseTimerRef = useRef(null)
  const plannerCloseTimerRef = useRef(null)
  const intelligenceCloseTimerRef = useRef(null)
  const boardViewToolbarRef = useRef(null)
  const intelligencePanelRef = useRef(null)
  const intelligenceComposerInputRef = useRef(null)
  const { filteredEvents: plannerCalendarEvents } = useCalendarEvents({
    enabled: isPlannerPanelMounted,
    includeGeneratedFromCard: false,
    enrichGeneratedCardKinds: false,
  })
  const planLabels = activePlan?.labelsMeta?.length ? activePlan.labelsMeta : KANBAN_DEFAULT_LABELS
  const isPlanMembersLoading = Boolean(isBackendDriven && activePlan?.id && !activePlan.detailsLoaded)
  const backendPlanMembers = Array.isArray(activePlan?.membersMeta) ? activePlan.membersMeta : []
  const planMembers = isBackendDriven
    ? backendPlanMembers
    : (activePlan ? (activePlan?.membersMeta?.length ? activePlan.membersMeta : MEMBERS) : [])
  const inboxAssignedMemberIds = new Set(inboxRecipientCard?.memberIds ?? [])
  const inboxSelectableMembers = planMembers.length
    ? planMembers.filter((member) => !inboxAssignedMemberIds.has(member.id))
    : []

  useEffect(() => {
    const toolbar = boardViewToolbarRef.current
    if (!toolbar || typeof window === 'undefined') return undefined

    const updateToolbarMetrics = () => {
      const rect = toolbar.getBoundingClientRect()
      const computedStyles = window.getComputedStyle(toolbar)
      const nextMetrics = {
        left: Math.round(rect.left + (rect.width / 2)),
        width: Math.round(rect.width),
        height: Math.round(rect.height),
        bottom: Math.round(Number.parseFloat(computedStyles.bottom) || 24),
      }

      setToolbarMetrics((current) => (
        current.left === nextMetrics.left
        && current.width === nextMetrics.width
        && current.height === nextMetrics.height
        && current.bottom === nextMetrics.bottom
          ? current
          : nextMetrics
      ))
    }

    updateToolbarMetrics()

    const resizeHandler = () => updateToolbarMetrics()
    window.addEventListener('resize', resizeHandler)

    let observer = null
    if (typeof ResizeObserver === 'function') {
      observer = new ResizeObserver(() => updateToolbarMetrics())
      observer.observe(toolbar)
    }

    return () => {
      window.removeEventListener('resize', resizeHandler)
      observer?.disconnect()
    }
  }, [])

  useEffect(() => {
    if (!isIntelligencePanelMounted) return undefined

    const closePanel = () => {
      setIsIntelligenceOpen(false)
      if (intelligenceCloseTimerRef.current) {
        clearTimeout(intelligenceCloseTimerRef.current)
      }
      intelligenceCloseTimerRef.current = setTimeout(() => {
        setIsIntelligencePanelMounted(false)
        intelligenceCloseTimerRef.current = null
      }, 260)
    }

    const handleMouseDown = (event) => {
      const panel = intelligencePanelRef.current
      const toolbar = boardViewToolbarRef.current
      if (panel?.contains(event.target) || toolbar?.contains(event.target)) {
        return
      }
      closePanel()
    }

    const handleKeyDown = (event) => {
      if (event.key !== 'Escape') return
      closePanel()
    }

    document.addEventListener('mousedown', handleMouseDown)
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleMouseDown)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isIntelligencePanelMounted])

  const {
    columns,
    totalCards,
    updateColumns,
    createColumn,
    deleteColumn,
    renameColumn,
    changeColColor,
    changeColStatus,
    addCard,
    updateCard,
    deleteCard,
    addCardComment,
    moveCard,
    reorderColumns,
    createChecklist,
    deleteChecklist,
    createChecklistItem,
    updateChecklistItem,
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
  const composerContext = useIntelligenceComposerContext({
    scope: 'board',
    boardColumns: columns,
  })
  const handleInboxCardDrop = useCallback((cardId) => {
    const card = columns.flatMap((column) => column.cards).find((item) => item.id === cardId) ?? null
    if (!card) {
      showNotification('Não foi possível identificar o cartão arrastado.')
      return
    }

    setInboxRecipientCard(card)
    setInboxSelectedMemberIds([])
    setInboxError('')
  }, [columns])

  const {
    sensors,
    collisionDetection,
    activeDragCard,
    activeDragColumn,
    dragOverColumnId,
    isInboxDropActive,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
    handleDragCancel,
  } = useKanbanBoardDnd({
    activePlanId: activePlan?.id,
    columns,
    updateColumns,
    moveCard,
    reorderColumns,
    isBackendDriven,
    onMoveError: (error) => showNotification(error?.message ?? 'Não foi possível mover o cartão.'),
    onReorderError: (error) => showNotification(error?.message ?? 'Não foi possível reordenar as listas.'),
    onInboxDrop: handleInboxCardDrop,
  })

  const addColumn = async () => {
    const nextTitle = newColTitle.trim()
    if (!nextTitle) return

    const nextColor = newColColor
    const nextStatus = newColStatus

    setNewColTitle('')
    setNewColColor('')
    setNewColStatus(KANBAN_DEFAULT_COLUMN_STATUS)
    setAddingCol(false)
    setAddColumnError(null)

    try {
      await createColumn(nextTitle, { color: nextColor, status: nextStatus })
    } catch (error) {
      const message = error?.message ?? 'Não foi possível criar a lista.'
      setNewColTitle(nextTitle)
      setNewColColor(nextColor)
      setNewColStatus(nextStatus)
      setAddingCol(true)
      setAddColumnError(message)
      showNotification(message)
    }
  }

  const saveCardOptimistically = useCallback(async (nextCard) => {
    if (!nextCard?.id) {
      return updateCard(nextCard)
    }

    const previousColumns = columns
    const previousCard = findCardInColumns(previousColumns, nextCard.id)

    updateColumns((currentColumns) => replaceCardInColumns(currentColumns, nextCard))
    setActiveCard((current) => (
      current?.card?.id === nextCard.id
        ? { ...current, card: nextCard }
        : current
    ))

    try {
      const persistedCard = await updateCard(nextCard)
      if (persistedCard) {
        const shouldReplaceActiveCard = !areCardsEquivalentForPersistence(persistedCard, nextCard)
        if (shouldReplaceActiveCard) {
          setActiveCard((current) => (
            current?.card?.id === persistedCard.id
              ? { ...current, card: persistedCard }
              : current
          ))
        }
      }
      return persistedCard ?? nextCard
    } catch (error) {
      updateColumns(() => previousColumns)
      setActiveCard((current) => {
        if (current?.card?.id !== nextCard.id) {
          return current
        }

        return previousCard
          ? { ...current, card: previousCard }
          : current
      })
      throw error
    }
  }, [columns, updateCard, updateColumns])

  const handleCardUpdate = async (updatedCard) => {
    return saveCardOptimistically(updatedCard)
  }

  const handleCardDelete = async (cardId) => {
    const previousActiveCard = activeCard
    setActiveCard(null)

    try {
      await deleteCard(cardId)
    } catch (error) {
      setActiveCard(previousActiveCard ?? null)
      showNotification(error?.message ?? 'Não foi possível excluir o cartão.')
      throw error
    }
  }

  const handleBoardCardClick = useCallback((card, colTitle) => {
    setActiveCard({ card, colTitle })
  }, [])

  const canMoveActiveCardToNextColumn = useMemo(() => {
    if (!activeCard?.card?.id || !columns.length) return false

    const sourceColumnIndex = columns.findIndex((column) => (
      column.cards.some((card) => card.id === activeCard.card.id)
    ))

    return sourceColumnIndex >= 0 && sourceColumnIndex < columns.length - 1
  }, [activeCard, columns])

  const handleMoveCardToNextColumn = useCallback(async () => {
    const cardId = activeCard?.card?.id
    if (!cardId || !activePlan?.id) return

    const sourceColumnIndex = columns.findIndex((column) => (
      column.cards.some((card) => card.id === cardId)
    ))
    if (sourceColumnIndex === -1 || sourceColumnIndex >= columns.length - 1) return

    const sourceColumn = columns[sourceColumnIndex]
    const nextColumn = columns[sourceColumnIndex + 1]
    const target = { type: 'col', colId: nextColumn.id }
    const targetPosition = nextColumn.cards.length
    const previousColumns = columns
    const previousActiveCard = activeCard

    updateColumns((prev) => moveCardInColumns(prev, cardId, sourceColumn.id, target))
    setActiveCard((current) => (
      current?.card?.id === cardId
        ? {
          ...current,
          colTitle: nextColumn.title,
          card: { ...current.card, columnId: nextColumn.id },
        }
        : current
    ))

    if (!isBackendDriven) {
      return
    }

    try {
      await moveCard(cardId, nextColumn.id, targetPosition)
    } catch (error) {
      updateColumns(() => previousColumns)
      setActiveCard(previousActiveCard ?? null)
      showNotification(error?.message ?? 'Não foi possível mover o cartão.')
      throw error
    }
  }, [activeCard, activePlan?.id, columns, isBackendDriven, moveCard, updateColumns])

  useEffect(() => {
    const cardIdFromUrl = String(searchParams.get('card') ?? '').trim()
    if (!cardIdFromUrl || !columns.length) return

    for (const column of columns) {
      const card = column.cards?.find((item) => item.id === cardIdFromUrl)
      if (card) {
        setActiveCard({ card, colTitle: column.title })
        const nextParams = new URLSearchParams(searchParams)
        nextParams.delete('card')
        setSearchParams(nextParams, { replace: true })
        break
      }
    }
  }, [columns, searchParams, setSearchParams])

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

  const handleColumnDelete = async (colId) => {
    try {
      await deleteColumn(colId)
    } catch (error) {
      showNotification(error?.message ?? 'Não foi possível excluir a lista.')
    }
  }

  const handleColumnColorChange = (colId, color) => {
    changeColColor(colId, color).catch((error) => {
      showNotification(error?.message ?? 'Não foi possível alterar a cor da lista.')
    })
  }

  const handleColumnStatusChange = (colId, status) => {
    changeColStatus(colId, status).catch((error) => {
      showNotification(error?.message ?? 'Não foi possível alterar o status da lista.')
    })
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
    for (const column of nextColumns) {
      const nextCard = column.cards.find((card) => card.id === cardId)
      if (nextCard) {
        setActiveCard((current) => (
          current?.card?.id === cardId
            ? { ...current, card: nextCard, colTitle: column.title }
            : current
        ))
        return nextCard
      }
    }
    return null
  }

  const attachFileToCard = async (file, cardId) => {
    if (!activePlan?.id || !isBackendDriven) return null

    const createdAttachment = mapApiAttachmentItem(await apiRequest(`/api/files/${file.id}/attach/cards/${cardId}`, {
      method: 'POST',
      token: accessToken,
    }))
    let nextColumns = columns
    updateColumns((prev) => {
      nextColumns = appendAttachmentToColumns(prev, cardId, createdAttachment)
      return nextColumns
    })
    setPlanFiles((current) => upsertFileItem(current, {
      ...file,
      sharedByCurrentUser: true,
      canUnshare: true,
    }))
    setLibraryFiles((current) => upsertFileItem(current, {
      ...file,
      sharedByCurrentUser: true,
      canUnshare: true,
    }))
    showNotification(`"${file.name}" anexado ao cartão.`)
    return refreshActiveCardFromColumns(nextColumns, cardId)
  }

  const uploadLocalFileToCard = async (localFile, cardId) => {
    if (!activePlan?.id || !isBackendDriven || !(localFile instanceof File)) return null

    const formData = new FormData()
    formData.append('file', localFile)

    const createdAttachment = mapApiAttachmentItem(await apiRequest(`/api/files/upload/attach/cards/${cardId}`, {
      method: 'POST',
      token: accessToken,
      body: formData,
    }))
    const createdFile = mapAttachmentToFileItem(createdAttachment)
    let nextColumns = columns
    updateColumns((prev) => {
      nextColumns = appendAttachmentToColumns(prev, cardId, createdAttachment)
      return nextColumns
    })
    setPlanFiles((current) => upsertFileItem(current, createdFile))
    setLibraryFiles((current) => upsertFileItem(current, createdFile))
    showNotification(`"${localFile.name}" enviado para a Biblioteca e anexado ao cartão.`)
    return refreshActiveCardFromColumns(nextColumns, cardId)
  }

  const removeAttachmentFromCard = async (attachment) => {
    if (!activePlan?.id || !isBackendDriven) return null

    await apiRequest(`/api/files/attachments/${attachment.id}`, {
      method: 'DELETE',
      token: accessToken,
    })
    let nextColumns = columns
    updateColumns((prev) => {
      nextColumns = removeAttachmentFromColumns(prev, attachment.id)
      return nextColumns
    })
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

  const openPlanner = () => {
    if (plannerCloseTimerRef.current) {
      clearTimeout(plannerCloseTimerRef.current)
      plannerCloseTimerRef.current = null
    }
    if (inboxCloseTimerRef.current) {
      clearTimeout(inboxCloseTimerRef.current)
      inboxCloseTimerRef.current = null
    }
    if (intelligenceCloseTimerRef.current) {
      clearTimeout(intelligenceCloseTimerRef.current)
      intelligenceCloseTimerRef.current = null
    }
    setIsInboxOpen(false)
    setIsInboxPanelMounted(false)
    setIsIntelligenceOpen(false)
    setIsIntelligencePanelMounted(false)
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
    if (intelligenceCloseTimerRef.current) {
      clearTimeout(intelligenceCloseTimerRef.current)
      intelligenceCloseTimerRef.current = null
    }
    setIsPlannerOpen(false)
    setIsPlannerPanelMounted(false)
    setIsIntelligenceOpen(false)
    setIsIntelligencePanelMounted(false)
    setIsInboxPanelMounted(true)
    window.requestAnimationFrame(() => setIsInboxOpen(true))
  }

  const closeInbox = () => {
    setIsInboxOpen(false)
    setInboxRecipientCard(null)
    setInboxSelectedMemberIds([])
    setInboxError('')
    if (inboxCloseTimerRef.current) {
      clearTimeout(inboxCloseTimerRef.current)
    }
    inboxCloseTimerRef.current = setTimeout(() => {
      setIsInboxPanelMounted(false)
      inboxCloseTimerRef.current = null
    }, 260)
  }

  const openIntelligence = () => {
    if (intelligenceCloseTimerRef.current) {
      clearTimeout(intelligenceCloseTimerRef.current)
      intelligenceCloseTimerRef.current = null
    }
    if (plannerCloseTimerRef.current) {
      clearTimeout(plannerCloseTimerRef.current)
      plannerCloseTimerRef.current = null
    }
    if (inboxCloseTimerRef.current) {
      clearTimeout(inboxCloseTimerRef.current)
      inboxCloseTimerRef.current = null
    }
    setIsPlannerOpen(false)
    setIsPlannerPanelMounted(false)
    setIsPlannerFilterOpen(false)
    setIsInboxOpen(false)
    setIsInboxPanelMounted(false)
    setIsIntelligencePanelMounted(true)
    setIsIntelligenceOpen(true)
  }

  const closeIntelligence = () => {
    setIsIntelligenceOpen(false)
    if (intelligenceCloseTimerRef.current) {
      clearTimeout(intelligenceCloseTimerRef.current)
    }
    intelligenceCloseTimerRef.current = setTimeout(() => {
      setIsIntelligencePanelMounted(false)
      intelligenceCloseTimerRef.current = null
    }, 260)
  }

  const toggleIntelligence = () => {
    if (isIntelligenceOpen) {
      closeIntelligence()
      return
    }
    openIntelligence()
  }

  useEffect(() => {
    if (!location.state?.openIntelligence) return
    openIntelligence()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state?.openIntelligence])

  const closeFloatingPanel = () => {
    closeInbox()
    closePlanner()
    closeIntelligence()
  }

  const showBoardView = () => {
    setBoardViewMode('kanban')
    closeFloatingPanel()
  }

  const showCalendarView = () => {
    setBoardViewMode('calendar')
    closeFloatingPanel()
  }

  useEffect(() => {
    if (!isInboxPanelMounted) return
    if (!isBackendDriven) return
    if (!activePlan?.id) return
    if (activePlan.detailsLoaded) return

    ensurePlanDetails(activePlan.id).catch((error) => {
      setInboxError(error?.message ?? 'Não foi possível carregar os membros deste plano.')
    })
  }, [activePlan?.detailsLoaded, activePlan?.id, ensurePlanDetails, isBackendDriven, isInboxPanelMounted])

  useEffect(() => {
    setInboxItems(Array.isArray(activePlan?.inboxItems) ? activePlan.inboxItems : [])
  }, [activePlan?.id, activePlan?.inboxItems])

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
    closeFloatingPanel()
    showNotification(message)
  }

  const handlePlanSwitch = (planId) => {
    openPlan(planId)
  }

	  const todayKey = useMemo(
	    () => dateKeyFromTimeZoneInstant(today, timeZone) ?? dateKey(today),
	    [timeZone, today],
	  )
	  const tomorrowKey = useMemo(() => addDaysToDateKey(todayKey, 1), [todayKey])
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

	  const persistPlannerPinnedState = (next) => {
	    try {
	      window.localStorage.setItem(plannerPinnedStorageKey, JSON.stringify(Object.keys(next)))
	    } catch {}
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

  const togglePlannerPinned = async (item) => {
    if (item?.type === 'card') {
      const nextStarred = !Boolean(item.pinned)
      const previousPinnedById = plannerPinnedById
      if (previousPinnedById[item.id]) {
        setPlannerPinnedById((current) => {
          if (!current[item.id]) return current
          const next = { ...current }
          delete next[item.id]
          persistPlannerPinnedState(next)
          return next
        })
      }

      try {
        await saveCardOptimistically({
          ...item.card,
          starred: nextStarred,
        })
      } catch (error) {
        if (previousPinnedById[item.id]) {
          setPlannerPinnedById(previousPinnedById)
        }
        showNotification(error?.message ?? 'Não foi possível atualizar o destaque da tarefa.')
      }
      return
    }

	    const itemId = item?.id
	    if (!itemId) return

	    setPlannerPinnedById((current) => {
	      const next = { ...current }
	      if (next[itemId]) {
        delete next[itemId]
      } else {
        next[itemId] = true
      }
      persistPlannerPinnedState(next)
      return next
	    })
	  }

	  useEffect(() => {
	    const legacyPinnedCardIds = Object.keys(plannerPinnedById).filter((itemId) => itemId.startsWith('card:'))
	    if (!legacyPinnedCardIds.length) return

	    const cardByPlannerItemId = new Map(
	      columns.flatMap((column) => column.cards.map((card) => [`card:${card.id}`, card])),
	    )
	    const pendingCards = legacyPinnedCardIds
	      .map((itemId) => ({ itemId, card: cardByPlannerItemId.get(itemId) }))
	      .filter(({ card }) => card && !card.starred)

	    if (!pendingCards.length) return

	    let active = true

	    void (async () => {
	      for (const { itemId, card } of pendingCards) {
	        if (!active) return
	        try {
	          await updateCard({
	            ...card,
	            starred: true,
	          })
	          if (!active) return
	          setPlannerPinnedById((current) => {
	            if (!current[itemId]) return current
	            const next = { ...current }
	            delete next[itemId]
	            persistPlannerPinnedState(next)
	            return next
	          })
	        } catch {}
	      }
	    })()

	    return () => {
	      active = false
	    }
	  }, [columns, plannerPinnedById, plannerPinnedStorageKey, updateCard])

	  const plannerDateFormatter = useMemo(() => new Intl.DateTimeFormat('pt-BR', {
	    timeZone,
	    weekday: 'short',
	    day: 'numeric',
	    month: 'short',
	  }), [timeZone])

	  const plannerBaseItems = useMemo(() => {
	    const planName = activePlan?.name ?? 'Plano'

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
	          pinned: Boolean(card.starred) || Boolean(plannerPinnedById[itemId]),
	          startKey,
	          dueKey,
	          scheduleKey,
	          timeMinutes: timeValueMinutes(timeValue),
	          isCompleted: Boolean(card.isCompleted),
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

  const togglePlannerCardCompleted = useCallback(async (card) => {
    try {
      await saveCardOptimistically({
        ...card,
        isCompleted: !card.isCompleted,
      })
    } catch (error) {
      showNotification(error?.message ?? 'Não foi possível atualizar a tarefa.')
    }
  }, [saveCardOptimistically])
  const hasNoPlan = isBackendDriven && !isLoading && !activePlan
  const isBoardLoading = isBackendDriven && !hasNoPlan && !boardLoadError && (isLoading || !activePlan?.boardLoaded)
  const coverThemeClassName = activePlan?.coverThemeId ? (styles[`theme${activePlan.coverThemeId}`] ?? '') : ''
  const isImageCover = Boolean(activePlan?.coverImage)
  const hasPlanCover = Boolean(coverThemeClassName || isImageCover)
  const boardMainClassName = [
    styles.boardMain,
    hasPlanCover ? styles.boardMainHasCover : '',
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
    if (intelligenceCloseTimerRef.current) {
      clearTimeout(intelligenceCloseTimerRef.current)
    }
  }, [])

  const findBoardCard = (cardId) => (
    columns.flatMap((column) => column.cards).find((card) => card.id === cardId) ?? null
  )

  const mergeInboxRecipientsIntoCard = (cardId, recipientUserIds) => {
    const selectedIds = [...new Set(recipientUserIds.filter(Boolean))]
    if (!selectedIds.length) return

    const mergeMemberIds = (card) => [...new Set([...(card.memberIds ?? []), ...selectedIds])]
    updateColumns((currentColumns) => currentColumns.map((column) => ({
      ...column,
      cards: column.cards.map((card) => (
        card.id === cardId ? { ...card, memberIds: mergeMemberIds(card) } : card
      )),
    })))
    setActiveCard((current) => {
      if (current?.card?.id !== cardId) return current
      return {
        ...current,
        card: {
          ...current.card,
          memberIds: mergeMemberIds(current.card),
        },
      }
    })
  }

  const prependInboxItem = (item) => {
    if (!item?.id) return
    setInboxItems((current) => [
      item,
      ...current.filter((existing) => existing.id !== item.id),
    ])
  }

  const clearInboxDeliveries = async () => {
    if (!activePlan?.id || !isBackendDriven) {
      showNotification('Histórico da Inbox fica disponível apenas quando a sessão está conectada ao backend.')
      return
    }
    if (!inboxItems.length || isClearingInbox) return

    setIsClearingInbox(true)
    setInboxError('')

    try {
      await apiRequest(`/api/plans/${activePlan.id}/board/inbox/deliveries`, {
        method: 'DELETE',
        token: accessToken,
      })
      setInboxItems([])
      showNotification('Envios da Inbox limpos.')
    } catch (error) {
      const message = error?.message ?? 'Não foi possível limpar os envios da Inbox.'
      setInboxError(message)
      showNotification(message)
    } finally {
      setIsClearingInbox(false)
    }
  }

  const sendCardToInbox = async (card, recipientUserIds = []) => {
    if (!activePlan?.id || !isBackendDriven || !card?.id) {
      showNotification('Envio por Gmail fica disponível apenas quando a sessão está conectada ao backend.')
      return
    }
    const newRecipientUserIds = recipientUserIds.filter((id) => !(card.memberIds ?? []).includes(id))
    if (!newRecipientUserIds.length) {
      const message = 'Escolha ao menos um novo membro para receber este cartão por e-mail.'
      setInboxError(message)
      showNotification(message)
      return
    }

    setInboxSendingCardId(card.id)
    setInboxError('')

    try {
      const delivery = await apiRequest(`/api/plans/${activePlan.id}/board/cards/${card.id}/inbox/send`, {
        method: 'POST',
        token: accessToken,
        body: { recipientUserIds: newRecipientUserIds },
      })
      const total = Array.isArray(delivery?.sentTo) ? delivery.sentTo.length : 0
      showNotification(total > 1 ? `E-mail enviado para ${total} membros.` : 'E-mail enviado para 1 membro.')
      mergeInboxRecipientsIntoCard(card.id, newRecipientUserIds)
      prependInboxItem(delivery?.inboxItem)
      setInboxRecipientCard(null)
      setInboxSelectedMemberIds([])
    } catch (error) {
      const message = describeInboxError(error)
      setInboxError(message)
      showNotification(message)
    } finally {
      setInboxSendingCardId('')
    }
  }

  const toggleInboxRecipient = (memberId) => {
    setInboxSelectedMemberIds((current) => (
      current.includes(memberId)
        ? current.filter((id) => id !== memberId)
        : [...current, memberId]
    ))
  }

  const submitInboxRecipients = () => {
    if (!inboxRecipientCard) return
    if (!inboxSelectedMemberIds.length) {
      setInboxError('Escolha ao menos um novo membro para receber este cartão por e-mail.')
      return
    }

    sendCardToInbox(inboxRecipientCard, inboxSelectedMemberIds)
  }

  const renderInboxItem = (item) => {
    const recipients = Array.isArray(item.recipients) && item.recipients.length
      ? item.recipients.map((recipient) => recipient.fullName || recipient.email).filter(Boolean)
      : (Array.isArray(item.sentTo) ? item.sentTo : [])
    const recipientLabel = recipients.length
      ? recipients.join(', ')
      : 'Destinatários registrados'
    const sentByName = item.sentBy?.fullName || item.sentFrom || 'Gmail conectado'
    const sentAtLabel = item.sentAt?.text ?? 'Agora'

    return (
      <article key={item.id} className={styles.inboxSentCard}>
        <div className={styles.inboxSentCardHeader}>
          <strong>{item.cardTitle ?? 'Cartão enviado'}</strong>
          <span>{sentAtLabel}</span>
        </div>
        <p>{recipientLabel}</p>
        <small>Enviado por {sentByName}</small>
      </article>
    )
  }

  const intelligenceThemeStyle = {
    '--intelligence-accent': boardAccentColor,
    '--intelligence-accent-foreground': boardAccentForeground,
    '--intelligence-user-bg': boardAccentColor,
  }

  const intelligencePanelStyle = {
    left: toolbarMetrics.left ? `${toolbarMetrics.left}px` : undefined,
    width: toolbarMetrics.width ? `${toolbarMetrics.width}px` : undefined,
    bottom: `${toolbarMetrics.bottom + toolbarMetrics.height + 14}px`,
    ...intelligenceThemeStyle,
  }

  const renderInboxPanel = () => (
    <InboxDropPanel
      id="board-inbox-panel"
      className={`${styles.plannerPanel} ${styles.inboxPanel} ${isInboxOpen ? '' : styles.plannerPanelClosing} ${isInboxDropActive ? styles.inboxPanelDropActive : ''}`}
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

      <section className={styles.inboxDropZone} aria-label="Enviar cartão por Gmail">
        <Icon.Send />
        <strong>Solte um cartão para enviar por Gmail</strong>
        <p>O e-mail será enviado pela conta Gmail conectada para membros que ainda não fazem parte do cartão.</p>
      </section>

      {inboxRecipientCard ? (
        <section className={styles.inboxRecipientPicker} aria-label="Escolher destinatários">
          <div className={styles.inboxRecipientHeader}>
            <span>Destinatários</span>
            <strong>{inboxRecipientCard.title}</strong>
          </div>

          <div className={styles.inboxRecipientList}>
            {inboxSelectableMembers.length ? inboxSelectableMembers.map((member) => {
              const memberName = member.name ?? member.fullName ?? 'Membro'
              const checked = inboxSelectedMemberIds.includes(member.id)

              return (
                <label key={member.id} className={styles.inboxRecipientRow}>
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleInboxRecipient(member.id)}
                  />
                  <AuthenticatedAvatar
                    className={styles.planMemberAvatar}
                    imageClassName={styles.avatarImage}
                    style={{ background: member.color }}
                    avatarUrl={member.avatarUrl}
                    fallback={member.initials}
                    title={memberName}
                  />
                  <span className={styles.inboxRecipientInfo}>
                    <strong>{memberName}</strong>
                    <small>{member.email}</small>
                  </span>
                </label>
              )
            }) : (
              <p className={styles.inboxRecipientsEmpty}>
                {isPlanMembersLoading ? 'Carregando membros do plano...' : 'Todos os membros do plano já fazem parte deste cartão.'}
              </p>
            )}
          </div>

          <div className={styles.inboxRecipientActions}>
            <button
              type="button"
              className={styles.inboxSecondaryButton}
              onClick={() => {
                setInboxRecipientCard(null)
                setInboxSelectedMemberIds([])
                setInboxError('')
              }}
            >
              Cancelar
            </button>
            <button
              type="button"
              className={styles.inboxPrimaryButton}
              onClick={submitInboxRecipients}
              disabled={!inboxSelectedMemberIds.length || inboxSendingCardId === inboxRecipientCard.id}
            >
              {inboxSendingCardId === inboxRecipientCard.id ? 'Enviando...' : 'Enviar e-mail'}
            </button>
          </div>
        </section>
      ) : null}

      {inboxError ? <p className={styles.inboxError} role="alert">{inboxError}</p> : null}

      <section className={styles.inboxSentList} aria-label="Cartões enviados pela Inbox">
        <div className={styles.inboxSentListHeader}>
          <span>Enviados</span>
          <div className={styles.inboxSentListActions}>
            <strong>{inboxItems.length}</strong>
            <button
              type="button"
              className={styles.inboxClearButton}
              aria-label="Limpar envios da Inbox"
              title="Limpar envios da Inbox"
              onClick={clearInboxDeliveries}
              disabled={!inboxItems.length || isClearingInbox}
            >
              <Icon.Trash />
            </button>
          </div>
        </div>
        {inboxItems.length ? (
          <div className={styles.inboxSentItems}>
            {inboxItems.map(renderInboxItem)}
          </div>
        ) : (
          <p className={styles.inboxSentEmpty}>Nenhum cartão enviado pela Inbox ainda.</p>
        )}
      </section>

      <div className={styles.inboxPrivateNote}>
        <Icon.Lock />
        <span>Envios usam somente a permissão Gmail de envio</span>
      </div>
    </InboxDropPanel>
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
	          showCalendarView()
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
	                void togglePlannerPinned(item)
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
      <div className={styles.boardAccentScope} style={boardAccentStyle}>
      <ProductAppShell
        contentClassName={styles.boardPageShell}
        mobileTitle="Quadros"
      >
        <WorkspaceHeader compact />
        <DndContext
          sensors={sensors}
          collisionDetection={collisionDetection}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
          onDragCancel={handleDragCancel}
        >
        <div
          className={`${styles.boardWrapper} ${isPlannerPanelMounted || isInboxPanelMounted ? styles.boardWrapperPlannerMounted : ''} ${isPlannerOpen || isInboxOpen ? styles.boardWrapperWithPlanner : ''}`}
        >
        <div className={boardMainClassName} style={boardCoverStyle}>
        <section className={styles.boardBody}>
          <div className={styles.boardBodyContent}>
            <BoardHeader
              planName={activePlan?.name ?? 'Plano'}
              viewMode={boardViewMode === 'calendar' ? 'kanban' : boardViewMode}
              onViewModeChange={(nextViewMode) => {
                setBoardViewMode(nextViewMode)
                closeFloatingPanel()
              }}
              members={planMembers}
            />

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
            ) : boardViewMode === 'calendar' ? (
              <CalendarWorkspaceView embedded />
            ) : boardViewMode === 'timeline' ? (
              <section className={styles.boardStatusPanel} role="status" aria-live="polite">
                <p className={styles.boardStatusTitle}>Timeline</p>
                <p className={styles.boardStatusText}>Este modo de visualização estará disponível em breve.</p>
              </section>
            ) : boardViewMode === 'bugtrack' ? (
              <section className={styles.boardStatusPanel} role="status" aria-live="polite">
                <p className={styles.boardStatusTitle}>Bugtrack</p>
                <p className={styles.boardStatusText}>Este modo de visualização estará disponível em breve.</p>
              </section>
            ) : boardViewMode === 'actions' ? (
              <section className={styles.boardStatusPanel} role="status" aria-live="polite">
                <p className={styles.boardStatusTitle}>Actions</p>
                <p className={styles.boardStatusText}>Este modo de visualização estará disponível em breve.</p>
              </section>
            ) : (
              <SortableContext
                items={columns.map((column) => column.id)}
                strategy={horizontalListSortingStrategy}
              >
              <div className={styles.board}>
                {columns.map(col => (
                  <KanbanColumn
                    key={col.uiKey ?? col.id}
                    col={col}
                    isDropTarget={dragOverColumnId === col.id}
                    onAddCard={addCard}
                    onDeleteCol={handleColumnDelete}
                    onRenameCol={renameColumn}
                    onChangeColColor={handleColumnColorChange}
                    onChangeColStatus={handleColumnStatusChange}
                    statusOptions={KANBAN_COLUMN_STATUS_OPTIONS}
                    onCardClick={handleBoardCardClick}
                    onToggleCardCompleted={togglePlannerCardCompleted}
                    labels={planLabels}
                    members={planMembers}
                    colorOptions={KANBAN_ADD_LIST_COLOR_OPTIONS}
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
                  newColColor={newColColor}
                  setNewColColor={setNewColColor}
                  colorOptions={KANBAN_ADD_LIST_COLOR_OPTIONS}
                  newColStatus={newColStatus}
                  setNewColStatus={setNewColStatus}
                  statusOptions={KANBAN_COLUMN_STATUS_OPTIONS}
                  defaultColumnStatus={KANBAN_DEFAULT_COLUMN_STATUS}
                  setAddingCol={setAddingCol}
                  addColumn={addColumn}
                  errorMessage={addColumnError}
                  styles={styles}
                />
              </div>
              </SortableContext>
            )}
          </div>
        </section>

        {isIntelligencePanelMounted ? (
          <section
            id="board-intelligence-panel"
            ref={intelligencePanelRef}
            className={`${styles.intelligencePanel} ${hasIntelligenceConversation ? styles.intelligencePanelWithConversation : ''} ${isIntelligenceOpen ? '' : styles.intelligencePanelClosing}`}
            style={intelligencePanelStyle}
            aria-label="Chat de IA"
          >
            <div className={styles.intelligencePanelBody}>
              <div className={styles.intelligencePanelOrbWrap} aria-hidden="true">
                <div className={styles.intelligencePanelOrb} />
              </div>

              {!hasIntelligenceConversation ? (
                <div className={styles.intelligencePanelIntro}>
                  <span className={styles.intelligencePanelEyebrow}>Intelligence</span>
                  <h2 className={styles.intelligencePanelTitle}>Peça ideias para destravar este plano.</h2>
                  <p className={styles.intelligencePanelText}>
                    Resumos, sugestões e próximos passos sem sair do plano.
                  </p>
                </div>
              ) : null}

              <IntelligenceConversationThread
                messages={intelligenceMessages}
                isThinking={isIntelligenceThinking}
                useCustomScrollbar
                scrollToBottomOnMount
                className={styles.intelligencePanelThread}
                classes={{
                  messages: styles.intelligencePanelMessages,
                  messageUser: styles.intelligencePanelMessageUser,
                  messageAssistant: styles.intelligencePanelMessageAssistant,
                  thinking: styles.intelligencePanelThinking,
                }}
              />

              <div
                className={styles.intelligenceComposerArea}
                data-testid="board-intelligence-composer-area"
              >
                <IntelligenceComposer
                  value={intelligenceDraft}
                  onChange={setIntelligenceDraft}
                  inputRef={intelligenceComposerInputRef}
                  rows={1}
                  placeholder="Escreva sua pergunta..."
                  submitAriaLabel="Enviar mensagem"
                  voiceAriaLabelIdle="Usar voz"
                  voiceAriaLabelListening="Usar voz"
                  onSubmit={async (event) => {
                    event.preventDefault()
                    if (await submitIntelligenceMessage(intelligenceDraft)) {
                      setIntelligenceDraft('')
                    }
                  }}
                  submitDisabled={!canSubmitIntelligenceMessage(intelligenceDraft, kanbanAiChips)}
                  aiChips={kanbanAiChips}
                  onChipsChange={setKanbanAiChips}
                  {...composerContext}
                  showGitHubBar={intelligenceActiveConnectors.includes('github')}
                  githubBarClassName={styles.intelligenceGitHubBar}
                  classes={{
                    form: styles.intelligenceComposer,
                    input: styles.intelligenceComposerInput,
                    attachmentStrip: styles.intelligenceComposerAttachmentStrip,
                    controls: styles.intelligenceComposerFooter,
                    contextSlot: styles.intelligenceComposerTools,
                    actions: styles.intelligenceComposerActions,
                    iconButton: styles.intelligenceComposerIconButton,
                    iconButtonActive: styles.intelligenceComposerIconButtonActive,
                    sendButton: styles.intelligenceComposerSubmit,
                  }}
                />
              </div>
            </div>
          </section>
        ) : null}

        <div ref={boardViewToolbarRef} className={styles.boardViewToolbar} aria-label="Atalhos do quadro">
          <button
            type="button"
            className={`${styles.boardViewToolbarItem} ${isInboxOpen ? styles.boardViewToolbarItemActive : ''}`}
            aria-expanded={isInboxOpen}
            aria-controls="board-inbox-panel"
            title="Caixa de entrada"
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
            title="Planejador"
            onClick={openPlanner}
          >
            <Icon.Calendar />
            <span>Planejador</span>
          </button>

          <button
            type="button"
            className={`${styles.boardViewToolbarItem} ${boardViewMode === 'kanban' && !isPlannerOpen && !isInboxOpen && !isIntelligenceOpen ? styles.boardViewToolbarItemActive : ''}`}
            aria-current={boardViewMode === 'kanban' && !isPlannerOpen && !isInboxOpen && !isIntelligenceOpen ? 'page' : undefined}
            title="Quadro"
            onClick={showBoardView}
          >
            <Icon.Board />
            <span>Quadro</span>
          </button>

          <button
            type="button"
            className={`${styles.boardViewToolbarItem} ${isIntelligenceOpen ? styles.boardViewToolbarItemActive : ''}`}
            aria-expanded={isIntelligenceOpen}
            aria-controls="board-intelligence-panel"
            title="Intelligence"
            onClick={toggleIntelligence}
          >
            <Icon.Bolt />
            <span>Intelligence</span>
          </button>
        </div>
        </div>

        {isInboxPanelMounted && renderInboxPanel()}
        {isPlannerPanelMounted && renderPlannerPanel()}
        </div>
        <DragOverlay dropAnimation={{ duration: 180, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' }}>
          {activeDragCard ? (
            <KanbanCard
              card={activeDragCard.card}
              colId={activeDragCard.columnId}
              colTitle={activeDragCard.columnTitle}
              isDragOverlay
              isConfirmed={Boolean(activeDragCard.card.isCompleted)}
              labels={planLabels}
              members={planMembers}
              styles={styles}
            />
          ) : activeDragColumn ? (
            <KanbanColumn
              col={activeDragColumn}
              isDragOverlay
              onAddCard={() => {}}
              onDeleteCol={() => {}}
              onRenameCol={() => {}}
              onChangeColColor={() => {}}
              onChangeColStatus={() => {}}
              statusOptions={KANBAN_COLUMN_STATUS_OPTIONS}
              onCardClick={() => {}}
              labels={planLabels}
              members={planMembers}
              colorOptions={KANBAN_ADD_LIST_COLOR_OPTIONS}
              styles={styles}
            />
          ) : null}
        </DragOverlay>
        </DndContext>
      </ProductAppShell>

      {/* ── Card modal ── */}
      {activeCard && (
        <CardModal
          card={activeCard.card}
          colTitle={activeCard.colTitle}
          onClose={() => setActiveCard(null)}
          onUpdate={handleCardUpdate}
          onDelete={handleCardDelete}
          onMoveToNextColumn={handleMoveCardToNextColumn}
          canMoveToNextColumn={canMoveActiveCardToNextColumn}
          onToggleCardCompleted={togglePlannerCardCompleted}
          onAddComment={isBackendDriven ? addCardComment : undefined}
          labels={planLabels}
          members={planMembers}
          currentUser={currentUser}
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
          onCreateChecklist={createChecklist}
          onDeleteChecklist={deleteChecklist}
          onCreateChecklistItem={createChecklistItem}
          onUpdateChecklistItem={updateChecklistItem}
          timeZone={timeZone}
          dateFormat={dateFormat}
        />
      )}

      {notification && (
        <div className={styles.boardNotification} role="status" aria-live="polite">
          {notification}
        </div>
      )}
      </div>
    </AppThemeScope>
  )
}

