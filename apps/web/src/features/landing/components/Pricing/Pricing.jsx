import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ROUTES } from '../../../../shared/config/routes.js'
import styles from './Pricing.module.css'

const PLANS = [
  {
    id: 'basic',
    index: '01',
    name: 'Basic',
    price: { monthly: 0, annual: 0 },
    note: 'Grátis para sempre para quem trabalha sozinho',
    action: 'Continuar com Basic',
    actionHref: ROUTES.register,
    features: [
      '5 projetos ativos',
      '1 workspace',
      'Visões Kanban e lista',
      'Sugestões de tarefas com IA',
      '10 GB de armazenamento',
      'Suporte por e-mail',
    ],
  },
  {
    id: 'professional',
    index: '02',
    name: 'Professional',
    highlight: true,
    price: { monthly: 24, annual: 19 },
    note: 'Para usuários avançados com múltiplos fluxos',
    action: 'Continuar com Pro',
    actionHref: ROUTES.register,
    features: [
      'Projetos ilimitados',
      'Kanban avançado + linha do tempo',
      'Planejamento com IA ilimitado',
      'Automações de fluxo',
      '40 GB de armazenamento',
      'Suporte prioritário',
    ],
  },
  {
    id: 'team',
    index: '03',
    name: 'Team',
    price: { monthly: 42, annual: 34 },
    note: 'Para equipes em crescimento que entregam juntas',
    action: 'Continuar com Team',
    actionHref: ROUTES.register,
    features: [
      'Tudo do Professional',
      'Membros ilimitados',
      'Workspaces e papéis compartilhados',
      'Aprovações e permissões avançadas',
      '120 GB de armazenamento compartilhado',
      'Integrações com Slack e GitHub',
      'Suporte prioritário com SLA',
    ],
  },
]

function PlanRow({ plan, annual }) {
  const price = annual ? plan.price.annual : plan.price.monthly
  const isFree = price === 0

  return (
    <article className={`${styles.planRow} ${plan.highlight ? styles.planRowHighlight : ''}`}>
      <span className={styles.planIndex}>{plan.index}</span>

      <div className={styles.planMain}>
        <div className={styles.planIntro}>
          <div className={styles.planTitleGroup}>
            <h3 className={styles.planName}>{plan.name}</h3>
            {plan.highlight ? <span className={styles.planBadge}>Recomendado</span> : null}
          </div>
          <p className={styles.planNote}>{plan.note}</p>
        </div>

        <ul className={styles.featureList}>
          {plan.features.map((feature) => (
            <li key={feature}>{feature}</li>
          ))}
        </ul>
      </div>

      <div className={styles.planAside}>
        <div className={styles.priceBlock}>
          <span className={styles.priceValue}>{isFree ? 'Grátis' : `$${price}`}</span>
          {!isFree ? <span className={styles.pricePeriod}>/mês</span> : null}
        </div>

        <Link to={plan.actionHref} className={styles.planAction}>
          {plan.action}
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
            <path
              d="M3 7h8M8 4l3 3-3 3"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </Link>
      </div>
    </article>
  )
}

export default function Pricing() {
  const [annual, setAnnual] = useState(true)

  return (
    <div className={styles.section} aria-labelledby="pricing-heading">
      <div className={`${styles.inner} container`}>
        <header className={styles.header}>
          <h2 id="pricing-heading" className={styles.heading}>
            Preços simples e transparentes
          </h2>

          <div className={styles.billingControls} role="group" aria-label="Período de cobrança">
            <button
              type="button"
              className={`${styles.billingBtn} ${!annual ? styles.billingBtnActive : ''}`}
              onClick={() => setAnnual(false)}
              aria-pressed={!annual}
            >
              Mensal
            </button>
            <button
              type="button"
              className={`${styles.billingBtn} ${annual ? styles.billingBtnActive : ''}`}
              onClick={() => setAnnual(true)}
              aria-pressed={annual}
            >
              Anual
              <span className={styles.saveBadge}>−20%</span>
            </button>
          </div>
        </header>

        <p className={styles.lead}>
          Três planos claros para trabalho individual, execução profissional e equipes colaborativas.
        </p>

        <div className={styles.planList}>
          {PLANS.map((plan) => (
            <PlanRow key={plan.id} plan={plan} annual={annual} />
          ))}
        </div>
      </div>
    </div>
  )
}
