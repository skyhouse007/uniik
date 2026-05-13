import { Outlet, ScrollRestoration, useLocation } from 'react-router-dom'
import { Navbar } from './Navbar'
import { Footer } from './Footer'

export function Layout() {
  const { pathname } = useLocation()
  const isHome = pathname === '/' || pathname === ''

  return (
    <div className={isHome ? 'min-h-screen bg-black' : 'min-h-screen bg-page-gradient'}>
      <Navbar />
      <main className={isHome ? 'min-h-[70vh] bg-black text-neutral-100' : 'min-h-[70vh]'}>
        <Outlet />
      </main>
      <Footer />
      <ScrollRestoration />
    </div>
  )
}

