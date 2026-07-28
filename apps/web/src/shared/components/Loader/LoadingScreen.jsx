import { useEffect } from 'react'
import Loader from './Loader.jsx'
import { useAppChrome } from '../../context/AppChromeContext.jsx'
import styles from './LoadingScreen.module.css'

export default function LoadingScreen({
  label = 'Carregando',
  variant = 'embedded',
  size = 36,
  className = '',
}) {
  const { registerLoadingScreen } = useAppChrome()

  useEffect(() => registerLoadingScreen(), [registerLoadingScreen])

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
