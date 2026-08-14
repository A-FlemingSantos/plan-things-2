import { Platform } from 'react-native'
import Constants from 'expo-constants'
import * as SecureStore from 'expo-secure-store'

const WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID?.trim() || ''
const LAST_ACCOUNT_KEY = 'plan-things.googleLastAccount'

function isNativePlatform() {
  return Platform.OS === 'ios' || Platform.OS === 'android'
}

function isExpoGoRuntime() {
  return Constants.appOwnership === 'expo'
    || Constants.executionEnvironment === 'storeClient'
}

export function isGoogleNativeSignInConfigured() {
  return isNativePlatform() && Boolean(WEB_CLIENT_ID) && !isExpoGoRuntime()
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

async function ensureConfigured(accountName) {
  if (!isGoogleNativeSignInConfigured()) {
    throw new Error('Google Sign-In nativo indisponivel neste runtime.')
  }

  const { GoogleSignin } = await import('@react-native-google-signin/google-signin')
  GoogleSignin.configure({
    webClientId: WEB_CLIENT_ID,
    offlineAccess: false,
    ...(accountName ? { accountName } : null),
  })
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

async function readIdTokenFromSdk(GoogleSignin) {
  try {
    const tokens = await GoogleSignin.getTokens()
    return tokens?.idToken ?? null
  } catch {
    return null
  }
}

async function persistAccountFromSdk(GoogleSignin, response) {
  const fromResponse = extractUser(response)
  if (fromResponse) {
    await persistLastGoogleAccount(fromResponse)
    return
  }

  const currentUser = GoogleSignin.getCurrentUser?.()
  const fromSdk = extractUser(currentUser) ?? extractUser({ data: currentUser })
  if (fromSdk) {
    await persistLastGoogleAccount(fromSdk)
  }
}

/**
 * @returns {Promise<string|null>} idToken, or null when the response has no usable credential
 */
async function resolveIdToken(GoogleSignin, response) {
  if (response?.type === 'cancelled') {
    throw cancelledError()
  }

  if (response?.type === 'noSavedCredentialFound') {
    return null
  }

  let idToken = extractIdToken(response)
  if (!idToken) {
    idToken = await readIdTokenFromSdk(GoogleSignin)
  }

  if (!idToken) {
    return null
  }

  await persistAccountFromSdk(GoogleSignin, response)
  return idToken
}

async function signInWithAccountPicker(GoogleSignin) {
  try {
    await GoogleSignin.signOut()
  } catch {
    // Ignore when there is no previous Google session.
  }

  const idToken = await resolveIdToken(GoogleSignin, await GoogleSignin.signIn())
  if (!idToken) {
    throw new Error('O Google nao retornou um token de identidade.')
  }
  return idToken
}

async function signInWithLastAccount(GoogleSignin, preferredEmail) {
  // Prefer the previous account on Android when prompting interactively.
  if (preferredEmail) {
    await ensureConfigured(preferredEmail)
  }

  try {
    const silentResponse = await GoogleSignin.signInSilently()
    const silentToken = await resolveIdToken(GoogleSignin, silentResponse)
    if (silentToken) {
      return silentToken
    }
  } catch (error) {
    if (error?.code === 'OAUTH_CANCELLED') {
      throw error
    }
    // Fall through to interactive sign-in without clearing the cached account.
  }

  if (typeof GoogleSignin.hasPreviousSignIn === 'function' && GoogleSignin.hasPreviousSignIn()) {
    const cachedToken = await readIdTokenFromSdk(GoogleSignin)
    if (cachedToken) {
      await persistAccountFromSdk(GoogleSignin, null)
      return cachedToken
    }
  }

  const interactiveResponse = await GoogleSignin.signIn(
    preferredEmail ? { loginHint: preferredEmail } : {},
  )
  const interactiveToken = await resolveIdToken(GoogleSignin, interactiveResponse)
  if (!interactiveToken) {
    throw new Error('O Google nao retornou um token de identidade.')
  }
  return interactiveToken
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

    const preferredAccount = await getLastGoogleAccount()
    return await signInWithLastAccount(GoogleSignin, preferredAccount?.email)
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
