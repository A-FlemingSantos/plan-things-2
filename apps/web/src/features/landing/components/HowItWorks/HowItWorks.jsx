import FeatureShowcaseCard from './FeatureShowcaseCard.jsx'
import styles from './HowItWorks.module.css'

const SHOWCASE_ITEMS = [
  {
    id: 'plan',
    variant: 'image-left',
    visualTone: 'green',
    eyebrow: 'Planejamento com IA',
    headline: 'Planeje com clareza, a partir de uma frase',
    body: 'Descreva o objetivo em linguagem natural. A IA transforma em épicos, tarefas e prazos que você revisa e ajusta em segundos.',
    mockupLabel: 'Planejamento com IA',
    link: { label: 'Conhecer o planejamento com IA', href: '#how-it-works' },
  },
  {
    id: 'kanban',
    variant: 'image-right',
    visualTone: 'blue',
    eyebrow: 'Quadro Kanban',
    headline: 'Organize visualmente no quadro que a equipe usa de verdade',
    body: 'Colunas, swimlanes, etiquetas e arrastar-e-soltar fluido — sem a fricção de ferramentas genéricas que lutam contra o seu fluxo.',
    mockupLabel: 'Quadro Kanban',
    link: { label: 'Ver recursos do quadro', href: '#how-it-works' },
  },
  {
    id: 'collab',
    variant: 'image-left',
    visualTone: 'blue',
    eyebrow: 'Colaboração',
    headline: 'Colabore em tempo real sem perder o contexto',
    body: 'Comentários no card, menções, atribuições e atualizações ao vivo mantêm todos alinhados no mesmo lugar em que o trabalho acontece.',
    mockupLabel: 'Colaboração',
    link: { label: 'Explorar colaboração', href: '#how-it-works' },
  },
  {
    id: 'automate',
    variant: 'image-right',
    visualTone: 'green',
    eyebrow: 'Automações',
    headline: 'Automatize o repetitivo e foque no que importa',
    body: 'Regras, lembretes e ações em lote reduzem cliques manuais para que a equipe avance em vez de administrar o quadro.',
    mockupLabel: 'Automações',
    link: { label: 'Saiba mais sobre automações', href: '#how-it-works' },
  },
]

export default function HowItWorks() {
  return (
    <div className={styles.section}>
      <section className={styles.featureShowcase} aria-label="Funcionalidades do produto">
        {SHOWCASE_ITEMS.map(item => (
          <FeatureShowcaseCard
            key={item.id}
            variant={item.variant}
            visualTone={item.visualTone}
            eyebrow={item.eyebrow}
            headline={item.headline}
            body={item.body}
            link={item.link}
            mockupLabel={item.mockupLabel}
            imageSrc={item.imageSrc}
            imageFit={item.imageFit}
          />
        ))}
      </section>
    </div>
  )
}
