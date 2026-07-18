export interface AnalyzeInput {
  readonly incidentId: string
  readonly scenarioKey: string
  readonly service: string
  readonly severity: string
  readonly summary: string
  readonly signal: string
  readonly enterpriseData: unknown
}

export interface RCAResult {
  readonly rootCause: string
  readonly confidenceScore: number
  readonly summary: string
  readonly evidence: readonly {
    readonly title: string
    readonly description: string
    readonly source: string
    readonly severity: 'critical' | 'supporting' | 'contextual'
  }[]
  readonly timeline: readonly {
    readonly timestamp: string
    readonly event: string
    readonly detail: string
    readonly type: 'error' | 'warning' | 'info' | 'change'
  }[]
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
  readonly codeFixes: readonly {
    readonly file: string
    readonly language: string
    readonly before: string
    readonly after: string
    readonly explanation: string
  }[]
  readonly configFixes: readonly {
    readonly key: string
    readonly before: string
    readonly after: string
    readonly explanation: string
  }[]
  readonly recommendedCommands: readonly string[]
  readonly postIncidentReport: string
}

const SYSTEM_PROMPT = `You are a senior site reliability engineer conducting a root cause analysis.
Analyze the incident data and return structured JSON only.

Include the following fields in your response:
- rootCause: string
- confidenceScore: number (0-100)
- summary: string
- evidence: array with title, description, source, severity
- timeline: array with timestamp, event, detail, type (error/warning/info/change)
- businessImpact: object with customersAffected, revenueAtRisk, sla, blastRadius
- technicalImpact: string
- remediation: string
- verificationSteps: array of strings
- preventiveActions: array of strings
- codeFixes: array with file, language, before, after, explanation (provide code changes to fix the root cause)
- configFixes: array with key, before, after, explanation (provide configuration rollback suggestions)
- recommendedCommands: array of strings
- postIncidentReport: string
`

type MaybeObject = Record<string, unknown>

function slimEnterpriseData(data: unknown): unknown {
  if (data === null || typeof data !== 'object') return data
  const obj = data as MaybeObject

  const limitArray = (arr: unknown[], max: number): unknown[] => {
    if (!Array.isArray(arr)) return []
    return arr.slice(0, max)
  }

  return {
    timeWindow: obj.timeWindow,
    applicationLogs: limitArray((obj.applicationLogs as unknown[]) || [], 3),
    serverLogs: limitArray((obj.serverLogs as unknown[]) || [], 2),
    deploymentHistory: limitArray((obj.deploymentHistory as unknown[]) || [], 2),
    configurationChanges: limitArray((obj.configurationChanges as unknown[]) || [], 2),
    metrics: limitArray((obj.metrics as unknown[]) || [], 3),
    infrastructure: obj.infrastructure,
    kubernetesEvents: limitArray((obj.kubernetesEvents as unknown[]) || [], 2),
    recentCommits: limitArray((obj.recentCommits as unknown[]) || [], 2),
    changedFiles: limitArray((obj.changedFiles as unknown[]) || [], 5),
    codeSnippets: limitArray((obj.codeSnippets as unknown[]) || [], 1),
    historicalIncidents: limitArray((obj.historicalIncidents as unknown[]) || [], 1),
    businessImpact: obj.businessImpact,
  }
}

function extractString(value: unknown): string {
  if (typeof value === 'string') return value.trim()
  if (value === null || value === undefined) return ''
  if (typeof value === 'number' || typeof value === 'boolean' || typeof value === 'bigint')
    return String(value).trim()
  if (typeof value === 'object') {
    const obj = value as MaybeObject
    return extractString(obj.text ?? obj.description ?? obj.value ?? obj.message ?? '')
  }
  return ''
}

