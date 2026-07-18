import { AlertTriangle, ArrowLeft, Beaker, LoaderCircle, SearchX } from 'lucide-react'
import { useCallback, useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { useIncidentSimulation } from '@/features/incidents/IncidentSimulationProvider'
import { useInvestigation } from '@/features/incidents/InvestigationProvider'
import { InvestigationTimeline } from '@/features/incidents/InvestigationTimeline'
import { RCAResultView } from '@/features/incidents/RCAResultView'

export function IncidentDetailPage(): JSX.Element {
  const { incidentId } = useParams<{ readonly incidentId: string }>()
  const navigate = useNavigate()
  const { incidents } = useIncidentSimulation()
  const { getInvestigation, startInvestigation } = useInvestigation()

  const incident = useMemo(
    () => incidents.find((i) => i.id === incidentId),
    [incidents, incidentId],
  )

  const investigation = useMemo(
    () => (incidentId !== undefined ? getInvestigation(incidentId) : undefined),
    [getInvestigation, incidentId],
  )

  const handleAnalyze = useCallback((): void => {
    if (incident !== undefined) {
      void startInvestigation(incident)
    }
  }, [incident, startInvestigation])

  const handleBack = useCallback((): void => {
    void navigate('/incidents')
  }, [navigate])

  if (incident === undefined || incidentId === undefined) {
    return (
      <div className="space-y-6">
        <Button onClick={handleBack} size="sm" variant="ghost">
          <ArrowLeft className="h-4 w-4" />
          Back to incidents
        </Button>
        <EmptyState
          description="The incident you are looking for does not exist or has been removed."
          icon={SearchX}
          title="Incident not found"
        />
      </div>
    )
  }

  const isInvestigating = investigation?.status === 'investigating'
  const isCompleted = investigation?.status === 'completed'
  const isFailed = investigation?.status === 'failed'
  const isIdle = investigation === undefined || investigation.status === 'idle'

  return (
    <div className="space-y-6">
      {/* Back button */}
      <Button onClick={handleBack} size="sm" variant="ghost">
        <ArrowLeft className="h-4 w-4" />
        Back to incidents
      </Button>

      {/* Incident header */}
      <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-3">
              <p className="font-mono text-xs text-muted-foreground">{incident.id}</p>
              <StatusBadge kind="severity" value={incident.severity} />
              <StatusBadge kind="status" value={incident.status} />
            </div>
            <h1 className="mt-2 text-xl font-semibold tracking-tight sm:text-2xl">
              {incident.summary}
            </h1>
            <div className="mt-3 flex flex-wrap gap-4 text-sm text-muted-foreground">
              <span>
                Service:{' '}
                <span className="font-mono font-medium text-foreground">{incident.service}</span>
              </span>
              <span>
                Started: <span className="font-medium text-foreground">{incident.startedAt}</span>
              </span>
            </div>
          </div>

          {/* Analyze button */}
          {isIdle ? (
            <Button
              onClick={() => {
                handleAnalyze()
              }}
            >
              <Beaker className="h-4 w-4" />
              Analyze with AI
            </Button>
          ) : null}
          {isCompleted ? (
            <Button
              onClick={() => {
                if (window.confirm('Start a new analysis? This will replace the current result.')) {
                  handleAnalyze()
                }
              }}
              variant="outline"
            >
              <Beaker className="h-4 w-4" />
              Re-analyze
            </Button>
          ) : null}
        </div>
      </div>

      {/* Investigation in progress */}
      {isInvestigating && investigation !== undefined ? (
        <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
          <InvestigationTimeline steps={investigation.steps} />
          <div className="flex items-center justify-center rounded-xl border border-border bg-card p-12">
            <div className="text-center">
              <LoaderCircle className="mx-auto h-8 w-8 animate-spin text-primary" />
              <p className="mt-4 text-sm font-medium text-foreground">
                AI investigation in progress
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Analyzing enterprise data across logs, metrics, deployments, and configuration
                changes.
              </p>
            </div>
          </div>
        </div>
      ) : null}

      {/* Investigation failed */}
      {isFailed && investigation !== undefined ? (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-5">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
            <div>
              <p className="font-semibold text-destructive">Investigation failed</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {investigation.error ?? 'An unknown error occurred during the investigation.'}
              </p>
              <Button className="mt-3" onClick={handleAnalyze} size="sm" variant="outline">
                Retry analysis
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Investigation completed - show RCA */}
      {isCompleted && investigation.result !== null ? (
        <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
          <InvestigationTimeline steps={investigation.steps} />
          <RCAResultView incidentId={incidentId} result={investigation.result} />
        </div>
      ) : null}

      {/* Idle state - no investigation started yet */}
      {isIdle ? (
        <div className="flex items-center justify-center rounded-xl border border-dashed border-border bg-card/40 p-16">
          <div className="max-w-md text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-secondary">
              <Beaker className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="text-base font-semibold">AI investigation ready</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Click <span className="font-medium text-foreground">Analyze with AI</span> to run an
              automated root cause analysis. The engine will collect logs, correlate metrics,
              inspect deployments, analyze configuration changes, and search similar historical
              incidents before generating a comprehensive RCA report.
            </p>
          </div>
        </div>
      ) : null}
    </div>
  )
}
