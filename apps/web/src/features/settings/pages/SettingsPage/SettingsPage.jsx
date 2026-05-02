import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useAuth } from '../../../auth/context/AuthContext.jsx'
import {
  DEFAULT_LOCAL_PREFERENCES,
  usePreferences,
} from '../../../preferences/context/PreferencesContext.jsx'
import { apiRequest } from '../../../../shared/api/apiClient.js'
import ProductAppShell from '../../../../shared/components/ProductAppShell/ProductAppShell.jsx'
import PlanPageHeader from '../../../../shared/components/PlanPageHeader/PlanPageHeader.jsx'
import SidebarAccountMenu from '../../../../shared/components/SidebarAccountMenu/SidebarAccountMenu.jsx'
import { useWorkspaceNavigation } from '../../../../shared/hooks/useWorkspaceNavigation.js'
import AppThemeScope from '../../../preferences/components/AppThemeScope/AppThemeScope.jsx'
import styles from './SettingsPage.module.css'

/* ═══════════════════════════════════════════
   ICONS
═══════════════════════════════════════════ */
const Ic = {
  Logo:     () => <svg width="17" height="17" viewBox="0 0 20 20" fill="none"><rect x="2" y="2" width="7" height="7" rx="2" fill="currentColor"/><rect x="11" y="2" width="7" height="7" rx="2" fill="currentColor" opacity=".35"/><rect x="2" y="11" width="7" height="7" rx="2" fill="currentColor" opacity=".55"/><rect x="11" y="11" width="7" height="7" rx="2" fill="currentColor" opacity=".75"/></svg>,
  Home:     () => <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><path d="M2 6.5L8 2l6 4.5V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V6.5z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/><path d="M6 15V9h4v6" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/></svg>,
  Popover:  () => <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M4 2.5H2.5v7H9.5V8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/><path d="M5 7L9.5 2.5M7 2.5h2.5V5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  Canvas:   () => <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><rect x="1.5" y="1.5" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.3"/><rect x="8.5" y="1.5" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.3"/><rect x="1.5" y="8.5" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.3"/><rect x="8.5" y="8.5" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.3"/></svg>,
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
  Outlook:  () => <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="1.5" y="3.5" width="9" height="9" rx="1" stroke="#0078D4" strokeWidth="1.2"/><path d="M10.5 5.5l4-2v9l-4-2v-5z" stroke="#0078D4" strokeWidth="1.2" strokeLinejoin="round"/><circle cx="5.5" cy="8.5" r="1.5" fill="#0078D4"/></svg>,
  Upload:   () => <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 11V5M5.5 7.5L8 5l2.5 2.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/><path d="M3 12.5h10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>,
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
  { id: 'canvas',   Icon: Ic.Canvas   },
  { id: 'calendar', Icon: Ic.Calendar },
  { id: 'files',    Icon: Ic.Files    },
]
const NAV_LABELS = { home: 'Início', canvas: 'Canvas', calendar: 'Calendário', files: 'Arquivos' }

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

