import { useEffect, useMemo, useState } from 'react'
import * as FileSystem from 'expo-file-system'
import { Image, Platform, StyleSheet, Text, View } from 'react-native'
import { useAuth } from '../providers/AuthProvider'
import { mobileApiRequest, mobileApiUrl } from '../services/api'
import {
  resolveAuthenticatedAvatarUri,
  resolveAvatarCachePath,
  shouldFetchAuthenticatedAvatar,
} from './authenticatedAvatarSource'

const webAvatarUrlCache = new Map()
const nativeAvatarUrlCache = new Map()

function resolveImageSource(avatarUrl) {
  if (!avatarUrl) return null

  return {
    uri: resolveAuthenticatedAvatarUri(avatarUrl),
  }
}

function useWebObjectUrl(avatarUrl, accessToken) {
  const [objectUrl, setObjectUrl] = useState(null)

  useEffect(() => {
    let active = true

    if (Platform.OS !== 'web' || !shouldFetchAuthenticatedAvatar(avatarUrl) || !accessToken) {
      setObjectUrl(null)
      return () => {
        active = false
      }
    }

    const cacheKey = `${accessToken}:${avatarUrl}`
    const cached = webAvatarUrlCache.get(cacheKey)

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
      webAvatarUrlCache.set(cacheKey, { objectUrl: nextObjectUrl })
      return nextObjectUrl
    }).catch(() => null)

    if (!cached) webAvatarUrlCache.set(cacheKey, { promise })

    promise.then((nextObjectUrl) => {
      if (active) setObjectUrl(nextObjectUrl)
    })

    return () => {
      active = false
    }
  }, [accessToken, avatarUrl])

  return objectUrl
}

function useNativeCachedUri(avatarUrl, accessToken) {
  const [localUri, setLocalUri] = useState(null)

  useEffect(() => {
    let active = true

    if (Platform.OS === 'web' || !shouldFetchAuthenticatedAvatar(avatarUrl) || !accessToken) {
      setLocalUri(null)
      return () => {
        active = false
      }
    }

    const destination = resolveAvatarCachePath(FileSystem.cacheDirectory ?? FileSystem.documentDirectory, avatarUrl)
    if (!destination) {
      setLocalUri(null)
      return () => {
        active = false
      }
    }

    const cacheKey = `${accessToken}:${avatarUrl}`
    const cached = nativeAvatarUrlCache.get(cacheKey)

    if (cached?.uri) {
      setLocalUri(cached.uri)
      return () => {
        active = false
      }
    }

    const avatarDirectory = destination.slice(0, destination.lastIndexOf('/'))
    const promise = cached?.promise ?? (async () => {
      await FileSystem.makeDirectoryAsync(avatarDirectory, { intermediates: true })
      const result = await FileSystem.downloadAsync(
        mobileApiUrl(avatarUrl),
        destination,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        },
      )

      if (result.status >= 400) {
        return null
      }

      nativeAvatarUrlCache.set(cacheKey, { uri: result.uri })
      return result.uri
    })().catch(() => null)

    if (!cached) nativeAvatarUrlCache.set(cacheKey, { promise })

    promise.then((nextLocalUri) => {
      if (active) setLocalUri(nextLocalUri)
    })

    return () => {
      active = false
    }
  }, [accessToken, avatarUrl])

  return localUri
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
  const nativeCachedUri = useNativeCachedUri(avatarUrl, accessToken)
  const [failed, setFailed] = useState(false)
  const imageSource = useMemo(() => {
    if (!avatarUrl || failed) return null
    if (webObjectUrl) return { uri: webObjectUrl }
    if (nativeCachedUri) return { uri: nativeCachedUri }
    if (shouldFetchAuthenticatedAvatar(avatarUrl)) return null
    return resolveImageSource(avatarUrl)
  }, [avatarUrl, failed, nativeCachedUri, webObjectUrl])

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
