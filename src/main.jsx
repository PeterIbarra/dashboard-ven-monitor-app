import React from 'react'
import ReactDOM from 'react-dom/client'
import { ClerkProvider } from '@clerk/clerk-react'
import MonitorPNUD from './App.jsx'

const PUBLISHABLE_KEY = "pk_test_a2Vlbi1hbHBhY2EtNDEuY2xlcmsuYWNjb3VudHMuZGV2JA";

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ClerkProvider
      publishableKey={PUBLISHABLE_KEY}
      afterSignOutUrl="/"
      afterSignInUrl="/"
      afterSignUpUrl="/"
    >
      <MonitorPNUD />
    </ClerkProvider>
  </React.StrictMode>
)
