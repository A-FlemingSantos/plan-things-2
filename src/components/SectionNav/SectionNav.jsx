import { useState, useEffect } from 'react'
import styles from './SectionNav.module.css'

const SECTIONS = [
  { label: 'Visão geral',   href: '#how-it-works' },
  { label: 'Recursos',      href: '#features'     },
  { label: 'Planejamento IA', href: '#innovation' },
  { label: 'Preços',        href: '#pricing'      },
  { label: 'Mobile',        href: '#mobile'       },
  { label: 'Integrações',   href: '#ecosystem'    },
  { label: 'FAQ',           href: '#faq'          },
]

export default function SectionNav() {
  const [active, setActive] = useState('#how-it-works')

  useEffect(() => {
    const ids = SECTIONS.map(s => s.href.slice(1))
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            setActive(`#${entry.target.id}`)
          }
        })
      },
      { threshold: 0.35 }
    )

    ids.forEach(id => {
      const el = document.getElementById(id)
      if (el) observer.observe(el)
    })

    return () => observer.disconnect()
  }, [])

  return (
    <div className={styles.wrapper}>
      <div className={`${styles.bar} container`}>
        <nav className={styles.nav} aria-label="Navegação por seções">
          {SECTIONS.map(s => (
            <a
              key={s.href}
              href={s.href}
              className={`${styles.link} ${active === s.href ? styles.active : ''}`}
            >
              {s.label}
            </a>
          ))}
        </nav>

        <a href="#pricing" className={styles.cta}>
          Começar
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M3 7h8M8 4l3 3-3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </a>
      </div>
    </div>
  )
}
