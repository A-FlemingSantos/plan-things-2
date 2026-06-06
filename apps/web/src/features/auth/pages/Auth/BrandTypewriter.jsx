import { useEffect, useState } from 'react'
import styles from './Auth.module.css'

const BRAND_TYPEWRITER_MESSAGES = [
  'Mantenha o time alinhado do início ao fim de cada ciclo.',
  'Todos sabem o que fazer, quando e por quê.',
  'Projetos visíveis, responsabilidades claras, menos retrabalho.',
  'Sincronize pessoas, tarefas e contexto em um só fluxo.',
]

const CHAR_DELAY_MS = 42
const PAUSE_AFTER_MESSAGE_MS = 3000

export default function BrandTypewriter() {
  const [displayedText, setDisplayedText] = useState('')
  const [messageIndex, setMessageIndex] = useState(0)

  useEffect(() => {
    const message = BRAND_TYPEWRITER_MESSAGES[messageIndex]
    let index = 0
    let typingInterval
    let pauseTimeout

    setDisplayedText('')

    typingInterval = setInterval(() => {
      index += 1
      setDisplayedText(message.slice(0, index))

      if (index >= message.length) {
        clearInterval(typingInterval)
        pauseTimeout = setTimeout(() => {
          setMessageIndex((current) => (current + 1) % BRAND_TYPEWRITER_MESSAGES.length)
        }, PAUSE_AFTER_MESSAGE_MS)
      }
    }, CHAR_DELAY_MS)

    return () => {
      clearInterval(typingInterval)
      clearTimeout(pauseTimeout)
    }
  }, [messageIndex])

  return (
    <div className={styles.typewriterWrap}>
      <p className={styles.typewriterText} aria-live="polite">
        {displayedText}
        <span className={styles.typewriterCursor} aria-hidden />
      </p>
    </div>
  )
}
