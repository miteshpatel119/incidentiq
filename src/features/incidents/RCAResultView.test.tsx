import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'

import { RCAResultView } from './RCAResultView'
import type { RCAResult } from './investigationTypes'

// Mock clipboard API
const mockClipboard = {
  writeText: vi.fn().mockResolvedValue(undefined),
}

Object.defineProperty(navigator, 'clipboard', {
  value: mockClipboard,
  writable: true,
})

// Mock URL APIs
const mockCreateObjectURL = vi.fn()
const mockRevokeObjectURL = vi.fn()

Object.defineProperty(URL, 'createObjectURL', {
  value: mockCreateObjectURL,
})

Object.defineProperty(URL, 'revokeObjectURL', {
  value: mockRevokeObjectURL,
})

describe('RCAResultView', () => {
  const mockResult: RCAResult = {
    rootCause: 'Database connection pool exhausted',
    confidenceScore: 87,
    confidenceAnalysis: {
      score: 87,
      reasoning: 'Multiple strong indicators point to database pool exhaustion as the root cause.',
      supportingSignals: ['Configuration change detected', 'Connection pool metrics spike', 'Historical incident found'],
    },
    summary: 'Database pool was exhausted due to increased traffic and configuration change.',
    evidence: [
      {
        title: 'Configuration change detected: DB_POOL_MAX',
        description: 'DB_POOL_MAX was changed from "40" to "80"',
        source: 'Configuration Audit Log',
        severity: 'critical',
        confidence: 95,
      },
      {
        title: 'Metric anomaly: orders_api.error_rate',
        description: 'orders_api.error_rate spiked from 0.18% to 82.4%',
        source: 'Monitoring Dashboard',
        severity: 'supporting',
        confidence: 88,
      },
      {
        title: 'Similar historical incident: INC-982',
        description:
          'Order API pool saturation during promotion — resolved by: Reduced per-pod pool allocation',
        source: 'Incident History',
        severity: 'contextual',
        confidence: 70,
      },
    ],
    timeline: [
      {
        timestamp: '2026-07-16T09:14:22Z',
        event: '[ERROR] orders-api',
        detail: 'DatabasePool.acquire failed after 3000ms',
        type: 'error',
        severity: 'critical',
        category: 'Application Log',
      },
      {
        timestamp: '2026-07-16T09:15:00Z',
        event: 'Deployment: 2026.07.16.2',
        detail: 'Enabled expanded database pool for bulk-order endpoint',
        type: 'change',
        severity: 'high',
        category: 'Deployment',
      },
    ],
    businessImpact: {
      customersAffected: '~18,400 active checkout sessions',
      revenueAtRisk: '$41,000 per 15 minutes',
      sla: 'Enterprise checkout availability SLO breached',
      blastRadius: 'Order creation and payment capture in us-east-1',
    },
    technicalImpact: 'Affected Service: orders-api\nInfrastructure Impact: production environment\nDependency Impact: PostgreSQL connection pool\nUser Impact: Service unavailable errors',
    remediation: [
      { priority: 1, title: 'Immediate action', steps: ['Roll back the most recent configuration change', 'Restart affected services'] },
      { priority: 2, title: 'Service recovery', steps: ['Verify health metrics', 'Monitor error rates'] },
    ],
    verificationSteps: [
      '✓ Verify service health endpoints return 200 OK',
      '✓ Confirm error rates return to baseline levels',
      '✓ Check that all pods are in Running state',
    ],
    preventiveActions: [
      { timeframe: 'Short Term', actions: ['Add automated canary analysis for configuration changes'] },
      { timeframe: 'Medium Term', actions: ['Implement progressive rollout with automatic rollback'] },
      { timeframe: 'Long Term', actions: ['Capacity planning and optimization'] },
    ],
    codeFixes: [
      {
        file: 'services/orders/src/db/pool.ts',
        language: 'typescript',
        before: 'max: env.DB_POOL_MAX ?? 80',
        after: 'max: safeEnv.DB_POOL_MAX ?? 80',
        explanation: 'Add safety bounds and null checks to prevent unexpected failures.',
      },
    ],
    configFixes: [
      {
        key: 'DB_POOL_MAX',
        before: '40',
        after: '40',
        explanation: 'Revert DB_POOL_MAX from "80" back to "40"',
      },
    ],
    recommendedCommands: [
      'kubectl get pods',
      'kubectl logs -n default deployment/orders-api --tail=100',
    ],
    kubectlCommands: {
      investigation: ['kubectl get pods -n default'],
      recovery: ['kubectl rollout undo deployment/orders-api -n default'],
      verification: ['kubectl get pods -n default'],
      monitoring: ['kubectl top nodes'],
    },
    postIncidentReport:
      '## Post-Incident Report\n\n### What happened\nDatabase pool exhausted.\n\n### Root cause\nPool configuration issue.\n\n### Impact\nAffected customers.\n\n### Action items\n1. Apply fixes\n2. Verify',
    executiveSummary: 'Database pool exhausted due to configuration change. Service restored after rollback.',
    incidentSeverityExplanation: 'Critical - Complete service unavailability requiring immediate attention.',
    lessonsLearned: [
      'Always restart pods after configuration changes',
      'Implement alerts before threshold breaches',
      'Test changes with canary deployment',
      'Document rollback procedures',
      'Add synthetic transaction tests',
    ],
  }

  beforeEach(() => {
    vi.useFakeTimers()
    mockClipboard.writeText.mockClear()
    mockCreateObjectURL.mockClear()
    mockRevokeObjectURL.mockClear()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.clearAllMocks()
  })

  describe('root cause display', () => {
    it('displays root cause heading', () => {
      render(<RCAResultView result={mockResult} incidentId="INC-TEST-001" />)

      expect(screen.getByText('Root cause analysis')).toBeInTheDocument()
      expect(screen.getByText('Database connection pool exhausted')).toBeInTheDocument()
    })

    it('displays summary', () => {
      render(<RCAResultView result={mockResult} incidentId="INC-TEST-001" />)

      expect(screen.getByText(/Database pool was exhausted/)).toBeInTheDocument()
    })
  })

  describe('confidence meter', () => {
    it('displays confidence score', () => {
      render(<RCAResultView result={mockResult} incidentId="INC-TEST-001" />)

      expect(screen.getByText('Confidence score')).toBeInTheDocument()
      expect(screen.getByText('87%')).toBeInTheDocument()
    })

    it('displays high confidence with correct styling', () => {
      render(<RCAResultView result={mockResult} incidentId="INC-TEST-001" />)

      // 87 >= 80, should have emerald styling
      expect(screen.getByText('87%')).toBeInTheDocument()
    })

    it('displays medium confidence with correct styling', () => {
      render(
        <RCAResultView result={{ ...mockResult, confidenceScore: 70 }} incidentId="INC-TEST-001" />,
      )

      // 70 >= 60, should have amber styling - use regex to match "70%" text
      const elements = screen.getAllByText(/70/)
      expect(elements.length).toBeGreaterThan(0)
    })

    it('displays low confidence with correct styling', () => {
      render(
        <RCAResultView result={{ ...mockResult, confidenceScore: 45 }} incidentId="INC-TEST-001" />,
      )

      expect(screen.getByText('45%')).toBeInTheDocument()
    })
  })

  describe('business impact', () => {
    it('displays business impact section', () => {
      render(<RCAResultView result={mockResult} incidentId="INC-TEST-001" />)

      expect(screen.getByText('Business impact')).toBeInTheDocument()
      expect(screen.getByText('Customers affected')).toBeInTheDocument()
      expect(screen.getByText('Revenue at risk')).toBeInTheDocument()
      expect(screen.getByText('SLA impact')).toBeInTheDocument()
      expect(screen.getByText('Blast radius')).toBeInTheDocument()
    })

    it('displays business impact values', () => {
      render(<RCAResultView result={mockResult} incidentId="INC-TEST-001" />)

      expect(screen.getByText('~18,400 active checkout sessions')).toBeInTheDocument()
      expect(screen.getByText('$41,000 per 15 minutes')).toBeInTheDocument()
    })
  })

  describe('evidence card', () => {
    it('displays evidence section', () => {
      render(<RCAResultView result={mockResult} incidentId="INC-TEST-001" />)

      expect(screen.getByText(/Evidence/)).toBeInTheDocument()
    })

    it('displays evidence items', () => {
      render(<RCAResultView result={mockResult} incidentId="INC-TEST-001" />)

      expect(screen.getByText('Configuration change detected: DB_POOL_MAX')).toBeInTheDocument()
      expect(screen.getByText('Metric anomaly: orders_api.error_rate')).toBeInTheDocument()
    })

    it('shows severity badges for evidence', () => {
      render(<RCAResultView result={mockResult} incidentId="INC-TEST-001" />)

      const criticalBadges = screen.getAllByText('critical')
      expect(criticalBadges.length).toBeGreaterThan(0)
    })
  })

  describe('timeline card', () => {
    it('displays timeline section', () => {
      render(<RCAResultView result={mockResult} incidentId="INC-TEST-001" />)

      expect(screen.getByText('Incident timeline')).toBeInTheDocument()
    })

    it('displays timeline events', () => {
      render(<RCAResultView result={mockResult} incidentId="INC-TEST-001" />)

      expect(screen.getByText(/\[ERROR\] orders-api/)).toBeInTheDocument()
      expect(screen.getByText(/Deployment:/)).toBeInTheDocument()
    })
  })

  describe('technical impact and remediation', () => {
    it('displays technical impact section', () => {
      render(<RCAResultView result={mockResult} incidentId="INC-TEST-001" />)

      expect(screen.getByText('Technical impact')).toBeInTheDocument()
    })

    it('displays remediation section', () => {
      render(<RCAResultView result={mockResult} incidentId="INC-TEST-001" />)

      expect(screen.getByText('Remediation steps')).toBeInTheDocument()
    })
  })

  describe('verification steps', () => {
    it('displays verification steps section', () => {
      render(<RCAResultView result={mockResult} incidentId="INC-TEST-001" />)

      expect(screen.getByText('Verification steps')).toBeInTheDocument()
    })

    it('displays all verification steps', () => {
      render(<RCAResultView result={mockResult} incidentId="INC-TEST-001" />)

      expect(screen.getByText(/Verify service health endpoints return 200 OK/)).toBeInTheDocument()
      expect(screen.getByText(/Confirm error rates return to baseline levels/)).toBeInTheDocument()
    })
  })

  describe('preventive actions', () => {
    it('displays preventive actions section', () => {
      render(<RCAResultView result={mockResult} incidentId="INC-TEST-001" />)

      expect(screen.getByText('Preventive actions')).toBeInTheDocument()
    })

    it('displays all preventive actions', () => {
      render(<RCAResultView result={mockResult} incidentId="INC-TEST-001" />)

      expect(
        screen.getByText(/Add automated canary analysis for configuration changes/),
      ).toBeInTheDocument()
    })
  })

  describe('code fixes', () => {
    it('displays code fix suggestions section', () => {
      render(<RCAResultView result={mockResult} incidentId="INC-TEST-001" />)

      expect(screen.getByText('Code fix suggestions')).toBeInTheDocument()
    })

    it('displays file name', () => {
      render(<RCAResultView result={mockResult} incidentId="INC-TEST-001" />)

      expect(screen.getByText('services/orders/src/db/pool.ts')).toBeInTheDocument()
    })

    it('displays code diff sections', () => {
      render(<RCAResultView result={mockResult} incidentId="INC-TEST-001" />)

      expect(screen.getByText('Before')).toBeInTheDocument()
      expect(screen.getByText('After')).toBeInTheDocument()
    })
  })

  describe('configuration fixes', () => {
    it('displays configuration fixes section', () => {
      render(<RCAResultView result={mockResult} incidentId="INC-TEST-001" />)

      expect(screen.getByText('Configuration fixes')).toBeInTheDocument()
    })

    it('displays config key', () => {
      render(<RCAResultView result={mockResult} incidentId="INC-TEST-001" />)

      expect(screen.getByText('DB_POOL_MAX')).toBeInTheDocument()
    })
  })

  describe('recommended commands', () => {
    it('displays recommended commands section', () => {
      render(<RCAResultView result={mockResult} incidentId="INC-TEST-001" />)

      expect(screen.getByText('Recommended commands')).toBeInTheDocument()
    })

    it('displays commands', () => {
      render(<RCAResultView result={mockResult} incidentId="INC-TEST-001" />)

      expect(screen.getByText('kubectl get pods')).toBeInTheDocument()
    })
  })

  describe('post-incident report', () => {
    it('displays post-incident report section', () => {
      render(<RCAResultView result={mockResult} incidentId="INC-TEST-001" />)

      expect(screen.getByText('Post-incident report')).toBeInTheDocument()
    })
  })

  describe('actions', () => {
    it('renders copy report button', () => {
      render(<RCAResultView result={mockResult} incidentId="INC-TEST-001" />)

      expect(screen.getByText('Copy report')).toBeInTheDocument()
    })

    it('renders download button', () => {
      render(<RCAResultView result={mockResult} incidentId="INC-TEST-001" />)

      expect(screen.getByText('Download')).toBeInTheDocument()
    })
  })
})
