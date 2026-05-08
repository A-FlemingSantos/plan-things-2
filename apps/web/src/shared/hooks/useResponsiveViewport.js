import { useEffect, useState } from 'react'

const BREAKPOINTS = {
  compactMobile: '(max-width: 560px)',
  mobile: '(max-width: 768px)',
  tablet: '(min-width: 769px) and (max-width: 1024px)',
}

function getViewportState() {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return {
      breakpoint: 'desktop',
      isCompactMobile: false,
      isMobile: false,
      isTablet: false,
      isDesktop: true,
    }
  }

  const isCompactMobile = window.matchMedia(BREAKPOINTS.compactMobile).matches
  const isMobile = window.matchMedia(BREAKPOINTS.mobile).matches
  const isTablet = window.matchMedia(BREAKPOINTS.tablet).matches
  const breakpoint = isCompactMobile ? 'compact-mobile' : isMobile ? 'mobile' : isTablet ? 'tablet' : 'desktop'

  return {
    breakpoint,
    isCompactMobile,
    isMobile,
    isTablet,
    isDesktop: !isMobile && !isTablet,
  }
}

export function useResponsiveViewport() {
  const [viewport, setViewport] = useState(() => getViewportState())

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return undefined

    const mediaQueries = [
      window.matchMedia(BREAKPOINTS.compactMobile),
      window.matchMedia(BREAKPOINTS.mobile),
      window.matchMedia(BREAKPOINTS.tablet),
    ]

    const updateViewport = () => {
      setViewport(getViewportState())
    }

    mediaQueries.forEach((mediaQuery) => {
      if (typeof mediaQuery.addEventListener === 'function') {
        mediaQuery.addEventListener('change', updateViewport)
      } else if (typeof mediaQuery.addListener === 'function') {
        mediaQuery.addListener(updateViewport)
      }
    })

    window.addEventListener('resize', updateViewport)

    return () => {
      mediaQueries.forEach((mediaQuery) => {
        if (typeof mediaQuery.removeEventListener === 'function') {
          mediaQuery.removeEventListener('change', updateViewport)
        } else if (typeof mediaQuery.removeListener === 'function') {
          mediaQuery.removeListener(updateViewport)
        }
      })

      window.removeEventListener('resize', updateViewport)
    }
  }, [])

  return viewport
}

