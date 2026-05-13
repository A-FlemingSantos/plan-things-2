import { mobileApiUrl } from '../services/api'

function inferAvatarExtension(avatarUrl) {
  try {
    const pathname = new URL(avatarUrl, 'http://localhost').pathname
    const match = pathname.match(/\.(png|jpe?g|webp|gif|bmp|heic|svg)$/i)
    return match ? `.${match[1].toLowerCase()}` : '.img'
  } catch {
    return '.img'
  }
}

function hashString(value) {
  let hash = 0
  for (let index = 0; index < value.length; index += 1) {
    hash = ((hash << 5) - hash) + value.charCodeAt(index)
    hash |= 0
  }

  return Math.abs(hash).toString(36)
}

export function shouldFetchAuthenticatedAvatar(url) {
  return typeof url === 'string' && url.startsWith('/api/')
}

export function resolveAuthenticatedAvatarUri(avatarUrl) {
  if (!avatarUrl) return null
  return shouldFetchAuthenticatedAvatar(avatarUrl)
    ? mobileApiUrl(avatarUrl)
    : avatarUrl
}

export function resolveAvatarCachePath(cacheDirectory, avatarUrl) {
  if (!cacheDirectory || !avatarUrl) return null
  const normalizedCacheDirectory = cacheDirectory.endsWith('/') ? cacheDirectory : `${cacheDirectory}/`
  const extension = inferAvatarExtension(avatarUrl)
  return `${normalizedCacheDirectory}avatars/avatar-${hashString(avatarUrl)}${extension}`
}
