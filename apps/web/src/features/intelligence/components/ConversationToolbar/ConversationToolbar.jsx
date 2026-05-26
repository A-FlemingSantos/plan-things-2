import { useId, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AuthenticatedAvatar from '../../../../shared/components/AuthenticatedAvatar/AuthenticatedAvatar.jsx'
import CustomScrollArea from '../../../../shared/components/CustomScrollArea/CustomScrollArea.jsx'
import MemberAvatarStack from '../../../../shared/components/MemberAvatarStack/MemberAvatarStack.jsx'
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
    description: 'Anexou requisitos.pdf',
    timestampLabel: '26 mai, 14:32',
    occurredAt: '2026-05-26T14:32:00',
  },
  {
    id: 'act-2',
    actorId: 'm2',
    description: 'Compartilhou repositório do GitHub',
    timestampLabel: '26 mai, 13:18',
    occurredAt: '2026-05-26T13:18:00',
  },
  {
    id: 'act-3',
    actorId: 'm3',
    description: 'Referenciou plano Design System',
    timestampLabel: '26 mai, 11:05',
    occurredAt: '2026-05-26T11:05:00',
  },
  {
    id: 'act-4',
    actorId: 'm4',
    description: 'Adicionou wireframes.fig',
    timestampLabel: '25 mai, 17:44',
    occurredAt: '2026-05-25T17:44:00',
  },
  {
    id: 'act-5',
    actorId: 'intelligence',
    description: 'Criou plano Lançamento v1.0',
    timestampLabel: '25 mai, 16:20',
    occurredAt: '2026-05-25T16:20:00',
  },
  {
    id: 'act-6',
    actorId: 'intelligence',
    description: 'Editou arquivo requisitos.pdf',
    timestampLabel: '25 mai, 15:02',
    occurredAt: '2026-05-25T15:02:00',
  },
  {
    id: 'act-7',
    actorId: 'm1',
    description: 'Conectou Slack ao chat',
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

const MOCK_CONNECTORS = [
  { id: 'github', name: 'GitHub' },
  { id: 'slack', name: 'Slack' },
  { id: 'teams', name: 'Teams' },
]

const MOCK_CONVERSATION_MEMBERS = [
  { id: 'm1', initials: 'AS', color: '#000', name: 'Ana Silva' },
  { id: 'm2', initials: 'MK', color: '#d4aef1', name: 'Maria Klink' },
  { id: 'm3', initials: 'TK', color: '#4290da', name: 'Tom Kobayashi' },
  { id: 'm4', initials: 'SR', color: '#0f703a', name: 'Sara Ribeiro' },
]

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
  return 'Área de trabalho'
}

function resolveScopeKind({ planId, cardId }) {
  if (cardId) return 'Card'
  if (planId) return 'Plano'
  return 'Workspace'
}

export default function ConversationToolbar({
  conversationTitle = 'Nova conversa',
  planId = null,
  planName = null,
  cardId = null,
  cardTitle = null,
  activeConnectors = [],
}) {
  const navigate = useNavigate()
  const panelId = useId()
  const [isExpanded, setIsExpanded] = useState(false)
  const [openSections, setOpenSections] = useState({})
  const [filesFilter, setFilesFilter] = useState('')
  const [historyFilter, setHistoryFilter] = useState('')

  const scopeLabel = resolveScopeLabel({ planId, planName, cardId, cardTitle })
  const scopeKind = resolveScopeKind({ planId, cardId })
  const loadedItemCount = MOCK_LOADED_ITEMS.length

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
        entry.description,
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
          <MemberAvatarStack
            members={MOCK_CONVERSATION_MEMBERS}
            className={styles.toolbarAvatarStack}
            size="compact"
          />
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
              <button type="button" className={styles.sectionAction} aria-label="Nova conversa">
                <PlusIcon />
              </button>
            ))}
            {openSections.conversations ? (
              <div id={sectionIds.conversations} className={styles.sectionBody}>
                <ul className={styles.list}>
                  {MOCK_RECENT_CONVERSATIONS.map((conversation) => (
                    <li key={conversation.id} className={styles.listItem}>
                      <span className={styles.listItemLabel}>{conversation.title}</span>
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
                    const isActive = activeConnectors.includes(connector.id)
                    return (
                      <li key={connector.id} className={styles.listItem}>
                        <div className={styles.changeRow}>
                          <span className={styles.listItemLabel}>{connector.name}</span>
                          <span
                            className={`${styles.statusBadge} ${isActive ? styles.statusApplied : styles.statusRejected}`}
                          >
                            {isActive ? 'Ativo' : 'Inativo'}
                          </span>
                        </div>
                        <button
                          type="button"
                          className={styles.listItemAction}
                          aria-label={isActive ? `Desconectar ${connector.name}` : `Conectar ${connector.name}`}
                        >
                          {isActive ? 'Desconectar' : 'Conectar'}
                        </button>
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
                          <span className={styles.activityDescription}>{entry.description}</span>
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
