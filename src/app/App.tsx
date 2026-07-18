import { BrowserRouter } from 'react-router-dom'

import { AppRoutes } from '@/app/routes'
import { AuthProvider } from '@/features/auth/AuthProvider'
import { ErrorBoundary } from '@/features/shared/ErrorBoundary'
import { IncidentSimulationProvider } from '@/features/incidents/IncidentSimulationProvider'
import { InvestigationProvider } from '@/features/incidents/InvestigationProvider'
import { ThemeProvider } from '@/features/theme/ThemeProvider'

export function App(): JSX.Element {
  return (
    <ThemeProvider>
      <AuthProvider>
        <IncidentSimulationProvider>
          <InvestigationProvider>
            <BrowserRouter>
              <ErrorBoundary>
                <AppRoutes />
              </ErrorBoundary>
            </BrowserRouter>
          </InvestigationProvider>
        </IncidentSimulationProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}
