import styles from './Features.module.css'
import FeatureCard from './FeatureCard.jsx'

const FEATURES = [
  {
    id: 'planning',
    eyebrow: 'Assistente de IA',
    title: 'Planejamento inteligente que se antecipa',
    body: 'Descreva seu projeto em linguagem natural. O Plan Things transforma isso em um plano estruturado, define prioridades e antecipa bloqueios.',
    link: 'Explorar planejamento com IA',
    accent: 'var(--color-blue)',
    visual: 'planning',
  },
  {
    id: 'kanban',
    eyebrow: 'Quadros visuais',
    title: 'Kanban feito para o jeito real de trabalhar',
    body: 'Arraste, filtre, agrupe e use cores no seu quadro com um editor visual que não atrapalha. Campos personalizados, seleção múltipla e swimlanes incluídos.',
    link: 'Ver recursos do quadro',
    accent: 'var(--color-purple)',
    visual: 'kanban',
  },
  {
    id: 'workspace',
    eyebrow: 'Workspace unificado',
    title: 'Tarefas, docs e cronogramas em um só lugar',
    body: 'Pare de alternar entre ferramentas. O Plan Things reúne quadro de tarefas, documentos, cronogramas e notas em um workspace coerente.',
    link: 'Conhecer o workspace',
    accent: 'var(--color-green)',
    visual: 'workspace',
  },
]

export default function Features() {
  return (
    <div className={styles.section}>
      <div className={`${styles.inner} container`}>

        <div className={styles.header}>
          <p className={styles.eyebrow}>Recursos principais</p>
          <h2 className={styles.heading}>
            Tudo o que você precisa.<br />
            <span className={styles.headingLight}>Nada além disso.</span>
          </h2>
        </div>

        <div className={styles.grid}>
          {FEATURES.map(f => (
            <FeatureCard key={f.id} feature={f} />
          ))}
        </div>
      </div>
    </div>
  )
}
