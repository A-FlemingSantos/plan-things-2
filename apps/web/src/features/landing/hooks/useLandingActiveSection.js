import { useState, useEffect } from 'react'
import { LANDING_NAV_LINKS } from '../config/landingNav.js'
import { getLandingHeaderOffset, getLandingScrollViewport } from '../utils/landingScroll.js'

export function useLandingActiveSection() {
  const [active, setActive] = useState('')

  useEffect(() => {
    const sections = LANDING_NAV_LINKS
      .map(link => document.getElementById(link.href.slice(1)))
      .filter(Boolean)

    const updateActive = () => {
      const offset = getLandingHeaderOffset() + 12
      let current = ''

      for (const section of sections) {
        if (section.getBoundingClientRect().top <= offset) {
          current = `#${section.id}`
        }
      }

      setActive(current)
    }

    const viewport = getLandingScrollViewport()
    updateActive()
    viewport?.addEventListener('scroll', updateActive, { passive: true })
    window.addEventListener('resize', updateActive)

    return () => {
      viewport?.removeEventListener('scroll', updateActive)
      window.removeEventListener('resize', updateActive)
    }
  }, [])

  return active
}
