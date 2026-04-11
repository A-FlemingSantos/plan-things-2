import { ROUTES, normalizePathname } from './routes.js'

export const WORKSPACE_NAV_ITEMS = [
  { id: 'home', label: 'Início', path: ROUTES.workspace },
  { id: 'canvas', label: 'Canvas', path: ROUTES.canvas },
  { id: 'calendar', label: 'Calendário', path: ROUTES.calendar },
  { id: 'files', label: 'Arquivos', path: ROUTES.files },
]

export const WORKSPACE_NAV_PATHS = Object.fromEntries(
  WORKSPACE_NAV_ITEMS.filter((item) => item.path).map((item) => [item.id, item.path]),
)

export function getActiveWorkspaceNav(pathname) {
  const normalizedPath = normalizePathname(pathname)

  if (normalizedPath === ROUTES.canvas || normalizedPath.startsWith(`${ROUTES.canvas}/`)) {
    return 'canvas'
  }

  if (normalizedPath === ROUTES.calendar || normalizedPath.startsWith(`${ROUTES.calendar}/`)) {
    return 'calendar'
  }

  if (normalizedPath === ROUTES.files || normalizedPath.startsWith(`${ROUTES.files}/`)) {
    return 'files'
  }

  return 'home'
}
