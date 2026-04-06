import { useState, useEffect, useRef } from 'react'
import styles from './Workspace.module.css'

/* ═══════════════════════════════════════════
   ICONS
═══════════════════════════════════════════ */
function HomeIcon()     { return <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 6.5L8 2l6 4.5V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V6.5z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/><path d="M6 15V9h4v6" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/></svg> }
function CalendarIcon() { return <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="1.5" y="3" width="13" height="12" rx="2" stroke="currentColor" strokeWidth="1.3"/><path d="M5 1.5V4M11 1.5V4M1.5 7h13" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg> }
function CanvasIcon()   { return <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="1.5" y="1.5" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.3"/><rect x="8.5" y="1.5" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.3"/><rect x="1.5" y="8.5" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.3"/><rect x="8.5" y="8.5" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.3"/></svg> }
function ChatIcon()     { return <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M14 8.5A6 6 0 0 1 4.5 13.5L1.5 14.5l1-3A6 6 0 1 1 14 8.5z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/></svg> }
function FilesIcon()    { return <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M9 1.5H4a1.5 1.5 0 0 0-1.5 1.5v10A1.5 1.5 0 0 0 4 14.5h8A1.5 1.5 0 0 0 13.5 13V6L9 1.5z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/><path d="M9 1.5V6H13.5" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/></svg> }
function PlusIcon()     { return <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 2v10M2 7h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg> }
function ImagePlusIcon(){ return <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="1.5" y="2" width="11" height="9.5" rx="2" stroke="currentColor" strokeWidth="1.2"/><path d="M4 8l1.7-1.8a.8.8 0 0 1 1.2 0L9 8.5l1-1a.8.8 0 0 1 1.1 0L12.5 9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/><path d="M10.5 1.5v3M9 3h3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg> }
function SearchIcon()   { return <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.3"/><path d="M9.5 9.5L12.5 12.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg> }
function GridIcon()     { return <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="1" y="1" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.3"/><rect x="8" y="1" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.3"/><rect x="1" y="8" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.3"/><rect x="8" y="8" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.3"/></svg> }
function ListIcon()     { return <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 4h8M3 7h8M3 10h5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg> }
function ChevronIcon()  { return <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M4.5 3l3 3-3 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg> }
function XIcon()        { return <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg> }
function CollapseIcon() { return <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M9 2L5 7l4 5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg> }
function UserIcon()     { return <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="5" r="2.5" stroke="currentColor" strokeWidth="1.3"/><path d="M2 12c0-2.2 2.2-4 5-4s5 1.8 5 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg> }
function AddUserIcon()  { return <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="6" cy="5" r="2.5" stroke="currentColor" strokeWidth="1.3"/><path d="M1 12c0-2 1.8-3.5 4.5-3.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/><path d="M10 8.5v4M8 10.5h4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg> }
function UpgradeIcon()  { return <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 2l1.8 3.6L13 6.3l-3 2.9.7 4.1L7 11.2 3.3 13.3l.7-4.1-3-2.9 4.2-.7z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/></svg> }
function SettingsIcon() { return <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="2" stroke="currentColor" strokeWidth="1.3"/><path d="M7 1v1.5M7 11.5V13M1 7h1.5M11.5 7H13M2.93 2.93l1.06 1.06M10.01 10.01l1.06 1.06M2.93 11.07l1.06-1.06M10.01 3.99l1.06-1.06" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg> }
function LogOutIcon()   { return <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M5 2H3a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/><path d="M9.5 9.5L12 7l-2.5-2.5M5.5 7H12" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg> }

function LogoMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
      <rect x="2"  y="2"  width="7" height="7" rx="2" fill="currentColor"/>
      <rect x="11" y="2"  width="7" height="7" rx="2" fill="currentColor" opacity=".35"/>
      <rect x="2"  y="11" width="7" height="7" rx="2" fill="currentColor" opacity=".55"/>
      <rect x="11" y="11" width="7" height="7" rx="2" fill="currentColor" opacity=".75"/>
    </svg>
  )
}

