import type {
  RCAResult,
  TimelineEvent,
  EvidenceItem,
  CodeFixSuggestion,
  ConfigFixSuggestion,
} from '@/features/incidents/investigationTypes'
import type { EnterpriseIncidentProfile } from '@/features/incidents/mockEnterpriseData'

function generateTimeline(profile: EnterpriseIncidentProfile): readonly TimelineEvent[] {
  const timeline: TimelineEvent[] = []

  // Add deployment events
  for (const dep of profile.deploymentHistory) {
    timeline.push({
      timestamp: dep.timestamp,
      event: `Deployment: ${dep.version}`,
      detail: dep.change,
      type: 'change',
    })
  }

  // Add config changes
  for (const cfg of profile.configurationChanges) {
    timeline.push({
      timestamp: cfg.timestamp,
      event: `Config change: ${cfg.key}`,
      detail: `${cfg.before} → ${cfg.after} (${cfg.changeRequest})`,
      type: 'change',
    })
  }

  // Add kubernetes events
  for (const k8s of profile.kubernetesEvents) {
    timeline.push({
      timestamp: k8s.timestamp,
      event: `K8s ${k8s.reason}: ${k8s.resource}`,
      detail: k8s.message,
      type: k8s.reason === 'OOMKilled' || k8s.reason === 'Unhealthy' ? 'error' : 'warning',
    })
  }

  // Add application errors
  for (const log of profile.applicationLogs) {
    timeline.push({
      timestamp: log.timestamp,
      event: `[${log.level}] ${log.service}`,
      detail: log.message,
      type: log.level === 'ERROR' ? 'error' : log.level === 'WARN' ? 'warning' : 'info',
    })
  }

  // Add server logs
  for (const log of profile.serverLogs) {
    timeline.push({
      timestamp: log.timestamp,
      event: `Server: ${log.host}`,
      detail: log.message,
      type: log.message.includes('FATAL') || log.message.includes('OOM') ? 'error' : 'warning',
    })
  }

  // Sort by timestamp
  timeline.sort((a, b) => a.timestamp.localeCompare(b.timestamp))

  return timeline
}

function generateEvidence(profile: EnterpriseIncidentProfile): readonly EvidenceItem[] {
  const evidence: EvidenceItem[] = []

  // Critical evidence from config changes
  for (const cfg of profile.configurationChanges) {
    evidence.push({
      title: `Configuration change detected: ${cfg.key}`,
      description: `${cfg.key} was changed from "${cfg.before}" to "${cfg.after}" by ${cfg.actor} at ${cfg.timestamp}.`,
      source: 'Configuration Audit Log',
      severity: 'critical',
    })
  }

  // Critical evidence from deployment
  for (const dep of profile.deploymentHistory) {
    evidence.push({
      title: `Recent deployment: ${dep.version}`,
      description: `${dep.service} deployed version ${dep.version} at ${dep.timestamp}: "${dep.change}"`,
      source: 'Deployment Pipeline',
      severity: 'critical',
    })
  }

  // Supporting evidence from metrics
  for (const metric of profile.metrics) {
    evidence.push({
      title: `Metric anomaly: ${metric.name}`,
      description: `${metric.name} spiked from ${metric.baseline}${metric.unit} to ${metric.peak}${metric.unit}.`,
      source: 'Monitoring Dashboard',
      severity: 'supporting',
    })
  }

  // Supporting evidence from logs
  for (const log of profile.applicationLogs.slice(0, 2)) {
    evidence.push({
      title: `Application error: ${log.service}`,
      description: log.message,
      source: `Log stream (trace: ${log.traceId})`,
      severity: 'supporting',
    })
  }

  // Contextual evidence from historical incidents
  for (const hist of profile.historicalIncidents) {
    evidence.push({
      title: `Similar historical incident: ${hist.id}`,
      description: `${hist.summary} — resolved by: ${hist.resolution}`,
      source: 'Incident History',
      severity: 'contextual',
    })
  }

  return evidence
}

function generateCodeFixes(profile: EnterpriseIncidentProfile): readonly CodeFixSuggestion[] {
  return profile.codeSnippets.map((snippet) => ({
    file: snippet.file,
    language: snippet.language,
    before: snippet.content,
    after: snippet.content
      .replace(/config\.(\w+)/g, 'safeConfig.$1')
      .replace(/env\.(\w+)/g, 'safeEnv.$1')
      .replace(/const batchSize = (\d+)/g, 'const batchSize = Math.min($1, 200)'),
    explanation: `Add safety bounds and null checks to prevent ${profile.scenarioKey === 'kubernetes-pod-crash' ? 'memory exhaustion' : 'unexpected failures'}.`,
  }))
}

function generateConfigFixes(profile: EnterpriseIncidentProfile): readonly ConfigFixSuggestion[] {
  return profile.configurationChanges.map((cfg) => ({
    key: cfg.key,
    before: cfg.before,
    after: cfg.before,
    explanation: `Revert ${cfg.key} from "${cfg.after}" back to "${cfg.before}" which was the stable value before the incident.`,
  }))
}

function generateCommands(profile: EnterpriseIncidentProfile): readonly string[] {
  const commands: string[] = []

  const firstK8s = profile.kubernetesEvents[0]
  const namespace = firstK8s?.namespace ?? 'default'
  const resourcePrefix = firstK8s?.resource.split('-')[0] ?? 'service'

  if (profile.kubernetesEvents.length > 0) {
    commands.push(`kubectl rollout status deployment/${resourcePrefix} -n ${namespace}`)
    commands.push(`kubectl describe pod -n ${namespace} -l app=${resourcePrefix}`)
  }

  commands.push(`kubectl logs -n ${namespace} deployment/${resourcePrefix} --tail=100`)
  commands.push(`kubectl get events -n ${namespace} --sort-by='.lastTimestamp'`)

  return commands
}

