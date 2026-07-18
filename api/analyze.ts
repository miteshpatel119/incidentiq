import type { VercelRequest, VercelResponse } from '@vercel/node'

import { analyzeIncident, type RCAResult } from './lib/openrouterAnalysis.js'

interface AnalyzeRequest {
  readonly incidentId: string
  readonly scenarioKey: string
  readonly service: string
  readonly severity: string
  readonly summary: string
  readonly signal: string
  readonly enterpriseData: unknown
}

function toUnknown(obj: unknown): unknown {
  return obj
}

function normalizeOpenRouterResult(raw: unknown): RCAResult {
  const data = typeof raw === 'object' && raw !== null ? (raw as Record<string, unknown>) : {}
  const analysis = (data.rootCauseAnalysis as Record<string, unknown> | undefined) ?? data
  const techDetails = (analysis.technicalDetails as Record<string, unknown> | undefined) ?? {}

  const rawBusinessImpact = (analysis.businessImpact ?? data.businessImpact ?? {}) as Record<
    string,
    unknown
  >

  const extractString = (value: unknown): string => {
    if (typeof value === 'string') return value.trim()
    if (value === null || value === undefined) return ''
    if (typeof value === 'number' || typeof value === 'boolean' || typeof value === 'bigint')
      return String(value).trim()
    if (typeof value === 'object') {
      const obj = value as Record<string, unknown>
      return extractString(obj.text ?? obj.description ?? obj.value ?? obj.message ?? '')
    }
    return ''
  }

  const businessImpact = {
    customersAffected: extractString(rawBusinessImpact.customersAffected),
    revenueAtRisk: extractString(rawBusinessImpact.revenueAtRisk),
    sla: extractString(rawBusinessImpact.sla),
    blastRadius: extractString(rawBusinessImpact.blastRadius),
  }

  const remediationSteps = Array.isArray(analysis.remediationSteps)
    ? (analysis.remediationSteps as Array<Record<string, unknown>>)
    : []

  const evidence = remediationSteps
    .filter((step) => typeof step.action === 'string' && typeof step.description === 'string')
    .map((step, index): RCAResult['evidence'][number] => ({
      title: (step.action as string).trim(),
      description: (step.description as string).trim(),
      source: `Remediation step ${index + 1}`,
      severity: step.urgency === 'Immediate' ? 'critical' : 'supporting',
    }))

  const timelineEntries = Array.isArray(data.timeline)
    ? (data.timeline as Array<Record<string, unknown>>)
    : []

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

  const getString = (obj: Record<string, unknown>, keys: string[]): string => {
    for (const key of keys) {
      const val = obj[key]
      if (typeof val === 'string') return val.trim()
      // Extract string from object using extractString logic
      if (typeof val === 'object' && val !== null) {
        return extractString(val)
      }
    }
    return ''
  }

  const rootCause =
    getString(analysis, ['rootCause', 'problemStatement']) || getString(data, ['rootCause']) || ''
  // Ensure rootCause is normalized as a string (handles "[object Object]" case)
  const normalizedRootCause = extractString(rootCause) || ''
  const summary = getString(analysis, ['summary']) || getString(data, ['summary']) || ''
  const technicalImpact =
    getString(techDetails, ['errorLogs']) ||
    getString(data, ['technicalImpact']) ||
    summary ||
    'Investigation completed.'
  const confidenceScore = Number(analysis.confidenceScore ?? data.confidenceScore ?? 85)

  const remediation = remediationSteps
    .map((step) => `${step.action as string}: ${step.description as string}`)
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

  // Extract codeFixes if provided by the LLM
  const rawCodeFixes = Array.isArray(analysis.codeFixes)
    ? (analysis.codeFixes as Array<Record<string, unknown>>)
    : Array.isArray(data.codeFixes)
      ? (data.codeFixes as Array<Record<string, unknown>>)
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

  // Extract configFixes if provided by the LLM
  const rawConfigFixes = Array.isArray(analysis.configFixes)
    ? (analysis.configFixes as Array<Record<string, unknown>>)
    : Array.isArray(data.configFixes)
      ? (data.configFixes as Array<Record<string, unknown>>)
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

async function parseJsonBody(request: VercelRequest): Promise<unknown> {
  const chunks: unknown[] = []
  for await (const chunk of request) {
    chunks.push(chunk)
  }
  const raw = Buffer.concat(chunks as Uint8Array[]).toString('utf8')
  return JSON.parse(raw) as unknown
}

export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
): Promise<void> {
  if (request.method !== 'POST') {
    response.status(405).json({ success: false, error: 'Method not allowed' })
    return
  }

  const apiKey = process.env.OPENROUTER_API_KEY
  if (apiKey === undefined || apiKey === '') {
    response.status(500).json({ success: false, error: 'OPENROUTER_API_KEY is not configured' })
    return
  }

  let body: AnalyzeRequest | undefined
  try {
    body = (await parseJsonBody(request)) as AnalyzeRequest | undefined
  } catch {
    response.status(400).json({ success: false, error: 'Invalid JSON payload' })
    return
  }

  if (
    body === undefined ||
    body.incidentId === undefined ||
    body.scenarioKey === undefined ||
    body.enterpriseData === undefined
  ) {
    response.status(400).json({ success: false, error: 'Missing required fields' })
    return
  }

  try {
    const rawResult = await analyzeIncident(apiKey, {
      incidentId: body.incidentId,
      scenarioKey: body.scenarioKey,
      service: body.service,
      severity: body.severity,
      summary: body.summary,
      signal: body.signal,
      enterpriseData: toUnknown(body.enterpriseData),
    })

    const normalized = normalizeOpenRouterResult(toUnknown(rawResult))
    response.status(200).json({ success: true, data: { rootCauseAnalysis: normalized } })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error during analysis'
    response.status(500).json({ success: false, error: message })
  }
}
