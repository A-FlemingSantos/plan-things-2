import { render } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import App from '../App.jsx'
import { AuthProvider } from '../features/auth/context/AuthContext.jsx'
import { PreferencesProvider } from '../features/preferences/context/PreferencesContext.jsx'
import { PlansProvider } from '../features/workspace/context/PlansContext.jsx'

function buildDemoKey(value = '') {
  const normalized = String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

  return normalized || 'demo'
}

export function createDemoSession(overrides = {}) {
  const fallbackEmail = overrides.user?.email ?? 'arthur@example.com'
  const demoKey = buildDemoKey(fallbackEmail)
  const user = {
    id: `demo-user-route-${demoKey}`,
    fullName: 'Arthur Santos',
    email: fallbackEmail,
    locale: 'pt-BR',
    timeZone: 'America/Sao_Paulo',
    ...(overrides.user ?? {}),
  }
  const workspace = {
    id: `demo-workspace-${demoKey}`,
    name: `Workspace de ${user.fullName}`,
    ...(overrides.workspace ?? {}),
  }

  return {
    accessToken: overrides.accessToken ?? `demo-login-token-${demoKey}`,
    demo: true,
    user,
    workspace,
    ...overrides,
    user,
    workspace,
  }
}

export function createAccountStore(accounts, activeAccountId = accounts[0]?.user?.id ?? null) {
  return {
    version: 2,
    activeAccountId,
    accounts,
  }
}

export function createAuthenticatedSession(overrides = {}) {
  const user = {
    id: 'user-route',
    fullName: 'Arthur Santos',
    email: 'arthur@example.com',
    locale: 'pt-BR',
    timeZone: 'America/Sao_Paulo',
    ...(overrides.user ?? {}),
  }
  const workspace = {
    id: 'workspace-1',
    name: `Workspace de ${user.fullName}`,
    ...(overrides.workspace ?? {}),
  }

  return {
    accessToken: overrides.accessToken ?? 'real-access-token',
    demo: false,
    user,
    workspace,
    ...overrides,
    user,
    workspace,
  }
}

export function seedSession(session) {
  if (!session) {
    window.localStorage.removeItem('plan-things.session')
    return null
  }

  window.localStorage.setItem('plan-things.session', JSON.stringify(session))
  return session
}

export function readStoredSessionValue() {
  const rawValue = window.localStorage.getItem('plan-things.session')
  return rawValue ? JSON.parse(rawValue) : null
}

export function readActiveStoredSession() {
  const storedValue = readStoredSessionValue()
  if (!storedValue) return null
  if (!Array.isArray(storedValue.accounts)) return storedValue
  return storedValue.accounts.find((account) => account.user?.id === storedValue.activeAccountId) ?? null
}

export function renderApp(route = '/', { session = null } = {}) {
  window.history.pushState({}, '', route)
  seedSession(session)

  return render(
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AuthProvider>
        <PreferencesProvider>
          <PlansProvider>
            <App />
          </PlansProvider>
        </PreferencesProvider>
      </AuthProvider>
    </BrowserRouter>,
  )
}
