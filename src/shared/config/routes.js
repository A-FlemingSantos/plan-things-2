export const ROUTES = {
  home: '/',
  login: '/login',
  register: '/cadastro',
  workspace: '/workspace',
  workspaceBoard: '/workspace/board',
  canvas: '/canvas',
  files: '/files',
  forgot: '/forgot',
  help: '/help',
  privacy: '/privacy',
  terms: '/terms',
}

export const ROUTE_ALIASES = [
  { from: '/app', to: ROUTES.workspace },
  { from: '/app/board', to: ROUTES.workspaceBoard },
  { from: '/kanban', to: ROUTES.workspaceBoard },
  { from: '/kanban/*', to: ROUTES.workspaceBoard },
  { from: '/workspace/canvas', to: ROUTES.canvas },
  { from: '/app/canvas', to: ROUTES.canvas },
  { from: '/workspace/files', to: ROUTES.files },
  { from: '/app/files', to: ROUTES.files },
]

export function normalizePathname(pathname = '') {
  return pathname.replace(/\/+$/, '') || '/'
}

export function buildWorkspaceBoardPath(planId) {
  return planId ? `${ROUTES.workspaceBoard}/${planId}` : ROUTES.workspaceBoard
}

export function buildCanvasPath(planId) {
  return planId ? `${ROUTES.canvas}/${planId}` : ROUTES.canvas
}
