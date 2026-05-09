import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../../auth/context/AuthContext.jsx'
import {
  DEFAULT_LOCAL_PREFERENCES,
  usePreferences,
} from '../../../preferences/context/PreferencesContext.jsx'
import { apiRequest, triggerBlobDownload } from '../../../../shared/api/apiClient.js'
import ProductAppShell from '../../../../shared/components/ProductAppShell/ProductAppShell.jsx'
import PlanPageHeader from '../../../../shared/components/PlanPageHeader/PlanPageHeader.jsx'
import SidebarAccountMenu from '../../../../shared/components/SidebarAccountMenu/SidebarAccountMenu.jsx'
import { useResponsiveViewport } from '../../../../shared/hooks/useResponsiveViewport.js'
import { useWorkspaceNavigation } from '../../../../shared/hooks/useWorkspaceNavigation.js'
import { formatBytes } from '../../../../shared/utils/formatBytes.js'
import { WORKSPACE_SUBSCRIPTION_PLANS, getWorkspacePlanQuotaBytes } from '../../../../shared/utils/workspaceSubscriptionPlans.js'
import AppThemeScope from '../../../preferences/components/AppThemeScope/AppThemeScope.jsx'
import {
  KANBAN_ACCENT_BASE_COLOR_OPTIONS,
  KANBAN_ACCENT_EXTRA_COLOR_OPTIONS,
  isKanbanAccentBaseColor,
} from '../../../workspace/data/kanbanColorPalette.js'
import styles from './SettingsPage.module.css'

/* ═══════════════════════════════════════════
   ICONS
═══════════════════════════════════════════ */
const Ic = {
  Logo:     () => <svg width="17" height="17" viewBox="0 0 20 20" fill="none"><rect x="2" y="2" width="7" height="7" rx="2" fill="currentColor"/><rect x="11" y="2" width="7" height="7" rx="2" fill="currentColor" opacity=".35"/><rect x="2" y="11" width="7" height="7" rx="2" fill="currentColor" opacity=".55"/><rect x="11" y="11" width="7" height="7" rx="2" fill="currentColor" opacity=".75"/></svg>,
  Home:     () => <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><path d="M2 6.5L8 2l6 4.5V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V6.5z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/><path d="M6 15V9h4v6" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/></svg>,
  Popover:  () => <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M4 2.5H2.5v7H9.5V8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/><path d="M5 7L9.5 2.5M7 2.5h2.5V5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  Calendar: () => <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><rect x="2" y="3" width="12" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.3"/><path d="M5 1.8v2.8M11 1.8v2.8M2.5 6.5h11" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>,
  Files:    () => <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><path d="M9 1.5H4a1.5 1.5 0 0 0-1.5 1.5v10A1.5 1.5 0 0 0 4 14.5h8A1.5 1.5 0 0 0 13.5 13V6L9 1.5z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/><path d="M9 1.5V6H13.5" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/></svg>,
  Chevron:  () => <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M4.5 3l3 3-3 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  Check:    () => <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 7l2.5 2.5 5.5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  User:     () => <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="5.5" r="2.5" stroke="currentColor" strokeWidth="1.3"/><path d="M3 14c0-2.5 2.2-4.5 5-4.5s5 2 5 4.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>,
  Globe:    () => <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.3"/><path d="M8 2c-2 2.2-2 9.8 0 12M8 2c2 2.2 2 9.8 0 12M2.5 8h11" stroke="currentColor" strokeWidth="1.3"/></svg>,
  Building: () => <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="2" y="3" width="12" height="11" rx="1" stroke="currentColor" strokeWidth="1.3"/><path d="M6 14V9h4v5" stroke="currentColor" strokeWidth="1.3"/><path d="M5.5 6h1M9.5 6h1M5.5 8h1M9.5 8h1" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>,
  Link:     () => <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M6.5 9.5a3 3 0 0 0 4.24.12l1.5-1.5a3 3 0 0 0-4.24-4.24L7 4.88" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/><path d="M9.5 6.5a3 3 0 0 0-4.24-.12L3.76 7.88a3 3 0 0 0 4.24 4.24L9 11.12" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>,
  Bell:     () => <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 2a5 5 0 0 0-5 5v3l-1 1.5h12L13 10V7a5 5 0 0 0-5-5z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/><path d="M6.5 13.5a1.5 1.5 0 0 0 3 0" stroke="currentColor" strokeWidth="1.3"/></svg>,
  Shield:   () => <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 2L3 4.5v4C3 11.5 5.5 14 8 14s5-2.5 5-5.5V4.5L8 2z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/><path d="M5.5 8l1.5 1.5 3.5-3.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  Eye:      () => <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><path d="M1 7.5S3 3 7.5 3 14 7.5 14 7.5 12 12 7.5 12 1 7.5 1 7.5z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/><circle cx="7.5" cy="7.5" r="2" stroke="currentColor" strokeWidth="1.3"/></svg>,
  EyeOff:   () => <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><path d="M2 2l11 11M6.1 6.2A2 2 0 0 0 8.9 8.9M4 4C2.4 5.1 1 7.5 1 7.5s2 4.5 6.5 4.5c1.1 0 2.1-.3 3-.7M6.5 3C7 3 7.3 3 7.5 3c4.5 0 6.5 4.5 6.5 4.5s-.6 1.3-1.8 2.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  Google:   () => <svg width="16" height="16" viewBox="0 0 18 18" fill="none"><path d="M17.64 9.21c0-.64-.06-1.25-.16-1.85H9v3.49h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.91c1.7-1.57 2.69-3.88 2.69-6.62z" fill="#4285F4"/><path d="M9 18c2.43 0 4.47-.81 5.96-2.18l-2.91-2.26c-.81.54-1.84.86-3.05.86-2.34 0-4.33-1.58-5.04-3.71H.96v2.33A9 9 0 0 0 9 18z" fill="#34A853"/><path d="M3.96 10.71A5.41 5.41 0 0 1 3.68 9c0-.59.1-1.17.28-1.71V4.96H.96A9 9 0 0 0 0 9c0 1.45.35 2.83.96 4.04l3-2.33z" fill="#FBBC05"/><path d="M9 3.58c1.32 0 2.51.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .96 4.96l3 2.33C4.67 5.16 6.66 3.58 9 3.58z" fill="#EA4335"/></svg>,
  GoogleCalendar: () => <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true"><rect x="2" y="2" width="14" height="14" rx="2" fill="#fff"/><path d="M4 2h10a2 2 0 0 1 2 2v2H2V4a2 2 0 0 1 2-2z" fill="#1A73E8"/><path d="M2 6h14v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6z" fill="#fff"/><path d="M2 12h4v4H4a2 2 0 0 1-2-2v-2z" fill="#34A853"/><path d="M12 12h4v2a2 2 0 0 1-2 2h-2v-4z" fill="#FBBC04"/><path d="M2 6h4v6H2V6z" fill="#EA4335"/><path d="M12 6h4v6h-4V6z" fill="#4285F4"/><path d="M7.4 12.6h3.2v-1H8.7l1.2-1.2c.42-.42.62-.82.62-1.24 0-.82-.66-1.36-1.58-1.36-.78 0-1.39.38-1.72.99l.88.52c.16-.32.42-.5.8-.5.34 0 .56.17.56.45 0 .2-.11.39-.38.66L7.4 11.64v.96z" fill="#3C4043"/></svg>,
  Gmail: () => <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true"><rect x="2" y="4" width="14" height="10" rx="1.8" fill="#fff"/><path d="M4 4h10c1.1 0 2 .9 2 2v8H2V6c0-1.1.9-2 2-2z" fill="#fff"/><path d="M3.2 5.05 9 9.28l5.8-4.23A2 2 0 0 1 16 6.88V14h-2.4V8.9L9 12.24 4.4 8.9V14H2V6.88c0-.78.46-1.46 1.2-1.83z" fill="#EA4335"/><path d="M2 6.88V14h2.4V8.9L3.2 5.05A2 2 0 0 0 2 6.88z" fill="#C5221F"/><path d="M13.6 8.9V14H16V6.88c0-.78-.46-1.46-1.2-1.83L13.6 8.9z" fill="#F4B400"/><path d="M4.4 8.9 9 12.24l4.6-3.34 1.2-3.85L9 9.28 3.2 5.05 4.4 8.9z" fill="#FBBC04"/></svg>,
  Outlook:  () => <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="1.5" y="3.5" width="9" height="9" rx="1" stroke="#0078D4" strokeWidth="1.2"/><path d="M10.5 5.5l4-2v9l-4-2v-5z" stroke="#0078D4" strokeWidth="1.2" strokeLinejoin="round"/><circle cx="5.5" cy="8.5" r="1.5" fill="#0078D4"/></svg>,
  Upload:   () => <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 11V5M5.5 7.5L8 5l2.5 2.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/><path d="M3 12.5h10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>,
  Close:    () => <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true"><path d="M4.5 4.5l9 9M13.5 4.5l-9 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>,
}

function SidebarCollapseIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M9 2L5 7l4 5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

const NAV = [
  { id: 'home',     Icon: Ic.Home     },
  { id: 'calendar', Icon: Ic.Calendar },
  { id: 'files',    Icon: Ic.Files    },
]
const NAV_LABELS = { home: 'Início', calendar: 'Calendário', files: 'Arquivos' }

const SECTIONS = [
  { id: 'account',       label: 'Conta',                   Icon: Ic.User     },
  { id: 'general',       label: 'Preferências gerais',      Icon: Ic.Globe    },
  { id: 'workspace',     label: 'Workspace',                Icon: Ic.Building },
  { id: 'integrations',  label: 'Integrações',              Icon: Ic.Link     },
  { id: 'notifications', label: 'Notificações',             Icon: Ic.Bell     },
  { id: 'security',      label: 'Privacidade e segurança',  Icon: Ic.Shield   },
]
const SECTION_IDS = new Set(SECTIONS.map(({ id }) => id))

const EMPTY_GMAIL_INTEGRATION = {
  connected: false,
  email: null,
  scopes: [],
  connectedAt: null,
  lastError: null,
}
const AVATAR_ACCEPT = 'image/png,image/jpeg,image/webp'
const MAX_AVATAR_BYTES = 2 * 1024 * 1024
const DELETE_CONFIRMATION_PHRASE = 'EXCLUIR MINHA CONTA'
const MODAL_CLOSE_DURATION_MS = 220

function validateAvatarFile(file) {
  if (!file) return 'Selecione uma imagem.'
  if (!AVATAR_ACCEPT.split(',').includes(file.type)) {
    return 'Use uma imagem PNG, JPG ou WebP.'
  }
  if (file.size > MAX_AVATAR_BYTES) {
    return 'A imagem deve ter no máximo 2 MB.'
  }
  return ''
}

function normalizeSaveState(state) {
  return state === 'saving' || state === 'saved' || state === 'error' ? state : 'idle'
}

function normalizeGmailIntegration(source = {}) {
  return {
    connected: Boolean(source.connected),
    email: source.email ?? null,
    scopes: Array.isArray(source.scopes) ? source.scopes : [],
    connectedAt: source.connectedAt ?? null,
    lastError: source.lastError ?? null,
  }
}

function isDeletePhraseValid(value) {
  return value.trim() === DELETE_CONFIRMATION_PHRASE
}

