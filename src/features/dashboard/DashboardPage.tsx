import { Activity, AlertTriangle, CheckCircle2, Clock3, Plus } from 'lucide-react'
import { useEffect, useState } from 'react'

import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { CreateIncidentForm } from '@/features/incidents/CreateIncidentForm'
import { IncidentTable } from '@/features/incidents/IncidentTable'
import { MonitoringConnection } from '@/features/incidents/MonitoringConnection'
import { useIncidentSimulation } from '@/features/incidents/IncidentSimulationProvider'

function DashboardSkeleton(): JSX.Element {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-24 rounded-xl bg-secondary" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <div className="h-36 rounded-xl bg-secondary" key={index} />
        ))}
      </div>
      <div className="h-96 rounded-xl bg-secondary" />
    </div>
  )
}

export function DashboardPage(): JSX.Element {
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const { incidents, latestScenario, createIncident } = useIncidentSimulation()

  useEffect(() => {
    const timer = window.setTimeout(() => setIsLoading(false), 450)
    return () => window.clearTimeout(timer)
  }, [])

  if (isLoading) return <DashboardSkeleton />
  const openIncidents = incidents.filter((incident) => incident.status !== 'resolved')
  const criticalIncidents = incidents.filter((incident) => incident.severity === 'critical')
  const overview = [
    {
      label: 'Open incidents',
      value: String(openIncidents.length),
      note: `${criticalIncidents.length} critical signal${criticalIncidents.length === 1 ? '' : 's'} detected`,
      icon: AlertTriangle,
      tone: 'text-orange-300 bg-orange-500/10',
    },
    {
      label: 'Critical impact',
      value: String(criticalIncidents.length),
      note: criticalIncidents[0]?.service ?? 'No critical services',
      icon: Activity,
      tone: 'text-rose-300 bg-rose-500/10',
    },
    {
      label: 'Mean time to resolve',
      value: '42m',
      note: '18% faster this week',
      icon: Clock3,
      tone: 'text-sky-300 bg-sky-500/10',
    },
    {
      label: 'Resolved this week',
      value: '14',
      note: '93% within target',
      icon: CheckCircle2,
      tone: 'text-emerald-300 bg-emerald-500/10',
    },
  ] as const
  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">INCIDENT COMMAND CENTER</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
            Greetings of the day, Namaste Judges.
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Here is the current reliability picture across your services.
          </p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="h-4 w-4" />
          Create incident
        </Button>
      </header>
      <MonitoringConnection />
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create incident">
        <CreateIncidentForm
          onSubmit={(data) => {
            createIncident(data)
            setIsModalOpen(false)
          }}
          onCancel={() => setIsModalOpen(false)}
        />
      </Modal>
      {latestScenario !== null ? (
        <div className="rounded-xl border border-primary/30 bg-primary/10 px-4 py-3 text-sm">
          <span className="font-semibold text-primary">New monitored signal:</span>{' '}
          <span className="font-medium">{latestScenario.summary}</span>
          <span className="ml-2 text-muted-foreground">{latestScenario.signal}</span>
        </div>
      ) : null}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {overview.map(({ icon: Icon, label, note, tone, value }) => (
          <article className="rounded-xl border border-border bg-card p-5 shadow-sm" key={label}>
            <div className="flex items-start justify-between">
              <p className="text-sm font-medium text-muted-foreground">{label}</p>
              <span className={`rounded-lg p-2 ${tone}`}>
                <Icon className="h-4 w-4" />
              </span>
            </div>
            <p className="mt-5 text-3xl font-semibold tracking-tight">{value}</p>
            <p className="mt-2 text-xs text-muted-foreground">{note}</p>
          </article>
        ))}
      </section>
      <IncidentTable incidents={incidents} />
    </div>
  )
}
