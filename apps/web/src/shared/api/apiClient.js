import { ApiClientError, apiRequest as sharedApiRequest } from '@plan-things/shared-client/api'

const DEFAULT_API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? ''

export { ApiClientError }

export async function apiRequest(path, options = {}) {
  return sharedApiRequest(path, {
    ...options,
    baseUrl: DEFAULT_API_BASE_URL,
    origin: window.location.origin,
  })
}

export function triggerBlobDownload(blob, filename) {
  const url = window.URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  window.URL.revokeObjectURL(url)
}
