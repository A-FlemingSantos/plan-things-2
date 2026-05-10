import { render } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import App from '../App.jsx'
import { AuthProvider } from '../features/auth/context/AuthContext.jsx'
import { PreferencesProvider } from '../features/preferences/context/PreferencesContext.jsx'
import { PlansProvider } from '../features/workspace/context/PlansContext.jsx'

export function createDemoSession(overrides = {}) {
  const user = {
    id: 'demo-user-route',
    fullName: 'Arthur Santos',
    email: 'arthur@example.com',
    locale: 'pt-BR',
    timeZone: 'America/Sao_Paulo',
    ...(overrides.user ?? {}),
  }
  const workspace = {
    id: 'demo-workspace',
    name: `Workspace de ${user.fullName}`,
    ...(overrides.workspace ?? {}),
  }

  return {
    accessToken: overrides.accessToken ?? 'demo-login-token',
    demo: true,
    user,
    workspace,
    ...overrides,
    user,
    workspace,
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
