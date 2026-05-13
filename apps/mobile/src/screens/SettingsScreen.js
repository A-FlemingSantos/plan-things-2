import { useCallback, useEffect, useMemo, useState } from 'react'
import { Linking, Platform, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native'
import * as FileSystem from 'expo-file-system'
import * as Sharing from 'expo-sharing'
import {
  AlarmClock,
  AtSign,
  BellRing,
  Building2,
  CalendarClock,
  ChevronRight,
  Download,
  KeyRound,
  Languages,
  Laptop,
  Link,
  LogOut,
  Mail,
  Palette,
  Shield,
  Smartphone,
  Trash2,
  UserRound,
  Users,
} from 'lucide-react-native'
import AuthenticatedAvatar from '../components/AuthenticatedAvatar'
import BottomSheet from '../components/BottomSheet'
import WorkspaceIconBadge from '../components/WorkspaceIconBadge'
import { useAuth } from '../providers/AuthProvider'
import { isMobileSettingsReturnUrl } from '../services/mobileLinking'
import { resolveMobileCallbackClient } from '../services/mobileClient'
import { mobileApiRequest, mobileApiUrl } from '../services/api'
import { buildPasswordRequest, getPasswordFlowCopy, resolvePasswordFlow } from './settingsPasswordFlow'
import { theme } from '../theme/tokens'
import { useMobileTheme, useThemedStyles } from '../theme/ThemeProvider'

const DELETE_CONFIRMATION_PHRASE = 'EXCLUIR MINHA CONTA'

function sanitizeFilename(name = 'arquivo') {
  return String(name).replace(/[\\/:*?"<>|]+/g, '-').trim() || 'arquivo'
}

function triggerWebDownload(blob, filename) {
  const url = window.URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  window.URL.revokeObjectURL(url)
}

function SectionCard({ title, hint, children }) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{title}</Text>
        {hint ? <Text style={styles.cardHint}>{hint}</Text> : null}
      </View>
      <View style={styles.cardBody}>{children}</View>
    </View>
  )
}

function Row({ icon: Icon, label, hint, value, onPress, right, danger = false, disabled = false }) {
  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      disabled={disabled || !onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityState={{ disabled: disabled || !onPress }}
      style={({ pressed }) => [
        styles.row,
        danger && styles.rowDanger,
        (disabled || !onPress) && styles.rowDisabled,
        pressed && onPress ? styles.rowPressed : null,
      ]}
    >
      {Icon ? (
        <View style={[styles.rowIcon, danger && styles.rowIconDanger]}>
          <Icon size={16} color={danger ? theme.colors.red : theme.colors.text2} strokeWidth={1.9} />
        </View>
      ) : null}

      <View style={styles.rowBody}>
        <View style={styles.rowTop}>
          <Text style={[styles.rowLabel, danger && styles.rowLabelDanger]} numberOfLines={1}>
            {label}
          </Text>
          {value ? (
            <Text style={[styles.rowValue, danger && styles.rowValueDanger]} numberOfLines={1}>
              {value}
            </Text>
          ) : null}
        </View>
        {hint ? <Text style={styles.rowHint}>{hint}</Text> : null}
      </View>

      {right ? <View style={styles.rowRight}>{right}</View> : onPress ? (
        <ChevronRight size={16} color={theme.colors.text3} strokeWidth={1.8} />
      ) : null}
    </Pressable>
  )
}

function Pill({ label, tone = 'neutral' }) {
  const toneStyle = tone === 'danger' ? styles.pillDanger : tone === 'accent' ? styles.pillAccent : styles.pillNeutral
  const toneTextStyle = tone === 'danger' ? styles.pillTextDanger : tone === 'accent' ? styles.pillTextAccent : styles.pillTextNeutral
  return (
    <View style={[styles.pill, toneStyle]}>
      <Text style={[styles.pillText, toneTextStyle]} numberOfLines={1}>{label}</Text>
    </View>
  )
}

function InlineButton({ label, onPress, tone = 'secondary', disabled = false }) {
  const buttonStyle = tone === 'danger' ? styles.btnDanger : tone === 'primary' ? styles.btnPrimary : styles.btnSecondary
  const textStyle = tone === 'danger' ? styles.btnDangerText : tone === 'primary' ? styles.btnPrimaryText : styles.btnSecondaryText
  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      style={({ pressed }) => [
        styles.btnBase,
        buttonStyle,
        disabled && styles.btnDisabled,
        pressed && !disabled ? styles.btnPressed : null,
      ]}
    >
      <Text style={textStyle} numberOfLines={1}>{label}</Text>
    </Pressable>
  )
}

const themeOptions = [
  { id: 'system', label: 'Sistema', hint: 'Segue a aparência do dispositivo.' },
  { id: 'light', label: 'Claro', hint: 'Fundo claro e controles escuros.' },
  { id: 'dark', label: 'Escuro', hint: 'Preto como base e neutros em branco.' },
]

const themeLabels = {
  system: 'Sistema',
  light: 'Claro',
  dark: 'Escuro',
}

