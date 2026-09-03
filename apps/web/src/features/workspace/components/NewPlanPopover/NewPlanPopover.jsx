import { useState, useEffect, useLayoutEffect, useRef } from 'react'
import {
  ChevronIcon,
  ImagePlusIcon,
  MoreIcon,
  XIcon,
} from '../WorkspaceIcons/WorkspaceIcons.jsx'
import {
  BACKGROUND_COLLECTIONS,
  COVER_THEMES,
  PLAN_TAGS,
} from '../workspaceCover/workspaceCoverConstants.js'
import {
  buildCustomCoverImageFromFile,
  resolveCoverThemeClass,
} from '../workspaceCover/workspaceCoverUtils.js'
import CoverSelectionCheck from '../workspaceCover/CoverSelectionCheck.jsx'
import CustomScrollArea from '../../../../shared/components/CustomScrollArea/CustomScrollArea.jsx'
import styles from '../../pages/Workspace/Workspace.module.css'

export default function NewPlanPopover({ anchorEl, onClose, onSubmit, isBackendDriven = false }) {
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
  const customCoverUrlsRef = useRef([])

  const revokeCustomCoverUrls = () => {
    customCoverUrlsRef.current.forEach((url) => {
      if (url?.startsWith('blob:') && typeof URL.revokeObjectURL === 'function') {
        URL.revokeObjectURL(url)
      }
    })
    customCoverUrlsRef.current = []
  }

  useEffect(() => () => revokeCustomCoverUrls(), [])

  const handleCoverUploadChange = (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file?.type?.startsWith('image/')) return

    revokeCustomCoverUrls()
    const uploadedCover = buildCustomCoverImageFromFile(file)
    customCoverUrlsRef.current = uploadedCover.url.startsWith('blob:') ? [uploadedCover.url] : []

    setSelectedImage(uploadedCover)
    setSelectedTheme(null)
    setShowImageCollections(false)
  }

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
        const canOpenRightCollections = left + popoverWidth + gap + collectionsWidth <= viewportWidth - margin
        const canOpenLeftCollections = left - gap - collectionsWidth >= margin
        const collectionsLeft = canOpenRightCollections
          ? left + popoverWidth + gap
          : canOpenLeftCollections
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
            coverImageId: selectedImage.isCustomUpload ? null : selectedImage.id,
            coverImageThumb: selectedImage.url,
            sourceFile: selectedImage.sourceFile ?? null,
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
                  className={`${styles.coverOption} ${resolveCoverThemeClass(styles, theme.id)}`}
                  onClick={() => {
                    revokeCustomCoverUrls()
                    setSelectedTheme(theme)
                    setSelectedImage(null)
                  }}
                  aria-label={theme.label}
                  aria-pressed={selectedTheme?.id === theme.id}
                  title={theme.label}
                >
                  <span className={styles.coverOptionShade} />
                  {selectedTheme?.id === theme.id ? <CoverSelectionCheck size="sm" /> : null}
                </button>
              ))}
              <button
                type="button"
                className={`${styles.coverOption} ${styles.coverUploadOption}`}
                onClick={() => coverUploadRef.current?.click()}
                aria-label="Enviar imagem própria"
                aria-pressed={selectedImage?.isCustomUpload ?? false}
                title="Enviar imagem própria"
              >
                <span className={styles.coverUploadIcon}><ImagePlusIcon /></span>
                {selectedImage?.isCustomUpload ? <CoverSelectionCheck size="sm" /> : null}
              </button>
              <button
                type="button"
                className={`${styles.coverOption} ${styles.coverMoreOption} ${showImageCollections ? styles.coverMoreOptionOpen : ''}`}
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
              onChange={handleCoverUploadChange}
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

          <CustomScrollArea
            enabled
            className={styles.collectionsBodyScrollArea}
            viewportClassName={styles.collectionsBody}
            refreshKey="new-plan-collections"
          >
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
                        className={styles.collectionItem}
                        onClick={() => {
                          revokeCustomCoverUrls()
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
                        {active ? <CoverSelectionCheck /> : null}
                      </button>
                    )
                  })}
                </div>
              </section>
            ))}
          </CustomScrollArea>
        </div>
      )}
    </>
  )
}
