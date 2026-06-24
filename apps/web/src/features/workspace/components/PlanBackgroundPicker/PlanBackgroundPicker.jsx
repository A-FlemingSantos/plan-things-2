import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { ImagePlusIcon, XIcon } from '../WorkspaceIcons/WorkspaceIcons.jsx'
import { BACKGROUND_COLLECTIONS, COVER_THEMES } from '../workspaceCover/workspaceCoverConstants.js'
import {
  buildCustomCoverImageFromFile,
  isUploadedPlanCoverImageId,
  resolveCoverThemeClass,
} from '../workspaceCover/workspaceCoverUtils.js'
import styles from '../../pages/Workspace/Workspace.module.css'

export const PLAN_BACKGROUND_PICKER_WIDTH = 420
export const PLAN_BACKGROUND_PICKER_HEIGHT = 520

export function resolvePlanBackgroundPickerPosition(anchorRect) {
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

export default function PlanBackgroundPicker({ plan, anchorRect, busy, onClose, onSelectTheme, onSelectImage }) {
  const pickerRef = useRef(null)
  const coverUploadRef = useRef(null)
  const position = resolvePlanBackgroundPickerPosition(anchorRect)
  const portalRoot = document.querySelector('[data-app-theme-scope]') ?? document.body

  const handleCoverUploadChange = (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file?.type?.startsWith('image/') || busy) return
    onSelectImage?.(buildCustomCoverImageFromFile(file))
  }

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
            <button
              type="button"
              className={`${styles.coverOption} ${styles.coverUploadOption} ${isUploadedPlanCoverImageId(plan.coverImageId) ? styles.coverOptionActive : ''}`}
              onClick={() => coverUploadRef.current?.click()}
              aria-label="Enviar imagem própria"
              title="Enviar imagem própria"
              disabled={busy}
            >
              <span className={styles.coverUploadIcon}><ImagePlusIcon /></span>
            </button>
            <input
              ref={coverUploadRef}
              type="file"
              accept="image/*"
              className={styles.coverUploadInput}
              onChange={handleCoverUploadChange}
            />
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