export default function SettingsScreen() {
  styles = useThemedStyles(createStyles)
  const { session, accessToken, logout, patchSession } = useAuth()
  const { effectiveTheme, setThemePreference, themePreference } = useMobileTheme()
  const [emailNotifsEnabled, setEmailNotifsEnabled] = useState(true)
  const [eventRemindersEnabled, setEventRemindersEnabled] = useState(true)
  const [deadlineAlertsEnabled, setDeadlineAlertsEnabled] = useState(true)
  const [settingsError, setSettingsError] = useState(null)
  const [notificationsSaving, setNotificationsSaving] = useState(false)
  const [activeSheet, setActiveSheet] = useState(null)
  const [settingsSnapshot, setSettingsSnapshot] = useState(null)
  const [fullNameValue, setFullNameValue] = useState('')
  const [workspaceNameValue, setWorkspaceNameValue] = useState('')
  const [currentPasswordValue, setCurrentPasswordValue] = useState('')
  const [newPasswordValue, setNewPasswordValue] = useState('')
  const [sheetBusy, setSheetBusy] = useState(false)
  const [sheetError, setSheetError] = useState(null)
  const [sheetSuccess, setSheetSuccess] = useState(null)
  const [activeSessions, setActiveSessions] = useState([])
  const [sessionsLoading, setSessionsLoading] = useState(false)
  const [sessionActionId, setSessionActionId] = useState(null)
  const [deleteConfirmEmail, setDeleteConfirmEmail] = useState('')
  const [deleteConfirmPhrase, setDeleteConfirmPhrase] = useState('')
  const [deletePasswordValue, setDeletePasswordValue] = useState('')
  const gmail = settingsSnapshot?.integrations?.gmail
  const { localPasswordEnabled, externalIdentityLinked, canSetupPasswordWithoutCurrent } = resolvePasswordFlow({
    settingsAccount: settingsSnapshot?.account,
    sessionUser: session?.user,
  })
  const passwordFlowCopy = getPasswordFlowCopy(canSetupPasswordWithoutCurrent)

  const request = useCallback((path, options = {}) => mobileApiRequest(path, {
    ...options,
    token: accessToken,
  }), [accessToken])

  const loadSettings = useCallback(async () => {
    if (!accessToken) return
    const snapshot = await request('/api/settings')
    setSettingsSnapshot(snapshot)
    if (snapshot?.notifications) {
      setEmailNotifsEnabled(Boolean(snapshot.notifications.emailNotifs))
      setEventRemindersEnabled(Boolean(snapshot.notifications.eventReminders))
      setDeadlineAlertsEnabled(Boolean(snapshot.notifications.deadlineAlerts))
    }
    if (snapshot?.account) {
      setFullNameValue(snapshot.account.fullName ?? session?.user?.fullName ?? '')
      void patchSession({ user: snapshot.account })
    }
    if (snapshot?.preferences?.theme) {
      setThemePreference(snapshot.preferences.theme)
    }
    setWorkspaceNameValue(session?.workspace?.name ?? '')
  }, [accessToken, patchSession, request, session?.user?.fullName, session?.workspace?.name, setThemePreference])

  useEffect(() => {
    loadSettings()
  }, [loadSettings])

  useEffect(() => {
    const subscription = Linking.addEventListener('url', ({ url }) => {
      if (isMobileSettingsReturnUrl(url)) {
        void loadSettings()
      }
    })
    return () => subscription.remove()
  }, [loadSettings])

  const persistNotifications = async (next) => {
    setNotificationsSaving(true)
    setSettingsError(null)
    try {
      const notifications = await request('/api/settings/notifications', {
        method: 'PATCH',
        body: next,
      })
      setEmailNotifsEnabled(Boolean(notifications.emailNotifs))
      setEventRemindersEnabled(Boolean(notifications.eventReminders))
      setDeadlineAlertsEnabled(Boolean(notifications.deadlineAlerts))
      setSettingsSnapshot((current) => ({
        ...current,
        notifications,
      }))
    } catch (error) {
      setSettingsError(error?.message ?? 'Nao foi possivel salvar as notificacoes.')
      await loadSettings()
    } finally {
      setNotificationsSaving(false)
    }
  }

  const updateNotification = (field, value) => {
    const current = {
      emailNotifs: emailNotifsEnabled,
      eventReminders: eventRemindersEnabled,
      deadlineAlerts: deadlineAlertsEnabled,
    }
    void persistNotifications({ ...current, [field]: value })
  }

  const connectGmail = async () => {
    const response = await request('/api/settings/integrations/gmail/start', {
      method: 'POST',
      body: { client: resolveMobileCallbackClient(Platform.OS) },
    })
    if (response?.authorizationUrl) {
      await Linking.openURL(response.authorizationUrl)
    }
  }

  const disconnectGmail = async () => {
    await request('/api/settings/integrations/gmail', { method: 'DELETE' })
    await loadSettings()
  }

  const saveAccount = async () => {
    const account = await request('/api/settings/account', {
      method: 'PATCH',
      body: { fullName: fullNameValue.trim() },
    })
    await patchSession({ user: account })
    await loadSettings()
    closeSheet()
  }

  const savePreferences = async (patch = {}) => {
    const preferences = settingsSnapshot?.preferences ?? {}
    const previousTheme = themePreference
    const nextTheme = patch.theme ?? preferences.theme ?? 'system'
    if (patch.theme) setThemePreference(nextTheme)

    try {
      const nextPreferences = await request('/api/settings/preferences', {
        method: 'PATCH',
        body: {
          locale: patch.locale ?? preferences.locale ?? session?.user?.locale ?? 'pt-BR',
          timeZone: patch.timeZone ?? preferences.timeZone ?? session?.user?.timeZone ?? 'America/Sao_Paulo',
          theme: nextTheme,
          dateFormat: patch.dateFormat ?? preferences.dateFormat ?? 'dd/MM/yyyy',
          timeFormat: patch.timeFormat ?? preferences.timeFormat ?? '24h',
        },
      })
      if (nextPreferences?.theme) setThemePreference(nextPreferences.theme)
      setSettingsSnapshot((current) => ({
        ...current,
        preferences: nextPreferences,
      }))
      await loadSettings()
      closeSheet()
    } catch (error) {
      if (patch.theme) setThemePreference(previousTheme)
      setSettingsError(error?.message ?? 'Nao foi possivel salvar as preferencias.')
      await loadSettings()
    }
  }

  const saveWorkspace = async () => {
    const workspace = await request('/api/workspace', {
      method: 'PATCH',
      body: { name: workspaceNameValue.trim() },
    })
    await patchSession({ workspace })
    await loadSettings()
    closeSheet()
  }

  const savePassword = async () => {
    setSheetBusy(true)
    setSheetError(null)

    try {
      const passwordRequest = buildPasswordRequest({
        canSetupPasswordWithoutCurrent,
        currentPassword: currentPasswordValue,
        newPassword: newPasswordValue,
      })

      await request(passwordRequest.path, passwordRequest.options)
      setCurrentPasswordValue('')
      setNewPasswordValue('')
      const updatedPasswordState = {
        localPasswordEnabled: true,
        externalIdentityLinked,
      }
      setSettingsSnapshot((current) => (current ? {
        ...current,
        account: {
          ...current.account,
          ...updatedPasswordState,
        },
      } : current))
      await patchSession({ user: updatedPasswordState })
      try {
        await loadSettings()
      } catch {
        // Keep the UI on the normal password flow even if the background refresh fails.
      }
      closeSheet()
    } catch (error) {
      setSheetError(error?.message ?? 'Nao foi possivel atualizar a senha.')
    } finally {
      setSheetBusy(false)
    }
  }

  const loadActiveSessions = useCallback(async () => {
    if (!accessToken) return
    setSessionsLoading(true)
    setSheetError(null)
    try {
      const sessions = await request('/api/settings/security/sessions')
      setActiveSessions(Array.isArray(sessions) ? sessions : [])
    } catch (error) {
      setSheetError(error?.message ?? 'Nao foi possivel carregar as sessoes ativas.')
    } finally {
      setSessionsLoading(false)
    }
  }, [accessToken, request])

  useEffect(() => {
    if (activeSheet === 'sessions') {
      void loadActiveSessions()
    }
  }, [activeSheet, loadActiveSessions])

  const revokeSession = async (sessionId) => {
    setSessionActionId(sessionId)
    setSheetError(null)
    setSheetSuccess(null)
    try {
      await request(`/api/settings/security/sessions/${sessionId}`, {
        method: 'DELETE',
      })
      setSheetSuccess('Sessao encerrada com sucesso.')
      await loadActiveSessions()
    } catch (error) {
      setSheetError(error?.message ?? 'Nao foi possivel encerrar a sessao.')
    } finally {
      setSessionActionId(null)
    }
  }

  const revokeOtherSessions = async () => {
    setSessionActionId('revoke-others')
    setSheetError(null)
    setSheetSuccess(null)
    try {
      await request('/api/settings/security/sessions/revoke-others', {
        method: 'POST',
      })
      setSheetSuccess('As outras sessoes foram encerradas.')
      await loadActiveSessions()
    } catch (error) {
      setSheetError(error?.message ?? 'Nao foi possivel encerrar as outras sessoes.')
    } finally {
      setSessionActionId(null)
    }
  }

  const exportData = async () => {
    setSheetBusy(true)
    setSheetError(null)
    setSheetSuccess(null)

    try {
      const filename = sanitizeFilename(`plan-things-export-${new Date().toISOString().slice(0, 10)}.zip`)

      if (Platform.OS === 'web') {
        const blob = await request('/api/settings/export', {
          responseType: 'blob',
        })
        triggerWebDownload(blob, filename)
        setSheetSuccess('A exportacao foi iniciada.')
        return
      }

      const destination = `${FileSystem.documentDirectory}${filename}`
      const result = await FileSystem.downloadAsync(
        mobileApiUrl('/api/settings/export'),
        destination,
        {
          headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
        },
      )

      if (result.status >= 400) {
        throw new Error('Nao foi possivel exportar seus dados.')
      }

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(result.uri)
      }

      setSheetSuccess('Exportacao pronta para compartilhar.')
    } catch (error) {
      setSheetError(error?.message ?? 'Nao foi possivel exportar seus dados.')
    } finally {
      setSheetBusy(false)
    }
  }

  const deleteAccount = async () => {
    if (deleteConfirmEmail.trim().toLowerCase() !== session.user.email.trim().toLowerCase()) {
      setSheetError('Digite o e-mail da conta exatamente como exibido.')
      return
    }

    if (deleteConfirmPhrase.trim() !== DELETE_CONFIRMATION_PHRASE) {
      setSheetError(`Digite a frase ${DELETE_CONFIRMATION_PHRASE} para confirmar.`)
      return
    }

    if (localPasswordEnabled && !deletePasswordValue.trim()) {
      setSheetError('Informe sua senha atual para excluir a conta.')
      return
    }

    setSheetBusy(true)
    setSheetError(null)
    setSheetSuccess(null)

    try {
      await request('/api/settings/account/delete', {
        method: 'POST',
        body: {
          confirmEmail: deleteConfirmEmail,
          confirmPhrase: deleteConfirmPhrase,
          currentPassword: localPasswordEnabled ? deletePasswordValue : null,
        },
      })
      await logout()
      closeSheet()
    } catch (error) {
      setSheetError(error?.message ?? 'Nao foi possivel excluir a conta.')
    } finally {
      setSheetBusy(false)
    }
  }

  const firstName = useMemo(() => session.user.fullName.split(' ')[0] ?? session.user.fullName, [session.user.fullName])
  const selectedThemeLabel = themeLabels[themePreference] ?? themeLabels.system
  const effectiveThemeLabel = effectiveTheme === 'dark' ? 'escuro' : 'claro'
  const closeSheet = () => {
    setActiveSheet(null)
    setSheetBusy(false)
    setSheetError(null)
    setSheetSuccess(null)
    setSessionActionId(null)
    setCurrentPasswordValue('')
    setNewPasswordValue('')
    setDeleteConfirmEmail('')
    setDeleteConfirmPhrase('')
    setDeletePasswordValue('')
  }

  if (!session) {
    return null
  }

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.topbar}>
        <View style={styles.topbarText}>
          <Text style={styles.pageTitle}>Ajustes</Text>
          <Text style={styles.pageSubtitle}>Olá, {firstName}. Personalize sua experiência.</Text>
        </View>
      </View>

      <View style={styles.identityCard}>
        <AuthenticatedAvatar
          style={styles.identityAvatar}
          textStyle={styles.identityAvatarText}
          avatarUrl={session.user.avatarUrl}
          fallback={session.user.initials}
          accessibilityLabel={`Avatar de ${session.user.fullName}`}
        />
        <View style={styles.identityBody}>
          <Text style={styles.identityName} numberOfLines={1}>{session.user.fullName}</Text>
          <Text style={styles.identityEmail} numberOfLines={1}>{session.user.email}</Text>
          <View style={styles.identityMetaRow}>
            <WorkspaceIconBadge
              style={styles.workspaceBadge}
              color={theme.colors.text2}
              iconKey={session.workspace.iconKey}
              accessibilityLabel={`Icone do workspace ${session.workspace.name}`}
            />
            <Text style={styles.identityWorkspace} numberOfLines={1}>{session.workspace.name}</Text>
          </View>
        </View>
        <Pill label="real" />
      </View>

      <SectionCard
        title="Conta"
        hint="Informações de perfil, sessão e acesso."
      >
        <Row
          icon={UserRound}
          label="Perfil"
          hint="Nome, foto e preferências da conta."
          value="Gerenciar"
          onPress={() => setActiveSheet('profile')}
        />
        <Row
          icon={KeyRound}
          label="Senha"
          hint="Recomendado: senha forte + gerenciador."
          right={<InlineButton label={passwordFlowCopy.actionLabel} onPress={() => setActiveSheet('password')} />}
        />
        <Row
          icon={LogOut}
          label="Sair"
          hint="Encerra a sessão neste dispositivo."
          danger
          onPress={logout}
        />
      </SectionCard>

      <SectionCard
        title="Preferências gerais"
        hint="Idioma, formatação e comportamento do app."
      >
        <Row
          icon={Languages}
          label="Idioma"
          hint="Define o idioma da interface."
          value="Português (Brasil)"
          onPress={() => setActiveSheet('language')}
        />
        <Row
          icon={CalendarClock}
          label="Fuso horário"
          hint="Usado em datas de tarefas e lembretes."
          value="Automático"
          onPress={() => setActiveSheet('timezone')}
        />
        <Row
          icon={Palette}
          label="Tema"
          hint="Aparência do app."
          value={themePreference === 'system' ? `${selectedThemeLabel} (${effectiveThemeLabel})` : selectedThemeLabel}
          onPress={() => setActiveSheet('theme')}
        />
      </SectionCard>

      <SectionCard
        title="Workspace"
        hint="Configurações do seu espaço de trabalho."
      >
        <Row
          icon={Building2}
          label="Workspace atual"
          hint="Onde seus planos e arquivos ficam organizados."
          value={session.workspace.name}
          onPress={() => setActiveSheet('workspace')}
        />
        <Row
          icon={Users}
          label="Membros e permissões"
          hint="Convites, funções e acesso."
          right={<Pill label="Em breve" />}
          disabled
        />
      </SectionCard>

      <SectionCard
        title="Integrações"
        hint="Conecte serviços para envio e recursos futuros."
      >
        <Row
          icon={Mail}
          label="Gmail"
          hint="Conecte sua conta para envio de mensagens pelo Gmail."
          right={<InlineButton label={gmail?.connected ? 'Gerenciar' : 'Conectar'} onPress={() => setActiveSheet('gmail')} />}
        />
        <Row
          icon={Link}
          label="Calendário"
          hint="Sincronize eventos e deadlines."
          right={<Pill label="Em breve" />}
          disabled
        />
      </SectionCard>

      <SectionCard
        title="Notificações"
        hint="Controle quando o app chama sua atenção."
      >
        {settingsError ? <Text style={styles.inlineError}>{settingsError}</Text> : null}
        <Row
          icon={BellRing}
          label="Notificações por e-mail"
          hint="Receba avisos importantes no e-mail da conta."
          right={(
            <Switch
              value={emailNotifsEnabled}
              onValueChange={(value) => updateNotification('emailNotifs', value)}
              disabled={notificationsSaving}
              trackColor={{ false: theme.colors.border2, true: theme.colors.text1 }}
              thumbColor={theme.colors.textInverse}
              ios_backgroundColor={theme.colors.border2}
            />
          )}
        />
        <Row
          icon={CalendarClock}
          label="Lembretes de eventos"
          hint="Alertas para eventos do workspace."
          right={(
            <Switch
              value={eventRemindersEnabled}
              onValueChange={(value) => updateNotification('eventReminders', value)}
              disabled={notificationsSaving}
              trackColor={{ false: theme.colors.border2, true: theme.colors.text1 }}
              thumbColor={theme.colors.textInverse}
              ios_backgroundColor={theme.colors.border2}
            />
          )}
        />
        <Row
          icon={AlarmClock}
          label="Lembretes de prazos"
          hint="Alertas para tarefas próximas do vencimento."
          right={(
            <Switch
              value={deadlineAlertsEnabled}
              onValueChange={(value) => updateNotification('deadlineAlerts', value)}
              disabled={notificationsSaving}
              trackColor={{ false: theme.colors.border2, true: theme.colors.text1 }}
              thumbColor={theme.colors.textInverse}
              ios_backgroundColor={theme.colors.border2}
            />
          )}
        />
        <Row
          icon={AtSign}
          label="Menções"
          hint="Preferência separada ainda não está disponível."
          right={<Pill label="Em breve" />}
          disabled
        />
      </SectionCard>

      <SectionCard
        title="Privacidade e segurança"
        hint="Proteção de conta e controle de dados."
      >
        <Row
          icon={KeyRound}
          label="Senha"
          hint={passwordFlowCopy.rowHint}
          right={<InlineButton label={passwordFlowCopy.actionLabel} onPress={() => setActiveSheet('password')} />}
        />
        <Row
          icon={Shield}
          label="Autenticação em dois fatores"
          hint="Adicione uma camada extra de proteção."
          right={<Pill label="Em breve" tone="accent" />}
          disabled
        />
        <Row
          icon={Laptop}
          label="Sessões ativas"
          hint="Gerencie dispositivos conectados."
          right={<InlineButton label="Gerenciar" onPress={() => setActiveSheet('sessions')} />}
        />
        <Row
          icon={Download}
          label="Exportar meus dados"
          hint="Baixe uma cópia completa das suas informações."
          right={<InlineButton label="Exportar" onPress={() => setActiveSheet('export')} />}
        />
        <Row
          icon={Smartphone}
          label="Encerrar outras sessões"
          hint="Invalida sessões abertas em outros dispositivos."
          right={<InlineButton label="Encerrar" onPress={() => setActiveSheet('sessions')} />}
        />

        <View style={styles.dangerZone}>
          <View style={styles.dangerCopy}>
            <Text style={styles.dangerTitle}>Zona de perigo</Text>
            <Text style={styles.dangerHint}>
              Ações permanentes e irreversíveis. Use com cuidado.
            </Text>
          </View>
          <View style={styles.dangerRow}>
            <View style={styles.dangerRowMeta}>
              <Trash2 size={16} color={theme.colors.red} strokeWidth={1.9} />
              <View style={styles.dangerRowText}>
                <Text style={styles.dangerRowTitle}>Excluir conta</Text>
                <Text style={styles.dangerRowHint} numberOfLines={2}>
                  Remove definitivamente planos, arquivos e histórico do workspace.
                </Text>
              </View>
            </View>
            <InlineButton label="Excluir" tone="danger" onPress={() => setActiveSheet('delete')} />
          </View>
        </View>
      </SectionCard>

      <BottomSheet
        visible={Boolean(activeSheet)}
        onClose={closeSheet}
        title={
          activeSheet === 'profile' ? 'Perfil' :
          activeSheet === 'password' ? passwordFlowCopy.sheetTitle :
          activeSheet === 'language' ? 'Idioma' :
          activeSheet === 'timezone' ? 'Fuso horário' :
          activeSheet === 'theme' ? 'Tema' :
          activeSheet === 'workspace' ? 'Workspace' :
          activeSheet === 'gmail' ? 'Gmail' :
          activeSheet === 'export' ? 'Exportar dados' :
          activeSheet === 'sessions' ? 'Sessões' :
          activeSheet === 'delete' ? 'Excluir conta' :
          'Ajustes'
        }
      >
        {activeSheet === 'profile' ? (
          <View style={styles.sheetBlock}>
            <Text style={styles.sheetTitle}>{session.user.fullName}</Text>
            <Text style={styles.sheetHint}>{session.user.email}</Text>
            <View style={styles.sheetDivider} />
            <TextInput
              value={fullNameValue}
              onChangeText={setFullNameValue}
              style={styles.sheetInput}
              selectionColor={theme.colors.text1}
              autoCapitalize="words"
            />
            <View style={styles.sheetActions}>
              <InlineButton label="Salvar" tone="primary" onPress={saveAccount} disabled={!fullNameValue.trim()} />
              <InlineButton label="Fechar" tone="secondary" onPress={closeSheet} />
            </View>
          </View>
        ) : null}

        {activeSheet === 'language' ? (
          <View style={styles.sheetBlock}>
            <Text style={styles.sheetBodyText}>Idioma atual: Português (Brasil).</Text>
            <View style={styles.sheetDivider} />
            <View style={styles.sheetOption}>
              <Pill label="Selecionado" />
              <Text style={styles.sheetOptionText}>Português (Brasil)</Text>
            </View>
            <View style={styles.sheetOption}>
              <Pill label="Em breve" tone="accent" />
              <Text style={styles.sheetOptionText}>English (US)</Text>
            </View>
            <View style={styles.sheetActions}>
              <InlineButton label="Salvar" tone="primary" onPress={() => savePreferences({ locale: 'pt-BR' })} />
              <InlineButton label="Fechar" tone="secondary" onPress={closeSheet} />
            </View>
          </View>
        ) : null}

        {activeSheet === 'timezone' ? (
          <View style={styles.sheetBlock}>
            <Text style={styles.sheetBodyText}>
              O app usa o fuso do dispositivo para exibir datas e horários. Em breve, você poderá definir manualmente.
            </Text>
            <View style={styles.sheetActions}>
              <InlineButton label="Salvar" tone="primary" onPress={() => savePreferences({ timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone })} />
              <InlineButton label="Fechar" tone="secondary" onPress={closeSheet} />
            </View>
          </View>
        ) : null}

        {activeSheet === 'theme' ? (
          <View style={styles.sheetBlock}>
            <Text style={styles.sheetBodyText}>
              Aparência atual: {selectedThemeLabel.toLowerCase()} ({effectiveThemeLabel}).
            </Text>
            <View style={styles.sheetDivider} />
            {themeOptions.map((option) => {
              const selected = themePreference === option.id

              return (
                <Pressable
                  key={option.id}
                  style={[styles.sheetOption, selected && styles.sheetOptionActive]}
                  onPress={() => savePreferences({ theme: option.id })}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                >
                  <View style={styles.sheetOptionTextWrap}>
                    <Text style={styles.sheetOptionText}>{option.label}</Text>
                    <Text style={styles.sheetOptionHint}>{option.hint}</Text>
                  </View>
                  {selected ? <Pill label="Selecionado" tone="accent" /> : null}
                </Pressable>
              )
            })}
          </View>
        ) : null}

        {activeSheet === 'workspace' ? (
          <View style={styles.sheetBlock}>
            <Text style={styles.sheetTitle}>{session.workspace.name}</Text>
            <Text style={styles.sheetHint}>Workspace atual</Text>
            <View style={styles.sheetDivider} />
            <TextInput
              value={workspaceNameValue}
              onChangeText={setWorkspaceNameValue}
              style={styles.sheetInput}
              selectionColor={theme.colors.text1}
            />
            <View style={styles.sheetActions}>
              <InlineButton label="Salvar" tone="primary" onPress={saveWorkspace} disabled={!workspaceNameValue.trim()} />
              <InlineButton label="Fechar" tone="secondary" onPress={closeSheet} />
            </View>
          </View>
        ) : null}

        {activeSheet === 'gmail' ? (
          <View style={styles.sheetBlock}>
            <Text style={styles.sheetTitle}>Integração com Gmail</Text>
            <Text style={styles.sheetHint}>{gmail?.connected ? gmail.email : 'Conecte para enviar resumos.'}</Text>
            <View style={styles.sheetDivider} />
            <Text style={styles.sheetBodyText}>
              {gmail?.connected ? 'Gmail conectado neste workspace.' : 'O Google abrirá o consentimento e voltará para o app ao concluir.'}
            </Text>
            <View style={styles.sheetActions}>
              <InlineButton label={gmail?.connected ? 'Desconectar' : 'Conectar'} tone={gmail?.connected ? 'danger' : 'primary'} onPress={gmail?.connected ? disconnectGmail : connectGmail} />
              <InlineButton label="Fechar" tone="secondary" onPress={closeSheet} />
            </View>
          </View>
        ) : null}

        {activeSheet === 'password' ? (
          <View style={styles.sheetBlock}>
            {passwordFlowCopy.sheetDescription ? <Text style={styles.sheetBodyText}>{passwordFlowCopy.sheetDescription}</Text> : null}
            {!canSetupPasswordWithoutCurrent ? (
              <TextInput
                value={currentPasswordValue}
                onChangeText={setCurrentPasswordValue}
                style={styles.sheetInput}
                selectionColor={theme.colors.text1}
                secureTextEntry
                placeholder="Senha atual"
                placeholderTextColor={theme.colors.text3}
              />
            ) : null}
            <TextInput
              value={newPasswordValue}
              onChangeText={setNewPasswordValue}
              style={styles.sheetInput}
              selectionColor={theme.colors.text1}
              secureTextEntry
              placeholder="Nova senha"
              placeholderTextColor={theme.colors.text3}
            />
            {sheetError ? <Text style={styles.inlineError}>{sheetError}</Text> : null}
            <View style={styles.sheetActions}>
              <InlineButton
                label={sheetBusy ? 'Salvando...' : passwordFlowCopy.submitLabel}
                tone="primary"
                onPress={savePassword}
                disabled={sheetBusy || (!canSetupPasswordWithoutCurrent && !currentPasswordValue) || newPasswordValue.length < 8}
              />
              <InlineButton label="Fechar" tone="secondary" onPress={closeSheet} />
            </View>
          </View>
        ) : null}

        {activeSheet === 'export' ? (
          <View style={styles.sheetBlock}>
            <Text style={styles.sheetBodyText}>
              Gere um arquivo ZIP com seus dados e compartilhe a exportação com o sistema do dispositivo.
            </Text>
            {sheetError ? <Text style={styles.inlineError}>{sheetError}</Text> : null}
            {sheetSuccess ? <Text style={styles.inlineSuccess}>{sheetSuccess}</Text> : null}
            <View style={styles.sheetActions}>
              <InlineButton
                label={sheetBusy ? 'Preparando...' : 'Baixar e compartilhar'}
                tone="primary"
                onPress={exportData}
                disabled={sheetBusy}
              />
              <InlineButton label="Fechar" tone="secondary" onPress={closeSheet} />
            </View>
          </View>
        ) : null}

        {activeSheet === 'sessions' ? (
          <View style={styles.sheetBlock}>
            <Text style={styles.sheetBodyText}>
              Revogue sessões antigas ou encerre todos os outros dispositivos com um toque.
            </Text>
            {sheetError ? <Text style={styles.inlineError}>{sheetError}</Text> : null}
            {sheetSuccess ? <Text style={styles.inlineSuccess}>{sheetSuccess}</Text> : null}
            <View style={styles.sheetDivider} />
            <View style={styles.sessionsList}>
              {sessionsLoading ? (
                <Text style={styles.sheetBodyText}>Carregando sessões...</Text>
              ) : activeSessions.length === 0 ? (
                <Text style={styles.sheetBodyText}>Nenhuma outra sessão ativa encontrada.</Text>
              ) : activeSessions.map((sessionItem) => (
                <View key={sessionItem.id} style={styles.sessionItem}>
                  <View style={styles.sessionItemBody}>
                    <View style={styles.sessionItemTop}>
                      <Text style={styles.sessionItemTitle}>{sessionItem.deviceLabel || 'Sessão ativa'}</Text>
                      <Pill label={sessionItem.current ? 'Atual' : sessionItem.client === 'mobile' ? 'Mobile' : 'Web'} tone={sessionItem.current ? 'accent' : 'neutral'} />
                    </View>
                    <Text style={styles.sessionItemHint}>
                      Ativa em {sessionItem.lastSeenAt?.text ?? sessionItem.createdAt?.text ?? 'momento recente'}
                    </Text>
                    <Text style={styles.sessionItemHint}>
                      Iniciada em {sessionItem.createdAt?.text ?? 'data indisponível'}
                    </Text>
                  </View>
                  {sessionItem.revocable ? (
                    <InlineButton
                      label={sessionActionId === sessionItem.id ? 'Encerrando...' : 'Encerrar'}
                      tone="secondary"
                      onPress={() => revokeSession(sessionItem.id)}
                      disabled={sessionActionId === sessionItem.id || sessionActionId === 'revoke-others'}
                    />
                  ) : (
                    <Pill label="Em uso" tone="accent" />
                  )}
                </View>
              ))}
            </View>
            <View style={styles.sheetActions}>
              <InlineButton
                label={sessionActionId === 'revoke-others' ? 'Encerrando...' : 'Encerrar outras'}
                tone="primary"
                onPress={revokeOtherSessions}
                disabled={sessionsLoading || sessionActionId === 'revoke-others'}
              />
              <InlineButton label="Fechar" tone="secondary" onPress={closeSheet} />
            </View>
          </View>
        ) : null}

        {activeSheet === 'delete' ? (
          <View style={styles.sheetBlock}>
            <Text style={styles.sheetBodyText}>
              Digite o e-mail da conta e a frase {DELETE_CONFIRMATION_PHRASE} para confirmar a exclusão permanente.
            </Text>
            <TextInput
              value={deleteConfirmEmail}
              onChangeText={setDeleteConfirmEmail}
              style={styles.sheetInput}
              selectionColor={theme.colors.text1}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholder={session.user.email}
              placeholderTextColor={theme.colors.text3}
            />
            <TextInput
              value={deleteConfirmPhrase}
              onChangeText={setDeleteConfirmPhrase}
              style={styles.sheetInput}
              selectionColor={theme.colors.text1}
              autoCapitalize="characters"
              placeholder={DELETE_CONFIRMATION_PHRASE}
              placeholderTextColor={theme.colors.text3}
            />
            {localPasswordEnabled ? (
              <TextInput
                value={deletePasswordValue}
                onChangeText={setDeletePasswordValue}
                style={styles.sheetInput}
                selectionColor={theme.colors.text1}
                secureTextEntry
                placeholder="Senha atual"
                placeholderTextColor={theme.colors.text3}
              />
            ) : null}
            {sheetError ? <Text style={styles.inlineError}>{sheetError}</Text> : null}
            <View style={styles.sheetActions}>
              <InlineButton
                label={sheetBusy ? 'Excluindo...' : 'Excluir conta'}
                tone="danger"
                onPress={deleteAccount}
                disabled={
                  sheetBusy
                  || !deleteConfirmEmail.trim()
                  || deleteConfirmPhrase.trim() !== DELETE_CONFIRMATION_PHRASE
                  || (localPasswordEnabled && !deletePasswordValue.trim())
                }
              />
              <InlineButton label="Cancelar" tone="secondary" onPress={closeSheet} />
            </View>
          </View>
        ) : null}
      </BottomSheet>
    </ScrollView>
  )
}

