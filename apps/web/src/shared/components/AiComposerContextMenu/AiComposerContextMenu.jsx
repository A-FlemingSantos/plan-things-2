import { useState, useEffect, useRef } from 'react'
import {
  MAX_COMPOSER_ATTACHMENTS,
  appendFilesAsAttachments,
  countAttachmentChips,
  createMockRecentAttachment,
  isAttachmentChip,
  partitionComposerChips,
  removeAttachmentChip,
} from '../ComposerAttachmentStrip/composerAttachmentUtils.js'
import {
  CardChipIcon,
  COMPOSER_CHIP_KIND_CARD,
  buildCardContextChipType,
  resolveComposerChipIcon,
} from '../ComposerChip/composerChipPresentation.jsx'
import styles from './AiComposerContextMenu.module.css'

/* ── Icons ─────────────────────────────────────────────────────── */
function PlusIcon()       { return <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 2v10M2 7h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg> }
function PlansIcon()      { return <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><rect x="2" y="2" width="12" height="3.2" rx="1.2" stroke="currentColor" strokeWidth="1.3"/><rect x="2" y="6.6" width="12" height="3.2" rx="1.2" stroke="currentColor" strokeWidth="1.3"/><rect x="2" y="11" width="7.5" height="3" rx="1.2" stroke="currentColor" strokeWidth="1.3"/></svg> }
function CardMenuIcon()   { return <svg width="14" height="14" viewBox="0 0 12 12" fill="none"><rect x="1.5" y="2" width="9" height="8" rx="1.6" stroke="currentColor" strokeWidth="1.2"/><path d="M3.5 5h5M3.5 6.75h3.25" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/></svg> }
function ClipIcon()       { return <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M12.8 7.2L7 13a4 4 0 0 1-5.6-5.6L8 1a2.5 2.5 0 0 1 3.5 3.5L5 11a1 1 0 0 1-1.4-1.4L9.5 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg> }
function FileDocIcon()    { return <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M9.5 2H4a1.5 1.5 0 0 0-1.5 1.5v9A1.5 1.5 0 0 0 4 14h8a1.5 1.5 0 0 0 1.5-1.5V6L9.5 2z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/><path d="M9.5 2v4H13.5" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/><path d="M5.5 9.5h5M5.5 11.5h3" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/></svg> }
function FileImageIcon()  { return <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><rect x="2" y="3" width="12" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.3"/><circle cx="5.5" cy="6.5" r="1" stroke="currentColor" strokeWidth="1.1"/><path d="M2 11l3.5-3.5 2.5 2.5 2-2 3 3" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round"/></svg> }
function InboxIcon()      { return <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M3 3h10v10H3V3z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/><path d="M3 9h3l1.2 2h1.6L10 9h3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg> }
function ConnectorsIcon() { return <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M2 2h11v3.5C15.5 5.5 15.5 9.5 13 9.5V13H9.5C9.5 10.5 5.5 10.5 5.5 13H2Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/></svg> }
function ChevronIcon()    { return <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M4.5 3l3 3-3 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg> }
function CheckIcon()      { return <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M2 6l2.5 2.5 5.5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg> }
function XSmallIcon()     { return <svg width="8" height="8" viewBox="0 0 10 10" fill="none"><path d="M1.5 1.5l7 7M8.5 1.5l-7 7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg> }

/* ── Brand logos ───────────────────────────────────────────────── */
const GitHubLogo = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path d="M8 1.4a6.6 6.6 0 0 0-2.1 12.85c.33.06.45-.14.45-.32v-1.2c-1.82.4-2.2-.77-2.2-.77-.3-.74-.73-.94-.73-.94-.6-.41.05-.4.05-.4.66.05 1 .67 1 .67.6 1 .15.52 1.5.4.05-.43.23-.73.42-.89-1.45-.16-2.98-.72-2.98-3.22 0-.71.25-1.3.67-1.75-.07-.16-.29-.82.06-1.7 0 0 .55-.18 1.8.67a6.26 6.26 0 0 1 3.28 0c1.24-.85 1.79-.67 1.79-.67.35.88.13 1.54.06 1.7.42.45.67 1.04.67 1.75 0 2.5-1.53 3.06-2.99 3.22.24.2.45.61.45 1.24v1.84c0 .18.12.38.46.31A6.6 6.6 0 0 0 8 1.4Z" fill="currentColor" />
  </svg>
)
const TeamsLogo = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <rect x="1.5" y="4" width="6.5" height="8" rx="1.6" fill="#4F52D9" />
    <rect x="8.3" y="5.1" width="5.7" height="7.4" rx="1.8" fill="#7B83EB" />
    <circle cx="11.15" cy="3.95" r="1.95" fill="#6264F5" />
    <circle cx="13.1" cy="6" r="1.4" fill="#8B8CC7" />
    <path d="M3.25 6.1h3.2v1.1H5.45v4.1h-1.2V7.2H3.25V6.1Z" fill="white" />
  </svg>
)
const SlackLogo = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
    <path fill="#E01E5A" d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zm1.271 0a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313z" />
    <path fill="#36C5F0" d="M8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zm1.271 0a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312z" />
    <path fill="#2EB67D" d="M18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zm-1.269 0a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312z" />
    <path fill="#ECB22E" d="M15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zm-1.269 0a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z" />
  </svg>
)

