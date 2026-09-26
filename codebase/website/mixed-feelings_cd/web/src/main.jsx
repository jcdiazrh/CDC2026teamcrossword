import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource-variable/bricolage-grotesque/opsz.css'
import '@fontsource-variable/dm-sans'
import './index.css'
import App from './App.jsx'

// Spotify only accepts http://127.0.0.1 (not "localhost") as a local redirect URI.
if (window.location.hostname === 'localhost') {
  window.location.replace(window.location.href.replace('//localhost', '//127.0.0.1'))
} else {
  createRoot(document.getElementById('root')).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}
