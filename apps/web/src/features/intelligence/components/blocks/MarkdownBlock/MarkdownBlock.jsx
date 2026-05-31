import ReactMarkdown from 'react-markdown'
import { Streamdown } from 'streamdown'
import remarkGfm from 'remark-gfm'
import rehypeSanitize from 'rehype-sanitize'
import styles from './MarkdownBlock.module.css'

function shouldUseStreamdownRenderer() {
  const rawFlag = import.meta.env?.VITE_INTELLIGENCE_STREAMDOWN
  const normalized = String(rawFlag ?? '').trim().toLowerCase()
  return normalized === '1' || normalized === 'true' || normalized === 'yes' || normalized === 'on'
}

function ExternalLink({ href, children, ...props }) {
  return (
    <a
      {...props}
      href={href}
      target="_blank"
      rel="noopener noreferrer"
    >
      {children}
    </a>
  )
}

export default function MarkdownBlock({ markdown = '', isStreaming = false }) {
  const content = String(markdown ?? '')
  if (!content.trim()) return null

  return (
    <div className={styles.root} data-block-kind="markdown">
      {shouldUseStreamdownRenderer() ? (
        <Streamdown
          mode={isStreaming ? 'streaming' : 'static'}
          animated
          isAnimating={isStreaming}
          remend={{ linkMode: 'text-only' }}
          linkSafety={{ enabled: false }}
          components={{ a: ExternalLink }}
        >
          {content}
        </Streamdown>
      ) : (
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeSanitize]}
          components={{ a: ExternalLink }}
        >
          {content}
        </ReactMarkdown>
      )}
    </div>
  )
}
