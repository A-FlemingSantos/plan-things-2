function evaluateQuery(query, width) {
  const normalized = query.replace(/\s+/g, ' ').trim()

  if (normalized === '(max-width: 560px)') {
    return width <= 560
  }

  if (normalized === '(max-width: 768px)') {
    return width <= 768
  }

  if (normalized === '(min-width: 769px) and (max-width: 1024px)') {
    return width >= 769 && width <= 1024
  }

  return false
}

export function installMatchMediaController(initialWidth = 1280) {
  let width = initialWidth
  const mediaQueries = new Map()

  function ensureMediaQuery(query) {
    if (mediaQueries.has(query)) {
      return mediaQueries.get(query)
    }

    const listeners = new Set()
    const mediaQuery = {
      media: query,
      matches: evaluateQuery(query, width),
      onchange: null,
      addEventListener: (type, listener) => {
        if (type === 'change') listeners.add(listener)
      },
      removeEventListener: (type, listener) => {
        if (type === 'change') listeners.delete(listener)
      },
      addListener: (listener) => listeners.add(listener),
      removeListener: (listener) => listeners.delete(listener),
      dispatchEvent: () => true,
      _listeners: listeners,
    }

    mediaQueries.set(query, mediaQuery)
    return mediaQuery
  }

  Object.defineProperty(window, 'innerWidth', {
    configurable: true,
    writable: true,
    value: width,
  })

  window.matchMedia = (query) => ensureMediaQuery(query)

  return {
    setWidth(nextWidth) {
      width = nextWidth
      window.innerWidth = nextWidth

      for (const mediaQuery of mediaQueries.values()) {
        const nextMatches = evaluateQuery(mediaQuery.media, nextWidth)
        if (mediaQuery.matches === nextMatches) continue

        mediaQuery.matches = nextMatches
        const event = { matches: nextMatches, media: mediaQuery.media }
        mediaQuery.onchange?.(event)
        mediaQuery._listeners.forEach((listener) => listener(event))
      }

      window.dispatchEvent(new Event('resize'))
    },
  }
}

