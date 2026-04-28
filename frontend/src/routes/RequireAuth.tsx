import type { ReactNode } from 'react'
import { RedirectToSignIn, SignedIn, SignedOut } from '@clerk/clerk-react'

export function RequireAuth({ children }: { children: ReactNode }) {
  return (
    <>
      <SignedIn>{children}</SignedIn>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
    </>
  )
}