/* ═══════════════════════════════════════════
   REUSABLE UI PRIMITIVES
═══════════════════════════════════════════ */

function Toggle({ checked, onChange, id, disabled = false }) {
  return (
    <button
      type="button"
      role="switch"
      id={id}
      aria-checked={checked}
      className={`${styles.toggle} ${checked ? styles.toggleOn : ''} ${disabled ? styles.toggleDisabled : ''}`}
      onClick={() => {
        if (!disabled) {
          onChange(!checked)
        }
      }}
      disabled={disabled}
    />
  )
}

function Field({ label, hint, htmlFor, children, row = true, inlineControl = false }) {
  const className = [
    row ? styles.field : styles.fieldBlock,
    row && inlineControl ? styles.fieldInlineControl : '',
  ].filter(Boolean).join(' ')

  return (
    <div className={className}>
      <div className={styles.fieldMeta}>
        <label className={styles.fieldLabel} htmlFor={htmlFor}>{label}</label>
        {hint && <p className={styles.fieldHint}>{hint}</p>}
      </div>
      <div className={styles.fieldControl}>{children}</div>
    </div>
  )
}

function SectionGroup({ title, children }) {
  return (
    <div className={styles.sectionGroup}>
      <p className={styles.sectionGroupTitle}>{title}</p>
      <div className={styles.sectionGroupBody}>{children}</div>
    </div>
  )
}

function SaveButton({ saved, onClick, label = 'Salvar alterações', savedLabel = 'Salvo' }) {
  return (
    <button type="button" className={`${styles.btnPrimary} ${saved ? styles.btnSaved : ''}`} onClick={onClick}>
      {saved ? (
        <><span className={styles.btnCheckIcon}><Ic.Check /></span>{savedLabel}</>
      ) : label}
    </button>
  )
}

function AutoSaveStatus({ state = 'idle', errorMessage = '', successMessage = '' }) {
  if (state === 'saving') {
    return <p className={`${styles.autoSaveStatus} ${styles.autoSaveStatusSaving}`}>Salvando...</p>
  }
  if (state === 'saved') {
    return <p className={`${styles.autoSaveStatus} ${styles.autoSaveStatusSaved}`}>{successMessage || 'Salvo automaticamente'}</p>
  }
  if (state === 'error') {
    return (
      <p className={`${styles.autoSaveStatus} ${styles.autoSaveStatusError}`}>
        {errorMessage || 'Nao foi possivel salvar automaticamente.'}
      </p>
    )
  }
  return null
}

/* ═══════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════ */

