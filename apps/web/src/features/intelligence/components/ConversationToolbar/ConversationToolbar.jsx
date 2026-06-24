import { useId, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AuthenticatedAvatar from '../../../../shared/components/AuthenticatedAvatar/AuthenticatedAvatar.jsx'
import CustomScrollArea from '../../../../shared/components/CustomScrollArea/CustomScrollArea.jsx'
import Toggle from '../../../../shared/components/Toggle/Toggle.jsx'
import { ENABLE_DEV_MOCKS } from '../../../../shared/config/devMocks.js'
import { buildWorkspaceBoardPath } from '../../../../shared/config/routes.js'
import {
  ACTIVITY_TARGET_ICONS,
  ChevDownIcon,
  CONNECTOR_ICONS,
  ConversationFilesIcon,
  ConversationPlusIcon,
  ConversationsIcon,
  HistoryIcon,
  PermissionsIcon,
  SparkleIcon,
} from '../../../../shared/components/icons/index.js'
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

function ChevronIcon({ open = false }) {
  return (
    <ChevDownIcon
      aria-hidden="true"
      className={open ? styles.chevronOpen : styles.chevron}
    />
  )
}

const MOCK_CONNECTORS = [
  { id: 'github', name: 'GitHub' },
  { id: 'slack', name: 'Slack' },
  { id: 'teams', name: 'Teams' },
]

const DEFAULT_ACTIVE_CONNECTORS = []

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
  const loadedItems = ENABLE_DEV_MOCKS ? MOCK_LOADED_ITEMS : []
  const connectors = ENABLE_DEV_MOCKS ? MOCK_CONNECTORS : []
  const activityEntries = ENABLE_DEV_MOCKS ? MOCK_ACTIVITY : []
  const participants = ENABLE_DEV_MOCKS ? MOCK_PARTICIPANTS : {}
  const loadedItemCount = loadedItems.length
  const conversationItems = recentConversations ?? (ENABLE_DEV_MOCKS ? MOCK_RECENT_CONVERSATIONS : [])

  const filteredItems = useMemo(() => {
    const query = filesFilter.trim().toLowerCase()
    if (!query) return loadedItems
    return loadedItems.filter((item) => item.name.toLowerCase().includes(query))
  }, [filesFilter, loadedItems])

  const filteredActivity = useMemo(() => {
    const query = historyFilter.trim().toLowerCase()
    if (!query) return activityEntries

    return activityEntries.filter((entry) => {
      const actor = participants[entry.actorId]
      const searchable = [
        actor?.name,
        entry.actionType,
        entry.targetLabel,
        entry.timestampLabel,
      ].filter(Boolean).join(' ').toLowerCase()

      return searchable.includes(query)
    })
  }, [historyFilter, activityEntries, participants])

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
                <ConversationPlusIcon />
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
                  {connectors.map((connector) => {
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
            {renderSectionHeader('files', 'Arquivos e itens carregados', ConversationFilesIcon)}
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
                    const actor = participants[entry.actorId]
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
