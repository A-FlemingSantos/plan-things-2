import { useState, useEffect, useLayoutEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { buildWorkspaceBoardPath } from '../../../../shared/config/routes.js'
import { WORKSPACE_NAV_ITEMS } from '../../../../shared/config/workspaceNavigation.js'
import ProductAppShell from '../../../../shared/components/ProductAppShell/ProductAppShell.jsx'
import PlanPageHeader from '../../../../shared/components/PlanPageHeader/PlanPageHeader.jsx'
import PlanSidebarSection from '../../../../shared/components/PlanSidebarSection/PlanSidebarSection.jsx'
import SidebarAccountMenu from '../../../../shared/components/SidebarAccountMenu/SidebarAccountMenu.jsx'
import { useResponsiveViewport } from '../../../../shared/hooks/useResponsiveViewport.js'
import { useWorkspaceNavigation } from '../../../../shared/hooks/useWorkspaceNavigation.js'
import { DEFAULT_LOCAL_PREFERENCES, usePreferences } from '../../../preferences/context/PreferencesContext.jsx'
import AppThemeScope from '../../../preferences/components/AppThemeScope/AppThemeScope.jsx'
import {
  resolveKanbanAccentColor,
  resolveKanbanAccentForeground,
} from '../../data/kanbanColorPalette.js'
import { usePlans } from '../../context/PlansContext.jsx'
import InviteNotifications from '../../components/InviteNotifications/InviteNotifications.jsx'
import styles from './Workspace.module.css'

/* ═══════════════════════════════════════════
   ICONS
═══════════════════════════════════════════ */
function HomeIcon()     { return <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 6.5L8 2l6 4.5V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V6.5z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/><path d="M6 15V9h4v6" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/></svg> }
function PopoverIcon()  { return <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M4 2.5H2.5v7H9.5V8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/><path d="M5 7L9.5 2.5M7 2.5h2.5V5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg> }
function CalendarIcon() { return <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="2" y="3" width="12" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.3"/><path d="M5 1.8v2.8M11 1.8v2.8M2.5 6.5h11" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg> }
function FilesIcon()    { return <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M9 1.5H4a1.5 1.5 0 0 0-1.5 1.5v10A1.5 1.5 0 0 0 4 14.5h8A1.5 1.5 0 0 0 13.5 13V6L9 1.5z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/><path d="M9 1.5V6H13.5" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/></svg> }
function PlusIcon()     { return <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 2v10M2 7h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg> }
function ImagePlusIcon(){ return <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="1.5" y="2" width="11" height="9.5" rx="2" stroke="currentColor" strokeWidth="1.2"/><path d="M4 8l1.7-1.8a.8.8 0 0 1 1.2 0L9 8.5l1-1a.8.8 0 0 1 1.1 0L12.5 9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/><path d="M10.5 1.5v3M9 3h3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg> }
function SearchIcon()   { return <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.3"/><path d="M9.5 9.5L12.5 12.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg> }
function GridIcon()     { return <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="1" y="1" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.3"/><rect x="8" y="1" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.3"/><rect x="1" y="8" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.3"/><rect x="8" y="8" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.3"/></svg> }
function ListIcon()     { return <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 4h8M3 7h8M3 10h5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg> }
function ChevronIcon()  { return <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M4.5 3l3 3-3 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg> }
function XIcon()        { return <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg> }
function CheckIcon()    { return <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2.5 7.2l3 3L11.8 3.8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg> }
function CollapseIcon() { return <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M9 2L5 7l4 5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg> }
function MicIcon()      { return <svg width="13" height="13" viewBox="0 0 14 14" fill="none"><path d="M7 8.8a2.2 2.2 0 0 0 2.2-2.2V3.7a2.2 2.2 0 1 0-4.4 0v2.9A2.2 2.2 0 0 0 7 8.8z" stroke="currentColor" strokeWidth="1.2"/><path d="M2.8 6.7a4.2 4.2 0 0 0 8.4 0M7 10.9v1.6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg> }
function ArrowUpIcon()  { return <svg width="13" height="13" viewBox="0 0 14 14" fill="none"><path d="M7 11.5v-9M3.5 6 7 2.5 10.5 6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg> }

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
    item.id === 'calendar' ? CalendarIcon : FilesIcon,
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

const WORKSPACE_INTELLIGENCE_SUGGESTIONS = [
  {
    label: 'Sincronizar calendário',
    prompt: 'Sincronize meu calendário e sugira os próximos blocos de trabalho.',
  },
  {
    label: 'Criar pitch deck',
    prompt: 'Crie uma estrutura de pitch deck para apresentar esta ideia.',
  },
  {
    label: 'Inicializar UI system',
    prompt: 'Inicialize um UI system com componentes e tokens essenciais.',
  },
]

const VOICE_INPUT_ERROR_MESSAGES = {
  'audio-capture': 'Nenhum microfone disponível foi encontrado.',
  'language-not-supported': 'Reconhecimento de voz em português não está disponível neste navegador.',
  network: 'O reconhecimento de voz do navegador está indisponível. Tente Chrome/Edge com internet ou digite o prompt.',
  'no-speech': 'Não detectei fala. Tente novamente falando mais perto do microfone.',
  'not-allowed': 'Permissão do microfone negada. Libere o acesso ao microfone no navegador.',
  'service-not-allowed': 'O navegador bloqueou o serviço de reconhecimento de voz.',
}

const MAX_VOICE_RESTART_ATTEMPTS = 3
const VOICE_RESTART_BASE_DELAY_MS = 350
const VOICE_RESTART_STEP_DELAY_MS = 250
const VOICE_RESTART_MAX_DELAY_MS = 1000
const VOICE_STOP_FINALIZE_DELAY_MS = 600

function getVoiceInputErrorMessage(error) {
  const code = error?.error || error?.name

  if (code === 'NotAllowedError' || code === 'PermissionDeniedError') {
    return VOICE_INPUT_ERROR_MESSAGES['not-allowed']
  }

  if (code === 'NotFoundError' || code === 'DevicesNotFoundError') {
    return VOICE_INPUT_ERROR_MESSAGES['audio-capture']
  }

  return VOICE_INPUT_ERROR_MESSAGES[code] || 'Não foi possível capturar o áudio agora.'
}

function buildWorkspaceIntelligenceReply(prompt) {
  const normalized = prompt.toLowerCase()

  if (normalized.includes('calend')) {
    return 'Posso organizar isso em blocos de foco. Comece mapeando reuniões fixas, separe 2 janelas para execução profunda e reserve um checkpoint curto no fim do dia.'
  }

  if (normalized.includes('pitch')) {
    return 'Uma boa base: problema, público, insight, solução, diferenciais, plano de execução e próximos passos. Se quiser, posso transformar isso em um roteiro slide a slide.'
  }

  if (normalized.includes('ui')) {
    return 'Vamos começar pelo essencial: tokens de cor e espaçamento, tipografia, botões, inputs, cards de conteúdo e estados de feedback. Depois conectamos isso aos fluxos principais.'
  }

  return 'Entendi. Eu começaria separando a ideia em objetivo, usuários, fluxo principal, riscos e primeiro entregável. Me diga qual parte você quer aprofundar e eu continuo a partir dela.'
}

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

function TrashIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M3 4.5h8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M5.2 4.5v-.8c0-.6.5-1.1 1.1-1.1h1.4c.6 0 1.1.5 1.1 1.1v.8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M4.2 4.7l.4 6.3c.04.6.53 1.1 1.13 1.1h2.54c.6 0 1.1-.5 1.13-1.1l.4-6.3" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
    </svg>
  )
}

function PencilIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M8.8 2.7 11.3 5.2M2.5 11.5l2.8-.6L11 5.2a1.8 1.8 0 0 0-2.5-2.5L2.9 8.4l-.4 3.1z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
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
    { id: 'board', label: 'Abrir quadro', Icon: GridIcon },
    { id: 'rename', label: 'Renomear', Icon: PencilIcon },
    { id: 'background', label: 'Alterar background', Icon: ImagePlusIcon },
    { id: 'delete', label: 'Excluir', Icon: TrashIcon, danger: true },
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
          <Icon />
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
        <MoreIcon />
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

function WorkspaceIntelligenceSection({ firstName, accentStyle, sectionRef, sectionStyle }) {
  const [draft, setDraft] = useState('')
  const [messages, setMessages] = useState([])
  const [isThinking, setIsThinking] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [voiceFeedback, setVoiceFeedback] = useState('')
  const chatLogRef = useRef(null)
  const responseTimerRef = useRef(null)
  const recognitionRef = useRef(null)
  const voiceEndingRecognitionRef = useRef(null)
  const recognitionRestartTimerRef = useRef(null)
  const voiceStopFinalizeTimerRef = useRef(null)
  const voiceListeningRequestedRef = useRef(false)
  const voiceRestartAttemptsRef = useRef(0)
  const stopRequestedRef = useRef(false)
  const voiceCaptureFinalizedRef = useRef(false)
  const lastVoiceRecognitionErrorRef = useRef('')
  const voiceTranscriptEntriesRef = useRef(new Map())
  const voiceRecognitionSequenceRef = useRef(0)

  useEffect(() => () => {
    if (responseTimerRef.current) {
      clearTimeout(responseTimerRef.current)
    }
    if (recognitionRestartTimerRef.current) {
      clearTimeout(recognitionRestartTimerRef.current)
    }
    if (voiceStopFinalizeTimerRef.current) {
      clearTimeout(voiceStopFinalizeTimerRef.current)
    }
    voiceListeningRequestedRef.current = false
    stopRequestedRef.current = true
    voiceCaptureFinalizedRef.current = true
    recognitionRef.current?.abort?.()
    recognitionRef.current = null
    voiceEndingRecognitionRef.current = null
  }, [])

  useEffect(() => {
    if (!chatLogRef.current) return
    chatLogRef.current.scrollTop = chatLogRef.current.scrollHeight
  }, [messages, isThinking])

  const submitPrompt = (value = draft) => {
    const text = value.trim()
    if (!text || isThinking) return

    const userMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text,
    }

    setMessages((current) => [...current, userMessage])
    setDraft('')
    setVoiceFeedback('')
    setIsThinking(true)

    if (responseTimerRef.current) {
      clearTimeout(responseTimerRef.current)
    }

    responseTimerRef.current = setTimeout(() => {
      setMessages((current) => [
        ...current,
        {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          text: buildWorkspaceIntelligenceReply(text),
        },
      ])
      setIsThinking(false)
      responseTimerRef.current = null
    }, 550)
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    submitPrompt()
  }

  const handleAddContext = () => {
    setDraft((current) => {
      const context = 'Considere meus planos, calendário e arquivos do workspace como contexto.'
      return current.trim() ? `${current.trim()} ${context}` : context
    })
    setVoiceFeedback('Contexto do workspace adicionado ao prompt.')
  }

  const clearRecognitionRestartTimer = () => {
    if (!recognitionRestartTimerRef.current) return
    clearTimeout(recognitionRestartTimerRef.current)
    recognitionRestartTimerRef.current = null
  }

  const clearVoiceStopFinalizeTimer = () => {
    if (!voiceStopFinalizeTimerRef.current) return
    clearTimeout(voiceStopFinalizeTimerRef.current)
    voiceStopFinalizeTimerRef.current = null
  }

  const scheduleVoiceStopFinalization = (emptyFeedback = 'Captura de voz interrompida.') => {
    if (voiceStopFinalizeTimerRef.current || voiceCaptureFinalizedRef.current) return

    voiceStopFinalizeTimerRef.current = setTimeout(() => {
      voiceStopFinalizeTimerRef.current = null
      if (!stopRequestedRef.current && !voiceEndingRecognitionRef.current) return
      finishVoiceCapture(emptyFeedback)
    }, VOICE_STOP_FINALIZE_DELAY_MS)
  }

  const appendVoiceTranscriptToPrompt = () => {
    const transcript = [...voiceTranscriptEntriesRef.current.values()]
      .sort((leftEntry, rightEntry) => (
        leftEntry.recognitionSequence - rightEntry.recognitionSequence
        || leftEntry.resultIndex - rightEntry.resultIndex
      ))
      .map(({ transcript: partialTranscript }) => partialTranscript)
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim()
    voiceTranscriptEntriesRef.current.clear()
    voiceRecognitionSequenceRef.current = 0

    if (!transcript) return false

    setDraft((current) => (current.trim() ? `${current.trim()} ${transcript}` : transcript))
    return true
  }

  const finishVoiceCapture = (emptyFeedback = 'Captura de voz interrompida.') => {
    if (voiceCaptureFinalizedRef.current) return false

    voiceCaptureFinalizedRef.current = true
    clearRecognitionRestartTimer()
    clearVoiceStopFinalizeTimer()
    voiceListeningRequestedRef.current = false
    stopRequestedRef.current = false
    lastVoiceRecognitionErrorRef.current = ''
    recognitionRef.current = null
    voiceEndingRecognitionRef.current = null
    voiceRestartAttemptsRef.current = 0
    setIsListening(false)

    const didCommitTranscript = appendVoiceTranscriptToPrompt()
    setVoiceFeedback(didCommitTranscript ? 'Texto de voz adicionado ao prompt.' : emptyFeedback)
    return didCommitTranscript
  }

  const failVoiceCapture = (feedback) => {
    if (voiceCaptureFinalizedRef.current) return

    voiceCaptureFinalizedRef.current = true
    clearRecognitionRestartTimer()
    clearVoiceStopFinalizeTimer()
    voiceListeningRequestedRef.current = false
    stopRequestedRef.current = false
    lastVoiceRecognitionErrorRef.current = ''
    recognitionRef.current = null
    voiceEndingRecognitionRef.current = null
    voiceRestartAttemptsRef.current = 0
    voiceTranscriptEntriesRef.current.clear()
    voiceRecognitionSequenceRef.current = 0
    setIsListening(false)
    setVoiceFeedback(feedback)
  }

  const handleVoiceInput = () => {
    if (typeof window === 'undefined') return

    if (voiceListeningRequestedRef.current || recognitionRef.current || recognitionRestartTimerRef.current) {
      const activeRecognition = recognitionRef.current
      voiceListeningRequestedRef.current = false
      stopRequestedRef.current = true
      voiceRestartAttemptsRef.current = 0
      lastVoiceRecognitionErrorRef.current = ''
      clearRecognitionRestartTimer()
      setIsListening(false)
      setVoiceFeedback('Finalizando captura de voz...')

      if (!activeRecognition) {
        finishVoiceCapture()
        return
      }

      try {
        activeRecognition.stop?.()
        scheduleVoiceStopFinalization()
      } catch {
        try {
          activeRecognition.abort?.()
        } catch {
          // Ignore abort failures; the fallback finalization below keeps the UI consistent.
        }
        finishVoiceCapture()
      }
      return
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition

    if (!SpeechRecognition) {
      setVoiceFeedback('Ditado por voz não está disponível neste navegador.')
      return
    }

    if (window.isSecureContext === false) {
      setVoiceFeedback('O microfone só pode ser usado em HTTPS ou localhost.')
      return
    }

    const scheduleRecognitionRestart = (reason = '') => {
      if (!voiceListeningRequestedRef.current || stopRequestedRef.current) return
      if (recognitionRestartTimerRef.current) return

      const isErrorRestart = reason === 'network' || reason === 'invalid-state'
      if (isErrorRestart && voiceRestartAttemptsRef.current >= MAX_VOICE_RESTART_ATTEMPTS) {
        finishVoiceCapture(getVoiceInputErrorMessage(reason === 'network' ? { error: 'network' } : { name: 'InvalidStateError' }))
        return
      }

      const delay = Math.min(
        VOICE_RESTART_BASE_DELAY_MS + voiceRestartAttemptsRef.current * VOICE_RESTART_STEP_DELAY_MS,
        VOICE_RESTART_MAX_DELAY_MS,
      )
      voiceRestartAttemptsRef.current = isErrorRestart ? voiceRestartAttemptsRef.current + 1 : 0
      setIsListening(true)
      setVoiceFeedback(isErrorRestart && voiceRestartAttemptsRef.current > 1 ? 'Reconectando captura de voz...' : 'Ouvindo... clique no microfone para parar.')

      recognitionRestartTimerRef.current = setTimeout(() => {
        recognitionRestartTimerRef.current = null
        startRecognition()
      }, delay)
    }

    const startRecognition = () => {
      if (!voiceListeningRequestedRef.current || stopRequestedRef.current) return

      const recognition = new SpeechRecognition()
      const recognitionSequence = voiceRecognitionSequenceRef.current
      voiceRecognitionSequenceRef.current += 1
      recognition.lang = 'pt-BR'
      recognition.continuous = true
      recognition.interimResults = true
      recognition.maxAlternatives = 1
      recognition.onstart = () => {
        if (recognitionRef.current !== recognition) return

        lastVoiceRecognitionErrorRef.current = ''
        setIsListening(true)
        setVoiceFeedback('Ouvindo... clique no microfone para parar.')
      }
      recognition.onerror = (event) => {
        if (recognitionRef.current !== recognition && !stopRequestedRef.current) return
        if (event?.error === 'aborted' || stopRequestedRef.current) return

        if (event?.error === 'network') {
          lastVoiceRecognitionErrorRef.current = 'network'
          setIsListening(true)
          setVoiceFeedback('Ouvindo... clique no microfone para parar.')
          return
        }

        if (event?.error === 'no-speech') {
          finishVoiceCapture(getVoiceInputErrorMessage(event))
          return
        }

        failVoiceCapture(getVoiceInputErrorMessage(event))
      }
      recognition.onend = () => {
        if (voiceCaptureFinalizedRef.current) return

        const wasCurrentRecognition = recognitionRef.current === recognition
        if (recognitionRef.current === recognition) {
          recognitionRef.current = null
          voiceEndingRecognitionRef.current = recognition
        }

        if (!wasCurrentRecognition && voiceEndingRecognitionRef.current !== recognition) return

        if (stopRequestedRef.current || !voiceListeningRequestedRef.current) {
          voiceEndingRecognitionRef.current = recognition
          scheduleVoiceStopFinalization()
          return
        }

        voiceEndingRecognitionRef.current = recognition
        const restartReason = lastVoiceRecognitionErrorRef.current
        lastVoiceRecognitionErrorRef.current = ''
        scheduleRecognitionRestart(restartReason)
      }
      recognition.onresult = (event) => {
        const isActiveRecognition = recognitionRef.current === recognition
        const isEndingRecognition = voiceEndingRecognitionRef.current === recognition
        if (voiceCaptureFinalizedRef.current || (!isActiveRecognition && !isEndingRecognition)) return

        const results = event.results || []
        const startIndex = Number.isInteger(event.resultIndex) ? event.resultIndex : 0

        for (let index = startIndex; index < results.length; index += 1) {
          const result = results[index]
          const transcript = result?.[0]?.transcript?.trim()
          if (!transcript) continue

          const entryKey = `${recognitionSequence}:${index}`
          const existingEntry = voiceTranscriptEntriesRef.current.get(entryKey)
          const isFinal = result.isFinal !== false
          if (existingEntry?.transcript === transcript && existingEntry?.isFinal === isFinal) continue

          voiceTranscriptEntriesRef.current.set(entryKey, {
            recognitionSequence,
            resultIndex: index,
            transcript,
            isFinal,
          })
          voiceRestartAttemptsRef.current = 0
        }
      }

      recognitionRef.current = recognition
      try {
        recognition.start()
      } catch (error) {
        recognitionRef.current = null
        if (voiceListeningRequestedRef.current && (error?.name === 'InvalidStateError' || error?.error === 'network')) {
          scheduleRecognitionRestart(error?.error === 'network' ? 'network' : 'invalid-state')
          return
        }
        failVoiceCapture(getVoiceInputErrorMessage(error))
      }
    }

    voiceListeningRequestedRef.current = true
    stopRequestedRef.current = false
    voiceCaptureFinalizedRef.current = false
    lastVoiceRecognitionErrorRef.current = ''
    voiceRestartAttemptsRef.current = 0
    voiceEndingRecognitionRef.current = null
    voiceTranscriptEntriesRef.current.clear()
    voiceRecognitionSequenceRef.current = 0
    clearRecognitionRestartTimer()
    clearVoiceStopFinalizeTimer()
    setIsListening(true)
    setVoiceFeedback('Ouvindo... clique no microfone para parar.')
    startRecognition()
  }

  return (
    <section
      ref={sectionRef}
      className={styles.intelligenceSection}
      style={{ ...accentStyle, ...sectionStyle }}
      aria-label="Seção do Intelligence"
    >
      <p className={styles.intelligenceGreeting}>Olá, {firstName}</p>
      <h2 className={styles.intelligenceTitle}>O que vamos construir hoje?</h2>
      {messages.length || isThinking ? (
        <div ref={chatLogRef} className={styles.intelligenceChatLog} role="log" aria-label="Conversa com o Intelligence" aria-live="polite">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`${styles.intelligenceMessage} ${message.role === 'user' ? styles.intelligenceMessageUser : styles.intelligenceMessageAssistant}`}
            >
              {message.text}
            </div>
          ))}
          {isThinking ? (
            <div className={`${styles.intelligenceMessage} ${styles.intelligenceMessageAssistant}`}>
              Pensando...
            </div>
          ) : null}
        </div>
      ) : null}
      <form className={styles.intelligencePromptCard} onSubmit={handleSubmit}>
        <textarea
          className={styles.intelligencePrompt}
          placeholder="Descreva seu produto, fluxo ou ideia..."
          aria-label="Prompt do Intelligence"
          rows={3}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault()
              event.currentTarget.form?.requestSubmit()
            }
          }}
        />
        <div className={styles.intelligencePromptControls}>
          <button type="button" className={styles.intelligenceGhostAction} aria-label="Adicionar contexto ao Intelligence" onClick={handleAddContext}>
            <PlusIcon />
          </button>
          <div className={styles.intelligencePromptActions}>
            <button
              type="button"
              className={`${styles.intelligenceIconButton} ${isListening ? styles.intelligenceIconButtonActive : ''}`}
              aria-label={isListening ? 'Parar gravação de áudio para o Intelligence' : 'Gravar áudio para o Intelligence'}
              aria-pressed={isListening}
              onClick={handleVoiceInput}
            >
              <MicIcon />
            </button>
            <button type="submit" className={styles.intelligenceSendButton} aria-label="Enviar prompt ao Intelligence" disabled={!draft.trim() || isThinking}>
              <ArrowUpIcon />
            </button>
          </div>
        </div>
        <div className={styles.intelligenceSuggestions} aria-label="Sugestões do Intelligence">
          {WORKSPACE_INTELLIGENCE_SUGGESTIONS.map((suggestion) => (
            <button
              key={suggestion.label}
              type="button"
              className={styles.intelligenceSuggestionButton}
              onClick={() => submitPrompt(suggestion.prompt)}
              disabled={isThinking}
            >
              {suggestion.label}
            </button>
          ))}
        </div>
      </form>
      {voiceFeedback ? (
        <p className={styles.intelligenceFeedback} role="status">{voiceFeedback}</p>
      ) : null}
    </section>
  )
}

