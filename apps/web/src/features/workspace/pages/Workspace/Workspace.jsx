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

function resolveCoverThemeClass(styles, coverThemeId) {
  if (!coverThemeId) return ''
  const key = `theme${coverThemeId}`
  return styles[key] ?? ''
}

function MoreIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <circle cx="3" cy="7" r="1" fill="currentColor" />
      <circle cx="7" cy="7" r="1" fill="currentColor" />
      <circle cx="11" cy="7" r="1" fill="currentColor" />
    </svg>
  )
}

function titleFromCollectionId(collectionId = '') {
  return String(collectionId)
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, (match) => match.toUpperCase())
}

function buildBackgroundCollectionsSnapshot() {
  const fullFiles = import.meta.glob('../../../../shared/assets/background-collections/**/*.{webp,png,jpg,jpeg,avif}', {
    eager: true,
    import: 'default',
  })
  const thumbFiles = import.meta.glob('../../../../shared/assets/background-collections-thumbs/**/*.{webp,png,jpg,jpeg,avif}', {
    eager: true,
    import: 'default',
  })

  const fullUrlById = Object.entries(fullFiles).reduce((acc, [path, url]) => {
    const normalized = String(path).replace(/\\/g, '/')
    const [, afterRoot = ''] = normalized.split('/background-collections/')
    if (!afterRoot) return acc
    acc[`background-collections/${afterRoot}`] = url
    return acc
  }, {})

  const items = Object.entries(thumbFiles).map(([path, url]) => {
    const normalized = String(path).replace(/\\/g, '/')
    const [, afterRoot = ''] = normalized.split('/background-collections-thumbs/')
    const [collectionId = 'Coleção', fileName = ''] = afterRoot.split('/')
    const id = `background-collections/${afterRoot}`
    return {
      id,
      url,
      fullUrl: fullUrlById[id] ?? null,
      collectionId,
      fileName,
      label: fileName.replace(/\.[^.]+$/, ''),
    }
  })

  const byCollection = items.reduce((acc, item) => {
    acc[item.collectionId] = acc[item.collectionId] ? [...acc[item.collectionId], item] : [item]
    return acc
  }, {})

  return Object.entries(byCollection)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([collectionId, collectionItems]) => ({
      id: collectionId,
      title: titleFromCollectionId(collectionId),
      items: collectionItems.sort((a, b) => a.fileName.localeCompare(b.fileName)),
    }))
}

const BACKGROUND_COLLECTIONS = buildBackgroundCollectionsSnapshot()

