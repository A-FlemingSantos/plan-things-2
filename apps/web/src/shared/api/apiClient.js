const DEFAULT_API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? ''

function buildUrl(path, query) {
  const url = new URL(`${DEFAULT_API_BASE_URL}${path}`, window.location.origin)

  if (query && typeof query === 'object') {
    Object.entries(query).forEach(([key, value]) => {
      if (value === undefined || value === null || value === '') return
      url.searchParams.set(key, value)
    })
  }

  if (!DEFAULT_API_BASE_URL) {
    return `${url.pathname}${url.search}`
  }

  return url.toString()
}

export class ApiClientError extends Error {
  constructor(message, options = {}) {
    super(message)
    this.name = 'ApiClientError'
    this.code = options.code ?? 'ERRO_API'
    this.status = options.status ?? 500
    this.validations = options.validations ?? null
  }
}

export async function apiRequest(path, options = {}) {
  const {
    method = 'GET',
    body,
    token,
    headers = {},
    query,
    responseType = 'json',
  } = options

  const requestHeaders = new Headers(headers)
  const init = {
    method,
    headers: requestHeaders,
  }

  if (token) {
    requestHeaders.set('Authorization', `Bearer ${token}`)
  }

  if (body instanceof FormData) {
    init.body = body
  } else if (body !== undefined) {
    requestHeaders.set('Content-Type', 'application/json')
    init.body = JSON.stringify(body)
  }

  let response

  try {
    response = await fetch(buildUrl(path, query), init)
  } catch (error) {
    throw new ApiClientError('Nao foi possivel conectar ao backend.', {
      code: 'ERRO_CONEXAO',
      status: 0,
    })
  }

  if (responseType === 'blob') {
    if (!response.ok) {
      throw new ApiClientError('Nao foi possivel concluir a operacao solicitada.', {
        code: 'ERRO_DOWNLOAD',
        status: response.status,
      })
    }

    return response.blob()
  }

  const payload = await response.json().catch(() => null)

  if (!response.ok || payload?.success === false) {
    const error = payload?.error
    throw new ApiClientError(
      error?.message ?? 'Nao foi possivel concluir a operacao solicitada.',
      {
        code: error?.code,
        status: response.status,
        validations: error?.validations ?? null,
      },
    )
  }

  return payload?.data
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
