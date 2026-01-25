import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { AppStateProvider } from './contexts/AppStateContext.jsx'

createRoot(document.getElementById('root')).render(
   <AppStateProvider>
    <App />
    </AppStateProvider>
)
