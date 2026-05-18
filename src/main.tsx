import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HelmetProvider } from 'react-helmet-async'
import LandingPage from './landing/LandingPage'
import './index.css'
import '../animations.css'

localStorage.clear()
sessionStorage.clear()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HelmetProvider>
      <LandingPage />
    </HelmetProvider>
  </StrictMode>,
)
