import { useLayoutEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import AuthenticatedAvatar from '../../../../shared/components/AuthenticatedAvatar/AuthenticatedAvatar.jsx'
import styles from './MemberAvatarStack.module.css'

const HOVER_LIFT = 4
const TOOLTIP_GAP = 8
const VIEWPORT_PADDING = 8
const ESTIMATED_TOOLTIP_HEIGHT = 28

function resolveTooltipPlacement(rect, tooltipHeight = ESTIMATED_TOOLTIP_HEIGHT) {
  const spaceAbove = rect.top - VIEWPORT_PADDING
  const spaceBelow = window.innerHeight - rect.bottom - VIEWPORT_PADDING
  const needed = tooltipHeight + TOOLTIP_GAP

  if (spaceAbove >= needed) return 'top'
  if (spaceBelow >= needed) return 'bottom'
  return spaceBelow >= spaceAbove ? 'bottom' : 'top'
}

function resolveTooltipPosition(rect, placement) {
  return {
    top: placement === 'top' ? rect.top - TOOLTIP_GAP : rect.bottom + TOOLTIP_GAP,
    left: rect.left + rect.width / 2,
    placement,
  }
}

function resolveMemberLabel(member) {
  return member?.label ?? member?.name ?? member?.email ?? member?.initials ?? ''
}

function normalizeAvatars({ avatars, members }) {
  if (Array.isArray(avatars) && avatars.length) {
    return avatars.map((avatar, index) => ({
      key: avatar.id ?? avatar.src ?? index,
      src: avatar.src,
      alt: avatar.alt ?? avatar.label ?? `Avatar ${index + 1}`,
      label: avatar.label ?? avatar.alt ?? '',
      member: null,
    }))
  }

  if (!Array.isArray(members)) return []

  return members.map((member, index) => ({
    key: member.id ?? index,
    src: member.avatarUrl ?? null,
    alt: resolveMemberLabel(member) || `Avatar ${index + 1}`,
    label: resolveMemberLabel(member),
    member,
  }))
}

function resolveTheme(rootEl) {
  const scope = rootEl?.closest('[data-theme]')
  return scope?.dataset?.theme ?? document.documentElement.dataset.appColorScheme ?? 'light'
}

function useTooltipPosition(anchorEl, active, tooltipEl) {
  const [position, setPosition] = useState({ top: 0, left: 0, placement: 'top' })

  useLayoutEffect(() => {
    if (!active || !anchorEl) return undefined

    let rafId = 0

    const updatePosition = () => {
      const rect = anchorEl.getBoundingClientRect()
      const tooltipHeight = tooltipEl?.offsetHeight ?? ESTIMATED_TOOLTIP_HEIGHT
      const placement = resolveTooltipPlacement(rect, tooltipHeight)
      setPosition(resolveTooltipPosition(rect, placement))
    }

    updatePosition()
    const trackPosition = () => {
      updatePosition()
      rafId = requestAnimationFrame(trackPosition)
    }
    rafId = requestAnimationFrame(trackPosition)

    window.addEventListener('scroll', updatePosition, true)
    window.addEventListener('resize', updatePosition)

    return () => {
      cancelAnimationFrame(rafId)
      window.removeEventListener('scroll', updatePosition, true)
      window.removeEventListener('resize', updatePosition)
    }
  }, [active, anchorEl, tooltipEl])

  return position
}

function AvatarTooltipPortal({ rootRef, anchorEl, label, visible }) {
  const [tooltipEl, setTooltipEl] = useState(null)
  const active = Boolean(visible && label && anchorEl)
  const position = useTooltipPosition(anchorEl, active, tooltipEl)
  const theme = resolveTheme(rootRef.current)
  const placement = position.placement ?? 'top'

  if (typeof document === 'undefined') return null

  return createPortal(
    <div data-theme={theme} className={styles.tooltipLayer}>
      <AnimatePresence>
        {active ? (
          <motion.div
            key="tooltip"
            className={styles.tooltipHost}
            initial={{
              x: '-50%',
              y: placement === 'top' ? '-90%' : 8,
              opacity: 0,
              scale: 0.7,
            }}
            animate={{
              x: '-50%',
              y: placement === 'top' ? '-100%' : 0,
              opacity: 1,
              scale: 1,
            }}
            exit={{
              x: '-50%',
              y: placement === 'top' ? '-90%' : 8,
              opacity: 0,
              scale: 0.7,
            }}
            transition={{
              type: 'spring',
              stiffness: 400,
              damping: 24,
            }}
            style={{
              top: position.top,
              left: position.left,
            }}
          >
            <span ref={setTooltipEl} className={styles.tooltip}>
              {label}
            </span>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>,
    document.body,
  )
}

export default function MemberAvatarStack({
  avatars,
  members = [],
  maxVisible = 5,
  size = 40,
  overlap = 14,
}) {
  const [hoveredIdx, setHoveredIdx] = useState(null)
  const rootRef = useRef(null)
  const avatarRefs = useRef([])
  const avatarItems = useMemo(() => normalizeAvatars({ avatars, members }), [avatars, members])
  const visibleAvatars = avatarItems.slice(0, maxVisible)
  const extraCount = avatarItems.length - maxVisible
  const hoveredAvatar = hoveredIdx === null ? null : visibleAvatars[hoveredIdx] ?? null
  const hoveredAnchorEl = hoveredIdx === null ? null : avatarRefs.current[hoveredIdx] ?? null

  if (!avatarItems.length) return null

  return (
    <div
      ref={rootRef}
      className={styles.root}
      style={{ '--avatar-hover-lift': `${HOVER_LIFT}px` }}
    >
      <div
        className={styles.stack}
        style={{ '--avatar-overlap': `${overlap}px` }}
      >
        {visibleAvatars.map((avatar, idx) => {
          const isHovered = hoveredIdx === idx

          return (
            <div
              key={avatar.key}
              ref={(element) => {
                avatarRefs.current[idx] = element
              }}
              className={`${styles.avatarItem} ${isHovered ? styles.avatarItemHovered : ''}`}
              style={{
                width: size,
                height: size,
                zIndex: isHovered ? 100 : visibleAvatars.length - idx,
                marginLeft: -overlap,
              }}
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
            >
              {avatar.member ? (
                <AuthenticatedAvatar
                  avatarUrl={avatar.member.avatarUrl}
                  fallback={avatar.member.initials}
                  className={styles.avatarInner}
                  imageClassName={styles.avatarImage}
                  style={{
                    background: avatar.member.color,
                    fontSize: size * 0.32,
                  }}
                  alt={avatar.alt}
                />
              ) : (
                <img
                  src={avatar.src}
                  alt={avatar.alt}
                  width={size}
                  height={size}
                  className={styles.avatarImage}
                  draggable={false}
                />
              )}
            </div>
          )
        })}

        {extraCount > 0 ? (
          <div
            className={styles.extraCount}
            style={{
              width: size,
              height: size,
              marginLeft: -overlap,
              zIndex: 0,
              fontSize: size * 0.32,
            }}
          >
            +{extraCount}
          </div>
        ) : null}
      </div>

      <AvatarTooltipPortal
        rootRef={rootRef}
        anchorEl={hoveredAnchorEl}
        label={hoveredAvatar?.label ?? ''}
        visible={Boolean(hoveredAvatar?.label && hoveredAnchorEl)}
      />
    </div>
  )
}
