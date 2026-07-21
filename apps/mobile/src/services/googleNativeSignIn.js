import { Platform } from 'react-native'
import * as SecureStore from 'expo-secure-store'

const WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID?.trim() || ''
const LAST_ACCOUNT_KEY = 'plan-things.googleLastAccount'

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

function cancelledError() {
  const cancelled = new Error('Login com Google cancelado.')
  cancelled.code = 'OAUTH_CANCELLED'
  return cancelled
}

function extractIdToken(response) {
  return response?.data?.idToken ?? response?.idToken ?? null
}

function extractUser(response) {
  const user = response?.data?.user ?? response?.user
  if (!user?.email) return null

  return {
    email: String(user.email),
    name: user.name ? String(user.name) : null,
    photo: user.photo ? String(user.photo) : null,
  }
}

async function persistLastGoogleAccount(account) {
  if (!account?.email) return

  const payload = JSON.stringify({
    email: account.email,
    name: account.name,
    photo: account.photo,
  })

  try {
    if (Platform.OS === 'web') {
      window.localStorage.setItem(LAST_ACCOUNT_KEY, payload)
      return
    }

    await SecureStore.setItemAsync(LAST_ACCOUNT_KEY, payload)
  } catch {
    // Hint is optional — login still succeeds without persistence.
  }
}

async function readPersistedLastGoogleAccount() {
  try {
    const rawValue = Platform.OS === 'web'
      ? window.localStorage.getItem(LAST_ACCOUNT_KEY)
      : await SecureStore.getItemAsync(LAST_ACCOUNT_KEY)

    if (!rawValue) return null

    const parsed = JSON.parse(rawValue)
    if (!parsed?.email) return null

    return {
      email: String(parsed.email),
      name: parsed.name ? String(parsed.name) : null,
      photo: parsed.photo ? String(parsed.photo) : null,
    }
  } catch {
    return null
  }
}

async function readSdkCurrentGoogleAccount() {
  if (!isGoogleNativeSignInConfigured()) return null

  try {
    await ensureConfigured()
    const { GoogleSignin } = await import('@react-native-google-signin/google-signin')
    const currentUser = GoogleSignin.getCurrentUser?.()
    const user = currentUser?.user ?? currentUser?.data?.user
    if (!user?.email) return null

    const account = {
      email: String(user.email),
      name: user.name ? String(user.name) : null,
      photo: user.photo ? String(user.photo) : null,
    }
    await persistLastGoogleAccount(account)
    return account
  } catch {
    return null
  }
}

export async function getLastGoogleAccount() {
  const persisted = await readPersistedLastGoogleAccount()
  if (persisted) return persisted
  return readSdkCurrentGoogleAccount()
}

async function resolveIdTokenFromResponse(response) {
  if (response?.type === 'cancelled') {
    throw cancelledError()
  }

  const idToken = extractIdToken(response)
  if (!idToken) {
    throw new Error('O Google nao retornou um token de identidade.')
  }

  const account = extractUser(response)
  if (account) {
    await persistLastGoogleAccount(account)
  }

  return idToken
}

async function signInWithAccountPicker(GoogleSignin) {
  try {
    await GoogleSignin.signOut()
  } catch {
    // Ignore when there is no previous Google session.
  }

  return resolveIdTokenFromResponse(await GoogleSignin.signIn())
}

async function signInWithLastAccount(GoogleSignin) {
  try {
    const silentResponse = await GoogleSignin.signInSilently()
    return resolveIdTokenFromResponse(silentResponse)
  } catch {
    // Fall through to interactive sign-in without clearing the cached account.
  }

  return resolveIdTokenFromResponse(await GoogleSignin.signIn())
}

/**
 * @param {{ forceAccountPicker?: boolean }} [options]
 * - forceAccountPicker true: always shows the native account selector
 * - forceAccountPicker false: reuses the last Google account when possible
 */
export async function signInWithGoogleNative(options = {}) {
  const forceAccountPicker = options.forceAccountPicker !== false

  await ensureConfigured()

  const { GoogleSignin, isErrorWithCode, statusCodes } = await import('@react-native-google-signin/google-signin')

  await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true })

  try {
    if (forceAccountPicker) {
      return await signInWithAccountPicker(GoogleSignin)
    }

    return await signInWithLastAccount(GoogleSignin)
  } catch (error) {
    if (error?.code === 'OAUTH_CANCELLED') {
      throw error
    }

    if (isErrorWithCode(error) && error.code === statusCodes.SIGN_IN_CANCELLED) {
      throw cancelledError()
    }

    throw error
  }
}
