const HEADER_OFFSET_FALLBACK = 52

export function getLandingScrollViewport() {
  return document.querySelector('[data-landing-page] [data-custom-scroll-viewport]')
}

export function getLandingHeaderOffset() {
  const value = getComputedStyle(document.documentElement).getPropertyValue('--landing-header-height').trim()
  const parsed = Number.parseInt(value, 10)
  return Number.isFinite(parsed) ? parsed : HEADER_OFFSET_FALLBACK
}

export function getLandingScrollTop() {
  return getLandingScrollViewport()?.scrollTop ?? window.scrollY
}

export function scrollLandingToSection(id, { behavior = 'smooth' } = {}) {
  const viewport = getLandingScrollViewport()
  const target = document.getElementById(id)
  if (!viewport || !target) return

  const nextTop = target.getBoundingClientRect().top
    - viewport.getBoundingClientRect().top
    + viewport.scrollTop
    - getLandingHeaderOffset()

  viewport.scrollTo({ top: Math.max(0, nextTop), behavior })
}

export function handleLandingHashClick(event) {
  const anchor = event.currentTarget?.getAttribute?.('href')?.startsWith('#')
    ? event.currentTarget
    : event.target?.closest?.('a[href^="#"]')
  const href = anchor?.getAttribute?.('href')
  if (!href?.startsWith('#')) return

  event.preventDefault()
  const id = href.slice(1)
  if (!id) return

  scrollLandingToSection(id)
  if (window.location.hash !== href) {
    window.history.pushState(null, '', href)
  }
}
