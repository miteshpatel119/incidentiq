import type { VercelRequest, VercelResponse } from '@vercel/node'

import { analyzeIncident, normalizeOpenRouterResult } from './lib/openrouterAnalysis.js'

interface AnalyzeRequest {
  readonly incidentId: string
  readonly scenarioKey: string
  readonly service: string
  readonly severity: string
  readonly summary: string
  readonly signal: string
  readonly enterpriseData: unknown
}

async function parseJsonBody(request: VercelRequest): Promise<unknown> {
  const parsedBody = request.body as unknown
  if (parsedBody !== undefined && parsedBody !== null) {
    if (typeof parsedBody === 'string') return JSON.parse(parsedBody) as unknown
    return parsedBody
  }

  const chunks: Buffer[] = []
  for await (const chunk of request) {
    if (typeof chunk === 'string') {
      chunks.push(Buffer.from(chunk))
    } else if (Buffer.isBuffer(chunk)) {
      chunks.push(chunk)
    } else {
      chunks.push(Buffer.from(chunk as Uint8Array))
    }
  }
  const raw = Buffer.concat(chunks).toString('utf8')
  return JSON.parse(raw) as unknown
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function readRequiredString(body: Record<string, unknown>, key: keyof AnalyzeRequest): string {
  const value = body[key]
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`Missing or invalid ${key}`)
  }
  return value.trim()
}

function parseAnalyzeRequest(value: unknown): AnalyzeRequest {
  if (!isRecord(value)) throw new Error('Payload must be a JSON object')
  const enterpriseData = value.enterpriseData
  if (enterpriseData === undefined || enterpriseData === null) {
    throw new Error('Missing or invalid enterpriseData')
  }

  return {
    incidentId: readRequiredString(value, 'incidentId'),
    scenarioKey: readRequiredString(value, 'scenarioKey'),
    service: readRequiredString(value, 'service'),
    severity: readRequiredString(value, 'severity'),
    summary: readRequiredString(value, 'summary'),
    signal: typeof value.signal === 'string' ? value.signal.trim() : '',
    enterpriseData,
  }
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

  let body: AnalyzeRequest
  try {
    body = parseAnalyzeRequest(await parseJsonBody(request))
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Invalid JSON payload'
    response.status(400).json({ success: false, error: message })
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
      enterpriseData: body.enterpriseData,
    })

    const normalized = normalizeOpenRouterResult(rawResult)
    response.status(200).json({ success: true, data: { rootCauseAnalysis: normalized } })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error during analysis'
    response.status(500).json({ success: false, error: message })
  }
}
