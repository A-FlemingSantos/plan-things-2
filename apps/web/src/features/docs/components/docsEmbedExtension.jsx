import { useEffect, useRef, useState } from 'react'
import { Node } from '@tiptap/core'
import { NodeViewWrapper, ReactNodeViewRenderer } from '@tiptap/react'
import DocsEmbedResults from './DocsEmbedResults.jsx'
import { serializeEmbedPayload, youtubeEmbedUrl } from '../utils/docsEmbedMarkdown.js'

export function UnsplashLogo({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="currentColor" aria-hidden="true">
      <path d="M10 9V0h12v9H10zm12 5h10v18H0V14h10v9h12v-9z" />
    </svg>
  )
}

export function YouTubeLogo({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#FF0000"
        d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814z"
      />
      <path fill="#FFFFFF" d="M9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  )
}

const EMBED_META = {
  unsplash: {
    label: 'Unsplash',
    Icon: UnsplashLogo,
    placeholder: 'Buscar imagens...',
  },
  video: {
    label: 'YouTube',
    Icon: YouTubeLogo,
    placeholder: 'Buscar vídeos...',
  },
}

export { EMBED_META as DOCS_EMBED_META }

function DocsEmbedView({ node, updateAttributes, extension, deleteNode, editor }) {
  const inputRef = useRef(null)
  const kind = node.attrs.kind === 'video' ? 'video' : 'unsplash'
  const meta = EMBED_META[kind]
  const Icon = meta.Icon
  const { styles } = extension.options
  const [draft, setDraft] = useState(() => node.attrs.query ?? '')

  const hasSelection = Boolean(node.attrs.url?.trim())
  const hasSearch = Boolean(node.attrs.query?.trim()) && !hasSelection

  useEffect(() => {
    setDraft(node.attrs.query ?? '')
  }, [node.attrs.query])

  useEffect(() => {
    if (!hasSelection) {
      requestAnimationFrame(() => inputRef.current?.focus())
    }
  }, [hasSelection, hasSearch])

  const cancelEmbed = () => {
    deleteNode()
    editor?.commands.focus()
  }

  const submitSearch = (value = draft) => {
    const query = value.trim()
    if (!query) return
    updateAttributes({
      query,
      url: '',
      page: 1,
      pageToken: '',
    })
  }

  const handleQueryKeyDown = (event) => {
    event.stopPropagation()
    const value = event.currentTarget.value

    if (event.key === 'Enter') {
      event.preventDefault()
      submitSearch(value)
      return
    }

    if (event.key === 'Escape') {
      event.preventDefault()
      cancelEmbed()
      return
    }

    if (event.key === 'Backspace' && !value) {
      event.preventDefault()
      cancelEmbed()
    }
  }

  const handleSelect = (url) => {
    updateAttributes({
      url,
      query: '',
      page: 1,
      pageToken: '',
    })
  }

  const handleNextPage = (nextToken = '') => {
    if (kind === 'video') {
      if (!nextToken) return
      updateAttributes({ pageToken: nextToken })
      return
    }
    updateAttributes({ page: (node.attrs.page ?? 1) + 1 })
  }

  if (hasSelection) {
    return (
      <NodeViewWrapper className={styles.embedBlock} data-docs-embed={kind} data-docs-embed-mode="selected">
        <div className={styles.embedSelectedPreview} contentEditable={false}>
          {kind === 'video' ? (
            <div className={styles.figureMedia}>
              <iframe
                src={youtubeEmbedUrl(node.attrs.url) ?? node.attrs.url}
                title="Vídeo do YouTube"
                loading="lazy"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          ) : (
            <img className={styles.embedSelectedImage} src={node.attrs.url} alt="" />
          )}
        </div>
      </NodeViewWrapper>
    )
  }

  if (hasSearch || !hasSelection) {
    return (
      <NodeViewWrapper
        className={styles.embedBlock}
        data-docs-embed={kind}
        data-docs-embed-mode={hasSearch ? 'search' : 'input'}
      >
        <div className={styles.embedSlot} contentEditable={false}>
          <span className={styles.embedSlotBadge}>
            <Icon size={14} aria-hidden="true" />
            <span>{meta.label}</span>
          </span>
          <input
            ref={inputRef}
            className={styles.embedSlotUrl}
            type="text"
            value={draft}
            placeholder={meta.placeholder}
            aria-label={`Buscar em ${meta.label}`}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={handleQueryKeyDown}
          />
        </div>
        {hasSearch ? (
          <DocsEmbedResults
            kind={kind}
            query={node.attrs.query}
            page={node.attrs.page ?? 1}
            pageToken={node.attrs.pageToken ?? ''}
            styles={styles}
            interactive
            onSelect={handleSelect}
            onNextPage={handleNextPage}
          />
        ) : null}
      </NodeViewWrapper>
    )
  }

  return null
}

export function createDocsEmbedExtension(styles) {
  return Node.create({
    name: 'docsEmbed',
    group: 'block',
    atom: true,
    selectable: true,

    addOptions() {
      return { styles }
    },

    addAttributes() {
      return {
        kind: { default: 'unsplash' },
        url: { default: '' },
        query: { default: '' },
        page: { default: 1 },
        pageToken: { default: '' },
      }
    },

    parseHTML() {
      return [{
        tag: 'div[data-docs-embed]',
        getAttrs: (element) => ({
          kind: element.getAttribute('data-docs-embed') === 'video' ? 'video' : 'unsplash',
          url: element.getAttribute('data-url') ?? '',
          query: element.getAttribute('data-query') ?? '',
          page: parseInt(element.getAttribute('data-page') ?? '1', 10) || 1,
          pageToken: element.getAttribute('data-page-token') ?? '',
        }),
      }]
    },

    renderHTML({ node, HTMLAttributes }) {
      return ['div', {
        ...HTMLAttributes,
        'data-docs-embed': node.attrs.kind === 'video' ? 'video' : 'unsplash',
        'data-url': node.attrs.url ?? '',
        'data-query': node.attrs.query ?? '',
        'data-page': String(node.attrs.page ?? 1),
        'data-page-token': node.attrs.pageToken ?? '',
      }]
    },

    addNodeView() {
      return ReactNodeViewRenderer(DocsEmbedView)
    },

    markdownTokenizer: {
      name: 'docsEmbed',
      level: 'block',
      start: (src) => {
        const index = src.indexOf('[[embed:')
        return index === -1 ? undefined : index
      },
      tokenize: (src) => {
        const match = /^\[\[embed:(unsplash|video)(?:\?([^\]]*))?\]\]|\[\[embed:(unsplash|video):([^\]]*)\]\]/.exec(src)
        if (!match) return undefined

        const kind = match[1] ?? match[3]
        const queryString = match[2]
        const legacyValue = match[4]

        let url = ''
        let query = ''
        let page = 1
        let pageToken = ''

        if (queryString) {
          const params = new URLSearchParams(queryString)
          url = params.get('url') ?? ''
          query = params.get('q') ?? ''
          page = Math.max(parseInt(params.get('page') ?? '1', 10) || 1, 1)
          pageToken = params.get('pageToken') ?? ''
        } else if (legacyValue?.trim()) {
          if (legacyValue.trim().startsWith('http')) {
            url = legacyValue.trim()
          } else {
            query = legacyValue.trim()
          }
        }

        return {
          type: 'docsEmbed',
          raw: match[0],
          embedKind: kind,
          url,
          query,
          page,
          pageToken,
        }
      },
    },

    parseMarkdown: (token) => ({
      type: 'docsEmbed',
      attrs: {
        kind: token.embedKind === 'video' ? 'video' : 'unsplash',
        url: token.url ?? '',
        query: token.query ?? '',
        page: token.page ?? 1,
        pageToken: token.pageToken ?? '',
      },
    }),

    renderMarkdown: (node) => serializeEmbedPayload({
      kind: node.attrs?.kind === 'video' ? 'video' : 'unsplash',
      url: node.attrs?.url ?? '',
      query: node.attrs?.query ?? '',
      page: node.attrs?.page ?? 1,
      pageToken: node.attrs?.pageToken ?? '',
    }),
  })
}
