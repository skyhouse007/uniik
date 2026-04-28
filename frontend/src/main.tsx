import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { ClerkProvider } from '@clerk/clerk-react'
import { Provider } from 'react-redux'
import { HelmetProvider } from 'react-helmet-async'
import App from './App.tsx'
import { store } from './store/store'

const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string | undefined
if (!clerkPubKey) {
  // eslint-disable-next-line no-console
  console.warn(
    'Missing VITE_CLERK_PUBLISHABLE_KEY. Add it to frontend/.env.local to enable authentication.',
  )
}

function AppProviders() {
  if (!clerkPubKey) {
    return (
      <div className="container-page py-10">
        <div className="rounded-2xl border border-[rgb(var(--border))] bg-white p-6 text-sm">
          Missing <code>VITE_CLERK_PUBLISHABLE_KEY</code> in <code>frontend/.env.local</code>.
          <div className="mt-2 text-[rgb(var(--muted))]">
            Add your Clerk key and restart <code>npm run dev</code>.
          </div>
        </div>
      </div>
    )
  }
  return (
    <ClerkProvider publishableKey={clerkPubKey}>
      <App />
    </ClerkProvider>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HelmetProvider>
      <Provider store={store}>
        <AppProviders />
      </Provider>
    </HelmetProvider>
  </StrictMode>,
)
