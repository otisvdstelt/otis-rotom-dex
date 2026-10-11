import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource/m-plus-rounded-1c/latin-500.css'
import '@fontsource/m-plus-rounded-1c/latin-700.css'
import '@fontsource/m-plus-rounded-1c/latin-800.css'
import '@fontsource/m-plus-rounded-1c/latin-900.css'
import './index.css'
import App from './App.tsx'

// Opened from a phone's home screen it runs full screen; the stylesheet sizes the page differently there.
const standalone = window.matchMedia('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true
if (standalone) document.documentElement.dataset.standalone = ''

const queryClient = new QueryClient()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>,
)
