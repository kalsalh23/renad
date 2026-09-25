import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './index.css'
import { AuthProvider } from '@/context/AuthContext'
import { SettingsProvider } from '@/context/SettingsContext'
import { FavoritesProvider } from '@/context/FavoritesContext'
import { ToastProvider } from '@/context/ToastContext'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <SettingsProvider>
            <FavoritesProvider>
              <App />
            </FavoritesProvider>
          </SettingsProvider>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  </StrictMode>,
)

// تسجيل Service Worker لتفعيل وضع التطبيق (PWA)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {})
  })
}
