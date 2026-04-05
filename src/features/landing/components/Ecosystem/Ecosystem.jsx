import { useState } from 'react'
import styles from './Ecosystem.module.css'

const INTEGRATIONS = [
  {
    name: 'GitHub',
    tagline: 'Vincule commits e PRs direto nas tarefas',
    sub: 'Atualizações automáticas de status quando o código entra no ar.',
    color: '#000',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
      </svg>
    ),
  },
  {
    name: 'Slack',
    tagline: 'Receba atualizações onde sua equipe conversa',
    sub: 'Notificações em tempo real e ações rápidas pelo Slack.',
    color: '#4A154B',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
        <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zm1.271 0a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zm0 1.271a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zm10.122 2.521a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zm-1.268 0a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312zm-2.523 10.122a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zm0-1.268a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z"/>
      </svg>
    ),
  },
  {
    name: 'Google Calendar',
    tagline: 'Mantenha prazos sincronizados com seu calendário',
    sub: 'Sincronização em duas vias para nada passar despercebido.',
    color: '#1a73e8',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
        <path d="M19 3h-1V1h-2v2H8V1H6v2H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V5a2 2 0 00-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"/>
      </svg>
    ),
  },
  {
    name: 'Notion',
    tagline: 'Leve quadros para dentro do seu workspace no Notion',
    sub: 'Sincronização bidirecional entre docs e tarefas.',
    color: '#000',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
        <path d="M4.459 4.208c.746.606 1.026.56 2.428.466l13.215-.793c.28 0 .047-.28-.046-.326L17.86 1.968c-.42-.326-.981-.7-2.055-.607L3.01 2.295c-.466.046-.56.28-.374.466zm.793 3.08v13.904c0 .747.373 1.027 1.214.98l14.523-.84c.841-.046.935-.56.935-1.167V6.354c0-.606-.233-.933-.748-.887l-15.177.887c-.56.047-.747.327-.747.933zm14.337.745c.093.42 0 .84-.42.888l-.7.14v10.264c-.608.327-1.168.514-1.635.514-.748 0-.935-.234-1.495-.933l-4.577-7.186v6.952L12.21 19s0 .84-1.168.84l-3.222.186c-.093-.186 0-.653.327-.746l.84-.233V9.854L7.822 9.76c-.094-.42.14-1.026.793-1.073l3.456-.233 4.764 7.279v-6.44l-1.215-.14c-.093-.514.28-.887.747-.933zM1.936 1.035l13.31-.98c1.634-.14 2.055-.047 3.082.7l4.249 2.986c.7.513.934.653.934 1.213v16.378c0 1.026-.373 1.634-1.68 1.726l-15.458.934c-.98.047-1.447-.093-1.962-.747l-3.129-4.06c-.56-.747-.793-1.306-.793-1.96V2.667c0-.839.374-1.54 1.447-1.632z"/>
      </svg>
    ),
  },
  {
    name: 'Figma',
    tagline: 'Vincule arquivos de design às tarefas de entrega',
    sub: 'Conecte o avanço do design aos tickets de engenharia sem atrito.',
    color: '#f24e1e',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
        <path d="M5 5.5A3.5 3.5 0 0 1 8.5 2H12v7H8.5A3.5 3.5 0 0 1 5 5.5zM12 2h3.5a3.5 3.5 0 1 1 0 7H12V2zm-6.5 10A3.5 3.5 0 0 1 9 8.5h3v7H8.5A3.5 3.5 0 0 1 5.5 12zm6.5 3.5v-7h3.5a3.5 3.5 0 1 1 0 7H12zM8.5 17H12v3.5A3.5 3.5 0 1 1 8.5 17z"/>
      </svg>
    ),
  },
  {
    name: 'Zapier',
    tagline: 'Automatize o Plan Things com mais de 5.000 apps',
    sub: 'Fluxos sem código acionados por qualquer evento do quadro.',
    color: '#ff4a00',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.248l-2.9 2.9H18v1.704h-3.338l2.9 2.9-1.206 1.206-2.9-2.9V17h-1.704v-3.338l-2.9 2.9-1.206-1.206 2.9-2.9H7v-1.704h3.338l-2.9-2.9 1.206-1.206 2.9 2.9V7h1.704v3.338l2.9-2.9 1.206 1.21z"/>
      </svg>
    ),
  },
]

export default function Ecosystem() {
  const [activeIdx, setActiveIdx] = useState(0)
  const canGoPrev = activeIdx > 0
  const canGoNext = activeIdx < INTEGRATIONS.length - 1

  const moveCarousel = (dir) => {
    const next = activeIdx + dir
    if (next < 0 || next >= INTEGRATIONS.length) return
    setActiveIdx(next)
  }

  return (
    <div className={styles.section}>
      <div className={`${styles.header} container`}>
        <div className={styles.headerLeft}>
          <p className={styles.eyebrow}>Ecossistema</p>
          <h2 className={styles.heading}>
            O Plan Things funciona bem<br />
            <span className={styles.headingLight}>com toda a sua stack</span>
          </h2>
        </div>
        <a href="/cadastro" className={styles.allBtn}>
          Ver todas as integrações
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M3 7h8M8 4l3 3-3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </a>
      </div>

      {/* Carousel */}
      <div className={`${styles.carouselOuter} container`}>
        <div className={styles.carouselViewport}>
          <div
            className={styles.carouselTrack}
            style={{
              transform: `translateX(calc(50% - (var(--ecosystem-card-width) / 2) - ${activeIdx} * (var(--ecosystem-card-width) + var(--ecosystem-card-gap))))`,
            }}
          >
          {INTEGRATIONS.map((item, i) => {
            return (
              <div
                key={item.name}
                className={`${styles.card} ${i === activeIdx ? styles.cardActive : styles.cardInactive}`}
                aria-hidden={i !== activeIdx}
              >
                <div className={styles.cardIcon} style={{ color: item.color }}>
                  {item.icon}
                </div>
                <h3 className={styles.cardName}>{item.name}</h3>
                <p className={styles.cardTagline}>{item.tagline}</p>
                <p className={styles.cardSub}>{item.sub}</p>
                <div className={styles.cardFooter}>
                  <a href="/cadastro" className={styles.cardCta}>
                    <span className={styles.cardCtaIcon}>
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path d="M2 6h8M7 3l3 3-3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </span>
                    Conectar
                  </a>
                </div>
              </div>
            )
          })}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className={`${styles.controls} container`}>
        <button
          className={`${styles.arrowBtn} ${!canGoPrev ? styles.arrowDisabled : ''}`}
          onClick={() => moveCarousel(-1)}
          aria-label="Anterior"
          disabled={!canGoPrev}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M10 4L6 8l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <button
          className={`${styles.arrowBtn} ${!canGoNext ? styles.arrowDisabled : ''}`}
          onClick={() => moveCarousel(1)}
          aria-label="Próximo"
          disabled={!canGoNext}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>
    </div>
  )
}