/* ═══════════════════════════════════════════
   NEW PLAN POPOVER
═══════════════════════════════════════════ */
function NewPlanPopover({ anchorEl, onClose, onSubmit, isBackendDriven = false }) {
  const [name, setName]       = useState('')
  const [selectedTag, setTag] = useState(PLAN_TAGS[0])
  const [selectedTheme, setSelectedTheme] = useState(null)
  const [selectedImage, setSelectedImage] = useState(null)
  const [showImageCollections, setShowImageCollections] = useState(false)
  const [showCategories, setShowCategories] = useState(false)
  const [position, setPosition] = useState({
    top: 24,
    left: 24,
    placement: 'right',
    arrowTop: 24,
    arrowLeft: 28,
  })
  const [collectionsPosition, setCollectionsPosition] = useState({ top: 24, left: 24 })
  const nameRef = useRef(null)
  const popoverRef = useRef(null)
  const coverUploadRef = useRef(null)
  const imageCollectionsRef = useRef(null)

  useEffect(() => {
    nameRef.current?.focus()
  }, [])

  useLayoutEffect(() => {
    if (!anchorEl) return

    const updatePosition = () => {
      const anchorRect = anchorEl.getBoundingClientRect()
      const popoverRect = popoverRef.current?.getBoundingClientRect()
      const collectionsRect = imageCollectionsRef.current?.getBoundingClientRect()
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

      if (showImageCollections) {
        const collectionsWidth = collectionsRect?.width ?? Math.min(420, viewportWidth - margin * 2)
        const collectionsHeight = collectionsRect?.height ?? 420
        const canOpenRight = left + popoverWidth + gap + collectionsWidth <= viewportWidth - margin
        const canOpenLeft = left - gap - collectionsWidth >= margin
        const collectionsLeft = canOpenRight
          ? left + popoverWidth + gap
          : canOpenLeft
            ? left - collectionsWidth - gap
            : viewportWidth - collectionsWidth - margin
        let collectionsTop = top
        if (collectionsTop + collectionsHeight > viewportHeight - margin) {
          collectionsTop = viewportHeight - collectionsHeight - margin
        }
        if (collectionsTop < margin) collectionsTop = margin
        setCollectionsPosition({
          top: collectionsTop,
          left: Math.max(margin, collectionsLeft),
        })
      }
    }

    updatePosition()

    const handleCloseAll = () => {
      setShowImageCollections(false)
      onClose()
    }

    const onKeyDown = (e) => {
      if (e.key === 'Escape') handleCloseAll()
    }

    const onPointerDown = (e) => {
      if (popoverRef.current?.contains(e.target)) return
      if (imageCollectionsRef.current?.contains(e.target)) return
      if (anchorEl.contains(e.target)) return
      handleCloseAll()
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
  }, [anchorEl, onClose, showImageCollections])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!name.trim()) return
    const today = new Date()
    const months = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez']
    const payload = {
      name: name.trim(),
      description: '',
      tag: selectedTag.label,
      tagColor: selectedTag.color,
      date: `${today.getDate()} ${months[today.getMonth()]}`,
      tasks: 0,
      members: ['#000'],
    }

    onSubmit(selectedTheme
      ? {
          ...payload,
          cover: selectedTheme.cardCover,
          coverThemeId: selectedTheme.id,
        }
      : selectedImage
        ? {
            ...payload,
            coverImage: selectedImage.fullUrl ?? selectedImage.url,
            coverImageId: selectedImage.id,
            coverImageThumb: selectedImage.url,
          }
        : payload)
    onClose()
  }

  const previewClassName = [
    styles.planPreview,
    selectedTheme ? resolveCoverThemeClass(styles, selectedTheme.id) : '',
    selectedImage ? styles.planPreviewImage : '',
  ].filter(Boolean).join(' ')

  const previewStyle = selectedImage
    ? {
        '--cover-bg': `url(${selectedImage.url})`,
      }
    : undefined

  return (
    <>
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
            <button type="button" className={styles.modalCloseBtn} onClick={() => { setShowImageCollections(false); onClose() }} aria-label="Fechar">
              <XIcon />
            </button>
          </div>

          <div className={previewClassName} style={previewStyle}>
            <div className={styles.planPreviewColumns}>
              <span className={styles.planPreviewCol} />
              <span className={styles.planPreviewCol} />
              <span className={styles.planPreviewCol} />
            </div>
          </div>

        <>
          <div className={styles.coverPicker}>
            <span className={styles.planPreviewLabel}>Tela de fundo</span>
            <div className={styles.coverGrid}>
              {COVER_THEMES.map(theme => (
                <button
                  key={theme.id}
                  type="button"
                  className={`${styles.coverOption} ${selectedTheme?.id === theme.id ? styles.coverOptionActive : ''} ${resolveCoverThemeClass(styles, theme.id)}`}
                  onClick={() => {
                    setSelectedTheme(theme)
                    setSelectedImage(null)
                  }}
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
              <button
                type="button"
                className={`${styles.coverOption} ${styles.coverMoreOption} ${showImageCollections ? styles.coverOptionActive : ''}`}
                onClick={() => setShowImageCollections((value) => !value)}
                aria-label="Mais opções de tela de fundo"
                title="Mais opções"
                aria-expanded={showImageCollections}
              >
                <span className={styles.coverUploadIcon}><MoreIcon /></span>
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
        </>

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

        {isBackendDriven && (
          <p className={styles.formHint}>Nesta integração, o backend salva apenas o nome e a descrição do plano.</p>
        )}

          <div className={styles.modalFooter}>
            <button type="submit" className={styles.mSubmitBtn} disabled={!name.trim()}>
              Criar
            </button>
          </div>
        </form>
      </div>

      {showImageCollections && (
        <div
          ref={imageCollectionsRef}
          className={styles.collectionsPopover}
          style={{
            top: `${collectionsPosition.top}px`,
            left: `${collectionsPosition.left}px`,
          }}
          role="dialog"
          aria-modal="false"
          aria-label="Coleções de telas de fundo"
        >
          <div className={styles.collectionsHeader}>
            <h3 className={styles.collectionsTitle}>Coleções</h3>
            <button
              type="button"
              className={styles.collectionsClose}
              onClick={() => setShowImageCollections(false)}
              aria-label="Fechar coleções"
            >
              <XIcon />
            </button>
          </div>

          <div className={styles.collectionsBody}>
            {BACKGROUND_COLLECTIONS.map((collection) => (
              <section key={collection.id} className={styles.collectionSection} aria-label={collection.title}>
                <p className={styles.collectionTitle}>{collection.title}</p>
                <div className={styles.collectionGrid}>
                  {collection.items.map((item) => {
                    const active = selectedImage?.id === item.id
                    return (
                      <button
                        key={item.id}
                        type="button"
                        className={`${styles.collectionItem} ${active ? styles.collectionItemActive : ''}`}
                        onClick={() => {
                          setSelectedImage(item)
                          setSelectedTheme(null)
                          setShowImageCollections(false)
                        }}
                        title={item.label}
                        aria-pressed={active}
                      >
                        <span
                          className={styles.collectionThumb}
                          style={{ backgroundImage: `url(${item.url})` }}
                          aria-hidden="true"
                        />
                      </button>
                    )
                  })}
                </div>
              </section>
            ))}
          </div>
        </div>
      )}
    </>
  )
}

/* ═══════════════════════════════════════════
   PLAN CARD
═══════════════════════════════════════════ */
function PlanCard({ plan, view, onOpen, isActive }) {
  const coverThemeClassName = resolveCoverThemeClass(styles, plan.coverThemeId)
  const coverImageUrl = plan.coverImageThumb ?? plan.coverImage ?? null
  const isImageCover = Boolean(coverImageUrl)
  const coverClassName = [
    styles.planCover,
    coverThemeClassName,
    isImageCover ? styles.planCoverImage : '',
  ].filter(Boolean).join(' ')
  const coverStyle = isImageCover
    ? {
        '--cover-fallback': plan.cover,
        '--cover-bg': `url(${coverImageUrl})`,
      }
    : {
        '--cover-fallback': plan.cover,
      }

  if (view === 'list') {
    return (
      <button
        type="button"
        className={`${styles.listCard} ${isActive ? styles.listCardActive : ''}`}
        onClick={onOpen}
      >
        <div className={styles.listCardLeft}>
          <div
            className={`${styles.listCover} ${coverClassName}`}
            style={coverStyle}
            aria-hidden="true"
          />
          <div className={styles.listInfo}>
            <div className={styles.listNameRow}>
              <p className={styles.listName}>{plan.name}</p>
              {plan.tasks > 0 && (
                <span className={styles.listTaskCount} aria-label={`${plan.tasks} tarefas`}>
                  {plan.tasks}
                </span>
              )}
            </div>
          </div>
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
      <div
        className={`${styles.planCardCover} ${coverClassName}`}
        style={coverStyle}
        aria-hidden="true"
      />
      <div className={styles.cardBody}>
        <div className={styles.cardNameRow}>
          <h3 className={styles.cardName}>{plan.name}</h3>
          {plan.tasks > 0 && (
            <span className={styles.cardTaskCount} aria-label={`${plan.tasks} tarefas`}>
              {plan.tasks}
            </span>
          )}
        </div>
      </div>
    </button>
  )
}

function LoadingPlanCard({ view }) {
  if (view === 'list') {
    return (
      <div className={styles.loadingListCard} aria-hidden="true">
        <span className={`${styles.loadingBlock} ${styles.loadingListCover}`} />
        <div className={styles.loadingListInfo}>
          <span className={`${styles.loadingBlock} ${styles.loadingListTitle}`} />
          <span className={`${styles.loadingBlock} ${styles.loadingListMeta}`} />
        </div>
        <span className={`${styles.loadingBlock} ${styles.loadingListBadge}`} />
      </div>
    )
  }

  return (
    <div className={styles.loadingPlanCard} aria-hidden="true">
      <div className={styles.loadingPlanCardBody}>
        <div className={styles.loadingPlanCardTop}>
          <span className={`${styles.loadingBlock} ${styles.loadingChip}`} />
          <span className={`${styles.loadingBlock} ${styles.loadingDate}`} />
        </div>
        <span className={`${styles.loadingBlock} ${styles.loadingTitle}`} />
        <span className={`${styles.loadingBlock} ${styles.loadingText}`} />
        <span className={`${styles.loadingBlock} ${styles.loadingTextShort}`} />
        <div className={styles.loadingPlanCardFooter}>
          <div className={styles.loadingMemberStack}>
            <span className={styles.loadingAvatar} />
            <span className={styles.loadingAvatar} />
            <span className={styles.loadingAvatar} />
          </div>
          <span className={`${styles.loadingBlock} ${styles.loadingMeta}`} />
        </div>
      </div>
    </div>
  )
}

function WorkspaceLoadingState({ view }) {
  return (
    <>
      <section className={styles.loadingCurrentPlan} aria-hidden="true">
        <div className={styles.loadingCurrentPlanCopy}>
          <span className={`${styles.loadingBlock} ${styles.loadingEyebrow}`} />
          <span className={`${styles.loadingBlock} ${styles.loadingCurrentTitle}`} />
          <span className={`${styles.loadingBlock} ${styles.loadingCurrentText}`} />
        </div>
        <div className={styles.loadingCurrentActions}>
          <span className={`${styles.loadingBlock} ${styles.loadingAction}`} />
          <span className={`${styles.loadingBlock} ${styles.loadingAction}`} />
        </div>
      </section>

      <div className={styles.sectionHeader}>
        <div className={styles.sectionLeft}>
          <h2 className={styles.sectionTitle}>Carregando planos</h2>
        </div>
      </div>

      {view === 'grid' ? (
        <div className={styles.grid} aria-hidden="true">
          {Array.from({ length: 6 }, (_, index) => (
            <LoadingPlanCard key={`loading-grid-${index}`} view="grid" />
          ))}
        </div>
      ) : (
        <div className={styles.listView} aria-hidden="true">
          {Array.from({ length: 5 }, (_, index) => (
            <LoadingPlanCard key={`loading-list-${index}`} view="list" />
          ))}
        </div>
      )}
    </>
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
  const { plans, activePlan, createPlan, selectPlan, currentUser, isBackendDriven, isLoading } = usePlans()
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
            type="button"
            className={styles.navItem}
            onClick={openNewPlan}
            title="Novo plano"
            data-sidebar-nav-item
          >
            <span className={styles.navIcon} data-sidebar-nav-icon><PlusIcon /></span>
            <span className={styles.navLabel} data-sidebar-nav-label>Novo</span>
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
            {isBackendDriven && isLoading ? (
              <WorkspaceLoadingState view={view} />
            ) : (
              <>
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
              </>
            )}
          </div>
      </ProductAppShell>

      {/* ════════════ NEW PLAN POPOVER ════════════ */}
      {newPlanAnchor && (
        <NewPlanPopover
          anchorEl={newPlanAnchor}
          onClose={() => setNewPlanAnchor(null)}
          onSubmit={handleNewPlan}
          isBackendDriven={isBackendDriven}
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
