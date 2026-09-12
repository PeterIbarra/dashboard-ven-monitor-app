import React from 'react'
import ReactDOM from 'react-dom/client'
import { ClerkProvider } from '@clerk/clerk-react'
import MonitorPNUD from './App.jsx'

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!import.meta.env.DEV && !PUBLISHABLE_KEY) {
  throw new Error("Missing VITE_CLERK_PUBLISHABLE_KEY");
}

const app = import.meta.env.DEV ? (
  <React.StrictMode>
    <MonitorPNUD />
  </React.StrictMode>
) : (
  <React.StrictMode>
    <ClerkProvider
      publishableKey={PUBLISHABLE_KEY}
      afterSignOutUrl="/"
      signInFallbackRedirectUrl="/"
      signUpFallbackRedirectUrl="/"
    >
      <MonitorPNUD />
    </ClerkProvider>
  </React.StrictMode>
);

ReactDOM.createRoot(document.getElementById('root')).render(app)
