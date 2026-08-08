import { buildDocsPath, normalizePathname, ROUTES } from '../../../shared/config/routes.js'

const LAST_DOCS_ROUTE_KEY = 'plan-things:last-docs-route:v1'
const DOCUMENT_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function isDocsPath(pathname) {
  const normalized = normalizePathname(pathname ?? '')
  return normalized === ROUTES.docs || normalized.startsWith(`${ROUTES.docs}/`)
}

function isDocumentId(value) {
  return DOCUMENT_ID_PATTERN.test(value)
}

function documentIdFromPath(pathname) {
  if (!pathname.startsWith(`${ROUTES.docs}/`)) return null

  const docId = pathname.slice(`${ROUTES.docs}/`.length).split('/')[0]
  return isDocumentId(docId) ? docId : null
}

export function rememberDocsRoute(pathname) {
  if (typeof window === 'undefined') return
  if (!isDocsPath(pathname)) return

  const normalized = normalizePathname(pathname)
  if (normalized === ROUTES.docs || documentIdFromPath(normalized)) {
    window.localStorage.setItem(LAST_DOCS_ROUTE_KEY, normalized)
    return
  }

  window.localStorage.removeItem(LAST_DOCS_ROUTE_KEY)
}

export function resolveDocsDockPath() {
  if (typeof window === 'undefined') return ROUTES.docs

  const raw = window.localStorage.getItem(LAST_DOCS_ROUTE_KEY)
  if (!raw) return ROUTES.docs

  const normalized = normalizePathname(raw)
  if (normalized === ROUTES.docs) {
    return normalized
  }

  const docId = documentIdFromPath(normalized)
  if (docId) {
    return buildDocsPath(docId)
  }

  window.localStorage.removeItem(LAST_DOCS_ROUTE_KEY)
  return ROUTES.docs
}
