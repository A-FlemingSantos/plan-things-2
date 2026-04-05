import styles from './Hero.module.css'
import KanbanMockup from './KanbanMockup.jsx'

export default function Hero() {
  return (
    <div className={styles.hero}>
      <div className={`${styles.inner} container`}>
        {/* Left column */}
        <div className={styles.content}>
          <p className={styles.eyebrow}>Gestão de projetos, reinventada</p>

          <h1 className={styles.headline}>
            Faça o trabalho <span className={styles.headlineLight}>andar de verdade.</span>
          </h1>

          <p className={styles.subtext}>
            O Plan Things traz clareza para projetos complexos: um workspace com foco em Kanban,
            planejamento com IA, colaboração em tempo real e um design que sai do caminho
            para o seu trabalho respirar.
          </p>

          <div className={styles.ctas}>
            <a href="/cadastro" className={styles.ctaPrimary}>
              Começar grátis
            </a>
            <a href="#how-it-works" className={styles.ctaSecondary}>
              Ver como funciona
            </a>
          </div>

          <div className={styles.socialProof}>
            <div className={styles.avatarGroup}>
              {['#d4aef1','#4290da','#0f703a','#ff6766','#000'].map((c, i) => (
                <span key={i} className={styles.avatar} style={{ background: c }} />
              ))}
            </div>
            <p className={styles.proofText}>
              Confiado por <strong>12.000+</strong> equipes no mundo todo
            </p>
          </div>
        </div>

        {/* Right column – mockup */}
        <div className={styles.mockupWrap}>
          <KanbanMockup />
          {/* Pedestal */}
          <div className={styles.pedestal}>
            <div className={styles.pedestalInner} />
          </div>
        </div>
      </div>
    </div>
  )
}
