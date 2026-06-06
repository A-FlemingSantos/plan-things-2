import { useEffect, useState } from 'react'
import styles from './Auth.module.css'

const BRAND_TYPEWRITER_TEXT = 'Planejamento, execução e contexto reunidos em uma experiência de trabalho mais calma.'
const CHAR_DELAY_MS = 42

export default function BrandTypewriter() {
  const [displayedText, setDisplayedText] = useState('')

  useEffect(() => {
    let index = 0
    const interval = setInterval(() => {
      index += 1
      setDisplayedText(BRAND_TYPEWRITER_TEXT.slice(0, index))
      if (index >= BRAND_TYPEWRITER_TEXT.length) {
        clearInterval(interval)
      }
    }, CHAR_DELAY_MS)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className={styles.typewriterWrap}>
      <p className={styles.typewriterText} aria-live="polite">
        {displayedText}
        <span className={styles.typewriterCursor} aria-hidden />
      </p>
    </div>
  )
}
