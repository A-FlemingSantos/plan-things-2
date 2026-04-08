import { render } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import App from '../App.jsx'
import { PlansProvider } from '../features/workspace/context/PlansContext.jsx'

export function renderApp(route = '/') {
  window.history.pushState({}, '', route)

  return render(
    <BrowserRouter>
      <PlansProvider>
        <App />
      </PlansProvider>
    </BrowserRouter>,
  )
}
