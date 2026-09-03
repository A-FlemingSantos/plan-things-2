export const BOARD_FILTER_FLIP_MS = 380
export const BOARD_FILTER_EASE = 'cubic-bezier(0.25, 0.1, 0.25, 1)'
export const BOARD_FILTER_CARD_GAP_PX = 10
export const BOARD_FILTER_STACK_PADDING_BOTTOM_PX = 8

const FLIP_STYLE_KEYS = ['position', 'top', 'left', 'width', 'margin', 'zIndex', 'pointerEvents', 'transition', 'opacity', 'visibility']
const STACK_STYLE_KEYS = ['height', 'flex', 'overflow']

export function prefersReducedMotion() {
  return Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches)
}

export function measureCardRects(nodesById) {
  const rects = new Map()
  for (const [id, node] of nodesById) {
    if (!node || node.isConnected === false) continue
    const rect = node.getBoundingClientRect()
    rects.set(id, {
      top: rect.top,
      left: rect.left,
      width: rect.width,
      height: rect.height,
    })
  }
  return rects
}

export function measureInFlowStackHeight(rects, motionsById) {
  const heights = []
  for (const [id, motion] of Object.entries(motionsById)) {
    if (motion === 'exiting') continue
    const rect = rects.get(id)
    if (!rect) continue
    heights.push(rect.height)
  }

  if (heights.length === 0) return 0

  return heights.reduce((sum, height) => sum + height, 0)
    + (BOARD_FILTER_CARD_GAP_PX * (heights.length - 1))
    + BOARD_FILTER_STACK_PADDING_BOTTOM_PX
}

export function clearStackStyles(stackNode) {
  if (!stackNode?.style) return
  for (const key of STACK_STYLE_KEYS) {
    stackNode.style[key] = ''
  }
}

function cancelNodeAnimations(node) {
  if (!node?.getAnimations) return
  for (const animation of node.getAnimations()) {
    animation.cancel()
  }
}

export function clearFlipStyles(node) {
  if (!node?.style) return
  for (const key of FLIP_STYLE_KEYS) {
    node.style[key] = ''
  }
}

function lockStackHeight(stackNode, height) {
  if (!stackNode?.style || !Number.isFinite(height)) return
  stackNode.style.flex = '0 0 auto'
  stackNode.style.overflow = 'hidden'
  stackNode.style.height = `${Math.max(height, 0)}px`
}

function pinExitingNode(node, first, viewport) {
  const viewportRect = viewport.getBoundingClientRect()
  node.style.position = 'absolute'
  node.style.top = `${first.top - viewportRect.top + viewport.scrollTop}px`
  node.style.left = `${first.left - viewportRect.left + viewport.scrollLeft}px`
  node.style.width = `${first.width}px`
  node.style.margin = '0'
  node.style.zIndex = '0'
  node.style.pointerEvents = 'none'
  node.style.transition = 'none'
}

function hideExitingNode(node) {
  if (!node?.style) return
  node.style.opacity = '0'
  node.style.visibility = 'hidden'
  node.style.pointerEvents = 'none'
  node.style.transition = 'none'
}

function animateOrFallback(node, keyframes, duration) {
  if (typeof node.animate !== 'function' || duration <= 0) {
    return {
      finished: Promise.resolve(),
      cancel() {},
      commitStyles() {},
    }
  }

  return node.animate(keyframes, {
    duration,
    easing: BOARD_FILTER_EASE,
    fill: 'forwards',
  })
}

function commitAndCancel(animation) {
  try {
    animation.commitStyles?.()
  } catch {
    // InvalidStateError if the animation already dropped
  }
  animation.cancel()
}

