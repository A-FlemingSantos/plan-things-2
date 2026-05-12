function normalizePathname(pathname = '') {
  if (pathname.startsWith('/--/')) {
    return pathname.slice(3)
  }
  if (pathname === '/--') {
    return '/'
  }
  return pathname || '/'
}

function parseUrl(url) {
  try {
    const parsed = new URL(url)
    return {
      protocol: parsed.protocol,
      hostname: parsed.hostname,
      pathname: normalizePathname(parsed.pathname),
      searchParams: parsed.searchParams,
    }
  } catch {
    return null
  }
}

export function parseMobileOAuthCallback(url) {
  const parsed = parseUrl(url)
  if (!parsed) return null

  const isNativeOAuthCallback = parsed.protocol === 'planthings:' && parsed.hostname === 'oauth' && parsed.pathname === '/callback'
  const isWebOAuthCallback = (parsed.protocol === 'http:' || parsed.protocol === 'https:' || parsed.protocol === 'exp:' || parsed.protocol === 'exps:')
    && parsed.pathname === '/oauth/callback'

  if (!isNativeOAuthCallback && !isWebOAuthCallback) {
    return null
  }

  return {
    code: parsed.searchParams.get('code'),
    error: parsed.searchParams.get('error'),
    redirectTo: parsed.searchParams.get('redirectTo'),
  }
}

export function isMobileSettingsReturnUrl(url) {
  const parsed = parseUrl(url)
  if (!parsed) return false

  const isNativeSettingsUrl = parsed.protocol === 'planthings:' && parsed.hostname === 'settings'
  const isExpoGoSettingsUrl = (parsed.protocol === 'exp:' || parsed.protocol === 'exps:' || parsed.protocol === 'http:' || parsed.protocol === 'https:')
    && parsed.pathname === '/settings'

  return isNativeSettingsUrl || isExpoGoSettingsUrl
}
