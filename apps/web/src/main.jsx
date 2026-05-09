import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './features/auth/context/AuthContext.jsx'
import { PreferencesProvider } from './features/preferences/context/PreferencesContext.jsx'
import { PlansProvider } from './features/workspace/context/PlansContext.jsx'
import App from './App.jsx'
import './shared/styles/globals.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AuthProvider>
        <PreferencesProvider>
          <PlansProvider>
            <App />
          </PlansProvider>
        </PreferencesProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
