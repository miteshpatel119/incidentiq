import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'

import { IncidentSimulationProvider, useIncidentSimulation } from './IncidentSimulationProvider'

// Mock the dependencies
vi.mock('@/features/incidents/mockIncidents', () => ({
  mockIncidents: [
    {
      id: 'INC-OLD-001',
      scenarioKey: 'old-scenario',
      summary: 'Old incident for testing',
      service: 'old-service',
      severity: 'low',
      status: 'resolved',
      startedAt: 'Yesterday',
      createdAt: Date.now() - 86400000,
    },
  ],
}))

vi.mock('@/features/incidents/mockScenarios', () => ({
  mockScenarios: [
    {
      key: 'test-scenario',
      service: 'test-service',
      severity: 'high',
      signal: 'Test signal',
      source: 'Test source',
      status: 'investigating',
      summary: 'Test incident summary',
    },
  ],
  simulationIntervalsMs: [1, 1], // Very short intervals for testing
}))

vi.mock('@/features/auth/AuthProvider', () => ({
  useAuth: () => ({ isAuthenticated: true }),
}))

vi.mock('@/lib/toast', () => ({
  showToast: vi.fn(),
}))

// Test component that uses the incident simulation context
function TestConsumer(): JSX.Element {
  const { incidents, monitoringStatus } = useIncidentSimulation()

  return (
    <div>
      <span data-testid="incident-count">{incidents.length}</span>
      <span data-testid="monitoring-status">{monitoringStatus}</span>
    </div>
  )
}

describe('IncidentSimulationProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('initial render', () => {
    it('renders with initial state', () => {
      render(
        <IncidentSimulationProvider>
          <TestConsumer />
        </IncidentSimulationProvider>,
      )

      // Should have at least one incident from mockIncidents
      const count = parseInt(screen.getByTestId('incident-count').textContent ?? '0', 10)
      expect(count).toBeGreaterThanOrEqual(1)
    })

    it('starts with connecting status', () => {
      render(
        <IncidentSimulationProvider>
          <TestConsumer />
        </IncidentSimulationProvider>,
      )

      // Initially should be connecting
      expect(screen.getByTestId('monitoring-status').textContent).toBe('connecting')
    })
  })
})