export type IncidentStatus = 'investigating' | 'mitigated' | 'resolved'
export type IncidentSeverity = 'critical' | 'high' | 'medium' | 'low'

export interface Incident {
  readonly id: string
  readonly scenarioKey: string
  readonly service: string
  readonly severity: IncidentSeverity
  readonly startedAt: string
  readonly status: IncidentStatus
  readonly summary: string
  readonly createdAt: number
}
