import { findDocById } from '../data/docsContent.js'
import { buildDocsPath, normalizePathname, ROUTES } from '../../../shared/config/routes.js'

const LAST_DOCS_ROUTE_KEY = 'plan-things:last-docs-route:v1'

function isDocsPath(pathname) {
  const normalized = normalizePathname(pathname ?? '')
  return normalized === ROUTES.docs || normalized.startsWith(`${ROUTES.docs}/`)
}

export function rememberDocsRoute(pathname) {
  if (typeof window === 'undefined') return
  if (!isDocsPath(pathname)) return

  window.localStorage.setItem(LAST_DOCS_ROUTE_KEY, normalizePathname(pathname))
}

export function resolveDocsDockPath() {
  if (typeof window === 'undefined') return ROUTES.docs

  const raw = window.localStorage.getItem(LAST_DOCS_ROUTE_KEY)
  if (!raw) return ROUTES.docs

  const normalized = normalizePathname(raw)
  if (normalized === ROUTES.docs) return ROUTES.docs

  if (normalized.startsWith(`${ROUTES.docs}/`)) {
    const docId = normalized.slice(`${ROUTES.docs}/`.length).split('/')[0]
    if (docId && findDocById(docId)) {
      return buildDocsPath(docId)
    }
  }

  return ROUTES.docs
}