/* ── Static data ───────────────────────────────────────────────── */
const CONNECTORS = [
  { id: 'github', label: 'GitHub', Logo: GitHubLogo },
  { id: 'teams',  label: 'Teams',  Logo: TeamsLogo  },
  { id: 'slack',  label: 'Slack',  Logo: SlackLogo  },
]

const MOCK_PLANS = [
  { id: 'pl1', name: 'Lançamento v1.0', date: 'Atualizado hoje',  color: '#5B8AF5' },
  { id: 'pl2', name: 'Design System',   date: '23 de mai.',       color: '#E0953A' },
  { id: 'pl3', name: 'Onboarding',      date: '20 de mai.',       color: '#4DB88A' },
]

const MOCK_RECENT_FILES = [
  { id: 'rf1', name: 'design-system-v2.fig', date: '24 de mai., 21:26', type: 'doc'   },
  { id: 'rf2', name: 'requisitos.pdf',        date: '24 de mai., 20:10', type: 'doc'   },
  { id: 'rf3', name: 'wireframes.png',        date: '23 de mai., 15:42', type: 'image' },
  { id: 'rf4', name: 'sprint-notes.md',       date: '23 de mai., 12:00', type: 'doc'   },
]

const FILE_INPUT_ACCEPT = 'image/*,.pdf,.doc,.docx,.md,.fig,.txt,.csv,.xls,.xlsx,.ppt,.pptx'

const makePlanChipDot = (color) => function PlanChipDot() {
  return <svg width="8" height="8" viewBox="0 0 8 8"><circle cx="4" cy="4" r="4" fill={color} /></svg>
}

function normalizeChips(chips) {
  return Array.isArray(chips) ? chips : []
}

