export type InvestigationStepId =
  | 'collect-logs'
  | 'correlate-metrics'
  | 'inspect-deployments'
  | 'analyze-config'
  | 'search-similar'
  | 'generate-rca'

export interface InvestigationStep {
  readonly id: InvestigationStepId
  readonly label: string
  readonly description: string
  readonly status: 'pending' | 'in-progress' | 'completed' | 'failed'
}

export interface EvidenceItem {
  readonly title: string
  readonly description: string
  readonly source: string
  readonly severity: 'critical' | 'supporting' | 'contextual'
}

export interface CodeFixSuggestion {
  readonly file: string
  readonly language: string
  readonly before: string
  readonly after: string
  readonly explanation: string
}

export interface ConfigFixSuggestion {
  readonly key: string
  readonly before: string
  readonly after: string
  readonly explanation: string
}

export interface TimelineEvent {
  readonly timestamp: string
  readonly event: string
  readonly detail: string
  readonly type: 'error' | 'warning' | 'info' | 'change'
}

export interface RCAResult {
  readonly rootCause: string
  readonly confidenceScore: number
  readonly summary: string
  readonly evidence: readonly EvidenceItem[]
  readonly timeline: readonly TimelineEvent[]
  readonly businessImpact: {
    readonly customersAffected: string
    readonly revenueAtRisk: string
    readonly sla: string
    readonly blastRadius: string
  }
  readonly technicalImpact: string
  readonly remediation: string
  readonly verificationSteps: readonly string[]
  readonly preventiveActions: readonly string[]
  readonly codeFixes: readonly CodeFixSuggestion[]
  readonly configFixes: readonly ConfigFixSuggestion[]
  readonly recommendedCommands: readonly string[]
  readonly postIncidentReport: string
}

export interface Investigation {
  readonly incidentId: string
  readonly steps: readonly InvestigationStep[]
  readonly status: 'idle' | 'investigating' | 'completed' | 'failed'
  readonly result: RCAResult | null
  readonly error: string | null
  readonly startedAt: string | null
  readonly completedAt: string | null
}

export const INVESTIGATION_STEPS: readonly Omit<InvestigationStep, 'status'>[] = [
  {
    id: 'collect-logs',
    label: 'Collecting application & server logs',
    description: 'Aggregating log entries from the affected service and infrastructure.',
  },
  {
    id: 'correlate-metrics',
    label: 'Correlating metrics & infrastructure data',
    description: 'Analyzing CPU, memory, error rates, and latency baselines.',
  },
  {
    id: 'inspect-deployments',
    label: 'Inspecting deployment history',
    description: 'Reviewing recent releases, commits, and changed files.',
  },
  {
    id: 'analyze-config',
    label: 'Analyzing configuration changes',
    description: 'Comparing recent configuration modifications against incident window.',
  },
  {
    id: 'search-similar',
    label: 'Searching similar historical incidents',
    description: 'Cross-referencing past incidents with similar patterns.',
  },
  {
    id: 'generate-rca',
    label: 'Generating RCA report',
    description: 'Synthesizing findings into a structured root cause analysis.',
  },
]
