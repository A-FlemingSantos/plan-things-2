import { useEffect, useState } from 'react'
import { useAuth } from '../../../features/auth/context/AuthContext.jsx'
import { apiRequest } from '../../api/apiClient.js'
import styles from './AuthenticatedAvatar.module.css'

const avatarUrlCache = new Map()

function shouldFetchWithAuth(url) {
  return typeof url === 'string' && url.startsWith('/api/')
}

function hasAvatarUrl(avatarUrl) {
  return typeof avatarUrl === 'string' && avatarUrl.trim().length > 0
}

function createAvatarState(avatarUrl, accessToken) {
  if (!hasAvatarUrl(avatarUrl)) {
    return {
      resolvedUrl: null,
      isResolving: false,
      hasFailed: false,
    }
  }

  if (!shouldFetchWithAuth(avatarUrl)) {
    return {
      resolvedUrl: avatarUrl,
      isResolving: false,
      hasFailed: false,
    }
  }

  if (!accessToken) {
    return {
      resolvedUrl: null,
      isResolving: false,
      hasFailed: true,
    }
  }

  const cacheKey = `${accessToken}:${avatarUrl}`
  const cached = avatarUrlCache.get(cacheKey)

  if (cached?.objectUrl) {
    return {
      resolvedUrl: cached.objectUrl,
      isResolving: false,
      hasFailed: false,
    }
  }

  return {
    resolvedUrl: null,
    isResolving: true,
    hasFailed: false,
  }
}

function useAuthenticatedAvatarUrl(avatarUrl) {
  const { accessToken } = useAuth()
  const [avatarState, setAvatarState] = useState(() => createAvatarState(avatarUrl, accessToken))

  useEffect(() => {
    let active = true

    if (!hasAvatarUrl(avatarUrl)) {
      setAvatarState({
        resolvedUrl: null,
        isResolving: false,
        hasFailed: false,
      })
      return () => {
        active = false
      }
    }

    if (!shouldFetchWithAuth(avatarUrl)) {
      setAvatarState({
        resolvedUrl: avatarUrl,
        isResolving: false,
        hasFailed: false,
      })
      return () => {
        active = false
      }
    }

    if (!accessToken) {
      setAvatarState({
        resolvedUrl: null,
        isResolving: false,
        hasFailed: true,
      })
      return () => {
        active = false
      }
    }

    const cacheKey = `${accessToken}:${avatarUrl}`
    const cached = avatarUrlCache.get(cacheKey)

    if (cached?.objectUrl) {
      setAvatarState({
        resolvedUrl: cached.objectUrl,
        isResolving: false,
        hasFailed: false,
      })
      return () => {
        active = false
      }
    }

    setAvatarState({
      resolvedUrl: null,
      isResolving: true,
      hasFailed: false,
    })

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
      if (!active) return

      setAvatarState({
        resolvedUrl: objectUrl,
        isResolving: false,
        hasFailed: !objectUrl,
      })
    })

    return () => {
      active = false
    }
  }, [accessToken, avatarUrl])

  return avatarState
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
  const { resolvedUrl, isResolving, hasFailed } = useAuthenticatedAvatarUrl(avatarUrl)
  const [loadedImageUrl, setLoadedImageUrl] = useState(null)
  const [failedImageUrl, setFailedImageUrl] = useState(null)
  const imageLoaded = Boolean(resolvedUrl && loadedImageUrl === resolvedUrl)
  const imageFailed = Boolean(resolvedUrl && failedImageUrl === resolvedUrl)

  const shouldShowSkeleton = hasAvatarUrl(avatarUrl)
    && !hasFailed
    && !imageFailed
    && (isResolving || Boolean(resolvedUrl && !imageLoaded))
  const shouldShowImage = Boolean(resolvedUrl && !imageFailed)

  return (
    <span className={className} style={style} title={title} {...spanProps}>
      {shouldShowSkeleton ? (
        <span
          className={styles.avatarSkeleton}
          aria-hidden="true"
          data-testid="authenticated-avatar-skeleton"
        />
      ) : null}

      {shouldShowImage ? (
        <img
          className={imageClassName}
          src={resolvedUrl}
          alt={alt}
          draggable="false"
          onLoad={() => setLoadedImageUrl(resolvedUrl)}
          onError={() => setFailedImageUrl(resolvedUrl)}
          style={imageLoaded ? undefined : { display: 'none' }}
        />
      ) : null}

      {!shouldShowSkeleton && !shouldShowImage ? fallback : null}
    </span>
  )
}
