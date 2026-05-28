import { useCallback, useLayoutEffect, useRef, useState } from 'react'
import {
  measureAttachmentInlineSize,
  resolveCompactAttachmentLayout,
} from './composerAttachmentUtils.js'
import styles from './ComposerAttachmentStrip.module.css'

function FileDocIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M9.5 2H4a1.5 1.5 0 0 0-1.5 1.5v9A1.5 1.5 0 0 0 4 14h8a1.5 1.5 0 0 0 1.5-1.5V6L9.5 2z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
      <path d="M9.5 2v4H13.5" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
      <path d="M5.5 9.5h5M5.5 11.5h3" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
    </svg>
  )
}

function FileImageIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <rect x="2" y="3" width="12" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
      <circle cx="5.5" cy="6.5" r="1" stroke="currentColor" strokeWidth="1.1" />
      <path d="M2 11l3.5-3.5 2.5 2.5 2-2 3 3" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function RemoveIcon() {
  return (
    <svg width="8" height="8" viewBox="0 0 10 10" fill="none" aria-hidden="true">
      <path d="M1.5 1.5l7 7M8.5 1.5l-7 7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}

function MockImagePlaceholder({ label }) {
  const initials = label
    .replace(/\.[^.]+$/, '')
    .slice(0, 2)
    .toUpperCase()

  return (
    <div className={styles.mockImagePlaceholder} aria-hidden="true">
      <span className={styles.mockImageInitials}>{initials}</span>
      <FileImageIcon />
    </div>
  )
}

export default function ComposerAttachmentStrip({ attachments = [], onRemove, className }) {
  const stripRef = useRef(null)
  const isMountedRef = useRef(true)
  const isCompactRef = useRef(false)
  const observedInlineSizeRef = useRef(0)
  const [isCompact, setIsCompact] = useState(false)

  isCompactRef.current = isCompact

  const syncLayoutMode = useCallback(() => {
    if (!isMountedRef.current) return

    const strip = stripRef.current
    if (!strip) {
      observedInlineSizeRef.current = 0
      setIsCompact(false)
      return
    }

    observedInlineSizeRef.current = measureAttachmentInlineSize(strip)
    const nextCompact = resolveCompactAttachmentLayout(
      strip,
      attachments,
      isCompactRef.current,
    )
    setIsCompact((current) => (current === nextCompact ? current : nextCompact))
  }, [attachments])

  useLayoutEffect(() => {
    isMountedRef.current = true

    if (attachments.length === 0) {
      observedInlineSizeRef.current = 0
      setIsCompact(false)
      return () => {
        isMountedRef.current = false
      }
    }

    syncLayoutMode()

    const strip = stripRef.current
    if (!strip) {
      return () => {
        isMountedRef.current = false
      }
    }

    const observer = new ResizeObserver(() => {
      const nextInlineSize = measureAttachmentInlineSize(strip)
      if (nextInlineSize === observedInlineSizeRef.current) return
      syncLayoutMode()
    })
    observer.observe(strip)

    return () => {
      isMountedRef.current = false
      observer.disconnect()
    }
  }, [attachments, syncLayoutMode])

  if (attachments.length === 0) return null

  return (
    <div
      ref={stripRef}
      className={[
        styles.strip,
        isCompact && styles.stripCompact,
        className,
      ].filter(Boolean).join(' ')}
      data-compact={isCompact ? 'true' : 'false'}
      role="group"
      aria-label="Anexos adicionados"
    >
      {attachments.map((attachment) => {
        if (attachment.isImage) {
          return (
            <div key={attachment.id} className={styles.imageAttachment}>
              {attachment.previewUrl ? (
                <img
                  src={attachment.previewUrl}
                  alt={attachment.label}
                  className={styles.imagePreview}
                  onLoad={syncLayoutMode}
                />
              ) : (
                <MockImagePlaceholder label={attachment.label} />
              )}
              <button
                type="button"
                className={styles.imageRemove}
                aria-label={`Remover ${attachment.label}`}
                onClick={() => onRemove?.(attachment)}
              >
                <RemoveIcon />
              </button>
            </div>
          )
        }

        return (
          <div key={attachment.id} className={styles.fileAttachment}>
            <span className={styles.fileIcon} aria-hidden="true">
              <FileDocIcon />
            </span>
            <span className={styles.fileLabel} title={attachment.label}>
              {attachment.label}
            </span>
            <button
              type="button"
              className={styles.fileRemove}
              aria-label={`Remover ${attachment.label}`}
              onClick={() => onRemove?.(attachment)}
            >
              <RemoveIcon />
            </button>
          </div>
        )
      })}
    </div>
  )
}
