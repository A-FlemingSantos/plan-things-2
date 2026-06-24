import { apiRequest } from '../../../../shared/api/apiClient.js'

export function resolveCoverThemeClass(styles, coverThemeId) {
  if (!coverThemeId) return ''
  const key = `theme${coverThemeId}`
  return styles[key] ?? ''
}

export function buildCustomCoverImageFromFile(file) {
  const previewUrl = typeof URL.createObjectURL === 'function'
    ? URL.createObjectURL(file)
    : `mock-object-url:${file.name}`

  return {
    id: `upload:${file.name}:${file.lastModified}`,
    url: previewUrl,
    fullUrl: previewUrl,
    isCustomUpload: true,
    sourceFile: file,
  }
}

export async function uploadPlanCoverFile(file, accessToken) {
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
  return fileId
}

export function isUploadedPlanCoverImageId(coverImageId) {
  return typeof coverImageId === 'string' && coverImageId.startsWith('files/')
}
