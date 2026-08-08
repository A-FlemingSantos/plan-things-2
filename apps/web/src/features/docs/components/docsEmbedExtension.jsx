import { useEffect, useRef } from 'react'
import { Node } from '@tiptap/core'
import { NodeViewWrapper, ReactNodeViewRenderer } from '@tiptap/react'

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
    placeholder: 'Cole a URL do Unsplash...',
  },
  video: {
    label: 'YouTube',
    Icon: YouTubeLogo,
    placeholder: 'Cole a URL do YouTube...',
  },
}

function DocsEmbedView({ node, updateAttributes, extension }) {
  const inputRef = useRef(null)
  const kind = node.attrs.kind === 'video' ? 'video' : 'unsplash'
  const meta = EMBED_META[kind]
  const Icon = meta.Icon
  const { styles } = extension.options

  useEffect(() => {
    if (!node.attrs.url) {
      requestAnimationFrame(() => inputRef.current?.focus())
    }
  }, [node.attrs.url])

  return (
    <NodeViewWrapper className={styles.embedSlot} data-docs-embed={kind}>
      <span className={styles.embedSlotBadge} contentEditable={false}>
        <Icon size={14} aria-hidden="true" />
        <span>{meta.label}</span>
      </span>
      <input
        ref={inputRef}
        className={styles.embedSlotUrl}
        type="url"
        value={node.attrs.url ?? ''}
        placeholder={meta.placeholder}
        aria-label={meta.placeholder}
        onChange={(event) => updateAttributes({ url: event.target.value })}
        onKeyDown={(event) => event.stopPropagation()}
      />
    </NodeViewWrapper>
  )
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
      }
    },

    parseHTML() {
      return [{
        tag: 'div[data-docs-embed]',
        getAttrs: (element) => ({
          kind: element.getAttribute('data-docs-embed') === 'video' ? 'video' : 'unsplash',
          url: element.getAttribute('data-url') ?? '',
        }),
      }]
    },

    renderHTML({ node, HTMLAttributes }) {
      return ['div', {
        ...HTMLAttributes,
        'data-docs-embed': node.attrs.kind === 'video' ? 'video' : 'unsplash',
        'data-url': node.attrs.url ?? '',
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
        const match = /^\[\[embed:(unsplash|video):([^\]]*)\]\]/.exec(src)
        if (!match) return undefined
        return {
          type: 'docsEmbed',
          raw: match[0],
          embedKind: match[1],
          url: match[2],
        }
      },
    },

    parseMarkdown: (token) => ({
      type: 'docsEmbed',
      attrs: {
        kind: token.embedKind === 'video' ? 'video' : 'unsplash',
        url: token.url ?? '',
      },
    }),

    renderMarkdown: (node) => {
      const kind = node.attrs?.kind === 'video' ? 'video' : 'unsplash'
      const url = node.attrs?.url ?? ''
      return `[[embed:${kind}:${url}]]`
    },
  })
}
