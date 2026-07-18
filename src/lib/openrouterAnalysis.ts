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

export async function analyzeIncident(apiKey: string, input: AnalyzeInput): Promise<RCAResult> {
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
${JSON.stringify(input.enterpriseData, null, 2)}

Analyze this incident and provide a complete root cause analysis.`,
        },
      ],
    }),
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`OpenRouter request failed: ${response.status} ${text}`)
  }

  const json = (await response.json()) as Record<string, unknown>
  const choices = (json?.choices ?? []) as Array<Record<string, unknown>>
  const message = (choices[0]?.message ?? {}) as Record<string, unknown>
  const content = typeof message?.content === 'string' ? message.content : undefined
  if (typeof content !== 'string' || content.trim().length === 0) {
    throw new Error('No response from OpenRouter')
  }

  return JSON.parse(content) as RCAResult
}
