import { useState, useRef, useCallback, useEffect, useLayoutEffect } from 'react'
import styles from './CanvasPage.module.css'

/* ═══════════════════════════════════════════════════════
   CONSTANTS
═══════════════════════════════════════════════════════ */
const CARD_W    = 230
const MIN_ZOOM  = 0.2
const MAX_ZOOM  = 3
const uid       = () => Math.random().toString(36).slice(2, 9)

const CARD_COLORS = [
  { id: 'stone',  accent: '#1a1a1a', bg: '#ffffff', border: '#e0e0e0' },
  { id: 'blue',   accent: '#4290da', bg: '#f0f7ff', border: '#bdd8f5' },
  { id: 'purple', accent: '#9b7ec8', bg: '#f7f3ff', border: '#d8c8f0' },
  { id: 'green',  accent: '#0f703a', bg: '#f0fbf4', border: '#b3e0c6' },
  { id: 'red',    accent: '#d94f4f', bg: '#fff4f4', border: '#f5c6c6' },
  { id: 'amber',  accent: '#c47800', bg: '#fffbf0', border: '#f0d8a0' },
]

const TOOLS = [
  { id: 'select',  label: 'Select',  key: 'v', tip: 'Select & move (V)' },
  { id: 'pan',     label: 'Pan',     key: 'h', tip: 'Pan canvas (H)' },
  { id: 'card',    label: 'Card',    key: 'c', tip: 'Add card (C)' },
  { id: 'connect', label: 'Connect', key: 'l', tip: 'Link cards (L)' },
  { id: 'delete',  label: 'Delete',  key: 'd', tip: 'Delete (D)' },
]

const INIT_CARDS = [
  { id: 'c1', x: 160,  y: 160,  h: 130, title: 'Product Vision',  content: 'Build the most intuitive project management tool for modern teams who think clearly.', colorId: 'stone'  },
  { id: 'c2', x: 500,  y: 80,   h: 130, title: 'User Research',   content: 'Interview 20 active users. Identify the top 3 pain points in their current workflow.', colorId: 'blue'   },
  { id: 'c3', x: 500,  y: 320,  h: 130, title: 'Design System',   content: 'Tokens, components, patterns. Single source of truth for all product decisions.',       colorId: 'purple' },
  { id: 'c4', x: 850,  y: 200,  h: 130, title: 'Q3 Launch',       content: 'Public release: September 15. Prepare changelog, press kit, and onboarding flow.',      colorId: 'green'  },
]
const INIT_CONNS = [
  { id: 'k1', from: 'c1', to: 'c2' },
  { id: 'k2', from: 'c1', to: 'c3' },
  { id: 'k3', from: 'c2', to: 'c4' },
  { id: 'k4', from: 'c3', to: 'c4' },
]