/* ═══════════════════════════════════════════
   DATA
═══════════════════════════════════════════ */
const NAV_ITEMS = [
  { id: 'home',     label: 'Home',     Icon: HomeIcon     },
  { id: 'calendar', label: 'Calendar', Icon: CalendarIcon },
  { id: 'canvas',   label: 'Canvas',   Icon: CanvasIcon   },
  { id: 'chat',     label: 'Chat',     Icon: ChatIcon     },
  { id: 'files',    label: 'Files',    Icon: FilesIcon    },
]

const PLAN_TAGS = [
  { label: 'Engineering', color: 'var(--color-green)'  },
  { label: 'Design',      color: '#d4aef1'             },
  { label: 'Marketing',   color: 'var(--color-blue)'   },
  { label: 'Research',    color: '#f5a623'             },
  { label: 'Growth',      color: 'var(--color-red)'    },
  { label: 'Operations',  color: '#a0a0a0'             },
]

const COVER_THEMES = [
  { id: 'atelier', label: 'Atelier', cardCover: '#e7dcc3' },
  { id: 'neon', label: 'Neon', cardCover: '#dfe5ff' },
  { id: 'midnight', label: 'Midnight', cardCover: '#d9e6ff' },
  { id: 'ember', label: 'Ember', cardCover: '#f1d8d0' },
  { id: 'horizon', label: 'Horizon', cardCover: '#e8e2ff' },
  { id: 'frost', label: 'Frost', cardCover: '#dde8f8' },
]

const USER_MENU_ITEMS = [
  { id: 'profile',  label: 'My Profile',          Icon: UserIcon,    danger: false },
  { id: 'add',      label: 'Add another account', Icon: AddUserIcon, danger: false },
  { id: 'upgrade',  label: 'Upgrade',             Icon: UpgradeIcon, danger: false },
  { id: 'settings', label: 'Settings',            Icon: SettingsIcon,danger: false },
  { id: 'logout',   label: 'Log Out',             Icon: LogOutIcon,  danger: true  },
]

const INITIAL_PLANS = [
  { id: 1, name: 'Product Launch — Q3',  description: 'Full scope for the third quarter release, from design handoff to public rollout.',      tag: 'Marketing',   tagColor: 'var(--color-blue)',  members: ['#d4aef1','#4290da','#0f703a'],        date: 'Aug 14', tasks: 18, cover: '#f4f0ff' },
  { id: 2, name: 'API Redesign',          description: 'Refactor authentication layer and versioning strategy before the next major release.',   tag: 'Engineering', tagColor: 'var(--color-green)', members: ['#4290da','#ff6766'],                  date: 'Jul 30', tasks: 9,  cover: '#f0fff5' },
  { id: 3, name: 'Brand Identity 2025',   description: 'New visual language, motion guidelines, and updated component library.',                  tag: 'Design',      tagColor: '#d4aef1',            members: ['#d4aef1','#0f703a','#ff6766','#000'], date: 'Sep 3',  tasks: 24, cover: '#fff9f0' },
  { id: 4, name: 'Onboarding Revamp',     description: 'Reduce time-to-value by rethinking the first-run experience end to end.',                 tag: 'Growth',      tagColor: 'var(--color-red)',   members: ['#000','#d4aef1'],                     date: 'Aug 1',  tasks: 12, cover: '#fff0f0' },
  { id: 5, name: 'Mobile App v2',         description: 'Native redesign for iOS and Android with offline sync and push notifications.',            tag: 'Engineering', tagColor: 'var(--color-green)', members: ['#4290da','#0f703a','#d4aef1'],        date: 'Oct 10', tasks: 31, cover: '#f0f6ff' },
  { id: 6, name: 'Q4 Content Strategy',   description: 'Editorial calendar, channel ownership, and SEO targets for the final quarter.',            tag: 'Marketing',   tagColor: 'var(--color-blue)',  members: ['#ff6766','#000'],                     date: 'Oct 1',  tasks: 7,  cover: '#f5f5f5' },
]

