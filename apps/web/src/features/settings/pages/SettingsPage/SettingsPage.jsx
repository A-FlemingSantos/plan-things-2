import { useEffect, useRef, useState } from 'react'
import {
  BellRing,
  Blocks,
  LayoutDashboard,
  Settings2,
  ShieldCheck,
  User,
} from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import { SiGithub } from 'react-icons/si'
import { useAuth } from '../../../auth/context/AuthContext.jsx'
import { readSessionModeFromAuthState } from '../../../auth/utils/sessionMode.js'
import {
  DEFAULT_LOCAL_PREFERENCES,
  usePreferences,
} from '../../../preferences/context/PreferencesContext.jsx'
import { apiRequest, triggerBlobDownload } from '../../../../shared/api/apiClient.js'
import ProductAppShell from '../../../../shared/components/ProductAppShell/ProductAppShell.jsx'
import PlanPageHeader from '../../../../shared/components/PlanPageHeader/PlanPageHeader.jsx'
import CustomScrollArea from '../../../../shared/components/CustomScrollArea/CustomScrollArea.jsx'
import Toggle from '../../../../shared/components/Toggle/Toggle.jsx'
import { useResponsiveViewport } from '../../../../shared/hooks/useResponsiveViewport.js'
import { ROUTES, toRouteString } from '../../../../shared/config/routes.js'
import { formatBytes } from '../../../../shared/utils/formatBytes.js'
import { WORKSPACE_SUBSCRIPTION_PLANS, getWorkspacePlanLabel, getWorkspacePlanQuotaBytes } from '../../../../shared/utils/workspaceSubscriptionPlans.js'
import {
  getWorkspaceIconOption,
  normalizeWorkspaceIconKey,
  WorkspaceIconGlyph,
  WORKSPACE_ICON_OPTIONS,
} from '../../../../shared/components/WorkspaceIconBadge/WorkspaceIconBadge.jsx'
import AppThemeScope from '../../../preferences/components/AppThemeScope/AppThemeScope.jsx'
import {
  KANBAN_ACCENT_BASE_COLOR_OPTIONS,
  KANBAN_ACCENT_EXTRA_COLOR_OPTIONS,
  isKanbanAccentBaseColor,
  resolveKanbanAccentColor,
} from '../../../workspace/data/kanbanColorPalette.js'
import DeleteAccountDialog from '../../components/DeleteAccountDialog/DeleteAccountDialog.jsx'
import {
  DELETE_CONFIRMATION_PHRASE,
  isDeletePhraseValid,
} from '../../components/DeleteAccountDialog/deleteAccountUtils.js'
import SettingsAccountSection, { AVATAR_ACCEPT } from '../../components/SettingsAccountSection/SettingsAccountSection.jsx'
import {
  SettingsAutoSaveStatus,
  SettingsField,
  SettingsSectionGroup,
} from '../../components/settingsForm/index.js'
import {
  ChevronIcon,
  CloseIcon,
  GmailIcon,
  GoogleCalendarIcon,
  UndefinedIcon,
} from '../../../../shared/components/icons/index.js'
import styles from './SettingsPage.module.css'

const SECTION_NAV_ICON_SIZE = 16
const SECTION_NAV_ICON_STROKE = 1.75

const SECTIONS = [
  { id: 'account',       label: 'Conta',                   Icon: User         },
  { id: 'general',       label: 'Preferências gerais',      Icon: Settings2    },
  { id: 'workspace',     label: 'Área de trabalho',         Icon: LayoutDashboard },
  { id: 'integrations',  label: 'Integrações',              Icon: Blocks       },
  { id: 'notifications', label: 'Notificações',             Icon: BellRing     },
  { id: 'security',      label: 'Privacidade e segurança',  Icon: ShieldCheck  },
]
const SECTION_IDS = new Set(SECTIONS.map(({ id }) => id))

const EMPTY_GMAIL_INTEGRATION = {
  connected: false,
  email: null,
  scopes: [],
  connectedAt: null,
  lastError: null,
}
const EMPTY_GITHUB_INTEGRATION = {
  connected: false,
  login: null,
  avatarUrl: null,
  scopes: [],
  connectedAt: null,
  lastError: null,
}
const MAX_AVATAR_BYTES = 2 * 1024 * 1024
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

function normalizeGitHubIntegration(source = {}) {
  return {
    connected: Boolean(source.connected),
    login: source.login ?? null,
    avatarUrl: source.avatarUrl ?? null,
    scopes: Array.isArray(source.scopes) ? source.scopes : [],
    connectedAt: source.connectedAt ?? null,
    lastError: source.lastError ?? null,
  }
}

/* ═══════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════ */

