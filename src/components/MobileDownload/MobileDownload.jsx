import styles from './MobileDownload.module.css'

export default function MobileDownload() {
  return (
    <div className={styles.section}>
      <div className={`${styles.inner} container`}>

        <p className={styles.eyebrow}>Disponível em qualquer dispositivo</p>

        <h2 className={styles.heading}>
          Planeje em qualquer lugar.<br />
          <span className={styles.headingLight}>Seu quadro sempre no bolso.</span>
        </h2>

        <p className={styles.subtext}>
          Escaneie para baixar o app do Plan Things no iOS e Android.
          Experiência mobile completa com suporte offline.
        </p>

        {/* QR + badges */}
        <div className={styles.downloadArea}>

          {/* QR code representation */}
          <div className={styles.qrCard}>
            <div className={styles.qrFrame}>
              {/* SVG QR-like pattern */}
              <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" className={styles.qrSvg}>
                {/* Top-left finder */}
                <rect x="4"  y="4"  width="24" height="24" rx="3" stroke="black" strokeWidth="2" fill="none"/>
                <rect x="10" y="10" width="12" height="12" rx="1.5" fill="black"/>
                {/* Top-right finder */}
                <rect x="52" y="4"  width="24" height="24" rx="3" stroke="black" strokeWidth="2" fill="none"/>
                <rect x="58" y="10" width="12" height="12" rx="1.5" fill="black"/>
                {/* Bottom-left finder */}
                <rect x="4"  y="52" width="24" height="24" rx="3" stroke="black" strokeWidth="2" fill="none"/>
                <rect x="10" y="58" width="12" height="12" rx="1.5" fill="black"/>
                {/* Data dots */}
                {[32,36,40,44,48].map(x =>
                  [4,8,12,16,20].map(y => (
                    <rect key={`${x}-${y}`} x={x} y={y} width="3" height="3" rx=".5" fill="black" opacity={Math.random() > 0.4 ? 1 : 0}/>
                  ))
                )}
                {[4,8,12,16,20,24,28].map(x =>
                  [32,36,40,44,48].map(y => (
                    <rect key={`${x}-${y}`} x={x} y={y} width="3" height="3" rx=".5" fill="black" opacity={Math.random() > 0.45 ? 1 : 0}/>
                  ))
                )}
                {[32,36,40,44,48,52,56].map(x =>
                  [32,36,40,44,48,52,56,60,64,68,72].map(y => (
                    <rect key={`${x}-${y}`} x={x} y={y} width="3" height="3" rx=".5" fill="black" opacity={Math.random() > 0.5 ? 1 : 0}/>
                  ))
                )}
                {/* Center logo mark */}
                <rect x="34" y="34" width="12" height="12" rx="2" fill="white"/>
                <rect x="35" y="35" width="5" height="5" rx="1" fill="black"/>
                <rect x="41" y="35" width="5" height="5" rx="1" fill="black" opacity=".4"/>
                <rect x="35" y="41" width="5" height="5" rx="1" fill="black" opacity=".6"/>
                <rect x="41" y="41" width="5" height="5" rx="1" fill="black" opacity=".75"/>
              </svg>
            </div>
            <p className={styles.qrHint}>Escaneie para baixar</p>
          </div>

          {/* Divider */}
          <div className={styles.orDivider}>
            <span className={styles.orLine} />
            <span className={styles.orText}>ou</span>
            <span className={styles.orLine} />
          </div>

          {/* Store badges */}
          <div className={styles.badges}>
            <a href="#mobile" className={styles.badge}>
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M12.5 9.5L5 14l1-4.5L5 5l7.5 4.5z" fill="currentColor"/>
              </svg>
              <div className={styles.badgeText}>
                <span className={styles.badgeSmall}>Baixe na</span>
                <span className={styles.badgeLarge}>App Store</span>
              </div>
            </a>

            <a href="#mobile" className={styles.badge}>
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M3 2.5l6 6-6 6V2.5zM3 2.5l10 3-4 3 4 3-10 3" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
              </svg>
              <div className={styles.badgeText}>
                <span className={styles.badgeSmall}>Baixe no</span>
                <span className={styles.badgeLarge}>Google Play</span>
              </div>
            </a>
          </div>
        </div>

        {/* Feature pills */}
        <div className={styles.pills}>
          {['Suporte offline', 'Notificações push', 'Widget na tela inicial', 'Modo escuro'].map(p => (
            <span key={p} className={styles.pill}>{p}</span>
          ))}
        </div>
      </div>
    </div>
  )
}
