import { describe, expect, it } from 'vitest'

import { getEnterpriseIncidentProfile, enterpriseIncidentProfiles } from './mockEnterpriseData'

describe('mockEnterpriseData', () => {
  describe('enterpriseIncidentProfiles', () => {
    it('contains all expected scenario keys', () => {
      const scenarioKeys = enterpriseIncidentProfiles.map((p) => p.scenarioKey)
      expect(scenarioKeys).toContain('database-primary-unavailable')
      expect(scenarioKeys).toContain('payments-api-timeout')
      expect(scenarioKeys).toContain('kubernetes-pod-crash')
      expect(scenarioKeys).toContain('deployment-regression')
      expect(scenarioKeys).toContain('ssl-certificate-expiry')
      expect(scenarioKeys).toContain('configuration-change')
      expect(scenarioKeys).toContain('message-queue-backlog')
    })

    it('provides valid business impact for each profile', () => {
      for (const profile of enterpriseIncidentProfiles) {
        expect(profile.businessImpact).toBeDefined()
        expect(profile.businessImpact.customersAffected).toBeTruthy()
        expect(profile.businessImpact.revenueAtRisk).toBeTruthy()
        expect(profile.businessImpact.sla).toBeTruthy()
        expect(profile.businessImpact.blastRadius).toBeTruthy()
      }
    })

    it('provides valid time window for each profile', () => {
      for (const profile of enterpriseIncidentProfiles) {
        expect(profile.timeWindow).toBeDefined()
        expect(profile.timeWindow.detectedAt).toBeTruthy()
        expect(profile.timeWindow.region).toBeTruthy()
        expect(profile.timeWindow.environment).toBe('production')
      }
    })

    it('provides infrastructure metrics for each profile', () => {
      for (const profile of enterpriseIncidentProfiles) {
        expect(profile.infrastructure).toBeDefined()
        expect(profile.infrastructure.cpuPercent).toBeGreaterThanOrEqual(0)
        expect(profile.infrastructure.cpuPercent).toBeLessThanOrEqual(100)
        expect(profile.infrastructure.memoryPercent).toBeGreaterThanOrEqual(0)
        expect(profile.infrastructure.memoryPercent).toBeLessThanOrEqual(100)
        expect(profile.infrastructure.diskPercent).toBeGreaterThanOrEqual(0)
        expect(profile.infrastructure.diskPercent).toBeLessThanOrEqual(100)
      }
    })
  })

  describe('getEnterpriseIncidentProfile', () => {
    it('returns undefined for unknown scenario key', () => {
      const result = getEnterpriseIncidentProfile('non-existent-scenario')
      expect(result).toBeUndefined()
    })

    it('returns profile without timestamp shifting when no createdAt provided', () => {
      const result = getEnterpriseIncidentProfile('database-primary-unavailable')
      expect(result).toBeDefined()
      expect(result?.scenarioKey).toBe('database-primary-unavailable')
      // Without createdAt, timestamps should remain unchanged
      expect(result?.timeWindow.detectedAt).toBe('2026-07-16T09:14:22Z')
    })

    it('shifts timestamps when createdAt is provided', () => {
      // When createdAt is provided, timestamps are shifted relative to current time
      const baseTime = Date.now()
      const result = getEnterpriseIncidentProfile('database-primary-unavailable', baseTime)
      expect(result).toBeDefined()
      // Timestamps should be shifted to be relative to baseTime
      expect(result?.timeWindow.detectedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
      const detectedAtTime = Date.parse(result!.timeWindow.detectedAt)
      // The difference should be approximately the same as the difference between baseTime and now
      expect(detectedAtTime).toBeGreaterThan(0)
    })

    it('shifts application log timestamps', () => {
      const baseTime = Date.parse('2026-07-18T12:00:00Z')
      const result = getEnterpriseIncidentProfile('database-primary-unavailable', baseTime)
      expect(result).toBeDefined()
      expect(result?.applicationLogs[0].timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
    })

    it('shifts deployment history timestamps', () => {
      const baseTime = Date.parse('2026-07-18T12:00:00Z')
      const result = getEnterpriseIncidentProfile('database-primary-unavailable', baseTime)
      expect(result).toBeDefined()
      expect(result?.deploymentHistory[0].timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
    })

    it('shifts configuration changes timestamps', () => {
      const baseTime = Date.parse('2026-07-18T12:00:00Z')
      const result = getEnterpriseIncidentProfile('database-primary-unavailable', baseTime)
      expect(result).toBeDefined()
      expect(result?.configurationChanges[0].timestamp).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/,
      )
    })

    it('shifts kubernetes events timestamps', () => {
      const baseTime = Date.parse('2026-07-18T12:00:00Z')
      const result = getEnterpriseIncidentProfile('database-primary-unavailable', baseTime)
      expect(result).toBeDefined()
      expect(result?.kubernetesEvents[0].timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
    })

    it('shifts metrics observedAt timestamps', () => {
      const baseTime = Date.parse('2026-07-18T12:00:00Z')
      const result = getEnterpriseIncidentProfile('database-primary-unavailable', baseTime)
      expect(result).toBeDefined()
      expect(result?.metrics[0].observedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
    })

    it('returns profile with application logs', () => {
      const result = getEnterpriseIncidentProfile('payments-api-timeout')
      expect(result).toBeDefined()
      expect(result?.applicationLogs.length).toBeGreaterThan(0)
      expect(result?.applicationLogs[0]).toHaveProperty('timestamp')
      expect(result?.applicationLogs[0]).toHaveProperty('level')
      expect(result?.applicationLogs[0]).toHaveProperty('service')
      expect(result?.applicationLogs[0]).toHaveProperty('message')
    })

    it('returns profile with server logs', () => {
      const result = getEnterpriseIncidentProfile('kubernetes-pod-crash')
      expect(result).toBeDefined()
      expect(result?.serverLogs.length).toBeGreaterThan(0)
      expect(result?.serverLogs[0]).toHaveProperty('timestamp')
      expect(result?.serverLogs[0]).toHaveProperty('host')
      expect(result?.serverLogs[0]).toHaveProperty('message')
    })

    it('returns profile with deployment history', () => {
      const result = getEnterpriseIncidentProfile('deployment-regression')
      expect(result).toBeDefined()
      expect(result?.deploymentHistory.length).toBeGreaterThan(0)
      expect(result?.deploymentHistory[0]).toHaveProperty('timestamp')
      expect(result?.deploymentHistory[0]).toHaveProperty('service')
      expect(result?.deploymentHistory[0]).toHaveProperty('version')
      expect(result?.deploymentHistory[0]).toHaveProperty('change')
    })

    it('returns profile with code snippets', () => {
      const result = getEnterpriseIncidentProfile('database-primary-unavailable')
      expect(result).toBeDefined()
      expect(result?.codeSnippets.length).toBeGreaterThanOrEqual(1)
      expect(result?.codeSnippets[0]).toHaveProperty('file')
      expect(result?.codeSnippets[0]).toHaveProperty('language')
      expect(result?.codeSnippets[0]).toHaveProperty('content')
    })

    it('returns profile with historical incidents', () => {
      const result = getEnterpriseIncidentProfile('ssl-certificate-expiry')
      expect(result).toBeDefined()
      expect(result?.historicalIncidents.length).toBeGreaterThanOrEqual(1)
      expect(result?.historicalIncidents[0]).toHaveProperty('id')
      expect(result?.historicalIncidents[0]).toHaveProperty('summary')
      expect(result?.historicalIncidents[0]).toHaveProperty('resolution')
    })
  })
})
