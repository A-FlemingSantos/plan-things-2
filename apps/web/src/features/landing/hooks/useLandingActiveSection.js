import { useState, useEffect } from 'react'
import { LANDING_NAV_LINKS } from '../config/landingNav.js'

const HEADER_OFFSET_FALLBACK = 52

function getHeaderOffset() {
  const value = getComputedStyle(document.documentElement).getPropertyValue('--landing-header-height').trim()
  const parsed = Number.parseInt(value, 10)
  return Number.isFinite(parsed) ? parsed : HEADER_OFFSET_FALLBACK
}

export function useLandingActiveSection() {
  const [active, setActive] = useState('')

  useEffect(() => {
    const sections = LANDING_NAV_LINKS
      .map(link => document.getElementById(link.href.slice(1)))
      .filter(Boolean)

    const updateActive = () => {
      const offset = getHeaderOffset() + 12
      let current = ''

      for (const section of sections) {
        if (section.getBoundingClientRect().top <= offset) {
          current = `#${section.id}`
        }
      }

      setActive(current)
    }

    updateActive()
    window.addEventListener('scroll', updateActive, { passive: true })
    window.addEventListener('resize', updateActive)

    return () => {
      window.removeEventListener('scroll', updateActive)
      window.removeEventListener('resize', updateActive)
    }
  }, [])

  return active
}
