import { useState, useRef, useCallback, useEffect, useLayoutEffect } from 'react'
import styles from './KanbanBoard.module.css'

/* ═══════════════════════════════════════════════════════════════
   ICONS
═══════════════════════════════════════════════════════════════ */
const Icon = {
  Home:     () => <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><path d="M2 6.5L8 2l6 4.5V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V6.5z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/><path d="M6 15V9h4v6" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/></svg>,
  Calendar: () => <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><rect x="1.5" y="3" width="13" height="12" rx="2" stroke="currentColor" strokeWidth="1.3"/><path d="M5 1.5V4M11 1.5V4M1.5 7h13" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>,
  Inbox:    () => <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><path d="M2 4.5A1.5 1.5 0 0 1 3.5 3h9A1.5 1.5 0 0 1 14 4.5v7A1.5 1.5 0 0 1 12.5 13h-2.1a1 1 0 0 1-.8-.4L8.8 11.4a1 1 0 0 0-.8-.4 1 1 0 0 0-.8.4l-.8 1.2a1 1 0 0 1-.8.4H3.5A1.5 1.5 0 0 1 2 11.5v-7z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/><path d="M2 8.5h3l1.2 1.8a1 1 0 0 0 .8.4h2a1 1 0 0 0 .8-.4L11 8.5h3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  Popover:  () => <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M4 2.5H2.5v7H9.5V8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/><path d="M5 7L9.5 2.5M7 2.5h2.5V5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  Canvas:   () => <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><rect x="1.5" y="1.5" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.3"/><rect x="8.5" y="1.5" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.3"/><rect x="1.5" y="8.5" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.3"/><rect x="8.5" y="8.5" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.3"/></svg>,
  Chat:     () => <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><path d="M14 8.5A6 6 0 0 1 4.5 13.5L1.5 14.5l1-3A6 6 0 1 1 14 8.5z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/></svg>,
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

const INITIAL_COLS = [
  {
    id: 'col-backlog', title: 'Backlog', color: '#a0a0a0',
    cards: [
      { id: uid(), title: 'Competitive landscape research',  description: 'Survey top 5 competitors and document key differentiators.', labelId: 'l1', memberIds: ['m2'],       dueDate: 'Aug 3',  comments: [] },
      { id: uid(), title: 'Accessibility audit — WCAG 2.2', description: '', labelId: 'l5', memberIds: [],          dueDate: '',       comments: [] },
      { id: uid(), title: 'Define success metrics for Q3',  description: 'Align with stakeholders on KPIs before sprint kick-off.',     labelId: 'l3', memberIds: ['m1','m4'], dueDate: 'Jul 30', comments: [] },
    ],
  },
  {
    id: 'col-progress', title: 'In Progress', color: '#4290da',
    cards: [
      { id: uid(), title: 'Redesign onboarding flow',         description: 'End-to-end UX redesign focusing on time-to-value reduction.', labelId: 'l1', memberIds: ['m2','m3'], dueDate: 'Aug 12', comments: [{ id: uid(), author: 'm3', text: 'Wireframes are done, moving to hi-fi.', time: '2h ago' }] },
      { id: uid(), title: 'Authentication endpoint refactor', description: 'Migrate to OAuth 2.1 with PKCE. Deprecate legacy sessions.',  labelId: 'l2', memberIds: ['m1'],       dueDate: 'Aug 8',  comments: [] },
    ],
  },
  {
    id: 'col-review', title: 'Review', color: '#d4aef1',
    cards: [
      { id: uid(), title: 'Launch campaign copy', description: 'Email sequence + landing page headlines for Q3 launch.', labelId: 'l4', memberIds: ['m4'], dueDate: 'Today', comments: [{ id: uid(), author: 'm1', text: 'Looks great overall — minor tweaks on CTA.', time: '35m ago' }] },
    ],
  },
  {
    id: 'col-done', title: 'Done', color: '#0f703a',
    cards: [
      { id: uid(), title: 'User interview synthesis',        description: '',  labelId: 'l3', memberIds: ['m2','m4'], dueDate: '',       comments: [] },
      { id: uid(), title: 'Brand color system update',       description: '',  labelId: 'l1', memberIds: ['m2'],       dueDate: '',       comments: [] },
    ],
  },
]

const NAV = [
  { id: 'home',     label: 'Home',     Icon: Icon.Home     },
  { id: 'calendar', label: 'Calendar', Icon: Icon.Calendar },
  { id: 'inbox',    label: 'Inbox',    Icon: Icon.Inbox    },
  { id: 'canvas',   label: 'Canvas',   Icon: Icon.Canvas   },
  { id: 'chat',     label: 'Chat',     Icon: Icon.Chat     },
  { id: 'files',    label: 'Files',    Icon: Icon.Files    },
]
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

/* ═══════════════════════════════════════════════════════════════
   SIDEBAR (consistent with Workspace)
═══════════════════════════════════════════════════════════════ */
function Sidebar({ collapsed, onCollapse }) {
  const [activeNav, setActiveNav] = useState(() => getActiveNav(window.location.pathname))

  const handleNavItemClick = (id) => {
    const nextPath = NAV_PATHS[id]

    if (nextPath) {
      window.location.href = nextPath
      return
    }

    setActiveNav(id)
  }

  return (
    <aside className={`${styles.sidebar} ${collapsed ? styles.sidebarCollapsed : ''}`}>
      <div className={styles.sidebarTop}>
        <div className={styles.logoRow}>
          <a href="/workspace" className={styles.sidebarLogo}>
            <span className={styles.sidebarLogoMark}><Icon.Logo /></span>
            <span className={styles.sidebarLogoText}>Plan Things</span>
          </a>
          <button className={styles.collapseBtn} onClick={onCollapse} aria-label="Toggle sidebar">
            <span className={`${styles.collapseBtnIcon} ${collapsed ? styles.collapseBtnFlipped : ''}`}>
              <Icon.Collapse />
            </span>
          </button>
        </div>

        <button className={`${styles.workspacePicker} ${collapsed ? styles.workspacePickerHidden : ''}`}>
          <span className={styles.wsAvatar}>A</span>
          <span className={styles.wsName}>Arthur's workspace</span>
          <span className={styles.wsChevron}><Icon.Chevron /></span>
        </button>

        <nav className={styles.nav}>
          {NAV.map(({ id, label, Icon: Ic }) => (
            <button
              key={id}
              className={`${styles.navItem} ${activeNav === id ? styles.navItemActive : ''}`}
              onClick={() => handleNavItemClick(id)}
              title={collapsed ? label : undefined}
            >
              <span className={styles.navIcon}><Ic /></span>
              <span className={styles.navLabel}>{label}</span>
              {id === 'inbox' && !collapsed && <span className={styles.navHintIcon}><Icon.Popover /></span>}
            </button>
          ))}
        </nav>
      </div>

      {/* Plan list */}
      {!collapsed && (
        <div className={styles.sidebarPlans}>
          <p className={styles.sidebarSectionLabel}>Plans</p>
          {[
            { name: 'Product Launch — Q3', color: '#4290da'  },
            { name: 'API Redesign',        color: '#0f703a'  },
            { name: 'Brand Identity 2025', color: '#d4aef1'  },
          ].map(p => (
            <button key={p.name} className={`${styles.sidebarPlanItem} ${p.name === 'Product Launch — Q3' ? styles.sidebarPlanItemActive : ''}`}>
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

/* ═══════════════════════════════════════════════════════════════
   CARD DETAIL MODAL
═══════════════════════════════════════════════════════════════ */
function CardModal({ card, colTitle, onClose, onUpdate, onDelete }) {
  const [title,    setTitle]    = useState(card.title)
  const [desc,     setDesc]     = useState(card.description)
  const [labelId,  setLabelId]  = useState(card.labelId)
  const [memberIds,setMIds]     = useState(card.memberIds)
  const [dueDate,  setDueDate]  = useState(card.dueDate)
  const [comment,  setComment]  = useState('')
  const [comments, setComments] = useState(card.comments)
  const [exiting,  setExiting]  = useState(false)
  const [showDetails, setShowDetails] = useState(false)
  const [commentFocused, setCommentFocused] = useState(false)
  const [showMembersMenu, setShowMembersMenu] = useState(false)
  const [showLabelMenu, setShowLabelMenu] = useState(false)
  const [showDateMenu, setShowDateMenu] = useState(false)
  const [showChecklistMenu, setShowChecklistMenu] = useState(false)
  const [showTextMenu, setShowTextMenu] = useState(false)
  const [showListMenu, setShowListMenu] = useState(false)
  const [showInsertMenu, setShowInsertMenu] = useState(false)
  const [membersMenuPosition, setMembersMenuPosition] = useState({ top: 0, left: 0 })
  const [labelMenuPosition, setLabelMenuPosition] = useState({ top: 0, left: 0 })
  const [dateMenuPosition, setDateMenuPosition] = useState({ top: 0, left: 0 })
  const [checklistMenuPosition, setChecklistMenuPosition] = useState({ top: 0, left: 0 })
  const [expandedComments, setExpandedComments] = useState({})
  const [overflowingComments, setOverflowingComments] = useState({})
  const [textMenuPosition, setTextMenuPosition] = useState({ top: 0, left: 0 })
  const [listMenuPosition, setListMenuPosition] = useState({ top: 0, left: 0 })
  const [insertMenuPosition, setInsertMenuPosition] = useState({ top: 0, left: 0 })
  const [selectedCalendarDay, setSelectedCalendarDay] = useState(7)
  const [startEnabled, setStartEnabled] = useState(false)
  const [startDateValue, setStartDateValue] = useState('')
  const [dueEnabled, setDueEnabled] = useState(true)
  const [dueDateValue, setDueDateValue] = useState('07/04/26')
  const [dueTimeValue, setDueTimeValue] = useState('16:21')
  const [recurringValue, setRecurringValue] = useState('Nunca')
  const [reminderValue, setReminderValue] = useState('1 dia antes')
  const [checklistTitle, setChecklistTitle] = useState('Checklist')
  const [activeChecklist, setActiveChecklist] = useState(null)
  const [newChecklistItem, setNewChecklistItem] = useState('')
  const [checklistComposerOpen, setChecklistComposerOpen] = useState(false)
  const [showChecklistAssignMenu, setShowChecklistAssignMenu] = useState(false)
  const [showChecklistDueMenu, setShowChecklistDueMenu] = useState(false)
  const [checklistAssignMenuPosition, setChecklistAssignMenuPosition] = useState({ top: 0, left: 0 })
  const [checklistDueMenuPosition, setChecklistDueMenuPosition] = useState({ top: 0, left: 0 })
  const [checklistSelectedDay, setChecklistSelectedDay] = useState(7)
  const [checklistStartEnabled, setChecklistStartEnabled] = useState(false)
  const [checklistStartDateValue, setChecklistStartDateValue] = useState('')
  const [checklistDueEnabled, setChecklistDueEnabled] = useState(true)
  const [checklistDueValue, setChecklistDueValue] = useState('07/04/26')
  const commentComposerRef = useRef(null)
  const commentTextareaRef = useRef(null)
  const checklistItemTextareaRef = useRef(null)
  const textMenuRef = useRef(null)
  const textMenuButtonRef = useRef(null)
  const membersMenuRef = useRef(null)
  const membersMenuButtonRef = useRef(null)
  const labelMenuRef = useRef(null)
  const labelMenuButtonRef = useRef(null)
  const dateMenuRef = useRef(null)
  const dateMenuButtonRef = useRef(null)
  const checklistMenuRef = useRef(null)
  const checklistMenuButtonRef = useRef(null)
  const checklistAssignMenuRef = useRef(null)
  const checklistAssignButtonRef = useRef(null)
  const checklistDueMenuRef = useRef(null)
  const checklistDueButtonRef = useRef(null)
  const listMenuRef = useRef(null)
  const listMenuButtonRef = useRef(null)
  const insertMenuRef = useRef(null)
  const insertMenuButtonRef = useRef(null)
  const commentTextRefs = useRef({})

  const label = LABELS.find(l => l.id === labelId)

  const close = () => { setExiting(true); setTimeout(onClose, 220) }

  const save = () => {
    onUpdate({ ...card, title, description: desc, labelId, memberIds, dueDate, comments })
    close()
  }

  const toggleMember = (id) => {
    setMIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  const addComment = () => {
    if (!comment.trim()) return
    const c = { id: uid(), author: 'm1', text: comment.trim(), time: 'Just now' }
    setComments(prev => [...prev, c])
    setComment('')
  }

  const handleDelete = () => { onDelete(card.id); close() }
  const formatDueDateLabel = (day) => `Apr ${day}`
  const handleChecklistCreate = () => {
    const nextTitle = checklistTitle.trim() || 'Checklist'
    setActiveChecklist({ title: nextTitle, items: [] })
    setChecklistComposerOpen(true)
    setShowChecklistMenu(false)
    setChecklistTitle('Checklist')
  }
  const handleChecklistItemAdd = () => {
    if (!newChecklistItem.trim() || !activeChecklist) return

    setActiveChecklist(prev => ({
      ...prev,
      items: [...prev.items, { id: uid(), text: newChecklistItem.trim(), checked: false }],
    }))
    setNewChecklistItem('')
    setChecklistComposerOpen(true)
  }
  const toggleChecklistItem = (itemId) => {
    setActiveChecklist(prev => ({
      ...prev,
      items: prev.items.map(item => item.id === itemId ? { ...item, checked: !item.checked } : item),
    }))
  }
  const handleDateSave = () => {
    setDueDate(dueEnabled ? formatDueDateLabel(selectedCalendarDay) : '')
    setShowDateMenu(false)
  }
  const handleDateRemove = () => {
    setDueEnabled(false)
    setDueDate('')
    setShowDateMenu(false)
  }
  const selectedMembers = memberIds.map(id => MEMBERS.find(m => m.id === id)).filter(Boolean)
  const getMemberName = (initials) => {
    if (initials === 'AS') return 'Arthur Santos'
    if (initials === 'MK') return 'Maria Kim'
    if (initials === 'TK') return 'Tom K.'
    return 'Sara R.'
  }

  useEffect(() => {
    if (!showChecklistMenu) return

    const handlePointerDown = (event) => {
      const clickedMenu = checklistMenuRef.current?.contains(event.target)
      const clickedButton = checklistMenuButtonRef.current?.contains(event.target)

      if (!clickedMenu && !clickedButton) {
        setShowChecklistMenu(false)
      }
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setShowChecklistMenu(false)
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [showChecklistMenu])

  useEffect(() => {
    if (!showChecklistAssignMenu) return

    const handlePointerDown = (event) => {
      const clickedMenu = checklistAssignMenuRef.current?.contains(event.target)
      const clickedButton = checklistAssignButtonRef.current?.contains(event.target)

      if (!clickedMenu && !clickedButton) {
        setShowChecklistAssignMenu(false)
      }
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setShowChecklistAssignMenu(false)
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [showChecklistAssignMenu])

  useEffect(() => {
    if (!showChecklistDueMenu) return

    const handlePointerDown = (event) => {
      const clickedMenu = checklistDueMenuRef.current?.contains(event.target)
      const clickedButton = checklistDueButtonRef.current?.contains(event.target)

      if (!clickedMenu && !clickedButton) {
        setShowChecklistDueMenu(false)
      }
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setShowChecklistDueMenu(false)
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [showChecklistDueMenu])

  useEffect(() => {
    if (!showMembersMenu) return

    const handlePointerDown = (event) => {
      const clickedMenu = membersMenuRef.current?.contains(event.target)
      const clickedButton = membersMenuButtonRef.current?.contains(event.target)

      if (!clickedMenu && !clickedButton) {
        setShowMembersMenu(false)
      }
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setShowMembersMenu(false)
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [showMembersMenu])

  useEffect(() => {
    if (!showLabelMenu) return

    const handlePointerDown = (event) => {
      const clickedMenu = labelMenuRef.current?.contains(event.target)
      const clickedButton = labelMenuButtonRef.current?.contains(event.target)

      if (!clickedMenu && !clickedButton) {
        setShowLabelMenu(false)
      }
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setShowLabelMenu(false)
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [showLabelMenu])

  useEffect(() => {
    if (!showDateMenu) return

    const handlePointerDown = (event) => {
      const clickedMenu = dateMenuRef.current?.contains(event.target)
      const clickedButton = dateMenuButtonRef.current?.contains(event.target)

      if (!clickedMenu && !clickedButton) {
        setShowDateMenu(false)
      }
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setShowDateMenu(false)
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [showDateMenu])

  useEffect(() => {
    if (!showTextMenu) return

    const handlePointerDown = (event) => {
      const clickedMenu = textMenuRef.current?.contains(event.target)
      const clickedButton = textMenuButtonRef.current?.contains(event.target)

      if (!clickedMenu && !clickedButton) {
        setShowTextMenu(false)
      }
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setShowTextMenu(false)
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [showTextMenu])

  useEffect(() => {
    if (!showInsertMenu) return

    const handlePointerDown = (event) => {
      const clickedMenu = insertMenuRef.current?.contains(event.target)
      const clickedButton = insertMenuButtonRef.current?.contains(event.target)

      if (!clickedMenu && !clickedButton) {
        setShowInsertMenu(false)
      }
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setShowInsertMenu(false)
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [showInsertMenu])

  useEffect(() => {
    if (!showListMenu) return

    const handlePointerDown = (event) => {
      const clickedMenu = listMenuRef.current?.contains(event.target)
      const clickedButton = listMenuButtonRef.current?.contains(event.target)

      if (!clickedMenu && !clickedButton) {
        setShowListMenu(false)
      }
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setShowListMenu(false)
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [showListMenu])

  useLayoutEffect(() => {
    if (!showChecklistMenu || !checklistMenuButtonRef.current) return

    const updatePosition = () => {
      const rect = checklistMenuButtonRef.current.getBoundingClientRect()
      setChecklistMenuPosition({
        top: rect.bottom + 8,
        left: rect.left,
      })
    }

    updatePosition()

    window.addEventListener('resize', updatePosition)
    window.addEventListener('scroll', updatePosition, true)

    return () => {
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', updatePosition, true)
    }
  }, [showChecklistMenu])

  useLayoutEffect(() => {
    if (!showChecklistAssignMenu || !checklistAssignButtonRef.current) return

    const updatePosition = () => {
      const rect = checklistAssignButtonRef.current.getBoundingClientRect()
      setChecklistAssignMenuPosition({
        top: rect.bottom + 8,
        left: rect.left,
      })
    }

    updatePosition()

    window.addEventListener('resize', updatePosition)
    window.addEventListener('scroll', updatePosition, true)

    return () => {
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', updatePosition, true)
    }
  }, [showChecklistAssignMenu])

  useLayoutEffect(() => {
    if (!showChecklistDueMenu || !checklistDueButtonRef.current) return

    const updatePosition = () => {
      const rect = checklistDueButtonRef.current.getBoundingClientRect()
      const menuHeight = checklistDueMenuRef.current?.offsetHeight ?? 340
      const menuWidth = checklistDueMenuRef.current?.offsetWidth ?? 272
      const maxLeft = Math.max(12, window.innerWidth - menuWidth - 12)
      setChecklistDueMenuPosition({
        top: Math.max(12, rect.top - menuHeight - 8),
        left: Math.min(rect.left, maxLeft),
      })
    }

    updatePosition()

    window.addEventListener('resize', updatePosition)
    window.addEventListener('scroll', updatePosition, true)

    return () => {
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', updatePosition, true)
    }
  }, [showChecklistDueMenu])

  useLayoutEffect(() => {
    if (!showMembersMenu || !membersMenuButtonRef.current) return

    const updatePosition = () => {
      const rect = membersMenuButtonRef.current.getBoundingClientRect()
      setMembersMenuPosition({
        top: rect.bottom + 8,
        left: rect.left,
      })
    }

    updatePosition()

    window.addEventListener('resize', updatePosition)
    window.addEventListener('scroll', updatePosition, true)

    return () => {
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', updatePosition, true)
    }
  }, [showMembersMenu])

  useLayoutEffect(() => {
    if (!showLabelMenu || !labelMenuButtonRef.current) return

    const updatePosition = () => {
      const rect = labelMenuButtonRef.current.getBoundingClientRect()
      setLabelMenuPosition({
        top: rect.bottom + 8,
        left: rect.left,
      })
    }

    updatePosition()

    window.addEventListener('resize', updatePosition)
    window.addEventListener('scroll', updatePosition, true)

    return () => {
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', updatePosition, true)
    }
  }, [showLabelMenu])

  useLayoutEffect(() => {
    if (!showDateMenu || !dateMenuButtonRef.current) return

    const updatePosition = () => {
      const rect = dateMenuButtonRef.current.getBoundingClientRect()
      setDateMenuPosition({
        top: rect.bottom + 8,
        left: Math.max(16, rect.left - 24),
      })
    }

    updatePosition()

    window.addEventListener('resize', updatePosition)
    window.addEventListener('scroll', updatePosition, true)

    return () => {
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', updatePosition, true)
    }
  }, [showDateMenu])

  useLayoutEffect(() => {
    if (!showTextMenu || !textMenuButtonRef.current) return

    const updatePosition = () => {
      const rect = textMenuButtonRef.current.getBoundingClientRect()
      setTextMenuPosition({
        top: rect.bottom + 8,
        left: rect.left,
      })
    }

    updatePosition()

    window.addEventListener('resize', updatePosition)
    window.addEventListener('scroll', updatePosition, true)

    return () => {
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', updatePosition, true)
    }
  }, [showTextMenu])

  useLayoutEffect(() => {
    if (!showInsertMenu || !insertMenuButtonRef.current) return

    const updatePosition = () => {
      const rect = insertMenuButtonRef.current.getBoundingClientRect()
      setInsertMenuPosition({
        top: rect.bottom + 8,
        left: Math.max(16, rect.right - 280),
      })
    }

    updatePosition()

    window.addEventListener('resize', updatePosition)
    window.addEventListener('scroll', updatePosition, true)

    return () => {
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', updatePosition, true)
    }
  }, [showInsertMenu])

  useLayoutEffect(() => {
    if (!commentTextareaRef.current) return

    const textarea = commentTextareaRef.current
    const minimumHeight = commentFocused ? 42 : 42

    textarea.style.height = 'auto'
    textarea.style.height = `${minimumHeight}px`

    const nextHeight = Math.min(textarea.scrollHeight, 160)
    textarea.style.height = `${Math.max(nextHeight, minimumHeight)}px`
  }, [comment, commentFocused])

  useEffect(() => {
    if (activeChecklist) {
      checklistItemTextareaRef.current?.focus()
    }
  }, [activeChecklist?.items?.length, activeChecklist, checklistComposerOpen])

  useLayoutEffect(() => {
    const nextOverflowingComments = {}

    comments.forEach((commentItem) => {
      const element = commentTextRefs.current[commentItem.id]
      if (!element) return

      const computedStyle = window.getComputedStyle(element)
      const lineHeight = Number.parseFloat(computedStyle.lineHeight) || 19.5
      const maxHeight = lineHeight * 10

      nextOverflowingComments[commentItem.id] = element.scrollHeight > maxHeight + 1
    })

    setOverflowingComments(nextOverflowingComments)
  }, [comments])

  useLayoutEffect(() => {
    if (!showListMenu || !listMenuButtonRef.current) return

    const updatePosition = () => {
      const rect = listMenuButtonRef.current.getBoundingClientRect()
      setListMenuPosition({
        top: rect.bottom + 8,
        left: Math.max(16, rect.left - 24),
      })
    }

    updatePosition()

    window.addEventListener('resize', updatePosition)
    window.addEventListener('scroll', updatePosition, true)

    return () => {
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', updatePosition, true)
    }
  }, [showListMenu])

  return (
    <div className={`${styles.modalOverlay} ${exiting ? styles.overlayOut : ''}`} onClick={close}>
      <div
        className={`${styles.cardModal} ${exiting ? styles.modalOut : ''}`}
        onClick={e => e.stopPropagation()}
        role="dialog" aria-modal="true"
      >
        {/* Header */}
        <div className={styles.cmHeader}>
          <div className={styles.cmHeaderLeft}>
            <button type="button" className={styles.cmStatusBtn}>
              <span>{colTitle}</span>
              <span className={styles.cmStatusBtnIcon}><Icon.Chevron /></span>
            </button>
          </div>
          <div className={styles.cmHeaderActions}>
            <button className={styles.cmIconBtn} onClick={handleDelete} title="Delete card"><Icon.Trash /></button>
            <button className={styles.cmIconBtn} onClick={close} title="Close"><Icon.X /></button>
          </div>
        </div>

        <div className={styles.cmBody}>
          <div className={styles.cmMain}>
            <div className={styles.cmTitleRow}>
              <span className={styles.cmTitleMarker} />
              <textarea
                className={styles.cmTitle}
                value={title}
                onChange={e => setTitle(e.target.value)}
                rows={1}
                placeholder="Titulo do cartao"
              />
            </div>

            <div className={styles.cmToolbar}>
              <button
                ref={membersMenuButtonRef}
                type="button"
                className={`${styles.cmToolbarBtn} ${showMembersMenu ? styles.cmToolbarBtnActive : ''}`}
                onClick={() => setShowMembersMenu(v => !v)}
              >
                <Icon.User />
                Membros
                <span className={styles.cmToolbarBtnChevron}><Icon.Chevron /></span>
              </button>
              <button
                ref={labelMenuButtonRef}
                type="button"
                className={`${styles.cmToolbarBtn} ${showLabelMenu ? styles.cmToolbarBtnActive : ''}`}
                onClick={() => setShowLabelMenu(v => !v)}
              >
                <Icon.Tag />
                Etiquetas
                <span className={styles.cmToolbarBtnChevron}><Icon.Chevron /></span>
              </button>
              <button
                ref={dateMenuButtonRef}
                type="button"
                className={`${styles.cmToolbarBtn} ${showDateMenu ? styles.cmToolbarBtnActive : ''}`}
                onClick={() => setShowDateMenu(v => !v)}
              >
                <Icon.Clock />
                Datas
                <span className={styles.cmToolbarBtnChevron}><Icon.Chevron /></span>
              </button>
              <button
                ref={checklistMenuButtonRef}
                type="button"
                className={`${styles.cmToolbarBtn} ${showChecklistMenu ? styles.cmToolbarBtnActive : ''}`}
                onClick={() => setShowChecklistMenu(v => !v)}
              >
                <Icon.Check />
                Checklist
              </button>
            </div>

              <div className={styles.cmSection}>
                <p className={styles.cmSectionTitle}>
                  <Icon.List />
                  Descricao
              </p>
              <textarea
                className={styles.cmDesc}
                value={desc}
                onChange={e => setDesc(e.target.value)}
                placeholder="Adicione uma descricao mais detalhada..."
                rows={1}
                />
              </div>

              {activeChecklist && (
                <div className={styles.cmChecklistBlock}>
                  <div className={styles.cmChecklistBlockHeader}>
                    <div className={styles.cmChecklistBlockTitleWrap}>
                      <span className={styles.cmChecklistBlockIcon}><Icon.Check /></span>
                      <p className={styles.cmChecklistBlockTitle}>{activeChecklist.title}</p>
                    </div>
                      <button
                        type="button"
                        className={styles.cmChecklistDeleteBtn}
                        onClick={() => {
                          setActiveChecklist(null)
                          setNewChecklistItem('')
                          setChecklistComposerOpen(false)
                        }}
                      >
                        Excluir
                      </button>
                  </div>

                  <div className={styles.cmChecklistProgressRow}>
                    <span className={styles.cmChecklistProgressLabel}>
                      {activeChecklist.items.length === 0
                        ? '0%'
                        : `${Math.round((activeChecklist.items.filter(item => item.checked).length / activeChecklist.items.length) * 100)}%`}
                    </span>
                    <div className={styles.cmChecklistProgressBar}>
                      <span
                        className={styles.cmChecklistProgressFill}
                        style={{
                          width: activeChecklist.items.length === 0
                            ? '0%'
                            : `${Math.round((activeChecklist.items.filter(item => item.checked).length / activeChecklist.items.length) * 100)}%`,
                        }}
                      />
                    </div>
                  </div>

                  {activeChecklist.items.length > 0 && (
                    <div className={styles.cmChecklistItems}>
                      {activeChecklist.items.map(item => (
                        <label key={item.id} className={styles.cmChecklistItemRow}>
                          <button
                            type="button"
                            className={`${styles.cmChecklistItemCheckbox} ${item.checked ? styles.cmChecklistItemCheckboxActive : ''}`}
                            onClick={() => toggleChecklistItem(item.id)}
                          >
                            {item.checked && <Icon.Check />}
                          </button>
                          <span className={`${styles.cmChecklistItemText} ${item.checked ? styles.cmChecklistItemTextChecked : ''}`}>
                            {item.text}
                          </span>
                        </label>
                      ))}
                    </div>
                  )}

                    {checklistComposerOpen ? (
                      <>
                        <textarea
                          ref={checklistItemTextareaRef}
                          className={styles.cmChecklistItemInput}
                          placeholder="Adicionar um item"
                          value={newChecklistItem}
                          onChange={e => setNewChecklistItem(e.target.value)}
                          rows={1}
                          onKeyDown={e => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault()
                              handleChecklistItemAdd()
                            }
                          }}
                        />

                        <div className={styles.cmChecklistActions}>
                          <button type="button" className={styles.cmChecklistPrimaryBtn} onClick={handleChecklistItemAdd}>Adicionar</button>
                          <button
                            type="button"
                            className={styles.cmChecklistSecondaryBtn}
                            onClick={() => {
                              setNewChecklistItem('')
                              setChecklistComposerOpen(false)
                              setShowChecklistAssignMenu(false)
                              setShowChecklistDueMenu(false)
                            }}
                          >
                            Cancelar
                          </button>
                          <button
                            ref={checklistAssignButtonRef}
                            type="button"
                            className={styles.cmChecklistMetaBtn}
                            onClick={() => setShowChecklistAssignMenu(v => !v)}
                          >
                            <Icon.User /> Atribuir
                          </button>
                          <button
                            ref={checklistDueButtonRef}
                            type="button"
                            className={styles.cmChecklistMetaBtn}
                            onClick={() => setShowChecklistDueMenu(v => !v)}
                          >
                            <Icon.Clock /> {checklistDueValue}
                          </button>
                        </div>
                      </>
                    ) : (
                      <button
                        type="button"
                        className={styles.cmChecklistAddItemBtn}
                        onClick={() => setChecklistComposerOpen(true)}
                      >
                        Adicionar um item
                      </button>
                    )}
                  </div>
                )}

              <div className={styles.cmSaveRow}>
                {label && (
                <span className={styles.cmActiveLabel} style={{ background: label.color + '20', color: label.color }}>
                  {label.text}
                </span>
              )}
              <button className={styles.cmSaveBtn} onClick={save}>Salvar alteracoes</button>
            </div>
          </div>

          <div className={styles.cmSidebar}>
            <div className={styles.cmSidebarHeader}>
              <p className={styles.cmSidebarTitle}>
                <Icon.Comment />
                Comentarios e atividade
              </p>
              <button
                type="button"
                className={styles.cmDetailsToggle}
                onClick={() => setShowDetails(v => !v)}
              >
                {showDetails ? 'Ocultar Detalhes' : 'Mostrar Detalhes'}
              </button>
            </div>

            <div className={styles.cmCommentComposer}>
              <div
                ref={commentComposerRef}
                className={`${styles.cmCommentComposerBox} ${commentFocused ? styles.cmCommentComposerBoxActive : ''}`}
              >
                {commentFocused && (
                  <div className={styles.cmCommentToolbar}>
                    <div className={styles.cmCommentToolbarGroup}>
                      <div className={styles.cmCommentDropdown}>
                        <button
                          ref={textMenuButtonRef}
                          type="button"
                          className={`${styles.cmCommentToolBtn} ${showTextMenu ? styles.cmCommentToolBtnActive : ''}`}
                          onMouseDown={e => e.preventDefault()}
                          onClick={() => setShowTextMenu(v => !v)}
                        >
                          Tt
                          <span className={styles.cmCommentToolBtnIcon}><Icon.Chevron /></span>
                        </button>
                      </div>
                      <button type="button" className={styles.cmCommentToolIconBtn} onMouseDown={e => e.preventDefault()}><strong>B</strong></button>
                      <button type="button" className={styles.cmCommentToolIconBtn} onMouseDown={e => e.preventDefault()}><em>I</em></button>
                      <button type="button" className={styles.cmCommentToolIconBtn} onMouseDown={e => e.preventDefault()}>...</button>
                    </div>
                    <div className={styles.cmCommentToolbarGroup}>
                      <button
                        ref={listMenuButtonRef}
                        type="button"
                        className={`${styles.cmCommentToolBtn} ${showListMenu ? styles.cmCommentToolBtnActive : ''}`}
                        onMouseDown={e => e.preventDefault()}
                        onClick={() => setShowListMenu(v => !v)}
                      >
                        <Icon.List />
                        <span className={styles.cmCommentToolBtnIcon}><Icon.Chevron /></span>
                      </button>
                      <button
                        ref={insertMenuButtonRef}
                        type="button"
                        className={`${styles.cmCommentToolBtn} ${showInsertMenu ? styles.cmCommentToolBtnActive : ''}`}
                        onMouseDown={e => e.preventDefault()}
                        onClick={() => setShowInsertMenu(v => !v)}
                      >
                        <Icon.Plus />
                        <span className={styles.cmCommentToolBtnIcon}><Icon.Chevron /></span>
                      </button>
                    </div>
                    <div className={styles.cmCommentToolbarGroup}>
                      <button type="button" className={styles.cmCommentToolIconBtn} onMouseDown={e => e.preventDefault()}>
                        <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><path d="M11.5 4.5L6 10l-2.5-2.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/><path d="M6.5 4H4a1.5 1.5 0 0 0-1.5 1.5V12A1.5 1.5 0 0 0 4 13.5h8A1.5 1.5 0 0 0 13.5 12V9.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/><path d="M9.5 4H12a1.5 1.5 0 0 1 1.5 1.5V7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>
                      </button>
                      <button type="button" className={styles.cmCommentToolIconBtn} onMouseDown={e => e.preventDefault()}>
                        <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.3"/><path d="M8 5.2v3M8 10.9h.01" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>
                      </button>
                    </div>
                  </div>
                )}

                <textarea
                  ref={commentTextareaRef}
                  className={styles.cmCommentTextarea}
                  placeholder="Escrever um comentario..."
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                  onFocus={() => setCommentFocused(true)}
                  onBlur={e => {
                    if (
                      !comment.trim() &&
                      !commentComposerRef.current?.contains(e.relatedTarget)
                    ) {
                      setCommentFocused(false)
                    }
                  }}
                  rows={commentFocused ? 2 : 1}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      addComment()
                    }
                  }}
                />
              </div>
              <button
                className={styles.cmSendBtn}
                onClick={addComment}
                disabled={!comment.trim()}
                aria-label="Send comment"
              >
                <Icon.Send />
              </button>
            </div>

            <div className={styles.cmActivityList}>
              <div className={styles.cmActivityItem}>
                <span className={styles.cmCommentAvatar} style={{ background: '#6b4fd3' }}>AS</span>
                <div className={styles.cmActivityContent}>
                  <p className={styles.cmActivityText}>
                    <strong>Arthur Fleming Santos</strong> adicionou este cartao a {colTitle}
                  </p>
                  <span className={styles.cmCommentTime}>ha 1 hora</span>
                </div>
              </div>

              {comments.map(c => {
                const m = MEMBERS.find(x => x.id === c.author)
                const isExpanded = expandedComments[c.id]
                const isOverflowing = overflowingComments[c.id]
                return (
                  <div key={c.id} className={styles.cmActivityItem}>
                    <span className={styles.cmCommentAvatar} style={{ background: m?.color }}>{m?.initials}</span>
                    <div className={styles.cmActivityContent}>
                      <p
                        ref={element => {
                          if (element) {
                            commentTextRefs.current[c.id] = element
                          } else {
                            delete commentTextRefs.current[c.id]
                          }
                        }}
                        className={`${styles.cmActivityText} ${!isExpanded ? styles.cmActivityTextClamped : ''}`}
                      >
                        <strong>{getMemberName(m?.initials)}</strong> {c.text}
                      </p>
                      {isOverflowing && (
                        <button
                          type="button"
                          className={styles.cmActivityToggle}
                          onMouseDown={e => e.stopPropagation()}
                          onClick={e => {
                            e.stopPropagation()
                            setExpandedComments(prev => ({ ...prev, [c.id]: !prev[c.id] }))
                          }}
                        >
                          {isExpanded ? 'Ver menos' : 'Ver mais'}
                        </button>
                      )}
                      <span className={styles.cmCommentTime}>{c.time}</span>
                    </div>
                  </div>
                )
              })}
            </div>

              {showDetails && (
                <div className={styles.cmDetailsPanel}>
                  <div className={styles.cmMeta}>
                    <p className={styles.cmMetaTitle}><Icon.Clock /> Data</p>
                    <input
                    type="text"
                    className={styles.cmDateInput}
                    value={dueDate}
                    onChange={e => setDueDate(e.target.value)}
                    placeholder="ex: Aug 14"
                  />
                </div>

                {selectedMembers.length > 0 && (
                  <div className={styles.cmMeta}>
                    <p className={styles.cmMetaTitle}>Selecionados</p>
                    <div className={styles.cmSelectedMembers}>
                      {selectedMembers.map(member => (
                        <span key={member.id} className={styles.cmSelectedMember}>
                          <span className={styles.cmMemberAvatar} style={{ background: member.color }}>{member.initials}</span>
                          {getMemberName(member.initials)}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

      </div>

      {showTextMenu && (
        <div
          ref={textMenuRef}
          className={styles.cmTextMenu}
          style={{ top: `${textMenuPosition.top}px`, left: `${textMenuPosition.left}px` }}
          onClick={e => e.stopPropagation()}
        >
          {[
            { label: 'Texto normal', shortcut: 'Ctrl+Alt+0' },
            { label: 'Titulo 1', shortcut: 'Ctrl+Alt+1' },
            { label: 'Titulo 2', shortcut: 'Ctrl+Alt+2' },
            { label: 'Titulo 3', shortcut: 'Ctrl+Alt+3' },
            { label: 'Titulo 4', shortcut: 'Ctrl+Alt+4' },
            { label: 'Titulo 5', shortcut: 'Ctrl+Alt+5' },
            { label: 'Titulo 6', shortcut: 'Ctrl+Alt+6' },
          ].map(option => (
            <button
              key={option.label}
              type="button"
              className={styles.cmTextMenuItem}
              onMouseDown={e => e.preventDefault()}
              onClick={() => setShowTextMenu(false)}
            >
              <span>{option.label}</span>
              <span className={styles.cmTextMenuShortcut}>{option.shortcut}</span>
            </button>
          ))}
        </div>
      )}

      {showMembersMenu && (
        <div
          ref={membersMenuRef}
          className={styles.cmMembersMenu}
          style={{ top: `${membersMenuPosition.top}px`, left: `${membersMenuPosition.left}px` }}
          onClick={e => e.stopPropagation()}
        >
          <div className={styles.cmMemberList}>
            {MEMBERS.map(m => (
              <button
                key={m.id}
                className={`${styles.cmMemberOpt} ${memberIds.includes(m.id) ? styles.cmMemberOptActive : ''}`}
                onClick={() => toggleMember(m.id)}
              >
                <span className={styles.cmMemberAvatar} style={{ background: m.color }}>{m.initials}</span>
                <span className={styles.cmMemberName}>{getMemberName(m.initials)}</span>
                {memberIds.includes(m.id) && <span className={styles.cmMemberCheck}><Icon.Check /></span>}
              </button>
            ))}
            <button
              type="button"
              className={styles.cmMembersMenuCreate}
              onClick={() => setShowMembersMenu(false)}
            >
              <span className={styles.cmMembersMenuCreateIcon}><Icon.Plus /></span>
              Novo Membro
            </button>
          </div>
        </div>
      )}

      {showChecklistMenu && (
        <div
          ref={checklistMenuRef}
          className={styles.cmChecklistMenu}
          style={{ top: `${checklistMenuPosition.top}px`, left: `${checklistMenuPosition.left}px` }}
          onClick={e => e.stopPropagation()}
        >
          <div className={styles.cmChecklistMenuHeader}>
            <h3 className={styles.cmChecklistMenuTitle}>Adicionar Checklist</h3>
            <button type="button" className={styles.cmChecklistMenuClose} onClick={() => setShowChecklistMenu(false)}>
              <Icon.X />
            </button>
          </div>

          <div className={styles.cmChecklistMenuBody}>
            <label className={styles.cmChecklistMenuLabel}>Titulo</label>
            <input
              type="text"
              className={styles.cmChecklistMenuInput}
              value={checklistTitle}
              onChange={e => setChecklistTitle(e.target.value)}
            />
            <button
              type="button"
              className={styles.cmChecklistMenuAdd}
              onClick={handleChecklistCreate}
            >
              Adicionar
            </button>
          </div>
        </div>
      )}

      {showChecklistAssignMenu && (
        <div
          ref={checklistAssignMenuRef}
          className={styles.cmChecklistCompactMenu}
          style={{ top: `${checklistAssignMenuPosition.top}px`, left: `${checklistAssignMenuPosition.left}px` }}
          onClick={e => e.stopPropagation()}
        >
          {MEMBERS.map(member => (
            <button
              key={member.id}
              type="button"
              className={`${styles.cmChecklistCompactItem} ${memberIds.includes(member.id) ? styles.cmChecklistCompactItemActive : ''}`}
              onClick={() => toggleMember(member.id)}
            >
              <span className={styles.cmMemberAvatar} style={{ background: member.color }}>{member.initials}</span>
              <span>{getMemberName(member.initials)}</span>
              {memberIds.includes(member.id) && (
                <span className={styles.cmLabelCheck}>
                  <Icon.Check />
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {showChecklistDueMenu && (
        <div
          ref={checklistDueMenuRef}
          className={styles.cmChecklistDateMenu}
          style={{ top: `${checklistDueMenuPosition.top}px`, left: `${checklistDueMenuPosition.left}px` }}
          onClick={e => e.stopPropagation()}
        >
          <div className={styles.cmChecklistDateMenuHeader}>
            <h3 className={styles.cmChecklistDateMenuTitle}>Datas</h3>
            <button type="button" className={styles.cmChecklistDateMenuClose} onClick={() => setShowChecklistDueMenu(false)}>
              <Icon.X />
            </button>
          </div>

          <div className={styles.cmChecklistDateMenuMonthBar}>
            <div className={styles.cmChecklistDateMenuMonthNav}>
              <button type="button" className={styles.cmChecklistDateMenuNavBtn}>«</button>
              <button type="button" className={styles.cmChecklistDateMenuNavBtn}>‹</button>
            </div>
            <span className={styles.cmChecklistDateMenuMonthLabel}>abril 2026</span>
            <div className={styles.cmChecklistDateMenuMonthNav}>
              <button type="button" className={styles.cmChecklistDateMenuNavBtn}>›</button>
              <button type="button" className={styles.cmChecklistDateMenuNavBtn}>»</button>
            </div>
          </div>

          <div className={styles.cmChecklistDateMenuWeekdays}>
            {['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab'].map(day => (
              <span key={day}>{day}</span>
            ))}
          </div>

          <div className={styles.cmChecklistDateMenuGrid}>
            {CALENDAR_DAYS.map((day, index) => (
              <button
                key={`${day.label}-${index}`}
                type="button"
                className={`${styles.cmChecklistDateMenuDay} ${day.muted ? styles.cmChecklistDateMenuDayMuted : ''} ${checklistSelectedDay === day.label && !day.muted ? styles.cmChecklistDateMenuDaySelected : ''}`}
                onClick={() => {
                  if (day.muted) return
                  setChecklistSelectedDay(day.label)
                  setChecklistDueEnabled(true)
                  setChecklistDueValue(`${String(day.label).padStart(2, '0')}/04/26`)
                }}
              >
                <span className={day.underline ? styles.cmChecklistDateMenuDayUnderline : ''}>{day.label}</span>
              </button>
            ))}
          </div>

          <div className={styles.cmChecklistDateMenuFields}>
            <div className={styles.cmChecklistDateMenuFieldGroup}>
              <label className={styles.cmChecklistDateMenuFieldLabel}>Data de Inicio</label>
              <div className={styles.cmChecklistDateMenuInputRow}>
                <button
                  type="button"
                  className={`${styles.cmDateCheckbox} ${checklistStartEnabled ? styles.cmDateCheckboxActive : ''}`}
                  onClick={() => setChecklistStartEnabled(v => !v)}
                >
                  {checklistStartEnabled && <Icon.Check />}
                </button>
                <input
                  type="text"
                  className={styles.cmChecklistDateMenuInput}
                  placeholder="D/M/AAAA"
                  value={checklistStartDateValue}
                  onChange={e => setChecklistStartDateValue(e.target.value)}
                  disabled={!checklistStartEnabled}
                />
              </div>
            </div>

            <div className={styles.cmChecklistDateMenuFieldGroup}>
              <label className={styles.cmChecklistDateMenuFieldLabel}>Data de Entrega</label>
              <div className={styles.cmChecklistDateMenuInputRow}>
                <button
                  type="button"
                  className={`${styles.cmDateCheckbox} ${checklistDueEnabled ? styles.cmDateCheckboxActive : ''}`}
                  onClick={() => {
                    setChecklistDueEnabled(v => !v)
                    if (checklistDueEnabled) {
                      setChecklistDueValue('Sem data')
                    } else if (checklistDueValue === 'Sem data') {
                      setChecklistDueValue('07/04/26')
                    }
                  }}
                >
                  {checklistDueEnabled && <Icon.Check />}
                </button>
                <input
                  type="text"
                  className={styles.cmChecklistDateMenuInput}
                  value={checklistDueValue}
                  onChange={e => setChecklistDueValue(e.target.value)}
                  disabled={!checklistDueEnabled}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {showLabelMenu && (
        <div
          ref={labelMenuRef}
          className={styles.cmLabelMenu}
          style={{ top: `${labelMenuPosition.top}px`, left: `${labelMenuPosition.left}px` }}
          onClick={e => e.stopPropagation()}
        >
          <div className={styles.cmLabelMenuList}>
            {LABELS.map(l => (
              <button
                key={l.id}
                className={`${styles.cmLabelOpt} ${labelId === l.id ? styles.cmLabelOptActive : ''}`}
                style={labelId === l.id ? { background: l.color + '20', borderColor: l.color, color: l.color } : {}}
                onClick={() => {
                  setLabelId(labelId === l.id ? null : l.id)
                  setShowLabelMenu(false)
                }}
              >
                <span className={styles.cmLabelDot} style={{ background: l.color }} />
                {l.text}
                {labelId === l.id && <span className={styles.cmLabelCheck}><Icon.Check /></span>}
              </button>
            ))}
            <button
              type="button"
              className={styles.cmLabelMenuCreate}
              onClick={() => setShowLabelMenu(false)}
            >
              <span className={styles.cmLabelMenuCreateIcon}><Icon.Plus /></span>
              Nova Etiqueta
            </button>
          </div>
        </div>
      )}

      {showDateMenu && (
        <div
          ref={dateMenuRef}
          className={styles.cmDateMenu}
          style={{ top: `${dateMenuPosition.top}px`, left: `${dateMenuPosition.left}px` }}
          onClick={e => e.stopPropagation()}
        >
          <div className={styles.cmDateMenuHeader}>
            <h3 className={styles.cmDateMenuTitle}>Datas</h3>
            <button type="button" className={styles.cmDateMenuClose} onClick={() => setShowDateMenu(false)}>
              <Icon.X />
            </button>
          </div>

          <div className={styles.cmDateMenuMonthBar}>
            <div className={styles.cmDateMenuMonthNav}>
              <button type="button" className={styles.cmDateMenuNavBtn}>«</button>
              <button type="button" className={styles.cmDateMenuNavBtn}>‹</button>
            </div>
            <span className={styles.cmDateMenuMonthLabel}>abril 2026</span>
            <div className={styles.cmDateMenuMonthNav}>
              <button type="button" className={styles.cmDateMenuNavBtn}>›</button>
              <button type="button" className={styles.cmDateMenuNavBtn}>»</button>
            </div>
          </div>

          <div className={styles.cmDateMenuWeekdays}>
            {['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab'].map(day => (
              <span key={day}>{day}</span>
            ))}
          </div>

          <div className={styles.cmDateMenuGrid}>
            {CALENDAR_DAYS.map((day, index) => (
              <button
                key={`${day.label}-${index}`}
                type="button"
                className={`${styles.cmDateMenuDay} ${day.muted ? styles.cmDateMenuDayMuted : ''} ${selectedCalendarDay === day.label && !day.muted ? styles.cmDateMenuDaySelected : ''}`}
                onClick={() => {
                  if (day.muted) return
                  setSelectedCalendarDay(day.label)
                  setDueDateValue(`${String(day.label).padStart(2, '0')}/04/26`)
                }}
              >
                <span className={day.underline ? styles.cmDateMenuDayUnderline : ''}>{day.label}</span>
              </button>
            ))}
          </div>

          <div className={styles.cmDateMenuFields}>
            <div className={styles.cmDateMenuFieldGroup}>
              <label className={styles.cmDateMenuFieldLabel}>Data de inicio</label>
              <div className={styles.cmDateMenuInputRow}>
                <button
                  type="button"
                  className={`${styles.cmDateCheckbox} ${startEnabled ? styles.cmDateCheckboxActive : ''}`}
                  onClick={() => setStartEnabled(v => !v)}
                >
                  {startEnabled && <Icon.Check />}
                </button>
                <input
                  type="text"
                  className={styles.cmDateMenuInput}
                  placeholder="D/M/AAAA"
                  value={startDateValue}
                  onChange={e => setStartDateValue(e.target.value)}
                  disabled={!startEnabled}
                />
              </div>
            </div>

            <div className={styles.cmDateMenuFieldGroup}>
              <label className={styles.cmDateMenuFieldLabel}>Data de entrega</label>
              <div className={styles.cmDateMenuInputRow}>
                <button
                  type="button"
                  className={`${styles.cmDateCheckbox} ${dueEnabled ? styles.cmDateCheckboxActive : ''}`}
                  onClick={() => setDueEnabled(v => !v)}
                >
                  {dueEnabled && <Icon.Check />}
                </button>
                <input
                  type="text"
                  className={`${styles.cmDateMenuInput} ${styles.cmDateMenuInputCompact}`}
                  value={dueDateValue}
                  onChange={e => setDueDateValue(e.target.value)}
                  disabled={!dueEnabled}
                />
                <input
                  type="text"
                  className={`${styles.cmDateMenuInput} ${styles.cmDateMenuInputTime}`}
                  value={dueTimeValue}
                  onChange={e => setDueTimeValue(e.target.value)}
                  disabled={!dueEnabled}
                />
              </div>
            </div>

            <div className={styles.cmDateMenuFieldGroup}>
              <label className={styles.cmDateMenuFieldLabel}>Recorrente</label>
              <button type="button" className={styles.cmDateMenuSelect} onClick={() => setRecurringValue(recurringValue)}>
                <span>{recurringValue}</span>
                <span className={styles.cmDateMenuSelectChevron}><Icon.Chevron /></span>
              </button>
            </div>

            <div className={styles.cmDateMenuFieldGroup}>
              <label className={styles.cmDateMenuFieldLabel}>Definir lembrete</label>
              <button type="button" className={styles.cmDateMenuSelect} onClick={() => setReminderValue(reminderValue)}>
                <span>{reminderValue}</span>
                <span className={styles.cmDateMenuSelectChevron}><Icon.Chevron /></span>
              </button>
              <p className={styles.cmDateMenuHint}>Lembretes serao enviados a todos os membros e seguidores deste cartao.</p>
            </div>
          </div>

          <div className={styles.cmDateMenuActions}>
            <button type="button" className={styles.cmDateMenuSave} onClick={handleDateSave}>Salvar</button>
            <button type="button" className={styles.cmDateMenuRemove} onClick={handleDateRemove}>Remover</button>
          </div>
        </div>
      )}

      {showInsertMenu && (
        <div
          ref={insertMenuRef}
          className={styles.cmInsertMenu}
          style={{ top: `${insertMenuPosition.top}px`, left: `${insertMenuPosition.left}px` }}
          onClick={e => e.stopPropagation()}
        >
          {[
            {
              label: 'Link',
              description: 'Insira um link',
              icon: <Icon.Link />,
            },
            {
              label: 'Arquivo',
              description: 'Anexe um arquivo',
              icon: <Icon.Files />,
            },
            {
              label: 'Imagem',
              description: 'Adicione uma imagem',
              icon: <Icon.Image />,
            },
            {
              label: 'Codigo',
              description: 'Exibir codigo com destaque',
              icon: <Icon.Code />,
            },
          ].map(option => (
            <button
              key={option.label}
              type="button"
              className={styles.cmInsertMenuItem}
              onMouseDown={e => e.preventDefault()}
              onClick={() => setShowInsertMenu(false)}
            >
              <span className={styles.cmInsertMenuIcon}>{option.icon}</span>
              <span className={styles.cmInsertMenuContent}>
                <span className={styles.cmInsertMenuLabel}>{option.label}</span>
                <span className={styles.cmInsertMenuDescription}>{option.description}</span>
              </span>
            </button>
          ))}
        </div>
      )}

      {showListMenu && (
        <div
          ref={listMenuRef}
          className={styles.cmListMenu}
          style={{ top: `${listMenuPosition.top}px`, left: `${listMenuPosition.left}px` }}
          onClick={e => e.stopPropagation()}
        >
          {[
            { label: 'Lista de marcadores', shortcut: 'Ctrl+Shift+8' },
            { label: 'Lista numerada', shortcut: 'Ctrl+Shift+7' },
          ].map(option => (
            <button
              key={option.label}
              type="button"
              className={styles.cmListMenuItem}
              onMouseDown={e => e.preventDefault()}
              onClick={() => setShowListMenu(false)}
            >
              <span>{option.label}</span>
              <span className={styles.cmListMenuShortcut}>{option.shortcut}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   KANBAN CARD
═══════════════════════════════════════════════════════════════ */
function KanbanCard({ card, colId, isDragging, isDropTarget, onDragStart, onDragOver, onDrop, onDragEnd, onClick }) {
  const label   = LABELS.find(l => l.id === card.labelId)
  const members = card.memberIds.map(id => MEMBERS.find(m => m.id === id)).filter(Boolean)

  return (
    <div
      className={`
        ${styles.card}
        ${isDragging    ? styles.cardDragging    : ''}
        ${isDropTarget  ? styles.cardDropTarget  : ''}
      `}
      draggable
      onDragStart={() => onDragStart(card.id, colId)}
      onDragOver={e => { e.preventDefault(); e.stopPropagation(); onDragOver({ type: 'card', cardId: card.id, colId }) }}
      onDrop={e => { e.preventDefault(); e.stopPropagation(); onDrop({ type: 'card', cardId: card.id, colId }) }}
      onDragEnd={onDragEnd}
      onClick={onClick}
    >
      {label && (
        <span className={styles.cardLabel} style={{ background: label.color + '20', color: label.color }}>
          {label.text}
        </span>
      )}

      <p className={styles.cardTitle}>{card.title}</p>

      <div className={styles.cardFooter}>
        <div className={styles.cardMembers}>
          {members.map(m => (
            <span key={m.id} className={styles.cardAvatar} style={{ background: m.color }} title={m.initials}>{m.initials}</span>
          ))}
        </div>
        <div className={styles.cardMeta}>
          {card.comments.length > 0 && (
            <span className={styles.cardMetaItem}>
              <Icon.Comment />
              <span>{card.comments.length}</span>
            </span>
          )}
          {card.dueDate && (
            <span className={`${styles.cardDue} ${card.dueDate === 'Today' ? styles.cardDueUrgent : ''}`}>
              <Icon.Clock />
              {card.dueDate}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   COLUMN MENU
═══════════════════════════════════════════════════════════════ */
function ColMenu({ colId, onRename, onDelete, onChangeColor, onClose }) {
  const ref = useRef(null)

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (!ref.current?.contains(event.target)) {
        onClose()
      }
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [onClose])

  return (
    <div className={styles.colMenu} ref={ref} role="menu">
      <button className={styles.colMenuItem} onClick={() => { onRename(); onClose() }}>
        <Icon.Edit /> Rename
      </button>
      {COL_COLORS.map(c => (
        <button key={c.id} className={styles.colMenuColorOpt} onClick={() => { onChangeColor(c.value); onClose() }} title={c.id}>
          <span className={styles.colMenuColorDot} style={{ background: c.value }} />
        </button>
      ))}
      <div className={styles.colMenuDivider} />
      <button className={`${styles.colMenuItem} ${styles.colMenuItemDanger}`} onClick={() => { onDelete(); onClose() }}>
        <Icon.Trash /> Delete list
      </button>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   KANBAN COLUMN
═══════════════════════════════════════════════════════════════ */
function KanbanColumn({ col, dragState, dropTarget, onDragStart, onDragOver, onDrop, onDragEnd, onAddCard, onDeleteCol, onRenameCol, onChangeColColor, onCardClick, onDeleteCard }) {
  const [addingCard,  setAddingCard]  = useState(false)
  const [newCardText, setNewCardText] = useState('')
  const [showMenu,    setShowMenu]    = useState(false)
  const [renaming,    setRenaming]    = useState(false)
  const [renameVal,   setRenameVal]   = useState(col.title)
  const addInputRef = useRef(null)
  const renameRef   = useRef(null)

  const isColDropTarget = dropTarget?.type === 'col' && dropTarget.colId === col.id

  const submitCard = () => {
    if (newCardText.trim()) { onAddCard(col.id, newCardText.trim()); setNewCardText(''); setAddingCard(false) }
  }

  const submitRename = () => {
    if (renameVal.trim()) onRenameCol(col.id, renameVal.trim())
    setRenaming(false)
  }

  return (
    <div
      className={`${styles.column} ${isColDropTarget ? styles.columnDropTarget : ''}`}
      onDragOver={e => { e.preventDefault(); onDragOver({ type: 'col', colId: col.id }) }}
      onDrop={e => { e.preventDefault(); onDrop({ type: 'col', colId: col.id }) }}
    >
      {/* Column header */}
      <div className={styles.colHeader}>
        <div className={styles.colHeaderLeft}>
          <span className={styles.colDot} style={{ background: col.color }} />
          {renaming ? (
            <input
              ref={renameRef}
              className={styles.colRenameInput}
              value={renameVal}
              onChange={e => setRenameVal(e.target.value)}
              onBlur={submitRename}
              onKeyDown={e => { if (e.key === 'Enter') submitRename(); if (e.key === 'Escape') setRenaming(false) }}
              autoFocus
            />
          ) : (
            <span className={styles.colTitle}>{col.title}</span>
          )}
          <span className={styles.colCount}>{col.cards.length}</span>
        </div>
        <div className={styles.colHeaderRight}>
          <button className={styles.colActionBtn} onClick={() => { setAddingCard(true); setTimeout(() => addInputRef.current?.focus(), 50) }} title="Add card">
            <Icon.Plus />
          </button>
          <div className={styles.colMenuWrap}>
            <button className={styles.colActionBtn} onClick={() => setShowMenu(v => !v)} title="Column options">
              <Icon.More />
            </button>
            {showMenu && (
              <ColMenu
                colId={col.id}
                onRename={() => { setRenaming(true); setRenameVal(col.title) }}
                onDelete={() => onDeleteCol(col.id)}
                onChangeColor={c => onChangeColColor(col.id, c)}
                onClose={() => setShowMenu(false)}
              />
            )}
          </div>
        </div>
      </div>

      {/* Cards */}
      <div className={styles.colCards}>
        {col.cards.map(card => (
          <KanbanCard
            key={card.id}
            card={card}
            colId={col.id}
            isDragging={dragState?.cardId === card.id}
            isDropTarget={dropTarget?.type === 'card' && dropTarget.cardId === card.id}
            onDragStart={onDragStart}
            onDragOver={onDragOver}
            onDrop={onDrop}
            onDragEnd={onDragEnd}
            onClick={() => onCardClick(card, col.title)}
          />
        ))}

        {/* Add card inline form */}
        {addingCard && (
          <div className={styles.addCardForm}>
            <textarea
              ref={addInputRef}
              className={styles.addCardInput}
              placeholder="Card title…"
              value={newCardText}
              onChange={e => setNewCardText(e.target.value)}
              rows={2}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submitCard() }
                if (e.key === 'Escape') { setAddingCard(false); setNewCardText('') }
              }}
            />
            <div className={styles.addCardActions}>
              <button className={styles.addCardSubmit} onClick={submitCard} disabled={!newCardText.trim()}>Add card</button>
              <button className={styles.addCardCancel} onClick={() => { setAddingCard(false); setNewCardText('') }}>
                <Icon.X />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add card button at bottom */}
      {!addingCard && (
        <button
          className={styles.colAddBtn}
          onClick={() => { setAddingCard(true); setTimeout(() => addInputRef.current?.focus(), 50) }}
        >
          <Icon.Plus />
          Add card
        </button>
      )}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   MAIN BOARD
═══════════════════════════════════════════════════════════════ */
export default function KanbanBoard() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [columns,   setColumns]   = useState(INITIAL_COLS)
  const [dragState, setDragState] = useState(null)   // { cardId, sourceColId }
  const [dropTarget,setDropTarget]= useState(null)   // { type:'card'|'col', cardId?, colId }
  const [activeCard,setActiveCard]= useState(null)   // { card, colTitle }
  const [addingCol, setAddingCol] = useState(false)
  const [newColTitle,setNewColTitle] = useState('')

  /* ── DnD ── */
  const handleDragStart = useCallback((cardId, sourceColId) => {
    setDragState({ cardId, sourceColId })
  }, [])

  const handleDragOver = useCallback((target) => {
    setDropTarget(target)
  }, [])

  const handleDrop = useCallback((target) => {
    if (!dragState) return
    const { cardId, sourceColId } = dragState

    setColumns(prev => {
      const cols = prev.map(c => ({ ...c, cards: [...c.cards] }))
      const srcCol = cols.find(c => c.id === sourceColId)
      const card   = srcCol?.cards.find(c => c.id === cardId)
      if (!card) return prev

      // Remove from source
      srcCol.cards = srcCol.cards.filter(c => c.id !== cardId)

      if (target.type === 'col') {
        const destCol = cols.find(c => c.id === target.colId)
        if (!destCol) return prev
        destCol.cards.push(card)
      } else {
        // Insert before target card
        const destCol = cols.find(c => c.id === target.colId)
        if (!destCol) return prev
        const idx = destCol.cards.findIndex(c => c.id === target.cardId)
        if (idx === -1) { destCol.cards.push(card) }
        else            { destCol.cards.splice(idx, 0, card) }
      }
      return cols
    })

    setDragState(null)
    setDropTarget(null)
  }, [dragState])

  const handleDragEnd = useCallback(() => {
    setDragState(null)
    setDropTarget(null)
  }, [])

  /* ── Column ops ── */
  const addColumn = () => {
    if (!newColTitle.trim()) return
    setColumns(prev => [...prev, { id: uid(), title: newColTitle.trim(), color: '#a0a0a0', cards: [] }])
    setNewColTitle('')
    setAddingCol(false)
  }

  const deleteColumn = (colId) => {
    setColumns(prev => prev.filter(c => c.id !== colId))
  }

  const renameColumn = (colId, title) => {
    setColumns(prev => prev.map(c => c.id === colId ? { ...c, title } : c))
  }

  const changeColColor = (colId, color) => {
    setColumns(prev => prev.map(c => c.id === colId ? { ...c, color } : c))
  }

  /* ── Card ops ── */
  const addCard = (colId, title) => {
    const card = { id: uid(), title, description: '', labelId: null, memberIds: [], dueDate: '', comments: [] }
    setColumns(prev => prev.map(c => c.id === colId ? { ...c, cards: [card, ...c.cards] } : c))
  }

  const updateCard = (updatedCard) => {
    setColumns(prev => prev.map(c => ({
      ...c,
      cards: c.cards.map(card => card.id === updatedCard.id ? updatedCard : card)
    })))
  }

  const deleteCard = (cardId) => {
    setColumns(prev => prev.map(c => ({ ...c, cards: c.cards.filter(card => card.id !== cardId) })))
  }

  const totalCards = columns.reduce((s, c) => s + c.cards.length, 0)

  return (
    <div className={`${styles.shell} ${sidebarCollapsed ? styles.shellCollapsed : ''}`}>
      <Sidebar collapsed={sidebarCollapsed} onCollapse={() => setSidebarCollapsed(v => !v)} />

      <div className={styles.boardWrapper}>
        {/* ── Board header ── */}
        <header className={styles.boardHeader}>
          <div className={styles.boardHeaderLeft}>
            <div className={styles.boardBreadcrumb}>
              <a href="/workspace" className={styles.boardBreadcrumbLink}>Workspace</a>
              <span className={styles.boardBreadcrumbSep}>›</span>
              <span className={styles.boardBreadcrumbCurrent}>Product Launch — Q3</span>
            </div>
            <div className={styles.boardTitleRow}>
              <span className={styles.boardIcon}><Icon.Board /></span>
              <h1 className={styles.boardTitle}>Product Launch — Q3</h1>
              <span className={styles.boardCardBadge}>{totalCards} cards</span>
            </div>
          </div>

          <div className={styles.boardHeaderRight}>
            {/* Member stack */}
            <div className={styles.boardMembers}>
              {MEMBERS.map(m => (
                <span key={m.id} className={styles.boardMemberAvatar} style={{ background: m.color }} title={m.initials}>
                  {m.initials}
                </span>
              ))}
              <button className={styles.boardMemberAdd} title="Invite member">
                <Icon.Plus />
              </button>
            </div>

            <div className={styles.boardHeaderDivider} />

            <button className={styles.boardHeaderBtn}>
              <Icon.Filter /> Filter
            </button>
            <button className={styles.boardHeaderBtnPrimary}>
              <Icon.Share /> Share
            </button>
          </div>
        </header>

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
              onDeleteCard={deleteCard}
            />
          ))}

          {/* Add column */}
          <div className={styles.addColWrap}>
            {addingCol ? (
              <div className={styles.addColForm}>
                <input
                  className={styles.addColInput}
                  placeholder="List name…"
                  value={newColTitle}
                  onChange={e => setNewColTitle(e.target.value)}
                  autoFocus
                  onKeyDown={e => {
                    if (e.key === 'Enter') addColumn()
                    if (e.key === 'Escape') { setAddingCol(false); setNewColTitle('') }
                  }}
                />
                <div className={styles.addColActions}>
                  <button className={styles.addColSubmit} onClick={addColumn} disabled={!newColTitle.trim()}>
                    Add list
                  </button>
                  <button className={styles.addColCancel} onClick={() => { setAddingCol(false); setNewColTitle('') }}>
                    <Icon.X />
                  </button>
                </div>
              </div>
            ) : (
              <button className={styles.addColBtn} onClick={() => setAddingCol(true)}>
                <Icon.Plus />
                Add list
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Card modal ── */}
      {activeCard && (
        <CardModal
          card={activeCard.card}
          colTitle={activeCard.colTitle}
          onClose={() => setActiveCard(null)}
          onUpdate={updatedCard => { updateCard(updatedCard); setActiveCard(null) }}
          onDelete={cardId => { deleteCard(cardId); setActiveCard(null) }}
        />
      )}
    </div>
  )
}