/* ═══════════════════════════════════════════════════════
   ICONS
═══════════════════════════════════════════════════════ */
const Ic = {
  Logo:     () => <svg width="17" height="17" viewBox="0 0 20 20" fill="none"><rect x="2" y="2" width="7" height="7" rx="2" fill="currentColor"/><rect x="11" y="2" width="7" height="7" rx="2" fill="currentColor" opacity=".35"/><rect x="2" y="11" width="7" height="7" rx="2" fill="currentColor" opacity=".55"/><rect x="11" y="11" width="7" height="7" rx="2" fill="currentColor" opacity=".75"/></svg>,
  Home:     () => <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><path d="M2 6.5L8 2l6 4.5V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V6.5z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/><path d="M6 15V9h4v6" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/></svg>,
  Calendar: () => <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><rect x="1.5" y="3" width="13" height="12" rx="2" stroke="currentColor" strokeWidth="1.3"/><path d="M5 1.5V4M11 1.5V4M1.5 7h13" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>,
  Canvas:   () => <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><rect x="1.5" y="1.5" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.3"/><rect x="8.5" y="1.5" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.3"/><rect x="1.5" y="8.5" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.3"/><rect x="8.5" y="8.5" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.3"/></svg>,
  Chat:     () => <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><path d="M14 8.5A6 6 0 0 1 4.5 13.5L1.5 14.5l1-3A6 6 0 1 1 14 8.5z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/></svg>,
  Files:    () => <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><path d="M9 1.5H4a1.5 1.5 0 0 0-1.5 1.5v10A1.5 1.5 0 0 0 4 14.5h8A1.5 1.5 0 0 0 13.5 13V6L9 1.5z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/><path d="M9 1.5V6H13.5" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/></svg>,
  Chevron:  () => <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M4.5 3l3 3-3 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  ChevDown: () => <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M3 4.5l3 3 3-3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  ChevUp:   () => <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M3 7.5l3-3 3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  Plus:     () => <svg width="13" height="13" viewBox="0 0 14 14" fill="none"><path d="M7 2v10M2 7h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>,
  Minus:    () => <svg width="13" height="13" viewBox="0 0 14 14" fill="none"><path d="M2 7h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>,
  X:        () => <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 2l8 8M10 2l-8 8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>,
  More:     () => <svg width="13" height="13" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="3.5" r="1.1" fill="currentColor"/><circle cx="7" cy="7" r="1.1" fill="currentColor"/><circle cx="7" cy="10.5" r="1.1" fill="currentColor"/></svg>,
  Fit:      () => <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M1.5 4.5V2.5a1 1 0 0 1 1-1h2M9 1.5h2a1 1 0 0 1 1 1v2M12.5 9.5v2a1 1 0 0 1-1 1H9M4.5 12.5h-2a1 1 0 0 1-1-1v-2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>,

  // Tool icons
  Select:  () => <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2.5 1.5l9 5.5-5 1-2.5 4.5L2.5 1.5z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/></svg>,
  Pan:     () => <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 1.5V4M7 10V12.5M1.5 7H4M10 7h2.5M3.5 3.5L5 5M9 9l1.5 1.5M10.5 3.5L9 5M5 9l-1.5 1.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>,
  Card:    () => <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="1.5" y="3" width="11" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.3"/><path d="M1.5 6h11" stroke="currentColor" strokeWidth="1.3"/><path d="M5 9h4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>,
  Connect: () => <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="3" cy="7" r="2" stroke="currentColor" strokeWidth="1.3"/><circle cx="11" cy="7" r="2" stroke="currentColor" strokeWidth="1.3"/><path d="M5 7h4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>,
  Delete:  () => <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 4h10M5 4V2.5h4V4M5.5 6.5v4M8.5 6.5v4M3 4l.8 8h6.4L11 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  Palette: () => <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.2"/><circle cx="4" cy="5" r="1" fill="currentColor"/><circle cx="8" cy="5" r="1" fill="currentColor"/><circle cx="6" cy="8" r="1" fill="currentColor"/></svg>,
}

const TOOL_ICONS = {
  select: Ic.Select, pan: Ic.Pan, card: Ic.Card, connect: Ic.Connect, delete: Ic.Delete,
}

/* ═══════════════════════════════════════════════════════
   SIDEBAR
═══════════════════════════════════════════════════════ */
const NAV = [
  { id: 'home',     Icon: Ic.Home     },
  { id: 'calendar', Icon: Ic.Calendar },
  { id: 'canvas',   Icon: Ic.Canvas   },
  { id: 'chat',     Icon: Ic.Chat     },
  { id: 'files',    Icon: Ic.Files    },
]
const NAV_LABELS = { home: 'Home', calendar: 'Calendar', canvas: 'Canvas', chat: 'Chat', files: 'Files' }
const NAV_PATHS = {
  home: '/workspace',
  canvas: '/canvas',
}

function getActiveNav(pathname) {
  if (
    pathname === '/canvas' ||
    pathname.startsWith('/canvas/') ||
    pathname === '/workspace/canvas' ||
    pathname === '/app/canvas'
  ) {
    return 'canvas'
  }

  return 'home'
}

