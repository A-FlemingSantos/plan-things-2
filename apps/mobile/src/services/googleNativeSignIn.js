import { Platform } from 'react-native'

const WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID?.trim() || ''

let configured = false

function isNativePlatform() {
  return Platform.OS === 'ios' || Platform.OS === 'android'
}

export function isGoogleNativeSignInConfigured() {
  return isNativePlatform() && Boolean(WEB_CLIENT_ID)
}

export async function isGoogleNativeSignInAvailable() {
  if (!isGoogleNativeSignInConfigured()) {
    return false
  }

  try {
    const { GoogleSignin } = await import('@react-native-google-signin/google-signin')
    return typeof GoogleSignin?.signIn === 'function'
  } catch {
    return false
  }
}

async function ensureConfigured() {
  if (configured) return

  if (!WEB_CLIENT_ID) {
    throw new Error('EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID nao configurado.')
  }

  const { GoogleSignin } = await import('@react-native-google-signin/google-signin')
  GoogleSignin.configure({
    webClientId: WEB_CLIENT_ID,
    offlineAccess: false,
  })
  configured = true
}

export async function signInWithGoogleNative() {
  await ensureConfigured()

  const { GoogleSignin, isErrorWithCode, statusCodes } = await import('@react-native-google-signin/google-signin')

  await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true })

  // Clear the cached Google account so the account picker opens every time.
  try {
    await GoogleSignin.signOut()
  } catch {
    // Ignore when there is no previous Google session.
  }

  try {
    const response = await GoogleSignin.signIn()

    if (response?.type === 'cancelled') {
      const cancelled = new Error('Login com Google cancelado.')
      cancelled.code = 'OAUTH_CANCELLED'
      throw cancelled
    }

    const idToken = response?.data?.idToken ?? response?.idToken
    if (!idToken) {
      throw new Error('O Google nao retornou um token de identidade.')
    }

    return idToken
  } catch (error) {
    if (error?.code === 'OAUTH_CANCELLED') {
      throw error
    }

    if (isErrorWithCode(error) && error.code === statusCodes.SIGN_IN_CANCELLED) {
      const cancelled = new Error('Login com Google cancelado.')
      cancelled.code = 'OAUTH_CANCELLED'
      throw cancelled
    }

    throw error
  }
}