/* ═══════════════════════════════════════════
   NEW PLAN POPOVER
═══════════════════════════════════════════ */
function NewPlanPopover({ anchorEl, onClose, onSubmit }) {
  const [name, setName]       = useState('')
  const [selectedTag, setTag] = useState(PLAN_TAGS[0])
  const [selectedTheme, setSelectedTheme] = useState(COVER_THEMES[0])
  const [showCategories, setShowCategories] = useState(false)
  const [position, setPosition] = useState({ top: 24, left: 24, placement: 'right' })
  const nameRef = useRef(null)
  const popoverRef = useRef(null)
  const coverUploadRef = useRef(null)

  useEffect(() => {
    nameRef.current?.focus()
  }, [])

  useEffect(() => {
    if (!anchorEl) return

    const updatePosition = () => {
      const anchorRect = anchorEl.getBoundingClientRect()
      const popoverRect = popoverRef.current?.getBoundingClientRect()
      const viewportWidth = window.innerWidth
      const viewportHeight = window.innerHeight
      const gap = 14
      const margin = 16
      const popoverWidth = popoverRect?.width ?? Math.min(330, viewportWidth - margin * 2)
      const popoverHeight = popoverRect?.height ?? 360
      const canOpenRight = anchorRect.right + gap + popoverWidth <= viewportWidth - margin
      const canOpenLeft = anchorRect.left - gap - popoverWidth >= margin

      let left
      let placement

      if (canOpenRight) {
        left = anchorRect.right + gap
        placement = 'right'
      } else if (canOpenLeft) {
        left = anchorRect.left - popoverWidth - gap
        placement = 'left'
      } else {
        left = Math.min(
          Math.max(margin, anchorRect.left),
          viewportWidth - popoverWidth - margin,
        )
        placement = 'bottom'
      }

      let top = anchorRect.top
      if (top + popoverHeight > viewportHeight - margin) {
        top = viewportHeight - popoverHeight - margin
      }
      if (top < margin) top = margin

      setPosition({
        top,
        left,
        placement,
      })
    }

    updatePosition()

    const onKeyDown = (e) => {
      if (e.key === 'Escape') onClose()
    }

    const onPointerDown = (e) => {
      if (popoverRef.current?.contains(e.target)) return
      if (anchorEl.contains(e.target)) return
      onClose()
    }

    window.addEventListener('resize', updatePosition)
    window.addEventListener('scroll', updatePosition, true)
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)

    return () => {
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', updatePosition, true)
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [anchorEl, onClose])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!name.trim()) return
    const today = new Date()
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
    onSubmit({
      name: name.trim(),
      description: '',
      tag: selectedTag.label,
      tagColor: selectedTag.color,
      cover: selectedTheme.cardCover,
      date: `${months[today.getMonth()]} ${today.getDate()}`,
      tasks: 0,
      members: ['#000'],
    })
    onClose()
  }

  return (
    <div
      ref={popoverRef}
      className={`${styles.planPopover} ${position.placement === 'left' ? styles.planPopoverLeft : ''} ${position.placement === 'bottom' ? styles.planPopoverBottom : ''}`}
      style={{ top: `${position.top}px`, left: `${position.left}px` }}
      role="dialog"
      aria-modal="false"
      aria-label="Create new plan"
    >
      <form className={styles.planPopoverForm} onSubmit={handleSubmit} noValidate>
        <div className={styles.modalHead}>
          <h2 className={styles.modalTitle}>Criar plano</h2>
          <button type="button" className={styles.modalCloseBtn} onClick={onClose} aria-label="Close">
            <XIcon />
          </button>
        </div>

        <div className={`${styles.planPreview} ${styles[`theme${selectedTheme.id}`]}`}>
          <div className={styles.planPreviewColumns}>
            <span className={styles.planPreviewCol} />
            <span className={styles.planPreviewCol} />
            <span className={styles.planPreviewCol} />
          </div>
        </div>

        <div className={styles.coverPicker}>
          <span className={styles.planPreviewLabel}>Tela de fundo</span>
          <div className={styles.coverGrid}>
            {COVER_THEMES.map(theme => (
              <button
                key={theme.id}
                type="button"
                className={`${styles.coverOption} ${selectedTheme.id === theme.id ? styles.coverOptionActive : ''} ${styles[`theme${theme.id}`]}`}
                onClick={() => setSelectedTheme(theme)}
                aria-label={theme.label}
                title={theme.label}
              >
                <span className={styles.coverOptionShade} />
              </button>
            ))}
            <button
              type="button"
              className={`${styles.coverOption} ${styles.coverUploadOption}`}
              onClick={() => coverUploadRef.current?.click()}
              aria-label="Enviar imagem propria"
              title="Enviar imagem propria"
            >
              <span className={styles.coverUploadIcon}><ImagePlusIcon /></span>
            </button>
          </div>
          <input
            ref={coverUploadRef}
            type="file"
            accept="image/*"
            className={styles.coverUploadInput}
          />
        </div>

        <div className={styles.planPreviewMeta}>
          <button
            type="button"
            className={styles.categoryToggle}
            onClick={() => setShowCategories(v => !v)}
            aria-expanded={showCategories}
          >
            <span className={styles.planPreviewLabel}>Categoria</span>
            <span className={`${styles.categoryToggleIcon} ${showCategories ? styles.categoryToggleIconOpen : ''}`}>
              <ChevronIcon />
            </span>
          </button>
          {showCategories && (
            <div className={styles.tagGrid}>
              {PLAN_TAGS.map(t => (
                <button
                  key={t.label}
                  type="button"
                  className={`${styles.tagChip} ${selectedTag.label === t.label ? styles.tagChipActive : ''}`}
                  style={selectedTag.label === t.label
                    ? { background: t.color + '20', borderColor: t.color, color: t.color }
                    : {}}
                  onClick={() => setTag(t)}
                >
                  <span className={styles.tagDot} style={{ background: t.color }} />
                  {t.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className={styles.mField}>
          <label className={styles.mLabel} htmlFor="plan-name">
            Titulo do plano
            <span className={styles.mLabelRequired}>*</span>
          </label>
          <input
            ref={nameRef}
            id="plan-name"
            className={styles.mInput}
            placeholder=""
            value={name}
            onChange={e => setName(e.target.value)}
            maxLength={80}
            autoComplete="off"
          />
        </div>

        {!name.trim() && (
          <p className={styles.formHint}>O titulo do plano e obrigatorio</p>
        )}

        <div className={styles.modalFooter}>
          <button type="submit" className={styles.mSubmitBtn} disabled={!name.trim()}>
            Criar
          </button>
        </div>
      </form>
    </div>
  )
}

/* ═══════════════════════════════════════════
   USER MENU
═══════════════════════════════════════════ */
function UserMenu({ onClose, collapsed }) {
  const ref = useRef(null)

  useEffect(() => {
    const onOut  = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose() }
    const onKey  = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('mousedown', onOut)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onOut)
      document.removeEventListener('keydown', onKey)
    }
  }, [onClose])

  return (
    <div
      ref={ref}
      className={`${styles.userMenu} ${collapsed ? styles.userMenuCollapsed : ''}`}
      role="menu"
    >
      {/* Identity */}
      <div className={styles.umHeader}>
        <span className={styles.umAvatar}>AS</span>
        <div className={styles.umIdentity}>
          <p className={styles.umName}>Arthur Santos</p>
          <p className={styles.umEmail}>arthur@planthings.com</p>
        </div>
      </div>

      <div className={styles.umDivider} />

      {USER_MENU_ITEMS.map(({ id, label, Icon, danger }, i) => (
        <button
          key={id}
          className={`${styles.umItem} ${danger ? styles.umItemDanger : ''}`}
          role="menuitem"
          style={{ animationDelay: `${i * 28}ms` }}
          onClick={onClose}
        >
          <span className={styles.umIcon}><Icon /></span>
          {label}
        </button>
      ))}
    </div>
  )
}

/* ═══════════════════════════════════════════
   PLAN CARD
═══════════════════════════════════════════ */
function PlanCard({ plan, view }) {
  if (view === 'list') {
    return (
      <div className={styles.listCard}>
        <div className={styles.listCardLeft}>
          <div className={styles.listCover} style={{ background: plan.cover }} />
          <div className={styles.listInfo}>
            <p className={styles.listName}>{plan.name}</p>
            {plan.description && <p className={styles.listDesc}>{plan.description}</p>}
          </div>
        </div>
        <div className={styles.listMeta}>
          <span className={styles.cardTag} style={{ background: plan.tagColor + '18', color: plan.tagColor }}>{plan.tag}</span>
          <div className={styles.memberStack}>
            {plan.members.slice(0, 3).map((c, i) => (
              <span key={i} className={styles.memberDot} style={{ background: c }} />
            ))}
          </div>
          <span className={styles.cardDate}>{plan.date}</span>
          <span className={styles.cardTasks}>{plan.tasks} tasks</span>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.planCard}>
      <div className={styles.cardBody}>
        <div className={styles.cardTop}>
          <span className={styles.cardTag} style={{ background: plan.tagColor + '18', color: plan.tagColor }}>{plan.tag}</span>
          <span className={styles.cardDate}>{plan.date}</span>
        </div>
        <h3 className={styles.cardName}>{plan.name}</h3>
        {plan.description && <p className={styles.cardDesc}>{plan.description}</p>}
        <div className={styles.cardFooter}>
          <div className={styles.memberStack}>
            {plan.members.slice(0, 3).map((c, i) => (
              <span key={i} className={styles.memberDot} style={{ background: c }} />
            ))}
            {plan.members.length > 3 && (
              <span className={styles.memberMore}>+{plan.members.length - 3}</span>
            )}
          </div>
          <span className={styles.cardTasks}>{plan.tasks} tasks</span>
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════
   WORKSPACE
═══════════════════════════════════════════ */
export default function Workspace() {
  const [collapsed,    setCollapsed]    = useState(false)
  const [activeNav,    setActiveNav]    = useState('home')
  const [view,         setView]         = useState('grid')
  const [search,       setSearch]       = useState('')
  const [newPlanAnchor, setNewPlanAnchor] = useState(null)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [plans,        setPlans]        = useState(INITIAL_PLANS)

  const filtered = plans.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.tag.toLowerCase().includes(search.toLowerCase())
  )

  const handleNewPlan = (data) => {
    setPlans(prev => [{ id: Date.now(), ...data }, ...prev])
  }

  const openNewPlan = (event) => {
    setNewPlanAnchor(event.currentTarget)
  }

  return (
    <>
      <div className={`${styles.shell} ${collapsed ? styles.shellCollapsed : ''}`}>

        {/* ════════════ SIDEBAR ════════════ */}
        <aside className={`${styles.sidebar} ${collapsed ? styles.sidebarCollapsed : ''}`}>

          {/* Top cluster */}
          <div className={styles.sidebarTop}>

            {/* Logo row */}
            <div className={styles.logoRow}>
              <a href="/workspace" className={styles.sidebarLogo}>
                <span className={styles.sidebarLogoMark}><LogoMark /></span>
                <span className={styles.sidebarLogoText}>Plan Things</span>
              </a>
              <button
                className={styles.collapseBtn}
                onClick={() => setCollapsed(v => !v)}
                aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              >
                <span className={`${styles.collapseBtnIcon} ${collapsed ? styles.collapseBtnFlipped : ''}`}>
                  <CollapseIcon />
                </span>
              </button>
            </div>

            {/* Workspace picker */}
            <button className={`${styles.workspacePicker} ${collapsed ? styles.workspacePickerHidden : ''}`}>
              <span className={styles.wsAvatar}>A</span>
              <span className={styles.wsName}>Arthur's workspace</span>
              <span className={styles.wsChevron}><ChevronIcon /></span>
            </button>

            {/* Nav items */}
            <nav className={styles.nav}>
              {NAV_ITEMS.map(({ id, label, Icon }) => (
                <button
                  key={id}
                  className={`${styles.navItem} ${activeNav === id ? styles.navItemActive : ''}`}
                  onClick={() => setActiveNav(id)}
                  title={collapsed ? label : undefined}
                >
                  <span className={styles.navIcon}><Icon /></span>
                  <span className={styles.navLabel}>{label}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Plans section */}
          <div className={`${styles.sidebarPlans} ${collapsed ? styles.sidebarPlansHidden : ''}`}>
            <p className={styles.sidebarSectionLabel}>Plans</p>
            {plans.slice(0, 5).map(plan => (
              <button key={plan.id} className={styles.sidebarPlanItem}>
                <span className={styles.sidebarPlanDot} style={{ background: plan.tagColor }} />
                <span className={styles.sidebarPlanName}>{plan.name}</span>
              </button>
            ))}
            <button className={styles.sidebarNewPlan} onClick={openNewPlan}>
              <PlusIcon />
              <span>New plan</span>
            </button>
          </div>

          {/* Collapsed new-plan shortcut */}
          {collapsed && (
            <div className={styles.collapsedActions}>
              <button
                className={styles.navItem}
                onClick={openNewPlan}
                title="New plan"
              >
                <span className={styles.navIcon}><PlusIcon /></span>
                <span className={styles.navLabel}>New</span>
              </button>
            </div>
          )}

          {/* User button + floating menu */}
          <div className={styles.userSection}>
            {showUserMenu && (
              <UserMenu
                onClose={() => setShowUserMenu(false)}
                collapsed={collapsed}
              />
            )}
            <button
              className={`${styles.userBtn} ${showUserMenu ? styles.userBtnActive : ''} ${collapsed ? styles.userBtnCollapsed : ''}`}
              onClick={() => setShowUserMenu(v => !v)}
              aria-expanded={showUserMenu}
              aria-haspopup="true"
            >
              <span className={styles.userAvatar}>AS</span>
              <span className={styles.userDetails}>
                <span className={styles.userName}>Arthur Santos</span>
                <span className={styles.userPlan}>Professional</span>
              </span>
            </button>
          </div>
        </aside>

        {/* ════════════ MAIN ════════════ */}
        <main className={styles.main}>
          {/* Top bar */}
          <div className={styles.topbar}>
            <div className={styles.topbarLeft}>
              <h1 className={styles.pageTitle}>Home</h1>
              <p className={styles.pageSubtitle}>Good morning, Arthur.</p>
            </div>
            <div className={styles.topbarRight}>
              <div className={styles.searchWrap}>
                <span className={styles.searchIcon}><SearchIcon /></span>
                <input
                  className={styles.searchInput}
                  placeholder="Search plans…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
              <button className={styles.newPlanBtn} onClick={openNewPlan}>
                <PlusIcon />
                New plan
              </button>
            </div>
          </div>

          {/* Content */}
          <div className={styles.content}>
            <div className={styles.sectionHeader}>
              <div className={styles.sectionLeft}>
                <h2 className={styles.sectionTitle}>All plans</h2>
                <span className={styles.planCount}>{filtered.length}</span>
              </div>
              <div className={styles.viewToggle}>
                <button
                  className={`${styles.viewBtn} ${view === 'grid' ? styles.viewBtnActive : ''}`}
                  onClick={() => setView('grid')}
                  aria-label="Grid view"
                ><GridIcon /></button>
                <button
                  className={`${styles.viewBtn} ${view === 'list' ? styles.viewBtnActive : ''}`}
                  onClick={() => setView('list')}
                  aria-label="List view"
                ><ListIcon /></button>
              </div>
            </div>

            {view === 'grid' ? (
              <div className={styles.grid}>
                {filtered.map(plan => <PlanCard key={plan.id} plan={plan} view="grid" />)}
                <button className={styles.newPlanCard} onClick={openNewPlan}>
                  <span className={styles.newPlanIcon}><PlusIcon /></span>
                  <span className={styles.newPlanLabel}>New plan</span>
                </button>
              </div>
            ) : (
              <div className={styles.listView}>
                {filtered.map(plan => <PlanCard key={plan.id} plan={plan} view="list" />)}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* ════════════ NEW PLAN POPOVER ════════════ */}
      {newPlanAnchor && (
        <NewPlanPopover
          anchorEl={newPlanAnchor}
          onClose={() => setNewPlanAnchor(null)}
          onSubmit={handleNewPlan}
        />
      )}
    </>
  )
}
