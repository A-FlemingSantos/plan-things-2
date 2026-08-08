export const DOCS_EMBED_PATTERN = /\[\[embed:(unsplash|video):([^\]]*)\]\]/g

export function normalizeDocsEmbedMarkdown(markdown = '') {
  return markdown
    .replace(/^\[Unsplash\]\s*url\s*$/gm, '[[embed:unsplash:]]')
    .replace(/^\[Vídeo\]\s*url\s*$/gm, '[[embed:video:]]')
    .replace(/^\[Unsplash\]\s*(.*)$/gm, (_, url) => `[[embed:unsplash:${url.trim()}]]`)
    .replace(/^\[Vídeo\]\s*(.*)$/gm, (_, url) => `[[embed:video:${url.trim()}]]`)
}

export function splitDocsEmbedMarkdown(markdown = '') {
  const normalized = normalizeDocsEmbedMarkdown(markdown)
  const parts = []
  let lastIndex = 0

  for (const match of normalized.matchAll(DOCS_EMBED_PATTERN)) {
    if (match.index > lastIndex) {
      parts.push({ type: 'markdown', content: normalized.slice(lastIndex, match.index) })
    }
    parts.push({ type: 'embed', kind: match[1], url: match[2] })
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