/* ── Component ─────────────────────────────────────────────────── */
export default function AiComposerContextMenu({ onChipsChange, initialChips, boardCards } = {}) {
  const showBoardCardsMenu = boardCards !== undefined
  const boardCardOptions = showBoardCardsMenu ? (Array.isArray(boardCards) ? boardCards : []) : []
  const entitySubmenuKey = showBoardCardsMenu ? 'cards' : 'plans'
  const [isMenuOpen, setIsMenuOpen]   = useState(false)
  const [openSubmenu, setOpenSubmenu] = useState(null)
  const [localChips, setLocalChips]   = useState(() => normalizeChips(initialChips))
  const isControlled                  = initialChips !== undefined && typeof onChipsChange === 'function'
  const chips                         = isControlled ? normalizeChips(initialChips) : localChips
  const { inlineChips }               = partitionComposerChips(chips)
  const attachmentCount               = countAttachmentChips(chips)
  const attachmentsFull               = attachmentCount >= MAX_COMPOSER_ATTACHMENTS

  const menuRef       = useRef(null)
  const buttonRef     = useRef(null)
  const fileInputRef  = useRef(null)

  const commitChips = (nextChips) => {
    if (!isControlled) {
      setLocalChips(nextChips)
    }
    onChipsChange?.(nextChips)
  }

  const toggleChip = (type, label, ChipIcon, kind) => {
    const nextChips = chips.some((c) => c.type === type)
      ? chips.filter((c) => c.type !== type)
      : [...chips, { id: `ctx-${type}`, type, label, ChipIcon, kind }]

    commitChips(nextChips)
  }

  const toggleRecentAttachment = (fileMeta) => {
    const attachment = createMockRecentAttachment(fileMeta)
    const isActive = chips.some((chip) => chip.type === attachment.type)

    if (isActive) {
      commitChips(removeAttachmentChip(chips, attachment.type))
      return
    }

    if (attachmentsFull) return

    commitChips([...chips, attachment])
  }

  const handleUploadClick = () => {
    if (attachmentsFull) return
    fileInputRef.current?.click()
  }

  const handleFileInputChange = async (event) => {
    const files = Array.from(event.target.files ?? [])
    event.target.value = ''

    if (files.length === 0) return

    const nextChips = await appendFilesAsAttachments(chips, files)
    commitChips(nextChips)
    closeAll()
  }

  const closeAll = () => { setIsMenuOpen(false); setOpenSubmenu(null) }

  useEffect(() => {
    if (!isMenuOpen) return undefined
    const onMouseDown = (e) => {
      if (buttonRef.current?.contains(e.target)) return
      if (menuRef.current?.contains(e.target)) return
      closeAll()
    }
    const onKeyDown = (e) => { if (e.key === 'Escape') closeAll() }
    document.addEventListener('mousedown', onMouseDown)
    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onMouseDown)
      window.removeEventListener('keydown', onKeyDown)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMenuOpen])

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={FILE_INPUT_ACCEPT}
        className={styles.hiddenFileInput}
        aria-hidden="true"
        tabIndex={-1}
        onChange={handleFileInputChange}
      />

      {/* ── Trigger button + menu ── */}
      <div className={styles.menuWrap}>
        <button
          ref={buttonRef}
          type="button"
          className={`${styles.button} ${isMenuOpen ? styles.buttonActive : ''}`}
          aria-label="Adicionar contexto ao chat"
          aria-haspopup="menu"
          aria-expanded={isMenuOpen}
          onClick={() => { setIsMenuOpen((v) => !v); setOpenSubmenu(null) }}
        >
          <PlusIcon />
        </button>

        {isMenuOpen ? (
          <div ref={menuRef} className={styles.menu} role="menu" aria-label="Adicionar contexto ao chat">

            {/* Planos (workspace) ou Cartões (Kanban) */}
            <div className={styles.submenuWrap}>
              <button
                type="button"
                className={`${styles.menuItem} ${openSubmenu === entitySubmenuKey ? styles.menuItemOpen : ''}`}
                role="menuitem"
                aria-haspopup="menu"
                aria-expanded={openSubmenu === entitySubmenuKey}
                onClick={() => setOpenSubmenu((v) => (v === entitySubmenuKey ? null : entitySubmenuKey))}
              >
                <span className={styles.menuItemIcon} aria-hidden="true">
                  {showBoardCardsMenu ? <CardMenuIcon /> : <PlansIcon />}
                </span>
                <span className={styles.menuItemLabel}>{showBoardCardsMenu ? 'Cartão' : 'Planos'}</span>
                <span className={`${styles.menuItemChevron} ${openSubmenu === entitySubmenuKey ? styles.menuItemChevronOpen : ''}`} aria-hidden="true"><ChevronIcon /></span>
              </button>
              {openSubmenu === entitySubmenuKey ? (
                <div
                  className={styles.submenu}
                  role="menu"
                  aria-label={showBoardCardsMenu ? 'Cartões do plano' : 'Planos'}
                >
                  <div className={styles.submenuHeader}>{showBoardCardsMenu ? 'Cartões' : 'Planos'}</div>
                  {showBoardCardsMenu ? (
                    boardCardOptions.length > 0 ? (
                      boardCardOptions.map(({ id, title, columnTitle }) => {
                        const chipType = buildCardContextChipType(id)
                        const active = chips.some((c) => c.type === chipType)
                        return (
                          <button
                            key={id}
                            type="button"
                            className={`${styles.planItem} ${active ? styles.menuItemActive : ''}`}
                            role="menuitem"
                            onClick={() => {
                              toggleChip(chipType, title, CardChipIcon, COMPOSER_CHIP_KIND_CARD)
                              closeAll()
                            }}
                          >
                            <span className={styles.cardMenuIcon} aria-hidden="true">
                              <CardChipIcon />
                            </span>
                            <span className={styles.planInfo}>
                              <span className={styles.planName}>{title}</span>
                              {columnTitle ? (
                                <span className={styles.planDate}>{columnTitle}</span>
                              ) : null}
                            </span>
                            {active ? <span className={styles.menuItemCheck} aria-hidden="true"><CheckIcon /></span> : null}
                          </button>
                        )
                      })
                    ) : (
                      <p className={styles.submenuEmpty}>Nenhum cartão neste plano</p>
                    )
                  ) : (
                    MOCK_PLANS.map(({ id, name, date, color }) => {
                      const chipType = `plan-${id}`
                      const active   = chips.some((c) => c.type === chipType)
                      const PlanDot  = makePlanChipDot(color)
                      return (
                        <button
                          key={id}
                          type="button"
                          className={`${styles.planItem} ${active ? styles.menuItemActive : ''}`}
                          role="menuitem"
                          onClick={() => { toggleChip(chipType, name, PlanDot, 'plan'); closeAll() }}
                        >
                          <span className={styles.planDot} style={{ background: color }} aria-hidden="true" />
                          <span className={styles.planInfo}>
                            <span className={styles.planName}>{name}</span>
                            <span className={styles.planDate}>{date}</span>
                          </span>
                          {active ? <span className={styles.menuItemCheck} aria-hidden="true"><CheckIcon /></span> : null}
                        </button>
                      )
                    })
                  )}
                </div>
              ) : null}
            </div>

            <div className={styles.menuDivider} role="separator" />

            {/* Adicionar arquivos */}
            <button
              type="button"
              className={`${styles.menuItem} ${attachmentsFull ? styles.menuItemDisabled : ''}`}
              role="menuitem"
              disabled={attachmentsFull}
              title={attachmentsFull ? `Limite de ${MAX_COMPOSER_ATTACHMENTS} arquivos atingido` : undefined}
              onClick={handleUploadClick}
            >
              <span className={styles.menuItemIcon} aria-hidden="true"><ClipIcon /></span>
              <span className={styles.menuItemLabel}>Adicionar arquivos</span>
            </button>

            {/* Arquivos recentes */}
            <div className={styles.submenuWrap}>
              <button
                type="button"
                className={`${styles.menuItem} ${openSubmenu === 'recentFiles' ? styles.menuItemOpen : ''}`}
                role="menuitem"
                aria-haspopup="menu"
                aria-expanded={openSubmenu === 'recentFiles'}
                onClick={() => setOpenSubmenu((v) => (v === 'recentFiles' ? null : 'recentFiles'))}
              >
                <span className={styles.menuItemIcon} aria-hidden="true"><FileDocIcon /></span>
                <span className={styles.menuItemLabel}>Arquivos recentes</span>
                <span className={`${styles.menuItemChevron} ${openSubmenu === 'recentFiles' ? styles.menuItemChevronOpen : ''}`} aria-hidden="true"><ChevronIcon /></span>
              </button>
              {openSubmenu === 'recentFiles' ? (
                <div className={`${styles.submenu} ${styles.submenuWide}`} role="menu" aria-label="Arquivos recentes">
                  <div className={styles.submenuHeader}>Arquivos recentes</div>
                  <div className={styles.submenuSection}>Recentes</div>
                  {MOCK_RECENT_FILES.map((fileMeta) => {
                    const { id, name, date, type } = fileMeta
                    const chipType    = `file-${id}`
                    const active      = chips.some((c) => c.type === chipType)
                    const FileTypeIcon = type === 'image' ? FileImageIcon : FileDocIcon
                    const disabled    = !active && attachmentsFull
                    return (
                      <button
                        key={id}
                        type="button"
                        className={`${styles.fileItem} ${active ? styles.menuItemActive : ''} ${disabled ? styles.menuItemDisabled : ''}`}
                        role="menuitem"
                        disabled={disabled}
                        title={disabled ? `Limite de ${MAX_COMPOSER_ATTACHMENTS} arquivos atingido` : undefined}
                        onClick={() => { toggleRecentAttachment(fileMeta); closeAll() }}
                      >
                        <span className={styles.fileIconWrap} aria-hidden="true"><FileTypeIcon /></span>
                        <span className={styles.fileInfo}>
                          <span className={styles.fileName}>{name}</span>
                          <span className={styles.fileDate}>{date}</span>
                        </span>
                        {active ? <span className={styles.menuItemCheck} aria-hidden="true"><CheckIcon /></span> : null}
                      </button>
                    )
                  })}
                </div>
              ) : null}
            </div>

            <div className={styles.menuDivider} role="separator" />

            {/* Inbox */}
            <button
              type="button"
              className={`${styles.menuItem} ${chips.some((c) => c.type === 'inbox') ? styles.menuItemActive : ''}`}
              role="menuitem"
              onClick={() => { toggleChip('inbox', 'Inbox', InboxIcon, 'context'); closeAll() }}
            >
              <span className={styles.menuItemIcon} aria-hidden="true"><InboxIcon /></span>
              <span className={styles.menuItemLabel}>Inbox</span>
              {chips.some((c) => c.type === 'inbox') ? <span className={styles.menuItemCheck} aria-hidden="true"><CheckIcon /></span> : null}
            </button>

            <div className={styles.menuDivider} role="separator" />

            {/* Conectores */}
            <div className={styles.submenuWrap}>
              <button
                type="button"
                className={`${styles.menuItem} ${openSubmenu === 'connectors' ? styles.menuItemOpen : ''}`}
                role="menuitem"
                aria-haspopup="menu"
                aria-expanded={openSubmenu === 'connectors'}
                onClick={() => setOpenSubmenu((v) => (v === 'connectors' ? null : 'connectors'))}
              >
                <span className={styles.menuItemIcon} aria-hidden="true"><ConnectorsIcon /></span>
                <span className={styles.menuItemLabel}>Conectores</span>
                <span className={`${styles.menuItemChevron} ${openSubmenu === 'connectors' ? styles.menuItemChevronOpen : ''}`} aria-hidden="true"><ChevronIcon /></span>
              </button>
              {openSubmenu === 'connectors' ? (
                <div className={styles.submenu} role="menu" aria-label="Conectores disponíveis">
                  {CONNECTORS.map(({ id, label, Logo }) => {
                    const active = chips.some((c) => c.type === id)
                    return (
                      <button
                        key={id}
                        type="button"
                        className={`${styles.connectorItem} ${active ? styles.menuItemActive : ''}`}
                        role="menuitem"
                        onClick={() => { toggleChip(id, label, Logo, 'connector'); closeAll() }}
                      >
                        <span className={styles.connectorLogo} aria-hidden="true"><Logo /></span>
                        <span>{label}</span>
                        {active ? <span className={styles.menuItemCheck} aria-hidden="true"><CheckIcon /></span> : null}
                      </button>
                    )
                  })}
                </div>
              ) : null}
            </div>

          </div>
        ) : null}
      </div>

      {/* ── Inline context chips (non-attachments) ── */}
      {inlineChips.length > 0 ? (
        <div className={styles.chips} role="group" aria-label="Contexto adicionado">
          {inlineChips.map((chip) => {
            const ChipIcon = resolveComposerChipIcon(chip)
            return (
              <div key={chip.id} className={styles.chip} data-kind={chip.kind}>
                {ChipIcon ? (
                  <span className={styles.chipIcon} aria-hidden="true">
                    <ChipIcon />
                  </span>
                ) : null}
                <span className={styles.chipLabel}>{chip.label}</span>
                <button
                  type="button"
                  className={styles.chipRemove}
                  aria-label={`Remover ${chip.label} do contexto`}
                  onClick={() => {
                    const nextChips = chips.filter((c) => c.type !== chip.type)
                    commitChips(nextChips)
                  }}
                >
                  <XSmallIcon />
                </button>
              </div>
            )
          })}
        </div>
      ) : null}
    </>
  )
}
