import { useState, useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import {
  AlignStartHorizontal,
  Ellipsis,
  Image,
  PencilLine,
  Trash2,
} from 'lucide-react'
import { createPortal } from 'react-dom'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { buildWorkspaceBoardPath, ROUTES } from '../../../../shared/config/routes.js'
import { useAuth } from '../../../auth/context/AuthContext.jsx'
import { WorkspaceIconGlyph } from '../../../../shared/components/WorkspaceIconBadge/WorkspaceIconBadge.jsx'
import { readRecentPlanIds } from '../../data/recentPlansStorage.js'
import { apiRequest, triggerBlobDownload } from '../../../../shared/api/apiClient.js'
import ProductAppShell from '../../../../shared/components/ProductAppShell/ProductAppShell.jsx'
import WorkspaceHeader from '../../../../shared/components/WorkspaceHeader/WorkspaceHeader.jsx'
import CustomScrollArea from '../../../../shared/components/CustomScrollArea/CustomScrollArea.jsx'
import { DEFAULT_LOCAL_PREFERENCES, usePreferences } from '../../../preferences/context/PreferencesContext.jsx'
import AppThemeScope from '../../../preferences/components/AppThemeScope/AppThemeScope.jsx'
import {
  resolveKanbanAccentColor,
  resolveKanbanAccentForeground,
} from '../../data/kanbanColorPalette.js'
import { usePlans } from '../../context/PlansContext.jsx'
import IntelligenceComposer from '../../../../shared/components/IntelligenceComposer/IntelligenceComposer.jsx'
import { hasComposerContext } from '../../../intelligence/utils/snapshotComposerContext.js'
import { useIntelligenceComposerContext } from '../../../intelligence/hooks/useIntelligenceComposerContext.js'
import styles from './Workspace.module.css'

/* ═══════════════════════════════════════════
   ICONS
═══════════════════════════════════════════ */
function PlusIcon()     { return <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 2v10M2 7h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg> }
function ImagePlusIcon(){ return <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="1.5" y="2" width="11" height="9.5" rx="2" stroke="currentColor" strokeWidth="1.2"/><path d="M4 8l1.7-1.8a.8.8 0 0 1 1.2 0L9 8.5l1-1a.8.8 0 0 1 1.1 0L12.5 9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/><path d="M10.5 1.5v3M9 3h3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg> }
function SearchIcon()   { return <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.3"/><path d="M9.5 9.5L12.5 12.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg> }
function GridIcon()     { return <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="1" y="1" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.3"/><rect x="8" y="1" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.3"/><rect x="1" y="8" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.3"/><rect x="8" y="8" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.3"/></svg> }
function ListIcon()     { return <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 4h8M3 7h8M3 10h5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg> }
function ChevronIcon()  { return <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M4.5 3l3 3-3 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg> }
function XIcon()        { return <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg> }
function CheckIcon()    { return <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2.5 7.2l3 3L11.8 3.8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg> }

function WorkspacePlansNavIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <rect x="2.5" y="1.8" width="9" height="10.4" rx="1.4" stroke="currentColor" strokeWidth="1.2" />
      <path d="M5 5h4M5 7h4M5 9h2.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  )
}

function WorkspaceMembersNavIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <circle cx="4.8" cy="4.6" r="1.6" stroke="currentColor" strokeWidth="1.2" />
      <path d="M2 11.5c.3-1.8 1.5-2.8 2.8-2.8s2.5 1 2.8 2.8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <circle cx="9.6" cy="5.2" r="1.3" stroke="currentColor" strokeWidth="1.2" />
      <path d="M8 11.5c.4-1.3 1.2-2.1 2.1-2.1.9 0 1.7.8 2.1 2.1" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  )
}

function WorkspaceSettingsNavIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path d="M2.5 4.5h9M2.5 7h9M2.5 9.5h9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <circle cx="5.2" cy="4.5" r="1" fill="currentColor" />
      <circle cx="8.8" cy="7" r="1" fill="currentColor" />
      <circle cx="6.4" cy="9.5" r="1" fill="currentColor" />
    </svg>
  )
}

function WorkspaceLibraryNavIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path d="M2.5 3.2v8.1c0 .6.5 1.1 1.1 1.1h2.1V2.1H3.6c-.6 0-1.1.5-1.1 1.1z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
      <path d="M5.7 2.1v10.3h2.1c.6 0 1.1-.5 1.1-1.1V3.2c0-.6-.5-1.1-1.1-1.1H5.7z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
      <path d="M8.9 2.1h2.1c.6 0 1.1.5 1.1 1.1v7c0 .6-.5 1.1-1.1 1.1H8.9" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
    </svg>
  )
}

