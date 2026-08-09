import { documentIdFromHref } from './extractLinkedDocIds.js'

const MAX_SUMMARY_LENGTH = 42

function truncateSummary(text) {
  const value = String(text ?? '').trim()
  if (!value) return ''
  if (value.length <= MAX_SUMMARY_LENGTH) return value
  return `${value.slice(0, MAX_SUMMARY_LENGTH - 1)}…`
}

/**
 * Friendly label for a link href: document title when known, else a short URL summary.
 * @param {string} href
 * @param {{ documents?: Array<{ id: string, title?: string }> }} [options]
 */
export function summarizeLinkHref(href, { documents = [] } = {}) {
  if (!href || typeof href !== 'string') return ''

  const trimmed = href.trim()
  if (!trimmed) return ''

  const docId = documentIdFromHref(trimmed)
  if (docId) {
    const document = documents.find((item) => item.id === docId)
    const title = document?.title?.trim()
    return title || 'Documento'
  }

  try {
    const absolute = /^https?:\/\//i.test(trimmed)
      ? trimmed
      : trimmed.startsWith('//')
        ? `https:${trimmed}`
        : trimmed.startsWith('/')
          ? trimmed
          : `https://${trimmed}`

    if (absolute.startsWith('/')) {
      return truncateSummary(absolute)
    }

    const url = new URL(absolute)
    const host = url.hostname.replace(/^www\./, '')
    const path = url.pathname === '/' ? '' : url.pathname
    const query = url.search ? '…' : ''
    return truncateSummary(`${host}${path}${query}`) || trimmed
  } catch {
    return truncateSummary(trimmed)
  }
}
