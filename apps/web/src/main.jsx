import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { PlansProvider } from './features/workspace/context/PlansContext.jsx'
import App from './App.jsx'
import './shared/styles/globals.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <PlansProvider>
        <App />
      </PlansProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
