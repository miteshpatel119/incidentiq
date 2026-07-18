import { Navigate, Route, Routes } from 'react-router-dom'

import { AppLayout } from '@/components/layout/AppLayout'
import { ProtectedRoute } from '@/features/auth/ProtectedRoute'
import { DashboardPage } from '@/features/dashboard/DashboardPage'
import { ErrorBoundary } from '@/features/shared/ErrorBoundary'
import { IncidentDetailPage } from '@/features/incidents/IncidentDetailPage'
import { IncidentsPage } from '@/features/incidents/IncidentsPage'
import { LoginPage } from '@/features/auth/LoginPage'
import { PlaceholderPage } from '@/features/shared/PlaceholderPage'

export function AppRoutes(): JSX.Element {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/incidents" element={<IncidentsPage />} />
          <Route
            path="/incidents/:incidentId"
            element={
              <ErrorBoundary>
                <IncidentDetailPage />
              </ErrorBoundary>
            }
          />
          <Route path="/services" element={<PlaceholderPage title="Services" />} />
          <Route path="/reports" element={<PlaceholderPage title="RCA reports" />} />
          <Route path="/settings" element={<PlaceholderPage title="Settings" />} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
