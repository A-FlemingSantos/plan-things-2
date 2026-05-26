import { useId, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
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

const MOCK_CHANGES = [
  { id: 'change-1', title: 'Criar plano "Sprint 3"', status: 'pending', statusLabel: 'Pendente' },
  { id: 'change-2', title: 'Atualizar labels do board', status: 'applied', statusLabel: 'Aplicado' },
  { id: 'change-3', title: 'Criar card "Backlog"', status: 'created', statusLabel: 'Criado' },
  { id: 'change-4', title: 'Convidar membro', status: 'rejected', statusLabel: 'Rejeitado' },
  { id: 'change-5', title: 'Adicionar card "Login UI"', status: 'failed', statusLabel: 'Falha' },
]

const MOCK_CONNECTORS = [
  { id: 'github', name: 'GitHub' },
  { id: 'slack', name: 'Slack' },
  { id: 'teams', name: 'Teams' },
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

function ContextIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="8" cy="8" r="5.2" stroke="currentColor" strokeWidth="1.2" />
      <circle cx="8" cy="8" r="1.6" fill="currentColor" />
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

  const filteredChanges = useMemo(() => {
    const query = historyFilter.trim().toLowerCase()
    if (!query) return MOCK_CHANGES
    return MOCK_CHANGES.filter((change) => change.title.toLowerCase().includes(query))
  }, [historyFilter])

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
    context: `${panelId}-context`,
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
        <div id={panelId} className={styles.toolbarPanel}>
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
            {renderSectionHeader('context', 'Contexto', ContextIcon, (
              <>
                <button type="button" className={styles.sectionAction} aria-label="Abrir escopo">
                  Abrir
                </button>
                <button type="button" className={styles.sectionAction} aria-label="Trocar escopo">
                  Trocar
                </button>
              </>
            ))}
            {openSections.context ? (
              <div
                id={sectionIds.context}
                className={styles.sectionBody}
                role="group"
                aria-label="Contexto"
              >
                <div className={styles.contextRows}>
                  <div className={styles.contextRow}>
                    <span className={styles.contextRowKind}>Workspace</span>
                    <span className={styles.contextRowValue}>Área de trabalho</span>
                  </div>
                  {planId ? (
                    <div className={styles.contextRow}>
                      <span className={styles.contextRowKind}>Plano</span>
                      <span className={styles.contextRowValue}>{planName || planId}</span>
                    </div>
                  ) : null}
                  {cardId ? (
                    <div className={styles.contextRow}>
                      <span className={styles.contextRowKind}>Card</span>
                      <span className={styles.contextRowValue}>{cardTitle || cardId}</span>
                    </div>
                  ) : null}
                </div>
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
            {renderSectionHeader('history', 'Alterações recentes', HistoryIcon, (
              <button type="button" className={styles.sectionAction} aria-label="Filtrar histórico">
                Filtrar
              </button>
            ))}
            {openSections.history ? (
              <div id={sectionIds.history} className={styles.sectionBody}>
                <label className={styles.filterField}>
                  <span className={styles.visuallyHidden}>Filtrar histórico de alterações</span>
                  <input
                    type="search"
                    className={styles.filterInput}
                    value={historyFilter}
                    onChange={(event) => setHistoryFilter(event.target.value)}
                    placeholder="Filtrar alterações..."
                    aria-label="Filtrar histórico de alterações"
                  />
                </label>
                <ul className={styles.list}>
                  {filteredChanges.map((change) => (
                    <li key={change.id} className={styles.listItem}>
                      <div className={styles.changeRow}>
                        <span className={styles.listItemLabel}>{change.title}</span>
                        <span className={`${styles.statusBadge} ${styles[`status${change.status.charAt(0).toUpperCase()}${change.status.slice(1)}`]}`}>
                          {change.statusLabel}
                        </span>
                      </div>
                      <button
                        type="button"
                        className={styles.listItemAction}
                        aria-label={`Abrir alteração "${change.title}"`}
                      >
                        Abrir
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </section>
        </div>
      ) : null}
    </div>
  )
}
