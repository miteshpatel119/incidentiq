import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'

import {
  getEnterpriseIncidentProfile,
  type EnterpriseIncidentProfile,
} from '@/features/incidents/mockEnterpriseData'
import { generateMockRCAResult } from '@/features/incidents/mockRCAResults'
import { mockScenarios } from '@/features/incidents/mockScenarios'
import type { Incident } from '@/features/incidents/types'
import {
  INVESTIGATION_STEPS,
  type Investigation,
  type InvestigationStep,
  type RCAResult,
} from '@/features/incidents/investigationTypes'

const STEP_DURATION_MS = 1200
const API_BASE = '/api'

function createInitialInvestigation(incidentId: string): Investigation {
  return {
    incidentId,
    steps: INVESTIGATION_STEPS.map((step) => ({
      ...step,
      status: 'pending' as const,
    })),
    status: 'idle',
    result: null,
    error: null,
    startedAt: null,
    completedAt: null,
  }
}

// Create a fallback enterprise data profile for manual incidents
// The type assertion is needed because the JSON-based type inference creates a union type
// for attributes that is too strict for dynamically generated data.
function createFallbackEnterpriseData(incident: Incident): EnterpriseIncidentProfile {
  return {
    scenarioKey: incident.scenarioKey,
    timeWindow: {
      detectedAt: new Date().toISOString(),
      firstCustomerImpactAt: new Date().toISOString(),
      region: 'us-east-1',
      environment: 'production',
    },
    applicationLogs: [
      {
        timestamp: new Date().toISOString(),
        level: 'ERROR',
        service: incident.service,
        traceId: 'trc_manual_001',
        message: incident.summary,
        attributes: { poolActive: '0', poolMax: '0', error: 'manual-incident' },
      },
    ],
    serverLogs: [],
    deploymentHistory: [],
    configurationChanges: [],
    metrics: [
      {
        name: `${incident.service}.error_rate`,
        unit: 'percent',
        baseline: 0.1,
        peak: 5.0,
        observedAt: new Date().toISOString(),
      },
    ],
    infrastructure: {
      cpuPercent: 45,
      memoryPercent: 55,
      diskPercent: 30,
      node: 'unknown',
      availabilityZone: 'us-east-1a',
    },
    kubernetesEvents: [],
    recentCommits: [],
    changedFiles: [],
    codeSnippets: [],
    historicalIncidents: [],
    businessImpact: {
      customersAffected: 'Unknown - manual incident',
      revenueAtRisk: 'To be determined',
      sla: 'Monitoring required',
      blastRadius: 'Unknown',
    },
  }
}

const INVESTIGATIONS_STORAGE_KEY = 'incidentiq-investigations'

interface InvestigationContextValue {
  readonly investigations: ReadonlyMap<string, Investigation>
  readonly startInvestigation: (incident: Incident) => Promise<void>
  readonly getInvestigation: (incidentId: string) => Investigation | undefined
}

const InvestigationContext = createContext<InvestigationContextValue | null>(null)

