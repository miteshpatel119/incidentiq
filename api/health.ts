import type { VercelRequest, VercelResponse } from '@vercel/node'

interface HealthResponse {
  readonly success: true
  readonly data: {
    readonly status: 'ok'
    readonly timestamp: string
  }
}

export default function handler(_request: VercelRequest, response: VercelResponse): void {
  const payload: HealthResponse = {
    success: true,
    data: {
      status: 'ok',
      timestamp: new Date().toISOString(),
    },
  }

  response.status(200).json(payload)
}