export function playKanbanFilterFlip({
  viewport,
  stack,
  nodesById,
  firstRects,
  firstHeight,
  motionsById,
  onComplete,
}) {
  const completeMotion = (id) => onComplete?.(id)
  const motionEntries = Object.entries(motionsById)
  const pendingIds = motionEntries
    .filter(([, motion]) => motion === 'entering' || motion === 'exiting')
    .map(([id]) => id)
  const stackNode = stack || viewport

  if (!viewport || firstRects.size === 0) {
    pendingIds.forEach(completeMotion)
    return () => {}
  }

  const startHeight = Number.isFinite(firstHeight) ? firstHeight : stackNode.offsetHeight
  lockStackHeight(stackNode, startHeight)

  for (const [id, motion] of motionEntries) {
    if (motion !== 'exiting') continue
    const node = nodesById.get(id)
    const first = firstRects.get(id)
    if (!node || !first) {
      completeMotion(id)
      continue
    }
    cancelNodeAnimations(node)
    pinExitingNode(node, first, viewport)
  }

  const lastRects = measureCardRects(nodesById)
  const lastHeight = measureInFlowStackHeight(lastRects, motionsById)
  const animations = []
  const shouldResizeStack = Math.abs(startHeight - lastHeight) >= 0.5

  if (shouldResizeStack) {
    animations.push({
      id: null,
      motion: 'stack',
      animation: animateOrFallback(
        stackNode,
        [
          { height: `${Math.max(startHeight, 0)}px` },
          { height: `${Math.max(lastHeight, 0)}px` },
        ],
        BOARD_FILTER_FLIP_MS,
      ),
    })
  }

  for (const [id, motion] of motionEntries) {
    const node = nodesById.get(id)
    if (!node) {
      if (motion === 'entering' || motion === 'exiting') completeMotion(id)
      continue
    }

    cancelNodeAnimations(node)
    node.style.transition = 'none'

    if (motion === 'exiting') {
      const fromOpacity = node.style.visibility === 'hidden' || node.style.opacity === '0'
        ? 0
        : 1
      animations.push({
        id,
        motion,
        animation: animateOrFallback(
          node,
          [
            { opacity: fromOpacity },
            { opacity: 0 },
          ],
          BOARD_FILTER_FLIP_MS,
        ),
      })
      continue
    }

    if (motion === 'entering') {
      animations.push({
        id,
        motion,
        animation: animateOrFallback(
          node,
          [
            { opacity: 0, transform: 'translate3d(0, 6px, 0)' },
            { opacity: 1, transform: 'translate3d(0, 0, 0)' },
          ],
          BOARD_FILTER_FLIP_MS,
        ),
      })
      continue
    }

    const first = firstRects.get(id)
    const last = lastRects.get(id)
    if (!first || !last) continue

    const dx = first.left - last.left
    const dy = first.top - last.top
    if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5) continue

    node.style.zIndex = '1'
    animations.push({
      id,
      motion,
      animation: animateOrFallback(
        node,
        [
          { transform: `translate3d(${dx}px, ${dy}px, 0)` },
          { transform: 'translate3d(0, 0, 0)' },
        ],
        BOARD_FILTER_FLIP_MS,
      ),
    })
  }

  let cancelled = false
  let settled = false

  const abort = () => {
    for (const { id, motion, animation } of animations) {
      animation.cancel()
      if (motion === 'exiting') {
        hideExitingNode(nodesById.get(id))
        continue
      }
      if (id) clearFlipStyles(nodesById.get(id))
    }
    lockStackHeight(stackNode, lastHeight)
  }

  const finish = () => {
    if (cancelled || settled) return
    settled = true

    for (const { id, motion, animation } of animations) {
      commitAndCancel(animation)
      if (motion === 'stack') continue
      if (motion === 'exiting') {
        hideExitingNode(nodesById.get(id))
        continue
      }
      if (id) clearFlipStyles(nodesById.get(id))
    }
    lockStackHeight(stackNode, lastHeight)

    for (const { id, motion } of animations) {
      if (motion === 'entering' || motion === 'exiting') completeMotion(id)
    }
    for (const id of pendingIds) {
      const tracked = animations.some((item) => item.id === id)
      if (!tracked) completeMotion(id)
    }
  }

  if (animations.length === 0) {
    lockStackHeight(stackNode, lastHeight)
    pendingIds.forEach(completeMotion)
    return () => {}
  }

  Promise.all(animations.map(({ animation }) => Promise.resolve(animation.finished).catch(() => {}))).then(finish)

  return () => {
    cancelled = true
    if (settled) return
    abort()
  }
}