export default function SettingsPage({ modal = false, backgroundLocation = null }) {
  const auth = useAuth()
  const { currentUser, workspace, accessToken, patchSession, logout } = auth
  const {
    generalPreferences,
    localPreferences,
    notificationPreferences,
    updateGeneral,
    updateLocal,
    restoreLocalDefaults,
    updateNotifications,
  } = usePreferences()
  const { isMobile } = useResponsiveViewport()
  const location = useLocation()
  const navigate = useNavigate()
  const modalBackgroundLocation = modal ? backgroundLocation : null
  const backendEnabled = readSessionModeFromAuthState(auth) === 'authenticated'

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
  const [isWorkspaceIconPickerOpen, setIsWorkspaceIconPickerOpen] = useState(false)

  // ── Workspace state
  const [wsName, setWsName] = useState(workspace?.name ?? '')
  const [workspaceIconKey, setWorkspaceIconKey] = useState(() => normalizeWorkspaceIconKey(workspace?.iconKey))
  const [workspaceSaveState, setWorkspaceSaveState] = useState('idle')
  const [workspaceError, setWorkspaceError] = useState('')
  const [workspaceIconState, setWorkspaceIconState] = useState('idle')
  const [workspaceIconFeedback, setWorkspaceIconFeedback] = useState('')
  const [isWorkspaceAssistantPanelOpen, setIsWorkspaceAssistantPanelOpen] = useState(true)
  const kanbanAccentPickerRef = useRef(null)
  const workspaceIconPickerRef = useRef(null)
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
  const [githubIntegration, setGitHubIntegration] = useState(EMPTY_GITHUB_INTEGRATION)
  const [integrationsLoadState, setIntegrationsLoadState] = useState('idle')
  const [gmailActionState, setGmailActionState] = useState('idle')
  const [gmailFeedbackState, setGmailFeedbackState] = useState('idle')
  const [gmailFeedback, setGmailFeedback] = useState('')
  const [githubActionState, setGitHubActionState] = useState('idle')
  const [githubFeedbackState, setGitHubFeedbackState] = useState('idle')
  const [githubFeedback, setGitHubFeedback] = useState('')

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
  const kanbanAccentColor = localPreferences.kanbanAccentColor ?? DEFAULT_LOCAL_PREFERENCES.kanbanAccentColor
  const settingsToggleAccentColor = kanbanAccentColor
    ? resolveKanbanAccentColor(kanbanAccentColor)
    : 'var(--settings-neutral-accent)'
  const hasCustomKanbanAccentColor = Boolean(kanbanAccentColor) && !isKanbanAccentBaseColor(kanbanAccentColor)
  const emailNotifs = notificationPreferences.emailNotifs
  const eventReminders = notificationPreferences.eventReminders
  const deadlineAlerts = notificationPreferences.deadlineAlerts
  const settingsThemeStyle = {
    '--settings-toggle-accent': settingsToggleAccentColor,
  }

  const replaceAccountAvatarPreview = (nextUrl) => {
    if (accountAvatarObjectUrlRef.current && accountAvatarObjectUrlRef.current !== nextUrl) {
      window.URL.revokeObjectURL(accountAvatarObjectUrlRef.current)
    }
    accountAvatarObjectUrlRef.current = nextUrl?.startsWith('blob:') ? nextUrl : null
    setAccountAvatarPreview(nextUrl)
  }

  useEffect(() => {
    setFullName(currentUser?.fullName ?? '')
    setWsName(workspace?.name ?? '')
    setAccountAvatarUrl(currentUser?.avatarUrl ?? null)
    setWorkspaceIconKey(normalizeWorkspaceIconKey(workspace?.iconKey))
    setWorkspacePlan(workspace?.subscriptionPlan ?? 'BASIC')
    setWorkspaceStorageUsedBytes(workspace?.storageUsedBytes ?? 0)
    setWorkspaceStorageQuotaBytes(workspace?.storageQuotaBytes ?? getWorkspacePlanQuotaBytes(workspace?.subscriptionPlan ?? 'BASIC'))
    setLocalPasswordEnabled(currentUser?.localPasswordEnabled ?? true)
    setExternalIdentityLinked(currentUser?.externalIdentityLinked ?? false)
  }, [currentUser?.avatarUrl, currentUser?.externalIdentityLinked, currentUser?.fullName, currentUser?.localPasswordEnabled, workspace?.iconKey, workspace?.name, workspace?.storageQuotaBytes, workspace?.storageUsedBytes, workspace?.subscriptionPlan])

  useEffect(() => () => {
    if (accountAvatarObjectUrlRef.current) {
      window.URL.revokeObjectURL(accountAvatarObjectUrlRef.current)
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
    if (!isWorkspaceIconPickerOpen) return undefined

    const handlePointerDown = (event) => {
      if (!workspaceIconPickerRef.current?.contains(event.target)) {
        setIsWorkspaceIconPickerOpen(false)
      }
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsWorkspaceIconPickerOpen(false)
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isWorkspaceIconPickerOpen])

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
    const params = new URLSearchParams(location.search)
    const section = params.get('section')
    const gmail = params.get('gmail')
    const github = params.get('github')
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

    if (github === 'connected') {
      setGitHubFeedbackState('saved')
      setGitHubFeedback('GitHub conectado com sucesso.')
    } else if (github === 'error') {
      setGitHubFeedbackState('error')
      setGitHubFeedback(gmailError ? `Não foi possível conectar o GitHub (${gmailError}).` : 'Não foi possível conectar o GitHub.')
    }
  }, [location.search])

  useEffect(() => {
    if (!backendEnabled || !accessToken) {
      setGmailIntegration(EMPTY_GMAIL_INTEGRATION)
      setGitHubIntegration(EMPTY_GITHUB_INTEGRATION)
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
        setGitHubIntegration(normalizeGitHubIntegration(snapshot?.integrations?.github))
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

        setWorkspaceIconKey(normalizeWorkspaceIconKey(snapshot?.iconKey))
        setWorkspacePlan(snapshot?.subscriptionPlan ?? 'BASIC')
        setWorkspaceStorageUsedBytes(snapshot?.storageUsedBytes ?? 0)
        setWorkspaceStorageQuotaBytes(snapshot?.storageQuotaBytes ?? getWorkspacePlanQuotaBytes(snapshot?.subscriptionPlan ?? 'BASIC'))
        patchSession?.({
          workspace: {
            iconKey: normalizeWorkspaceIconKey(snapshot?.iconKey),
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
          iconKey: normalizeWorkspaceIconKey(response.iconKey),
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

  const persistWorkspaceIcon = async (nextIconKey, previousIconKey = workspaceIconKey) => {
    const normalizedIconKey = normalizeWorkspaceIconKey(nextIconKey)
    setWorkspaceIconState('saving')
    setWorkspaceIconFeedback('')

    if (!backendEnabled || !accessToken) {
      patchSession?.({ workspace: { iconKey: normalizedIconKey } })
      setWorkspaceIconState('saved')
      setWorkspaceIconFeedback('Ícone atualizado no modo local.')
      return
    }

    try {
      const response = await apiRequest('/api/workspace/icon', {
        method: 'PATCH',
        token: accessToken,
        body: {
          iconKey: normalizedIconKey,
        },
      })

      setWorkspaceIconKey(normalizeWorkspaceIconKey(response?.iconKey))
      setWorkspacePlan(response?.subscriptionPlan ?? workspacePlan ?? 'BASIC')
      setWorkspaceStorageUsedBytes(response?.storageUsedBytes ?? workspaceStorageUsedBytes ?? 0)
      setWorkspaceStorageQuotaBytes(response?.storageQuotaBytes ?? getWorkspacePlanQuotaBytes(response?.subscriptionPlan ?? workspacePlan ?? 'BASIC'))
      patchSession?.({
        workspace: {
          iconKey: normalizeWorkspaceIconKey(response?.iconKey),
          subscriptionPlan: response?.subscriptionPlan ?? workspacePlan ?? 'BASIC',
          storageUsedBytes: response?.storageUsedBytes ?? workspaceStorageUsedBytes ?? 0,
          storageQuotaBytes: response?.storageQuotaBytes ?? getWorkspacePlanQuotaBytes(response?.subscriptionPlan ?? workspacePlan ?? 'BASIC'),
        },
      })
      setWorkspaceIconState('saved')
      setWorkspaceIconFeedback('Ícone atualizado.')
    } catch (error) {
      setWorkspaceIconKey(previousIconKey)
      setWorkspaceIconState('error')
      setWorkspaceIconFeedback(error?.message ?? 'Nao foi possivel atualizar o ícone.')
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
          iconKey: workspaceIconKey,
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
          iconKey: normalizeWorkspaceIconKey(response?.iconKey ?? workspaceIconKey),
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

  const handleWorkspaceIconChange = (value) => {
    const previousIconKey = workspaceIconKey
    const normalizedIconKey = normalizeWorkspaceIconKey(value)
    setWorkspaceIconKey(normalizedIconKey)
    setIsWorkspaceIconPickerOpen(false)
    persistWorkspaceIcon(normalizedIconKey, previousIconKey)
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
      const redirectTo = toRouteString(modalBackgroundLocation)
      const body = redirectTo
        ? { client: 'web', redirectTo }
        : { client: 'web' }
      const response = await apiRequest('/api/settings/integrations/gmail/start', {
        method: 'POST',
        token: accessToken,
        body,
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

  const handleConnectGitHub = async () => {
    if (!backendEnabled || !accessToken) {
      setGitHubFeedbackState('error')
      setGitHubFeedback('Entre com uma conta real para conectar o GitHub.')
      return
    }

    setGitHubActionState('saving')
    setGitHubFeedbackState('saving')
    setGitHubFeedback('Abrindo autorização do GitHub...')

    try {
      const redirectTo = toRouteString(modalBackgroundLocation)
      const response = await apiRequest('/api/settings/integrations/github/start', {
        method: 'POST',
        token: accessToken,
        body: redirectTo ? { client: 'web', redirectTo } : { client: 'web' },
      })
      window.location.assign(response.authorizationUrl)
    } catch (error) {
      setGitHubActionState('error')
      setGitHubFeedbackState('error')
      setGitHubFeedback(error?.message ?? 'Não foi possível iniciar a conexão GitHub.')
    }
  }

  const handleDisconnectGitHub = async () => {
    if (!backendEnabled || !accessToken) return
    setGitHubActionState('saving')
    setGitHubFeedbackState('saving')
    setGitHubFeedback('Desconectando GitHub...')

    try {
      const response = await apiRequest('/api/settings/integrations/github', {
        method: 'DELETE',
        token: accessToken,
      })
      setGitHubIntegration(normalizeGitHubIntegration(response?.github))
      setGitHubActionState('idle')
      setGitHubFeedbackState('saved')
      setGitHubFeedback('GitHub desconectado. Os vínculos existentes foram preservados.')
    } catch (error) {
      setGitHubActionState('error')
      setGitHubFeedbackState('error')
      setGitHubFeedback(error?.message ?? 'Não foi possível desconectar o GitHub.')
    }
  }

  const handleOpenPasswordFromSecurity = () => {
    setActiveSection('account')
    setShowPassForm(true)
    setPasswordFeedback('')
    setPasswordSaveState('idle')
    const params = new URLSearchParams(location.search)
    params.set('section', 'account')
    navigate(`${location.pathname}?${params.toString()}`, {
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
      logout({
        redirectTo: ROUTES.login,
        replace: true,
      })
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

  /* ── Section: Conta ── */
  const renderAccount = () => (
    <SettingsAccountSection
      fullName={fullName}
      currentUserEmail={currentUser?.email}
      userInitials={userInitials}
      accountAvatarPreview={accountAvatarPreview}
      accountAvatarUrl={accountAvatarUrl}
      accountAvatarState={accountAvatarState}
      accountAvatarFeedback={accountAvatarFeedback}
      accountSaveState={accountSaveState}
      accountFeedback={accountFeedback}
      accountSaved={accountSaved}
      showPassForm={showPassForm}
      curPass={curPass}
      newPass={newPass}
      confirmPass={confirmPass}
      showCurPass={showCurPass}
      showNewPass={showNewPass}
      passwordSaveState={passwordSaveState}
      passwordFeedback={passwordFeedback}
      canSetupPasswordWithoutCurrent={canSetupPasswordWithoutCurrent}
      passwordActionLabel={passwordActionLabel}
      passwordHint={passwordHint}
      accountAvatarInputRef={accountAvatarInputRef}
      onFullNameChange={(event) => {
        setFullName(event.target.value)
        if (accountSaveState !== 'idle') {
          setAccountSaveState('idle')
          setAccountFeedback('')
        }
      }}
      onSaveAccount={handleSaveAccount}
      onAvatarSelected={handleAccountAvatarSelected}
      onRemoveAvatar={handleRemoveAccountAvatar}
      onOpenPasswordForm={() => {
        setShowPassForm(true)
        setPasswordFeedback('')
        setPasswordSaveState('idle')
      }}
      onCurPassChange={(event) => setCurPass(event.target.value)}
      onNewPassChange={(event) => setNewPass(event.target.value)}
      onConfirmPassChange={(event) => setConfirmPass(event.target.value)}
      onToggleShowCurPass={() => setShowCurPass((value) => !value)}
      onToggleShowNewPass={() => setShowNewPass((value) => !value)}
      onSavePassword={handleSavePassword}
      onCancelPassword={() => {
        setShowPassForm(false)
        setCurPass('')
        setNewPass('')
        setConfirmPass('')
        setPasswordFeedback('')
        setPasswordSaveState('idle')
      }}
    />
  )

  /* ── Section: Preferências Gerais ── */
  const renderGeneral = () => (
    <>
      <SettingsSectionGroup title="Configurações regionais">
        <SettingsField label="Idioma" htmlFor="lang">
          <select id="lang" className={styles.select} value={language} onChange={e => handleGeneralFieldChange('language', e.target.value)}>
            <option value="pt-BR">Português (Brasil)</option>
            <option value="en-US">English (US)</option>
            <option value="es-ES">Español</option>
          </select>
        </SettingsField>
        <SettingsField label="Fuso horário" htmlFor="tz">
          <select id="tz" className={styles.select} value={timezone} onChange={e => handleGeneralFieldChange('timezone', e.target.value)}>
            <option value="America/Sao_Paulo">América/São Paulo (GMT-3)</option>
            <option value="America/New_York">América/Nova York (GMT-5)</option>
            <option value="Europe/London">Europa/Londres (GMT+0)</option>
            <option value="Europe/Paris">Europa/Paris (GMT+1)</option>
            <option value="Asia/Tokyo">Ásia/Tóquio (GMT+9)</option>
          </select>
        </SettingsField>
        <SettingsField label="Formato de data" htmlFor="datefmt">
          <select id="datefmt" className={styles.select} value={dateFormat} onChange={e => handleGeneralFieldChange('dateFormat', e.target.value)}>
            <option value="dd/MM/yyyy">DD/MM/AAAA — 31/12/2024</option>
            <option value="MM/dd/yyyy">MM/DD/AAAA — 12/31/2024</option>
            <option value="yyyy-MM-dd">AAAA-MM-DD — 2024-12-31</option>
          </select>
        </SettingsField>
        <SettingsField label="Formato de hora">
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
        </SettingsField>
      </SettingsSectionGroup>

      <SettingsSectionGroup title="Experiência da aplicação">
        <SettingsField
          label="Confirmar ações destrutivas"
          hint="Solicita confirmação antes de excluir itens importantes."
          inlineControl
        >
          <Toggle checked={confirmDestructiveActions} onChange={(value) => handleLocalGeneralFieldChange('confirmDestructiveActions', value)} />
        </SettingsField>
        <SettingsField
          label="Abrir no último contexto usado"
          hint="O app lembrará onde você estava ao sair."
          inlineControl
        >
          <Toggle checked={openLastCtx} onChange={(value) => handleLocalGeneralFieldChange('openLastCtx', value)} />
        </SettingsField>
        <SettingsField
          label="Liquid-glass"
          hint="Preferência salva para o futuro efeito de vidro líquido no KanbanBoard."
          inlineControl
        >
          <Toggle checked={liquidGlass} onChange={(value) => handleLocalGeneralFieldChange('liquidGlass', value)} />
        </SettingsField>
        <SettingsField label="Cor padrão" hint="Define o acento visual usado nos checks, checklist e atalhos do Kanban.">
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
                        <span className={styles.colorSwatchDotDefaultIcon}>
                          <UndefinedIcon />
                        </span>
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
        </SettingsField>
      </SettingsSectionGroup>

      <SettingsSectionGroup title="Aparência">
        <SettingsField label="Tema visual" hint="Define como o app se adapta ao modo claro/escuro.">
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
        </SettingsField>
      </SettingsSectionGroup>

      <div className={styles.rowActions}>
        <SettingsAutoSaveStatus state={generalSaveState} errorMessage={generalError} />
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
    const selectedWorkspaceIcon = getWorkspaceIconOption(workspaceIconKey)

    return (
      <>
      <SettingsSectionGroup title="Identidade do workspace">
        <div className={styles.wsIdentityRow}>
          <div className={styles.wsIdentityPickerRow}>
            <div className={styles.wsAvatarBox}>
              <WorkspaceIconGlyph iconKey={workspaceIconKey} className={styles.wsAvatarIcon} />
            </div>
            <div ref={workspaceIconPickerRef} className={styles.workspaceIconControl}>
              <button
                type="button"
                className={`${styles.workspaceIconTrigger} ${isWorkspaceIconPickerOpen ? styles.workspaceIconTriggerActive : ''}`}
                onClick={() => setIsWorkspaceIconPickerOpen((value) => !value)}
                aria-haspopup="dialog"
                aria-expanded={isWorkspaceIconPickerOpen}
                aria-label={`Selecionar ícone do workspace. Atual: ${selectedWorkspaceIcon.label}`}
                title={`Ícone atual: ${selectedWorkspaceIcon.label}`}
                disabled={workspaceIconState === 'saving'}
              >
                <span className={styles.workspaceIconTriggerPreview}>
                  <WorkspaceIconGlyph iconKey={workspaceIconKey} className={styles.workspaceIconTriggerGlyph} />
                </span>
                <span className={styles.workspaceIconTriggerText}>Escolher ícone</span>
                <span className={styles.workspaceIconTriggerChevron}><ChevronIcon /></span>
              </button>

              {isWorkspaceIconPickerOpen ? (
                <div className={styles.workspaceIconPopover} role="dialog" aria-label="Selecionar ícone do workspace">
                  <div className={styles.workspaceIconGrid}>
                    {WORKSPACE_ICON_OPTIONS.map((option) => {
                      const isSelected = workspaceIconKey === option.key

                      return (
                        <button
                          key={option.key}
                          type="button"
                          className={`${styles.workspaceIconOption} ${isSelected ? styles.workspaceIconOptionActive : ''}`}
                          onClick={() => handleWorkspaceIconChange(option.key)}
                          aria-pressed={isSelected}
                          aria-label={`Usar ícone ${option.label}`}
                          title={option.label}
                        >
                          <WorkspaceIconGlyph iconKey={option.key} className={styles.workspaceIconOptionGlyph} />
                        </button>
                      )
                    })}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
          <div className={styles.wsIdentityMeta}>
            <p className={styles.wsIdentityLabel}>Ícone do workspace</p>
            <p className={styles.wsIdentityHint}>Escolha um ícone para identificar o workspace em toda a navegação.</p>
            <SettingsAutoSaveStatus state={workspaceIconState} errorMessage={workspaceIconFeedback} successMessage={workspaceIconFeedback} />
          </div>
        </div>

        <SettingsField label="Nome do workspace" htmlFor="ws-name">
          <input
            id="ws-name"
            type="text"
            className={styles.input}
            value={wsName}
            onChange={e => handleWorkspaceNameChange(e.target.value)}
          />
        </SettingsField>

        <div className={styles.settingsDisclosure}>
          <button
            type="button"
            className={styles.settingsDisclosureTrigger}
            aria-expanded={isWorkspaceAssistantPanelOpen}
            aria-controls="workspace-assistant-settings"
            onClick={() => setIsWorkspaceAssistantPanelOpen((value) => !value)}
          >
            <span className={styles.settingsDisclosureCopy}>
              <span className={styles.settingsDisclosureLabel}>Painel do assistente</span>
              <span className={styles.settingsDisclosureHint}>Configura a exibição e os efeitos visuais do painel do assistente no workspace.</span>
            </span>
            <span
              className={`${styles.settingsDisclosureChevron} ${isWorkspaceAssistantPanelOpen ? styles.settingsDisclosureChevronOpen : ''}`}
              aria-hidden="true"
            >
              <ChevronIcon />
            </span>
          </button>

          <div
            className={`${styles.settingsDisclosurePanelShell} ${isWorkspaceAssistantPanelOpen ? styles.settingsDisclosurePanelShellOpen : ''}`}
          >
            <div
              id="workspace-assistant-settings"
              className={styles.settingsDisclosurePanel}
              aria-hidden={!isWorkspaceAssistantPanelOpen}
            >
              <SettingsField
                label="Exibir painel do assistente"
                hint="Mostra o painel do assistente na página do workspace."
                inlineControl
              >
                <span className={styles.settingsPlaceholderBadge}>Em breve</span>
              </SettingsField>

              <SettingsField
                label="Efeito aurora"
                hint="Placeholder visual para uma ambientação expandida do painel. Em breve."
                inlineControl
              >
                <span className={styles.settingsPlaceholderBadge}>Em breve</span>
              </SettingsField>
            </div>
          </div>
        </div>

        <div className={styles.rowActions}>
          <SettingsAutoSaveStatus state={workspaceSaveState} errorMessage={workspaceError} />
        </div>
      </SettingsSectionGroup>

      <SettingsSectionGroup title="Uso e plano">
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
            <span className={styles.planActiveBadge}>{getWorkspacePlanLabel(workspacePlan)}</span>
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
                    <span className={styles.planOptionName}>{getWorkspacePlanLabel(planOption.id)}</span>
                    <span className={styles.planOptionQuota}>{formatBytes(planOption.quotaBytes)} de armazenamento</span>
                  </span>
                </button>
              )
            })}
          </div>
          <SettingsAutoSaveStatus
            state={workspacePlanSaveState}
            errorMessage={workspacePlanError}
            successMessage="Plano atualizado."
          />
        </div>
      </SettingsSectionGroup>
      </>
    )
  }

  /* ── Section: Integrações ── */
  const renderIntegrations = () => {
    const calendarIntegrations = [
      { id: 'google-calendar', name: 'Google Calendar', Icon: GoogleCalendarIcon, color: '#1a73e8', status: 'Em breve' },
    ]
    const gmailBusy = gmailActionState === 'saving'
    const githubBusy = githubActionState === 'saving'
    const gmailStatusText = !backendEnabled
      ? 'Disponível ao entrar com uma conta real'
      : gmailBusy
        ? 'Conectando...'
        : gmailIntegration.connected
          ? `Conectado · ${gmailIntegration.email}`
          : gmailIntegration.lastError
            ? 'Falha na conexão · tente novamente'
            : 'Não conectado'
    const githubStatusText = !backendEnabled
      ? 'Disponível ao entrar com uma conta real'
      : githubBusy
        ? 'Conectando...'
        : githubIntegration.connected
          ? `Conectado · @${githubIntegration.login}`
          : githubIntegration.lastError
            ? 'Falha na conexão · tente novamente'
            : 'GitHub não conectado'

    return (
      <>
        <SettingsSectionGroup title="Calendários">
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
        </SettingsSectionGroup>

        <SettingsSectionGroup title="Desenvolvimento">
          <div className={styles.integrationCard}>
            <div className={styles.integrationIconBox} style={{ color: 'var(--text-1)' }}>
              <SiGithub size={22} aria-hidden="true" />
            </div>
            <div className={styles.integrationMeta}>
              <p className={styles.integrationName}>GitHub</p>
              <p className={styles.integrationStatus}>{githubStatusText}</p>
              {githubIntegration.connectedAt?.text ? (
                <p className={styles.integrationStatus}>Conectado em {githubIntegration.connectedAt.text}</p>
              ) : null}
              <p className={styles.integrationStatus}>Repositórios privados exigem o escopo OAuth amplo “repo”.</p>
            </div>
            <div className={styles.integrationActions}>
              {githubIntegration.connected ? (
                <button
                  type="button"
                  className={styles.btnSecondary}
                  onClick={handleConnectGitHub}
                  disabled={!backendEnabled || githubBusy || integrationsLoadState === 'saving'}
                >
                  Reconectar
                </button>
              ) : null}
              <button
                type="button"
                className={githubIntegration.connected ? styles.btnGhost : styles.btnSecondary}
                onClick={githubIntegration.connected ? handleDisconnectGitHub : handleConnectGitHub}
                disabled={!backendEnabled || githubBusy || integrationsLoadState === 'saving'}
              >
                {githubBusy ? 'Aguarde' : githubIntegration.connected ? 'Desconectar' : 'Conectar'}
              </button>
            </div>
          </div>
          <div className={styles.rowActions}>
            <SettingsAutoSaveStatus
              state={githubFeedbackState}
              errorMessage={githubFeedback}
              successMessage={githubFeedback}
            />
          </div>
        </SettingsSectionGroup>

        <SettingsSectionGroup title="E-mail e captura">
          <div className={styles.integrationCard}>
            <div className={styles.integrationIconBox} style={{ color: '#ea4335' }}>
              <GmailIcon />
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
            <SettingsAutoSaveStatus state={gmailFeedbackState} errorMessage={gmailFeedback} successMessage={gmailFeedback} />
          </div>
        </SettingsSectionGroup>
      </>
    )
  }

  /* ── Section: Notificações ── */
  const renderNotifications = () => (
    <>
      <SettingsSectionGroup title="Eventos e prazos">
        <SettingsField
          label="Lembretes de eventos"
          hint="Alertas antes de eventos do calendário."
          inlineControl
        >
          <Toggle checked={eventReminders} onChange={(value) => handleNotificationToggle('eventReminders', value)} />
        </SettingsField>
        <SettingsField
          label="Alertas de prazo de tarefas"
          hint="Notificação quando tarefas se aproximam do vencimento."
          inlineControl
        >
          <Toggle checked={deadlineAlerts} onChange={(value) => handleNotificationToggle('deadlineAlerts', value)} />
        </SettingsField>
      </SettingsSectionGroup>

      <SettingsSectionGroup title="Comunicação">
        <SettingsField
          label="Notificações por e-mail"
          hint="Receba atualizações importantes por e-mail."
          inlineControl
        >
          <Toggle checked={emailNotifs} onChange={(value) => handleNotificationToggle('emailNotifs', value)} />
        </SettingsField>
        <SettingsField
          label="Silenciar categorias"
          hint="Escolha quais tipos de atividade não geram notificação."
        >
          <div className={styles.muteGroup}>
            {['Comentários', 'Menções', 'Convites', 'Atualizações de plano'].map(cat => (
              <span key={cat} className={styles.muteChip}>{cat}</span>
            ))}
          </div>
        </SettingsField>
      </SettingsSectionGroup>

      <SettingsSectionGroup title="Resumos">
        <SettingsField
          label="Resumo diário"
          hint="Disponível em breve."
          inlineControl
        >
          <Toggle checked={dailySummary} onChange={setDailySummary} disabled />
        </SettingsField>
        <SettingsField
          label="Resumo semanal"
          hint="Disponível em breve."
          inlineControl
        >
          <Toggle checked={weeklySummary} onChange={setWeeklySummary} disabled />
        </SettingsField>
      </SettingsSectionGroup>

      <div className={styles.rowActions}>
        <SettingsAutoSaveStatus state={notificationsSaveState} errorMessage={notificationsError} />
      </div>
    </>
  )

  /* ── Section: Privacidade e Segurança ── */
  const renderSecurity = () => (
    <>
      <SettingsSectionGroup title="Segurança da conta">
        <SettingsField
          label="Senha"
          hint="Use uma senha forte com letras, numeros e simbolos."
        >
          <button type="button" className={styles.btnSecondary} onClick={handleOpenPasswordFromSecurity}>
            {localPasswordEnabled ? 'Alterar senha' : 'Criar senha'}
          </button>
        </SettingsField>
        <SettingsField
          label="Autenticação em dois fatores"
          hint="Adicione uma camada extra de proteção à sua conta."
        >
          <div className={styles.futurePill}>
            <span className={styles.futureBadge}>Em breve</span>
            <span className={styles.futureHint}>Disponivel em uma atualizacao futura.</span>
          </div>
        </SettingsField>
        <SettingsField
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
                <SettingsAutoSaveStatus state={sessionsLoadState === 'error' ? 'error' : 'saved'} errorMessage={sessionsFeedback} successMessage={sessionsFeedback} />
              )}
            </div>
          )}
        </SettingsField>
      </SettingsSectionGroup>

      <SettingsSectionGroup title="Dados e privacidade">
        <SettingsField
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
              <SettingsAutoSaveStatus state={exportState} errorMessage={exportFeedback} successMessage={exportFeedback} />
            )}
          </div>
        </SettingsField>
        <SettingsField
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
        </SettingsField>
      </SettingsSectionGroup>

      <SettingsSectionGroup title="Zona de perigo">
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
      </SettingsSectionGroup>
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

  const settingsHeader = modal ? (
    <PlanPageHeader
      title="Configurações"
      tone="solid"
      titleSize="medium"
      actions={(
        <button
          type="button"
          className={styles.settingsModalCloseButton}
          onClick={closeModal}
          aria-label="Fechar configurações"
        >
          <CloseIcon />
        </button>
      )}
    />
  ) : !isMobile ? (
    <PlanPageHeader
      title="Configurações"
      tone="solid"
      titleSize="medium"
    />
  ) : null

  const settingsNavButtons = SECTIONS.map(({ id, label, Icon }) => (
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
      <span className={styles.settingsNavIcon}>
        <Icon size={SECTION_NAV_ICON_SIZE} strokeWidth={SECTION_NAV_ICON_STROKE} />
      </span>
      <span className={styles.settingsNavLabel}>{label}</span>
    </button>
  ))

  const settingsContent = (
    <>
      <div className={styles.settingsContentHeader}>
        <h2 className={styles.settingsContentTitle}>{activeLabel}</h2>
      </div>
      <div className={styles.settingsContentBody}>
        {renderContent()}
      </div>
    </>
  )

  const settingsLayout = (
    <div className={`${styles.settingsLayout} ${modal ? styles.settingsLayoutModal : ''}`}>
      <div className={modal ? styles.settingsNavPane : undefined}>
        {modal ? (
          <CustomScrollArea
            className={styles.settingsNavScrollArea}
            viewportTag="nav"
            viewportClassName={`${styles.settingsNav} ${styles.settingsNavModal}`}
            viewportProps={{ 'aria-label': 'Seções de configurações' }}
            enabled
            refreshKey={`nav:${activeSection}:${isMobile ? 'mobile' : 'desktop'}`}
          >
            {settingsNavButtons}
          </CustomScrollArea>
        ) : (
          <nav className={styles.settingsNav} aria-label="Seções de configurações">
            {settingsNavButtons}
          </nav>
        )}
      </div>

      <div className={modal ? styles.settingsContentPane : undefined}>
        {modal ? (
          <CustomScrollArea
            className={styles.settingsContentScrollArea}
            viewportTag="main"
            viewportClassName={`${styles.settingsContent} ${styles.settingsContentModal}`}
            enabled
            refreshKey={`content:${activeSection}:${deleteDialogOpen ? 'dialog-open' : 'dialog-closed'}:${isMobile ? 'mobile' : 'desktop'}`}
          >
            {settingsContent}
          </CustomScrollArea>
        ) : (
          <main className={styles.settingsContent}>
            {settingsContent}
          </main>
        )}
      </div>
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
            style={settingsThemeStyle}
            onClick={(event) => event.stopPropagation()}
          >
            <div className={styles.settingsModalBody}>
              {settingsHeader}
              {settingsLayout}
            </div>

            {deleteDialogOpen && (
              <DeleteAccountDialog
                currentUserEmail={currentUser?.email ?? null}
                deleteConfirmEmail={deleteConfirmEmail}
                deleteConfirmPhrase={deleteConfirmPhrase}
                deleteCurrentPassword={deleteCurrentPassword}
                deleteFeedback={deleteFeedback}
                deleteState={deleteState}
                localPasswordEnabled={localPasswordEnabled}
                onClose={closeDeleteDialog}
                onConfirm={handleDeleteAccount}
                onDeleteConfirmEmailChange={setDeleteConfirmEmail}
                onDeleteConfirmPhraseChange={setDeleteConfirmPhrase}
                onDeleteCurrentPasswordChange={setDeleteCurrentPassword}
              />
            )}

          </div>
        </div>
      </AppThemeScope>
    )
  }

  return (
    <AppThemeScope>
      <ProductAppShell
        contentClassName={styles.settingsWrapper}
      >
        <div style={settingsThemeStyle}>
          {settingsHeader}
          {settingsLayout}
        </div>

        {deleteDialogOpen && (
          <DeleteAccountDialog
            currentUserEmail={currentUser?.email ?? null}
            deleteConfirmEmail={deleteConfirmEmail}
            deleteConfirmPhrase={deleteConfirmPhrase}
            deleteCurrentPassword={deleteCurrentPassword}
            deleteFeedback={deleteFeedback}
            deleteState={deleteState}
            localPasswordEnabled={localPasswordEnabled}
            onClose={closeDeleteDialog}
            onConfirm={handleDeleteAccount}
            onDeleteConfirmEmailChange={setDeleteConfirmEmail}
            onDeleteConfirmPhraseChange={setDeleteConfirmPhrase}
            onDeleteCurrentPasswordChange={setDeleteCurrentPassword}
          />
        )}
      </ProductAppShell>
    </AppThemeScope>
  )
}
