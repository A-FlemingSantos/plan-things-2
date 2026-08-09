import ReactMarkdown from 'react-markdown'
import { Link } from 'react-router-dom'
import rehypeSanitize from 'rehype-sanitize'
import remarkGfm from 'remark-gfm'
import DocsEmbedResults from './DocsEmbedResults.jsx'
import DocsCodeScroll from './DocsCodeScroll/DocsCodeScroll.jsx'
import { DOCS_EMBED_META } from './docsEmbedExtension.jsx'
import { sanitizeInternalAppRedirect } from '../../../shared/config/routes.js'
import { useAuthenticatedImageUrl } from '../../../shared/hooks/useAuthenticatedImageUrl.js'
import { documentIdFromHref } from '../utils/extractLinkedDocIds.js'
import { splitDocsEmbedMarkdown, youtubeEmbedUrl } from '../utils/docsEmbedMarkdown.js'

function resolveInternalDocsHref(href) {
  if (!href || !documentIdFromHref(href)) return null
  const candidate = href.trim()
  if (candidate.startsWith('/')) {
    return sanitizeInternalAppRedirect(candidate)
  }
  try {
    const url = new URL(candidate)
    return sanitizeInternalAppRedirect(`${url.pathname}${url.search}${url.hash}`)
  } catch {
    return null
  }
}

function MarkdownImage({ src, alt, styles }) {
  const resolvedSource = useAuthenticatedImageUrl(src)
  return (
    <figure className={styles.figure}>
      {resolvedSource ? <img className={styles.markdownImage} src={resolvedSource} alt={alt ?? ''} /> : null}
    </figure>
  )
}

function DocsEmbedReadView({ kind, mode, url, query, page, pageToken, styles }) {
  const embedKind = kind === 'video' ? 'video' : 'unsplash'
  const meta = DOCS_EMBED_META[embedKind]
  const Icon = meta.Icon

  if (mode === 'search' && query?.trim()) {
    return (
      <div className={styles.embedBlock} data-docs-embed={kind} data-docs-embed-mode="search">
        <div className={styles.embedSlot}>
          <span className={styles.embedSlotBadge}>
            <Icon size={14} aria-hidden="true" />
            <span>{meta.label}</span>
          </span>
          <span className={styles.embedSlotValue}>{query.trim()}</span>
        </div>
        <DocsEmbedResults
          kind={kind}
          query={query}
          page={page ?? 1}
          pageToken={pageToken ?? ''}
          styles={styles}
        />
      </div>
    )
  }

  if (!url?.trim()) return null

  if (kind === 'video') {
    const embedUrl = youtubeEmbedUrl(url.trim())
    if (embedUrl) {
      return (
        <figure className={styles.figure}>
          <div className={styles.figureMedia}>
            <iframe
              src={embedUrl}
              title="Vídeo do YouTube"
              loading="lazy"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </figure>
      )
    }
    return (
      <p className={styles.bodyText}>
        <a href={url.trim()} target="_blank" rel="noreferrer">{url.trim()}</a>
      </p>
    )
  }

  return <MarkdownImage src={url.trim()} alt="Imagem do Unsplash" styles={styles} />
}

function MarkdownChunk({ value, styles, allocateHeadingIndex }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeSanitize]}
      components={{
        h1: ({ children }) => {
          const index = allocateHeadingIndex()
          return <h1 id={`doc-heading-${index}`} data-doc-heading={index} className={styles.bodyHeading}>{children}</h1>
        },
        h2: ({ children }) => {
          const index = allocateHeadingIndex()
          return <h2 id={`doc-heading-${index}`} data-doc-heading={index} className={styles.bodyHeading}>{children}</h2>
        },
        h3: ({ children }) => {
          const index = allocateHeadingIndex()
          return <h3 id={`doc-heading-${index}`} data-doc-heading={index} className={styles.bodyHeading}>{children}</h3>
        },
        p: ({ children }) => <p className={styles.bodyText}>{children}</p>,
        a: ({ href, children }) => {
          const internalHref = resolveInternalDocsHref(href)
          if (internalHref) {
            return <Link to={internalHref}>{children}</Link>
          }
          return (
            <a href={href} target="_blank" rel="noreferrer">
              {children}
            </a>
          )
        },
        pre: ({ children }) => <DocsCodeScroll>{children}</DocsCodeScroll>,
        img: ({ src, alt }) => <MarkdownImage src={src} alt={alt} styles={styles} />,
      }}
    >
      {value}
    </ReactMarkdown>
  )
}

export default function MarkdownContent({ value, styles }) {
  const parts = splitDocsEmbedMarkdown(value)
  let nextHeadingIndex = 0
  const allocateHeadingIndex = () => {
    const index = nextHeadingIndex
    nextHeadingIndex += 1
    return index
  }

  return (
    <div className={styles.markdownContent}>
      {parts.map((part, index) => {
        if (part.type === 'embed') {
          return (
            <DocsEmbedReadView
              key={`embed-${index}`}
              kind={part.kind}
              mode={part.mode}
              url={part.url}
              query={part.query}
              page={part.page}
              pageToken={part.pageToken}
              styles={styles}
            />
          )
        }
        if (!part.content?.trim()) return null
        return (
          <MarkdownChunk
            key={`markdown-${index}`}
            value={part.content}
            styles={styles}
            allocateHeadingIndex={allocateHeadingIndex}
          />
        )
      })}
    </div>
  )
}