const createStyles = (theme) => StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: theme.colors.appBg,
  },
  content: {
    paddingHorizontal: theme.spacing.screenX,
    paddingTop: 20,
    paddingBottom: 98,
  },
  topbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
    marginBottom: 14,
  },
  topbarText: {
    flex: 1,
    minWidth: 0,
  },
  pageTitle: {
    color: theme.colors.text1,
    fontSize: 30,
    lineHeight: 36,
    fontWeight: '400',
  },
  pageSubtitle: {
    color: theme.colors.text3,
    fontSize: 13,
    marginTop: 2,
  },
  identityCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border1,
    backgroundColor: theme.colors.surface2,
    marginBottom: theme.spacing.section,
  },
  identityAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.text1,
  },
  identityAvatarText: {
    color: theme.colors.textInverse,
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  identityBody: {
    flex: 1,
    minWidth: 0,
    gap: 3,
  },
  identityName: {
    color: theme.colors.text1,
    fontSize: 16,
    fontWeight: '700',
  },
  identityEmail: {
    color: theme.colors.text2,
    fontSize: 13,
  },
  identityMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
  },
  workspaceBadge: {
    width: 22,
    height: 22,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surface3,
    borderWidth: 1,
    borderColor: theme.colors.border1,
  },
  identityWorkspace: {
    flex: 1,
    minWidth: 0,
    color: theme.colors.text3,
    fontSize: 12,
  },
  card: {
    borderWidth: 1,
    borderColor: theme.colors.border1,
    borderRadius: 12,
    backgroundColor: theme.colors.surface1,
    marginBottom: 14,
    overflow: 'hidden',
  },
  cardHeader: {
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border1,
    backgroundColor: theme.colors.surface2,
  },
  cardTitle: {
    color: theme.colors.text1,
    fontSize: 14,
    fontWeight: '700',
  },
  cardHint: {
    color: theme.colors.text3,
    fontSize: 12,
    marginTop: 4,
    lineHeight: 16,
  },
  cardBody: {
    paddingHorizontal: 14,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border1,
  },
  rowPressed: {
    opacity: 0.92,
  },
  rowDisabled: {
    opacity: 0.65,
  },
  rowDanger: {
    borderBottomColor: theme.colors.dangerBorder,
  },
  rowIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surface3,
  },
  rowIconDanger: {
    borderWidth: 1,
    borderColor: theme.colors.dangerBorder,
    backgroundColor: theme.colors.dangerBgSoft,
  },
  rowBody: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  rowTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  rowLabel: {
    flex: 1,
    minWidth: 0,
    color: theme.colors.text1,
    fontSize: 14,
    fontWeight: '600',
  },
  rowLabelDanger: {
    color: theme.colors.red,
  },
  rowValue: {
    color: theme.colors.text3,
    fontSize: 12,
    fontWeight: '600',
  },
  rowValueDanger: {
    color: theme.colors.red,
  },
  rowHint: {
    color: theme.colors.text2,
    fontSize: 12,
    lineHeight: 16,
  },
  inlineError: {
    color: theme.colors.red,
    fontSize: 12,
    lineHeight: 17,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: theme.colors.red,
    borderRadius: 8,
    backgroundColor: theme.colors.surface2,
  },
  inlineSuccess: {
    color: theme.colors.text1,
    fontSize: 12,
    lineHeight: 17,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: theme.colors.border1,
    borderRadius: 8,
    backgroundColor: theme.colors.surface2,
  },
  rowRight: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  pill: {
    height: 24,
    paddingHorizontal: 10,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  pillText: {
    fontSize: 12,
    fontWeight: '700',
  },
  pillNeutral: {
    backgroundColor: theme.colors.surface3,
    borderColor: theme.colors.border1,
  },
  pillTextNeutral: {
    color: theme.colors.text2,
  },
  pillAccent: {
    backgroundColor: theme.colors.surface2,
    borderColor: theme.colors.border1,
  },
  pillTextAccent: {
    color: theme.colors.text1,
  },
  pillDanger: {
    backgroundColor: theme.colors.dangerBgSoft,
    borderColor: theme.colors.dangerBorder,
  },
  pillTextDanger: {
    color: theme.colors.red,
  },
  btnBase: {
    height: 32,
    paddingHorizontal: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnPressed: {
    opacity: 0.92,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  btnPrimary: {
    backgroundColor: theme.colors.text1,
  },
  btnPrimaryText: {
    color: theme.colors.textInverse,
    fontSize: 12,
    fontWeight: '700',
  },
  btnSecondary: {
    backgroundColor: theme.colors.surface3,
    borderWidth: 1,
    borderColor: theme.colors.border1,
  },
  btnSecondaryText: {
    color: theme.colors.text1,
    fontSize: 12,
    fontWeight: '700',
  },
  btnDanger: {
    backgroundColor: theme.colors.dangerBgSoft,
    borderWidth: 1,
    borderColor: theme.colors.dangerBorder,
  },
  btnDangerText: {
    color: theme.colors.red,
    fontSize: 12,
    fontWeight: '800',
  },
  dangerZone: {
    paddingTop: 14,
    paddingBottom: 14,
  },
  dangerCopy: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.dangerBorder,
    backgroundColor: theme.colors.dangerBgSubtle,
  },
  dangerTitle: {
    color: theme.colors.red,
    fontSize: 13,
    fontWeight: '800',
  },
  dangerHint: {
    color: theme.colors.text2,
    fontSize: 12,
    marginTop: 6,
    lineHeight: 16,
  },
  dangerRow: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.dangerBorder,
    backgroundColor: theme.colors.dangerBgSubtle,
  },
  dangerRowMeta: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  dangerRowText: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  dangerRowTitle: {
    color: theme.colors.text1,
    fontSize: 13,
    fontWeight: '800',
  },
  dangerRowHint: {
    color: theme.colors.text2,
    fontSize: 12,
    lineHeight: 16,
  },
  sheetBlock: {
    gap: 8,
    paddingBottom: 6,
  },
  sheetTitle: {
    color: theme.colors.text1,
    fontSize: 18,
    fontWeight: '700',
  },
  sheetHint: {
    color: theme.colors.text3,
    fontSize: 13,
  },
  sheetBodyText: {
    color: theme.colors.text2,
    fontSize: 14,
    lineHeight: 19,
  },
  sheetDivider: {
    height: 1,
    backgroundColor: theme.colors.border1,
    marginTop: 6,
    marginBottom: 6,
  },
  sheetActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 6,
  },
  sessionsList: {
    gap: 10,
  },
  sessionItem: {
    gap: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: theme.colors.border1,
    borderRadius: 12,
    backgroundColor: theme.colors.surface2,
  },
  sessionItemBody: {
    gap: 4,
  },
  sessionItemTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
  },
  sessionItemTitle: {
    flex: 1,
    minWidth: 0,
    color: theme.colors.text1,
    fontSize: 14,
    fontWeight: '700',
  },
  sessionItemHint: {
    color: theme.colors.text2,
    fontSize: 12,
    lineHeight: 16,
  },
  sheetInput: {
    minHeight: 44,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: theme.colors.border1,
    borderRadius: theme.radius.sm,
    color: theme.colors.text1,
    backgroundColor: theme.colors.surface1,
    fontSize: 14,
  },
  sheetOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: theme.colors.border1,
    borderRadius: 12,
    paddingHorizontal: 12,
    backgroundColor: theme.colors.surface2,
  },
  sheetOptionActive: {
    borderColor: theme.colors.text1,
    backgroundColor: theme.colors.surface1,
  },
  sheetOptionTextWrap: {
    flex: 1,
    minWidth: 0,
    gap: 3,
  },
  sheetOptionText: {
    color: theme.colors.text1,
    fontSize: 14,
    fontWeight: '600',
  },
  sheetOptionHint: {
    color: theme.colors.text2,
    fontSize: 12,
    lineHeight: 16,
  },
})

let styles = createStyles(theme)
