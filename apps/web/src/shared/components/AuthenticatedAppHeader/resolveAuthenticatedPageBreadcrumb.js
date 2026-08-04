import { normalizePathname, ROUTES } from '../../config/routes.js'

export function resolveAuthenticatedPageBreadcrumb({
  pathname,
  workspaceName = 'Workspace',
  plans = [],
} = {}) {
  const normalized = normalizePathname(pathname)
  const resolvedWorkspaceName = String(workspaceName ?? '').trim() || 'Workspace'
  let pageTitle = null

  if (normalized === ROUTES.workspace) {
    pageTitle = null
  } else if (normalized === ROUTES.workspaceBoard) {
    pageTitle = 'Quadros'
  } else if (normalized.startsWith(`${ROUTES.workspaceBoard}/`)) {
    const planId = normalized.slice(`${ROUTES.workspaceBoard}/`.length).split('/')[0]
    const plan = plans.find((entry) => entry.id === planId)
    pageTitle = plan?.name?.trim() || 'Plano'
  } else if (normalized === ROUTES.settings) {
    pageTitle = 'Configurações'
  } else if (normalized === ROUTES.calendar) {
    pageTitle = 'Calendário'
  }

  return {
    workspaceName: resolvedWorkspaceName,
    pageTitle,
  }
}
