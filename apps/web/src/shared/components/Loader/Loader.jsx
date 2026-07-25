import { useEffect, useState } from 'react'
import { useReducedMotion } from 'framer-motion'
import styles from './Loader.module.css'

const ASCII_LINE_FRAMES = ['|', '/', '-', '\\']

export default function Loader({
  size = 32,
  speed = 1,
  label = 'Carregando',
  className = '',
}) {
  const reduce = useReducedMotion() ?? false
  const [frame, setFrame] = useState(0)

  useEffect(() => {
    // Reduced motion slows the glyph cycle rather than stopping it.
    const step = ((reduce ? speed * 2.5 : speed) / ASCII_LINE_FRAMES.length) * 1000
    const id = window.setInterval(() => {
      setFrame((current) => (current + 1) % ASCII_LINE_FRAMES.length)
    }, step)
    return () => window.clearInterval(id)
  }, [speed, reduce])

  const rootClassName = [styles.root, className].filter(Boolean).join(' ')

  return (
    <span
      role="status"
      aria-label={label}
      className={rootClassName}
    >
      <span
        className={styles.glyph}
        style={{ fontSize: size }}
        aria-hidden="true"
      >
        {ASCII_LINE_FRAMES[frame % ASCII_LINE_FRAMES.length]}
      </span>
      <span className={styles.srOnly}>{label}</span>
    </span>
  )
}
