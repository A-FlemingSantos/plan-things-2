import { Link } from 'react-router-dom'
import { ROUTES } from '../../../../shared/config/routes.js'
import styles from './Footer.module.css'

export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className={styles.footer}>
      <div className={`${styles.inner} container`}>
        <div className={styles.closing}>
          <h2 className={styles.heading}>Pronto para começar?</h2>
          <p className={styles.lead}>
            Crie sua conta gratuita e coloque seu time no mesmo quadro hoje.
          </p>
          <Link to={ROUTES.register} className={styles.cta}>
            Começar grátis
          </Link>
        </div>

        <div className={styles.legal}>
          <p className={styles.copy}>© {year} Plan Things</p>
          <div className={styles.legalLinks}>
            <Link to={ROUTES.privacy} className={styles.legalLink}>
              Privacidade
            </Link>
            <Link to={ROUTES.terms} className={styles.legalLink}>
              Termos
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
