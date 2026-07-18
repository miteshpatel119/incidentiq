import type { Incident } from '@/features/incidents/types'

const MIN = 60_000
const HOUR = 3_600_000

export const mockIncidents: readonly Incident[] = [
  {
    id: 'INC-1048',
    scenarioKey: 'database-primary-unavailable',
    summary: 'Primary database connection failures detected',
    service: 'orders-api',
    severity: 'critical',
    status: 'investigating',
    startedAt: '12 min ago',
    createdAt: Date.now() - 12 * MIN,
  },
  {
    id: 'INC-1047',
    scenarioKey: 'payments-api-timeout',
    summary: 'Payment authorization requests exceeding latency SLO',
    service: 'payments-api',
    severity: 'high',
    status: 'mitigated',
    startedAt: '48 min ago',
    createdAt: Date.now() - 48 * MIN,
  },
  {
    id: 'INC-1046',
    scenarioKey: 'message-queue-backlog',
    summary: 'Order event processing backlog above operating threshold',
    service: 'event-worker',
    severity: 'high',
    status: 'investigating',
    startedAt: '2 hr ago',
    createdAt: Date.now() - 2 * HOUR,
  },
  {
    id: 'INC-1045',
    scenarioKey: 'ssl-certificate-expiry',
    summary: 'Public API TLS certificate expires within 72 hours',
    service: 'edge-gateway',
    severity: 'medium',
    status: 'resolved',
    startedAt: 'Yesterday',
    createdAt: Date.now() - 24 * HOUR,
  },
  {
    id: 'INC-1044',
    scenarioKey: 'configuration-change',
    summary: 'Feature flag configuration changed in production',
    service: 'identity-api',
    severity: 'low',
    status: 'resolved',
    startedAt: 'Yesterday',
    createdAt: Date.now() - 30 * HOUR,
  },
]
