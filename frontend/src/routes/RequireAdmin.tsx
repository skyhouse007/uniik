import type { ReactNode } from 'react'
import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { adminMe } from '../api/admin'
import { clearAdminToken } from '../utils/adminAuth'

function AdminGate({ children }: { children: ReactNode }) {
  const [state, setState] = useState<'loading' | 'ok' | 'denied'>('loading')

  useEffect(() => {
    let alive = true
    adminMe()
      .then(() => alive && setState('ok'))
      .catch(() => {
        clearAdminToken()
        alive && setState('denied')
      })
    return () => {
      alive = false
    }
  }, [])

  if (state === 'loading') return <div className="container-page py-10">Loading…</div>
  if (state !== 'ok') {
    return <Navigate to="/admin/login" replace />
  }
  return <>{children}</>
}

export function RequireAdmin({ children }: { children: ReactNode }) {
  return <AdminGate>{children}</AdminGate>
}

