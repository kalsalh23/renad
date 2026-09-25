import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Header } from './Header'
import { Footer } from './Footer'
import { MobileBottomNav } from './MobileBottomNav'
import { WhatsAppFloat } from './WhatsAppFloat'
import { InstallApp } from './InstallApp'

export function Layout() {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' })
  }, [pathname])

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 pb-14 md:pb-0">
        <Outlet />
      </main>
      <Footer />
      <MobileBottomNav />
      <WhatsAppFloat />
      <InstallApp />
    </div>
  )
}