function Field({ label, hint, htmlFor, children, row = true }) {
  return (
    <div className={row ? styles.field : styles.fieldBlock}>
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

export default function SettingsPage() {
  const { currentUser, workspace, accessToken, isAuthenticated, isDemoSession, patchSession } = useAuth()
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
  const location = useLocation()
  const backendEnabled = isAuthenticated && !isDemoSession

  const [activeSection, setActiveSection] = useState('account')

  // ── Account state
  const [fullName, setFullName] = useState(currentUser?.fullName ?? '')
  const [showPassForm, setShowPassForm] = useState(false)
  const [curPass, setCurPass] = useState('')
  const [newPass, setNewPass] = useState('')
  const [confirmPass, setConfirmPass] = useState('')
  const [showCurPass, setShowCurPass] = useState(false)
  const [showNewPass, setShowNewPass] = useState(false)
  const [accountSaveState, setAccountSaveState] = useState('idle')
  const [accountFeedback, setAccountFeedback] = useState('')
  const [passwordSaveState, setPasswordSaveState] = useState('idle')
  const [passwordFeedback, setPasswordFeedback] = useState('')

  // ── General preferences state
  const [density, setDensity] = useState('normal')
  const [generalSaveState, setGeneralSaveState] = useState('idle')
  const [generalError, setGeneralError] = useState('')

  // ── Workspace state
  const [wsName, setWsName] = useState(workspace?.name ?? '')
  const [workspaceSaveState, setWorkspaceSaveState] = useState('idle')
  const [workspaceError, setWorkspaceError] = useState('')

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

  const workspaceRequestRef = useRef(0)
  const language = generalPreferences.language
  const timezone = generalPreferences.timezone
  const dateFormat = generalPreferences.dateFormat
  const timeFormat = generalPreferences.timeFormat
  const theme = generalPreferences.theme
  const homePage = localPreferences.homePage
  const openLastCtx = localPreferences.openLastCtx
  const emailNotifs = notificationPreferences.emailNotifs
  const eventReminders = notificationPreferences.eventReminders
  const deadlineAlerts = notificationPreferences.deadlineAlerts

  useEffect(() => {
    setFullName(currentUser?.fullName ?? '')
    setWsName(workspace?.name ?? '')
  }, [currentUser?.fullName, workspace?.name])

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
  }, [accessToken, backendEnabled, location.search])

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
      patchSession?.({
        workspace: {
          name: response.name,
        },
      })
      setWorkspaceSaveState('saved')
    } catch (error) {
      if (requestId !== workspaceRequestRef.current) return
      setWorkspaceError(error?.message ?? 'Nao foi possivel salvar o nome do workspace.')
      setWorkspaceSaveState('error')
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

  const handleSavePassword = async () => {
    if (!curPass.trim() || !newPass.trim() || !confirmPass.trim()) {
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
      const response = await apiRequest('/api/settings/password', {
        method: 'PATCH',
        token: accessToken,
        body: {
          currentPassword: curPass,
          newPassword: newPass,
        },
      })
      setPasswordSaveState('saved')
      setPasswordFeedback(response.message)
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
      homePage,
      openLastCtx,
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

  const handleWorkspaceNameChange = (value) => {
    setWsName(value)
    persistWorkspaceName(value)
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

  const accountSaved = normalizeSaveState(accountSaveState) === 'saved'

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
          <div className={styles.avatarCircle}>{userInitials}</div>
          <div className={styles.avatarMeta}>
            <p className={styles.avatarName}>{fullName || 'Usuário'}</p>
            <p className={styles.avatarHint}>JPG, PNG ou GIF. Máximo 2 MB.</p>
            <button type="button" className={styles.btnSecondary}>
              <Ic.Upload /> Alterar foto
            </button>
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
          hint="Altere sua senha regularmente para manter a conta protegida."
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
              Alterar senha
            </button>
          ) : (
            <div className={styles.passForm}>
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
                  Salvar nova senha
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
        <Field label="Página inicial padrão" htmlFor="homepage">
          <select id="homepage" className={styles.select} value={homePage} onChange={e => handleLocalGeneralFieldChange('homePage', e.target.value)}>
            <option value="workspace">Workspace</option>
            <option value="canvas">Canvas</option>
            <option value="calendar">Calendário</option>
            <option value="files">Arquivos</option>
          </select>
        </Field>
        <Field
          label="Abrir no último contexto usado"
          hint="O app lembrará onde você estava ao sair."
        >
          <Toggle checked={openLastCtx} onChange={(value) => handleLocalGeneralFieldChange('openLastCtx', value)} />
        </Field>
        <Field
          label="Barra lateral recolhida por padrão"
          hint="Esta preferência será removida ou substituída. Use o botão da barra lateral; o app lembrará sua última escolha."
        >
          <Toggle checked={false} onChange={() => {}} disabled />
        </Field>
        <Field label="Densidade visual" hint="Define o espaçamento geral dos elementos na interface.">
          <div className={styles.densityGroup}>
            {[
              { value: 'compact', label: 'Compacto' },
              { value: 'normal', label: 'Normal' },
              { value: 'comfortable', label: 'Confortável' },
            ].map(opt => (
              <button
                key={opt.value}
                type="button"
                className={`${styles.densityBtn} ${density === opt.value ? styles.densityBtnActive : ''}`}
                onClick={() => setDensity(opt.value)}
              >
                {opt.label}
              </button>
            ))}
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
  const renderWorkspace = () => (
    <>
      <SectionGroup title="Identidade do workspace">
        <div className={styles.wsIdentityRow}>
          <div className={styles.wsAvatarBox}>{wsInitials}</div>
          <div className={styles.wsIdentityMeta}>
            <p className={styles.wsIdentityLabel}>Logo ou iniciais do workspace</p>
            <p className={styles.wsIdentityHint}>PNG ou SVG. Recomendado: 128×128 px.</p>
            <button type="button" className={styles.btnSecondary}>Alterar avatar</button>
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

        <Field label="Tela inicial do workspace" htmlFor="ws-home">
          <select id="ws-home" className={styles.select}>
            <option value="plans">Lista de planos</option>
            <option value="workspace">Dashboard</option>
          </select>
        </Field>

        <div className={styles.rowActions}>
          <AutoSaveStatus state={workspaceSaveState} errorMessage={workspaceError} />
        </div>
      </SectionGroup>

      <SectionGroup title="Uso e plano">
        <div className={styles.storageBlock}>
          <div className={styles.storageHeader}>
            <span className={styles.storageName}>Armazenamento</span>
            <span className={styles.storageNumbers}>2,4 GB de 10 GB</span>
          </div>
          <div className={styles.storageTrack}>
            <div className={styles.storageFill} style={{ width: '24%' }} />
          </div>
          <p className={styles.storageHint}>7,6 GB disponíveis no plano atual.</p>
        </div>

        <div className={styles.planBlock}>
          <div className={styles.planBlockTop}>
            <div>
              <p className={styles.planBlockName}>Professional</p>
              <p className={styles.planBlockRenewal}>Renova em 15 de março de 2025</p>
            </div>
            <span className={styles.planActiveBadge}>Ativo</span>
          </div>
          <div className={styles.planBlockActions}>
            <button type="button" className={styles.btnSecondary}>Gerenciar armazenamento</button>
            <button type="button" className={styles.btnSecondary}>Ver plano e faturamento</button>
          </div>
        </div>
      </SectionGroup>
    </>
  )

  /* ── Section: Integrações ── */
  const renderIntegrations = () => {
    const calendarIntegrations = [
      { id: 'google-calendar', name: 'Google Calendar', Icon: Ic.Google, color: '#1a73e8', status: 'Em breve' },
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
              <Ic.Google />
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
        >
          <Toggle checked={eventReminders} onChange={(value) => handleNotificationToggle('eventReminders', value)} />
        </Field>
        <Field
          label="Alertas de prazo de tarefas"
          hint="Notificação quando tarefas se aproximam do vencimento."
        >
          <Toggle checked={deadlineAlerts} onChange={(value) => handleNotificationToggle('deadlineAlerts', value)} />
        </Field>
      </SectionGroup>

      <SectionGroup title="Comunicação">
        <Field
          label="Notificações por e-mail"
          hint="Receba atualizações importantes por e-mail."
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
        >
          <Toggle checked={dailySummary} onChange={setDailySummary} disabled />
        </Field>
        <Field
          label="Resumo semanal"
          hint="Disponível em breve."
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
          hint="Use uma senha forte com letras, números e símbolos."
        >
          <button type="button" className={styles.btnSecondary}>Alterar senha</button>
        </Field>
        <Field
          label="Autenticação em dois fatores"
          hint="Adicione uma camada extra de proteção à sua conta."
        >
          <div className={styles.futurePill}>
            <span className={styles.futureBadge}>Em breve</span>
            <span className={styles.futureHint}>Disponível em uma atualização futura.</span>
          </div>
        </Field>
        <Field
          label="Sessões ativas"
          hint="Visualize e encerre sessões abertas em outros dispositivos."
        >
          <div className={styles.futurePill}>
            <span className={styles.futureBadge}>Em breve</span>
            <span className={styles.futureHint}>Disponível em uma atualização futura.</span>
          </div>
        </Field>
      </SectionGroup>

      <SectionGroup title="Dados e privacidade">
        <Field
          label="Exportar meus dados"
          hint="Baixe uma cópia completa dos seus dados do Plan Things."
        >
          <button type="button" className={styles.btnSecondary}>Exportar dados</button>
        </Field>
        <Field
          label="Encerrar outras sessões"
          hint="Invalida todos os tokens de acesso em outros dispositivos."
        >
          <button type="button" className={styles.btnSecondary}>Encerrar sessões</button>
        </Field>
      </SectionGroup>

      <SectionGroup title="Zona de perigo">
        <div className={styles.dangerZone}>
          <div className={styles.dangerItem}>
            <div>
              <p className={styles.dangerTitle}>Excluir conta</p>
              <p className={styles.dangerHint}>
                Esta ação é permanente e irreversível. Todos os seus dados,
                planos e arquivos serão removidos definitivamente.
              </p>
            </div>
            <button type="button" className={styles.btnDanger}>Excluir conta</button>
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

  const renderSidebarBottomContent = ({ collapsed }) => (
    <SidebarAccountMenu styles={styles} collapsed={collapsed} />
  )

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
      >
        <PlanPageHeader
          title="Configurações"
          breadcrumbCurrent="Configurações"
          breadcrumbRootLabel="Workspace"
          tone="solid"
          titleSize="medium"
        />

        <div className={styles.settingsLayout}>
          {/* Settings nav */}
          <nav className={styles.settingsNav} aria-label="Seções de configurações">
            {SECTIONS.map(({ id, label, Icon }) => (
              <button
                key={id}
                type="button"
                className={`${styles.settingsNavItem} ${activeSection === id ? styles.settingsNavItemActive : ''}`}
                onClick={() => setActiveSection(id)}
                aria-current={activeSection === id ? 'page' : undefined}
              >
                <span className={styles.settingsNavIcon}><Icon /></span>
                <span className={styles.settingsNavLabel}>{label}</span>
              </button>
            ))}
          </nav>

          {/* Settings content */}
          <main className={styles.settingsContent}>
            <div className={styles.settingsContentHeader}>
              <h2 className={styles.settingsContentTitle}>{activeLabel}</h2>
            </div>
            <div className={styles.settingsContentBody}>
              {renderContent()}
            </div>
          </main>
        </div>
      </ProductAppShell>
    </AppThemeScope>
  )
}
