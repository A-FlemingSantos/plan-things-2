import { render } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import App from '../App.jsx'
import { AuthProvider } from '../features/auth/context/AuthContext.jsx'
import { PreferencesProvider } from '../features/preferences/context/PreferencesContext.jsx'
import { PlansProvider } from '../features/workspace/context/PlansContext.jsx'

export function renderApp(route = '/') {
  window.history.pushState({}, '', route)

  return render(
    <BrowserRouter>
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
