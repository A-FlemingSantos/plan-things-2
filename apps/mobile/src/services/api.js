import { Platform } from 'react-native'
import Constants from 'expo-constants'
import { apiRequest, buildApiUrl } from '@plan-things/shared-client/api'
import { resolveMobileApiBaseUrl } from './apiBaseUrl.js'

const expoHostUri = Constants.expoConfig?.hostUri ?? Constants.expoGoConfig?.debuggerHost ?? null

export const API_BASE_URL = resolveMobileApiBaseUrl({
  envBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL,
  expoHostUri,
  platformOs: Platform.OS,
})

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
