import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import type { ReactNode } from 'react'
import { Layout } from '@/components/layout/Layout'
import { useAuth } from '@/context/AuthContext'
import { PageLoader } from '@/components/ui/Common'

import HomePage from '@/pages/HomePage'
import DressesPage, { ListingPage } from '@/pages/DressesPage'
import DressDetailsPage from '@/pages/DressDetailsPage'
import BookPage from '@/pages/BookPage'
import AuthPage from '@/pages/AuthPage'
import AccountPage from '@/pages/AccountPage'
import FavoritesPage from '@/pages/FavoritesPage'
import AboutPage from '@/pages/AboutPage'
import ContactPage from '@/pages/ContactPage'
import NotFoundPage from '@/pages/NotFoundPage'

import AdminLayout from '@/pages/admin/AdminLayout'
import AdminLoginPage from '@/pages/admin/AdminLoginPage'
import DashboardPage from '@/pages/admin/DashboardPage'
import DressesAdminPage from '@/pages/admin/DressesAdminPage'
import DressFormPage from '@/pages/admin/DressFormPage'
import AppointmentsAdminPage from '@/pages/admin/AppointmentsAdminPage'
import PointsAdminPage from '@/pages/admin/PointsAdminPage'
import SettingsAdminPage from '@/pages/admin/SettingsAdminPage'
import NotificationsAdminPage from '@/pages/admin/NotificationsAdminPage'

function RequireAdmin({ children }: { children: ReactNode }) {
  const { user, profile, isAdmin, loading } = useAuth()
  const location = useLocation()
  if (loading) return <PageLoader />
  if (!user) return <Navigate to="/admin/login" state={{ from: location.pathname }} replace />
  if (!profile) return <PageLoader />
  if (!isAdmin) return <Navigate to="/admin/login" replace />
  return <>{children}</>
}

/** يتطلب حسابًا — يحفظ الوجهة المطلوبة للعودة إليها بعد الدخول */
function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()
  const location = useLocation()
  if (loading) return <PageLoader />
  if (!user) return <Navigate to="/auth" state={{ from: location.pathname + location.search }} replace />
  return <>{children}</>
}

export default function App() {
  return (
    <Routes>
      {/* واجهة العميل */}
      <Route element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="dresses" element={<DressesPage />} />
        <Route path="dresses/:slug" element={<DressDetailsPage />} />
        <Route path="rent" element={<ListingPage mode="rent" />} />
        <Route path="buy" element={<ListingPage mode="sale" />} />
        <Route path="book" element={<RequireAuth><BookPage /></RequireAuth>} />
        <Route path="favorites" element={<FavoritesPage />} />
        <Route path="auth" element={<AuthPage />} />
        <Route path="account" element={<AccountPage />} />
        <Route path="about" element={<AboutPage />} />
        <Route path="contact" element={<ContactPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>

      {/* لوحة التحكم */}
      <Route path="/admin/login" element={<AdminLoginPage />} />
      <Route
        path="/admin"
        element={
          <RequireAdmin>
            <AdminLayout />
          </RequireAdmin>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="dresses" element={<DressesAdminPage />} />
        <Route path="dresses/new" element={<DressFormPage />} />
        <Route path="dresses/:id" element={<DressFormPage />} />
        <Route path="appointments" element={<AppointmentsAdminPage />} />
        <Route path="points" element={<PointsAdminPage />} />
        <Route path="settings" element={<SettingsAdminPage />} />
        <Route path="notifications" element={<NotificationsAdminPage />} />
      </Route>
    </Routes>
  )
}
