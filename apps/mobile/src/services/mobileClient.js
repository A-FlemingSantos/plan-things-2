export const MOBILE_NATIVE_CLIENT = 'mobile'
export const MOBILE_WEB_CLIENT = 'mobile-web'

export function resolveMobileCallbackClient(platformOs) {
  return platformOs === 'web' ? MOBILE_WEB_CLIENT : MOBILE_NATIVE_CLIENT
}
