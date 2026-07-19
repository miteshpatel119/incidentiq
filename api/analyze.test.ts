import { describe, expect, it, vi } from 'vitest'

import { analyzeIncident, normalizeOpenRouterResult } from './lib/openrouterAnalysis.js'

describe('normalizeOpenRouterResult', () => {
  it('normalizes a complete valid response', () => {
    const raw = {
      rootCauseAnalysis: {
        rootCause: 'Database connection pool exhausted',
        confidenceScore: 92,
        summary: 'High traffic caused connection pool exhaustion.',
        businessImpact: {
          customersAffected: '5000',
          revenueAtRisk: '$12,000',
          sla: 'SLA breached by 5 minutes',
          blastRadius: 'Payment API',
        },
        remediationSteps: [
          {
            action: 'Increase pool size',
            description: 'Increase max connections from 50 to 100.',
            urgency: 'Immediate',
          },
        ],
        timeline: [
          {
            timestamp: '2024-01-01T10:00:00Z',
            event: 'Connection pool exhausted',
            detail: 'All connections in use',
            type: 'error',
          },
        ],
        verificationSteps: ['Check pool metrics', 'Verify error rate'],
        preventiveActions: [
          { timeframe: 'Short Term', actions: ['Add autoscaling for connection pool'] },
        ],
        recommendedCommands: ['kubectl top pods'],
        postIncidentReport: '## Post-Incident Report\n\n### What happened\nHigh traffic.',
      },
    }

    const result = normalizeOpenRouterResult(raw)
    expect(result.rootCause).toBe('Database connection pool exhausted')
    expect(result.confidenceScore).toBe(92)
    expect(result.businessImpact.customersAffected).toBe('5000')
    // remediation is now an array of objects, not a string
    expect(result.remediation[0]?.steps.length).toBeGreaterThan(0)
    expect(result.timeline).toHaveLength(1)
    expect(result.verificationSteps).toHaveLength(2)
  })

  it('handles missing optional fields with defaults', () => {
    const raw = {}
    const result = normalizeOpenRouterResult(raw)
    expect(result.rootCause).toBe('')
    expect(result.confidenceScore).toBe(85)
    expect(result.businessImpact.customersAffected).toBe('')
    // remediation now defaults to an array with one action
    expect(result.remediation).toHaveLength(1)
    expect(result.timeline).toHaveLength(0)
    expect(result.verificationSteps).toHaveLength(3)
    expect(result.preventiveActions).toHaveLength(1)
  })

  it('extracts string values from nested objects', () => {
    const raw = {
      rootCause: { text: 'Nested root cause value' },
      summary: 'Test summary',
    }
    const result = normalizeOpenRouterResult(raw)
    expect(result.rootCause).toBe('Nested root cause value')
    expect(result.summary).toBe('Test summary')
  })
})

describe('analyzeIncident', () => {
  it('throws when OpenRouter API responds with error', async () => {
    const originalFetch = global.fetch
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: false,
        status: 500,
        text: () => Promise.resolve('Internal server error'),
      } as Response),
    )

    try {
      await analyzeIncident('fake-api-key', {
        incidentId: 'INC-1',
        scenarioKey: 'db-failure',
        service: 'payments-api',
        severity: 'critical',
        summary: 'Database down',
        signal: 'High latency',
        enterpriseData: {},
      })
      expect(true).toBe(false) // should not reach here
    } catch (error) {
      expect((error as Error).message).toContain('OpenRouter request failed')
    } finally {
      global.fetch = originalFetch
    }
  })

  it('throws when OpenRouter returns empty content', async () => {
    const originalFetch = global.fetch
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ choices: [{ message: { content: '' } }] }),
      } as Response),
    )

    try {
      await analyzeIncident('fake-api-key', {
        incidentId: 'INC-1',
        scenarioKey: 'db-failure',
        service: 'payments-api',
        severity: 'critical',
        summary: 'Database down',
        signal: 'High latency',
        enterpriseData: {},
      })
      expect(true).toBe(false)
    } catch (error) {
      expect((error as Error).message).toBe('No response from OpenRouter')
    } finally {
      global.fetch = originalFetch
    }
  })
})
