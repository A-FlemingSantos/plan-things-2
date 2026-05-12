import { ApiClientError } from '@plan-things/shared-client/api'

export const TOKEN_REFRESH_BUFFER_MS = 5 * 60 * 1000
export const TOKEN_REFRESH_RETRY_MS = 30 * 1000
export const MIN_TOKEN_REFRESH_DELAY_MS = 5 * 1000

const BASE64_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'

function normalizePathname(pathname = '') {
  return pathname.replace(/\/+$/, '') || '/'
}

function decodeBase64(value) {
  const bytes = []

  for (let index = 0; index < value.length; index += 4) {
    const chunk = value.slice(index, index + 4)
    const first = BASE64_ALPHABET.indexOf(chunk[0])
    const second = BASE64_ALPHABET.indexOf(chunk[1])
    const third = chunk[2] === '=' ? 64 : BASE64_ALPHABET.indexOf(chunk[2])
    const fourth = chunk[3] === '=' ? 64 : BASE64_ALPHABET.indexOf(chunk[3])

    if (first < 0 || second < 0 || third < 0 || fourth < 0) {
      throw new Error('Invalid base64 input.')
    }

    const buffer = (first << 18) | (second << 12) | ((third & 63) << 6) | (fourth & 63)
    bytes.push((buffer >> 16) & 255)

    if (third !== 64) {
      bytes.push((buffer >> 8) & 255)
    }

    if (fourth !== 64) {
      bytes.push(buffer & 255)
    }
  }

  if (typeof TextDecoder !== 'undefined') {
    return new TextDecoder().decode(new Uint8Array(bytes))
  }

  return String.fromCharCode(...bytes)
}

export function normalizeLogoutRedirect(value) {
  if (!value) return null

  const text = String(value).trim()
  if (!text.startsWith('/') || text.startsWith('//') || text.includes('://')) {
    return null
  }

  try {
    const url = new URL(text, 'https://planthings.local')
    return `${normalizePathname(url.pathname)}${url.search}${url.hash}`
  } catch {
    return null
  }
}

export function resolveAuthScreenModeFromRedirect(redirectTo) {
  const normalized = normalizeLogoutRedirect(redirectTo)
  if (!normalized) return null

  const pathname = normalizePathname(new URL(normalized, 'https://planthings.local').pathname)
  if (pathname === '/login') return 'login'
  if (pathname === '/cadastro' || pathname === '/register' || pathname === '/signup') return 'register'
  return null
}

export function decodeBase64Url(value) {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/')
  const padSize = normalized.length % 4
  const padded = padSize === 0 ? normalized : normalized.padEnd(normalized.length + (4 - padSize), '=')

  if (typeof globalThis.atob === 'function') {
    return globalThis.atob(padded)
  }

  return decodeBase64(padded)
}

export function readAccessTokenExpiresAt(accessToken) {
  if (!accessToken) return null

  try {
    const [, payload] = accessToken.split('.')
    if (!payload) return null

    const parsed = JSON.parse(decodeBase64Url(payload))
    return typeof parsed.exp === 'number' ? parsed.exp * 1000 : null
  } catch {
    return null
  }
}

export function isAuthFailure(error) {
  return error instanceof ApiClientError && (error.status === 401 || error.status === 403)
}

export function shouldClearSessionAfterRefreshFailure(error, accessToken) {
  if (isAuthFailure(error)) {
    return true
  }

  const expiresAt = readAccessTokenExpiresAt(accessToken)
  return expiresAt !== null && expiresAt <= Date.now()
}

export function resolveSessionMode({ session, isReady }) {
  if (!isReady) {
    return 'boot'
  }

  if (!session?.accessToken) {
    return 'anonymous'
  }

  return session.demo ? 'demo' : 'authenticated'
}
