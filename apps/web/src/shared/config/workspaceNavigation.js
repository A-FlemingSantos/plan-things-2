import { ROUTES, normalizePathname } from './routes.js'

export const WORKSPACE_PRIMARY_NAV_ITEMS = [
  { id: 'home', label: 'Início' },
  { id: 'teams', label: 'Teams' },
  { id: 'templates', label: 'Templates' },
  { id: 'inbox', label: 'Inbox' },
  { id: 'library', label: 'Biblioteca' },
]

export const WORKSPACE_SETTINGS_NAV_ITEM = {
  id: 'settings',
  label: 'Configurações',
}

export function getActiveWorkspaceNav(pathname, search = '') {
  const normalized = normalizePathname(pathname)
  const params = new URLSearchParams(search)

  if (normalized === ROUTES.settings || normalized.startsWith(`${ROUTES.settings}/`)) {
    if (params.get('section') === 'workspace') {
      return 'teams'
    }
    return 'settings'
  }

  if (normalized === ROUTES.workspaceBoard || normalized.startsWith(`${ROUTES.workspaceBoard}/`)) {
    return 'inbox'
  }

  if (normalized === ROUTES.workspace || normalized.startsWith(`${ROUTES.workspace}/`)) {
    if (params.has('file')) {
      return 'library'
    }
    return 'home'
  }

  if (normalized === ROUTES.workspaceChat || normalized.startsWith(`${ROUTES.workspaceChat}/`)) {
    return 'home'
  }

  return null
}
