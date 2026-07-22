import { useEffect, useMemo, useState } from 'react'
import * as FileSystem from 'expo-file-system'
import { Image, Platform, StyleSheet, View } from 'react-native'
import { useAuth } from '../providers/AuthProvider'
import { mobileApiRequest, mobileApiUrl } from '../services/api'
import {
  resolveAuthenticatedAvatarUri,
  resolveAvatarCachePath,
  shouldFetchAuthenticatedAvatar,
} from './authenticatedAvatarSource'

// Generic authenticated image loader — shares the same download/cache strategy
// used by AuthenticatedAvatar so any `/api/...` asset can be rendered with the
// bearer token attached (plan covers, thumbnails, etc.).
const webImageUrlCache = new Map()
const nativeImageUrlCache = new Map()

function useWebObjectUrl(sourceUrl, accessToken) {
  const [objectUrl, setObjectUrl] = useState(null)

  useEffect(() => {
    let active = true

    if (Platform.OS !== 'web' || !shouldFetchAuthenticatedAvatar(sourceUrl) || !accessToken) {
      setObjectUrl(null)
      return () => {
        active = false
      }
    }

    const cacheKey = `${accessToken}:${sourceUrl}`
    const cached = webImageUrlCache.get(cacheKey)

    if (cached?.objectUrl) {
      setObjectUrl(cached.objectUrl)
      return () => {
        active = false
      }
    }

    const promise = cached?.promise ?? mobileApiRequest(sourceUrl, {
      token: accessToken,
      responseType: 'blob',
    }).then((blob) => {
      const nextObjectUrl = window.URL.createObjectURL(blob)
      webImageUrlCache.set(cacheKey, { objectUrl: nextObjectUrl })
      return nextObjectUrl
    }).catch(() => null)

    if (!cached) webImageUrlCache.set(cacheKey, { promise })

    promise.then((nextObjectUrl) => {
      if (active) setObjectUrl(nextObjectUrl)
    })

    return () => {
      active = false
    }
  }, [accessToken, sourceUrl])

  return objectUrl
}

function useNativeCachedUri(sourceUrl, accessToken) {
  const [localUri, setLocalUri] = useState(null)

  useEffect(() => {
    let active = true

    if (Platform.OS === 'web' || !shouldFetchAuthenticatedAvatar(sourceUrl) || !accessToken) {
      setLocalUri(null)
      return () => {
        active = false
      }
    }

    const destination = resolveAvatarCachePath(FileSystem.cacheDirectory ?? FileSystem.documentDirectory, sourceUrl)
    if (!destination) {
      setLocalUri(null)
      return () => {
        active = false
      }
    }

    const cacheKey = `${accessToken}:${sourceUrl}`
    const cached = nativeImageUrlCache.get(cacheKey)

    if (cached?.uri) {
      setLocalUri(cached.uri)
      return () => {
        active = false
      }
    }

    const directory = destination.slice(0, destination.lastIndexOf('/'))
    const promise = cached?.promise ?? (async () => {
      await FileSystem.makeDirectoryAsync(directory, { intermediates: true })
      const result = await FileSystem.downloadAsync(
        mobileApiUrl(sourceUrl),
        destination,
        { headers: { Authorization: `Bearer ${accessToken}` } },
      )
      if (result.status >= 400) return null
      nativeImageUrlCache.set(cacheKey, { uri: result.uri })
      return result.uri
    })().catch(() => null)

    if (!cached) nativeImageUrlCache.set(cacheKey, { promise })

    promise.then((nextLocalUri) => {
      if (active) setLocalUri(nextLocalUri)
    })

    return () => {
      active = false
    }
  }, [accessToken, sourceUrl])

  return localUri
}

export default function AuthenticatedImage({ source, style, imageStyle, resizeMode = 'cover', fallback = null, onResolved }) {
  const { accessToken } = useAuth()
  const webObjectUrl = useWebObjectUrl(source, accessToken)
  const nativeCachedUri = useNativeCachedUri(source, accessToken)
  const [failed, setFailed] = useState(false)

  const imageSource = useMemo(() => {
    if (!source || failed) return null
    if (webObjectUrl) return { uri: webObjectUrl }
    if (nativeCachedUri) return { uri: nativeCachedUri }
    if (shouldFetchAuthenticatedAvatar(source)) return null
    return { uri: resolveAuthenticatedAvatarUri(source) }
  }, [failed, nativeCachedUri, source, webObjectUrl])

  useEffect(() => {
    setFailed(false)
  }, [source])

  useEffect(() => {
    onResolved?.(Boolean(imageSource))
  }, [imageSource, onResolved])

  if (!imageSource) {
    return fallback ? <View style={style}>{fallback}</View> : null
  }

  return (
    <View style={[styles.wrap, style]}>
      <Image
        source={imageSource}
        style={[styles.image, imageStyle]}
        resizeMode={resizeMode}
        onError={() => setFailed(true)}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
})