function Sidebar({ collapsed, onCollapse }) {
  const [active, setActive] = useState(() => getActiveNav(window.location.pathname))

  const handleNavItemClick = (id) => {
    const nextPath = NAV_PATHS[id]

    if (nextPath) {
      window.location.href = nextPath
      return
    }

    setActive(id)
  }

  return (
    <aside className={`${styles.sidebar} ${collapsed ? styles.sidebarCollapsed : ''}`}>
      <div className={styles.sidebarTop}>
        <div className={styles.logoRow}>
          <a href="/workspace" className={styles.sidebarLogo}>
            <span className={styles.sidebarLogoMark}><Ic.Logo /></span>
            <span className={styles.sidebarLogoText}>Plan Things</span>
          </a>
          <button className={styles.collapseBtn} onClick={onCollapse}>
            <span className={`${styles.collapseBtnIcon} ${collapsed ? styles.collapseBtnFlipped : ''}`}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M9 2L5 7l4 5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </span>
          </button>
        </div>

        <button className={`${styles.workspacePicker} ${collapsed ? styles.workspacePickerHidden : ''}`}>
          <span className={styles.wsAvatar}>A</span>
          <span className={styles.wsName}>Arthur's workspace</span>
          <span className={styles.wsChevron}><Ic.Chevron /></span>
        </button>

        <nav className={styles.nav}>
          {NAV.map(({ id, Icon }) => (
            <button key={id} className={`${styles.navItem} ${active === id ? styles.navItemActive : ''}`}
              onClick={() => handleNavItemClick(id)} title={collapsed ? NAV_LABELS[id] : undefined}>
              <span className={styles.navIcon}><Icon /></span>
              <span className={styles.navLabel}>{NAV_LABELS[id]}</span>
            </button>
          ))}
        </nav>
      </div>

      {!collapsed && (
        <div className={styles.sidebarPlans}>
          <p className={styles.sidebarSectionLabel}>Plans</p>
          {[
            { name: 'Product Launch — Q3', color: '#4290da' },
            { name: 'API Redesign',        color: '#0f703a' },
            { name: 'Brand Identity 2025', color: '#d4aef1' },
          ].map(p => (
            <button key={p.name} className={styles.sidebarPlanItem}>
              <span className={styles.sidebarPlanDot} style={{ background: p.color }} />
              <span className={styles.sidebarPlanName}>{p.name}</span>
            </button>
          ))}
        </div>
      )}

      <div className={styles.userSection}>
        <button className={`${styles.userBtn} ${collapsed ? styles.userBtnCollapsed : ''}`}>
          <span className={styles.userAvatar}>AS</span>
          <span className={styles.userDetails}>
            <span className={styles.userName}>Arthur Santos</span>
            <span className={styles.userPlan}>Professional</span>
          </span>
        </button>
      </div>
    </aside>
  )
}

