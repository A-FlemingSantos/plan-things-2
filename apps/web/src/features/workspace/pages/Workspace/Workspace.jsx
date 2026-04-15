import { useState, useEffect, useLayoutEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { buildCanvasPath, buildWorkspaceBoardPath } from '../../../../shared/config/routes.js'
import { WORKSPACE_NAV_ITEMS } from '../../../../shared/config/workspaceNavigation.js'
import ProductAppShell from '../../../../shared/components/ProductAppShell/ProductAppShell.jsx'
import PlanSidebarSection from '../../../../shared/components/PlanSidebarSection/PlanSidebarSection.jsx'
import SidebarAccountMenu from '../../../../shared/components/SidebarAccountMenu/SidebarAccountMenu.jsx'
import { useWorkspaceNavigation } from '../../../../shared/hooks/useWorkspaceNavigation.js'
import { usePlans } from '../../context/PlansContext.jsx'
import styles from './Workspace.module.css'

/* ═══════════════════════════════════════════
   ICONS
═══════════════════════════════════════════ */
function HomeIcon()     { return <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 6.5L8 2l6 4.5V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V6.5z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/><path d="M6 15V9h4v6" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/></svg> }
function PopoverIcon()  { return <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M4 2.5H2.5v7H9.5V8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/><path d="M5 7L9.5 2.5M7 2.5h2.5V5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg> }
function CanvasIcon()   { return <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="1.5" y="1.5" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.3"/><rect x="8.5" y="1.5" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.3"/><rect x="1.5" y="8.5" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.3"/><rect x="8.5" y="8.5" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.3"/></svg> }
function CalendarIcon() { return <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="2" y="3" width="12" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.3"/><path d="M5 1.8v2.8M11 1.8v2.8M2.5 6.5h11" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg> }
function FilesIcon()    { return <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M9 1.5H4a1.5 1.5 0 0 0-1.5 1.5v10A1.5 1.5 0 0 0 4 14.5h8A1.5 1.5 0 0 0 13.5 13V6L9 1.5z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/><path d="M9 1.5V6H13.5" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/></svg> }
function PlusIcon()     { return <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 2v10M2 7h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg> }
function ImagePlusIcon(){ return <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="1.5" y="2" width="11" height="9.5" rx="2" stroke="currentColor" strokeWidth="1.2"/><path d="M4 8l1.7-1.8a.8.8 0 0 1 1.2 0L9 8.5l1-1a.8.8 0 0 1 1.1 0L12.5 9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/><path d="M10.5 1.5v3M9 3h3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg> }
function SearchIcon()   { return <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.3"/><path d="M9.5 9.5L12.5 12.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg> }
function GridIcon()     { return <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="1" y="1" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.3"/><rect x="8" y="1" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.3"/><rect x="1" y="8" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.3"/><rect x="8" y="8" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.3"/></svg> }
function ListIcon()     { return <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 4h8M3 7h8M3 10h5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg> }
function ChevronIcon()  { return <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M4.5 3l3 3-3 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg> }
function XIcon()        { return <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg> }
function CollapseIcon() { return <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M9 2L5 7l4 5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg> }

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
const NAV_ITEMS = WORKSPACE_NAV_ITEMS.map((item) => ({
  ...item,
  Icon:
    item.id === 'home' ? HomeIcon :
    item.id === 'canvas' ? CanvasIcon :
    item.id === 'calendar' ? CalendarIcon :
    FilesIcon,
}))

const PLAN_TAGS = [
  { label: 'Engenharia',  color: 'var(--color-green)'  },
  { label: 'Design',      color: '#d4aef1'             },
  { label: 'Marketing',   color: 'var(--color-blue)'   },
  { label: 'Pesquisa',    color: '#f5a623'             },
  { label: 'Growth',      color: 'var(--color-red)'    },
  { label: 'Operações',   color: '#a0a0a0'             },
]

const COVER_THEMES = [
  { id: 'atelier', label: 'Atelier', cardCover: '#e7dcc3' },
  { id: 'neon', label: 'Neon', cardCover: '#dfe5ff' },
  { id: 'midnight', label: 'Midnight', cardCover: '#d9e6ff' },
  { id: 'ember', label: 'Ember', cardCover: '#f1d8d0' },
  { id: 'horizon', label: 'Horizon', cardCover: '#e8e2ff' },
  { id: 'frost', label: 'Frost', cardCover: '#dde8f8' },
]

/* ═══════════════════════════════════════════
   NEW PLAN POPOVER
═══════════════════════════════════════════ */
function NewPlanPopover({ anchorEl, onClose, onSubmit }) {
  const [name, setName]       = useState('')
  const [selectedTag, setTag] = useState(PLAN_TAGS[0])
  const [selectedTheme, setSelectedTheme] = useState(COVER_THEMES[0])
  const [showCategories, setShowCategories] = useState(false)
  const [position, setPosition] = useState({
    top: 24,
    left: 24,
    placement: 'right',
    arrowTop: 24,
    arrowLeft: 28,
  })
  const nameRef = useRef(null)
  const popoverRef = useRef(null)
  const coverUploadRef = useRef(null)

  useEffect(() => {
    nameRef.current?.focus()
  }, [])

  useLayoutEffect(() => {
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
      const anchorCenterX = anchorRect.left + anchorRect.width / 2
      const anchorCenterY = anchorRect.top + anchorRect.height / 2
      const clamp = (value, min, max) => Math.min(Math.max(value, min), max)

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
        arrowTop: clamp(anchorCenterY - top - 8, 16, Math.max(16, popoverHeight - 32)),
        arrowLeft: clamp(anchorCenterX - left - 8, 16, Math.max(16, popoverWidth - 32)),
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
    const months = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez']
    onSubmit({
      name: name.trim(),
      description: '',
      tag: selectedTag.label,
      tagColor: selectedTag.color,
      cover: selectedTheme.cardCover,
      date: `${today.getDate()} ${months[today.getMonth()]}`,
      tasks: 0,
      members: ['#000'],
    })
    onClose()
  }

  return (
    <div
      ref={popoverRef}
      className={`${styles.planPopover} ${position.placement === 'left' ? styles.planPopoverLeft : ''} ${position.placement === 'bottom' ? styles.planPopoverBottom : ''}`}
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
        '--plan-popover-arrow-top': `${position.arrowTop}px`,
        '--plan-popover-arrow-left': `${position.arrowLeft}px`,
      }}
      role="dialog"
      aria-modal="false"
      aria-label="Criar novo plano"
    >
      <form className={styles.planPopoverForm} onSubmit={handleSubmit} noValidate>
        <div className={styles.modalHead}>
          <h2 className={styles.modalTitle}>Criar plano</h2>
          <button type="button" className={styles.modalCloseBtn} onClick={onClose} aria-label="Fechar">
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
              aria-label="Enviar imagem própria"
              title="Enviar imagem própria"
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
            Título do plano
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
          <p className={styles.formHint}>O título do plano é obrigatório</p>
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
   PLAN CARD
═══════════════════════════════════════════ */
function PlanCard({ plan, view, onOpen, isActive }) {
  if (view === 'list') {
    return (
      <button
        type="button"
        className={`${styles.listCard} ${isActive ? styles.listCardActive : ''}`}
        onClick={onOpen}
      >
        <div className={styles.listCardLeft}>
          <div className={styles.listCover} style={{ background: plan.cover }} />
          <div className={styles.listInfo}>
            <p className={styles.listName}>{plan.name}</p>
            {plan.description && <p className={styles.listDesc}>{plan.description}</p>}
          </div>
        </div>
        <div className={styles.listMeta}>
          {isActive && <span className={styles.currentPlanPill}>Atual</span>}
          <span className={styles.cardTag} style={{ background: plan.tagColor + '18', color: plan.tagColor }}>{plan.tag}</span>
          <div className={styles.memberStack}>
            {plan.members.slice(0, 3).map((c, i) => (
              <span key={i} className={styles.memberDot} style={{ background: c }} />
            ))}
          </div>
          <span className={styles.cardDate}>{plan.date}</span>
          <span className={styles.cardTasks}>{plan.tasks} tarefas</span>
        </div>
      </button>
    )
  }

  return (
    <button
      type="button"
      className={`${styles.planCard} ${isActive ? styles.planCardActive : ''}`}
      onClick={onOpen}
    >
      <div className={styles.cardBody}>
        <div className={styles.cardTop}>
          <div className={styles.cardTopMeta}>
            <span className={styles.cardTag} style={{ background: plan.tagColor + '18', color: plan.tagColor }}>{plan.tag}</span>
            {isActive && <span className={styles.currentPlanPill}>Atual</span>}
          </div>
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
          <span className={styles.cardTasks}>{plan.tasks} tarefas</span>
        </div>
      </div>
    </button>
  )
}

/* ═══════════════════════════════════════════
   WORKSPACE
═══════════════════════════════════════════ */
export default function Workspace() {
  const navigate = useNavigate()
  const [view,         setView]         = useState('grid')
  const [search,       setSearch]       = useState('')
  const [newPlanAnchor, setNewPlanAnchor] = useState(null)
  const [notification, setNotification] = useState(null)
  const notificationTimerRef = useRef(null)
  const { plans, activePlan, createPlan, selectPlan, currentUser } = usePlans()
  const { activeNav, handleNavItemClick } = useWorkspaceNavigation()

  const filtered = plans.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.tag.toLowerCase().includes(search.toLowerCase())
  )

  const handleNewPlan = async (data) => {
    try {
      const newPlan = await createPlan(data)
      if (notificationTimerRef.current) {
        clearTimeout(notificationTimerRef.current)
      }
      setNotification(`Plano "${newPlan.name}" criado`)
      notificationTimerRef.current = setTimeout(() => {
        setNotification(null)
        notificationTimerRef.current = null
      }, 2600)
    } catch (error) {
      setNotification(error.message ?? 'Nao foi possivel criar o plano.')
    }
  }

  useEffect(() => () => {
    if (notificationTimerRef.current) {
      clearTimeout(notificationTimerRef.current)
    }
  }, [])

  const openBoard = (planId) => {
    selectPlan(planId)
    navigate(buildWorkspaceBoardPath(planId))
  }

  const openCanvas = (planId) => {
    selectPlan(planId)
    navigate(buildCanvasPath(planId))
  }

  const openNewPlan = (event) => {
    setNewPlanAnchor(event.currentTarget)
  }

  const renderSidebarSecondaryContent = ({ collapsed }) => (
    <>
      {!collapsed && (
        <PlanSidebarSection
          plans={plans.slice(0, 5)}
          activePlanId={activePlan?.id}
          onSelectPlan={openBoard}
          footer={(
            <button className={styles.sidebarNewPlan} onClick={openNewPlan}>
              <PlusIcon />
              <span>Novo plano</span>
            </button>
          )}
        />
      )}

      {collapsed && (
        <div className={styles.collapsedActions}>
          <button
            className={styles.navItem}
            onClick={openNewPlan}
            title="Novo plano"
          >
            <span className={styles.navIcon}><PlusIcon /></span>
            <span className={styles.navLabel}>Novo</span>
          </button>
        </div>
      )}
    </>
  )

  const renderSidebarBottomContent = ({ collapsed }) => (
    <SidebarAccountMenu styles={styles} collapsed={collapsed} />
  )

  return (
    <>
      <ProductAppShell
        styles={styles}
        activeNav={activeNav}
        onNavItemClick={handleNavItemClick}
        navItems={NAV_ITEMS}
        LogoIcon={LogoMark}
        CollapseIcon={CollapseIcon}
        ChevronIcon={ChevronIcon}
        HintIcon={PopoverIcon}
        secondaryContent={renderSidebarSecondaryContent}
        bottomContent={renderSidebarBottomContent}
        contentClassName={styles.main}
        contentTag="main"
      >
          {/* Top bar */}
          <div className={styles.topbar}>
            <div className={styles.topbarLeft}>
              <h1 className={styles.pageTitle}>Início</h1>
              <p className={styles.pageSubtitle}>Bom dia, {currentUser?.fullName?.split(' ')[0] ?? 'Arthur'}.</p>
            </div>
            <div className={styles.topbarRight}>
              <div className={styles.searchWrap}>
                <span className={styles.searchIcon}><SearchIcon /></span>
                <input
                  className={styles.searchInput}
                  placeholder="Buscar planos..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
                {search && (
                  <button
                    type="button"
                    className={styles.searchClear}
                    onClick={() => setSearch('')}
                    aria-label="Limpar busca de planos"
                  >
                    <XIcon />
                  </button>
                )}
              </div>
              <button className={styles.newPlanBtn} onClick={openNewPlan}>
                <PlusIcon />
                Novo plano
              </button>
            </div>
          </div>

          {/* Content */}
          <div className={styles.content}>
            {activePlan && (
              <section className={styles.currentPlanPanel}>
                <div className={styles.currentPlanPanelCopy}>
                  <p className={styles.currentPlanEyebrow}>Plano atual</p>
                  <div className={styles.currentPlanHeader}>
                    <h2 className={styles.currentPlanTitle}>{activePlan.name}</h2>
                    <span className={styles.cardTag} style={{ background: activePlan.tagColor + '18', color: activePlan.tagColor }}>
                      {activePlan.tag}
                    </span>
                  </div>
                  <p className={styles.currentPlanText}>
                    {activePlan.description || 'Continue de onde parou no quadro e no Canvas.'}
                  </p>
                </div>
                <div className={styles.currentPlanActions}>
                  <button className={styles.currentPlanAction} onClick={() => openBoard(activePlan.id)}>
                    <GridIcon />
                    Abrir quadro
                  </button>
                  <button className={styles.currentPlanAction} onClick={() => openCanvas(activePlan.id)}>
                    <CanvasIcon />
                    Abrir Canvas
                  </button>
                </div>
              </section>
            )}

            <div className={styles.sectionHeader}>
              <div className={styles.sectionLeft}>
                <h2 className={styles.sectionTitle}>Todos os planos</h2>
                <span className={styles.planCount}>{filtered.length}</span>
              </div>
              <div className={styles.viewToggle}>
                <button
                  className={`${styles.viewBtn} ${view === 'grid' ? styles.viewBtnActive : ''}`}
                  onClick={() => setView('grid')}
                  aria-label="Visualização em grade"
                ><GridIcon /></button>
                <button
                  className={`${styles.viewBtn} ${view === 'list' ? styles.viewBtnActive : ''}`}
                  onClick={() => setView('list')}
                  aria-label="Visualização em lista"
                ><ListIcon /></button>
              </div>
            </div>

            {filtered.length === 0 ? (
              <div className={styles.emptyState}>
                <span className={styles.emptyStateIcon}><SearchIcon /></span>
                <p className={styles.emptyStateTitle}>Nenhum plano encontrado</p>
                <p className={styles.emptyStateHint}>
                  {search
                    ? `Tente outro termo ou limpe "${search}" para ver tudo.`
                    : 'Crie seu primeiro plano para organizar o trabalho no quadro e no Canvas.'}
                </p>
                <div className={styles.emptyStateActions}>
                  {search && (
                    <button type="button" className={styles.emptyStateBtn} onClick={() => setSearch('')}>
                      Limpar busca
                    </button>
                  )}
                  <button type="button" className={styles.emptyStateBtnPrimary} onClick={openNewPlan}>
                    <PlusIcon />
                    Novo plano
                  </button>
                </div>
              </div>
            ) : view === 'grid' ? (
              <div className={styles.grid}>
                {filtered.map(plan => (
                  <PlanCard
                    key={plan.id}
                    plan={plan}
                    view="grid"
                    onOpen={() => openBoard(plan.id)}
                    isActive={plan.id === activePlan?.id}
                  />
                ))}
                <button className={styles.newPlanCard} onClick={openNewPlan}>
                  <span className={styles.newPlanIcon}><PlusIcon /></span>
                  <span className={styles.newPlanLabel}>Novo plano</span>
                </button>
              </div>
            ) : (
              <div className={styles.listView}>
                {filtered.map(plan => (
                  <PlanCard
                    key={plan.id}
                    plan={plan}
                    view="list"
                    onOpen={() => openBoard(plan.id)}
                    isActive={plan.id === activePlan?.id}
                  />
                ))}
              </div>
            )}
          </div>
      </ProductAppShell>

      {/* ════════════ NEW PLAN POPOVER ════════════ */}
      {newPlanAnchor && (
        <NewPlanPopover
          anchorEl={newPlanAnchor}
          onClose={() => setNewPlanAnchor(null)}
          onSubmit={handleNewPlan}
        />
      )}

      {notification && (
        <div className={styles.notification} role="status" aria-live="polite">
          {notification}
        </div>
      )}
    </>
  )
}
