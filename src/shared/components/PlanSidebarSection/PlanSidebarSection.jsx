import styles from './PlanSidebarSection.module.css'

export default function PlanSidebarSection({
  plans,
  activePlanId = null,
  onSelectPlan,
  title = 'Planos',
  footer = null,
  className = '',
}) {
  const sectionClassName = [styles.section, className].filter(Boolean).join(' ')

  return (
    <section className={sectionClassName} aria-label={title}>
      <p className={styles.label}>{title}</p>

      {plans.map((plan) => (
        <button
          type="button"
          key={plan.id}
          className={`${styles.planItem} ${plan.id === activePlanId ? styles.planItemActive : ''}`}
          onClick={() => onSelectPlan(plan.id)}
          aria-current={plan.id === activePlanId ? 'page' : undefined}
        >
          <span className={styles.planDot} style={{ background: plan.tagColor }} />
          <span className={styles.planName}>{plan.name}</span>
        </button>
      ))}

      {footer}
    </section>
  )
}
