export const ROUTES = {
  home: '/',
  login: '/login',
  register: '/cadastro',
  workspace: '/workspace',
  workspaceBoard: '/workspace/board',
  canvas: '/canvas',
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
  { from: '/workspace/canvas', to: ROUTES.canvas },
  { from: '/app/canvas', to: ROUTES.canvas },
  { from: '/workspace/calendar', to: ROUTES.calendar },
  { from: '/app/calendar', to: ROUTES.calendar },
  { from: '/workspace/files', to: ROUTES.files },
  { from: '/app/files', to: ROUTES.files },
]

export const LEGACY_PLAN_ROUTE_ALIASES = {
  board: ['/app/board/:planId', '/kanban/:planId'],
  canvas: ['/workspace/canvas/:planId', '/app/canvas/:planId'],
}

export function normalizePathname(pathname = '') {
  return pathname.replace(/\/+$/, '') || '/'
}

export function buildWorkspaceBoardPath(planId) {
  return planId ? `${ROUTES.workspaceBoard}/${planId}` : ROUTES.workspaceBoard
}

export function buildCanvasPath(planId) {
  return planId ? `${ROUTES.canvas}/${planId}` : ROUTES.canvas
}
