import rawScenarios from '@/features/incidents/mock-scenarios.json'
import type { IncidentSeverity, IncidentStatus } from '@/features/incidents/types'

export interface IncidentScenario {
  readonly key: string
  readonly service: string
  readonly severity: IncidentSeverity
  readonly signal: string
  readonly source: string
  readonly status: IncidentStatus
  readonly summary: string
}

const severities: readonly IncidentSeverity[] = ['critical', 'high', 'medium', 'low']
const statuses: readonly IncidentStatus[] = ['investigating', 'mitigated', 'resolved']

function parseSeverity(value: string): IncidentSeverity {
  const severity = severities.find((candidate) => candidate === value)
  if (severity === undefined) throw new Error(`Invalid mock incident severity: ${value}`)
  return severity
}

function parseStatus(value: string): IncidentStatus {
  const status = statuses.find((candidate) => candidate === value)
  if (status === undefined) throw new Error(`Invalid mock incident status: ${value}`)
  return status
}

export const mockScenarios: readonly IncidentScenario[] = rawScenarios.map((scenario) => ({
  key: scenario.key,
  service: scenario.service,
  severity: parseSeverity(scenario.severity),
  signal: scenario.signal,
  source: scenario.source,
  status: parseStatus(scenario.status),
  summary: scenario.summary,
}))

export const simulationIntervalsMs = [8000, 11000, 15000, 9000, 13000, 10000, 12000] as const
