// @vitest-environment node
import { describe, expect, it } from 'vitest'

const { resolveExpoApiBaseUrl, resolveMobileApiBaseUrl } = await import('../../../../mobile/src/services/apiBaseUrl.js')

describe('mobile api base url resolution', () => {
  it('prefers an explicit Expo public API base url override', () => {
    expect(resolveMobileApiBaseUrl({
      envBaseUrl: 'https://api.planthings.test',
      expoHostUri: '192.168.0.15:8081',
      platformOs: 'android',
    })).toBe('https://api.planthings.test')
  })

  it('derives the backend host from Expo Go on a physical device', () => {
    expect(resolveMobileApiBaseUrl({
      envBaseUrl: '',
      expoHostUri: '192.168.0.15:8081',
      platformOs: 'android',
    })).toBe('http://192.168.0.15:8080')
  })

  it('keeps the emulator fallback when Expo only exposes localhost', () => {
    expect(resolveExpoApiBaseUrl('127.0.0.1:8081')).toBeNull()
    expect(resolveMobileApiBaseUrl({
      envBaseUrl: '',
      expoHostUri: 'localhost:8081',
      platformOs: 'android',
    })).toBe('http://10.0.2.2:8080')
  })
})