/* ═══════════════════════════════════════════════════════
   CANVAS CARD
═══════════════════════════════════════════════════════ */
function CanvasCard({
  card, selected, isConnectSource, isConnectTarget,
  tool, onPointerDown, onCardClick, onUpdate, onHeightChange,
}) {
  const ref          = useRef(null)
  const color        = CARD_COLORS.find(c => c.id === card.colorId) || CARD_COLORS[0]
  const [showMenu, setShowMenu] = useState(false)
  const menuRef      = useRef(null)

  // Report height for connection calculations
  useLayoutEffect(() => {
    if (ref.current) onHeightChange(card.id, ref.current.offsetHeight)
  })

  // Close color menu on outside click
  useEffect(() => {
    if (!showMenu) return
    const handler = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setShowMenu(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [showMenu])

  const isInteractive = tool === 'select'

  const cardCursor =
    tool === 'select'  ? 'default' :
    tool === 'pan'     ? 'grab'    :
    tool === 'card'    ? 'crosshair':
    tool === 'connect' ? 'cell'    :
    tool === 'delete'  ? 'not-allowed' : 'default'

  return (
    <div
      ref={ref}
      className={`
        ${styles.card}
        ${selected        ? styles.cardSelected       : ''}
        ${isConnectSource ? styles.cardConnectSource  : ''}
        ${isConnectTarget ? styles.cardConnectTarget  : ''}
        ${tool === 'delete' ? styles.cardDeleteHover  : ''}
      `}
      style={{
        position: 'absolute',
        left: card.x,
        top:  card.y,
        width: CARD_W,
        background: color.bg,
        borderColor: selected ? color.accent : color.border,
        cursor: cardCursor,
        '--accent': color.accent,
      }}
      onPointerDown={e => {
        e.stopPropagation()
        onPointerDown(e, card.id)
      }}
      onClick={e => {
        e.stopPropagation()
        onCardClick(card.id)
      }}
    >
      {/* Left accent bar */}
      <div className={styles.cardAccent} style={{ background: color.accent }} />

      {/* Card content */}
      <div className={styles.cardInner}>
        <div className={styles.cardTitleRow}>
          <input
            className={styles.cardTitle}
            value={card.title}
            placeholder="Untitled"
            onChange={e => onUpdate({ ...card, title: e.target.value })}
            onPointerDown={e => e.stopPropagation()}
            onClick={e => e.stopPropagation()}
            style={{ cursor: isInteractive ? 'text' : 'inherit', color: color.accent }}
          />
          <div className={styles.cardMenuWrap} ref={menuRef}>
            <button
              className={styles.cardMenuBtn}
              onPointerDown={e => e.stopPropagation()}
              onClick={e => { e.stopPropagation(); setShowMenu(v => !v) }}
            >
              <Ic.More />
            </button>
            {showMenu && (
              <div className={styles.cardMenu}>
                <div className={styles.cardMenuColors}>
                  {CARD_COLORS.map(c => (
                    <button
                      key={c.id}
                      className={`${styles.cardMenuSwatch} ${card.colorId === c.id ? styles.cardMenuSwatchActive : ''}`}
                      style={{ background: c.accent }}
                      onClick={() => { onUpdate({ ...card, colorId: c.id }); setShowMenu(false) }}
                      title={c.id}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <textarea
          className={styles.cardContent}
          value={card.content}
          placeholder="Add content…"
          rows={3}
          onChange={e => onUpdate({ ...card, content: e.target.value })}
          onPointerDown={e => e.stopPropagation()}
          onClick={e => e.stopPropagation()}
          style={{ cursor: isInteractive ? 'text' : 'inherit' }}
        />
      </div>

      {/* Connect port indicator (shown in connect mode) */}
      {tool === 'connect' && (
        <>
          <div className={styles.portLeft}  />
          <div className={styles.portRight} />
        </>
      )}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════
   CONNECTIONS SVG
═══════════════════════════════════════════════════════ */
function ConnectionsSVG({ connections, cards, pan, zoom, cardHeights, tool, onDeleteConn, connectFrom, svgMouse }) {
  const getCardCenter = useCallback((cardId) => {
    const card = cards.find(c => c.id === cardId)
    if (!card) return null
    const h = cardHeights.current[cardId] || 130
    return {
      x: (card.x + CARD_W / 2) * zoom + pan.x,
      y: (card.y + h / 2)      * zoom + pan.y,
    }
  }, [cards, pan, zoom, cardHeights])

  const makePath = (sx, sy, ex, ey) => {
    const mx = (sx + ex) / 2
    return `M ${sx.toFixed(1)} ${sy.toFixed(1)} C ${mx.toFixed(1)} ${sy.toFixed(1)}, ${mx.toFixed(1)} ${ey.toFixed(1)}, ${ex.toFixed(1)} ${ey.toFixed(1)}`
  }

  // In-progress connection
  let inProgress = null
  if (connectFrom && svgMouse) {
    const src = getCardCenter(connectFrom)
    if (src) {
      inProgress = makePath(src.x, src.y, svgMouse.x, svgMouse.y)
    }
  }

  return (
    <svg className={styles.connectionsSvg} style={{ pointerEvents: 'none' }}>
      <defs>
        <marker id="arrowNormal" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
          <path d="M0 0.5 L7.5 3 L0 5.5 Z" fill="#a0a0a0" />
        </marker>
        <marker id="arrowDelete" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
          <path d="M0 0.5 L7.5 3 L0 5.5 Z" fill="#ff6766" />
        </marker>
      </defs>

      {/* Existing connections */}
      {connections.map(conn => {
        const src = getCardCenter(conn.from)
        const dst = getCardCenter(conn.to)
        if (!src || !dst) return null
        const d = makePath(src.x, src.y, dst.x, dst.y)
        const isDeleteMode = tool === 'delete'
        return (
          <g key={conn.id}>
            {/* Wide invisible clickable area */}
            <path
              d={d}
              stroke="transparent"
              strokeWidth={isDeleteMode ? 18 : 10}
              fill="none"
              style={{ cursor: isDeleteMode ? 'pointer' : 'default', pointerEvents: 'stroke' }}
              onClick={() => isDeleteMode && onDeleteConn(conn.id)}
            />
            {/* Visual path */}
            <path
              d={d}
              stroke={isDeleteMode ? '#ff6766' : '#c8c8c8'}
              strokeWidth={isDeleteMode ? 2 : 1.5}
              fill="none"
              strokeDasharray={isDeleteMode ? '4 3' : 'none'}
              markerEnd={`url(#${isDeleteMode ? 'arrowDelete' : 'arrowNormal'})`}
              style={{ pointerEvents: 'none', transition: 'stroke 0.15s ease' }}
            />
          </g>
        )
      })}

      {/* In-progress connection */}
      {inProgress && (
        <path
          d={inProgress}
          stroke="#4290da"
          strokeWidth={1.5}
          fill="none"
          strokeDasharray="6 4"
          opacity={0.8}
        />
      )}
    </svg>
  )
}

/* ═══════════════════════════════════════════════════════
   TOOLBAR
═══════════════════════════════════════════════════════ */
function Toolbar({ tool, setTool, zoom, onZoomIn, onZoomOut, onFit, open, onToggle }) {
  const ActiveIcon = TOOL_ICONS[tool]
  const activeTool = TOOLS.find(t => t.id === tool)

  return (
    <div className={styles.toolbarWrap}>
      {/* Handle — always visible */}
      <button className={styles.toolbarHandle} onClick={onToggle} title="Toggle toolbar">
        <span className={styles.toolbarHandleIcon}><ActiveIcon /></span>
        <span className={styles.toolbarHandleLabel}>{activeTool?.label}</span>
        <span className={`${styles.toolbarHandleChevron} ${open ? styles.toolbarHandleChevronUp : ''}`}>
          <Ic.ChevDown />
        </span>
      </button>

      {/* Drop-down panel */}
      {open && (
        <div className={styles.toolbarPanel}>
          {/* Tool group */}
          <div className={styles.toolbarGroup}>
            {TOOLS.map(t => {
              const TIcon = TOOL_ICONS[t.id]
              return (
                <button
                  key={t.id}
                  className={`${styles.toolbarBtn} ${tool === t.id ? styles.toolbarBtnActive : ''}`}
                  onClick={() => setTool(t.id)}
                  title={t.tip}
                >
                  <TIcon />
                  <span className={styles.toolbarBtnLabel}>{t.label}</span>
                </button>
              )
            })}
          </div>

          <div className={styles.toolbarDivider} />

          {/* Zoom group */}
          <div className={styles.toolbarGroup}>
            <button className={styles.toolbarIconBtn} onClick={onZoomOut} title="Zoom out">
              <Ic.Minus />
            </button>
            <span className={styles.toolbarZoomLabel}>{Math.round(zoom * 100)}%</span>
            <button className={styles.toolbarIconBtn} onClick={onZoomIn} title="Zoom in">
              <Ic.Plus />
            </button>
            <div className={styles.toolbarMiniDivider} />
            <button className={styles.toolbarIconBtn} onClick={onFit} title="Fit to view">
              <Ic.Fit />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════
   EMPTY STATE HINT
═══════════════════════════════════════════════════════ */
function EmptyHint({ tool }) {
  if (tool !== 'card') return null
  return (
    <div className={styles.emptyHint} style={{ pointerEvents: 'none' }}>
      <span className={styles.emptyHintIcon}><Ic.Card /></span>
      Click anywhere on the canvas to place a card
    </div>
  )
}

/* ═══════════════════════════════════════════════════════
   MAIN CANVAS PAGE
═══════════════════════════════════════════════════════ */
export default function CanvasPage() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [toolbarOpen,      setToolbarOpen]      = useState(true)
  const [tool,             setTool]             = useState('select')
  const [cards,            setCards]            = useState(INIT_CARDS)
  const [connections,      setConnections]      = useState(INIT_CONNS)
  const [pan,              setPan]              = useState({ x: 60, y: 40 })
  const [zoom,             setZoom]             = useState(1)
  const [selected,         setSelected]         = useState(null)
  const [connectFrom,      setConnectFrom]      = useState(null)
  const [svgMouse,         setSvgMouse]         = useState(null)

  // Mutable interaction refs
  const canvasRef       = useRef(null)
  const isPanning       = useRef(false)
  const lastMouse       = useRef({ x: 0, y: 0 })
  const draggingCard    = useRef(null)   // { cardId, startMX, startMY, startCX, startCY }
  const didMove         = useRef(false)
  const cardHeights     = useRef({})     // { cardId: heightPx }

  /* ── Keyboard shortcuts ── */
  useEffect(() => {
    const onKey = (e) => {
      if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return
      const t = TOOLS.find(t => t.key === e.key.toLowerCase())
      if (t) setTool(t.id)
      if (e.key === 'Escape') { setSelected(null); setConnectFrom(null); setSvgMouse(null) }
      if ((e.key === 'Delete' || e.key === 'Backspace') && selected && tool === 'select') {
        setCards(prev => prev.filter(c => c.id !== selected))
        setConnections(prev => prev.filter(c => c.from !== selected && c.to !== selected))
        setSelected(null)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [selected, tool])

  /* ── Canvas pointer events ── */
  const handleCanvasPointerDown = useCallback((e) => {
    if (e.target !== canvasRef.current && !e.target.classList.contains(styles.canvasGrid)) return
    didMove.current = false
    lastMouse.current = { x: e.clientX, y: e.clientY }

    if (tool === 'pan' || tool === 'select') {
      isPanning.current = true
      setSelected(null)
      canvasRef.current.setPointerCapture(e.pointerId)
    }
  }, [tool])

  const handlePointerMove = useCallback((e) => {
    const dx = e.clientX - lastMouse.current.x
    const dy = e.clientY - lastMouse.current.y
    if (Math.abs(dx) > 1 || Math.abs(dy) > 1) didMove.current = true

    // Update SVG mouse for in-progress connection
    if (connectFrom && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect()
      setSvgMouse({ x: e.clientX - rect.left, y: e.clientY - rect.top })
    }

    if (draggingCard.current) {
      const { cardId, startMX, startMY, startCX, startCY } = draggingCard.current
      const cdx = (e.clientX - startMX) / zoom
      const cdy = (e.clientY - startMY) / zoom
      setCards(prev => prev.map(c =>
        c.id === cardId ? { ...c, x: startCX + cdx, y: startCY + cdy } : c
      ))
      return
    }

    if (isPanning.current) {
      setPan(prev => ({ x: prev.x + dx, y: prev.y + dy }))
      lastMouse.current = { x: e.clientX, y: e.clientY }
    }
  }, [zoom, connectFrom])

  const handlePointerUp = useCallback((e) => {
    const wasDraggingCard = draggingCard.current && didMove.current
    draggingCard.current = null
    isPanning.current    = false

    if (!didMove.current && tool === 'card') {
      // Place card at click position
      const rect = canvasRef.current.getBoundingClientRect()
      const cx = (e.clientX - rect.left - pan.x) / zoom
      const cy = (e.clientY - rect.top  - pan.y) / zoom
      const newCard = {
        id: uid(), x: cx - CARD_W / 2, y: cy - 65, h: 130,
        title: '', content: '', colorId: 'stone',
      }
      setCards(prev => [...prev, newCard])
      setSelected(newCard.id)
      setTool('select')
    }
    didMove.current = false
  }, [tool, pan, zoom])

  /* ── Card pointer events ── */
  const handleCardPointerDown = useCallback((e, cardId) => {
    if (tool !== 'select') return
    didMove.current = false
    const card = cards.find(c => c.id === cardId)
    if (!card) return
    draggingCard.current = {
      cardId, startMX: e.clientX, startMY: e.clientY, startCX: card.x, startCY: card.y,
    }
    setSelected(cardId)
    canvasRef.current?.setPointerCapture(e.pointerId)
  }, [tool, cards])

  const handleCardClick = useCallback((cardId) => {
    if (didMove.current) return

    if (tool === 'select') {
      setSelected(cardId)
    } else if (tool === 'connect') {
      if (!connectFrom) {
        setConnectFrom(cardId)
      } else if (connectFrom !== cardId) {
        // Avoid duplicate connections
        const alreadyExists = connections.some(
          c => (c.from === connectFrom && c.to === cardId) ||
               (c.from === cardId && c.to === connectFrom)
        )
        if (!alreadyExists) {
          setConnections(prev => [...prev, { id: uid(), from: connectFrom, to: cardId }])
        }
        setConnectFrom(null)
        setSvgMouse(null)
      } else {
        // Clicked same card — cancel
        setConnectFrom(null)
        setSvgMouse(null)
      }
    } else if (tool === 'delete') {
      setCards(prev => prev.filter(c => c.id !== cardId))
      setConnections(prev => prev.filter(c => c.from !== cardId && c.to !== cardId))
      if (selected === cardId) setSelected(null)
    }
  }, [tool, connectFrom, connections, selected])

  /* ── Wheel zoom (cursor-centered) ── */
  const handleWheel = useCallback((e) => {
    e.preventDefault()
    const factor = e.ctrlKey ? 0.012 : 0.0008 * Math.abs(e.deltaY)
    const dir    = e.deltaY > 0 ? -1 : 1
    setZoom(prev => {
      const next = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, prev + dir * factor * prev))
      const rect = canvasRef.current.getBoundingClientRect()
      const mx   = e.clientX - rect.left
      const my   = e.clientY - rect.top
      const cx   = (mx - pan.x) / prev
      const cy   = (my - pan.y) / prev
      setPan({ x: mx - cx * next, y: my - cy * next })
      return next
    })
  }, [pan])

  useEffect(() => {
    const el = canvasRef.current
    if (!el) return
    el.addEventListener('wheel', handleWheel, { passive: false })
    return () => el.removeEventListener('wheel', handleWheel)
  }, [handleWheel])

  /* ── Fit to view ── */
  const fitView = useCallback(() => {
    if (!cards.length || !canvasRef.current) return
    const xs  = cards.map(c => c.x)
    const ys  = cards.map(c => c.y)
    const hs  = cards.map(c => cardHeights.current[c.id] || 130)
    const minX = Math.min(...xs) - 60
    const minY = Math.min(...ys) - 60
    const maxX = Math.max(...cards.map((c, i) => c.x + CARD_W)) + 60
    const maxY = Math.max(...cards.map((c, i) => c.y + hs[i])) + 60
    const vpW  = canvasRef.current.offsetWidth
    const vpH  = canvasRef.current.offsetHeight
    const newZ = Math.min(vpW / (maxX - minX), vpH / (maxY - minY), 1.5)
    setPan({
      x: (vpW - (maxX - minX) * newZ) / 2 - minX * newZ,
      y: (vpH - (maxY - minY) * newZ) / 2 - minY * newZ,
    })
    setZoom(newZ)
  }, [cards])

  const handleZoomIn  = () => setZoom(prev => Math.min(MAX_ZOOM, +(prev * 1.2).toFixed(2)))
  const handleZoomOut = () => setZoom(prev => Math.max(MIN_ZOOM, +(prev / 1.2).toFixed(2)))

  /* ── Canvas cursor ── */
  const canvasCursor =
    tool === 'pan'     ? (isPanning.current ? 'grabbing' : 'grab') :
    tool === 'card'    ? 'crosshair' :
    tool === 'connect' ? 'cell'      :
    tool === 'delete'  ? 'default'   : 'default'

  return (
    <div className={`${styles.shell} ${sidebarCollapsed ? styles.shellCollapsed : ''}`}>
      <Sidebar collapsed={sidebarCollapsed} onCollapse={() => setSidebarCollapsed(v => !v)} />

      <div className={styles.canvasWrapper}>
        {/* Floating toolbar */}
        <Toolbar
          tool={tool}
          setTool={t => { setTool(t); setConnectFrom(null); setSvgMouse(null) }}
          zoom={zoom}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onFit={fitView}
          open={toolbarOpen}
          onToggle={() => setToolbarOpen(v => !v)}
        />

        {/* Canvas */}
        <div
          ref={canvasRef}
          className={styles.canvasArea}
          style={{ cursor: canvasCursor }}
          onPointerDown={handleCanvasPointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
        >
          {/* Dot grid background */}
          <div
            className={styles.canvasGrid}
            style={{
              backgroundPosition: `${pan.x % (20 * zoom)}px ${pan.y % (20 * zoom)}px`,
              backgroundSize: `${20 * zoom}px ${20 * zoom}px`,
            }}
          />

          {/* Transformed canvas layer */}
          <div
            className={styles.canvasLayer}
            style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})` }}
          >
            {cards.map(card => (
              <CanvasCard
                key={card.id}
                card={card}
                selected={selected === card.id}
                isConnectSource={connectFrom === card.id}
                isConnectTarget={connectFrom && connectFrom !== card.id && tool === 'connect'}
                tool={tool}
                onPointerDown={handleCardPointerDown}
                onCardClick={handleCardClick}
                onUpdate={updated => setCards(prev => prev.map(c => c.id === updated.id ? updated : c))}
                onHeightChange={(id, h) => { cardHeights.current[id] = h }}
              />
            ))}
          </div>

          {/* SVG connections overlay (screen space) */}
          <ConnectionsSVG
            connections={connections}
            cards={cards}
            pan={pan}
            zoom={zoom}
            cardHeights={cardHeights}
            tool={tool}
            onDeleteConn={id => setConnections(prev => prev.filter(c => c.id !== id))}
            connectFrom={connectFrom}
            svgMouse={svgMouse}
          />

          {/* Empty state / hint */}
          {cards.length === 0 && (
            <div className={styles.emptyState} style={{ pointerEvents: 'none' }}>
              <p className={styles.emptyStateTitle}>Your canvas is empty</p>
              <p className={styles.emptyStateHint}>Press <kbd>C</kbd> and click to place your first card</p>
            </div>
          )}

          <EmptyHint tool={tool} />
        </div>

        {/* Zoom indicator (bottom-right) */}
        <div className={styles.zoomIndicator}>
          <button className={styles.zoomBtn} onClick={handleZoomOut}><Ic.Minus /></button>
          <span className={styles.zoomLabel}>{Math.round(zoom * 100)}%</span>
          <button className={styles.zoomBtn} onClick={handleZoomIn}><Ic.Plus /></button>
        </div>

        {/* Connect mode indicator */}
        {connectFrom && (
          <div className={styles.connectBanner}>
            <span className={styles.connectBannerDot} />
            Click another card to connect — or press <kbd>Esc</kbd> to cancel
          </div>
        )}
      </div>
    </div>
  )
}
