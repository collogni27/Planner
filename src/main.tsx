import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// Fontes empacotadas no app (funcionam offline). Só o subconjunto latino.
import '@fontsource/dotgothic16/latin-400.css'
import '@fontsource/jetbrains-mono/latin-400.css'
import '@fontsource/jetbrains-mono/latin-700.css'
import './estilo/tokens.css'
import './estilo/base.css'
import { App } from './app/App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
