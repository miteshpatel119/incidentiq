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
  const chunks: unknown[] = []
  for await (const chunk of request) {
    chunks.push(chunk)
  }
  const raw = Buffer.concat(chunks as Uint8Array[]).toString('utf8')
  return JSON.parse(raw) as unknown
}

function toUnknown(obj: unknown): unknown {
  return obj
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
