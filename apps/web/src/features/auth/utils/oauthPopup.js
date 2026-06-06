export const OAUTH_POPUP_MESSAGE_TYPE = 'plan-things:oauth-complete'
export const OAUTH_POPUP_NAME = 'plan-things-oauth'
export const OAUTH_POPUP_TIMEOUT_MS = 5 * 60 * 1000

const POPUP_WIDTH = 520
const POPUP_HEIGHT = 640

export function openOAuthPopup(url) {
  const left = Math.max(0, window.screenX + window.outerWidth - POPUP_WIDTH - 24)
  const top = Math.max(0, window.screenY + 24)
  const features = [
    'popup=yes',
    `width=${POPUP_WIDTH}`,
    `height=${POPUP_HEIGHT}`,
    `left=${left}`,
    `top=${top}`,
    'resizable=yes',
    'scrollbars=yes',
  ].join(',')

  const popup = window.open(url, OAUTH_POPUP_NAME, features)

  if (!popup) {
    throw new Error('Nao foi possivel abrir a janela de login. Verifique se o navegador esta bloqueando pop-ups.')
  }

  popup.focus()
  return popup
}

export function postOAuthPopupResult(payload) {
  if (!window.opener || window.opener.closed) {
    return false
  }

  window.opener.postMessage({
    type: OAUTH_POPUP_MESSAGE_TYPE,
    ...payload,
  }, window.location.origin)

  return true
}

export function isOAuthPopupContext() {
  return Boolean(window.opener && window.opener !== window)
}

export function waitForOAuthPopup(popup) {
  return new Promise((resolve, reject) => {
    let settled = false

    const settle = (handler) => {
      if (settled) return
      settled = true
      cleanup()
      handler()
    }

    const timeoutId = window.setTimeout(() => {
      settle(() => reject(new Error('O login externo demorou demais e foi cancelado.')))
    }, OAUTH_POPUP_TIMEOUT_MS)

    function onMessage(event) {
      if (event.origin !== window.location.origin) return
      if (event.source !== popup) return
      if (event.data?.type !== OAUTH_POPUP_MESSAGE_TYPE) return

      if (event.data.success) {
        settle(() => resolve(event.data))
        return
      }

      settle(() => reject(new Error(event.data.error ?? 'Nao foi possivel concluir o login externo.')))
    }

    function cleanup() {
      window.clearTimeout(timeoutId)
      window.removeEventListener('message', onMessage)
    }

    window.addEventListener('message', onMessage)
  })
}
