import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  OAUTH_POPUP_MESSAGE_TYPE,
  getOAuthPopupPosition,
  openOAuthPopup,
  postOAuthPopupResult,
  waitForOAuthPopup,
} from './oauthPopup.js'

describe('oauthPopup', () => {
  beforeEach(() => {
    vi.stubGlobal('open', vi.fn())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('opens a compact popup window centered over the opener', () => {
    const popup = { focus: vi.fn() }
    window.open.mockReturnValue(popup)

    vi.stubGlobal('screenX', 100)
    vi.stubGlobal('screenY', 50)
    Object.defineProperty(window, 'outerWidth', { configurable: true, value: 1200 })
    Object.defineProperty(window, 'outerHeight', { configurable: true, value: 800 })

    const result = openOAuthPopup('https://accounts.google.com/o/oauth2/v2/auth')

    expect(getOAuthPopupPosition()).toEqual({ left: 440, top: 130 })
    expect(window.open).toHaveBeenCalledWith(
      'https://accounts.google.com/o/oauth2/v2/auth',
      'plan-things-oauth',
      expect.stringMatching(/popup=yes.*width=520.*height=640.*left=440.*top=130/s),
    )
    expect(result).toBe(popup)
    expect(popup.focus).toHaveBeenCalled()
  })

  it('rejects when the browser blocks the popup', () => {
    window.open.mockReturnValue(null)

    expect(() => openOAuthPopup('https://example.com')).toThrow(/bloqueando pop-ups/i)
  })

  it('resolves when the popup posts a success message', async () => {
    const popup = {}
    Object.defineProperty(popup, 'closed', {
      configurable: true,
      get() {
        throw new Error('waitForOAuthPopup should not read popup.closed while the popup is cross-origin')
      },
    })

    const waitPromise = waitForOAuthPopup(popup)

    window.dispatchEvent(new MessageEvent('message', {
      origin: window.location.origin,
      source: popup,
      data: {
        type: OAUTH_POPUP_MESSAGE_TYPE,
        success: true,
        userId: 'user-1',
        redirectTo: '/settings',
      },
    }))

    await expect(waitPromise).resolves.toMatchObject({
      success: true,
      userId: 'user-1',
      redirectTo: '/settings',
    })
  })

  it('posts OAuth results back to the opener window', () => {
    const postMessage = vi.fn()
    window.opener = { closed: false, postMessage }

    expect(postOAuthPopupResult({
      success: true,
      userId: 'user-1',
    })).toBe(true)

    expect(postMessage).toHaveBeenCalledWith({
      type: OAUTH_POPUP_MESSAGE_TYPE,
      success: true,
      userId: 'user-1',
    }, window.location.origin)

    delete window.opener
  })
})
