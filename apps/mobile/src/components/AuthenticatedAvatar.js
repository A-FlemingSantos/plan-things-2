import { useEffect, useMemo, useState } from 'react'
import { Image, Platform, StyleSheet, Text, View } from 'react-native'
import { useAuth } from '../providers/AuthProvider'
import { mobileApiRequest, mobileApiUrl } from '../services/api'

const avatarUrlCache = new Map()

function shouldFetchWithAuth(url) {
  return Platform.OS === 'web' && typeof url === 'string' && url.startsWith('/api/')
}

function resolveImageSource(avatarUrl, accessToken) {
  if (!avatarUrl) return null

  const uri = avatarUrl.startsWith('/api/')
    ? mobileApiUrl(avatarUrl)
    : avatarUrl

  return {
    uri,
    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
  }
}

function useWebObjectUrl(avatarUrl, accessToken) {
  const [objectUrl, setObjectUrl] = useState(null)

  useEffect(() => {
    let active = true

    if (!shouldFetchWithAuth(avatarUrl) || !accessToken) {
      setObjectUrl(null)
      return () => {
        active = false
      }
    }

    const cacheKey = `${accessToken}:${avatarUrl}`
    const cached = avatarUrlCache.get(cacheKey)

    if (cached?.objectUrl) {
      setObjectUrl(cached.objectUrl)
      return () => {
        active = false
      }
    }

    const promise = cached?.promise ?? mobileApiRequest(avatarUrl, {
      token: accessToken,
      responseType: 'blob',
    }).then((blob) => {
      const nextObjectUrl = window.URL.createObjectURL(blob)
      avatarUrlCache.set(cacheKey, { objectUrl: nextObjectUrl })
      return nextObjectUrl
    }).catch(() => null)

    if (!cached) avatarUrlCache.set(cacheKey, { promise })

    promise.then((nextObjectUrl) => {
      if (active) setObjectUrl(nextObjectUrl)
    })

    return () => {
      active = false
    }
  }, [accessToken, avatarUrl])

  return objectUrl
}

export default function AuthenticatedAvatar({
  avatarUrl,
  fallback,
  style,
  imageStyle,
  textStyle,
  accessibilityLabel,
}) {
  const { accessToken } = useAuth()
  const webObjectUrl = useWebObjectUrl(avatarUrl, accessToken)
  const [failed, setFailed] = useState(false)
  const imageSource = useMemo(() => {
    if (!avatarUrl || failed) return null
    if (webObjectUrl) return { uri: webObjectUrl }
    if (shouldFetchWithAuth(avatarUrl)) return null
    return resolveImageSource(avatarUrl, accessToken)
  }, [accessToken, avatarUrl, failed, webObjectUrl])

  useEffect(() => {
    setFailed(false)
  }, [avatarUrl])

  return (
    <View style={[styles.avatar, style]} accessibilityLabel={accessibilityLabel}>
      {imageSource ? (
        <Image source={imageSource} style={[styles.image, imageStyle]} onError={() => setFailed(true)} />
      ) : (
        <Text style={[styles.fallback, textStyle]} numberOfLines={1}>{fallback}</Text>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  avatar: {
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  fallback: {
    textAlign: 'center',
  },
})
