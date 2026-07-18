import { cn } from '@/lib/utils'

type Status = 'investigating' | 'mitigated' | 'resolved'
type Severity = 'critical' | 'high' | 'medium' | 'low'

const statusClasses: Record<Status, string> = {
  investigating: 'bg-amber-500/15 text-amber-300 ring-amber-500/30',
  mitigated: 'bg-sky-500/15 text-sky-300 ring-sky-500/30',
  resolved: 'bg-emerald-500/15 text-emerald-300 ring-emerald-500/30',
}

const severityClasses: Record<Severity, string> = {
  critical: 'bg-rose-500/15 text-rose-300 ring-rose-500/30',
  high: 'bg-orange-500/15 text-orange-300 ring-orange-500/30',
  medium: 'bg-yellow-500/15 text-yellow-300 ring-yellow-500/30',
  low: 'bg-slate-400/15 text-slate-300 ring-slate-400/30',
}

interface StatusBadgeProps {
  readonly kind: 'status' | 'severity'
  readonly value: Status | Severity
}

export function StatusBadge({ kind, value }: StatusBadgeProps): JSX.Element {
  const classes =
    kind === 'status' ? statusClasses[value as Status] : severityClasses[value as Severity]

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md px-2 py-1 text-xs font-medium capitalize ring-1 ring-inset',
        classes,
      )}
    >
      {value}
    </span>
  )
}
