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
  let headingIndex = 0

  return (
    <div className={styles.markdownContent}>
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
          img: ({ src, alt }) => <MarkdownImage src={src} alt={alt} styles={styles} />,
        }}
      >
        {value}
      </ReactMarkdown>
    </div>
  )
}
