import ReactMarkdown from 'react-markdown'
import rehypeSanitize from 'rehype-sanitize'
import remarkGfm from 'remark-gfm'
import DocsEmbedResults from './DocsEmbedResults.jsx'
import { DOCS_EMBED_META } from './docsEmbedExtension.jsx'
import { useAuthenticatedImageUrl } from '../../../shared/hooks/useAuthenticatedImageUrl.js'
import { splitDocsEmbedMarkdown, youtubeEmbedUrl } from '../utils/docsEmbedMarkdown.js'

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

function MarkdownChunk({ value, styles }) {
  let headingIndex = 0

  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeSanitize]}
      components={{
        h1: ({ children }) => {
          const index = headingIndex
          headingIndex += 1
          return <h1 id={`doc-heading-${index}`} data-doc-heading={index} className={styles.bodyHeading}>{children}</h1>
        },
        h2: ({ children }) => {
          const index = headingIndex
          headingIndex += 1
          return <h2 id={`doc-heading-${index}`} data-doc-heading={index} className={styles.bodyHeading}>{children}</h2>
        },
        h3: ({ children }) => {
          const index = headingIndex
          headingIndex += 1
          return <h3 id={`doc-heading-${index}`} data-doc-heading={index} className={styles.bodyHeading}>{children}</h3>
        },
        p: ({ children }) => <p className={styles.bodyText}>{children}</p>,
        a: ({ href, children }) => (
          <a href={href} target="_blank" rel="noreferrer">
            {children}
          </a>
        ),
        img: ({ src, alt }) => <MarkdownImage src={src} alt={alt} styles={styles} />,
      }}
    >
      {value}
    </ReactMarkdown>
  )
}

export default function MarkdownContent({ value, styles }) {
  const parts = splitDocsEmbedMarkdown(value)

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
        return <MarkdownChunk key={`markdown-${index}`} value={part.content} styles={styles} />
      })}
    </div>
  )
}
