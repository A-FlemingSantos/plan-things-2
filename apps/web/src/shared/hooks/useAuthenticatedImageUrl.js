import { useEffect, useState } from 'react'
import { useAuth } from '../../features/auth/context/AuthContext.jsx'
import { apiRequest } from '../api/apiClient.js'

const imageUrlCache = new Map()

function shouldFetchWithAuth(url) {
  return typeof url === 'string' && url.startsWith('/api/')
}

export function useAuthenticatedImageUrl(imageUrl) {
  const { accessToken } = useAuth()
  const [resolvedUrl, setResolvedUrl] = useState(() => {
    if (!imageUrl) return null
    if (!shouldFetchWithAuth(imageUrl)) return imageUrl
    return null
  })

  useEffect(() => {
    if (!imageUrl) {
      setResolvedUrl(null)
      return undefined
    }

    if (!shouldFetchWithAuth(imageUrl)) {
      setResolvedUrl(imageUrl)
      return undefined
    }

    if (!accessToken) {
      setResolvedUrl(null)
      return undefined
    }

    let active = true
    const cacheKey = `${accessToken}:${imageUrl}`
    const cached = imageUrlCache.get(cacheKey)

    if (cached?.objectUrl) {
      setResolvedUrl(cached.objectUrl)
      return () => {
        active = false
      }
    }

    const promise = cached?.promise ?? apiRequest(imageUrl, {
      token: accessToken,
      responseType: 'blob',
    }).then((blob) => {
      const objectUrl = window.URL.createObjectURL(blob)
      imageUrlCache.set(cacheKey, { objectUrl })
      return objectUrl
    }).catch(() => null)

    if (!cached) {
      imageUrlCache.set(cacheKey, { promise })
    }

    promise.then((objectUrl) => {
      if (active) {
        setResolvedUrl(objectUrl ?? null)
      }
    })

    return () => {
      active = false
    }
  }, [accessToken, imageUrl])

  return resolvedUrl
}
