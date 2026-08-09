export const DOC_HEADING_ATTR = 'data-doc-heading'
export const DOC_BODY_ATTR = 'data-docs-body'
export const DOC_BODY_SELECTOR = `[${DOC_BODY_ATTR}]`

/**
 * Extract ATX headings (# … ###) from Markdown, skipping fenced code blocks.
 */
export function extractMarkdownHeadings(value = '') {
  const headings = []
  let inFence = false
  let fenceMarker = null

  String(value).split('\n').forEach((line, lineIndex) => {
    const fenceMatch = line.match(/^(`{3,}|~{3,})(.*)$/)
    if (fenceMatch) {
      const marker = fenceMatch[1][0]
      if (!inFence) {
        inFence = true
        fenceMarker = marker
        return
      }
      if (marker === fenceMarker && fenceMatch[2].trim() === '') {
        inFence = false
        fenceMarker = null
      }
      return
    }

    if (inFence) return

    const match = line.match(/^(#{1,3})\s+(.+?)\s*$/)
    if (!match) return

    headings.push({
      id: `doc-heading-${headings.length}`,
      label: match[2].replace(/\s+#+\s*$/, '').trim(),
      level: match[1].length,
      lineIndex,
      headingIndex: headings.length,
    })
  })

  return headings
}

/**
 * Nest flat ATX headings into a tree by level (H1 > H2 > H3).
 * Skipped levels still attach under the nearest shallower ancestor.
 */
export function buildHeadingTree(headings = []) {
  const roots = []
  const stack = []

  headings.forEach((heading) => {
    const node = { ...heading, children: [] }
    while (stack.length > 0 && stack[stack.length - 1].level >= node.level) {
      stack.pop()
    }
    if (stack.length === 0) {
      roots.push(node)
    } else {
      stack[stack.length - 1].children.push(node)
    }
    stack.push(node)
  })

  return roots
}

/** Ancestor heading ids from root down to (but not including) the target. */
export function findHeadingAncestorIds(tree, headingIndex) {
  const path = []

  const walk = (nodes, trail) => {
    for (const node of nodes) {
      if (node.headingIndex === headingIndex) {
        path.push(...trail)
        return true
      }
      if (node.children.length > 0 && walk(node.children, [...trail, node.id])) {
        return true
      }
    }
    return false
  }

  walk(tree, [])
  return path
}

/** Prefer the marked document body so the page title h1 is never counted. */
export function resolveDocsBodyRoot(root) {
  if (!root) return null
  if (root.matches?.(DOC_BODY_SELECTOR)) return root
  return root.querySelector?.(DOC_BODY_SELECTOR) ?? root
}

export function listDocHeadingElements(root) {
  const body = resolveDocsBodyRoot(root)
  if (!body) return []
  return Array.from(body.querySelectorAll('h1, h2, h3'))
}

export function findDocHeadingElement(root, headingIndex) {
  if (!root || headingIndex == null || headingIndex < 0) return null
  const body = resolveDocsBodyRoot(root)
  if (!body) return null
  const byAttr = body.querySelector(`[${DOC_HEADING_ATTR}="${headingIndex}"]`)
  if (byAttr) return byAttr
  return listDocHeadingElements(body)[headingIndex] ?? null
}

export function tagDocHeadingElements(root) {
  const headings = listDocHeadingElements(root)
  headings.forEach((element, index) => {
    element.setAttribute(DOC_HEADING_ATTR, String(index))
    element.id = `doc-heading-${index}`
  })
  return headings
}

export function getHeadingOffsetTop(viewport, target) {
  if (!viewport || !target) return 0
  const viewportRect = viewport.getBoundingClientRect()
  const targetRect = target.getBoundingClientRect()
  return targetRect.top - viewportRect.top + viewport.scrollTop
}

export function scrollViewportToHeading(viewport, target, { offsetPx = 24, behavior = 'smooth' } = {}) {
  if (!viewport || !target || !viewport.contains(target)) return false
  const top = Math.max(0, getHeadingOffsetTop(viewport, target) - offsetPx)
  viewport.scrollTo({ top, behavior })
  return true
}

/**
 * Pick the active outline heading from scroll position: the last heading whose
 * top edge is at or above a marker near the top of the viewport.
 */
function resolveDocHeadingIndex(target, fallbackIndex) {
  const raw = target.getAttribute(DOC_HEADING_ATTR)
  if (raw == null || raw === '') return fallbackIndex
  const indexed = Number(raw)
  return Number.isNaN(indexed) ? fallbackIndex : indexed
}

export function resolveActiveDocHeadingIndex(
  viewport,
  targets,
  { markerRatio = 0.18, markerMinPx = 48 } = {},
) {
  if (!viewport || !targets?.length) return null

  const markerY = viewport.getBoundingClientRect().top
    + Math.max(markerMinPx, viewport.clientHeight * markerRatio)

  let activeIndex = null
  for (let index = 0; index < targets.length; index += 1) {
    const target = targets[index]
    if (target.getBoundingClientRect().top <= markerY + 1) {
      activeIndex = resolveDocHeadingIndex(target, index)
      continue
    }
    break
  }

  if (activeIndex != null) return activeIndex
  return resolveDocHeadingIndex(targets[0], 0)
}

/**
 * When nested outline rows are collapsed, highlight the deepest still-visible
 * ancestor of the scroll-active heading instead of a hidden child.
 */
export function resolveVisibleOutlineHeadingIndex(
  tree,
  activeHeadingIndex,
  { isExpanded = () => false } = {},
) {
  if (activeHeadingIndex == null || !tree?.length) return activeHeadingIndex

  const path = []
  const findPath = (nodes, trail) => {
    for (const node of nodes) {
      const nextTrail = [...trail, node]
      if (node.headingIndex === activeHeadingIndex) {
        path.push(...nextTrail)
        return true
      }
      if (node.children.length > 0 && findPath(node.children, nextTrail)) {
        return true
      }
    }
    return false
  }

  if (!findPath(tree, [])) return activeHeadingIndex

  let visible = path[0]
  for (let index = 1; index < path.length; index += 1) {
    if (!isExpanded(path[index - 1].id)) break
    visible = path[index]
  }
  return visible.headingIndex
}
