import { describe, expect, it } from 'vitest'

const { isMobileSettingsReturnUrl, parseMobileOAuthCallback } = await import('../../../../mobile/src/services/mobileLinking.js')

describe('mobile Expo Go linking', () => {
  it('parses Expo Go OAuth callbacks', () => {
    expect(parseMobileOAuthCallback('exp://192.168.0.15:8081/--/oauth/callback?code=abc123&redirectTo=%2Fsettings')).toEqual({
      code: 'abc123',
      error: null,
      redirectTo: '/settings',
    })
  })

  it('keeps supporting standalone mobile OAuth callbacks', () => {
    expect(parseMobileOAuthCallback('planthings://oauth/callback?error=OAUTH_PROVIDER_ERROR')).toEqual({
      code: null,
      error: 'OAUTH_PROVIDER_ERROR',
      redirectTo: null,
    })
  })

  it('recognizes Expo Go settings returns', () => {
    expect(isMobileSettingsReturnUrl('exp://192.168.0.15:8081/--/settings?section=integrations&gmail=connected')).toBe(true)
    expect(isMobileSettingsReturnUrl('planthings://settings?section=integrations&gmail=connected')).toBe(true)
    expect(isMobileSettingsReturnUrl('exp://192.168.0.15:8081/--/oauth/callback?code=abc123')).toBe(false)
  })
})
