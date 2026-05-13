import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { ClerkProvider } from '@clerk/clerk-react'
import { dark } from '@clerk/themes'
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

const clerkAppearance = {
  baseTheme: dark,
  variables: {
    colorPrimary: '#ffffff',
    colorTextOnPrimaryBackground: '#0a0a0a',
    colorBackground: '#0a0a0a',
    colorInputBackground: '#141414',
    colorText: '#fafafa',
    colorTextSecondary: '#a3a3a3',
    colorDanger: '#f87171',
    borderRadius: '0.75rem',
  },
}

function AppProviders() {
  if (!clerkPubKey) {
    return (
      <div className="container-page py-10">
        <div className="rounded-2xl border border-white/12 bg-black/45 p-6 text-sm text-[rgb(var(--fg))] backdrop-blur-sm">
          Missing <code className="text-white/80">VITE_CLERK_PUBLISHABLE_KEY</code> in{' '}
          <code className="text-white/80">frontend/.env.local</code>.
          <div className="mt-2 text-[rgb(var(--muted))]">
            Add your Clerk key and restart <code className="text-white/70">npm run dev</code>.
          </div>
        </div>
      </div>
    )
  }
  return (
    <ClerkProvider publishableKey={clerkPubKey} appearance={clerkAppearance}>
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