export function InvestigationProvider({ children }: { readonly children: ReactNode }): JSX.Element {
  const [investigations, setInvestigations] = useState<ReadonlyMap<string, Investigation>>(() => {
    try {
      const raw = localStorage.getItem(INVESTIGATIONS_STORAGE_KEY)
      if (raw !== null) {
        const entries = JSON.parse(raw) as Array<[string, Investigation]>
        return new Map(entries)
      }
    } catch {
      // ignore parse errors
    }
    return new Map()
  })
  const abortRef = useRef<AbortController | null>(null)

  const advanceStep = useCallback((incidentId: string, stepIndex: number): void => {
    setInvestigations((current) => {
      const investigation = current.get(incidentId)
      if (investigation === undefined) return current

      const updatedSteps: readonly InvestigationStep[] = investigation.steps.map((step, index) => {
        if (index < stepIndex) return { ...step, status: 'completed' as const }
        if (index === stepIndex) return { ...step, status: 'in-progress' as const }
        return { ...step, status: 'pending' as const }
      })

      const next = new Map(current)
      next.set(incidentId, {
        ...investigation,
        steps: updatedSteps,
        status: 'investigating',
      })
      return next
    })
  }, [])

  const completeInvestigation = useCallback((incidentId: string, result: RCAResult): void => {
    setInvestigations((current) => {
      const investigation = current.get(incidentId)
      if (investigation === undefined) return current

      const updatedSteps: readonly InvestigationStep[] = investigation.steps.map((step) => ({
        ...step,
        status: 'completed' as const,
      }))

      const next = new Map(current)
      next.set(incidentId, {
        ...investigation,
        steps: updatedSteps,
        status: 'completed',
        result,
        completedAt: new Date().toISOString(),
      })
      return next
    })
  }, [])

  const failInvestigation = useCallback((incidentId: string, error: string): void => {
    setInvestigations((current) => {
      const investigation = current.get(incidentId)
      if (investigation === undefined) return current

      const next = new Map(current)
      next.set(incidentId, {
        ...investigation,
        status: 'failed',
        error,
        completedAt: new Date().toISOString(),
      })
      return next
    })
  }, [])

  const startInvestigation = useCallback(
    async (incident: Incident): Promise<void> => {
      abortRef.current?.abort()
      const controller = new AbortController()
      abortRef.current = controller

      const initial = createInitialInvestigation(incident.id)
      setInvestigations((current) => {
        const next = new Map(current)
        next.set(incident.id, { ...initial, startedAt: new Date().toISOString() })
        return next
      })

      // Animate through investigation steps
      for (let stepIndex = 0; stepIndex < INVESTIGATION_STEPS.length; stepIndex++) {
        if (controller.signal.aborted) return
        advanceStep(incident.id, stepIndex)
        await new Promise((resolve) => window.setTimeout(resolve, STEP_DURATION_MS))
      }

      // Call the API
      try {
        const scenario = mockScenarios.find((s) => s.key === incident.scenarioKey)
        // Try to get enterprise data, or create fallback for manual incidents
        let enterpriseData = getEnterpriseIncidentProfile(incident.scenarioKey, incident.createdAt)
        const isManualIncident = incident.scenarioKey.startsWith('manual-')

        if (enterpriseData === undefined) {
          if (isManualIncident) {
            // Use fallback data for manual incidents
            enterpriseData = createFallbackEnterpriseData(incident)
          } else {
            failInvestigation(incident.id, 'Enterprise data not found for this incident scenario.')
            return
          }
        }

        const payload = {
          incidentId: incident.id,
          scenarioKey: incident.scenarioKey,
          service: incident.service,
          severity: incident.severity,
          summary: incident.summary,
          signal: scenario?.signal ?? '',
          enterpriseData,
        }

        let response: Response | null = null
        let apiAvailable = false
        try {
          const requestBody = JSON.stringify(payload)
          response = await fetch(`${API_BASE}/analyze`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: requestBody,
            signal: controller.signal,
          })
          apiAvailable = response.ok
        } catch {
          apiAvailable = false
        }

        if (!apiAvailable || response === null) {
          // API unavailable - fall back to deterministic mock RCA
          const mockResult = generateMockRCAResult(incident.id, enterpriseData)
          completeInvestigation(incident.id, mockResult)
          return
        }

        let json: { success: boolean; data?: { readonly rootCauseAnalysis?: RCAResult } }
        try {
          json = (await response.json()) as {
            success: boolean
            data?: { readonly rootCauseAnalysis?: RCAResult }
          }
        } catch {
          const mockResult = generateMockRCAResult(incident.id, enterpriseData)
          completeInvestigation(incident.id, mockResult)
          return
        }

        if (!json.success || !json.data?.rootCauseAnalysis) {
          failInvestigation(incident.id, 'Analysis returned unsuccessful status.')
          return
        }

        completeInvestigation(incident.id, json.data.rootCauseAnalysis)
      } catch (error: unknown) {
        if (error instanceof DOMException && error.name === 'AbortError') return
        const message = error instanceof Error ? error.message : 'Unknown error during analysis'
        failInvestigation(incident.id, message)
      }
    },
    [advanceStep, completeInvestigation, failInvestigation],
  )

  const getInvestigation = useCallback(
    (incidentId: string): Investigation | undefined => investigations.get(incidentId),
    [investigations],
  )

  const value = useMemo<InvestigationContextValue>(
    () => ({ investigations, startInvestigation, getInvestigation }),
    [investigations, startInvestigation, getInvestigation],
  )

  useEffect(() => {
    try {
      const entries = Array.from(investigations.entries())
      localStorage.setItem(INVESTIGATIONS_STORAGE_KEY, JSON.stringify(entries))
    } catch {
      // ignore storage errors
    }
  }, [investigations])

  return <InvestigationContext.Provider value={value}>{children}</InvestigationContext.Provider>
}

export function useInvestigation(): InvestigationContextValue {
  const context = useContext(InvestigationContext)
  if (context === null)
    throw new Error('useInvestigation must be used within InvestigationProvider.')
  return context
}
