import { describe, expect, it } from 'vitest'

import { generateMockRCAResult } from './mockRCAResults'
import { getEnterpriseIncidentProfile } from './mockEnterpriseData'

describe('mockRCAResults', () => {
  describe('generateMockRCAResult', () => {
    it('generates valid RCA result for database-primary-unavailable scenario', () => {
      const profile = getEnterpriseIncidentProfile('database-primary-unavailable', Date.now())
      expect(profile).toBeDefined()

      const result = generateMockRCAResult('INC-TEST-001', profile!)

      expect(result.rootCause).toBeTruthy()
      expect(result.confidenceScore).toBeGreaterThanOrEqual(0)
      expect(result.confidenceScore).toBeLessThanOrEqual(100)
      expect(result.summary).toBeTruthy()
      expect(result.evidence).toBeInstanceOf(Array)
      expect(result.timeline).toBeInstanceOf(Array)
      expect(result.businessImpact).toBeDefined()
      expect(result.businessImpact.customersAffected).toBeTruthy()
      expect(result.businessImpact.revenueAtRisk).toBeTruthy()
      expect(result.businessImpact.sla).toBeTruthy()
      expect(result.businessImpact.blastRadius).toBeTruthy()
      expect(result.technicalImpact).toBeTruthy()
      expect(result.remediation).toBeTruthy()
      expect(result.verificationSteps).toBeInstanceOf(Array)
      expect(result.preventiveActions).toBeInstanceOf(Array)
      expect(result.codeFixes).toBeInstanceOf(Array)
      expect(result.configFixes).toBeInstanceOf(Array)
      expect(result.recommendedCommands).toBeInstanceOf(Array)
      expect(result.postIncidentReport).toBeTruthy()
    })

    it('generates timeline entries from deployment history', () => {
      const profile = getEnterpriseIncidentProfile('payments-api-timeout', Date.now())!
      const result = generateMockRCAResult('INC-TEST-002', profile)

      const deploymentEvents = result.timeline.filter((e) => e.type === 'change')
      expect(deploymentEvents.length).toBeGreaterThan(0)
    })

    it('generates timeline entries from config changes', () => {
      const profile = getEnterpriseIncidentProfile('configuration-change', Date.now())!
      const result = generateMockRCAResult('INC-TEST-003', profile)

      const configEvents = result.timeline.filter((e) => e.type === 'change')
      expect(configEvents.length).toBeGreaterThan(0)
    })

    it('generates timeline entries from kubernetes events', () => {
      const profile = getEnterpriseIncidentProfile('kubernetes-pod-crash', Date.now())!
      const result = generateMockRCAResult('INC-TEST-004', profile)

      const k8sEvents = result.timeline.filter(
        (e) => e.event.includes('K8s') || e.event.includes('OOMKilled'),
      )
      expect(k8sEvents.length).toBeGreaterThan(0)
    })

    it('generates timeline entries from application logs', () => {
      const profile = getEnterpriseIncidentProfile('database-primary-unavailable', Date.now())!
      const result = generateMockRCAResult('INC-TEST-005', profile)

      const logEvents = result.timeline.filter((e) => e.event.includes('orders-api'))
      expect(logEvents.length).toBeGreaterThan(0)
    })

    it('generates evidence from configuration changes', () => {
      const profile = getEnterpriseIncidentProfile('database-primary-unavailable', Date.now())!
      const result = generateMockRCAResult('INC-TEST-006', profile)

      const configEvidence = result.evidence.filter((e) =>
        e.title.includes('Configuration change'),
      )
      expect(configEvidence.length).toBeGreaterThan(0)
      expect(configEvidence[0].severity).toBe('critical')
    })

    it('generates evidence from deployment history', () => {
      const profile = getEnterpriseIncidentProfile('deployment-regression', Date.now())!
      const result = generateMockRCAResult('INC-TEST-007', profile)

      const deploymentEvidence = result.evidence.filter((e) =>
        e.title.includes('deployment'),
      )
      expect(deploymentEvidence.length).toBeGreaterThan(0)
      expect(deploymentEvidence[0].severity).toBe('critical')
    })

    it('generates evidence from metrics', () => {
      const profile = getEnterpriseIncidentProfile('kubernetes-pod-crash', Date.now())!
      const result = generateMockRCAResult('INC-TEST-008', profile)

      const metricEvidence = result.evidence.filter((e) =>
        e.title.includes('Metric anomaly'),
      )
      expect(metricEvidence.length).toBeGreaterThan(0)
      expect(metricEvidence[0].severity).toBe('supporting')
    })

    it('generates evidence from historical incidents', () => {
      const profile = getEnterpriseIncidentProfile('ssl-certificate-expiry', Date.now())!
      const result = generateMockRCAResult('INC-TEST-009', profile)

      const histEvidence = result.evidence.filter((e) =>
        e.title.includes('historical incident'),
      )
      expect(histEvidence.length).toBeGreaterThan(0)
      expect(histEvidence[0].severity).toBe('contextual')
    })

    it('generates code fixes from code snippets', () => {
      const profile = getEnterpriseIncidentProfile('database-primary-unavailable', Date.now())!
      const result = generateMockRCAResult('INC-TEST-010', profile)

      expect(result.codeFixes.length).toBeGreaterThanOrEqual(1)
      expect(result.codeFixes[0]).toHaveProperty('file')
      expect(result.codeFixes[0]).toHaveProperty('language')
      expect(result.codeFixes[0]).toHaveProperty('before')
      expect(result.codeFixes[0]).toHaveProperty('after')
      expect(result.codeFixes[0]).toHaveProperty('explanation')
    })

    it('generates config fixes from configuration changes', () => {
      const profile = getEnterpriseIncidentProfile('payments-api-timeout', Date.now())!
      const result = generateMockRCAResult('INC-TEST-011', profile)

      expect(result.configFixes.length).toBeGreaterThanOrEqual(1)
      expect(result.configFixes[0]).toHaveProperty('key')
      expect(result.configFixes[0]).toHaveProperty('before')
      expect(result.configFixes[0]).toHaveProperty('after')
      expect(result.configFixes[0]).toHaveProperty('explanation')
    })

    it('generates recommended commands for kubernetes incidents', () => {
      const profile = getEnterpriseIncidentProfile('kubernetes-pod-crash', Date.now())!
      const result = generateMockRCAResult('INC-TEST-012', profile)

      const kubectlCommands = result.recommendedCommands.filter((cmd) =>
        cmd.includes('kubectl'),
      )
      expect(kubectlCommands.length).toBeGreaterThan(0)
    })

    it('generates verification steps', () => {
      const profile = getEnterpriseIncidentProfile('database-primary-unavailable', Date.now())!
      const result = generateMockRCAResult('INC-TEST-013', profile)

      expect(result.verificationSteps.length).toBeGreaterThanOrEqual(3)
      expect(result.verificationSteps).toContain(
        'Verify service health endpoints return 200 OK',
      )
      expect(result.verificationSteps).toContain(
        'Confirm error rates return to baseline levels',
      )
    })

    it('generates preventive actions', () => {
      const profile = getEnterpriseIncidentProfile('database-primary-unavailable', Date.now())!
      const result = generateMockRCAResult('INC-TEST-014', profile)

      expect(result.preventiveActions.length).toBeGreaterThanOrEqual(1)
      expect(result.preventiveActions[0]).toBeTruthy()
    })

    it('generates post-incident report with incident ID', () => {
      const profile = getEnterpriseIncidentProfile('database-primary-unavailable', Date.now())!
      const result = generateMockRCAResult('INC-TEST-015', profile)

      expect(result.postIncidentReport).toContain('INC-TEST-015')
      expect(result.postIncidentReport).toContain('## Post-Incident Report')
    })

    it('generates correct root cause for each scenario type', () => {
      const scenarios = [
        'database-primary-unavailable',
        'payments-api-timeout',
        'kubernetes-pod-crash',
        'deployment-regression',
        'ssl-certificate-expiry',
        'configuration-change',
        'message-queue-backlog',
      ] as const

      for (const scenarioKey of scenarios) {
        const profile = getEnterpriseIncidentProfile(scenarioKey, Date.now())!
        const result = generateMockRCAResult(`INC-TEST-${scenarioKey}`, profile)

        expect(result.rootCause).toBeTruthy()
        expect(result.rootCause.length).toBeGreaterThan(10)
      }
    })

    it('generates correct summary for each scenario type', () => {
      const scenarios = [
        'database-primary-unavailable',
        'payments-api-timeout',
        'kubernetes-pod-crash',
        'deployment-regression',
        'ssl-certificate-expiry',
        'configuration-change',
        'message-queue-backlog',
      ] as const

      for (const scenarioKey of scenarios) {
        const profile = getEnterpriseIncidentProfile(scenarioKey, Date.now())!
        const result = generateMockRCAResult(`INC-TEST-${scenarioKey}`, profile)

        expect(result.summary).toBeTruthy()
        expect(result.summary.length).toBeGreaterThan(20)
      }
    })

    it('generates technical impact with infrastructure data', () => {
      const profile = getEnterpriseIncidentProfile('database-primary-unavailable', Date.now())!
      const result = generateMockRCAResult('INC-TEST-016', profile)

      expect(result.technicalImpact).toContain('production')
      expect(result.technicalImpact).toMatch(/\d+%/) // Should contain percentage values
    })

    it('generates timeline sorted by timestamp', () => {
      const profile = getEnterpriseIncidentProfile('database-primary-unavailable', Date.now())!
      const result = generateMockRCAResult('INC-TEST-017', profile)

      if (result.timeline.length > 1) {
        for (let i = 1; i < result.timeline.length; i++) {
          expect(result.timeline[i]?.timestamp.localeCompare(result.timeline[i - 1]?.timestamp)).toBe(
            1,
          )
        }
      }
    })
  })
})
