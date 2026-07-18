import { render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'

import { InvestigationProvider, useInvestigation } from './InvestigationProvider'
import { INVESTIGATION_STEPS } from './investigationTypes'

// Mock the dependencies
vi.mock('@/features/incidents/mockEnterpriseData', () => ({
  getEnterpriseIncidentProfile: vi.fn(() => undefined),
}))

vi.mock('@/features/incidents/mockRCAResults', () => ({
  generateMockRCAResult: vi.fn(() => ({
    rootCause: 'Test root cause',
    confidenceScore: 87,
    summary: 'Test summary',
    evidence: [],
    timeline: [],
    businessImpact: {
      customersAffected: '0',
      revenueAtRisk: '$0',
      sla: 'N/A',
      blastRadius: 'N/A',
    },
    technicalImpact: 'Test technical impact',
    remediation: 'Test remediation',
    verificationSteps: [],
    preventiveActions: [],
    codeFixes: [],
    configFixes: [],
    recommendedCommands: [],
    postIncidentReport: 'Test report',
  })),
}))

vi.mock('@/features/incidents/mockScenarios', () => ({
  mockScenarios: [],
}))

vi.mock('@/features/auth/AuthProvider', () => ({
  useAuth: () => ({ isAuthenticated: true }),
}))

vi.mock('@/lib/toast', () => ({
  showToast: vi.fn(),
}))

// Test component that uses the investigation context
function TestConsumer(): JSX.Element {
   
  const { getInvestigation } = useInvestigation()

  // Get a non-existent investigation to test idle state
  const investigation = getInvestigation('INC-NONEXISTENT')

  return (
    <div>
      <span data-testid="investigation-status">
        {investigation?.status ?? 'idle'}
      </span>
    </div>
  )
}

describe('InvestigationProvider', () => {
  beforeEach(() => {
    // Clean up localStorage before each test
    localStorage.clear()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('context creation and initial state', () => {
    it('provides investigation context with initial empty state', () => {
      render(
        <InvestigationProvider>
          <TestConsumer />
        </InvestigationProvider>,
      )

      expect(screen.getByTestId('investigation-status').textContent).toBe('idle')
    })

    it('loads investigations from localStorage on mount', async () => {
      // Set up existing investigation in localStorage
      const existingInvestigation = [
        [
          'INC-LOADED',
          {
            incidentId: 'INC-LOADED',
            steps: INVESTIGATION_STEPS.map((s) => ({ ...s, status: 'completed' })),
            status: 'completed',
            result: {
              rootCause: 'Loaded root cause',
              confidenceScore: 90,
              summary: 'Loaded summary',
              evidence: [],
              timeline: [],
              businessImpact: {
                customersAffected: '0',
                revenueAtRisk: '$0',
                sla: 'N/A',
                blastRadius: 'N/A',
              },
              technicalImpact: 'Loaded technical impact',
              remediation: 'Loaded remediation',
              verificationSteps: [],
              preventiveActions: [],
              codeFixes: [],
              configFixes: [],
              recommendedCommands: [],
              postIncidentReport: 'Loaded report',
            },
          },
        ],
      ]
      localStorage.setItem('incidentiq-investigations', JSON.stringify(existingInvestigation))

      function LoadedConsumer(): JSX.Element {
         
        const { getInvestigation } = useInvestigation()
        const investigation = getInvestigation('INC-LOADED')

        return (
          <div>
            <span data-testid="loaded-status">
              {investigation?.status ?? 'none'}
            </span>
            <span data-testid="loaded-root-cause">
              {investigation?.result?.rootCause ?? 'no-result'}
            </span>
          </div>
        )
      }

      render(
        <InvestigationProvider>
          <LoadedConsumer />
        </InvestigationProvider>,
      )

      await waitFor(() => {
        expect(screen.getByTestId('loaded-status').textContent).toBe('completed')
        expect(screen.getByTestId('loaded-root-cause').textContent).toBe('Loaded root cause')
      })
    })
  })
})
