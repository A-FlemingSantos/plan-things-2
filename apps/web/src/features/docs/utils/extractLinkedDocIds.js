import { normalizePathname, ROUTES } from '../../../shared/config/routes.js'

const DOCUMENT_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const MARKDOWN_LINK_HREF = /\[[^\]]*\]\(([^)\n]+)\)/g
const ANGLE_URL = /<(https?:\/\/[^>\s]+|\/docs\/[^>\s]+)>/gi
const BARE_DOCS_PATH = /(?:^|[\s(])(\/docs\/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})\b/gi
const EMBED_BLOCK = /\[\[embed:[^\]]*\]\]/g

function isDocumentId(value) {
  return DOCUMENT_ID_PATTERN.test(value)
}

function normalizeHrefCandidate(raw) {
  if (!raw || typeof raw !== 'string') return null
  let href = raw.trim()
  if (!href) return null
  if (href.startsWith('<') && href.endsWith('>')) {
    href = href.slice(1, -1).trim()
  }
  // Drop optional title: url "Title"
  const spaced = href.match(/^(\S+)(?:\s+"[^"]*")?$/)
  if (spaced) href = spaced[1]
  return href || null
}

export function documentIdFromHref(href) {
  const normalizedHref = normalizeHrefCandidate(href)
  if (!normalizedHref || normalizedHref.startsWith('/api/files/')) return null

  let pathname = normalizedHref
  try {
    if (/^https?:\/\//i.test(normalizedHref)) {
      pathname = new URL(normalizedHref).pathname
    } else if (normalizedHref.startsWith('//')) {
      pathname = new URL(`https:${normalizedHref}`).pathname
    }
  } catch {
    return null
  }

  const normalized = normalizePathname(pathname)
  if (!normalized.startsWith(`${ROUTES.docs}/`)) return null

  const docId = normalized.slice(`${ROUTES.docs}/`.length).split('/')[0]
  return isDocumentId(docId) ? docId : null
}

function collectMatches(text, regex, hrefFromMatch) {
  const found = []
  for (const match of text.matchAll(regex)) {
    const id = documentIdFromHref(hrefFromMatch(match))
    if (!id) continue
    found.push({ index: match.index ?? 0, id })
  }
  return found
}

/**
 * Collect unique document IDs linked from markdown, in first-seen order.
 * @param {string} [contentMarkdown]
 * @param {{ excludeDocumentId?: string | null }} [options]
 */
export function extractLinkedDocIds(contentMarkdown = '', { excludeDocumentId = null } = {}) {
  if (!contentMarkdown) return []

  const withoutEmbeds = contentMarkdown.replace(EMBED_BLOCK, ' ')
  const hits = [
    ...collectMatches(withoutEmbeds, MARKDOWN_LINK_HREF, (match) => match[1]),
    ...collectMatches(withoutEmbeds, ANGLE_URL, (match) => match[1]),
    ...collectMatches(withoutEmbeds, BARE_DOCS_PATH, (match) => match[1]),
  ].sort((left, right) => left.index - right.index)

  const ids = []
  const seen = new Set()
  for (const { id } of hits) {
    if (!id || id === excludeDocumentId || seen.has(id)) continue
    seen.add(id)
    ids.push(id)
  }
  return ids
}
