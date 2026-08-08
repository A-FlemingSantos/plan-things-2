import { apiRequest } from '../../../shared/api/apiClient.js'

export function resolveDocumentCoverUrl(coverImageId) {
  if (!coverImageId) return null
  const normalized = String(coverImageId).trim().replace(/\\/g, '/')
  if (!normalized) return null
  if (normalized.startsWith('files/')) {
    const fileId = normalized.slice('files/'.length)
    return fileId ? `/api/files/${fileId}/download` : null
  }
  if (normalized.startsWith('https://') || normalized.startsWith('http://')) {
    return normalized
  }
  return null
}

export function isAuthenticatedDocumentCoverUrl(url) {
  return typeof url === 'string' && url.startsWith('/api/files/')
}

export function hasDocumentCover(coverImageId) {
  return Boolean(resolveDocumentCoverUrl(coverImageId))
}

export async function uploadDocumentCoverFile(file, accessToken) {
  const formData = new FormData()
  formData.append('file', file)
  const uploaded = await apiRequest('/api/files/upload', {
    method: 'POST',
    token: accessToken,
    body: formData,
  })
  const fileId = uploaded?.id
  if (!fileId) {
    throw new Error('Não foi possível enviar a imagem de capa.')
  }
  return `files/${fileId}`
}

export function buildDocumentCoverStyle({ coverImageId, resolvedUrl }) {
  if (resolvedUrl) {
    return { backgroundImage: `url(${resolvedUrl})` }
  }
  const externalUrl = resolveDocumentCoverUrl(coverImageId)
  if (externalUrl?.startsWith('http')) {
    return { backgroundImage: `url(${externalUrl})` }
  }
  return undefined
}
