import { useEffect, useState } from 'react'
import { useAuth } from '../../../features/auth/context/AuthContext.jsx'
import { apiRequest } from '../../api/apiClient.js'

const avatarUrlCache = new Map()

function shouldFetchWithAuth(url) {
  return typeof url === 'string' && url.startsWith('/api/')
}

function useAuthenticatedAvatarUrl(avatarUrl) {
  const { accessToken } = useAuth()
  const [resolvedUrl, setResolvedUrl] = useState(() => (
    avatarUrl && !shouldFetchWithAuth(avatarUrl) ? avatarUrl : null
  ))

  useEffect(() => {
    let active = true

    if (!avatarUrl) {
      setResolvedUrl(null)
      return () => {
        active = false
      }
    }

    if (!shouldFetchWithAuth(avatarUrl)) {
      setResolvedUrl(avatarUrl)
      return () => {
        active = false
      }
    }

    if (!accessToken) {
      setResolvedUrl(null)
      return () => {
        active = false
      }
    }

    const cacheKey = `${accessToken}:${avatarUrl}`
    const cached = avatarUrlCache.get(cacheKey)

    if (cached?.objectUrl) {
      setResolvedUrl(cached.objectUrl)
      return () => {
        active = false
      }
    }

    const promise = cached?.promise ?? apiRequest(avatarUrl, {
      token: accessToken,
      responseType: 'blob',
    }).then((blob) => {
      const objectUrl = window.URL.createObjectURL(blob)
      avatarUrlCache.set(cacheKey, { objectUrl })
      return objectUrl
    }).catch(() => null)

    if (!cached) {
      avatarUrlCache.set(cacheKey, { promise })
    }

    promise.then((objectUrl) => {
      if (active) setResolvedUrl(objectUrl)
    })

    return () => {
      active = false
    }
  }, [accessToken, avatarUrl])

  return resolvedUrl
}

export default function AuthenticatedAvatar({
  avatarUrl,
  fallback,
  className,
  imageClassName,
  style,
  title,
  alt = '',
  ...spanProps
}) {
  const resolvedUrl = useAuthenticatedAvatarUrl(avatarUrl)

  return (
    <span className={className} style={style} title={title} {...spanProps}>
      {resolvedUrl ? (
        <img className={imageClassName} src={resolvedUrl} alt={alt} draggable="false" />
      ) : fallback}
    </span>
  )
}
