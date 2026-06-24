import { useCallback, useEffect, useRef, useState } from 'react'

const DEFAULT_DURATION_MS = 2600

export function useTransientNotification(durationMs = DEFAULT_DURATION_MS) {
  const [notification, setNotification] = useState(null)
  const timerRef = useRef(null)

  const clearNotificationTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const pushNotification = useCallback((message) => {
    clearNotificationTimer()
    setNotification(message)
    timerRef.current = setTimeout(() => {
      setNotification(null)
      timerRef.current = null
    }, durationMs)
  }, [clearNotificationTimer, durationMs])

  useEffect(() => () => clearNotificationTimer(), [clearNotificationTimer])

  return { notification, pushNotification, setNotification }
}
