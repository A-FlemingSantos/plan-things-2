import { Platform } from 'react-native'
import { apiRequest, buildApiUrl } from '@plan-things/shared-client/api'

export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL
  ?? (Platform.OS === 'android' ? 'http://10.0.2.2:8080' : 'http://localhost:8080')

export function mobileApiRequest(path, options = {}) {
  return apiRequest(path, {
    ...options,
    baseUrl: API_BASE_URL,
    relative: false,
  })
}

export function mobileApiUrl(path, query) {
  return buildApiUrl(path, query, {
    baseUrl: API_BASE_URL,
    relative: false,
  })
}
