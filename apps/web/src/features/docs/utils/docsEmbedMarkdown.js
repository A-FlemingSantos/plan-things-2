export const DOCS_EMBED_PATTERN = /\[\[embed:(unsplash|video)(?:\?([^\]]*))?\]\]|\[\[embed:(unsplash|video):([^\]]*)\]\]/g

export function parseEmbedPayload(kind, queryString, legacyValue) {
  if (queryString) {
    const params = new URLSearchParams(queryString)
    if (params.has('url')) {
      return {
        kind,
        mode: 'selected',
        url: params.get('url') ?? '',
        query: '',
        page: 1,
        pageToken: '',
      }
    }
    if (params.has('q')) {
      return {
        kind,
        mode: 'search',
        url: '',
        query: params.get('q') ?? '',
        page: Math.max(parseInt(params.get('page') ?? '1', 10) || 1, 1),
        pageToken: params.get('pageToken') ?? '',
      }
    }
  }

  const legacy = (legacyValue ?? '').trim()
  if (!legacy) {
    return { kind, mode: 'input', url: '', query: '', page: 1, pageToken: '' }
  }
  if (legacy.startsWith('http://') || legacy.startsWith('https://')) {
    return { kind, mode: 'selected', url: legacy, query: '', page: 1, pageToken: '' }
  }

  return { kind, mode: 'search', url: '', query: legacy, page: 1, pageToken: '' }
}

export function serializeEmbedPayload({ kind, url, query, page, pageToken }) {
  const embedKind = kind === 'video' ? 'video' : 'unsplash'
  if (url?.trim()) {
    return `[[embed:${embedKind}?url=${encodeURIComponent(url.trim())}]]`
  }
  if (query?.trim()) {
    const params = new URLSearchParams({ q: query.trim() })
    if (embedKind === 'video') {
      if (pageToken?.trim()) params.set('pageToken', pageToken.trim())
    } else {
      params.set('page', String(Math.max(page ?? 1, 1)))
    }
    return `[[embed:${embedKind}?${params.toString()}]]`
  }
  return `[[embed:${embedKind}]]`
}

export function normalizeDocsEmbedMarkdown(markdown = '') {
  return markdown
    .replace(/^\[Unsplash\]\s*url\s*$/gm, '[[embed:unsplash]]')
    .replace(/^\[Vídeo\]\s*url\s*$/gm, '[[embed:video]]')
    .replace(/^\[Unsplash\]\s*(.*)$/gm, (_, value) => serializeEmbedPayload({
      kind: 'unsplash',
      url: value.trim().startsWith('http') ? value.trim() : '',
      query: value.trim().startsWith('http') ? '' : value.trim(),
      page: 1,
      pageToken: '',
    }))
    .replace(/^\[Vídeo\]\s*(.*)$/gm, (_, value) => serializeEmbedPayload({
      kind: 'video',
      url: value.trim().startsWith('http') ? value.trim() : '',
      query: value.trim().startsWith('http') ? '' : value.trim(),
      page: 1,
      pageToken: '',
    }))
}

export function splitDocsEmbedMarkdown(markdown = '') {
  const normalized = normalizeDocsEmbedMarkdown(markdown)
  const parts = []
  let lastIndex = 0

  for (const match of normalized.matchAll(DOCS_EMBED_PATTERN)) {
    if (match.index > lastIndex) {
      parts.push({ type: 'markdown', content: normalized.slice(lastIndex, match.index) })
    }

    const kind = match[1] ?? match[3]
    const payload = parseEmbedPayload(kind, match[2], match[4])
    parts.push({ type: 'embed', ...payload })
    lastIndex = match.index + match[0].length
  }

  if (lastIndex < normalized.length) {
    parts.push({ type: 'markdown', content: normalized.slice(lastIndex) })
  }

  if (parts.length === 0) {
    parts.push({ type: 'markdown', content: normalized })
  }

  return parts
}

export function youtubeEmbedUrl(url = '') {
  try {
    const parsed = new URL(url)
    const host = parsed.hostname.replace(/^www\./, '')
    if (host === 'youtu.be') {
      const id = parsed.pathname.slice(1)
      return id ? `https://www.youtube.com/embed/${id}` : null
    }
    if (host === 'youtube.com' || host === 'm.youtube.com') {
      const id = parsed.searchParams.get('v')
      return id ? `https://www.youtube.com/embed/${id}` : null
    }
  } catch {
    return null
  }
  return null
}

export function formatEmbedResultCount(total) {
  const safeTotal = Number.isFinite(total) ? total : 0
  return `${safeTotal} result${safeTotal === 1 ? '' : 's'}`
}
