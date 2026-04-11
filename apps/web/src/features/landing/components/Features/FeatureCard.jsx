import { Link } from 'react-router-dom'
import { ROUTES } from '../../../../shared/config/routes.js'
import styles from './FeatureCard.module.css'

/* ── Mini visual illustrations per feature ── */

function PlanningVisual() {
  return (
    <div className={styles.visual}>
      <div className={styles.visualInner}>
        {/* AI prompt bar */}
        <div className={styles.planPrompt}>
          <span className={styles.planIcon}>
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
              <circle cx="6.5" cy="6.5" r="5.5" stroke="var(--color-blue)" strokeWidth="1.2"/>
              <path d="M4.5 6.5h4M6.5 4.5v4" stroke="var(--color-blue)" strokeWidth="1.2" strokeLinecap="round"/>
            </svg>
          </span>
          <span className={styles.planPromptText}>Planejar o lançamento de um produto no 4º tri…</span>
          <span className={styles.planCursor} />
        </div>
        {/* Generated tasks */}
        {[
          { label: 'Definir métricas de sucesso', pct: 100, color: 'var(--color-blue)' },
          { label: 'Criar briefing de lançamento', pct: 75, color: 'var(--color-blue)' },
          { label: 'Agendar alinhamento com stakeholders', pct: 45, color: 'var(--color-blue)' },
          { label: 'Esboçar sequência de e-mails', pct: 20, color: 'var(--color-blue)' },
        ].map((t, i) => (
          <div key={i} className={styles.planTask} style={{ '--i': i }}>
            <span className={styles.planTaskDot} />
            <span className={styles.planTaskLabel}>{t.label}</span>
            <div className={styles.planTaskBar}>
              <div style={{ width: `${t.pct}%`, background: t.color, height: '100%', borderRadius: '2px', transition: 'width 0.6s ease' }} />
            </div>
          </div>
        ))}
        <div className={styles.planBadge}>
          <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
            <path d="M2 5.5l2.5 2.5 5-5" stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          4 tarefas geradas
        </div>
      </div>
    </div>
  )
}

function KanbanVisual() {
  const cols = [
    { name: 'A fazer', color: '#a0a0a0', cards: 3 },
    { name: 'Fazendo', color: 'var(--color-purple)', cards: 2 },
    { name: 'Concluído', color: 'var(--color-green)', cards: 4 },
  ]
  return (
    <div className={styles.visual}>
      <div className={styles.visualInner}>
        <div className={styles.kbGrid}>
          {cols.map(col => (
            <div key={col.name} className={styles.kbCol}>
              <div className={styles.kbColHead}>
                <span className={styles.kbDot} style={{ background: col.color }} />
                <span className={styles.kbColName}>{col.name}</span>
                <span className={styles.kbCount}>{col.cards}</span>
              </div>
              {Array.from({ length: col.cards }).map((_, i) => (
                <div key={i} className={styles.kbCard} style={{ '--i': i, opacity: 1 - i * 0.18 }}>
                  <div className={styles.kbCardLine} style={{ width: `${55 + i * 15}%`, background: col.color, opacity: 0.3 }} />
                  <div className={styles.kbCardLine} style={{ width: `${35 + i * 10}%` }} />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function WorkspaceVisual() {
  return (
    <div className={styles.visual}>
      <div className={styles.visualInner}>
        {/* Tabs row */}
        <div className={styles.wsTabs}>
          {['Quadro','Docs','Linha do tempo','Notas'].map((t, i) => (
            <span key={t} className={`${styles.wsTab} ${i === 0 ? styles.wsTabActive : ''}`}>{t}</span>
          ))}
        </div>
        {/* Content rows */}
        <div className={styles.wsContent}>
          {[80, 60, 90, 45, 70].map((w, i) => (
            <div key={i} className={styles.wsRow}>
              <span className={styles.wsRowDot} style={{ background: ['var(--color-green)','var(--color-blue)','var(--color-purple)','var(--color-red)','#aaa'][i] }} />
              <div className={styles.wsRowBar} style={{ width: `${w}%` }} />
              <span className={styles.wsRowAvatar} style={{ background: ['#d4aef1','#4290da','#0f703a','#ff6766','#ddd'][i] }} />
            </div>
          ))}
        </div>
        {/* Status chips */}
        <div className={styles.wsChips}>
          {['No prazo','2 revisões','Entrega sexta'].map((c, i) => (
            <span key={c} className={styles.wsChip}
              style={{ background: ['#0f703a18','#4290da18','#ff676618'][i], color: ['var(--color-green)','var(--color-blue)','var(--color-red)'][i] }}>
              {c}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

const VISUALS = { planning: PlanningVisual, kanban: KanbanVisual, workspace: WorkspaceVisual }

/* ── Card ── */
export default function FeatureCard({ feature }) {
  const Visual = VISUALS[feature.visual]
  const featureHref =
    feature.visual === 'planning' ? '#innovation' :
    feature.visual === 'kanban' ? '#how-it-works' :
    ROUTES.workspace

  return (
    <div className={styles.card}>
      <Visual />

      <div className={styles.body}>
        <p className={styles.eyebrow} style={{ color: feature.accent }}>{feature.eyebrow}</p>
        <h3 className={styles.title}>{feature.title}</h3>
        <p className={styles.text}>{feature.body}</p>
      </div>

      <div className={styles.footer}>
        <Link to={featureHref} className={styles.cta}>
          <span className={styles.ctaIcon} style={{ background: feature.accent }}>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M2 6h8M7 3l3 3-3 3" stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </span>
          {feature.link}
        </Link>
      </div>
    </div>
  )
}
