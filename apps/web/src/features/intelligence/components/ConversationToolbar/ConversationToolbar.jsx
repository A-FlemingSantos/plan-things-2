import { useId, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AuthenticatedAvatar from '../../../../shared/components/AuthenticatedAvatar/AuthenticatedAvatar.jsx'
import CustomScrollArea from '../../../../shared/components/CustomScrollArea/CustomScrollArea.jsx'
import Toggle from '../../../../shared/components/Toggle/Toggle.jsx'
import { buildWorkspaceBoardPath } from '../../../../shared/config/routes.js'
import styles from './ConversationToolbar.module.css'

const MOCK_RECENT_CONVERSATIONS = [
  { id: 'conv-1', title: 'Estrutura do pitch deck' },
  { id: 'conv-2', title: 'Setup UI system' },
  { id: 'conv-3', title: 'Planejamento sprint 3' },
]

const MOCK_LOADED_ITEMS = [
  { id: 'file-1', name: 'pitch-deck-v2.pdf', type: 'file' },
  { id: 'file-2', name: 'wireframes.fig', type: 'attachment' },
  { id: 'file-3', name: 'spec-auth.md', type: 'file' },
]

const MOCK_ACTIVITY = [
  {
    id: 'act-1',
    actorId: 'm1',
    actionType: 'Anexo',
    targetIcon: 'file',
    targetLabel: 'requisitos.pdf',
    timestampLabel: '26 mai, 14:32',
    occurredAt: '2026-05-26T14:32:00',
  },
  {
    id: 'act-2',
    actorId: 'm2',
    actionType: 'Compartilhamento',
    targetIcon: 'github',
    targetLabel: 'GitHub',
    timestampLabel: '26 mai, 13:18',
    occurredAt: '2026-05-26T13:18:00',
  },
  {
    id: 'act-3',
    actorId: 'm3',
    actionType: 'Referência',
    targetIcon: 'plan',
    targetLabel: 'Design System',
    timestampLabel: '26 mai, 11:05',
    occurredAt: '2026-05-26T11:05:00',
  },
  {
    id: 'act-4',
    actorId: 'm4',
    actionType: 'Adição',
    targetIcon: 'file',
    targetLabel: 'wireframes.fig',
    timestampLabel: '25 mai, 17:44',
    occurredAt: '2026-05-25T17:44:00',
  },
  {
    id: 'act-5',
    actorId: 'intelligence',
    actionType: 'Criação',
    targetIcon: 'plan',
    targetLabel: 'Lançamento v1.0',
    timestampLabel: '25 mai, 16:20',
    occurredAt: '2026-05-25T16:20:00',
  },
  {
    id: 'act-6',
    actorId: 'intelligence',
    actionType: 'Edição',
    targetIcon: 'file',
    targetLabel: 'requisitos.pdf',
    timestampLabel: '25 mai, 15:02',
    occurredAt: '2026-05-25T15:02:00',
  },
  {
    id: 'act-7',
    actorId: 'm1',
    actionType: 'Conexão',
    targetIcon: 'slack',
    targetLabel: 'Slack',
    timestampLabel: '25 mai, 10:11',
    occurredAt: '2026-05-25T10:11:00',
  },
]

const MOCK_PARTICIPANTS = {
  m1: { id: 'm1', name: 'Ana Silva', initials: 'AS', color: '#000' },
  m2: { id: 'm2', name: 'Maria Klink', initials: 'MK', color: '#d4aef1' },
  m3: { id: 'm3', name: 'Tom Kobayashi', initials: 'TK', color: '#4290da' },
  m4: { id: 'm4', name: 'Sara Ribeiro', initials: 'SR', color: '#0f703a' },
  intelligence: { id: 'intelligence', name: 'Intelligence', type: 'agent' },
}

function ConnectorGitHubIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M8 1.4a6.6 6.6 0 0 0-2.1 12.85c.33.06.45-.14.45-.32v-1.2c-1.82.4-2.2-.77-2.2-.77-.3-.74-.73-.94-.73-.94-.6-.41.05-.4.05-.4.66.05 1 .67 1 .67.6 1 .15.52 1.5.4.05-.43.23-.73.42-.89-1.45-.16-2.98-.72-2.98-3.22 0-.71.25-1.3.67-1.75-.07-.16-.29-.82.06-1.7 0 0 .55-.18 1.8.67a6.26 6.26 0 0 1 3.28 0c1.24-.85 1.79-.67 1.79-.67.35.88.13 1.54.06 1.7.42.45.67 1.04.67 1.75 0 2.5-1.53 3.06-2.99 3.22.24.2.45.61.45 1.24v1.84c0 .18.12.38.46.31A6.6 6.6 0 0 0 8 1.4Z" fill="currentColor" />
    </svg>
  )
}

function ConnectorTeamsIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <rect x="1.5" y="4" width="6.5" height="8" rx="1.6" fill="#4F52D9" />
      <rect x="8.3" y="5.1" width="5.7" height="7.4" rx="1.8" fill="#7B83EB" />
      <circle cx="11.15" cy="3.95" r="1.95" fill="#6264F5" />
      <circle cx="13.1" cy="6" r="1.4" fill="#8B8CC7" />
      <path d="M3.25 6.1h3.2v1.1H5.45v4.1h-1.2V7.2H3.25V6.1Z" fill="white" />
    </svg>
  )
}

function ConnectorSlackIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#E01E5A" d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zm1.271 0a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313z" />
      <path fill="#36C5F0" d="M8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zm1.271 0a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312z" />
      <path fill="#2EB67D" d="M18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zm-1.269 0a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312z" />
      <path fill="#ECB22E" d="M15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zm-1.269 0a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z" />
    </svg>
  )
}

const CONNECTOR_ICONS = {
  github: ConnectorGitHubIcon,
  slack: ConnectorSlackIcon,
  teams: ConnectorTeamsIcon,
}

const MOCK_CONNECTORS = [
  { id: 'github', name: 'GitHub' },
  { id: 'slack', name: 'Slack' },
  { id: 'teams', name: 'Teams' },
]

const DEFAULT_ACTIVE_CONNECTORS = []

function ChevronIcon({ open = false }) {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      aria-hidden="true"
      className={open ? styles.chevronOpen : styles.chevron}
    >
      <path d="M3 4.5 6 7.5l3-3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function ConversationsIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M2.5 3.5h11v7.5H9.2L6.5 13.8V11H2.5z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
    </svg>
  )
}

function PermissionsIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M8 1.8 3.2 4v4.2c0 2.8 2 5.4 4.8 6 2.8-.6 4.8-3.2 4.8-6V4z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
    </svg>
  )
}

function FilesIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M5.2 2.5h3.3l3.5 3.5v7.5H5.2z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
      <path d="M8.5 2.5v3.5h3.5" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
    </svg>
  )
}

function HistoryIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M8 3.2v4.4l2.8 1.6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="8" cy="8" r="5.2" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  )
}

function PlusIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <path d="M6 2v8M2 6h8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  )
}

function SparkleIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M8.7 1.8 4.9 7.3h2.5l-.7 6.1 4-5.6H8.2l.5-6z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function ActivityTargetFileIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M5.2 2.5h3.3l3.5 3.5v7.5H5.2z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
      <path d="M8.5 2.5v3.5h3.5" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
    </svg>
  )
}

function ActivityTargetGitHubIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M8 1.4a6.6 6.6 0 0 0-2.1 12.85c.33.06.45-.14.45-.32v-1.2c-1.82.4-2.2-.77-2.2-.77-.3-.74-.73-.94-.73-.94-.6-.41.05-.4.05-.4.66.05 1 .67 1 .67.6 1 .15.52 1.5.4.05-.43.23-.73.42-.89-1.45-.16-2.98-.72-2.98-3.22 0-.71.25-1.3.67-1.75-.07-.16-.29-.82.06-1.7 0 0 .55-.18 1.8.67a6.26 6.26 0 0 1 3.28 0c1.24-.85 1.79-.67 1.79-.67.35.88.13 1.54.06 1.7.42.45.67 1.04.67 1.75 0 2.5-1.53 3.06-2.99 3.22.24.2.45.61.45 1.24v1.84c0 .18.12.38.46.31A6.6 6.6 0 0 0 8 1.4Z" fill="currentColor" />
    </svg>
  )
}

function ActivityTargetPlanIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <rect x="2.5" y="3.5" width="11" height="9" rx="1.2" stroke="currentColor" strokeWidth="1.2" />
      <path d="M5.5 7h5M5.5 9.5h3.2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  )
}

function ActivityTargetSlackIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M6.6 2.5a1.1 1.1 0 0 0-1.1 1.1v1.1H4.4a1.1 1.1 0 1 0 0 2.2h2.1V5.6a1.1 1.1 0 0 0-1.1-1.1Z" fill="currentColor" />
      <path d="M9.4 13.5a1.1 1.1 0 0 0 1.1-1.1v-1.1h1.1a1.1 1.1 0 1 0 0-2.2H9.4v2.1a1.1 1.1 0 0 0 1.1 1.1Z" fill="currentColor" />
      <path d="M13.5 6.6a1.1 1.1 0 0 0-1.1-1.1h-1.1V4.4a1.1 1.1 0 1 0-2.2 0v2.1h2.1a1.1 1.1 0 0 0 1.1-1.1Z" fill="currentColor" />
      <path d="M2.5 9.4a1.1 1.1 0 0 0 1.1 1.1h1.1v1.1a1.1 1.1 0 1 0 2.2 0V9.4H4.6a1.1 1.1 0 0 0-1.1 1.1Z" fill="currentColor" />
    </svg>
  )
}

const ACTIVITY_TARGET_ICONS = {
  file: ActivityTargetFileIcon,
  github: ActivityTargetGitHubIcon,
  plan: ActivityTargetPlanIcon,
  slack: ActivityTargetSlackIcon,
}

function ActivityTargetIcon({ type }) {
  const Icon = ACTIVITY_TARGET_ICONS[type]
  if (!Icon) return null

  return (
    <span className={styles.activityTargetIcon} data-testid={`activity-target-icon-${type}`}>
      <Icon />
    </span>
  )
}

function ActivityDescription({ entry }) {
  return (
    <span className={styles.activityDescription}>
      <span className={styles.activityActionType}>{entry.actionType}</span>
      <span className={styles.activityTarget}>
        <ActivityTargetIcon type={entry.targetIcon} />
        <span className={styles.activityTargetLabel}>{entry.targetLabel}</span>
      </span>
    </span>
  )
}

function ActivityActorAvatar({ actor }) {
  if (actor.type === 'agent') {
    return (
      <span className={styles.activityAgentAvatar} title={actor.name} aria-hidden="true">
        <SparkleIcon />
      </span>
    )
  }

  return (
    <AuthenticatedAvatar
      className={styles.activityAvatar}
      style={{ background: actor.color }}
      avatarUrl={actor.avatarUrl}
      fallback={actor.initials}
      title={actor.name}
      imageClassName={styles.activityAvatarImage}
    />
  )
}

function resolveScopeLabel({ planId, planName, cardId, cardTitle }) {
  if (cardId && cardTitle) return cardTitle
  if (planId && planName) return planName
  if (cardId) return 'Card selecionado'
  if (planId) return 'Plano selecionado'
  return 'Área de trabalho'
}

function resolveScopeKind({ planId, cardId }) {
  if (cardId) return 'Card'
  if (planId) return 'Plano'
  return 'Workspace'
}

function normalizeConnectorIds(connectorIds = []) {
  return Array.from(new Set(connectorIds.filter(Boolean)))
}

function resolveConnectorState(activeConnectorIdSet, connectorOverrides, connectorId) {
  if (Object.prototype.hasOwnProperty.call(connectorOverrides, connectorId)) {
    return connectorOverrides[connectorId]
  }

  return activeConnectorIdSet.has(connectorId)
}

