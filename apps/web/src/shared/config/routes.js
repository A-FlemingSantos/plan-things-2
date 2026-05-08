export const ROUTES = {
  home: '/',
  login: '/login',
  register: '/cadastro',
  oauthCallback: '/oauth/callback',
  workspace: '/workspace',
  workspaceBoard: '/workspace/board',
  calendar: '/calendar',
  files: '/files',
  settings: '/settings',
  forgot: '/forgot',
  reset: '/reset',
  help: '/help',
  privacy: '/privacy',
  terms: '/terms',
}

export const ROUTE_ALIASES = [
  { from: '/app/board', to: ROUTES.workspaceBoard },
  { from: '/kanban', to: ROUTES.workspaceBoard },
  { from: '/workspace/calendar', to: ROUTES.calendar },
  { from: '/app/calendar', to: ROUTES.calendar },
  { from: '/workspace/files', to: ROUTES.files },
  { from: '/app/files', to: ROUTES.files },
]

export const LEGACY_PLAN_ROUTE_ALIASES = {
  board: ['/app/board/:planId', '/kanban/:planId'],
}

export function normalizePathname(pathname = '') {
  return pathname.replace(/\/+$/, '') || '/'
}

export function buildWorkspaceBoardPath(planId) {
  return planId ? `${ROUTES.workspaceBoard}/${planId}` : ROUTES.workspaceBoard
}
