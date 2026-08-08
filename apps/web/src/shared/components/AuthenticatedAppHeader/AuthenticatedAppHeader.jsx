import { Link } from 'react-router-dom'

import { useAuth } from '../../../features/auth/context/AuthContext.jsx'
import AppThemeScope from '../../../features/preferences/components/AppThemeScope/AppThemeScope.jsx'
import { usePlans } from '../../../features/workspace/context/PlansContext.jsx'
import { useAppChrome } from '../../context/AppChromeContext.jsx'
import { resolveAuthenticatedPageBreadcrumb } from './resolveAuthenticatedPageBreadcrumb.js'
import styles from './AuthenticatedAppHeader.module.css'

function BreadcrumbItem({ item }) {
  if (item.current || !item.to) {
    return (
      <span className={styles.breadcrumbCurrent} aria-current="page">
        {item.label}
      </span>
    )
  }

  return (
    <Link className={styles.breadcrumbLink} to={item.to}>
      {item.label}
    </Link>
  )
}

export default function AuthenticatedAppHeader({ pathname }) {
  const { workspace } = useAuth()
  const { plans } = usePlans()
  const { pageBreadcrumbLabel } = useAppChrome()
  const { items } = resolveAuthenticatedPageBreadcrumb({
    pathname,
    workspaceName: workspace?.name,
    plans,
    documentTitle: pageBreadcrumbLabel,
  })

  return (
    <AppThemeScope className={styles.themeScope}>
      <header className={styles.header} data-authenticated-app-header>
        <nav className={styles.breadcrumb} aria-label="Localização atual">
          {items.map((item, index) => (
            <span key={`${item.label}-${item.to ?? 'current'}`} className={styles.breadcrumbSegment}>
              {index > 0 ? (
                <span className={styles.separator} aria-hidden="true">/</span>
              ) : null}
              <BreadcrumbItem item={item} />
            </span>
          ))}
        </nav>
      </header>
    </AppThemeScope>
  )
}
