import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Toaster } from 'react-hot-toast'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
    <Toaster
      position="top-right"
      toastOptions={{
        style: {
          background: '#1a1a2e',
          color: '#e2d9f3',
          border: '1px solid #4a1080',
        },
        success: { iconTheme: { primary: '#8b5cf6', secondary: '#1a1a2e' } },
        error:   { iconTheme: { primary: '#f87171', secondary: '#1a1a2e' } },
      }}
    />
  </StrictMode>,
)
