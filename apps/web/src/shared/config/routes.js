export const ROUTES = {
  home: '/',
  login: '/login',
  register: '/cadastro',
  oauthCallback: '/oauth/callback',
  workspace: '/workspace',
  workspaceBoard: '/workspace/board',
  workspaceChat: '/workspace/chat',
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
  { from: '/workspace/files', to: ROUTES.workspace },
  { from: '/app/files', to: ROUTES.workspace },
]

export const LEGACY_PLAN_ROUTE_ALIASES = {
  board: ['/app/board/:planId', '/kanban/:planId'],
}

export function normalizePathname(pathname = '') {
  return pathname.replace(/\/+$/, '') || '/'
}

export function isLegacyFilesPath(pathname) {
  const normalized = normalizePathname(pathname ?? '')
  return (
    normalized === ROUTES.files
    || normalized.startsWith(`${ROUTES.files}/`)
    || normalized === '/workspace/files'
    || normalized.startsWith('/workspace/files/')
    || normalized === '/app/files'
    || normalized.startsWith('/app/files/')
  )
}

export function normalizeLegacyFilesPath(pathname) {
  return isLegacyFilesPath(pathname) ? ROUTES.workspace : normalizePathname(pathname ?? '')
}

export function isInternalAppPath(pathname) {
  const normalized = normalizePathname(pathname ?? '')

  if (!normalized) return false

  if (normalized === '/app') return true

  const internalBases = [
    ROUTES.workspace,
    ROUTES.workspaceBoard,
    ROUTES.calendar,
    ROUTES.settings,
  ]

  for (const base of internalBases) {
    if (normalized === base || normalized.startsWith(`${base}/`)) return true
  }

  for (const { from } of ROUTE_ALIASES) {
    const aliasPath = normalizePathname(from)
    if (normalized === aliasPath || normalized.startsWith(`${aliasPath}/`)) return true
  }

  const legacyPrefixes = [
    ...LEGACY_PLAN_ROUTE_ALIASES.board,
  ]
    .map((pattern) => pattern.replace('/:planId', ''))
    .map((path) => normalizePathname(path))

  for (const prefix of legacyPrefixes) {
    if (normalized === prefix || normalized.startsWith(`${prefix}/`)) return true
  }

  return false
}

export function sanitizeInternalAppRedirect(value) {
  if (!value) return null

  const text = String(value).trim()
  if (!text.startsWith('/') || text.startsWith('//') || text.includes('://')) {
    return null
  }

  try {
    const url = new URL(text, 'https://planthings.local')
    const rawPathname = normalizePathname(url.pathname)
    const pathname = normalizeLegacyFilesPath(rawPathname)
    if (!isInternalAppPath(pathname)) {
      return null
    }

    if (pathname !== rawPathname) {
      return pathname
    }

    return `${pathname}${url.search}${url.hash}`
  } catch {
    return null
  }
}

export function toRouteLocation(value) {
  const sanitized = sanitizeInternalAppRedirect(value)
  if (!sanitized) return null

  const url = new URL(sanitized, 'https://planthings.local')
  return {
    pathname: normalizePathname(url.pathname),
    search: url.search,
    hash: url.hash,
  }
}

export function toRouteString(location) {
  if (!location?.pathname) return null

  return sanitizeInternalAppRedirect(
    `${location.pathname}${location.search ?? ''}${location.hash ?? ''}`,
  )
}

export function buildWorkspaceBoardPath(planId) {
  return planId ? `${ROUTES.workspaceBoard}/${planId}` : ROUTES.workspaceBoard
}

export function buildWorkspaceBoardCardPath(planId, cardId) {
  if (!planId || !cardId) return buildWorkspaceBoardPath(planId)
  return `${buildWorkspaceBoardPath(planId)}?card=${cardId}`
}

export function buildWorkspaceChatPath(conversationId) {
  return conversationId ? `${ROUTES.workspaceChat}/${conversationId}` : ROUTES.workspaceChat
}

export function buildWorkspaceFilePath(fileId) {
  if (!fileId) return ROUTES.workspace
  return `${ROUTES.workspace}?file=${fileId}`
}