export function generateMockRCAResult(
  incidentId: string,
  profile: EnterpriseIncidentProfile,
): RCAResult {
  const timeline = generateTimeline(profile)
  const evidence = generateEvidence(profile)
  const codeFixes = generateCodeFixes(profile)
  const configFixes = generateConfigFixes(profile)
  const commands = generateCommands(profile)

  const rootCauseMap: Record<string, string> = {
    'database-primary-unavailable':
      'Database connection pool exhausted after DB_POOL_MAX was increased from 40 to 80, causing all connections to be consumed and the primary to become unresponsive.',
    'payments-api-timeout':
      'Gateway timeout reduced from 8000ms to 5000ms combined with network retransmit issues caused payment authorization requests to exceed the new lower timeout threshold.',
    'kubernetes-pod-crash':
      'Reconciliation batch size increased from 200 to 1000 caused the checkout worker to exceed its 1024Mi memory limit, resulting in OOMKilled pod crashes.',
    'deployment-regression':
      'Regional price enrichment feature deployed without null safety checks for missing regional price records, causing "Cannot read properties of undefined" errors.',
    'ssl-certificate-expiry':
      'DNS validation credentials for certificate renewal were removed during a secret rotation (CHG-8788), preventing automated certificate renewal.',
    'configuration-change':
      'Feature flag enforce_mfa_for_partners was enabled by deployment automation, forcing MFA challenges for SAML-only partner integrations that do not support MFA.',
    'message-queue-backlog':
      'Inventory enrichment concurrency increased from 20 to 80 overwhelmed the downstream inventory API, causing throttling and a backlog of 184,000 order events.',
  }

  const summaryMap: Record<string, string> = {
    'database-primary-unavailable':
      'A configuration change increased the database pool max from 40 to 80 connections, but the orders-api pods were not restarted to pick up the new limit. Combined with a memory pressure event on the database host, this caused connection exhaustion and a complete service outage.',
    'payments-api-timeout':
      'A deployment reduced the gateway timeout from 8s to 5s to align with retry budgets, but network retransmit issues in eu-west-1 caused legitimate requests to exceed the new timeout, resulting in failed payment authorizations.',
    'kubernetes-pod-crash':
      'A deployment increased the reconciliation batch size from 200 to 1000 records to handle month-end volume, but this caused the worker process to exceed its 1024Mi memory limit, triggering OOM kills and CrashLoopBackOff.',
    'deployment-regression':
      'The regional price enrichment feature was deployed without handling the case where regionalPrice is undefined for items not yet configured with regional pricing, causing 5xx errors on catalog reads.',
    'ssl-certificate-expiry':
      'A routine secret rotation removed the DNS provider credentials needed for automated certificate renewal, leaving the API certificate to expire without remediation.',
    'configuration-change':
      'A new default MFA policy for partner tenants was enabled via feature flag, but SAML-only partners without MFA enrollment were unable to complete authentication.',
    'message-queue-backlog':
      'Inventory enrichment concurrency was increased from 20 to 80 to speed up processing, but this caused the downstream inventory API to throttle requests, creating a massive consumer backlog.',
  }

  const rootCause =
    rootCauseMap[profile.scenarioKey] ??
    'Multiple contributing factors identified during investigation.'
  const summary =
    summaryMap[profile.scenarioKey] ??
    'Analysis of logs, metrics, and configuration changes revealed a complex failure scenario.'

  return {
    rootCause,
    confidenceScore: 87,
    summary,
    evidence,
    timeline,
    businessImpact: profile.businessImpact,
    technicalImpact: `Service ${profile.timeWindow.environment} in ${profile.timeWindow.region} experienced degraded performance. Infrastructure metrics showed CPU at ${profile.infrastructure.cpuPercent}%, memory at ${profile.infrastructure.memoryPercent}%, and disk at ${profile.infrastructure.diskPercent}%.`,
    remediation:
      '1. Roll back the most recent configuration change\n2. Restart affected services to clear any stuck state\n3. Verify service health through monitoring dashboards\n4. Apply code fixes to prevent recurrence\n5. Update runbooks with incident details',
    verificationSteps: [
      'Verify service health endpoints return 200 OK',
      'Confirm error rates return to baseline levels',
      'Check that all pods are in Running state with ready probes passing',
      'Validate that affected customers can complete their workflows',
      'Monitor metrics for 15 minutes to confirm stability',
    ],
    preventiveActions: [
      'Add automated canary analysis for configuration changes',
      'Implement progressive rollout with automatic rollback',
      'Add null safety checks and input validation for new features',
      'Increase monitoring coverage for the affected service',
      'Update deployment runbooks with rollback procedures',
      'Add integration tests covering the failure scenario',
    ],
    codeFixes,
    configFixes,
    recommendedCommands: commands,
    postIncidentReport: `## Post-Incident Report: ${incidentId}\n\n### What happened\n${summary}\n\n### Root cause\n${rootCause}\n\n### Impact\n${profile.businessImpact.customersAffected} were affected with ${profile.businessImpact.revenueAtRisk} at risk. ${profile.businessImpact.sla}\n\n### Timeline\nKey events leading to the incident have been reconstructed from logs, metrics, and deployment records.\n\n### Action items\n1. Apply configuration reverts and code fixes\n2. Verify service health\n3. Schedule post-mortem with the engineering team\n4. Update monitoring alerts for earlier detection\n5. Add runbook entries for this failure mode`,
  }
}