const WORKSPACE_SECTION_ACTIONS = [
  { id: 'plans', label: 'Planos', Icon: WorkspacePlansNavIcon },
  { id: 'members', label: 'Membros', Icon: WorkspaceMembersNavIcon },
  { id: 'settings', label: 'Configurações', Icon: WorkspaceSettingsNavIcon },
  { id: 'library', label: 'Biblioteca', Icon: WorkspaceLibraryNavIcon },
]

function WorkspaceSectionActions() {
  return (
    <div className={styles.workspaceSectionActions}>
      {WORKSPACE_SECTION_ACTIONS.map(({ id, label, Icon }) => (
        <button
          key={id}
          type="button"
          className={styles.workspaceSectionAction}
          aria-label={label}
        >
          <span className={styles.workspaceSectionActionIcon} aria-hidden="true">
            <Icon />
          </span>
          <span className={styles.workspaceSectionActionLabel}>{label}</span>
        </button>
      ))}
    </div>
  )
}
/* ═══════════════════════════════════════════
   DATA
═══════════════════════════════════════════ */
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
const PLAN_OPTIONS_MENU_WIDTH = 176
const PLAN_OPTIONS_MENU_HEIGHT = 190
const PLAN_OPTIONS_MENU_GAP = 8
const PLAN_OPTIONS_MENU_ICON_SIZE = 14
const PLAN_OPTIONS_MENU_ICON_STROKE = 1.75
const PLAN_BACKGROUND_PICKER_WIDTH = 420
const PLAN_BACKGROUND_PICKER_HEIGHT = 520

function resolvePlanOptionsMenuPosition(anchorRect) {
  if (!anchorRect) return { left: 0, top: 0 }

  const preferredLeft = anchorRect.right + PLAN_OPTIONS_MENU_GAP
  const maxLeft = window.innerWidth - PLAN_OPTIONS_MENU_WIDTH - PLAN_OPTIONS_MENU_GAP
  const left = Math.max(PLAN_OPTIONS_MENU_GAP, Math.min(preferredLeft, maxLeft))
  const maxTop = window.innerHeight - PLAN_OPTIONS_MENU_HEIGHT - PLAN_OPTIONS_MENU_GAP
  const top = Math.max(PLAN_OPTIONS_MENU_GAP, Math.min(anchorRect.top, maxTop))

  return { left, top }
}

function resolvePlanBackgroundPickerPosition(anchorRect) {
  if (!anchorRect) return { left: 16, top: 16 }

  const margin = 16
  const gap = 12
  const width = Math.min(PLAN_BACKGROUND_PICKER_WIDTH, window.innerWidth - margin * 2)
  const height = Math.min(PLAN_BACKGROUND_PICKER_HEIGHT, window.innerHeight - margin * 2)
  const canOpenRight = anchorRect.right + gap + width <= window.innerWidth - margin
  const canOpenLeft = anchorRect.left - gap - width >= margin
  const left = canOpenRight
    ? anchorRect.right + gap
    : canOpenLeft
      ? anchorRect.left - gap - width
      : Math.max(margin, Math.min(anchorRect.left, window.innerWidth - width - margin))
  const top = Math.max(margin, Math.min(anchorRect.top, window.innerHeight - height - margin))

  return { left, top }
}

function PlanOptionsMenu({ anchorRect, onAction }) {
  const actions = [
    { id: 'board', label: 'Abrir plano', Icon: AlignStartHorizontal },
    { id: 'rename', label: 'Renomear', Icon: PencilLine },
    { id: 'background', label: 'Alterar background', Icon: Image },
    { id: 'delete', label: 'Excluir', Icon: Trash2, danger: true },
  ]
  const position = resolvePlanOptionsMenuPosition(anchorRect)
  const portalRoot = document.querySelector('[data-app-theme-scope]') ?? document.body

  return createPortal(
    <div
      className={styles.planOptionsMenu}
      role="menu"
      style={position}
      onMouseDown={(event) => {
        event.preventDefault()
        event.stopPropagation()
      }}
      onClick={(event) => {
        event.preventDefault()
        event.stopPropagation()
      }}
    >
      {actions.map(({ id, label, Icon, danger }) => (
        <button
          key={id}
          type="button"
          className={`${styles.planOptionsMenuItem} ${danger ? styles.planOptionsMenuItemDanger : ''}`}
          role="menuitem"
          onClick={() => onAction?.(id)}
        >
          <Icon size={PLAN_OPTIONS_MENU_ICON_SIZE} strokeWidth={PLAN_OPTIONS_MENU_ICON_STROKE} />
          <span>{label}</span>
        </button>
      ))}
    </div>,
    portalRoot
  )
}

