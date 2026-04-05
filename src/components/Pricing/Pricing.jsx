import { useState } from 'react'
import styles from './Pricing.module.css'

const PLANS = [
  {
    name: 'Basic',
    price: { monthly: 0, annual: 0 },
    note: 'Grátis para sempre para quem trabalha sozinho',
    cta: 'Começar grátis',
    ctaStyle: 'secondary',
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
    name: 'Professional',
    price: { monthly: 24, annual: 19 },
    note: 'Para usuários avançados com múltiplos fluxos',
    cta: 'Iniciar teste grátis',
    ctaStyle: 'primary',
    highlight: true,
    features: [
      'Projetos ilimitados',
      'Kanban avançado + linha do tempo',
      'Planejamento com IA ilimitado',
      'Automações e tarefas recorrentes',
      '40 GB de armazenamento',
      'Suporte prioritário',
    ],
  },
  {
    name: 'Team',
    price: { monthly: 42, annual: 34 },
    note: 'Para equipes em crescimento que entregam juntas',
    cta: 'Falar com vendas',
    ctaStyle: 'outline',
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

function CheckIcon({ color = 'var(--color-green)' }) {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M3 7l2.5 2.5 5.5-5" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

export default function Pricing() {
  const [annual, setAnnual] = useState(true)

  return (
    <div className={styles.section}>
      <div className={`${styles.inner} container`}>

        {/* Header row */}
        <div className={styles.headerRow}>
          <div>
            <h2 className={styles.heading}>Preços simples e transparentes</h2>
            <p className={styles.subheading}>
              Três planos claros para trabalho individual, execução profissional e equipes colaborativas.
            </p>
          </div>

          {/* Billing toggle */}
          <div className={styles.billingToggle}>
            <button
              className={`${styles.billingBtn} ${!annual ? styles.billingActive : ''}`}
              onClick={() => setAnnual(false)}
            >Mensal</button>
            <button
              className={`${styles.billingBtn} ${annual ? styles.billingActive : ''}`}
              onClick={() => setAnnual(true)}
            >
              Anual
              <span className={styles.saveBadge}>Economize 20%</span>
            </button>
          </div>
        </div>

        {/* Cards */}
        <div className={styles.grid}>
          {PLANS.map(plan => (
            <div
              key={plan.name}
              className={`${styles.card} ${plan.highlight ? styles.highlighted : ''}`}
            >
              {plan.highlight && (
                <div className={styles.popularBadge}>Mais popular</div>
              )}

              <div className={styles.cardTop}>
                <p className={styles.planName}>{plan.name}</p>
                <div className={styles.priceRow}>
                  <span className={styles.priceCurrency}>$</span>
                  <span className={styles.priceNum}>
                    {annual ? plan.price.annual : plan.price.monthly}
                  </span>
                  {plan.price.monthly > 0 && (
                    <span className={styles.pricePer}>/mês</span>
                  )}
                </div>
                <p className={styles.priceNote}>{plan.note}</p>
              </div>

              <div className={styles.cardDivider} />

              <a
                href={plan.name === 'Team' ? '#faq' : '#mobile'}
                className={`${styles.planCta} ${
                  plan.ctaStyle === 'primary' ? styles.ctaPrimary :
                  plan.ctaStyle === 'outline' ? styles.ctaOutline : styles.ctaSecondary
                }`}
              >
                {plan.cta}
              </a>

              <ul className={styles.featureList}>
                {plan.features.map(f => (
                  <li key={f} className={styles.featureItem}>
                    <CheckIcon color={plan.highlight ? 'var(--color-white)' : 'var(--color-gray-400)'} />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
