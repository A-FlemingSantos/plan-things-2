import { normalizePathname, ROUTES } from '../../config/routes.js'

function createItem(label, { to = null, current = false } = {}) {
  return {
    label,
    to,
    current,
  }
}

export function resolveAuthenticatedPageBreadcrumb({
  pathname,
  workspaceName = 'Workspace',
  plans = [],
} = {}) {
  const normalized = normalizePathname(pathname)
  const resolvedWorkspaceName = String(workspaceName ?? '').trim() || 'Workspace'

  if (normalized === ROUTES.workspace) {
    return {
      items: [createItem(resolvedWorkspaceName, { current: true })],
    }
  }

  const items = [createItem(resolvedWorkspaceName, { to: ROUTES.workspace })]

  if (normalized === ROUTES.workspaceBoard || normalized.startsWith(`${ROUTES.workspaceBoard}/`)) {
    const planId = normalized.startsWith(`${ROUTES.workspaceBoard}/`)
      ? normalized.slice(`${ROUTES.workspaceBoard}/`.length).split('/')[0]
      : null
    const plan = planId ? plans.find((entry) => entry.id === planId) : null

    items.push(createItem(plan?.name?.trim() || 'Plano', { current: true }))
  } else if (normalized === ROUTES.settings) {
    items.push(createItem('Configurações', { current: true }))
  } else if (normalized === ROUTES.docs) {
    items.push(createItem('Docs', { current: true }))
  } else if (normalized.startsWith(`${ROUTES.docs}/`)) {
    const docId = normalized.slice(`${ROUTES.docs}/`.length).split('/')[0]
    items.push(createItem('Docs', { to: ROUTES.docs }))
    items.push(createItem(
      docId === 'new' ? 'Nova doc' : 'Documento',
      { current: true },
    ))
  } else if (normalized === ROUTES.calendar) {
    items.push(createItem('Calendário', { current: true }))
  } else {
    items.push(createItem('Página', { current: true }))
  }

  return { items }
}
