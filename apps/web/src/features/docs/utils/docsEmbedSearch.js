import { apiRequest } from '../../../shared/api/apiClient.js'

export async function searchUnsplashPhotos({ query, page = 1, token }) {
  const params = new URLSearchParams({
    q: query,
    page: String(page),
  })
  return apiRequest(`/api/documents/embeds/unsplash/search?${params.toString()}`, { token })
}

export async function searchYouTubeVideos({ query, pageToken = '', token }) {
  const params = new URLSearchParams({ q: query })
  if (pageToken) params.set('pageToken', pageToken)
  return apiRequest(`/api/documents/embeds/youtube/search?${params.toString()}`, { token })
}
