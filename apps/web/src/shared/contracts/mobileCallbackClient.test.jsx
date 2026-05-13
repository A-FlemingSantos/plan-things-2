import { describe, expect, it } from 'vitest'

const { MOBILE_NATIVE_CLIENT, MOBILE_WEB_CLIENT, resolveMobileCallbackClient } = await import('../../../../mobile/src/services/mobileClient.js')

describe('mobile callback client resolution', () => {
  it('uses a dedicated mobile-web client in the browser', () => {
    expect(resolveMobileCallbackClient('web')).toBe(MOBILE_WEB_CLIENT)
  })

  it('keeps using the native mobile client outside the browser', () => {
    expect(resolveMobileCallbackClient('android')).toBe(MOBILE_NATIVE_CLIENT)
    expect(resolveMobileCallbackClient('ios')).toBe(MOBILE_NATIVE_CLIENT)
  })
})