export function normalizeOpenRouterResult(raw: unknown): RCAResult {
  const data = typeof raw === 'object' && raw !== null ? (raw as MaybeObject) : {}
  const analysis = (data.rootCauseAnalysis as MaybeObject | undefined) ?? data
  const techDetails = (analysis.technicalDetails as MaybeObject | undefined) ?? {}

  const rawBusinessImpact = (analysis.businessImpact ?? data.businessImpact ?? {}) as MaybeObject

  const businessImpact = {
    customersAffected: extractString(rawBusinessImpact.customersAffected),
    revenueAtRisk: extractString(rawBusinessImpact.revenueAtRisk),
    sla: extractString(rawBusinessImpact.sla),
    blastRadius: extractString(rawBusinessImpact.blastRadius),
  }

  const remediationSteps = Array.isArray(analysis.remediationSteps)
    ? (analysis.remediationSteps as Array<MaybeObject>)
    : []

  const evidence = remediationSteps
    .filter((step) => typeof step.action === 'string' && typeof step.description === 'string')
    .map((step, index): RCAResult['evidence'][number] => ({
      title: extractString(step.action),
      description: extractString(step.description),
      source: `Remediation step ${index + 1}`,
      severity: step.urgency === 'Immediate' ? 'critical' : 'supporting',
    }))

  const timelineEntries = Array.isArray(data.timeline) ? (data.timeline as MaybeObject[]) : []

  const timeline = timelineEntries.map((entry) => {
    const typeRaw = typeof entry.type === 'string' ? entry.type.trim() : 'info'
    const type = ['error', 'warning', 'info', 'change'].includes(typeRaw)
      ? (typeRaw as RCAResult['timeline'][number]['type'])
      : 'info'

    return {
      timestamp: typeof entry.timestamp === 'string' ? entry.timestamp.trim() : '',
      event:
        typeof entry.event === 'string'
          ? entry.event.trim()
          : typeof entry.title === 'string'
            ? entry.title.trim()
            : '',
      detail:
        typeof entry.detail === 'string'
          ? entry.detail.trim()
          : typeof entry.description === 'string'
            ? entry.description.trim()
            : '',
      type,
    }
  })

  const getString = (obj: MaybeObject, keys: string[]): string => {
    for (const key of keys) {
      const val = obj[key]
      if (typeof val === 'string') return val.trim()
      if (typeof val === 'object' && val !== null) {
        return extractString(val)
      }
    }
    return ''
  }

  const rootCause =
    getString(analysis, ['rootCause', 'problemStatement']) || getString(data, ['rootCause']) || ''
  const normalizedRootCause = extractString(rootCause) || ''
  const summary = getString(analysis, ['summary']) || getString(data, ['summary']) || ''
  const technicalImpact =
    getString(techDetails, ['errorLogs']) ||
    getString(data, ['technicalImpact']) ||
    summary ||
    'Investigation completed.'
  const confidenceScore = Number(analysis.confidenceScore ?? data.confidenceScore ?? 85)

  const remediation = remediationSteps
    .map((step) => `${extractString(step.action)}: ${extractString(step.description)}`)
    .join('\n')

  const verificationSteps = Array.isArray(data.verificationSteps)
    ? (data.verificationSteps as readonly string[])
    : [
        'Verify service health endpoints return 200 OK',
        'Confirm error rates return to baseline',
        'Monitor metrics for 15 minutes',
      ]

  const preventiveActions = Array.isArray(data.preventiveActions)
    ? (data.preventiveActions as readonly string[])
    : ['Add monitoring coverage for the affected service']

  const recommendedCommands = Array.isArray(analysis.recommendedCommands)
    ? (analysis.recommendedCommands as readonly string[])
    : Array.isArray(data.recommendedCommands)
      ? (data.recommendedCommands as readonly string[])
      : []

  const rawCodeFixes = Array.isArray(analysis.codeFixes)
    ? (analysis.codeFixes as Array<MaybeObject>)
    : Array.isArray(data.codeFixes)
      ? (data.codeFixes as Array<MaybeObject>)
      : []

  const codeFixes = rawCodeFixes
    .filter((fix) => typeof fix.file === 'string' && typeof fix.language === 'string')
    .map((fix): RCAResult['codeFixes'][number] => ({
      file: typeof fix.file === 'string' ? fix.file.trim() : '',
      language: typeof fix.language === 'string' ? fix.language.trim() : '',
      before: typeof fix.before === 'string' ? fix.before.trim() : '',
      after: typeof fix.after === 'string' ? fix.after.trim() : '',
      explanation: typeof fix.explanation === 'string' ? fix.explanation.trim() : '',
    }))

  const rawConfigFixes = Array.isArray(analysis.configFixes)
    ? (analysis.configFixes as Array<MaybeObject>)
    : Array.isArray(data.configFixes)
      ? (data.configFixes as Array<MaybeObject>)
      : []

  const configFixes = rawConfigFixes
    .filter((fix) => typeof fix.key === 'string')
    .map((fix): RCAResult['configFixes'][number] => ({
      key: typeof fix.key === 'string' ? fix.key.trim() : '',
      before: typeof fix.before === 'string' ? fix.before.trim() : '',
      after: typeof fix.after === 'string' ? fix.after.trim() : '',
      explanation: typeof fix.explanation === 'string' ? fix.explanation.trim() : '',
    }))

  const postIncidentReport = extractString(
    analysis.postIncidentReport ??
      data.postIncidentReport ??
      `## Post-Incident Report

### What happened
${extractString(summary || 'Service incident detected.')}

### Root cause
${extractString(normalizedRootCause || 'Unknown')}

### Impact
${extractString(businessImpact.customersAffected)} affected, ${extractString(businessImpact.revenueAtRisk)} at risk. ${extractString(businessImpact.sla)}

### Action items
1. Apply configuration reverts and code fixes
2. Verify service health
3. Update monitoring and alerts`,
  )

  return {
    rootCause: normalizedRootCause,
    confidenceScore,
    summary,
    evidence,
    timeline,
    businessImpact,
    technicalImpact,
    remediation,
    verificationSteps,
    preventiveActions,
    codeFixes,
    configFixes,
    recommendedCommands,
    postIncidentReport,
  }
}

export async function analyzeIncident(apiKey: string, input: AnalyzeInput): Promise<RCAResult> {
  const trimmedEnterpriseData = slimEnterpriseData(input.enterpriseData)
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'openrouter/auto',
      response_format: { type: 'json_object' },
      temperature: 0.2,
      max_tokens: 3000,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: `Incident ID: ${input.incidentId}
Service: ${input.service}
Severity: ${input.severity}
Summary: ${input.summary}
Alert Signal: ${input.signal}

Enterprise Data (JSON):
${JSON.stringify(trimmedEnterpriseData, null, 2)}

Analyze this incident and provide a complete root cause analysis.`,
        },
      ],
    }),
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`OpenRouter request failed: ${response.status} ${text}`)
  }

  const json = (await response.json()) as { choices?: { message?: { content?: string } }[] }
  const content = json?.choices?.[0]?.message?.content
  if (typeof content !== 'string' || content.trim().length === 0) {
    throw new Error('No response from OpenRouter')
  }

  return JSON.parse(content) as RCAResult
}
