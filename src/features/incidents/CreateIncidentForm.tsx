import { useState } from 'react'
import { AlertCircle } from 'lucide-react'

import { Button } from '@/components/ui/Button'
import type { IncidentSeverity, IncidentStatus } from '@/features/incidents/types'

interface CreateIncidentFormProps {
  readonly onSubmit: (data: {
    service: string
    severity: IncidentSeverity
    status: IncidentStatus
    summary: string
  }) => void
  readonly onCancel: () => void
}

const severities: IncidentSeverity[] = ['critical', 'high', 'medium', 'low']
const statuses: IncidentStatus[] = ['investigating', 'mitigated', 'resolved']

export function CreateIncidentForm({ onSubmit, onCancel }: CreateIncidentFormProps): JSX.Element {
  const [service, setService] = useState('')
  const [severity, setSeverity] = useState<IncidentSeverity>('medium')
  const [status, setStatus] = useState<IncidentStatus>('investigating')
  const [summary, setSummary] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  function validateForm(): boolean {
    const newErrors: Record<string, string> = {}

    if (!service.trim()) {
      newErrors.service = 'Service is required'
    }
    if (!summary.trim()) {
      newErrors.summary = 'Summary is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  function handleSubmit(event: React.FormEvent): void {
    event.preventDefault()
    if (validateForm()) {
      onSubmit({
        service: service.trim(),
        severity,
        status,
        summary: summary.trim(),
      })
    }
  }

  function handleKeyDown(event: React.KeyboardEvent): void {
    if (event.key === 'Escape') {
      onCancel()
    }
  }

  return (
    <form onSubmit={handleSubmit} onKeyDown={handleKeyDown} className="space-y-4">
      <div>
        <label className="mb-1.5 block text-sm font-medium" htmlFor="service">
          Service <span className="text-destructive">*</span>
        </label>
        <input
          id="service"
          type="text"
          value={service}
          onChange={(e) => setService(e.target.value)}
          placeholder="e.g., orders-api, payments-api"
          className={`w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-primary/20 ${
            errors.service ? 'border-destructive' : 'border-input'
          }`}
          autoFocus
        />
        {errors.service && (
          <p className="mt-1 flex items-center gap-1 text-xs text-destructive">
            <AlertCircle className="h-3 w-3" />
            {errors.service}
          </p>
        )}
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium" htmlFor="severity">
          Severity
        </label>
        <select
          id="severity"
          value={severity}
          onChange={(e) => setSeverity(e.target.value as IncidentSeverity)}
          className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-primary/20"
        >
          {severities.map((s) => (
            <option key={s} value={s}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium" htmlFor="status">
          Status
        </label>
        <select
          id="status"
          value={status}
          onChange={(e) => setStatus(e.target.value as IncidentStatus)}
          className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-primary/20"
        >
          {statuses.map((s) => (
            <option key={s} value={s}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium" htmlFor="summary">
          Summary <span className="text-destructive">*</span>
        </label>
        <textarea
          id="summary"
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          placeholder="Brief description of the incident"
          rows={3}
          className={`w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-primary/20 ${
            errors.summary ? 'border-destructive' : 'border-input'
          }`}
        />
        {errors.summary && (
          <p className="mt-1 flex items-center gap-1 text-xs text-destructive">
            <AlertCircle className="h-3 w-3" />
            {errors.summary}
          </p>
        )}
      </div>

      <div className="flex gap-3 pt-2">
        <Button type="submit" variant="primary">
          Create incident
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  )
}
