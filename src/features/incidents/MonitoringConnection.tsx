import { CheckCircle2, LoaderCircle, Radio } from 'lucide-react'

import { useIncidentSimulation } from '@/features/incidents/IncidentSimulationProvider'

export function MonitoringConnection(): JSX.Element {
  const { latestScenario, monitoringStatus } = useIncidentSimulation()
  const isConnecting = monitoringStatus === 'connecting'

  return (
    <section className="flex flex-col gap-3 rounded-xl border border-border bg-card px-4 py-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <span
          className={
            isConnecting
              ? 'rounded-full bg-primary/10 p-2 text-primary'
              : 'rounded-full bg-emerald-500/10 p-2 text-emerald-600 dark:text-emerald-400'
          }
        >
          {isConnecting ? (
            <LoaderCircle className="h-4 w-4 animate-spin" />
          ) : (
            <CheckCircle2 className="h-4 w-4" />
          )}
        </span>
        <div>
          <p className="text-sm font-medium">
            {isConnecting ? 'Connecting monitoring systems…' : 'Monitoring systems connected'}
          </p>
          <p className="text-xs text-muted-foreground">
            {isConnecting
              ? 'Authenticating Datadog, Kubernetes, and deployment feeds.'
              : 'Datadog · Kubernetes · GitHub Deployments · Certificate Monitor'}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Radio
          className={
            isConnecting ? 'h-3.5 w-3.5' : 'h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400'
          }
        />
        {latestScenario === null ? 'Awaiting signals' : `Latest signal: ${latestScenario.source}`}
      </div>
    </section>
  )
}
