import { useAuth } from '../../../features/auth/context/AuthContext.jsx'
import AppThemeScope from '../../../features/preferences/components/AppThemeScope/AppThemeScope.jsx'
import { usePlans } from '../../../features/workspace/context/PlansContext.jsx'
import { normalizePathname, ROUTES } from '../../config/routes.js'
import { resolveAuthenticatedPageBreadcrumb } from './resolveAuthenticatedPageBreadcrumb.js'
import styles from './AuthenticatedAppHeader.module.css'

export default function AuthenticatedAppHeader({ pathname }) {
  const { workspace } = useAuth()
  const { plans } = usePlans()
  const normalizedPathname = normalizePathname(pathname)
  const isWorkspaceHome = normalizedPathname === ROUTES.workspace
  const { workspaceName, pageTitle } = resolveAuthenticatedPageBreadcrumb({
    pathname,
    workspaceName: workspace?.name,
    plans,
  })

  return (
    <AppThemeScope
      className={[
        styles.themeScope,
        isWorkspaceHome ? styles.workspaceHomeTheme : '',
      ].filter(Boolean).join(' ')}
    >
      <header className={styles.header} data-authenticated-app-header>
        <nav className={styles.breadcrumb} aria-label="Localização atual">
          <span className={styles.workspaceName}>{workspaceName}</span>
          {pageTitle ? (
            <>
              <span className={styles.separator} aria-hidden="true">/</span>
              <span className={styles.pageTitle}>{pageTitle}</span>
            </>
          ) : null}
        </nav>
      </header>
    </AppThemeScope>
  )
}
