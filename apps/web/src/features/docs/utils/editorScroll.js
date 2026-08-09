import { Extension } from '@tiptap/core'
import { Plugin } from '@tiptap/pm/state'

const DEFAULT_MARGIN_PX = 16

/**
 * Keep the caret visible inside Plan Things' CustomScrollArea viewport only.
 * ProseMirror's default scrollRectIntoView also walks window/body ancestors and
 * pairs with storeScrollPos — at the bottom of a long doc that overshoots and
 * leaves the caret below the visible area after deletes.
 *
 * @returns {boolean} true when handled (suppresses ProseMirror's default)
 */
export function scrollSelectionIntoCustomViewport(view, { marginPx = DEFAULT_MARGIN_PX } = {}) {
  if (!view?.dom) return false

  const scrollRoot = view.dom.closest('[data-custom-scroll-viewport]')
  if (!scrollRoot) return false

  const { head } = view.state.selection
  let coords
  try {
    coords = view.coordsAtPos(head)
  } catch {
    return true
  }
  if (!coords) return true

  const delta = computeViewportScrollDelta(coords, scrollRoot.getBoundingClientRect(), marginPx)
  if (delta) scrollRoot.scrollTop += delta

  return true
}

/**
 * How far to nudge scrollTop so `coords` stay inside `rootRect` with a margin.
 * Pure helper for tests.
 */
export function computeViewportScrollDelta(coords, rootRect, marginPx = DEFAULT_MARGIN_PX) {
  if (coords.top < rootRect.top + marginPx) {
    return -(rootRect.top + marginPx - coords.top)
  }
  if (coords.bottom > rootRect.bottom - marginPx) {
    return coords.bottom - (rootRect.bottom - marginPx)
  }
  return 0
}

/**
 * Snapshot the caret's offset within the custom scroll viewport so we can
 * restore it after a doc change (deletes near the bottom otherwise jump up).
 */
export function captureCaretScrollLock(view) {
  if (!view?.dom) return null
  const scrollRoot = view.dom.closest('[data-custom-scroll-viewport]')
  if (!scrollRoot) return null

  let coords
  try {
    coords = view.coordsAtPos(view.state.selection.head)
  } catch {
    return null
  }
  if (!coords) return null

  const rootRect = scrollRoot.getBoundingClientRect()
  return {
    scrollRoot,
    caretOffsetInViewport: coords.top - rootRect.top,
    distanceFromBottom: scrollRoot.scrollHeight - scrollRoot.clientHeight - scrollRoot.scrollTop,
  }
}

/**
 * Re-apply a caret scroll lock after the DOM settles.
 * Prefer pinning to the bottom when the user was already near it.
 */
export function restoreCaretScrollLock(view, lock, { nearBottomPx = 96 } = {}) {
  if (!lock?.scrollRoot || !view || view.isDestroyed) return

  const { scrollRoot, caretOffsetInViewport, distanceFromBottom } = lock
  const maxScrollTop = Math.max(0, scrollRoot.scrollHeight - scrollRoot.clientHeight)

  if (distanceFromBottom <= nearBottomPx) {
    scrollRoot.scrollTop = Math.max(0, maxScrollTop - Math.max(0, distanceFromBottom))
    return
  }

  let coords
  try {
    coords = view.coordsAtPos(view.state.selection.head)
  } catch {
    return
  }
  if (!coords) return

  const rootRect = scrollRoot.getBoundingClientRect()
  const delta = (coords.top - rootRect.top) - caretOffsetInViewport
  if (Math.abs(delta) < 1) return
  scrollRoot.scrollTop = Math.max(0, Math.min(maxScrollTop, scrollRoot.scrollTop + delta))
}

/**
 * TipTap extension: after doc changes, keep the caret visually stable inside
 * the Docs CustomScrollArea (especially when deleting at the bottom).
 */
export const DocsCaretScrollLock = Extension.create({
  name: 'docsCaretScrollLock',
  addProseMirrorPlugins() {
    return [
      new Plugin({
        view(editorView) {
          let lock = null
          let raf = null
          let raf2 = null

          const arm = () => {
            lock = captureCaretScrollLock(editorView)
          }

          const release = () => {
            if (!lock) return
            const current = lock
            lock = null
            const apply = () => restoreCaretScrollLock(editorView, current)
            apply()
            if (raf != null) cancelAnimationFrame(raf)
            if (raf2 != null) cancelAnimationFrame(raf2)
            raf = requestAnimationFrame(() => {
              apply()
              raf2 = requestAnimationFrame(apply)
            })
          }

          const onKeyDown = (event) => {
            if (
              event.key === 'Backspace'
              || event.key === 'Delete'
              || event.key === 'Enter'
            ) {
              arm()
            }
          }

          const dom = editorView.dom
          dom.addEventListener('keydown', onKeyDown, true)
          dom.addEventListener('beforeinput', arm, true)

          return {
            update(view, prevState) {
              if (view.state.doc.eq(prevState.doc)) return
              if (lock) {
                release()
                return
              }
              // Fallback when the change did not come from a keyed input
              // (paste, toolbar). Prefer pinning scrollTop over scroll-into-view
              // so the article does not jump to the top when the caret briefly
              // reports start-of-doc coordinates mid-reconciliation.
              const scrollRoot = view.dom.closest('[data-custom-scroll-viewport]')
              const previousScrollTop = scrollRoot?.scrollTop ?? null
              requestAnimationFrame(() => {
                if (!view || view.isDestroyed) return
                if (scrollRoot && previousScrollTop != null) {
                  const maxScrollTop = Math.max(0, scrollRoot.scrollHeight - scrollRoot.clientHeight)
                  scrollRoot.scrollTop = Math.min(previousScrollTop, maxScrollTop)
                }
                scrollSelectionIntoCustomViewport(view)
              })
            },
            destroy() {
              dom.removeEventListener('keydown', onKeyDown, true)
              dom.removeEventListener('beforeinput', arm, true)
              if (raf != null) cancelAnimationFrame(raf)
              if (raf2 != null) cancelAnimationFrame(raf2)
            },
          }
        },
      }),
    ]
  },
})
