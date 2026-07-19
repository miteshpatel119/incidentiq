import 'dotenv/config'
import http from 'node:http'
import { spawn } from 'node:child_process'
import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const PORT = 3000
const VITE_PORT = 5173

function extractString(value) {
  if (typeof value === 'string') return value.trim()
  if (value === null || value === undefined) return ''
  if (typeof value === 'number' || typeof value === 'boolean' || typeof value === 'bigint')
    return String(value).trim()
  if (typeof value === 'object') {
    const obj = value
    return extractString(obj.text ?? obj.description ?? obj.value ?? obj.message ?? '')
  }
  return ''
}

function normalizeOpenRouterResult(raw) {
  const data = typeof raw === 'object' && raw !== null ? raw : {}
  const analysis = data.rootCauseAnalysis ?? data

  const rawBusinessImpact = analysis.businessImpact ?? data.businessImpact ?? {}
  const businessImpact = {
    customersAffected: extractString(rawBusinessImpact.customersAffected),
    revenueAtRisk: extractString(rawBusinessImpact.revenueAtRisk),
    sla: extractString(rawBusinessImpact.sla),
    blastRadius: extractString(rawBusinessImpact.blastRadius),
  }

  const remediationSteps = Array.isArray(analysis.remediationSteps) ? analysis.remediationSteps : []
  const evidence = remediationSteps
    .filter((step) => typeof step.action === 'string' && typeof step.description === 'string')
    .map((step, index) => ({
      title: extractString(step.action),
      description: extractString(step.description),
      source: `Remediation step ${index + 1}`,
      severity: step.urgency === 'Immediate' ? 'critical' : 'supporting',
    }))

  const timelineEntries = Array.isArray(data.timeline) ? data.timeline : []
  const timeline = timelineEntries.map((entry) => {
    const typeRaw = typeof entry.type === 'string' ? entry.type.trim() : 'info'
    const type = ['error', 'warning', 'info', 'change'].includes(typeRaw) ? typeRaw : 'info'
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

  const getString = (obj, keys) => {
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
    getString(analysis.technicalDetails || {}, ['errorLogs']) ||
    getString(data, ['technicalImpact']) ||
    summary ||
    'Investigation completed.'
  const confidenceScore = Number(analysis.confidenceScore ?? data.confidenceScore ?? 85)

  const remediation = remediationSteps
    .map((step) => `${extractString(step.action)}: ${extractString(step.description)}`)
    .join('\n')

  const verificationSteps = Array.isArray(data.verificationSteps)
    ? data.verificationSteps
    : ['Verify service health endpoints return 200 OK']
  const preventiveActions = Array.isArray(data.preventiveActions)
    ? data.preventiveActions
    : ['Add monitoring coverage for the affected service']
  const recommendedCommands = Array.isArray(data.recommendedCommands)
    ? data.recommendedCommands
    : []

  const postIncidentReport = extractString(
    typeof analysis.postIncidentReport === 'string'
      ? analysis.postIncidentReport
      : typeof data.postIncidentReport === 'string'
        ? data.postIncidentReport
        : `## Post-Incident Report

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
    codeFixes: [],
    configFixes: [],
    recommendedCommands,
    postIncidentReport,
  }
}

// Start Vite dev server
const vite = spawn('npx', ['vite', '--port', String(VITE_PORT)], {
  stdio: 'inherit',
  shell: true,
  cwd: __dirname,
})

// Small HTTP server for API routes
const server = http.createServer(async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    res.writeHead(204)
    res.end()
    return
  }

  const url = new URL(req.url ?? '/', `http://localhost:${PORT}`)

  // Health check
  if (url.pathname === '/api/health' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(
      JSON.stringify({
        success: true,
        data: { status: 'ok', timestamp: new Date().toISOString() },
      }),
    )
    return
  }

  // Analyze endpoint
  if (url.pathname === '/api/analyze' && req.method === 'POST') {
    const apiKey = process.env.OPENROUTER_API_KEY
    if (apiKey === undefined || apiKey === '') {
      res.writeHead(500, { 'Content-Type': 'application/json' })
      res.end(
        JSON.stringify({
          success: false,
          error: 'OPENROUTER_API_KEY is not configured. Create a .env file with your key.',
        }),
      )
      return
    }

    let body = ''
    req.on('data', (chunk) => {
      body += chunk
    })
    req.on('end', async () => {
      try {
        const input = JSON.parse(body)

        const safeStringify = (obj) => {
          try {
            return JSON.stringify(obj)
          } catch {
            return '{}'
          }
        }

        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
          },
          body: safeStringify({
            model: 'google/gemini-2.5-flash-lite',
            response_format: { type: 'json_object' },
            temperature: 0.2,
            max_tokens: 3000,
            messages: [
              {
                role: 'system',
                content:
                  'You are a senior site reliability engineer conducting a root cause analysis. Analyze the incident data and return structured JSON only.',
              },
              {
                role: 'user',
                content: `Incident ID: ${input.incidentId}
Service: ${input.service}
Severity: ${input.severity}
Summary: ${input.summary}
Alert Signal: ${input.signal}

Enterprise Data (JSON):
${typeof input.enterpriseData === 'string' ? input.enterpriseData : safeStringify(input.enterpriseData)}

Analyze this incident and provide a complete root cause analysis.`,
              },
            ],
          }),
        })

        if (!response.ok) {
          const text = await response.text()
          throw new Error(`OpenRouter request failed: ${response.status} ${text}`)
        }

        const json = await response.json()
        const choices = Array.isArray(json?.choices) ? json.choices : []
        const message = choices[0]?.message ?? {}
        const content = typeof message?.content === 'string' ? message.content : undefined
        if (typeof content !== 'string' || content.trim().length === 0) {
          throw new Error('No response from OpenRouter')
        }

        const parsed = JSON.parse(content)
        const normalized = normalizeOpenRouterResult(parsed)
        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ success: true, data: { rootCauseAnalysis: normalized } }))
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error'
        res.writeHead(500, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ success: false, error: message }))
      }
    })
    return
  }

  // Proxy everything else to Vite
  const proxyReq = http.request(
    {
      hostname: 'localhost',
      port: VITE_PORT,
      path: url.pathname + url.search,
      method: req.method,
      headers: req.headers,
    },
    (proxyRes) => {
      res.writeHead(proxyRes.statusCode ?? 500, proxyRes.headers)
      proxyRes.pipe(res)
    },
  )
  req.pipe(proxyReq)
})

server.listen(PORT, () => {
  console.log(`\n  🚀 IncidentIQ Dev Server`)
  console.log(`  ─────────────────────`)
  console.log(`  Local:   http://localhost:${PORT}`)
  console.log(`  API:     http://localhost:${PORT}/api/analyze`)
  console.log(`  Health:  http://localhost:${PORT}/api/health`)
  console.log(`  \n  Make sure OPENROUTER_API_KEY is set in .env file\n`)
})

// Cleanup on exit
process.on('SIGINT', () => {
  vite.kill()
  server.close()
  process.exit(0)
})
