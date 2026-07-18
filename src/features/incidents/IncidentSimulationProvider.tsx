import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'

import { useAuth } from '@/features/auth/AuthProvider'
import { showToast } from '@/lib/toast'
import { mockIncidents } from '@/features/incidents/mockIncidents'
import {
  mockScenarios,
  simulationIntervalsMs,
  type IncidentScenario,
} from '@/features/incidents/mockScenarios'
import type { Incident, IncidentSeverity, IncidentStatus } from '@/features/incidents/types'

type MonitoringStatus = 'connecting' | 'connected' | 'offline'

interface CreateIncidentData {
  readonly service: string
  readonly severity: IncidentSeverity
  readonly status: IncidentStatus
  readonly summary: string
}

interface IncidentSimulationContextValue {
  readonly incidents: readonly Incident[]
  readonly latestScenario: IncidentScenario | null
  readonly monitoringStatus: MonitoringStatus
  readonly createIncident: (data: CreateIncidentData) => void
}

const IncidentSimulationContext = createContext<IncidentSimulationContextValue | null>(null)
const FIRST_SIMULATED_INCIDENT_ID = 1049
const CONNECTION_DELAY_MS = 1600

function createSimulatedIncident(scenario: IncidentScenario, sequence: number): Incident {
  return {
    id: `INC-${FIRST_SIMULATED_INCIDENT_ID + sequence}`,
    scenarioKey: scenario.key,
    service: scenario.service,
    severity: scenario.severity,
    startedAt: 'Just now',
    status: scenario.status,
    summary: scenario.summary,
    createdAt: Date.now(),
  }
}

let manualIncidentCounter = 0

function generateManualIncidentId(): string {
  manualIncidentCounter += 1
  return `INC-${Date.now()}-${manualIncidentCounter}`
}

export function IncidentSimulationProvider({
  children,
}: {
  readonly children: ReactNode
}): JSX.Element {
  const { isAuthenticated } = useAuth()
  const [incidents, setIncidents] = useState<readonly Incident[]>(mockIncidents)
  const [latestScenario, setLatestScenario] = useState<IncidentScenario | null>(null)
  const [monitoringStatus, setMonitoringStatus] = useState<MonitoringStatus>('offline')

  useEffect(() => {
    if (!isAuthenticated) {
      setMonitoringStatus('offline')
      setLatestScenario(null)
      setIncidents(mockIncidents)
      return undefined
    }

    let isActive = true
    let scenarioIndex = 0
    let sequence = 0
    let incidentTimer: number | undefined
    setMonitoringStatus('connecting')
    setLatestScenario(null)
    setIncidents(mockIncidents)

    const connectionTimer = window.setTimeout(() => {
      if (isActive) setMonitoringStatus('connected')
    }, CONNECTION_DELAY_MS)

    const scheduleNextIncident = (): void => {
      const delay = simulationIntervalsMs[scenarioIndex % simulationIntervalsMs.length]
      incidentTimer = window.setTimeout(() => {
        if (!isActive) return
        const scenario = mockScenarios[scenarioIndex % mockScenarios.length]
        if (scenario === undefined) return
        const incident = createSimulatedIncident(scenario, sequence)
        setIncidents((currentIncidents) => [incident, ...currentIncidents])
        setLatestScenario(scenario)
        showToast(`New incident: ${incident.summary}`, 'incident')
        scenarioIndex += 1
        sequence += 1
        scheduleNextIncident()
      }, delay)
    }

    scheduleNextIncident()

    return () => {
      isActive = false
      window.clearTimeout(connectionTimer)
      if (incidentTimer !== undefined) window.clearTimeout(incidentTimer)
    }
  }, [isAuthenticated])

  const createIncident = useCallback((data: CreateIncidentData): void => {
    const manualIncident: Incident = {
      id: generateManualIncidentId(),
      scenarioKey: `manual-${data.service.toLowerCase().replace(/\s+/g, '-')}`,
      service: data.service,
      severity: data.severity,
      startedAt: 'Just now',
      status: data.status,
      summary: data.summary,
      createdAt: Date.now(),
    }
    setIncidents((currentIncidents) => [manualIncident, ...currentIncidents])
  }, [])

  const value = useMemo<IncidentSimulationContextValue>(
    () => ({ incidents, latestScenario, monitoringStatus, createIncident }),
    [incidents, latestScenario, monitoringStatus, createIncident],
  )

  return (
    <IncidentSimulationContext.Provider value={value}>
      {children}
    </IncidentSimulationContext.Provider>
  )
}

export function useIncidentSimulation(): IncidentSimulationContextValue {
  const context = useContext(IncidentSimulationContext)
  if (context === null)
    throw new Error('useIncidentSimulation must be used within IncidentSimulationProvider.')
  return context
}
