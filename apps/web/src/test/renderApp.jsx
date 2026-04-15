import { render } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import App from '../App.jsx'
import { AuthProvider } from '../features/auth/context/AuthContext.jsx'
import { PlansProvider } from '../features/workspace/context/PlansContext.jsx'

export function renderApp(route = '/') {
  window.history.pushState({}, '', route)

  return render(
    <BrowserRouter>
      <AuthProvider>
        <PlansProvider>
          <App />
        </PlansProvider>
      </AuthProvider>
    </BrowserRouter>,
  )
}
