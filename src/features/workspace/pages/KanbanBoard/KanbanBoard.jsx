import { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { buildWorkspaceBoardPath } from '../../../../shared/config/routes.js'
import { WORKSPACE_NAV_ITEMS } from '../../../../shared/config/workspaceNavigation.js'
import ProductAppShell from '../../../../shared/components/ProductAppShell/ProductAppShell.jsx'
import PlanPageHeader from '../../../../shared/components/PlanPageHeader/PlanPageHeader.jsx'
import PlanSidebarSection from '../../../../shared/components/PlanSidebarSection/PlanSidebarSection.jsx'
import SidebarUserCard from '../../../../shared/components/SidebarUserCard/SidebarUserCard.jsx'
import CardModal from '../../components/CardModal/CardModal.jsx'
import AddColumnComposer from '../../components/AddColumnComposer/AddColumnComposer.jsx'
import BoardHeaderActions from '../../components/BoardHeaderActions/BoardHeaderActions.jsx'
import KanbanColumn from '../../components/KanbanColumn/KanbanColumn.jsx'
import { useWorkspaceNavigation } from '../../../../shared/hooks/useWorkspaceNavigation.js'
import { usePlans } from '../../context/PlansContext.jsx'
import { useBoardColumns } from '../../hooks/useBoardColumns.js'
import { useBoardDragAndDrop } from '../../hooks/useBoardDragAndDrop.js'
import { useResolvedPlanRoute } from '../../hooks/useResolvedPlanRoute.js'
import styles from './KanbanBoard.module.css'

/* ═══════════════════════════════════════════════════════════════
   ICONS
═══════════════════════════════════════════════════════════════ */
const Icon = {
  Home:     () => <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><path d="M2 6.5L8 2l6 4.5V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V6.5z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/><path d="M6 15V9h4v6" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/></svg>,
  Popover:  () => <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M4 2.5H2.5v7H9.5V8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/><path d="M5 7L9.5 2.5M7 2.5h2.5V5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  Canvas:   () => <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><rect x="1.5" y="1.5" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.3"/><rect x="8.5" y="1.5" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.3"/><rect x="1.5" y="8.5" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.3"/><rect x="8.5" y="8.5" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.3"/></svg>,
  Files:    () => <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><path d="M9 1.5H4a1.5 1.5 0 0 0-1.5 1.5v10A1.5 1.5 0 0 0 4 14.5h8A1.5 1.5 0 0 0 13.5 13V6L9 1.5z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/><path d="M9 1.5V6H13.5" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/></svg>,
  Plus:     () => <svg width="13" height="13" viewBox="0 0 14 14" fill="none"><path d="M7 2v10M2 7h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>,
  X:        () => <svg width="13" height="13" viewBox="0 0 14 14" fill="none"><path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>,
  Collapse: () => <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M9 2L5 7l4 5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  More:     () => <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="3" r="1" fill="currentColor"/><circle cx="7" cy="7" r="1" fill="currentColor"/><circle cx="7" cy="11" r="1" fill="currentColor"/></svg>,
  Check:    () => <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 6l2.5 2.5 5.5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  Edit:     () => <svg width="13" height="13" viewBox="0 0 14 14" fill="none"><path d="M9.5 2.5l2 2L4 12H2v-2L9.5 2.5z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/></svg>,
  Trash:    () => <svg width="13" height="13" viewBox="0 0 14 14" fill="none"><path d="M2 4h10M5 4V2.5h4V4M5.5 6.5v4M8.5 6.5v4M3 4l.8 8h6.4L11 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  Tag:      () => <svg width="13" height="13" viewBox="0 0 14 14" fill="none"><path d="M2 2h5l5 5-5 5-5-5V2z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/><circle cx="4.5" cy="4.5" r="1" fill="currentColor"/></svg>,
  User:     () => <svg width="13" height="13" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="5" r="2.5" stroke="currentColor" strokeWidth="1.3"/><path d="M2 12c0-2.2 2.2-4 5-4s5 1.8 5 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>,
  Clock:    () => <svg width="13" height="13" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.3"/><path d="M7 4v3l2 1.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>,
  Send:     () => <svg width="13" height="13" viewBox="0 0 14 14" fill="none"><path d="M12 2L2 6.5l4 1.5 1.5 4L12 2z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/></svg>,
  Filter:   () => <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 4h10M4 7h6M6 10h2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>,
  Share:    () => <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="11" cy="3" r="1.5" stroke="currentColor" strokeWidth="1.2"/><circle cx="3" cy="7" r="1.5" stroke="currentColor" strokeWidth="1.2"/><circle cx="11" cy="11" r="1.5" stroke="currentColor" strokeWidth="1.2"/><path d="M4.4 7.8L9.7 10M9.7 4L4.4 6.2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>,
  Logo:     () => <svg width="17" height="17" viewBox="0 0 20 20" fill="none"><rect x="2" y="2" width="7" height="7" rx="2" fill="currentColor"/><rect x="11" y="2" width="7" height="7" rx="2" fill="currentColor" opacity=".35"/><rect x="2" y="11" width="7" height="7" rx="2" fill="currentColor" opacity=".55"/><rect x="11" y="11" width="7" height="7" rx="2" fill="currentColor" opacity=".75"/></svg>,
  Chevron:  () => <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M4.5 3l3 3-3 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  Board:    () => <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><rect x="1" y="3" width="4" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.3"/><rect x="6" y="3" width="4" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.3"/><rect x="11" y="3" width="4" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.3"/></svg>,
  Comment:  () => <svg width="13" height="13" viewBox="0 0 14 14" fill="none"><path d="M12 7A5 5 0 0 1 4 11.5L1.5 12.5l1-2.5A5 5 0 1 1 12 7z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/></svg>,
  Priority: () => <svg width="13" height="13" viewBox="0 0 14 14" fill="none"><path d="M7 2v6M7 10.5v1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>,
  List:     () => <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><path d="M5 5h8M5 10.5h8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/><circle cx="2.5" cy="5" r=".9" fill="currentColor"/><circle cx="2.5" cy="10.5" r=".9" fill="currentColor"/></svg>,
  Link:     () => <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M6.4 9.6L9.6 6.4M6 11.5H4.8A2.8 2.8 0 1 1 4.8 5.9H6M10 4.5h1.2a2.8 2.8 0 1 1 0 5.6H10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  Image:    () => <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="2" y="2.5" width="12" height="11" rx="2" stroke="currentColor" strokeWidth="1.3"/><path d="M4.5 10l2.1-2.2a.8.8 0 0 1 1.2 0l1.7 1.8 1.3-1.3a.8.8 0 0 1 1.1 0L13.5 10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/><circle cx="6" cy="6" r="1" fill="currentColor"/></svg>,
  Code:     () => <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M6 5L3 8l3 3M10 5l3 3-3 3M8.8 3.5L7.2 12.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>,
}

/* ═══════════════════════════════════════════════════════════════
   INITIAL DATA
═══════════════════════════════════════════════════════════════ */
const LABELS = [
  { id: 'l1', text: 'Design',      color: '#d4aef1' },
  { id: 'l2', text: 'Engineering', color: '#4290da' },
  { id: 'l3', text: 'Research',    color: '#f5a623' },
  { id: 'l4', text: 'Marketing',   color: '#ff6766' },
  { id: 'l5', text: 'QA',          color: '#0f703a' },
]

const MEMBERS = [
  { id: 'm1', initials: 'AS', color: '#000'    },
  { id: 'm2', initials: 'MK', color: '#d4aef1' },
  { id: 'm3', initials: 'TK', color: '#4290da' },
  { id: 'm4', initials: 'SR', color: '#0f703a' },
]

const CALENDAR_DAYS = [
  { label: 29, muted: true }, { label: 30, muted: true }, { label: 31, muted: true }, { label: 1 }, { label: 2 }, { label: 3 }, { label: 4 },
  { label: 5 }, { label: 6, underline: true }, { label: 7, selected: true }, { label: 8 }, { label: 9 }, { label: 10 }, { label: 11 },
  { label: 12 }, { label: 13 }, { label: 14 }, { label: 15 }, { label: 16 }, { label: 17 }, { label: 18 },
  { label: 19 }, { label: 20 }, { label: 21 }, { label: 22 }, { label: 23 }, { label: 24 }, { label: 25 },
  { label: 26 }, { label: 27 }, { label: 28 }, { label: 29 }, { label: 30 }, { label: 1, muted: true }, { label: 2, muted: true },
  { label: 3, muted: true }, { label: 4, muted: true }, { label: 5, muted: true }, { label: 6, muted: true }, { label: 7, muted: true }, { label: 8, muted: true }, { label: 9, muted: true },
]

const COL_COLORS = [
  { id: 'gray',   value: '#a0a0a0' },
  { id: 'blue',   value: '#4290da' },
  { id: 'purple', value: '#d4aef1' },
  { id: 'green',  value: '#0f703a' },
  { id: 'red',    value: '#ff6766' },
  { id: 'orange', value: '#f5a623' },
]

const uid = () => Math.random().toString(36).slice(2, 9)

const NAV = WORKSPACE_NAV_ITEMS.map((item) => ({
  ...item,
  Icon:
    item.id === 'home' ? Icon.Home :
    item.id === 'canvas' ? Icon.Canvas :
    Icon.Files,
}))

/* ═══════════════════════════════════════════════════════════════
   CARD DETAIL MODAL
═══════════════════════════════════════════════════════════════ */
/* ═══════════════════════════════════════════════════════════════
   MAIN BOARD
═══════════════════════════════════════════════════════════════ */
export default function KanbanBoard() {
  const { planId } = useParams()
  const { updatePlanBoard } = usePlans()
  const { plans, activePlan, openPlan } = useResolvedPlanRoute({
    planId,
    buildPath: buildWorkspaceBoardPath,
  })
  const [activeCard,setActiveCard]= useState(null)   // { card, colTitle }
  const [addingCol, setAddingCol] = useState(false)
  const [newColTitle,setNewColTitle] = useState('')
  const [notification, setNotification] = useState(null)
  const notificationTimerRef = useRef(null)
  const { activeNav, handleNavItemClick } = useWorkspaceNavigation()
  const {
    columns,
    totalCards,
    updateColumns,
    createColumn,
    deleteColumn,
    renameColumn,
    changeColColor,
    addCard,
    updateCard,
    deleteCard,
  } = useBoardColumns({
    activePlanId: activePlan?.id,
    boardColumns: activePlan?.boardColumns,
    updatePlanBoard,
  })
  const {
    dragState,
    dropTarget,
    handleDragStart,
    handleDragOver,
    handleDrop,
    handleDragEnd,
  } = useBoardDragAndDrop({
    activePlanId: activePlan?.id,
    updateColumns,
  })

  const addColumn = () => {
    if (!createColumn(newColTitle)) return
    setNewColTitle('')
    setAddingCol(false)
  }

  const showNotification = (message) => {
    if (notificationTimerRef.current) {
      clearTimeout(notificationTimerRef.current)
    }
    setNotification(message)
    notificationTimerRef.current = setTimeout(() => {
      setNotification(null)
      notificationTimerRef.current = null
    }, 2600)
  }

  useEffect(() => () => {
    if (notificationTimerRef.current) {
      clearTimeout(notificationTimerRef.current)
    }
  }, [])

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
    <>
      <ProductAppShell
      styles={styles}
      activeNav={activeNav}
      onNavItemClick={handleNavItemClick}
      navItems={NAV}
      LogoIcon={Icon.Logo}
      CollapseIcon={Icon.Collapse}
      ChevronIcon={Icon.Chevron}
      HintIcon={Icon.Popover}
      secondaryContent={renderSidebarSecondaryContent}
      bottomContent={renderSidebarBottomContent}
      contentClassName={styles.boardWrapper}
    >
        <PlanPageHeader
          title={activePlan?.name ?? 'Plan'}
          breadcrumbCurrent={activePlan?.name ?? 'Plan'}
          meta={`${totalCards} cards`}
          icon={<Icon.Board />}
          sticky
          tone="solid"
          titleSize="medium"
          actions={(
            <BoardHeaderActions
              members={MEMBERS}
              icons={{
                Plus: Icon.Plus,
                Filter: Icon.Filter,
                Share: Icon.Share,
              }}
              styles={styles}
              onAddMember={() => showNotification('Invite flow is coming soon')}
              onFilter={() => showNotification('Advanced filters are coming soon')}
              onShare={() => showNotification('Share link copied for this board')}
            />
          )}
        />

        {/* ── Board ── */}
        <div className={styles.board}>
          {columns.map(col => (
            <KanbanColumn
              key={col.id}
              col={col}
              dragState={dragState}
              dropTarget={dropTarget}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onDragEnd={handleDragEnd}
              onAddCard={addCard}
              onDeleteCol={deleteColumn}
              onRenameCol={renameColumn}
              onChangeColColor={changeColColor}
              onCardClick={(card, colTitle) => setActiveCard({ card, colTitle })}
              labels={LABELS}
              members={MEMBERS}
              colorOptions={COL_COLORS}
              icons={{
                Plus: Icon.Plus,
                More: Icon.More,
                Edit: Icon.Edit,
                Trash: Icon.Trash,
                X: Icon.X,
                Comment: Icon.Comment,
                Clock: Icon.Clock,
              }}
              styles={styles}
            />
          ))}

          <AddColumnComposer
            addingCol={addingCol}
            newColTitle={newColTitle}
            setNewColTitle={setNewColTitle}
            setAddingCol={setAddingCol}
            addColumn={addColumn}
            PlusIcon={Icon.Plus}
            XIcon={Icon.X}
            styles={styles}
          />
        </div>
      </ProductAppShell>

      {/* ── Card modal ── */}
      {activeCard && (
        <CardModal
          card={activeCard.card}
          colTitle={activeCard.colTitle}
          onClose={() => setActiveCard(null)}
          onUpdate={updatedCard => { updateCard(updatedCard); setActiveCard(null) }}
          onDelete={cardId => { deleteCard(cardId); setActiveCard(null) }}
          labels={LABELS}
          members={MEMBERS}
          calendarDays={CALENDAR_DAYS}
          icons={Icon}
          styles={styles}
        />
      )}

      {notification && (
        <div className={styles.boardNotification} role="status" aria-live="polite">
          {notification}
        </div>
      )}
    </>
  )
}