export default function SettingsPage({ modal = false }) {
  const { currentUser, workspace, accessToken, isAuthenticated, isDemoSession, patchSession, logout } = useAuth()
  const {
    generalPreferences,
    localPreferences,
    notificationPreferences,
    updateGeneral,
    updateLocal,
    restoreLocalDefaults,
    updateNotifications,
  } = usePreferences()
  const { activeNav, handleNavItemClick } = useWorkspaceNavigation()
  const { isMobile } = useResponsiveViewport()
  const location = useLocation()
  const navigate = useNavigate()
  const modalBackgroundLocation = modal ? location.state?.backgroundLocation ?? null : null
  const backendEnabled = isAuthenticated && !isDemoSession

  const [activeSection, setActiveSection] = useState('account')
  const [exiting, setExiting] = useState(false)
  const closeTimerRef = useRef(null)

  // ── Account state
  const [fullName, setFullName] = useState(currentUser?.fullName ?? '')
  const [showPassForm, setShowPassForm] = useState(false)
  const [curPass, setCurPass] = useState('')
  const [newPass, setNewPass] = useState('')
  const [confirmPass, setConfirmPass] = useState('')
  const [showCurPass, setShowCurPass] = useState(false)
  const [showNewPass, setShowNewPass] = useState(false)
  const [localPasswordEnabled, setLocalPasswordEnabled] = useState(() => currentUser?.localPasswordEnabled ?? true)
  const [externalIdentityLinked, setExternalIdentityLinked] = useState(() => currentUser?.externalIdentityLinked ?? false)
  const [accountSaveState, setAccountSaveState] = useState('idle')
  const [accountFeedback, setAccountFeedback] = useState('')
  const [passwordSaveState, setPasswordSaveState] = useState('idle')
  const [passwordFeedback, setPasswordFeedback] = useState('')
  const [accountAvatarUrl, setAccountAvatarUrl] = useState(currentUser?.avatarUrl ?? null)
  const [accountAvatarPreview, setAccountAvatarPreview] = useState(null)
  const [accountAvatarState, setAccountAvatarState] = useState('idle')
  const [accountAvatarFeedback, setAccountAvatarFeedback] = useState('')
  const accountAvatarInputRef = useRef(null)
  const accountAvatarObjectUrlRef = useRef(null)

  // ── General preferences state
  const [generalSaveState, setGeneralSaveState] = useState('idle')
  const [generalError, setGeneralError] = useState('')
  const [isKanbanAccentPaletteOpen, setIsKanbanAccentPaletteOpen] = useState(false)

  // ── Workspace state
  const [wsName, setWsName] = useState(workspace?.name ?? '')
  const [workspaceAvatarUrl, setWorkspaceAvatarUrl] = useState(workspace?.avatarUrl ?? null)
  const [workspaceAvatarPreview, setWorkspaceAvatarPreview] = useState(null)
  const [workspaceSaveState, setWorkspaceSaveState] = useState('idle')
  const [workspaceError, setWorkspaceError] = useState('')
  const [workspaceAvatarState, setWorkspaceAvatarState] = useState('idle')
  const [workspaceAvatarFeedback, setWorkspaceAvatarFeedback] = useState('')
  const workspaceAvatarInputRef = useRef(null)
  const workspaceAvatarObjectUrlRef = useRef(null)
  const kanbanAccentPickerRef = useRef(null)
  const [workspacePlan, setWorkspacePlan] = useState(() => workspace?.subscriptionPlan ?? 'BASIC')
  const [workspaceStorageUsedBytes, setWorkspaceStorageUsedBytes] = useState(() => workspace?.storageUsedBytes ?? 0)
  const [workspaceStorageQuotaBytes, setWorkspaceStorageQuotaBytes] = useState(() => (
    workspace?.storageQuotaBytes ?? getWorkspacePlanQuotaBytes(workspace?.subscriptionPlan ?? 'BASIC')
  ))
  const [workspacePlanSaveState, setWorkspacePlanSaveState] = useState('idle')
  const [workspacePlanError, setWorkspacePlanError] = useState('')

  // ── Notifications state
  const [dailySummary, setDailySummary] = useState(false)
  const [weeklySummary, setWeeklySummary] = useState(true)
  const [notificationsSaveState, setNotificationsSaveState] = useState('idle')
  const [notificationsError, setNotificationsError] = useState('')

  // ── Integrations state
  const [gmailIntegration, setGmailIntegration] = useState(EMPTY_GMAIL_INTEGRATION)
  const [integrationsLoadState, setIntegrationsLoadState] = useState('idle')
  const [gmailActionState, setGmailActionState] = useState('idle')
  const [gmailFeedbackState, setGmailFeedbackState] = useState('idle')
  const [gmailFeedback, setGmailFeedback] = useState('')

  // ── Security state
  const [activeSessions, setActiveSessions] = useState([])
  const [sessionsLoadState, setSessionsLoadState] = useState('idle')
  const [sessionsFeedback, setSessionsFeedback] = useState('')
  const [sessionActionId, setSessionActionId] = useState(null)
  const [exportState, setExportState] = useState('idle')
  const [exportFeedback, setExportFeedback] = useState('')
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleteConfirmEmail, setDeleteConfirmEmail] = useState('')
  const [deleteConfirmPhrase, setDeleteConfirmPhrase] = useState('')
  const [deleteCurrentPassword, setDeleteCurrentPassword] = useState('')
  const [deleteState, setDeleteState] = useState('idle')
  const [deleteFeedback, setDeleteFeedback] = useState('')
  const sectionButtonRefs = useRef(new Map())

  const workspaceRequestRef = useRef(0)
  const language = generalPreferences.language
  const timezone = generalPreferences.timezone
  const dateFormat = generalPreferences.dateFormat
  const timeFormat = generalPreferences.timeFormat
  const theme = generalPreferences.theme
  const openLastCtx = localPreferences.openLastCtx
  const confirmDestructiveActions = localPreferences.confirmDestructiveActions ?? DEFAULT_LOCAL_PREFERENCES.confirmDestructiveActions
  const liquidGlass = localPreferences.liquidGlass ?? DEFAULT_LOCAL_PREFERENCES.liquidGlass
  const showCurrentPlanSection = localPreferences.showCurrentPlanSection ?? DEFAULT_LOCAL_PREFERENCES.showCurrentPlanSection
  const kanbanAccentColor = localPreferences.kanbanAccentColor ?? DEFAULT_LOCAL_PREFERENCES.kanbanAccentColor
  const hasCustomKanbanAccentColor = Boolean(kanbanAccentColor) && !isKanbanAccentBaseColor(kanbanAccentColor)
  const emailNotifs = notificationPreferences.emailNotifs
  const eventReminders = notificationPreferences.eventReminders
  const deadlineAlerts = notificationPreferences.deadlineAlerts

  const replaceAccountAvatarPreview = (nextUrl) => {
    if (accountAvatarObjectUrlRef.current && accountAvatarObjectUrlRef.current !== nextUrl) {
      window.URL.revokeObjectURL(accountAvatarObjectUrlRef.current)
    }
    accountAvatarObjectUrlRef.current = nextUrl?.startsWith('blob:') ? nextUrl : null
    setAccountAvatarPreview(nextUrl)
  }

  const replaceWorkspaceAvatarPreview = (nextUrl) => {
    if (workspaceAvatarObjectUrlRef.current && workspaceAvatarObjectUrlRef.current !== nextUrl) {
      window.URL.revokeObjectURL(workspaceAvatarObjectUrlRef.current)
    }
    workspaceAvatarObjectUrlRef.current = nextUrl?.startsWith('blob:') ? nextUrl : null
    setWorkspaceAvatarPreview(nextUrl)
  }

  useEffect(() => {
    setFullName(currentUser?.fullName ?? '')
    setWsName(workspace?.name ?? '')
    setAccountAvatarUrl(currentUser?.avatarUrl ?? null)
    setWorkspaceAvatarUrl(workspace?.avatarUrl ?? null)
    setWorkspacePlan(workspace?.subscriptionPlan ?? 'BASIC')
    setWorkspaceStorageUsedBytes(workspace?.storageUsedBytes ?? 0)
    setWorkspaceStorageQuotaBytes(workspace?.storageQuotaBytes ?? getWorkspacePlanQuotaBytes(workspace?.subscriptionPlan ?? 'BASIC'))
    setLocalPasswordEnabled(currentUser?.localPasswordEnabled ?? true)
    setExternalIdentityLinked(currentUser?.externalIdentityLinked ?? false)
  }, [currentUser?.avatarUrl, currentUser?.externalIdentityLinked, currentUser?.fullName, currentUser?.localPasswordEnabled, workspace?.avatarUrl, workspace?.name, workspace?.storageQuotaBytes, workspace?.storageUsedBytes, workspace?.subscriptionPlan])

  useEffect(() => () => {
    if (accountAvatarObjectUrlRef.current) {
      window.URL.revokeObjectURL(accountAvatarObjectUrlRef.current)
    }
    if (workspaceAvatarObjectUrlRef.current) {
      window.URL.revokeObjectURL(workspaceAvatarObjectUrlRef.current)
    }
  }, [])

  useEffect(() => {
    if (!isKanbanAccentPaletteOpen) return undefined

    const handlePointerDown = (event) => {
      if (!kanbanAccentPickerRef.current?.contains(event.target)) {
        setIsKanbanAccentPaletteOpen(false)
      }
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsKanbanAccentPaletteOpen(false)
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isKanbanAccentPaletteOpen])

  useEffect(() => {
    let active = true

    if (!backendEnabled || !accessToken || !accountAvatarUrl) {
      if (!accountAvatarUrl) replaceAccountAvatarPreview(null)
      return () => {
        active = false
      }
    }

    apiRequest(accountAvatarUrl, { token: accessToken, responseType: 'blob' })
      .then((blob) => {
        const objectUrl = window.URL.createObjectURL(blob)
        if (active) {
          replaceAccountAvatarPreview(objectUrl)
        } else {
          window.URL.revokeObjectURL(objectUrl)
        }
      })
      .catch(() => {
        if (active) replaceAccountAvatarPreview(null)
      })

    return () => {
      active = false
    }
  }, [accessToken, accountAvatarUrl, backendEnabled])

  useEffect(() => {
    let active = true

    if (!backendEnabled || !accessToken || !workspaceAvatarUrl) {
      if (!workspaceAvatarUrl) replaceWorkspaceAvatarPreview(null)
      return () => {
        active = false
      }
    }

    apiRequest(workspaceAvatarUrl, { token: accessToken, responseType: 'blob' })
      .then((blob) => {
        const objectUrl = window.URL.createObjectURL(blob)
        if (active) {
          replaceWorkspaceAvatarPreview(objectUrl)
        } else {
          window.URL.revokeObjectURL(objectUrl)
        }
      })
      .catch(() => {
        if (active) replaceWorkspaceAvatarPreview(null)
      })

    return () => {
      active = false
    }
  }, [accessToken, backendEnabled, workspaceAvatarUrl])

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const section = params.get('section')
    const gmail = params.get('gmail')
    const gmailError = params.get('error')

    if (SECTION_IDS.has(section)) {
      setActiveSection(section)
    }

    if (gmail === 'connected') {
      setGmailFeedbackState('saved')
      setGmailFeedback('Gmail conectado com sucesso.')
    } else if (gmail === 'error') {
      setGmailFeedbackState('error')
      setGmailFeedback(gmailError ? `Nao foi possivel conectar o Gmail (${gmailError}).` : 'Nao foi possivel conectar o Gmail.')
    }
  }, [location.search])

  useEffect(() => {
    if (!backendEnabled || !accessToken) {
      setGmailIntegration(EMPTY_GMAIL_INTEGRATION)
      setIntegrationsLoadState('idle')
      return
    }

    let active = true
    setIntegrationsLoadState('saving')

    async function loadIntegrations() {
      try {
        const snapshot = await apiRequest('/api/settings', {
          token: accessToken,
        })

        if (!active) return
        setAccountAvatarUrl(snapshot?.account?.avatarUrl ?? currentUser?.avatarUrl ?? null)
        setLocalPasswordEnabled(snapshot?.account?.localPasswordEnabled ?? currentUser?.localPasswordEnabled ?? true)
        setExternalIdentityLinked(snapshot?.account?.externalIdentityLinked ?? currentUser?.externalIdentityLinked ?? false)
        setGmailIntegration(normalizeGmailIntegration(snapshot?.integrations?.gmail))
        setIntegrationsLoadState('saved')
      } catch (error) {
        if (!active) return
        setIntegrationsLoadState('error')
        setGmailFeedbackState('error')
        setGmailFeedback(error?.message ?? 'Nao foi possivel carregar as integracoes.')
      }
    }

    loadIntegrations()

    return () => {
      active = false
    }
  }, [accessToken, backendEnabled, currentUser?.externalIdentityLinked, currentUser?.localPasswordEnabled, location.search])

  useEffect(() => {
    const activeButton = sectionButtonRefs.current.get(activeSection)
    if (!activeButton || typeof activeButton.scrollIntoView !== 'function') return

    const schedule = window.requestAnimationFrame ?? ((callback) => window.setTimeout(callback, 0))
    schedule(() => {
      activeButton.scrollIntoView({
        block: 'nearest',
        inline: 'center',
        behavior: 'smooth',
      })
    })
  }, [activeSection])

  useEffect(() => {
    if (activeSection !== 'workspace') {
      return
    }

    if (!backendEnabled || !accessToken) {
      return
    }

    let active = true
    setWorkspacePlanError('')

    async function loadWorkspaceDashboard() {
      try {
        const snapshot = await apiRequest('/api/workspace', {
          token: accessToken,
        })

        if (!active) return

        setWorkspacePlan(snapshot?.subscriptionPlan ?? 'BASIC')
        setWorkspaceStorageUsedBytes(snapshot?.storageUsedBytes ?? 0)
        setWorkspaceStorageQuotaBytes(snapshot?.storageQuotaBytes ?? getWorkspacePlanQuotaBytes(snapshot?.subscriptionPlan ?? 'BASIC'))
        patchSession?.({
          workspace: {
            subscriptionPlan: snapshot?.subscriptionPlan ?? 'BASIC',
            storageUsedBytes: snapshot?.storageUsedBytes ?? 0,
            storageQuotaBytes: snapshot?.storageQuotaBytes ?? getWorkspacePlanQuotaBytes(snapshot?.subscriptionPlan ?? 'BASIC'),
          },
        })
      } catch (error) {
        if (!active) return
        setWorkspacePlanError(error?.message ?? 'Nao foi possivel carregar o uso do workspace.')
      }
    }

    loadWorkspaceDashboard()

    return () => {
      active = false
    }
  }, [accessToken, activeSection, backendEnabled, patchSession])

  useEffect(() => {
    if (activeSection !== 'security') {
      return
    }

    if (!backendEnabled || !accessToken) {
      setActiveSessions([])
      setSessionsLoadState('idle')
      return
    }

    let active = true
    setSessionsLoadState('saving')

    async function loadSessions() {
      try {
        const sessions = await apiRequest('/api/settings/security/sessions', {
          token: accessToken,
        })

        if (!active) return
        setActiveSessions(Array.isArray(sessions) ? sessions : [])
        setSessionsLoadState('saved')
      } catch (error) {
        if (!active) return
        setSessionsLoadState('error')
        setSessionsFeedback(error?.message ?? 'Nao foi possivel carregar as sessoes ativas.')
      }
    }

    loadSessions()

    return () => {
      active = false
    }
  }, [accessToken, activeSection, backendEnabled])

  const persistGeneralPreferences = async (nextPreferences) => {
    setGeneralError('')
    setGeneralSaveState('saving')

    try {
      await updateGeneral(nextPreferences)
      setGeneralSaveState('saved')
    } catch (error) {
      setGeneralError(error?.message ?? 'Nao foi possivel salvar as preferencias gerais.')
      setGeneralSaveState('error')
    }
  }

  const persistWorkspaceName = async (nextName) => {
    if (!nextName?.trim()) {
      setWorkspaceSaveState('error')
      setWorkspaceError('O nome do workspace e obrigatorio.')
      return
    }

    if (!backendEnabled || !accessToken) {
      patchSession?.({ workspace: { name: nextName.trim() } })
      setWorkspaceError('')
      setWorkspaceSaveState('saved')
      return
    }

    const requestId = ++workspaceRequestRef.current
    setWorkspaceError('')
    setWorkspaceSaveState('saving')

    try {
      const response = await apiRequest('/api/workspace', {
        method: 'PATCH',
        token: accessToken,
        body: {
          name: nextName,
        },
      })

      if (requestId !== workspaceRequestRef.current) return

      setWsName(response.name)
      setWorkspacePlan(response.subscriptionPlan ?? 'BASIC')
      setWorkspaceStorageUsedBytes(response.storageUsedBytes ?? 0)
      setWorkspaceStorageQuotaBytes(response.storageQuotaBytes ?? getWorkspacePlanQuotaBytes(response.subscriptionPlan ?? 'BASIC'))
      patchSession?.({
        workspace: {
          name: response.name,
          avatarUrl: response.avatarUrl,
          subscriptionPlan: response.subscriptionPlan ?? 'BASIC',
          storageUsedBytes: response.storageUsedBytes ?? 0,
          storageQuotaBytes: response.storageQuotaBytes ?? getWorkspacePlanQuotaBytes(response.subscriptionPlan ?? 'BASIC'),
        },
      })
      setWorkspaceSaveState('saved')
    } catch (error) {
      if (requestId !== workspaceRequestRef.current) return
      setWorkspaceError(error?.message ?? 'Nao foi possivel salvar o nome do workspace.')
      setWorkspaceSaveState('error')
    }
  }

  const persistWorkspaceSubscriptionPlan = async (nextPlan) => {
    if (!nextPlan || nextPlan === workspacePlan) {
      return
    }

    setWorkspacePlanError('')
    setWorkspacePlanSaveState('saving')

    if (!backendEnabled || !accessToken) {
      const quotaBytes = getWorkspacePlanQuotaBytes(nextPlan)
      setWorkspacePlan(nextPlan)
      setWorkspaceStorageQuotaBytes(quotaBytes)
      patchSession?.({
        workspace: {
          subscriptionPlan: nextPlan,
          storageQuotaBytes: quotaBytes,
        },
      })
      setWorkspacePlanSaveState('saved')
      return
    }

    try {
      const response = await apiRequest('/api/workspace/subscription', {
        method: 'PATCH',
        token: accessToken,
        body: {
          subscriptionPlan: nextPlan,
        },
      })

      setWorkspacePlan(response?.subscriptionPlan ?? nextPlan)
      setWorkspaceStorageUsedBytes(response?.storageUsedBytes ?? workspaceStorageUsedBytes)
      setWorkspaceStorageQuotaBytes(response?.storageQuotaBytes ?? getWorkspacePlanQuotaBytes(response?.subscriptionPlan ?? nextPlan))
      patchSession?.({
        workspace: {
          subscriptionPlan: response?.subscriptionPlan ?? nextPlan,
          storageUsedBytes: response?.storageUsedBytes ?? workspaceStorageUsedBytes,
          storageQuotaBytes: response?.storageQuotaBytes ?? getWorkspacePlanQuotaBytes(response?.subscriptionPlan ?? nextPlan),
        },
      })
      setWorkspacePlanSaveState('saved')
    } catch (error) {
      setWorkspacePlanError(error?.message ?? 'Nao foi possivel atualizar o plano do workspace.')
      setWorkspacePlanSaveState('error')
    }
  }

  const persistNotifications = async (nextNotifications) => {
    setNotificationsError('')
    setNotificationsSaveState('saving')

    try {
      await updateNotifications(nextNotifications)
      setNotificationsSaveState('saved')
    } catch (error) {
      setNotificationsError(error?.message ?? 'Nao foi possivel salvar as notificacoes.')
      setNotificationsSaveState('error')
    }
  }

  const handleSaveAccount = async () => {
    if (!fullName.trim()) {
      setAccountSaveState('error')
      setAccountFeedback('O nome completo e obrigatorio.')
      return
    }

    setAccountSaveState('saving')
    setAccountFeedback('')

    if (!backendEnabled || !accessToken) {
      patchSession?.({
        user: {
          fullName: fullName.trim(),
        },
      })
      setAccountSaveState('saved')
      return
    }

    try {
      const response = await apiRequest('/api/settings/account', {
        method: 'PATCH',
        token: accessToken,
        body: {
          fullName,
        },
      })

      setFullName(response.fullName)
      patchSession?.({
        user: {
          fullName: response.fullName,
        },
      })
      setAccountSaveState('saved')
    } catch (error) {
      setAccountSaveState('error')
      setAccountFeedback(error?.message ?? 'Nao foi possivel salvar os dados da conta.')
    }
  }

  const handleAccountAvatarSelected = async (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    const validation = validateAvatarFile(file)
    if (validation) {
      setAccountAvatarState('error')
      setAccountAvatarFeedback(validation)
      return
    }

    replaceAccountAvatarPreview(window.URL.createObjectURL(file))
    setAccountAvatarState('saving')
    setAccountAvatarFeedback('')

    if (!backendEnabled || !accessToken) {
      setAccountAvatarState('saved')
      setAccountAvatarFeedback('Foto atualizada no modo local.')
      return
    }

    try {
      const formData = new FormData()
      formData.append('file', file)
      const response = await apiRequest('/api/settings/account/avatar', {
        method: 'POST',
        token: accessToken,
        body: formData,
      })
      setAccountAvatarUrl(response.avatarUrl ?? null)
      patchSession?.({ user: { avatarUrl: response.avatarUrl ?? null } })
      setAccountAvatarState('saved')
      setAccountAvatarFeedback('Foto atualizada.')
    } catch (error) {
      setAccountAvatarState('error')
      setAccountAvatarFeedback(error?.message ?? 'Nao foi possivel atualizar a foto.')
    }
  }

  const handleRemoveAccountAvatar = async () => {
    setAccountAvatarState('saving')
    setAccountAvatarFeedback('')

    if (!backendEnabled || !accessToken) {
      setAccountAvatarUrl(null)
      replaceAccountAvatarPreview(null)
      setAccountAvatarState('saved')
      setAccountAvatarFeedback('Foto removida no modo local.')
      return
    }

    try {
      const response = await apiRequest('/api/settings/account/avatar', {
        method: 'DELETE',
        token: accessToken,
      })
      setAccountAvatarUrl(response.avatarUrl ?? null)
      replaceAccountAvatarPreview(null)
      patchSession?.({ user: { avatarUrl: response.avatarUrl ?? null } })
      setAccountAvatarState('saved')
      setAccountAvatarFeedback('Foto removida.')
    } catch (error) {
      setAccountAvatarState('error')
      setAccountAvatarFeedback(error?.message ?? 'Nao foi possivel remover a foto.')
    }
  }

  const handleSavePassword = async () => {
    const canSetupPasswordWithoutCurrent = backendEnabled && externalIdentityLinked && !localPasswordEnabled

    if ((!canSetupPasswordWithoutCurrent && !curPass.trim()) || !newPass.trim() || !confirmPass.trim()) {
      setPasswordSaveState('error')
      setPasswordFeedback('Preencha todos os campos da senha.')
      return
    }

    if (newPass.length < 8) {
      setPasswordSaveState('error')
      setPasswordFeedback('A nova senha deve ter pelo menos 8 caracteres.')
      return
    }

    if (newPass !== confirmPass) {
      setPasswordSaveState('error')
      setPasswordFeedback('A confirmacao precisa ser igual a nova senha.')
      return
    }

    if (!backendEnabled || !accessToken) {
      setPasswordSaveState('saved')
      setPasswordFeedback('Senha atualizada no modo local.')
      setShowPassForm(false)
      setCurPass('')
      setNewPass('')
      setConfirmPass('')
      return
    }

    setPasswordSaveState('saving')
    setPasswordFeedback('')

    try {
      const response = await apiRequest(
        canSetupPasswordWithoutCurrent ? '/api/settings/password/setup' : '/api/settings/password',
        {
          method: canSetupPasswordWithoutCurrent ? 'POST' : 'PATCH',
          token: accessToken,
          body: canSetupPasswordWithoutCurrent
            ? { newPassword: newPass }
            : {
                currentPassword: curPass,
                newPassword: newPass,
              },
        },
      )
      setPasswordSaveState('saved')
      setPasswordFeedback(response.message)
      setLocalPasswordEnabled(true)
      patchSession?.({
        user: {
          localPasswordEnabled: true,
          externalIdentityLinked,
        },
      })
      setShowPassForm(false)
      setCurPass('')
      setNewPass('')
      setConfirmPass('')
    } catch (error) {
      setPasswordSaveState('error')
      setPasswordFeedback(error?.message ?? 'Nao foi possivel alterar a senha.')
    }
  }

  const handleGeneralFieldChange = (field, value) => {
    const next = {
      language,
      timezone,
      dateFormat,
      timeFormat,
      theme,
      [field]: value,
    }

    persistGeneralPreferences(next)
  }

  const handleLocalGeneralFieldChange = (field, value) => {
    const nextLocal = {
      ...localPreferences,
      [field]: value,
    }

    updateLocal(nextLocal)
    setGeneralError('')
    setGeneralSaveState('saved')
  }

  const handleRestoreLocalDefaults = () => {
    restoreLocalDefaults()
    setGeneralError('')
    setGeneralSaveState('saved')
  }

  const handleKanbanAccentColorSelect = (value) => {
    handleLocalGeneralFieldChange('kanbanAccentColor', value)
    setIsKanbanAccentPaletteOpen(false)
  }

  const handleWorkspaceNameChange = (value) => {
    setWsName(value)
    persistWorkspaceName(value)
  }

  const handleWorkspaceAvatarSelected = async (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    const validation = validateAvatarFile(file)
    if (validation) {
      setWorkspaceAvatarState('error')
      setWorkspaceAvatarFeedback(validation)
      return
    }

    replaceWorkspaceAvatarPreview(window.URL.createObjectURL(file))
    setWorkspaceAvatarState('saving')
    setWorkspaceAvatarFeedback('')

    if (!backendEnabled || !accessToken) {
      setWorkspaceAvatarState('saved')
      setWorkspaceAvatarFeedback('Avatar atualizado no modo local.')
      return
    }

    try {
      const formData = new FormData()
      formData.append('file', file)
      const response = await apiRequest('/api/workspace/avatar', {
        method: 'POST',
        token: accessToken,
        body: formData,
      })
      setWorkspaceAvatarUrl(response.avatarUrl ?? null)
      setWorkspacePlan(response.subscriptionPlan ?? workspacePlan ?? 'BASIC')
      setWorkspaceStorageUsedBytes(response.storageUsedBytes ?? workspaceStorageUsedBytes ?? 0)
      setWorkspaceStorageQuotaBytes(response.storageQuotaBytes ?? getWorkspacePlanQuotaBytes(response.subscriptionPlan ?? workspacePlan ?? 'BASIC'))
      patchSession?.({
        workspace: {
          avatarUrl: response.avatarUrl ?? null,
          subscriptionPlan: response.subscriptionPlan ?? workspacePlan ?? 'BASIC',
          storageUsedBytes: response.storageUsedBytes ?? workspaceStorageUsedBytes ?? 0,
          storageQuotaBytes: response.storageQuotaBytes ?? getWorkspacePlanQuotaBytes(response.subscriptionPlan ?? workspacePlan ?? 'BASIC'),
        },
      })
      setWorkspaceAvatarState('saved')
      setWorkspaceAvatarFeedback('Avatar atualizado.')
    } catch (error) {
      setWorkspaceAvatarState('error')
      setWorkspaceAvatarFeedback(error?.message ?? 'Nao foi possivel atualizar o avatar.')
    }
  }

  const handleRemoveWorkspaceAvatar = async () => {
    setWorkspaceAvatarState('saving')
    setWorkspaceAvatarFeedback('')

    if (!backendEnabled || !accessToken) {
      setWorkspaceAvatarUrl(null)
      replaceWorkspaceAvatarPreview(null)
      setWorkspaceAvatarState('saved')
      setWorkspaceAvatarFeedback('Avatar removido no modo local.')
      return
    }

    try {
      const response = await apiRequest('/api/workspace/avatar', {
        method: 'DELETE',
        token: accessToken,
      })
      setWorkspaceAvatarUrl(response.avatarUrl ?? null)
      replaceWorkspaceAvatarPreview(null)
      setWorkspacePlan(response.subscriptionPlan ?? workspacePlan ?? 'BASIC')
      setWorkspaceStorageUsedBytes(response.storageUsedBytes ?? workspaceStorageUsedBytes ?? 0)
      setWorkspaceStorageQuotaBytes(response.storageQuotaBytes ?? getWorkspacePlanQuotaBytes(response.subscriptionPlan ?? workspacePlan ?? 'BASIC'))
      patchSession?.({
        workspace: {
          avatarUrl: response.avatarUrl ?? null,
          subscriptionPlan: response.subscriptionPlan ?? workspacePlan ?? 'BASIC',
          storageUsedBytes: response.storageUsedBytes ?? workspaceStorageUsedBytes ?? 0,
          storageQuotaBytes: response.storageQuotaBytes ?? getWorkspacePlanQuotaBytes(response.subscriptionPlan ?? workspacePlan ?? 'BASIC'),
        },
      })
      setWorkspaceAvatarState('saved')
      setWorkspaceAvatarFeedback('Avatar removido.')
    } catch (error) {
      setWorkspaceAvatarState('error')
      setWorkspaceAvatarFeedback(error?.message ?? 'Nao foi possivel remover o avatar.')
    }
  }

  const handleNotificationToggle = (field, value) => {
    const next = {
      emailNotifs,
      eventReminders,
      deadlineAlerts,
      [field]: value,
    }

    persistNotifications(next)
  }

  const handleConnectGmail = async () => {
    if (!backendEnabled || !accessToken) {
      setGmailFeedbackState('error')
      setGmailFeedback('Entre com uma conta real para conectar o Gmail.')
      return
    }

    setGmailActionState('saving')
    setGmailFeedbackState('saving')
    setGmailFeedback('Abrindo permissao do Google...')

    try {
      const response = await apiRequest('/api/settings/integrations/gmail/start', {
        method: 'POST',
        token: accessToken,
        body: { client: 'web' },
      })

      window.location.assign(response.authorizationUrl)
    } catch (error) {
      setGmailActionState('error')
      setGmailFeedbackState('error')
      setGmailFeedback(error?.message ?? 'Nao foi possivel iniciar a conexao Gmail.')
    }
  }

  const handleDisconnectGmail = async () => {
    if (!backendEnabled || !accessToken) {
      return
    }

    setGmailActionState('saving')
    setGmailFeedbackState('saving')
    setGmailFeedback('Desconectando Gmail...')

    try {
      const response = await apiRequest('/api/settings/integrations/gmail', {
        method: 'DELETE',
        token: accessToken,
      })

      setGmailIntegration(normalizeGmailIntegration(response?.gmail))
      setGmailActionState('idle')
      setGmailFeedbackState('saved')
      setGmailFeedback('Gmail desconectado.')
    } catch (error) {
      setGmailActionState('error')
      setGmailFeedbackState('error')
      setGmailFeedback(error?.message ?? 'Nao foi possivel desconectar o Gmail.')
    }
  }

  const handleOpenPasswordFromSecurity = () => {
    setActiveSection('account')
    setShowPassForm(true)
    setPasswordFeedback('')
    setPasswordSaveState('idle')
    navigate(`${location.pathname}?section=account`, {
      replace: true,
      state: location.state,
    })
  }

  const loadSecuritySessions = async () => {
    if (!backendEnabled || !accessToken) {
      setActiveSessions([])
      return
    }

    setSessionsFeedback('')
    setSessionsLoadState('saving')

    try {
      const sessions = await apiRequest('/api/settings/security/sessions', {
        token: accessToken,
      })
      setActiveSessions(Array.isArray(sessions) ? sessions : [])
      setSessionsLoadState('saved')
    } catch (error) {
      setSessionsLoadState('error')
      setSessionsFeedback(error?.message ?? 'Nao foi possivel carregar as sessoes ativas.')
    }
  }

  const handleRevokeSession = async (sessionId) => {
    if (!backendEnabled || !accessToken || !sessionId) {
      return
    }

    setSessionActionId(sessionId)
    setSessionsFeedback('')

    try {
      const response = await apiRequest(`/api/settings/security/sessions/${sessionId}`, {
        method: 'DELETE',
        token: accessToken,
      })
      setSessionsFeedback(response?.message ?? 'Sessao encerrada com sucesso.')
      await loadSecuritySessions()
    } catch (error) {
      setSessionsFeedback(error?.message ?? 'Nao foi possivel encerrar a sessao.')
      setSessionsLoadState('error')
    } finally {
      setSessionActionId(null)
    }
  }

  const handleRevokeOtherSessions = async () => {
    if (!backendEnabled || !accessToken) {
      setSessionsFeedback('Entre com uma conta real para gerenciar sessoes.')
      return
    }

    setSessionActionId('revoke-others')
    setSessionsFeedback('')

    try {
      const response = await apiRequest('/api/settings/security/sessions/revoke-others', {
        method: 'POST',
        token: accessToken,
      })
      setSessionsFeedback(response?.message ?? 'As outras sessoes foram encerradas.')
      await loadSecuritySessions()
    } catch (error) {
      setSessionsFeedback(error?.message ?? 'Nao foi possivel encerrar as outras sessoes.')
      setSessionsLoadState('error')
    } finally {
      setSessionActionId(null)
    }
  }

  const handleExportData = async () => {
    if (!backendEnabled || !accessToken) {
      setExportState('error')
      setExportFeedback('Entre com uma conta real para exportar seus dados.')
      return
    }

    setExportState('saving')
    setExportFeedback('')

    try {
      const blob = await apiRequest('/api/settings/export', {
        token: accessToken,
        responseType: 'blob',
      })
      triggerBlobDownload(blob, `plan-things-export-${new Date().toISOString().slice(0, 10)}.zip`)
      setExportState('saved')
      setExportFeedback('A exportacao foi iniciada.')
    } catch (error) {
      setExportState('error')
      setExportFeedback(error?.message ?? 'Nao foi possivel exportar seus dados.')
    }
  }

  const openDeleteDialog = () => {
    setDeleteDialogOpen(true)
    setDeleteConfirmEmail('')
    setDeleteConfirmPhrase('')
    setDeleteCurrentPassword('')
    setDeleteFeedback('')
    setDeleteState('idle')
  }

  const closeDeleteDialog = () => {
    if (deleteState === 'saving') {
      return
    }

    setDeleteDialogOpen(false)
    setDeleteConfirmEmail('')
    setDeleteConfirmPhrase('')
    setDeleteCurrentPassword('')
    setDeleteFeedback('')
    setDeleteState('idle')
  }

  const closeModal = () => {
    if (!modal) {
      return
    }

    if (exiting) {
      return
    }

    if (deleteDialogOpen) {
      closeDeleteDialog()
      return
    }

    setExiting(true)
    closeTimerRef.current = window.setTimeout(() => {
      if (modalBackgroundLocation) {
        navigate(
          `${modalBackgroundLocation.pathname ?? ''}${modalBackgroundLocation.search ?? ''}${modalBackgroundLocation.hash ?? ''}`,
          { replace: true },
        )
        return
      }

      navigate(-1)
    }, MODAL_CLOSE_DURATION_MS)
  }

  useEffect(() => {
    if (!modal || typeof document === 'undefined') {
      return undefined
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        closeModal()
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [closeModal, modal])

  useEffect(() => () => {
    if (closeTimerRef.current) {
      window.clearTimeout(closeTimerRef.current)
    }
  }, [])

  const handleDeleteAccount = async () => {
    const normalizedEmail = currentUser?.email?.trim() ?? ''
    const requiresPassword = localPasswordEnabled

    if (deleteConfirmEmail.trim().toLowerCase() !== normalizedEmail.toLowerCase()) {
      setDeleteState('error')
      setDeleteFeedback('Digite o e-mail da conta exatamente como exibido.')
      return
    }

    if (!isDeletePhraseValid(deleteConfirmPhrase)) {
      setDeleteState('error')
      setDeleteFeedback(`Digite a frase ${DELETE_CONFIRMATION_PHRASE} para confirmar.`)
      return
    }

    if (requiresPassword && !deleteCurrentPassword.trim()) {
      setDeleteState('error')
      setDeleteFeedback('Informe sua senha atual para excluir a conta.')
      return
    }

    if (!backendEnabled || !accessToken) {
      setDeleteState('error')
      setDeleteFeedback('Entre com uma conta real para excluir a conta.')
      return
    }

    setDeleteState('saving')
    setDeleteFeedback('')

    try {
      await apiRequest('/api/settings/account/delete', {
        method: 'POST',
        token: accessToken,
        body: {
          confirmEmail: deleteConfirmEmail,
          confirmPhrase: deleteConfirmPhrase,
          currentPassword: requiresPassword ? deleteCurrentPassword : null,
        },
      })
      logout()
      navigate('/login', { replace: true })
    } catch (error) {
      setDeleteState('error')
      setDeleteFeedback(error?.message ?? 'Nao foi possivel excluir a conta.')
    }
  }

  const accountSaved = normalizeSaveState(accountSaveState) === 'saved'
  const canSetupPasswordWithoutCurrent = backendEnabled && externalIdentityLinked && !localPasswordEnabled
  const passwordActionLabel = canSetupPasswordWithoutCurrent
    ? 'Criar senha'
    : 'Alterar senha'
  const passwordHint = canSetupPasswordWithoutCurrent
    ? 'Conta vinculada ao OAuth. Você pode criar ou substituir sua senha local sem informar a senha atual.'
    : 'Altere sua senha regularmente para manter a conta protegida.'

  const userInitials = fullName
    ? fullName.split(' ').filter(Boolean).slice(0, 2).map(p => p[0]).join('').toUpperCase()
    : 'AS'

  const wsInitials = wsName
    ? wsName.split(' ').filter(Boolean).slice(0, 2).map(p => p[0]).join('').toUpperCase()
    : 'WS'

  /* ── Section: Conta ── */
  const renderAccount = () => (
    <>
      <SectionGroup title="Perfil">
        <div className={styles.avatarRow}>
          <div className={styles.avatarCircle}>
            {accountAvatarPreview ? (
              <img className={styles.avatarImage} src={accountAvatarPreview} alt="" />
            ) : userInitials}
          </div>
          <div className={styles.avatarMeta}>
            <p className={styles.avatarName}>{fullName || 'Usuário'}</p>
            <p className={styles.avatarHint}>PNG, JPG ou WebP. Máximo 2 MB.</p>
            <input
              ref={accountAvatarInputRef}
              type="file"
              className={styles.fileInput}
              accept={AVATAR_ACCEPT}
              onChange={handleAccountAvatarSelected}
            />
            <div className={styles.avatarActions}>
              <button
                type="button"
                className={styles.btnSecondary}
                onClick={() => accountAvatarInputRef.current?.click()}
                disabled={accountAvatarState === 'saving'}
              >
                <Ic.Upload /> Alterar foto
              </button>
              {(accountAvatarPreview || accountAvatarUrl) && (
                <button
                  type="button"
                  className={styles.btnGhost}
                  onClick={handleRemoveAccountAvatar}
                  disabled={accountAvatarState === 'saving'}
                >
                  Remover
                </button>
              )}
            </div>
            <AutoSaveStatus state={accountAvatarState} errorMessage={accountAvatarFeedback} successMessage={accountAvatarFeedback} />
          </div>
        </div>

        <Field label="Nome completo" htmlFor="full-name">
          <input
            id="full-name"
            type="text"
            className={styles.input}
            value={fullName}
            onChange={(e) => {
              setFullName(e.target.value)
              if (accountSaveState !== 'idle') {
                setAccountSaveState('idle')
                setAccountFeedback('')
              }
            }}
            placeholder="Seu nome completo"
          />
        </Field>

        <Field
          label="E-mail"
          hint="Não é possível alterar o e-mail no momento."
          htmlFor="email"
        >
          <input
            id="email"
            type="email"
            className={`${styles.input} ${styles.inputReadonly}`}
            value={currentUser?.email ?? ''}
            readOnly
          />
        </Field>

        <div className={styles.rowActions}>
          <SaveButton saved={accountSaved} onClick={handleSaveAccount} />
          <AutoSaveStatus state={accountSaveState} errorMessage={accountFeedback} />
        </div>
      </SectionGroup>

      <SectionGroup title="Acesso">
        <Field
          label="Senha"
          hint={passwordHint}
        >
          {!showPassForm ? (
            <button
              type="button"
              className={styles.btnSecondary}
              onClick={() => {
                setShowPassForm(true)
                setPasswordFeedback('')
                setPasswordSaveState('idle')
              }}
            >
              {passwordActionLabel}
            </button>
          ) : (
            <div className={styles.passForm}>
              {!canSetupPasswordWithoutCurrent && (
                <div className={styles.passField}>
                  <input
                    type={showCurPass ? 'text' : 'password'}
                    className={styles.input}
                    placeholder="Senha atual"
                    value={curPass}
                    onChange={e => setCurPass(e.target.value)}
                  />
                  <button type="button" className={styles.eyeBtn} onClick={() => setShowCurPass(v => !v)}>
                    {showCurPass ? <Ic.EyeOff /> : <Ic.Eye />}
                  </button>
                </div>
              )}
              <div className={styles.passField}>
                <input
                  type={showNewPass ? 'text' : 'password'}
                  className={styles.input}
                  placeholder="Nova senha (mínimo 8 caracteres)"
                  value={newPass}
                  onChange={e => setNewPass(e.target.value)}
                />
                <button type="button" className={styles.eyeBtn} onClick={() => setShowNewPass(v => !v)}>
                  {showNewPass ? <Ic.EyeOff /> : <Ic.Eye />}
                </button>
              </div>
              <input
                type="password"
                className={styles.input}
                placeholder="Confirmar nova senha"
                value={confirmPass}
                onChange={e => setConfirmPass(e.target.value)}
              />
              <div className={styles.rowActions}>
                <button type="button" className={styles.btnPrimary} onClick={handleSavePassword}>
                  {canSetupPasswordWithoutCurrent ? 'Salvar senha local' : 'Salvar nova senha'}
                </button>
                <button
                  type="button"
                  className={styles.btnGhost}
                  onClick={() => {
                    setShowPassForm(false)
                    setCurPass('')
                    setNewPass('')
                    setConfirmPass('')
                    setPasswordFeedback('')
                    setPasswordSaveState('idle')
                  }}
                >
                  Cancelar
                </button>
              </div>
              {(passwordFeedback || passwordSaveState === 'saving') && (
                <AutoSaveStatus state={passwordSaveState} errorMessage={passwordFeedback} />
              )}
            </div>
          )}
          {!showPassForm && (passwordFeedback || passwordSaveState === 'saving') && (
            <AutoSaveStatus state={passwordSaveState} errorMessage={passwordFeedback} />
          )}
        </Field>
      </SectionGroup>
    </>
  )

  /* ── Section: Preferências Gerais ── */
  const renderGeneral = () => (
    <>
      <SectionGroup title="Configurações regionais">
        <Field label="Idioma" htmlFor="lang">
          <select id="lang" className={styles.select} value={language} onChange={e => handleGeneralFieldChange('language', e.target.value)}>
            <option value="pt-BR">Português (Brasil)</option>
            <option value="en-US">English (US)</option>
            <option value="es-ES">Español</option>
          </select>
        </Field>
        <Field label="Fuso horário" htmlFor="tz">
          <select id="tz" className={styles.select} value={timezone} onChange={e => handleGeneralFieldChange('timezone', e.target.value)}>
            <option value="America/Sao_Paulo">América/São Paulo (GMT-3)</option>
            <option value="America/New_York">América/Nova York (GMT-5)</option>
            <option value="Europe/London">Europa/Londres (GMT+0)</option>
            <option value="Europe/Paris">Europa/Paris (GMT+1)</option>
            <option value="Asia/Tokyo">Ásia/Tóquio (GMT+9)</option>
          </select>
        </Field>
        <Field label="Formato de data" htmlFor="datefmt">
          <select id="datefmt" className={styles.select} value={dateFormat} onChange={e => handleGeneralFieldChange('dateFormat', e.target.value)}>
            <option value="dd/MM/yyyy">DD/MM/AAAA — 31/12/2024</option>
            <option value="MM/dd/yyyy">MM/DD/AAAA — 12/31/2024</option>
            <option value="yyyy-MM-dd">AAAA-MM-DD — 2024-12-31</option>
          </select>
        </Field>
        <Field label="Formato de hora">
          <div className={styles.radioGroup}>
            {[
              { value: '24h', label: '24 horas — 14:30' },
              { value: '12h', label: '12 horas — 2:30 PM' },
            ].map(opt => (
              <label key={opt.value} className={styles.radioLabel}>
                <input
                  type="radio"
                  className={styles.radio}
                  name="timeFormat"
                  value={opt.value}
                  checked={timeFormat === opt.value}
                  onChange={() => handleGeneralFieldChange('timeFormat', opt.value)}
                />
                <span>{opt.label}</span>
              </label>
            ))}
          </div>
        </Field>
      </SectionGroup>

      <SectionGroup title="Experiência da aplicação">
        <Field
          label="Confirmar ações destrutivas"
          hint="Solicita confirmação antes de excluir itens importantes."
          inlineControl
        >
          <Toggle checked={confirmDestructiveActions} onChange={(value) => handleLocalGeneralFieldChange('confirmDestructiveActions', value)} />
        </Field>
        <Field
          label="Abrir no último contexto usado"
          hint="O app lembrará onde você estava ao sair."
          inlineControl
        >
          <Toggle checked={openLastCtx} onChange={(value) => handleLocalGeneralFieldChange('openLastCtx', value)} />
        </Field>
        <Field
          label="Liquid-glass"
          hint="Preferência salva para o futuro efeito de vidro líquido no KanbanBoard."
          inlineControl
        >
          <Toggle checked={liquidGlass} onChange={(value) => handleLocalGeneralFieldChange('liquidGlass', value)} />
        </Field>
        <Field label="Cor padrão" hint="Define o acento visual usado nos checks, checklist e atalhos do Kanban.">
          <div ref={kanbanAccentPickerRef} className={styles.colorPreferenceControl}>
            <div className={styles.colorSwatchList}>
              {KANBAN_ACCENT_BASE_COLOR_OPTIONS.map((option) => {
                const isSelected = kanbanAccentColor === option.value
                const isDefaultOption = option.value === ''

                return (
                  <button
                    key={option.id}
                    type="button"
                    className={`${styles.colorSwatchButton} ${isSelected ? styles.colorSwatchButtonActive : ''}`}
                    onClick={() => handleKanbanAccentColorSelect(option.value)}
                    aria-pressed={isSelected}
                    aria-label={`Usar cor ${option.label}`}
                    title={option.label}
                  >
                    <span className={`${styles.colorSwatchDot} ${isDefaultOption ? styles.colorSwatchDotDefault : ''}`}>
                      {isDefaultOption ? (
                        <span className={styles.colorSwatchDotDefaultInner} />
                      ) : (
                        <span className={styles.colorSwatchDotFill} style={{ background: option.value }} />
                      )}
                    </span>
                  </button>
                )
              })}

              <button
                type="button"
                className={`${styles.colorPaletteTrigger} ${isKanbanAccentPaletteOpen || hasCustomKanbanAccentColor ? styles.colorPaletteTriggerActive : ''}`}
                onClick={() => setIsKanbanAccentPaletteOpen((open) => !open)}
                aria-expanded={isKanbanAccentPaletteOpen}
                aria-haspopup="dialog"
              >
                <span className={styles.colorPaletteTriggerDot}>
                  {hasCustomKanbanAccentColor ? (
                    <span className={styles.colorSwatchDotFill} style={{ background: kanbanAccentColor }} />
                  ) : (
                    <span className={styles.colorPaletteTriggerPlus}>+</span>
                  )}
                </span>
                <span>Mais cores</span>
              </button>
            </div>

            {isKanbanAccentPaletteOpen ? (
              <div className={styles.colorPalettePopover} role="dialog" aria-label="Paleta de cores do Kanban">
                <p className={styles.colorPaletteTitle}>Tons extras</p>
                <div className={styles.colorPaletteGrid}>
                  {KANBAN_ACCENT_EXTRA_COLOR_OPTIONS.map((option) => {
                    const isSelected = kanbanAccentColor === option.value

                    return (
                      <button
                        key={option.id}
                        type="button"
                        className={`${styles.colorSwatchButton} ${styles.colorPaletteSwatch} ${isSelected ? styles.colorSwatchButtonActive : ''}`}
                        onClick={() => handleKanbanAccentColorSelect(option.value)}
                        aria-pressed={isSelected}
                        aria-label={`Usar cor ${option.label}`}
                        title={option.label}
                      >
                        <span className={styles.colorSwatchDot}>
                          <span className={styles.colorSwatchDotFill} style={{ background: option.value }} />
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>
            ) : null}
          </div>
        </Field>
      </SectionGroup>

      <SectionGroup title="Aparência">
        <Field label="Tema visual" hint="Define como o app se adapta ao modo claro/escuro.">
          <div className={styles.themeGroup}>
            {[
              {
                value: 'system',
                label: 'Sistema',
              },
              {
                value: 'light',
                label: 'Claro',
              },
              {
                value: 'dark',
                label: 'Escuro',
              },
            ].map(opt => (
              <button
                key={opt.value}
                type="button"
                className={`${styles.themeCard} ${theme === opt.value ? styles.themeCardActive : ''}`}
                onClick={() => handleGeneralFieldChange('theme', opt.value)}
                aria-pressed={theme === opt.value}
              >
                 {opt.value === 'system' ? (
                   <span className={`${styles.themePreview} ${styles.themePreviewSystem}`} aria-hidden="true">
                    <span className={styles.themePreviewHalf} data-theme="light" />
                    <span className={styles.themePreviewHalf} data-theme="dark" />
                   </span>
                 ) : (
                   <span
                     className={styles.themePreview}
                     data-theme={opt.value === 'dark' ? 'dark' : 'light'}
                     aria-hidden="true"
                   />
                 )}
                <span className={styles.themeLabel}>{opt.label}</span>
              </button>
            ))}
          </div>
        </Field>
      </SectionGroup>

      <div className={styles.rowActions}>
        <AutoSaveStatus state={generalSaveState} errorMessage={generalError} />
        <button type="button" className={styles.btnGhost} onClick={handleRestoreLocalDefaults}>Restaurar padrões</button>
      </div>
    </>
  )

  /* ── Section: Workspace ── */
  const renderWorkspace = () => {
    const storageQuotaBytes = workspaceStorageQuotaBytes || getWorkspacePlanQuotaBytes(workspacePlan)
    const storageUsedBytes = Math.max(0, workspaceStorageUsedBytes || 0)
    const storageAvailableBytes = Math.max(0, storageQuotaBytes - storageUsedBytes)
    const storagePercent = storageQuotaBytes > 0
      ? Math.min(100, (storageUsedBytes / storageQuotaBytes) * 100)
      : 0

    return (
      <>
      <SectionGroup title="Identidade do workspace">
        <div className={styles.wsIdentityRow}>
          <div className={styles.wsAvatarBox}>
            {workspaceAvatarPreview ? (
              <img className={styles.wsAvatarImage} src={workspaceAvatarPreview} alt="" />
            ) : wsInitials}
          </div>
          <div className={styles.wsIdentityMeta}>
            <p className={styles.wsIdentityLabel}>Logo ou iniciais do workspace</p>
            <p className={styles.wsIdentityHint}>PNG, JPG ou WebP. Recomendado: 128×128 px.</p>
            <input
              ref={workspaceAvatarInputRef}
              type="file"
              className={styles.fileInput}
              accept={AVATAR_ACCEPT}
              onChange={handleWorkspaceAvatarSelected}
            />
            <div className={styles.avatarActions}>
              <button
                type="button"
                className={styles.btnSecondary}
                onClick={() => workspaceAvatarInputRef.current?.click()}
                disabled={workspaceAvatarState === 'saving'}
              >
                <Ic.Upload /> Alterar avatar
              </button>
              {(workspaceAvatarPreview || workspaceAvatarUrl) && (
                <button
                  type="button"
                  className={styles.btnGhost}
                  onClick={handleRemoveWorkspaceAvatar}
                  disabled={workspaceAvatarState === 'saving'}
                >
                  Remover
                </button>
              )}
            </div>
            <AutoSaveStatus state={workspaceAvatarState} errorMessage={workspaceAvatarFeedback} successMessage={workspaceAvatarFeedback} />
          </div>
        </div>

        <Field label="Nome do workspace" htmlFor="ws-name">
          <input
            id="ws-name"
            type="text"
            className={styles.input}
            value={wsName}
            onChange={e => handleWorkspaceNameChange(e.target.value)}
          />
        </Field>

        <Field
          label="Exibir seção de plano atual"
          hint="Mostra o painel de retomada do plano ativo no Workspace."
          inlineControl
        >
          <Toggle checked={showCurrentPlanSection} onChange={(value) => handleLocalGeneralFieldChange('showCurrentPlanSection', value)} />
        </Field>

        <div className={styles.rowActions}>
          <AutoSaveStatus state={workspaceSaveState} errorMessage={workspaceError} />
        </div>
      </SectionGroup>

      <SectionGroup title="Uso e plano">
        <div className={styles.storageBlock}>
          <div className={styles.storageHeader}>
            <span className={styles.storageName}>Armazenamento</span>
            <span className={styles.storageNumbers}>
              {formatBytes(storageUsedBytes)} de {formatBytes(storageQuotaBytes)}
            </span>
          </div>
          <div className={styles.storageTrack}>
            <div className={styles.storageFill} style={{ width: `${storagePercent}%` }} />
          </div>
          <p className={styles.storageHint}>
            {formatBytes(storageAvailableBytes)} disponiveis no plano atual.
          </p>
        </div>

        <div className={styles.planBlock}>
          <div className={styles.planBlockTop}>
            <div>
              <p className={styles.planBlockName}>Plano do workspace</p>
              <p className={styles.planBlockRenewal}>A cota e compartilhada por todos os arquivos ativos.</p>
            </div>
            <span className={styles.planActiveBadge}>{workspacePlan}</span>
          </div>
          <div className={styles.planOptions} role="radiogroup" aria-label="Plano de assinatura do workspace">
            {WORKSPACE_SUBSCRIPTION_PLANS.map((planOption) => {
              const selected = workspacePlan === planOption.id
              return (
                <button
                  key={planOption.id}
                  type="button"
                  className={[
                    styles.planOption,
                    selected ? styles.planOptionSelected : '',
                  ].filter(Boolean).join(' ')}
                  role="radio"
                  aria-checked={selected}
                  onClick={() => persistWorkspaceSubscriptionPlan(planOption.id)}
                  disabled={workspacePlanSaveState === 'saving'}
                >
                  <span className={styles.planOptionRadio} aria-hidden="true" />
                  <span className={styles.planOptionBody}>
                    <span className={styles.planOptionName}>{planOption.label}</span>
                    <span className={styles.planOptionQuota}>{formatBytes(planOption.quotaBytes)} de armazenamento</span>
                  </span>
                </button>
              )
            })}
          </div>
          <AutoSaveStatus
            state={workspacePlanSaveState}
            errorMessage={workspacePlanError}
            successMessage="Plano atualizado."
          />
        </div>
      </SectionGroup>
      </>
    )
  }

  /* ── Section: Integrações ── */
  const renderIntegrations = () => {
    const calendarIntegrations = [
      { id: 'google-calendar', name: 'Google Calendar', Icon: Ic.GoogleCalendar, color: '#1a73e8', status: 'Em breve' },
    ]
    const gmailBusy = gmailActionState === 'saving'
    const gmailStatusText = !backendEnabled
      ? 'Disponível ao entrar com uma conta real'
      : gmailBusy
        ? 'Conectando...'
        : gmailIntegration.connected
          ? `Conectado · ${gmailIntegration.email}`
          : gmailIntegration.lastError
            ? 'Falha na conexão · tente novamente'
            : 'Não conectado'

    return (
      <>
        <SectionGroup title="Calendários">
          {calendarIntegrations.map(({ id, name, Icon, color, status }) => (
            <div key={id} className={styles.integrationCard}>
              <div className={styles.integrationIconBox} style={{ color }}>
                <Icon />
              </div>
              <div className={styles.integrationMeta}>
                <p className={styles.integrationName}>{name}</p>
                <p className={styles.integrationStatus}>{status}</p>
              </div>
              <div className={styles.integrationActions}>
                <button type="button" className={styles.btnSecondary} disabled>Conectar</button>
              </div>
            </div>
          ))}
        </SectionGroup>

        <SectionGroup title="E-mail e captura">
          <div className={styles.integrationCard}>
            <div className={styles.integrationIconBox} style={{ color: '#ea4335' }}>
              <Ic.Gmail />
            </div>
            <div className={styles.integrationMeta}>
              <p className={styles.integrationName}>Gmail</p>
              <p className={styles.integrationStatus}>{gmailStatusText}</p>
              {gmailIntegration.connectedAt?.text && (
                <p className={styles.integrationStatus}>Conectado em {gmailIntegration.connectedAt.text}</p>
              )}
            </div>
            <div className={styles.integrationActions}>
              <button
                type="button"
                className={gmailIntegration.connected ? styles.btnGhost : styles.btnSecondary}
                onClick={gmailIntegration.connected ? handleDisconnectGmail : handleConnectGmail}
                disabled={!backendEnabled || gmailBusy || integrationsLoadState === 'saving'}
              >
                {gmailBusy
                  ? 'Aguarde'
                  : gmailIntegration.connected ? 'Desconectar' : 'Conectar'}
              </button>
            </div>
          </div>
          <div className={styles.rowActions}>
            <AutoSaveStatus state={gmailFeedbackState} errorMessage={gmailFeedback} successMessage={gmailFeedback} />
          </div>
        </SectionGroup>
      </>
    )
  }

  /* ── Section: Notificações ── */
  const renderNotifications = () => (
    <>
      <SectionGroup title="Eventos e prazos">
        <Field
          label="Lembretes de eventos"
          hint="Alertas antes de eventos do calendário."
          inlineControl
        >
          <Toggle checked={eventReminders} onChange={(value) => handleNotificationToggle('eventReminders', value)} />
        </Field>
        <Field
          label="Alertas de prazo de tarefas"
          hint="Notificação quando tarefas se aproximam do vencimento."
          inlineControl
        >
          <Toggle checked={deadlineAlerts} onChange={(value) => handleNotificationToggle('deadlineAlerts', value)} />
        </Field>
      </SectionGroup>

      <SectionGroup title="Comunicação">
        <Field
          label="Notificações por e-mail"
          hint="Receba atualizações importantes por e-mail."
          inlineControl
        >
          <Toggle checked={emailNotifs} onChange={(value) => handleNotificationToggle('emailNotifs', value)} />
        </Field>
        <Field
          label="Silenciar categorias"
          hint="Escolha quais tipos de atividade não geram notificação."
        >
          <div className={styles.muteGroup}>
            {['Comentários', 'Menções', 'Convites', 'Atualizações de plano'].map(cat => (
              <span key={cat} className={styles.muteChip}>{cat}</span>
            ))}
          </div>
        </Field>
      </SectionGroup>

      <SectionGroup title="Resumos">
        <Field
          label="Resumo diário"
          hint="Disponível em breve."
          inlineControl
        >
          <Toggle checked={dailySummary} onChange={setDailySummary} disabled />
        </Field>
        <Field
          label="Resumo semanal"
          hint="Disponível em breve."
          inlineControl
        >
          <Toggle checked={weeklySummary} onChange={setWeeklySummary} disabled />
        </Field>
      </SectionGroup>

      <div className={styles.rowActions}>
        <AutoSaveStatus state={notificationsSaveState} errorMessage={notificationsError} />
      </div>
    </>
  )

  /* ── Section: Privacidade e Segurança ── */
  const renderSecurity = () => (
    <>
      <SectionGroup title="Segurança da conta">
        <Field
          label="Senha"
          hint="Use uma senha forte com letras, numeros e simbolos."
        >
          <button type="button" className={styles.btnSecondary} onClick={handleOpenPasswordFromSecurity}>
            {localPasswordEnabled ? 'Alterar senha' : 'Criar senha'}
          </button>
        </Field>
        <Field
          label="Autenticação em dois fatores"
          hint="Adicione uma camada extra de proteção à sua conta."
        >
          <div className={styles.futurePill}>
            <span className={styles.futureBadge}>Em breve</span>
            <span className={styles.futureHint}>Disponivel em uma atualizacao futura.</span>
          </div>
        </Field>
        <Field
          label="Sessões ativas"
          hint="Visualize e encerre sessões abertas em outros dispositivos."
        >
          {!backendEnabled ? (
            <p className={styles.securityHint}>Entre com uma conta real para visualizar sessoes ativas.</p>
          ) : (
            <div className={styles.sessionsPanel}>
              {sessionsLoadState === 'saving' ? (
                <p className={styles.securityHint}>Carregando sessoes...</p>
              ) : activeSessions.length === 0 ? (
                <p className={styles.securityHint}>Nenhuma outra sessao ativa encontrada.</p>
              ) : (
                <div className={styles.sessionsList}>
                  {activeSessions.map((session) => {
                    const actionBusy = sessionActionId === session.id
                    const currentTag = session.current ? 'Sessao atual' : session.client === 'mobile' ? 'Mobile' : 'Web'

                    return (
                      <div key={session.id} className={styles.sessionCard}>
                        <div className={styles.sessionCardMeta}>
                          <div className={styles.sessionCardTop}>
                            <p className={styles.sessionTitle}>{session.deviceLabel || 'Sessao ativa'}</p>
                            <span className={styles.sessionBadge}>{currentTag}</span>
                          </div>
                          <p className={styles.sessionHint}>
                            Ativa em {session.lastSeenAt?.text ?? session.createdAt?.text ?? 'momento recente'}
                          </p>
                          <p className={styles.sessionHint}>
                            Iniciada em {session.createdAt?.text ?? 'data indisponivel'}
                          </p>
                        </div>
                        {session.revocable ? (
                          <button
                            type="button"
                            className={styles.btnGhost}
                            onClick={() => handleRevokeSession(session.id)}
                            disabled={actionBusy || sessionActionId === 'revoke-others'}
                          >
                            {actionBusy ? 'Encerrando...' : 'Encerrar'}
                          </button>
                        ) : (
                          <span className={styles.sessionCurrentLabel}>Em uso</span>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
              {(sessionsFeedback || sessionsLoadState === 'error') && (
                <AutoSaveStatus state={sessionsLoadState === 'error' ? 'error' : 'saved'} errorMessage={sessionsFeedback} successMessage={sessionsFeedback} />
              )}
            </div>
          )}
        </Field>
      </SectionGroup>

      <SectionGroup title="Dados e privacidade">
        <Field
          label="Exportar meus dados"
          hint="Baixe uma cópia completa dos seus dados do Plan Things."
        >
          <div className={styles.securityActionBlock}>
            <button
              type="button"
              className={styles.btnSecondary}
              onClick={handleExportData}
              disabled={exportState === 'saving'}
            >
              {exportState === 'saving' ? 'Preparando...' : 'Exportar dados'}
            </button>
            {(exportFeedback || exportState === 'saving') && (
              <AutoSaveStatus state={exportState} errorMessage={exportFeedback} successMessage={exportFeedback} />
            )}
          </div>
        </Field>
        <Field
          label="Encerrar outras sessões"
          hint="Invalida todos os tokens de acesso em outros dispositivos."
        >
          <div className={styles.securityActionBlock}>
            <button
              type="button"
              className={styles.btnSecondary}
              onClick={handleRevokeOtherSessions}
              disabled={!backendEnabled || sessionActionId === 'revoke-others' || sessionsLoadState === 'saving'}
            >
              {sessionActionId === 'revoke-others' ? 'Encerrando...' : 'Encerrar outras sessoes'}
            </button>
            <p className={styles.securityHint}>Sua sessao atual permanece conectada.</p>
          </div>
        </Field>
      </SectionGroup>

      <SectionGroup title="Zona de perigo">
        <div className={styles.dangerZone}>
          <div className={styles.dangerItem}>
            <div>
              <p className={styles.dangerTitle}>Excluir conta</p>
              <p className={styles.dangerHint}>
                Esta acao e permanente e irreversivel. Todos os seus dados,
                planos e arquivos serao removidos definitivamente.
              </p>
            </div>
            <button type="button" className={styles.btnDanger} onClick={openDeleteDialog}>
              Excluir conta
            </button>
          </div>
        </div>
      </SectionGroup>
    </>
  )

  const renderContent = () => {
    switch (activeSection) {
      case 'account':       return renderAccount()
      case 'general':       return renderGeneral()
      case 'workspace':     return renderWorkspace()
      case 'integrations':  return renderIntegrations()
      case 'notifications': return renderNotifications()
      case 'security':      return renderSecurity()
      default:              return renderAccount()
    }
  }

  const activeLabel = SECTIONS.find(s => s.id === activeSection)?.label ?? 'Configurações'

  const handleSectionChange = (nextSection) => {
    setActiveSection(nextSection)

    const params = new URLSearchParams(location.search)
    params.set('section', nextSection)
    navigate(`${location.pathname}?${params.toString()}`, {
      replace: true,
      state: location.state,
    })
  }

  const renderSidebarBottomContent = ({ collapsed }) => (
    <SidebarAccountMenu styles={styles} collapsed={collapsed} />
  )

  const settingsHeader = modal ? (
    <PlanPageHeader
      title="Configurações"
      breadcrumbCurrent="Configurações"
      breadcrumbRootLabel="Workspace"
      tone="solid"
      titleSize="medium"
      actions={(
        <button
          type="button"
          className={styles.settingsModalCloseButton}
          onClick={closeModal}
          aria-label="Fechar configurações"
        >
          <Ic.Close />
        </button>
      )}
    />
  ) : !isMobile ? (
    <PlanPageHeader
      title="Configurações"
      breadcrumbCurrent="Configurações"
      breadcrumbRootLabel="Workspace"
      tone="solid"
      titleSize="medium"
    />
  ) : null

  const settingsLayout = (
    <div className={`${styles.settingsLayout} ${modal ? styles.settingsLayoutModal : ''}`}>
      <nav
        className={`${styles.settingsNav} ${modal ? styles.settingsNavModal : ''}`}
        aria-label="Seções de configurações"
      >
        {SECTIONS.map(({ id, label, Icon }) => (
          <button
            key={id}
            type="button"
            ref={(node) => {
              if (node) {
                sectionButtonRefs.current.set(id, node)
              } else {
                sectionButtonRefs.current.delete(id)
              }
            }}
            className={`${styles.settingsNavItem} ${activeSection === id ? styles.settingsNavItemActive : ''}`}
            onClick={() => handleSectionChange(id)}
            aria-current={activeSection === id ? 'page' : undefined}
          >
            <span className={styles.settingsNavIcon}><Icon /></span>
            <span className={styles.settingsNavLabel}>{label}</span>
          </button>
        ))}
      </nav>

      <main className={`${styles.settingsContent} ${modal ? styles.settingsContentModal : ''}`}>
        {!isMobile ? (
          <div className={styles.settingsContentHeader}>
            <h2 className={styles.settingsContentTitle}>{activeLabel}</h2>
          </div>
        ) : null}
        <div className={styles.settingsContentBody}>
          {renderContent()}
        </div>
      </main>
    </div>
  )

  if (modal) {
    return (
      <AppThemeScope>
        <div
          className={`${styles.settingsModalOverlay} ${exiting ? styles.settingsOverlayOut : ''}`}
          role="presentation"
          onClick={closeModal}
        >
          <div
            className={`${styles.settingsModalCard} ${exiting ? styles.settingsPanelOut : ''}`}
            role="dialog"
            aria-modal="true"
            aria-label="Configurações"
            onClick={(event) => event.stopPropagation()}
          >
            <div className={styles.settingsModalBody}>
              {settingsHeader}
              {settingsLayout}
            </div>

            {deleteDialogOpen && (
              <div className={styles.dialogOverlay} role="presentation" onClick={closeDeleteDialog}>
                <div
                  className={styles.dialogCard}
                  role="dialog"
                  aria-modal="true"
                  aria-labelledby="delete-account-title"
                  onClick={(event) => event.stopPropagation()}
                >
                  <div className={styles.dialogHeader}>
                    <div>
                      <p className={styles.dialogEyebrow}>Zona de perigo</p>
                      <h3 id="delete-account-title" className={styles.dialogTitle}>Excluir conta</h3>
                    </div>
                    <button type="button" className={styles.btnGhost} onClick={closeDeleteDialog} disabled={deleteState === 'saving'}>
                      Fechar
                    </button>
                  </div>
                  <p className={styles.dialogText}>
                    Para confirmar, digite seu e-mail e a frase <strong>{DELETE_CONFIRMATION_PHRASE}</strong>.
                    {localPasswordEnabled ? ' Sua senha atual tambem sera solicitada.' : ''}
                  </p>
                  <div className={styles.dialogFields}>
                    <div className={styles.fieldBlock}>
                      <label className={styles.fieldLabel} htmlFor="delete-confirm-email">E-mail da conta</label>
                      <input
                        id="delete-confirm-email"
                        type="email"
                        className={styles.input}
                        value={deleteConfirmEmail}
                        onChange={(event) => setDeleteConfirmEmail(event.target.value)}
                        placeholder={currentUser?.email ?? 'voce@exemplo.com'}
                        disabled={deleteState === 'saving'}
                      />
                    </div>
                    <div className={styles.fieldBlock}>
                      <label className={styles.fieldLabel} htmlFor="delete-confirm-phrase">Frase de confirmação</label>
                      <input
                        id="delete-confirm-phrase"
                        type="text"
                        className={styles.input}
                        value={deleteConfirmPhrase}
                        onChange={(event) => setDeleteConfirmPhrase(event.target.value)}
                        placeholder={DELETE_CONFIRMATION_PHRASE}
                        disabled={deleteState === 'saving'}
                      />
                    </div>
                    {localPasswordEnabled && (
                      <div className={styles.fieldBlock}>
                        <label className={styles.fieldLabel} htmlFor="delete-current-password">Senha atual</label>
                        <input
                          id="delete-current-password"
                          type="password"
                          className={styles.input}
                          value={deleteCurrentPassword}
                          onChange={(event) => setDeleteCurrentPassword(event.target.value)}
                          placeholder="Digite sua senha atual"
                          disabled={deleteState === 'saving'}
                        />
                      </div>
                    )}
                  </div>
                  {(deleteFeedback || deleteState === 'saving') && (
                    <AutoSaveStatus state={deleteState} errorMessage={deleteFeedback} successMessage={deleteFeedback} />
                  )}
                  <div className={styles.dialogActions}>
                    <button type="button" className={styles.btnGhost} onClick={closeDeleteDialog} disabled={deleteState === 'saving'}>
                      Cancelar
                    </button>
                    <button
                      type="button"
                      className={styles.btnDanger}
                      onClick={handleDeleteAccount}
                      disabled={
                        deleteState === 'saving'
                        || deleteConfirmEmail.trim().length === 0
                        || !isDeletePhraseValid(deleteConfirmPhrase)
                        || (localPasswordEnabled && deleteCurrentPassword.trim().length === 0)
                      }
                    >
                      {deleteState === 'saving' ? 'Excluindo...' : 'Excluir conta permanentemente'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </AppThemeScope>
    )
  }

  return (
    <AppThemeScope>
      <ProductAppShell
        styles={styles}
        activeNav={activeNav}
        onNavItemClick={handleNavItemClick}
        navItems={NAV.map(({ id, Icon }) => ({ id, label: NAV_LABELS[id], Icon }))}
        LogoIcon={Ic.Logo}
        CollapseIcon={SidebarCollapseIcon}
        ChevronIcon={Ic.Chevron}
        HintIcon={Ic.Popover}
        bottomContent={renderSidebarBottomContent}
        contentClassName={styles.settingsWrapper}
        mobileTitle={activeLabel}
      >
        {settingsHeader}
        {settingsLayout}

        {deleteDialogOpen && (
          <div className={styles.dialogOverlay} role="presentation" onClick={closeDeleteDialog}>
            <div
              className={styles.dialogCard}
              role="dialog"
              aria-modal="true"
              aria-labelledby="delete-account-title"
              onClick={(event) => event.stopPropagation()}
            >
              <div className={styles.dialogHeader}>
                <div>
                  <p className={styles.dialogEyebrow}>Zona de perigo</p>
                  <h3 id="delete-account-title" className={styles.dialogTitle}>Excluir conta</h3>
                </div>
                <button type="button" className={styles.btnGhost} onClick={closeDeleteDialog} disabled={deleteState === 'saving'}>
                  Fechar
                </button>
              </div>
              <p className={styles.dialogText}>
                Para confirmar, digite seu e-mail e a frase <strong>{DELETE_CONFIRMATION_PHRASE}</strong>.
                {localPasswordEnabled ? ' Sua senha atual tambem sera solicitada.' : ''}
              </p>
              <div className={styles.dialogFields}>
                <div className={styles.fieldBlock}>
                  <label className={styles.fieldLabel} htmlFor="delete-confirm-email">E-mail da conta</label>
                  <input
                    id="delete-confirm-email"
                    type="email"
                    className={styles.input}
                    value={deleteConfirmEmail}
                    onChange={(event) => setDeleteConfirmEmail(event.target.value)}
                    placeholder={currentUser?.email ?? 'voce@exemplo.com'}
                    disabled={deleteState === 'saving'}
                  />
                </div>
                <div className={styles.fieldBlock}>
                  <label className={styles.fieldLabel} htmlFor="delete-confirm-phrase">Frase de confirmação</label>
                  <input
                    id="delete-confirm-phrase"
                    type="text"
                    className={styles.input}
                    value={deleteConfirmPhrase}
                    onChange={(event) => setDeleteConfirmPhrase(event.target.value)}
                    placeholder={DELETE_CONFIRMATION_PHRASE}
                    disabled={deleteState === 'saving'}
                  />
                </div>
                {localPasswordEnabled && (
                  <div className={styles.fieldBlock}>
                    <label className={styles.fieldLabel} htmlFor="delete-current-password">Senha atual</label>
                    <input
                      id="delete-current-password"
                      type="password"
                      className={styles.input}
                      value={deleteCurrentPassword}
                      onChange={(event) => setDeleteCurrentPassword(event.target.value)}
                      placeholder="Digite sua senha atual"
                      disabled={deleteState === 'saving'}
                    />
                  </div>
                )}
              </div>
              {(deleteFeedback || deleteState === 'saving') && (
                <AutoSaveStatus state={deleteState} errorMessage={deleteFeedback} successMessage={deleteFeedback} />
              )}
              <div className={styles.dialogActions}>
                <button type="button" className={styles.btnGhost} onClick={closeDeleteDialog} disabled={deleteState === 'saving'}>
                  Cancelar
                </button>
                <button
                  type="button"
                  className={styles.btnDanger}
                  onClick={handleDeleteAccount}
                  disabled={
                    deleteState === 'saving'
                    || deleteConfirmEmail.trim().length === 0
                    || !isDeletePhraseValid(deleteConfirmPhrase)
                    || (localPasswordEnabled && deleteCurrentPassword.trim().length === 0)
                  }
                >
                  {deleteState === 'saving' ? 'Excluindo...' : 'Excluir conta permanentemente'}
                </button>
              </div>
            </div>
          </div>
        )}
      </ProductAppShell>
    </AppThemeScope>
  )
}
