import { useParams } from 'react-router-dom'
import CanvasCard from '../../components/CanvasCard/CanvasCard.jsx'
import CanvasEmptyHint from '../../components/CanvasEmptyHint/CanvasEmptyHint.jsx'
import ConnectionsSVG from '../../components/ConnectionsSVG/ConnectionsSVG.jsx'
import CanvasToolbar from '../../components/CanvasToolbar/CanvasToolbar.jsx'
import ProductAppShell from '../../../../shared/components/ProductAppShell/ProductAppShell.jsx'
import PlanPageHeader from '../../../../shared/components/PlanPageHeader/PlanPageHeader.jsx'
import PlanSidebarSection from '../../../../shared/components/PlanSidebarSection/PlanSidebarSection.jsx'
import SidebarUserCard from '../../../../shared/components/SidebarUserCard/SidebarUserCard.jsx'
import { buildCanvasPath } from '../../../../shared/config/routes.js'
import { useWorkspaceNavigation } from '../../../../shared/hooks/useWorkspaceNavigation.js'
import { usePlans } from '../../../workspace/context/PlansContext.jsx'
import { useResolvedPlanRoute } from '../../../workspace/hooks/useResolvedPlanRoute.js'
import { useCanvasInteractions } from '../../hooks/useCanvasInteractions.js'
import { useCanvasState } from '../../hooks/useCanvasState.js'
import styles from './CanvasPage.module.css'

/* ═══════════════════════════════════════════════════════
   CONSTANTS
═══════════════════════════════════════════════════════ */
const CARD_W    = 230
const MIN_ZOOM  = 0.2
const MAX_ZOOM  = 3

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

/* ═══════════════════════════════════════════════════════
   ICONS
═══════════════════════════════════════════════════════ */
const Ic = {
  Logo:     () => <svg width="17" height="17" viewBox="0 0 20 20" fill="none"><rect x="2" y="2" width="7" height="7" rx="2" fill="currentColor"/><rect x="11" y="2" width="7" height="7" rx="2" fill="currentColor" opacity=".35"/><rect x="2" y="11" width="7" height="7" rx="2" fill="currentColor" opacity=".55"/><rect x="11" y="11" width="7" height="7" rx="2" fill="currentColor" opacity=".75"/></svg>,
  Home:     () => <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><path d="M2 6.5L8 2l6 4.5V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V6.5z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/><path d="M6 15V9h4v6" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/></svg>,
  Popover:  () => <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M4 2.5H2.5v7H9.5V8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/><path d="M5 7L9.5 2.5M7 2.5h2.5V5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  Canvas:   () => <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><rect x="1.5" y="1.5" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.3"/><rect x="8.5" y="1.5" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.3"/><rect x="1.5" y="8.5" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.3"/><rect x="8.5" y="8.5" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.3"/></svg>,
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
  { id: 'canvas',   Icon: Ic.Canvas   },
  { id: 'files',    Icon: Ic.Files    },
]
const NAV_LABELS = { home: 'Home', canvas: 'Canvas', files: 'Files' }

function SidebarCollapseIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M9 2L5 7l4 5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

/* ═══════════════════════════════════════════════════════
   MAIN CANVAS PAGE
═══════════════════════════════════════════════════════ */
export default function CanvasPage() {
  const { planId } = useParams()
  const { updatePlanCanvas } = usePlans()
  const { plans, activePlan, openPlan } = useResolvedPlanRoute({
    planId,
    buildPath: buildCanvasPath,
  })
  const { activeNav, handleNavItemClick } = useWorkspaceNavigation()
  const {
    cards,
    connections,
    pan,
    zoom,
    setCards,
    setConnections,
    setPan,
    setZoom,
  } = useCanvasState({
    activePlanId: activePlan?.id,
    activeCanvasState: activePlan?.canvasState,
    updatePlanCanvas,
  })
  const {
    toolbarOpen,
    setToolbarOpen,
    tool,
    selected,
    connectFrom,
    svgMouse,
    canvasRef,
    cardHeights,
    switchTool,
    handleCanvasPointerDown,
    handlePointerMove,
    handlePointerUp,
    handleCardPointerDown,
    handleCardClick,
    fitView,
    handleZoomIn,
    handleZoomOut,
    canvasCursor,
  } = useCanvasInteractions({
    activePlanId: activePlan?.id,
    cards,
    connections,
    pan,
    zoom,
    setCards,
    setConnections,
    setPan,
    setZoom,
    tools: TOOLS,
    canvasGridClassName: styles.canvasGrid,
    cardWidth: CARD_W,
    minZoom: MIN_ZOOM,
    maxZoom: MAX_ZOOM,
  })

  const renderSidebarSecondaryContent = ({ collapsed }) => (
    collapsed ? null : (
      <PlanSidebarSection
        plans={plans}
        activePlanId={activePlan?.id}
        onSelectPlan={openPlan}
      />
    )
  )

  const renderSidebarBottomContent = ({ collapsed }) => (
    <SidebarUserCard styles={styles} collapsed={collapsed} />
  )

  return (
    <ProductAppShell
      styles={styles}
      activeNav={activeNav}
      onNavItemClick={handleNavItemClick}
      navItems={NAV.map(({ id, Icon }) => ({ id, label: NAV_LABELS[id], Icon }))}
      LogoIcon={Ic.Logo}
      CollapseIcon={SidebarCollapseIcon}
      ChevronIcon={Ic.Chevron}
      HintIcon={Ic.Popover}
      secondaryContent={renderSidebarSecondaryContent}
      bottomContent={renderSidebarBottomContent}
      contentClassName={styles.canvasWrapper}
    >
        <PlanPageHeader
          title={activePlan?.name ?? 'Canvas'}
          breadcrumbCurrent={activePlan?.name ?? 'Plan'}
          meta={`${cards.length} ${cards.length === 1 ? 'card' : 'cards'}`}
          tone="frosted"
          titleSize="large"
        />

        {/* Floating toolbar */}
        <CanvasToolbar
          tool={tool}
          setTool={switchTool}
          zoom={zoom}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onFit={fitView}
          open={toolbarOpen}
          onToggle={() => setToolbarOpen(v => !v)}
          tools={TOOLS}
          toolIcons={TOOL_ICONS}
          ChevronDownIcon={Ic.ChevDown}
          PlusIcon={Ic.Plus}
          MinusIcon={Ic.Minus}
          FitIcon={Ic.Fit}
          styles={styles}
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
                cardWidth={CARD_W}
                cardColors={CARD_COLORS}
                MoreIcon={Ic.More}
                styles={styles}
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
            cardWidth={CARD_W}
            styles={styles}
          />

          {/* Empty state / hint */}
          {cards.length === 0 && (
            <div className={styles.emptyState} style={{ pointerEvents: 'none' }}>
              <p className={styles.emptyStateTitle}>Your canvas is empty</p>
              <p className={styles.emptyStateHint}>Press <kbd>C</kbd> and click to place your first card</p>
            </div>
          )}

          <CanvasEmptyHint tool={tool} CardIcon={Ic.Card} styles={styles} />
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
    </ProductAppShell>
  )
}
