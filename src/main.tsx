import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { registerServiceWorker } from './lib/push'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// Register the service worker on startup. The actual push subscription
// happens later when the user opts in via the Dashboard Enable Notifications
// button — this just makes the SW available for the registration call to
// reuse.
void registerServiceWorker();