function PlanBackgroundPicker({ plan, anchorRect, busy, onClose, onSelectTheme, onSelectImage }) {
  const pickerRef = useRef(null)
  const position = resolvePlanBackgroundPickerPosition(anchorRect)
  const portalRoot = document.querySelector('[data-app-theme-scope]') ?? document.body

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (pickerRef.current?.contains(event.target)) return
      onClose?.()
    }
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose?.()
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [onClose])

  return createPortal(
    <div
      ref={pickerRef}
      className={`${styles.collectionsPopover} ${styles.planBackgroundPicker}`}
      style={position}
      role="dialog"
      aria-modal="false"
      aria-label="Alterar background do plano"
      onMouseDown={(event) => event.stopPropagation()}
      onClick={(event) => event.stopPropagation()}
    >
      <div className={styles.collectionsHeader}>
        <h3 className={styles.collectionsTitle}>Background</h3>
        <button
          type="button"
          className={styles.collectionsClose}
          onClick={onClose}
          aria-label="Fechar seletor de background"
          disabled={busy}
        >
          <XIcon />
        </button>
      </div>

      <div className={styles.collectionsBody}>
        <section className={styles.collectionSection} aria-label="Temas">
          <p className={styles.collectionTitle}>Temas</p>
          <div className={styles.coverGrid}>
            {COVER_THEMES.map((theme) => {
              const active = plan.coverThemeId === theme.id && !plan.coverImageId
              return (
                <button
                  key={theme.id}
                  type="button"
                  className={`${styles.coverOption} ${active ? styles.coverOptionActive : ''} ${resolveCoverThemeClass(styles, theme.id)}`}
                  onClick={() => onSelectTheme?.(theme)}
                  aria-label={theme.label}
                  aria-pressed={active}
                  title={theme.label}
                  disabled={busy}
                >
                  <span className={styles.coverOptionShade} />
                </button>
              )
            })}
          </div>
        </section>

        {BACKGROUND_COLLECTIONS.map((collection) => (
          <section key={collection.id} className={styles.collectionSection} aria-label={collection.title}>
            <p className={styles.collectionTitle}>{collection.title}</p>
            <div className={styles.collectionGrid}>
              {collection.items.map((item) => {
                const active = plan.coverImageId === item.id
                return (
                  <button
                    key={item.id}
                    type="button"
                    className={`${styles.collectionItem} ${active ? styles.collectionItemActive : ''}`}
                    onClick={() => onSelectImage?.(item)}
                    title={item.label}
                    aria-pressed={active}
                    disabled={busy}
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
    </div>,
    portalRoot
  )
}

function PlanRenameInput({ value, busy, onChange, onCommit, onCancel }) {
  const inputRef = useRef(null)

  useEffect(() => {
    inputRef.current?.focus()
    inputRef.current?.select()
  }, [])

  return (
    <div
      className={styles.planRenameGroup}
      onClick={(event) => event.stopPropagation()}
      onMouseDown={(event) => event.stopPropagation()}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          onCommit?.()
        }
      }}
    >
      <input
        ref={inputRef}
        className={styles.planRenameInput}
        value={value}
        disabled={busy}
        maxLength={120}
        onChange={(event) => onChange?.(event.target.value)}
        onKeyDown={(event) => {
          event.stopPropagation()
          if (event.key === 'Enter') {
            event.preventDefault()
            onCommit?.()
          } else if (event.key === 'Escape') {
            event.preventDefault()
            onCancel?.()
          }
        }}
      />
      <button
        type="button"
        className={`${styles.planRenameButton} ${styles.planRenameConfirm}`}
        aria-label="Confirmar novo nome"
        title="Confirmar"
        disabled={busy || !value.trim()}
        onClick={() => onCommit?.()}
      >
        <CheckIcon />
      </button>
      <button
        type="button"
        className={`${styles.planRenameButton} ${styles.planRenameCancel}`}
        aria-label="Cancelar renomeacao"
        title="Cancelar"
        disabled={busy}
        onClick={() => onCancel?.()}
      >
        <XIcon />
      </button>
    </div>
  )
}

function PlanCard({
  plan,
  view,
  onOpen,
  isActive,
  onMore,
  menuOpen,
  menuAnchorRect,
  onMenuAction,
  isRenaming,
  renameDraft,
  renameBusy,
  onRenameDraftChange,
  onRenameCommit,
  onRenameCancel,
}) {
  const handleKeyDown = (event) => {
    if (isRenaming) return
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      onOpen?.()
    }
  }

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

  const actions = (
    <div className={`${styles.planCardActions} ${menuOpen ? styles.planCardActionsOpen : ''}`}>
      <button
        type="button"
        className={`${styles.planCardActionBtn} ${menuOpen ? styles.planCardActionBtnActive : ''}`}
        aria-label="Mais opções"
        title="Mais opções"
        aria-haspopup="menu"
        aria-expanded={menuOpen}
        onMouseDown={(event) => {
          event.preventDefault()
          event.stopPropagation()
        }}
        onClick={(event) => {
          event.preventDefault()
          event.stopPropagation()
          onMore?.(event.currentTarget.getBoundingClientRect())
        }}
      >
        <Ellipsis size={14} strokeWidth={1.75} />
      </button>
      {menuOpen && <PlanOptionsMenu anchorRect={menuAnchorRect} onAction={onMenuAction} />}
    </div>
  )

  if (view === 'list') {
    return (
      <div
        className={`${styles.listCard} ${isActive ? styles.listCardActive : ''}`}
        onClick={isRenaming ? undefined : onOpen}
        onKeyDown={handleKeyDown}
        role="button"
        tabIndex={0}
      >
        {actions}
        <div className={styles.listCardLeft}>
          <div
            className={`${styles.listCover} ${coverClassName}`}
            style={coverStyle}
            aria-hidden="true"
          />
          <div className={styles.listInfo}>
            <div className={styles.listNameRow}>
              {isRenaming ? (
                <PlanRenameInput
                  value={renameDraft}
                  busy={renameBusy}
                  onChange={onRenameDraftChange}
                  onCommit={onRenameCommit}
                  onCancel={onRenameCancel}
                />
              ) : (
                <p className={styles.listName}>{plan.name}</p>
              )}
              {plan.tasks > 0 && (
                <span className={styles.listTaskCount} aria-label={`${plan.tasks} tarefas`}>
                  {plan.tasks}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      className={`${styles.planCard} ${isActive ? styles.planCardActive : ''}`}
      onClick={isRenaming ? undefined : onOpen}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
    >
      {actions}
      <div
        className={`${styles.planCardCover} ${coverClassName}`}
        style={coverStyle}
        aria-hidden="true"
      />
      <div className={styles.cardBody}>
        <div className={styles.cardNameRow}>
          {isRenaming ? (
            <PlanRenameInput
              value={renameDraft}
              busy={renameBusy}
              onChange={onRenameDraftChange}
              onCommit={onRenameCommit}
              onCancel={onRenameCancel}
            />
          ) : (
            <h3 className={styles.cardName}>{plan.name}</h3>
          )}
          {plan.tasks > 0 && (
            <span className={styles.cardTaskCount} aria-label={`${plan.tasks} tarefas`}>
              {plan.tasks}
            </span>
          )}
        </div>
      </div>
    </div>
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

function WorkspaceIntelligenceSection({ firstName, accentStyle }) {
  const navigate = useNavigate()
  const { aiChips = [], setAiChips = () => {} } = usePlans()
  const composerContext = useIntelligenceComposerContext({ scope: 'workspace' })
  const activeConnectors = aiChips.filter((c) => c.kind === 'connector').map((c) => c.type)
  const [draft, setDraft] = useState('')
  const [isListening, setIsListening] = useState(false)
  const recognitionRef = useRef(null)

  useEffect(() => () => {
    recognitionRef.current?.abort?.()
    recognitionRef.current = null
  }, [])

  const navigateToChat = () => {
    const text = draft.trim()
    if (!text && !hasComposerContext(aiChips)) return

    navigate(ROUTES.workspaceChat, {
      state: {
        handoffId: window.crypto?.randomUUID?.() ?? `handoff-${Date.now()}`,
        initialPrompt: text,
        submitComposer: true,
      },
    })
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    navigateToChat()
  }

  const handleVoiceInput = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
      return
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) return

    const recognition = new SpeechRecognition()
    recognition.lang = 'pt-BR'
    recognition.continuous = true
    recognition.interimResults = false

    recognition.onstart = () => setIsListening(true)
    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map((r) => r[0]?.transcript?.trim())
        .filter(Boolean)
        .join(' ')
      if (transcript) {
        setDraft((current) => (current.trim() ? `${current.trim()} ${transcript}` : transcript))
      }
    }
    recognition.onerror = () => {
      recognitionRef.current = null
      setIsListening(false)
    }
    recognition.onend = () => {
      recognitionRef.current = null
      setIsListening(false)
    }

    recognitionRef.current = recognition
    recognition.start()
  }


  return (
    <section
      className={styles.intelligenceSection}
      style={accentStyle}
      aria-label="Seção do Intelligence"
    >
      <div className={styles.intelligenceStage}>
        <p className={styles.intelligenceGreeting}>Olá, {firstName}</p>
        <h2 className={styles.intelligenceTitle}>O que vamos construir hoje?</h2>
        <IntelligenceComposer
          value={draft}
          onChange={setDraft}
          onSubmit={handleSubmit}
          motionLayoutId="ai-composer"
          submitDisabled={!draft.trim() && !hasComposerContext(aiChips)}
          isListening={isListening}
          onVoiceClick={handleVoiceInput}
          voiceAriaLabelListening="Parar gravação de áudio"
          aiChips={aiChips}
          onChipsChange={setAiChips}
          {...composerContext}
          showGitHubBar={activeConnectors.includes('github')}
          githubBarPlacement="insideForm"
          githubBarClassName={`${styles.intelligenceSuggestions} ${styles.intelligenceGitHubBar}`}
          classes={{
            form: styles.intelligencePromptCard,
            input: styles.intelligencePrompt,
            controls: styles.intelligencePromptControls,
            contextSlot: styles.intelligenceContextLeft,
            actions: styles.intelligencePromptActions,
            iconButton: styles.intelligenceIconButton,
            iconButtonActive: styles.intelligenceIconButtonActive,
            sendButton: styles.intelligenceSendButton,
          }}
        />
      </div>
    </section>
  )
}

/* ═══════════════════════════════════════════
   WORKSPACE
═══════════════════════════════════════════ */
export default function Workspace() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { accessToken, currentUser: authUser, workspace } = useAuth()
  const [view,         setView]         = useState('grid')
  const [search,       setSearch]       = useState('')
  const [newPlanAnchor, setNewPlanAnchor] = useState(null)
  const [notification, setNotification] = useState(null)
  const [openPlanMenuId, setOpenPlanMenuId] = useState(null)
  const [planMenuAnchorRect, setPlanMenuAnchorRect] = useState(null)
  const [renamingPlan, setRenamingPlan] = useState(null)
  const [renameDraft, setRenameDraft] = useState('')
  const [renameBusy, setRenameBusy] = useState(false)
  const [backgroundPicker, setBackgroundPicker] = useState(null)
  const [backgroundBusy, setBackgroundBusy] = useState(false)
  const notificationTimerRef = useRef(null)
  const handledFileDeepLinkRef = useRef('')
  const { plans, activePlan, activePlanId, createPlan, deletePlan, renamePlan, updatePlanCover, selectPlan, currentUser, isBackendDriven, isLoading } = usePlans()
  const { localPreferences } = usePreferences()
  const confirmDestructiveActions = localPreferences.confirmDestructiveActions ?? true
  const showIntelligenceSection = localPreferences.showIntelligenceSection ?? DEFAULT_LOCAL_PREFERENCES.showIntelligenceSection
  const intelligenceAccentStyle = {
    '--intelligence-theme-accent': resolveKanbanAccentColor(localPreferences?.kanbanAccentColor),
    '--intelligence-theme-accent-foreground': resolveKanbanAccentForeground(localPreferences?.kanbanAccentColor),
  }
  const userFirstName = currentUser?.fullName?.split(' ')[0] ?? 'Arthur'
  const userId = authUser?.id ?? currentUser?.id ?? null
  const [recentPlanIds, setRecentPlanIds] = useState(() => readRecentPlanIds(userId))

  useEffect(() => {
    setRecentPlanIds(readRecentPlanIds(userId))
  }, [userId, activePlanId])

  const matchesSearch = (plan) => {
    const query = search.trim().toLowerCase()
    if (!query) return true
    return (
      plan.name.toLowerCase().includes(query)
      || plan.tag.toLowerCase().includes(query)
    )
  }

  const filtered = plans.filter(matchesSearch)
  const plansById = useMemo(() => new Map(plans.map((plan) => [plan.id, plan])), [plans])
  const recentPlans = useMemo(
    () => recentPlanIds
      .map((planId) => plansById.get(planId))
      .filter(Boolean)
      .filter(matchesSearch),
    [plansById, recentPlanIds, search],
  )
  const workspaceGroups = useMemo(() => ([
    {
      id: workspace?.id ?? 'current-workspace',
      name: workspace?.name?.trim() || 'Área de trabalho pessoal',
      iconKey: workspace?.iconKey,
      plans: filtered,
    },
  ]), [filtered, workspace?.iconKey, workspace?.id, workspace?.name])
  const hasVisiblePlans = recentPlans.length > 0 || workspaceGroups.some((group) => group.plans.length > 0)
  const backgroundPickerPlan = backgroundPicker?.planId
    ? plans.find((plan) => plan.id === backgroundPicker.planId) ?? null
    : null
  const fileIdFromUrl = String(searchParams.get('file') ?? '').trim()

  const pushNotification = (message) => {
    if (notificationTimerRef.current) {
      clearTimeout(notificationTimerRef.current)
    }
    setNotification(message)
    notificationTimerRef.current = setTimeout(() => {
      setNotification(null)
      notificationTimerRef.current = null
    }, 2600)
  }

  const clearSearch = (event) => {
    event?.preventDefault?.()
    event?.stopPropagation?.()
    setSearch('')
  }

  useEffect(() => {
    if (!fileIdFromUrl) {
      handledFileDeepLinkRef.current = ''
      return undefined
    }
    if (handledFileDeepLinkRef.current === fileIdFromUrl) {
      return undefined
    }

    handledFileDeepLinkRef.current = fileIdFromUrl
    let cancelled = false

    const clearFileParam = () => {
      const nextParams = new URLSearchParams(searchParams)
      if (nextParams.get('file') === fileIdFromUrl) {
        nextParams.delete('file')
        setSearchParams(nextParams, { replace: true })
      }
    }

    if (!isBackendDriven || !accessToken) {
      pushNotification('Arquivos ficam disponíveis quando a sessão está conectada ao backend.')
      clearFileParam()
      return undefined
    }

    apiRequest(`/api/files/${fileIdFromUrl}/download`, {
      token: accessToken,
      responseType: 'blob',
    })
      .then((blob) => {
        if (cancelled) return
        triggerBlobDownload(blob, `arquivo-${fileIdFromUrl.slice(0, 8)}`)
        pushNotification('Download do arquivo iniciado.')
      })
      .catch((error) => {
        if (cancelled) return
        pushNotification(error?.message ?? 'Não foi possível abrir este arquivo.')
      })
      .finally(() => {
        if (!cancelled) {
          clearFileParam()
        }
      })

    return () => {
      cancelled = true
    }
  }, [accessToken, fileIdFromUrl, isBackendDriven, searchParams, setSearchParams])

  const handleNewPlan = async (data) => {
    try {
      const newPlan = await createPlan(data)
      pushNotification(`Plano "${newPlan.name}" criado`)
    } catch (error) {
      setNotification(error.message ?? 'Nao foi possivel criar o plano.')
    }
  }

  const handleDeletePlan = async (plan) => {
    if (!plan?.id) return
    if (confirmDestructiveActions && !window.confirm(`Excluir o plano "${plan.name}"?`)) {
      return
    }
    try {
      await deletePlan(plan.id)
      setOpenPlanMenuId(null)
      setPlanMenuAnchorRect(null)
      pushNotification(`Plano "${plan.name}" excluido`)
    } catch (error) {
      pushNotification(error.message ?? 'Nao foi possivel excluir o plano.')
    }
  }

  const cancelRename = () => {
    if (renameBusy) return
    setRenamingPlan(null)
    setRenameDraft('')
  }

  const startInlineRename = (plan) => {
    setOpenPlanMenuId(null)
    setPlanMenuAnchorRect(null)
    setBackgroundPicker(null)
    setRenamingPlan(plan)
    setRenameDraft(plan?.name ?? '')
  }

  const commitInlineRename = async () => {
    if (renameBusy || !renamingPlan?.id) return
    const nextName = renameDraft.trim()
    if (!nextName) {
      cancelRename()
      return
    }
    if (nextName === (renamingPlan.name ?? '')) {
      cancelRename()
      return
    }
    setRenameBusy(true)
    try {
      const renamed = await renamePlan(renamingPlan.id, nextName)
      setRenamingPlan(null)
      setRenameDraft('')
      pushNotification(`Plano "${renamed.name}" renomeado`)
    } catch (error) {
      pushNotification(error.message ?? 'Nao foi possivel renomear o plano.')
    } finally {
      setRenameBusy(false)
    }
  }

  const handlePlanBackgroundTheme = async (theme) => {
    const plan = plans.find((item) => item.id === backgroundPicker?.planId)
    if (!plan || backgroundBusy) return
    setBackgroundBusy(true)
    try {
      await updatePlanCover(plan.id, {
        cover: theme.cardCover,
        coverThemeId: theme.id,
        coverImageId: null,
        coverImage: null,
        coverImageThumb: null,
      })
      setBackgroundPicker(null)
      pushNotification(`Background de "${plan.name}" atualizado`)
    } catch (error) {
      pushNotification(error.message ?? 'Nao foi possivel alterar o background do plano.')
    } finally {
      setBackgroundBusy(false)
    }
  }

  const handlePlanBackgroundImage = async (image) => {
    const plan = plans.find((item) => item.id === backgroundPicker?.planId)
    if (!plan || backgroundBusy) return
    setBackgroundBusy(true)
    try {
      await updatePlanCover(plan.id, {
        cover: plan.cover ?? null,
        coverThemeId: null,
        coverImageId: image.id,
        coverImage: image.fullUrl ?? image.url,
        coverImageThumb: image.url,
      })
      setBackgroundPicker(null)
      pushNotification(`Background de "${plan.name}" atualizado`)
    } catch (error) {
      pushNotification(error.message ?? 'Nao foi possivel alterar o background do plano.')
    } finally {
      setBackgroundBusy(false)
    }
  }

  const handlePlanMenuAction = (plan, action) => {
    const anchorRect = planMenuAnchorRect
    setOpenPlanMenuId(null)
    setPlanMenuAnchorRect(null)
    if (action === 'board') {
      setBackgroundPicker(null)
      openBoard(plan.id)
    } else if (action === 'rename') {
      startInlineRename(plan)
    } else if (action === 'background') {
      setRenamingPlan(null)
      setRenameDraft('')
      setBackgroundPicker({ planId: plan.id, anchorRect })
    } else if (action === 'delete') {
      setBackgroundPicker(null)
      void handleDeletePlan(plan)
    }
  }

  useEffect(() => () => {
    if (notificationTimerRef.current) {
      clearTimeout(notificationTimerRef.current)
    }
  }, [])

  useEffect(() => {
    if (!openPlanMenuId) return undefined
    const handlePointerDown = () => {
      setOpenPlanMenuId(null)
      setPlanMenuAnchorRect(null)
    }
    const handleResize = () => {
      setOpenPlanMenuId(null)
      setPlanMenuAnchorRect(null)
    }
    document.addEventListener('mousedown', handlePointerDown)
    window.addEventListener('resize', handleResize)
    window.addEventListener('scroll', handleResize, true)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('scroll', handleResize, true)
    }
  }, [openPlanMenuId])

  const openBoard = (planId) => {
    setBackgroundPicker(null)
    selectPlan(planId)
    navigate(buildWorkspaceBoardPath(planId))
  }

  const openNewPlan = (event) => {
    setNewPlanAnchor(event.currentTarget)
  }

  const renderPlanCard = (plan, cardView = view) => (
    <PlanCard
      key={plan.id}
      plan={plan}
      view={cardView}
      onOpen={() => openBoard(plan.id)}
      onMore={(anchorRect) => {
        setOpenPlanMenuId((current) => (current === plan.id ? null : plan.id))
        setPlanMenuAnchorRect(openPlanMenuId === plan.id ? null : anchorRect)
      }}
      menuOpen={openPlanMenuId === plan.id}
      menuAnchorRect={planMenuAnchorRect}
      onMenuAction={(action) => handlePlanMenuAction(plan, action)}
      isRenaming={renamingPlan?.id === plan.id}
      renameDraft={renameDraft}
      renameBusy={renameBusy}
      onRenameDraftChange={setRenameDraft}
      onRenameCommit={commitInlineRename}
      onRenameCancel={cancelRename}
      isActive={plan.id === activePlan?.id}
    />
  )

  const renderPlanCollection = (planList, { includeNewPlanCard = false, gridClassName = styles.grid } = {}) => {
    if (planList.length === 0 && !includeNewPlanCard) {
      return null
    }

    if (view === 'grid') {
      return (
        <div className={gridClassName}>
          {planList.map((plan) => renderPlanCard(plan, 'grid'))}
          {includeNewPlanCard ? (
            <button className={styles.newPlanCard} onClick={openNewPlan}>
              <span className={styles.newPlanIcon}><PlusIcon /></span>
              <span className={styles.newPlanLabel}>Novo plano</span>
            </button>
          ) : null}
        </div>
      )
    }

    return (
      <div className={styles.listView}>
        {planList.map((plan) => renderPlanCard(plan, 'list'))}
      </div>
    )
  }

  const sectionControls = (
    <div className={styles.sectionControls}>
      <label className={styles.searchWrap}>
        <span className={styles.searchIcon} aria-hidden="true"><SearchIcon /></span>
        <input
          className={styles.searchInput}
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Buscar planos..."
        />
        {search ? (
          <button
            type="button"
            className={styles.searchClear}
            onMouseDown={(event) => event.preventDefault()}
            onClick={clearSearch}
            aria-label="Limpar busca de planos"
          >
            <XIcon />
          </button>
        ) : null}
      </label>
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
  )

  const renderSectionHeader = (titleId, title, count, { withControls = false } = {}) => (
    <div className={styles.sectionHeader}>
      <div className={styles.sectionLeft}>
        <h2 id={titleId} className={styles.sectionTitle}>{title}</h2>
        <span className={styles.planCount}>{count}</span>
      </div>
      {withControls ? sectionControls : null}
    </div>
  )

  const renderWorkspacesSectionHeader = (withControls = false) => (
    <div className={styles.sectionHeader}>
      <div className={styles.sectionLeft}>
        <h2 id="workspace-workspaces-title" className={styles.sectionTitle}>Workspaces</h2>
        <span className={styles.planCount}>{workspaceGroups.length}</span>
      </div>
      <div className={styles.sectionHeaderRight}>
        <WorkspaceSectionActions />
        {withControls ? sectionControls : null}
      </div>
    </div>
  )

  const plansSectionContent = (
    <>
      {!hasVisiblePlans ? (
        <div className={styles.plansGalleryBody}>
          {renderWorkspacesSectionHeader(true)}
          <div className={styles.emptyState}>
              <span className={styles.emptyStateIcon}><SearchIcon /></span>
              <p className={styles.emptyStateTitle}>Nenhum plano encontrado</p>
              <p className={styles.emptyStateHint}>
                {search
                  ? `Tente outro termo ou limpe "${search}" para ver tudo.`
                  : 'Crie seu primeiro plano para organizar o trabalho no quadro.'}
              </p>
              <div className={styles.emptyStateActions}>
                {search && (
                  <button type="button" className={styles.emptyStateBtn} onClick={clearSearch}>
                    Limpar busca
                  </button>
                )}
                <button type="button" className={styles.emptyStateBtnPrimary} onClick={openNewPlan}>
                  <PlusIcon />
                  Novo plano
                </button>
              </div>
            </div>
        </div>
      ) : (
        <div className={styles.plansGalleryBody}>
          {recentPlans.length > 0 ? (
            <section className={styles.recentSection} aria-labelledby="workspace-recent-title">
              {renderSectionHeader('workspace-recent-title', 'Recentes', recentPlans.length, { withControls: true })}
              {renderPlanCollection(recentPlans, {
                gridClassName: `${styles.grid} ${styles.recentGrid}`,
              })}
            </section>
          ) : null}

          <section className={styles.workspacesSection} aria-labelledby="workspace-workspaces-title">
            {renderWorkspacesSectionHeader(recentPlans.length === 0)}

            <div className={styles.workspaceGroups}>
              {workspaceGroups.map((group) => (
                <div key={group.id} className={styles.workspaceGroup}>
                  <div className={styles.workspaceGroupHeader}>
                    <span className={styles.workspaceGroupIcon} aria-hidden="true">
                      <WorkspaceIconGlyph iconKey={group.iconKey} className={styles.workspaceGroupIconGlyph} />
                    </span>
                    <h3 className={styles.workspaceGroupTitle}>{group.name}</h3>
                    <span className={styles.planCount}>{group.plans.length}</span>
                  </div>
                  {group.plans.length === 0 ? (
                    <p className={styles.workspaceGroupEmpty}>
                      {search ? 'Nenhum plano corresponde à busca neste workspace.' : 'Nenhum plano neste workspace ainda.'}
                    </p>
                  ) : (
                    renderPlanCollection(group.plans, { includeNewPlanCard: view === 'grid' })
                  )}
                </div>
              ))}
            </div>
          </section>
        </div>
      )}
    </>
  )

  return (
    <AppThemeScope>
      <ProductAppShell
        styles={styles}
        contentClassName={styles.main}
        contentTag="main"
      >
        <CustomScrollArea
          className={styles.mainScrollArea}
          viewportClassName={styles.mainScrollViewport}
          refreshKey={`workspace:${view}:${showIntelligenceSection ? 'intelligence' : 'plans'}:${isLoading ? 'loading' : 'ready'}`}
        >
          <WorkspaceHeader title="Início" compact sticky className={styles.workspaceTopHeaderGlass} />

          {/* Content */}
          <div className={`${styles.content} ${showIntelligenceSection ? styles.contentFramed : ''}`}>
            {isBackendDriven && isLoading ? (
              showIntelligenceSection ? (
                <section className={styles.plansGalleryPanel} aria-label="Carregando planos do workspace">
                  <WorkspaceLoadingState view={view} />
                </section>
              ) : (
                <WorkspaceLoadingState view={view} />
              )
            ) : (
              <>
                {showIntelligenceSection ? (
                  <WorkspaceIntelligenceSection
                    firstName={userFirstName}
                    accentStyle={intelligenceAccentStyle}
                  />
                ) : null}

                {showIntelligenceSection ? (
                  <section className={styles.plansGalleryPanel} aria-labelledby="workspace-workspaces-title">
                    {plansSectionContent}
                  </section>
                ) : (
                  plansSectionContent
                )}
              </>
            )}
          </div>
        </CustomScrollArea>
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

      {backgroundPickerPlan && (
        <PlanBackgroundPicker
          plan={backgroundPickerPlan}
          anchorRect={backgroundPicker.anchorRect}
          busy={backgroundBusy}
          onClose={() => {
            if (!backgroundBusy) setBackgroundPicker(null)
          }}
          onSelectTheme={handlePlanBackgroundTheme}
          onSelectImage={handlePlanBackgroundImage}
        />
      )}

      {notification && (
        <div className={styles.notification} role="status" aria-live="polite">
          {notification}
        </div>
      )}
    </AppThemeScope>
  )
}