export default function ConversationToolbar({
  conversationTitle = 'Nova conversa',
  activeConversationId = null,
  recentConversations = null,
  onSelectConversation = null,
  onNewConversation = null,
  onArchiveConversation = null,
  planId = null,
  planName = null,
  cardId = null,
  cardTitle = null,
  activeConnectors = DEFAULT_ACTIVE_CONNECTORS,
}) {
  const navigate = useNavigate()
  const panelId = useId()
  const activeConnectorIdSet = useMemo(
    () => new Set(normalizeConnectorIds(activeConnectors)),
    [activeConnectors],
  )
  const [isExpanded, setIsExpanded] = useState(false)
  const [openSections, setOpenSections] = useState({})
  const [filesFilter, setFilesFilter] = useState('')
  const [historyFilter, setHistoryFilter] = useState('')
  const [connectorOverrides, setConnectorOverrides] = useState({})

  const scopeLabel = resolveScopeLabel({ planId, planName, cardId, cardTitle })
  const scopeKind = resolveScopeKind({ planId, cardId })
  const loadedItemCount = MOCK_LOADED_ITEMS.length
  const conversationItems = recentConversations ?? MOCK_RECENT_CONVERSATIONS

  const filteredItems = useMemo(() => {
    const query = filesFilter.trim().toLowerCase()
    if (!query) return MOCK_LOADED_ITEMS
    return MOCK_LOADED_ITEMS.filter((item) => item.name.toLowerCase().includes(query))
  }, [filesFilter])

  const filteredActivity = useMemo(() => {
    const query = historyFilter.trim().toLowerCase()
    if (!query) return MOCK_ACTIVITY

    return MOCK_ACTIVITY.filter((entry) => {
      const actor = MOCK_PARTICIPANTS[entry.actorId]
      const searchable = [
        actor?.name,
        entry.actionType,
        entry.targetLabel,
        entry.timestampLabel,
      ].filter(Boolean).join(' ').toLowerCase()

      return searchable.includes(query)
    })
  }, [historyFilter])

  const panelViewportProps = useMemo(() => ({ id: panelId }), [panelId])

  const toggleToolbar = () => {
    setIsExpanded((current) => !current)
  }

  const toggleSection = (sectionId) => {
    setOpenSections((current) => ({
      ...current,
      [sectionId]: !current[sectionId],
    }))
  }

  const handleContinueInKanban = () => {
    if (!planId) return
    navigate(buildWorkspaceBoardPath(planId), { state: { openIntelligence: true } })
  }

  const sectionIds = {
    conversations: `${panelId}-conversations`,
    permissions: `${panelId}-permissions`,
    files: `${panelId}-files`,
    history: `${panelId}-history`,
  }

  const renderSectionHeader = (sectionKey, label, Icon, actions = null) => {
    const sectionId = sectionIds[sectionKey]
    const isOpen = Boolean(openSections[sectionKey])

    return (
      <div className={styles.sectionHeader}>
        <button
          type="button"
          className={styles.sectionToggle}
          aria-expanded={isOpen}
          aria-controls={sectionId}
          onClick={() => toggleSection(sectionKey)}
        >
          <span className={styles.sectionToggleIcon} aria-hidden="true">
            <Icon />
          </span>
          <span className={styles.sectionToggleLabel}>{label}</span>
        </button>
        {actions ? <div className={styles.sectionActions}>{actions}</div> : null}
        <button
          type="button"
          className={styles.sectionChevron}
          aria-hidden="true"
          tabIndex={-1}
          onClick={() => toggleSection(sectionKey)}
        >
          <ChevronIcon open={isOpen} />
        </button>
      </div>
    )
  }

  return (
    <div className={`${styles.toolbar} ${isExpanded ? styles.toolbarExpanded : ''}`}>
      <button
        type="button"
        className={styles.toolbarTrigger}
        aria-expanded={isExpanded}
        aria-controls={panelId}
        aria-label="Toolbar da conversa"
        onClick={toggleToolbar}
      >
        <span className={styles.toolbarTitle}>{conversationTitle}</span>
        <span className={styles.toolbarDivider} aria-hidden="true" />
        <span className={styles.toolbarScope}>
          <span className={styles.toolbarScopeKind}>{scopeKind}</span>
          <span className={styles.toolbarScopeLabel}>{scopeLabel}</span>
        </span>
        <span className={styles.toolbarIndicators} aria-label="Indicadores da conversa">
          <span className={styles.indicator} title="Itens carregados">{loadedItemCount} itens</span>
        </span>
        <ChevronIcon open={isExpanded} />
      </button>

      {isExpanded ? (
        <CustomScrollArea
          enabled={isExpanded}
          className={styles.toolbarPanelShell}
          viewportClassName={styles.toolbarPanel}
          viewportProps={panelViewportProps}
        >
          {planId ? (
            <div className={styles.contextualActionRow}>
              <button
                type="button"
                className={styles.contextualAction}
                onClick={handleContinueInKanban}
              >
                Continuar no Kanban
              </button>
            </div>
          ) : null}

          <section className={styles.section}>
            {renderSectionHeader('conversations', 'Conversas', ConversationsIcon, (
              <button
                type="button"
                className={styles.sectionAction}
                aria-label="Nova conversa"
                onClick={() => onNewConversation?.()}
              >
                <PlusIcon />
              </button>
            ))}
            {openSections.conversations ? (
              <div id={sectionIds.conversations} className={styles.sectionBody}>
                <ul className={styles.list}>
                  {conversationItems.map((conversation) => (
                    <li
                      key={conversation.id}
                      className={`${styles.listItem} ${conversation.id === activeConversationId ? styles.listItemActive : ''}`}
                    >
                      <button
                        type="button"
                        className={styles.listItemSelect}
                        onClick={() => onSelectConversation?.(conversation.id)}
                        aria-current={conversation.id === activeConversationId ? 'true' : undefined}
                      >
                        {conversation.title}
                      </button>
                      <div className={styles.listItemActions}>
                        <button
                          type="button"
                          className={styles.listItemAction}
                          aria-label={`Renomear "${conversation.title}"`}
                        >
                          Renomear
                        </button>
                        <button
                          type="button"
                          className={styles.listItemAction}
                          aria-label={`Arquivar "${conversation.title}"`}
                          onClick={() => onArchiveConversation?.(conversation.id)}
                        >
                          Arquivar
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </section>

          <section className={styles.section}>
            {renderSectionHeader('permissions', 'Permissões e conectores', PermissionsIcon, (
              <button type="button" className={styles.sectionAction} aria-label="Configurar conectores">
                Configurar
              </button>
            ))}
            {openSections.permissions ? (
              <div id={sectionIds.permissions} className={styles.sectionBody}>
                <ul className={styles.list}>
                  {MOCK_CONNECTORS.map((connector) => {
                    const isActive = resolveConnectorState(activeConnectorIdSet, connectorOverrides, connector.id)
                    const ConnectorIcon = CONNECTOR_ICONS[connector.id]
                    return (
                      <li key={connector.id} className={styles.listItem}>
                        <div className={styles.changeRow}>
                          {ConnectorIcon ? (
                            <span className={styles.listItemIcon} data-connector={connector.id} aria-hidden="true">
                              <ConnectorIcon />
                            </span>
                          ) : null}
                          <span className={styles.listItemLabel}>{connector.name}</span>
                          <span
                            className={`${styles.statusBadge} ${isActive ? styles.statusApplied : styles.statusRejected}`}
                          >
                            {isActive ? 'Ativo' : 'Inativo'}
                          </span>
                        </div>
                        <Toggle
                          size="compact"
                          checked={isActive}
                          onChange={(nextValue) => {
                            setConnectorOverrides((current) => ({
                              ...current,
                              [connector.id]: nextValue,
                            }))
                          }}
                          aria-label={isActive ? `Desconectar ${connector.name}` : `Conectar ${connector.name}`}
                        />
                      </li>
                    )
                  })}
                </ul>
              </div>
            ) : null}
          </section>

          <section className={styles.section}>
            {renderSectionHeader('files', 'Arquivos e itens carregados', FilesIcon)}
            {openSections.files ? (
              <div id={sectionIds.files} className={styles.sectionBody}>
                <label className={styles.filterField}>
                  <span className={styles.visuallyHidden}>Filtrar arquivos e itens carregados</span>
                  <input
                    type="search"
                    className={styles.filterInput}
                    value={filesFilter}
                    onChange={(event) => setFilesFilter(event.target.value)}
                    placeholder="Filtrar itens..."
                    aria-label="Filtrar arquivos e itens carregados"
                  />
                </label>
                <ul className={styles.list}>
                  {filteredItems.map((item) => (
                    <li key={item.id} className={styles.listItem}>
                      <span className={styles.listItemLabel}>{item.name}</span>
                      <div className={styles.listItemActions}>
                        <button
                          type="button"
                          className={styles.listItemAction}
                          aria-label={`Abrir "${item.name}"`}
                        >
                          Abrir
                        </button>
                        <button
                          type="button"
                          className={styles.listItemAction}
                          aria-label={`Remover "${item.name}"`}
                        >
                          Remover
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </section>

          <section className={styles.section}>
            {renderSectionHeader('history', 'Atividade', HistoryIcon, (
              <button type="button" className={styles.sectionAction} aria-label="Abrir filtros de atividade">
                Filtrar
              </button>
            ))}
            {openSections.history ? (
              <div id={sectionIds.history} className={styles.sectionBody}>
                <label className={styles.filterField}>
                  <span className={styles.visuallyHidden}>Filtrar atividade</span>
                  <input
                    type="search"
                    className={styles.filterInput}
                    value={historyFilter}
                    onChange={(event) => setHistoryFilter(event.target.value)}
                    placeholder="Filtrar atividade..."
                    aria-label="Filtrar atividade"
                  />
                </label>
                <ul className={styles.activityList}>
                  {filteredActivity.map((entry) => {
                    const actor = MOCK_PARTICIPANTS[entry.actorId]
                    return (
                      <li key={entry.id} className={styles.activityItem}>
                        <ActivityActorAvatar actor={actor} />
                        <div className={styles.activityContent}>
                          <span className={styles.activityMemberName}>{actor.name}</span>
                          <ActivityDescription entry={entry} />
                          <span className={styles.activityMeta}>
                            <time className={styles.activityTimestamp} dateTime={entry.occurredAt}>
                              {entry.timestampLabel}
                            </time>
                          </span>
                        </div>
                      </li>
                    )
                  })}
                </ul>
              </div>
            ) : null}
          </section>
        </CustomScrollArea>
      ) : null}
    </div>
  )
}
