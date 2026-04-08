import { ROUTES, normalizePathname } from './routes.js'

export const WORKSPACE_NAV_ITEMS = [
  { id: 'home', label: 'Home', path: ROUTES.workspace },
  { id: 'canvas', label: 'Canvas', path: ROUTES.canvas },
  { id: 'files', label: 'Files', path: ROUTES.files },
]

export const WORKSPACE_NAV_PATHS = Object.fromEntries(
  WORKSPACE_NAV_ITEMS.filter((item) => item.path).map((item) => [item.id, item.path]),
)

export function getActiveWorkspaceNav(pathname) {
  const normalizedPath = normalizePathname(pathname)

  if (normalizedPath === ROUTES.canvas || normalizedPath.startsWith(`${ROUTES.canvas}/`)) {
    return 'canvas'
  }

  if (normalizedPath === ROUTES.files || normalizedPath.startsWith(`${ROUTES.files}/`)) {
    return 'files'
  }

  return 'home'
}