/* ═══════════════════════════════════════════
   WORKSPACE
═══════════════════════════════════════════ */
export default function Workspace() {
  const navigate = useNavigate()
  const { isMobile } = useResponsiveViewport()
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
  const intelligenceSectionRef = useRef(null)
  const [intelligenceSectionMinHeight, setIntelligenceSectionMinHeight] = useState(null)
  const { plans, activePlan, createPlan, deletePlan, renamePlan, updatePlanCover, selectPlan, currentUser, isBackendDriven, isLoading } = usePlans()
  const { localPreferences } = usePreferences()
  const { activeNav, handleNavItemClick } = useWorkspaceNavigation()
  const confirmDestructiveActions = localPreferences.confirmDestructiveActions ?? true
  const showIntelligenceSection = localPreferences.showIntelligenceSection ?? DEFAULT_LOCAL_PREFERENCES.showIntelligenceSection
  const intelligenceAccentStyle = {
    '--intelligence-theme-accent': resolveKanbanAccentColor(localPreferences?.kanbanAccentColor),
    '--intelligence-theme-accent-foreground': resolveKanbanAccentForeground(localPreferences?.kanbanAccentColor),
  }
  const intelligenceSectionStyle = intelligenceSectionMinHeight
    ? { '--workspace-intelligence-height': `${intelligenceSectionMinHeight}px` }
    : undefined
  const userFirstName = currentUser?.fullName?.split(' ')[0] ?? 'Arthur'

  const filtered = plans.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.tag.toLowerCase().includes(search.toLowerCase())
  )
  const backgroundPickerPlan = backgroundPicker?.planId
    ? plans.find((plan) => plan.id === backgroundPicker.planId) ?? null
    : null

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

  useLayoutEffect(() => {
    if (!showIntelligenceSection || typeof window === 'undefined') {
      setIntelligenceSectionMinHeight(null)
      return undefined
    }

    const measureIntelligenceSection = () => {
      const sectionElement = intelligenceSectionRef.current
      if (!sectionElement) return

      const { top } = sectionElement.getBoundingClientRect()
      const nextHeight = Math.max(320, Math.floor(window.innerHeight - top))
      setIntelligenceSectionMinHeight((current) => (
        current === nextHeight ? current : nextHeight
      ))
    }

    measureIntelligenceSection()
    window.addEventListener('resize', measureIntelligenceSection)

    return () => {
      window.removeEventListener('resize', measureIntelligenceSection)
    }
  }, [showIntelligenceSection, isMobile])

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
    <AppThemeScope>
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
        mobileTitle="Início"
      >
          <PlanPageHeader
            title="Início"
            meta={`Bom dia, ${userFirstName}.`}
            tone="solid"
            titleSize="medium"
            className={styles.workspaceHeader}
            actions={(
              <div className={styles.topbarRight}>
                <div className={styles.topbarUtility}>
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
                  <InviteNotifications />
                </div>
                <button type="button" className={styles.newPlanBtn} onClick={openNewPlan}>
                  <PlusIcon />
                  Novo plano
                </button>
              </div>
            )}
          />

          {/* Content */}
          <div className={styles.content}>
            {isBackendDriven && isLoading ? (
              <WorkspaceLoadingState view={view} />
            ) : (
              <>
                {showIntelligenceSection ? (
                  <WorkspaceIntelligenceSection
                    firstName={userFirstName}
                    accentStyle={intelligenceAccentStyle}
                    sectionRef={intelligenceSectionRef}
                    sectionStyle={intelligenceSectionStyle}
                  />
                ) : null}

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
                    : 'Crie seu primeiro plano para organizar o trabalho no quadro.'}
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
