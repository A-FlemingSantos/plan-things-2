import Loader from './Loader.jsx'
import styles from './LoadingScreen.module.css'

export default function LoadingScreen({
  label = 'Carregando',
  variant = 'embedded',
  size = 36,
  className = '',
}) {
  const rootClassName = [
    styles.root,
    variant === 'fullscreen' ? styles.fullscreen : styles.embedded,
    className,
  ].filter(Boolean).join(' ')

  return (
    <div className={rootClassName}>
      <Loader size={size} label={label} className={styles.loader} />
    </div>
  )
}
