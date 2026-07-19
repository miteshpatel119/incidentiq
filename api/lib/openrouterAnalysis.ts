export interface AnalyzeInput {
  readonly incidentId: string
  readonly scenarioKey: string
  readonly service: string
  readonly severity: string
  readonly summary: string
  readonly signal: string
  readonly enterpriseData: unknown
}

// Type definitions for the API response
export interface EvidenceItem {
  readonly title: string
  readonly description: string
  readonly source: string
  readonly severity: 'critical' | 'supporting' | 'contextual'
}

export interface TimelineItem {
  readonly timestamp: string
  readonly event: string
  readonly detail: string
  readonly type: 'error' | 'warning' | 'info' | 'change'
}

export interface KubectlCommands {
  readonly investigation: readonly string[]
  readonly recovery: readonly string[]
  readonly verification: readonly string[]
  readonly monitoring: readonly string[]
}

export interface RCAResult {
  readonly analysisSource?: 'openrouter' | 'mock-fallback'
  readonly rootCause: string
  readonly confidenceScore: number
  readonly confidenceAnalysis?: {
    readonly score: number
    readonly reasoning: string
    readonly supportingSignals: readonly string[]
    readonly conflictingSignals?: readonly string[]
  }
  readonly summary: string
  readonly evidence: readonly EvidenceItem[]
  readonly timeline: readonly TimelineItem[]
  readonly businessImpact: {
    readonly customersAffected: string
    readonly revenueAtRisk: string
    readonly sla: string
    readonly blastRadius: string
    readonly operationalImpact?: string
    readonly downstreamServices?: readonly string[]
    readonly estimatedRecoveryTime?: string
  }
  readonly technicalImpact: string
  readonly remediation: readonly {
    readonly priority: number
    readonly title: string
    readonly steps: readonly string[]
  }[]
  readonly verificationSteps: readonly string[]
  readonly preventiveActions: readonly {
    readonly timeframe: 'Short Term' | 'Medium Term' | 'Long Term'
    readonly actions: readonly string[]
  }[]
  readonly codeFixes: readonly {
    readonly file: string
    readonly language: string
    readonly before: string
    readonly after: string
    readonly explanation: string
    readonly why?: string
    readonly expectedImpact?: string
    readonly risks?: readonly string[]
  }[]
  readonly configFixes: readonly {
    readonly key: string
    readonly before: string
    readonly after: string
    readonly explanation: string
    readonly rollbackRecommendation?: string
    readonly expectedImpact?: string
    readonly rollbackRisk?: string
    readonly validationSteps?: readonly string[]
  }[]
  readonly recommendedCommands: readonly string[]
  readonly kubectlCommands?: KubectlCommands
  readonly postIncidentReport: string
  readonly executiveSummary?: string
  readonly incidentSeverityExplanation?: string
  readonly lessonsLearned?: readonly string[]
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
- remediation: array of objects with priority, title, steps (array)
- verificationSteps: array of strings with checkmarks
- preventiveActions: array of objects with timeframe (Short Term/Medium Term/Long Term), actions (array)
- codeFixes: array with file, language, before, after, explanation
- configFixes: array with key, before, after, explanation
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

function extractStringArray(value: unknown): readonly string[] {
  if (!Array.isArray(value)) return []
  return value.map(extractString).filter((s) => s.length > 0)
}

function getObject(value: unknown): MaybeObject {
  return typeof value === 'object' && value !== null ? (value as MaybeObject) : {}
}

function getArray(...values: readonly unknown[]): readonly unknown[] {
  for (const value of values) {
    if (Array.isArray(value)) return value
  }
  return []
}

function getStringFrom(obj: MaybeObject, keys: readonly string[]): string {
  for (const key of keys) {
    const value = obj[key]
    const extracted = extractString(value)
    if (extracted.length > 0) return extracted
  }
  return ''
}

function safeConfidenceScore(value: unknown): number {
  const score = Number(value)
  if (!Number.isFinite(score)) return 85
  return Math.min(100, Math.max(0, Math.round(score)))
}

export function normalizeOpenRouterResult(raw: unknown): RCAResult {
  const data = getObject(raw)
  const analysis =
    Object.keys(getObject(data.rootCauseAnalysis)).length > 0
      ? getObject(data.rootCauseAnalysis)
      : data
  const techDetails = getObject(analysis.technicalDetails)

  const rawBusinessImpact = getObject(analysis.businessImpact ?? data.businessImpact)

  const businessImpact = {
    customersAffected: getStringFrom(rawBusinessImpact, ['customersAffected', 'usersAffected']),
    revenueAtRisk: getStringFrom(rawBusinessImpact, ['revenueAtRisk', 'revenueImpact']),
    sla: getStringFrom(rawBusinessImpact, ['sla', 'slaImpact']),
    blastRadius: getStringFrom(rawBusinessImpact, ['blastRadius', 'operationalImpact']),
  }

  const remediationSteps = getArray(analysis.remediationSteps, analysis.remediation)
    .map(getObject)
    .filter((step) => Object.keys(step).length > 0)

  const rawEvidence = getArray(analysis.evidence, data.evidence)
  const evidence: EvidenceItem[] =
    rawEvidence.length > 0
      ? rawEvidence
          .map(getObject)
          .filter((e) => typeof e.title === 'string')
          .map((e) => ({
            title: extractString(e.title),
            description: extractString(e.description ?? e.detail ?? ''),
            source: extractString(e.source ?? 'Analysis'),
            severity: safeSeverity(e.severity),
            confidence: safeOptionalConfidence(e.confidence),
          }))
      : remediationSteps
          .filter((step) => typeof step.action === 'string' && typeof step.description === 'string')
          .map((step, index) => ({
            title: extractString(step.action),
            description: extractString(step.description),
            source: `Remediation step ${index + 1}`,
            severity: step.urgency === 'Immediate' ? 'critical' : 'supporting',
          }))

  const timelineEntries = getArray(analysis.timeline, data.timeline).map(getObject)
  const timeline: TimelineItem[] = timelineEntries.map((entry) => {
    const typeRaw = typeof entry.type === 'string' ? entry.type.trim() : 'info'
    const type = (['error', 'warning', 'info', 'change'].includes(typeRaw) ? typeRaw : 'info') as
      'error' | 'warning' | 'info' | 'change'

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

  const rootCause =
    getStringFrom(analysis, ['rootCause', 'problemStatement']) ||
    getStringFrom(data, ['rootCause']) ||
    ''
  const normalizedRootCause = extractString(rootCause) || ''
  const summary = getStringFrom(analysis, ['summary']) || getStringFrom(data, ['summary']) || ''

  const remediation =
    remediationSteps.length > 0
      ? remediationSteps.map((r) => ({
          priority: Number(r.priority ?? 1),
          title: extractString(r.title ?? r.action ?? 'Action'),
          steps:
            extractStringArray(r.steps).length > 0
              ? extractStringArray(r.steps)
              : [extractString(r.description)].filter((step) => step.length > 0),
        }))
      : [
          {
            priority: 1,
            title: 'Immediate action',
            steps: ['Investigate the root cause', 'Apply appropriate fix'],
          },
        ]

  const technicalImpact =
    getStringFrom(techDetails, ['errorLogs', 'summary']) ||
    getStringFrom(analysis, ['technicalImpact']) ||
    getStringFrom(data, ['technicalImpact']) ||
    summary ||
    'Investigation completed.'

  const verificationSteps = extractStringArray(
    getArray(analysis.verificationSteps, data.verificationSteps),
  )
  const normalizedVerificationSteps =
    verificationSteps.length > 0
      ? verificationSteps
      : [
          '✓ Verify service health endpoints return 200 OK',
          '✓ Confirm error rates return to baseline',
          '✓ Monitor metrics for 15 minutes',
        ]

  const preventiveActionEntries = getArray(analysis.preventiveActions, data.preventiveActions)
  const preventiveActions =
    preventiveActionEntries.length > 0
      ? preventiveActionEntries.map(getObject).map((a) => ({
          timeframe: safeTimeframe(a.timeframe),
          actions:
            extractStringArray(a.actions).length > 0
              ? extractStringArray(a.actions)
              : [extractString(a.action ?? a.description)].filter((action) => action.length > 0),
        }))
      : [
          {
            timeframe: 'Short Term' as const,
            actions: ['Add monitoring coverage for the affected service'],
          },
        ]

  const rawCodeFixes = getArray(analysis.codeFixes, data.codeFixes).map(getObject)

  const codeFixes = rawCodeFixes
    .filter((fix) => typeof fix.file === 'string' && typeof fix.language === 'string')
    .map((fix) => ({
      file: typeof fix.file === 'string' ? fix.file.trim() : '',
      language: typeof fix.language === 'string' ? fix.language.trim() : '',
      before: typeof fix.before === 'string' ? fix.before.trim() : '',
      after: typeof fix.after === 'string' ? fix.after.trim() : '',
      explanation: typeof fix.explanation === 'string' ? fix.explanation.trim() : '',
    }))

  const rawConfigFixes = getArray(analysis.configFixes, data.configFixes).map(getObject)

  const configFixes = rawConfigFixes
    .filter((fix) => typeof fix.key === 'string')
    .map((fix) => ({
      key: typeof fix.key === 'string' ? fix.key.trim() : '',
      before: typeof fix.before === 'string' ? fix.before.trim() : '',
      after: typeof fix.after === 'string' ? fix.after.trim() : '',
      explanation: typeof fix.explanation === 'string' ? fix.explanation.trim() : '',
    }))

  const recommendedCommands = extractStringArray(
    getArray(analysis.recommendedCommands, data.recommendedCommands),
  )

  const confidenceAnalysis = normalizeConfidenceAnalysis(
    analysis.confidenceAnalysis ?? data.confidenceAnalysis,
    analysis.confidenceScore ?? data.confidenceScore,
  )

  const kubectlCommands = normalizeKubectlCommands(analysis.kubectlCommands ?? data.kubectlCommands)

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

  const lessonsLearned = extractStringArray(getArray(analysis.lessonsLearned, data.lessonsLearned))
  const result: RCAResult = {
    rootCause: normalizedRootCause,
    confidenceScore: safeConfidenceScore(analysis.confidenceScore ?? data.confidenceScore),
    summary,
    evidence,
    timeline,
    businessImpact,
    technicalImpact,
    remediation,
    verificationSteps: normalizedVerificationSteps,
    preventiveActions,
    codeFixes,
    configFixes,
    recommendedCommands,
    postIncidentReport,
  }
  const executiveSummary = getStringFrom(analysis, ['executiveSummary'])
  const incidentSeverityExplanation = getStringFrom(analysis, [
    'incidentSeverityExplanation',
    'severityExplanation',
  ])

  return {
    ...result,
    ...(confidenceAnalysis !== undefined ? { confidenceAnalysis } : {}),
    ...(kubectlCommands !== undefined ? { kubectlCommands } : {}),
    ...(executiveSummary.length > 0 ? { executiveSummary } : {}),
    ...(incidentSeverityExplanation.length > 0 ? { incidentSeverityExplanation } : {}),
    ...(lessonsLearned.length > 0 ? { lessonsLearned } : {}),
  }
}

function safeOptionalConfidence(raw: unknown): number | undefined {
  if (raw === undefined || raw === null) return undefined
  return safeConfidenceScore(raw)
}

function safeSeverity(raw: unknown): 'critical' | 'supporting' | 'contextual' {
  if (raw === 'critical' || raw === 'supporting' || raw === 'contextual') {
    return raw
  }
  return 'supporting'
}

function safeTimeframe(raw: unknown): 'Short Term' | 'Medium Term' | 'Long Term' {
  if (raw === 'Short Term' || raw === 'Medium Term' || raw === 'Long Term') {
    return raw
  }
  return 'Short Term'
}

function normalizeConfidenceAnalysis(
  raw: unknown,
  fallbackScore: unknown,
): RCAResult['confidenceAnalysis'] {
  const obj = getObject(raw)
  if (Object.keys(obj).length === 0) return undefined
  const conflictingSignals = extractStringArray(obj.conflictingSignals)
  return {
    score: safeConfidenceScore(obj.score ?? fallbackScore),
    reasoning: extractString(obj.reasoning),
    supportingSignals: extractStringArray(obj.supportingSignals),
    ...(conflictingSignals.length > 0 ? { conflictingSignals } : {}),
  }
}

function normalizeKubectlCommands(raw: unknown): KubectlCommands | undefined {
  const obj = getObject(raw)
  if (Object.keys(obj).length === 0) return undefined
  const commands = {
    investigation: extractStringArray(obj.investigation),
    recovery: extractStringArray(obj.recovery),
    verification: extractStringArray(obj.verification),
    monitoring: extractStringArray(obj.monitoring),
  }
  if (
    commands.investigation.length === 0 &&
    commands.recovery.length === 0 &&
    commands.verification.length === 0 &&
    commands.monitoring.length === 0
  ) {
    return undefined
  }
  return commands
}

// Try to repair common JSON issues from LLM responses
function repairJsonContent(content: string): string {
  // Try to extract JSON object from the content
  const jsonStart = content.indexOf('{')
  const jsonEnd = content.lastIndexOf('}')

  if (jsonStart === -1 || jsonEnd === -1 || jsonEnd <= jsonStart) {
    return content
  }

  let jsonContent = content.slice(jsonStart, jsonEnd + 1)

  // Escape control characters within strings (newlines, tabs, carriage returns)
  let inString = false
  let escapeNext = false
  const result: string[] = []

  for (let i = 0; i < jsonContent.length; i++) {
    const char = jsonContent.charAt(i)

    if (escapeNext) {
      result.push(char)
      escapeNext = false
      continue
    }

    if (char === '\\' && inString) {
      result.push(char)
      escapeNext = true
      continue
    }

    if (char === '"') {
      inString = !inString
      result.push(char)
      continue
    }

    if (inString && (char === '\n' || char === '\r' || char === '\t')) {
      result.push(char === '\n' ? '\\n' : char === '\r' ? '\\r' : '\\t')
      continue
    }

    result.push(char)
  }

  jsonContent = result.join('')

  return jsonContent
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
Signal: ${input.signal}

Enterprise Data (JSON):
${JSON.stringify(trimmedEnterpriseData, null, 2)}

Analyze this incident and provide a complete root cause analysis with confidence analysis, prioritized remediation, preventive actions, code fixes, config fixes, and kubectl commands.`,
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

  // Try multiple parsing strategies
  const jsonContent = repairJsonContent(content)

  try {
    return JSON.parse(jsonContent) as RCAResult
  } catch (parseError) {
    // Try repairing and retry once
    const sanitized = repairJsonContent(jsonContent)
    try {
      return JSON.parse(sanitized) as RCAResult
    } catch {
      throw new Error(
        `Failed to parse OpenRouter response: ${parseError instanceof Error ? parseError.message : 'Invalid JSON'}`,
      )
    }
  }
}
