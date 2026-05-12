const ANDROID_EMULATOR_API_BASE_URL = 'http://10.0.2.2:8080'
const LOCALHOST_API_BASE_URL = 'http://localhost:8080'
const BACKEND_PORT = '8080'

function parseExpoHostname(hostUri) {
  if (typeof hostUri !== 'string' || !hostUri.trim()) {
    return null
  }

  const normalizedHostUri = /^[a-z]+:\/\//i.test(hostUri) ? hostUri : `http://${hostUri}`

  try {
    const parsed = new URL(normalizedHostUri)
    return parsed.hostname || null
  } catch {
    return null
  }
}

function formatHostForUrl(hostname) {
  return hostname.includes(':') ? `[${hostname}]` : hostname
}

export function resolveExpoApiBaseUrl(hostUri) {
  const hostname = parseExpoHostname(hostUri)
  if (!hostname) return null

  const normalizedHostname = hostname.toLowerCase()
  if (normalizedHostname === 'localhost' || normalizedHostname === '127.0.0.1' || normalizedHostname === '0.0.0.0') {
    return null
  }

  return `http://${formatHostForUrl(hostname)}:${BACKEND_PORT}`
}

export function resolveMobileApiBaseUrl({ envBaseUrl, expoHostUri, platformOs }) {
  if (typeof envBaseUrl === 'string' && envBaseUrl.trim()) {
    return envBaseUrl
  }

  const expoDerivedBaseUrl = resolveExpoApiBaseUrl(expoHostUri)
  if (expoDerivedBaseUrl) {
    return expoDerivedBaseUrl
  }

  return platformOs === 'android' ? ANDROID_EMULATOR_API_BASE_URL : LOCALHOST_API_BASE_URL
}
