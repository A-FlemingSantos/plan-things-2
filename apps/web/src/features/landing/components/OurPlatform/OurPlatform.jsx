import styles from './OurPlatform.module.css'

const PLATFORM_CARDS = [
  {
    id: 'planning',
    tone: 'warm',
    title: 'Planejamento com IA',
    body: 'Descreva objetivos em linguagem natural e transforme ideias em planos estruturados com prioridades claras.',
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden>
        <path
          d="M10.5 21.5h7M11.5 21.5v1.5h5v-1.5"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M14 6.5a5.25 5.25 0 013.95 8.72c-.78.86-1.2 1.55-1.2 2.53v.75h-5.5v-.75c0-.98-.42-1.67-1.2-2.53A5.25 5.25 0 0114 6.5Z"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        <path d="M14 4v1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: 'boards',
    tone: 'cool',
    title: 'Quadros visuais',
    body: 'Organize tarefas em Kanban com campos personalizados, swimlanes e um fluxo visual que acompanha o trabalho real.',
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden>
        <rect x="6" y="5" width="16" height="18" rx="2" stroke="currentColor" strokeWidth="1.5" />
        <path d="M10 10h8M10 14h6M10 18h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path
          d="M17.5 16.5l3 3M20.5 13.5l-3 3"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    id: 'collaboration',
    tone: 'warm',
    title: 'Colaboração',
    body: 'Comentários, menções e atualizações em tempo real mantêm todos alinhados no mesmo contexto.',
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden>
        <path
          d="M8 20.5V8.75C8 7.51 8.99 6.5 10.22 6.5h7.56C18.01 6.5 19 7.51 19 8.75v7.13c0 1.24-.99 2.25-2.22 2.25H12l-4 2.37V20.5Z"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        <path d="M11 11.5h6M11 14.5h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: 'security',
    tone: 'cool',
    title: 'Segurança',
    body: 'Criptografia, controle de acesso e governança para proteger os dados da sua empresa em cada etapa do trabalho.',
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden>
        <path
          d="M14 5.5l7 3v6.25c0 4.55-2.95 7.85-7 9.25-4.05-1.4-7-4.7-7-9.25V8.5l7-3Z"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        <path
          d="M11.25 14.25l2 2 4.5-4.5"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
]

function PlatformIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
      <rect x="1.5" y="3.5" width="7.5" height="7.5" rx="1.25" stroke="currentColor" strokeWidth="1.2" />
      <rect x="5" y="1.5" width="7.5" height="7.5" rx="1.25" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  )
}

export default function OurPlatform() {
  return (
    <div className={styles.section} aria-labelledby="our-platform-heading">
      <div className={`${styles.inner} container`}>
        <header className={styles.header}>
          <p className={styles.eyebrow}>
            <PlatformIcon />
            Nossa plataforma
          </p>
          <h2 id="our-platform-heading" className={styles.heading}>
            Transforme o ciclo de vida dos seus projetos
          </h2>
          <p className={styles.subheading}>
            Ferramentas pensadas para sua equipe em cada etapa — do planejamento à entrega.
          </p>
        </header>

        <div className={styles.grid}>
          {PLATFORM_CARDS.map((card) => (
            <article key={card.id} className={styles.card}>
              <div className={styles.cardVisual} data-tone={card.tone}>
                <div className={styles.cardVisualGlow} aria-hidden />
                <span className={styles.cardIcon}>{card.icon}</span>
              </div>
              <h3 className={styles.cardTitle}>{card.title}</h3>
              <p className={styles.cardBody}>{card.body}</p>
            </article>
          ))}
        </div>
      </div>
    </div>
  )
}
