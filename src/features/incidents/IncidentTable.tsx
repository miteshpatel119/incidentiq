import { ChevronRight, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { EmptyState } from '@/components/ui/EmptyState'
import { StatusBadge } from '@/components/ui/StatusBadge'
import type { Incident } from '@/features/incidents/types'

interface IncidentTableProps {
  readonly incidents: readonly Incident[]
}

export function IncidentTable({ incidents }: IncidentTableProps): JSX.Element {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const results = useMemo(
    () =>
      incidents.filter((incident) =>
        `${incident.id} ${incident.summary} ${incident.service}`
          .toLowerCase()
          .includes(query.trim().toLowerCase()),
      ),
    [incidents, query],
  )

  function handleRowClick(incidentId: string): void {
    void navigate(`/incidents/${incidentId}`)
  }

  return (
    <section className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      <div className="flex flex-col gap-4 border-b border-border p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-semibold">Active incidents</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Monitor open and recently resolved operational events.
          </p>
        </div>
        <label className="relative block">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            aria-label="Search incidents"
            className="h-9 w-full rounded-lg border border-input bg-background pl-9 pr-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 sm:w-64"
            id="incident-search"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search incidents"
            value={query}
          />
        </label>
      </div>
      {results.length === 0 ? (
        <div className="p-5">
          <EmptyState
            description="Try a different incident ID, service name, or keyword."
            icon={Search}
            title="No incidents found"
          />
        </div>
      ) : (
        <>
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full text-left text-sm">
              <thead className="bg-secondary/40 text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-5 py-3 font-medium" scope="col">
                    Incident
                  </th>
                  <th className="px-5 py-3 font-medium" scope="col">
                    Service
                  </th>
                  <th className="px-5 py-3 font-medium" scope="col">
                    Severity
                  </th>
                  <th className="px-5 py-3 font-medium" scope="col">
                    Status
                  </th>
                  <th className="px-5 py-3 font-medium" scope="col">
                    Started
                  </th>
                  <th className="px-5 py-3 font-medium" scope="col">
                    <span className="sr-only">Open incident</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {results.map((incident) => (
                  <tr
                    className="group cursor-pointer transition-colors hover:bg-secondary/30"
                    key={incident.id}
                    onClick={() => handleRowClick(incident.id)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') handleRowClick(incident.id)
                    }}
                    role="button"
                    tabIndex={0}
                  >
                    <td className="max-w-sm px-5 py-4">
                      <p className="font-medium text-foreground">{incident.summary}</p>
                      <p className="mt-1 font-mono text-xs text-muted-foreground">{incident.id}</p>
                    </td>
                    <td className="px-5 py-4 font-mono text-xs text-muted-foreground">
                      {incident.service}
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge kind="severity" value={incident.severity} />
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge kind="status" value={incident.status} />
                    </td>
                    <td className="px-5 py-4 text-muted-foreground">{incident.startedAt}</td>
                    <td className="px-5 py-4">
                      <ChevronRight className="h-4 w-4 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-foreground" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="divide-y divide-border md:hidden">
            {results.map((incident) => (
              <article
                className="cursor-pointer p-4 transition-colors hover:bg-secondary/20"
                key={incident.id}
                onClick={() => handleRowClick(incident.id)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') handleRowClick(incident.id)
                }}
                role="button"
                tabIndex={0}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">{incident.summary}</p>
                    <p className="mt-1 font-mono text-xs text-muted-foreground">
                      {incident.id} · {incident.service}
                    </p>
                  </div>
                  <StatusBadge kind="severity" value={incident.severity} />
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <StatusBadge kind="status" value={incident.status} />
                  <span className="text-xs text-muted-foreground">{incident.startedAt}</span>
                </div>
              </article>
            ))}
          </div>
        </>
      )}
    </section>
  )
}
