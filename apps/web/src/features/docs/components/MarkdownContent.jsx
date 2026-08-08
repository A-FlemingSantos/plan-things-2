import ReactMarkdown from 'react-markdown'
import rehypeSanitize from 'rehype-sanitize'
import remarkGfm from 'remark-gfm'
import { useAuthenticatedImageUrl } from '../../../shared/hooks/useAuthenticatedImageUrl.js'

function MarkdownImage({ src, alt, styles }) {
  const resolvedSource = useAuthenticatedImageUrl(src)
  return (
    <figure className={styles.figure}>
      {resolvedSource ? <img className={styles.markdownImage} src={resolvedSource} alt={alt ?? ''} /> : null}
    </figure>
  )
}

export default function MarkdownContent({ value, styles }) {
  return (
    <div className={styles.markdownContent}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeSanitize]}
        components={{
          h1: ({ children }) => <h1 className={styles.bodyHeading}>{children}</h1>,
          h2: ({ children }) => <h2 className={styles.bodyHeading}>{children}</h2>,
          p: ({ children }) => <p className={styles.bodyText}>{children}</p>,
          img: ({ src, alt }) => <MarkdownImage src={src} alt={alt} styles={styles} />,
        }}
      >
        {value}
      </ReactMarkdown>
    </div>
  )
}
