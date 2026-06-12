import styles from './MobileDownload.module.css'

const HIGHLIGHTS = [
  { label: 'Offline', detail: 'Edite sem conexão' },
  { label: 'Push', detail: 'Alertas em tempo real' },
  { label: 'Widget', detail: 'Na tela inicial' },
  { label: 'Escuro', detail: 'Modo noturno nativo' },
]

function PhonePreview() {
  return (
    <div className={styles.phone} aria-hidden>
      <div className={styles.phoneBezel}>
        <div className={styles.phoneNotch} />
        <div className={styles.phoneScreen}>
          <div className={styles.screenHeader}>
            <span className={styles.screenTitle}>Meu quadro</span>
            <span className={styles.screenBadge}>3</span>
          </div>

          <div className={styles.screenColumns}>
            <div className={styles.screenColumn}>
              <span className={styles.columnLabel}>A fazer</span>
              <div className={`${styles.taskCard} ${styles.taskCardTall}`} />
              <div className={styles.taskCard} />
            </div>
            <div className={styles.screenColumn}>
              <span className={styles.columnLabel}>Em progresso</span>
              <div className={styles.taskCard} />
              <div className={`${styles.taskCard} ${styles.taskCardAccent}`} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function ArrowIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
      <path
        d="M3 7h8M8 4l3 3-3 3"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export default function MobileDownload() {
  return (
    <div className={styles.section} aria-labelledby="mobile-heading">
      <div className={`${styles.inner} container`}>
        <div className={styles.layout}>
          <div className={styles.visualCol}>
            <PhonePreview />

            <div className={styles.qrCard}>
              <div className={styles.qrPattern}>
                <span />
                <span />
                <span />
                <span />
              </div>
              <p className={styles.qrText}>Escaneie para baixar</p>
            </div>
          </div>

          <div className={styles.copyCol}>
            <h2 id="mobile-heading" className={styles.heading}>
              Seu quadro,<br />
              <span className={styles.headingEmphasis}>no bolso.</span>
            </h2>

            <p className={styles.body}>
              Apps nativos para iOS e Android com a mesma experiência do desktop — planeje em
              qualquer lugar, sincronize quando voltar online.
            </p>

            <div className={styles.storeRow}>
              <a href="#mobile" className={styles.storeLink}>
                App Store
                <ArrowIcon />
              </a>
              <span className={styles.storeDivider} aria-hidden />
              <a href="#mobile" className={styles.storeLink}>
                Google Play
                <ArrowIcon />
              </a>
            </div>

            <dl className={styles.highlightStrip}>
              {HIGHLIGHTS.map((item) => (
                <div key={item.label} className={styles.highlightItem}>
                  <dt className={styles.highlightLabel}>{item.label}</dt>
                  <dd className={styles.highlightDetail}>{item.detail}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>
    </div>
  )
}
